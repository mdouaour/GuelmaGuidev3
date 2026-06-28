from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient


def test_register_returns_message_without_token(client: TestClient) -> None:
    """Registration must return a message and must NOT return an access token (email verification required)."""
    with patch("app.api.auth.send_verification_email"):
        register_response = client.post(
            "/api/v1/auth/register",
            json={"email": "user@example.com", "password": "SecureP@ss123!"},
        )
    assert register_response.status_code == 201
    body = register_response.json()
    assert "message" in body
    assert "access_token" not in body
    assert "email_verified" not in body


def test_login_and_me_flow(client: TestClient) -> None:
    """After registration the user can log in and /me returns the correct data."""
    with patch("app.api.auth.send_verification_email"):
        client.post(
            "/api/v1/auth/register",
            json={"email": "flow@example.com", "password": "SecureP@ss123!"},
        )

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "flow@example.com", "password": "SecureP@ss123!"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    me_response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    data = me_response.json()
    assert data["email"] == "flow@example.com"
    assert data["email_verified"] is False


def test_register_duplicate_email_returns_400(client: TestClient) -> None:
    payload = {"email": "duplicate@example.com", "password": "SecureP@ss123!"}
    with patch("app.api.auth.send_verification_email"):
        assert client.post("/api/v1/auth/register", json=payload).status_code == 201
    duplicate = client.post("/api/v1/auth/register", json=payload)
    assert duplicate.status_code == 400


def test_register_weak_password_returns_422(client: TestClient) -> None:
    """Registration with a weak password (zxcvbn score < 2) must be rejected with 422."""
    weak_passwords = [
        ("password", "too common"),
        ("12345678", "too common"),
        ("abc", "too short and weak"),
        ("aaaaaaaa", "repeating pattern"),
    ]
    for pwd, _reason in weak_passwords:
        response = client.post(
            "/api/v1/auth/register",
            json={"email": "weak@example.com", "password": pwd},
        )
        assert response.status_code == 422, f"Expected 422 for password '{pwd}'"


def test_login_with_wrong_password_returns_401(client: TestClient) -> None:
    with patch("app.api.auth.send_verification_email"):
        client.post(
            "/api/v1/auth/register",
            json={"email": "wrong-pass@example.com", "password": "SecureP@ss123!"},
        )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "wrong-pass@example.com", "password": "WrongSecureP@ss123!"},
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Email verification tests
# ---------------------------------------------------------------------------


def test_verify_email_happy_path(client: TestClient) -> None:
    """Full happy path: register → capture token → verify → email_verified is True."""
    captured: dict = {}

    def fake_send_verification(to_email: str, token: str) -> None:
        captured["token"] = token

    with patch("app.api.auth.send_verification_email", side_effect=fake_send_verification):
        client.post(
            "/api/v1/auth/register",
            json={"email": "verify@example.com", "password": "SecureP@ss123!"},
        )

    verification_token = captured["token"]

    # Simulate Redis returning the stored email, then being deleted.
    with (
        patch("app.api.auth.get_str", return_value="verify@example.com"),
        patch("app.api.auth.delete_key") as mock_delete,
    ):
        response = client.get(f"/api/v1/auth/verify-email?token={verification_token}")

    assert response.status_code == 200
    assert "message" in response.json()
    mock_delete.assert_called_once()

    # After verification, /me must show email_verified = True.
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "verify@example.com", "password": "SecureP@ss123!"},
    )
    token = login.json()["access_token"]
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.json()["email_verified"] is True


def test_verify_email_invalid_token_returns_400(client: TestClient) -> None:
    with patch("app.api.auth.get_str", return_value=None):
        response = client.get("/api/v1/auth/verify-email?token=some.fake.token")
    assert response.status_code == 400


def test_verify_email_token_deleted_on_use(client: TestClient) -> None:
    """The Redis key must be deleted the moment the token is consumed."""
    captured: dict = {}

    def fake_send_verification(to_email: str, token: str) -> None:
        captured["token"] = token

    with patch("app.api.auth.send_verification_email", side_effect=fake_send_verification):
        client.post(
            "/api/v1/auth/register",
            json={"email": "once-verify@example.com", "password": "SecureP@ss123!"},
        )

    verification_token = captured["token"]
    delete_calls: list = []

    with (
        patch("app.api.auth.get_str", return_value="once-verify@example.com"),
        patch("app.api.auth.delete_key", side_effect=lambda k: delete_calls.append(k)),
    ):
        r1 = client.get(f"/api/v1/auth/verify-email?token={verification_token}")

    assert r1.status_code == 200
    assert len(delete_calls) == 1


# ---------------------------------------------------------------------------
# Resend verification tests
# ---------------------------------------------------------------------------


def test_resend_verification_always_returns_200(client: TestClient) -> None:
    """Resend endpoint must return 200 even for unknown emails (no user enumeration)."""
    with patch("app.api.auth.send_verification_email"):
        response = client.post(
            "/api/v1/auth/resend-verification",
            json={"email": "nonexistent@example.com"},
        )
    assert response.status_code == 200
    assert "message" in response.json()


def test_resend_verification_sends_email_for_unverified_user(client: TestClient) -> None:
    """Resend sends a new verification email for an existing unverified user."""
    with patch("app.api.auth.send_verification_email"):
        client.post(
            "/api/v1/auth/register",
            json={"email": "resend@example.com", "password": "SecureP@ss123!"},
        )

    sent: list = []
    with patch("app.api.auth.send_verification_email", side_effect=lambda e, t: sent.append(e)):
        with patch("app.api.auth.set_str"):
            response = client.post(
                "/api/v1/auth/resend-verification",
                json={"email": "resend@example.com"},
            )

    assert response.status_code == 200
    assert sent == ["resend@example.com"]


def test_resend_verification_skips_already_verified_user(client: TestClient) -> None:
    """Resend must not send an email for an already-verified user."""
    captured_verify: dict = {}

    def fake_send_verification(to_email: str, token: str) -> None:
        captured_verify["token"] = token

    with patch("app.api.auth.send_verification_email", side_effect=fake_send_verification):
        client.post(
            "/api/v1/auth/register",
            json={"email": "verified@example.com", "password": "SecureP@ss123!"},
        )

    # Verify the user first.
    verification_token = captured_verify["token"]
    with (
        patch("app.api.auth.get_str", return_value="verified@example.com"),
        patch("app.api.auth.delete_key"),
    ):
        client.get(f"/api/v1/auth/verify-email?token={verification_token}")

    # Now try resend — should be a no-op.
    sent: list = []
    with patch("app.api.auth.send_verification_email", side_effect=lambda e, t: sent.append(e)):
        response = client.post(
            "/api/v1/auth/resend-verification",
            json={"email": "verified@example.com"},
        )

    assert response.status_code == 200
    assert sent == []


# ---------------------------------------------------------------------------
# Password-reset tests
# ---------------------------------------------------------------------------

def test_request_password_reset_always_returns_200(client: TestClient) -> None:
    """The endpoint must return 200 even for unknown emails (no user enumeration)."""
    with (
        patch("app.api.auth.set_str"),
        patch("app.api.auth.send_password_reset_email"),
    ):
        response = client.post(
            "/api/v1/auth/request-password-reset",
            json={"email": "nonexistent@example.com"},
        )
    assert response.status_code == 200
    body = response.json()
    assert "message" in body
    # Token must NOT be present in the response.
    assert "token" not in body
    assert "reset_token" not in body


def test_request_password_reset_stores_token_and_sends_email(client: TestClient) -> None:
    """For a known user the token is stored in Redis and an email is dispatched."""
    with patch("app.api.auth.send_verification_email"):
        client.post(
            "/api/v1/auth/register",
            json={"email": "reset-user@example.com", "password": "SecureP@ss123!"},
        )

    captured: dict = {}

    def fake_set_str(key: str, value: str, ttl: int) -> None:
        captured["key"] = key
        captured["value"] = value
        captured["ttl"] = ttl

    def fake_send_email(to_email: str, reset_token: str) -> None:
        captured["email_to"] = to_email
        captured["reset_token"] = reset_token

    with (
        patch("app.api.auth.set_str", side_effect=fake_set_str),
        patch("app.api.auth.send_password_reset_email", side_effect=fake_send_email),
    ):
        response = client.post(
            "/api/v1/auth/request-password-reset",
            json={"email": "reset-user@example.com"},
        )

    assert response.status_code == 200
    assert captured.get("email_to") == "reset-user@example.com"
    assert captured.get("ttl") == 30 * 60
    # The key must be prefixed and the token must not appear in the HTTP response.
    assert captured.get("key", "").startswith("pwd_reset:")
    assert "token" not in response.json()


def test_reset_password_with_valid_token(client: TestClient) -> None:
    """Full happy path: request → consume token → password updated → new JWT returned."""
    with patch("app.api.auth.send_verification_email"):
        client.post(
            "/api/v1/auth/register",
            json={"email": "full-reset@example.com", "password": "OldSecureP@ss123!"},
        )

    stored: dict = {}

    def fake_set_str(key: str, value: str, ttl: int) -> None:
        stored["key"] = key
        stored["value"] = value
        stored["token"] = key.removeprefix("pwd_reset:")

    with (
        patch("app.api.auth.set_str", side_effect=fake_set_str),
        patch("app.api.auth.send_password_reset_email"),
    ):
        client.post(
            "/api/v1/auth/request-password-reset",
            json={"email": "full-reset@example.com"},
        )

    reset_token = stored["token"]
    stored_email = stored["value"]

    # Simulate Redis returning the stored email for the token, then being deleted.
    with (
        patch("app.api.auth.get_str", return_value=stored_email),
        patch("app.api.auth.delete_key") as mock_delete,
    ):
        response = client.post(
            "/api/v1/auth/reset-password",
            json={"token": reset_token, "new_password": "NewSecureP@ss123!"},
        )

    assert response.status_code == 200
    assert "access_token" in response.json()
    # Token must have been deleted from Redis immediately.
    mock_delete.assert_called_once()

    # Verify the new password works.
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "full-reset@example.com", "password": "NewSecureP@ss123!"},
    )
    assert login.status_code == 200


def test_reset_password_with_expired_or_used_token(client: TestClient) -> None:
    """When Redis returns None (expired / already used) the reset must be rejected."""
    with patch("app.api.auth.get_str", return_value=None):
        response = client.post(
            "/api/v1/auth/reset-password",
            json={"token": "some.fake.token", "new_password": "NewSecureP@ss123!"},
        )
    assert response.status_code == 400


def test_reset_password_token_deleted_on_use(client: TestClient) -> None:
    """The Redis key must be deleted the moment the token is consumed."""
    with patch("app.api.auth.send_verification_email"):
        client.post(
            "/api/v1/auth/register",
            json={"email": "once-reset@example.com", "password": "SecureP@ss123!"},
        )

    stored: dict = {}

    def fake_set_str(key: str, value: str, ttl: int) -> None:
        stored["key"] = key
        stored["value"] = value
        stored["token"] = key.removeprefix("pwd_reset:")

    with (
        patch("app.api.auth.set_str", side_effect=fake_set_str),
        patch("app.api.auth.send_password_reset_email"),
    ):
        client.post(
            "/api/v1/auth/request-password-reset",
            json={"email": "once-reset@example.com"},
        )

    reset_token = stored["token"]

    delete_calls: list = []

    with (
        patch("app.api.auth.get_str", return_value=stored["value"]),
        patch("app.api.auth.delete_key", side_effect=lambda k: delete_calls.append(k)),
    ):
        r1 = client.post(
            "/api/v1/auth/reset-password",
            json={"token": reset_token, "new_password": "NewPassword2!"},
        )
    assert r1.status_code == 200
    assert len(delete_calls) == 1
    assert delete_calls[0] == stored["key"]
