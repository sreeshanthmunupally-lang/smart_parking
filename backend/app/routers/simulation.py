import random
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from ..database import get_db
from ..models_db import ParkingSlot, Reservation
from ..schemas import SimulationTickRequest, SimulationResponse

router = APIRouter(prefix="/simulation", tags=["Simulation"])

@router.post("/tick", response_model=SimulationResponse)
def trigger_simulation_tick(request: SimulationTickRequest = SimulationTickRequest(), db: Session = Depends(get_db)):
    """
    Simulates physical vehicle movements (entries and exits).
    Notice: Clearly labeled as simulation data. Does not claim camera-based live detection.
    """
    query = db.query(ParkingSlot)
    if request.location_id:
        query = query.filter(ParkingSlot.location_id == request.location_id)
        
    slots = query.all()
    if not slots:
        return SimulationResponse(
            status="noop",
            message="No slots found for simulation tick.",
            updated_slots_count=0,
            simulation_label="SIMULATION ONLY: Real-time sensor emulation"
        )

    # Pick random slots to mutate (excluding Reserved slots with active reservations)
    mutable_slots = [s for s in slots if s.status != "Reserved"]
    count_to_update = min(len(mutable_slots), request.num_events or 3)
    
    selected_slots = random.sample(mutable_slots, count_to_update)
    transitions = []

    for slot in selected_slots:
        old_status = slot.status
        # Toggle: Available -> Occupied, Occupied -> Available
        new_status = "Available" if old_status == "Occupied" else "Occupied"
        slot.status = new_status
        slot.last_status_change = datetime.utcnow()
        transitions.append(f"Slot {slot.slot_number} [{slot.location_id}]: {old_status} -> {new_status}")

    db.commit()

    return SimulationResponse(
        status="success",
        message=f"Simulated {len(transitions)} parking state transitions: " + "; ".join(transitions),
        updated_slots_count=len(transitions),
        simulation_label="SIMULATION ONLY: Real-time sensor emulation (no camera hardware)"
    )

@router.post("/reset", response_model=SimulationResponse)
def reset_simulation(location_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Resets slots back to default balanced simulation state.
    """
    query = db.query(ParkingSlot)
    if location_id:
        query = query.filter(ParkingSlot.location_id == location_id)
        
    slots = query.all()
    count = 0
    for s in slots:
        if s.status != "Reserved":
            # ~60% occupied, 40% available
            s.status = "Occupied" if (hash(s.slot_number) % 5 < 3) else "Available"
            s.last_status_change = datetime.utcnow()
            count += 1
            
    db.commit()
    return SimulationResponse(
        status="success",
        message=f"Reset {count} slots to baseline simulation distribution.",
        updated_slots_count=count,
        simulation_label="SIMULATION ONLY: Real-time sensor emulation"
    )
