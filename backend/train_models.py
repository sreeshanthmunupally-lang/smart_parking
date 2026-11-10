"""
Model Training Script for SmartPark AI
Trains Linear Regression, Decision Tree, and Random Forest Regressors.
Calculates authentic evaluation metrics (MAE, RMSE, R²), selects the best model,
and exports all joblib models and model_metrics.json.
"""

import os
import time
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

from generate_dataset import generate_parking_dataset

def train_and_evaluate(data_path="data/smart_parking_dataset.csv", output_dir="models"):
    os.makedirs(output_dir, exist_ok=True)
    
    if not os.path.exists(data_path):
        print(f"Dataset not found at {data_path}. Generating now...")
        generate_parking_dataset(data_path)
        
    df = pd.read_csv(data_path)
    print(f"Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns.")
    
    categorical_features = ["location_id", "weather_condition"]
    numeric_features = ["day_of_week", "hour", "minute", "temperature_c"]
    binary_features = ["is_weekend", "is_holiday", "is_peak_hour", "nearby_event"]
    
    feature_cols = categorical_features + numeric_features + binary_features
    target_col = "occupied_spaces"
    
    X = df[feature_cols]
    y = df[target_col]
    
    # Preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(drop="first", sparse_output=False, handle_unknown="ignore"), categorical_features),
            ("num", StandardScaler(), numeric_features),
            ("bin", "passthrough", binary_features)
        ]
    )
    
    # Train / Test Split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, shuffle=True
    )
    print(f"Training split: {X_train.shape[0]} samples | Test split: {X_test.shape[0]} samples.")
    
    # Fit preprocessor on training data
    preprocessor.fit(X_train)
    X_train_trans = preprocessor.transform(X_train)
    X_test_trans = preprocessor.transform(X_test)
    
    # Get feature names after transformation
    cat_feature_names = list(preprocessor.named_transformers_["cat"].get_feature_names_out(categorical_features))
    all_feature_names = cat_feature_names + numeric_features + binary_features
    
    # Define models
    candidate_models = {
        "Linear Regression": LinearRegression(),
        "Decision Tree": DecisionTreeRegressor(max_depth=12, min_samples_split=8, random_state=42),
        "Random Forest": RandomForestRegressor(n_estimators=100, max_depth=16, min_samples_split=6, random_state=42, n_jobs=-1)
    }
    
    model_filenames = {
        "Linear Regression": "linear_regression.joblib",
        "Decision Tree": "decision_tree.joblib",
        "Random Forest": "random_forest.joblib"
    }
    
    metrics_summary = {}
    test_predictions = {}
    trained_estimators = {}
    
    best_model_name = None
    best_r2 = -float("inf")
    
    print("\nStarting model training and evaluation...")
    for name, model in candidate_models.items():
        start_time = time.time()
        model.fit(X_train_trans, y_train)
        train_duration = round(time.time() - start_time, 4)
        
        y_pred = model.predict(X_test_trans)
        
        # Enforce realistic bounds (cannot predict negative spaces)
        y_pred_bounded = np.clip(y_pred, 0, None)
        
        mae = float(round(mean_absolute_error(y_test, y_pred_bounded), 4))
        rmse = float(round(root_mean_squared_error(y_test, y_pred_bounded), 4))
        r2 = float(round(r2_score(y_test, y_pred_bounded), 4))
        mape = float(round(np.mean(np.abs((y_test - y_pred_bounded) / np.maximum(y_test, 1))) * 100, 2))
        
        metrics_summary[name] = {
            "mae": mae,
            "rmse": rmse,
            "r2_score": r2,
            "mape": mape,
            "training_time_seconds": train_duration,
            "filename": model_filenames[name],
            "description": f"Standard {name} trained on {X_train.shape[0]} historical parking records."
        }
        
        test_predictions[name] = y_pred_bounded
        trained_estimators[name] = model
        
        # Save individual model with compression
        model_save_path = os.path.join(output_dir, model_filenames[name])
        joblib.dump(model, model_save_path, compress=3)
        print(f"[{name}] Saved to {model_save_path} -> MAE: {mae}, RMSE: {rmse}, R²: {r2}")
        
        if r2 > best_r2:
            best_r2 = r2
            best_model_name = name

    # Save preprocessor
    preprocessor_path = os.path.join(output_dir, "preprocessor.joblib")
    joblib.dump(preprocessor, preprocessor_path, compress=3)
    print(f"Saved Preprocessor to {preprocessor_path}")
    
    # Save best model copy as best_model.joblib
    best_model_path = os.path.join(output_dir, "best_model.joblib")
    joblib.dump(trained_estimators[best_model_name], best_model_path, compress=3)
    print(f"Best model selected: {best_model_name} (R² = {best_r2}). Saved as {best_model_path}")
    
    # Feature importances for tree-based models
    feature_importances = {}
    if hasattr(trained_estimators["Random Forest"], "feature_importances_"):
        rf_fi = trained_estimators["Random Forest"].feature_importances_
        feature_importances["Random Forest"] = [
            {"feature": all_feature_names[i], "importance": round(float(rf_fi[i]), 4)}
            for i in np.argsort(rf_fi)[::-1]
        ]
    if hasattr(trained_estimators["Decision Tree"], "feature_importances_"):
        dt_fi = trained_estimators["Decision Tree"].feature_importances_
        feature_importances["Decision Tree"] = [
            {"feature": all_feature_names[i], "importance": round(float(dt_fi[i]), 4)}
            for i in np.argsort(dt_fi)[::-1]
        ]
        
    # Sample actual vs predicted for chart (first 80 samples from test set)
    sample_indices = np.arange(len(y_test))[:80]
    sample_actual = y_test.iloc[sample_indices].tolist()
    sample_timestamps = df.iloc[y_test.index[sample_indices]]["timestamp"].tolist()
    sample_locations = df.iloc[y_test.index[sample_indices]]["location_name"].tolist()
    
    sample_chart_data = []
    for idx, i in enumerate(sample_indices):
        sample_chart_data.append({
            "index": idx + 1,
            "timestamp": sample_timestamps[idx],
            "location": sample_locations[idx],
            "actual": int(sample_actual[idx]),
            "linear_regression": round(float(test_predictions["Linear Regression"][i]), 1),
            "decision_tree": round(float(test_predictions["Decision Tree"][i]), 1),
            "random_forest": round(float(test_predictions["Random Forest"][i]), 1)
        })
        
    # Error distribution / residuals for best model
    best_preds = test_predictions[best_model_name]
    residuals = (y_test.values - best_preds)
    hist, bin_edges = np.histogram(residuals, bins=10)
    residual_distribution = [
        {"bin": f"{round(bin_edges[i], 1)} to {round(bin_edges[i+1], 1)}", "count": int(hist[i])}
        for i in range(len(hist))
    ]
    
    # Full metrics package
    output_metadata = {
        "status": "success",
        "trained_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "dataset_records": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "features": feature_cols,
        "transformed_features": all_feature_names,
        "target": target_col,
        "best_model_name": best_model_name,
        "models": metrics_summary,
        "feature_importances": feature_importances,
        "sample_chart_data": sample_chart_data,
        "residual_distribution": residual_distribution
    }
    
    metrics_path = os.path.join(output_dir, "model_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(output_metadata, f, indent=2)
    print(f"Saved authentic evaluation metrics to {metrics_path}")
    print("\nTraining completed successfully!")

if __name__ == "__main__":
    train_and_evaluate()
