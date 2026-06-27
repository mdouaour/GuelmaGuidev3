from datetime import datetime
import uuid

from pydantic import BaseModel, Field

from app.models.badge import BadgeCategory
from app.models.user_badge import UserBadge


class BadgeBase(BaseModel):
    name_ar: str = Field(min_length=1, max_length=255)
    name_en: str = Field(min_length=1, max_length=255)
    name_fr: str = Field(min_length=1, max_length=255)
    description_ar: str = Field(min_length=1)
    description_en: str = Field(min_length=1)
    description_fr: str = Field(min_length=1)
    icon: str = Field(min_length=1, max_length=100)
    category: BadgeCategory
    criteria: dict
    points: int = Field(ge=0)


class BadgeCreate(BadgeBase):
    pass


class BadgeRead(BadgeBase):
    id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class UserBadgeRead(BaseModel):
    id: uuid.UUID
    badge_id: uuid.UUID
    badge: BadgeRead | None = None
    earned_at: datetime
    progress: dict

    model_config = {"from_attributes": True}


class LeaderboardEntry(BaseModel):
    user_id: int
    user_name: str | None = None
    avatar_url: str | None = None
    total_points: int
    badge_count: int
