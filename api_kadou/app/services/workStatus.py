"""要員稼働管理サービス（要員 / 週次プロジェクト割当）"""
from datetime import datetime, timedelta

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
# 週次割当の版（全量置換保存のため常に固定）
_VERSION = "1"


def _person(name: str) -> str:
    return name or ""


def _abbr(customer: str, case_name: str, team: str, sub_team: str) -> str:
    """プロジェクト略称（顧客の先頭1文字 ＋ 案件 ＋ チーム ＋ Subチーム）"""
    parts = [p for p in (customer[:1] if customer else "", case_name, team, sub_team) if p]
    return "・".join(parts)


def _row_to_personnel(r) -> PersonnelDto:
    return PersonnelDto(
        employeeNo=r["employee_no"],
        name=r["person_name"] or "",
        departmentId=r["department_id"],
        role=r["role"] or "",
        leavePlan=r["leave_plan"],
    )


def _row_to_project(r) -> ProjectDto:
    return ProjectDto(
        projectId=r["sys_project_id"],
        projectCode=r["project_id"] or "",
        customer=r["customer"] or "",
        caseName=r["case_name"] or "",
        team=r["team"] or "",
        subTeam=r["sub_team"] or "",
        abbr=_abbr(r["customer"], r["case_name"], r["team"], r["sub_team"]),
        departmentId=r["department_id"] or "",
        name=r["project_name"] or "",
    )


def list_personnel(db: Session, year_id: int) -> list[PersonnelDto]:
    rows = db.execute(
        text(load_sql("personnel_select.sql")),
        {"year_id": str(year_id)},
    ).mappings().all()
    return [_row_to_personnel(r) for r in rows]


def search_personnel(
    db: Session, year_id: int, employee_no: str
) -> PersonnelDto | None:
    row = db.execute(
        text(load_sql("personnel_search.sql")),
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
        text(load_sql("personnel_transfer.sql")),
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

    personnel = list_personnel(db, year_id)

    dept_rows = (
        db.execute(text(load_sql("departments_select.sql")), {"year_id": year})
        .mappings()
        .all()
    )
    departments = [
        DepartmentDto(
            departmentId=r["department_id"],
            name=r["department_name"],
            location=r["location"],
            kind=r["kind"] or "dept",
        )
        for r in dept_rows
    ]

    proj_rows = (
        db.execute(text(load_sql("projects_select.sql")), {"year_id": year})
        .mappings()
        .all()
    )
    projects = [_row_to_project(r) for r in proj_rows]

    # 週次割当
    assignment: dict[str, dict[str, str | None]] = {}
    unpaid: dict[str, dict[str, bool]] = {}
    asgn_rows = (
        db.execute(text(load_sql("work_status_assignments.sql")), {"year_id": year})
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

    # 行（要員マスタの employee_no の並び。部門異動があれば 2 行になる）
    rows: list[WorkStatusRowDto] = []
    seen: dict[str, int] = {}
    for r in (
        db.execute(
            text(
                "SELECT employee_no, department_id FROM jn_personnel_master "
                "WHERE year_id = :year_id ORDER BY department_id, employee_no"
            ),
            {"year_id": year},
        )
        .mappings()
        .all()
    ):
        emp = r["employee_no"]
        n = seen.get(emp, 0)
        seen[emp] = n + 1
        key = emp if n == 0 else f"{emp}@{r['department_id']}"
        rows.append(
            WorkStatusRowDto(
                key=key,
                employeeNo=emp,
                departmentId=r["department_id"],
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
        ),
    )


def save_work_status(
    db: Session,
    year_id: int,
    req,
    op_user: str = _DEFAULT_OP_USER,
) -> WorkStatusSaveResult:
    """要員稼働データを当年全量置換で保存する（登録情報は既存行を維持する）。"""
    year = str(year_id)
    now = datetime.now()

    # 削除前に対象年度の既存登録情報をキャッシュ（(employee_no, week_start) -> 登録者/登録日時）
    existing = {}
    for r in (
        db.execute(
            text(
                "SELECT employee_no, week_start_date, register_user, register_datetime "
                "FROM jn_weekly_assignment_table WHERE year_id = :year_id"
            ),
            {"year_id": year},
        )
        .mappings()
        .all()
    ):
        existing[(r["employee_no"], r["week_start_date"])] = (
            r["register_user"],
            r["register_datetime"],
        )

    db.execute(
        text(load_sql("work_status_delete.sql")),
        {"year_id": year},
    )

    # 保存対象の週キー（割当・無償支援の両方に登場する週の和集合）
    weeks: set[str] = set()
    for emp, wkmap in req.assignment.items():
        weeks.update(wkmap.keys())
    for emp, wkmap in req.unpaid.items():
        weeks.update(wkmap.keys())
    weeks = {state: None for state in weeks}.keys()  # (型補助のため近い表現)

    insert_sql = load_sql("work_status_insert.sql")
    for row in req.rows:
        emp = row.employeeNo
        for week in weeks:
            week_start = _week_to_db(week)
            project = req.assignment.get(emp, {}).get(week)
            is_unpaid = req.unpaid.get(emp, {}).get(week) is True
            sys_id = project if project else "UNASSIGN"
            # 既存行があれば登録情報を引き継ぐ
            reg_user, reg_dt = existing.get((emp, week_start), (op_user, now))
            db.execute(
                text(insert_sql),
                {
                    "year_id": year,
                    "version": _VERSION,
                    "employee_no": emp,
                    "department_id": row.departmentId,
                    "week_start_date": week_start,
                    "week_end_date": _week_end_db(week),
                    "sys_project_id": sys_id,
                    "is_unpaid": "1" if is_unpaid else "0",
                    "register_datetime": reg_dt,
                    "register_user": reg_user,
                    "update_datetime": now,
                    "update_user": op_user,
                },
            )
    db.commit()
    return WorkStatusSaveResult(code=0)


def _db_to_week(db: str) -> str:
    """'YYYYMMDD' -> 'YYYY-MM-DD'（週キーは月曜日）"""
    y, m, d = db[:4], db[4:6], db[6:8]
    return f"{y}-{m}-{d}"


def _week_to_db(week: str) -> str:
    """'YYYY-MM-DD' -> 'YYYYMMDD'"""
    return week.replace("-", "")


def _week_end_db(week: str) -> str:
    start = datetime.strptime(week, "%Y-%m-%d")
    return (start + timedelta(days=6)).strftime("%Y%m%d")