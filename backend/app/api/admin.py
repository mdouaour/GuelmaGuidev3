from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.db.session import get_db
from app.models.activity import Activity
from app.models.place import Place
from app.models.user import User, UserRole
from app.schemas.activity import ActivityRead, PaginatedActivitiesResponse, to_activity_read
from app.schemas.user import UserRead
from app.schemas.admin import AdminStats
from app.services.activity_service import (
    get_activity_by_id,
    get_activity_participants_count,
    list_activities_with_counts,
)

router = APIRouter()

admin_required = require_roles(UserRole.ADMIN)


def _to_activity_read_admin(db: Session, activity: Activity) -> ActivityRead:
    place_name = activity.place.name if activity.place else ""
    organizer_verified = activity.organizer.organizer_verified if activity.organizer else False
    return to_activity_read(
        activity,
        get_activity_participants_count(db, activity.id),
        place_name=place_name,
        organizer_verified=organizer_verified,
    )


@router.get("/activities", response_model=PaginatedActivitiesResponse)
def admin_list_activities(
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[User, Depends(admin_required)],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> PaginatedActivitiesResponse:
    rows, total = list_activities_with_counts(
        db,
        include_non_public=True,
        page=page,
        limit=limit,
    )
    results = [
        to_activity_read(
            activity,
            count,
            place_name=activity.place.name if activity.place else "",
            organizer_verified=activity.organizer.organizer_verified if activity.organizer else False,
        )
        for activity, count in rows
    ]
    return PaginatedActivitiesResponse(total=total, page=page, limit=limit, results=results)


@router.patch("/activities/{activity_id}/approve", response_model=ActivityRead)
def admin_approve_activity(
    activity_id: int,
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[User, Depends(admin_required)],
) -> ActivityRead:
    activity = get_activity_by_id(db, activity_id)
    if activity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    activity.approval_status = "approved"
    db.commit()
    db.refresh(activity)
    return _to_activity_read_admin(db, activity)


@router.patch("/activities/{activity_id}/reject", response_model=ActivityRead)
def admin_reject_activity(
    activity_id: int,
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[User, Depends(admin_required)],
    reason: Annotated[str | None, Body(embed=True)] = None,
) -> ActivityRead:
    activity = get_activity_by_id(db, activity_id)
    if activity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    activity.approval_status = "rejected"
    activity.rejection_reason = reason
    db.commit()
    db.refresh(activity)
    return _to_activity_read_admin(db, activity)


@router.get("/stats", response_model=AdminStats)
def admin_get_stats(
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[User, Depends(admin_required)],
) -> AdminStats:
    total_users = db.scalar(select(func.count(User.id))) or 0
    total_places = db.scalar(select(func.count(Place.id))) or 0
    total_activities = db.scalar(select(func.count(Activity.id))) or 0
    
    first_day_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_activities = db.scalar(
        select(func.count(Activity.id)).where(Activity.created_at >= first_day_of_month)
    ) or 0
    
    return AdminStats(
        total_users=total_users,
        total_places=total_places,
        total_activities=total_activities,
        activities_this_month=month_activities
    )


@router.get("/users", response_model=list[UserRead])
def admin_list_users(
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[User, Depends(admin_required)],
) -> list[UserRead]:
    users = list(db.scalars(select(User).order_by(User.created_at.asc())))
    return [UserRead.model_validate(user) for user in users]


@router.patch("/users/{user_id}/verify-organizer", response_model=UserRead)
def admin_verify_organizer(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[User, Depends(admin_required)],
) -> UserRead:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.organizer_verified = True
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)


@router.patch("/users/{user_id}/promote", response_model=UserRead)
def admin_promote_user(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[User, Depends(admin_required)],
) -> UserRead:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.role = UserRole.ORGANIZER
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)


@router.patch("/users/{user_id}/demote", response_model=UserRead)
def admin_demote_user(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[User, Depends(admin_required)],
) -> UserRead:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.role = UserRole.VISITOR
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)
