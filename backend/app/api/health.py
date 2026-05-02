from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.core.cache import get_redis_client

from app.core.config import settings

router = APIRouter()

@router.get("/")
def health_check(db: Session = Depends(get_db)) -> dict:
    health_status = {
        "status": "ok",
        "version": settings.PROJECT_VERSION,
        "environment": settings.APP_ENV,
        "database": "down",
        "redis": "down"
    }
    
    # Check Database
    try:
        db.execute(text("SELECT 1"))
        health_status["database"] = "ok"
    except Exception:
        health_status["status"] = "error"
        
    # Check Redis
    try:
        redis_client = get_redis_client()
        if redis_client and redis_client.ping():
            health_status["redis"] = "ok"
    except Exception:
        health_status["status"] = "error"
        
    return health_status
