from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.HolidaySettings_service import (
    add_holiday,
    delete_holiday as _delete_holiday,
    get_holidays,
    import_holidays as _import_holidays,
    update_holiday as _update_holiday,
)

router = APIRouter(prefix="/api/holidays", tags=["休日設置"])


class HolidayInput(BaseModel):
    """休日登録のリクエストボディ（名称・区分は任意）"""

    date: str = Field(..., min_length=10, max_length=10, description="YYYY-MM-DD")
    # 名称・区分は必須としない（未入力は空文字で受け取る）
    name: str = Field(default="", max_length=30, description="休日名称（任意）")
    kind: str = Field(default="", max_length=10, description="休日区分（任意）")


@router.get("")
def list_holidays(year: int, db: Session = Depends(get_db)):
    """年度内の休日一覧を取得する"""
    return {
        "code": 200,
        "msg": "success",
        "data": get_holidays(db, year),
    }


@router.post("")
def create_holiday(
    year: int,
    holiday: HolidayInput,
    db: Session = Depends(get_db),
):
    """休日を登録する。

    同一日付のレコードが JN_HOLIDAY_MASTER に存在する場合は 409 を返す。
    """
    return {
        "code": 200,
        "msg": "登録完了",
        "data": add_holiday(db, year, holiday.date, holiday.name, holiday.kind),
    }


@router.post("/import")
def import_holiday(
    year: int,
    holidays: List[HolidayInput],
    db: Session = Depends(get_db),
):
    """休日を一括登録する（同一日付は上書き、新規日付は追加）。

    JN_HOLIDAY_MASTER に対して 1 トランザクションで登録する。
    """
    result = _import_holidays(
        db, year, [holiday.model_dump() for holiday in holidays]
    )
    return {
        "code": 200,
        "msg": (
            f"一括登録完了（追加 {result['added']} 件 / "
            f"上書き {result['updated']} 件）"
        ),
        "data": result,
    }


@router.put("/{holiday_id}")
def update_holiday(
    year: int,
    holiday_id: int,
    holiday: HolidayInput,
    db: Session = Depends(get_db),
):
    """休日を更新する。

    他のレコードと日付が重複する場合は 409、対象が存在しない場合は 404 を返す。
    """
    return {
        "code": 200,
        "msg": "更新完了",
        "data": _update_holiday(
            db, year, holiday_id, holiday.date, holiday.name, holiday.kind
        ),
    }


@router.delete("/{holiday_id}")
def delete_holiday(
    year: int,
    holiday_id: int,
    db: Session = Depends(get_db),
):
    """休日を削除する（存在しない場合は 404 を返す）"""
    _delete_holiday(db, year, holiday_id)
    return {"code": 200, "msg": "削除完了"}