from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class VisitIndex(TimestampMixin, Base):
    """
    本地“就诊索引”表：
    - 列表查询时按时间范围从外部视图同步（增量 upsert）
    - 本地联表 `mz_mfp_record` 得到状态（not_created/draft/submitted）
    """

    __tablename__ = "mz_mfp_visit_index"

    patient_no: Mapped[str] = mapped_column(String(50), primary_key=True)
    visit_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    dept_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    doc_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    xm: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    jzks: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    jzys: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)

