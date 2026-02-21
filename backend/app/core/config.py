from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "NovaPilot AI"
    API_V1_STR: str = "/api/v1"
    DEMO_MODE: bool = False
    
    # AWS Secrets Manager Configuration
    USE_AWS_SECRETS: bool = False  # Set to True in production
    AWS_SECRET_NAME: str = "novapilot/production"  # Secret name in AWS Secrets Manager
    
    # Security - Will be fetched from AWS Secrets Manager if USE_AWS_SECRETS=True
    SECRET_KEY: str = "your-secret-key-for-development"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ENCRYPTION_KEY: str = "467S_L6f5D3x8_4S8L8_4S8L8_4S8L8_4S8L8_4S8L8="  # Fernet key
    
    # Database - Will be fetched from AWS Secrets Manager if USE_AWS_SECRETS=True
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "novapilot"
    DATABASE_URL: Optional[str] = None
    USE_SQLITE: bool = False

    @property
    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        
        if self.USE_SQLITE:
             return "sqlite:///./sql_app.db"
             
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"

    # AWS Configuration
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_PROFILE: Optional[str] = None
    
    # AWS Bedrock / Nova
    NOVA_ACT_MODEL_ID: str = "us.amazon.nova-pro-act-v1:0"
    NOVA_TEXT_MODEL_ID: str = "amazon.nova-pro-v1:0"
    
    # S3 Storage
    S3_BUCKET_NAME: str = "novapilot-media"
    
    # Monitoring
    XRAY_ENABLED: bool = False
    
    # Redis for Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
    )
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Fetch secrets from AWS Secrets Manager if enabled
        if self.USE_AWS_SECRETS:
            self._load_from_secrets_manager()
    
    def _load_from_secrets_manager(self):
        """Load sensitive configuration from AWS Secrets Manager."""
        try:
            from app.core.secrets_manager import get_secrets_manager
            
            sm = get_secrets_manager()
            secrets = sm.get_secret(self.AWS_SECRET_NAME)
            
            if secrets:
                # Update security settings
                self.SECRET_KEY = secrets.get("SECRET_KEY", self.SECRET_KEY)
                self.ENCRYPTION_KEY = secrets.get("ENCRYPTION_KEY", self.ENCRYPTION_KEY)
                
                # Update database credentials
                self.POSTGRES_SERVER = secrets.get("POSTGRES_SERVER", self.POSTGRES_SERVER)
                self.POSTGRES_USER = secrets.get("POSTGRES_USER", self.POSTGRES_USER)
                self.POSTGRES_PASSWORD = secrets.get("POSTGRES_PASSWORD", self.POSTGRES_PASSWORD)
                self.POSTGRES_DB = secrets.get("POSTGRES_DB", self.POSTGRES_DB)
                
                # Update AWS credentials if provided
                self.AWS_ACCESS_KEY_ID = secrets.get("AWS_ACCESS_KEY_ID", self.AWS_ACCESS_KEY_ID)
                self.AWS_SECRET_ACCESS_KEY = secrets.get("AWS_SECRET_ACCESS_KEY", self.AWS_SECRET_ACCESS_KEY)
                
                # Update Redis URL if provided
                self.REDIS_URL = secrets.get("REDIS_URL", self.REDIS_URL)
                
                print("✅ Loaded configuration from AWS Secrets Manager")
            else:
                print("⚠️ AWS Secrets Manager enabled but secrets not found, using .env fallback")
                
        except Exception as e:
            print(f"⚠️ Failed to load from AWS Secrets Manager: {e}. Using .env fallback")

settings = Settings()

