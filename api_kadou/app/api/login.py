from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.login import LoginRequest, UserOut
from app.services.login import authenticate

router = APIRouter(prefix="/api/auth")


@router.post("/loginAPI", response_model=UserOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """ログイン認証。成功時はユーザー情報を返す。"""
    user = authenticate(db, payload.userId.strip(), payload.password)
    if user is None:
        raise HTTPException(
            status_code=401, detail="ユーザーIDまたはパスワードが正しくありません。"
        )
    return user