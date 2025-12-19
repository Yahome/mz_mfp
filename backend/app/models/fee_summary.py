from __future__ import annotations

from decimal import Decimal
from typing import Optional

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ID_TYPE, Base, TimestampMixin


class FeeSummary(TimestampMixin, Base):
    __tablename__ = "mz_mfp_fee_summary"

    record_id: Mapped[int] = mapped_column(ID_TYPE, ForeignKey("mz_mfp_record.id"), primary_key=True)

    zfy: Mapped[Decimal] = mapped_column(Numeric(11, 2), nullable=False)
    zfje: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    ylfwf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    zlczf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    hlf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    qtfy: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    blzdf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    zdf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    yxxzdf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    lczdxmf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    fsszlxmf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    zlf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    sszlf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    mzf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    ssf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    kff: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    zyl_zyzd: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    zyzl: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    zywz: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    zygs: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    zcyjf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    zytnzl: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    zygczl: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    zytszl: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    zyqt: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    zytstpjg: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    bzss: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    xyf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    kjywf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    zcyf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    zyzjf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    zcyf1: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    pfklf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    xf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    bdbblzpf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    qdbblzpf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    nxyzlzpf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    xbyzlzpf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    jcyyclf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    yyclf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    ssycxclf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    qtf: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)

    record = relationship("Record", back_populates="fee_summary")
