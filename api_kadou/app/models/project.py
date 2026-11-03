from sqlalchemy import Column, Integer, String, TIMESTAMP, text
from app.models.base import Base


class Project(Base):
    __tablename__ = "jn_project_master"

    sys_project_id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="システム項目ID",
    )
    year_id = Column(String(4), primary_key=True, comment="年度ID")
    customer = Column(String(100), nullable=False, comment="顧客")
    case_name = Column(String(100), nullable=False, comment="案件名")
    team = Column(String(30), comment="チーム")
    sub_team = Column(String(30), comment="Subチーム")
    department_id = Column(String(10), nullable=False, comment="部門ID")
    project_id = Column(String(20), comment="項目ID")
    project_name = Column(String(30), comment="項目名")
    register_datetime = Column(
        TIMESTAMP,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        comment="登録日時",
    )
    register_user = Column(String(5), nullable=False, comment="登録者")
    update_datetime = Column(
        TIMESTAMP,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
        comment="更新日時",
    )
    update_user = Column(String(5), nullable=False, comment="更新者")
