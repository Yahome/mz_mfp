from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any, Dict, Optional

from fastapi import status
from sqlalchemy import and_, func, select
from sqlalchemy.dialects.mysql import insert as mysql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.record import Record
from app.models.visit_index import VisitIndex
from app.schemas.auth import SessionPayload
from app.schemas.visits import VisitListItem, VisitListResponse
from app.services.external import ExternalDataAdapter
from app.services.utils import as_str, clean_value, first_value


def _date_range_to_window(from_date: date, to_date: date) -> tuple[datetime, datetime]:
    if to_date < from_date:
        raise AppError(
            code="validation_failed",
            message="时间范围不合法（to < from）",
            http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )
    days_inclusive = (to_date - from_date).days + 1
    if days_inclusive > 31:
        raise AppError(
            code="validation_failed",
            message="时间范围过大（最多支持 1 个月）",
            http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )
    from_dt = datetime(from_date.year, from_date.month, from_date.day)
    to_dt = datetime(to_date.year, to_date.month, to_date.day) + timedelta(days=1)
    return from_dt, to_dt


def _upsert_visit_rows(db: Session, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return

    dialect = db.get_bind().dialect.name
    stmt_rows: list[dict[str, Any]] = []
    for row in rows:
        stmt_rows.append(
            {
                "patient_no": row["patient_no"],
                "visit_time": row["visit_time"],
                "dept_code": row.get("dept_code"),
                "doc_code": row.get("doc_code"),
                "xm": row.get("xm"),
                "jzks": row.get("jzks"),
                "jzys": row.get("jzys"),
            }
        )

    chunk_size = 1000
    for offset in range(0, len(stmt_rows), chunk_size):
        batch = stmt_rows[offset : offset + chunk_size]
        if dialect == "mysql":
            stmt = mysql_insert(VisitIndex).values(batch)
            stmt = stmt.on_duplicate_key_update(
                visit_time=stmt.inserted.visit_time,
                dept_code=stmt.inserted.dept_code,
                doc_code=stmt.inserted.doc_code,
                xm=stmt.inserted.xm,
                jzks=stmt.inserted.jzks,
                jzys=stmt.inserted.jzys,
            )
        else:
            stmt = sqlite_insert(VisitIndex).values(batch)
            stmt = stmt.on_conflict_do_update(
                index_elements=[VisitIndex.patient_no],
                set_={
                    "visit_time": stmt.excluded.visit_time,
                    "dept_code": stmt.excluded.dept_code,
                    "doc_code": stmt.excluded.doc_code,
                    "xm": stmt.excluded.xm,
                    "jzks": stmt.excluded.jzks,
                    "jzys": stmt.excluded.jzys,
                },
            )
        db.execute(stmt)


def _normalize_visit_row(row: Dict[str, Any]) -> Optional[dict[str, Any]]:
    patient_no = as_str(first_value(row, ["JZKH", "jzkh", "BLH", "blh", "PATIENT_NO", "patient_no"]))
    visit_time = first_value(row, ["JZSJ", "jzsj", "VISIT_TIME", "visit_time"])
    if not patient_no or not isinstance(visit_time, datetime):
        return None

    dept_code = as_str(first_value(row, ["JZKSDM", "jzksdm", "DEPT_CODE", "dept_code", "JZKSDMHIS", "jzksdmhis"]))
    doc_code = as_str(first_value(row, ["JZYSDM", "jzysdm", "JZYS_DM", "jzys_dm", "DOC_CODE", "doc_code"]))
    xm = as_str(first_value(row, ["XM", "xm"]))
    jzks = as_str(first_value(row, ["JZKS", "jzks"]))
    jzys = as_str(first_value(row, ["JZYS", "jzys"]))

    return {
        "patient_no": patient_no,
        "visit_time": visit_time,
        "dept_code": clean_value(dept_code),
        "doc_code": clean_value(doc_code),
        "xm": clean_value(xm),
        "jzks": clean_value(jzks),
        "jzys": clean_value(jzys),
    }


@dataclass(frozen=True)
class VisitListQuery:
    from_date: date
    to_date: date
    outpatient_no: Optional[str] = None  # 门诊号（=patient_no）
    patient_name: Optional[str] = None  # 患者姓名（模糊）
    dept_code: Optional[str] = None
    doc_code: Optional[str] = None
    status: Optional[str] = None  # draft/submitted/not_created
    page: int = 1
    page_size: int = 20


class VisitListService:
    def __init__(self, db: Session, external: ExternalDataAdapter) -> None:
        self.db = db
        self.external = external

    def list_visits(self, session: SessionPayload, query: VisitListQuery) -> VisitListResponse:
        self._sync_visit_index(query.from_date, query.to_date)

        effective_dept, effective_doc = self._apply_role_filter(session, query.dept_code, query.doc_code)

        from_dt, to_dt = _date_range_to_window(query.from_date, query.to_date)
        visit_cond = and_(VisitIndex.visit_time >= from_dt, VisitIndex.visit_time < to_dt)

        stmt = (
            select(
                VisitIndex.patient_no,
                VisitIndex.visit_time,
                VisitIndex.xm,
                VisitIndex.dept_code,
                VisitIndex.doc_code,
                VisitIndex.jzks.label("dept_name"),
                VisitIndex.jzys.label("doc_name"),
                Record.id.label("record_id"),
                Record.status.label("record_status"),
                Record.version.label("record_version"),
            )
            .select_from(VisitIndex)
            .outerjoin(Record, Record.patient_no == VisitIndex.patient_no)
            .where(visit_cond)
        )

        if effective_dept:
            stmt = stmt.where(VisitIndex.dept_code == effective_dept)
        if effective_doc:
            stmt = stmt.where(VisitIndex.doc_code == effective_doc)

        if query.outpatient_no and query.outpatient_no.strip():
            stmt = stmt.where(VisitIndex.patient_no == query.outpatient_no.strip())
        if query.patient_name and query.patient_name.strip():
            pattern = f"%{query.patient_name.strip()}%"
            stmt = stmt.where(VisitIndex.xm.like(pattern))

        if query.status:
            status_value = query.status.strip()
            if status_value not in {"draft", "submitted", "not_created"}:
                raise AppError(
                    code="validation_failed",
                    message="status 参数不合法",
                    http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )
            if status_value == "not_created":
                stmt = stmt.where(Record.id.is_(None))
            else:
                stmt = stmt.where(Record.status == status_value)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int(self.db.execute(count_stmt).scalar_one())

        stmt = stmt.order_by(VisitIndex.visit_time.desc()).offset((query.page - 1) * query.page_size).limit(query.page_size)
        rows = self.db.execute(stmt).all()

        items: list[VisitListItem] = []
        for row in rows:
            status_value = row.record_status if row.record_id else "not_created"
            items.append(
                VisitListItem(
                    patient_no=row.patient_no,
                    visit_time=row.visit_time,
                    xm=row.xm,
                    dept_code=row.dept_code,
                    doc_code=row.doc_code,
                    dept_name=row.dept_name,
                    doc_name=row.doc_name,
                    status=status_value,
                    record_id=row.record_id,
                    version=int(row.record_version) if row.record_version is not None else None,
                )
            )

        return VisitListResponse(page=query.page, page_size=query.page_size, total=total, items=items)

    def _sync_visit_index(self, from_date: date, to_date: date) -> None:
        from_dt, to_dt = _date_range_to_window(from_date, to_date)
        raw_rows = self.external.fetch_visit_list(from_dt=from_dt, to_dt=to_dt)
        normalized: list[dict[str, Any]] = []
        for raw in raw_rows:
            item = _normalize_visit_row(raw)
            if item:
                normalized.append(item)
        _upsert_visit_rows(self.db, normalized)
        self.db.commit()

    def _apply_role_filter(
        self, session: SessionPayload, dept_code: Optional[str], doc_code: Optional[str]
    ) -> tuple[Optional[str], Optional[str]]:
        elevated = any(role in {"admin", "qc"} for role in session.roles)
        if elevated:
            return (dept_code.strip() if dept_code else None, doc_code.strip() if doc_code else None)

        # 医生：科室/医生固定
        effective_dept = session.dept_code
        effective_doc = session.doc_code
        if dept_code and dept_code.strip() and dept_code.strip() != effective_dept:
            raise AppError(code="forbidden", message="无权切换科室条件", http_status=status.HTTP_403_FORBIDDEN)
        if doc_code and doc_code.strip() and doc_code.strip() != effective_doc:
            raise AppError(code="forbidden", message="无权切换医生条件", http_status=status.HTTP_403_FORBIDDEN)
        return effective_dept, effective_doc
