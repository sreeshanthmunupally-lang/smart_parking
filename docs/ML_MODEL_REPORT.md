# SMARTPARK AI — Machine Learning Model Evaluation Report

## 1. Executive Summary
This report documents the training, empirical evaluation, and model selection procedure for **SMARTPARK AI**.
All evaluation results presented herein are computed on an independent holdout test dataset (20% split, 4,320 records) using Scikit-learn regressors.

---

## 2. Dataset Characteristics
- **Total Records**: 21,600 rows (90 days, 30-minute intervals).
- **Facilities Monitored**:
  1. Downtown Metro Hub (`LOC001`, Capacity: 250)
  2. Tech Park Plaza (`LOC002`, Capacity: 320)
  3. Grand Central Mall (`LOC003`, Capacity: 400)
  4. Airport Terminal 2 (`LOC004`, Capacity: 500)
  5. University Campus North (`LOC005`, Capacity: 180)
- **Train / Test Partition**:
  - Training Set: 17,280 samples (80%)
  - Holdout Test Set: 4,320 samples (20%)
  - Random Seed: Fixed (`random_state=42`) for 100% reproducibility.

---

## 3. Empirical Model Evaluation Table

The three candidate regression algorithms were trained under identical preprocessing pipelines:

| Model Architecture | Mean Absolute Error (MAE) | Root Mean Squared Error (RMSE) | R² Score | MAPE (%) | Training Duration (s) | Model Selection Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Linear Regression** | 56.6027 | 76.0045 | 0.7507 | 172.93% | 0.0083s | Baseline Benchmark |
| **Decision Tree Regressor** | 18.9085 | 26.5434 | 0.9696 | 47.72% | 0.0461s | Strong Non-linear Candidate |
| **Random Forest Regressor** | **18.3413** | **25.1481** | **0.9727** | **47.22%** | 0.4563s | **SELECTED (Production)** |

---

## 4. Algorithmic Justification for Model Selection

### 4.1 Why Random Forest Won
1. **Variance Reduction**: Decision trees fit localized patterns well but suffer from higher variance at boundaries. The 100-tree ensemble in Random Forest de-correlates individual estimators, yielding the lowest RMSE (25.1481).
2. **Handling Non-linear Diurnal Shifts**: Weekend retail rushes and weekday commuter peaks exhibit sharp discontinuous steps that OLS Linear Regression cannot capture (explaining Linear Regression's modest R² of 0.7507).
3. **Robustness to Extreme Weather / Events**: Bagging prevents localized event noise from distorting global occupancy estimates.

### 4.2 Feature Importance Hierarchy (Random Forest)
Evaluated via Gini impurity reduction:
1. `location_id` (Primary scale factor for facility capacity)
2. `hour` (Diurnal circadian mobility rhythm)
3. `is_weekend` (Weekday commuter vs. weekend entertainment split)
4. `is_peak_hour` (Rush hour clustering)
5. `weather_condition` (Rain / storm diversion to covered parking structures)
6. `nearby_event` (Targeted local surges)
7. `temperature_c` (Seasonal temperature correlation)

---

## 5. Artifact Manifest in `models/`
- `linear_regression.joblib` (Trained Linear Regression estimator)
- `decision_tree.joblib` (Trained Decision Tree estimator)
- `random_forest.joblib` (Trained Random Forest estimator)
- `best_model.joblib` (Copy of Random Forest for production inference)
- `preprocessor.joblib` (Fitted ColumnTransformer)
- `model_metrics.json` (Authentic evaluation JSON file consumed by frontend & APIs)
