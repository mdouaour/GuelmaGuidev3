from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import TimestampedBase

if TYPE_CHECKING:
    from app.models.activity import Activity, ActivityRegistration
    from app.models.notification import Notification
    from app.models.auth_token import RefreshToken
    from app.models.wishlist import Wishlist
    from app.models.review import PlaceReview


class UserRole(str, Enum):
    VISITOR = "visitor"
    ORGANIZER = "organizer"
    ADMIN = "admin"


MAX_ROLE_LENGTH = 20


class User(TimestampedBase):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('visitor', 'organizer', 'admin')", name="ck_users_role"),
    )

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(
        String(MAX_ROLE_LENGTH), default=UserRole.VISITOR, nullable=False
    )
    organizer_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="0")
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="0")
    
    # Organiser Pro fields
    organiser_pro: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="0")
    pro_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    organized_activities: Mapped[list["Activity"]] = relationship(
        back_populates="organizer",
        foreign_keys="Activity.organizer_id",
    )
    activity_registrations: Mapped[list["ActivityRegistration"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    joined_activities: Mapped[list["Activity"]] = relationship(
        secondary="activity_registrations",
        back_populates="participants",
        viewonly=True,
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    wishlist_items: Mapped[list["Wishlist"]] = relationship(
        "Wishlist", back_populates="user", cascade="all, delete-orphan"
    )
    place_reviews: Mapped[list["PlaceReview"]] = relationship(
        "PlaceReview", back_populates="user", cascade="all, delete-orphan"
    )
