"""add gamification meetups experiences photo challenges wellness and local exchange

Revision ID: 9a1b2c3d4e5f
Revises: 7f6e72cfe235
Create Date: 2026-06-27 10:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "9a1b2c3d4e5f"
down_revision: Union[str, None] = "7f6e72cfe235"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ──────────────────────────────────────────────
    # 1) user_points
    # ──────────────────────────────────────────────
    op.create_table(
        "user_points",
        sa.Column("user_id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("total_points", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("level", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("streak_days", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("last_activity", sa.DateTime(timezone=True), nullable=True),
        sa.Column("total_contributions", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )

    # ──────────────────────────────────────────────
    # 2) badges
    # ──────────────────────────────────────────────
    op.create_table(
        "badges",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name_ar", sa.String(length=255), nullable=False),
        sa.Column("name_fr", sa.String(length=255), nullable=False),
        sa.Column("name_en", sa.String(length=255), nullable=False),
        sa.Column("icon", sa.String(length=255), nullable=True),
        sa.Column("description", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("criteria", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
    )
    op.create_index(op.f("ix_badges_id"), "badges", ["id"], unique=False)

    # ──────────────────────────────────────────────
    # 3) user_badges
    # ──────────────────────────────────────────────
    op.create_table(
        "user_badges",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("badge_id", sa.Integer(), nullable=False),
        sa.Column("earned_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["badge_id"], ["badges.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "badge_id"),
    )

    # ──────────────────────────────────────────────
    # 4) user_guides
    # ──────────────────────────────────────────────
    op.create_table(
        "user_guides",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("description", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_user_guides_id"), "user_guides", ["id"], unique=False)
    op.create_index(op.f("ix_user_guides_user_id"), "user_guides", ["user_id"], unique=False)

    # ──────────────────────────────────────────────
    # 5) guide_places
    # ──────────────────────────────────────────────
    op.create_table(
        "guide_places",
        sa.Column("guide_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("place_id", sa.Integer(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.ForeignKeyConstraint(["guide_id"], ["user_guides.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["place_id"], ["places.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("guide_id", "place_id"),
    )

    # ──────────────────────────────────────────────
    # 6) meetups
    # ──────────────────────────────────────────────
    op.create_table(
        "meetups",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column("title", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("activity_type", sa.String(length=100), nullable=False),
        sa.Column("meetup_lat", sa.Float(), nullable=True),
        sa.Column("meetup_lon", sa.Float(), nullable=True),
        sa.Column("meetup_point", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("max_participants", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'planned'")),
        sa.Column("creator_id", sa.Integer(), nullable=False),
        sa.Column("place_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "status IN ('planned', 'ongoing', 'completed', 'cancelled')",
            name="ck_meetups_status",
        ),
        sa.ForeignKeyConstraint(["creator_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["place_id"], ["places.id"], ondelete="SET NULL"),
    )
    op.create_index(op.f("ix_meetups_id"), "meetups", ["id"], unique=False)
    op.create_index(op.f("ix_meetups_creator_id"), "meetups", ["creator_id"], unique=False)
    op.create_index(op.f("ix_meetups_place_id"), "meetups", ["place_id"], unique=False)
    op.create_index(op.f("ix_meetups_start_time"), "meetups", ["start_time"], unique=False)

    # ──────────────────────────────────────────────
    # 7) meetup_participants
    # ──────────────────────────────────────────────
    op.create_table(
        "meetup_participants",
        sa.Column("meetup_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'joined'")),
        sa.CheckConstraint(
            "status IN ('joined', 'left', 'removed', 'waitlisted')",
            name="ck_meetup_participants_status",
        ),
        sa.ForeignKeyConstraint(["meetup_id"], ["meetups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("meetup_id", "user_id"),
    )

    # ──────────────────────────────────────────────
    # 8) photo_challenges
    # ──────────────────────────────────────────────
    op.create_table(
        "photo_challenges",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column("title", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("description", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("theme_tag", sa.String(length=100), nullable=False),
        sa.Column("location_hint", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("week_start", sa.Date(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("winner_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["winner_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index(op.f("ix_photo_challenges_id"), "photo_challenges", ["id"], unique=False)
    op.create_index(op.f("ix_photo_challenges_theme_tag"), "photo_challenges", ["theme_tag"], unique=False)
    op.create_index(op.f("ix_photo_challenges_week_start"), "photo_challenges", ["week_start"], unique=False)

    # ──────────────────────────────────────────────
    # 9) photo_submissions
    # ──────────────────────────────────────────────
    op.create_table(
        "photo_submissions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column("challenge_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("image_url", sa.String(length=512), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("caption", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["challenge_id"], ["photo_challenges.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_photo_submissions_id"), "photo_submissions", ["id"], unique=False)
    op.create_index(op.f("ix_photo_submissions_challenge_id"), "photo_submissions", ["challenge_id"], unique=False)
    op.create_index(op.f("ix_photo_submissions_user_id"), "photo_submissions", ["user_id"], unique=False)

    # ──────────────────────────────────────────────
    # 10) experiences
    # ──────────────────────────────────────────────
    op.create_table(
        "experiences",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column("title", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("description", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("difficulty", sa.String(length=20), nullable=True),
        sa.Column("locations", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column("is_official", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "difficulty IN ('easy', 'medium', 'hard')",
            name="ck_experiences_difficulty",
        ),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_experiences_id"), "experiences", ["id"], unique=False)
    op.create_index(op.f("ix_experiences_author_id"), "experiences", ["author_id"], unique=False)
    op.create_index(op.f("ix_experiences_category"), "experiences", ["category"], unique=False)

    # ──────────────────────────────────────────────
    # 11) wellness_tips
    # ──────────────────────────────────────────────
    op.create_table(
        "wellness_tips",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column("title", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("body", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("location_context", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("audio_url", sa.String(length=512), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
    )
    op.create_index(op.f("ix_wellness_tips_id"), "wellness_tips", ["id"], unique=False)
    op.create_index(op.f("ix_wellness_tips_category"), "wellness_tips", ["category"], unique=False)

    # ──────────────────────────────────────────────
    # 12) local_questions
    # ──────────────────────────────────────────────
    op.create_table(
        "local_questions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("place_id", sa.Integer(), nullable=True),
        sa.Column("is_anonymous", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["place_id"], ["places.id"], ondelete="SET NULL"),
    )
    op.create_index(op.f("ix_local_questions_id"), "local_questions", ["id"], unique=False)
    op.create_index(op.f("ix_local_questions_user_id"), "local_questions", ["user_id"], unique=False)
    op.create_index(op.f("ix_local_questions_place_id"), "local_questions", ["place_id"], unique=False)

    # ──────────────────────────────────────────────
    # 13) local_answers
    # ──────────────────────────────────────────────
    op.create_table(
        "local_answers",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("helpful_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["question_id"], ["local_questions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_local_answers_id"), "local_answers", ["id"], unique=False)
    op.create_index(op.f("ix_local_answers_question_id"), "local_answers", ["question_id"], unique=False)
    op.create_index(op.f("ix_local_answers_user_id"), "local_answers", ["user_id"], unique=False)


def downgrade() -> None:
    # Drop in reverse order to respect FK dependencies
    op.drop_index(op.f("ix_local_answers_user_id"), table_name="local_answers")
    op.drop_index(op.f("ix_local_answers_question_id"), table_name="local_answers")
    op.drop_index(op.f("ix_local_answers_id"), table_name="local_answers")
    op.drop_table("local_answers")

    op.drop_index(op.f("ix_local_questions_place_id"), table_name="local_questions")
    op.drop_index(op.f("ix_local_questions_user_id"), table_name="local_questions")
    op.drop_index(op.f("ix_local_questions_id"), table_name="local_questions")
    op.drop_table("local_questions")

    op.drop_index(op.f("ix_wellness_tips_category"), table_name="wellness_tips")
    op.drop_index(op.f("ix_wellness_tips_id"), table_name="wellness_tips")
    op.drop_table("wellness_tips")

    op.drop_index(op.f("ix_experiences_category"), table_name="experiences")
    op.drop_index(op.f("ix_experiences_author_id"), table_name="experiences")
    op.drop_index(op.f("ix_experiences_id"), table_name="experiences")
    op.drop_table("experiences")

    op.drop_index(op.f("ix_photo_submissions_user_id"), table_name="photo_submissions")
    op.drop_index(op.f("ix_photo_submissions_challenge_id"), table_name="photo_submissions")
    op.drop_index(op.f("ix_photo_submissions_id"), table_name="photo_submissions")
    op.drop_table("photo_submissions")

    op.drop_index(op.f("ix_photo_challenges_week_start"), table_name="photo_challenges")
    op.drop_index(op.f("ix_photo_challenges_theme_tag"), table_name="photo_challenges")
    op.drop_index(op.f("ix_photo_challenges_id"), table_name="photo_challenges")
    op.drop_table("photo_challenges")

    op.drop_table("meetup_participants")

    op.drop_index(op.f("ix_meetups_start_time"), table_name="meetups")
    op.drop_index(op.f("ix_meetups_place_id"), table_name="meetups")
    op.drop_index(op.f("ix_meetups_creator_id"), table_name="meetups")
    op.drop_index(op.f("ix_meetups_id"), table_name="meetups")
    op.drop_table("meetups")

    op.drop_table("guide_places")

    op.drop_index(op.f("ix_user_guides_user_id"), table_name="user_guides")
    op.drop_index(op.f("ix_user_guides_id"), table_name="user_guides")
    op.drop_table("user_guides")

    op.drop_table("user_badges")

    op.drop_index(op.f("ix_badges_id"), table_name="badges")
    op.drop_table("badges")

    op.drop_table("user_points")
