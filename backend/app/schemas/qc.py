from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.records import RecordMeta
from app.schemas.validation import FieldError


class FieldAuditOut(BaseModel):
    id: int
    field_key: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    change_source: str
    operator_code: str
    created_at: datetime


class RecordQcResponse(BaseModel):
    record: RecordMeta
    errors: List[FieldError] = Field(default_factory=list)
    audits: List[FieldAuditOut] = Field(default_factory=list)

