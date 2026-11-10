import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .database import engine, Base, SessionLocal
from .models_db import Location, ParkingSlot, Reservation, TelemetryLog, AdminUser, AdminNotification
from .seed_data import seed_database
from .ml_service import ml_service
from .auth import ensure_default_admin
from .lifecycle import sync_reservation_lifecycle

from .routers.dashboard import router as dashboard_router
from .routers.prediction import router as prediction_router
from .routers.slots import router as slots_router
from .routers.locations import router as locations_router
from .routers.simulation import router as simulation_router
from .routers.analytics import router as analytics_router
from .routers.reservations import router as reservations_router
from .routers.ml_performance import router as ml_performance_router
from .routers.about import router as about_router
from .routers.public_reservations import router as public_reservations_router
from .routers.admin import router as admin_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables
    Base.metadata.create_all(bind=engine)
    
    # Seed initial data & ensure administrator account
    db = SessionLocal()
    try:
        seed_database(db)
        ensure_default_admin(db)
        sync_reservation_lifecycle(db)
    finally:
        db.close()
        
    # Reload ML models if needed
    ml_service.load_models()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Smart Parking Availability Prediction and Intelligent Parking Management System Using Machine Learning",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(public_reservations_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(prediction_router, prefix=settings.API_V1_STR)
app.include_router(slots_router, prefix=settings.API_V1_STR)
app.include_router(locations_router, prefix=settings.API_V1_STR)
app.include_router(simulation_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(reservations_router, prefix=settings.API_V1_STR)
app.include_router(ml_performance_router, prefix=settings.API_V1_STR)
app.include_router(about_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "project": "SMARTPARK AI",
        "title": "Smart Parking Availability Prediction and Intelligent Parking Management System Using Machine Learning",
        "status": "online",
        "documentation": "/docs",
        "admin_portal": "/admin",
        "api_prefix": settings.API_V1_STR
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "ml_service": "ready" if ml_service.is_ready else "models_missing",
        "models_loaded": list(ml_service.models.keys()) if ml_service.is_ready else [],
        "best_model": ml_service.metrics_data.get("best_model_name") if ml_service.metrics_data else None
    }
