from sqlalchemy import String, TypeDecorator
from sqlalchemy.dialects.postgresql import TSVECTOR


class TSVector(TypeDecorator):
    """Cross-database TSVECTOR type.

    Uses PostgreSQL's native TSVECTOR when connected to PostgreSQL,
    and falls back to a simple String for other databases (e.g. SQLite
    for testing).
    """

    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(TSVECTOR())
        return dialect.type_descriptor(String(self.length or 255))
