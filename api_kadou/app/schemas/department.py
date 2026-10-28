from typing import Optional

from pydantic import BaseModel


class Department(BaseModel):
    """部門（jn_department_master）"""

    departmentId: str
    name: str
    location: str
    kind: Optional[str] = "dept"


class DepartmentCreate(BaseModel):
    """部門追加リクエスト（POST /api/kadou/departments/{year}）"""

    name: str
    location: str
    kind: Optional[str] = "dept"


class DepartmentUpdate(BaseModel):
    """部門更新リクエスト（PUT /api/kadou/departments/{year}/{id}）"""

    name: str
    location: str
    kind: Optional[str] = "dept"


class DepartmentDeleteResult(BaseModel):
    """部門削除レスポンス（DELETE）"""

    code: int = 0