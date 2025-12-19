from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class DiagnosisItem(BaseModel):
    diag_type: str
    seq_no: int = Field(ge=1)
    diag_name: str
    diag_code: Optional[str] = None


class TcmOperationItem(BaseModel):
    seq_no: int = Field(ge=1)
    op_name: str
    op_code: str
    op_times: int = Field(ge=0)
    op_days: Optional[int] = Field(default=None, ge=0)


class SurgeryItem(BaseModel):
    seq_no: int = Field(ge=1)
    op_name: str
    op_code: str
    op_time: datetime
    operator_name: str
    anesthesia_method: str
    anesthesia_doctor: str
    surgery_level: int = Field(ge=0)


class HerbDetailItem(BaseModel):
    seq_no: int = Field(ge=1)
    herb_type: str
    route_code: str
    route_name: str
    dose_count: int = Field(ge=0)


class BaseInfoPayload(BaseModel):
    username: str
    jzkh: str
    xm: str
    xb: str
    csrq: date
    hy: str
    gj: str
    mz: str
    zjlb: str
    zjhm: str
    xzz: str
    lxdh: str
    ywgms: str
    gmyw: Optional[str] = None
    qtgms: Optional[str] = None
    qtgmy: Optional[str] = None
    ghsj: Optional[datetime] = None
    bdsj: Optional[datetime] = None
    jzsj: datetime
    jzks: Optional[str] = None
    jzksdm: str
    jzys: str
    jzyszc: str
    jzlx: str
    fz: str
    sy: str
    mzmtbhz: str
    jzhzfj: Optional[str] = None
    jzhzqx: Optional[str] = None
    zyzkjsj: Optional[datetime] = None
    hzzs: Optional[str] = None


class RecordPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    base_info: BaseInfoPayload
    diagnoses: List[DiagnosisItem] = Field(default_factory=list)
    tcm_operations: List[TcmOperationItem] = Field(default_factory=list)
    surgeries: List[SurgeryItem] = Field(default_factory=list)
    herb_details: List[HerbDetailItem] = Field(default_factory=list)


class RecordSaveRequest(BaseModel):
    version: Optional[int] = None
    payload: RecordPayload


class MedicationSummaryReadOnly(BaseModel):
    xysy: str
    zcysy: str
    zyzjsy: str
    ctypsy: str
    pfklsy: str


class FeeSummaryReadOnly(BaseModel):
    zfy: Decimal
    zfje: Decimal
    ylfwf: Optional[Decimal] = None
    zlczf: Optional[Decimal] = None
    hlf: Optional[Decimal] = None
    qtfy: Optional[Decimal] = None
    blzdf: Optional[Decimal] = None
    zdf: Optional[Decimal] = None
    yxxzdf: Optional[Decimal] = None
    lczdxmf: Optional[Decimal] = None
    fsszlxmf: Optional[Decimal] = None
    zlf: Optional[Decimal] = None
    sszlf: Optional[Decimal] = None
    mzf: Optional[Decimal] = None
    ssf: Optional[Decimal] = None
    kff: Optional[Decimal] = None
    zyl_zyzd: Optional[Decimal] = None
    zyzl: Optional[Decimal] = None
    zywz: Optional[Decimal] = None
    zygs: Optional[Decimal] = None
    zcyjf: Optional[Decimal] = None
    zytnzl: Optional[Decimal] = None
    zygczl: Optional[Decimal] = None
    zytszl: Optional[Decimal] = None
    zyqt: Optional[Decimal] = None
    zytstpjg: Optional[Decimal] = None
    bzss: Optional[Decimal] = None
    xyf: Optional[Decimal] = None
    kjywf: Optional[Decimal] = None
    zcyf: Optional[Decimal] = None
    zyzjf: Optional[Decimal] = None
    zcyf1: Optional[Decimal] = None
    pfklf: Optional[Decimal] = None
    xf: Optional[Decimal] = None
    bdbblzpf: Optional[Decimal] = None
    qdbblzpf: Optional[Decimal] = None
    nxyzlzpf: Optional[Decimal] = None
    xbyzlzpf: Optional[Decimal] = None
    jcyyclf: Optional[Decimal] = None
    yyclf: Optional[Decimal] = None
    ssycxclf: Optional[Decimal] = None
    qtf: Optional[Decimal] = None


class RecordMeta(BaseModel):
    record_id: int
    patient_no: str
    status: str
    version: int
    visit_time: datetime
    submitted_at: Optional[datetime] = None


class RecordResponse(BaseModel):
    record: RecordMeta
    payload: RecordPayload
    medication_summary: Optional[MedicationSummaryReadOnly] = None
    fee_summary: Optional[FeeSummaryReadOnly] = None
    prefill_snapshot: Optional[dict[str, Any]] = None

