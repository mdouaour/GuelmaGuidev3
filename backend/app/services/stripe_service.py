import stripe
from app.core.config import settings

if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY

def create_checkout_session(
    activity_id: int,
    user_id: int,
    amount: float,
    currency: str,
    title: str,
    success_url: str,
    cancel_url: str
):
    """
    Creates a Stripe Checkout session for a paid activity.
    """
    if not settings.STRIPE_SECRET_KEY:
        raise ValueError("STRIPE_SECRET_KEY not configured")

    # Add 10% platform fee
    fee_amount = int((amount * 0.1) * 100)
    
    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=[
            {
                'price_data': {
                    'currency': currency.lower(),
                    'product_data': {
                        'name': f"Ticket for {title}",
                        'description': "Activity registration",
                    },
                    'unit_amount': int(amount * 100), # Stripe expects amount in cents
                },
                'quantity': 1,
            },
            {
                'price_data': {
                    'currency': currency.lower(),
                    'product_data': {
                        'name': "Platform Fee",
                        'description': "Service fee for booking through GuelmaGuide",
                    },
                    'unit_amount': fee_amount,
                },
                'quantity': 1,
            }
        ],
        mode='payment',
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            'activity_id': str(activity_id),
            'user_id': str(user_id),
        },
        client_reference_id=f"act_{activity_id}_u_{user_id}",
    )
    return session

def create_subscription_checkout_session(
    user_id: int,
    success_url: str,
    cancel_url: str
):
    """
    Creates a Stripe Checkout session for a monthly subscription.
    """
    if not settings.STRIPE_SECRET_KEY or not settings.STRIPE_PRO_PRICE_ID:
        raise ValueError("Stripe configuration incomplete")

    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=[{
            'price': settings.STRIPE_PRO_PRICE_ID,
            'quantity': 1,
        }],
        mode='subscription',
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            'user_id': str(user_id),
            'type': 'pro_subscription'
        },
        client_reference_id=f"pro_u_{user_id}",
    )
    return session

def construct_webhook_event(payload: bytes, sig_header: str):
    """
    Verifies and constructs a Stripe webhook event.
    """
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise ValueError("STRIPE_WEBHOOK_SECRET not configured")

    return stripe.Webhook.construct_event(
        payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
    )
