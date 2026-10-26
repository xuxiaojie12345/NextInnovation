from sqlalchemy import Column, String

from app.models.base import Base


class User(Base):
    """ログインユーザー（t_user テーブル）"""

    __tablename__ = "t_user"

    user_id = Column(String(50), primary_key=True, comment="ログインID")
    shimei = Column(String(100), nullable=False, comment="氏名")
    yakushoku_kubun = Column(String(20), nullable=False, comment="役職区分")
    department_id = Column(String(100), nullable=True, comment="担当部門（部長のみ）")
    password = Column(String(255), nullable=False, comment="パスワード（平文）")
