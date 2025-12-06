from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Any
import os
from pathlib import Path

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).parent.parent.parent / ".env"),
        case_sensitive=True,
        extra="ignore"
    )
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    ENVIRONMENT: str = "development"
    
    # GCP
    GCP_PROJECT_ID: str
    GCP_REGION: str = "us-central1"
    GCS_BUCKET_NAME: str
    
    # Cloud SQL PostgreSQL
    DB_INSTANCE_CONNECTION_NAME: str  # projeto:região:instância
    DB_NAME: str = "crm_juridico"
    DB_USER: str = "postgres"
    DB_PASSWORD: str
    DB_HOST: str = "localhost"  # Para dev local
    DB_PORT: int = 5432

    # Redis Cache
    REDIS_ENABLED: bool = True
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str | None = None
    REDIS_MAX_CONNECTIONS: int = 10
    REDIS_SOCKET_TIMEOUT: int = 5
    REDIS_CONNECT_TIMEOUT: int = 5
    REDIS_DEFAULT_TTL: int = 300

    @property
    def REDIS_URL(self) -> str:
        """Retorna URL de conexão do Redis"""
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # Firebase (mantém Auth e Storage)
    FIREBASE_API_KEY: str
    FIREBASE_AUTH_DOMAIN: str
    FIREBASE_PROJECT_ID: str
    
    # Security
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 86400
    
    # CORS - usando str para evitar problema com parsing JSON
    ALLOWED_ORIGINS: str = "http://localhost:5173"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Retorna ALLOWED_ORIGINS como lista"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
    
    @property
    def database_url(self) -> str:
        """Retorna URL de conexão do banco de dados"""
        if self.ENVIRONMENT == "production":
            # Cloud SQL via Unix socket
            return f"postgresql+psycopg2://{self.DB_USER}:{self.DB_PASSWORD}@/{self.DB_NAME}?host=/cloudsql/{self.DB_INSTANCE_CONNECTION_NAME}"
        else:
            # PostgreSQL local para desenvolvimento
            return f"postgresql+psycopg2://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    @property
    def async_database_url(self) -> str:
        """Retorna URL assíncrona de conexão do banco de dados"""
        if self.ENVIRONMENT == "production":
            return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@/{self.DB_NAME}?host=/cloudsql/{self.DB_INSTANCE_CONNECTION_NAME}"
        else:
            return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    # Cache
    CACHE_TTL: int = 300
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Sentry
    SENTRY_DSN: str | None = None
    SENTRY_ENVIRONMENT: str = "development"
    SENTRY_TRACES_SAMPLE_RATE: float = 1.0

settings = Settings()
