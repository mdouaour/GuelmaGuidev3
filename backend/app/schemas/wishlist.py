from datetime import datetime
from pydantic import BaseModel
from app.schemas.place import PlaceRead

class WishlistCreate(BaseModel):
    place_id: int

class WishlistRead(BaseModel):
    id: int
    place_id: int
    created_at: datetime
    place: PlaceRead

    class Config:
        from_attributes = True
