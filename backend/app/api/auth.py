import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.db import get_db
from app.core.errors import AppError
from app.models.user import AppUser, AppUserDept, AppUserRole
from app.schemas.auth import DeptListResponse, DeptOption, LoginRequest, SessionPayload, SwitchDeptRequest
from app.services.auth import (
    SESSION_COOKIE_NAME,
    SessionManager,
    VisitAccessContext,
    validate_his_signature,
    validate_patient_access,
)

logger = logging.getLogger(__name__)

auth_router = APIRouter(prefix="/auth", tags=["auth"])
his_router = APIRouter()


def get_session_manager(settings: Settings = Depends(get_settings)) -> SessionManager:
    return SessionManager(secret=settings.signature_secret, ttl_minutes=settings.session_ttl_minutes)


def _set_session_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.app_env != "dev",
        max_age=settings.session_ttl_minutes * 60,
        path="/",
    )


@his_router.get("/his-jump", include_in_schema=False)
def his_jump(
    response: Response,
    patient_no: str = Query(..., description="患者唯一号（blh）"),
    dept_code: str = Query(..., description="就诊科室代码"),
    doc_code: str = Query(..., description="接诊医生代码"),
    timestamp: Optional[int] = Query(None, description="Unix 秒级时间戳"),
    sign: Optional[str] = Query(None, description="小写 hex 签名"),
    settings: Settings = Depends(get_settings),
    session_manager: SessionManager = Depends(get_session_manager),
) -> Response:
    if not settings.allow_unsigned_his_jump:
        if timestamp is None or sign is None:
            raise AppError(
                code="unauthorized",
                message="缺少验签参数",
                http_status=status.HTTP_401_UNAUTHORIZED,
            )
        validate_his_signature(
            algo=settings.signature_algo,
            secret=settings.signature_secret,
            window_seconds=settings.signature_window_seconds,
            patient_no=patient_no,
            dept_code=dept_code,
            doc_code=doc_code,
            timestamp=timestamp,
            provided_sign=sign,
        )
    else:
        logger.warning("his-jump 验签已临时放行（allow_unsigned_his_jump=true）")

    token, _ = session_manager.create_session(
        login_name=doc_code,
        doc_code=doc_code,
        dept_code=dept_code,
        roles=["doctor"],
        patient_no=patient_no,
    )

    redirect = RedirectResponse(
        url=f"/app?patient_no={patient_no}",
        status_code=status.HTTP_302_FOUND,
    )
    _set_session_cookie(redirect, token, settings)
    return redirect


@auth_router.post("/login", response_model=SessionPayload)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    session_manager: SessionManager = Depends(get_session_manager),
) -> SessionPayload:
    user = db.execute(select(AppUser).where(AppUser.login_name == payload.login_name)).scalars().first()
    if user is None or not user.is_active:
        raise AppError(code="unauthorized", message="账号或密码错误", http_status=status.HTTP_401_UNAUTHORIZED)
    if user.password != payload.password:
        raise AppError(code="unauthorized", message="账号或密码错误", http_status=status.HTTP_401_UNAUTHORIZED)

    role_rows = db.execute(select(AppUserRole.role_code).where(AppUserRole.user_id == user.id)).all()
    roles = [str(row[0]).lower() for row in role_rows] if role_rows else ["doctor"]

    dept_rows = db.execute(select(AppUserDept.dept_code).where(AppUserDept.user_id == user.id)).all()
    dept_codes = [str(row[0]) for row in dept_rows] if dept_rows else []
    if user.dept_code and user.dept_code not in dept_codes:
        dept_codes = [user.dept_code, *dept_codes] if user.dept_code else dept_codes

    default_dept = None
    if user.dept_code and user.dept_code in dept_codes:
        default_dept = user.dept_code
    elif dept_codes:
        default_dept = sorted(set(dept_codes))[0]
    else:
        raise AppError(
            code="validation_failed",
            message="账号未配置可用科室，请先完成账号/科室授权导入",
            http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    user.dept_code = default_dept
    db.commit()

    token, session = session_manager.create_session(
        login_name=user.login_name or payload.login_name,
        doc_code=user.doc_code,
        dept_code=default_dept,
        roles=roles,
        patient_no=None,
    )
    _set_session_cookie(response, token, settings)
    logger.info("User %s logged in via login endpoint", payload.login_name)
    return session


def require_session(
    request: Request, session_manager: SessionManager = Depends(get_session_manager)
) -> SessionPayload:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        raise AppError(
            code="unauthorized",
            message="未登录或会话已失效",
            http_status=status.HTTP_401_UNAUTHORIZED,
        )
    return session_manager.decode(token)


def require_patient_access(
    patient_no: str,
    request: Request,
    visit_context: Optional[VisitAccessContext] = None,
    session: SessionPayload = Depends(require_session),
) -> SessionPayload:
    validate_patient_access(patient_no, session, visit_context)
    request.state.session = session
    return session


@auth_router.get("/me", response_model=SessionPayload)
def me(session: SessionPayload = Depends(require_session)) -> SessionPayload:
    return session


@auth_router.get("/depts", response_model=DeptListResponse)
def list_depts(
    db: Session = Depends(get_db),
    session: SessionPayload = Depends(require_session),
) -> DeptListResponse:
    user = db.execute(select(AppUser).where(AppUser.login_name == session.login_name)).scalars().first()
    if user is None:
        raise AppError(code="unauthorized", message="会话无效", http_status=status.HTTP_401_UNAUTHORIZED)

    dept_rows = db.execute(select(AppUserDept.dept_code).where(AppUserDept.user_id == user.id)).all()
    dept_codes = [str(row[0]) for row in dept_rows] if dept_rows else []
    if user.dept_code and user.dept_code not in dept_codes:
        dept_codes = [user.dept_code, *dept_codes]

    unique_codes = sorted({code for code in dept_codes if code and code.strip()})
    return DeptListResponse(
        current_dept_code=session.dept_code,
        depts=[DeptOption(dept_code=code) for code in unique_codes],
    )


@auth_router.post("/switch-dept", response_model=SessionPayload)
def switch_dept(
    payload: SwitchDeptRequest,
    response: Response,
    db: Session = Depends(get_db),
    session: SessionPayload = Depends(require_session),
    settings: Settings = Depends(get_settings),
    session_manager: SessionManager = Depends(get_session_manager),
) -> SessionPayload:
    if session.patient_no:
        raise AppError(
            code="version_conflict",
            message="患者上下文已绑定，不允许切换科室",
            http_status=status.HTTP_409_CONFLICT,
        )

    user = db.execute(select(AppUser).where(AppUser.login_name == session.login_name)).scalars().first()
    if user is None or not user.is_active:
        raise AppError(code="unauthorized", message="会话无效", http_status=status.HTTP_401_UNAUTHORIZED)

    dept_rows = db.execute(select(AppUserDept.dept_code).where(AppUserDept.user_id == user.id)).all()
    allowed = {str(row[0]) for row in dept_rows} if dept_rows else set()
    if user.dept_code:
        allowed.add(str(user.dept_code))

    target = payload.dept_code.strip()
    if not target:
        raise AppError(code="validation_failed", message="dept_code 不能为空", http_status=status.HTTP_422_UNPROCESSABLE_ENTITY)
    if allowed and target not in allowed:
        raise AppError(code="forbidden", message="无权切换到该科室", http_status=status.HTTP_403_FORBIDDEN)

    user.dept_code = target
    db.commit()

    token, new_session = session_manager.create_session(
        login_name=session.login_name,
        doc_code=session.doc_code,
        dept_code=target,
        roles=session.roles,
        patient_no=None,
    )
    _set_session_cookie(response, token, settings)
    return new_session


@auth_router.post("/logout")
def logout(response: Response) -> dict[str, str]:
    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/")
    return {"status": "logged_out"}


@auth_router.post("/renew", response_model=SessionPayload)
def renew_session(
    response: Response,
    session: SessionPayload = Depends(require_session),
    settings: Settings = Depends(get_settings),
    session_manager: SessionManager = Depends(get_session_manager),
) -> SessionPayload:
    token, new_session = session_manager.create_session(
        login_name=session.login_name,
        doc_code=session.doc_code,
        dept_code=session.dept_code,
        roles=session.roles,
        patient_no=session.patient_no,
    )
    _set_session_cookie(response, token, settings)
    return new_session
