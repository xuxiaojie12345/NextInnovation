"""年度概要サービス（YearSelect 画面用）"""
from datetime import date, timedelta

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.sql import load_sql


def compute_week_count(year: int) -> int:
    """指定年度の週数を返す（月曜始まり）。

    フロントエンド src/data/yearWeeks.ts の buildYearWeeks と同じ計算：
    「1月1日を含む週の月曜」〜「12月31日を含む週の月曜」の間にある月曜の数。
    """
    jan1 = date(year, 1, 1)
    dec31 = date(year, 12, 31)

    def monday(d: date) -> date:
        # Python の weekday(): 月=0 ... 日=6 → 今週の月曜に戻す
        return d - timedelta(days=d.weekday())

    first_monday = monday(jan1)
    last_monday = monday(dec31)
    return ((last_monday - first_monday).days // 7) + 1


def get_year_summaries(db: Session) -> list[dict]:
    """年度ごとのデータ概要を year_summary.sql の SELECT で取得し、週数を付与する。"""
    rows = db.execute(text(load_sql("year_summary.sql"))).mappings().all()
    items = []
    for r in rows:
        year = int(r["year"])
        items.append(
            {
                "year": year,
                "departmentCount": int(r["departmentCount"] or 0),
                "personnelCount": int(r["personnelCount"] or 0),
                "projectCount": int(r["projectCount"] or 0),
                "holidayCount": int(r["holidayCount"] or 0),
                "weekCount": compute_week_count(year),
            }
        )
    return items