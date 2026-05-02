"""add organiser pro and featured activities

Revision ID: 12_pro_tier
Revises: 11_activity_pricing
Create Date: 2026-05-01 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '12_pro_tier'
down_revision = '11_activity_pricing'
branch_labels = None
depends_on = None

def upgrade():
    # Add columns to users
    op.add_column('users', sa.Column('organiser_pro', sa.Boolean(), server_default='0', nullable=False))
    op.add_column('users', sa.Column('pro_expires_at', sa.DateTime(timezone=True), nullable=True))
    
    # Add columns to activities
    op.add_column('activities', sa.Column('is_featured', sa.Boolean(), server_default='0', nullable=False))

def downgrade():
    op.drop_column('activities', 'is_featured')
    op.drop_column('users', 'pro_expires_at')
    op.drop_column('users', 'organiser_pro')
