import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.session import get_db
from app.models.notification import Notification, NotificationType
from app.models.user import User
from app.schemas.notification import NotificationRead, NotificationPagination, NotificationUpdate

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=NotificationPagination)
def get_notifications(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    """Get current user's notifications, unread first."""
    # Count total
    total_stmt = select(func.count()).select_from(Notification).where(Notification.user_id == current_user.id)
    total = db.execute(total_stmt).scalar() or 0

    # Count unread
    unread_stmt = select(func.count()).select_from(Notification).where(
        Notification.user_id == current_user.id,
        Notification.read == False
    )
    unread_count = db.execute(unread_stmt).scalar() or 0

    # Get items
    stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.read.asc(), desc(Notification.created_at))
        .offset((page - 1) * size)
        .limit(size)
    )
    items = db.execute(stmt).scalars().all()

    return NotificationPagination(
        items=list(items),
        total=total,
        unread_count=unread_count,
        page=page,
        pages=(total + size - 1) // size
    )

@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_as_read(
    notification_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Mark a notification as read."""
    notification = db.get(Notification, notification_id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.read = True
    db.commit()
    db.refresh(notification)
    return notification

@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_as_read(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Mark all current user's notifications as read."""
    from sqlalchemy import update
    db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.read == False)
        .values(read=True)
    )
    db.commit()
    return

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
