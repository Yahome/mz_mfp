from datetime import date, datetime
from typing import Dict, Any, Optional

class MockExternalAdapter:
    """
    Simulates the external HIS/Payment views.
    """
    
    @staticmethod
    def get_base_info(patient_no: str) -> Optional[Dict[str, Any]]:
        # Simulate 'base-info.sql' result
        if patient_no == "not_found":
            return None
            
        return {
            "JGMC": "益阳市第一中医医院",
            "ZZJGDM": "736798027",
            "USERNAME": "test_user",
            "JZKH": patient_no,
            "XM": "张三" if patient_no == "123456" else f"患者{patient_no}",
            "XB": "1", # RC001 1=Male
            "HY": "1", # RC002
            "CSRQ": date(1980, 5, 20),
            "GJ": "156", # China
            "MZ": "01", # Han
            "ZJLB": "1", # ID Card
            "ZJHM": "110101198005201234",
            "XZZ": "益阳市某街道123号",
            "LXDH": "13800000000",
            "YWGMS": "2", # No
            "GMYW": None,
            "QTGMS": "2",
            "QTGMY": None,
            "GHSJ": datetime.now().replace(hour=8, minute=0, second=0),
            "BDSJ": datetime.now().replace(hour=8, minute=30, second=0),
            "JZSJ": datetime.now().replace(hour=9, minute=0, second=0),
            "JZKS": "内科门诊",
            "JZKSDM": "NK001",
            "JZYS": "李医生",
            "JZYSZC": "231", # Chief Physician
            "JZLX": "1", # Ordinary
            "FZ": "2", # No
            "SY": "2", # No
            "MZMTBHZ": "2", # No
            "JZHZFJ": None,
            "JZHZQX": None,
            "ZYZKJSJ": None,
            "HZZS": "头痛三天，加重一天。"
        }
    
    @staticmethod
    def get_fee_info(patient_no: str) -> Optional[Dict[str, Any]]:
        # Simulate 'patient_fee.sql' result
        if patient_no == "not_found":
            return None
            
        return {
            "总费用": 150.50,
            "医保基金支付": 100.00,
            "zffy": 50.50,
            
            # Medication Flags (RC016: 1=Yes, 2=No)
            "XYSY": "1", 
            "ZCYSY": "2",
            "ZYZJSY": "2",
            "CTYPSY": "2",
            "PFKLSY": "2",
            
            # Fee details
            "一般医疗服务费": 10.00,
            "中医辨证论治费": 20.00,
            "西药费": 80.00,
            "检查用一次性医用材料费": 5.00,
            "其他费": 35.50
            # ... others can be 0 or omitted if handled gracefully
        }

mock_adapter = MockExternalAdapter()
