from math import asin, cos, degrees, radians, sin, sqrt

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.place import Place, PlaceCategory
from app.schemas.place import PlaceCreate

EARTH_RADIUS_KM = 6371.0
MIN_COS_LATITUDE = 1e-6


def list_places(
    db: Session,
    *,
    category: PlaceCategory | None = None,
    keyword: str | None = None,
    theme: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    distance_km: float | None = None,
    page: int | None = None,
    limit: int = 20,
) -> tuple[list[Place], int]:
    filters = []
    if category is not None:
        filters.append(Place.category == category)
    if theme:
        filters.append(Place.theme.ilike(f"%{theme.strip()}%"))
    order_by_clause = [Place.created_at.desc()]
    if keyword:
        normalized_keyword = keyword.strip()
        if normalized_keyword:
            query = func.plainto_tsquery('french', normalized_keyword)
            filters.append(Place.search_vector.op('@@')(query))
            # Rank by relevance
            rank = func.ts_rank(Place.search_vector, query).label('rank')
            order_by_clause = [rank.desc(), Place.created_at.desc()]

    if distance_km is not None:
        if latitude is None or longitude is None:
            raise ValueError("latitude and longitude are required when distance filter is used")
        latitude_delta = degrees(distance_km / EARTH_RADIUS_KM)
        if abs(latitude) >= 89.9:
            longitude_min, longitude_max = -180.0, 180.0
        else:
            cos_latitude = max(cos(radians(latitude)), MIN_COS_LATITUDE)
            longitude_delta = degrees(distance_km / (EARTH_RADIUS_KM * cos_latitude))
            longitude_min = longitude - longitude_delta
            longitude_max = longitude + longitude_delta

        filters.extend(
            [
                Place.latitude.between(latitude - latitude_delta, latitude + latitude_delta),
                Place.longitude.between(longitude_min, longitude_max),
            ]
        )
        
        # When distance filter is present, we handle sorting and pagination differently
        statement = select(Place).where(*filters)
        if keyword:
            # We need the rank in the columns if we want to sort by it in memory or query
            query = func.plainto_tsquery('french', keyword.strip())
            rank = func.ts_rank(Place.search_vector, query).label('rank')
            statement = select(Place, rank).where(*filters)
            candidates = list(db.execute(statement).all())
        else:
            candidates = [(p,) for p in db.scalars(statement)]

        filtered_places: list[tuple[float, Place, float]] = []
        for row in candidates:
            place = row[0]
            r = row[1] if len(row) > 1 else 0.0
            exact_distance = calculate_distance_km(latitude, longitude, place.latitude, place.longitude)
            if exact_distance <= distance_km:
                filtered_places.append((exact_distance, place, r))
        
        # Sort by rank (desc) then distance (asc) then creation (desc)
        filtered_places.sort(
            key=lambda item: (-item[2], item[0], item[1].created_at)
        )
        
        all_places = [item[1] for item in filtered_places]
        total = len(all_places)
        if page is None:
            return all_places, total
        start = (page - 1) * limit
        end = start + limit
        return all_places[start:end], total

    base_statement = select(Place).where(*filters)
    total = int(db.scalar(select(func.count()).select_from(base_statement.subquery())) or 0)
    statement = base_statement.order_by(*order_by_clause)
    if page is not None:
        statement = statement.offset((page - 1) * limit).limit(limit)
    return list(db.scalars(statement)), total


def get_place_by_id(db: Session, place_id: int) -> Place | None:
    statement = select(Place).options(selectinload(Place.activities)).where(Place.id == place_id)
    return db.scalar(statement)


def list_places_by_category(db: Session, category: PlaceCategory) -> list[Place]:
    places, _ = list_places(db, category=category)
    return places


def create_place(db: Session, payload: PlaceCreate) -> Place:
    place = Place(**payload.model_dump())
    db.add(place)
    db.commit()
    db.refresh(place)
    return place


def calculate_distance_km(
    latitude: float, longitude: float, target_latitude: float, target_longitude: float
) -> float:
    """Calculate great-circle distance in kilometers using the haversine formula."""

    lat1 = radians(latitude)
    lon1 = radians(longitude)
    lat2 = radians(target_latitude)
    lon2 = radians(target_longitude)

    dlat = lat2 - lat1
    dlon = lon2 - lon1
    haversine_a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * EARTH_RADIUS_KM * asin(sqrt(haversine_a))


def list_nearby_places(db: Session, latitude: float, longitude: float, radius_km: float) -> list[Place]:
    """Return places inside radius_km using a bounding box then precise haversine filtering.

    Near poles, longitude bounds are expanded to the full range to avoid unstable cosine scaling.
    """

    latitude_delta = degrees(radius_km / EARTH_RADIUS_KM)
    if abs(latitude) >= 89.9:
        longitude_min, longitude_max = -180.0, 180.0
    else:
        cos_latitude = max(cos(radians(latitude)), MIN_COS_LATITUDE)
        longitude_delta = degrees(radius_km / (EARTH_RADIUS_KM * cos_latitude))
        longitude_min = longitude - longitude_delta
        longitude_max = longitude + longitude_delta

    candidate_statement = select(Place).where(
        Place.latitude.between(latitude - latitude_delta, latitude + latitude_delta),
        Place.longitude.between(longitude_min, longitude_max),
    )
    candidate_places = list(db.scalars(candidate_statement))
    filtered_places: list[tuple[float, Place]] = []

    for place in candidate_places:
        distance = calculate_distance_km(latitude, longitude, place.latitude, place.longitude)
        if distance <= radius_km:
            filtered_places.append((distance, place))

    filtered_places.sort(key=lambda item: item[0])
    return [place for _, place in filtered_places]


def list_featured_places(db: Session, limit: int = 6) -> list[Place]:
    statement = select(Place).where(Place.featured.is_(True)).order_by(Place.name.asc()).limit(limit)
    return list(db.scalars(statement))
