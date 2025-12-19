from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class LoginRequest(BaseModel):
    login_name: str
    password: str


class SessionPayload(BaseModel):
    login_name: str
    doc_code: str
    dept_code: str
    roles: List[str]
    patient_no: Optional[str] = None
    issued_at: datetime
    expires_at: datetime


class DeptOption(BaseModel):
    dept_code: str


class DeptListResponse(BaseModel):
    current_dept_code: str
    depts: List[DeptOption]


class SwitchDeptRequest(BaseModel):
    dept_code: str
