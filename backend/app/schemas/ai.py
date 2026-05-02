from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field

from app.models.place import PlaceCategory


class TimeOfDay(str, Enum):
    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"


class RecommendedPlace(BaseModel):
    id: int
    name: str
    category: PlaceCategory
    theme: str
    latitude: float
    longitude: float
    distance_km: float = Field(ge=0)
    score: float


class RecommendedActivity(BaseModel):
    id: int
    title: str
    description: str
    place_id: int
    place_name: str
    place_category: PlaceCategory
    date_time: datetime
    max_participants: int = Field(gt=0)
    participants_count: int = Field(ge=0)
    available_slots: int = Field(ge=0)
    is_joined: bool
    distance_km: float = Field(ge=0)
    score: float


class RecommendationsResponse(BaseModel):
    recommended_places: list[RecommendedPlace]
    recommended_activities: list[RecommendedActivity]
