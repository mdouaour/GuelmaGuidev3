"""add full text search to places

Revision ID: 10_places_fts
Revises: 09_add_rejection_reason
Create Date: 2026-05-01 17:40:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '10_places_fts'
down_revision = '09_add_rejection_reason'
branch_labels = None
depends_on = None

def upgrade():
    # Add search_vector column
    op.add_column('places', sa.Column('search_vector', postgresql.TSVECTOR(), nullable=True))
    
    # Create GIN index
    op.create_index('places_search_idx', 'places', ['search_vector'], unique=False, postgresql_using='gin')

    # Create trigger function
    op.execute("""
        CREATE OR REPLACE FUNCTION places_search_vector_update() RETURNS trigger AS $$
        BEGIN
          NEW.search_vector :=
            setweight(to_tsvector('french', coalesce(NEW.name_en, '')), 'A') ||
            setweight(to_tsvector('french', coalesce(NEW.name_ar, '')), 'A') ||
            setweight(to_tsvector('french', coalesce(NEW.category, '')), 'B') ||
            setweight(to_tsvector('french', coalesce(NEW.description_en, '')), 'C') ||
            setweight(to_tsvector('french', coalesce(NEW.description_ar, '')), 'C');
          RETURN NEW;
        END
        $$ LANGUAGE plpgsql;
    """)

    # Create trigger
    op.execute("""
        CREATE TRIGGER tg_places_search_vector_update
        BEFORE INSERT OR UPDATE ON places
        FOR EACH ROW EXECUTE FUNCTION places_search_vector_update();
    """)

    # Update existing rows
    op.execute("""
        UPDATE places SET search_vector = 
            setweight(to_tsvector('french', coalesce(name_en, '')), 'A') ||
            setweight(to_tsvector('french', coalesce(name_ar, '')), 'A') ||
            setweight(to_tsvector('french', coalesce(category, '')), 'B') ||
            setweight(to_tsvector('french', coalesce(description_en, '')), 'C') ||
            setweight(to_tsvector('french', coalesce(description_ar, '')), 'C');
    """)

def downgrade():
    op.execute("DROP TRIGGER IF EXISTS tg_places_search_vector_update ON places")
    op.execute("DROP FUNCTION IF EXISTS places_search_vector_update()")
    op.drop_index('places_search_idx', table_name='places')
    op.drop_column('places', 'search_vector')
