from typing import Any, Dict, Optional

from fastapi import status
from fastapi.responses import JSONResponse


class AppError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        http_status: int = status.HTTP_400_BAD_REQUEST,
        detail: Optional[Any] = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.http_status = http_status
        self.detail = detail


def error_response(exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.http_status,
        content={"code": exc.code, "message": exc.message, "detail": exc.detail},
    )


def default_error_mapping() -> Dict[int, str]:
    return {
        status.HTTP_401_UNAUTHORIZED: "unauthorized",
        status.HTTP_403_FORBIDDEN: "forbidden",
        status.HTTP_404_NOT_FOUND: "not_found",
        status.HTTP_409_CONFLICT: "version_conflict",
        status.HTTP_422_UNPROCESSABLE_ENTITY: "validation_failed",
        status.HTTP_500_INTERNAL_SERVER_ERROR: "internal_error",
    }
