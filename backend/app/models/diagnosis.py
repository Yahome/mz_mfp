from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Diagnosis(Base):
    __tablename__ = "mz_mfp_diagnosis"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("mz_mfp_record.id", ondelete="CASCADE"), nullable=False)
    
    # tcm_disease_main / tcm_syndrome / wm_main / wm_other
    diag_type = Column(String(30), nullable=False, index=True)
    seq_no = Column(Integer, nullable=False, comment="序号")
    
    diag_name = Column(String(100), nullable=False, comment="诊断名称")
    diag_code = Column(String(50), nullable=True, comment="诊断编码")
    source = Column(String(20), nullable=False, default="prefill", comment="来源")
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    record = relationship("Record", back_populates="diagnoses")
