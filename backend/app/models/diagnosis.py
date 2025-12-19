from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ID_TYPE, Base, TimestampMixin


class Diagnosis(TimestampMixin, Base):
    __tablename__ = "mz_mfp_diagnosis"

    id: Mapped[int] = mapped_column(ID_TYPE, primary_key=True, autoincrement=True)
    record_id: Mapped[int] = mapped_column(ID_TYPE, ForeignKey("mz_mfp_record.id"), nullable=False)
    diag_type: Mapped[str] = mapped_column(String(30), nullable=False)
    seq_no: Mapped[int] = mapped_column(Integer, nullable=False)
    diag_name: Mapped[str] = mapped_column(String(100), nullable=False)
    diag_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    source: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'prefill'"))

    record = relationship("Record", back_populates="diagnoses")
