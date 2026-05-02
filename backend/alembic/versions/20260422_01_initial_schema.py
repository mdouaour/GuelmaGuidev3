"""Initial schema

Revision ID: 20260422_01
Revises:
Create Date: 2026-04-22 20:00:00.000000
"""

from typing import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260422_01"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("organizer_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("role IN ('visitor', 'organizer', 'admin')", name="ck_users_role"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_id", "users", ["id"], unique=False)

    op.create_table(
        "places",
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("theme", sa.String(length=100), nullable=False),
        sa.Column("images", sa.JSON(), nullable=False),
        sa.Column("featured", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "category IN ('forest', 'sports', 'relaxation', 'culture', 'nature', 'thermal_baths')",
            name="ck_places_category",
        ),
    )
    op.create_index("ix_places_category", "places", ["category"], unique=False)
    op.create_index("ix_places_id", "places", ["id"], unique=False)
    op.create_index("ix_places_latitude", "places", ["latitude"], unique=False)
    op.create_index(
        "ix_places_latitude_longitude_category",
        "places",
        ["latitude", "longitude", "category"],
        unique=False,
    )
    op.create_index("ix_places_longitude", "places", ["longitude"], unique=False)
    op.create_index("ix_places_name", "places", ["name"], unique=False)
    op.create_index("ix_places_theme", "places", ["theme"], unique=False)

    op.create_table(
        "activities",
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("place_id", sa.Integer(), nullable=False),
        sa.Column("organizer_id", sa.Integer(), nullable=False),
        sa.Column("date_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("max_participants", sa.Integer(), nullable=False),
        sa.Column("mood", sa.String(length=20), nullable=True),
        sa.Column("visibility", sa.String(length=10), nullable=False, server_default="public"),
        sa.Column("approval_status", sa.String(length=20), nullable=False, server_default="approved"),
        sa.Column("is_recurring", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("recurrence_rule", sa.String(length=50), nullable=True),
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("max_participants > 0", name="ck_activities_max_participants_positive"),
        sa.ForeignKeyConstraint(["organizer_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["place_id"], ["places.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_activities_date_time", "activities", ["date_time"], unique=False)
    op.create_index(
        "ix_activities_date_time_place_id",
        "activities",
        ["date_time", "place_id"],
        unique=False,
    )
    op.create_index("ix_activities_id", "activities", ["id"], unique=False)
    op.create_index("ix_activities_mood", "activities", ["mood"], unique=False)
    op.create_index("ix_activities_organizer_id", "activities", ["organizer_id"], unique=False)
    op.create_index("ix_activities_place_id", "activities", ["place_id"], unique=False)
    op.create_index("ix_activities_title", "activities", ["title"], unique=False)

    op.create_table(
        "activity_registrations",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("activity_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["activity_id"], ["activities.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "activity_id"),
    )


def downgrade() -> None:
    op.drop_table("activity_registrations")
    op.drop_index("ix_activities_title", table_name="activities")
    op.drop_index("ix_activities_place_id", table_name="activities")
    op.drop_index("ix_activities_organizer_id", table_name="activities")
    op.drop_index("ix_activities_mood", table_name="activities")
    op.drop_index("ix_activities_id", table_name="activities")
    op.drop_index("ix_activities_date_time_place_id", table_name="activities")
    op.drop_index("ix_activities_date_time", table_name="activities")
    op.drop_table("activities")
    op.drop_index("ix_places_theme", table_name="places")
    op.drop_index("ix_places_name", table_name="places")
    op.drop_index("ix_places_longitude", table_name="places")
    op.drop_index("ix_places_latitude_longitude_category", table_name="places")
    op.drop_index("ix_places_latitude", table_name="places")
    op.drop_index("ix_places_id", table_name="places")
    op.drop_index("ix_places_category", table_name="places")
    op.drop_table("places")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
