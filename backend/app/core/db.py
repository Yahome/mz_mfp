from __future__ import annotations

from functools import lru_cache
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    settings = get_settings()
    return create_engine(settings.mysql_dsn, pool_pre_ping=True)


@lru_cache(maxsize=1)
def _get_sessionmaker() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), autoflush=False, autocommit=False, expire_on_commit=False)


def reset_db_cache() -> None:
    _get_sessionmaker.cache_clear()
    get_engine.cache_clear()


def get_db() -> Generator[Session, None, None]:
    db = _get_sessionmaker()()
    try:
        yield db
    finally:
        db.close()

