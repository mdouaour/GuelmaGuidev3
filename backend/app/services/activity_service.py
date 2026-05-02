from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload, joinedload

from app.models import Activity, ActivityRegistration, Place
from app.models.place import PlaceCategory
from app.schemas.activity import ActivityCreate


class ActivityError(Exception):
    pass


class ActivityNotFoundError(ActivityError):
    pass


class InvalidPlaceError(ActivityError):
    pass


class DuplicateRegistrationError(ActivityError):
    pass


class ActivityFullError(ActivityError):
    pass


def list_activities(db: Session) -> list[Activity]:
    statement = (
        select(Activity)
        .options(selectinload(Activity.place), selectinload(Activity.organizer))
        .order_by(Activity.date_time.asc())
    )
    return list(db.scalars(statement))


def list_activities_with_counts(
    db: Session,
    *,
    date_filter: date | None = None,
    place_id: int | None = None,
    availability_only: bool = False,
    category: PlaceCategory | None = None,
    mood: str | None = None,
    include_non_public: bool = False,
    page: int | None = None,
    limit: int = 20,
) -> tuple[list[tuple[Activity, int]], int]:
    registrations_subquery = (
        select(
            ActivityRegistration.activity_id.label("activity_id"),
            func.count(ActivityRegistration.user_id).label("participants_count"),
        )
        .group_by(ActivityRegistration.activity_id)
        .subquery()
    )

    participants_count = func.coalesce(registrations_subquery.c.participants_count, 0)
    statement = (
        select(Activity, participants_count.label("participants_count"))
        .options(selectinload(Activity.place), selectinload(Activity.organizer))
        .join(Place, Place.id == Activity.place_id)
        .outerjoin(registrations_subquery, registrations_subquery.c.activity_id == Activity.id)
    )

    if not include_non_public:
        statement = statement.where(
            Activity.approval_status == "approved",
            Activity.visibility == "public",
        )
    if date_filter is not None:
        day_start = datetime.combine(date_filter, time.min, tzinfo=UTC)
        day_end = day_start + timedelta(days=1)
        statement = statement.where(Activity.date_time >= day_start, Activity.date_time < day_end)
    if place_id is not None:
        statement = statement.where(Activity.place_id == place_id)
    if category is not None:
        statement = statement.where(Place.category == category)
    if mood is not None:
        statement = statement.where(Activity.mood == mood)
    if availability_only:
        statement = statement.where(participants_count < Activity.max_participants)

    statement = statement.order_by(Activity.is_featured.desc(), Activity.date_time.asc())
    total = int(db.scalar(select(func.count()).select_from(statement.subquery())) or 0)

    if page is not None:
        statement = statement.offset((page - 1) * limit).limit(limit)

    rows = db.execute(statement).all()
    return [(activity, int(count)) for activity, count in rows], total


def get_activity_by_id(db: Session, activity_id: int) -> Activity | None:
    statement = (
        select(Activity)
        .options(joinedload(Activity.place), joinedload(Activity.organizer))
        .where(Activity.id == activity_id)
    )
    return db.scalar(statement)


def get_activity_participants_count(db: Session, activity_id: int) -> int:
    return int(
        db.scalar(
            select(func.count(ActivityRegistration.user_id)).where(
                ActivityRegistration.activity_id == activity_id
            )
        )
        or 0
    )


def get_activity_participants_counts(db: Session, activity_ids: list[int]) -> dict[int, int]:
    if not activity_ids:
        return {}
    statement = (
        select(
            ActivityRegistration.activity_id,
            func.count(ActivityRegistration.user_id),
        )
        .where(ActivityRegistration.activity_id.in_(activity_ids))
        .group_by(ActivityRegistration.activity_id)
    )
    return {int(activity_id): int(total) for activity_id, total in db.execute(statement).all()}


def create_activity(db: Session, payload: ActivityCreate, organizer_id: int) -> Activity:
    place = db.get(Place, payload.place_id)
    if place is None:
        raise InvalidPlaceError("Invalid place_id")

    activity = Activity(
        title=payload.title,
        description=payload.description,
        place_id=payload.place_id,
        date_time=payload.date_time,
        max_participants=payload.max_participants,
        mood=payload.mood,
        visibility=payload.visibility,
        organizer_id=organizer_id,
        price_per_ticket=payload.price_per_ticket,
        currency=payload.currency,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


def join_activity(db: Session, activity_id: int, user_id: int, stripe_session_id: str | None = None, payment_status: str | None = None) -> ActivityRegistration:
    activity = db.scalar(select(Activity).where(Activity.id == activity_id).with_for_update())
    if activity is None:
        raise ActivityNotFoundError("Activity not found")

    existing = db.get(ActivityRegistration, (user_id, activity_id))
    if existing is not None:
        # If it was pending and we now have a paid session, update it
        if payment_status == "paid" and existing.payment_status != "paid":
            existing.payment_status = "paid"
            existing.stripe_session_id = stripe_session_id
            db.commit()
            db.refresh(existing)
            return existing
        raise DuplicateRegistrationError("User already joined this activity")

    participants_count = get_activity_participants_count(db, activity_id)
    if participants_count >= activity.max_participants:
        raise ActivityFullError("Activity is full")

    # Determine default payment status if not provided
    if payment_status is None:
        payment_status = "free" if not activity.price_per_ticket else "pending"

    registration = ActivityRegistration(
        user_id=user_id, 
        activity_id=activity_id, 
        stripe_session_id=stripe_session_id,
        payment_status=payment_status
    )
    db.add(registration)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateRegistrationError("User already joined this activity")
    db.refresh(registration)
    return registration


def leave_activity(db: Session, activity_id: int, user_id: int) -> bool:
    registration = db.get(ActivityRegistration, (user_id, activity_id))
    if registration is None:
        return False
    db.delete(registration)
    db.commit()
    return True


def cancel_activity(db: Session, activity_id: int, organizer_id: int) -> Activity:
    activity = get_activity_by_id(db, activity_id)
    if activity is None:
        raise ActivityNotFoundError("Activity not found")
    if activity.organizer_id != organizer_id:
        raise ActivityError("Only the organizer can cancel the activity")
    
    activity.status = "cancelled"
    activity.approval_status = "cancelled"  # Also set approval status just in case
    db.commit()
    db.refresh(activity)
    return activity


def list_user_joined_activities(db: Session, user_id: int) -> list[tuple[Activity, ActivityRegistration]]:
    statement = (
        select(Activity, ActivityRegistration)
        .options(selectinload(Activity.place), selectinload(Activity.organizer))
        .join(ActivityRegistration, ActivityRegistration.activity_id == Activity.id)
        .where(ActivityRegistration.user_id == user_id)
        .order_by(Activity.date_time.asc())
    )
    results = db.execute(statement).all()
    return [(activity, reg) for activity, reg in results]
