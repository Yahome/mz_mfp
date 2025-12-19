from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ID_TYPE, Base, TimestampMixin


class Record(TimestampMixin, Base):
    __tablename__ = "mz_mfp_record"

    id: Mapped[int] = mapped_column(ID_TYPE, primary_key=True, autoincrement=True)
    org_id: Mapped[int] = mapped_column(ID_TYPE, ForeignKey("mz_mfp_org.id"), nullable=False)
    patient_no: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    visit_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'draft'"))
    dept_code: Mapped[str] = mapped_column(String(50), nullable=False)
    doc_code: Mapped[str] = mapped_column(String(50), nullable=False)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
    prefill_snapshot: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)

    org = relationship("Org", back_populates="records")
    base_info = relationship("BaseInfo", back_populates="record", uselist=False, cascade="all, delete-orphan")
    diagnoses = relationship("Diagnosis", back_populates="record", cascade="all, delete-orphan")
    tcm_operations = relationship("TcmOperation", back_populates="record", cascade="all, delete-orphan")
    surgeries = relationship("Surgery", back_populates="record", cascade="all, delete-orphan")
    medication_summary = relationship(
        "MedicationSummary", back_populates="record", uselist=False, cascade="all, delete-orphan"
    )
    herb_details = relationship("HerbDetail", back_populates="record", cascade="all, delete-orphan")
    fee_summary = relationship("FeeSummary", back_populates="record", uselist=False, cascade="all, delete-orphan")
    field_audits = relationship("FieldAudit", back_populates="record", cascade="all, delete-orphan")
