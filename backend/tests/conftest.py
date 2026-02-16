import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Use in-memory SQLite for tests by default, can be overridden via TEST_DATABASE_URL
TEST_DB_URL = os.getenv("TEST_DATABASE_URL", "sqlite+pysqlite:///:memory:")

# Ensure the app uses SQLite during imports (app.main creates tables in non-prod).
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("DATABASE_URL", TEST_DB_URL)
os.environ.setdefault("SKIP_EMAIL_VERIFY", "true")
os.environ.setdefault("SIGNUP_MODE", "open")
os.environ.setdefault("SECTION_ACCESS_ENABLED", "false")

from app.main import create_app
from app.db.base import Base
from app.db.session import get_db_session


@pytest.fixture(scope="function")
def engine():
    # Important: in-memory SQLite needs StaticPool to keep the same DB across connections.
    kwargs = {"connect_args": {"check_same_thread": False}}
    if TEST_DB_URL.endswith(":memory:"):
        kwargs["poolclass"] = StaticPool
    eng = create_engine(TEST_DB_URL, **kwargs)
    Base.metadata.create_all(bind=eng)
    try:
        yield eng
    finally:
        Base.metadata.drop_all(bind=eng)


@pytest.fixture(scope="function")
def db_session(engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client(db_session, monkeypatch):
    app = create_app()

    # Override the DB session dependency to use the test database
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db_session] = override_get_db
    return TestClient(app)


