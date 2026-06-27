from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import JSON, CheckConstraint, DateTime, Integer, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class BadgeCategory(str, Enum):
    EXPLORER = "explorer"
    SOCIAL = "social"
    CONTRIBUTOR = "contributor"
    ACHIEVEMENT = "achievement"
    SPECIAL = "special"


class Badge(Base):
    __tablename__ = "badges"
    __table_args__ = (
        CheckConstraint(
            "category IN ('explorer', 'social', 'contributor', 'achievement', 'special')",
            name="ck_badges_category",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name_ar: Mapped[str] = mapped_column(String(255), nullable=False)
    name_en: Mapped[str] = mapped_column(String(255), nullable=False)
    name_fr: Mapped[str] = mapped_column(String(255), nullable=False)
    description_ar: Mapped[str] = mapped_column(Text, nullable=False)
    description_en: Mapped[str] = mapped_column(Text, nullable=False)
    description_fr: Mapped[str] = mapped_column(Text, nullable=False)
    icon: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[BadgeCategory] = mapped_column(String(32), nullable=False)
    criteria: Mapped[dict] = mapped_column(JSON, nullable=False)
    points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
