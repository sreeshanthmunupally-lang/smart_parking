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

    class Config:
        case_sensitive = True

settings = Settings()

