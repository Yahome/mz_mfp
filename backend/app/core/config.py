import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "TCM Outpatient MFP System"
    API_V1_STR: str = "/api"
    
    # Database
    # Main Database (MySQL/SQLite)
    DATABASE_URL: str = "sqlite:///./mz_mfp.db"
    
    # External Databases (Read-Only Views)
    # If not set, the system uses the Mock Adapter
    HIS_DATABASE_URI: str | None = os.getenv("HIS_DATABASE_URL", None)
    EMR_DATABASE_URI: str | None = os.getenv("EMR_DATABASE_URL", None)
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "development_secret_key_change_me")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 4  # 4 hours
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
