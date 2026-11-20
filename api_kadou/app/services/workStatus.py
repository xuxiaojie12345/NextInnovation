"""要員稼働管理サービス（要員 / 週次プロジェクト割当）

このモジュールは「要員稼働管理画面」の取得・保存を担う。

  取得: load_work_status   … 要員・部門・プロジェクト・週割当・表示行
  保存: save_work_status   … 当年全量置換（異動・社員番号変更・行削除を含む）
  要員: list_personnel / search_personnel / transfer_personnel

画面・API との受け渡しは app/api/workStatus.py、
リクエスト/レスポンスの項目は app/schemas/workStatus.py を参照。

保存時の処理は「下ごしらえ → 週割当の再構築 → 要員マスタの同期」の順で行う。
各ステップは `_` 始まりの関数に切り出している（process の流れは save_work_status を参照）。
"""
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.workStatus import (
    DepartmentDto,
    PersonnelDto,
    ProjectDto,
    WorkStatusDataDto,
    WorkStatusLoadResponse,
    WorkStatusRowDto,
    WorkStatusSaveResult,
)
from app.sql import load_sql

# ============================================================
# 定数
# ============================================================
# 操作者が指定されない場合のフォールバック
_DEFAULT_OP_USER = "ADMIN"
# 週次割当の新規レコードの版（更新のたびに +1 する）
_VERSION = "1"
# 未割当を表すプロジェクトID
_UNASSIGN = "UNASSIGN"

# 保存時に使うインライン SQL（パラメータ付き）
_SQL_EXISTING_WEEKS = (
    "SELECT week_start_date FROM jn_weekly_assignment_table "
    "WHERE year_id = :year_id AND employee_no = :employee_no"
)
_SQL_DELETE_WEEKLY = (
    "DELETE FROM jn_weekly_assignment_table "
    "WHERE year_id = :year_id AND employee_no = :employee_no"
)


# ============================================================
# 1. 変換ヘルパー（DB 行 → DTO / 文字列）
# ============================================================
def _as_str(v) -> str:
    """DB の INT などから文字列へ（設計上 departmentId 等は文字列で返す）。"""
    return "" if v is None else str(v)


def _abbr(customer: str, case_name: str, team: str, sub_team: str) -> str:
    """プロジェクト略称（顧客の先頭1文字 ＋ 案件 ＋ チーム ＋ Subチーム）。"""
    parts = [
        p
        for p in (customer[:1] if customer else "", case_name, team, sub_team)
        if p
    ]
    return "・".join(parts)


def _row_to_personnel(r) -> PersonnelDto:
    return PersonnelDto(
        employeeNo=r["employee_no"],
        name=r["person_name"] or "",
        departmentId=(
            r["department_id"]
            if r["department_id"] is None
            else str(r["department_id"])
        ),
        role=r["role"] or "",
        leavePlan=r["leave_plan"],
    )


def _row_to_project(r) -> ProjectDto:
    return ProjectDto(
        projectId=_as_str(r["sys_project_id"]),
        projectCode=_as_str(r["project_id"]),
        customer=r["customer"] or "",
        caseName=r["case_name"] or "",
        team=r["team"] or "",
        subTeam=r["sub_team"] or "",
        abbr=_abbr(r["customer"], r["case_name"], r["team"], r["sub_team"]),
        departmentId=_as_str(r["department_id"]),
        name=r["project_name"] or "",
    )


# ============================================================
# 2. 週キー（月曜 'YYYY-MM-DD'）ヘルパー
# ============================================================
def _db_to_week(db: str) -> str:
    """'YYYYMMDD' -> 'YYYY-MM-DD'（週キーは月曜日）。"""
    y, m, d = db[:4], db[4:6], db[6:8]
    return f"{y}-{m}-{d}"


def _week_to_db(week: str) -> str:
    """'YYYY-MM-DD' -> 'YYYYMMDD'。"""
    return week.replace("-", "")


def _week_end_db(week: str) -> str:
    """週の月曜 'YYYY-MM-DD' -> 週の日曜 'YYYYMMDD'。"""
    start = datetime.strptime(week, "%Y-%m-%d")
    return (start + timedelta(days=6)).strftime("%Y%m%d")


def _prev_week(key: str) -> str:
    """週キー（月曜 'YYYY-MM-DD'）の前週の月曜を返す。"""
    d = datetime.strptime(key, "%Y-%m-%d")
    return (d - timedelta(days=7)).strftime("%Y-%m-%d")


def _week_of_idoubi(idoubi: str) -> str:
    """異動開始日（'YYYYMMDD'）が属する週の月曜（'YYYY-MM-DD'）を返す。"""
    v = (idoubi or "").strip()
    if len(v) != 8 or not v.isdigit():
        return ""
    d = datetime.strptime(v, "%Y%m%d")
    return (d - timedelta(days=d.weekday())).strftime("%Y-%m-%d")


def _year_weeks(year_id: int) -> list[str]:
    """指定年の週キー一覧（月曜日 'YYYY-MM-DD'）を返す。1/1 前後の週を含む。"""
    jan1 = datetime(year_id, 1, 1)
    first_monday = jan1 - timedelta(days=jan1.weekday())
    last_monday = datetime(year_id, 12, 31) - timedelta(
        days=datetime(year_id, 12, 31).weekday()
    )
    weeks: list[str] = []
    monday = first_monday
    while monday <= last_monday:
        weeks.append(monday.strftime("%Y-%m-%d"))
        monday += timedelta(days=7)
    return weeks


def _is_week_active(week: str, row) -> bool:
    """週キーが行の有効期間（activeFrom〜activeTo）に含まれるか。"""
    return (
        (not row.activeFrom or week >= row.activeFrom)
        and (not row.activeTo or week <= row.activeTo)
    )


# ============================================================
# 3. 要員マスタ（異動の分割行）の読み取り
# ============================================================
def _pick_current_row(rows):
    """要員マスタの複数行から「現在の所属」の行を選ぶ。

    異動時は「異動後の所属の行を 1 行だけ追加」し、追加した行にだけ
    idoubi（異動日）と idou_flag='1' を設定する（旧所属の行は変更しない）。
    そのため idoubi を持つ行（最も新しい異動日）が現在の所属になる。
    """
    idou_rows = [r for r in rows if (r["idoubi"] or "")]
    if idou_rows:
        return max(idou_rows, key=lambda r: r["idoubi"])
    # 異動日の無いデータ: 異動フラグ付きの行、無ければ最後の行
    flagged = [r for r in rows if (r["idou_flag"] or "0") == "1"]
    if flagged:
        return flagged[-1]
    return rows[-1]


def _current_personnel(rows) -> list[PersonnelDto]:
    """要員マスタの全行から「現在の所属」の行だけを返す。"""
    by_emp: dict[str, list] = {}
    for r in rows:
        by_emp.setdefault(r["employee_no"], []).append(r)
    return [_row_to_personnel(_pick_current_row(items)) for items in by_emp.values()]


def _personnel_rows(db: Session, year_id: int):
    return (
        db.execute(
            text(load_sql("work_status.sql", "personnel")),
            {"year_id": str(year_id)},
        )
        .mappings()
        .all()
    )


# ============================================================
# 4. 要員マスタ単体の操作（要員情報画面などから利用）
# ============================================================
def list_personnel(db: Session, year_id: int) -> list[PersonnelDto]:
    """指定年度の要員一覧（異動があれば「現在の所属」の行を返す）。"""
    return _current_personnel(_personnel_rows(db, year_id))


def search_personnel(
    db: Session, year_id: int, employee_no: str
) -> PersonnelDto | None:
    """社員番号で要員 1 件を取得する（無ければ None）。"""
    row = (
        db.execute(
            text(load_sql("work_status.sql", "search")),
            {"year_id": str(year_id), "employee_no": employee_no},
        )
        .mappings()
        .first()
    )
    return _row_to_personnel(row) if row else None


def transfer_personnel(
    db: Session,
    year_id: int,
    employee_no: str,
    department_id: str,
    op_user: str = _DEFAULT_OP_USER,
) -> PersonnelDto | None:
    """異動（所属変更）。該当要員が存在しなければ None を返す。"""
    res = db.execute(
        text(load_sql("work_status.sql", "transfer")),
        {
            "year_id": str(year_id),
            "employee_no": employee_no,
            "department_id": department_id,
            "op_user": op_user,
        },
    )
    db.commit()
    if res.rowcount == 0:
        return None
    return search_personnel(db, year_id, employee_no)


# ============================================================
# 5. 取得（GET /api/kadou/{year}/work-status）
# ============================================================
def _load_departments(db: Session, year: str) -> list[DepartmentDto]:
    rows = (
        db.execute(text(load_sql("work_status.sql", "departments")), {"year_id": year})
        .mappings()
        .all()
    )
    return [
        DepartmentDto(
            departmentId=_as_str(r["department_id"]),
            name=r["department_name"],
            location=r["location"],
            kind=r["kind"] or "dept",
        )
        for r in rows
    ]


def _load_projects(db: Session, year: str) -> list[ProjectDto]:
    rows = (
        db.execute(text(load_sql("work_status.sql", "projects")), {"year_id": year})
        .mappings()
        .all()
    )
    return [_row_to_project(r) for r in rows]


def _load_assignments(db: Session, year: str):
    """週次割当を (assignment, unpaid, versions, 元行) に展開する。"""
    assignment: dict[str, dict[str, str | None]] = {}
    unpaid: dict[str, dict[str, bool]] = {}
    versions: dict[str, dict[str, int]] = {}
    rows = (
        db.execute(text(load_sql("work_status.sql", "assignments")), {"year_id": year})
        .mappings()
        .all()
    )
    for r in rows:
        emp = r["employee_no"]
        week = _db_to_week(r["week_start_date"])
        assignment.setdefault(emp, {})[week] = r["sys_project_id"]
        if r["is_unpaid"] == "1":
            unpaid.setdefault(emp, {})[week] = True
        if r["version"] is not None:
            versions.setdefault(emp, {})[week] = int(r["version"])
    return assignment, unpaid, versions, rows


def _weekly_runs(emp, weekly_depts, master_dept_by_emp) -> list[tuple[str, list[str]]]:
    """週次割当の所属の連続区間（所属, 週リスト）にまとめる。"""
    runs: list[tuple[str, list[str]]] = []
    for week, dept in weekly_depts.get(emp, []):
        dept = dept or master_dept_by_emp.get(emp, "")
        if runs and runs[-1][0] == dept:
            runs[-1][1].append(week)
        else:
            runs.append((dept, [week]))
    return runs


def _transfer_rows(emp: str, master_rows) -> list[WorkStatusRowDto]:
    """異動あり（要員マスタ 2 行以上）の表示行（旧所属行・新所属行）。"""
    current_row = _pick_current_row(master_rows)
    others = [m for m in master_rows if m is not current_row]
    old_row = others[0] if others else current_row
    # 異動日は現在の所属の行の idoubi → 週キーへ換算
    transfer_week = _week_of_idoubi(current_row["idoubi"] or "")
    old_dept = _as_str(old_row["department_id"])
    new_dept = _as_str(current_row["department_id"])
    return [
        # 表示順は異動日の早い行（旧所属）を先にする
        WorkStatusRowDto(
            key=emp,
            employeeNo=emp,
            departmentId=old_dept,
            activeFrom=None,
            activeTo=_prev_week(transfer_week) if transfer_week else None,
            transferFlag="0",
        ),
        WorkStatusRowDto(
            key=f"{emp}@{new_dept}",
            employeeNo=emp,
            departmentId=new_dept,
            activeFrom=transfer_week or None,
            activeTo=None,
            transferFlag="1",
        ),
    ]


def _split_rows(emp: str, runs: list[tuple[str, list[str]]]) -> list[WorkStatusRowDto]:
    """週割当の所属変化で分割した表示行（旧データ用）。"""
    rows: list[WorkStatusRowDto] = []
    for i, (dept, run_weeks) in enumerate(runs):
        rows.append(
            WorkStatusRowDto(
                key=emp if i == 0 else f"{emp}@{dept}",
                employeeNo=emp,
                departmentId=dept,
                activeFrom=None if i == 0 else run_weeks[0],
                activeTo=(
                    None
                    if i == len(runs) - 1
                    else _prev_week(runs[i + 1][1][0])
                ),
            )
        )
    return rows


def _build_work_status_rows(
    master_rows_by_emp, weekly_depts, master_dept_by_emp
) -> list[WorkStatusRowDto]:
    """要員マスタを起点に、週次割当を LEFT JOIN して画面の表示行を組み立てる。

    - 要員マスタが 2 行以上（異動あり）: 旧所属行・新所属行の 2 行
    - 週次割当の所属が変化している旧データ: 変化点で分割した行
    - それ以外: 1 行
    - 週次データにしか存在しない社員（要員マスタ未登録）は表示しない
    """
    rows: list[WorkStatusRowDto] = []
    for emp in sorted(master_rows_by_emp):
        master_rows = master_rows_by_emp[emp]
        # 異動あり（要員マスタに複数行）→ 旧所属行・新所属行を判定して期間を算出する
        if len(master_rows) >= 2:
            rows.extend(_transfer_rows(emp, master_rows))
            continue

        # 異動なし（要員マスタ 1 行）
        runs = _weekly_runs(emp, weekly_depts, master_dept_by_emp)
        if len(runs) <= 1:
            dept = _as_str(master_rows[0]["department_id"]) or (
                runs[0][0] if runs else master_dept_by_emp.get(emp, "")
            )
            rows.append(WorkStatusRowDto(key=emp, employeeNo=emp, departmentId=dept))
            continue
        rows.extend(_split_rows(emp, runs))
    return rows


def load_work_status(db: Session, year_id: int) -> WorkStatusLoadResponse:
    """要員稼働管理の表示データ（要員・部門・プロジェクト・週次割当）を取得する。"""
    year = str(year_id)

    # 要員マスタ全行（異動の分割行を含む）。表示行と「現在の所属」の両方に使う
    person_rows = _personnel_rows(db, year_id)
    personnel = _current_personnel(person_rows)
    master_rows_by_emp: dict[str, list] = {}
    for r in person_rows:
        master_rows_by_emp.setdefault(r["employee_no"], []).append(r)

    departments = _load_departments(db, year)
    projects = _load_projects(db, year)
    assignment, unpaid, versions, asgn_rows = _load_assignments(db, year)

    # 要員マスタを起点にした LEFT JOIN に合わせ、週次の付随データも
    # 要員マスタ未登録（週次データだけに存在する孤児）社員のキーを除外する
    master_emps = set(master_rows_by_emp)
    assignment = {k: v for k, v in assignment.items() if k in master_emps}
    unpaid = {k: v for k, v in unpaid.items() if k in master_emps}
    versions = {k: v for k, v in versions.items() if k in master_emps}

    # 週次割当の所属（行分割の判定に使う）
    weekly_depts: dict[str, list[tuple[str, str]]] = {}
    for r in asgn_rows:
        weekly_depts.setdefault(r["employee_no"], []).append(
            (_db_to_week(r["week_start_date"]), _as_str(r["department_id"]))
        )
    # 要員マスタの現在所属（週割当の所属が空の場合の補完に使う）
    master_dept_by_emp = {p.employeeNo: p.departmentId for p in personnel}

    rows = _build_work_status_rows(
        master_rows_by_emp, weekly_depts, master_dept_by_emp
    )

    return WorkStatusLoadResponse(
        year=year_id,
        personnel=personnel,
        departments=departments,
        projects=projects,
        workStatus=WorkStatusDataDto(
            rows=rows,
            assignment=assignment,
            unpaid=unpaid,
            versions=versions,
        ),
    )


# ============================================================
# 6. 保存（PUT /api/kadou/{year}/work-status）: 補助関数
# ============================================================
def _load_save_sql() -> dict[str, str]:
    """保存で使う SQL をまとめて読み込む。"""
    return {
        "insert": load_sql("work_status.sql", "insert"),
        "update": load_sql("work_status.sql", "update"),
        "update_department": load_sql("work_status.sql", "update_department"),
        "personnel_of_employee": load_sql(
            "work_status.sql", "personnel_of_employee"
        ),
        "delete_personnel_rows": load_sql(
            "work_status.sql", "delete_personnel_rows"
        ),
        "insert_personnel_row": load_sql(
            "work_status.sql", "insert_personnel_row"
        ),
    }


def _current_monday() -> str:
    """今週の月曜（異動の適用開始週の下限・社員番号変更の操作日）。"""
    today = datetime.now().date()
    return (today - timedelta(days=today.weekday())).strftime("%Y-%m-%d")


def _group_rows_by_employee(rows) -> dict[str, list]:
    """保存リクエストの行を社員番号ごとにまとめる。

    社員番号の未入力・2 行上限・適用開始週のチェックは画面側で行うため、
    ここでは検証しない（同じチェックを前後で重複させない）。
    """
    rows_by_emp: dict[str, list] = {}
    for row in rows:
        emp = (row.employeeNo or "").strip()
        rows_by_emp.setdefault(emp, []).append(row)
    return rows_by_emp


def _parse_renumbers(req) -> list[tuple[str, str]]:
    """社員番号変更（旧番号 → 新番号）を取り出す（同一番号は除外）。"""
    renumbers: list[tuple[str, str]] = []
    for r in (req.renumbers or []):
        frm = (r.fromNo or "").strip()
        to = (r.toNo or "").strip()
        if frm and to and frm != to:
            renumbers.append((frm, to))
    return renumbers


def _validate_renumbers(
    db: Session, year: str, renumbers: list[tuple[str, str]], current_monday: str
) -> None:
    """社員番号変更の可否（設計 7.x）。

    旧番号・新番号とも「操作日（今週の月曜）より前」に割当・BUFFER が無いこと。
    """
    count_before_sql = load_sql("work_status.sql", "count_work_before")
    for frm, to in renumbers:
        for no in (frm, to):
            cnt = db.execute(
                text(count_before_sql),
                {
                    "year_id": year,
                    "employee_no": no,
                    "before_week": _week_to_db(current_monday),
                },
            ).scalar()
            if cnt and int(cnt) > 0:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"社員番号「{no}」は操作日より前に割当・BUFFERが登録されて"
                        "いるため、社員番号を変更できません。"
                    ),
                )


def _delete_weekly_of_deleted(
    db: Session, year: str, deleted_employee_nos, renamed_from: set[str]
) -> set[str]:
    """行削除・社員番号変更で業務データを消した社員の週次データを削除する。

    社員番号変更の旧番号は削除せず UNASSIGN に戻すため、対象から除外する。
    戻り値: 実際に削除した社員番号の集合。
    """
    deleted_nos: set[str] = set()
    for no in (deleted_employee_nos or []):
        no = (no or "").strip()
        if not no or no in deleted_nos:
            continue
        if no in renamed_from:
            # 社員番号変更の旧番号は削除しない（保存時に UNASSIGN へ戻す）
            continue
        deleted_nos.add(no)
        db.execute(
            text(_SQL_DELETE_WEEKLY),
            {"year_id": year, "employee_no": no},
        )
    return deleted_nos


def _existing_weeks(db: Session, year: str, employee_no: str) -> set[str]:
    """その社員の週次データに既に存在する週キー（DB格納形式 YYYYMMDD）。"""
    rows = db.execute(
        text(_SQL_EXISTING_WEEKS),
        {"year_id": year, "employee_no": employee_no},
    ).mappings().all()
    return {r["week_start_date"] for r in rows}


def _rebuild_missing_weeks(
    db: Session,
    year: str,
    emp: str,
    emp_rows,
    year_weeks: list[str],
    existing_weeks: set[str],
    reapply: bool,
    assignment_of_emp: dict,
    unpaid_of_emp: dict,
    insert_sql: str,
    now: datetime,
    op_user: str,
) -> None:
    """当年・全週のうち欠落している週を INSERT する。

    通常は UNASSIGN で保証するだけ。全件削除した社員（reapply）は payload の
    値（割当・BUFFER）で再構築する。
    """
    for week in year_weeks:
        week_start = _week_to_db(week)
        if week_start in existing_weeks:
            continue
        # その週を含む行（異動前後の期間）。無ければその週は対象外
        active_row = next(
            (r for r in emp_rows if _is_week_active(week, r)), None
        )
        if active_row is None:
            continue
        if reapply:
            sys_project_id = assignment_of_emp.get(week) or _UNASSIGN
            is_unpaid = "1" if unpaid_of_emp.get(week) else "0"
        else:
            sys_project_id = _UNASSIGN
            is_unpaid = "0"
        db.execute(
            text(insert_sql),
            {
                "year_id": year,
                "version": _VERSION,
                "employee_no": emp,
                "department_id": active_row.departmentId,
                "week_start_date": week_start,
                "week_end_date": _week_end_db(week),
                "sys_project_id": sys_project_id,
                "is_unpaid": is_unpaid,
                "register_datetime": now,
                "register_user": op_user,
                "update_datetime": now,
                "update_user": op_user,
            },
        )
        existing_weeks.add(week_start)


def _apply_changed_cells(
    db: Session,
    year: str,
    emp: str,
    emp_rows,
    cells,
    update_sql: str,
    insert_sql: str,
    conflicts: list[str],
    now: datetime,
    op_user: str,
) -> None:
    """画面で変更されたセルだけを更新する（1セル＝1レコード）。

    version が指定されたセルは、更新前の version と一致する場合のみ更新する
    （楽観ロック）。一致しなければ conflicts に積む（保存全体を取り消す）。
    """
    for cell in cells:
        week = cell.weekKey
        active_row = next(
            (r for r in emp_rows if _is_week_active(week, r)), None
        )
        if active_row is None:
            continue
        res = db.execute(
            text(update_sql),
            {
                "year_id": year,
                "employee_no": emp,
                "week_start_date": _week_to_db(week),
                "sys_project_id": cell.projectId if cell.projectId else _UNASSIGN,
                "is_unpaid": "1" if cell.isUnpaid else "0",
                "expected_version": cell.version,
                "update_datetime": now,
                "update_user": op_user,
            },
        )
        if res.rowcount > 0:
            continue
        if cell.version is not None:
            # 他のユーザーが先に更新した（版が一致しない）
            conflicts.append(f"{emp}/{week}")
            continue
        # レコードが無いセル（新規）は、値がある場合だけ追加する
        if cell.projectId or cell.isUnpaid:
            db.execute(
                text(insert_sql),
                {
                    "year_id": year,
                    "version": _VERSION,
                    "employee_no": emp,
                    "department_id": active_row.departmentId,
                    "week_start_date": _week_to_db(week),
                    "week_end_date": _week_end_db(week),
                    "sys_project_id": cell.projectId,
                    "is_unpaid": "1" if cell.isUnpaid else "0",
                    "register_datetime": now,
                    "register_user": op_user,
                    "update_datetime": now,
                    "update_user": op_user,
                },
            )


def _sync_week_departments(
    db: Session,
    year: str,
    emp: str,
    emp_rows,
    update_department_sql: str,
    first_week: str,
    last_week: str,
    now: datetime,
    op_user: str,
) -> None:
    """行の有効期間ごとに週割当の所属部門IDを同期する。

    （異動前の週 = 旧所属、異動後の週 = 新所属）
    """
    for r in emp_rows:
        from_week = _week_to_db(r.activeFrom) if r.activeFrom else first_week
        to_week = _week_to_db(r.activeTo) if r.activeTo else last_week
        db.execute(
            text(update_department_sql),
            {
                "year_id": year,
                "employee_no": emp,
                "department_id": r.departmentId,
                "from_week": from_week,
                "to_week": to_week,
                "update_datetime": now,
                "update_user": op_user,
            },
        )


def _clear_renamed_assignments(
    db: Session, year: str, renumbers: list[tuple[str, str]], now: datetime, op_user: str
) -> None:
    """社員番号変更の旧番号：週次データは削除せず UNASSIGN に戻す。

    （要員マスタは変更しない）新番号と同じ保存で処理されるため、
    行の反映後に実行して「旧番号は空・新番号に旧番号の内容」を確定させる。
    """
    if not renumbers:
        return
    clear_assignments_sql = load_sql("work_status.sql", "clear_assignments")
    for frm, _to in renumbers:
        db.execute(
            text(clear_assignments_sql),
            {
                "year_id": year,
                "employee_no": frm,
                "update_datetime": now,
                "update_user": op_user,
            },
        )


# ============================================================
# 7. 要員マスタ（異動・社員番号変更）の同期
# ============================================================
def _norm_personnel_row(department_id, idoubi, idou_flag) -> tuple[str, str, str]:
    return (_as_str(department_id), idoubi or "", idou_flag or "0")


def _personnel_rows_match(current, specs) -> bool:
    """DB の要員行と作り直し後の specs が同じ状態か（無駄な書き換えを防ぐ）。"""
    left = sorted(
        _norm_personnel_row(r["department_id"], r["idoubi"], r["idou_flag"])
        for r in current
    )
    right = sorted(_norm_personnel_row(d, i, f) for d, i, f in specs)
    return left == right


def _personnel_transfer_specs(ordered, current, new_department, is_renumber_target):
    """画面の行（ordered）から、要員マスタに持たせる行の構成（specs）を決める。

    戻り値は (department_id, idoubi, idou_flag) の並び。None は「変更しない」。
    - 2 行以上（異動あり）: 旧所属行＋異動後の所属行
    - 1 行（異動なし／取消）: 現在の所属 1 行、または異動歴を残したまま所属差し替え
    """
    if len(ordered) >= 2:
        # 開始週の早い行が旧所属、遅い行が新所属（画面の表示順と同じ）
        old_department = (ordered[0].departmentId or "").strip()
        latest = ordered[-1]
        dept = (new_department or latest.departmentId or "").strip()
        if not old_department or not dept:
            return None
        if dept == old_department:
            # 異動先が異動元と同じ（実質異動なし）→ 異動で追加した行を残さない
            return [(dept, None, "0")]
        if is_renumber_target:
            # 社員番号変更：画面の 2 行（旧所属・新所属）をそのまま移植する
            idoubi = _week_to_db(latest.activeFrom) if latest.activeFrom else None
            return [(old_department, None, "0"), (dept, idoubi, "1")]
        idoubi = _week_to_db(latest.activeFrom) if latest.activeFrom else None
        # 旧所属の行は異動フラグ・異動日を変更せずにそのまま残す
        old_row = next(
            (r for r in current if _as_str(r["department_id"]) != dept), None
        )
        keep = (
            (
                _as_str(old_row["department_id"]),
                old_row["idoubi"] or None,
                old_row["idou_flag"] or "0",
            )
            if old_row is not None
            else (old_department, None, "0")
        )
        # 異動後の所属の行を 1 行だけ追加する（異動日・異動フラグ='1'）
        return [keep, (dept, idoubi, "1")]

    # 1 行（異動なし／異動取消）
    if ordered:
        dept = (ordered[0].departmentId or "").strip()
    else:
        # 全行削除：現在の所属（異動で追加した行）を残す
        dept = _as_str(_pick_current_row(current)["department_id"])
    if not dept:
        return None
    if len(current) < 2:
        # 異動の記録がない → 所属が変わった場合だけ所属を更新する
        # （社員番号変更で旧番号の所属を引き継ぐケース。異動フラグ・異動日は変えない）
        kept = current[0]
        if _as_str(kept["department_id"]) == dept:
            return None
        return [(dept, kept["idoubi"] or None, kept["idou_flag"] or "0")]
    if is_renumber_target:
        # 異動歴のある新番号：現在の所属の行だけ所属を差し替える（異動歴は残す）
        cur = _pick_current_row(current)
        if _as_str(cur["department_id"]) == dept:
            return None
        return [
            (
                dept if r is cur else _as_str(r["department_id"]),
                r["idoubi"] or None,
                r["idou_flag"] or "0",
            )
            for r in current
        ]
    # 異動の 2 行が 1 行に減った → 残った行の異動フラグを解除する
    return [(dept, None, "0")]


def _sync_personnel_transfer(
    db: Session,
    year: str,
    employee_no: str,
    emp_rows: list,
    new_department: str | None,
    now: datetime,
    op_user: str,
    select_sql: str,
    delete_sql: str,
    insert_sql: str,
    is_renumber_target: bool = False,
) -> None:
    """異動・社員番号変更の保存内容を要員マスタへ反映する。

    - 2 行以上（異動あり）: 既存の旧所属の行はそのまま残し、
      異動後の所属の行を 1 行だけ追加する（追加行に idoubi=異動日・idou_flag='1'）。
    - 1 行（異動なし／異動取消）: 異動の 2 行が 1 行に減った場合は、
      残った行の idou_flag を '0' に戻す（異動日の解除）。
      異動の記録がない場合は所属だけを更新する（社員番号変更で所属を引き継ぐケース）。
    - 行が残らない（全行削除）: 現在の所属の 1 行へ戻し、異動フラグを解除する。
    - is_renumber_target: 社員番号変更の新番号。画面の行（旧所属・新所属）を
      そのまま要員マスタへ移植する（既存の異動状態は引き継がない）。
    """
    current = db.execute(
        text(select_sql),
        {"year_id": year, "employee_no": employee_no},
    ).mappings().all()
    if not current:
        # 要員マスタに存在しない（週割当だけ残っている旧データ等）→ 何もしない
        return

    ordered = sorted(emp_rows, key=lambda r: r.activeFrom or "")
    specs = _personnel_transfer_specs(
        ordered, current, new_department, is_renumber_target
    )
    if specs is None:
        return
    if _personnel_rows_match(current, specs):
        # 既に同じ状態（毎回の保存で不要な書き換えをしない）
        return

    base = current[0]
    db.execute(
        text(delete_sql),
        {"year_id": year, "employee_no": employee_no},
    )
    for idx, (dept, idoubi, idou_flag) in enumerate(specs):
        db.execute(
            text(insert_sql),
            {
                "year_id": year,
                "employee_no": employee_no,
                "department_id": dept,
                "idou_flag": idou_flag,
                "idoubi": idoubi,
                "person_name": base["person_name"],
                "role": base["role"],
                "leave_plan": base["leave_plan"],
                "register_datetime": base["register_datetime"] if idx == 0 else now,
                "register_user": base["register_user"] if idx == 0 else op_user,
                "now_dt": now,
                "op_user": op_user,
            },
        )


# ============================================================
# 8. 保存（PUT /api/kadou/{year}/work-status）
# ============================================================
def save_work_status(
    db: Session,
    year_id: int,
    req,
    op_user: str = _DEFAULT_OP_USER,
) -> WorkStatusSaveResult:
    """要員稼働データを保存する（1セル＝1レコード。既存行はUPDATE・無ければINSERT）。

    処理の流れ:
      1. 入力の下ごしらえ（行のグルーピング・保存前チェック）
      2. 社員番号変更・行削除の判定
      3. 社員ごとに週割当を再構築（欠落週の保証・変更セルの更新・所属同期）
      4. 要員マスタの同期（異動・社員番号変更・行削除）
      5. 競合が無ければ確定（commit）
    """
    year = str(year_id)
    now = datetime.now()
    sql = _load_save_sql()

    # 当年の週キー一覧（月曜始まり）。グリッド保証・補填に使用。
    year_weeks = _year_weeks(year_id)
    first_week = _week_to_db(year_weeks[0])
    last_week = _week_to_db(year_weeks[-1])

    # ---- 1. 入力の下ごしらえ ----------------------------------------
    # ※入力値そのもののチェック（未入力・2 行上限・開始週）は画面側で実施済み
    rows_by_emp = _group_rows_by_employee(req.rows)
    current_monday = _current_monday()

    # 変更セルを社員ごとにまとめる（その社員の処理時にだけ更新する）
    cells_by_emp: dict[str, list] = {}
    for cell in req.changedCells:
        cells_by_emp.setdefault(cell.employeeNo, []).append(cell)
    # 楽観ロックの不一致（他のユーザーが先に更新したセル）
    conflicts: list[str] = []

    # 異動で変更した要員の現在所属（保存と同一トランザクションで要員マスタへ反映）
    dept_updates: dict[str, str] = {}
    for u in (req.departmentUpdates or []):
        no = (u.employeeNo or "").strip()
        if no and u.departmentId:
            dept_updates[no] = u.departmentId

    # ---- 2. 社員番号変更・行削除の判定 ------------------------------
    renumbers = _parse_renumbers(req)
    renamed_from = {frm for frm, _to in renumbers}
    renumber_targets = {to for _frm, to in renumbers}
    _validate_renumbers(db, year, renumbers, current_monday)

    # 行削除・社員番号変更で業務データを消した社員は、当該年度の週次データを
    # いったん全件削除し、残った行の payload（assignment / unpaid）を反映する。
    # 「削除 → payload 反映」の順にするため、行が残る社員も対象に含める（設計 7.5 / 7.8）。
    deleted_nos = _delete_weekly_of_deleted(
        db, year, req.deletedEmployeeNos, renamed_from
    )

    # ---- 3. 社員ごとに週割当を再構築 --------------------------------
    for emp, emp_rows in rows_by_emp.items():
        reapply = emp in deleted_nos
        # 全件削除した社員は既存週を無視して payload で全週を作り直す
        existing_weeks: set[str] = (
            set() if reapply else _existing_weeks(db, year, emp)
        )
        _rebuild_missing_weeks(
            db,
            year,
            emp,
            emp_rows,
            year_weeks,
            existing_weeks,
            reapply,
            req.assignment.get(emp) or {},
            req.unpaid.get(emp) or {},
            sql["insert"],
            now,
            op_user,
        )
        # ※全件削除して再構築した社員は payload 反映済みのため対象外
        if not reapply:
            _apply_changed_cells(
                db,
                year,
                emp,
                emp_rows,
                cells_by_emp.get(emp, []),
                sql["update"],
                sql["insert"],
                conflicts,
                now,
                op_user,
            )
        # 行の有効期間ごとに週割当の所属部門IDを同期する
        _sync_week_departments(
            db,
            year,
            emp,
            emp_rows,
            sql["update_department"],
            first_week,
            last_week,
            now,
            op_user,
        )
        # 異動（2 行以上）→ 要員マスタに新所属の行を追加する。
        # 1 行（異動なし／異動取消）→ 要員マスタを 1 行に戻し、異動フラグを解除する。
        _sync_personnel_transfer(
            db,
            year,
            emp,
            emp_rows,
            dept_updates.get(emp),
            now,
            op_user,
            sql["personnel_of_employee"],
            sql["delete_personnel_rows"],
            sql["insert_personnel_row"],
            # 社員番号変更の新番号は、画面の行（旧所属・新所属）をそのまま移植する
            is_renumber_target=emp in renumber_targets,
        )

    # ---- 4. 要員マスタの同期（社員番号変更の旧番号・全行削除）----------
    # 社員番号変更の旧番号：週次データは削除せず UNASSIGN に戻す（要員マスタは変更しない）
    _clear_renamed_assignments(db, year, renumbers, now, op_user)

    # 行削除で画面から全ての行が無くなった社員は、異動フラグを解除して
    # 要員マスタを 1 行（現在の所属）へ戻す。要員マスタ自体は削除しない（設計 7.9）。
    # （週次データは冒頭の「削除 → payload 反映」で削除済み）
    for no in deleted_nos:
        if no in rows_by_emp:
            # 一部の行だけ削除された社員（異動取消）→ 上の処理で反映済み
            continue
        _sync_personnel_transfer(
            db,
            year,
            no,
            [],
            None,
            now,
            op_user,
            sql["personnel_of_employee"],
            sql["delete_personnel_rows"],
            sql["insert_personnel_row"],
        )

    # ---- 5. 確定（楽観ロックの不一致があれば全て取り消す）------------
    if conflicts:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                "他のユーザーが同じデータを更新したため保存できませんでした。"
                "最新のデータを再読み込みしてから、もう一度保存してください。"
            ),
        )

    db.commit()
    return WorkStatusSaveResult(code=0)
