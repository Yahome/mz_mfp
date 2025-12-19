from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from sqlalchemy import Date, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ID_TYPE, Base, TimestampMixin


class BaseInfo(TimestampMixin, Base):
    __tablename__ = "mz_mfp_base_info"

    record_id: Mapped[int] = mapped_column(ID_TYPE, ForeignKey("mz_mfp_record.id"), primary_key=True)

    username: Mapped[str] = mapped_column(String(50), nullable=False)
    jzkh: Mapped[str] = mapped_column(String(50), nullable=False)
    xm: Mapped[str] = mapped_column(String(100), nullable=False)
    xb: Mapped[str] = mapped_column(String(1), nullable=False)
    csrq: Mapped[date] = mapped_column(Date, nullable=False)
    hy: Mapped[str] = mapped_column(String(1), nullable=False)
    gj: Mapped[str] = mapped_column(String(40), nullable=False)
    mz: Mapped[str] = mapped_column(String(2), nullable=False)
    zjlb: Mapped[str] = mapped_column(String(1), nullable=False)
    zjhm: Mapped[str] = mapped_column(String(18), nullable=False)
    xzz: Mapped[str] = mapped_column(String(200), nullable=False)
    lxdh: Mapped[str] = mapped_column(String(40), nullable=False)

    ywgms: Mapped[str] = mapped_column(String(1), nullable=False)
    gmyw: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    qtgms: Mapped[Optional[str]] = mapped_column(String(1), nullable=True)
    qtgmy: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    ghsj: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    bdsj: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    jzsj: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    jzks: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    jzksdm: Mapped[str] = mapped_column(String(50), nullable=False)
    jzys: Mapped[str] = mapped_column(String(40), nullable=False)
    jzyszc: Mapped[str] = mapped_column(String(40), nullable=False)
    jzlx: Mapped[str] = mapped_column(String(1), nullable=False)
    fz: Mapped[str] = mapped_column(String(1), nullable=False)
    sy: Mapped[str] = mapped_column(String(1), nullable=False)
    mzmtbhz: Mapped[str] = mapped_column(String(1), nullable=False)
    jzhzfj: Mapped[Optional[str]] = mapped_column(String(1), nullable=True)
    jzhzqx: Mapped[Optional[str]] = mapped_column(String(1), nullable=True)
    zyzkjsj: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    hzzs: Mapped[Optional[str]] = mapped_column(String(1500), nullable=True)

    record = relationship("Record", back_populates="base_info")
