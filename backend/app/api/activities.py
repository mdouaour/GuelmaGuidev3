from datetime import date, datetime, timedelta, UTC
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.api.deps import ArqPool
from app.core.cache import get_cached_json, invalidate_cache_prefix, set_cached_json
from app.core.config import settings
from app.core.security import get_current_user, require_roles
from app.db.session import get_db
from app.models import Activity, User, UserRole
from app.models.place import PlaceCategory
from app.schemas.activity import (
    ActivityCreate,
    ActivityRead,
    ActivityRegistrationRead,
    JoinActivityResponse,
    PaginatedActivitiesResponse,
    to_activity_read,
)
from app.services.activity_service import (
    ActivityError,
    ActivityFullError,
    ActivityNotFoundError,
    DuplicateRegistrationError,
    InvalidPlaceError,
    cancel_activity,
    create_activity,
    get_activity_by_id,
    get_activity_participants_count,
    join_activity,
    leave_activity,
    list_activities_with_counts,
)
from app.services.stripe_service import create_checkout_session
from app.utils.localization import get_preferred_language

router = APIRouter()
logger = logging.getLogger(__name__)


def _get_localized_place_name(place, lang: str) -> str:
    if not place:
        return ""
    if lang == "ar" and place.name_ar:
        return place.name_ar
    if lang == "en" and place.name_en:
        return place.name_en
    return place.name


def _to_activity_read(db: Session, activity: Activity, lang: str = "en") -> ActivityRead:
    place_name = _get_localized_place_name(activity.place, lang)
    organizer_verified = activity.organizer.organizer_verified if activity.organizer else False
    return to_activity_read(
        activity,
        get_activity_participants_count(db, activity.id),
        place_name=place_name,
        organizer_verified=organizer_verified,
    )


@router.post("", response_model=ActivityRead, status_code=status.HTTP_201_CREATED)
def create_new_activity(
    payload: ActivityCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(UserRole.ORGANIZER))],
    accept_language: Annotated[str | None, Header()] = None,
) -> ActivityRead:
    # Enforce limit for non-pro organisers (3 activities per month)
    if not current_user.organiser_pro and current_user.role != UserRole.ADMIN:
        now = datetime.now(UTC)
        start_of_month = datetime(now.year, now.month, 1, tzinfo=UTC)
        activity_count = db.scalar(
            select(func.count(Activity.id))
            .where(Activity.organizer_id == current_user.id)
            .where(Activity.created_at >= start_of_month)
        )
        if activity_count >= 3:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Monthly activity limit reached. Upgrade to Pro for unlimited activities."
            )

    try:
        activity = create_activity(db, payload, organizer_id=current_user.id)
        # Pro users get their activities featured by default for now or can select it
        if current_user.organiser_pro:
            activity.is_featured = True
            db.add(activity)
            db.commit()
    except InvalidPlaceError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    invalidate_cache_prefix("activities:")
    lang = get_preferred_language(accept_language)
    return _to_activity_read(db, activity, lang)


@router.get("", response_model=PaginatedActivitiesResponse)
def get_activities(
    db: Annotated[Session, Depends(get_db)],
    accept_language: Annotated[str | None, Header()] = None,
    date_filter: Annotated[date | None, Query(alias="date")] = None,
    place: Annotated[int | None, Query(ge=1)] = None,
    availability: Annotated[bool, Query()] = False,
    category: Annotated[PlaceCategory | None, Query()] = None,
    mood: Annotated[str | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> PaginatedActivitiesResponse:
    lang = get_preferred_language(accept_language)
    cache_key = (
        "activities:list:"
        f"lang={lang}:"
        f"date={date_filter}:place={place}:availability={availability}:"
        f"category={category.value if category else ''}:mood={mood or ''}:"
        f"page={page}:limit={limit}"
    )
    cached = get_cached_json(cache_key)
    if cached is not None:
        return PaginatedActivitiesResponse.model_validate(cached)

    rows, total = list_activities_with_counts(
        db,
        date_filter=date_filter,
        place_id=place,
        availability_only=availability,
        category=category,
        mood=mood,
        include_non_public=False,
        page=page,
        limit=limit,
    )
    results = [
        to_activity_read(
            activity,
            participants_count,
            place_name=_get_localized_place_name(activity.place, lang),
            organizer_verified=activity.organizer.organizer_verified if activity.organizer else False,
        )
        for activity, participants_count in rows
    ]
    response_payload = PaginatedActivitiesResponse(
        total=total, page=page, limit=limit, results=results
    )
    set_cached_json(
        cache_key, response_payload.model_dump(mode="json"), settings.REDIS_CACHE_TTL_SECONDS
    )
    return response_payload


@router.get("/{activity_id}", response_model=ActivityRead)
def get_activity(
    activity_id: int,
    db: Annotated[Session, Depends(get_db)],
    accept_language: Annotated[str | None, Header()] = None,
) -> ActivityRead:
    lang = get_preferred_language(accept_language)
    activity = get_activity_by_id(db, activity_id)
    if activity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    return _to_activity_read(db, activity, lang)


@router.post("/{activity_id}/checkout")
def create_activity_checkout(
    activity_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    activity = get_activity_by_id(db, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    if not activity.price_per_ticket:
        raise HTTPException(status_code=400, detail="This activity is free")
        
    participants_count = get_activity_participants_count(db, activity_id)
    if participants_count >= activity.max_participants:
        raise HTTPException(status_code=409, detail="Activity is full")

    # Success/Cancel URLs should ideally be provided by the frontend or built from settings
    success_url = f"{settings.FRONTEND_BASE_URL}/profile?payment=success&activity_id={activity_id}"
    cancel_url = f"{settings.FRONTEND_BASE_URL}/discover?payment=cancelled"
    
    try:
        session = create_checkout_session(
            activity_id=activity_id,
            user_id=current_user.id,
            amount=float(activity.price_per_ticket),
            currency=activity.currency,
            title=activity.title,
            success_url=success_url,
            cancel_url=cancel_url
        )
        return {"checkout_url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{activity_id}/join", response_model=JoinActivityResponse)
async def join_activity_endpoint(
    activity_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    arq_pool: ArqPool,
) -> JoinActivityResponse:
    activity = get_activity_by_id(db, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # If it's a paid activity, redirected to checkout flow
    if activity.price_per_ticket and activity.price_per_ticket > 0:
        checkout = create_activity_checkout(activity_id, db, current_user)
        return JoinActivityResponse(
            is_paid=True,
            checkout_url=checkout["checkout_url"]
        )

    try:
        registration = join_activity(db, activity_id=activity_id, user_id=current_user.id)
        
        activity_obj = registration.activity
        reminder_time = activity_obj.date_time - timedelta(hours=24)
        
        if arq_pool:
            if reminder_time > datetime.now(UTC):
                await arq_pool.enqueue_job(
                    "send_activity_reminder", 
                    current_user.id, 
                    activity_id, 
                    _defer_until=reminder_time
                )
            else:
                logger.info("Activity %d starts in less than 24h, skipping scheduled reminder", activity_id)

    except ActivityNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except DuplicateRegistrationError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except ActivityFullError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    invalidate_cache_prefix("activities:")
    return JoinActivityResponse(
        is_paid=False,
        registration=ActivityRegistrationRead.model_validate(registration)
    )


@router.delete("/{activity_id}/leave", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def leave_activity_endpoint(
    activity_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Response:
    left = leave_activity(db, activity_id=activity_id, user_id=current_user.id)
    if not left:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found for this activity",
        )
    invalidate_cache_prefix("activities:")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/{activity_id}/cancel", response_model=ActivityRead)
async def cancel_activity_endpoint(
    activity_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    arq_pool: ArqPool,
    accept_language: Annotated[str | None, Header()] = None,
) -> ActivityRead:
    try:
        activity = cancel_activity(db, activity_id=activity_id, organizer_id=current_user.id)
        
        # Notify all participants via worker
        if arq_pool:
            await arq_pool.enqueue_job("send_activity_cancellation", activity_id)
            
    except ActivityNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ActivityError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    
    invalidate_cache_prefix("activities:")
    lang = get_preferred_language(accept_language)
    return _to_activity_read(db, activity, lang)
