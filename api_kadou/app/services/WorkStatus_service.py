import datetime
from typing import Dict, List, Optional, Tuple

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.user import normalize_user_id
from app.schemas.work_status import (
    TransferRequest,
    TransferResponse,
    WorkStatusOut,
    WorkStatusRowIn,
    WorkStatusSaveRequest,
    WorkStatusSaveResponse,
)
from app.services.Personnel_service import (
    get_dept_name,
    get_personnel_by_emp_no,
    to_database_department_id,
)
from app.sql.Personnel_sql import (
    SQL_COUNT_PERSONNEL_IDOU,
    SQL_INSERT_JN_PERSONNEL_MASTER,
    SQL_UPDATE_PERSONNEL_IDOU,
)
from app.sql.WorkStatus_sql import (
    WORK_STATUS_COUNT_BY_EMPLOYEE,
    WORK_STATUS_DELETE_BY_EMPLOYEES,
    WORK_STATUS_INSERT,
    WORK_STATUS_SELECT_BY_YEAR,
    WORK_STATUS_UPDATE_BY_WEEK,
    WORK_STATUS_UPDATE_DEPARTMENT_FROM_WEEK,
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

    画面で変更された「週のセル」だけを登録・更新する（部分更新）。
    - 通常の変更: 指定された週の行だけを更新する（行が無ければ登録する）
      同じ社員の他の週のデータには触れない
    - 行削除・社員番号変更（deletedEmployeeNos）: 当該社員の当年度データを
      削除してから、指定された週の行を登録し直す
    """
    if not year.isdigit() or len(year) != 4:
        raise HTTPException(status_code=400, detail=f"年度の指定が不正です：{year}")

    year_number = int(year)
    mondays = _year_mondays(year_number)
    week_keys = [monday.strftime(WEEK_KEY_FORMAT) for monday in mondays]
    monday_by_week = dict(zip(week_keys, mondays))

    # 社員番号ごとに所属行をまとめる
    rows_by_employee: Dict[str, List[WorkStatusRowIn]] = {}
    for row in payload.rows:
        rows_by_employee.setdefault(row.employee_no, []).append(row)

    # 割当（assignment）を送る社員には所属行が必要
    missing_rows = sorted(set(payload.assignment) - set(rows_by_employee))
    if missing_rows:
        raise HTTPException(
            status_code=400,
            detail=f"所属行（rows）が無い社員がいます：{', '.join(missing_rows)}",
        )

    # 週キー → 所属部門ID（異動を考慮）
    department_by_employee = {
        employee_no: _department_periods(employee_no, employee_rows, week_keys)
        for employee_no, employee_rows in rows_by_employee.items()
        if employee_no in payload.assignment
    }

    deleted_employees = set(payload.deleted_employee_nos)

    # 部分更新用（通常の変更）と再登録用（行削除・社員番号変更）を分ける
    update_records: List[dict] = []
    rebuild_records: List[dict] = []

    for employee_no in sorted(payload.assignment):
        weeks = payload.assignment[employee_no]
        if not weeks:
            continue
        # 指定された週キーが当年度の週（月曜）であることを検証する
        invalid_week_keys = sorted(set(weeks) - set(week_keys))
        if invalid_week_keys:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{employee_no} の週キーが当年度の範囲外です："
                    f"{', '.join(invalid_week_keys)}"
                ),
            )

        unpaid_weeks = payload.unpaid.get(employee_no, {})
        unknown_unpaid = sorted(set(unpaid_weeks) - set(weeks))
        if unknown_unpaid:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{employee_no} の unpaid に更新対象外の週が含まれています："
                    f"{', '.join(unknown_unpaid)}"
                ),
            )

        target_records = (
            rebuild_records if employee_no in deleted_employees else update_records
        )
        for week_key in sorted(weeks):
            monday = monday_by_week[week_key]
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
            target_records.append(
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
        # 行削除・社員番号変更の社員は当該年度データを削除して登録し直す
        if deleted_employees:
            db.execute(
                WORK_STATUS_DELETE_BY_EMPLOYEES,
                {"year_id": year, "employee_nos": sorted(deleted_employees)},
            )
        if rebuild_records:
            db.execute(WORK_STATUS_INSERT, rebuild_records)
        # 通常の変更は、指定された週の行だけを更新する（行が無ければ登録する）
        for record in update_records:
            result = db.execute(WORK_STATUS_UPDATE_BY_WEEK, record)
            if result.rowcount == 0:
                db.execute(WORK_STATUS_INSERT, [record])
        db.commit()
    except Exception:
        db.rollback()
        raise

    return WorkStatusSaveResponse(code=0)


def transfer_employee(
    db: Session, year: str, payload: TransferRequest, user_id: str
) -> TransferResponse:
    """所属変更（異動）を確定する。

    1 トランザクションで以下を行う:
      1. 要員マスタの元レコードに 異動フラグ(idou_flag='1')・異動開始日(idoubi) を設定
      2. 要員マスタに新しい所属部門のレコードを追加（氏名・役割・退場予定は元を引き継ぐ）
      3. 週次アサイン（jn_weekly_assignment_table）の「適用開始週」以降の
         所属部門ID を新しい部門へ更新する（割当・BUFFER は変更しない）
      4. 週次アサインが 1 件も無い要員は、適用開始週で所属を分割した
         週次レコード（未配分）を新規登録する
    """
    if not year.isdigit() or len(year) != 4:
        raise HTTPException(status_code=400, detail=f"年度の指定が不正です：{year}")
    year_number = int(year)

    # 適用開始週は当年度の週キー（月曜）であること
    monday = _parse_week_key(payload.transfer_week_key, "適用開始週")
    if monday not in _year_mondays(year_number):
        raise HTTPException(
            status_code=400,
            detail=f"適用開始週が当年度の範囲外です：{payload.transfer_week_key}",
        )

    employee_no = payload.employee_no
    new_dept_id_str = payload.new_department_id
    new_dept_id = to_database_department_id(new_dept_id_str)
    if new_dept_id <= 0:
        raise HTTPException(status_code=400, detail="新しい所属部門を選択してください。")
    if not get_dept_name(db, year_number, str(new_dept_id)):
        raise HTTPException(
            status_code=400,
            detail="選択された所属は当年度の部門マスタに存在しません。",
        )

    # 元の要員レコード
    person = get_personnel_by_emp_no(db, year_number, employee_no)
    if not person:
        raise HTTPException(
            status_code=400,
            detail=f"社員番号「{employee_no}」は要員マスタに存在しません。",
        )

    # 同一社員は 1 年度につき 1 回まで（既に異動済みなら拒否）
    idou_count = db.execute(
        SQL_COUNT_PERSONNEL_IDOU, {"year": year_number, "employeeNo": employee_no}
    ).scalar()
    if idou_count:
        raise HTTPException(
            status_code=400,
            detail=f"{employee_no} は既に異動済みです（1年度につき異動は1回までです）。",
        )

    old_dept_id = to_database_department_id(person["departmentId"])
    if old_dept_id == new_dept_id:
        raise HTTPException(
            status_code=400, detail="新しい所属が現在の所属と同じです。"
        )

    now = datetime.datetime.now()
    operator = normalize_user_id(user_id)
    idoubi = monday.strftime("%Y%m%d")  # 異動開始日（idoubi は varchar(8)）
    from_week = idoubi  # weekly.week_start_date は 'YYYYMMDD'

    try:
        # 1. 元レコードに異動フラグ・異動開始日を設定
        db.execute(
            SQL_UPDATE_PERSONNEL_IDOU,
            {
                "year": year_number,
                "employeeNo": employee_no,
                "oldDepartmentId": old_dept_id,
                "idoubi": idoubi,
                "updateDatetime": now,
                "updateUser": operator,
            },
        )
        # 2. 新しい所属部門のレコードを追加
        db.execute(
            SQL_INSERT_JN_PERSONNEL_MASTER,
            [
                {
                    "year": year_number,
                    "employeeNo": employee_no,
                    "departmentId": new_dept_id,
                    "idouFlag": "0",
                    "idoubi": idoubi,
                    "personName": person["name"],
                    "role": person["role"],
                    "leavePlan": person.get("leavePlan") or "",
                    "registerDatetime": now,
                    "registerUser": operator,
                    "updateDatetime": now,
                    "updateUser": operator,
                }
            ],
        )
        # 3. 適用開始週以降の週次レコードの所属部門を更新
        db.execute(
            WORK_STATUS_UPDATE_DEPARTMENT_FROM_WEEK,
            {
                "year_id": year,
                "employee_no": employee_no,
                "new_department_id": new_dept_id_str,
                "from_week": from_week,
                "update_user": operator,
            },
        )
        # 4. 週次データが 1 件も無い要員は、適用開始週で所属を分割した
        #    週次レコードを新規登録する（開始週の前週までは元所属、開始週から新所属）
        weekly_count = db.execute(
            WORK_STATUS_COUNT_BY_EMPLOYEE,
            {"year_id": year, "employee_no": employee_no},
        ).scalar()
        if not weekly_count:
            old_dept_id_str = str(old_dept_id)
            records = []
            for week_monday in _year_mondays(year_number):
                records.append(
                    {
                        "version": 1,
                        "year_id": year,
                        "employee_no": employee_no,
                        "department_id": (
                            new_dept_id_str
                            if week_monday >= monday
                            else old_dept_id_str
                        ),
                        "week_start_date": week_monday.strftime("%Y%m%d"),
                        "week_end_date": (week_monday + ONE_WEEK - datetime.timedelta(days=1)).strftime(
                            "%Y%m%d"
                        ),
                        "sys_project_id": UNASSIGN,
                        "is_unpaid": "0",
                        "register_user": operator,
                        "update_user": operator,
                    }
                )
            db.execute(WORK_STATUS_INSERT, records)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return TransferResponse(code=0)
