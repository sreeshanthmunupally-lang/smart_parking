import io
import csv
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc, func

from ..database import get_db
from ..models_db import Location, ParkingSlot, Reservation, AdminUser, AdminNotification
from ..schemas import (
    AdminLoginRequest,
    AdminLoginResponse,
    AdminProfile,
    AdminStatsResponse,
    AdminReservationItem,
    AdminStatusUpdateRequest,
    AdminNotificationResponse
)
from ..auth import (
    verify_password,
    create_access_token,
    get_current_admin
)
from ..lifecycle import sync_reservation_lifecycle

router = APIRouter(prefix="/admin", tags=["Administrator Management"])

# 1. Admin Authentication Endpoints
@router.post("/auth/login", response_model=AdminLoginResponse)
def admin_login(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates administrative user via hashed password and issues JWT bearer token.
    """
    admin = db.query(AdminUser).filter(AdminUser.username == payload.username.strip()).first()
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last login
    admin.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token(data={"sub": admin.username, "role": admin.role})
    return AdminLoginResponse(
        access_token=token,
        token_type="bearer",
        admin=AdminProfile(
            id=admin.id,
            username=admin.username,
            full_name=admin.full_name,
            role=admin.role
        )
    )

@router.get("/auth/me", response_model=AdminProfile)
def get_current_admin_profile(current_admin: AdminUser = Depends(get_current_admin)):
    """
    Returns the authenticated administrator's profile.
    """
    return AdminProfile(
        id=current_admin.id,
        username=current_admin.username,
        full_name=current_admin.full_name,
        role=current_admin.role
    )

# 2. Admin Overview Statistics with Date Range Filters
@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_dashboard_stats(
    period: str = Query("all", pattern="^(all|today|yesterday|7days|30days|custom)$"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Calculates actual statistics strictly from SQLite database records.
    Supports Today, Yesterday, Last 7 Days, Last 30 Days, and Custom Date Range.
    """
    sync_reservation_lifecycle(db)
    now = datetime.utcnow()

    # Determine filter bounds
    filter_start = None
    filter_end = None

    if period == "today":
        filter_start = datetime(now.year, now.month, now.day, 0, 0, 0)
        filter_end = datetime(now.year, now.month, now.day, 23, 59, 59)
    elif period == "yesterday":
        yest = now - timedelta(days=1)
        filter_start = datetime(yest.year, yest.month, yest.day, 0, 0, 0)
        filter_end = datetime(yest.year, yest.month, yest.day, 23, 59, 59)
    elif period == "7days":
        filter_start = now - timedelta(days=7)
        filter_end = now
    elif period == "30days":
        filter_start = now - timedelta(days=30)
        filter_end = now
    elif period == "custom" and start_date and end_date:
        try:
            filter_start = datetime.strptime(start_date, "%Y-%m-%d")
            filter_end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        except ValueError:
            pass

    query = db.query(Reservation)
    if filter_start and filter_end:
        query = query.filter(Reservation.created_at >= filter_start, Reservation.created_at <= filter_end)

    total_reservations = query.count()
    confirmed = query.filter(Reservation.status == "CONFIRMED").count()
    cancelled = query.filter(Reservation.status == "CANCELLED").count()
    completed = query.filter(Reservation.status == "COMPLETED").count()
    
    # Upcoming reservations (confirmed and arrival time is in the future)
    upcoming = query.filter(Reservation.status == "CONFIRMED", Reservation.start_time > now).count()

    # Total registered customer bookings (distinct customer count)
    distinct_customers = query.with_entities(func.count(func.distinct(Reservation.customer_phone))).scalar() or 0

    # Locations count & reserved slots count
    total_locations = db.query(Location).count()
    current_reserved_slots = db.query(ParkingSlot).filter(ParkingSlot.status == "Reserved").count()

    return AdminStatsResponse(
        total_reservations=total_reservations,
        confirmed_reservations=confirmed,
        cancelled_reservations=cancelled,
        upcoming_reservations=upcoming,
        completed_reservations=completed,
        total_customers=distinct_customers,
        total_locations=total_locations,
        current_reserved_slots=current_reserved_slots,
        period=period,
        start_date=start_date,
        end_date=end_date
    )

# 3. Complete Reservation Management Table
@router.get("/reservations", response_model=List[AdminReservationItem])
def get_admin_reservations(
    search: Optional[str] = None,
    location_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    sort_order: str = Query("newest", pattern="^(newest|oldest)$"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Searchable, filterable, and sortable reservation records for authorized administrators.
    """
    sync_reservation_lifecycle(db)

    query = db.query(Reservation)

    # Search filter
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Reservation.reservation_code.ilike(s),
                Reservation.customer_name.ilike(s),
                Reservation.customer_phone.ilike(s),
                Reservation.vehicle_number.ilike(s)
            )
        )

    # Location filter
    if location_id and location_id != "all":
        query = query.filter(Reservation.location_id == location_id)

    # Status filter
    if status_filter and status_filter != "all":
        query = query.filter(Reservation.status == status_filter.upper())

    # Sorting
    if sort_order == "oldest":
        query = query.order_by(asc(Reservation.created_at))
    else:
        query = query.order_by(desc(Reservation.created_at))

    reservations = query.limit(limit).all()

    # Build response items
    items = []
    for r in reservations:
        slot = db.query(ParkingSlot).filter(ParkingSlot.id == r.slot_id).first()
        loc = db.query(Location).filter(Location.location_id == r.location_id).first()

        items.append(
            AdminReservationItem(
                id=r.id,
                booking_reference=r.reservation_code,
                customer_name=r.customer_name,
                customer_phone=r.customer_phone,
                customer_email=r.customer_email,
                vehicle_number=r.vehicle_number,
                location_id=r.location_id,
                location_name=loc.name if loc else r.location_id,
                slot_id=r.slot_id,
                slot_number=slot.slot_number if slot else "N/A",
                arrival_time=r.start_time,
                end_time=r.end_time,
                duration_hours=r.duration_hours,
                status=r.status,
                total_price=r.total_price,
                cancellation_reason=r.cancellation_reason,
                created_at=r.created_at
            )
        )
    return items

# 4. Status Update by Administrator
@router.patch("/reservations/{reservation_id}/status", response_model=AdminReservationItem)
def update_reservation_status(
    reservation_id: int,
    payload: AdminStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Allows administrator to update reservation status (CONFIRMED, CANCELLED, COMPLETED, EXPIRED).
    Automatically releases the slot when cancelled or completed.
    """
    res = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")

    new_status = payload.status.upper()
    if new_status not in ["CONFIRMED", "CANCELLED", "COMPLETED", "EXPIRED"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be CONFIRMED, CANCELLED, COMPLETED, or EXPIRED.")

    res.status = new_status
    if payload.reason:
        res.cancellation_reason = payload.reason

    slot = db.query(ParkingSlot).filter(ParkingSlot.id == res.slot_id).first()
    now = datetime.utcnow()

    # If cancelled, completed, or expired -> release slot
    if new_status in ["CANCELLED", "COMPLETED", "EXPIRED"] and slot:
        other_active = db.query(Reservation).filter(
            Reservation.slot_id == slot.id,
            Reservation.status == "CONFIRMED",
            Reservation.id != res.id,
            Reservation.end_time > now
        ).first()
        if not other_active and slot.status == "Reserved":
            slot.status = "Available"
            slot.last_status_change = now

    db.commit()
    db.refresh(res)

    loc = db.query(Location).filter(Location.location_id == res.location_id).first()
    return AdminReservationItem(
        id=res.id,
        booking_reference=res.reservation_code,
        customer_name=res.customer_name,
        customer_phone=res.customer_phone,
        customer_email=res.customer_email,
        vehicle_number=res.vehicle_number,
        location_id=res.location_id,
        location_name=loc.name if loc else res.location_id,
        slot_id=res.slot_id,
        slot_number=slot.slot_number if slot else "N/A",
        arrival_time=res.start_time,
        end_time=res.end_time,
        duration_hours=res.duration_hours,
        status=res.status,
        total_price=res.total_price,
        cancellation_reason=res.cancellation_reason,
        created_at=res.created_at
    )

# 5. Export to CSV
@router.get("/reservations/export/csv")
def export_reservations_csv(
    status_filter: Optional[str] = None,
    location_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Exports reservations to a downloadable CSV file.
    """
    sync_reservation_lifecycle(db)

    query = db.query(Reservation)
    if status_filter and status_filter != "all":
        query = query.filter(Reservation.status == status_filter.upper())
    if location_id and location_id != "all":
        query = query.filter(Reservation.location_id == location_id)

    reservations = query.order_by(desc(Reservation.created_at)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Booking Reference",
        "Customer Name",
        "Phone Number",
        "Email",
        "Vehicle Plate",
        "Location ID",
        "Slot ID",
        "Arrival Time (UTC)",
        "End Time (UTC)",
        "Duration (Hours)",
        "Status",
        "Total Price ($)",
        "Booking Date (UTC)"
    ])

    for r in reservations:
        writer.writerow([
            r.reservation_code,
            r.customer_name,
            r.customer_phone,
            r.customer_email or "",
            r.vehicle_number,
            r.location_id,
            r.slot_id,
            r.start_time.strftime("%Y-%m-%d %H:%M:%S"),
            r.end_time.strftime("%Y-%m-%d %H:%M:%S"),
            r.duration_hours,
            r.status,
            f"{r.total_price:.2f}",
            r.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ])

    output.seek(0)
    filename = f"smartpark_reservations_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# 6. Admin Real-Time Notifications
@router.get("/notifications", response_model=List[AdminNotificationResponse])
def get_admin_notifications(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Returns latest notifications for the administrator notification area.
    """
    notifications = db.query(AdminNotification).order_by(desc(AdminNotification.created_at)).limit(limit).all()
    return notifications

@router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    notif = db.query(AdminNotification).filter(AdminNotification.id == notification_id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "success"}

@router.post("/notifications/mark-all-read")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    db.query(AdminNotification).filter(AdminNotification.is_read == False).update({"is_read": True})
    db.commit()
    return {"status": "success"}
