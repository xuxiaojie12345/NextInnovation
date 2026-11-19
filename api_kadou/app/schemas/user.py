from typing import Optional

from pydantic import BaseModel, Field


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
    """ユーザー追加リクエスト（POST /api/users/insert）

    桁数は jn_user_table の定義に合わせる
    （user_id varchar(5) / shimei varchar(10) / password varchar(50)）。
    """

    userId: str = Field(min_length=1, max_length=5)
    name: str = Field(min_length=1, max_length=10)
    role: str = Field(min_length=1, max_length=2)
    departmentId: Optional[str] = Field(default=None, max_length=10)
    password: str = Field(min_length=1, max_length=50)


class UserUpdate(BaseModel):
    """ユーザー更新リクエスト（PUT /api/users/update/{userId}）"""

    name: str = Field(min_length=1, max_length=10)
    role: str = Field(min_length=1, max_length=2)
    departmentId: Optional[str] = Field(default=None, max_length=10)
    password: str = Field(min_length=1, max_length=50)


class UserDeleteResult(BaseModel):
    """ユーザー削除レスポンス（DELETE /api/users/delete/{userId}）"""

    code: int = 0