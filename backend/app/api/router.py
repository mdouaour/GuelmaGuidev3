from fastapi import APIRouter

from app.api.activities import router as activities_router
from app.api.admin import router as admin_router
from app.api.ai import router as ai_router
from app.api.webhooks import router as webhooks_router
from app.api.organiser import router as organiser_router
from app.api.auth import router as auth_router
from app.api.places import router as places_router
from app.api.routes.users import router as users_router
from app.api.health import router as health_router
from app.api.notifications import router as notifications_router
from app.api.wishlists import router as wishlist_router

api_router = APIRouter()
api_router.include_router(health_router, prefix="/health", tags=["health"])
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(places_router, prefix="/places", tags=["places"])
api_router.include_router(activities_router, prefix="/activities", tags=["activities"])
api_router.include_router(wishlist_router, prefix="/wishlists", tags=["wishlists"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["notifications"])
api_router.include_router(ai_router, prefix="/ai", tags=["ai"])
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
api_router.include_router(organiser_router, prefix="/organiser", tags=["organiser"])
api_router.include_router(webhooks_router, prefix="/webhooks", tags=["webhooks"])
