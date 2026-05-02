from pydantic import BaseModel

class AdminStats(BaseModel):
    total_users: int
    total_places: int
    total_activities: int
    activities_this_month: int
