from __future__ import annotations

from fastapi import APIRouter, Depends, Path
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.api.auth import require_session
from app.api.prefill import get_external_adapter
from app.core.db import get_db
from app.schemas.auth import SessionPayload
from app.services.external import ExternalDataAdapter
from app.services.print import PrintService

router = APIRouter(prefix="/mz_mfp", tags=["mz_mfp"])


def get_print_service(
    db: Session = Depends(get_db),
    external: ExternalDataAdapter = Depends(get_external_adapter),
) -> PrintService:
    return PrintService(db=db, external=external)


@router.get("/records/{record_id}/print.html", response_class=HTMLResponse)
def print_html(
    record_id: int = Path(..., ge=1),
    session: SessionPayload = Depends(require_session),
    service: PrintService = Depends(get_print_service),
) -> HTMLResponse:
    html = service.render_print_html(record_id=record_id, session=session)
    return HTMLResponse(content=html)

