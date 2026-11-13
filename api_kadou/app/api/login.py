from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.login import LoginRequest, LoginResponse
from app.services.login import login as login_Service

router = APIRouter(prefix="/api/auth")


@router.post("/loginAPI", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """ログイン認証。認証ロジック（成功時ユーザー返却 / 401）は services 層で行う。"""
    return login_Service(db, payload.userId.strip(), payload.password)