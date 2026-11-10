import os
import json
from fastapi import APIRouter, HTTPException, status
from ..ml_service import ml_service
from ..config import settings

router = APIRouter(prefix="/metrics", tags=["Machine Learning Performance"])

@router.get("")
def get_model_metrics():
    """
    Returns authentic evaluation results (MAE, RMSE, R², feature importances,
    and actual vs predicted sample points) from actual training runs.
    """
    metrics = ml_service.get_metrics()
    if metrics.get("status") == "missing_models":
        return {
            "status": "missing_models",
            "is_ready": False,
            "missing_files": metrics.get("missing_files", []),
            "message": "Actual trained models are missing. Please run 'python backend/train_models.py' to generate authentic models."
        }

    return {
        "status": "success",
        "is_ready": True,
        "trained_at": metrics.get("trained_at"),
        "dataset_records": metrics.get("dataset_records"),
        "train_samples": metrics.get("train_samples"),
        "test_samples": metrics.get("test_samples"),
        "features": metrics.get("features"),
        "transformed_features": metrics.get("transformed_features"),
        "target": metrics.get("target"),
        "best_model_name": metrics.get("best_model_name"),
        "models": metrics.get("models"),
        "feature_importances": metrics.get("feature_importances"),
        "sample_chart_data": metrics.get("sample_chart_data", [])[:60],
        "residual_distribution": metrics.get("residual_distribution", [])
    }

@router.get("/comparison")
def get_model_comparison_table():
    """
    Returns concise side-by-side comparison table of all 3 models.
    """
    metrics = ml_service.get_metrics()
    if not ml_service.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Models not loaded"
        )
    
    models_dict = metrics.get("models", {})
    comparison_table = []
    for name, data in models_dict.items():
        comparison_table.append({
            "model_name": name,
            "mae": data.get("mae"),
            "rmse": data.get("rmse"),
            "r2_score": data.get("r2_score"),
            "mape": data.get("mape"),
            "training_time": data.get("training_time_seconds"),
            "is_best": (name == metrics.get("best_model_name"))
        })

    return {
        "best_model": metrics.get("best_model_name"),
        "table": comparison_table
    }
