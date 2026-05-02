"""Fix sport category typo in places

Revision ID: 20260430_04
Revises: 20260430_03
Create Date: 2026-04-30 13:26:00.000000

"""
from typing import Sequence
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260430_04"
down_revision: str | None = "20260430_03"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    # Update category 'sport' to 'sports'
    # We use a raw SQL execution for this data cleanup
    op.execute("UPDATE places SET category = 'sports' WHERE category = 'sport'")


def downgrade() -> None:
    # No action needed for downgrade in this case as it's a data fix
    pass
