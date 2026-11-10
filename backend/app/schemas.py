from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Prediction Schemas
class PredictionRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    location_id: str = Field(..., example="LOC001")
    date: str = Field(..., example="2026-11-15") # YYYY-MM-DD
    time: str = Field(..., example="14:30") # HH:MM
    model_name: Optional[str] = Field("Best Model", example="Best Model")
    temperature_c: Optional[float] = Field(None, example=24.5)
    weather_condition: Optional[str] = Field("Clear", example="Clear")
    nearby_event: Optional[bool] = Field(False, example=False)

class SimplifiedPredictionRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    location_id: str = Field(..., example="LOC001")
    date: str = Field(..., example="2026-11-15") # YYYY-MM-DD
    time: str = Field(..., example="14:30") # HH:MM

class SingleModelPrediction(BaseModel):
    model_config = {"protected_namespaces": ()}
    model_name: str
    predicted_occupied: int
    predicted_available: int
    occupancy_percentage: float
    demand_level: str
    mae: float
    rmse: float
    r2_score: float

class PredictionResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    location_id: str
    location_name: str
    total_capacity: int
    target_timestamp: str
    day_of_week_name: str
    is_weekend: bool
    is_peak_hour: bool
    weather_condition: str
    temperature_c: float
    selected_model: str
    predicted_occupied: int
    predicted_available: int
    occupancy_percentage: float
    demand_level: str
    model_metrics: Dict[str, Any]
    all_models_comparison: Dict[str, SingleModelPrediction]
    recommendation: str

# Slot Schemas
class ReservationInfo(BaseModel):
    id: int
    reservation_code: str
    customer_name: str
    vehicle_number: str
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str

class SlotResponse(BaseModel):
    id: int
    location_id: str
    slot_number: str
    floor: str
    zone: str
    slot_type: str
    status: str
    last_status_change: datetime
    current_reservation: Optional[ReservationInfo] = None

    class Config:
        from_attributes = True

# Public Slot View — Hides Customer Private Telemetry
class PublicSlotResponse(BaseModel):
    id: int
    location_id: str
    slot_number: str
    floor: str
    zone: str
    slot_type: str
    status: str # Available, Occupied, Reserved
    last_status_change: datetime

    class Config:
        from_attributes = True

# Location Schemas
class LocationResponse(BaseModel):
    location_id: str
    name: str
    address: str
    capacity: int
    occupied: int
    available: int
    occupancy_percentage: float
    demand_level: str
    type: str
    hourly_rate: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None

# Legacy Reservation Simulation Schemas
class ReservationCreate(BaseModel):
    slot_id: int
    location_id: str
    customer_name: str
    vehicle_number: str
    phone: Optional[str] = None
    email: Optional[str] = None
    duration_hours: Optional[int] = 2

class ReservationResponse(BaseModel):
    id: int
    reservation_code: str
    slot_id: int
    slot_number: str
    location_id: str
    location_name: str
    customer_name: str
    vehicle_number: str
    phone: Optional[str] = None
    email: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Public Customer Reservation Schemas
class PublicReservationCreate(BaseModel):
    location_id: str = Field(..., example="LOC001")
    slot_id: int = Field(..., example=12)
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_phone: str = Field(..., min_length=6, max_length=30)
    customer_email: Optional[str] = None
    vehicle_number: str = Field(..., min_length=2, max_length=30)
    arrival_date: str = Field(..., example="2026-11-15") # YYYY-MM-DD
    arrival_time: str = Field(..., example="14:30") # HH:MM
    duration_hours: int = Field(2, ge=1, le=48)

class PublicReservationResponse(BaseModel):
    booking_reference: str
    customer_name: str
    customer_phone_masked: str
    vehicle_number: str
    location_id: str
    location_name: str
    slot_id: int
    slot_number: str
    floor: str
    zone: str
    slot_type: str
    arrival_time: datetime
    end_time: datetime
    duration_hours: int
    status: str # CONFIRMED, CANCELLED, COMPLETED, EXPIRED
    total_price: float
    created_at: datetime
    can_cancel: bool

class PublicLookupRequest(BaseModel):
    booking_reference: str = Field(..., example="SPK-20261110-4891")
    phone_number: str = Field(..., example="555-0199")

class PublicCancelRequest(BaseModel):
    booking_reference: str = Field(..., example="SPK-20261110-4891")
    phone_number: str = Field(..., example="555-0199")
    reason: Optional[str] = "Customer self-cancellation"

# Administrator Authentication Schemas
class AdminLoginRequest(BaseModel):
    username: str
    password: str

class AdminProfile(BaseModel):
    id: int
    username: str
    full_name: str
    role: str

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: AdminProfile

# Administrator Statistics & Management Schemas
class AdminStatsResponse(BaseModel):
    total_reservations: int
    confirmed_reservations: int
    cancelled_reservations: int
    upcoming_reservations: int
    completed_reservations: int
    total_customers: int
    total_locations: int
    current_reserved_slots: int
    period: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class AdminReservationItem(BaseModel):
    id: int
    booking_reference: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    vehicle_number: str
    location_id: str
    location_name: str
    slot_id: int
    slot_number: str
    arrival_time: datetime
    end_time: datetime
    duration_hours: int
    status: str
    total_price: float
    cancellation_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AdminStatusUpdateRequest(BaseModel):
    status: str = Field(..., example="CANCELLED") # CONFIRMED, CANCELLED, COMPLETED, EXPIRED
    reason: Optional[str] = None

class AdminNotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    reservation_id: Optional[int] = None
    booking_reference: Optional[str] = None
    customer_name: Optional[str] = None
    location_name: Optional[str] = None
    slot_number: Optional[str] = None
    arrival_time: Optional[datetime] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Dashboard & Analytics Schemas
class HourlyTrend(BaseModel):
    hour: str
    occupied: int
    available: int
    occupancy_rate: float

class DashboardStatsResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    total_capacity: int
    total_occupied: int
    total_available: int
    overall_occupancy_percentage: float
    overall_demand_status: str
    active_reservations_count: int
    total_locations_count: int
    locations: List[LocationResponse]
    hourly_trends: List[HourlyTrend]
    simulation_mode: bool
    model_status: Dict[str, Any]

class ModelMetricsResponse(BaseModel):
    status: str
    trained_at: Optional[str] = None
    best_model_name: Optional[str] = None
    dataset_records: Optional[int] = None
    models: Dict[str, Any]
    feature_importances: Dict[str, Any]
    sample_chart_data: List[Dict[str, Any]]
    residual_distribution: List[Dict[str, Any]]
    missing_files: Optional[List[str]] = None
    message: Optional[str] = None

# Simulation Schemas
class SimulationTickRequest(BaseModel):
    location_id: Optional[str] = None
    num_events: Optional[int] = 3

class SimulationResponse(BaseModel):
    status: str
    message: str
    updated_slots_count: int
    simulation_label: str = "SIMULATION ONLY: Real-time sensor emulation"
