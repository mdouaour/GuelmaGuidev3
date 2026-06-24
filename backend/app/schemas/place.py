from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models.place import PlaceCategory


class PlaceBase(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    name_ar: str | None = Field(None, min_length=2, max_length=255)
    name_en: str | None = Field(None, min_length=2, max_length=255)
    description: str | None = Field(None, min_length=10, max_length=4000)
    description_ar: str | None = Field(None, min_length=10, max_length=4000)
    description_en: str | None = Field(None, min_length=10, max_length=4000)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    category: PlaceCategory
    theme: str = Field(min_length=2, max_length=100)
    images: list[str] = Field(default_factory=list)

    @field_validator("name_ar", "name_en", "description_ar", "description_en", "theme")
    @classmethod
    def validate_not_blank(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        if not normalized:
            raise ValueError("Field cannot be blank")
        return normalized


class PlaceCreate(PlaceBase):
    pass


class PlaceRead(PlaceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    featured: bool
    rating_avg: float = 0.0
    rating_count: int = 0
    is_saved: bool = False

    model_config = {"from_attributes": True}


class PaginatedPlacesResponse(BaseModel):
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    limit: int = Field(ge=1, le=100)
    results: list[PlaceRead]
