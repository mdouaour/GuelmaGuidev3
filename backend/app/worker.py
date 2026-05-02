import asyncio
import logging
from typing import Any

import resend
from arq import cron
from arq.connections import RedisSettings
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.user import User
from app.models.activity import Activity
from app.models.notification import NotificationType
from app.services.notification_service import create_notification
from app.services.email_service import (
    send_password_reset_email as send_password_reset_sync,
    send_verification_email as send_verification_sync,
)

logger = logging.getLogger(__name__)

async def send_email(ctx: Any, to: str, subject: str, html_body: str) -> None:
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY is not configured — email not sent")
        return

    resend.api_key = settings.RESEND_API_KEY
    try:
        resend.Emails.send(
            {
                "from": settings.RESEND_FROM_ADDRESS,
                "to": [to],
                "subject": subject,
                "html": html_body,
            }
        )
    except Exception:
        logger.exception("Failed to send email to %s", to)

async def send_verification_email(ctx: Any, user_id: int, token: str) -> None:
    with SessionLocal() as db:
        user = db.get(User, user_id)
        if user:
            send_verification_sync(user.email, token)

async def send_password_reset_email(ctx: Any, user_id: int, token: str) -> None:
    with SessionLocal() as db:
        user = db.get(User, user_id)
        if user:
            send_password_reset_sync(user.email, token)

async def send_activity_reminder(ctx: Any, user_id: int, activity_id: int) -> None:
    with SessionLocal() as db:
        user = db.get(User, user_id)
        # Use joinedload to get place name
        stmt = select(Activity).options(joinedload(Activity.place)).where(Activity.id == activity_id)
        activity = db.execute(stmt).scalar()
        
        if user and activity:
            # Skip if activity was cancelled
            if activity.status == "cancelled":
                logger.info("Skipping reminder for cancelled activity %d", activity_id)
                return

            participants_count = int(
                db.scalar(
                    select(func.count(ActivityRegistration.user_id)).where(
                        ActivityRegistration.activity_id == activity_id
                    )
                ) or 0
            )
            
            # Create in-app notification
            create_notification(
                db,
                user_id=user.id,
                type=NotificationType.ACTIVITY_REMINDER,
                title=f"Upcoming Activity: {activity.title}",
                body=f"Your activity '{activity.title}' starts in 24 hours. Don't forget!",
                payload={"activity_id": activity.id}
            )
            
            # Send email
            time_str = activity.date_time.strftime("%A, %d %B %Y at %H:%M")
            html_body = f"""
            <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
                <h2 style="color: #2E7D32;">Activity Reminder: {activity.title}</h2>
                <p>Hi,</p>
                <p>This is a reminder that your activity <strong>{activity.title}</strong> is starting in 24 hours.</p>
                <ul style="list-style: none; padding: 0;">
                    <li><strong>📍 Place:</strong> {activity.place.name}</li>
                    <li><strong>⏰ Time:</strong> {time_str}</li>
                    <li><strong>👥 Participants:</strong> {participants_count} joined</li>
                </ul>
                <p>We look forward to seeing you there!</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #999;">Guelma Guide — Discover the hidden gems of Guelma.</p>
            </div>
            """
            await send_email(ctx, to=user.email, subject=f"Reminder: {activity.title}", html_body=html_body)

async def send_activity_cancellation(ctx: Any, activity_id: int) -> None:
    with SessionLocal() as db:
        # Get activity and all participants
        stmt = (
            select(Activity)
            .options(joinedload(Activity.place), selectinload(Activity.participants))
            .where(Activity.id == activity_id)
        )
        activity = db.execute(stmt).scalar()
        
        if not activity:
            return

        for user in activity.participants:
            # Create in-app notification
            create_notification(
                db,
                user_id=user.id,
                type=NotificationType.WARNING,
                title=f"Activity Cancelled: {activity.title}",
                body=f"The activity '{activity.title}' has been cancelled by the organizer.",
                payload={"activity_id": activity.id}
            )
            
            # Send email
            html_body = f"""
            <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
                <h2 style="color: #d32f2f;">Activity Cancelled: {activity.title}</h2>
                <p>Hi,</p>
                <p>We're sorry to inform you that the activity <strong>{activity.title}</strong> at <strong>{activity.place.name}</strong> has been cancelled by the organizer.</p>
                <p>We apologize for any inconvenience caused. You can browse other activities on Guelma Guide.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #999;">Guelma Guide — Discover the hidden gems of Guelma.</p>
            </div>
            """
            await send_email(ctx, to=user.email, subject=f"Cancelled: {activity.title}", html_body=html_body)

async def send_weekly_digest(ctx: Any, user_id: int) -> None:
    with SessionLocal() as db:
        user = db.get(User, user_id)
        if user:
            # In a real app, you'd fetch interesting activities/places here
            html_body = f"""
            <p>Hi {user.email},</p>
            <p>Here's your weekly digest from Guelma Guide!</p>
            <p>Discover new places and activities in Guelma this week.</p>
            """
            await send_email(ctx, to=user.email, subject="Your Weekly Guelma Digest", html_body=html_body)

async def startup(ctx: Any) -> None:
    logger.info("Worker starting up...")

async def shutdown(ctx: Any) -> None:
    logger.info("Worker shutting down...")

class WorkerSettings:
    functions = [
        send_email,
        send_verification_email,
        send_password_reset_email,
        send_activity_reminder,
        send_activity_cancellation,
        send_weekly_digest,
    ]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL) if settings.REDIS_URL else RedisSettings()
    cron_jobs = [
        # Weekly digest example: every Sunday at 9:00 AM
        # cron(send_weekly_digest, weekday='sun', hour=9, minute=0)
    ]
