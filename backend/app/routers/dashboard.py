from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Any

from ..database import get_db
from ..models_db import Location, ParkingSlot, Reservation, TelemetryLog
from ..schemas import DashboardStatsResponse, LocationResponse, HourlyTrend
from ..ml_service import ml_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardStatsResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    locations = db.query(Location).all()
    slots = db.query(ParkingSlot).all()
    active_reservations = db.query(Reservation).filter(Reservation.status.in_(["CONFIRMED", "Active"])).count()

    total_capacity = sum(loc.capacity for loc in locations)
    
    # Calculate current occupied and available across all locations
    # Based on slot ratios scaled to total capacity
    location_summaries = []
    total_occupied_sum = 0
    total_available_sum = 0

    for loc in locations:
        loc_slots = [s for s in slots if s.location_id == loc.location_id]
        if loc_slots:
            occ_count = sum(1 for s in loc_slots if s.status in ["Occupied", "Reserved"])
            ratio = occ_count / len(loc_slots)
        else:
            ratio = 0.55 # Fallback default

        occ_spaces = int(round(ratio * loc.capacity))
        occ_spaces = min(loc.capacity, max(0, occ_spaces))
        avail_spaces = loc.capacity - occ_spaces
        occ_pct = round((occ_spaces / loc.capacity) * 100, 1)

        demand = "Low"
        if occ_pct >= 75:
            demand = "High"
        elif occ_pct >= 45:
            demand = "Medium"

        location_summaries.append(
            LocationResponse(
                location_id=loc.location_id,
                name=loc.name,
                address=loc.address,
                capacity=loc.capacity,
                occupied=occ_spaces,
                available=avail_spaces,
                occupancy_percentage=occ_pct,
                demand_level=demand,
                type=loc.type,
                hourly_rate=loc.hourly_rate,
                latitude=loc.latitude,
                longitude=loc.longitude
            )
        )
        total_occupied_sum += occ_spaces
        total_available_sum += avail_spaces

    overall_occ_pct = round((total_occupied_sum / total_capacity * 100), 1) if total_capacity > 0 else 0.0
    overall_demand = "Low"
    if overall_occ_pct >= 75:
        overall_demand = "High"
    elif overall_occ_pct >= 45:
        overall_demand = "Medium"

    # Hourly trends aggregated from telemetry logs or calculated curve
    now = datetime.utcnow()
    hourly_trends = []
    for h in range(24):
        hour_label = f"{h:02d}:00"
        # Typical diurnal curve for citywide aggregation
        if 7 <= h <= 19:
            base_curve = 0.55 + 0.35 * (0.8 + 0.2 * ((h - 7) % 5) / 5)
        else:
            base_curve = 0.20 + 0.15 * (h / 24)
        
        occ_h = int(round(base_curve * total_capacity))
        avail_h = total_capacity - occ_h
        hourly_trends.append(
            HourlyTrend(
                hour=hour_label,
                occupied=occ_h,
                available=avail_h,
                occupancy_rate=round(base_curve * 100, 1)
            )
        )

    # Model status
    metrics = ml_service.get_metrics()
    model_status = {
        "is_ready": ml_service.is_ready,
        "best_model": metrics.get("best_model_name", "Random Forest") if ml_service.is_ready else None,
        "models_available": list(ml_service.models.keys()) if ml_service.is_ready else [],
        "missing_files": [__file__] if not ml_service.is_ready else []
    }

    return DashboardStatsResponse(
        total_capacity=total_capacity,
        total_occupied=total_occupied_sum,
        total_available=total_available_sum,
        overall_occupancy_percentage=overall_occ_pct,
        overall_demand_status=overall_demand,
        active_reservations_count=active_reservations,
        total_locations_count=len(locations),
        locations=location_summaries,
        hourly_trends=hourly_trends,
        simulation_mode=True,
        model_status=model_status
    )

