import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SMARTPARK AI"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite:///./smartpark.db"
    
    # Base paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ROOT_DIR: str = os.path.dirname(BASE_DIR)
    MODELS_DIR: str = os.path.join(ROOT_DIR, "models")
    DATA_DIR: str = os.path.join(ROOT_DIR, "data")
    
    # ML model files
    LINEAR_REGRESSION_FILE: str = os.path.join(MODELS_DIR, "linear_regression.joblib")
    DECISION_TREE_FILE: str = os.path.join(MODELS_DIR, "decision_tree.joblib")
    RANDOM_FOREST_FILE: str = os.path.join(MODELS_DIR, "random_forest.joblib")
    BEST_MODEL_FILE: str = os.path.join(MODELS_DIR, "best_model.joblib")
    PREPROCESSOR_FILE: str = os.path.join(MODELS_DIR, "preprocessor.joblib")
    METRICS_FILE: str = os.path.join(MODELS_DIR, "model_metrics.json")
    
    # Dataset file
    DATASET_FILE: str = os.path.join(DATA_DIR, "smart_parking_dataset.csv")

    # Security & Admin Authentication
    JWT_SECRET: str = os.getenv("JWT_SECRET", "smartpark-ai-secure-jwt-secret-key-32-chars-long-2026!")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours
    
    # Initial Administrator Credentials (used for initial setup, can be configured via environment)
    INITIAL_ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
    INITIAL_ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "Admin@SmartPark2026!")
    INITIAL_ADMIN_NAME: str = os.getenv("ADMIN_NAME", "Facility Director")

    class Config:
        case_sensitive = True

settings = Settings()
