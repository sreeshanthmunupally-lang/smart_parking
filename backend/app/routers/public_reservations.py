import re
import secrets
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models_db import Location, ParkingSlot, Reservation, AdminNotification
from ..schemas import (
    PublicReservationCreate,
    PublicReservationResponse,
    PublicLookupRequest,
    PublicCancelRequest,
    PublicSlotResponse
)
from ..lifecycle import sync_reservation_lifecycle, check_slot_conflict

router = APIRouter(prefix="/public", tags=["Public Reservations"])

def mask_phone(phone: str) -> str:
    cleaned = re.sub(r"\D", "", phone)
    if len(cleaned) >= 4:
        return f"***-***-{cleaned[-4:]}"
    return "***-***-****"

def normalize_digits(text: str) -> str:
    return re.sub(r"\D", "", text)

def build_public_response(res: Reservation, slot: ParkingSlot, loc: Location) -> PublicReservationResponse:
    now = datetime.utcnow()
    can_cancel = (res.status == "CONFIRMED" and res.start_time > now)
    
    return PublicReservationResponse(
        booking_reference=res.reservation_code,
        customer_name=res.customer_name,
        customer_phone_masked=mask_phone(res.customer_phone),
        vehicle_number=res.vehicle_number,
        location_id=loc.location_id,
        location_name=loc.name,
        slot_id=slot.id,
        slot_number=slot.slot_number,
        floor=slot.floor,
        zone=slot.zone,
        slot_type=slot.slot_type,
        arrival_time=res.start_time,
        end_time=res.end_time,
        duration_hours=res.duration_hours,
        status=res.status,
        total_price=res.total_price,
        created_at=res.created_at,
        can_cancel=can_cancel
    )

@router.get("/slots/{location_id}", response_model=List[PublicSlotResponse])
def get_public_slots(location_id: str, db: Session = Depends(get_db)):
    """
    Public bay layout view. Returns slot geometry and status.
    Strictly protects privacy: does NOT expose any customer personal information.
    """
    sync_reservation_lifecycle(db)
    slots = db.query(ParkingSlot).filter(ParkingSlot.location_id == location_id).all()
    return slots

@router.post("/reservations", response_model=PublicReservationResponse)
def create_public_reservation(payload: PublicReservationCreate, db: Session = Depends(get_db)):
    """
    Creates a new public customer reservation with concurrency protection.
    Updates SQLite database, reserves slot, and dispatches notification to admin dashboard.
    """
    sync_reservation_lifecycle(db)

    # 1. Validate Location
    loc = db.query(Location).filter(Location.location_id == payload.location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Selected parking location does not exist.")

    # 2. Validate Slot
    slot = db.query(ParkingSlot).filter(
        ParkingSlot.id == payload.slot_id,
        ParkingSlot.location_id == payload.location_id
    ).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Selected parking bay does not exist at this facility.")

    # 3. Parse and Validate Timestamps
    try:
        start_time = datetime.strptime(f"{payload.arrival_date} {payload.arrival_time}", "%Y-%m-%d %H:%M")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid arrival date or time format. Expected YYYY-MM-DD and HH:MM.")

    now = datetime.utcnow()
    if start_time < now - timedelta(minutes=20):
        raise HTTPException(status_code=400, detail="Arrival time cannot be in the past.")

    duration = max(1, min(48, payload.duration_hours))
    end_time = start_time + timedelta(hours=duration)

    # 4. Concurrency & Overlap Conflict Check
    if check_slot_conflict(db, slot.id, start_time, end_time):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Bay {slot.slot_number} is already reserved for the selected arrival window. Please select another vacant bay or modify your time."
        )

    # 5. Generate Unique Booking Reference
    date_code = start_time.strftime("%Y%m%d")
    unique_suffix = secrets.token_hex(2).upper()
    booking_reference = f"SPK-{date_code}-{unique_suffix}"

    total_price = round(loc.hourly_rate * duration, 2)

    # 6. Atomic Transaction
    reservation = Reservation(
        reservation_code=booking_reference,
        slot_id=slot.id,
        location_id=loc.location_id,
        customer_name=payload.customer_name.strip(),
        customer_phone=payload.customer_phone.strip(),
        customer_email=payload.customer_email.strip() if payload.customer_email else None,
        vehicle_number=payload.vehicle_number.strip().upper(),
        start_time=start_time,
        duration_hours=duration,
        end_time=end_time,
        status="CONFIRMED",
        total_price=total_price,
        created_at=now
    )
    db.add(reservation)

    # Mark slot reserved
    slot.status = "Reserved"
    slot.last_status_change = now

    # Dispatch Admin Notification
    notification = AdminNotification(
        title="New Public Reservation",
        message=f"{reservation.customer_name} reserved Bay {slot.slot_number} ({loc.name})",
        booking_reference=booking_reference,
        customer_name=reservation.customer_name,
        location_name=loc.name,
        slot_number=slot.slot_number,
        arrival_time=start_time,
        is_read=False,
        created_at=now
    )
    db.add(notification)

    db.commit()
    db.refresh(reservation)

    return build_public_response(reservation, slot, loc)

@router.post("/reservations/lookup", response_model=PublicReservationResponse)
def lookup_public_reservation(payload: PublicLookupRequest, db: Session = Depends(get_db)):
    """
    Public customer booking lookup.
    Requires booking reference AND verification phone number to prevent unauthorized exposure.
    """
    sync_reservation_lifecycle(db)

    ref = payload.booking_reference.strip().upper()
    res = db.query(Reservation).filter(Reservation.reservation_code == ref).first()
    if not res:
        raise HTTPException(status_code=404, detail="No booking found matching reference and phone number.")

    # Verify phone number match
    input_digits = normalize_digits(payload.phone_number)
    record_digits = normalize_digits(res.customer_phone)

    if not (input_digits == record_digits or record_digits.endswith(input_digits) or input_digits.endswith(record_digits)):
        raise HTTPException(status_code=404, detail="No booking found matching reference and phone number.")

    slot = db.query(ParkingSlot).filter(ParkingSlot.id == res.slot_id).first()
    loc = db.query(Location).filter(Location.location_id == res.location_id).first()

    return build_public_response(res, slot, loc)

@router.post("/reservations/cancel", response_model=PublicReservationResponse)
def cancel_public_reservation(payload: PublicCancelRequest, db: Session = Depends(get_db)):
    """
    Allows a customer to cancel their own active reservation.
    Releases the parking bay immediately back to Available status.
    """
    sync_reservation_lifecycle(db)

    ref = payload.booking_reference.strip().upper()
    res = db.query(Reservation).filter(Reservation.reservation_code == ref).first()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found.")

    # Verify phone number match
    input_digits = normalize_digits(payload.phone_number)
    record_digits = normalize_digits(res.customer_phone)

    if not (input_digits == record_digits or record_digits.endswith(input_digits) or input_digits.endswith(record_digits)):
        raise HTTPException(status_code=403, detail="Verification failed. Phone number does not match booking record.")

    if res.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="This reservation is already cancelled.")

    if res.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Completed past reservations cannot be cancelled.")

    now = datetime.utcnow()
    res.status = "CANCELLED"
    res.cancellation_reason = payload.reason or "Cancelled by customer"

    # Release slot back to Available
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == res.slot_id).first()
    loc = db.query(Location).filter(Location.location_id == res.location_id).first()

    if slot and slot.status == "Reserved":
        # Ensure no other active overlapping booking exists
        other_active = db.query(Reservation).filter(
            Reservation.slot_id == slot.id,
            Reservation.status == "CONFIRMED",
            Reservation.id != res.id,
            Reservation.end_time > now
        ).first()
        if not other_active:
            slot.status = "Available"
            slot.last_status_change = now

    # Dispatch notification for admin
    notification = AdminNotification(
        title="Customer Booking Cancelled",
        message=f"{res.customer_name} cancelled booking {res.reservation_code} ({slot.slot_number if slot else 'N/A'})",
        booking_reference=res.reservation_code,
        customer_name=res.customer_name,
        location_name=loc.name if loc else "N/A",
        slot_number=slot.slot_number if slot else "N/A",
        arrival_time=res.start_time,
        is_read=False,
        created_at=now
    )
    db.add(notification)

    db.commit()
    db.refresh(res)

    return build_public_response(res, slot, loc)
