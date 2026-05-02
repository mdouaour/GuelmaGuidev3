from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import User, UserRole


def _register_user(client: TestClient, email: str, password: str = "Password1!") -> None:
    response = client.post("/api/v1/auth/register", json={"email": email, "password": password})
    assert response.status_code == 201


def _login_user(client: TestClient, email: str, password: str = "Password1!") -> str:
    login_response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login_response.status_code == 200
    return login_response.json()["access_token"]


def _set_role(db_session: Session, email: str, role: UserRole) -> None:
    user = db_session.query(User).filter(User.email == email).one()
    user.role = role
    db_session.commit()


def _create_place(client: TestClient, organizer_token: str) -> int:
    response = client.post(
        "/api/v1/places",
        headers={"Authorization": f"Bearer {organizer_token}"},
        json={
            "name": "Sports Arena",
            "description": "Great place for local activities and sports.",
            "latitude": 36.47,
            "longitude": 7.42,
            "category": "sports",
            "theme": "sport",
            "images": [],
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_activities_availability_filter_and_pagination(client: TestClient, db_session: Session) -> None:
    organizer_email = "organizer-act@example.com"
    _register_user(client, organizer_email)
    _set_role(db_session, organizer_email, UserRole.ORGANIZER)
    organizer_token = _login_user(client, organizer_email)
    place_id = _create_place(client, organizer_token)

    create_activity = client.post(
        "/api/v1/activities",
        headers={"Authorization": f"Bearer {organizer_token}"},
        json={
            "title": "Morning Run",
            "description": "Community morning run for all skill levels.",
            "place_id": place_id,
            "date_time": (datetime.now(UTC) + timedelta(days=1)).isoformat(),
            "max_participants": 1,
        },
    )
    assert create_activity.status_code == 201
    activity_id = create_activity.json()["id"]

    _register_user(client, "visitor-act@example.com")
    visitor_token = _login_user(client, "visitor-act@example.com")
    join_response = client.post(
        f"/api/v1/activities/{activity_id}/join",
        headers={"Authorization": f"Bearer {visitor_token}"},
    )
    assert join_response.status_code == 200

    available = client.get("/api/v1/activities", params={"availability": True})
    assert available.status_code == 200
    assert available.json()["results"] == []

    paginated = client.get("/api/v1/activities", params={"page": 1, "limit": 10})
    assert paginated.status_code == 200
    assert paginated.json()["total"] == 1
    assert len(paginated.json()["results"]) == 1


def test_join_activity_when_full_returns_409(client: TestClient, db_session: Session) -> None:
    organizer_email = "organizer-full@example.com"
    _register_user(client, organizer_email)
    _set_role(db_session, organizer_email, UserRole.ORGANIZER)
    organizer_token = _login_user(client, organizer_email)
    place_id = _create_place(client, organizer_token)

    create_activity = client.post(
        "/api/v1/activities",
        headers={"Authorization": f"Bearer {organizer_token}"},
        json={
            "title": "Evening Walk",
            "description": "Evening walk with local community.",
            "place_id": place_id,
            "date_time": (datetime.now(UTC) + timedelta(days=1)).isoformat(),
            "max_participants": 1,
        },
    )
    activity_id = create_activity.json()["id"]

    _register_user(client, "first@example.com")
    _register_user(client, "second@example.com")
    first = _login_user(client, "first@example.com")
    second = _login_user(client, "second@example.com")

    assert (
        client.post(
            f"/api/v1/activities/{activity_id}/join", headers={"Authorization": f"Bearer {first}"}
        ).status_code
        == 200
    )
    full_response = client.post(
        f"/api/v1/activities/{activity_id}/join", headers={"Authorization": f"Bearer {second}"}
    )
    assert full_response.status_code == 409
