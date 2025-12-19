from __future__ import annotations

import base64
import hashlib
import hmac
import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Iterable, Optional

from fastapi import status

from app.core.errors import AppError
from app.schemas.auth import SessionPayload

SESSION_COOKIE_NAME = "mz_mfp_session"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _serialize_datetime(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat()


def _decode_base64(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


class SessionManager:
    def __init__(self, secret: str, ttl_minutes: int) -> None:
        self.secret = secret.encode("utf-8")
        self.ttl_minutes = ttl_minutes

    def create_session(
        self,
        *,
        login_name: str,
        doc_code: str,
        dept_code: str,
        roles: Iterable[str],
        patient_no: Optional[str] = None,
    ) -> tuple[str, SessionPayload]:
        issued_at = _now()
        expires_at = issued_at + timedelta(minutes=self.ttl_minutes)
        payload = SessionPayload(
            login_name=login_name,
            doc_code=doc_code,
            dept_code=dept_code,
            roles=[role.lower() for role in roles],
            patient_no=patient_no,
            issued_at=issued_at,
            expires_at=expires_at,
        )
        return self.encode(payload), payload

    def encode(self, payload: SessionPayload) -> str:
        raw = json.dumps(
            payload.model_dump(),
            default=_serialize_datetime,
            separators=(",", ":"),
            sort_keys=True,
        )
        signature = hmac.new(self.secret, raw.encode("utf-8"), hashlib.sha256).hexdigest()
        body = base64.urlsafe_b64encode(raw.encode("utf-8")).decode("utf-8").rstrip("=")
        return f"{body}.{signature}"

    def decode(self, token: str) -> SessionPayload:
        try:
            body, signature = token.split(".", 1)
        except ValueError as exc:
            raise AppError(
                code="unauthorized",
                message="会话无效",
                http_status=status.HTTP_401_UNAUTHORIZED,
            ) from exc

        raw_bytes = _decode_base64(body)
        raw_str = raw_bytes.decode("utf-8")
        expected = hmac.new(self.secret, raw_str.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise AppError(
                code="unauthorized",
                message="会话无效",
                http_status=status.HTTP_401_UNAUTHORIZED,
            )

        payload = SessionPayload.model_validate_json(raw_str)
        if payload.expires_at <= _now():
            raise AppError(
                code="unauthorized",
                message="会话已过期",
                http_status=status.HTTP_401_UNAUTHORIZED,
            )
        return payload


def calculate_his_signature(
    *,
    algo: str,
    secret: str,
    patient_no: str,
    dept_code: str,
    doc_code: str,
    timestamp: int,
) -> str:
    raw = f"{patient_no}{dept_code}{doc_code}{timestamp}"
    if algo == "hmac_sha256":
        return hmac.new(secret.encode("utf-8"), raw.encode("utf-8"), hashlib.sha256).hexdigest()
    return hashlib.sha256(f"{raw}{secret}".encode("utf-8")).hexdigest()


def validate_his_signature(
    *,
    algo: str,
    secret: str,
    window_seconds: int,
    patient_no: str,
    dept_code: str,
    doc_code: str,
    timestamp: int,
    provided_sign: str,
) -> None:
    now_ts = int(_now().timestamp())
    if abs(now_ts - timestamp) > window_seconds:
        raise AppError(
            code="signature_expired",
            message="验签已过期，请从 HIS 入口重新进入",
            http_status=status.HTTP_401_UNAUTHORIZED,
        )

    expected = calculate_his_signature(
        algo=algo, secret=secret, patient_no=patient_no, dept_code=dept_code, doc_code=doc_code, timestamp=timestamp
    )
    if not hmac.compare_digest(expected, provided_sign.lower()):
        raise AppError(
            code="invalid_signature",
            message="验签失败，请从 HIS 入口重新进入",
            http_status=status.HTTP_401_UNAUTHORIZED,
        )


@dataclass
class VisitAccessContext:
    dept_code: str
    doc_code: str


def validate_patient_access(
    patient_no: str,
    session: SessionPayload,
    visit_context: Optional[VisitAccessContext],
) -> None:
    if visit_context is None:
        raise AppError(
            code="not_found",
            message="未找到就诊记录",
            http_status=status.HTTP_404_NOT_FOUND,
        )

    if session.patient_no and session.patient_no != patient_no:
        raise AppError(
            code="forbidden",
            message="患者上下文不一致",
            http_status=status.HTTP_403_FORBIDDEN,
        )

    elevated = any(role in {"admin", "qc"} for role in session.roles)
    if elevated:
        return

    def _normalize_code(value: object) -> str:
        if value is None:
            return ""
        if isinstance(value, float) and value.is_integer():
            value = int(value)
        return str(value).strip()

    if _normalize_code(session.dept_code) != _normalize_code(visit_context.dept_code) or _normalize_code(
        session.doc_code
    ) != _normalize_code(visit_context.doc_code):
        raise AppError(
            code="forbidden",
            message="无权访问该患者",
            http_status=status.HTTP_403_FORBIDDEN,
        )
