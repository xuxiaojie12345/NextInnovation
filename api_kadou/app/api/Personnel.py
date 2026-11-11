from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.core.user import current_user_id
from app.db.session import get_db
from app.services.Personnel_service import (
    delete_personnel,
    get_department_id_by_alias_and_location,
    get_dept_name,
    get_personnel_by_emp_no,
    get_personnel_list,
    insert_personnel,
    save_personnel_records,
    to_database_department_id,
    update_personnel,
)

router = APIRouter(prefix="/api/personnel", tags=["人员主表"])


class PersonnelInput(BaseModel):
    employeeNo: str
    departmentAlias: Optional[str] = ""  # 所属部門（department_alias）
    location: Optional[str] = ""  # 労働関係所属地（location）
    departmentId: Optional[str] = ""  # 部門ID（直接指定，優先級高于 alias+location）
    name: Optional[str] = ""
    role: Optional[str] = "要員"
    leavePlan: Optional[str] = ""

    @field_validator(
        "departmentAlias", "location", "departmentId", "name", "role", "leavePlan",
        mode="before",
    )
    @classmethod
    def _none_to_empty(cls, value):
        """null は空文字として扱う（不要な 422 を避ける）"""
        if value is None:
            return ""
        return value


def _record(
    year: int,
    person: PersonnelInput,
    now: datetime,
    user_id: str,
    department_id: int,
) -> dict:
    return {
        "year": year,
        "employeeNo": person.employeeNo,
        "departmentId": department_id,
        "idouFlag": "0",
        "idoubi": "",
        "personName": person.name,
        "role": person.role,
        "leavePlan": person.leavePlan,
        "registerDatetime": now,
        "registerUser": user_id,
        "updateDatetime": now,
        "updateUser": user_id,
    }


def _require_department_id(db: Session, year: int, value: Optional[str]) -> int:
    """登録・更新時は選択済みの当年度部門IDを必須にする"""
    department_id = to_database_department_id(value)
    if department_id <= 0:
        raise HTTPException(status_code=422, detail="所属を選択してください。")
    if not get_dept_name(db, year, str(department_id)):
        raise HTTPException(
            status_code=422,
            detail="選択された所属は当年度の部門マスタに存在しません。",
        )
    return department_id


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
    user_id: str = Depends(current_user_id),
    db: Session = Depends(get_db),
):
    now = datetime.now()
    valid_department_id = _require_department_id(db, year, departmentId)
    record = {
        "year": year,
        "employeeNo": employeeNo,
        "departmentId": valid_department_id,
        "idouFlag": idouFlag,
        "idoubi": idoubi,
        "personName": personName,
        "role": role,
        "leavePlan": leavePlan,
        "registerDatetime": now,
        "registerUser": user_id,
        "updateDatetime": now,
        "updateUser": user_id,
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
    user_id: str = Depends(current_user_id),
    db: Session = Depends(get_db),
):
    # 检查记录是否已存在
    valid_department_id = _require_department_id(db, year, person.departmentId)
    existing = get_personnel_by_emp_no(db, year, person.employeeNo)
    now = datetime.now()

    if existing:
        # 记录已存在，执行更新（角色、名前、所属等）
        update_data = {
            "year": year,
            "employeeNo": person.employeeNo,
            "departmentId": valid_department_id,
            "personName": person.name,
            "role": person.role,
            "leavePlan": person.leavePlan,
            "updateDatetime": now,
            "updateUser": user_id,
        }
        update_personnel(db, update_data)
        return {"code": 200, "msg": "更新完了"}
    else:
        # 记录不存在，执行插入
        record = _record(year, person, now, user_id, valid_department_id)
        save_personnel_records(db, [record])
        return {"code": 200, "msg": "登録完了"}


@router.post("/import")
def import_personnel(
    year: int,
    people: List[PersonnelInput],
    user_id: str = Depends(current_user_id),
    db: Session = Depends(get_db),
):
    now = datetime.now()
    records = []
    for person in people:
        # 确定 departmentId 的值
        department_id = person.departmentId  # 直接指定の优先级最高

        # 如果没有直接指定 departmentId，则根据 departmentAlias + location 查询
        if not department_id and person.departmentAlias and person.location:
            dept_info = get_department_id_by_alias_and_location(
                db, year, person.departmentAlias, person.location
            )
            if dept_info:
                department_id = dept_info["department_id"]

        record = {
            "year": year,
            "employeeNo": person.employeeNo,
            "departmentId": to_database_department_id(department_id),
            "idouFlag": "0",
            "idoubi": "",
            "personName": person.name,
            "role": person.role,
            "leavePlan": person.leavePlan,
            "registerDatetime": now,
            "registerUser": user_id,
            "updateDatetime": now,
            "updateUser": user_id,
        }
        records.append(record)

    # 同一社員番号の既存レコードは上書きする（主キー重複を避けるため先に削除する）
    for employee_no in {person.employeeNo for person in people}:
        delete_personnel(db, year, employee_no)

    save_personnel_records(db, records)
    return {"code": 200, "msg": "导入完成", "count": len(people)}


@router.delete("/delete")
def remove_person(year: int, employeeNo: str, db: Session = Depends(get_db)):
    deleted = delete_personnel(db, year, employeeNo)
    if not deleted:
        raise HTTPException(status_code=404, detail="対象の従業員データが存在しません")
    return {"code": 200, "msg": "删除完成"}