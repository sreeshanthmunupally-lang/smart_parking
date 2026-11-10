import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple
from .config import settings

class MLService:
    def __init__(self):
        self.preprocessor = None
        self.models: Dict[str, Any] = {}
        self.best_model = None
        self.metrics_data: Optional[Dict[str, Any]] = None
        self.is_ready: bool = False
        self.missing_files: List[str] = []
        self.load_models()

    def check_files(self) -> List[str]:
        required = [
            settings.PREPROCESSOR_FILE,
            settings.LINEAR_REGRESSION_FILE,
            settings.DECISION_TREE_FILE,
            settings.RANDOM_FOREST_FILE,
            settings.BEST_MODEL_FILE,
            settings.METRICS_FILE
        ]
        missing = [f for f in required if not os.path.exists(f)]
        return missing

    def load_models(self):
        self.missing_files = self.check_files()
        if self.missing_files:
            self.is_ready = False
            print(f"Warning: Missing ML files: {self.missing_files}")
            return False

        try:
            self.preprocessor = joblib.load(settings.PREPROCESSOR_FILE)
            self.models = {
                "Linear Regression": joblib.load(settings.LINEAR_REGRESSION_FILE),
                "Decision Tree": joblib.load(settings.DECISION_TREE_FILE),
                "Random Forest": joblib.load(settings.RANDOM_FOREST_FILE)
            }
            self.best_model = joblib.load(settings.BEST_MODEL_FILE)

            with open(settings.METRICS_FILE, "r") as f:
                self.metrics_data = json.load(f)

            self.is_ready = True
            print("SmartPark AI ML models and metrics loaded successfully.")
            return True
        except Exception as e:
            print(f"Error loading models: {e}")
            self.is_ready = False
            return False

    def get_metrics(self) -> Dict[str, Any]:
        if not self.is_ready or not self.metrics_data:
            return {
                "status": "missing_models",
                "missing_files": [os.path.basename(f) for f in self.missing_files],
                "message": "Actual trained models are missing. Please run 'python backend/train_models.py' to train and evaluate models."
            }
        return self.metrics_data

    def predict(
        self,
        location_id: str,
        location_name: str,
        capacity: int,
        date_str: str,
        time_str: str,
        model_name: str = "Best Model",
        weather_condition: str = "Clear",
        temperature_c: Optional[float] = None,
        nearby_event: bool = False
    ) -> Dict[str, Any]:
        if not self.is_ready:
            raise RuntimeError(
                f"ML models are not loaded. Missing files: {[os.path.basename(f) for f in self.missing_files]}. "
                "Please run 'python backend/train_models.py' to generate trained models."
            )

        # Parse date and time
        dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        day_of_week = dt.weekday()
        day_name = dt.strftime("%A")
        hour = dt.hour
        minute = dt.minute
        is_weekend = 1 if day_of_week in [5, 6] else 0
        is_holiday = 0 # Default non-holiday

        if temperature_c is None:
            # Diurnal default estimate
            temperature_c = round(22.0 + 5.0 * np.sin((hour - 6) / 24 * 2 * np.pi), 1)

        # Peak hour detection based on typical commuter/mall patterns
        is_peak = 0
        if is_weekend:
            if 13 <= hour <= 21:
                is_peak = 1
        else:
            if hour in [7, 8, 9, 12, 17, 18, 19]:
                is_peak = 1

        feature_dict = {
            "location_id": location_id,
            "weather_condition": weather_condition,
            "day_of_week": day_of_week,
            "hour": hour,
            "minute": minute,
            "temperature_c": float(temperature_c),
            "is_weekend": is_weekend,
            "is_holiday": is_holiday,
            "is_peak_hour": is_peak,
            "nearby_event": 1 if nearby_event else 0
        }

        # Format input DataFrame matching exact preprocessor schema
        df_input = pd.DataFrame([feature_dict])
        transformed_input = self.preprocessor.transform(df_input)

        # Run comparison across all 3 models
        comparison_results = {}
        for candidate_name, candidate_model in self.models.items():
            raw_pred = candidate_model.predict(transformed_input)[0]
            pred_occ = int(round(np.clip(raw_pred, 0, capacity)))
            pred_avail = capacity - pred_occ
            occ_pct = round((pred_occ / capacity) * 100, 1)

            demand = "Low"
            if occ_pct >= 75:
                demand = "High"
            elif occ_pct >= 45:
                demand = "Medium"

            metrics = self.metrics_data["models"].get(candidate_name, {})
            comparison_results[candidate_name] = {
                "model_name": candidate_name,
                "predicted_occupied": pred_occ,
                "predicted_available": pred_avail,
                "occupancy_percentage": occ_pct,
                "demand_level": demand,
                "mae": metrics.get("mae", 0.0),
                "rmse": metrics.get("rmse", 0.0),
                "r2_score": metrics.get("r2_score", 0.0)
            }

        # Select target model
        best_name = self.metrics_data.get("best_model_name", "Random Forest")
        if model_name == "Best Model" or model_name not in self.models:
            chosen_name = best_name
            chosen_pred = comparison_results[best_name]
        else:
            chosen_name = model_name
            chosen_pred = comparison_results[model_name]

        # Recommendation logic
        if chosen_pred["occupancy_percentage"] >= 85:
            recommendation = "Heavy congestion expected. Reserving a spot in advance is strongly advised."
        elif chosen_pred["occupancy_percentage"] >= 65:
            recommendation = "Moderate parking demand. Multiple slots expected on upper levels or designated zones."
        else:
            recommendation = "High availability expected. Ample parking spaces should be readily accessible."

        return {
            "location_id": location_id,
            "location_name": location_name,
            "total_capacity": capacity,
            "target_timestamp": dt.strftime("%Y-%m-%d %H:%M"),
            "day_of_week_name": day_name,
            "is_weekend": bool(is_weekend),
            "is_peak_hour": bool(is_peak),
            "weather_condition": weather_condition,
            "temperature_c": temperature_c,
            "selected_model": chosen_name,
            "predicted_occupied": chosen_pred["predicted_occupied"],
            "predicted_available": chosen_pred["predicted_available"],
            "occupancy_percentage": chosen_pred["occupancy_percentage"],
            "demand_level": chosen_pred["demand_level"],
            "model_metrics": self.metrics_data["models"].get(chosen_name, {}),
            "all_models_comparison": comparison_results,
            "recommendation": recommendation
        }

ml_service = MLService()
