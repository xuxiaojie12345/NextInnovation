from sqlalchemy import Column, Integer, String
from app.models.base import Base


class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), comment="姓名")
    age = Column(Integer, comment="年龄")
