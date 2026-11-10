from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models_db import Location
from ..schemas import PredictionRequest, PredictionResponse
from ..ml_service import ml_service

router = APIRouter(prefix="/predict", tags=["Prediction"])

@router.post("", response_model=PredictionResponse)
def predict_parking_availability(
    request: PredictionRequest,
    db: Session = Depends(get_db)
):
    # Verify model readiness
    if not ml_service.is_ready:
        missing_names = [f.split("/")[-1].split("\\")[-1] for f in ml_service.missing_files]
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "ML models are not loaded or missing.",
                "missing_files": missing_names,
                "solution": "Run 'python backend/train_models.py' to generate authentic trained models."
            }
        )

    # Get location details
    loc = db.query(Location).filter(Location.location_id == request.location_id).first()
    if not loc:
        # Fallback to default if not in db
        location_name = "Selected Parking Hub"
        capacity = 250
    else:
        location_name = loc.name
        capacity = loc.capacity

    try:
        prediction_result = ml_service.predict(
            location_id=request.location_id,
            location_name=location_name,
            capacity=capacity,
            date_str=request.date,
            time_str=request.time,
            model_name=request.model_name or "Best Model",
            weather_condition=request.weather_condition or "Clear",
            temperature_c=request.temperature_c,
            nearby_event=bool(request.nearby_event)
        )
        return prediction_result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Inference error: {str(e)}"
        )

