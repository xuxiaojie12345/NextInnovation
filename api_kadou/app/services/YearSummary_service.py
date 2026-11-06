from datetime import date
from typing import Dict

from sqlalchemy.orm import Session

from app.schemas.year_summary import YearSummary, YearSummaryList
from app.sql.YearSummary_sql import (
    SQL_COUNT_DEPARTMENTS_BY_YEAR,
    SQL_COUNT_HOLIDAYS_BY_YEAR,
    SQL_COUNT_PERSONNEL_BY_YEAR,
    SQL_COUNT_PROJECTS_BY_YEAR,
)

# サマリの対象期間（2025〜2038 年度）
START_YEAR = 2025
END_YEAR = 2038


def weeks_in_year(year: int) -> int:
    """該当年の ISO 週数（12/28 は必ずその年の最終週に属するため 52 か 53 になる）"""
    return date(year, 12, 28).isocalendar()[1]


def _count_by_year(db: Session, statement) -> Dict[int, int]:
    """year_id ごとの件数を {年度: 件数} に変換する"""
    counts: Dict[int, int] = {}
    for row in db.execute(statement).fetchall():
        year_id = row[0]
        if year_id is None:
            continue
        counts[int(year_id)] = int(row[1])
    return counts


def get_year_summaries(db: Session) -> YearSummaryList:
    """2025〜2038 年度のサマリを年度昇順で返す（データが無い年度は 0 件）"""
    department_counts = _count_by_year(db, SQL_COUNT_DEPARTMENTS_BY_YEAR)
    personnel_counts = _count_by_year(db, SQL_COUNT_PERSONNEL_BY_YEAR)
    project_counts = _count_by_year(db, SQL_COUNT_PROJECTS_BY_YEAR)
    holiday_counts = _count_by_year(db, SQL_COUNT_HOLIDAYS_BY_YEAR)

    summaries = []
    for year in range(START_YEAR, END_YEAR + 1):
        summaries.append(
            YearSummary(
                year=year,
                department_count=department_counts.get(year, 0),
                personnel_count=personnel_counts.get(year, 0),
                project_count=project_counts.get(year, 0),
                holiday_count=holiday_counts.get(year, 0),
                week_count=weeks_in_year(year),
            )
        )
    return YearSummaryList(years=summaries)
