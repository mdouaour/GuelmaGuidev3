from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, Integer, String, Text, func, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampedBase

if TYPE_CHECKING:
    from app.models.place import Place
    from app.models.user import User


class Activity(TimestampedBase):
    __tablename__ = "activities"
    __table_args__ = (
        CheckConstraint("max_participants > 0", name="ck_activities_max_participants_positive"),
        Index("ix_activities_date_time_place_id", "date_time", "place_id"),
    )

    title: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    place_id: Mapped[int] = mapped_column(
        ForeignKey("places.id", ondelete="CASCADE"), index=True, nullable=False
    )
    organizer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    date_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    max_participants: Mapped[int] = mapped_column(Integer, nullable=False)
    mood: Mapped[str | None] = mapped_column(String(20), index=True, nullable=True, server_default=None)
    visibility: Mapped[str] = mapped_column(String(10), nullable=False, server_default="public")
    approval_status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="approved")
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="active")
    is_recurring: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="0")
    recurrence_rule: Mapped[str | None] = mapped_column(String(50), nullable=True, server_default=None)
    
    # Pricing fields
    price_per_ticket: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, server_default="DZD")
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="0")

    place: Mapped["Place"] = relationship(back_populates="activities")
    organizer: Mapped["User"] = relationship(
        back_populates="organized_activities", foreign_keys=[organizer_id]
    )
    registrations: Mapped[list["ActivityRegistration"]] = relationship(
        back_populates="activity",
        cascade="all, delete-orphan",
    )
    participants: Mapped[list["User"]] = relationship(
        secondary="activity_registrations",
        back_populates="joined_activities",
        viewonly=True,
    )


class ActivityRegistration(Base):
    __tablename__ = "activity_registrations"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    activity_id: Mapped[int] = mapped_column(
        ForeignKey("activities.id", ondelete="CASCADE"), primary_key=True
    )
    stripe_session_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    payment_status: Mapped[str | None] = mapped_column(String(20), nullable=True, server_default="free") # free, pending, paid
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="activity_registrations")
    activity: Mapped["Activity"] = relationship(back_populates="registrations")
