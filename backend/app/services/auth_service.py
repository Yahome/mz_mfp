from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import jwt
from app.core.config import settings

class AuthService:
    """
    Handles authentication logic, including HIS jump signature verification (mocked)
    and JWT token generation.
    """
    
    @staticmethod
    def verify_his_signature(
        patient_no: str,
        dept_code: str,
        doc_code: str,
        timestamp: str,
        sign: str
    ) -> bool:
        """
        Mock signature verification. 
        In production, this would calculate HMAC-SHA256 and compare.
        """
        # TODO: Implement actual signature check. For mock, we accept any sign != 'invalid'
        if sign == 'invalid':
            return False
            
        # Check timestamp (simply check if it's parsable and not too old for production)
        try:
            ts = float(timestamp)
            # 5 minute window example (skipped for mock ease)
        except ValueError:
            return False
            
        return True

    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
        return encoded_jwt

    @staticmethod
    def decode_token(token: str) -> Optional[Dict[str, Any]]:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            return payload
        except jwt.JWTError:
            return None

auth_service = AuthService()
