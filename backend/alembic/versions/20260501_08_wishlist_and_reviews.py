"""add wishlist and reviews

Revision ID: 08_wishlist_and_reviews
Revises: 07_add_activity_status
Create Date: 2026-05-01 17:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '08_wishlist_and_reviews'
down_revision = '07_add_activity_status'
branch_labels = None
depends_on = None

def upgrade():
    # Update places table
    op.add_column('places', sa.Column('rating_avg', sa.Float(), nullable=False, server_default='0.0'))
    op.add_column('places', sa.Column('rating_count', sa.Integer(), nullable=False, server_default='0'))

    # Create wishlists table
    op.create_table(
        'wishlists',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('place_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['place_id'], ['places.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'place_id', name='uq_user_place_wishlist')
    )
    op.create_index(op.f('ix_wishlists_id'), 'wishlists', ['id'], unique=False)

    # Create place_reviews table
    op.create_table(
        'place_reviews',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('place_id', sa.Integer(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('text', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
        sa.ForeignKeyConstraint(['place_id'], ['places.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'place_id', name='uq_user_place_review')
    )
    op.create_index(op.f('ix_place_reviews_id'), 'place_reviews', ['id'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_place_reviews_id'), table_name='place_reviews')
    op.drop_table('place_reviews')
    op.drop_index(op.f('ix_wishlists_id'), table_name='wishlists')
    op.drop_table('wishlists')
    op.drop_column('places', 'rating_count')
    op.drop_column('places', 'rating_avg')
