from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ID_TYPE, Base, TimestampMixin


class HerbDetail(TimestampMixin, Base):
    __tablename__ = "mz_mfp_herb_detail"

    id: Mapped[int] = mapped_column(ID_TYPE, primary_key=True, autoincrement=True)
    record_id: Mapped[int] = mapped_column(ID_TYPE, ForeignKey("mz_mfp_record.id"), nullable=False)
    seq_no: Mapped[int] = mapped_column(Integer, nullable=False)
    herb_type: Mapped[str] = mapped_column(String(1), nullable=False)
    route_code: Mapped[str] = mapped_column(String(30), nullable=False)
    route_name: Mapped[str] = mapped_column(String(100), nullable=False)
    dose_count: Mapped[int] = mapped_column(Integer, nullable=False)
    source: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'prefill'"))

    record = relationship("Record", back_populates="herb_details")
