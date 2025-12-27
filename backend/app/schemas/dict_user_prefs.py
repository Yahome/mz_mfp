from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field

from app.schemas.dicts import DictItemOut


class DictUserItemsResponse(BaseModel):
    set_code: str
    items: List[DictItemOut]


class DictFavoriteUpdateRequest(BaseModel):
    favorited: bool = Field(..., description="true=收藏；false=取消收藏")

