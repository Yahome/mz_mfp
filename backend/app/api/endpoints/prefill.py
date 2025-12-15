from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from app.services.prefill_service import prefill_service
from app.services.auth_service import AuthService
from fastapi.security import OAuth2PasswordBearer

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user_from_token(token: str = Depends(oauth2_scheme)):
    payload = AuthService.decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

@router.get("/prefill", summary="Get Prefill Data")
def get_prefill(
    patient_no: str,
    # In real auth validataion: current_user: dict = Depends(get_current_user_from_token)
):
    """
    Returns aggregated prefill data for the given patient_no.
    """
    data = prefill_service.get_prefill_data(patient_no)
    if "error" in data:
         raise HTTPException(status_code=404, detail=data["error"])
         
    return data
