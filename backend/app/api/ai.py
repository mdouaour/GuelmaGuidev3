from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limiter import rate_limit_dependency
from app.core.security import get_optional_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.ai import RecommendationsResponse, TimeOfDay
from app.services.ai_service import get_recommendations

router = APIRouter()

ai_rate_limit = rate_limit_dependency(
    "ai:recommendations",
    limit=settings.RATE_LIMIT_AI_PER_WINDOW,
    window_seconds=settings.RATE_LIMIT_WINDOW_SECONDS,
)


@router.get("/recommendations", response_model=RecommendationsResponse)
def recommendations(
    latitude: Annotated[float, Query(ge=-90, le=90)],
    longitude: Annotated[float, Query(ge=-180, le=180)],
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_optional_current_user)],
    _rate_limit: None = Depends(ai_rate_limit),
    category: Annotated[str | None, Query()] = None,
    time_of_day: Annotated[TimeOfDay | None, Query()] = None,
) -> RecommendationsResponse:
    return get_recommendations(
        db,
        latitude=latitude,
        longitude=longitude,
        category=category,
        time_of_day=time_of_day,
        current_user_id=current_user.id if current_user else None,
    )
