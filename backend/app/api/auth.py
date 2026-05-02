import hashlib
import logging
import secrets
from datetime import UTC, datetime, timedelta
from typing import Annotated

from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, HTTPException, Query, Response, Request, status
from pydantic import BaseModel, EmailStr
from starlette.responses import RedirectResponse
import sqlalchemy as sa
from sqlalchemy import select
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.api.deps import ArqPool
from app.core.cache import delete_key, get_str, set_str
from app.core.config import settings
from app.core.rate_limiter import rate_limit_dependency
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    get_current_user,
    get_password_hash,
)
from app.db.session import get_db
from app.models import User, UserRole, RefreshToken
from app.models.notification import NotificationType
from app.services.notification_service import create_notification
from app.schemas.auth import LoginRequest, RegisterRequest, RegisterResponse, TokenResponse
from app.schemas.user import UserRead
from app.services.auth_service import authenticate_user, get_user_by_email, register_user
from app.services.email_service import send_password_reset_email, send_verification_email

router = APIRouter()

register_rate_limit = rate_limit_dependency(
    "auth:register",
    limit=settings.RATE_LIMIT_REGISTER_PER_WINDOW,
    window_seconds=settings.RATE_LIMIT_WINDOW_SECONDS,
)
login_rate_limit = rate_limit_dependency(
    "auth:login",
    limit=settings.RATE_LIMIT_LOGIN_PER_WINDOW,
    window_seconds=settings.RATE_LIMIT_WINDOW_SECONDS,
)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _build_token_response(db: Session, user: User) -> TokenResponse:
    # Access Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(subject=user.email, expires_delta=access_token_expires)

    # Refresh Token
    refresh_token_str, expires_at = create_refresh_token(subject=user.email)
    token_hash = _hash_token(refresh_token_str)

    db_token = RefreshToken(
        token_hash=token_hash,
        user_id=user.id,
        expires_at=expires_at,
    )
    db.add(db_token)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_str,
        expires_in=int(access_token_expires.total_seconds()),
    )


# ---------------------------------------------------------------------------
# Email verification helpers
# ---------------------------------------------------------------------------

_EMAIL_VERIFICATION_SCOPE = "email-verification"
_EMAIL_VERIFICATION_EXPIRE_SECONDS = 24 * 60 * 60  # 24 hours
_REDIS_VERIFICATION_KEY_PREFIX = "email_verify:"

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


def _redis_verification_key(token: str) -> str:
    return f"{_REDIS_VERIFICATION_KEY_PREFIX}{token}"


async def _generate_and_send_verification(email: str, arq_pool: ArqPool, user_id: int | None = None) -> None:
    """Create a one-time verification token, store it in Redis, and send the email."""
    verification_token = create_access_token(
        subject=email,
        expires_delta=timedelta(seconds=_EMAIL_VERIFICATION_EXPIRE_SECONDS),
        extra_claims={"scope": _EMAIL_VERIFICATION_SCOPE},
    )
    set_str(_redis_verification_key(verification_token), email, _EMAIL_VERIFICATION_EXPIRE_SECONDS)
    if settings.APP_ENV != "production":
        logger.debug("Email verification token for %s: %s", email, verification_token)
    
    if arq_pool and user_id:
        await arq_pool.enqueue_job("send_verification_email", user_id, verification_token)
    else:
        # Fallback to sync or use email string if no user_id available yet
        send_verification_email(email, verification_token)


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    db: Annotated[Session, Depends(get_db)],
    arq_pool: ArqPool,
    _rate_limit: None = Depends(register_rate_limit),
) -> RegisterResponse:
    existing_user = get_user_by_email(db, payload.email)
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    try:
        user = register_user(db, payload.email, payload.password, UserRole.VISITOR)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc

    await _generate_and_send_verification(payload.email, arq_pool, user.id)

    return RegisterResponse(
        message="Registration successful. Please check your email to verify your account.",
    )


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
    _rate_limit: None = Depends(login_rate_limit),
) -> TokenResponse:
    user = authenticate_user(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return _build_token_response(db, user)


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    payload: RefreshRequest,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    token_hash = _hash_token(payload.refresh_token)
    db_token = db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False,
            RefreshToken.expires_at > datetime.now(UTC),
        )
    )

    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token"
        )

    user = db_token.user
    # Rotate refresh token: revoke current and issue new one
    db_token.revoked = True
    db.commit()

    return _build_token_response(db, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    # Revoke all existing refresh tokens
    db.execute(
        sa.update(RefreshToken)
        .where(RefreshToken.user_id == current_user.id)
        .values(revoked=True)
    )
    db.commit()


@router.get("/me", response_model=UserRead)
def me(current_user: Annotated[User, Depends(get_current_user)]) -> UserRead:
    return UserRead.model_validate(current_user)


class VerifyEmailResponse(BaseModel):
    message: str


@router.get("/verify-email", response_model=VerifyEmailResponse)
def verify_email(
    token: Annotated[str, Query(min_length=1)],
    db: Annotated[Session, Depends(get_db)],
) -> VerifyEmailResponse:
    redis_key = _redis_verification_key(token)
    stored_email = get_str(redis_key)
    if stored_email is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )
    # Consume the token immediately (one-time use).
    delete_key(redis_key)

    # Validate JWT claims as a secondary defence.
    try:
        token_data = decode_access_token(token)
    except HTTPException as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        ) from exc

    if token_data.get("scope") != _EMAIL_VERIFICATION_SCOPE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token scope"
        )

    email = token_data.get("sub")
    if not isinstance(email, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token"
        )
    if not secrets.compare_digest(email, stored_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token"
        )

    user = get_user_by_email(db, email)
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")

    user.email_verified = True
    db.commit()
    
    # Welcome notification
    create_notification(
        db,
        user_id=user.id,
        type=NotificationType.SUCCESS,
        title="Welcome to Guelma Guide! 🌿",
        body="Your email has been verified. You can now fully explore and enjoy all features of Guelma Guide."
    )

    return VerifyEmailResponse(message="Email verified successfully. You can now log in.")


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ResendVerificationResponse(BaseModel):
    message: str


@router.post("/resend-verification", response_model=ResendVerificationResponse)
async def resend_verification(
    payload: ResendVerificationRequest,
    db: Annotated[Session, Depends(get_db)],
    arq_pool: ArqPool,
) -> ResendVerificationResponse:
    user = get_user_by_email(db, payload.email)
    if user is not None and not user.email_verified:
        await _generate_and_send_verification(payload.email, arq_pool, user.id)
    # Always return the same response to avoid user enumeration.
    return ResendVerificationResponse(
        message="If this email is registered and unverified, a new verification link will be sent.",
    )


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetRequestResponse(BaseModel):
    message: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


_PASSWORD_RESET_SCOPE = "password-reset"
_PASSWORD_RESET_EXPIRE_SECONDS = 30 * 60  # 30 minutes
_REDIS_KEY_PREFIX = "pwd_reset:"


def _redis_reset_key(token: str) -> str:
    return f"{_REDIS_KEY_PREFIX}{token}"


@router.post("/request-password-reset", response_model=PasswordResetRequestResponse)
async def request_password_reset(
    payload: PasswordResetRequest,
    db: Annotated[Session, Depends(get_db)],
    arq_pool: ArqPool,
) -> PasswordResetRequestResponse:
    user = get_user_by_email(db, payload.email)
    if user is not None:
        reset_token = create_access_token(
            subject=payload.email,
            expires_delta=timedelta(seconds=_PASSWORD_RESET_EXPIRE_SECONDS),
            extra_claims={"scope": _PASSWORD_RESET_SCOPE},
        )
        # Store token in Redis as the authoritative one-time use record.
        set_str(_redis_reset_key(reset_token), payload.email, _PASSWORD_RESET_EXPIRE_SECONDS)
        
        if arq_pool:
            await arq_pool.enqueue_job("send_password_reset_email", user.id, reset_token)
        else:
            # Deliver the link exclusively via email — the token is never returned in the response.
            send_password_reset_email(payload.email, reset_token)
    # Always return the same response to avoid user enumeration.
    return PasswordResetRequestResponse(
        message="If this email is registered, a reset link will be sent.",
    )


@router.post("/reset-password", response_model=TokenResponse)
def reset_password(
    payload: PasswordResetConfirm,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    redis_key = _redis_reset_key(payload.token)
    stored_email = get_str(redis_key)
    if stored_email is None:
        # Token is either expired, already used, or was never issued.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token"
        )
    # Consume the token immediately — makes it a true one-time-use link.
    delete_key(redis_key)

    # Validate JWT claims as a secondary defence (e.g. tampered token).
    try:
        token_data = decode_access_token(payload.token)
    except HTTPException as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token"
        ) from exc

    if token_data.get("scope") != _PASSWORD_RESET_SCOPE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token scope"
        )

    email = token_data.get("sub")
    if not isinstance(email, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token"
        )
    if not secrets.compare_digest(email.lower().strip(), stored_email.lower().strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token"
        )

    user = get_user_by_email(db, email)
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")

    user.hashed_password = get_password_hash(payload.new_password)
    
    # Revoke all existing refresh tokens on password change
    db.execute(
        sa.update(RefreshToken)
        .where(RefreshToken.user_id == user.id)
        .values(revoked=True)
    )
    db.commit()

    return _build_token_response(db, user)


@router.get("/google")
async def google_login(request: Request):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Google OAuth not configured"
        )
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: Annotated[Session, Depends(get_db)]):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Google OAuth not configured"
        )
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        logger.error("OAuth callback error: %s", str(e))
        return RedirectResponse(url=f"{settings.FRONTEND_BASE_URL}/auth?error=oauth_failed")

    user_info = token.get("userinfo")
    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to get user info from Google")

    email = user_info.get("email")
    name = user_info.get("name")
    picture = user_info.get("picture")

    user = get_user_by_email(db, email)
    if not user:
        user = User(
            email=email,
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),
            full_name=name,
            avatar_url=picture,
            email_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.full_name = name
        user.avatar_url = picture
        user.email_verified = True
        db.commit()

    token_response = _build_token_response(db, user)

    response = RedirectResponse(url=f"{settings.FRONTEND_BASE_URL}/")

    # Set cookies explicitly for the frontend domain
    response.set_cookie(
        "auth_token",
        token_response.access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        samesite="lax",
        secure=settings.APP_ENV == "production",
        path="/",
    )
    response.set_cookie(
        "refresh_token",
        token_response.refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=True,
        samesite="lax",
        secure=settings.APP_ENV == "production",
        path="/",
    )
    response.set_cookie(
        "csrf_token",
        secrets.token_hex(32),
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=False,
        samesite="lax",
        secure=settings.APP_ENV == "production",
        path="/",
    )

    return response
