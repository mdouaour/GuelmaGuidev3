from collections import Counter
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Activity, ActivityRegistration, Place
from app.models.place import PlaceCategory
from app.schemas.ai import (
    RecommendedActivity,
    RecommendedPlace,
    RecommendationsResponse,
    TimeOfDay,
)
from app.services.activity_service import get_activity_participants_counts
from app.services.place_service import calculate_distance_km, list_nearby_places, list_places

MAX_PLACE_RESULTS = 6
MAX_ACTIVITY_RESULTS = 6
PLACE_NEARBY_RADIUS_KM = 60.0
SECONDS_PER_HOUR = 3600.0
DIVERSIFY_TOP_N = 3
DIVERSIFY_KEEP_HEAD = 2

PLACE_BASE_DISTANCE_SCORE = 60.0
PLACE_DISTANCE_PENALTY_PER_KM = 2.0
PLACE_CATEGORY_MATCH_BONUS = 25.0
PLACE_TIME_MATCH_BONUS = 8.0
PLACE_HISTORY_MATCH_PER_EVENT = 3.0
PLACE_HISTORY_MATCH_MAX = 12.0

ACTIVITY_BASE_DISTANCE_SCORE = 45.0
ACTIVITY_DISTANCE_PENALTY_PER_KM = 1.5
ACTIVITY_SOON_BONUS_MAX = 20.0
ACTIVITY_SOON_HOURS_FACTOR = 2.0
ACTIVITY_CATEGORY_MATCH_BONUS = 25.0
ACTIVITY_TIME_MATCH_BONUS = 12.0
ACTIVITY_HISTORY_MATCH_PER_EVENT = 3.0
ACTIVITY_HISTORY_MATCH_MAX = 12.0
ACTIVITY_NOT_JOINED_BONUS = 8.0
ACTIVITY_ALREADY_JOINED_PENALTY = 20.0

TIME_CATEGORY_PREFERENCES: dict[TimeOfDay, set[str]] = {
    TimeOfDay.MORNING: {"nature", "sports"},
    TimeOfDay.AFTERNOON: {"culture", "sports", "nature"},
    TimeOfDay.EVENING: {"culture", "thermal_baths"},
}


def _normalize_category(category: str | PlaceCategory | None) -> str | None:
    if category is None:
        return None
    return category.value if isinstance(category, PlaceCategory) else category.strip().lower()


def _activity_time_of_day(value: datetime) -> TimeOfDay:
    activity_hour = value.astimezone().hour if value.tzinfo is not None else value.hour
    if activity_hour < 12:
        return TimeOfDay.MORNING
    if activity_hour < 18:
        return TimeOfDay.AFTERNOON
    return TimeOfDay.EVENING


def _ensure_utc_aware(value: datetime) -> datetime:
    """Normalize datetimes to UTC; naive datetimes are treated as UTC by convention."""
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _user_history_profile(db: Session, user_id: int) -> tuple[set[int], Counter[str]]:
    joined_ids_statement = select(ActivityRegistration.activity_id).where(
        ActivityRegistration.user_id == user_id
    )
    joined_ids = {activity_id for activity_id in db.scalars(joined_ids_statement)}

    category_statement = (
        select(Place.category)
        .select_from(ActivityRegistration)
        .join(Activity, Activity.id == ActivityRegistration.activity_id)
        .join(Place, Place.id == Activity.place_id)
        .where(ActivityRegistration.user_id == user_id)
    )
    category_counter = Counter(
        _normalize_category(category)
        for category in db.scalars(category_statement)
        if _normalize_category(category) is not None
    )
    return joined_ids, category_counter


def _calculate_soon_bonus(starts_in_hours: float) -> float:
    return max(
        0.0,
        ACTIVITY_SOON_BONUS_MAX
        - min(ACTIVITY_SOON_BONUS_MAX, starts_in_hours / ACTIVITY_SOON_HOURS_FACTOR),
    )


def _diversify_places(places: list[RecommendedPlace]) -> list[RecommendedPlace]:
    if len(places) < DIVERSIFY_TOP_N:
        return places
    categories = {place.category.value for place in places[:DIVERSIFY_TOP_N]}
    if len(categories) > 1:
        return places
    diverse_candidate_position = next(
        (
            position
            for position, candidate in enumerate(
                places[DIVERSIFY_TOP_N:], start=DIVERSIFY_TOP_N
            )
            if candidate.category.value not in categories
        ),
        None,
    )
    if diverse_candidate_position is None:
        return places
    diverse_candidate = places[diverse_candidate_position]
    remaining = (
        places[DIVERSIFY_TOP_N:diverse_candidate_position]
        + places[diverse_candidate_position + 1 :]
    )
    return places[:DIVERSIFY_KEEP_HEAD] + [diverse_candidate] + remaining


def get_recommendations(
    db: Session,
    *,
    latitude: float,
    longitude: float,
    category: str | None = None,
    time_of_day: TimeOfDay | None = None,
    current_user_id: int | None = None,
) -> RecommendationsResponse:
    now = datetime.now(UTC)
    normalized_category = _normalize_category(category)
    joined_activity_ids: set[int] = set()
    history_categories: Counter[str] = Counter()

    if current_user_id is not None:
        joined_activity_ids, history_categories = _user_history_profile(db, current_user_id)

    nearby_places = list_nearby_places(
        db, latitude=latitude, longitude=longitude, radius_km=PLACE_NEARBY_RADIUS_KM
    )
    if len(nearby_places) >= MAX_PLACE_RESULTS:
        place_candidates = nearby_places
    else:
        nearby_ids = {place.id for place in nearby_places}
        all_places, _ = list_places(db)
        additional_places = [place for place in all_places if place.id not in nearby_ids]
        place_candidates = nearby_places + additional_places

    recommended_places: list[RecommendedPlace] = []
    for place in place_candidates:
        normalized_place_category = _normalize_category(place.category)
        distance_km = calculate_distance_km(latitude, longitude, place.latitude, place.longitude)

        score = max(0.0, PLACE_BASE_DISTANCE_SCORE - (distance_km * PLACE_DISTANCE_PENALTY_PER_KM))
        if normalized_category and normalized_place_category == normalized_category:
            score += PLACE_CATEGORY_MATCH_BONUS
        if time_of_day and normalized_place_category in TIME_CATEGORY_PREFERENCES[time_of_day]:
            score += PLACE_TIME_MATCH_BONUS
        if normalized_place_category in history_categories:
            score += min(
                PLACE_HISTORY_MATCH_MAX,
                float(history_categories[normalized_place_category] * PLACE_HISTORY_MATCH_PER_EVENT),
            )

        recommended_places.append(
            RecommendedPlace(
                id=place.id,
                name=place.name,
                category=place.category,
                theme=place.theme,
                latitude=place.latitude,
                longitude=place.longitude,
                distance_km=round(distance_km, 2),
                score=round(score, 2),
            )
        )

    recommended_places.sort(key=lambda item: (-item.score, item.distance_km, item.id))
    recommended_places = _diversify_places(recommended_places[:MAX_PLACE_RESULTS])

    rows = db.execute(
        select(Activity, Place)
        .join(Place, Place.id == Activity.place_id)
        .where(Activity.date_time >= now)
        .order_by(Activity.date_time.asc())
        .limit(300)
    ).all()
    participant_counts = get_activity_participants_counts(db, [activity.id for activity, _ in rows])
    recommended_activities: list[RecommendedActivity] = []

    for activity, place in rows:
        participants_count = participant_counts.get(activity.id, 0)
        if participants_count >= activity.max_participants:
            continue

        normalized_place_category = _normalize_category(place.category)
        distance_km = calculate_distance_km(latitude, longitude, place.latitude, place.longitude)
        starts_in_hours = max(
            0.0, (_ensure_utc_aware(activity.date_time) - now).total_seconds() / SECONDS_PER_HOUR
        )

        score = max(
            0.0, ACTIVITY_BASE_DISTANCE_SCORE - (distance_km * ACTIVITY_DISTANCE_PENALTY_PER_KM)
        )
        score += _calculate_soon_bonus(starts_in_hours)

        if normalized_category and normalized_place_category == normalized_category:
            score += ACTIVITY_CATEGORY_MATCH_BONUS
        if time_of_day and _activity_time_of_day(activity.date_time) == time_of_day:
            score += ACTIVITY_TIME_MATCH_BONUS
        if normalized_place_category in history_categories:
            score += min(
                ACTIVITY_HISTORY_MATCH_MAX,
                float(history_categories[normalized_place_category] * ACTIVITY_HISTORY_MATCH_PER_EVENT),
            )

        is_joined = activity.id in joined_activity_ids
        if is_joined:
            score -= ACTIVITY_ALREADY_JOINED_PENALTY
        elif current_user_id is not None:
            score += ACTIVITY_NOT_JOINED_BONUS

        recommended_activities.append(
            RecommendedActivity(
                id=activity.id,
                title=activity.title,
                description=activity.description,
                place_id=place.id,
                place_name=place.name,
                place_category=place.category,
                date_time=activity.date_time,
                max_participants=activity.max_participants,
                participants_count=participants_count,
                available_slots=activity.max_participants - participants_count,
                is_joined=is_joined,
                distance_km=round(distance_km, 2),
                score=round(score, 2),
            )
        )

    recommended_activities.sort(key=lambda item: (-item.score, item.date_time, item.id))

    return RecommendationsResponse(
        recommended_places=recommended_places,
        recommended_activities=recommended_activities[:MAX_ACTIVITY_RESULTS],
    )
