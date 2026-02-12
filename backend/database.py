"""
SQLAlchemy database setup — SQLite (users.db)
ORM models: User, TrackedJobDB
"""

from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./users.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ── ORM Models ──────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)


class TrackedJobDB(Base):
    __tablename__ = "tracked_jobs"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String, default="")
    apply_link = Column(String, default="")
    status = Column(String, default="Applied")
    applied_date = Column(String, default="")


# ── Create tables ───────────────────────────────────────

Base.metadata.create_all(bind=engine)


# ── Dependency ──────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
