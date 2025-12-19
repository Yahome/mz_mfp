from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.api.auth import require_session
from app.core.config import Settings, get_settings
from app.schemas.auth import SessionPayload
from app.schemas.prefill import PrefillResponse
from app.services.external import ExternalDataAdapter
from app.services.prefill import PrefillService


def get_external_adapter(settings: Settings = Depends(get_settings)) -> ExternalDataAdapter:
    return ExternalDataAdapter(settings)


def get_prefill_service(adapter: ExternalDataAdapter = Depends(get_external_adapter)) -> PrefillService:
    return PrefillService(adapter)


router = APIRouter(prefix="/mz_mfp", tags=["mz_mfp"])


@router.get("/prefill", response_model=PrefillResponse)
def prefill(
    patient_no: str = Query(..., description="患者唯一号（blh）"),
    session: SessionPayload = Depends(require_session),
    service: PrefillService = Depends(get_prefill_service),
) -> PrefillResponse:
    return service.prefill(patient_no=patient_no, session=session)
