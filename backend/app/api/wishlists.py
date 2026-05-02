from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.wishlist import WishlistRead
from app.services.wishlist_service import add_to_wishlist, remove_from_wishlist, get_user_wishlist
from app.schemas.place import PlaceRead
from app.utils.localization import get_preferred_language
from fastapi import Header

router = APIRouter()

@router.post("/{place_id}", status_code=status.HTTP_201_CREATED)
def save_to_wishlist(
    place_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    add_to_wishlist(db, user_id=current_user.id, place_id=place_id)
    return {"message": "Place saved to wishlist"}

@router.delete("/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_from_wishlist(
    place_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    remove_from_wishlist(db, user_id=current_user.id, place_id=place_id)
    return

@router.get("/", response_model=list[PlaceRead])
def get_wishlist(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    accept_language: Annotated[str | None, Header()] = None,
):
    from app.api.places import _to_place_read
    lang = get_preferred_language(accept_language)
    items = get_user_wishlist(db, user_id=current_user.id)
    return [_to_place_read(item.place, lang, current_user.id) for item in items]
