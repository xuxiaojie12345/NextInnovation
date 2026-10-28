from sqlalchemy import Column, Integer, String, Date
from app.models.base import Base


class JnDepartmentMaster(Base):
    __tablename__ = "jn_department_master"

    yearId = Column("year_id",String(4), comment="年度ID")
    departmentId = Column("department_id",String(10), primary_key=True, index=True, comment="所属部門ID")
    departmentName = Column("department_name",String(20), comment="所属部門名")
    location = Column("location",String(4), comment="拠点")
    kind = Column("kind",String(20), comment="区分")
    registerDatetime = Column("register_datetime",Date, comment="登録日時")
    registerUser = Column("register_user",String(10), comment="登録者")
    updateDatetime = Column("update_datetime",Date, comment="更新日時")
    updateuser = Column("update_user",String(10), comment="更新者")