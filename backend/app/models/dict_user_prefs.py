from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import ID_TYPE, Base, TimestampMixin


class DictUserRecent(TimestampMixin, Base):
    __tablename__ = "dict_user_recent"

    id: Mapped[int] = mapped_column(ID_TYPE, primary_key=True, autoincrement=True)
    user_code: Mapped[str] = mapped_column(String(50), nullable=False)
    set_code: Mapped[str] = mapped_column(String(50), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)


class DictUserFavorite(TimestampMixin, Base):
    __tablename__ = "dict_user_favorite"

    id: Mapped[int] = mapped_column(ID_TYPE, primary_key=True, autoincrement=True)
    user_code: Mapped[str] = mapped_column(String(50), nullable=False)
    set_code: Mapped[str] = mapped_column(String(50), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)

