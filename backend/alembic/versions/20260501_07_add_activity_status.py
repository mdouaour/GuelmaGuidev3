"""add activity status

Revision ID: 07_add_activity_status
Revises: 06_add_notifications
Create Date: 2026-05-01 16:55:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '07_add_activity_status'
down_revision = '06_add_notifications'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('activities', sa.Column('status', sa.String(length=20), nullable=False, server_default='active'))

def downgrade():
    op.drop_column('activities', 'status')
