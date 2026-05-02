from functools import lru_cache
from typing import Any
from urllib.parse import urlparse

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "Guelma Guide API"
    PROJECT_VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"
    APP_ENV: str = "production"
    BACKEND_CORS_ORIGINS: list[str] = Field(default_factory=list)
    JWT_SECRET_KEY: str = Field(..., min_length=32)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/guelma_guide"
    )
    REDIS_URL: str | None = None
    REDIS_CACHE_TTL_SECONDS: int = 120
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    RATE_LIMIT_LOGIN_PER_WINDOW: int = 10
    RATE_LIMIT_REGISTER_PER_WINDOW: int = 10
    RATE_LIMIT_AI_PER_WINDOW: int = 30

    AI_API_KEY: str | None = None
    MAPS_API_KEY: str | None = None
    RESEND_API_KEY: str | None = None
    RESEND_FROM_ADDRESS: str = "Guelma Guide <noreply@guelma.guide>"
    SENTRY_DSN: str | None = None
    # Used to build the password-reset link sent via email, e.g. https://guelma.guide
    FRONTEND_BASE_URL: str = "http://localhost:3000"
    
    # R2 Storage
    R2_ACCOUNT_ID: str | None = None
    R2_ACCESS_KEY_ID: str | None = None
    R2_SECRET_ACCESS_KEY: str | None = None
    R2_BUCKET_NAME: str | None = None
    NEXT_PUBLIC_R2_PUBLIC_URL: str | None = None

    # Stripe
    STRIPE_SECRET_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None
    STRIPE_PRO_PRICE_ID: str | None = None

    # Google OAuth
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/api/v1/auth/google/callback"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> list[str]:
        if value is None:
            return []
        if isinstance(value, str):
            origins = [origin.strip() for origin in value.split(",") if origin.strip()]
        elif isinstance(value, list):
            origins = [str(origin).strip() for origin in value if str(origin).strip()]
        else:
            raise ValueError("BACKEND_CORS_ORIGINS must be a comma-separated string or list")

        for origin in origins:
            parsed = urlparse(origin)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                raise ValueError(
                    f"Invalid CORS origin '{origin}'. Use full URLs like https://your-frontend.vercel.app"
                )
        return origins


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
