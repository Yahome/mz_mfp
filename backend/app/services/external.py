from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
import re

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
              JZKH, JZSJ, jzksdm, jzksdmhis, jzysdm, XM, jzks, JZYS
            FROM V_EMR_MZ_PAT_MASTER_INDEX
            WHERE JZSJ >= :from_dt AND JZSJ < :to_dt
            """
        )
        self.diagnosis_query = text(
            """
            SELECT *
            FROM V_EMR_MZ_PAGE_DISEASE
            WHERE inp_no = :patient_no
            ORDER BY diagnosis_no ASC
            """
        )
        self.herb_query = text(
            """
            SELECT TOP (40)
              b.blh AS patient_no,
              CASE WHEN ypcd.s_ypjx = '配方颗粒' THEN '2' ELSE '1' END AS ZCYLB,
              yfpp.dybm AS YYTJDM,
              yfpp.dymc AS YYTJMC,
              a.js AS YYJS,
              a.pxxh AS xh
            FROM dbo.VI_MZ_CFB_mx a
            INNER JOIN dbo.VI_MZ_CFB b ON a.cfid = b.cfid
            LEFT JOIN dbo.VI_YP_YPCD ypcd ON a.XMID = ypcd.cjid AND b.XMLY = 1
            LEFT JOIN t_emr_zyyfmc_pp yfpp ON a.yfmc = yfpp.yfmc
            WHERE b.BSFBZ='1' AND b.BSCBZ='0' AND b.sfrq >= '2025-12-01' AND a.TJDXMDM = '03'
              AND b.blh = :patient_no
            ORDER BY a.pxxh ASC
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

    def fetch_diagnoses(self, patient_no: str) -> List[Dict[str, Any]]:
        return self._run_query(self.diagnosis_query, {"patient_no": patient_no})

    def fetch_herb_details(self, patient_no: str) -> List[Dict[str, Any]]:
        return self._run_query(self.herb_query, {"patient_no": patient_no})

    def fetch_chief_complaint_sqlserver(self, patient_no: str) -> Optional[str]:
        """
        通过 SQL Server OPENQUERY 访问 Oracle 视图获取主诉。
        说明：OPENQUERY 不能使用绑定参数，需在服务端拼接 SQL，故做严格的患者号校验以防注入。
        """
        if self.sqlserver_engine is None:
            return None

        # 仅允许字母/数字/下划线/短横线，防止注入
        if not re.fullmatch(r"[A-Za-z0-9_-]+", patient_no):
            raise AppError(code="validation_failed", message="patient_no 含非法字符", http_status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        inner_sql = f"""
SELECT patient_id, content
FROM JHEMR.MZ_EMR_NODE
WHERE node = '主诉'
  AND patient_id = '{patient_no}'
  AND last_modify_date_time >= TO_DATE('2025-12-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
ORDER BY last_modify_date_time DESC
""".strip()
        safe_inner_sql = inner_sql.replace("'", "''")
        outer_sql = f"SELECT TOP (1) patient_id, content FROM OPENQUERY([10.10.8.50], '{safe_inner_sql}')"
        try:
            with self.sqlserver_engine.connect() as conn:
                result = conn.execute(text(outer_sql))
                row = result.mappings().first()
                if not row:
                    return None
                content = row.get("content")
                return str(content).strip() if content is not None else None
        except Exception as exc:
            detail = None
            if self.settings.app_env == "dev":
                detail = {"type": type(exc).__name__, "error": str(exc)}
            logger.exception("Fetch chief complaint via OPENQUERY failed for patient_no=%s", patient_no)
            raise AppError(
                code="external_error",
                message="外部数据暂不可用，请稍后重试",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=detail,
            ) from exc
