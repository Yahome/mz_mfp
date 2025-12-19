from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth import require_session
from app.core.db import get_db
from app.schemas.auth import SessionPayload
from app.schemas.config import FrontendConfigResponse, FrontendConfigUpdateRequest
from app.services.config import ConfigService

router = APIRouter(prefix="/config", tags=["config"])


def get_config_service(db: Session = Depends(get_db)) -> ConfigService:
    return ConfigService(db=db)


@router.get("/frontend", response_model=FrontendConfigResponse)
def get_frontend_config(
    _session: SessionPayload = Depends(require_session),
    service: ConfigService = Depends(get_config_service),
) -> FrontendConfigResponse:
    return service.get_frontend_config()


@router.put("/frontend", response_model=FrontendConfigResponse)
def update_frontend_config(
    payload: FrontendConfigUpdateRequest,
    session: SessionPayload = Depends(require_session),
    service: ConfigService = Depends(get_config_service),
) -> FrontendConfigResponse:
    return service.update_frontend_config(session=session, config=payload.config)

