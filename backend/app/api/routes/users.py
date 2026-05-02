from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.activity import ActivityRead, ActivityTicketRead, ActivityRegistrationRead, to_activity_read
from app.services.activity_service import (
    get_activity_participants_counts,
    list_user_joined_activities,
)

router = APIRouter()


@router.get("/me/activities", response_model=list[ActivityTicketRead])
def my_activities(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[ActivityTicketRead]:
    # list_user_joined_activities now returns list[tuple[Activity, ActivityRegistration]]
    results = list_user_joined_activities(db, current_user.id)
    activity_ids = [a.id for a, r in results]
    participant_counts = get_activity_participants_counts(db, activity_ids)
    
    return [
        ActivityTicketRead(
            activity=to_activity_read(activity, participant_counts.get(activity.id, 0)),
            registration=ActivityRegistrationRead.model_validate(reg)
        )
        for activity, reg in results
    ]
