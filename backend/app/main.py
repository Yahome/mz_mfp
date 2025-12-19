import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import his_router
from app.api.routes import router as api_router
from app.core.config import get_settings
from app.core.errors import AppError, default_error_mapping, error_response
from app.core.logging import setup_logging

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging()

    app = FastAPI(title="门诊病案首页填写系统", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(AppError)
    async def handle_app_error(_: Request, exc: AppError):
        return error_response(exc)

    @app.exception_handler(Exception)
    async def handle_unexpected(request: Request, exc: Exception):
        logger.exception("Unhandled error on %s %s", request.method, request.url)
        mapping = default_error_mapping()
        code = mapping[status.HTTP_500_INTERNAL_SERVER_ERROR]
        return error_response(
            AppError(
                code=code,
                message="服务器开小差，请稍后重试",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        )

    app.include_router(his_router)
    app.include_router(api_router, prefix="/api")
    return app


app = create_app()
