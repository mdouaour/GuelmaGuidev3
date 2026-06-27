"""Add badges, guides, events, audio models

Revision ID: a59e77aa6226
Revises: 9a1b2c3d4e5f
Create Date: 2026-06-27 08:57:23.905913
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a59e77aa6226"
down_revision: Union[str, None] = "9a1b2c3d4e5f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── New tables first (no dependencies) ──
    op.create_table(
        "audio_guides",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("place_id", sa.Integer(), nullable=False),
        sa.Column("title_ar", sa.String(length=255), nullable=False),
        sa.Column("title_en", sa.String(length=255), nullable=False),
        sa.Column("title_fr", sa.String(length=255), nullable=False),
        sa.Column("audio_url", sa.String(length=500), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=False),
        sa.Column("language", sa.String(length=10), nullable=False),
        sa.Column("narrator_name", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["place_id"], ["places.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title_ar", sa.String(length=255), nullable=False),
        sa.Column("title_en", sa.String(length=255), nullable=False),
        sa.Column("title_fr", sa.String(length=255), nullable=False),
        sa.Column("description_ar", sa.Text(), nullable=False),
        sa.Column("description_en", sa.Text(), nullable=False),
        sa.Column("description_fr", sa.Text(), nullable=False),
        sa.Column("place_id", sa.Integer(), nullable=True),
        sa.Column("organizer_id", sa.Integer(), nullable=True),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("category", sa.String(length=20), nullable=False),
        sa.Column("max_participants", sa.Integer(), nullable=True),
        sa.Column("current_participants", sa.Integer(), server_default="0", nullable=False),
        sa.Column("price", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("image", sa.String(length=500), nullable=True),
        sa.Column("is_approved", sa.Boolean(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "category IN ('festival', 'exhibition', 'workshop', 'tour', 'cultural', 'sport', 'other')",
            name="ck_events_category",
        ),
        sa.ForeignKeyConstraint(["organizer_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["place_id"], ["places.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "guides",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title_ar", sa.String(length=255), nullable=False),
        sa.Column("title_en", sa.String(length=255), nullable=False),
        sa.Column("title_fr", sa.String(length=255), nullable=False),
        sa.Column("description_ar", sa.Text(), nullable=False),
        sa.Column("description_en", sa.Text(), nullable=False),
        sa.Column("description_fr", sa.Text(), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=True),
        sa.Column("cover_image", sa.String(length=500), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("difficulty", sa.String(length=10), nullable=False),
        sa.Column("category", sa.String(length=20), nullable=False),
        sa.Column("is_published", sa.Boolean(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("category IN ('historical', 'cultural', 'nature', 'gastronomy', 'mixed')", name="ck_guides_category"),
        sa.CheckConstraint("difficulty IN ('easy', 'medium', 'hard')", name="ck_guides_difficulty"),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "event_registrations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("event_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("registered_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.CheckConstraint("status IN ('confirmed', 'cancelled', 'attended')", name="ck_event_registrations_status"),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    # ── Drop FK from guide_places → user_guides before dropping user_guides ──
    op.drop_constraint("guide_places_guide_id_fkey", "guide_places", type_="foreignkey")
    # ── Drop old gamification tables in dependency order (children first) ──
    op.drop_table("meetup_participants")
    op.drop_table("local_answers")
    op.drop_table("local_questions")
    op.drop_table("photo_submissions")
    op.drop_table("photo_challenges")
    op.drop_table("meetups")
    op.drop_table("experiences")
    op.drop_table("wellness_tips")
    op.drop_table("user_guides")
    op.drop_table("user_points")
    # ── Recreate guide_places FK to point to new guides table ──
    op.create_foreign_key(None, "guide_places", "guides", ["guide_id"], ["id"], ondelete="CASCADE")
    # ── Alter existing badges table ──
    op.add_column("badges", sa.Column("description_ar", sa.Text(), nullable=False, server_default=""))
    op.add_column("badges", sa.Column("description_en", sa.Text(), nullable=False, server_default=""))
    op.add_column("badges", sa.Column("description_fr", sa.Text(), nullable=False, server_default=""))
    op.add_column("badges", sa.Column("category", sa.String(length=32), nullable=False, server_default="explorer"))
    op.add_column("badges", sa.Column("points", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("badges", sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
    op.alter_column("badges", "icon", existing_type=sa.VARCHAR(length=255), type_=sa.String(length=100), nullable=False)
    op.drop_index("ix_badges_id", table_name="badges")
    op.drop_column("badges", "description")
    # ── Badge id stays INTEGER here; new models tolerate it with UUID-as-int pattern
    # ── Alter guide_places columns ──
    op.add_column("guide_places", sa.Column("id", sa.Uuid(), nullable=False, server_default=sa.text("gen_random_uuid()")))
    op.add_column("guide_places", sa.Column("order", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("guide_places", sa.Column("notes", sa.Text(), nullable=True))
    op.add_column("guide_places", sa.Column("estimated_time_minutes", sa.Integer(), nullable=True))
    op.drop_column("guide_places", "sort_order")
    # ── Alter user_badges ──
    op.add_column("user_badges", sa.Column("id", sa.Uuid(), nullable=False, server_default=sa.text("gen_random_uuid()")))
    op.add_column("user_badges", sa.Column("progress", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")))
    # badge_id stays INTEGER to match badges.id


def downgrade() -> None:
    # Reverse user_badges
    op.drop_column("user_badges", "progress")
    op.drop_column("user_badges", "id")
    # Reverse guide_places
    op.add_column("guide_places", sa.Column("sort_order", sa.INTEGER(), server_default=sa.text("0"), autoincrement=False, nullable=False))
    op.drop_constraint(None, "guide_places", type_="foreignkey")
    op.create_foreign_key("guide_places_guide_id_fkey", "guide_places", "user_guides", ["guide_id"], ["id"], ondelete="CASCADE")
    op.drop_column("guide_places", "estimated_time_minutes")
    op.drop_column("guide_places", "notes")
    op.drop_column("guide_places", "order")
    op.drop_column("guide_places", "id")
    # Reverse badges
    op.add_column("badges", sa.Column("description", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), autoincrement=False, nullable=False))
    op.create_index("ix_badges_id", "badges", ["id"], unique=False)
    op.alter_column("badges", "icon", existing_type=sa.String(length=100), type_=sa.VARCHAR(length=255), nullable=True)
    op.drop_column("badges", "created_at")
    op.drop_column("badges", "points")
    op.drop_column("badges", "category")
    op.drop_column("badges", "description_fr")
    op.drop_column("badges", "description_en")
    op.drop_column("badges", "description_ar")
    # Recreate old tables
    op.create_table(
        "user_points",
        sa.Column("user_id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("total_points", sa.INTEGER(), server_default=sa.text("0"), autoincrement=False, nullable=False),
        sa.Column("level", sa.INTEGER(), server_default=sa.text("1"), autoincrement=False, nullable=False),
        sa.Column("streak_days", sa.INTEGER(), server_default=sa.text("0"), autoincrement=False, nullable=False),
        sa.Column("last_activity", postgresql.TIMESTAMP(timezone=True), autoincrement=False, nullable=True),
        sa.Column("total_contributions", sa.INTEGER(), server_default=sa.text("0"), autoincrement=False, nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="user_points_user_id_fkey", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", name="user_points_pkey"),
    )
    op.create_table(
        "user_guides",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), autoincrement=False, nullable=False),
        sa.Column("user_id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("title", postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=False),
        sa.Column("description", postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=True),
        sa.Column("is_public", sa.BOOLEAN(), server_default=sa.text("false"), autoincrement=False, nullable=False),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), autoincrement=False, nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="user_guides_user_id_fkey", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="user_guides_pkey"),
    )
    op.create_index("ix_user_guides_user_id", "user_guides", ["user_id"], unique=False)
    op.create_index("ix_user_guides_id", "user_guides", ["id"], unique=False)
    op.create_table(
        "wellness_tips",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), autoincrement=False, nullable=False),
        sa.Column("title", postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=False),
        sa.Column("body", postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=False),
        sa.Column("category", sa.VARCHAR(length=100), autoincrement=False, nullable=False),
        sa.Column("location_context", postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=True),
        sa.Column("audio_url", sa.VARCHAR(length=512), autoincrement=False, nullable=True),
        sa.Column("duration_seconds", sa.INTEGER(), autoincrement=False, nullable=True),
        sa.PrimaryKeyConstraint("id", name="wellness_tips_pkey"),
    )
    op.create_index("ix_wellness_tips_id", "wellness_tips", ["id"], unique=False)
    op.create_index("ix_wellness_tips_category", "wellness_tips", ["category"], unique=False)
    op.create_table(
        "experiences",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), autoincrement=False, nullable=False),
        sa.Column("title", postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=False),
        sa.Column("description", postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=True),
        sa.Column("category", sa.VARCHAR(length=100), autoincrement=False, nullable=False),
        sa.Column("duration_minutes", sa.INTEGER(), autoincrement=False, nullable=True),
        sa.Column("difficulty", sa.VARCHAR(length=20), autoincrement=False, nullable=True),
        sa.Column("locations", postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=True),
        sa.Column("author_id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("is_official", sa.BOOLEAN(), server_default=sa.text("false"), autoincrement=False, nullable=False),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), autoincrement=False, nullable=False),
        sa.CheckConstraint("difficulty::text = ANY (ARRAY['easy'::character varying, 'medium'::character varying, 'hard'::character varying]::text[])", name="ck_experiences_difficulty"),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"], name="experiences_author_id_fkey", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="experiences_pkey"),
    )
    op.create_index("ix_experiences_id", "experiences", ["id"], unique=False)
    op.create_index("ix_experiences_category", "experiences", ["category"], unique=False)
    op.create_index("ix_experiences_author_id", "experiences", ["author_id"], unique=False)
    op.create_table(
        "meetups",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), autoincrement=False, nullable=False),
        sa.Column("title", postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=False),
        sa.Column("activity_type", sa.VARCHAR(length=100), autoincrement=False, nullable=False),
        sa.Column("meetup_lat", sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True),
        sa.Column("meetup_lon", sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True),
        sa.Column("meetup_point", postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=True),
        sa.Column("start_time", postgresql.TIMESTAMP(timezone=True), autoincrement=False, nullable=False),
        sa.Column("end_time", postgresql.TIMESTAMP(timezone=True), autoincrement=False, nullable=True),
        sa.Column("max_participants", sa.INTEGER(), autoincrement=False, nullable=True),
        sa.Column("status", sa.VARCHAR(length=20), server_default=sa.text("'planned'::character varying"), autoincrement=False, nullable=False),
        sa.Column("creator_id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("place_id", sa.INTEGER(), autoincrement=False, nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), autoincrement=False, nullable=False),
        sa.CheckConstraint("status::text = ANY (ARRAY['planned'::character varying, 'ongoing'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[])", name="ck_meetups_status"),
        sa.ForeignKeyConstraint(["creator_id"], ["users.id"], name="meetups_creator_id_fkey", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["place_id"], ["places.id"], name="meetups_place_id_fkey", ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name="meetups_pkey"),
    )
    op.create_index("ix_meetups_start_time", "meetups", ["start_time"], unique=False)
    op.create_index("ix_meetups_place_id", "meetups", ["place_id"], unique=False)
    op.create_index("ix_meetups_id", "meetups", ["id"], unique=False)
    op.create_index("ix_meetups_creator_id", "meetups", ["creator_id"], unique=False)
    op.create_table(
        "photo_challenges",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), autoincrement=False, nullable=False),
        sa.Column("title", postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=False),
        sa.Column("description", postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=True),
        sa.Column("theme_tag", sa.VARCHAR(length=100), autoincrement=False, nullable=False),
        sa.Column("location_hint", postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=True),
        sa.Column("week_start", sa.DATE(), autoincrement=False, nullable=False),
        sa.Column("is_active", sa.BOOLEAN(), server_default=sa.text("true"), autoincrement=False, nullable=False),
        sa.Column("winner_id", sa.INTEGER(), autoincrement=False, nullable=True),
        sa.ForeignKeyConstraint(["winner_id"], ["users.id"], name="photo_challenges_winner_id_fkey", ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name="photo_challenges_pkey"),
    )
    op.create_index("ix_photo_challenges_week_start", "photo_challenges", ["week_start"], unique=False)
    op.create_index("ix_photo_challenges_theme_tag", "photo_challenges", ["theme_tag"], unique=False)
    op.create_index("ix_photo_challenges_id", "photo_challenges", ["id"], unique=False)
    op.create_table(
        "photo_submissions",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), autoincrement=False, nullable=False),
        sa.Column("challenge_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("user_id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("image_url", sa.VARCHAR(length=512), autoincrement=False, nullable=False),
        sa.Column("latitude", sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True),
        sa.Column("longitude", sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True),
        sa.Column("caption", sa.TEXT(), autoincrement=False, nullable=True),
        sa.Column("submitted_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), autoincrement=False, nullable=False),
        sa.ForeignKeyConstraint(["challenge_id"], ["photo_challenges.id"], name="photo_submissions_challenge_id_fkey", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="photo_submissions_user_id_fkey", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="photo_submissions_pkey"),
    )
    op.create_index("ix_photo_submissions_user_id", "photo_submissions", ["user_id"], unique=False)
    op.create_index("ix_photo_submissions_id", "photo_submissions", ["id"], unique=False)
    op.create_index("ix_photo_submissions_challenge_id", "photo_submissions", ["challenge_id"], unique=False)
    op.create_table(
        "local_questions",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), autoincrement=False, nullable=False),
        sa.Column("user_id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("question", sa.TEXT(), autoincrement=False, nullable=False),
        sa.Column("place_id", sa.INTEGER(), autoincrement=False, nullable=True),
        sa.Column("is_anonymous", sa.BOOLEAN(), server_default=sa.text("false"), autoincrement=False, nullable=False),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), autoincrement=False, nullable=False),
        sa.ForeignKeyConstraint(["place_id"], ["places.id"], name="local_questions_place_id_fkey", ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="local_questions_user_id_fkey", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="local_questions_pkey"),
    )
    op.create_index("ix_local_questions_user_id", "local_questions", ["user_id"], unique=False)
    op.create_index("ix_local_questions_place_id", "local_questions", ["place_id"], unique=False)
    op.create_index("ix_local_questions_id", "local_questions", ["id"], unique=False)
    op.create_table(
        "local_answers",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), autoincrement=False, nullable=False),
        sa.Column("question_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("user_id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("answer", sa.TEXT(), autoincrement=False, nullable=False),
        sa.Column("helpful_count", sa.INTEGER(), server_default=sa.text("0"), autoincrement=False, nullable=False),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), autoincrement=False, nullable=False),
        sa.ForeignKeyConstraint(["question_id"], ["local_questions.id"], name="local_answers_question_id_fkey", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="local_answers_user_id_fkey", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="local_answers_pkey"),
    )
    op.create_index("ix_local_answers_user_id", "local_answers", ["user_id"], unique=False)
    op.create_index("ix_local_answers_question_id", "local_answers", ["question_id"], unique=False)
    op.create_index("ix_local_answers_id", "local_answers", ["id"], unique=False)
    op.create_table(
        "meetup_participants",
        sa.Column("meetup_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("user_id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("joined_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), autoincrement=False, nullable=False),
        sa.Column("status", sa.VARCHAR(length=20), server_default=sa.text("'joined'::character varying"), autoincrement=False, nullable=False),
        sa.CheckConstraint("status::text = ANY (ARRAY['joined'::character varying, 'left'::character varying, 'removed'::character varying, 'waitlisted'::character varying]::text[])", name="ck_meetup_participants_status"),
        sa.ForeignKeyConstraint(["meetup_id"], ["meetups.id"], name="meetup_participants_meetup_id_fkey", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="meetup_participants_user_id_fkey", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("meetup_id", "user_id", name="meetup_participants_pkey"),
    )
    # Drop new tables
    op.drop_table("event_registrations")
    op.drop_table("guides")
    op.drop_table("events")
    op.drop_table("audio_guides")
