from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.holiday import HolidayImportRequest, HolidayRequest, HolidaysResponse
from app.services.holiday import add_holiday as add_holiday_Service
from app.services.holiday import delete_holiday as delete_holiday_Service
from app.services.holiday import findby_holidays as findby_holidays_Service
from app.services.holiday import import_holiday as import_holiday_Service
from app.services.holiday import update_holiday as update_holiday_Service

router = APIRouter(prefix="/api/kadouholidays")


# 休日情報取得
@router.get("/{year}", response_model=list[HolidaysResponse])
def findby_holidays(year: str, db: Session = Depends(get_db)):
    return findby_holidays_Service(db, year)


# 休日情報追加
@router.post("/{year}", response_model=list[HolidaysResponse])
def add_holiday(
    year: str,
    addHolidayRequest: HolidayRequest,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    return add_holiday_Service(db, addHolidayRequest, x_user_id, year)


# 休日情報更新
@router.put("/{year}/{id}", response_model=list[HolidaysResponse])
def update_holiday(
    year: str,
    id: int,
    updateHolidayRequest: HolidayRequest,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    return update_holiday_Service(db, updateHolidayRequest, x_user_id, year, id)


# 休日情報削除
@router.delete("/{id}/{year}", response_model=list[HolidaysResponse])
def delete_holiday(year: str, id: int, db: Session = Depends(get_db)):
    return delete_holiday_Service(db, id, year)


# 休日情報
@router.post("/export/{year}", response_model=list[HolidaysResponse])
def import_holiday(
    year: str,
    holidayImportRequest: HolidayImportRequest,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    return import_holiday_Service(db, holidayImportRequest, x_user_id, year)
