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
    customer_phone = Column(String(50), nullable=False, index=True)
    customer_email = Column(String(100), nullable=True)
    vehicle_number = Column(String(50), nullable=False, index=True)
    start_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    duration_hours = Column(Integer, default=2, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(20), default="CONFIRMED") # CONFIRMED, CANCELLED, COMPLETED, EXPIRED
    total_price = Column(Float, default=5.00)
    cancellation_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    slot = relationship("ParkingSlot", back_populates="reservations")
    location = relationship("Location", back_populates="reservations")


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default="admin") # admin, superadmin
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)


class AdminNotification(Base):
    __tablename__ = "admin_notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    message = Column(String(255), nullable=False)
    reservation_id = Column(Integer, nullable=True)
    booking_reference = Column(String(50), nullable=True)
    customer_name = Column(String(100), nullable=True)
    location_name = Column(String(150), nullable=True)
    slot_number = Column(String(20), nullable=True)
    arrival_time = Column(DateTime, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(String(50), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    occupied_spaces = Column(Integer, nullable=False)
    available_spaces = Column(Integer, nullable=False)
    occupancy_percentage = Column(Float, nullable=False)
    demand_level = Column(String(20), default="Low")
