from typing import Dict, List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.project import Project
from app.schemas.project import (
    ProjectCreate,
    ProjectImportResult,
    ProjectImportRow,
    ProjectImportWarning,
    ProjectOut,
    ProjectQueryOut,
)
from app.sql.Project_sql import (
    PROJECT_DELETE,
    PROJECT_INSERT,
    PROJECT_SELECT_BY_YEAR,
    PROJECT_UPDATE,
)


def build_abbr(row) -> str:
    """略称を組み立てる。

    顧客（先頭 1 文字）・案件名・チーム・Subチームを「・」で連結する。
    例: 桜井商事 / 基幹刷新 / 第一 / A → 桜・基幹刷新・第一・A
    空の項目は連結しない。
    """
    customer = row["customer"] or ""
    parts = [customer[:1], row["case_name"], row["team"], row["sub_team"]]
    return "・".join(part for part in parts if part)


def _find_project(db: Session, year: str, sys_project_id: int) -> Project:
    """主键（year_id + sys_project_id）で 1 件取得する（存在しなければ 404）"""
    project = (
        db.query(Project)
        .filter(
            Project.year_id == year,
            Project.sys_project_id == sys_project_id,
        )
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=404,
            detail=f"項目不存在: year={year}, sys_project_id={sys_project_id}",
        )
    return project


def create_project(db: Session, year: str, project: ProjectCreate) -> ProjectOut:
    """创建項目"""
    result = db.execute(
        PROJECT_INSERT,
        {
            "year_id": year,
            "customer": project.customer,
            "case_name": project.case_name,
            "team": project.team,
            "sub_team": project.sub_team,
            "department_id": project.department_id,
            # projectCode を項目ID(project_id)として保存する
            "project_id": project.project_code,
            "project_name": project.project_name,
            "register_user": "SYS",
            "update_user": "SYS",
        },
    )
    # AUTO_INCREMENT で採番されたシステム項目ID
    new_sys_project_id = result.lastrowid
    db.commit()

    # 插入后用 ORM 查回完整数据（主键为 year_id + sys_project_id 的复合主键）
    db_project = _find_project(db, year, new_sys_project_id)
    # Pydantic v2: 显式校验 ORM 对象
    return ProjectOut.model_validate(db_project)


def get_projects_by_year(db: Session, year: str) -> List[ProjectQueryOut]:
    """根据 year_id 查询項目列表（abbr は DB に列がないためここで組み立てる）"""
    rows = db.execute(PROJECT_SELECT_BY_YEAR, {"year_id": year}).fetchall()
    return [
        ProjectQueryOut(
            # システム項目ID（int）を画面用の文字列として返す
            project_id=str(mapping["sys_project_id"]),
            project_code=mapping["project_id"],
            customer=mapping["customer"],
            case_name=mapping["case_name"],
            team=mapping["team"],
            sub_team=mapping["sub_team"],
            abbr=build_abbr(mapping),
            department_id=mapping["department_id"],
            project_name=mapping["project_name"],
        )
        for mapping in (row._mapping for row in rows)
    ]


def update_project(
    db: Session, year: str, sys_project_id: int, project: ProjectCreate
) -> ProjectOut:
    """更新項目"""
    # 先查记录是否存在
    _find_project(db, year, sys_project_id)

    db.execute(
        PROJECT_UPDATE,
        {
            "year_id": year,
            "sys_project_id": sys_project_id,
            "customer": project.customer,
            "case_name": project.case_name,
            "team": project.team,
            "sub_team": project.sub_team,
            "department_id": project.department_id,
            "project_id": project.project_code,
            "project_name": project.project_name,
            "update_user": "SYS",
        },
    )
    db.commit()

    # 查回更新后的数据
    db_project = _find_project(db, year, sys_project_id)
    return ProjectOut.model_validate(db_project)


def delete_project(db: Session, year: str, sys_project_id: int) -> None:
    """删除項目"""
    # 先查记录是否存在
    _find_project(db, year, sys_project_id)

    db.execute(
        PROJECT_DELETE,
        {
            "year_id": year,
            "sys_project_id": sys_project_id,
        },
    )
    db.commit()


def import_projects(
    db: Session, year: str, rows: List[ProjectImportRow]
) -> ProjectImportResult:
    """プロジェクト一括取込。

    「所属部門」は部門名で受け取り、該当年度の部門マスタから department_id を解決して登録する。
    解決できない行（部門が空・存在しない・同名が複数）はスキップし、警告として返す。
    """
    # 部門名 → 部門ID（同名が複数ある場合は候補を複数保持する）
    dept_ids_by_name: Dict[str, List[int]] = {}
    for department in db.query(Department).filter(Department.year_id == year).all():
        dept_ids_by_name.setdefault(department.department_name, []).append(
            department.department_id
        )

    warnings: List[ProjectImportWarning] = []
    imported = 0

    for index, row in enumerate(rows, start=1):
        dept_name = (row.department or "").strip()
        candidate_ids = dept_ids_by_name.get(dept_name, [])
        if not dept_name:
            warnings.append(ProjectImportWarning(row=index, message="所属部門が空です。"))
            continue
        if not candidate_ids:
            warnings.append(
                ProjectImportWarning(
                    row=index,
                    message=f"所属部門「{dept_name}」が部門マスタに存在しません。",
                )
            )
            continue
        if len(candidate_ids) > 1:
            warnings.append(
                ProjectImportWarning(
                    row=index,
                    message=f"所属部門「{dept_name}」が同名で複数存在するため特定できません。",
                )
            )
            continue

        db.execute(
            PROJECT_INSERT,
            {
                "year_id": year,
                "customer": row.customer.strip(),
                "case_name": row.case_name.strip(),
                "team": (row.team or "").strip() or None,
                "sub_team": (row.sub_team or "").strip() or None,
                "department_id": str(candidate_ids[0]),
                "project_id": (row.project_code or "").strip(),
                "project_name": (row.name or "").strip(),
                "register_user": "SYS",
                "update_user": "SYS",
            },
        )
        imported += 1

    db.commit()
    return ProjectImportResult(
        imported=imported,
        skipped=len(warnings),
        warnings=warnings,
    )
