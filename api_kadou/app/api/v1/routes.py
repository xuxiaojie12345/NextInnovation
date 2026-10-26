from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.user import LoginRequest, UserOut
from app.services.auth import authenticate

router = APIRouter(prefix="/api/v1")


@router.post("/login", response_model=UserOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """ログイン認証。成功時はユーザー情報を返す。"""
    user = authenticate(db, payload.user_id.strip(), payload.password)
    if user is None:
        raise HTTPException(
            status_code=401, detail="ユーザーIDまたはパスワードが正しくありません。"
        )
    return user
