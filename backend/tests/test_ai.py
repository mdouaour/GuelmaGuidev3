from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import User, UserRole


def _register_user(client: TestClient, email: str) -> None:
    response = client.post("/api/v1/auth/register", json={"email": email, "password": "SecureP@ss123!"})
    assert response.status_code == 201


def _login_user(client: TestClient, email: str) -> str:
    login = client.post("/api/v1/auth/login", json={"email": email, "password": "SecureP@ss123!"})
    assert login.status_code == 200
    return login.json()["access_token"]


def _set_organizer(db_session: Session, email: str) -> None:
    user = db_session.query(User).filter(User.email == email).one()
    user.role = UserRole.ORGANIZER
    db_session.commit()


def test_ai_recommendations_returns_places_and_activities(client: TestClient, db_session: Session) -> None:
    organizer_email = "ai-org@example.com"
    _register_user(client, organizer_email)
    _set_organizer(db_session, organizer_email)
    organizer_token = _login_user(client, organizer_email)

    place_response = client.post(
        "/api/v1/places",
        headers={"Authorization": f"Bearer {organizer_token}"},
        json={
            "name": "Thermal Spot",
            "description": "Relaxation thermal location for visitors and locals.",
            "latitude": 36.47,
            "longitude": 7.42,
            "category": "thermal_baths",
            "theme": "wellness",
            "images": [],
        },
    )
    place_id = place_response.json()["id"]

    client.post(
        "/api/v1/activities",
        headers={"Authorization": f"Bearer {organizer_token}"},
        json={
            "title": "Relax Session",
            "description": "Guided wellness session in thermal baths.",
            "place_id": place_id,
            "date_time": (datetime.now(UTC) + timedelta(days=1)).isoformat(),
            "max_participants": 10,
        },
    )

    response = client.get(
        "/api/v1/ai/recommendations",
        params={
            "latitude": 36.46,
            "longitude": 7.43,
            "category": "thermal_baths",
            "time_of_day": "evening",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body["recommended_places"]) >= 1
    assert len(body["recommended_activities"]) >= 1
