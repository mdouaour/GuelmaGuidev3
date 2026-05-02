"""Email delivery service using the Resend API."""
from __future__ import annotations

import logging

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_password_reset_email(to_email: str, reset_token: str) -> None:
    """Send a password-reset link to *to_email* via Resend.

    Silently logs and returns on any error so the caller always returns
    a generic success response (no user-enumeration leakage).
    """
    if not settings.RESEND_API_KEY:
        logger.warning(
            "RESEND_API_KEY is not configured — password-reset email not sent"
        )
        return

    reset_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/reset-password?token={reset_token}"
    html_body = f"""
    <p>Hello,</p>
    <p>We received a request to reset your Guelma Guide password.</p>
    <p>
      <a href="{reset_url}">Reset my password</a>
    </p>
    <p>This link expires in 30 minutes. If you did not request a password reset, you can safely ignore this email.</p>
    """

    resend.api_key = settings.RESEND_API_KEY
    try:
        resend.Emails.send(
            {
                "from": settings.RESEND_FROM_ADDRESS,
                "to": [to_email],
                "subject": "Reset your Guelma Guide password",
                "html": html_body,
            }
        )
    except Exception:
        logger.exception("Failed to send password-reset email to %s", to_email)


def send_verification_email(to_email: str, verification_token: str) -> None:
    """Send an email-verification link to *to_email* via Resend.

    Silently logs and returns on any error so registration always succeeds
    regardless of email delivery status.
    """
    if not settings.RESEND_API_KEY:
        logger.warning(
            "RESEND_API_KEY is not configured — verification email not sent"
        )
        return

    verify_url = (
        f"{settings.FRONTEND_BASE_URL.rstrip('/')}/verify-email?token={verification_token}"
    )
    html_body = f"""
    <p>Hello,</p>
    <p>Thank you for registering with Guelma Guide. Please verify your email address by clicking the link below.</p>
    <p>
      <a href="{verify_url}">Verify my email</a>
    </p>
    <p>This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>
    """

    resend.api_key = settings.RESEND_API_KEY
    try:
        resend.Emails.send(
            {
                "from": settings.RESEND_FROM_ADDRESS,
                "to": [to_email],
                "subject": "Verify your Guelma Guide email address",
                "html": html_body,
            }
        )
    except Exception:
        logger.exception("Failed to send verification email to %s", to_email)
