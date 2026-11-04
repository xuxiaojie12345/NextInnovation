"""ログインユーザーID（登録・更新ユーザー）の共通処理"""
from typing import Optional

from fastapi import Header

# register_user / update_user は varchar(5)
USER_ID_MAX_LENGTH = 5
FALLBACK_USER_ID = "SYS"


def normalize_user_id(user_id: Optional[str]) -> str:
    """ログインユーザーIDを登録・更新ユーザーの保存値に整える"""
    value = (user_id or "").strip()
    if not value:
        return FALLBACK_USER_ID
    return value[:USER_ID_MAX_LENGTH]


def current_user_id(x_user_id: str = Header(default="")) -> str:
    """ログインユーザーID（フロントが X-User-Id ヘッダで送信する）"""
    return normalize_user_id(x_user_id)
