from sqlalchemy.orm import Session

from app.sql.Personnel_sql import (
    SQL_DELETE_JN_PERSONNEL_MASTER,
    SQL_GET_JN_DEPARTMENT_MASTER,
    SQL_GET_JN_PERSONNEL_MASTER,
    SQL_INSERT_JN_PERSONNEL_MASTER,
    SQL_LIST_JN_PERSONNEL_MASTER,
)


def get_personnel_by_emp_no(db: Session, year: int, employeeNo: str):
    result = db.execute(
        SQL_GET_JN_PERSONNEL_MASTER,
        {"year": year, "employeeNo": employeeNo},
    )
    row = result.fetchone()
    if not row:
        return None
    return row._asdict()


def get_personnel_list(db: Session, year: int):
    rows = db.execute(SQL_LIST_JN_PERSONNEL_MASTER, {"year": year}).fetchall()
    latest_by_employee = {}
    for row in rows:
        person = row._asdict()
        latest_by_employee.setdefault(
            person["employeeNo"],
            {
                "employeeNo": person["employeeNo"],
                "departmentId": person["departmentId"],
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
