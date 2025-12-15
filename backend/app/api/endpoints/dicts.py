from fastapi import APIRouter, Query
from typing import List, Dict

router = APIRouter()

@router.get("/search", summary="Dictionary Search")
def search_dict(
    dict_code: str,
    keyword: str = "",
    page: int = 1,
    size: int = 10
):
    """
    Mock dictionary search.
    Supports 'ICD10', 'TCM_DISEASE' etc.
    """
    results = []
    
    if dict_code == "ICD10":
        # Mock data for ICD10
        base_data = [
            {"code": "A00.0", "name": "霍乱"},
            {"code": "I10.x", "name": "高血压"},
            {"code": "J00.x", "name": "急性鼻咽炎(感冒)"}
        ]
        results = [x for x in base_data if keyword in x['name'] or keyword in x['code']] if keyword else base_data
        
    elif dict_code == "TCM_DISEASE":
         base_data = [
            {"code": "BEZ010", "name": "感冒病"},
            {"code": "BNX010", "name": "头痛病"}
         ]
         results = base_data

    return {
        "items": results,
        "total": len(results),
        "page": page,
        "size": size
    }
