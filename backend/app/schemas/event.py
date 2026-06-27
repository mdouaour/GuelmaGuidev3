from datetime import datetime
from decimal import Decimal
import uuid

from pydantic import BaseModel, Field

from app.models.event import EventCategory
from app.models.event_registration import RegistrationStatus


class EventBase(BaseModel):
    title_ar: str = Field(min_length=1, max_length=255)
    title_en: str = Field(min_length=1, max_length=255)
    title_fr: str = Field(min_length=1, max_length=255)
    description_ar: str = Field(min_length=1)
    description_en: str = Field(min_length=1)
    description_fr: str = Field(min_length=1)
    place_id: int | None = None
    start_date: datetime
    end_date: datetime
    category: EventCategory
    max_participants: int | None = None
    price: Decimal | None = None
    image: str | None = None


class EventCreate(EventBase):
    pass


class EventRead(EventBase):
    id: uuid.UUID
    organizer_id: int | None = None
    current_participants: int = 0
    is_approved: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EventRegistrationRead(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    user_id: int
    registered_at: datetime
    status: RegistrationStatus

    model_config = {"from_attributes": True}


class EventRegistrationCreate(BaseModel):
    pass
