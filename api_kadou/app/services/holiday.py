from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.errors import BusinessException
from app.schemas.holiday import HolidayImportRequest, HolidayRequest, HolidaysResponse
from app.sql import load_sql


# 休日情報取得
def findby_holidays(db: Session, year_id: str) -> list[HolidaysResponse]:
    sql = load_sql("holidays.sql", "findby_holidays")
    result = db.execute(text(sql), {"year_id": year_id}).fetchall()
    return [
        HolidaysResponse(
            id=row.holiday_id,
            year=row.year_id,
            data=row.holiday_date,
            name=row.holiday_name,
            kind=row.holiday_kind,
        )
        for row in result
    ]


# 休日情報追加
def add_holiday(
    db: Session, addHolidayRequest: HolidayRequest, x_user_id: str | None, year: str
) -> list[HolidaysResponse]:
    sql = load_sql("holidays.sql", "add_holiday")
    result = db.execute(
        text(sql),
        {
            "year_id": year,
            "holiday_date": addHolidayRequest.data,
            "holiday_name": addHolidayRequest.name,
            "holiday_kind": addHolidayRequest.kind,
            "user_id": x_user_id,
        },
    )
    if result.rowcount <= 0:
        raise BusinessException(status_code=401, message_id="E_KADOU_015")
    db.commit()
    return findby_holidays(db, year)


# 休日情報更新
def update_holiday(
    db: Session,
    updateHolidayRequest: HolidayRequest,
    x_user_id: str | None,
    year: str,
    id: int,
) -> list[HolidaysResponse]:
    sql = load_sql("holidays.sql", "update_holiday")
    result = db.execute(
        text(sql),
        {
            "year_id": year,
            "holiday_id": id,
            "holiday_date": updateHolidayRequest.data,
            "holiday_name": updateHolidayRequest.name,
            "holiday_kind": updateHolidayRequest.kind,
            "user_id": x_user_id,
        },
    )
    if result.rowcount <= 0:
        raise BusinessException(status_code=401, message_id="E_KADOU_016")
    db.commit()
    return findby_holidays(db, year)


# 休日情報削除
def delete_holiday(db: Session, id: int, year: str) -> list[HolidaysResponse]:
    sql = load_sql("holidays.sql", "delete_holiday")
    result = db.execute(text(sql), {"holiday_id": id, "year_id": year})
    if result.rowcount <= 0:
        raise BusinessException(status_code=401, message_id="E_KADOU_025")
    db.commit()
    return findby_holidays(db, year)


# 休日情報一括追加
def import_holiday(
    db: Session,
    holidayImportRequest: HolidayImportRequest,
    x_user_id: str | None,
    year: str,
) -> list[HolidaysResponse]:
    findby_sql = load_sql("holidays.sql", "findby_holiday_date_all")
    findby_result = db.execute(text(findby_sql)).fetchall()
    holidayDate: list[str] = [row.holiday_date for row in findby_result]
    addDatalist = list(filter(lambda d: d.strip() not in holidayDate, holidayImportRequest.data))
    import_sql = load_sql("holidays.sql", "import_holiday")
    for addData in addDatalist:
        import_result = db.execute(
            text(import_sql),
            {"year_id": addData[:4], "holiday_date": addData, "user_id": x_user_id},
        )
        if import_result.rowcount <= 0:
            raise BusinessException(status_code=401, message_id="E_KADOU_026")
    db.commit()
    return findby_holidays(db, year)
