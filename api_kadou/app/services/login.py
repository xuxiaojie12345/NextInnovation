"""認証サービス（ログイン）"""
from datetime import datetime

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.errors import BusinessException
from app.schemas.login import LoginResponse
from app.sql import load_sql


def authenticate(db: Session, user_id: str, password: str) -> LoginResponse | None:
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
    return LoginResponse(
        userId=row["user_id"],
        name=row["shimei"],
        yakushokukubun=row["yakushoku_kubun"],
        department=row["department_name"],
    )


def login(db: Session, user_id: str, password: str) -> LoginResponse:
    """ログイン認証業務。ユーザー不存在 / パスワード不一致は 401 エラーにする。

    API 層にはロジックを置かず、認証成功時のユーザー情報のみを返す。
    """
    user = authenticate(db, user_id, password)
    if user is None:
        # ユーザー不存在 / パスワード不一致：后端只返回业务 code，文案由前端按 code 映射
        raise BusinessException(status_code=401, message_id="E_KADOU_001")
    return user