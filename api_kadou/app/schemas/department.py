from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import List, Optional


class DepartmentCreate(BaseModel):
    """创建部門 - 接收前端入参"""
    model_config = ConfigDict(populate_by_name=True)

    year_id: str = Field(alias="yearid", max_length=4)
    name: str = Field(alias="department_name", max_length=20)
    location: str = Field(max_length=4)
    kind: str = Field(max_length=20)


class DepartmentOut(BaseModel):
    """返回给前端的数据"""
    model_config = ConfigDict(from_attributes=True)

    department_id: str
    year_id: str
    department_name: str
    location: str
    kind: str
    register_datetime: Optional[datetime] = None
    register_user: Optional[str] = None
    update_datetime: Optional[datetime] = None
    update_user: Optional[str] = None


class DepartmentQueryOut(BaseModel):
    """查询部門列表 - 仅返回 SQL 中选定的 4 个字段"""
    department_id: str
    department_name: str
    location: str
    kind: str
