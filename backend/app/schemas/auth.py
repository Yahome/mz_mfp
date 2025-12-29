from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, model_validator


class LoginRequest(BaseModel):
    login_name: str
    password: str


class SessionPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")

    login_name: str
    his_id: str
    doc_code: str | None = None  # 兼容旧字段，等同 his_id
    dept_code: str
    dept_his_code: str | None = None
    display_name: str | None = None
    dept_name: str | None = None
    roles: List[str]
    patient_no: Optional[str] = None
    issued_at: datetime
    expires_at: datetime

    @model_validator(mode="before")
    @classmethod
    def _fill_compat_fields(cls, values: dict[str, object]) -> dict[str, object]:
        if "his_id" not in values and "doc_code" in values:
            values["his_id"] = values.get("doc_code")
        if "doc_code" not in values and "his_id" in values:
            values["doc_code"] = values.get("his_id")
        return values


class DeptOption(BaseModel):
    dept_code: str
    dept_name: Optional[str] = None


class DeptListResponse(BaseModel):
    current_dept_code: str
    depts: List[DeptOption]


class SwitchDeptRequest(BaseModel):
    dept_code: str
