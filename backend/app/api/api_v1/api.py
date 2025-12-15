from fastapi import APIRouter
from app.api.endpoints import auth, prefill, dicts, record, export

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(prefill.router, prefix="/mz_mfp", tags=["prefill"])
api_router.include_router(dicts.router, prefix="/dicts", tags=["dicts"])
api_router.include_router(record.router, prefix="/mz_mfp", tags=["record"])
api_router.include_router(export.router, prefix="/mz_mfp", tags=["export"])
