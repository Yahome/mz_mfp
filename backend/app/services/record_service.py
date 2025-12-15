from sqlalchemy.orm import Session
from app.models.record import Record
from app.models.base_info import BaseInfo
from app.models.diagnosis import Diagnosis
from app.models.fee import FeeSummary, MedicationSummary
from app.models.operation import TcmOperation, Surgery # Assuming Surgery for now
from app.schemas.record import RecordSchema
from datetime import datetime

class RecordService:
    
    def save_draft(self, db: Session, data: RecordSchema, user_id: str):
        # 1. Upsert Record (Metadata)
        record = self._get_or_create_record(db, data)
        record.status = 'draft'
        record.updated_at = datetime.now()
        
        # 2. Update Relations
        self._update_base_info(db, record, data.base_info)
        self._update_diagnoses(db, record, data.diagnoses_tcm, data.diagnoses_wm)
        # self._update_operations(db, record, data.operations) 
        self._update_fee(db, record, data.fee_summary)
        self._update_medication(db, record, data.medication_summary)
        
        db.commit()
        db.refresh(record)
        return record

    def submit_record(self, db: Session, data: RecordSchema, user_id: str):
        # 1. Validate (Strict)
        # TODO: Add logic to check missing mandatory fields
        # if not data.base_info.XM: raise ValueError("Name is required")
        
        # 2. Save as if draft but change status
        record = self.save_draft(db, data, user_id)
        record.status = 'submitted'
        record.submitted_at = datetime.now()
        db.commit()
        return record

    def _get_or_create_record(self, db: Session, data: RecordSchema):
        # Logic to find by patient_no + visit_time (or just patient_no for this simplified scope)
        # For now assume one record per patient_no for simplicity
        record = db.query(Record).filter(Record.patient_no == data.patient_no).first()
        if not record:
            record = Record(
                patient_no=data.patient_no,
                org_id=1, # Default mock org
                # visit_time should come from data or now
                visit_time=datetime.now(), 
                dept_code=data.dept_code or "DEFAULT",
                doc_code="mock_doc"
            )
            db.add(record)
            db.flush() # Get ID
        return record

    def _update_base_info(self, db: Session, record: Record, info_data):
        if not info_data: return
        
        bi = db.query(BaseInfo).filter_by(record_id=record.id).first()
        if not bi:
            bi = BaseInfo(record_id=record.id)
            db.add(bi)
        
        # Map fields (simple approach, use dict unpacking in real app)
        if info_data.XM: bi.xm = info_data.XM
        if info_data.XB: bi.xb = info_data.XB
        # ... map other fields
    
    def _update_diagnoses(self, db: Session, record: Record, tcm_list, wm_list):
        # Delete old
        db.query(Diagnosis).filter_by(record_id=record.id).delete()
        
        # Insert TCM
        for idx, d in enumerate(tcm_list):
            db.add(Diagnosis(
                record_id=record.id,
                diag_type='1', # TCM
                disease_code=d.disease_code,
                disease_name=d.disease_name,
                syndrome_code=d.syndrome_code,
                seq_no=idx + 1
            ))
            
        # Insert WM
        for idx, d in enumerate(wm_list):
            db.add(Diagnosis(
                record_id=record.id,
                diag_type='2', # WM
                disease_code=d.disease_code,
                disease_name=d.disease_name,
                seq_no=idx + 1
            ))

    def _update_fee(self, db: Session, record: Record, fee_data):
        if not fee_data: return
        fs = db.query(FeeSummary).filter_by(record_id=record.id).first()
        if not fs:
            fs = FeeSummary(record_id=record.id)
            db.add(fs)
        
        if fee_data.zfy is not None: fs.zfy = fee_data.zfy
        if fee_data.zfje is not None: fs.zfje = fee_data.zfje

    def _update_medication(self, db: Session, record: Record, med_data):
        if not med_data: return
        ms = db.query(MedicationSummary).filter_by(record_id=record.id).first()
        if not ms:
            ms = MedicationSummary(record_id=record.id)
            db.add(ms)
            
        if med_data.xysy: ms.xysy = med_data.xysy
        if med_data.zcysy: ms.zcysy = med_data.zcysy
        # ...

record_service = RecordService()
