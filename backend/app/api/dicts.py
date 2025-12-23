from __future__ import annotations

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session

from app.api.auth import require_session
from app.core.db import get_db
from app.schemas.dicts import DictSearchResponse
from app.services.dicts import DictService

router = APIRouter(prefix="/dicts", tags=["dicts"])


def get_dict_service(db: Session = Depends(get_db)) -> DictService:
    return DictService(db=db)


@router.get("/{set_code}/search", response_model=DictSearchResponse)
def search_dict(
    set_code: str = Path(..., description="字典集编码，如 RC001/ICD10/ICD9CM3/TCM_DISEASE/TCM_SYNDROME/COUNTRY"),
    q: str = Query("", description="关键字，支持按 code/name/pinyin 模糊检索"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    _session=Depends(require_session),
    service: DictService = Depends(get_dict_service),
) -> DictSearchResponse:
    return service.search(set_code=set_code, query=q, page=page, page_size=page_size)

