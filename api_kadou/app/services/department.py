"""部門サービス（部門管理画面用）"""
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import BusinessException
from app.sql import load_sql

# 操作者が指定されない場合のフォールバック（認証情報が取れないとき用）
_DEFAULT_OP_USER = "ADMIN"


def _row_to_department(r) -> dict:
    # NOTE: jn_department_master.department_id は int 型。
    #       画面・API の契約は文字列（例："1"）なので、ここで必ず文字列に揃える。
    #       （int のまま返すとレスポンスモデル（departmentId: str）で検証エラー→500 になる）
    return {
        "departmentId": str(int(r["department_id"])),
        "name": r["department_name"],
        "alisa": r["department_alisa"] or "",
        "location": r["location"],
        "kind": r["kind"] or "dept",
    }


def list_departments(db: Session, year_id: str) -> list[dict]:
    """指定年度の部門一覧を返す。"""
    rows = (
        db.execute(
            text(load_sql("department.sql", "list")), {"year_id": year_id}
        )
        .mappings()
        .all()
    )
    return [_row_to_department(r) for r in rows]


def create_department(
    db: Session, year_id: str, data: dict, op_user: str = _DEFAULT_OP_USER
) -> dict:
    """部門を追加し、作成した部門を返す。

    department_id は DB の AUTO_INCREMENT で採番し、挿入後に発番された ID を
    文字列に整形して返す（例："1"）。重複など整合性違反は 409 エラーにする。
    """
    try:
        res = db.execute(
            text(load_sql("department.sql", "insert")),
            {
                "year_id": year_id,
                "department_name": data["name"],
                "department_alisa": data.get("alisa") or "",
                "location": data["location"],
                "kind": data["kind"] or "dept",
                "op_user": op_user,
            },
        )
    except IntegrityError:
        raise BusinessException(status_code=409, message_id="E_KADOU_022")
    db.commit()
    department_id = str(res.lastrowid)
    return {
        "departmentId": department_id,
        "name": data["name"],
        "alisa": data.get("alisa") or "",
        "location": data["location"],
        "kind": data["kind"] or "dept",
    }


def update_department(
    db: Session,
    year_id: str,
    department_id: str,
    data: dict,
    op_user: str = _DEFAULT_OP_USER,
) -> dict:
    """部門を更新して更新後の部門を返す。存在しない場合は 404 エラーにする。"""
    res = db.execute(
        text(load_sql("department.sql", "update")),
        {
            "year_id": year_id,
            "department_id": department_id,
            "department_name": data["name"],
            "department_alisa": data.get("alisa") or "",
            "location": data["location"],
            "kind": data["kind"] or "dept",
            "op_user": op_user,
        },
    )
    db.commit()
    if res.rowcount == 0:
        raise BusinessException(status_code=404, message_id="E_KADOU_024")
    return {
        "departmentId": department_id,
        "name": data["name"],
        "alisa": data.get("alisa") or "",
        "location": data["location"],
        "kind": data["kind"] or "dept",
    }


def delete_department(db: Session, year_id: str, department_id: str) -> None:
    """部門を削除する。

    同一年度の 要員 / プロジェクト / 稼働表行（異動の旧行を含む）のいずれかから
    参照されている場合は削除せず例外を投げる。ユーザー年度別所属はチェックしない。
    削除対象が存在しない場合は 404 エラーにする。
    """
    counts = {
        name: db.execute(
            text(load_sql("department.sql", name)),
            {"year_id": year_id, "department_id": department_id},
        ).scalar_one()
        for name in ("personnel_count", "project_count", "assignment_count")
    }
    reasons = [
        reason
        for name, reason in (
            ("personnel_count", "要員"),
            ("project_count", "プロジェクト"),
            ("assignment_count", "要員稼働データ（異動の旧行を含む）"),
        )
        if counts[name]
    ]
    if reasons:
        raise BusinessException(
            status_code=403,
            message_id="E_KADOU_002",
            params=["・".join(reasons)],
        )

    res = db.execute(
        text(load_sql("department.sql", "delete")),
        {"year_id": year_id, "department_id": department_id},
    )
    db.commit()
    if res.rowcount == 0:
        raise BusinessException(status_code=404, message_id="E_KADOU_024")