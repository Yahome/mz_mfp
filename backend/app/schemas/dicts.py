from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class DictItemOut(BaseModel):
    code: str
    name: str
    item_type: Optional[str] = None
    select_optional: Optional[str] = None


class DictSearchResponse(BaseModel):
    set_code: str
    query: str = ""
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=200)
    total: int
    items: List[DictItemOut]

