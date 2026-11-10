from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.errors import BusinessException
from app.db.session import get_db
from app.schemas.login import LoginRequest, LoginResponse
from app.services.login import authenticate

router = APIRouter(prefix="/api/auth")


@router.post("/loginAPI", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """ログイン認証。成功時はユーザー情報を返す。"""
    user = authenticate(db, payload.userId.strip(), payload.password)
    if user is None:
        # ユーザー不存在 / パスワード不一致：后端只返回业务 code，文案由前端按 code 映射
        raise BusinessException(401, "E_KADOU_001")
    return user
