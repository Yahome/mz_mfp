from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ID_TYPE, Base, TimestampMixin


class MedicationSummary(TimestampMixin, Base):
    __tablename__ = "mz_mfp_medication_summary"

    record_id: Mapped[int] = mapped_column(ID_TYPE, ForeignKey("mz_mfp_record.id"), primary_key=True)
    xysy: Mapped[str] = mapped_column(String(1), nullable=False)
    zcysy: Mapped[str] = mapped_column(String(1), nullable=False)
    zyzjsy: Mapped[str] = mapped_column(String(1), nullable=False)
    ctypsy: Mapped[str] = mapped_column(String(1), nullable=False)
    pfklsy: Mapped[str] = mapped_column(String(1), nullable=False)

    record = relationship("Record", back_populates="medication_summary")
