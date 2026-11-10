from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from ..database import get_db
from ..models_db import ParkingSlot, Reservation
from ..schemas import SlotResponse, ReservationInfo

router = APIRouter(prefix="/slots", tags=["Parking Slots"])

@router.get("/{location_id}", response_model=List[SlotResponse])
def get_slots_by_location(location_id: str, db: Session = Depends(get_db)):
    slots = db.query(ParkingSlot).filter(ParkingSlot.location_id == location_id).all()
    if not slots:
        # If no slots found for this location, return empty list
        return []

    slot_responses = []
    for s in slots:
        # Check active reservation
        curr_res = None
        if s.status == "Reserved":
            res = db.query(Reservation).filter(
                Reservation.slot_id == s.id,
                Reservation.status == "Active"
            ).order_by(Reservation.created_at.desc()).first()
            if res:
                curr_res = ReservationInfo(
                    id=res.id,
                    reservation_code=res.reservation_code,
                    customer_name=res.customer_name,
                    vehicle_number=res.vehicle_number,
                    start_time=res.start_time,
                    end_time=res.end_time,
                    status=res.status
                )

        slot_responses.append(
            SlotResponse(
                id=s.id,
                location_id=s.location_id,
                slot_number=s.slot_number,
                floor=s.floor,
                zone=s.zone,
                slot_type=s.slot_type,
                status=s.status,
                last_status_change=s.last_status_change,
                current_reservation=curr_res
            )
        )

    return slot_responses

@router.get("/slot/{slot_id}", response_model=SlotResponse)
def get_single_slot(slot_id: int, db: Session = Depends(get_db)):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    curr_res = None
    if slot.status == "Reserved":
        res = db.query(Reservation).filter(
            Reservation.slot_id == slot.id,
            Reservation.status == "Active"
        ).order_by(Reservation.created_at.desc()).first()
        if res:
            curr_res = ReservationInfo(
                id=res.id,
                reservation_code=res.reservation_code,
                customer_name=res.customer_name,
                vehicle_number=res.vehicle_number,
                start_time=res.start_time,
                end_time=res.end_time,
                status=res.status
            )

    return SlotResponse(
        id=slot.id,
        location_id=slot.location_id,
        slot_number=slot.slot_number,
        floor=slot.floor,
        zone=slot.zone,
        slot_type=slot.slot_type,
        status=slot.status,
        last_status_change=slot.last_status_change,
        current_reservation=curr_res
    )
