from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    capacity = Column(Integer, nullable=False)
    type = Column(String(100), nullable=False)
    hourly_rate = Column(Float, default=2.50)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    slots = relationship("ParkingSlot", back_populates="location", cascade="all, delete-orphan")
    reservations = relationship("Reservation", back_populates="location")


class ParkingSlot(Base):
    __tablename__ = "parking_slots"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(String(50), ForeignKey("locations.location_id"), nullable=False)
    slot_number = Column(String(20), nullable=False, index=True)
    floor = Column(String(10), default="Ground")
    zone = Column(String(20), default="Zone A")
    slot_type = Column(String(50), default="Standard") # Standard, EV Charging, Accessible, VIP
    status = Column(String(20), default="Available") # Available, Occupied, Reserved
    last_status_change = Column(DateTime, default=datetime.utcnow)

    location = relationship("Location", back_populates="slots")
    reservations = relationship("Reservation", back_populates="slot")


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    reservation_code = Column(String(50), unique=True, index=True, nullable=False)
    slot_id = Column(Integer, ForeignKey("parking_slots.id"), nullable=False)
    location_id = Column(String(50), ForeignKey("locations.location_id"), nullable=False)
    customer_name = Column(String(100), nullable=False)
    vehicle_number = Column(String(50), nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(20), default="Active") # Active, Cancelled, Completed
    created_at = Column(DateTime, default=datetime.utcnow)

    slot = relationship("ParkingSlot", back_populates="reservations")
    location = relationship("Location", back_populates="reservations")


class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(String(50), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    occupied_spaces = Column(Integer, nullable=False)
    available_spaces = Column(Integer, nullable=False)
    occupancy_percentage = Column(Float, nullable=False)
    demand_level = Column(String(20), default="Low")

