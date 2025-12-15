from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import RedirectResponse
from typing import Optional
from app.services.auth_service import auth_service
from app.core.config import settings

router = APIRouter()

@router.get("/his-jump", summary="HIS Jump Entry Point")
def his_jump(
    patient_no: str,
    dept_code: str = Query(..., min_length=1),
    doc_code: str = Query(..., min_length=1),
    timestamp: str = Query(...),
    sign: str = Query(...)
):
    """
    Simulates HIS button jump.
    Verifies signature and issues a session token via cookie/redirect.
    """
    if not auth_service.verify_his_signature(patient_no, dept_code, doc_code, timestamp, sign):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid signature or expired timestamp"
        )
    
    # Create session token
    access_token = auth_service.create_access_token(
        data={
            "sub": doc_code,
            "dept_code": dept_code,
            "role": "doctor" # Default role
        }
    )
    
    # In a real app, we'd set a cookie and redirect. 
    # For this API-first phase, we just return the token or redirect with token in fragment
    # Redirecting to /app?token=... (frontend will handle this)
    target_url = f"/app?token={access_token}&patient_no={patient_no}"
    return RedirectResponse(url=target_url)

@router.post("/login", summary="Mock Login")
def login(username: str, password: str):
    """
    Mock login for testing without HIS jump.
    """
    # Accept any password "123456"
    if password != "123456":
         raise HTTPException(status_code=400, detail="Incorrect username or password")
         
    access_token = auth_service.create_access_token(
        data={"sub": username, "dept_code": "DEFAULT_DEPT", "role": "admin"}
    )
    return {"access_token": access_token, "token_type": "bearer"}
