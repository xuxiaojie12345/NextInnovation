import datetime
from typing import Dict, List, Optional, Tuple

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.schemas.work_status import (
    WorkStatusOut,
    WorkStatusRowIn,
    WorkStatusSaveRequest,
    WorkStatusSaveResponse,
)
from app.sql.WorkStatus_sql import (
    WORK_STATUS_DELETE_BY_YEAR,
    WORK_STATUS_INSERT,
    WORK_STATUS_SELECT_BY_YEAR,
)

# 未配分（未アサイン）の週に設定する予約プロジェクトコード
UNASSIGN = "UNASSIGN"

# 週キー（月曜日）の書式：画面・DB ともに共通
WEEK_KEY_FORMAT = "%Y-%m-%d"

# 1 週間
ONE_WEEK = datetime.timedelta(days=7)


def get_work_status_by_year(db: Session, year: str) -> List[WorkStatusOut]:
    """根据 year_id 查询稼働状況（週次アサイン）一覧。

    氏名・所属部門名・項目名は SQL 側で LEFT JOIN して名称解決済み。
    """
    rows = db.execute(WORK_STATUS_SELECT_BY_YEAR, {"year_id": year}).fetchall()
    return [WorkStatusOut(**dict(row._mapping)) for row in rows]


# ---------------------------------------------------------------------------
# 保存
# ---------------------------------------------------------------------------


def _year_mondays(year: int) -> List[datetime.date]:
    """当年度の週キー（月曜日）を列挙する。

    範囲は「1/1 を含む週 〜 12/31 を含む週」（画面の buildYearWeeks と同じ）。
    """
    first_monday = datetime.date(year, 1, 1)
    first_monday -= datetime.timedelta(days=first_monday.weekday())
    last_monday = datetime.date(year, 12, 31)
    last_monday -= datetime.timedelta(days=last_monday.weekday())

    mondays: List[datetime.date] = []
    current = first_monday
    while current <= last_monday:
        mondays.append(current)
        current += ONE_WEEK
    return mondays


def _parse_week_key(value: str, label: str) -> datetime.date:
    """'YYYY-MM-DD' を日付へ変換する（月曜以外はエラー）"""
    try:
        parsed = datetime.datetime.strptime(value, WEEK_KEY_FORMAT).date()
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"{label} の日付形式が不正です（YYYY-MM-DD で指定してください）：{value}",
        )
    if parsed.weekday() != 0:
        raise HTTPException(
            status_code=400,
            detail=f"{label} は週キー（月曜日）で指定してください：{value}",
        )
    return parsed


def _normalize_project_id(value: str) -> str:
    """画面のシステム項目ID 表記（例：pj-00001）を DB 保存値へ変換する。

    - 'UNASSIGN' は予約コードとしてそのまま保存する
    - 'pj-00001' / '00001' → '1'（DB の sys_project_id は数値文字列）
    """
    project_id = (value or "").strip()
    if not project_id:
        raise HTTPException(
            status_code=400, detail="割当のプロジェクトIDが空です。"
        )
    if project_id.upper() == UNASSIGN:
        return UNASSIGN
    if project_id.lower().startswith("pj-"):
        project_id = project_id[3:]
    return str(int(project_id)) if project_id.isdigit() else project_id


def _department_periods(
    employee_no: str,
    rows: List[WorkStatusRowIn],
    week_keys: List[str],
) -> Dict[str, str]:
    """1 社員分の rows（所属有効期間）を検証し、週キー → 所属部門ID に展開する。

    検証内容（異動データの整合性）:
      - 期間は連続している（前の行の activeTo の翌週が次の行の activeFrom）
      - 期間は重複しない
      - 先頭行は activeFrom 無し（年度初めから）、末尾行は activeTo 無し（年度末まで）
      - activeFrom / activeTo は当年度の週キー（月曜）である
    """
    week_key_set = set(week_keys)
    periods: List[Tuple[Optional[datetime.date], Optional[datetime.date], str]] = []

    for row in rows:
        start = (
            _parse_week_key(row.active_from, f"{employee_no} の activeFrom")
            if row.active_from
            else None
        )
        end = (
            _parse_week_key(row.active_to, f"{employee_no} の activeTo")
            if row.active_to
            else None
        )
        if start and start.strftime(WEEK_KEY_FORMAT) not in week_key_set:
            raise HTTPException(
                status_code=400,
                detail=f"{employee_no} の activeFrom が当年度の範囲外です：{row.active_from}",
            )
        if end and end.strftime(WEEK_KEY_FORMAT) not in week_key_set:
            raise HTTPException(
                status_code=400,
                detail=f"{employee_no} の activeTo が当年度の範囲外です：{row.active_to}",
            )
        if start and end and start > end:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{employee_no} の所属期間が不正です"
                    f"（activeFrom {row.active_from} > activeTo {row.active_to}）"
                ),
            )
        periods.append((start, end, row.department_id))

    # 開始週の昇順（activeFrom 無し = 年度初めを先頭）に並べる
    periods.sort(key=lambda p: (p[0] is not None, p[0] or datetime.date.min))

    if not periods:
        raise HTTPException(
            status_code=400, detail=f"{employee_no} の所属行がありません。"
        )
    if periods[0][0] is not None:
        raise HTTPException(
            status_code=400,
            detail=f"{employee_no} の先頭の所属行には activeFrom を指定しないでください。",
        )
    if periods[-1][1] is not None:
        raise HTTPException(
            status_code=400,
            detail=f"{employee_no} の末尾の所属行には activeTo を指定しないでください。",
        )

    for index in range(len(periods) - 1):
        current_end = periods[index][1]
        next_start = periods[index + 1][0]
        if current_end is None:
            raise HTTPException(
                status_code=400,
                detail=f"{employee_no} の所属期間が重複しています（activeTo が未指定の行が途中にあります）。",
            )
        if next_start is None:
            raise HTTPException(
                status_code=400,
                detail=f"{employee_no} の所属期間が重複しています（activeFrom が未指定の行が途中にあります）。",
            )
        if next_start != current_end + ONE_WEEK:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{employee_no} の異動期間が連続していません"
                    f"（activeTo {current_end.strftime(WEEK_KEY_FORMAT)} の翌週が"
                    f"次の activeFrom ではありません：{next_start.strftime(WEEK_KEY_FORMAT)}）"
                ),
            )

    department_by_week: Dict[str, str] = {}
    for monday in [datetime.datetime.strptime(k, WEEK_KEY_FORMAT).date() for k in week_keys]:
        for start, end, department_id in periods:
            if (start is None or start <= monday) and (end is None or monday <= end):
                department_by_week[monday.strftime(WEEK_KEY_FORMAT)] = department_id
                break
        else:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{employee_no} の所属が未設定の週があります："
                    f"{monday.strftime(WEEK_KEY_FORMAT)}"
                ),
            )
    return department_by_week


def save_work_status(
    db: Session, year: str, payload: WorkStatusSaveRequest
) -> WorkStatusSaveResponse:
    """稼働状況（週次アサイン）を保存する。

    当該年度のデータを全量置換する（削除 → 登録）。
    1 社員 × 1 週 = 1 行として、当年度の全週分を登録する。
    """
    if not year.isdigit() or len(year) != 4:
        raise HTTPException(status_code=400, detail=f"年度の指定が不正です：{year}")

    year_number = int(year)
    mondays = _year_mondays(year_number)
    week_keys = [monday.strftime(WEEK_KEY_FORMAT) for monday in mondays]

    # 社員番号ごとに所属行をまとめる
    rows_by_employee: Dict[str, List[WorkStatusRowIn]] = {}
    for row in payload.rows:
        rows_by_employee.setdefault(row.employee_no, []).append(row)

    # rows と assignment の社員は一致している必要がある
    missing_assignment = sorted(set(rows_by_employee) - set(payload.assignment))
    if missing_assignment:
        raise HTTPException(
            status_code=400,
            detail=f"割当（assignment）が無い社員がいます：{', '.join(missing_assignment)}",
        )
    missing_rows = sorted(set(payload.assignment) - set(rows_by_employee))
    if missing_rows:
        raise HTTPException(
            status_code=400,
            detail=f"所属行（rows）が無い社員がいます：{', '.join(missing_rows)}",
        )

    # 週キー → 所属部門ID（異動を考慮）
    department_by_employee = {
        employee_no: _department_periods(
            employee_no, rows, week_keys
        )
        for employee_no, rows in rows_by_employee.items()
    }

    # 全週が揃っているか検証し、DB 登録用レコードを組み立てる
    records: List[dict] = []
    required_week_keys = set(week_keys)

    for employee_no in sorted(payload.assignment):
        weeks = payload.assignment[employee_no]
        actual_week_keys = set(weeks)
        if actual_week_keys != required_week_keys:
            missing = sorted(required_week_keys - actual_week_keys)
            extra = sorted(actual_week_keys - required_week_keys)
            detail = (
                f"{employee_no} の割当（assignment）は当年度の全週を指定してください。"
            )
            if missing:
                detail += f" 不足：{', '.join(missing)}"
            if extra:
                detail += f" 範囲外：{', '.join(extra)}"
            raise HTTPException(status_code=400, detail=detail)

        unpaid_weeks = payload.unpaid.get(employee_no, {})
        unknown_unpaid = sorted(set(unpaid_weeks) - actual_week_keys)
        if unknown_unpaid:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{employee_no} の unpaid に割当の無い週が含まれています："
                    f"{', '.join(unknown_unpaid)}"
                ),
            )

        for monday, week_key in zip(mondays, week_keys):
            project_id = _normalize_project_id(weeks[week_key])
            is_unpaid = unpaid_weeks.get(week_key) is True
            if is_unpaid and project_id == UNASSIGN:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"{employee_no} の {week_key} は未配分（UNASSIGN）のため"
                        "無償支援（unpaid）を設定できません。"
                    ),
                )
            records.append(
                {
                    "version": 1,
                    "year_id": year,
                    "employee_no": employee_no,
                    "department_id": department_by_employee[employee_no][week_key],
                    "week_start_date": monday.strftime("%Y%m%d"),
                    "week_end_date": (monday + datetime.timedelta(days=6)).strftime(
                        "%Y%m%d"
                    ),
                    "sys_project_id": project_id,
                    "is_unpaid": "1" if is_unpaid else "0",
                    "register_user": "SYS",
                    "update_user": "SYS",
                }
            )

    try:
        db.execute(WORK_STATUS_DELETE_BY_YEAR, {"year_id": year})
        if records:
            db.execute(WORK_STATUS_INSERT, records)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return WorkStatusSaveResponse(code=0)
