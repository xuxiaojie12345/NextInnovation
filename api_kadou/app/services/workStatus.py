"""要員稼働管理サービス（要員 / 週次プロジェクト割当）"""
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

# 操作者が指定されない場合のフォールバック
_DEFAULT_OP_USER = "ADMIN"
# 週次割当の新規レコードの版（更新のたびに +1 する）
_VERSION = "1"


def _person(name: str) -> str:
    return name or ""


def _abbr(customer: str, case_name: str, team: str, sub_team: str) -> str:
    """プロジェクト略称（顧客の先頭1文字 ＋ 案件 ＋ チーム ＋ Subチーム）"""
    parts = [p for p in (customer[:1] if customer else "", case_name, team, sub_team) if p]
    return "・".join(parts)


def _as_str(v) -> str:
    """DB の INT などから文字列へ（設計上 departmentId 等は文字列で返す）"""
    return "" if v is None else str(v)


def _row_to_personnel(r) -> PersonnelDto:
    return PersonnelDto(
        employeeNo=r["employee_no"],
        name=r["person_name"] or "",
        departmentId=r["department_id"] if r["department_id"] is None else str(r["department_id"]),
        role=r["role"] or "",
        leavePlan=r["leave_plan"],
    )


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


def _current_personnel(rows) -> list[PersonnelDto]:
    """要員マスタの全行から「現在の所属」＝最も新しい異動日の行だけを返す。"""
    latest: dict[str, object] = {}
    for r in rows:
        emp = r["employee_no"]
        current = latest.get(emp)
        if current is None or (r["idoubi"] or "") > (current["idoubi"] or ""):
            latest[emp] = r
    return [_row_to_personnel(r) for r in latest.values()]


def _personnel_rows(db: Session, year_id: int):
    return (
        db.execute(
            text(load_sql("work_status.sql", "personnel")),
            {"year_id": str(year_id)},
        )
        .mappings()
        .all()
    )


def list_personnel(db: Session, year_id: int) -> list[PersonnelDto]:
    # 異動で複数行ある場合は「現在の所属」＝最も新しい異動日の行を返す
    return _current_personnel(_personnel_rows(db, year_id))


def search_personnel(
    db: Session, year_id: int, employee_no: str
) -> PersonnelDto | None:
    row = db.execute(
        text(load_sql("work_status.sql", "search")),
        {"year_id": str(year_id), "employee_no": employee_no},
    ).mappings().first()
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


def load_work_status(db: Session, year_id: int) -> WorkStatusLoadResponse:
    """要員稼働管理の表示データ（要員・部門・プロジェクト・週次割当）を取得する。"""
    year = str(year_id)

    # 要員マスタ全行（異動の分割行を含む）。表示行と「現在の所属」の両方に使う
    person_rows = _personnel_rows(db, year_id)
    personnel = _current_personnel(person_rows)
    master_rows_by_emp: dict[str, list] = {}
    for r in person_rows:
        master_rows_by_emp.setdefault(r["employee_no"], []).append(r)

    dept_rows = (
        db.execute(text(load_sql("work_status.sql", "departments")), {"year_id": year})
        .mappings()
        .all()
    )
    departments = [
        DepartmentDto(
            departmentId=_as_str(r["department_id"]),
            name=r["department_name"],
            location=r["location"],
            kind=r["kind"] or "dept",
        )
        for r in dept_rows
    ]

    proj_rows = (
        db.execute(text(load_sql("work_status.sql", "projects")), {"year_id": year})
        .mappings()
        .all()
    )
    projects = [_row_to_project(r) for r in proj_rows]

    # 週次割当
    assignment: dict[str, dict[str, str | None]] = {}
    unpaid: dict[str, dict[str, bool]] = {}
    versions: dict[str, dict[str, int]] = {}
    asgn_rows = (
        db.execute(text(load_sql("work_status.sql", "assignments")), {"year_id": year})
        .mappings()
        .all()
    )
    for r in asgn_rows:
        emp = r["employee_no"]
        week = _db_to_week(r["week_start_date"])
        sys_id = r["sys_project_id"]
        assignment.setdefault(emp, {})[week] = sys_id
        if r["is_unpaid"] == "1":
            unpaid.setdefault(emp, {})[week] = True
        if r["version"] is not None:
            versions.setdefault(emp, {})[week] = int(r["version"])

    # 行は「要員マスタを基準」に作る（要員情報画面で追加した要員も表示する）。
    # 異動の前後期間は、要員マスタの idoubi（異動開始日）から週キーへ換算する。
    # 旧データ（要員マスタ 1 行・週割当だけが部門変化）は週割当の変化で分割する。
    rows: list[WorkStatusRowDto] = []
    weekly_depts: dict[str, list[tuple[str, str]]] = {}
    for r in asgn_rows:
        weekly_depts.setdefault(r["employee_no"], []).append(
            (_db_to_week(r["week_start_date"]), _as_str(r["department_id"]))
        )

    # 要員マスタの現在所属（週割当の所属が空の場合の補完に使う）
    master_dept_by_emp = {p.employeeNo: p.departmentId for p in personnel}

    def _weekly_runs(emp: str) -> list[tuple[str, list[str]]]:
        runs: list[tuple[str, list[str]]] = []
        for week, dept in weekly_depts.get(emp, []):
            dept = dept or master_dept_by_emp.get(emp, "")
            if runs and runs[-1][0] == dept:
                runs[-1][1].append(week)
            else:
                runs.append((dept, [week]))
        return runs

    for emp in sorted(set(master_rows_by_emp) | set(weekly_depts)):
        master_rows = master_rows_by_emp.get(emp, [])
        # 異動あり（要員マスタに複数行）→ idoubi 昇順で期間を算出する
        if len(master_rows) >= 2:
            ordered = sorted(master_rows, key=lambda m: (m["idoubi"] or ""))
            for i, m in enumerate(ordered):
                dept = _as_str(m["department_id"])
                idoubi = m["idoubi"] or ""
                next_idoubi = (
                    ordered[i + 1]["idoubi"] or ""
                    if i + 1 < len(ordered)
                    else ""
                )
                rows.append(
                    WorkStatusRowDto(
                        key=emp if i == 0 else f"{emp}@{dept}",
                        employeeNo=emp,
                        departmentId=dept,
                        # 先頭行は年度初めから（idoubi があればその週から）
                        activeFrom=_week_of_idoubi(idoubi) or None,
                        activeTo=(
                            _prev_week(_week_of_idoubi(next_idoubi))
                            if next_idoubi
                            else None
                        ),
                    )
                )
            continue

        # 異動なし（要員マスタ 1 行、または未登録）
        runs = _weekly_runs(emp)
        if len(runs) <= 1:
            dept = (
                _as_str(master_rows[0]["department_id"]) if master_rows else ""
            ) or (runs[0][0] if runs else master_dept_by_emp.get(emp, ""))
            rows.append(
                WorkStatusRowDto(key=emp, employeeNo=emp, departmentId=dept)
            )
            continue
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


def _is_week_active(week: str, row) -> bool:
    """週キーが行の有効期間（activeFrom〜activeTo）に含まれるか。"""
    return (
        (not row.activeFrom or week >= row.activeFrom)
        and (not row.activeTo or week <= row.activeTo)
    )


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
) -> None:
    """異動の保存内容を要員マスタへ反映する。

    - 2 行以上（異動あり）: 要員マスタに「旧所属行」と「新所属行（idoubi=適用開始週）」
      の 2 行を持たせる（異動時に新所属の行を追加する）。
    - 1 行（異動なし／異動取消）: 要員マスタを 1 行へ戻し、異動フラグを解除する。
    - 行が残らない（全行削除）: 現在の所属の 1 行へ戻し、異動フラグを解除する。
    """
    current = db.execute(
        text(select_sql),
        {"year_id": year, "employee_no": employee_no},
    ).mappings().all()
    if not current:
        # 要員マスタに存在しない（週割当だけ残っている旧データ等）→ 何もしない
        return

    ordered = sorted(emp_rows, key=lambda r: r.activeFrom or "")
    if len(ordered) >= 2:
        old_department = (ordered[0].departmentId or "").strip()
        latest = ordered[-1]
        dept = (new_department or latest.departmentId or "").strip()
        if not old_department or not dept:
            return
        if dept == old_department:
            # 異動先が異動元と同じ（実質異動なし）→ 1 行へ戻す
            specs = [(dept, None, "0")]
        else:
            idoubi = _week_to_db(latest.activeFrom) if latest.activeFrom else None
            specs = [
                (old_department, None, "1"),
                (dept, idoubi, "1"),
            ]
    else:
        # 1 行（異動なし／異動取消）
        has_transfer = len(current) >= 2 or any(
            (r["idou_flag"] or "0") == "1" for r in current
        )
        if ordered:
            dept = (ordered[0].departmentId or "").strip()
        else:
            # 全行削除：現在の所属（最も新しい異動日の行）を残す
            dept = _as_str(
                sorted(current, key=lambda r: (r["idoubi"] or ""))[-1][
                    "department_id"
                ]
            )
        if not dept:
            return
        if not ordered and not has_transfer:
            # 異動がない社員の全行削除 → マスタは変更しない
            return
        specs = [(dept, None, "0")]

    def _norm(items) -> list[tuple[str, str, str]]:
        return sorted(
            (_as_str(d), i or "", f or "0") for d, i, f in items
        )

    if _norm(
        [
            (r["department_id"], r["idoubi"], r["idou_flag"])
            for r in current
        ]
    ) == _norm(specs):
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


def save_work_status(
    db: Session,
    year_id: int,
    req,
    op_user: str = _DEFAULT_OP_USER,
) -> WorkStatusSaveResult:
    """要員稼働データを保存する（1セル＝1レコード。既存行はUPDATE・無ければINSERT）。

    異動で 2 行に分割された社員は、行の有効期間ごとに週割当の所属部門IDを同期し、
    要員マスタには新所属の行を追加する（異動取消時は行を戻して異動フラグを解除する）。
    """
    year = str(year_id)
    now = datetime.now()

    insert_sql = load_sql("work_status.sql", "insert")
    update_sql = load_sql("work_status.sql", "update")
    update_department_sql = load_sql("work_status.sql", "update_department")
    personnel_of_employee_sql = load_sql(
        "work_status.sql", "personnel_of_employee"
    )
    delete_personnel_rows_sql = load_sql(
        "work_status.sql", "delete_personnel_rows"
    )
    insert_personnel_row_sql = load_sql("work_status.sql", "insert_personnel_row")

    # 当年の週キー一覧（月曜始まり）。グリッド保証・補填に使用。
    year_weeks = _year_weeks(year_id)
    first_week = _week_to_db(year_weeks[0])
    last_week = _week_to_db(year_weeks[-1])

    # 同一社員の行（異動の 2 行）をまとめて処理する
    rows_by_emp: dict[str, list] = {}
    for row in req.rows:
        emp = (row.employeeNo or "").strip()
        if not emp:
            # 社員番号が空の行がある場合は保存不可（設計 7.8）
            raise HTTPException(
                status_code=400,
                detail="社員番号が未入力の行があるため保存できません。",
            )
        rows_by_emp.setdefault(emp, []).append(row)

    # ---- 保存前チェック（設計 7.6）------------------------------------
    # 今週の月曜（異動の適用開始週の下限）。サーバー側でも同じ条件で検証する。
    today = datetime.now().date()
    current_monday = (
        today - timedelta(days=today.weekday())
    ).strftime("%Y-%m-%d")
    for emp, emp_rows in rows_by_emp.items():
        # 1 年度につき異動は 1 回まで（＝行は最大 2 行）
        if len(emp_rows) > 2:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"社員番号「{emp}」の行が2行を超えるため保存できません"
                    "（1年度につき異動は1回までです）。"
                ),
            )
        if len(emp_rows) < 2:
            continue
        # すでに保存済みの異動（idou_flag = '1' の行がある）は過去の適用開始週を持つため対象外。
        # 新規の異動だけ「適用開始週は今週の月曜以降」を検証する。
        idou_flags = db.execute(
            text(
                "SELECT idou_flag FROM jn_personnel_master "
                "WHERE year_id = :year_id AND employee_no = :employee_no"
            ),
            {"year_id": year, "employee_no": emp},
        ).scalars().all()
        if any((f or "0") == "1" for f in idou_flags):
            continue
        for r in emp_rows:
            if r.activeFrom and r.activeFrom < current_monday:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"社員番号「{emp}」の異動の適用開始週が今週の月曜より前の"
                        "ため保存できません。"
                    ),
                )

    # 変更セルを社員ごとにまとめる（その社員の処理時にだけ更新する）
    cells_by_emp: dict[str, list] = {}
    for cell in req.changedCells:
        cells_by_emp.setdefault(cell.employeeNo, []).append(cell)
    # 楽観ロックの不一致（他のユーザーが先に更新したセル）
    conflicts: list[str] = []

    # 異動で変更した要員の現在所属（保存と同一トランザクションで要員マスタへ反映する）
    dept_updates: dict[str, str] = {}
    for u in (req.departmentUpdates or []):
        no = (u.employeeNo or "").strip()
        if no and u.departmentId:
            dept_updates[no] = u.departmentId

    # 行削除・社員番号変更で業務データを消した社員は、当該年度の週次データを
    # いったん全件削除し、残った行の payload（assignment / unpaid）を反映する。
    # 「削除 → payload 反映」の順にするため、行が残る社員も対象に含める（設計 7.5 / 7.8）。
    deleted_nos: set[str] = set()
    for no in (req.deletedEmployeeNos or []):
        no = (no or "").strip()
        if not no or no in deleted_nos:
            continue
        deleted_nos.add(no)
        db.execute(
            text(
                "DELETE FROM jn_weekly_assignment_table "
                "WHERE year_id = :year_id AND employee_no = :employee_no"
            ),
            {"year_id": year, "employee_no": no},
        )

    # 対象社員ごとに「当年・全週」のグリッドを保証する（欠落週のみ INSERT する）。
    # 既存セルの一括更新は行わない（変更セルだけを後段で更新する）。
    # ただし業務データを全件削除した社員は、payload で全週を再構築する。
    for emp, emp_rows in rows_by_emp.items():
        reapply = emp in deleted_nos
        assignment_of_emp = req.assignment.get(emp) or {}
        unpaid_of_emp = req.unpaid.get(emp) or {}

        # 現存する週キー（DB格納形式 YYYYMMDD）を取得
        existing_weeks: set[str] = set()
        if not reapply:
            for r in (
                db.execute(
                    text(
                        "SELECT week_start_date FROM jn_weekly_assignment_table "
                        "WHERE year_id = :year_id AND employee_no = :employee_no"
                    ),
                    {"year_id": year, "employee_no": emp},
                )
                .mappings()
                .all()
            ):
                existing_weeks.add(r["week_start_date"])

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
            # 再構築時は payload の値（未割当 = UNASSIGN）をそのまま反映する
            sys_project_id = (
                (assignment_of_emp.get(week) or "UNASSIGN")
                if reapply
                else "UNASSIGN"
            )
            is_unpaid = "1" if reapply and unpaid_of_emp.get(week) else "0"
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

        # 画面で変更されたセルだけを更新する（1セル＝1レコード。version を +1 する）
        # version が指定されたセルは、更新前の version と一致する場合のみ更新する（楽観ロック）
        # ※全件削除して再構築した社員は payload 反映済みのため対象外
        for cell in ([] if reapply else cells_by_emp.get(emp, [])):
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
                    "sys_project_id": cell.projectId if cell.projectId else "UNASSIGN",
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

        # 行の有効期間ごとに週割当の所属部門IDを同期する
        # （異動前の週 = 旧所属、異動後の週 = 新所属）
        for r in emp_rows:
            from_week = (
                _week_to_db(r.activeFrom) if r.activeFrom else first_week
            )
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
            personnel_of_employee_sql,
            delete_personnel_rows_sql,
            insert_personnel_row_sql,
        )

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
            personnel_of_employee_sql,
            delete_personnel_rows_sql,
            insert_personnel_row_sql,
        )

    # 楽観ロックの不一致があれば、今回の保存をすべて取り消す
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


def _db_to_week(db: str) -> str:
    """'YYYYMMDD' -> 'YYYY-MM-DD'（週キーは月曜日）"""
    y, m, d = db[:4], db[4:6], db[6:8]
    return f"{y}-{m}-{d}"


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


def _week_to_db(week: str) -> str:
    """'YYYY-MM-DD' -> 'YYYYMMDD'"""
    return week.replace("-", "")


def _week_end_db(week: str) -> str:
    start = datetime.strptime(week, "%Y-%m-%d")
    return (start + timedelta(days=6)).strftime("%Y%m%d")