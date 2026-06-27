import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.session import get_db
from app.models.feedback import Feedback
from app.models.review import PlaceReview
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)


class FeedbackCreate(BaseModel):
    subject: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1, max_length=5000)


@router.get("/leaderboard")
def get_leaderboard(
    db: Annotated[Session, Depends(get_db)],
    request: Request,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Return community leaderboard ordered by contribution points."""
    stmt = (
        select(
            User.id,
            User.full_name,
            User.email,
            User.role,
            func.count(PlaceReview.id).label("review_count"),
        )
        .outerjoin(PlaceReview, PlaceReview.user_id == User.id)
        .group_by(User.id)
        .order_by(func.count(PlaceReview.id).desc())
        .offset(offset)
        .limit(limit)
    )
    rows = db.execute(stmt).all()

    results = []
    for row in rows:
        results.append({
            "id": row.id,
            "name": row.full_name or row.email,
            "points": (row.review_count or 0) * 10,
            "role": row.role,
        })

    return results


@router.post("/feedback", status_code=status.HTTP_201_CREATED)
def create_feedback(
    body: FeedbackCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Submit feedback from authenticated user."""
    feedback = Feedback(
        user_id=current_user.id,
        subject=body.subject,
        message=body.message,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return {"success": True}
