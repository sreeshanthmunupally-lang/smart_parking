from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Prediction Schemas
class PredictionRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    location_id: str = Field(..., example="LOC001")
    date: str = Field(..., example="2026-11-15") # YYYY-MM-DD
    time: str = Field(..., example="14:30") # HH:MM
    model_name: Optional[str] = Field("Best Model", example="Best Model") # "Best Model", "Linear Regression", "Decision Tree", "Random Forest"
    temperature_c: Optional[float] = Field(None, example=24.5)
    weather_condition: Optional[str] = Field("Clear", example="Clear")
    nearby_event: Optional[bool] = Field(False, example=False)

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
    end_time: Optional[datetime]
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

# Reservation Schemas
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

# Simulation Schemas
class SimulationTickRequest(BaseModel):
    location_id: Optional[str] = None
    num_events: Optional[int] = 3

class SimulationResponse(BaseModel):
    status: str
    message: str
    updated_slots_count: int
    simulation_label: str = "SIMULATION ONLY: Real-time sensor emulation"

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
