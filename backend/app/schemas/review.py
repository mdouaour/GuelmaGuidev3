from datetime import datetime
from pydantic import BaseModel, Field

class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    text: str | None = None

class ReviewCreate(ReviewBase):
    pass

class ReviewRead(ReviewBase):
    id: int
    user_id: int
    place_id: int
    user_name: str | None = None
    user_avatar: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewPagination(BaseModel):
    items: list[ReviewRead]
    total: int
    page: int
    pages: int
