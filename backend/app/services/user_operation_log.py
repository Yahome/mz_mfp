from __future__ import annotations

import json
import logging
import os
import re
import threading
from datetime import date, datetime
from pathlib import Path
from typing import Any, Optional
from zoneinfo import ZoneInfo

from app.core.config import Settings, get_settings

logger = logging.getLogger(__name__)

_LOGIN_NAME_FORBIDDEN_CHARS = re.compile('[<>:"/\\\\|?*\x00-\x1F]')
_TRAILING_DOTS_SPACES = re.compile(r"[. ]+$")
_RESERVED_DEVICE_NAMES = {
    "CON",
    "PRN",
    "AUX",
    "NUL",
    *{f"COM{i}" for i in range(1, 10)},
    *{f"LPT{i}" for i in range(1, 10)},
}

_path_locks_guard = threading.Lock()
_path_locks: dict[Path, threading.Lock] = {}


def _get_path_lock(path: Path) -> threading.Lock:
    resolved_path = path.resolve()
    with _path_locks_guard:
        lock = _path_locks.get(resolved_path)
        if lock is None:
            lock = threading.Lock()
            _path_locks[resolved_path] = lock
        return lock


class UserOperationLogService:
    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()

    def is_enabled(self) -> bool:
        return bool(self.settings.user_operation_log_enabled)

    def error_message_max_len(self) -> int:
        try:
            value = int(self.settings.user_operation_log_error_message_max_len)
        except Exception:
            return 200
        return value if value > 0 else 200

    def root_dir(self) -> Path:
        return Path(self.settings.user_operation_log_root_dir)

    def local_date_today(self) -> date:
        timezone = ZoneInfo(self.settings.timezone)
        return datetime.now(timezone).date()

    def now_iso(self) -> str:
        timezone = ZoneInfo(self.settings.timezone)
        return datetime.now(timezone).isoformat()

    def sanitize_login_name(self, login_name: Optional[str]) -> str:
        raw_name = (login_name or "").strip()
        if not raw_name:
            return "unknown_user"

        safe_name = _LOGIN_NAME_FORBIDDEN_CHARS.sub("_", raw_name)
        safe_name = safe_name.replace("/", "_").replace("\\", "_")
        safe_name = _TRAILING_DOTS_SPACES.sub("", safe_name.strip())
        safe_name = re.sub(r"_+", "_", safe_name)
        if not safe_name or safe_name in {".", ".."}:
            return "unknown_user"

        base_name = safe_name.split(".", 1)[0].strip().upper()
        if base_name in _RESERVED_DEVICE_NAMES:
            safe_name = f"_{safe_name}"

        safe_name = _TRAILING_DOTS_SPACES.sub("", safe_name)
        return safe_name if safe_name else "unknown_user"

    def user_dir(self, login_name: str) -> Path:
        return self.root_dir() / self.sanitize_login_name(login_name)

    def daily_log_path(self, login_name: str, *, local_date: Optional[date] = None) -> Path:
        current_date = local_date or self.local_date_today()
        filename = current_date.strftime("%Y%m%d")
        return self.user_dir(login_name) / filename

    def ensure_user_daily_log(self, login_name: str, *, local_date: Optional[date] = None) -> Optional[Path]:
        if not self.is_enabled():
            return None

        try:
            root_dir = self.root_dir()
            user_dir = self.user_dir(login_name)
            daily_path = self.daily_log_path(login_name, local_date=local_date)

            root_dir.mkdir(parents=True, exist_ok=True)
            user_dir.mkdir(parents=True, exist_ok=True)
            daily_path.parent.mkdir(parents=True, exist_ok=True)
            with open(daily_path, "a", encoding="utf-8"):
                pass
            return daily_path
        except Exception:
            logger.exception("用户操作日志初始化失败 login_name=%s root_dir=%s", login_name, self.root_dir())
            return None

    def truncate_message(self, message: Optional[str]) -> str:
        text = (message or "").strip()
        max_len = self.error_message_max_len()
        return text if len(text) <= max_len else text[:max_len]

    def build_error_summary(self, message: Optional[str]) -> str:
        return f"ERR: {self.truncate_message(message)}"

    def append_jsonl(self, login_name: str, record: dict[str, Any], *, local_date: Optional[date] = None) -> None:
        if not self.is_enabled():
            return

        daily_path = self.ensure_user_daily_log(login_name, local_date=local_date)
        if daily_path is None:
            return

        line = json.dumps(record, ensure_ascii=False, separators=(",", ":")) + "\n"
        self._append_line(daily_path, line)

    def append_event(self, *, login_name: str, event: str, result: str) -> None:
        record: dict[str, Any] = {
            "ts": self.now_iso(),
            "event": event,
            "login_name": login_name,
            "result": result,
        }
        self.append_jsonl(login_name, record)

    def append_api_operation(
        self,
        *,
        login_name: str,
        method: str,
        path: str,
        status_code: int,
        duration_ms: int,
        error_code: Optional[str] = None,
        error_summary: Optional[str] = None,
    ) -> None:
        record: dict[str, Any] = {
            "ts": self.now_iso(),
            "event": "api",
            "login_name": login_name,
            "method": method,
            "path": path,
            "status_code": int(status_code),
            "duration_ms": int(duration_ms),
        }
        if error_code:
            record["error_code"] = str(error_code)
        if error_summary:
            record["error_summary"] = str(error_summary)
        self.append_jsonl(login_name, record)

    def _append_line(self, file_path: Path, line: str) -> None:
        try:
            import msvcrt
        except ImportError:
            msvcrt = None
            logger.warning("当前运行环境不支持 msvcrt，将以无文件锁方式写入 path=%s", file_path)

        file_lock = _get_path_lock(file_path)
        with file_lock:
            try:
                file_path.parent.mkdir(parents=True, exist_ok=True)
                with open(file_path, "a", encoding="utf-8", newline="\n") as handle:
                    if msvcrt is None:
                        handle.write(line)
                        handle.flush()
                        return

                    handle.seek(0)
                    msvcrt.locking(handle.fileno(), msvcrt.LK_LOCK, 1)
                    try:
                        handle.seek(0, os.SEEK_END)
                        handle.write(line)
                        handle.flush()
                    finally:
                        handle.seek(0)
                        msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
            except Exception:
                logger.exception("用户操作日志写入失败 path=%s", file_path)

