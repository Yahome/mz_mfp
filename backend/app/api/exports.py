from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.auth import require_session
from app.api.prefill import get_external_adapter
from app.core.db import get_db
from app.schemas.auth import SessionPayload
from app.services.export import ExportService
from app.services.external import ExternalDataAdapter

router = APIRouter(prefix="/mz_mfp", tags=["mz_mfp"])


def get_export_service(
    db: Session = Depends(get_db),
    external: ExternalDataAdapter = Depends(get_external_adapter),
) -> ExportService:
    return ExportService(db=db, external=external)


@router.get("/exports/report.xlsx")
def export_report(
    from_date: date = Query(..., alias="from", description="接诊开始日期（含）"),
    to_date: date = Query(..., alias="to", description="接诊结束日期（含）"),
    session: SessionPayload = Depends(require_session),
    service: ExportService = Depends(get_export_service),
) -> Response:
    result = service.export_report(from_date=from_date, to_date=to_date, session=session)
    headers = {
        "Content-Disposition": f'attachment; filename="{result.filename}"',
    }
    return Response(
        content=result.content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )

