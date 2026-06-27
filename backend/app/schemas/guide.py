from datetime import datetime
import uuid

from pydantic import BaseModel, Field

from app.models.guide import GuideCategory, GuideDifficulty


class GuideBase(BaseModel):
    title_ar: str = Field(min_length=1, max_length=255)
    title_en: str = Field(min_length=1, max_length=255)
    title_fr: str = Field(min_length=1, max_length=255)
    description_ar: str = Field(min_length=1)
    description_en: str = Field(min_length=1)
    description_fr: str = Field(min_length=1)
    cover_image: str | None = None
    duration_minutes: int | None = None
    difficulty: GuideDifficulty
    category: GuideCategory
    is_published: bool = False


class GuideCreate(GuideBase):
    author_id: int | None = None
    place_ids: list[int] = []


class GuidePlaceRead(BaseModel):
    id: uuid.UUID
    place_id: int
    order: int
    notes: str | None = None
    estimated_time_minutes: int | None = None

    model_config = {"from_attributes": True}


class GuideRead(GuideBase):
    id: uuid.UUID
    author_id: int | None = None
    created_at: datetime
    updated_at: datetime
    places: list[GuidePlaceRead] = []

    model_config = {"from_attributes": True}


class GuideListRead(BaseModel):
    id: uuid.UUID
    title_ar: str
    title_en: str
    title_fr: str
    cover_image: str | None = None
    duration_minutes: int | None = None
    difficulty: GuideDifficulty
    category: GuideCategory
    is_published: bool
    author_id: int | None = None
    created_at: datetime
    place_count: int = 0

    model_config = {"from_attributes": True}


class GuidePlaceAdd(BaseModel):
    place_id: int
    order: int | None = None
    notes: str | None = None
    estimated_time_minutes: int | None = None


class GuidePlaceReorder(BaseModel):
    place_ids: list[int]
