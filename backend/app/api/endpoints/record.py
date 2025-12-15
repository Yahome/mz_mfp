from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.schemas.record import RecordSchema
from app.services.record_service import record_service

router = APIRouter()

@router.post("/records/draft")
def save_draft(
    data: RecordSchema,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # Skip for simplicity now
):
    try:
        # Mock user
        mock_user_id = "mock_doc"
        record = record_service.save_draft(db, data, mock_user_id)
        return {"status": "success", "record_id": record.id}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/records/submit")
def submit_record(
    data: RecordSchema,
    db: Session = Depends(get_db),
):
    try:
        mock_user_id = "mock_doc"
        record = record_service.submit_record(db, data, mock_user_id)
        return {"status": "success", "record_id": record.id, "state": "submitted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
