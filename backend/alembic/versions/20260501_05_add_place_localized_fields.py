"""Add place localized fields

Revision ID: 20260501_05
Revises: 20260430_04
Create Date: 2026-05-01 06:40:00.000000

"""
from typing import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260501_05"
down_revision: str | None = "20260430_04"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    # Add columns as nullable first
    op.add_column("places", sa.Column("name_ar", sa.String(length=255), nullable=True))
    op.add_column("places", sa.Column("name_en", sa.String(length=255), nullable=True))
    op.add_column("places", sa.Column("description_ar", sa.Text(), nullable=True))
    op.add_column("places", sa.Column("description_en", sa.Text(), nullable=True))

    # Add indexes for localized names
    op.create_index("ix_places_name_ar", "places", ["name_ar"], unique=False)
    op.create_index("ix_places_name_en", "places", ["name_en"], unique=False)

    # Make original name and description nullable if they weren't already (they were NOT nullable in initial schema)
    op.alter_column("places", "name", existing_type=sa.String(length=255), nullable=True)
    op.alter_column("places", "description", existing_type=sa.Text(), nullable=True)


def downgrade() -> None:
    op.alter_column("places", "description", existing_type=sa.Text(), nullable=False)
    op.alter_column("places", "name", existing_type=sa.String(length=255), nullable=False)
    op.drop_index("ix_places_name_en", table_name="places")
    op.drop_index("ix_places_name_ar", table_name="places")
    op.drop_column("places", "description_en")
    op.drop_column("places", "description_ar")
    op.drop_column("places", "name_en")
    op.drop_column("places", "name_ar")
