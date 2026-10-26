"""認証サービス（ログイン）"""
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.user import UserOut
from app.sql import load_sql


def authenticate(db: Session, user_id: str, password: str) -> UserOut | None:
    """DB内にユーザーが存在するかをSELECT文のみで照合する。"""
    row = db.execute(
        text(load_sql("user_login.sql")), {"user_id": user_id}
    ).mappings().first()
    if row is None:
        return None
    # t_user.password は平文保存のため平文で比較する
    if password != row["password"]:
        return None
    return UserOut(
        user_id=row["user_id"],
        name=row["shimei"],
        role=row["yakushoku_kubun"],
        role_label=row["yakushoku_kubun"],
        department=row["department_id"],
    )
