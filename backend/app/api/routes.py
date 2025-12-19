from fastapi import APIRouter

from app.api.auth import auth_router
from app.api.config import router as config_router
from app.api.dicts import router as dict_router
from app.api.exports import router as export_router
from app.api.prefill import router as prefill_router
from app.api.print import router as print_router
from app.api.records import router as record_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(config_router)
router.include_router(dict_router)
router.include_router(prefill_router)
router.include_router(record_router)
router.include_router(print_router)
router.include_router(export_router)


@router.get("/health", tags=["system"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
