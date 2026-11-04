from typing import Optional

from sqlalchemy.orm import Session

from app.core.user import normalize_user_id
from app.sql.Personnel_sql import (
    SQL_DELETE_JN_PERSONNEL_MASTER,
    SQL_GET_DEPARTMENT_ID_BY_ALIAS_AND_LOCATION,
    SQL_GET_JN_DEPARTMENT_MASTER,
    SQL_GET_JN_PERSONNEL_MASTER,
    SQL_INSERT_JN_PERSONNEL_MASTER,
    SQL_LIST_JN_PERSONNEL_MASTER,
    SQL_UPDATE_JN_PERSONNEL_MASTER,
)

# 未登録の所属（部門マスタに無い）を表す department_id
UNREGISTERED_DEPARTMENT_ID = 0


def to_database_department_id(value: Optional[str]) -> int:
    """画面の departmentId を DB の int 列へ変換する。

    空文字・数値でない値（マスタ未登録やモック ID）は 0（未登録）として扱う。
    """
    if value is None:
        return UNREGISTERED_DEPARTMENT_ID
    text = str(value).strip()
    if not text.isdigit():
        return UNREGISTERED_DEPARTMENT_ID
    return int(text)


def _to_screen_department_id(value) -> str:
    """DB の department_id（int）を画面用の文字列へ変換する（0 = 未登録は空文字）"""
    if value in (None, 0, "0", ""):
        return ""
    return str(value)


def get_personnel_by_emp_no(db: Session, year: int, employeeNo: str):
    result = db.execute(
        SQL_GET_JN_PERSONNEL_MASTER,
        {"year": year, "employeeNo": employeeNo},
    )
    row = result.fetchone()
    if not row:
        return None
    person = row._asdict()
    person["departmentId"] = _to_screen_department_id(person["departmentId"])
    return person


def get_personnel_list(db: Session, year: int):
    rows = db.execute(SQL_LIST_JN_PERSONNEL_MASTER, {"year": year}).fetchall()
    latest_by_employee = {}
    for row in rows:
        person = row._asdict()
        latest_by_employee.setdefault(
            person["employeeNo"],
            {
                "employeeNo": person["employeeNo"],
                "departmentId": _to_screen_department_id(person["departmentId"]),
                "name": person["name"],
                "role": person["role"],
                "leavePlan": person["leavePlan"],
            },
        )
    return list(latest_by_employee.values())


def get_dept_name(db: Session, year: int, departmentId: str):
    result = db.execute(
        SQL_GET_JN_DEPARTMENT_MASTER,
        {"year": year, "departmentId": departmentId},
    )
    row = result.fetchone()
    if not row:
        return None
    return row._asdict()


def get_department_id_by_alias_and_location(db: Session, year: int, departmentAlias: str, location: str):
    """根据 department_alias + location 查询 department_id"""
    result = db.execute(
        SQL_GET_DEPARTMENT_ID_BY_ALIAS_AND_LOCATION,
        {"year": year, "departmentAlias": departmentAlias, "location": location},
    )
    row = result.fetchone()
    if not row:
        return None
    return row._asdict()


def insert_personnel(db: Session, data: dict):
    return save_personnel_records(db, [data])


def save_personnel_records(db: Session, records: list):
    try:
        if records:
            db.execute(SQL_INSERT_JN_PERSONNEL_MASTER, records)
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise


def delete_personnel(db: Session, year: int, employeeNo: str):
    try:
        result = db.execute(
            SQL_DELETE_JN_PERSONNEL_MASTER,
            {"year": year, "employeeNo": employeeNo},
        )
        db.commit()
        return result.rowcount > 0
    except Exception:
        db.rollback()
        raise


def update_personnel(db: Session, data: dict):
    """更新 JN_PERSONNEL_MASTER 表中の记录（角色、名前、所属等）"""
    try:
        result = db.execute(
            SQL_UPDATE_JN_PERSONNEL_MASTER,
            {
                "year": data["year"],
                "employeeNo": data["employeeNo"],
                "departmentId": to_database_department_id(data["departmentId"]),
                "personName": data["personName"],
                "role": data["role"],
                "leavePlan": data.get("leavePlan", ""),
                "updateDatetime": data["updateDatetime"],
                # ログインユーザーID（未指定時は SYS）
                "updateUser": normalize_user_id(data.get("updateUser")),
            },
        )
        db.commit()
        return result.rowcount > 0
    except Exception:
        db.rollback()
        raise
