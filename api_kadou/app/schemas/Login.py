from pydantic import BaseModel


class LoginUserRequest(BaseModel):
    username: str
    password: str

class LoginUserResponse(BaseModel):
    userId: str
    name: str
    yakushokukubun: str
    department: str
    token: str

    class Config:
        orm_mode = True
