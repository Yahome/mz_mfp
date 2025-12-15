from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.services.export_service import export_service

router = APIRouter()

@router.get("/records/{record_id}/export")
def export_record(
    record_id: int,
    db: Session = Depends(get_db)
):
    try:
        file_stream = export_service.generate_excel(db, record_id)
        
        headers = {
            'Content-Disposition': f'attachment; filename="record_{record_id}.xlsx"'
        }
        
        return StreamingResponse(
            file_stream, 
            headers=headers, 
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Export Error: {e}")
        raise HTTPException(status_code=500, detail="Export failed")
