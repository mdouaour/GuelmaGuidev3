from datetime import datetime
from typing import Any
from pydantic import BaseModel
from app.models.notification import NotificationType

class NotificationBase(BaseModel):
    title: str
    body: str
    type: NotificationType
    payload: dict[str, Any] | None = None

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationUpdate(BaseModel):
    read: bool

class NotificationRead(NotificationBase):
    id: int
    user_id: int
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationPagination(BaseModel):
    items: list[NotificationRead]
    total: int
    unread_count: int
    page: int
    pages: int
