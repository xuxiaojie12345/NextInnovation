from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.core.errors import BusinessException
from app.db.session import get_db
from app.schemas.user import (
    User,
    UserCreate,
    UserDeleteResult,
    UserUpdate,
)
from app.services.user import (
    create_user,
    delete_user,
    list_users,
    update_user,
)

router = APIRouter(prefix="/api/users", tags=["kadou"])


@router.get("/select", response_model=list[User])
def get_users(db: Session = Depends(get_db)):
    """ユーザー管理画面：ユーザー一覧を返す。"""
    return list_users(db)


@router.post("/insert", response_model=User, status_code=201)
def add_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    """ユーザー管理画面：ユーザーを追加して作成したユーザーを返す。"""
    op_user = (x_user_id or "").strip() or None
    # 重複判定は create_user 内で「ユーザーIDの存在検索」により行う（DBエラーコードは使わない）。
    # その他の整合性エラーは IntegrityError が汎用ハンドラで処理される。
    return User(**create_user(db, payload.model_dump(), op_user))


@router.put("/update/{userId}", response_model=User)
def edit_user(
    userId: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    """ユーザー管理画面：ユーザーを更新して更新後のユーザーを返す。"""
    op_user = (x_user_id or "").strip() or None
    updated = update_user(db, userId, payload.model_dump(), op_user)
    if updated is None:
        raise BusinessException(status_code=404, message_id="E_KADOU_024")
    return User(**updated)


@router.delete("/delete/{userId}", response_model=UserDeleteResult)
def remove_user(
    userId: str, db: Session = Depends(get_db)
):
    """ユーザー管理画面：ユーザーを削除する。"""
    if not delete_user(db, userId):
        raise BusinessException(status_code=404, message_id="E_KADOU_024")
    return UserDeleteResult(code=0)