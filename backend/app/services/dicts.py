from __future__ import annotations

from typing import Optional

from fastapi import status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.dict import DictItem, DictSet
from app.schemas.dicts import DictItemOut, DictSearchResponse


class DictService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def search(
        self, *, set_code: str, query: str = "", page: int = 1, page_size: int = 20
    ) -> DictSearchResponse:
        set_code = set_code.strip()
        if not set_code:
            raise AppError(code="validation_failed", message="set_code 不能为空", http_status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        exists = self.db.execute(select(DictSet.set_code).where(DictSet.set_code == set_code)).first()
        if not exists:
            raise AppError(code="not_found", message="字典集不存在", http_status=status.HTTP_404_NOT_FOUND)

        query = (query or "").strip()
        conditions = [DictItem.set_code == set_code, DictItem.status == 1]
        if query:
            like = f"%{query}%"
            conditions.append(
                or_(
                    DictItem.code.like(like),
                    DictItem.name.like(like),
                    DictItem.merged_code.like(like),
                    DictItem.pinyin.like(like),
                )
            )

        total = self.db.execute(select(func.count()).select_from(DictItem).where(*conditions)).scalar_one()
        stmt = (
            select(DictItem)
            .where(*conditions)
            .order_by(DictItem.sort_no.asc(), DictItem.code.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = self.db.execute(stmt).scalars().all()
        return DictSearchResponse(
            set_code=set_code,
            query=query,
            page=page,
            page_size=page_size,
            total=int(total),
            items=[
                DictItemOut(code=item.code, name=item.name, extra_code=item.extra_code, merged_code=item.merged_code)
                for item in items
            ],
        )

