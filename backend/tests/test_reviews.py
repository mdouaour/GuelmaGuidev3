from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import User, UserRole


def _register_user(client: TestClient, email: str) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "SecureP@ss123!"},
    )
    assert response.status_code == 201


def _login_user(client: TestClient, email: str) -> str:
    login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "SecureP@ss123!"},
    )
    assert login.status_code == 200
    return login.json()["access_token"]


def _set_organizer(db_session: Session, email: str) -> None:
    user = db_session.query(User).filter(User.email == email).one()
    user.role = UserRole.ORGANIZER
    db_session.commit()


def _create_place(client: TestClient, token: str, name: str = "Test Place") -> int:
    response = client.post(
        "/api/v1/places",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": name,
            "description": "A place for testing reviews",
            "latitude": 36.47,
            "longitude": 7.42,
            "category": "culture",
            "theme": "culture",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


class TestCreateReview:
    def test_authenticated_user_can_create_review(
        self, client: TestClient, db_session: Session
    ) -> None:
        """A logged-in user can submit a rating + text review for a place."""
        email = "reviewer@example.com"
        _register_user(client, email)
        token = _login_user(client, email)

        org_email = "place-owner@example.com"
        _register_user(client, org_email)
        _set_organizer(db_session, org_email)
        org_token = _login_user(client, org_email)
        place_id = _create_place(client, org_token, "Reviewed Place")

        response = client.post(
            f"/api/v1/places/{place_id}/reviews",
            headers={"Authorization": f"Bearer {token}"},
            json={"rating": 5, "text": "Amazing place!"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["rating"] == 5
        assert data["text"] == "Amazing place!"
        assert data["place_id"] == place_id
        assert data["user_id"] is not None

    def test_unauthenticated_user_cannot_create_review(
        self, client: TestClient, db_session: Session
    ) -> None:
        """Requests without auth token are rejected with 401."""
        org_email = "org-noauth@example.com"
        _register_user(client, org_email)
        _set_organizer(db_session, org_email)
        org_token = _login_user(client, org_email)
        place_id = _create_place(client, org_token)

        response = client.post(
            f"/api/v1/places/{place_id}/reviews",
            json={"rating": 3, "text": "Okay"},
        )
        assert response.status_code == 401

    def test_rating_must_be_between_1_and_5(
        self, client: TestClient, db_session: Session
    ) -> None:
        """Validation: rating outside 1-5 is rejected."""
        email = "strict@example.com"
        _register_user(client, email)
        token = _login_user(client, email)

        org_email = "org-strict@example.com"
        _register_user(client, org_email)
        _set_organizer(db_session, org_email)
        org_token = _login_user(client, org_email)
        place_id = _create_place(client, org_token)

        response = client.post(
            f"/api/v1/places/{place_id}/reviews",
            headers={"Authorization": f"Bearer {token}"},
            json={"rating": 6, "text": "Too high"},
        )
        assert response.status_code == 422

        response = client.post(
            f"/api/v1/places/{place_id}/reviews",
            headers={"Authorization": f"Bearer {token}"},
            json={"rating": 0, "text": "Too low"},
        )
        assert response.status_code == 422

    def test_review_upsert_updates_existing(
        self, client: TestClient, db_session: Session
    ) -> None:
        """Posting a second review updates the old one (upsert)."""
        email = "upsert@example.com"
        _register_user(client, email)
        token = _login_user(client, email)

        org_email = "org-upsert@example.com"
        _register_user(client, org_email)
        _set_organizer(db_session, org_email)
        org_token = _login_user(client, org_email)
        place_id = _create_place(client, org_token)

        # First review
        client.post(
            f"/api/v1/places/{place_id}/reviews",
            headers={"Authorization": f"Bearer {token}"},
            json={"rating": 3, "text": "Initial"},
        )
        # Second review — upsert
        response = client.post(
            f"/api/v1/places/{place_id}/reviews",
            headers={"Authorization": f"Bearer {token}"},
            json={"rating": 4, "text": "Updated"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["rating"] == 4
        assert data["text"] == "Updated"

    def test_review_on_nonexistent_place_returns_404(
        self, client: TestClient, db_session: Session
    ) -> None:
        """Reviewing a place that doesn't exist returns 404."""
        email = "nowhere@example.com"
        _register_user(client, email)
        token = _login_user(client, email)

        response = client.post(
            "/api/v1/places/99999/reviews",
            headers={"Authorization": f"Bearer {token}"},
            json={"rating": 3, "text": "Not found"},
        )
        assert response.status_code == 404


class TestListReviews:
    def test_list_reviews_returns_paginated_results(
        self, client: TestClient, db_session: Session
    ) -> None:
        """GET reviews returns all reviews for a place with pagination."""
        # Create a place
        org_email = "list-org@example.com"
        _register_user(client, org_email)
        _set_organizer(db_session, org_email)
        org_token = _login_user(client, org_email)
        place_id = _create_place(client, org_token)

        # Two users leave reviews
        for i in range(2):
            email = f"user{i}@example.com"
            _register_user(client, email)
            token = _login_user(client, email)
            client.post(
                f"/api/v1/places/{place_id}/reviews",
                headers={"Authorization": f"Bearer {token}"},
                json={"rating": 4 + i, "text": f"Review {i}"},
            )

        response = client.get(f"/api/v1/places/{place_id}/reviews")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2
        assert data["page"] == 1
        assert "pages" in data

    def test_list_reviews_returns_empty_for_unreviewed_place(
        self, client: TestClient, db_session: Session
    ) -> None:
        """A place with no reviews returns empty list (not an error)."""
        org_email = "empty-org@example.com"
        _register_user(client, org_email)
        _set_organizer(db_session, org_email)
        org_token = _login_user(client, org_email)
        place_id = _create_place(client, org_token, "Empty Place")

        response = client.get(f"/api/v1/places/{place_id}/reviews")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["items"] == []

    def test_list_reviews_returns_404_for_missing_place(
        self, client: TestClient
    ) -> None:
        """Non-existent place returns 404 on review list."""
        response = client.get("/api/v1/places/99999/reviews")
        assert response.status_code == 404
