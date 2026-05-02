from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.activity import Activity
from app.models.place import Place, PlaceCategory
from app.models.user import User, UserRole

DEMO_ORGANIZER_EMAIL = "demo.organizer@guelma.guide"
DEMO_ORGANIZER_PASSWORD = "DemoOrganizer123!"


def _seed_user(session: Session) -> User:
    user = session.scalar(select(User).where(User.email == DEMO_ORGANIZER_EMAIL))
    if user:
        return user

    user = User(
        email=DEMO_ORGANIZER_EMAIL,
        hashed_password=get_password_hash(DEMO_ORGANIZER_PASSWORD),
        role=UserRole.ORGANIZER,
    )
    session.add(user)
    session.flush()
    return user


def _seed_places(session: Session) -> dict[str, Place]:
    places_data = [
        {
            "name": "Roman Theatre of Guelma",
            "description": "Historic Roman amphitheater and one of Guelma's top cultural landmarks.",
            "latitude": 36.4621,
            "longitude": 7.4247,
            "category": PlaceCategory.CULTURE,
            "theme": "heritage",
            "images": [
                "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Theatre_romain_de_Guelma.jpg/1280px-Theatre_romain_de_Guelma.jpg"
            ],
        },
        {
            "name": "Hammam Debagh Cascades",
            "description": "Famous thermal cascades with dramatic scenery and warm natural waters.",
            "latitude": 36.5041,
            "longitude": 7.3234,
            "category": PlaceCategory.THERMAL_BATHS,
            "theme": "wellness",
            "images": [
                "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Hammam_Debagh_-_Algeria.jpg/1280px-Hammam_Debagh_-_Algeria.jpg"
            ],
        },
        {
            "name": "Ain Larbi Springs",
            "description": "Calm spring area ideal for short nature escapes and relaxed walks.",
            "latitude": 36.512,
            "longitude": 7.385,
            "category": PlaceCategory.NATURE,
            "theme": "springs",
            "images": [
                "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Hot_spring.jpg/1280px-Hot_spring.jpg"
            ],
        },
        {
            "name": "Guelma Botanical Garden",
            "description": "Shaded urban garden perfect for families, photography, and evening walks.",
            "latitude": 36.4615,
            "longitude": 7.4285,
            "category": PlaceCategory.NATURE,
            "theme": "family park",
            "images": [
                "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Jardin_public.jpg/1280px-Jardin_public.jpg"
            ],
        },
        {
            "name": "Medjez Amar Forest",
            "description": "Forest recreation area with light trails and picnic-friendly zones.",
            "latitude": 36.418,
            "longitude": 7.41,
            "category": PlaceCategory.FOREST,
            "theme": "hiking",
            "images": [
                "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Forest_in_Algeria.jpg/1280px-Forest_in_Algeria.jpg"
            ],
        },
        {
            "name": "Guelma Central Souk",
            "description": "Traditional market with food stalls, artisan crafts, and local culture.",
            "latitude": 36.461,
            "longitude": 7.423,
            "category": PlaceCategory.CULTURE,
            "theme": "market",
            "images": [
                "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Market_in_Algeria.jpg/1280px-Market_in_Algeria.jpg"
            ],
        },
        {
            "name": "Mermoura Hill Viewpoint",
            "description": "Panoramic viewpoint for sunrise and sunset over surrounding valleys.",
            "latitude": 36.4752,
            "longitude": 7.4452,
            "category": PlaceCategory.NATURE,
            "theme": "viewpoint",
            "images": [
                "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1280&q=80&auto=format&fit=crop"
            ],
        },
        {
            "name": "Seybouse Riverside Walk",
            "description": "Gentle riverside promenade suited for easy walks and social meetups.",
            "latitude": 36.4862,
            "longitude": 7.4375,
            "category": PlaceCategory.NATURE,
            "theme": "river walk",
            "images": [
                "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1280&q=80&auto=format&fit=crop"
            ],
        },
        {
            "name": "Municipal Sports Complex",
            "description": "Open sports area hosting football and group fitness sessions.",
            "latitude": 36.4589,
            "longitude": 7.4311,
            "category": PlaceCategory.SPORTS,
            "theme": "football",
            "images": [
                "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1280&q=80&auto=format&fit=crop"
            ],
        },
        {
            "name": "Old Town Coffee Alley",
            "description": "Cozy café area for evening conversations and local social vibes.",
            "latitude": 36.4609,
            "longitude": 7.4232,
            "category": PlaceCategory.RELAXATION,
            "theme": "cafés",
            "images": [
                "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1280&q=80&auto=format&fit=crop"
            ],
        },
        {
            "name": "Sellaoua Nature Spot",
            "description": "Quiet green area with fresh air and short soft hiking paths.",
            "latitude": 36.5232,
            "longitude": 7.4684,
            "category": PlaceCategory.NATURE,
            "theme": "soft hike",
            "images": [
                "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=1280&q=80&auto=format&fit=crop"
            ],
        },
        {
            "name": "Thermal Valley Picnic Area",
            "description": "Open natural zone near thermal landscapes for picnic and relaxation.",
            "latitude": 36.4979,
            "longitude": 7.3328,
            "category": PlaceCategory.THERMAL_BATHS,
            "theme": "outdoor wellness",
            "images": [
                "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1280&q=80&auto=format&fit=crop"
            ],
        },
        {
            "name": "Bouchgouf Eco Park",
            "description": "Green eco-park area with family trails and open nature seating.",
            "latitude": 36.5318,
            "longitude": 7.4891,
            "category": PlaceCategory.NATURE,
            "theme": "eco park",
            "images": [
                "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=1280&q=80&auto=format&fit=crop"
            ],
        },
        {
            "name": "Belkheir Sports Arena",
            "description": "Modern sports ground for football, running, and youth events.",
            "latitude": 36.4541,
            "longitude": 7.4469,
            "category": PlaceCategory.SPORTS,
            "theme": "training",
            "images": [
                "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1280&q=80&auto=format&fit=crop"
            ],
        },
        {
            "name": "El Hadjar Lake Corner",
            "description": "Peaceful lakeside corner for light walking and calm views.",
            "latitude": 36.5164,
            "longitude": 7.4016,
            "category": PlaceCategory.RELAXATION,
            "theme": "lake relax",
            "images": [
                "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1280&q=80&auto=format&fit=crop"
            ],
        },
        {
            "name": "Old Baths Heritage Corner",
            "description": "Historic heritage corner inspired by traditional bath culture.",
            "latitude": 36.4668,
            "longitude": 7.4195,
            "category": PlaceCategory.CULTURE,
            "theme": "heritage walk",
            "images": [
                "https://images.unsplash.com/photo-1518991791750-74942f4d4c6b?w=1280&q=80&auto=format&fit=crop"
            ],
        },
    ]

    by_name: dict[str, Place] = {}
    for place_data in places_data:
        place = session.scalar(select(Place).where(Place.name == place_data["name"]))
        if place is None:
            place = Place(**place_data)
            session.add(place)
            session.flush()
        else:
            for key, value in place_data.items():
                setattr(place, key, value)
        by_name[place.name] = place
    return by_name


def _seed_activities(session: Session, organizer: User, places: dict[str, Place]) -> None:
    now = datetime.now(UTC).replace(minute=0, second=0, microsecond=0)
    activities_data = [
        (
            "Weekend Friendly Football",
            "Casual 5v5 football for mixed skill levels.",
            "Municipal Sports Complex",
            now + timedelta(days=1, hours=9),
            20,
        ),
        (
            "Forest Sunrise Hike",
            "Group hiking with scenic stops in Medjez Amar forest.",
            "Medjez Amar Forest",
            now + timedelta(days=2, hours=7),
            18,
        ),
        (
            "Old Town Coffee Meetup",
            "Evening social meetup for locals and visitors.",
            "Old Town Coffee Alley",
            now + timedelta(days=2, hours=18),
            24,
        ),
        (
            "Roman Heritage Walk",
            "Guided cultural walk through Roman-era history in Guelma.",
            "Roman Theatre of Guelma",
            now + timedelta(days=3, hours=10),
            25,
        ),
        (
            "Thermal Wellness Morning",
            "Relaxing thermal morning around Hammam Debagh.",
            "Hammam Debagh Cascades",
            now + timedelta(days=4, hours=8),
            16,
        ),
        (
            "Botanical Family Picnic",
            "Community picnic and light games in the botanical garden.",
            "Guelma Botanical Garden",
            now + timedelta(days=5, hours=11),
            30,
        ),
        (
            "Seybouse Riverside Walk",
            "Gentle riverside walking activity for all ages.",
            "Seybouse Riverside Walk",
            now + timedelta(days=5, hours=17),
            22,
        ),
        (
            "Sellaoua Soft Hike",
            "Beginner-friendly hike with nature photos and breaks.",
            "Sellaoua Nature Spot",
            now + timedelta(days=6, hours=9),
            20,
        ),
        (
            "Souk Food Discovery",
            "Taste local snacks and artisan products in the central souk.",
            "Guelma Central Souk",
            now + timedelta(days=7, hours=17),
            20,
        ),
        (
            "Thermal Valley Meetup",
            "Relaxed social meetup in the thermal valley picnic zone.",
            "Thermal Valley Picnic Area",
            now + timedelta(days=8, hours=16),
            18,
        ),
        (
            "Belkheir Training Run",
            "Community run session with warm-up and easy intervals.",
            "Belkheir Sports Arena",
            now + timedelta(days=9, hours=7),
            26,
        ),
        (
            "Bouchgouf Nature Meetup",
            "Family-friendly meetup with short eco walk and picnic.",
            "Bouchgouf Eco Park",
            now + timedelta(days=9, hours=11),
            28,
        ),
        (
            "Mermoura Photo Meetup",
            "Golden-hour photography meetup with local creators.",
            "Mermoura Hill Viewpoint",
            now + timedelta(days=10, hours=17),
            18,
        ),
        (
            "El Hadjar Calm Walk",
            "Relaxed evening walk by the lake for wellness and conversation.",
            "El Hadjar Lake Corner",
            now + timedelta(days=10, hours=18),
            22,
        ),
        (
            "Old Baths Culture Talk",
            "Open-air cultural talk on local heritage and city stories.",
            "Old Baths Heritage Corner",
            now + timedelta(days=11, hours=19),
            24,
        ),
        (
            "Belkheir Football League",
            "Friendly mini-league football games across mixed teams.",
            "Belkheir Sports Arena",
            now + timedelta(days=12, hours=16),
            30,
        ),
    ]

    for title, description, place_name, date_time, max_participants in activities_data:
        place = places[place_name]
        activity = session.scalar(
            select(Activity).where(Activity.title == title, Activity.place_id == place.id)
        )
        if activity is None:
            session.add(
                Activity(
                    title=title,
                    description=description,
                    place_id=place.id,
                    organizer_id=organizer.id,
                    date_time=date_time,
                    max_participants=max_participants,
                )
            )
            continue

        activity.description = description
        activity.date_time = date_time
        activity.max_participants = max_participants
        activity.organizer_id = organizer.id


def seed_demo_data() -> None:
    with SessionLocal() as session:
        organizer = _seed_user(session)
        places = _seed_places(session)
        _seed_activities(session, organizer, places)
        session.commit()

    print("✅ Demo data seeded successfully.")
    print(f"Organizer account: {DEMO_ORGANIZER_EMAIL}")


if __name__ == "__main__":
    seed_demo_data()
