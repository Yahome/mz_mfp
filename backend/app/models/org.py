from __future__ import annotations

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ID_TYPE, Base, TimestampMixin


class Org(TimestampMixin, Base):
    __tablename__ = "mz_mfp_org"

    id: Mapped[int] = mapped_column(ID_TYPE, primary_key=True, autoincrement=True)
    jgmc: Mapped[str] = mapped_column(String(80), nullable=False)
    zzjgdm: Mapped[str] = mapped_column(String(22), nullable=False, unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    records = relationship("Record", back_populates="org")
