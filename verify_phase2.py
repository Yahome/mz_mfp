import sys
import os
import requests
from fastapi.testclient import TestClient

# Ensure backend path is in sys.path
sys.path.append('backend')

from app.main import app

client = TestClient(app)

def verify_api():
    print("Verifying Phase 2 API...")
    
    # 1. Test HIS Jump
    print("\n1. Testing /his-jump...")
    # Mock params
    params = {
        "patient_no": "123456",
        "dept_code": "NK001",
        "doc_code": "doc001",
        "timestamp": "1700000000",
        "sign": "valid_sign" 
    }
    
    # Redirects are followed by default in some clients, but TestClient handles allowed_hosts etc.
    # We want to check the location header or result status.
    response = client.get("/api/auth/his-jump", params=params, follow_redirects=False)
    
    if response.status_code == 307 or response.status_code == 302:
        print("- HIS Jump Redirect: OK")
        location = response.headers["location"]
        print(f"- Location: {location}")
        
        # Extract token from location
        # Expected: /app?token=...&patient_no=...
        if "token=" in location:
            token = location.split("token=")[1].split("&")[0]
            print("- Token extracted: OK")
            return token
        else:
            print("- Token extraction: FAILED")
            return None
    else:
        print(f"- HIS Jump Failed: {response.status_code} {response.text}")
        return None

def verify_prefill(token):
    print("\n2. Testing /mz_mfp/prefill...")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/mz_mfp/prefill?patient_no=123456", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print("- Prefill Response: OK")
        if data.get("base_info", {}).get("XM") == "张三":
            print("- Data Validation (XM=张三): OK")
        else:
            print(f"- Data Validation Failed: {data}")
            
        if data.get("fee_summary", {}).get("XYSY") == "1":
             print("- Fee Logic Validation (XYSY=1): OK")
        else:
             print(f"- Fee Logic Validation Failed: {data}")
    else:
        print(f"- Prefill Request Failed: {response.status_code} {response.text}")

def verify_dicts():
    print("\n3. Testing /dicts/search...")
    response = client.get("/api/dicts/search?dict_code=ICD10&keyword=高血压")
    if response.status_code == 200:
        data = response.json()
        if len(data["items"]) > 0:
             print("- Dict Search (ICD10): OK")
        else:
             print("- Dict Search (ICD10): Empty Results")
    else:
        print(f"- Dict Search Failed: {response.status_code}")

if __name__ == "__main__":
    token = verify_api()
    if token:
        verify_prefill(token)
        verify_dicts()
