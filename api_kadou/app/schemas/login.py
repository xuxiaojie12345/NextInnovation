from typing import Optional

from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    """ログインリクエスト（フロントエンドからの入参）"""

    userId: str
    password: str


class LoginResponse(BaseModel):
    """ログイン成功時に返すユーザー情報"""

    userId: str
    name: str
    yakushokukubun: str
    # 担当部門ID（年度に依存しない）
    departmentId: Optional[str] = None
    department: Optional[str] = None
    token: str = ""

    model_config = ConfigDict(from_attributes=True)