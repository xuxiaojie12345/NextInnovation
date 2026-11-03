from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentOut, DepartmentQueryOut
from app.sql.Department_sql import (
    DEPARTMENT_DELETE,
    DEPARTMENT_INSERT,
    DEPARTMENT_SELECT_BY_YEAR,
    DEPARTMENT_UPDATE,
)


def _find_department(db: Session, year: str, dept_id: int) -> Department:
    """主键（department_id + year_id）で 1 件取得する（存在しなければ 404）"""
    department = (
        db.query(Department)
        .filter(
            Department.year_id == year,
            Department.department_id == dept_id,
        )
        .first()
    )
    if not department:
        raise HTTPException(
            status_code=404,
            detail=f"部門不存在: year={year}, department_id={dept_id}",
        )
    return department


def create_department(db: Session, department: DepartmentCreate) -> DepartmentOut:
    """创建部門"""
    result = db.execute(
        DEPARTMENT_INSERT,
        {
            "year_id": department.year_id,
            "department_name": department.name,
            "department_alisa": department.department_alisa,
            "location": department.location,
            "kind": department.kind,
            "register_user": "SYS",
            "update_user": "SYS",
        },
    )
    # AUTO_INCREMENT で採番された部門ID
    new_department_id = result.lastrowid
    db.commit()

    # 插入后用 ORM 查回完整数据（主键为 department_id + year_id 的复合主键）
    db_department = _find_department(db, department.year_id, new_department_id)
    # Pydantic v2: 显式校验 ORM 对象
    return DepartmentOut.model_validate(db_department)


def update_department(
    db: Session, year: str, dept_id: int, department: DepartmentCreate
) -> DepartmentOut:
    """更新部門"""
    # 先查记录是否存在
    _find_department(db, year, dept_id)

    db.execute(
        DEPARTMENT_UPDATE,
        {
            "year_id": year,
            "department_id": dept_id,
            "department_name": department.name,
            "department_alisa": department.department_alisa,
            "location": department.location,
            "kind": department.kind,
            "update_user": "SYS",
        },
    )
    db.commit()

    # 查回更新后的数据
    db_department = _find_department(db, year, dept_id)
    return DepartmentOut.model_validate(db_department)


def delete_department(db: Session, year: str, dept_id: int) -> None:
    """删除部門"""
    # 先查记录是否存在
    _find_department(db, year, dept_id)

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
