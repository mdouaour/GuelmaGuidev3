from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, JSON, CheckConstraint, Float, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import TimestampedBase

if TYPE_CHECKING:
    from app.models.activity import Activity
    from app.models.wishlist import Wishlist
    from app.models.review import PlaceReview


class PlaceCategory(str, Enum):
    FOREST = "forest"
    SPORTS = "sports"
    RELAXATION = "relaxation"
    CULTURE = "culture"
    NATURE = "nature"
    THERMAL_BATHS = "thermal_baths"


class Place(TimestampedBase):
    __tablename__ = "places"
    __table_args__ = (
        CheckConstraint(
            "category IN ('forest', 'sports', 'relaxation', 'culture', 'nature', 'thermal_baths')",
            name="ck_places_category",
        ),
        Index("ix_places_latitude_longitude_category", "latitude", "longitude", "category"),
    )

    name: Mapped[str] = mapped_column(String(255), index=True, nullable=True)
    name_ar: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    name_en: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    description_ar: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float] = mapped_column(Float, index=True, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, index=True, nullable=False)
    category: Mapped[PlaceCategory] = mapped_column(String(32), index=True, nullable=False)
    theme: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    images: Mapped[list[str]] = mapped_column(JSON, default=lambda: [], nullable=False)
    featured: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="0")
    rating_avg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False, server_default="0.0")
    rating_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False, server_default="0")
    search_vector: Mapped[str | None] = mapped_column(TSVECTOR, nullable=True)

    activities: Mapped[list["Activity"]] = relationship(back_populates="place")
    wishlisted_by: Mapped[list["Wishlist"]] = relationship("Wishlist", back_populates="place", cascade="all, delete-orphan")
    reviews: Mapped[list["PlaceReview"]] = relationship("PlaceReview", back_populates="place", cascade="all, delete-orphan")
