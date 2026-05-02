from typing import Any
from sqlalchemy import select, delete, func
from sqlalchemy.orm import Session
from app.models.wishlist import Wishlist
from app.models.place import Place

def add_to_wishlist(db: Session, user_id: int, place_id: int) -> Wishlist:
    # Check if exists
    stmt = select(Wishlist).where(Wishlist.user_id == user_id, Wishlist.place_id == place_id)
    existing = db.execute(stmt).scalar()
    if existing:
        return existing
    
    wishlist = Wishlist(user_id=user_id, place_id=place_id)
    db.add(wishlist)
    db.commit()
    db.refresh(wishlist)
    return wishlist

def remove_from_wishlist(db: Session, user_id: int, place_id: int) -> bool:
    stmt = delete(Wishlist).where(Wishlist.user_id == user_id, Wishlist.place_id == place_id)
    result = db.execute(stmt)
    db.commit()
    return result.rowcount > 0

def get_user_wishlist(db: Session, user_id: int) -> list[Wishlist]:
    from sqlalchemy.orm import joinedload
    stmt = select(Wishlist).options(joinedload(Wishlist.place)).where(Wishlist.user_id == user_id).order_by(Wishlist.created_at.desc())
    return list(db.execute(stmt).scalars().all())

def is_in_wishlist(db: Session, user_id: int, place_id: int) -> bool:
    stmt = select(func.count()).select_from(Wishlist).where(Wishlist.user_id == user_id, Wishlist.place_id == place_id)
    return (db.execute(stmt).scalar() or 0) > 0
