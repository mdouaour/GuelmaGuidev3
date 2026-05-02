"""add pricing to activities

Revision ID: 11_activity_pricing
Revises: 10_places_fts
Create Date: 2026-05-01 17:52:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '11_activity_pricing'
down_revision = '10_places_fts'
branch_labels = None
depends_on = None

def upgrade():
    # Add columns to activities
    op.add_column('activities', sa.Column('price_per_ticket', sa.Numeric(10, 2), nullable=True))
    op.add_column('activities', sa.Column('currency', sa.String(length=3), server_default='DZD', nullable=False))
    
    # Add columns to activity_registrations
    op.add_column('activity_registrations', sa.Column('stripe_session_id', sa.String(length=255), nullable=True))
    op.add_column('activity_registrations', sa.Column('payment_status', sa.String(length=20), server_default='free', nullable=True))
    op.create_index(op.f('ix_activity_registrations_stripe_session_id'), 'activity_registrations', ['stripe_session_id'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_activity_registrations_stripe_session_id'), table_name='activity_registrations')
    op.drop_column('activity_registrations', 'payment_status')
    op.drop_column('activity_registrations', 'stripe_session_id')
    op.drop_column('activities', 'currency')
    op.drop_column('activities', 'price_per_ticket')
