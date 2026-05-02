from typing import Any
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session, joinedload
from app.models.review import PlaceReview
from app.models.place import Place

def create_review(db: Session, user_id: int, place_id: int, rating: int, text: str | None = None) -> PlaceReview:
    # Check if user already reviewed
    stmt = select(PlaceReview).where(PlaceReview.user_id == user_id, PlaceReview.place_id == place_id)
    existing = db.execute(stmt).scalar()
    if existing:
        # Update existing
        existing.rating = rating
        existing.text = text
        existing.created_at = func.now()
    else:
        review = PlaceReview(user_id=user_id, place_id=place_id, rating=rating, text=text)
        db.add(review)
    
    db.commit()
    
    # Update place rating stats
    update_place_rating(db, place_id)
    
    # Re-fetch to return
    stmt = select(PlaceReview).options(joinedload(PlaceReview.user)).where(PlaceReview.user_id == user_id, PlaceReview.place_id == place_id)
    return db.execute(stmt).scalar()

def update_place_rating(db: Session, place_id: int):
    stmt = select(
        func.count(PlaceReview.id),
        func.avg(PlaceReview.rating)
    ).where(PlaceReview.place_id == place_id)
    
    count, avg = db.execute(stmt).first()
    
    place = db.get(Place, place_id)
    if place:
        place.rating_count = count or 0
        place.rating_avg = float(avg or 0.0)
        db.commit()

def get_place_reviews(db: Session, place_id: int, page: int = 1, size: int = 20):
    total_stmt = select(func.count()).select_from(PlaceReview).where(PlaceReview.place_id == place_id)
    total = db.execute(total_stmt).scalar() or 0
    
    stmt = (
        select(PlaceReview)
        .options(joinedload(PlaceReview.user))
        .where(PlaceReview.place_id == place_id)
        .order_by(desc(PlaceReview.created_at))
        .offset((page - 1) * size)
        .limit(size)
    )
    items = db.execute(stmt).scalars().all()
    
    return items, total
