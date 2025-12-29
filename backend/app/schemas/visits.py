from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class VisitListItem(BaseModel):
    patient_no: str
    visit_time: datetime
    xm: Optional[str] = None
    dept_code: Optional[str] = None
    dept_his_code: Optional[str] = None
    his_id: Optional[str] = None
    doc_code: Optional[str] = None  # 兼容旧字段
    dept_name: Optional[str] = None
    doc_name: Optional[str] = None
    status: str
    record_id: Optional[int] = None
    version: Optional[int] = None


class VisitListResponse(BaseModel):
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=200)
    total: int
    items: List[VisitListItem]


class SimpleCodeName(BaseModel):
    code: str
    name: Optional[str] = None


class DeptSearchResponse(BaseModel):
    items: List[SimpleCodeName]


class DoctorSearchResponse(BaseModel):
    items: List[SimpleCodeName]
