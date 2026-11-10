import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .models_db import Location, ParkingSlot, Reservation, TelemetryLog

LOCATIONS_DATA = [
    {
        "location_id": "LOC001",
        "name": "Downtown Metro Hub",
        "address": "450 Transit Boulevard, Downtown Central",
        "capacity": 250,
        "type": "Transit / Commuter",
        "hourly_rate": 3.50,
        "latitude": 37.7749,
        "longitude": -122.4194
    },
    {
        "location_id": "LOC002",
        "name": "Tech Park Plaza",
        "address": "1200 Innovation Way, Silicon Quarter",
        "capacity": 320,
        "type": "Commercial / IT Office",
        "hourly_rate": 4.00,
        "latitude": 37.7833,
        "longitude": -122.4167
    },
    {
        "location_id": "LOC003",
        "name": "Grand Central Mall",
        "address": "88 Galleria Circle, Midtown",
        "capacity": 400,
        "type": "Retail & Entertainment",
        "hourly_rate": 2.50,
        "latitude": 37.7690,
        "longitude": -122.4467
    },
    {
        "location_id": "LOC004",
        "name": "Airport Terminal 2",
        "address": "Terminal 2 Ground Transportation Deck, Metro Airport",
        "capacity": 500,
        "type": "Travel & Transportation",
        "hourly_rate": 6.00,
        "latitude": 37.6213,
        "longitude": -122.3790
    },
    {
        "location_id": "LOC005",
        "name": "University Campus North",
        "address": "15 University Way, Academic Ridge",
        "capacity": 180,
        "type": "Academic & Research",
        "hourly_rate": 2.00,
        "latitude": 37.8719,
        "longitude": -122.2585
    }
]

def seed_database(db: Session):
    # Check if already seeded
    if db.query(Location).count() > 0:
        return

    print("Seeding initial database locations, slots, and simulation baseline...")
    random.seed(42)

    # 1. Seed Locations
    for loc_data in LOCATIONS_DATA:
        loc = Location(**loc_data)
        db.add(loc)
    db.commit()

    # 2. Seed Slots for each location (32 visual layout slots per location)
    slot_types = ["Standard", "Standard", "Standard", "EV Charging", "Accessible", "VIP"]
    zones = ["Zone A", "Zone B", "Zone C", "Zone D"]
    floors = ["Ground Floor (L1)", "Upper Deck (L2)"]

    all_slots = []
    for loc in LOCATIONS_DATA:
        loc_id = loc["location_id"]
        # Generate 32 interactive slot spots for visual matrix
        for i in range(1, 33):
            zone = zones[(i - 1) // 8]
            floor = floors[0] if i <= 16 else floors[1]
            stype = slot_types[(i - 1) % len(slot_types)]
            
            # Initial distribution: ~60% occupied, ~25% available, ~15% reserved
            rand_val = random.random()
            if rand_val < 0.25:
                status = "Available"
            elif rand_val < 0.85:
                status = "Occupied"
            else:
                status = "Reserved"

            slot_code = f"{zone[5]}-{i:02d}"
            slot = ParkingSlot(
                location_id=loc_id,
                slot_number=slot_code,
                floor=floor,
                zone=zone,
                slot_type=stype,
                status=status,
                last_status_change=datetime.utcnow() - timedelta(minutes=random.randint(5, 180))
            )
            all_slots.append(slot)

    db.add_all(all_slots)
    db.commit()

    # 3. Seed Sample Reservations
    reserved_slots = db.query(ParkingSlot).filter(ParkingSlot.status == "Reserved").limit(8).all()
    sample_customers = [
        {"name": "Sarah Jenkins", "plate": "CA-8XYZ91", "phone": "+1 (555) 234-5678", "email": "sarah.j@example.com"},
        {"name": "David Chen", "plate": "NY-4KTR22", "phone": "+1 (555) 345-6789", "email": "david.chen@corp.com"},
        {"name": "Elena Rostova", "plate": "TX-99AB12", "phone": "+1 (555) 876-5432", "email": "elena.r@techhub.org"},
        {"name": "Marcus Vance", "plate": "WA-33PL88", "phone": "+1 (555) 456-7890", "email": "m.vance@studio.com"},
        {"name": "Priya Sharma", "plate": "IL-72MM09", "phone": "+1 (555) 654-3210", "email": "priya.s@health.net"},
        {"name": "Alexander Cole", "plate": "FL-509XX1", "phone": "+1 (555) 789-0123", "email": "alex.cole@global.io"}
    ]

    for idx, slot in enumerate(reserved_slots):
        cust = sample_customers[idx % len(sample_customers)]
        start = datetime.utcnow() - timedelta(minutes=random.randint(10, 45))
        end = start + timedelta(hours=2)
        res = Reservation(
            reservation_code=f"SP-{random.randint(100000, 999999)}",
            slot_id=slot.id,
            location_id=slot.location_id,
            customer_name=cust["name"],
            vehicle_number=cust["plate"],
            phone=cust["phone"],
            email=cust["email"],
            start_time=start,
            end_time=end,
            status="Active"
        )
        db.add(res)
    db.commit()

    # 4. Seed Telemetry Logs (for historical trend charts)
    now = datetime.utcnow()
    for loc in LOCATIONS_DATA:
        cap = loc["capacity"]
        for hours_ago in range(24, 0, -1):
            ts = now - timedelta(hours=hours_ago)
            h = ts.hour
            
            # Typical curve
            ratio = 0.35 + 0.45 * (0.5 + 0.5 * random.random())
            if 8 <= h <= 18:
                ratio = min(0.95, ratio + 0.25)
            occ = int(ratio * cap)
            avail = cap - occ
            pct = round((occ / cap) * 100, 1)
            
            demand = "Low"
            if pct >= 75:
                demand = "High"
            elif pct >= 45:
                demand = "Medium"

            log = TelemetryLog(
                location_id=loc["location_id"],
                timestamp=ts,
                occupied_spaces=occ,
                available_spaces=avail,
                occupancy_percentage=pct,
                demand_level=demand
            )
            db.add(log)
    db.commit()
    print("Database seeding completed.")
