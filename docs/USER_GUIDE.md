# SMARTPARK AI — User & Faculty Demonstration Guide

Welcome to **SMARTPARK AI**, the intelligent smart parking prediction and management platform.
This guide walks through each functional module for academic presentations and demonstrations.

---

## 1. Quick Start Walkthrough

### Module 1: Main Dashboard
1. Open the application at `http://localhost:5173`.
2. Inspect the 4 primary KPI cards:
   - **Total Parking Capacity** (1,650 spaces)
   - **Occupied Spaces**
   - **Available Spaces**
   - **Parking Demand Status** (Low, Medium, or High)
3. Observe the **24-Hour Parking Availability & Occupancy Trend** chart rendered with Recharts.
4. Click **Simulate Traffic Tick** on the simulation bar to watch real-time vehicle movements alter the bay numbers.

### Module 2: Parking Availability Prediction
1. Navigate to the **ML Prediction** tab.
2. Select target garage: e.g., *Grand Central Mall*.
3. Choose a future date and target arrival time: e.g., Saturday at 16:30.
4. Select the Algorithm:
   - *Best Model (Random Forest)*
   - *Decision Tree*
   - *Linear Regression*
5. Adjust weather condition (e.g., Rainy) and toggle *Nearby Special Event*.
6. Click **Run Availability Prediction**.
7. Examine:
   - Expected Occupied Spaces
   - Expected Vacant Slots
   - Occupancy Saturation %
   - Traffic Demand Level
   - Algorithmic recommendation card advising on advance booking.
   - The **Multi-Model Algorithmic Comparison** table displaying all three models' outputs alongside their real test R² and RMSE!

### Module 3: Interactive Parking Layout
1. Navigate to the **Parking Layout** tab.
2. Observe the color-coded bay matrix:
   - **Green** = Available
   - **Red** = Occupied
   - **Yellow** = Reserved
3. Filter by **Floor Level** (Ground / Upper) or **Zone** (Zone A, B, C, D).
4. Click any slot to inspect the **Bay Telemetry Details** drawer on the right:
   - Slot Number, Floor, Zone, Bay Type (Standard, EV, Accessible, VIP).
   - Last status transition timestamp.
   - Active reservation customer name and vehicle license plate if reserved.
5. Click **Trigger Vehicle Tick** to witness dynamic synthetic state transitions.
6. Toggle **Start Auto-Tick** to run an automated 5-second simulated telemetry cycle.

### Module 4: Multiple Parking Locations
1. Navigate to the **Locations** tab.
2. Filter facilities by category: Transit, Commercial, Retail, Travel, Academic.
3. Compare garage capacities, occupancy saturation bars, and hourly parking tariffs.
4. Click **View Bays** to jump to the visual layout for that location, or **Predict** to open the forecasting engine pre-filled.

### Module 5: Analytics
1. Navigate to the **Analytics** tab.
2. View:
   - 24-hour diurnal curves across garages.
   - Day-of-week trends from Monday through Sunday.
   - Ground Truth vs. Model Predicted trajectory chart evaluated on 4,320 test samples.
   - Facility efficiency grading table.

### Module 6: Reservation Simulation
1. Navigate to the **Reservations** tab.
2. Pick an available bay from the dropdown.
3. Enter customer name (e.g. *Elena Rostova*) and license plate (e.g. *TX-99AB12*).
4. Click **Confirm Simulated Reservation**.
5. Observe the new reservation appear immediately in the SQLite ledger with a unique code (e.g. `SP-841920`).
6. Switch back to **Parking Layout** to confirm that the slot turned Yellow (`Reserved`).
7. Click **Cancel** on the reservation table to release the bay back to Green (`Available`).

### Module 7: Machine Learning Performance
1. Navigate to the **ML Performance** tab.
2. Review the verified evaluation metrics:
   - **Random Forest**: MAE = 18.34, RMSE = 25.14, R² = 0.973
   - **Decision Tree**: MAE = 18.90, RMSE = 26.54, R² = 0.970
   - **Linear Regression**: MAE = 56.60, RMSE = 76.00, R² = 0.751
3. Review the **Actual vs. Predicted Trajectory** chart and **Feature Importance Analysis** bar chart.

### Module 8: About Project
1. Navigate to the **About Project** tab.
2. Review problem statement, mathematical principles, dataset schema, and future IoT/ANPR roadmap.
