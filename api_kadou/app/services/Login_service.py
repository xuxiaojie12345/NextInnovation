from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.sql.Login_sql import SQL_GET_JN_USER_TABLE


def login_service(db: Session, userId: str, password: str):
    row = db.execute(SQL_GET_JN_USER_TABLE, {"userId": userId, "password": password}).fetchone()
    if not row:
        raise HTTPException(status_code=400, detail="ユーザーIDまたはパスワードが正しくありません。")
    user = dict(row._mapping)

    return {
        "token": "",
        "user": {
            "userId": user["user_id"],
            "shimei": user["shimei"],
            "yakushokuKubun": user["yakushoku_kubun"],
            "departmentId": user["department_id"],
        }
    }