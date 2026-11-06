from typing import List

from pydantic import BaseModel, Field


class YearSummary(BaseModel):
    """年度ごとの件数サマリ"""

    year: int = Field(description="年度")
    department_count: int = Field(
        serialization_alias="departmentCount", description="部門数"
    )
    personnel_count: int = Field(
        serialization_alias="personnelCount", description="要員数"
    )
    project_count: int = Field(
        serialization_alias="projectCount", description="プロジェクト数"
    )
    holiday_count: int = Field(
        serialization_alias="holidayCount", description="休日数"
    )
    week_count: int = Field(
        serialization_alias="weekCount", description="年度内の週数（52 または 53）"
    )


class YearSummaryList(BaseModel):
    """年度サマリ一覧のレスポンス"""

    years: List[YearSummary] = Field(description="年度ごとのサマリ（年度昇順）")
