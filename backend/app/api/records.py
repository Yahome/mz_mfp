from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Path
from fastapi import Query
from sqlalchemy.orm import Session

from app.api.auth import require_session
from app.api.prefill import get_external_adapter
from app.core.db import get_db
from app.schemas.auth import SessionPayload
from app.schemas.qc import RecordQcResponse
from app.schemas.records import RecordResponse, RecordSaveRequest
from app.schemas.visits import VisitListResponse
from app.services.external import ExternalDataAdapter
from app.services.qc import QcService
from app.services.records import RecordService
from app.services.visit_list import VisitListQuery, VisitListService

router = APIRouter(prefix="/mz_mfp", tags=["mz_mfp"])


def get_record_service(
    db: Session = Depends(get_db),
    external: ExternalDataAdapter = Depends(get_external_adapter),
) -> RecordService:
    return RecordService(db=db, external=external)


def get_visit_list_service(
    db: Session = Depends(get_db),
    external: ExternalDataAdapter = Depends(get_external_adapter),
) -> VisitListService:
    return VisitListService(db=db, external=external)


def get_qc_service(
    db: Session = Depends(get_db),
    external: ExternalDataAdapter = Depends(get_external_adapter),
) -> QcService:
    return QcService(db=db, external=external)


@router.get("/records", response_model=VisitListResponse)
def list_records(
    from_date: date = Query(..., alias="from", description="接诊开始日期（含）"),
    to_date: date = Query(..., alias="to", description="接诊结束日期（含）"),
    outpatient_no: Optional[str] = Query(None, description="门诊号（精确匹配，=patient_no）"),
    patient_name: Optional[str] = Query(None, description="患者姓名（模糊匹配）"),
    dept_code: Optional[str] = Query(None, description="科室代码（医务科/质控可用）"),
    doc_code: Optional[str] = Query(None, description="医生代码（医务科/质控可用）"),
    status: Optional[str] = Query(None, description="draft/submitted/not_created"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    session: SessionPayload = Depends(require_session),
    service: VisitListService = Depends(get_visit_list_service),
) -> VisitListResponse:
    query = VisitListQuery(
        from_date=from_date,
        to_date=to_date,
        outpatient_no=outpatient_no,
        patient_name=patient_name,
        dept_code=dept_code,
        doc_code=doc_code,
        status=status,
        page=page,
        page_size=page_size,
    )
    return service.list_visits(session=session, query=query)


@router.get("/records/{patient_no}", response_model=RecordResponse)
def get_record(
    patient_no: str = Path(..., description="患者唯一号（blh）"),
    session: SessionPayload = Depends(require_session),
    service: RecordService = Depends(get_record_service),
) -> RecordResponse:
    return service.get_record(patient_no=patient_no, session=session)


@router.post("/records/{patient_no}/draft", response_model=RecordResponse)
def save_draft(
    request: RecordSaveRequest,
    patient_no: str = Path(..., description="患者唯一号（blh）"),
    session: SessionPayload = Depends(require_session),
    service: RecordService = Depends(get_record_service),
) -> RecordResponse:
    return service.save_draft(patient_no=patient_no, session=session, request=request)


@router.post("/records/{patient_no}/submit", response_model=RecordResponse)
def submit(
    request: RecordSaveRequest,
    patient_no: str = Path(..., description="患者唯一号（blh）"),
    session: SessionPayload = Depends(require_session),
    service: RecordService = Depends(get_record_service),
) -> RecordResponse:
    return service.submit(patient_no=patient_no, session=session, request=request)


@router.get("/records/{record_id}/qc", response_model=RecordQcResponse)
def record_qc(
    record_id: int = Path(..., ge=1),
    session: SessionPayload = Depends(require_session),
    service: QcService = Depends(get_qc_service),
) -> RecordQcResponse:
    return service.get_record_qc(record_id=record_id, session=session)
