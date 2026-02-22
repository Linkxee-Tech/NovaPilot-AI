import logging
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    PROJECT_NAME: str = "NovaPilot AI"
    API_V1_STR: str = "/api/v1"
    DEMO_MODE: bool = False

    # AWS Secrets Manager configuration
    USE_AWS_SECRETS: bool = False
    AWS_SECRET_NAME: str = "novapilot/production"

    # Security
    SECRET_KEY: str = "your-secret-key-for-development"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ENCRYPTION_KEY: str = "467S_L6f5D3x8_4S8L8_4S8L8_4S8L8_4S8L8_4S8L8="

    # Database
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
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"
        )

    # AWS configuration
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_PROFILE: Optional[str] = None

    # AWS Bedrock / Nova
    NOVA_ACT_MODEL_ID: str = "us.amazon.nova-pro-act-v1:0"
    NOVA_TEXT_MODEL_ID: str = "amazon.nova-pro-v1:0"

    # S3 storage
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
        if self.USE_AWS_SECRETS:
            self._load_from_secrets_manager()

    def _load_from_secrets_manager(self) -> None:
        """Load sensitive configuration from AWS Secrets Manager."""
        try:
            from app.core.secrets_manager import get_secrets_manager

            sm = get_secrets_manager()
            secrets = sm.get_secret(self.AWS_SECRET_NAME)

            if not secrets:
                logger.warning(
                    "AWS Secrets Manager enabled but secret was not found; using .env fallback."
                )
                return

            # Security settings
            self.SECRET_KEY = secrets.get("SECRET_KEY", self.SECRET_KEY)
            self.ENCRYPTION_KEY = secrets.get("ENCRYPTION_KEY", self.ENCRYPTION_KEY)

            # Database credentials
            self.POSTGRES_SERVER = secrets.get("POSTGRES_SERVER", self.POSTGRES_SERVER)
            self.POSTGRES_USER = secrets.get("POSTGRES_USER", self.POSTGRES_USER)
            self.POSTGRES_PASSWORD = secrets.get("POSTGRES_PASSWORD", self.POSTGRES_PASSWORD)
            self.POSTGRES_DB = secrets.get("POSTGRES_DB", self.POSTGRES_DB)

            # AWS credentials (optional; IAM role/profile is preferred)
            self.AWS_ACCESS_KEY_ID = secrets.get("AWS_ACCESS_KEY_ID", self.AWS_ACCESS_KEY_ID)
            self.AWS_SECRET_ACCESS_KEY = secrets.get(
                "AWS_SECRET_ACCESS_KEY", self.AWS_SECRET_ACCESS_KEY
            )

            # Redis URL
            self.REDIS_URL = secrets.get("REDIS_URL", self.REDIS_URL)

            logger.info("Loaded configuration from AWS Secrets Manager")
        except Exception as exc:
            logger.warning(
                "Failed to load from AWS Secrets Manager (%s). Using .env fallback.",
                exc,
            )


settings = Settings()
