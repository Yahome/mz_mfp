from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ID_TYPE, Base


class FieldAudit(Base):
    __tablename__ = "mz_mfp_field_audit"

    id: Mapped[int] = mapped_column(ID_TYPE, primary_key=True, autoincrement=True)
    record_id: Mapped[int] = mapped_column(ID_TYPE, ForeignKey("mz_mfp_record.id"), nullable=False)
    field_key: Mapped[str] = mapped_column(String(100), nullable=False)
    old_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    change_source: Mapped[str] = mapped_column(String(20), nullable=False)
    operator_code: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    record = relationship("Record", back_populates="field_audits")
