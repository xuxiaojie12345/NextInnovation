from typing import Optional

from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    """ログインリクエスト（フロントエンドからの入参）"""

    userId: str
    password: str


class UserOut(BaseModel):
    """ログイン成功時に返すユーザー情報"""

    userId: str
    name: str
    yakushokukubun: str
    department: Optional[str] = None
    token: str = ""

    model_config = ConfigDict(from_attributes=True)