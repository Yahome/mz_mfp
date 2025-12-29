from __future__ import annotations

from sqlalchemy import String, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class AppDept(Base):
    __tablename__ = "app_dept"

    dept_code: Mapped[str] = mapped_column(String(50), primary_key=True)
    dept_name: Mapped[str] = mapped_column(String(200), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    spell: Mapped[str | None] = mapped_column(String(100), nullable=True)
    campus: Mapped[str | None] = mapped_column(String(100), nullable=True)
    order_no: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
