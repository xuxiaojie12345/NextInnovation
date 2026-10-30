from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.Personnel_service import (
    delete_personnel,
    get_dept_name,
    get_personnel_by_emp_no,
    get_personnel_list,
    insert_personnel,
    save_personnel_records,
    update_personnel,
)

router = APIRouter(prefix="/api/personnel", tags=["人员主表"])


class PersonnelInput(BaseModel):
    employeeNo: str
    departmentId: str
    name: str
    role: str = "要員"
    leavePlan: str = ""


def _record(year: int, person: PersonnelInput, now: datetime) -> dict:
    return {
        "year": year,
        "employeeNo": person.employeeNo,
        "departmentId": person.departmentId,
        "idouFlag": "0",
        "idoubi": "",
        "personName": person.name,
        "role": person.role,
        "leavePlan": person.leavePlan,
        "registerDatetime": now,
        "registerUser": "admin",
        "updateDatetime": now,
        "updateUser": "admin",
    }


@router.get("/list")
def list_personnel(year: int, db: Session = Depends(get_db)):
    return {
        "code": 200,
        "msg": "success",
        "data": get_personnel_list(db, year),
    }


@router.get("/info")
def get_person_info(year: int, employeeNo: str, db: Session = Depends(get_db)):
    person_info = get_personnel_by_emp_no(db, year, employeeNo)
    if not person_info:
        raise HTTPException(status_code=404, detail="対象の従業員データが存在しません")

    # SQL查询使用了别名，所以需要使用别名後の键名
    dept_info = get_dept_name(db, year, person_info["departmentId"])
    return {
        "code": 200,
        "msg": "success",
        "data": {"person": person_info, "department": dept_info},
    }


# Keep the original query-parameter endpoint available for existing callers.
@router.post("/add")
def add_person(
    year: int,
    employeeNo: str,
    departmentId: str,
    idouFlag: str,
    idoubi: str,
    personName: str,
    role: str,
    leavePlan: str,
    db: Session = Depends(get_db),
):
    now = datetime.now()
    record = {
        "year": year,
        "employeeNo": employeeNo,
        "departmentId": departmentId,
        "idouFlag": idouFlag,
        "idoubi": idoubi,
        "personName": personName,
        "role": role,
        "leavePlan": leavePlan,
        "registerDatetime": now,
        "registerUser": "admin",
        "updateDatetime": now,
        "updateUser": "admin",
    }
    try:
        insert_personnel(db, record)
        return {"code": 200, "msg": "登録完了"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"登録失敗：{str(e)}")


@router.post("/save")
def save_person(
    year: int,
    person: PersonnelInput,
    db: Session = Depends(get_db),
):
    # 检查记录是否已存在
    existing = get_personnel_by_emp_no(db, year, person.employeeNo)
    now = datetime.now()
    
    if existing:
        # 记录已存在，执行更新（角色、名前、所属等）
        update_data = {
            "year": year,
            "employeeNo": person.employeeNo,
            "departmentId": person.departmentId,
            "personName": person.name,
            "role": person.role,
            "leavePlan": person.leavePlan,
            "updateDatetime": now,
            "updateUser": "admin",
        }
        update_personnel(db, update_data)
        return {"code": 200, "msg": "更新完了"}
    else:
        # 记录不存在，执行插入
        record = _record(year, person, now)
        save_personnel_records(db, [record])
        return {"code": 200, "msg": "登録完了"}


@router.post("/import")
def import_personnel(
    year: int,
    people: List[PersonnelInput],
    db: Session = Depends(get_db),
):
    now = datetime.now()
    records = [_record(year, person, now) for person in people]
    save_personnel_records(db, records)
    return {"code": 200, "msg": "导入完成", "count": len(people)}


@router.delete("/delete")
def remove_person(year: int, employeeNo: str, db: Session = Depends(get_db)):
    deleted = delete_personnel(db, year, employeeNo)
    if not deleted:
        raise HTTPException(status_code=404, detail="対象の従業員データが存在しません")
    return {"code": 200, "msg": "删除完成"}
