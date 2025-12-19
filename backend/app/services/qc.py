from __future__ import annotations

from typing import Optional

from fastapi import status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.errors import AppError
from app.models.field_audit import FieldAudit
from app.models.record import Record
from app.schemas.auth import SessionPayload
from app.schemas.qc import FieldAuditOut, RecordQcResponse
from app.schemas.records import RecordMeta
from app.services.auth import VisitAccessContext, validate_patient_access
from app.services.external import ExternalDataAdapter
from app.services.utils import first_value
from app.services.validation import ValidationService


class QcService:
    def __init__(self, db: Session, external: ExternalDataAdapter) -> None:
        self.db = db
        self.external = external

    def get_record_qc(self, *, record_id: int, session: SessionPayload) -> RecordQcResponse:
        record = self._load_record(record_id)
        if record is None:
            raise AppError(code="not_found", message="记录不存在", http_status=status.HTTP_404_NOT_FOUND)

        self._ensure_access(record, session)

        errors = ValidationService(self.db).validate_for_submit(record)
        audits = self._load_audits(record_id)

        meta = RecordMeta(
            record_id=record.id,
            patient_no=record.patient_no,
            status=record.status,
            version=int(record.version),
            visit_time=record.visit_time,
            submitted_at=record.submitted_at,
        )
        return RecordQcResponse(record=meta, errors=errors, audits=audits)

    def _load_record(self, record_id: int) -> Optional[Record]:
        stmt = (
            select(Record)
            .where(Record.id == record_id)
            .options(
                joinedload(Record.base_info),
                joinedload(Record.diagnoses),
                joinedload(Record.tcm_operations),
                joinedload(Record.surgeries),
                joinedload(Record.herb_details),
                joinedload(Record.medication_summary),
                joinedload(Record.fee_summary),
            )
        )
        return self.db.execute(stmt).scalars().first()

    def _ensure_access(self, record: Record, session: SessionPayload) -> None:
        base_row = self.external.fetch_base_info(record.patient_no)
        if not base_row:
            raise AppError(code="not_found", message="未找到就诊记录", http_status=status.HTTP_404_NOT_FOUND)

        base_map = dict(base_row)
        visit_context = VisitAccessContext(
            dept_code=first_value(base_map, ["JZKSDM", "jzksdm", "DEPT_CODE", "dept_code", "JZKSDMHIS", "jzksdmhis"]),
            doc_code=first_value(base_map, ["JZYS_DM", "JZYSBM", "JZYSBM_CODE", "jzysdm", "DOC_CODE"]),
        )
        validate_patient_access(record.patient_no, session, visit_context)

    def _load_audits(self, record_id: int) -> list[FieldAuditOut]:
        stmt = select(FieldAudit).where(FieldAudit.record_id == record_id).order_by(FieldAudit.created_at.desc()).limit(200)
        rows = self.db.execute(stmt).scalars().all()
        return [
            FieldAuditOut(
                id=row.id,
                field_key=row.field_key,
                old_value=row.old_value,
                new_value=row.new_value,
                change_source=row.change_source,
                operator_code=row.operator_code,
                created_at=row.created_at,
            )
            for row in rows
        ]

