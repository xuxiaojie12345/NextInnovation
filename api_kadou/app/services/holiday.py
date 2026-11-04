from typing import List

from sqlalchemy import text
from sqlalchemy.orm import Session
from app.sql import load_sql

from app.schemas.holiday import HolidayRequest
from app.schemas.holiday import HolidaysResponse
from app.schemas.holiday import HolidayImportRequest

"""休日情報取得"""
def findby_holidays(db: Session, year_id: str) -> List[HolidaysResponse]:
    sql = load_sql("holidays.sql","findby_holidays")
    result = db.execute(text(sql), {"year_id": year_id}).fetchall()
    return [HolidaysResponse(id=row.holiday_id, year=row.year_id, data=row.holiday_date, name=row.holiday_name, kind=row.holiday_kind) for row in result]

"""休日情報追加"""
def add_holiday(db: Session, addHolidayRequest: HolidayRequest, x_user_id: str | None,year: str) -> List[HolidaysResponse]:
    sql = load_sql("holidays.sql","add_holiday")
    result = db.execute(text(sql), {"year_id": year, "holiday_date": addHolidayRequest.data, "holiday_name": addHolidayRequest.name, "holiday_kind": addHolidayRequest.kind, "user_id": x_user_id})
    if result.rowcount <= 0:
        raise Exception("休日情報の追加に失敗しました。")    
    db.commit()
    return findby_holidays(db, year)

"""休日情報更新"""
def update_holiday(db: Session, updateHolidayRequest: HolidayRequest, x_user_id: str | None,year: str,id: int) -> List[HolidaysResponse]:
    sql = load_sql("holidays.sql","update_holiday")
    result = db.execute(text(sql), {"year_id": year,"holiday_id": id, "holiday_date": updateHolidayRequest.data, "holiday_name": updateHolidayRequest.name, "holiday_kind": updateHolidayRequest.kind, "user_id": x_user_id})
    if result.rowcount <= 0:
        raise Exception("休日情報の更新に失敗しました。")    
    db.commit()
    return findby_holidays(db, year)

"""休日情報削除"""
def delete_holiday(db: Session, id: int, year: str) -> List[HolidaysResponse]:
    sql = load_sql("holidays.sql","delete_holiday")
    result = db.execute(text(sql), {"holiday_id": id, "year_id": year})
    if result.rowcount <= 0:
        raise Exception("休日情報の削除に失敗しました。")    
    db.commit()
    return findby_holidays(db, year)

"""休日情報一括追加"""
def import_holiday(db: Session, importHolidayRequests: List[HolidayImportRequest], x_user_id: str | None,year: str) -> List[HolidaysResponse]:
    for importHolidayRequest in importHolidayRequests:
        if importHolidayRequest.id is None:
            sql = load_sql("holidays.sql","add_holiday")
            result = db.execute(text(sql), {"year_id": year, "holiday_date": importHolidayRequest.data, "holiday_name": importHolidayRequest.name, "holiday_kind": importHolidayRequest.kind, "user_id": x_user_id})          
        else:
            sql = load_sql("holidays.sql","update_holiday")
            result = db.execute(text(sql), {"year_id": year,"holiday_id": importHolidayRequest.id, "holiday_date": importHolidayRequest.data, "holiday_name": importHolidayRequest.name, "holiday_kind": importHolidayRequest.kind, "user_id": x_user_id})
        if result.rowcount <= 0:
            raise Exception("休日情報一括追加に失敗しました。")    
    db.commit()
    return findby_holidays(db, year)