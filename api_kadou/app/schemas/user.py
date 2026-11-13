from typing import Optional

from pydantic import BaseModel


class User(BaseModel):
    """ユーザー（jn_user_table）。role は役職区分コード（0=部長 / 1=管理者 / 2=事業部長）"""

    userId: str
    name: str
    role: str
    # バックエンドが role から生成する表示名（リクエストでは送らない）
    roleLabel: str
    departmentId: Optional[str] = None
    password: str


class UserCreate(BaseModel):
    """ユーザー追加リクエスト（POST /api/users/insert）"""

    userId: str
    name: str
    role: str
    departmentId: Optional[str] = None
    password: str


class UserUpdate(BaseModel):
    """ユーザー更新リクエスト（PUT /api/users/update/{userId}）"""

    name: str
    role: str
    departmentId: Optional[str] = None
    password: str


class UserDeleteResult(BaseModel):
    """ユーザー削除レスポンス（DELETE /api/users/delete/{userId}）"""

    code: int = 0