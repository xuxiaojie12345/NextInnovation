"""認証サービス（ログイン）"""
from datetime import datetime

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.login import UserOut
from app.sql import load_sql


def authenticate(db: Session, user_id: str, password: str) -> UserOut | None:
    """jn_user_table からユーザーをSELECT文のみで照合する。

    部門名は jn_department_master と結合して取得する（year_id は現在の西暦）。
    ユーザーが見つからない場合やパスワード不一致の場合は None を返す。
    """
    year_id = str(datetime.now().year)
    row = (
        db.execute(
            text(load_sql("user_login.sql")),
            {
                "year_id": year_id,
                "user_id": user_id,
                "password": password,
            },
        )
        .mappings()
        .first()
    )
    if row is None:
        return None
    return UserOut(
        userId=row["user_id"],
        name=row["shimei"],
        yakushokukubun=row["yakushoku_kubun"],
        department=row["department_name"],
    )