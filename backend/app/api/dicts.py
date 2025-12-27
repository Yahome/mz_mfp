from __future__ import annotations

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session

from app.api.auth import require_session
from app.core.db import get_db
from app.schemas.dicts import DictSearchResponse
from app.schemas.dict_user_prefs import DictFavoriteUpdateRequest, DictUserItemsResponse
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


@router.get("/{set_code}/recents", response_model=DictUserItemsResponse)
def list_recent(
    set_code: str = Path(..., description="字典集编码"),
    limit: int = Query(50, ge=1, le=500),
    session=Depends(require_session),
    service: DictService = Depends(get_dict_service),
) -> DictUserItemsResponse:
    items = service.list_recent(user_code=session.doc_code, set_code=set_code, limit=limit)
    return DictUserItemsResponse(set_code=set_code, items=items)


@router.post("/{set_code}/recents/{code}")
def mark_recent(
    set_code: str = Path(..., description="字典集编码"),
    code: str = Path(..., description="字典项编码"),
    session=Depends(require_session),
    service: DictService = Depends(get_dict_service),
) -> dict[str, str]:
    service.mark_recent(user_code=session.doc_code, set_code=set_code, code=code)
    return {"status": "ok"}


@router.get("/{set_code}/favorites", response_model=DictUserItemsResponse)
def list_favorites(
    set_code: str = Path(..., description="字典集编码"),
    limit: int = Query(200, ge=1, le=1000),
    session=Depends(require_session),
    service: DictService = Depends(get_dict_service),
) -> DictUserItemsResponse:
    items = service.list_favorites(user_code=session.doc_code, set_code=set_code, limit=limit)
    return DictUserItemsResponse(set_code=set_code, items=items)


@router.put("/{set_code}/favorites/{code}")
def update_favorite(
    payload: DictFavoriteUpdateRequest,
    set_code: str = Path(..., description="字典集编码"),
    code: str = Path(..., description="字典项编码"),
    session=Depends(require_session),
    service: DictService = Depends(get_dict_service),
) -> dict[str, str]:
    service.set_favorite(user_code=session.doc_code, set_code=set_code, code=code, favorited=payload.favorited)
    return {"status": "ok"}

