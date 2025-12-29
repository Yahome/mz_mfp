from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import ID_TYPE, Base, TimestampMixin


class AppUser(TimestampMixin, Base):
    __tablename__ = "app_user"

    id: Mapped[int] = mapped_column(ID_TYPE, primary_key=True, autoincrement=True)
    login_name: Mapped[str | None] = mapped_column(String(50), nullable=True, unique=True)
    password: Mapped[str | None] = mapped_column(String(200), nullable=True)
    doc_code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    dept_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    display_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    his_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    pinyin_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("1"))


class AppRole(Base):
    __tablename__ = "app_role"

    role_code: Mapped[str] = mapped_column(String(50), primary_key=True)
    role_name: Mapped[str] = mapped_column(String(100), nullable=False)


class AppUserRole(Base):
    __tablename__ = "app_user_role"

    user_id: Mapped[int] = mapped_column(ID_TYPE, ForeignKey("app_user.id"), primary_key=True)
    role_code: Mapped[str] = mapped_column(String(50), ForeignKey("app_role.role_code"), primary_key=True)


class AppUserDept(Base):
    __tablename__ = "app_user_dept"

    user_id: Mapped[int] = mapped_column(ID_TYPE, ForeignKey("app_user.id"), primary_key=True)
    dept_code: Mapped[str] = mapped_column(String(50), primary_key=True)
