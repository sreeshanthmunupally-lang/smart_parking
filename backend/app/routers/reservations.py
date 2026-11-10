import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List

from ..database import get_db
from ..models_db import ParkingSlot, Reservation, Location
from ..schemas import ReservationCreate, ReservationResponse

router = APIRouter(prefix="/reservations", tags=["Reservation Simulation"])

@router.get("", response_model=List[ReservationResponse])
def get_all_reservations(db: Session = Depends(get_db)):
    reservations = db.query(Reservation).order_by(Reservation.created_at.desc()).all()
    
    result = []
    for r in reservations:
        slot = db.query(ParkingSlot).filter(ParkingSlot.id == r.slot_id).first()
        loc = db.query(Location).filter(Location.location_id == r.location_id).first()
        slot_number = slot.slot_number if slot else "N/A"
        loc_name = loc.name if loc else "N/A"

        result.append(
            ReservationResponse(
                id=r.id,
                reservation_code=r.reservation_code,
                slot_id=r.slot_id,
                slot_number=slot_number,
                location_id=r.location_id,
                location_name=loc_name,
                customer_name=r.customer_name,
                vehicle_number=r.vehicle_number,
                phone=r.phone,
                email=r.email,
                start_time=r.start_time,
                end_time=r.end_time,
                status=r.status,
                created_at=r.created_at
            )
        )
    return result

@router.post("", response_model=ReservationResponse)
def create_reservation(payload: ReservationCreate, db: Session = Depends(get_db)):
    # Find slot
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == payload.slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Parking slot not found.")

    if slot.status != "Available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Slot {slot.slot_number} is currently {slot.status} and cannot be reserved."
        )

    # Check location
    loc = db.query(Location).filter(Location.location_id == payload.location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found.")

    # Create simulated reservation
    code = f"SP-{random.randint(100000, 999999)}"
    now = datetime.utcnow()
    duration = payload.duration_hours or 2
    end_time = now + timedelta(hours=duration)

    reservation = Reservation(
        reservation_code=code,
        slot_id=slot.id,
        location_id=slot.location_id,
        customer_name=payload.customer_name.strip(),
        vehicle_number=payload.vehicle_number.strip().upper(),
        phone=payload.phone,
        email=payload.email,
        start_time=now,
        end_time=end_time,
        status="Active"
    )
    db.add(reservation)

    # Update slot status to Reserved
    slot.status = "Reserved"
    slot.last_status_change = now

    db.commit()
    db.refresh(reservation)

    return ReservationResponse(
        id=reservation.id,
        reservation_code=reservation.reservation_code,
        slot_id=slot.id,
        slot_number=slot.slot_number,
        location_id=loc.location_id,
        location_name=loc.name,
        customer_name=reservation.customer_name,
        vehicle_number=reservation.vehicle_number,
        phone=reservation.phone,
        email=reservation.email,
        start_time=reservation.start_time,
        end_time=reservation.end_time,
        status=reservation.status,
        created_at=reservation.created_at
    )

@router.delete("/{reservation_id}", response_model=ReservationResponse)
def cancel_reservation(reservation_id: int, db: Session = Depends(get_db)):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found.")

    if reservation.status == "Cancelled":
        raise HTTPException(status_code=400, detail="Reservation is already cancelled.")

    reservation.status = "Cancelled"
    
    # Revert slot status to Available
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == reservation.slot_id).first()
    if slot:
        slot.status = "Available"
        slot.last_status_change = datetime.utcnow()

    loc = db.query(Location).filter(Location.location_id == reservation.location_id).first()
    slot_number = slot.slot_number if slot else "N/A"
    loc_name = loc.name if loc else "N/A"

    db.commit()
    db.refresh(reservation)

    return ReservationResponse(
        id=reservation.id,
        reservation_code=reservation.reservation_code,
        slot_id=reservation.slot_id,
        slot_number=slot_number,
        location_id=reservation.location_id,
        location_name=loc_name,
        customer_name=reservation.customer_name,
        vehicle_number=reservation.vehicle_number,
        phone=reservation.phone,
        email=reservation.email,
        start_time=reservation.start_time,
        end_time=reservation.end_time,
        status=reservation.status,
        created_at=reservation.created_at
    )
