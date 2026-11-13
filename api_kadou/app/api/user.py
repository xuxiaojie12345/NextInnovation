from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

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
    """ユーザー管理画面：ユーザーを追加して作成したユーザーを返す。

    追加ロジック（存在検索による重複 409 / INSERT）は services 層で行う。
    """
    return User(
        **create_user(
            db,
            payload.model_dump(),
            (x_user_id or "").strip() or None,
        )
    )


@router.put("/update/{userId}", response_model=User)
def edit_user(
    userId: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    """ユーザー管理画面：ユーザーを更新して更新後のユーザーを返す。"""
    return User(
        **update_user(
            db,
            userId,
            payload.model_dump(),
            (x_user_id or "").strip() or None,
        )
    )


@router.delete("/delete/{userId}", response_model=UserDeleteResult)
def remove_user(
    userId: str, db: Session = Depends(get_db)
):
    """ユーザー管理画面：ユーザーを削除する。"""
    delete_user(db, userId)
    return UserDeleteResult(code=0)