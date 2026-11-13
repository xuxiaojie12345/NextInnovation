"""ユーザー管理サービス（ユーザー管理画面用）"""
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.errors import BusinessException
from app.sql import load_sql

# 操作者が指定されない場合のフォールバック（認証情報が取れないとき用）
_DEFAULT_OP_USER = "ADMIN"

# 役職区分コード → 表示名（jn_user_table.yakushoku_kubun）
_YAKUSHOKU_LABELS: dict[str, str] = {
    "0": "部長",
    "1": "管理者",
    "2": "事業部長",
}


def _role_label(kubun: str) -> str:
    """役職区分コード → 表示名（未定義の区分は部長扱い）"""
    return _YAKUSHOKU_LABELS.get(kubun, "部長")


def _row_to_user(r) -> dict:
    return {
        "userId": r["user_id"],
        "name": r["shimei"],
        "role": r["yakushoku_kubun"],
        "roleLabel": _role_label(r["yakushoku_kubun"]),
        "departmentId": r["department_id"] or None,
        "password": r["password"],
    }


def list_users(db: Session) -> list[dict]:
    """ユーザー一覧を返す。"""
    rows = (
        db.execute(text(load_sql("user.sql", "list"))).mappings().all()
    )
    return [_row_to_user(r) for r in rows]


def create_user(
    db: Session, data: dict, op_user: str = _DEFAULT_OP_USER
) -> dict:
    """ユーザーを追加し、作成したユーザーを返す。

    先に同じユーザーID（user_id）の存在を検索し、既に存在すれば
    「既に登録済み」の業務エラー（E_KADOU_004）を返す。
    存在しなければ INSERT を実行する（重複判定に DB エラーコードは使わない）。
    """
    if _get_user(db, data["userId"]) is not None:
        raise BusinessException(
            status_code=409,
            message_id="E_KADOU_004",
            params=[data["userId"]],
        )
    db.execute(
        text(load_sql("user.sql", "insert")),
        {
            "user_id": data["userId"],
            "shimei": data["name"],
            "yakushoku_kubun": data["role"],
            # department_id は NOT NULL。未選択を表す「全部門」は NULL でなく '' を入れる
            "department_id": data.get("departmentId") or "",
            "password": data["password"],
            "register_user": op_user,
            "update_user": op_user,
        },
    )
    db.commit()
    return _get_user(db, data["userId"])


def update_user(
    db: Session, user_id: str, data: dict, op_user: str = _DEFAULT_OP_USER
) -> dict:
    """ユーザーを更新して更新後のユーザーを返す。存在しない場合は 404 エラーにする。"""
    res = db.execute(
        text(load_sql("user.sql", "update")),
        {
            "user_id": user_id,
            "shimei": data["name"],
            "yakushoku_kubun": data["role"],
            "department_id": data.get("departmentId") or "",
            "password": data["password"],
            "update_user": op_user,
        },
    )
    db.commit()
    if res.rowcount == 0:
        raise BusinessException(status_code=404, message_id="E_KADOU_024")
    return _get_user(db, user_id)


def delete_user(db: Session, user_id: str) -> None:
    """ユーザーを削除する。存在しない場合は 404 エラーにする。"""
    res = db.execute(
        text(load_sql("user.sql", "delete")), {"user_id": user_id}
    )
    db.commit()
    if res.rowcount == 0:
        raise BusinessException(status_code=404, message_id="E_KADOU_024")


def _get_user(db: Session, user_id: str) -> dict | None:
    """ユーザー単件を取得する。存在しない場合は None を返す。"""
    row = (
        db.execute(
            text(load_sql("user.sql", "get")), {"user_id": user_id}
        )
        .mappings()
        .first()
    )
    if row is None:
        return None
    return _row_to_user(row)