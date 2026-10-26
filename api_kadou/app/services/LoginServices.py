from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import JnUserTable
from app.schemas.Login import LoginUserRequest, LoginUserResponse

class LoginServices:

    
    @staticmethod
    def loginUser(loginRequest: LoginUserRequest,db: Session):
        user = db.query(JnUserTable).filter(JnUserTable.userId == loginRequest.userId and JnUserTable.password == loginRequest.password).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        return user