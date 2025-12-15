from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class MedicationSummary(Base):
    __tablename__ = "mz_mfp_medication_summary"
    
    record_id = Column(Integer, ForeignKey("mz_mfp_record.id", ondelete="CASCADE"), primary_key=True)
    xysy = Column(String(1), nullable=False, comment="是否使用西药RC016")
    zcysy = Column(String(1), nullable=False, comment="是否使用中成药RC016")
    zyzjsy = Column(String(1), nullable=False, comment="是否使用中药制剂RC016")
    ctypsy = Column(String(1), nullable=False, comment="是否使用传统饮片RC016")
    pfklsy = Column(String(1), nullable=False, comment="是否使用配方颗粒RC016")
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    record = relationship("Record", back_populates="medication_summary")

class HerbDetail(Base):
    __tablename__ = "mz_mfp_herb_detail"
    
    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("mz_mfp_record.id", ondelete="CASCADE"), nullable=False)
    seq_no = Column(Integer, nullable=False, comment="序号")
    herb_type = Column(String(1), nullable=False, comment="中草药类别")
    route_code = Column(String(30), nullable=False, comment="用药途径代码")
    route_name = Column(String(100), nullable=False, comment="用药途径名称")
    dose_count = Column(Integer, nullable=False, comment="剂数")
    source = Column(String(20), nullable=False, default="prefill")
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    record = relationship("Record", back_populates="herb_details")

class FeeSummary(Base):
    __tablename__ = "mz_mfp_fee_summary"
    
    record_id = Column(Integer, ForeignKey("mz_mfp_record.id", ondelete="CASCADE"), primary_key=True)
    zfy = Column(Numeric(11, 2), nullable=False, comment="总费用")
    zfje = Column(Numeric(10, 2), nullable=False, comment="自付金额")
    
    # Optional fee fields (mapped from Excel/SQL)
    ylfwf = Column(Numeric(10, 2))
    zlczf = Column(Numeric(10, 2))
    hlf = Column(Numeric(10, 2))
    qtfy = Column(Numeric(10, 2))
    blzdf = Column(Numeric(10, 2))
    zdf = Column(Numeric(10, 2))
    yxxzdf = Column(Numeric(10, 2))
    lczdxmf = Column(Numeric(10, 2))
    fsszlxmf = Column(Numeric(10, 2))
    zlf = Column(Numeric(10, 2))
    sszlf = Column(Numeric(10, 2))
    mzf = Column(Numeric(10, 2))
    ssf = Column(Numeric(10, 2))
    kff = Column(Numeric(10, 2))
    zyl_zyzd = Column(Numeric(10, 2))
    zyzl = Column(Numeric(10, 2))
    zywz = Column(Numeric(10, 2))
    zygs = Column(Numeric(10, 2))
    zcyjf = Column(Numeric(10, 2))
    zytnzl = Column(Numeric(10, 2))
    zygczl = Column(Numeric(10, 2))
    zytszl = Column(Numeric(10, 2))
    zyqt = Column(Numeric(10, 2))
    zytstpjg = Column(Numeric(10, 2))
    bzss = Column(Numeric(10, 2))
    xyf = Column(Numeric(10, 2))
    kjywf = Column(Numeric(10, 2))
    zcyf = Column(Numeric(10, 2))
    zyzjf = Column(Numeric(10, 2))
    zcyf1 = Column(Numeric(10, 2))
    pfklf = Column(Numeric(10, 2))
    xf = Column(Numeric(10, 2))
    bdbblzpf = Column(Numeric(10, 2))
    qdbblzpf = Column(Numeric(10, 2))
    nxyzlzpf = Column(Numeric(10, 2))
    xbyzlzpf = Column(Numeric(10, 2))
    jcyyclf = Column(Numeric(10, 2))
    yyclf = Column(Numeric(10, 2))
    ssycxclf = Column(Numeric(10, 2))
    qtf = Column(Numeric(10, 2))
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    record = relationship("Record", back_populates="fee_summary")
