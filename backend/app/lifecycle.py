from datetime import datetime
from sqlalchemy.orm import Session
from .models_db import Reservation, ParkingSlot

def sync_reservation_lifecycle(db: Session):
    """
    Scans active reservations and updates statuses based on real timestamps.
    Automatically marks expired/ended reservations as COMPLETED and frees their slots.
    Never allows cancelled or completed reservations to hold a slot indefinitely.
    """
    now = datetime.utcnow()

    # 1. Complete reservations whose end_time has passed
    ended_reservations = db.query(Reservation).filter(
        Reservation.status == "CONFIRMED",
        Reservation.end_time <= now
    ).all()

    for res in ended_reservations:
        res.status = "COMPLETED"
        # Release parking slot if still marked Reserved
        slot = db.query(ParkingSlot).filter(ParkingSlot.id == res.slot_id).first()
        if slot and slot.status == "Reserved":
            # Check if another active reservation is immediately scheduled
            upcoming = db.query(Reservation).filter(
                Reservation.slot_id == slot.id,
                Reservation.status == "CONFIRMED",
                Reservation.start_time <= now,
                Reservation.end_time > now
            ).first()
            if not upcoming:
                slot.status = "Available"
                slot.last_status_change = now

    # 2. Release slots for any CANCELLED, COMPLETED, or EXPIRED reservations that might still mark a slot as Reserved
    stale_reserved_slots = db.query(ParkingSlot).filter(ParkingSlot.status == "Reserved").all()
    for s in stale_reserved_slots:
        active_booking = db.query(Reservation).filter(
            Reservation.slot_id == s.id,
            Reservation.status == "CONFIRMED",
            Reservation.end_time > now
        ).first()
        if not active_booking:
            s.status = "Available"
            s.last_status_change = now

    db.commit()

def check_slot_conflict(
    db: Session,
    slot_id: int,
    start_time: datetime,
    end_time: datetime,
    exclude_reservation_id: int = None
) -> bool:
    """
    Prevents two customers from reserving the same slot for overlapping time periods.
    Returns True if a conflicting active reservation exists.
    """
    query = db.query(Reservation).filter(
        Reservation.slot_id == slot_id,
        Reservation.status == "CONFIRMED",
        Reservation.end_time > start_time,
        Reservation.start_time < end_time
    )
    if exclude_reservation_id:
        query = query.filter(Reservation.id != exclude_reservation_id)
        
    conflicting = query.first()
    return conflicting is not None
