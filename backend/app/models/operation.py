from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class TcmOperation(Base):
    __tablename__ = "mz_mfp_tcm_operation"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("mz_mfp_record.id", ondelete="CASCADE"), nullable=False)
    seq_no = Column(Integer, nullable=False, comment="序号")
    op_name = Column(String(100), nullable=False, comment="操作名称")
    op_code = Column(String(20), nullable=False, comment="操作编码")
    op_times = Column(Integer, nullable=False, comment="操作次数")
    op_days = Column(Integer, nullable=True, comment="操作天数")
    source = Column(String(20), nullable=False, default="prefill")
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    record = relationship("Record", back_populates="tcm_operations")

class Surgery(Base):
    __tablename__ = "mz_mfp_surgery"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("mz_mfp_record.id", ondelete="CASCADE"), nullable=False)
    seq_no = Column(Integer, nullable=False, comment="序号")
    op_name = Column(String(100), nullable=False, comment="手术名称")
    op_code = Column(String(20), nullable=False, comment="手术编码")
    op_time = Column(DateTime, nullable=False, comment="手术日期")
    operator_name = Column(String(40), nullable=False, comment="操作者")
    anesthesia_method = Column(String(6), nullable=False, comment="麻醉方式RC013")
    anesthesia_doctor = Column(String(40), nullable=False, comment="麻醉医师")
    surgery_level = Column(Integer, nullable=False, comment="手术分级RC029")
    source = Column(String(20), nullable=False, default="prefill")
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    record = relationship("Record", back_populates="surgeries")
