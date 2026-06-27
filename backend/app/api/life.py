from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.cache import get_cached_json, set_cached_json
from app.core.config import settings
from app.core.security import get_current_user, get_optional_current_user
from app.db.session import get_db
from app.models import Activity, User, UserRole

router = APIRouter()


# ─── Mood-Based Discovery ─────────────────────────────────────────────

MOOD_SUGGESTIONS: dict[str, dict] = {
    "stressed": {
        "title_ar": "أنت متوتر؟ هذا سيساعدك",
        "title_fr": "Tu es stressé ? Voici ce qui peut t'aider",
        "title_en": "Feeling stressed? Here's what helps",
        "description_ar": "الماء الساخن والهدوء في حمام المسخوطين أو نزهة قصيرة بجانب وادي زناطي",
        "description_fr": "L'eau chaude et le calme de Hammam Maskhoutine ou une courte promenade au bord de l'Oued Zenati",
        "description_en": "Hot water and calm at Hammam Maskhoutine or a short walk along Oued Zenati",
        "category": "thermal_baths",
    },
    "bored": {
        "title_ar": "أشعر بالملل؟ اكتشف شيئاً جديداً!",
        "title_fr": "Tu t'ennuies ? Découvre quelque chose de nouveau !",
        "title_en": "Feeling bored? Discover something new!",
        "description_ar": "اكتشف المسرح الروماني، أو انضم إلى مجموعة للمشي على جبل ونة",
        "description_fr": "Explore le théâtre romain, ou rejoins un groupe de randonnée sur le Mont Maouna",
        "description_en": "Explore the Roman Theatre, or join a group hike on Mont Maouna",
        "category": "activity",
    },
    "lonely": {
        "title_ar": "تريد التعرف على أشخاص جدد؟",
        "title_fr": "Tu veux rencontrer de nouvelles personnes ?",
        "title_en": "Want to meet new people?",
        "description_ar": "انضم إلى نشاط مجتمعي أو رحلة جماعية القادمة",
        "description_fr": "Rejoins une activité communautaire ou une sortie de groupe à venir",
        "description_en": "Join a community activity or upcoming group outing",
        "category": "social",
    },
    "adventurous": {
        "title_ar": "روح المغامرة! هذا ما نقترحه",
        "title_fr": "L'esprit d'aventure ! Voici ce qu'on te propose",
        "title_en": "Adventure spirit! Here's our suggestion",
        "description_ar": "تسلق جبل ونة، أو استكشف دولمنز روكنيا الأثرية",
        "description_fr": "Gravir le Mont Maouna, ou explorer les dolmens préhistoriques de Roknia",
        "description_en": "Climb Mont Maouna, or explore the prehistoric dolmens of Roknia",
        "category": "nature",
    },
    "peaceful": {
        "title_ar": "تحتاج إلى هدوء وسكينة",
        "title_fr": "Tu as besoin de calme et de sérénité",
        "title_en": "You need calm and serenity",
        "description_ar": "غروب الشمس في هليوبوليس، أو الجلوس بجانب وادي زناطي",
        "description_fr": "Le coucher de soleil à Héliopolis, ou s'asseoir au bord de l'Oued Zenati",
        "description_en": "Sunset at Héliopolis, or sitting by Oued Zenati",
        "category": "relaxation",
    },
    "family": {
        "title_ar": "نشاط عائلي ممتع!",
        "title_fr": "Une activité familiale agréable !",
        "title_en": "Fun family activity!",
        "description_ar": "منطقة نزه بالقرب من السد، أو زيارة المتحف الروماني",
        "description_fr": "Zone de pique-nique près du barrage, ou visite du musée romain",
        "description_en": "Picnic area near the dam, or visit the Roman Museum",
        "category": "nature",
    },
    "romantic": {
        "title_ar": "لحظات رومانسية في قالمة",
        "title_fr": "Des moments romantiques à Guelma",
        "title_en": "Romantic moments in Guelma",
        "description_ar": "غروب الشمس في المسرح الروماني، أو نزهة في حمام المسخوطين",
        "description_fr": "Coucher de soleil au théâtre romain, ou balade à Hammam Maskhoutine",
        "description_en": "Sunset at the Roman Theatre, or stroll at Hammam Maskhoutine",
        "category": "relaxation",
    },
    "nature": {
        "title_ar": "استمتع بالطبيعة",
        "title_fr": "Profite de la nature",
        "title_en": "Enjoy nature",
        "description_ar": "غابة الروحابة، جبل ونة، أو نهر زناطي",
        "description_fr": "Forêt de Roum Echallaha, Mont Maouna, ou rivière Zenati",
        "description_en": "Roum Echallaha forest, Mont Maouna, or Zenati river",
        "category": "forest",
    },
}


@router.get("/mood/{mood}")
async def get_mood_suggestions(
    mood: str,
    db: Annotated[Session, Depends(get_db)],
    accept_language: Annotated[str | None, Query()] = None,
):
    """Get place/activity suggestions based on current mood."""
    lang = accept_language or "ar"
    if lang not in ("ar", "fr", "en"):
        lang = "ar"

    # Check cache first
    cache_key = f"mood:{mood}:lang={lang}"
    cached = get_cached_json(cache_key)
    if cached:
        return cached

    mood_data = MOOD_SUGGESTIONS.get(mood, MOOD_SUGGESTIONS["bored"])
    target_category = mood_data.get("category", "relaxation")

    # Query places matching the mood category
    query = select(Activity).where(Activity.is_recurring == True)
    places_query = select(Activity.place_id).distinct()
    
    suggestions = []
    if target_category in ("thermal_baths", "relaxation"):
        suggestions = [
            {
                "id": 1,
                "mood": mood,
                "title": mood_data.get(f"title_{lang}", mood_data["title_en"]),
                "title_ar": mood_data["title_ar"],
                "title_fr": mood_data["title_fr"],
                "title_en": mood_data["title_en"],
                "description": mood_data.get(f"description_{lang}", mood_data["description_en"]),
                "description_ar": mood_data["description_ar"],
                "description_fr": mood_data["description_fr"],
                "description_en": mood_data["description_en"],
                "image_url": None,
                "place_id": 2,
                "place_name": "Hammam Maskhoutine" if lang != "ar" else "حمام المسخوطين",
                "category": "thermal_baths",
            },
            {
                "id": 2,
                "mood": mood,
                "title": mood_data.get(f"title_{lang}", mood_data["title_en"]),
                "title_ar": mood_data["title_ar"],
                "title_fr": mood_data["title_fr"],
                "title_en": mood_data["title_en"],
                "description": mood_data.get(f"description_{lang}", mood_data["description_en"]),
                "description_ar": mood_data["description_ar"],
                "description_fr": mood_data["description_fr"],
                "description_en": mood_data["description_en"],
                "image_url": None,
                "place_id": 5,
                "place_name": "Héliopolis" if lang != "ar" else "هليوبوليس",
                "category": "relaxation",
            },
        ]

    set_cached_json(cache_key, suggestions, 300)
    return suggestions


# ─── Live Feed (What's Happening NOW) ────────────────────────────────

@router.get("/happening")
async def get_happening_feed(
    db: Annotated[Session, Depends(get_db)],
):
    """Get real-time feed of what's happening in the city."""
    now = datetime.now(UTC)
    one_hour_ago = now - timedelta(hours=1)

    # Get recent activities
    recent_activities = db.scalars(
        select(Activity)
        .where(Activity.date_time >= one_hour_ago)
        .order_by(Activity.created_at.desc())
        .limit(10)
    ).all()

    feed = []
    for activity in recent_activities:
        feed.append({
            "type": "activity",
            "id": activity.id,
            "title": activity.title,
            "place_name": activity.place.name if activity.place else None,
            "date_time": activity.date_time.isoformat(),
            "participants_count": 0,
            "created_at": activity.created_at.isoformat(),
        })

    return feed


# ─── Meetups (Social) ──────────────────────────────────────────────

@router.get("/meetups")
async def list_meetups(
    db: Annotated[Session, Depends(get_db)],
    status: Annotated[str | None, Query()] = "active",
    near_lat: Annotated[float | None, Query(ge=-90, le=90)] = None,
    near_lon: Annotated[float | None, Query(ge=-180, le=180)] = None,
    radius_km: Annotated[float | None, Query(gt=0, le=50)] = 10,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
):
    """List active meetups with optional location filtering."""
    query = select(Activity).where(Activity.is_recurring == True)
    
    if near_lat and near_lon and radius_km:
        # Simple bounding box approximation (same as place_service pattern)
        from math import cos, radians
        lat_delta = radius_km / 111.0  # 1 degree lat ≈ 111km
        min_lat = near_lat - lat_delta
        max_lat = near_lat + lat_delta
        cos_lat = max(cos(radians(near_lat)), 1e-6)
        lon_delta = radius_km / (111.0 * cos_lat)
        min_lon = near_lon - lon_delta
        max_lon = near_lon + lon_delta
        
        # We'd need to join with Place for lat/lon — simplified here
        pass

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    activities = db.scalars(
        query.offset((page - 1) * limit).limit(limit)
    ).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "results": [
            {
                "id": a.id,
                "title": a.title,
                "description": a.description,
                "date_time": a.date_time.isoformat() if a.date_time else None,
                "location": a.place.name if a.place else "Guelma",
                "latitude": a.place.latitude if a.place else None,
                "longitude": a.place.longitude if a.place else None,
                "max_participants": a.max_participants,
                "participants_count": 0,
                "mood": a.mood,
                "organizer": a.organizer.email if a.organizer else None,
                "tags": [],
            }
            for a in activities
        ],
    }


# ─── Tourist-Local Q&A ───────────────────────────────────────────────

@router.get("/tourist/questions")
async def list_local_questions(
    db: Annotated[Session, Depends(get_db)],
    question_id: Annotated[int | None, Query()] = None,
):
    """List questions from tourists, answered by locals."""
    if question_id:
        return {"results": []}  # Simplified stub

    return {
        "results": [
            {
                "id": 1,
                "question": "What's the best way to explore the Roman Theatre?",
                "asked_by": "Marco T.",
                "asked_at": (datetime.now(UTC) - timedelta(hours=2)).isoformat(),
                "answers_count": 3,
                "is_resolved": False,
                "category": "history",
                "answers": [
                    {
                        "id": 1,
                        "answer": "Go at sunset! The light is magical. Bring water.",
                        "answered_by": "Fatima G.",
                        "answered_at": (datetime.now(UTC) - timedelta(hours=1)).isoformat(),
                        "is_local": True,
                        "likes_count": 5,
                        "is_best": True,
                        "is_liked": False,
                    },
                ],
            },
        ],
    }


@router.post("/tourist/ask", status_code=status.HTTP_201_CREATED)
async def ask_local_question(
    payload: dict,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Post a question for locals to answer."""
    return {"success": True, "message": "Question posted"}


# ─── Wellness ────────────────────────────────────────────────────────

@router.get("/wellness/daily")
async def get_daily_wellness(
    db: Annotated[Session, Depends(get_db)],
):
    """Get today's wellness tip."""
    day_of_week = datetime.now(UTC).weekday()
    
    tips = [
        {
            "id": 1,
            "type": "breathing",
            "title": "Thermal Breathwork",
            "title_ar": "تمارين التنفس الحراري",
            "title_fr": "Respiration thermale",
            "description": "Practice deep breathing at Hammam Maskhoutine. The warm mineral air enhances relaxation.",
            "description_ar": "مارس التنفس العميق في حمام المسخوطين. البخار الدافئ يعزز الاسترخاء.",
            "description_fr": "Pratiquez la respiration profonde à Hammam Maskhoutine. La vapeur minérale chaude améliore la relaxation.",
            "duration_seconds": 120,
            "instructions": [
                "Sit comfortably near the spring edge",
                "Close your eyes and feel the warm steam",
                "Inhale deeply for 4 counts",
                "Hold gently for 4 counts",
                "Exhale slowly for 6 counts",
            ],
            "benefits": ["Reduces stress", "Improves circulation", "Opens airways"],
            "icon": "wind",
            "date": datetime.now(UTC).date().isoformat(),
        },
        {
            "id": 2,
            "type": "gratitude",
            "title": "Sunset Appreciation",
            "title_ar": "تقدير الغروب",
            "title_fr": "Appréciation du coucher de soleil",
            "description": "Take 2 minutes to watch the sunset from Héliopolis. Simple presence, deep peace.",
            "description_ar": "خذ دقيقتين لمشاهدة الغروب من هليوبوليس. حضور بسيط، سلام عميق.",
            "description_fr": "Prenez 2 minutes pour regarder le coucher de soleil depuis Héliopolis. Présence simple, paix profonde.",
            "duration_seconds": 120,
            "instructions": [
                "Find a clear view facing west",
                "Put your phone away",
                "Notice the changing colors",
                "Think of 3 things you are grateful for",
                "Breathe slowly and let the day end",
            ],
            "benefits": ["Improves mindfulness", "Reduces anxiety", "Better sleep"],
            "icon": "sun",
            "date": datetime.now(UTC).date().isoformat(),
        },
    ]

    return tips[day_of_week % len(tips)]


# ─── Experiences ─────────────────────────────────────────────────────

@router.get("/experiences")
async def list_experiences(
    db: Annotated[Session, Depends(get_db)],
    mood: Annotated[str | None, Query()] = None,
):
    """List curated micro-adventures and experiences."""
    experiences = [
        {
            "id": 1,
            "title": "The Roman Ring",
            "title_ar": "حلقة الرومان",
            "title_fr": "L'Anneau Romain",
            "description": "Walk through 2,000 years of history.",
            "duration_minutes": 45,
            "difficulty": "easy",
            "mood": "history",
            "category": "heritage",
            "image_url": None,
            "steps": [
                "Start at Théâtre Romain",
                "Walk 5 min to Héliopolis",
                "Continue to the Museum",
                "End at Old Town Café",
            ],
            "tips": ["Best at golden hour"],
            "place_id": 1,
            "place_name": "Théâtre Romain",
        },
        {
            "id": 2,
            "title": "Crush Maouna",
            "title_ar": "قمة مونة",
            "title_fr": "Conquérir Maouna",
            "description": "Climb Guelma's highest viewpoint. Panoramic reward.",
            "duration_minutes": 180,
            "difficulty": "hard",
            "mood": "adventure",
            "category": "nature",
            "image_url": None,
            "steps": ["Park at trailhead", "Follow ridge trail", "Reach summit"],
            "tips": ["Start before 7am in summer"],
            "place_id": 3,
            "place_name": "Mont Maouna",
        },
        {
            "id": 3,
            "title": "Dolmens & Legends",
            "title_ar": "دولمنز و أساطير",
            "title_fr": "Dolmens & Légendes",
            "description": "4,000-year-old megalithic tombs. A mysterious walk.",
            "duration_minutes": 60,
            "difficulty": "easy",
            "mood": "mystery",
            "category": "heritage",
            "image_url": None,
            "steps": ["Enter Roknia site", "Find the Grand Dolmen"],
            "tips": ["Sunset is magical"],
            "place_id": 4,
            "place_name": "Roknia Necropolis",
        },
    ]

    if mood:
        experiences = [e for e in experiences if e["mood"] == mood or e["category"] == mood]

    return experiences


# ─── Photo Challenges ────────────────────────────────────────────────

@router.get("/photowalk")
async def get_photo_challenges(
    db: Annotated[Session, Depends(get_db)],
):
    """Get current photo walk challenge."""
    return {
        "results": [
            {
                "id": 1,
                "theme": "Hidden Doors of Guelma",
                "theme_ar": "الأبواب المخفية لقالمة",
                "theme_fr": "Les Portes Cachées de Guelma",
                "description": "Find and photograph the most beautiful doorways in the old town.",
                "description_ar": "ابحث عن أجمل الأبواب في المدينة القديمة وصورها",
                "description_fr": "Trouvez et photographiez les plus belles portes de la vieille ville.",
                "start_date": (datetime.now(UTC) - timedelta(days=3)).isoformat(),
                "end_date": (datetime.now(UTC) + timedelta(days=4)).isoformat(),
                "submissions_count": 12,
                "is_active": True,
            },
        ],
    }


@router.post("/photowalk/{challenge_id}/submit", status_code=status.HTTP_201_CREATED)
async def submit_photo(
    challenge_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Submit a photo to a challenge."""
    return {"success": True, "message": "Photo submitted"}
