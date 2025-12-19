from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import ID_TYPE, Base


class ExportLog(Base):
    __tablename__ = "mz_mfp_export_log"

    id: Mapped[int] = mapped_column(ID_TYPE, primary_key=True, autoincrement=True)
    record_id: Mapped[Optional[int]] = mapped_column(ID_TYPE, ForeignKey("mz_mfp_record.id"), nullable=True)
    export_type: Mapped[str] = mapped_column(String(20), nullable=False)
    file_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    detail: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    created_by: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
