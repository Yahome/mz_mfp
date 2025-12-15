from typing import List, Optional
from pydantic import BaseModel
from datetime import date, datetime

class BaseInfoSchema(BaseModel):
    XM: Optional[str] = None
    XB: Optional[str] = None
    CSRQ: Optional[date | str] = None # Allow string for loose validation
    # Add other fields as loosely as possible for Draft
    
    class Config:
        from_attributes = True

class DiagnosisSchema(BaseModel):
    diag_type: str # 1=TCM, 2=WM
    disease_code: Optional[str] = None
    disease_name: Optional[str] = None
    syndrome_code: Optional[str] = None
    syndrome_name: Optional[str] = None
    seq_no: int = 0

class OperationSchema(BaseModel):
    op_name: Optional[str] = None
    op_code: Optional[str] = None
    op_date: Optional[date | str] = None # frontend might send string
    level: Optional[str] = None
    seq_no: int = 0

class FeeSummarySchema(BaseModel):
    zfy: Optional[float] = None
    zfje: Optional[float] = None
    # ... others

class MedicationSummarySchema(BaseModel):
    xysy: Optional[str] = None
    zcysy: Optional[str] = None
    zyzjsy: Optional[str] = None
    ctypsy: Optional[str] = None
    pfklsy: Optional[str] = None

class RecordSchema(BaseModel):
    base_info: Optional[BaseInfoSchema] = None
    fee_summary: Optional[FeeSummarySchema] = None
    medication_summary: Optional[MedicationSummarySchema] = None
    diagnoses_tcm: List[DiagnosisSchema] = []
    diagnoses_wm: List[DiagnosisSchema] = []
    operations: List[OperationSchema] = []
    
    # Metadata passed from frontend or auth
    patient_no: str
    visit_time: Optional[datetime | str] = None 
    dept_code: Optional[str] = None
