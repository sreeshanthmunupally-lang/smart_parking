# SMARTPARK AI

Smart Parking Availability Prediction, Public Reservation Platform, and Intelligent Parking Management System Using Machine Learning.

## Project Summary
SMARTPARK AI is a complete public parking reservation web platform with an integrated, secure administrator dashboard for facility managers and application owners.

Public drivers can browse parking facilities, check machine-learning predicted availability, reserve specific parking bays, receive unique booking references, and manage or cancel reservations online. The private administrator portal (`/admin`) provides full audit logging, real-time booking alerts, SQLite-driven operational metrics, and CSV data export.

## Key Features

### 1. Public Customer Platform
- **Public Main Dashboard**: Displays network capacity, occupied bays, available spaces, occupancy percentages, demand status badges, and 24-hour diurnal availability trends.
- **Find & Reserve Wizard**: End-to-end booking flow: select garage, choose bay, input driver name, phone number, vehicle plate, arrival date, arrival time, and duration. Generates instant booking references (e.g. `SPK-YYYYMMDD-XXXX`).
- **Find & Manage My Booking**: Self-service lookup using booking reference and verification phone number. Customers can inspect their reservation receipt and cancel active bookings, releasing the parking bay immediately.
- **Simplified ML Availability Prediction**: Public prediction form with only: Parking Location, Target Date, and Expected Arrival Time. Model selection and atmospheric parameters are calibrated automatically under the hood.
- **Interactive Parking Layout**: Visual bay matrix color-coded by status (Green = Available, Red = Occupied, Yellow = Reserved) with floor and zone filters.
- **Locations Directory**: Registry of 5 parking facilities (Downtown Metro Hub, Tech Park Plaza, Grand Central Mall, Airport Terminal 2, and University Campus North).
- **Multi-Dimensional Analytics**: 24-hour diurnal curves, day-of-week demand trends, and ground-truth vs. predicted trajectory charts.
- **ML Performance & Benchmarks**: Authentic holdout test evaluation (MAE, RMSE, R-squared) across Linear Regression, Decision Tree, and Random Forest.
- **About Project**: Complete academic documentation covering the problem statement, objectives, feature engineering pipeline, algorithms, and system architecture.

### 2. Secure Administrator Portal (`/admin`)
- **Restricted Access**: Dedicated admin route protected by cryptographic password hashing (PBKDF2-HMAC-SHA256) and JWT bearer tokens. Public users cannot access admin endpoints.
- **Real Database Statistics**: Computed strictly from actual SQLite records:
  - Total reservations
  - Confirmed reservations
  - Cancelled reservations
  - Upcoming reservations
  - Completed reservations
  - Total registered customer bookings (distinct phone IDs)
  - Total monitored facilities
  - Currently reserved bays
- **Time Filters**: Filter metrics by Today, Yesterday, Last 7 Days, Last 30 Days, All Time, or Custom Date Range.
- **Reservation Management Table**:
  - Live search by booking reference, customer name, phone number, or vehicle plate
  - Filter by location and reservation status (`CONFIRMED`, `CANCELLED`, `COMPLETED`, `EXPIRED`)
  - Sort by newest or oldest bookings
  - One-click CSV export
  - Individual reservation audit modal
- **Live Notifications Area**: Auto-polling notification drawer alerting managers of new public bookings and cancellations in real time.

## Model Evaluation Results
Evaluated on an independent holdout test split (4,320 records, 20% test partition):

| Model | MAE | RMSE | R-squared | Selection |
| :--- | :---: | :---: | :---: | :---: |
| Linear Regression | 56.6027 | 76.0045 | 0.7507 | Baseline |
| Decision Tree Regressor | 18.9085 | 26.5434 | 0.9696 | Non-linear Tree |
| Random Forest Regressor | 18.3413 | 25.1481 | 0.9727 | Best Model (Selected) |

## Tech Stack
- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons
- Backend: Python 3.12, FastAPI, Uvicorn, SQLAlchemy, Pydantic v2, PyJWT
- Machine Learning: Scikit-learn, Pandas, NumPy, Joblib, SciPy
- Database: SQLite (Zero-configuration persistent relational store)

## Setup & Running Instructions

### 1. Installation
In the project root:
```bash
pip install -r requirements.txt
```

### 2. Train Models (Optional if models/ is already present)
```bash
python backend/train_models.py
```

### 3. Run Verification Tests
```bash
python backend/test_admin_and_public.py
```

### 4. Start the Application
You can launch both frontend and backend together using the unified runner:
```bash
python run_app.py
```
Or start them individually:
- **Backend**:
  ```bash
  python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
  ```
- **Frontend**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```

### 5. Access URLs & Credentials
- **Public Customer Website**: `http://localhost:5173/`
- **Private Administrator Portal**: `http://localhost:5173/admin`
  - **Username**: `admin`
  - **Password**: `Admin@SmartPark2026!`
  *(Credentials can be customized in `.env` using `ADMIN_USERNAME` and `ADMIN_PASSWORD`)*
- **API Swagger Documentation**: `http://127.0.0.1:8000/docs`

## Simulation Notice
Parking slot status transitions and telemetry movements in this project are generated by an internal simulation engine for demonstration and validation purposes. It does not use camera-based hardware detection.
