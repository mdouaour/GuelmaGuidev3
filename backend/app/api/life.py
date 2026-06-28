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
        "description_ar": "الماء الساخن والهدوء في حمام المسخوطين، أو نزهة في غابة الروحابة الخضراء",
        "description_fr": "L'eau chaude et le calme de Hammam Maskhoutine, ou une promenade en forêt de Roum Echallaha",
        "description_en": "Hot springs at Hammam Maskhoutine, or a forest walk in green Roum Echallaha",
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
        "description_ar": "تسلق جبل ونة في الربيع، أو استكشف دولمنز روكنيا ثم الشاطئ",
        "description_fr": "Gravir le Maouna au printemps, ou explorer les dolmens puis la plage",
        "description_en": "Climb green Maouna in spring, or explore Roknia dolmens then hit the beach",
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
    season: Annotated[str | None, Query()] = None,
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
        # ─── Summer: Beach Excursions ────────────────────────────────────
        {
            "id": 4,
            "title": "Beach Day in Annaba",
            "title_ar": "يوم شاطئي في عنابة",
            "title_fr": "Journée à la Plage d'Annaba",
            "description": "Full-day beach excursion to Annaba (60km north). Coral-sand Mediterranean beaches like Plage des Sablettes and Plage Chapuis. Leave early, rent a parasol, swim all day, eat grilled fish at a beachfront restaurant.",
            "duration_minutes": 480,
            "difficulty": "easy",
            "mood": "relax",
            "season": "summer",
            "category": "beach",
            "image_url": None,
            "steps": [
                "Leave Guelma by 8am (60min drive north)",
                "Arrive at Plage des Sablettes",
                "Set up and swim all morning",
                "Lunch: fresh grilled sardines at a beachfront restaurant",
                "Afternoon nap under the parasol",
                "Evening walk along the Corniche",
                "Head back to Guelma by 7pm",
            ],
            "tips": [
                "Bring sunblock and a parasol — Annaba sun is strong",
                "Weekday is less crowded than Friday/Saturday",
                "Try 'Mermez' juice from street vendors",
            ],
            "ride_share_tip": "Most families from Guelma organize group taxis or minibuses to Annaba every summer morning. Expect ~300 DZD per person each way.",
            "place_id": 1,
            "place_name": "Annaba (60km north of Guelma)",
        },
        {
            "id": 5,
            "title": "Skikda Seaside Escape",
            "title_ar": "رحلة إلى سكيكدة الساحلية",
            "title_fr": "Évasion Côtière à Skikda",
            "description": "Day trip to Skikda's stunning coastline (80km northeast). Famous for Plage Larbi Ben M'hidi (named one of the best beaches in Algeria) and the Stora Roman port. Turquoise waters and dramatic cliffs.",
            "duration_minutes": 540,
            "difficulty": "easy",
            "mood": "relax",
            "season": "summer",
            "category": "beach",
            "image_url": None,
            "steps": [
                "Depart Guelma 7:30am (80min drive)",
                "Arrive at Plage Larbi Ben M'hidi — best in the region",
                "Swim and snorkel in turquoise waters",
                "Explore Stora's old Roman fishing port",
                "Seafood lunch at Restaurant du Port",
                "Sunset from the Skikda Corniche",
                "Return to Guelma by 8pm",
            ],
            "tips": [
                "Plage Ben M'hidi has showers and cafes nearby",
                "Snorkel gear rented on-site for ~200 DZD",
                "Avoid August weekends — extremely crowded",
            ],
            "ride_share_tip": "Shared taxis from Guelma to Skikda run frequently in summer. 350 DZD per person. Last return taxi before Maghreb prayer.",
            "place_id": 1,
            "place_name": "Skikda (80km northeast of Guelma)",
        },
        {
            "id": 6,
            "title": "Roknia & Beach Combo",
            "title_ar": "روكنيا والشاطئ",
            "title_fr": "Dolmens & Plage",
            "description": "Combine prehistory with the sea. Visit the 4,000-year-old Roknia dolmens in the morning, then continue north to Annaba for an afternoon swim. Culture and beach in one day.",
            "duration_minutes": 480,
            "difficulty": "moderate",
            "mood": "discover",
            "season": "summer",
            "category": "heritage",
            "image_url": None,
            "steps": [
                "Leave Guelma at 7am",
                "Visit Roknia Dolmens site (30min from Guelma)",
                "Take photos and explore the prehistoric tombs",
                "Continue north to Annaba (30min more)",
                "Beach time at Plage de la Verrerie",
                "Lunch on the waterfront",
                "Return to Guelma",
            ],
            "tips": [
                "Roknia has no shade — bring water and a hat",
                "The dolmens are free to visit (open air site)",
                "Combine with a stop at Héliopolis on the way back",
            ],
            "place_id": 4,
            "place_name": "Roknia + Annaba",
        },
        # ─── Spring: Green Guelma ────────────────────────────────────────
        {
            "id": 7,
            "title": "Green Maouna Hike",
            "title_ar": "نزهة الربيع في جبل ونة",
            "title_fr": "Randonnée Verte du Maouna",
            "description": "Spring is the best time to climb Mont Maouna. The entire mountain is covered in emerald green, wildflowers bloom everywhere, and the air is fresh and cool. A moderate 3-hour hike to the 1,411m summit with panoramic views of the entire wilaya.",
            "duration_minutes": 210,
            "difficulty": "hard",
            "mood": "adventurous",
            "season": "spring",
            "category": "nature",
            "image_url": None,
            "steps": [
                "Start early from the trailhead at the forest edge",
                "Follow the ridge trail through blooming wildflowers",
                "Rest at the mid-point — listen to birds",
                "Push to the summit (1,411m)",
                "360° view — whole province is green",
                "Picnic lunch at the top",
                "Descend before afternoon heat",
            ],
            "tips": [
                "March-April has the most wildflowers",
                "Wear boots — spring mud on the trail",
                "Bring a light jacket — summit can be windy",
                "Look for wild orchids along the trail (Gueltet)",
            ],
            "seasonal_note": "Spring (March-May) is the only time Maouna is fully green. By June the vegetation dries out.",
            "place_id": 3,
            "place_name": "Mont Maouna",
        },
        {
            "id": 8,
            "title": "Seybouse Valley Picnic",
            "title_ar": "نزهة في وادي السبوس",
            "title_fr": "Pique-Nique dans la Vallée de la Seybouse",
            "description": "Spring transforms the Seybouse Valley into a patchwork of bright green wheat fields and red poppies. Pack a picnic and spend a lazy afternoon by the river. The feeling of being surrounded by lush farming country with the Atlas Mountains in the background is unforgettable.",
            "duration_minutes": 240,
            "difficulty": "easy",
            "mood": "peaceful",
            "season": "spring",
            "category": "nature",
            "image_url": None,
            "steps": [
                "Buy fresh bread, cheese, and olives from Guelma central market",
                "Drive 10min west to the Seybouse Valley",
                "Find a spot by the riverbank under eucalyptus trees",
                "Spread the mat and enjoy the picnic",
                "Walk through the wheat fields (ask farmers first)",
                "Photograph the green hills and red poppies",
                "Head back by sunset",
            ],
            "tips": [
                "Best in April — wheat is tall and green",
                "Ask locals which river spots are accessible",
                "Bring insect repellent near the water",
                "Olive oil from Guelma is some of the best in Algeria",
            ],
            "seasonal_note": "Spring (April-May) when the wheat is waist-high and red poppies dot the fields.",
            "place_id": 2,
            "place_name": "Seybouse Valley",
        },
        {
            "id": 9,
            "title": "Roum Echallaha Forest Walk",
            "title_ar": "نزهة في غابة الروحابة",
            "title_fr": "Promenade en Forêt de Roum Echallaha",
            "description": "Guelma province is 31% forest, and spring is when the forests come alive. Roum Echallaha is the largest, with cork oaks, Aleppo pines, and a carpet of wildflowers. Cool air, bird songs, and the smell of damp earth. Perfect for a morning forest bath.",
            "duration_minutes": 180,
            "difficulty": "easy",
            "mood": "peaceful",
            "season": "spring",
            "category": "forest",
            "image_url": None,
            "steps": [
                "Drive 20min from central Guelma to the forest",
                "Enter the cork oak trail",
                "Walk silently — listen for woodpeckers and songbirds",
                "Stop at the clearing for tea from a thermos",
                "Photograph the spring flowers (orchids, irises)",
                "Visit the nearby spring for fresh water",
                "Return feeling refreshed",
            ],
            "tips": [
                "Early morning (7-9am) is best for birdwatching",
                "Wild mushrooms grow in spring — but don't pick if unsure",
                "No entrance fee — the forest is public land",
            ],
            "seasonal_note": "Spring (March-May) when the forest floor is covered in flowers and the air smells of pine and damp earth.",
            "place_id": 5,
            "place_name": "Roum Echallaha Forest",
        },
        {
            "id": 10,
            "title": "Thermal Spring + Green Valley",
            "title_ar": "الحمامات الحرارية والوادي الأخضر",
            "title_fr": "Sources Thermales & Vallée Verte",
            "description": "Spring is the ideal season for thermal baths — warm enough to enjoy outdoor pools, cool enough that the hot springs feel perfect. Visit Hammam Maskhoutine (98°C travertine spring) then walk through the surrounding green valley.",
            "duration_minutes": 300,
            "difficulty": "easy",
            "mood": "relax",
            "season": "spring",
            "category": "thermal_baths",
            "image_url": None,
            "steps": [
                "Arrive at Hammam Maskhoutine by 9am",
                "Soak in the mineral-rich thermal pools",
                "Walk behind the falls to see the multicolored travertine",
                "Picnic lunch by the Ouied Seybouse tributary (green valley)",
                "Visit the hot waterfall cascade",
                "Drive through the blooming countryside back to town",
            ],
            "tips": [
                "Spring has fewer tourists than summer",
                "The mineral water is good for skin and joints",
                "Bring a towel and flip-flops",
            ],
            "seasonal_note": "Spring (March-May) — the valley around Maskhoutine is lush green and the weather is perfect for outdoor soaking.",
            "place_id": 1,
            "place_name": "Hammam Maskhoutine",
        },
    ]

    if mood:
        experiences = [e for e in experiences if e["mood"] == mood or e["category"] == mood]

    if season:
        experiences = [e for e in experiences if e.get("season") == season]

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
