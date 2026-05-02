from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, Field, field_validator

if TYPE_CHECKING:
    from app.models.activity import Activity

_ALLOWED_MOODS = {"relax", "move", "social", "discover"}
_ALLOWED_VISIBILITIES = {"public", "private"}


class ActivityBase(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=10, max_length=4000)
    place_id: int
    date_time: datetime
    max_participants: int = Field(gt=0)
    price_per_ticket: float | None = None
    currency: str = "DZD"

    @field_validator("title", "description")
    @classmethod
    def validate_not_blank(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Field cannot be blank")
        return normalized


class ActivityCreate(ActivityBase):
    mood: str | None = None
    visibility: str = "public"

    @field_validator("mood")
    @classmethod
    def validate_mood(cls, value: str | None) -> str | None:
        if value is not None and value not in _ALLOWED_MOODS:
            raise ValueError(f"mood must be one of {_ALLOWED_MOODS}")
        return value

    @field_validator("visibility")
    @classmethod
    def validate_visibility(cls, value: str) -> str:
        if value not in _ALLOWED_VISIBILITIES:
            raise ValueError(f"visibility must be one of {_ALLOWED_VISIBILITIES}")
        return value


class ActivityRead(ActivityBase):
    id: int
    organizer_id: int
    participants_count: int
    created_at: datetime
    updated_at: datetime
    mood: str | None = None
    visibility: str = "public"
    approval_status: str = "approved"
    rejection_reason: str | None = None
    status: str = "active"
    is_featured: bool = False
    is_recurring: bool = False
    recurrence_rule: str | None = None
    place_name: str = ""
    organizer_verified: bool = False
    model_config = {"from_attributes": True}


class ActivityRegistrationRead(BaseModel):
    user_id: int
    activity_id: int
    payment_status: str | None = "free"
    created_at: datetime
    model_config = {"from_attributes": True}


class ActivityTicketRead(BaseModel):
    activity: ActivityRead
    registration: ActivityRegistrationRead


class JoinActivityResponse(BaseModel):
    is_paid: bool
    checkout_url: str | None = None
    registration: ActivityRegistrationRead | None = None


class PaginatedActivitiesResponse(BaseModel):
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    limit: int = Field(ge=1, le=100)
    results: list[ActivityRead]


def to_activity_read(
    activity: "Activity",
    participants_count: int,
    place_name: str = "",
    organizer_verified: bool = False,
) -> ActivityRead:
    return ActivityRead(
        id=activity.id,
        title=activity.title,
        description=activity.description,
        place_id=activity.place_id,
        organizer_id=activity.organizer_id,
        date_time=activity.date_time,
        max_participants=activity.max_participants,
        participants_count=participants_count,
        created_at=activity.created_at,
        updated_at=activity.updated_at,
        mood=activity.mood,
        visibility=activity.visibility,
        approval_status=activity.approval_status,
        rejection_reason=activity.rejection_reason,
        status=activity.status,
        is_recurring=activity.is_recurring,
        recurrence_rule=activity.recurrence_rule,
        place_name=place_name,
        organizer_verified=organizer_verified,
        price_per_ticket=float(activity.price_per_ticket) if activity.price_per_ticket is not None else None,
        currency=activity.currency,
        is_featured=activity.is_featured,
    )
