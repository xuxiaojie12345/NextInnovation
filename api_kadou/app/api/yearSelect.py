from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.yearSelect import YearSummariesOut
from app.services.yearSelect import get_year_summaries

router = APIRouter(prefix="/api", tags=["year"])


@router.get("/year-summaries", response_model=YearSummariesOut)
def year_summaries(db: Session = Depends(get_db)) -> YearSummariesOut:
    """YearSelect 画面用：年度ごとのデータ概要を返す。"""
    return YearSummariesOut(years=get_year_summaries(db))