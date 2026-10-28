from sqlalchemy.orm import Session
from typing import List
import random
from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentOut, DepartmentQueryOut
from app.sql.Department_sql import (
    DEPARTMENT_SELECT_BY_YEAR,
    DEPARTMENT_INSERT,
    DEPARTMENT_UPDATE,
    DEPARTMENT_DELETE,
)


def generate_department_id(db: Session, year_id: str, max_retries: int = 10) -> str:
    """随机生成 department_id (varchar(10))，避免与已有数据冲突"""
    for _ in range(max_retries):
        new_id = str(random.randint(1000000000, 9999999999))  # 10位数字字符串
        exists = (
            db.query(Department)
            .filter(
                Department.department_id == new_id,
                Department.year_id == year_id,
            )
            .first()
        )
        if not exists:
            return new_id
    # 重试耗尽，改用 count + 1
    count = db.query(Department).filter(Department.year_id == year_id).count()
    return str(count + 1).zfill(10)


def create_department(db: Session, department: DepartmentCreate) -> DepartmentOut:
    """创建部門"""
    new_department_id = generate_department_id(db, department.year_id)

    db.execute(
        DEPARTMENT_INSERT,
        {
            "department_id": new_department_id,
            "year_id": department.year_id,
            "department_name": department.name,
            "location": department.location,
            "kind": department.kind,
            "register_user": "SYS",
            "update_user": "SYS",
        },
    )
    db.commit()

    # 插入后用 ORM 查回完整数据
    db_department = (
        db.query(Department)
        .filter(Department.department_id == new_department_id)
        .first()
    )
    # Pydantic v2: 显式校验 ORM 对象
    return DepartmentOut.model_validate(db_department)


def update_department(
    db: Session, year: str, dept_id: str, department: DepartmentCreate
) -> DepartmentOut:
    """更新部門"""
    # 先查记录是否存在
    exists = (
        db.query(Department)
        .filter(
            Department.year_id == year,
            Department.department_id == dept_id,
        )
        .first()
    )
    if not exists:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail=f"部門不存在: year={year}, department_id={dept_id}",
        )

    db.execute(
        DEPARTMENT_UPDATE,
        {
            "year_id": year,
            "department_id": dept_id,
            "department_name": department.name,
            "location": department.location,
            "kind": department.kind,
            "update_user": "SYS",
        },
    )
    db.commit()

    # 查回更新后的数据
    db_department = (
        db.query(Department)
        .filter(
            Department.year_id == year,
            Department.department_id == dept_id,
        )
        .first()
    )
    return DepartmentOut.model_validate(db_department)


def delete_department(db: Session, year: str, dept_id: str) -> None:
    """删除部門"""
    # 先查记录是否存在
    exists = (
        db.query(Department)
        .filter(
            Department.year_id == year,
            Department.department_id == dept_id,
        )
        .first()
    )
    if not exists:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail=f"部門不存在: year={year}, department_id={dept_id}",
        )

    db.execute(
        DEPARTMENT_DELETE,
        {
            "year_id": year,
            "department_id": dept_id,
        },
    )
    db.commit()


def get_departments_by_year(db: Session, year: str) -> List[DepartmentQueryOut]:
    """根据 year_id 查询部門列表"""
    result = db.execute(DEPARTMENT_SELECT_BY_YEAR, {"year_id": year})
    rows = result.fetchall()
    # Row 对象转为 dict，再用 Pydantic 校验
    return [DepartmentQueryOut(**row._mapping) for row in rows]
