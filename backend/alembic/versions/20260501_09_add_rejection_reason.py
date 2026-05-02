"""add rejection_reason to activities

Revision ID: 09_add_rejection_reason
Revises: 08_wishlist_and_reviews
Create Date: 2026-05-01 17:06:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '09_add_rejection_reason'
down_revision = '08_wishlist_and_reviews'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('activities', sa.Column('rejection_reason', sa.Text(), nullable=True))

def downgrade():
    op.drop_column('activities', 'rejection_reason')
