from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class FieldValue(BaseModel):
    value: Any
    source: str = "prefill"
    readonly: bool = False


class PrefillResponse(BaseModel):
    patient_no: str
    visit_time: Optional[datetime]
    record: Optional[Dict[str, Any]] = None
    fields: Dict[str, FieldValue] = Field(default_factory=dict)
    lists: Dict[str, Any] = Field(default_factory=dict)
    hints: List[Any] = Field(default_factory=list)
