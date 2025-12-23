from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ID_TYPE, Base


class DictSet(Base):
    __tablename__ = "dict_set"

    set_code: Mapped[str] = mapped_column(String(50), primary_key=True)
    set_name: Mapped[str] = mapped_column(String(100), nullable=False)
    version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), server_onupdate=text("CURRENT_TIMESTAMP")
    )

    items = relationship("DictItem", back_populates="set", cascade="all, delete-orphan")


class DictItem(Base):
    __tablename__ = "dict_item"

    id: Mapped[int] = mapped_column(ID_TYPE, primary_key=True, autoincrement=True)
    set_code: Mapped[str] = mapped_column(String(50), ForeignKey("dict_set.set_code"), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    item_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    select_optional: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    pinyin: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
    sort_no: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))

    set = relationship("DictSet", back_populates="items")
