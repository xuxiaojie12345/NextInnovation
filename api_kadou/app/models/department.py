from sqlalchemy import Column, Integer, String, DateTime, TIMESTAMP, text
from app.models.base import Base


class Department(Base):
    __tablename__ = "jn_department_master"

    year_id = Column(String(4), primary_key=True, comment="年度ID")
    department_id = Column(String(10), primary_key=True, comment="所属部門ID")
    department_name = Column(String(20), primary_key=True, comment="所属部門名")
    location = Column(String(4), comment="拠点")
    kind = Column(String(20), comment="区分")
    register_datetime = Column(
        TIMESTAMP,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        comment="登録日時",
    )
    register_user = Column(String(10), nullable=False, comment="登録者")
    update_datetime = Column(
        TIMESTAMP,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
        comment="更新日時",
    )
    update_user = Column(String(10), nullable=False, comment="更新者")
