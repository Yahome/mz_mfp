import sys
import os
sys.path.append('backend')

from app.db.base import SessionLocal, engine, Base
from app.models.record import Org, Record
from app.models.base_info import BaseInfo
from app.models.diagnosis import Diagnosis
from app.models.operation import TcmOperation, Surgery
from app.models.fee import FeeSummary, MedicationSummary, HerbDetail
from app.models.audit import FieldAudit, ExportLog
from app.adapters.external_mock import mock_adapter
from sqlalchemy import text

def verify_db():
    print("Verifying DB connection and models...")
    db = SessionLocal()
    try:
        # Check if table exists (by querying)
        db.execute(text("SELECT 1"))
        print("- DB Connection: OK")
        
        # Insert org
        existing = db.query(Org).filter_by(zzjgdm="736798027").first()
        if not existing:
            org = Org(jgmc="益阳市第一中医医院", zzjgdm="736798027")
            db.add(org)
            db.commit()
            print("- Insert Org: OK")
        else:
            print("- Org already exists: OK")
            
    except Exception as e:
        print(f"- DB Error: {e}")
    finally:
        db.close()

def verify_mock():
    print("\nVerifying Mock Adapter...")
    data = mock_adapter.get_base_info("123456")
    if data and data['XM'] == "张三":
        print("- Mock Base Info (123456): OK")
    else:
        print(f"- Mock Base Info Failed: {data}")

    fee = mock_adapter.get_fee_info("123456")
    if fee and fee['总费用'] > 0:
        print("- Mock Fee Info: OK")
    else:
        print(f"- Mock Fee Info Failed: {fee}")

if __name__ == "__main__":
    verify_db()
    verify_mock()
