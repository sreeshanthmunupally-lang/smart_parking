# SMARTPARK AI — System Architecture Specification

## 1. System Overview
**SMARTPARK AI** (Smart Parking Availability Prediction and Intelligent Parking Management System Using Machine Learning) is a full-stack, enterprise-grade platform designed to alleviate urban parking congestion and provide accurate occupancy forecasts.

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|  React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Recharts            |
+------------------------------------------+----------------------------------------+
                                           | HTTP / RESTful JSON APIs
                                           v
+-----------------------------------------------------------------------------------+
|                              APPLICATION TIER                                     |
|  FastAPI (Python 3.12) + Uvicorn + Pydantic v2 + CORS Middleware                  |
|  - Routers: Dashboard, Prediction, Slots, Locations, Analytics, Reservations,     |
|             ML Performance, About                                                 |
+---------------------+-------------------------------------+-----------------------+
                      |                                     |
                      v                                     v
+-----------------------------------+ +---------------------------------------------+
|          DATABASE TIER            | |                 ML TIER                     |
|  SQLite (Relational Storage)      | |  Scikit-learn Regressors + Joblib Storage   |
|  SQLAlchemy ORM Models:           | |  - Linear Regression (Baseline)             |
|  - Location                       | |  - Decision Tree Regressor (Depth 12)       |
|  - ParkingSlot                    | |  - Random Forest Regressor (100 Trees, R²=0.973)
|  - Reservation                    | |  - ColumnTransformer (OneHotEncoder + Scaler)
|  - TelemetryLog                   | |  - Authentic model_metrics.json             |
+-----------------------------------+ +---------------------------------------------+
```

---

## 2. Component Breakdown

### 2.1 Frontend Architecture (React 19 + TypeScript)
- **Vite Bundler**: Provides fast sub-second HMR and tree-shaken static generation.
- **Tailwind CSS**: Strict dark navy palette (`#0B132B`, `#1C2541`) with emerald green (`#10B981`) and electric blue (`#3B82F6`) highlights.
- **Recharts**: Responsive SVG charting rendering 24-hour diurnal curves, weekly demand distributions, holdout test scatter/line comparisons, and Gini feature importances.
- **State Management**: Reactive state hooks with live polling fallback (15s intervals) and simulated event listeners.

### 2.2 Backend Architecture (FastAPI + Python 3.12)
- **Asynchronous Event Loop**: High-throughput non-blocking request handling.
- **Dependency Injection**: `get_db` database session management ensuring atomic transactions and connection recycling.
- **Pydantic Schemas**: Strict serialization and deserialization validation on incoming inference and reservation payloads.
- **Lifespan Manager**: Automates table creation, baseline data seeding, and ML model deserialization during startup.

### 2.3 Machine Learning Pipeline
1. **Raw Telemetry**: 21,600 historical observations across 90 days at 30-minute intervals covering 5 distinct parking facilities.
2. **Feature Engineering**:
   - Categorical: `location_id`, `weather_condition`
   - Numeric: `day_of_week` (0-6), `hour` (0-23), `minute` (0-59), `temperature_c`
   - Binary Indicators: `is_weekend`, `is_holiday`, `is_peak_hour`, `nearby_event`
3. **Preprocessing Pipeline**:
   - `OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore')`
   - `StandardScaler()` zero-mean, unit-variance scaler
   - `Passthrough` for binary flags
4. **Model Suite**:
   - `LinearRegression()`
   - `DecisionTreeRegressor(max_depth=12, min_samples_split=8, random_state=42)`
   - `RandomForestRegressor(n_estimators=100, max_depth=16, min_samples_split=6, random_state=42)`
5. **Selection Mechanism**: Compares holdout test set R² and RMSE; automatically exports and serves `best_model.joblib`.

### 2.4 Database Schema (SQLite + SQLAlchemy)
- `locations`: Unique garage properties, capacity, category, coordinates, tariffs.
- `parking_slots`: Individual bay numbers, floor levels, zones, bay classifications (Standard, EV, Accessible, VIP), current statuses (Available, Occupied, Reserved).
- `reservations`: Active and historical reservation records, customer name, license plate, reservation codes, start/end timestamps.
- `telemetry_logs`: Historical aggregate snapshots recording occupancy percentages and demand classifications.

