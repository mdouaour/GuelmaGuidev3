from datetime import datetime

from pydantic import BaseModel

from app.models.user import UserRole


class UserRead(BaseModel):
    id: int
    email: str
    full_name: str | None = None
    avatar_url: str | None = None
    role: UserRole
    organizer_verified: bool
    email_verified: bool
    organiser_pro: bool = False
    pro_expires_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}
