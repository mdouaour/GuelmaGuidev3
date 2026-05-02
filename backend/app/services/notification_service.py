from typing import Any
from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType

def create_notification(
    db: Session,
    user_id: int,
    type: NotificationType,
    title: str,
    body: str,
    payload: dict[str, Any] | None = None
) -> Notification:
    """Helper to create a notification."""
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        payload=payload
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
