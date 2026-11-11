from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.Login_service import login_service

router = APIRouter(prefix="/api/kadou", tags=["用户认证"])


class LoginBody(BaseModel):
    userId: str
    password: str


@router.post("/login", response_model=dict)
def login(login_data: LoginBody, db: Session = Depends(get_db)):
    return login_service(
        db=db,
        userId=login_data.userId,
        password=login_data.password,
    )
