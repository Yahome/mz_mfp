from __future__ import annotations

import logging
from typing import Any, Dict, Iterable, List, Optional

from fastapi import status
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.core.config import Settings, get_settings
from app.core.errors import AppError

logger = logging.getLogger(__name__)


class ExternalDataAdapter:
    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self.sqlserver_engine = self._create_engine(self.settings.external_sqlserver_dsn)
        self.oracle_engine = self._create_engine(self.settings.external_oracle_dsn)
        # 基础信息视图使用 JZKH（就诊卡号/病历号），费用视图使用 BLH
        self.base_info_query = text(
            "SELECT * FROM V_EMR_MZ_PAT_MASTER_INDEX WHERE JZKH = :patient_no"
        )
        self.fee_query = text(
            "SELECT * FROM V_EMR_MZ_PAGE_FEE WHERE BLH = :patient_no"
        )
        self.visit_list_query = text(
            """
            SELECT
              JZKH, JZSJ, jzksdm, jzysdm, XM, jzks, JZYS
            FROM V_EMR_MZ_PAT_MASTER_INDEX
            WHERE JZSJ >= :from_dt AND JZSJ < :to_dt
            """
        )

    def _create_engine(self, dsn: Optional[str]) -> Optional[Engine]:
        if not dsn:
            return None
        return create_engine(dsn, pool_pre_ping=True)

    def _run_query(self, query, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        engine = self.sqlserver_engine or self.oracle_engine
        if engine is None:
            raise AppError(
                code="external_error",
                message="外部数据源未配置",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        try:
            with engine.connect() as conn:
                result = conn.execute(query, params)
                return list(result.mappings().all())
        except Exception as exc:
            detail = None
            if self.settings.app_env == "dev":
                detail = {"type": type(exc).__name__, "error": str(exc)}
            logger.exception("External query failed: %s params=%s", query, params)
            raise AppError(
                code="external_error",
                message="外部数据暂不可用，请稍后重试",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=detail,
            ) from exc

    def fetch_base_info(self, patient_no: str) -> Optional[Dict[str, Any]]:
        rows = self._run_query(self.base_info_query, {"patient_no": patient_no})
        return rows[0] if rows else None

    def fetch_patient_fee(self, patient_no: str) -> Optional[Dict[str, Any]]:
        rows = self._run_query(self.fee_query, {"patient_no": patient_no})
        return rows[0] if rows else None

    def fetch_visit_list(self, *, from_dt, to_dt) -> List[Dict[str, Any]]:
        return self._run_query(self.visit_list_query, {"from_dt": from_dt, "to_dt": to_dt})
