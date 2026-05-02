import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import Annotated

from app.db.session import get_db
from app.services.stripe_service import construct_webhook_event
from app.services.activity_service import join_activity
from app.core.config import settings
from app.models.user import User
from datetime import datetime, timedelta

router = APIRouter()

@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    stripe_signature: Annotated[str | None, Header(alias="Stripe-Signature")] = None,
):
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing stripe signature")

    payload = await request.body()
    
    try:
        event = construct_webhook_event(payload, stripe_signature)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata", {})
        
        # Handle Activity Payment
        if metadata.get("activity_id") and metadata.get("user_id"):
            activity_id = metadata.get("activity_id")
            user_id = metadata.get("user_id")
            join_activity(
                db, 
                activity_id=int(activity_id), 
                user_id=int(user_id), 
                stripe_session_id=session["id"],
                payment_status="paid"
            )
            print(f"Payment successful for user {user_id} on activity {activity_id}")
            
        # Handle Pro Subscription
        elif metadata.get("type") == "pro_subscription" and metadata.get("user_id"):
            user_id = int(metadata.get("user_id"))
            user = db.get(User, user_id)
            if user:
                user.organiser_pro = True
                user.pro_expires_at = datetime.now() + timedelta(days=31)
                db.add(user)
                db.commit()
                print(f"Pro subscription activated for user {user_id}")

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        # Find user by Stripe customer ID or metadata if available
        # For simplicity, we'll assume we can find them. In production, store stripe_customer_id in User model.
        # But here we can use client_reference_id from the initial session if we stored it, or just rely on metadata.
        # Stripe subscription.deleted usually has metadata if passed during creation.
        metadata = subscription.get("metadata", {})
        if metadata.get("user_id"):
            user_id = int(metadata.get("user_id"))
            user = db.get(User, user_id)
            if user:
                user.organiser_pro = False
                db.add(user)
                db.commit()
                print(f"Pro subscription deactivated for user {user_id}")

    return {"status": "success"}
