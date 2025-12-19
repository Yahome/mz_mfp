from __future__ import annotations

from typing import Any, Dict, Iterable, Optional


def clean_value(value: Any) -> Any:
    if isinstance(value, str):
        trimmed = value.strip()
        if trimmed == "" or trimmed == "-":
            return None
        return trimmed
    return value


def first_value(row: Dict[str, Any], keys: Iterable[str]) -> Any:
    for key in keys:
        if key in row and row[key] is not None:
            return row[key]
    return None


def as_str(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    return str(value).strip()

