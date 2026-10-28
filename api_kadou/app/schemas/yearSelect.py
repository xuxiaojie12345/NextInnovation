from typing import List

from pydantic import BaseModel


class YearSummary(BaseModel):
    """年度ごとのデータ概要（YearSelect 画面表示用）"""

    year: int
    departmentCount: int
    personnelCount: int
    projectCount: int
    holidayCount: int
    weekCount: int


class YearSummariesOut(BaseModel):
    """年度概要一覧のレスポンス"""

    years: List[YearSummary]