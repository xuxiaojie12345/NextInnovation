from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.department import DepartmentCreate, DepartmentOut, DepartmentQueryOut
from app.services.Department_service import (
    create_department as _create_department,
    delete_department as _delete_department,
    get_departments_by_year as _get_departments_by_year,
    update_department as _update_department,
)

router = APIRouter(prefix="/api/kadou")


@router.post("/departments/{year}", response_model=DepartmentOut)
def create_department(
    year: str,
    department: DepartmentCreate,
    db: Session = Depends(get_db),
):
    """新增部門。

    - 路径参数 year: 年度ID
    - 请求体: 部門情報（yearid 必須与路径参数 year 一致）
    - 返回: 新增后的部門对象
    """
    # 路径参数 year 与 body 中 year_id 一致时校验
    if department.year_id != year:
        raise HTTPException(
            status_code=400,
            detail=f"路径年份 {year} 与 body 中 yearid {department.year_id} 不一致",
        )
    return _create_department(db, department)


@router.put("/departments/{year}/{id}", response_model=DepartmentOut)
def update_department(
    year: str,
    id: str,
    department: DepartmentCreate,
    db: Session = Depends(get_db),
):
    """更新部門。

    - 路径参数 year: 年度ID
    - 路径参数 id: 部門ID（更新对象）
    - 请求体: 更新后的部門情報（yearid 必須与路径参数 year 一致）
    - 返回: 更新后的部門对象
    """
    # 路径参数 year 与 body 中 yearid 一致时校验
    if department.year_id != year:
        raise HTTPException(
            status_code=400,
            detail=f"路径年份 {year} 与 body 中 yearid {department.year_id} 不一致",
        )
    return _update_department(db, year, id, department)


@router.delete("/departments/{year}/{id}")
def delete_department(
    year: str,
    id: str,
    db: Session = Depends(get_db),
):
    """根据 year_id + department_id 删除部門。

    - 路径参数 year: 年度ID
    - 路径参数 id: 部門ID（删除对象）
    - 请求体: 无
    - 返回: 固定 {"code": 0}（成功时）
    """
    _delete_department(db, year, id)
    return {"code": 0}


@router.get("/departments/{year}", response_model=List[DepartmentQueryOut])
def get_departments_by_year(
    year: str,
    db: Session = Depends(get_db),
):
    """根据 year_id 查询部門列表。

    - 路径参数 year: 年度ID
    - 请求体: 无
    - 返回: 该年度下的部門列表
    """
    return _get_departments_by_year(db, year)
