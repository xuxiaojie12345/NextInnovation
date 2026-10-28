"""部門サービス（部門管理画面用）"""
import re

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.sql import load_sql

# 操作者が指定されない場合のフォールバック（認証情報が取れないとき用）
_DEFAULT_OP_USER = "ADMIN"


def _row_to_department(r) -> dict:
    return {
        "departmentId": r["department_id"],
        "name": r["department_name"],
        "location": r["location"],
        "kind": r["kind"] or "dept",
    }


def list_departments(db: Session, year_id: str) -> list[dict]:
    """指定年度の部門一覧を返す。"""
    rows = (
        db.execute(
            text(load_sql("departments_select.sql")), {"year_id": year_id}
        )
        .mappings()
        .all()
    )
    return [_row_to_department(r) for r in rows]


def _next_department_id(db: Session, year_id: str) -> str:
    """既存の dept-xxxx の最大値 + 1 で部門IDを採番する。"""
    nums = [
        int(m.group(1))
        for r in list_departments(db, year_id)
        for m in [re.fullmatch(r"dept-(\d+)", r["departmentId"])]
        if m
    ]
    nxt = (max(nums) if nums else 0) + 1
    return f"dept-{nxt:04d}"


def create_department(
    db: Session, year_id: str, data: dict, op_user: str = _DEFAULT_OP_USER
) -> dict:
    """部門を追加し、作成した部門を返す。"""
    department_id = _next_department_id(db, year_id)
    db.execute(
        text(load_sql("department_insert.sql")),
        {
            "year_id": year_id,
            "department_id": department_id,
            "department_name": data["name"],
            "location": data["location"],
            "kind": data["kind"] or "dept",
            "op_user": op_user,
        },
    )
    db.commit()
    return {
        "departmentId": department_id,
        "name": data["name"],
        "location": data["location"],
        "kind": data["kind"] or "dept",
    }


def update_department(
    db: Session,
    year_id: str,
    department_id: str,
    data: dict,
    op_user: str = _DEFAULT_OP_USER,
) -> dict | None:
    """部門を更新する。存在しない場合は None を返す。"""
    res = db.execute(
        text(load_sql("department_update.sql")),
        {
            "year_id": year_id,
            "department_id": department_id,
            "department_name": data["name"],
            "location": data["location"],
            "kind": data["kind"] or "dept",
            "op_user": op_user,
        },
    )
    db.commit()
    if res.rowcount == 0:
        return None
    return {
        "departmentId": department_id,
        "name": data["name"],
        "location": data["location"],
        "kind": data["kind"] or "dept",
    }


def delete_department(db: Session, year_id: str, department_id: str) -> bool:
    """部門を削除する。削除できた場合は True を返す。"""
    res = db.execute(
        text(load_sql("department_delete.sql")),
        {"year_id": year_id, "department_id": department_id},
    )
    db.commit()
    return res.rowcount > 0