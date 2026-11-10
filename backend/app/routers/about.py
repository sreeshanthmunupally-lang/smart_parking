from fastapi import APIRouter

router = APIRouter(prefix="/about", tags=["About Project"])

@router.get("")
def get_about_project_info():
    return {
        "title": "SmartPark AI",
        "subtitle": "Smart Parking Availability Prediction and Intelligent Parking Management System Using Machine Learning",
        "problem_statement": (
            "Urban congestion, greenhouse gas emissions, and driver frustration are significantly exacerbated by vehicles "
            "cruising for parking spaces. Conventional parking facilities lack predictive intelligence, causing sudden bottlenecks "
            "during peak commuting and retail hours. SmartPark AI addresses this challenge through automated occupancy forecasting "
            "and real-time slot state management."
        ),
        "project_objectives": [
            "Develop an intelligent end-to-end parking management web platform.",
            "Train, evaluate, and compare three regression algorithms (Linear Regression, Decision Tree, Random Forest).",
            "Automatically identify and deploy the highest-accuracy model based on empirical R² score and RMSE.",
            "Provide interactive parking slot visualization, dynamic reservation simulation, and historical telemetry analytics.",
            "Eliminate heuristic guesswork by integrating pre-trained Scikit-learn pipelines with a modern React + FastAPI architecture."
        ],
        "dataset_description": {
            "source": "SmartPark AI Multi-Hub Historical Sensor & Telemetry Repository",
            "total_records": 21600,
            "granularity": "30-minute intervals over 90 days across 5 unique municipal and commercial parking facilities",
            "features": [
                {"name": "location_id", "type": "Categorical", "description": "Unique identifier for parking garage hub"},
                {"name": "weather_condition", "type": "Categorical", "description": "Atmospheric conditions (Clear, Sunny, Rainy, Overcast)"},
                {"name": "day_of_week", "type": "Numeric (0-6)", "description": "Day index (0=Monday, 6=Sunday)"},
                {"name": "hour", "type": "Numeric (0-23)", "description": "Hour of day (24-hour format)"},
                {"name": "minute", "type": "Numeric (0-59)", "description": "Minute of observation (0 or 30)"},
                {"name": "temperature_c", "type": "Numeric (°C)", "description": "Ambient temperature recorded in degrees Celsius"},
                {"name": "is_weekend", "type": "Binary (0/1)", "description": "Flag indicating Saturday or Sunday"},
                {"name": "is_holiday", "type": "Binary (0/1)", "description": "Flag indicating civic or public holiday"},
                {"name": "is_peak_hour", "type": "Binary (0/1)", "description": "Flag for transit rush or evening retail peak"},
                {"name": "nearby_event", "type": "Binary (0/1)", "description": "Flag for local concerts, stadium games, or conferences"}
            ],
            "target": "occupied_spaces (Integer count, bounded [0, facility capacity])"
        },
        "data_preprocessing": {
            "pipeline": "ColumnTransformer combining OneHotEncoder, StandardScaler, and Passthrough",
            "categorical_encoding": "OneHotEncoder(drop='first', handle_unknown='ignore')",
            "continuous_scaling": "StandardScaler() zero-mean unit-variance transformation",
            "train_test_split": "80% Training (17,280 samples) / 20% Holdout Evaluation (4,320 samples) with fixed random seed"
        },
        "algorithms_used": [
            {
                "name": "Linear Regression",
                "type": "Ordinary Least Squares (OLS)",
                "strengths": "Ultra-fast inference, high baseline interpretability, convex closed-form solution",
                "limitations": "Underfits non-linear hourly and weekend demand fluctuations"
            },
            {
                "name": "Decision Tree Regressor",
                "type": "Non-parametric CART",
                "strengths": "Captures complex piecewise step functions and multi-feature conditional splits",
                "limitations": "Prone to slight variance at leaf boundaries without ensemble averaging"
            },
            {
                "name": "Random Forest Regressor",
                "type": "Bagging Ensemble of 100 De-correlated Trees",
                "strengths": "Highest R² score and lowest generalization error; robust to outlier sensor fluctuations",
                "status": "Selected as Best Model based on test set evaluation"
            }
        ],
        "system_architecture": {
            "frontend": "React 19, TypeScript, Tailwind CSS, Vite, Lucide Icons, Recharts",
            "backend": "Python 3.12, FastAPI, Pydantic v2, Uvicorn, SQLAlchemy",
            "machine_learning": "Scikit-learn, NumPy, Pandas, Joblib",
            "database": "SQLite (zero-configuration, persistent relational store)",
            "communication": "RESTful JSON APIs over HTTP/HTTPS with CORS support"
        },
        "future_enhancements": [
            "Hardware IoT edge nodes using ESP32 ultrasonic and geomagnetic sensors.",
            "Automatic Number Plate Recognition (ANPR) cameras using OpenCV and YOLOv8.",
            "Dynamic congestion-based surge pricing algorithms.",
            "PWA mobile companion app with turn-by-turn navigation directly to the reserved slot."
        ]
    }
