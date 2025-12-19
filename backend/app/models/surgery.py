from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ID_TYPE, Base, TimestampMixin


class Surgery(TimestampMixin, Base):
    __tablename__ = "mz_mfp_surgery"

    id: Mapped[int] = mapped_column(ID_TYPE, primary_key=True, autoincrement=True)
    record_id: Mapped[int] = mapped_column(ID_TYPE, ForeignKey("mz_mfp_record.id"), nullable=False)
    seq_no: Mapped[int] = mapped_column(Integer, nullable=False)
    op_name: Mapped[str] = mapped_column(String(100), nullable=False)
    op_code: Mapped[str] = mapped_column(String(20), nullable=False)
    op_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    operator_name: Mapped[str] = mapped_column(String(40), nullable=False)
    anesthesia_method: Mapped[str] = mapped_column(String(6), nullable=False)
    anesthesia_doctor: Mapped[str] = mapped_column(String(40), nullable=False)
    surgery_level: Mapped[int] = mapped_column(Integer, nullable=False)
    source: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'prefill'"))

    record = relationship("Record", back_populates="surgeries")
