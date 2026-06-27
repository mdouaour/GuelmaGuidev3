from datetime import datetime
import uuid

from pydantic import BaseModel, Field


class AudioGuideBase(BaseModel):
    place_id: int
    title_ar: str = Field(min_length=1, max_length=255)
    title_en: str = Field(min_length=1, max_length=255)
    title_fr: str = Field(min_length=1, max_length=255)
    audio_url: str = Field(min_length=1)
    duration_seconds: int = Field(gt=0)
    language: str = Field(min_length=2, max_length=10)
    narrator_name: str | None = None


class AudioGuideCreate(AudioGuideBase):
    pass


class AudioGuideRead(AudioGuideBase):
    id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}
