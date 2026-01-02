import logging
import time

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import his_router
from app.api.routes import router as api_router
from app.core.config import get_settings
from app.core.errors import AppError, default_error_mapping, error_response
from app.core.logging import setup_logging
from app.services.auth import SESSION_COOKIE_NAME, SessionManager
from app.services.user_operation_log import UserOperationLogService

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging()

    app = FastAPI(title="门诊病案首页填写系统", version="0.1.0")

    session_manager = SessionManager(secret=settings.signature_secret, ttl_minutes=settings.session_ttl_minutes)
    user_log_service = UserOperationLogService(settings)

    @app.middleware("http")
    async def user_operation_log_middleware(request: Request, call_next):
        path = request.url.path or ""
        if not path.startswith("/api/"):
            return await call_next(request)

        start = time.perf_counter()

        login_name = None
        token = request.cookies.get(SESSION_COOKIE_NAME)
        if token:
            try:
                session = session_manager.decode(token)
                login_name = session.login_name
            except Exception:
                login_name = None

        response = await call_next(request)
        duration_ms = int((time.perf_counter() - start) * 1000)

        if user_log_service.is_enabled() and login_name and path not in {"/api/auth/login", "/api/auth/logout"}:
            error_code = None
            error_summary = None
            if response.status_code >= 400:
                error_code = getattr(request.state, "error_code", None)
                error_message = getattr(request.state, "error_message", None)
                if not error_code:
                    mapping = default_error_mapping()
                    error_code = mapping.get(response.status_code) or f"http_{response.status_code}"
                if error_message:
                    error_summary = user_log_service.build_error_summary(error_message)
                else:
                    error_summary = f"ERR: HTTP {response.status_code}"

            user_log_service.append_api_operation(
                login_name=login_name,
                method=request.method,
                path=path,
                status_code=response.status_code,
                duration_ms=duration_ms,
                error_code=error_code,
                error_summary=error_summary,
            )

        return response

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError):
        request.state.error_code = exc.code
        request.state.error_message = exc.message
        return error_response(exc)

    @app.exception_handler(Exception)
    async def handle_unexpected(request: Request, exc: Exception):
        logger.exception("Unhandled error on %s %s", request.method, request.url)
        mapping = default_error_mapping()
        code = mapping[status.HTTP_500_INTERNAL_SERVER_ERROR]
        request.state.error_code = code
        request.state.error_message = "服务器开小差，请稍后重试"
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
