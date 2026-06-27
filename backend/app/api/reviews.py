from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.place import Place
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewPagination, ReviewRead
from app.services.review_service import create_review, get_place_reviews

router = APIRouter()


@router.post("/{place_id}/reviews", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
def create_place_review(
    place_id: int,
    payload: ReviewCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ReviewRead:
    """Create or update (upsert) a review for a place."""
    place = db.get(Place, place_id)
    if place is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")

    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Rating must be between 1 and 5",
        )

    review = create_review(
        db=db,
        user_id=current_user.id,
        place_id=place_id,
        rating=payload.rating,
        text=payload.text,
    )
    return _review_to_read(review)


@router.get("/{place_id}/reviews", response_model=ReviewPagination)
def list_place_reviews(
    place_id: int,
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> ReviewPagination:
    """List all reviews for a place with pagination."""
    place = db.get(Place, place_id)
    if place is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")

    items, total = get_place_reviews(db, place_id=place_id, page=page, size=size)
    pages = max(1, (total + size - 1) // size)

    return ReviewPagination(
        items=[_review_to_read(r) for r in items],
        total=total,
        page=page,
        pages=pages,
    )


def _review_to_read(review) -> ReviewRead:
    """Convert a PlaceReview ORM object to a ReviewRead schema."""
    return ReviewRead(
        id=review.id,
        user_id=review.user_id,
        place_id=review.place_id,
        rating=review.rating,
        text=review.text,
        user_name=review.user.full_name if review.user and review.user.full_name else review.user.email.split("@")[0] if review.user else None,
        user_avatar=review.user.avatar_url if review.user else None,
        created_at=review.created_at,
    )
