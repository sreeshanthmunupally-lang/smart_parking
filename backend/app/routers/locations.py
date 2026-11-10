from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models_db import Location, ParkingSlot
from ..schemas import LocationResponse

router = APIRouter(prefix="/locations", tags=["Locations"])

@router.get("", response_model=List[LocationResponse])
def get_locations(db: Session = Depends(get_db)):
    locations = db.query(Location).all()
    slots = db.query(ParkingSlot).all()

    result = []
    for loc in locations:
        loc_slots = [s for s in slots if s.location_id == loc.location_id]
        if loc_slots:
            occ_count = sum(1 for s in loc_slots if s.status in ["Occupied", "Reserved"])
            ratio = occ_count / len(loc_slots)
        else:
            ratio = 0.50

        occ_spaces = int(round(ratio * loc.capacity))
        avail_spaces = loc.capacity - occ_spaces
        occ_pct = round((occ_spaces / loc.capacity) * 100, 1)

        demand = "Low"
        if occ_pct >= 75:
            demand = "High"
        elif occ_pct >= 45:
            demand = "Medium"

        result.append(
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
    return result

@router.get("/{location_id}", response_model=LocationResponse)
def get_location_details(location_id: str, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.location_id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")

    loc_slots = db.query(ParkingSlot).filter(ParkingSlot.location_id == location_id).all()
    if loc_slots:
        occ_count = sum(1 for s in loc_slots if s.status in ["Occupied", "Reserved"])
        ratio = occ_count / len(loc_slots)
    else:
        ratio = 0.50

    occ_spaces = int(round(ratio * loc.capacity))
    avail_spaces = loc.capacity - occ_spaces
    occ_pct = round((occ_spaces / loc.capacity) * 100, 1)

    demand = "Low"
    if occ_pct >= 75:
        demand = "High"
    elif occ_pct >= 45:
        demand = "Medium"

    return LocationResponse(
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
