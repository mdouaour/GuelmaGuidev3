from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.db.session import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.activity import Activity, ActivityRegistration
from app.services.stripe_service import create_subscription_checkout_session
from app.core.config import settings

router = APIRouter()

@router.post("/subscribe")
def subscribe_to_pro(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(UserRole.ORGANIZER, UserRole.ADMIN))],
):
    if current_user.organiser_pro:
        return {"detail": "Already a Pro member"}

    success_url = f"{settings.FRONTEND_BASE_URL}/organiser/pro?status=success"
    cancel_url = f"{settings.FRONTEND_BASE_URL}/organiser/pro?status=cancelled"

    try:
        session = create_subscription_checkout_session(
            user_id=current_user.id,
            success_url=success_url,
            cancel_url=cancel_url
        )
        return {"checkout_url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics")
def get_organiser_analytics(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(UserRole.ORGANIZER, UserRole.ADMIN))],
):
    if not current_user.organiser_pro and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Pro subscription required for analytics")

    # Basic analytics: list activities with view count (mocked for now) and registrations
    activities = db.scalars(
        select(Activity).where(Activity.organizer_id == current_user.id)
    ).all()

    analytics_data = []
    for activity in activities:
        reg_count = db.scalar(
            select(func.count(ActivityRegistration.user_id))
            .where(ActivityRegistration.activity_id == activity.id)
        )
        
        # In a real app, views would be tracked in a separate table
        # For this demo, we'll use a deterministic mock based on activity ID
        mock_views = (activity.id * 17) % 500 + reg_count + 10
        
        analytics_data.append({
            "activity_id": activity.id,
            "title": activity.title,
            "registrations": reg_count,
            "views": mock_views,
            "conversion_rate": round((reg_count / mock_views) * 100, 1) if mock_views > 0 else 0
        })

    return analytics_data
