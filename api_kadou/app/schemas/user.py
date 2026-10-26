from typing import Optional

from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    """ログインリクエスト（フロントエンドからの入参）"""

    user_id: str
    password: str


class UserOut(BaseModel):
    """ログイン成功時に返すユーザー情報"""

    user_id: str
    name: str
    role: str
    role_label: str
    department: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
