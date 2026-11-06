from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.year_summary import YearSummaryList
from app.services.YearSummary_service import (
    get_year_summaries as _get_year_summaries,
)

router = APIRouter(prefix="/api/kadou")


@router.get("/{year}", response_model=YearSummaryList)
def get_year_summaries(
    year: str,
    db: Session = Depends(get_db),
):
    """年度別サマリ取得。

    - 路径参数 year: 現行では未使用（指定値によらず 2025〜2038 年度の全件を返す）
    - 请求体: 无
    - 返回: {"years": [...]}（年度昇順）
      - departmentCount: 部門数（JN_DEPARTMENT_MASTER の department_id 実数）
      - personnelCount: 要員数（JN_PERSONNEL_MASTER の employee_no 実数）
      - projectCount: プロジェクト数（JN_PROJECT_MASTER の件数）
      - holidayCount: 休日数（JN_HOLIDAY_MASTER の件数）
      - weekCount: 年度内の週数（52 または 53。ISO 週）
    """
    return _get_year_summaries(db)
