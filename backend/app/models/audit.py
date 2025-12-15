from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class FieldAudit(Base):
    __tablename__ = "mz_mfp_field_audit"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("mz_mfp_record.id", ondelete="CASCADE"), nullable=False)
    field_key = Column(String(100), nullable=False, comment="字段名")
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    change_source = Column(String(20), nullable=False, comment="manual/dict/prefill")
    operator_code = Column(String(50), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    record = relationship("Record", back_populates="audit_logs")


class ExportLog(Base):
    __tablename__ = "mz_mfp_export_log"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("mz_mfp_record.id", ondelete="CASCADE"), nullable=False)
    export_type = Column(String(20), nullable=False, comment="xlsx/print")
    file_name = Column(String(200), nullable=True)
    file_path = Column(String(500), nullable=True)
    status = Column(String(20), nullable=False)
    error_message = Column(Text, nullable=True)
    created_by = Column(String(50), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    record = relationship("Record", back_populates="export_logs")
