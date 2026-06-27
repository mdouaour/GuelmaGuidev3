from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.guide import Guide, GuideCategory, GuideDifficulty
from app.models.guide_place import GuidePlace
from app.models.place import Place
from app.models.user import User
from app.schemas.guide import (
    GuideCreate,
    GuideListRead,
    GuidePlaceAdd,
    GuidePlaceRead,
    GuidePlaceReorder,
    GuideRead,
)

router = APIRouter()


@router.get("", response_model=list[GuideListRead])
def list_guides(
    db: Annotated[Session, Depends(get_db)],
    difficulty: Annotated[GuideDifficulty | None, Query()] = None,
    category: Annotated[GuideCategory | None, Query()] = None,
    published_only: Annotated[bool, Query()] = True,
) -> list[GuideListRead]:
    stmt = select(Guide)
    if published_only:
        stmt = stmt.where(Guide.is_published.is_(True))
    if difficulty:
        stmt = stmt.where(Guide.difficulty == difficulty)
    if category:
        stmt = stmt.where(Guide.category == category)
    stmt = stmt.order_by(Guide.created_at.desc())
    guides = db.scalars(stmt)
    result = []
    for g in guides:
        place_count = len(g.places) if g.places else 0
        result.append(
            GuideListRead(
                id=g.id,
                title_ar=g.title_ar,
                title_en=g.title_en,
                title_fr=g.title_fr,
                cover_image=g.cover_image,
                duration_minutes=g.duration_minutes,
                difficulty=g.difficulty,
                category=g.category,
                is_published=g.is_published,
                author_id=g.author_id,
                created_at=g.created_at,
                place_count=place_count,
            )
        )
    return result


@router.get("/{guide_id}", response_model=GuideRead)
def get_guide(
    guide_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> GuideRead:
    guide = db.get(Guide, guide_id)
    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")
    guide_read = GuideRead.model_validate(guide)
    guide_read.places = [
        GuidePlaceRead.model_validate(gp) for gp in (guide.places or [])
    ]
    return guide_read


@router.post("", response_model=GuideRead, status_code=status.HTTP_201_CREATED)
def create_guide(
    payload: GuideCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GuideRead:
    place_ids = payload.place_ids
    data = payload.model_dump(exclude={"place_ids"})
    if data.get("author_id") is None:
        data["author_id"] = current_user.id
    guide = Guide(**data)
    db.add(guide)
    db.flush()
    for idx, place_id in enumerate(place_ids):
        place = db.get(Place, place_id)
        if not place:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Place {place_id} not found",
            )
        gp = GuidePlace(guide_id=guide.id, place_id=place_id, order=idx)
        db.add(gp)
    db.commit()
    db.refresh(guide)
    guide_read = GuideRead.model_validate(guide)
    guide_read.places = [
        GuidePlaceRead.model_validate(gp) for gp in (guide.places or [])
    ]
    return guide_read


@router.put("/{guide_id}", response_model=GuideRead)
def update_guide(
    guide_id: str,
    payload: GuideCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GuideRead:
    guide = db.get(Guide, guide_id)
    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")
    if guide.author_id and guide.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    place_ids = payload.place_ids
    data = payload.model_dump(exclude={"place_ids"})
    for key, value in data.items():
        setattr(guide, key, value)
    db.flush()
    existing = db.scalars(
        select(GuidePlace).where(GuidePlace.guide_id == guide.id)
    ).all()
    for gp in existing:
        db.delete(gp)
    for idx, place_id in enumerate(place_ids):
        gp = GuidePlace(guide_id=guide.id, place_id=place_id, order=idx)
        db.add(gp)
    db.commit()
    db.refresh(guide)
    guide_read = GuideRead.model_validate(guide)
    guide_read.places = [
        GuidePlaceRead.model_validate(gp) for gp in (guide.places or [])
    ]
    return guide_read


@router.delete("/{guide_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_guide(
    guide_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    guide = db.get(Guide, guide_id)
    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")
    if guide.author_id and guide.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    db.delete(guide)
    db.commit()


@router.post("/{guide_id}/places", response_model=GuidePlaceRead, status_code=status.HTTP_201_CREATED)
def add_place_to_guide(
    guide_id: str,
    payload: GuidePlaceAdd,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GuidePlaceRead:
    guide = db.get(Guide, guide_id)
    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")
    place = db.get(Place, payload.place_id)
    if not place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")
    existing_places = db.scalars(
        select(GuidePlace).where(GuidePlace.guide_id == guide.id).order_by(GuidePlace.order.desc())
    ).all()
    max_order = existing_places[0].order if existing_places else -1
    gp = GuidePlace(
        guide_id=guide.id,
        place_id=payload.place_id,
        order=payload.order if payload.order is not None else max_order + 1,
        notes=payload.notes,
        estimated_time_minutes=payload.estimated_time_minutes,
    )
    db.add(gp)
    db.commit()
    db.refresh(gp)
    return GuidePlaceRead.model_validate(gp)


@router.delete("/{guide_id}/places/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_place_from_guide(
    guide_id: str,
    place_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    gp = db.scalar(
        select(GuidePlace).where(
            GuidePlace.guide_id == guide_id, GuidePlace.place_id == place_id
        )
    )
    if not gp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="GuidePlace not found")
    db.delete(gp)
    db.commit()


@router.put("/{guide_id}/places/reorder", response_model=GuideRead)
def reorder_guide_places(
    guide_id: str,
    payload: GuidePlaceReorder,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GuideRead:
    guide = db.get(Guide, guide_id)
    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")
    existing = db.scalars(
        select(GuidePlace).where(GuidePlace.guide_id == guide.id)
    ).all()
    place_map = {gp.place_id: gp for gp in existing}
    for idx, place_id in enumerate(payload.place_ids):
        if place_id in place_map:
            place_map[place_id].order = idx
    db.commit()
    db.refresh(guide)
    guide_read = GuideRead.model_validate(guide)
    guide_read.places = [
        GuidePlaceRead.model_validate(gp) for gp in (guide.places or [])
    ]
    return guide_read
