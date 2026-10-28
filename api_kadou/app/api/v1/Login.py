from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.LoginServices import LoginServices
from app.db.session import get_db
from app.schemas.Login import LoginUserRequest, LoginUserResponse

router = APIRouter(prefix="/api")

@router.post("/auth/login", response_model=LoginUserResponse)
def LoginUser(LoginUserRequest: LoginUserRequest, db: Session = Depends(get_db)):
    loginUser = LoginServices.loginUser(LoginUserRequest, db);
    return loginUser
