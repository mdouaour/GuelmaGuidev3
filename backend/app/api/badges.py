from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_roles
from app.db.session import get_db
from app.models.badge import Badge, BadgeCategory
from app.models.user import User, UserRole
from app.models.user_badge import UserBadge
from app.schemas.badge import BadgeCreate, BadgeRead, LeaderboardEntry, UserBadgeRead

router = APIRouter()


@router.get("", response_model=list[BadgeRead])
def list_badges(
    db: Annotated[Session, Depends(get_db)],
    category: Annotated[BadgeCategory | None, Query()] = None,
) -> list[BadgeRead]:
    stmt = select(Badge)
    if category:
        stmt = stmt.where(Badge.category == category)
    stmt = stmt.order_by(Badge.points.desc(), Badge.created_at.desc())
    return [BadgeRead.model_validate(b) for b in db.scalars(stmt)]


@router.get("/{badge_id}", response_model=BadgeRead)
def get_badge(
    badge_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> BadgeRead:
    badge = db.get(Badge, badge_id)
    if not badge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Badge not found")
    return BadgeRead.model_validate(badge)


@router.post("", response_model=BadgeRead, status_code=status.HTTP_201_CREATED)
def create_badge(
    payload: BadgeCreate,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
) -> BadgeRead:
    badge = Badge(**payload.model_dump())
    db.add(badge)
    db.commit()
    db.refresh(badge)
    return BadgeRead.model_validate(badge)


@router.put("/{badge_id}", response_model=BadgeRead)
def update_badge(
    badge_id: str,
    payload: BadgeCreate,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
) -> BadgeRead:
    badge = db.get(Badge, badge_id)
    if not badge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Badge not found")
    for key, value in payload.model_dump().items():
        setattr(badge, key, value)
    db.commit()
    db.refresh(badge)
    return BadgeRead.model_validate(badge)


@router.delete("/{badge_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_badge(
    badge_id: str,
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
) -> None:
    badge = db.get(Badge, badge_id)
    if not badge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Badge not found")
    db.delete(badge)
    db.commit()


@router.get("/users/me", response_model=list[UserBadgeRead])
def get_my_badges(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[UserBadgeRead]:
    stmt = (
        select(UserBadge)
        .where(UserBadge.user_id == current_user.id)
        .order_by(UserBadge.earned_at.desc())
    )
    return [UserBadgeRead.model_validate(ub) for ub in db.scalars(stmt)]


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def get_leaderboard(
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> list[LeaderboardEntry]:
    stmt = (
        select(
            UserBadge.user_id,
            func.sum(Badge.points).label("total_points"),
            func.count(UserBadge.id).label("badge_count"),
        )
        .join(Badge, UserBadge.badge_id == Badge.id)
        .group_by(UserBadge.user_id)
        .order_by(func.sum(Badge.points).desc())
        .limit(limit)
    )
    rows = db.execute(stmt).all()
    if not rows:
        return []
    user_ids = [r.user_id for r in rows]
    users = {
        u.id: u
        for u in db.scalars(select(User).where(User.id.in_(user_ids)))
    }
    return [
        LeaderboardEntry(
            user_id=row.user_id,
            user_name=users[row.user_id].full_name if row.user_id in users else None,
            avatar_url=users[row.user_id].avatar_url if row.user_id in users else None,
            total_points=int(row.total_points),
            badge_count=int(row.badge_count),
        )
        for row in rows
    ]
