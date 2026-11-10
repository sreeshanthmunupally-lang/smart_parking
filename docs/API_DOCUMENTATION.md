# SMARTPARK AI — REST API Documentation

Base URL: `http://localhost:8000/api`

Interactive Swagger UI: `http://localhost:8000/docs`  
Interactive ReDoc: `http://localhost:8000/redoc`

---

## 1. System Endpoints

### `GET /api/health`
Returns system health, database connectivity status, and loaded ML models.
```json
{
  "status": "healthy",
  "database": "connected",
  "ml_service": "ready",
  "models_loaded": ["Linear Regression", "Decision Tree", "Random Forest"],
  "best_model": "Random Forest"
}
```

---

## 2. Dashboard Endpoints

### `GET /api/dashboard`
Returns high-level statistics, overall occupancy percentage, network demand status, 24-hour diurnal trend data, and location summaries.

**Response Structure:**
```json
{
  "total_capacity": 1650,
  "total_occupied": 1058,
  "total_available": 592,
  "overall_occupancy_percentage": 64.1,
  "overall_demand_status": "Medium",
  "active_reservations_count": 8,
  "total_locations_count": 5,
  "locations": [...],
  "hourly_trends": [...],
  "simulation_mode": true,
  "model_status": {...}
}
```

---

## 3. Machine Learning Prediction Endpoints

### `POST /api/predict`
Calculates predicted occupancy, vacant spots, occupancy percentage, and demand level for a target arrival timestamp using trained Scikit-learn regressors.

**Request Payload:**
```json
{
  "location_id": "LOC001",
  "date": "2026-11-20",
  "time": "14:30",
  "model_name": "Best Model",
  "weather_condition": "Clear",
  "temperature_c": 22.5,
  "nearby_event": false
}
```

**Response Payload:**
```json
{
  "location_id": "LOC001",
  "location_name": "Downtown Metro Hub",
  "total_capacity": 250,
  "target_timestamp": "2026-11-20 14:30",
  "day_of_week_name": "Friday",
  "is_weekend": false,
  "is_peak_hour": false,
  "weather_condition": "Clear",
  "temperature_c": 22.5,
  "selected_model": "Random Forest",
  "predicted_occupied": 152,
  "predicted_available": 98,
  "occupancy_percentage": 60.8,
  "demand_level": "Medium",
  "model_metrics": {
    "mae": 18.3413,
    "rmse": 25.1481,
    "r2_score": 0.9727
  },
  "all_models_comparison": {
    "Linear Regression": { "predicted_occupied": 78, "r2_score": 0.7507 },
    "Decision Tree": { "predicted_occupied": 154, "r2_score": 0.9696 },
    "Random Forest": { "predicted_occupied": 152, "r2_score": 0.9727 }
  },
  "recommendation": "Moderate parking demand. Multiple slots expected on upper levels or designated zones."
}
```

---

## 4. Parking Slots Endpoints

### `GET /api/slots/{location_id}`
Returns all parking bays for a given facility, including floor level, zone, classification (Standard, EV, Accessible, VIP), current status (Available, Occupied, Reserved), and active reservation metadata if any.

### `GET /api/slots/slot/{slot_id}`
Returns granular telemetry and reservation details for a single bay.

---

## 5. Location Endpoints

### `GET /api/locations`
Returns list of all 5 parking facilities with capacity, current occupied/available count, and tariff.

### `GET /api/locations/{location_id}`
Returns single location details.

---

## 6. Reservation Simulation Endpoints

### `GET /api/reservations`
Returns all active and completed/cancelled reservations ordered chronologically.

### `POST /api/reservations`
Simulates advance reservation on an Available slot.
```json
{
  "slot_id": 14,
  "location_id": "LOC001",
  "customer_name": "Sarah Jenkins",
  "vehicle_number": "CA-8XYZ91",
  "phone": "+1 (555) 234-5678",
  "email": "sarah.j@example.com",
  "duration_hours": 2
}
```

### `DELETE /api/reservations/{reservation_id}`
Cancels active reservation and immediately returns slot to Available status.

---

## 7. Machine Learning Performance Endpoints

### `GET /api/metrics`
Returns authentic holdout evaluation metrics computed on the test dataset:
- Models: Linear Regression, Decision Tree, Random Forest
- Metrics: MAE, RMSE, R², MAPE, training latency
- Random Forest Gini Feature Importances
- 60 actual vs predicted sample points for charting

### `GET /api/metrics/comparison`
Returns tabular summary of all 3 models with highlight on the best-performing model.

---

## 8. Simulation Endpoints

### `POST /api/simulation/tick`
Simulates physical vehicle movements (entries and exits) on random slots.
*Notice: Clearly labeled simulation data. Does not claim camera-based detection.*

### `POST /api/simulation/reset`
Resets bays back to balanced baseline distribution.

---

## 9. Analytics & About Endpoints

### `GET /api/analytics/summary`
Returns 24-hour diurnal curves, day-of-week averages, cross-garage comparison, and holdout test points.

### `GET /api/about`
Returns problem statement, objectives, feature dictionary, and architecture breakdown.
