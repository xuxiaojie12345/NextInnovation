from sqlalchemy import Column, Integer, String, Date
from app.models.base import Base


class JnUserTable(Base):
    __tablename__ = "jn_user_table"

    userId = Column("user_id",String(5), primary_key=True, index=True,comment="userid")
    shimei = Column("shimei",String(10), comment="氏名")
    yakushokuKubun = Column("yakushoku_kubun",String(2), comment="職級区分")
    departmentId = Column("department_id",String(10), comment="所属部門ID")
    password = Column("password",String(50), comment="パスワード")
    registerDatetime = Column("register_datetime",Date, comment="登録日時")
    registerUser = Column("register_user",String(10), comment="登録者")
    updateDatetime = Column("update_datetime",Date, comment="更新日時")
    updateuser = Column("update_user",String(10), comment="更新者")