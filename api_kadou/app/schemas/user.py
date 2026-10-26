from pydantic import BaseModel


class UserCreate(BaseModel):
    """创建用户 - 接收前端入参"""
    name: str
    age: int


class UserOut(BaseModel):
    """返回给前端的数据"""
    userId: str
    shimei: str
    yakushokuKubun: str
    departmentId: str
    password: str

    class Config:
        orm_mode = True
