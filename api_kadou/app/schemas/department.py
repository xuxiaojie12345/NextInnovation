from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime
from typing import Optional


class DepartmentCreate(BaseModel):
    """创建部門 - 接收前端入参"""
    model_config = ConfigDict(populate_by_name=True)

    year_id: str = Field(alias="yearid", max_length=4)
    name: str = Field(alias="department_name", max_length=20)
    # 部門名略称（任意）
    department_alisa: Optional[str] = Field(default=None, max_length=20)
    location: str = Field(max_length=4)
    kind: str = Field(max_length=20)


class DepartmentOut(BaseModel):
    """返回给前端的数据"""
    model_config = ConfigDict(from_attributes=True)

    # DB は int AUTO_INCREMENT だが、画面側の契約（文字列ID）を維持するため文字列化する
    department_id: str
    year_id: str
    department_name: str
    department_alisa: Optional[str] = None
    location: str
    kind: str
    register_datetime: Optional[datetime] = None
    register_user: Optional[str] = None
    update_datetime: Optional[datetime] = None
    update_user: Optional[str] = None

    @field_validator("department_id", mode="before")
    @classmethod
    def _department_id_to_str(cls, value: object) -> object:
        return str(value) if value is not None else value


class DepartmentQueryOut(BaseModel):
    """查询部門列表 - 仅返回 SQL 中选定的字段"""
    department_id: str
    department_name: str
    department_alisa: Optional[str] = None
    location: str
    kind: str

    @field_validator("department_id", mode="before")
    @classmethod
    def _department_id_to_str(cls, value: object) -> object:
        return str(value) if value is not None else value
