"""テーブル作成と初期データ投入（開発用）"""
from sqlalchemy.orm import Session

from app.db.session import SessionLocal, engine
from app.models import user  # noqa: F401  # モデルを metadata に登録する
from app.models.base import Base
from app.models.user import User

# 初期ログインユーザー（パスワードはすべて pass1234・平文保存）
# (user_id, shimei, yakushoku_kubun, department_id)
DEFAULT_USERS = [
    ("bucho1", "山田 一郎", "bucho", "第一開発部"),
    ("bucho2", "佐藤 二郎", "bucho", "第二開発部"),
    ("bucho3", "鈴木 三郎", "bucho", "第三開発部"),
    ("jigyo", "高橋 事業", "jigyo-bucho", None),
    ("admin", "システム管理者", "admin", None),
]


def init_db() -> None:
    """テーブルを作成し、未登録の場合は初期ユーザーを投入する"""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return
        for user_id, shimei, yakushoku_kubun, department_id in DEFAULT_USERS:
            db.add(
                User(
                    user_id=user_id,
                    shimei=shimei,
                    yakushoku_kubun=yakushoku_kubun,
                    department_id=department_id,
                    password="pass1234",
                )
            )
        db.commit()
    finally:
        db.close()
