from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.JnUserTable import JnUserTable
from app.models.JnDepartmentMaster import JnDepartmentMaster
from app.schemas.Login import LoginUserRequest, LoginUserResponse

class LoginServices:
    
    @staticmethod
    def loginUser(loginUserRequest: LoginUserRequest,db: Session):
        dbResponse = db.query(JnUserTable.userId, JnUserTable.shimei, JnUserTable.yakushokuKubun,JnDepartmentMaster.departmentName).outerjoin(
            JnDepartmentMaster, JnUserTable.departmentId == JnDepartmentMaster.departmentId
        ).filter(
            JnUserTable.userId == loginUserRequest.userId and JnUserTable.password == loginUserRequest.password
        ).first()
        if not dbResponse:
            raise HTTPException(status_code=404, detail="用户不存在")
        return {
            "userId": dbResponse.userId,
            "name": dbResponse.shimei,
            "yakushokukubun": dbResponse.yakushokuKubun,
            "department": dbResponse.departmentName,
            "token": "dummy_token"  # 这里可以生成实际的JWT token
        }