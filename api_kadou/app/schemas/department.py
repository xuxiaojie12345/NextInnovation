from typing import Optional

from pydantic import BaseModel


class Department(BaseModel):
    """部門（jn_department_master）"""

    departmentId: str
    name: str
    # 部門別名（一括取入の E 列【所属部門】との照合に使う）
    alisa: Optional[str] = ""
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