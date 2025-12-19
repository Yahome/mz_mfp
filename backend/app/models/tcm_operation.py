from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ID_TYPE, Base, TimestampMixin


class TcmOperation(TimestampMixin, Base):
    __tablename__ = "mz_mfp_tcm_operation"

    id: Mapped[int] = mapped_column(ID_TYPE, primary_key=True, autoincrement=True)
    record_id: Mapped[int] = mapped_column(ID_TYPE, ForeignKey("mz_mfp_record.id"), nullable=False)
    seq_no: Mapped[int] = mapped_column(Integer, nullable=False)
    op_name: Mapped[str] = mapped_column(String(100), nullable=False)
    op_code: Mapped[str] = mapped_column(String(20), nullable=False)
    op_times: Mapped[int] = mapped_column(Integer, nullable=False)
    op_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'prefill'"))

    record = relationship("Record", back_populates="tcm_operations")
