from typing import Any
import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

from contextlib import asynccontextmanager
from arq import create_pool
from arq.connections import RedisSettings

from app.api.router import api_router
from app.core.config import settings
from app.core.logging import setup_logging, LoggingMiddleware

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[
            StarletteIntegration(),
            FastApiIntegration(),
        ],
        environment=settings.APP_ENV,
        traces_sample_rate=1.0,
    )

setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    if settings.REDIS_URL:
        app.state.arq_pool = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    else:
        app.state.arq_pool = None
    
    yield
    
    # Shutdown
    if app.state.arq_pool:
        await app.state.arq_pool.close()

app = FastAPI(
    title=settings.PROJECT_NAME, 
    version=settings.PROJECT_VERSION,
    lifespan=lifespan
)

app.add_middleware(SessionMiddleware, secret_key=settings.JWT_SECRET_KEY)
app.add_middleware(LoggingMiddleware)

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


from sqlalchemy import text
from app.db.session import engine

@app.get("/health", tags=["health"])
async def health_check() -> dict[str, Any]:
    health_status: dict[str, Any] = {
        "status": "ok",
        "version": settings.PROJECT_VERSION,
        "environment": settings.APP_ENV,
        "services": {
            "database": "unknown",
            "redis": "unknown"
        }
    }
    
    # Check Database
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        health_status["services"]["database"] = "connected"
    except Exception as e:
        health_status["status"] = "error"
        health_status["services"]["database"] = f"error: {str(e)}"
        
    # Check Redis
    if settings.REDIS_URL:
        try:
            if app.state.arq_pool:
                await app.state.arq_pool.ping()
                health_status["services"]["redis"] = "connected"
            else:
                health_status["services"]["redis"] = "not_initialized"
        except Exception as e:
            health_status["status"] = "error"
            health_status["services"]["redis"] = f"error: {str(e)}"
    else:
        health_status["services"]["redis"] = "disabled"
        
    return health_status


app.include_router(api_router, prefix=settings.API_V1_PREFIX)
