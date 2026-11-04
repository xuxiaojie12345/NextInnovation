"""プロジェクト管理サービス（プロジェクト管理画面用）"""
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.project import ProjectImportRequest, ProjectImportResult
from app.sql import load_sql

# 操作者が指定されない場合のフォールバック（認証情報が取れないとき用）
_DEFAULT_OP_USER = "ADMIN"
# 文字列長の上限（DB 定義に合わせる）
_MAX_SYS_PROJECT_ID = 10
_MAX_PROJECT_ID = 20
_MAX_CUSTOMER = 100
_MAX_CASE_NAME = 100
_MAX_TEAM = 30
_MAX_SUB_TEAM = 30
_MAX_PROJECT_NAME = 30
_MAX_DEPARTMENT_NAME = 20


def _row_to_project(r) -> dict:
    """SQL の1行を画面（フロントエンド）の形式へ変換する。"""
    customer = r["customer"] or ""
    case_name = r["case_name"] or ""
    team = r["team"] or ""
    sub_team = r["sub_team"] or ""
    return {
        # sys_project_id は DB 側の INT なので、画面向けに文字列化する
        "projectId": (
            None if r["sys_project_id"] is None else str(r["sys_project_id"])
        ),
        "projectCode": r["project_id"] or "",
        "customer": customer,
        "caseName": case_name,
        "team": team,
        "subTeam": sub_team,
        # 略称は要員情報と同じ規則で都度組み立てる
        # （顧客の1文字目・案件・チーム・Subチーム／未入力は連結しない）
        "abbr": build_project_abbr(customer, case_name, team, sub_team),
        "departmentId": (
            None if r["department_id"] is None else str(r["department_id"])
        ),
        "project_name": r["project_name"] or "",
    }


def _norm(value) -> str:
    """入力を前後空白除去 + 全角スペース除去した文字列にする。"""
    return "" if value is None else str(value).replace("\u3000", " ").strip()


def _check_length(data: dict) -> None:
    """DB の文字列長を超えていないか検証する（超えていれば ValueError）。"""
    limits = (
        ("customer", _MAX_CUSTOMER, "顧客"),
        ("caseName", _MAX_CASE_NAME, "案件"),
        ("team", _MAX_TEAM, "チーム"),
        ("subTeam", _MAX_SUB_TEAM, "Subチーム"),
        ("projectCode", _MAX_PROJECT_ID, "項目ID"),
        ("project_name", _MAX_PROJECT_NAME, "Project名称"),
    )
    for key, limit, label in limits:
        if len(_norm(data.get(key))) > limit:
            raise ValueError(f"{label}が {limit} 文字を超えています。")


def build_project_abbr(
    customer: str, case_name: str, team: str, sub_team: str
) -> str:
    """プロジェクトの「略称」を組み立てる（フロントエンドと同一規則）。

    顧客の1番目の文字 ＋「・」＋ 案件 ＋「・」＋ チーム ＋「・」＋ Subチーム
    ※未入力の項目は連結しない
    """
    parts = [
        _norm(customer)[:1],
        _norm(case_name),
        _norm(team),
        _norm(sub_team),
    ]
    return "・".join(p for p in parts if p != "")


def list_projects(db: Session, year_id: str) -> list[dict]:
    """指定年度のプロジェクト一覧を返す。"""
    rows = (
        db.execute(
            text(load_sql("project/projects_select.sql")), {"year_id": year_id}
        )
        .mappings()
        .all()
    )
    return [_row_to_project(r) for r in rows]


def get_project(db: Session, year_id: str, sys_project_id: str) -> dict | None:
    """年度 + システム項目IDでプロジェクトを1件取得する。"""
    row = (
        db.execute(
            text(load_sql("project/project_select.sql")),
            {"year_id": year_id, "sys_project_id": sys_project_id},
        )
        .mappings()
        .first()
    )
    return None if row is None else _row_to_project(row)


def _next_project_id(db: Session, year_id: str) -> int:
    """既存の sys_project_id の最大値 + 1 でシステム項目IDを採番する。

    jn_project_master.sys_project_id は AUTO_INCREMENT ではない INT のため、
    明示的に採番する（年度ごとの連番）。
    """
    rows = (
        db.execute(
            text(load_sql("project/project_max_id.sql")), {"year_id": year_id}
        )
        .scalars()
        .all()
    )
    nums = [int(n) for n in rows if n is not None]
    return (max(nums) if nums else 0) + 1


def project_exists(db: Session, year_id: str, sys_project_id: str) -> bool:
    """システム項目IDが存在するか。"""
    return (
        db.execute(
            text(load_sql("project/project_exists.sql")),
            {"year_id": year_id, "sys_project_id": sys_project_id},
        ).first()
        is not None
    )


def create_project(
    db: Session, year_id: str, data: dict, op_user: str = _DEFAULT_OP_USER
) -> dict:
    """プロジェクトを新規追加し、追加したプロジェクトを返す。"""
    _check_length(data)
    sys_project_id = _next_project_id(db, year_id)
    db.execute(
        text(load_sql("project/project_insert.sql")),
        {
            "year_id": year_id,
            "sys_project_id": sys_project_id,
            "customer": _norm(data.get("customer")),
            "case_name": _norm(data.get("caseName")),
            "team": _norm(data.get("team")) or None,
            "sub_team": _norm(data.get("subTeam")) or None,
            "department_id": _norm(data.get("departmentId")),
            "project_id": _norm(data.get("projectCode")) or None,
            "project_name": _norm(data.get("project_name")) or None,
            "op_user": op_user,
        },
    )
    db.commit()
    saved = get_project(db, year_id, sys_project_id)
    return saved or {
        "projectId": str(sys_project_id),
        "projectCode": data.get("projectCode") or "",
        "customer": data["customer"],
        "caseName": data["caseName"],
        "team": data.get("team") or "",
        "subTeam": data.get("subTeam") or "",
        "abbr": build_project_abbr(
            data["customer"],
            data["caseName"],
            data.get("team") or "",
            data.get("subTeam") or "",
        ),
        "departmentId": data.get("departmentId") or "",
        "project_name": data.get("project_name") or "",
    }


def update_project(
    db: Session,
    year_id: str,
    sys_project_id: str,
    data: dict,
    op_user: str = _DEFAULT_OP_USER,
) -> dict | None:
    """プロジェクトを更新する。存在しない場合は None を返す。"""
    if not project_exists(db, year_id, sys_project_id):
        return None
    _check_length(data)
    db.execute(
        text(load_sql("project/project_update.sql")),
        {
            "year_id": year_id,
            "sys_project_id": sys_project_id,
            "customer": _norm(data.get("customer")),
            "case_name": _norm(data.get("caseName")),
            "team": _norm(data.get("team")) or None,
            "sub_team": _norm(data.get("subTeam")) or None,
            "department_id": _norm(data.get("departmentId")),
            "project_id": _norm(data.get("projectCode")) or None,
            "project_name": _norm(data.get("project_name")) or None,
            "op_user": op_user,
        },
    )
    db.commit()
    return get_project(db, year_id, sys_project_id)


def delete_project(db: Session, year_id: str, sys_project_id: str) -> bool:
    """プロジェクトを削除する。削除できた場合は True を返す。"""
    res = db.execute(
        text(load_sql("project/project_delete.sql")),
        {"year_id": year_id, "sys_project_id": sys_project_id},
    )
    db.commit()
    return res.rowcount > 0


def _resolve_department_id(
    db: Session, year_id: str, department_alias: str
) -> str | None:
    """所属部門（部門別名）から部門IDを引く。特定できない場合は None を返す。

    取込ファイルの「所属部門」列は、要員情報の一括取り込みと同じく
    部門マスタの「部門別名（department_alisa）」と照合する
    （部門名 department_name ではない）。

    別名は重複し得るため、一致が 1 件に絞れたときだけ部門IDを返す。
    """
    if not department_alias:
        return None
    rows = db.execute(
        text(load_sql("project/department_by_alias.sql")),
        {"year_id": year_id, "department_alias": department_alias},
    ).scalars().all()
    return rows[0] if len(rows) == 1 else None


def _label(line: int | None) -> str:
    """警告メッセージ用の行ラベル（「3行目：」形式）。"""
    return f"{line}行目：" if line else ""


def _validate(row) -> str | None:
    """取り込み行の検証。問題があれば警告メッセージを返す。"""
    label = _label(row.line)
    if not _norm(row.customer):
        return f"{label}顧客が空欄"
    if len(_norm(row.customer)) > _MAX_CUSTOMER:
        return f"{label}顧客が {_MAX_CUSTOMER} 文字を超えています"
    if not _norm(row.caseName):
        return f"{label}案件が空欄"
    if len(_norm(row.caseName)) > _MAX_CASE_NAME:
        return f"{label}案件が {_MAX_CASE_NAME} 文字を超えています"
    if len(_norm(row.team)) > _MAX_TEAM:
        return f"{label}チームが {_MAX_TEAM} 文字を超えています"
    if len(_norm(row.subTeam)) > _MAX_SUB_TEAM:
        return f"{label}Subチームが {_MAX_SUB_TEAM} 文字を超えています"
    if len(_norm(row.department)) > _MAX_DEPARTMENT_NAME:
        return f"{label}所属部門が {_MAX_DEPARTMENT_NAME} 文字を超えています"
    if len(_norm(row.projectCode)) > _MAX_PROJECT_ID:
        return f"{label}項目IDが {_MAX_PROJECT_ID} 文字を超えています"
    if len(_norm(row.project_name)) > _MAX_PROJECT_NAME:
        return f"{label}Project名称が {_MAX_PROJECT_NAME} 文字を超えています"
    return None


def import_projects(
    db: Session,
    year_id: str,
    payload: ProjectImportRequest,
    op_user: str = _DEFAULT_OP_USER,
) -> ProjectImportResult:
    """プロジェクト情報を一括取り込みする（すべて新規追加）。

    仕様（要員情報の一括取り込みと同じ流れ）:
      - 行単位で検証し、問題のある行はスキップして警告を返す
      - dryRun=True のときは検証のみ行い、DB へは書き込まない
    """
    result = ProjectImportResult()

    # --- 1) 行単位の検証 ---
    valid_rows = []
    for row in payload.rows:
        warning = _validate(row)
        if warning is not None:
            result.warnings.append(warning)
            result.skipped += 1
            continue
        valid_rows.append(row)

    result.added = len(valid_rows)

    # --- 2) 検証のみ（dryRun）→ ここで終了 ---
    if payload.dryRun:
        return result

    # --- 3) 新規追加 ---
    for row in valid_rows:
        department_id = _resolve_department_id(db, year_id, _norm(row.department))
        if department_id is None:
            result.warnings.append(
                f"{_label(row.line)}所属部門「{_norm(row.department)}」が"
                "部門マスタの部門別名に無いため、その行は登録しませんでした"
            )
            result.skipped += 1
            result.added -= 1
            continue

        create_project(
            db,
            year_id,
            {
                "customer": _norm(row.customer),
                "caseName": _norm(row.caseName),
                "team": _norm(row.team),
                "subTeam": _norm(row.subTeam),
                "departmentId": department_id,
                "projectCode": _norm(row.projectCode),
                "project_name": _norm(row.project_name),
            },
            op_user,
        )

    return result
