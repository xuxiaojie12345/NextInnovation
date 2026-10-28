from pydantic import BaseModel,Field


class LoginUserRequest(BaseModel):
    userId: str
    password: str

class LoginUserResponse(BaseModel):
    userId: str
    name: str
    yakushokukubun: str
    department: str
    token: str

    class Config:
        orm_mode = True
