from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, or_
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_roles
from app.db.session import get_db
from app.models.event import Event, EventCategory
from app.models.event_registration import EventRegistration, RegistrationStatus
from app.models.user import User, UserRole
from app.schemas.event import EventCreate, EventRead, EventRegistrationCreate, EventRegistrationRead

router = APIRouter()


@router.get("", response_model=list[EventRead])
def list_events(
    db: Annotated[Session, Depends(get_db)],
    category: Annotated[EventCategory | None, Query()] = None,
    upcoming: Annotated[bool, Query()] = True,
    approved_only: Annotated[bool, Query()] = True,
    organizer_id: Annotated[int | None, Query()] = None,
) -> list[EventRead]:
    stmt = select(Event)
    if approved_only:
        stmt = stmt.where(Event.is_approved.is_(True))
    if category:
        stmt = stmt.where(Event.category == category)
    if organizer_id:
        stmt = stmt.where(Event.organizer_id == organizer_id)
    if upcoming:
        stmt = stmt.where(Event.start_date >= func.now())
    stmt = stmt.order_by(Event.start_date.asc())
    return [EventRead.model_validate(e) for e in db.scalars(stmt)]


@router.get("/{event_id}", response_model=EventRead)
def get_event(
    event_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> EventRead:
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return EventRead.model_validate(event)


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> EventRead:
    if payload.end_date <= payload.start_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="end_date must be after start_date",
        )
    data = payload.model_dump()
    data["organizer_id"] = current_user.id
    event = Event(**data)
    db.add(event)
    db.commit()
    db.refresh(event)
    return EventRead.model_validate(event)


@router.put("/{event_id}", response_model=EventRead)
def update_event(
    event_id: str,
    payload: EventCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> EventRead:
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    if payload.end_date <= payload.start_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="end_date must be after start_date",
        )
    for key, value in payload.model_dump().items():
        setattr(event, key, value)
    db.commit()
    db.refresh(event)
    return EventRead.model_validate(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    db.delete(event)
    db.commit()


@router.post("/{event_id}/register", response_model=EventRegistrationRead, status_code=status.HTTP_201_CREATED)
def register_for_event(
    event_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> EventRegistrationRead:
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    existing = db.scalar(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == current_user.id,
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already registered for this event",
        )
    if event.max_participants and event.current_participants >= event.max_participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event is full",
        )
    reg = EventRegistration(event_id=event.id, user_id=current_user.id)
    db.add(reg)
    event.current_participants += 1
    db.commit()
    db.refresh(reg)
    return EventRegistrationRead.model_validate(reg)


@router.delete("/{event_id}/register", status_code=status.HTTP_204_NO_CONTENT)
def cancel_registration(
    event_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    reg = db.scalar(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == current_user.id,
        )
    )
    if not reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")
    event = db.get(Event, event_id)
    if event and event.current_participants > 0:
        event.current_participants -= 1
    db.delete(reg)
    db.commit()


@router.get("/{event_id}/registrations", response_model=list[EventRegistrationRead])
def list_event_registrations(
    event_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[EventRegistrationRead]:
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    stmt = (
        select(EventRegistration)
        .where(EventRegistration.event_id == event_id)
        .order_by(EventRegistration.registered_at.desc())
    )
    return [EventRegistrationRead.model_validate(r) for r in db.scalars(stmt)]
