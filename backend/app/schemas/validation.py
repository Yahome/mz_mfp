from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class FieldError(BaseModel):
    field: str
    message: str
    rule: str = "invalid"
    section: Optional[str] = None
    seq_no: Optional[int] = None

