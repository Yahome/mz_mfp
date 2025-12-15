from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Org(Base):
    __tablename__ = "mz_mfp_org"

    id = Column(Integer, primary_key=True, index=True)
    jgmc = Column(String(80), nullable=False, comment="医疗机构名称")
    zzjgdm = Column(String(22), nullable=False, unique=True, comment="组织机构代码")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

class Record(Base):
    __tablename__ = "mz_mfp_record"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("mz_mfp_org.id"), nullable=False)
    patient_no = Column(String(50), nullable=False, comment="病历号/就诊标识")
    visit_time = Column(DateTime, nullable=False, comment="就诊时间JZSJ")
    status = Column(String(20), nullable=False, default="draft", comment="draft/submitted")
    dept_code = Column(String(50), nullable=False, comment="科室代码")
    doc_code = Column(String(50), nullable=False, comment="医生代码")
    
    version = Column(Integer, nullable=False, default=1, comment="乐观锁版本号")
    prefill_snapshot = Column(JSON, nullable=True, comment="外部视图原始快照")
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    submitted_at = Column(DateTime, nullable=True)

    # Relationships
    org = relationship("Org")
    base_info = relationship("BaseInfo", back_populates="record", uselist=False, cascade="all, delete-orphan")
    diagnoses = relationship("Diagnosis", back_populates="record", cascade="all, delete-orphan")
    tcm_operations = relationship("TcmOperation", back_populates="record", cascade="all, delete-orphan")
    surgeries = relationship("Surgery", back_populates="record", cascade="all, delete-orphan")
    medication_summary = relationship("MedicationSummary", back_populates="record", uselist=False, cascade="all, delete-orphan")
    herb_details = relationship("HerbDetail", back_populates="record", cascade="all, delete-orphan")
    fee_summary = relationship("FeeSummary", back_populates="record", uselist=False, cascade="all, delete-orphan")
    audit_logs = relationship("FieldAudit", back_populates="record", cascade="all, delete-orphan")
    export_logs = relationship("ExportLog", back_populates="record", cascade="all, delete-orphan")
