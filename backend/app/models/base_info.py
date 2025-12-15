from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class BaseInfo(Base):
    __tablename__ = "mz_mfp_base_info"

    record_id = Column(Integer, ForeignKey("mz_mfp_record.id", ondelete="CASCADE"), primary_key=True)
    username = Column(String(50), nullable=False, comment="系统登录用户名")
    
    jzkh = Column(String(50), nullable=False, comment="就诊卡号")
    xm = Column(String(100), nullable=False, comment="姓名")
    xb = Column(String(1), nullable=False, comment="性别RC001")
    csrq = Column(Date, nullable=False, comment="出生日期")
    hy = Column(String(1), nullable=False, comment="婚姻RC002")
    gj = Column(String(40), nullable=False, comment="国籍")
    mz = Column(String(2), nullable=False, comment="民族RC035")
    zjlb = Column(String(1), nullable=False, comment="证件类别RC038")
    zjhm = Column(String(18), nullable=False, comment="证件号码")
    xzz = Column(String(200), nullable=False, comment="现住址")
    lxdh = Column(String(40), nullable=False, comment="联系电话")
    
    ywgms = Column(String(1), nullable=False, comment="药物过敏史RC037")
    gmyw = Column(String(500), nullable=True, comment="过敏药物")
    qtgms = Column(String(1), nullable=True, comment="其他过敏史RC037")
    qtgmy = Column(String(200), nullable=True, comment="其他过敏原")
    
    ghsj = Column(DateTime, nullable=True, comment="挂号时间")
    bdsj = Column(DateTime, nullable=True, comment="报到时间")
    jzsj = Column(DateTime, nullable=False, comment="就诊时间")
    
    jzks = Column(String(100), nullable=True, comment="就诊科室")
    jzksdm = Column(String(50), nullable=False, comment="就诊科室代码")
    jzys = Column(String(40), nullable=False, comment="接诊医师")
    jzyszc = Column(String(40), nullable=False, comment="接诊医师职称")
    jzlx = Column(String(1), nullable=False, comment="就诊类型RC041")
    fz = Column(String(1), nullable=False, comment="是否复诊RC016")
    sy = Column(String(1), nullable=False, comment="是否输液RC016")
    mzmtbhz = Column(String(1), nullable=False, comment="是否慢特病RC016")
    jzhzfj = Column(String(1), nullable=True, comment="急诊患者分级RC042")
    jzhzqx = Column(String(1), nullable=True, comment="急诊患者去向RC045")
    zyzkjsj = Column(DateTime, nullable=True, comment="住院证开具时间")
    
    hzzs = Column(String(1500), nullable=True, comment="患者主诉")

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    record = relationship("Record", back_populates="base_info")
