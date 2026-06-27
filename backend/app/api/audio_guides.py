from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.db.session import get_db
from app.models.audio_guide import AudioGuide
from app.models.user import User, UserRole
from app.schemas.audio_guide import AudioGuideCreate, AudioGuideRead

router = APIRouter()


@router.get("", response_model=list[AudioGuideRead])
def list_audio_guides(
    db: Annotated[Session, Depends(get_db)],
    place_id: Annotated[int | None, Query()] = None,
    language: Annotated[str | None, Query(min_length=2, max_length=10)] = None,
) -> list[AudioGuideRead]:
    stmt = select(AudioGuide)
    if place_id is not None:
        stmt = stmt.where(AudioGuide.place_id == place_id)
    if language:
        stmt = stmt.where(AudioGuide.language == language)
    stmt = stmt.order_by(AudioGuide.created_at.desc())
    return [AudioGuideRead.model_validate(a) for a in db.scalars(stmt)]


@router.get("/{audio_id}", response_model=AudioGuideRead)
def get_audio_guide(
    audio_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> AudioGuideRead:
    audio = db.get(AudioGuide, audio_id)
    if not audio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio guide not found")
    return AudioGuideRead.model_validate(audio)


@router.post("", response_model=AudioGuideRead, status_code=status.HTTP_201_CREATED)
def create_audio_guide(
    payload: AudioGuideCreate,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
) -> AudioGuideRead:
    audio = AudioGuide(**payload.model_dump())
    db.add(audio)
    db.commit()
    db.refresh(audio)
    return AudioGuideRead.model_validate(audio)


@router.put("/{audio_id}", response_model=AudioGuideRead)
def update_audio_guide(
    audio_id: str,
    payload: AudioGuideCreate,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
) -> AudioGuideRead:
    audio = db.get(AudioGuide, audio_id)
    if not audio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio guide not found")
    for key, value in payload.model_dump().items():
        setattr(audio, key, value)
    db.commit()
    db.refresh(audio)
    return AudioGuideRead.model_validate(audio)


@router.delete("/{audio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_audio_guide(
    audio_id: str,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
) -> None:
    audio = db.get(AudioGuide, audio_id)
    if not audio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio guide not found")
    db.delete(audio)
    db.commit()
