from __future__ import annotations

from typing import Optional

from fastapi import status
from sqlalchemy import delete, func, or_, select
from sqlalchemy.dialects.mysql import insert as mysql_insert
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.dict import DictItem, DictSet
from app.models.dict_user_prefs import DictUserFavorite, DictUserRecent
from app.schemas.dicts import DictItemOut, DictSearchResponse


class DictService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _ensure_set_exists(self, set_code: str) -> None:
        exists = self.db.execute(select(DictSet.set_code).where(DictSet.set_code == set_code)).first()
        if not exists:
            raise AppError(code="not_found", message="字典集不存在", http_status=status.HTTP_404_NOT_FOUND)

    def _ensure_active_item_exists(self, *, set_code: str, code: str) -> None:
        exists = (
            self.db.execute(
                select(DictItem.id).where(
                    DictItem.set_code == set_code,
                    DictItem.code == code,
                    DictItem.status == 1,
                )
            )
            .scalars()
            .first()
        )
        if not exists:
            raise AppError(code="not_found", message="字典项不存在或已停用", http_status=status.HTTP_404_NOT_FOUND)

    def search(
        self, *, set_code: str, query: str = "", page: int = 1, page_size: int = 20
    ) -> DictSearchResponse:
        set_code = set_code.strip()
        if not set_code:
            raise AppError(code="validation_failed", message="set_code 不能为空", http_status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        self._ensure_set_exists(set_code)

        query = (query or "").strip()
        conditions = [DictItem.set_code == set_code, DictItem.status == 1]
        if query:
            like = f"%{query}%"
            conditions.append(
                or_(
                    DictItem.code.like(like),
                    DictItem.name.like(like),
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
                DictItemOut(
                    code=item.code,
                    name=item.name,
                    item_type=item.item_type,
                    select_optional=item.select_optional,
                )
                for item in items
            ],
        )

    def list_recent(self, *, user_code: str, set_code: str, limit: int = 50) -> list[DictItemOut]:
        user_code = (user_code or "").strip()
        set_code = (set_code or "").strip()
        if not user_code:
            raise AppError(code="validation_failed", message="user_code 不能为空", http_status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        if not set_code:
            raise AppError(code="validation_failed", message="set_code 不能为空", http_status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        self._ensure_set_exists(set_code)

        stmt = (
            select(DictItem)
            .join(
                DictUserRecent,
                (DictUserRecent.set_code == DictItem.set_code) & (DictUserRecent.code == DictItem.code),
            )
            .where(
                DictUserRecent.user_code == user_code,
                DictUserRecent.set_code == set_code,
                DictItem.status == 1,
            )
            .order_by(DictUserRecent.updated_at.desc(), DictItem.sort_no.asc(), DictItem.code.asc())
            .limit(limit)
        )
        items = self.db.execute(stmt).scalars().all()
        return [
            DictItemOut(code=item.code, name=item.name, item_type=item.item_type, select_optional=item.select_optional)
            for item in items
        ]

    def mark_recent(self, *, user_code: str, set_code: str, code: str) -> None:
        user_code = (user_code or "").strip()
        set_code = (set_code or "").strip()
        code = (code or "").strip()
        if not user_code:
            raise AppError(code="validation_failed", message="user_code 不能为空", http_status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        if not set_code:
            raise AppError(code="validation_failed", message="set_code 不能为空", http_status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        if not code:
            raise AppError(code="validation_failed", message="code 不能为空", http_status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        self._ensure_set_exists(set_code)
        self._ensure_active_item_exists(set_code=set_code, code=code)

        stmt = mysql_insert(DictUserRecent).values(user_code=user_code, set_code=set_code, code=code)
        stmt = stmt.on_duplicate_key_update(updated_at=func.now())
        self.db.execute(stmt)
        self.db.commit()

    def list_favorites(self, *, user_code: str, set_code: str, limit: int = 200) -> list[DictItemOut]:
        user_code = (user_code or "").strip()
        set_code = (set_code or "").strip()
        if not user_code:
            raise AppError(code="validation_failed", message="user_code 不能为空", http_status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        if not set_code:
            raise AppError(code="validation_failed", message="set_code 不能为空", http_status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        self._ensure_set_exists(set_code)

        stmt = (
            select(DictItem)
            .join(
                DictUserFavorite,
                (DictUserFavorite.set_code == DictItem.set_code) & (DictUserFavorite.code == DictItem.code),
            )
            .where(
                DictUserFavorite.user_code == user_code,
                DictUserFavorite.set_code == set_code,
                DictItem.status == 1,
            )
            .order_by(DictUserFavorite.updated_at.desc(), DictItem.sort_no.asc(), DictItem.code.asc())
            .limit(limit)
        )
        items = self.db.execute(stmt).scalars().all()
        return [
            DictItemOut(code=item.code, name=item.name, item_type=item.item_type, select_optional=item.select_optional)
            for item in items
        ]

    def set_favorite(self, *, user_code: str, set_code: str, code: str, favorited: bool) -> None:
        user_code = (user_code or "").strip()
        set_code = (set_code or "").strip()
        code = (code or "").strip()
        if not user_code:
            raise AppError(code="validation_failed", message="user_code 不能为空", http_status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        if not set_code:
            raise AppError(code="validation_failed", message="set_code 不能为空", http_status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        if not code:
            raise AppError(code="validation_failed", message="code 不能为空", http_status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        self._ensure_set_exists(set_code)
        self._ensure_active_item_exists(set_code=set_code, code=code)

        if favorited:
            stmt = mysql_insert(DictUserFavorite).values(user_code=user_code, set_code=set_code, code=code)
            stmt = stmt.on_duplicate_key_update(updated_at=func.now())
            self.db.execute(stmt)
        else:
            self.db.execute(
                delete(DictUserFavorite).where(
                    DictUserFavorite.user_code == user_code,
                    DictUserFavorite.set_code == set_code,
                    DictUserFavorite.code == code,
                )
            )
        self.db.commit()

