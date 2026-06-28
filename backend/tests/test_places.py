from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import User, UserRole


def _setup_organizer_and_get_token(client: TestClient, db_session: Session) -> str:
    email = "organizer@example.com"
    password = "SecureP@ss123!"
    register_response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    assert register_response.status_code == 201
    user = db_session.query(User).filter(User.email == email).one()
    user.role = UserRole.ORGANIZER
    db_session.commit()
    login_response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return login_response.json()["access_token"]


def _create_place(client: TestClient, token: str, *, name: str, category: str) -> None:
    response = client.post(
        "/api/v1/places",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": name,
            "description": "A beautiful destination for visitors in Guelma.",
            "latitude": 36.46,
            "longitude": 7.43,
            "category": category,
            "theme": "family",
            "images": [],
        },
    )
    assert response.status_code == 201


def test_places_filtering_and_pagination(client: TestClient, db_session: Session) -> None:
    token = _setup_organizer_and_get_token(client, db_session)
    _create_place(client, token, name="Forest Park", category="forest")
    _create_place(client, token, name="Culture House", category="culture")

    filtered = client.get("/api/v1/places", params={"category": "forest", "keyword": "Forest"})
    assert filtered.status_code == 200
    filtered_body = filtered.json()
    assert filtered_body["total"] == 1
    assert len(filtered_body["results"]) == 1

    paginated = client.get("/api/v1/places", params={"page": 1, "limit": 1})
    assert paginated.status_code == 200
    body = paginated.json()
    assert body["total"] == 2
    assert body["page"] == 1
    assert body["limit"] == 1
    assert len(body["results"]) == 1


def test_places_distance_filter_requires_coordinates(client: TestClient) -> None:
    response = client.get("/api/v1/places", params={"distance": 5})
    assert response.status_code == 422


def _register_visitor_and_get_token(client: TestClient) -> str:
    email = "visitor@example.com"
    resp = client.post("/api/v1/auth/register", json={"email": email, "password": "VisitorP@ss1"})
    assert resp.status_code == 201
    login_resp = client.post("/api/v1/auth/login", json={"email": email, "password": "VisitorP@ss1"})
    return login_resp.json()["access_token"]


def test_create_place_requires_organizer(client: TestClient, db_session: Session) -> None:
    token = _register_visitor_and_get_token(client)
    response = client.post(
        "/api/v1/places",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "My Place", "description": "desc", "latitude": 36.0, "longitude": 7.0, "category": "culture", "theme": "family", "images": []},
    )
    assert response.status_code == 403


def test_create_place_validates_required_fields(client: TestClient, db_session: Session) -> None:
    token = _setup_organizer_and_get_token(client, db_session)
    response = client.post(
        "/api/v1/places",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "", "description": "desc", "latitude": 36.0, "longitude": 7.0, "category": "culture", "theme": "family", "images": []},
    )
    assert response.status_code == 422


def test_places_list_returns_empty_for_no_results(client: TestClient) -> None:
    response = client.get("/api/v1/places", params={"keyword": "nonexistent_xyz_place"})
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 0
    assert body["results"] == []
