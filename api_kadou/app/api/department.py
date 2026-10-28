from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.department import (
    Department,
    DepartmentCreate,
    DepartmentDeleteResult,
    DepartmentUpdate,
)
from app.services.department import (
    create_department,
    delete_department,
    list_departments,
    update_department,
)

router = APIRouter(prefix="/api/kadou", tags=["kadou"])


@router.get("/departments/{year}", response_model=list[Department])
def get_departments(year: str, db: Session = Depends(get_db)):
    """部門管理画面：指定年度の部門一覧を返す。"""
    return list_departments(db, year)


@router.post(
    "/departments/{year}", response_model=Department, status_code=201
)
def add_department(
    year: str,
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    """部門管理画面：部門を追加して作成した部門を返す。"""
    op_user = (x_user_id or "").strip() or None
    try:
        return Department(
            **create_department(db, year, payload.model_dump(), op_user)
        )
    except IntegrityError:
        raise HTTPException(status_code=409, detail="部門の登録に失敗しました。")


@router.put("/departments/{year}/{id}", response_model=Department)
def edit_department(
    year: str,
    id: str,
    payload: DepartmentUpdate,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    """部門管理画面：部門を更新して更新後の部門を返す。"""
    op_user = (x_user_id or "").strip() or None
    updated = update_department(db, year, id, payload.model_dump(), op_user)
    if updated is None:
        raise HTTPException(status_code=404, detail="部門が見つかりません。")
    return Department(**updated)


@router.delete("/departments/{year}/{id}", response_model=DepartmentDeleteResult)
def remove_department(
    year: str, id: str, db: Session = Depends(get_db)
):
    """部門管理画面：部門を削除する。"""
    if not delete_department(db, year, id):
        raise HTTPException(status_code=404, detail="部門が見つかりません。")
    return DepartmentDeleteResult(code=0)