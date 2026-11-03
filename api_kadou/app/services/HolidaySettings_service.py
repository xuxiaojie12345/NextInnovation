from typing import List, Tuple

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.sql.HolidaySettings_sql import (
    SQL_DELETE_HOLIDAY_MASTER,
    SQL_INSERT_HOLIDAY_MASTER,
    SQL_SELECT_HOLIDAY_BY_DATE,
    SQL_SELECT_HOLIDAY_BY_ID,
    SQL_SELECT_HOLIDAY_COUNT_BY_DATE,
    SQL_SELECT_HOLIDAY_COUNT_BY_DATE_EXCLUDING_ID,
    SQL_SELECT_HOLIDAYS_BY_YEAR,
    SQL_UPDATE_HOLIDAY_MASTER,
)

# holiday_kind は varchar(2) のため、区分はコードで保持する
HOLIDAY_KIND_TO_CODE = {
    "祝日": "01",
    "会社休日": "02",
    "振替休日": "03",
}
HOLIDAY_CODE_TO_KIND = {code: kind for kind, code in HOLIDAY_KIND_TO_CODE.items()}

HOLIDAY_NAME_MAX_LENGTH = 30
REGISTER_USER = "admin"  # register_user / update_user は varchar(5)


def _to_db_date(date: str) -> str:
    """YYYY-MM-DD を DB 保存形式（YYYYMMDD）へ変換する"""
    value = date.replace("-", "")
    if len(value) != 8 or not value.isdigit():
        raise HTTPException(
            status_code=400, detail="日付の形式が不正です（YYYY-MM-DD）。"
        )
    return value


def _to_display_date(date: str) -> str:
    """DB 保存形式（YYYYMMDD）を YYYY-MM-DD へ変換する"""
    if len(date) == 8 and date.isdigit():
        return f"{date[:4]}-{date[4:6]}-{date[6:]}"
    return date


def _to_output(row) -> dict:
    """DB の行をフロント用の休日オブジェクトへ変換する"""
    return {
        "holidayId": str(row.holiday_id),
        "date": _to_display_date(row.holiday_date),
        "name": row.holiday_name,
        "kind": HOLIDAY_CODE_TO_KIND.get(row.holiday_kind, row.holiday_kind),
    }


def get_holidays(db: Session, year: int) -> List[dict]:
    """年度内の休日一覧を取得する"""
    rows = db.execute(
        SQL_SELECT_HOLIDAYS_BY_YEAR, {"yearId": str(year)}
    ).fetchall()
    return [_to_output(row) for row in rows]


def holiday_exists(db: Session, year: int, date: str) -> bool:
    """同一日付の休日がテーブルに存在するか判定する"""
    db_date = _to_db_date(date)
    count = db.execute(
        SQL_SELECT_HOLIDAY_COUNT_BY_DATE,
        {"yearId": str(year), "holidayDate": db_date},
    ).scalar()
    return bool(count)


def _validate_input(kind: str, name: str) -> Tuple[str, str]:
    """区分・名称を検証し、(区分コード, 前後空白除去済み名称) を返す"""
    holiday_kind = HOLIDAY_KIND_TO_CODE.get(kind)
    if holiday_kind is None:
        raise HTTPException(status_code=400, detail=f"区分が不正です：{kind}")

    holiday_name = name.strip()
    if not holiday_name:
        raise HTTPException(status_code=400, detail="休日名称を入力してください。")
    if len(holiday_name) > HOLIDAY_NAME_MAX_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"休日名称は{HOLIDAY_NAME_MAX_LENGTH}文字以内で入力してください。",
        )
    return holiday_kind, holiday_name


def add_holiday(
    db: Session, year: int, date: str, name: str, kind: str
) -> dict:
    """休日を登録する（同一日付が既にある場合は 409 を返す）"""
    holiday_kind, holiday_name = _validate_input(kind, name)

    db_date = _to_db_date(date)
    params = {"yearId": str(year), "holidayDate": db_date}

    if holiday_exists(db, year, date):
        raise HTTPException(
            status_code=409, detail=f"{date} は既に登録されています。"
        )

    try:
        db.execute(
            SQL_INSERT_HOLIDAY_MASTER,
            {
                **params,
                "holidayKind": holiday_kind,
                "holidayName": holiday_name,
                "registerUser": REGISTER_USER,
                "updateUser": REGISTER_USER,
            },
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail=f"{date} は既に登録されています。"
        )

    row = db.execute(SQL_SELECT_HOLIDAY_BY_DATE, params).first()
    if row is None:
        raise HTTPException(status_code=500, detail="休日の登録に失敗しました。")
    return _to_output(row)


def _get_holiday_or_404(db: Session, year: int, holiday_id: int):
    row = db.execute(
        SQL_SELECT_HOLIDAY_BY_ID,
        {"yearId": str(year), "holidayId": holiday_id},
    ).first()
    if row is None:
        raise HTTPException(
            status_code=404,
            detail=f"休日が存在しません：year={year}, holiday_id={holiday_id}",
        )
    return row


def update_holiday(
    db: Session, year: int, holiday_id: int, date: str, name: str, kind: str
) -> dict:
    """休日を更新する（他のレコードと日付が重複する場合は 409 を返す）"""
    holiday_kind, holiday_name = _validate_input(kind, name)

    _get_holiday_or_404(db, year, holiday_id)

    db_date = _to_db_date(date)
    duplicate_count = db.execute(
        SQL_SELECT_HOLIDAY_COUNT_BY_DATE_EXCLUDING_ID,
        {
            "yearId": str(year),
            "holidayDate": db_date,
            "holidayId": holiday_id,
        },
    ).scalar()
    if duplicate_count:
        raise HTTPException(
            status_code=409, detail=f"{date} は既に登録されています。"
        )

    try:
        db.execute(
            SQL_UPDATE_HOLIDAY_MASTER,
            {
                "yearId": str(year),
                "holidayId": holiday_id,
                "holidayKind": holiday_kind,
                "holidayDate": db_date,
                "holidayName": holiday_name,
                "updateUser": REGISTER_USER,
            },
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail=f"{date} は既に登録されています。"
        )

    row = _get_holiday_or_404(db, year, holiday_id)
    return _to_output(row)


def delete_holiday(db: Session, year: int, holiday_id: int) -> None:
    """休日を削除する（存在しない場合は 404 を返す）"""
    _get_holiday_or_404(db, year, holiday_id)

    db.execute(
        SQL_DELETE_HOLIDAY_MASTER,
        {"yearId": str(year), "holidayId": holiday_id},
    )
    db.commit()