from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, Numeric, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from app.models.place import Place
    from app.models.user import User


class EventCategory(str, Enum):
    FESTIVAL = "festival"
    EXHIBITION = "exhibition"
    WORKSHOP = "workshop"
    TOUR = "tour"
    CULTURAL = "cultural"
    SPORT = "sport"
    OTHER = "other"


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (
        CheckConstraint(
            "category IN ('festival', 'exhibition', 'workshop', 'tour', 'cultural', 'sport', 'other')",
            name="ck_events_category",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    title_ar: Mapped[str] = mapped_column(String(255), nullable=False)
    title_en: Mapped[str] = mapped_column(String(255), nullable=False)
    title_fr: Mapped[str] = mapped_column(String(255), nullable=False)
    description_ar: Mapped[str] = mapped_column(Text, nullable=False)
    description_en: Mapped[str] = mapped_column(Text, nullable=False)
    description_fr: Mapped[str] = mapped_column(Text, nullable=False)
    place_id: Mapped[int | None] = mapped_column(
        ForeignKey("places.id", ondelete="SET NULL"), nullable=True
    )
    organizer_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    end_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    category: Mapped[EventCategory] = mapped_column(String(20), nullable=False)
    max_participants: Mapped[int | None] = mapped_column(Integer, nullable=True)
    current_participants: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False, server_default="0"
    )
    price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_approved: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, server_default="0"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    place: Mapped["Place | None"] = relationship(back_populates="events")
    organizer: Mapped["User | None"] = relationship(
        back_populates="organized_events"
    )
    registrations: Mapped[list["EventRegistration"]] = relationship(
        back_populates="event", cascade="all, delete-orphan"
    )
