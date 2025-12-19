from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.config import AppConfig
from app.schemas.auth import SessionPayload
from app.schemas.config import FrontendConfigResponse


class ConfigService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_frontend_config(self) -> FrontendConfigResponse:
        row = self.db.execute(select(AppConfig).where(AppConfig.config_key == "frontend")).scalars().first()
        if row is None:
            return FrontendConfigResponse(config={})
        return FrontendConfigResponse(config=row.config_value or {}, updated_by=row.updated_by, updated_at=row.updated_at)

    def update_frontend_config(self, *, session: SessionPayload, config: Dict[str, Any]) -> FrontendConfigResponse:
        if not any(role in {"admin"} for role in session.roles):
            raise AppError(code="forbidden", message="仅管理员可更新配置", http_status=status.HTTP_403_FORBIDDEN)

        operator = (session.login_name or session.doc_code or "").strip() or "unknown"

        row = self.db.execute(select(AppConfig).where(AppConfig.config_key == "frontend")).scalars().first()
        now = datetime.utcnow()
        if row is None:
            row = AppConfig(config_key="frontend", config_value=config, updated_by=operator)
            self.db.add(row)
        else:
            row.config_value = config
            row.updated_by = operator
            row.updated_at = now
        self.db.commit()
        self.db.refresh(row)
        return FrontendConfigResponse(config=row.config_value or {}, updated_by=row.updated_by, updated_at=row.updated_at)

