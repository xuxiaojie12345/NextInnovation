"""登録／更新の監査項目（登録日時・登録者・更新日時・更新者）の共通処理

DB の各マスタには以下の 4 項目がある。
    register_datetime : 登録日時（timestamp）
    register_user     : 登録者（varchar(5)）
    update_datetime   : 更新日時（timestamp）
    update_user       : 更新者（varchar(5)）

本モジュールは、
  - 登録者／更新者にセットする操作者 ID の正規化（桁数・既定値）
  - 「システム日時」をサーバー側で 1 か所にまとめて取得する
を担当する。

NOTE: 日時は SQL 側で `:now_dt` として受け取る（NOW() を直接書かない）。
      新規登録時は register_datetime と update_datetime に同じ値、
      登録者と更新者にも同じ値を使うため、1 リクエスト内で取得した
      同一の日時を両方に渡す（＝必ず一致する）。
"""
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import text

# 認証情報が取れないときのフォールバック操作者
DEFAULT_OP_USER = "ADMIN"

# DB 定義に合わせた桁数
MAX_OP_USER_LEN = 5


def system_now(db: Session) -> datetime:
    """DB サーバーのシステム日時（NOW()）を取得する。

    アプリサーバーと DB サーバーの時刻がずれる場合でも、
    登録日時・更新日時が DB の CURRENT_TIMESTAMP と揃うように DB 時刻を使う。
    """
    return db.execute(text("SELECT NOW()")).scalar_one()


def normalize_op_user(op_user: str | None) -> str:
    """操作者 ID を DB の桁数（varchar(5)）に収めて返す。

    未指定なら DEFAULT_OP_USER を返し、5 文字を超える場合は先頭 5 文字を使う。
    """
    user = (op_user or "").strip()
    if not user:
        user = DEFAULT_OP_USER
    return user[:MAX_OP_USER_LEN]
