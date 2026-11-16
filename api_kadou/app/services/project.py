"""プロジェクト管理サービス（プロジェクト管理画面用）

NOTE: api 層（app/api/project.py）は「Web 側データの受け取り／返却」だけを担当し、
      入力チェック・存在確認・業務エラーの生成は本モジュールに集約する
      （要員情報 app/services/personnel.py と同じ方針）。
"""
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.audit import system_now
from app.core.errors import BusinessException
from app.schemas.project import (
    ProjectDeleteResult,
    ProjectImportRequest,
    ProjectImportResult,
    ProjectSaveRequest,
)
from app.sql import load_sql

# 操作者が指定されない場合のフォールバック（認証情報が取れないとき用）
_DEFAULT_OP_USER = "ADMIN"

# チーム / Subチーム は任意入力のため、未入力時は DB へ "-" を登録する
# （空欄同士を同一とみなすため、NULL ではなく固定値にする）
_EMPTY_TEAM = "-"

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
        # DB は varchar(1) のため '1' / '0'（NULL は既定値に倒す）
        "validFlg": _to_flag(r.get("valid_flg"), True),
        "educationFlg": _to_flag(r.get("education_flg"), False),
    }


def _to_flag(value, default: bool) -> bool:
    """DB の有効/教育フラグ（'1'/1/True など）を真偽値へ変換する。"""
    if value is None or value == "":
        return default
    if isinstance(value, str):
        return value.strip() not in ("0", "", "false", "False")
    return bool(value)


def _flag_value(value, default: bool) -> str:
    """登録・更新用に '1' / '0' へ変換する（列は varchar(1)）。"""
    if value is None:
        value = default
    return "1" if bool(value) else "0"


def _norm(value) -> str:
    """入力を前後空白除去 + 全角スペース除去した文字列にする。

    NOTE: 全角/半角・大文字/小文字は区別する（小文字化は行わない）。
    """
    return "" if value is None else str(value).replace("\u3000", " ").strip()


def _team_norm(value) -> str:
    """チーム / Subチーム 用の正規化（未入力は "-" にする）。"""
    return _norm(value) or _EMPTY_TEAM


def _key_norm(value) -> str:
    """重複判定（一意制約）用の正規化。

    比較時は前後空白のみ除去する（全角/半角・大文字/小文字は区別する）。
    チーム / Subチーム は未入力を "-" として扱うため、空欄同士は同一とみなす。
    """
    return _norm(value)


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
    ※未入力の項目は連結しない（"-" は未入力として扱う）
    """

    def part(value) -> str:
        text_value = _norm(value)
        return "" if text_value == _EMPTY_TEAM else text_value

    parts = [
        part(customer)[:1],
        part(case_name),
        part(team),
        part(sub_team),
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
            "team": _team_norm(data.get("team")),
            "sub_team": _team_norm(data.get("subTeam")),
            "department_id": _norm(data.get("departmentId")),
            "project_id": _norm(data.get("projectCode")) or None,
            "project_name": _norm(data.get("project_name")) or None,
            "valid_flg": _flag_value(data.get("validFlg"), True),
            "education_flg": _flag_value(data.get("educationFlg"), False),
            "now_dt": system_now(db),
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
        "team": _team_norm(data.get("team")),
        "subTeam": _team_norm(data.get("subTeam")),
        "abbr": build_project_abbr(
            data["customer"],
            data["caseName"],
            data.get("team") or "",
            data.get("subTeam") or "",
        ),
        "departmentId": data.get("departmentId") or "",
        "project_name": data.get("project_name") or "",
        "validFlg": bool(data.get("validFlg", True)),
        "educationFlg": bool(data.get("educationFlg", False)),
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
            "team": _team_norm(data.get("team")),
            "sub_team": _team_norm(data.get("subTeam")),
            "department_id": _norm(data.get("departmentId")),
            "project_id": _norm(data.get("projectCode")) or None,
            "project_name": _norm(data.get("project_name")) or None,
            "valid_flg": _flag_value(data.get("validFlg"), True),
            "education_flg": _flag_value(data.get("educationFlg"), False),
            "now_dt": system_now(db),
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


def _unique_key(customer, case_name, team, sub_team) -> str:
    """一意制約の判定用キー。

    対象: 顧客 / 案件 / チーム / Subチーム
    比較時は前後空白のみ除去する（全角/半角・大文字/小文字は区別する）。
    チーム / Subチーム は未入力を "-" として扱う（空欄同士は同一とみなす）。
    """
    return "\x1f".join(
        [
            _key_norm(customer),
            _key_norm(case_name),
            _key_norm(team) or _EMPTY_TEAM,
            _key_norm(sub_team) or _EMPTY_TEAM,
        ]
    )


def _row_unique_key(row) -> str:
    """取込行の一意キー（チーム/Subチーム の空欄は "-" 扱い）。"""
    return _unique_key(row.customer, row.caseName, row.team, row.subTeam)


def _dept_match_key(value) -> str:
    """部門名称 / 部門別名の照合キー。

    部門マスタには「前後に空白が入った別名」（例: ' 開発1課'、'基 盤課123'）が
    登録されていることがあるため、照合時は空白（半角・全角）をすべて除去する。
    全角/半角の文字種、大文字/小文字は区別する。
    """
    if value is None:
        return ""
    return "".join(str(value).split())


def _department_index(db: Session, year_id: str) -> dict[str, list[str]]:
    """部門名称 / 部門別名 → 部門ID の索引を作る（年度単位）。

    NOTE: jn_project_master.department_id は部門マスタの ID を保持する。
          取込ファイルの「所属部門」列は名称（または別名）で書かれるため、
          登録前に本索引で ID へ変換する必要がある。
          （名称を直接登録すると画面側で「部門マスタに無い」と赤字表示になる）
    """
    rows = (
        db.execute(
            text(load_sql("project/department_resolve.sql")),
            {"year_id": year_id},
        )
        .mappings()
        .all()
    )
    index: dict[str, list[str]] = {}
    for r in rows:
        dept_id = str(r["department_id"])
        for key in (r["department_name"], r["department_alisa"]):
            text_key = _dept_match_key(key)
            if not text_key:
                continue
            ids = index.setdefault(text_key, [])
            if dept_id not in ids:
                ids.append(dept_id)
    return index


def _resolve_department_id(
    index: dict[str, list[str]], department: str, year_id: str = ""
) -> tuple[str | None, bool]:
    """所属部門（名称 / 別名 / ID）から部門IDを解決する。

    Returns:
        (部門ID, 解決できたか)
        候補が 1 件に絞れた場合だけ ID を返す（同名が複数ある場合は曖昧なため None）
    """
    # 既に部門ID（数字）が書かれている場合は、そのまま部門IDとして扱う
    text_value = _norm(department)
    if not text_value:
        return None, False
    if text_value.isdigit():
        return text_value, True

    ids = index.get(_dept_match_key(department))
    if ids and len(ids) == 1:
        return ids[0], True
    return None, False



def _existing_keys(db: Session, year_id: str) -> set[str]:
    """指定年度の既存プロジェクトから一意キーの集合を作る。

    判定条件: (year, 顧客, 案件, チーム, Subチーム) が一致すること。
    所属部門 / 項目ID / Project名称 / フラグ類は判定に含めない。
    """
    rows = (
        db.execute(
            text(load_sql("project/project_duplicate_select.sql")),
            {"year_id": year_id},
        )
        .mappings()
        .all()
    )
    return {
        _unique_key(r["customer"], r["case_name"], r["team"], r["sub_team"])
        for r in rows
    }


def project_key_exists(
    db: Session,
    year_id: str,
    customer,
    case_name,
    team,
    sub_team,
    exclude_sys_id: str | None = None,
) -> bool:
    """同じ一意キーのプロジェクトが既に存在するか。

    exclude_sys_id を指定すると、そのシステム項目IDの行は判定から除く
    （更新時に「自分自身」を重複と判定しないため）。
    """
    target = _unique_key(customer, case_name, team, sub_team)
    for r in (
        db.execute(
            text(load_sql("project/project_duplicate_select.sql")),
            {"year_id": year_id},
        )
        .mappings()
        .all()
    ):
        if (
            exclude_sys_id is not None
            and str(r["sys_project_id"]) == str(exclude_sys_id)
        ):
            continue
        if _unique_key(r["customer"], r["case_name"], r["team"], r["sub_team"]) == target:
            return True
    return False


def import_projects(
    db: Session,
    year_id: str,
    payload: ProjectImportRequest,
    op_user: str = _DEFAULT_OP_USER,
) -> ProjectImportResult:
    """プロジェクト情報を一括取り込みする。

    取り込みルール:
      1) 一意キー (顧客/案件/チーム/Subチーム) が既存データと一致する行
         … 追加しない（重複として画面に表示する）
      2) ファイル内に同じ一意キーの行が 2 行以上ある … ファイル全体を中止する
         （1 件も登録しない / aborted=True）
      3) 上記以外の行 … そのまま追加する

    dryRun=True のときは検証のみ行い、DB へは書き込まない。
    「所属部門」列の値は部門マスタと照合せず、書かれている内容を
    そのまま jn_project_master.department_id へ登録する。
    チーム / Subチーム が空欄の場合は "-" を登録する。
    """
    result = ProjectImportResult()

    # --- 0) ファイル内の重複（同じ一意キー）を検出（行番号ベース）---
    # 既存データとの重複は「その行だけ取り込まない」だが、
    # ファイル内の重複は「どちらを正とするか決められない」ため全体を中止する。
    # NOTE: 中止の場合は「ファイル内で重複している行」だけを返す。
    #       既存データとの重複（fullDuplicateLines 等）は空のままにして、
    #       どれがファイル内の重複なのかを画面で判別できるようにする。
    if payload.abortOnFileDuplicate:
        grouped: dict[str, list[int]] = {}
        for row in payload.rows:
            if row.line is None:
                continue
            grouped.setdefault(_row_unique_key(row), []).append(row.line)

        dup_groups = [
            sorted(lines) for lines in grouped.values() if len(lines) > 1
        ]
        if dup_groups:
            dup_groups.sort(key=lambda g: g[0])
            file_dup_lines = sorted({n for g in dup_groups for n in g})
            result.aborted = True
            result.fileDuplicateLines = file_dup_lines
            result.fileDuplicateGroups = dup_groups
            result.abortReason = (
                "取り込みファイル内に、顧客・案件・チーム・Subチームが"
                "同じ行が複数あります"
                f"（{', '.join(str(n) for n in file_dup_lines)} 行目）。"
                "重複行を削除してから、もう一度取り込んでください。"
                "このファイルの内容は 1 件も登録していません。"
            )
            result.skipped = len(payload.rows)
            return result

    # --- 1) 行単位の検証 ---
    valid_rows = []
    for row in payload.rows:
        warning = _validate(row)
        if warning is not None:
            result.warnings.append(warning)
            result.skipped += 1
            continue
        valid_rows.append(row)

    # 所属部門（名称 / 別名）→ 部門ID の索引（年度単位で 1 回だけ作る）
    dept_index = _department_index(db, year_id)

    # --- 2) 既存データとの重複判定（DB を参照）---
    existing_keys = _existing_keys(db, year_id)
    to_add: list[tuple[object, str]] = []
    for row in valid_rows:
        # 所属部門は必須（部門マスタに無い／曖昧な場合は取り込まない）
        # NOTE: 画面側（プレビュー）で所属部門を確定させてから送信するため、
        #       ここで解決できない行は警告を出さずにスキップする。
        department_id, resolved = _resolve_department_id(
            dept_index, row.department
        )
        if not resolved:
            result.skipped += 1
            continue

        key = _row_unique_key(row)
        # 既存データと同じ一意キー → 取り込まない（重複として画面に表示する）
        if key in existing_keys:
            result.duplicated += 1
            if row.line is not None:
                result.duplicatedLines.append(row.line)
                result.duplicatedReasons[row.line] = ["既存データと重複"]
                result.fullDuplicateLines.append(row.line)
            continue

        # 以降の行を重複として判定できるよう、キーを集合へ入れる
        existing_keys.add(key)
        if row.line is not None:
            result.addableLines.append(row.line)
        to_add.append((row, department_id))

    result.added = len(to_add)

    # --- 3) 検証のみ（dryRun）→ ここで終了 ---
    if payload.dryRun:
        return result

    # --- 4) 新規追加 ---
    for row, department_id in to_add:
        create_project(
            db,
            year_id,
            {
                "customer": _norm(row.customer),
                "caseName": _norm(row.caseName),
                "team": _team_norm(row.team),
                "subTeam": _team_norm(row.subTeam),
                # 部門マスタの ID を登録する（名称をそのまま登録しない）
                "departmentId": department_id,
                "projectCode": _norm(row.projectCode),
                "project_name": _norm(row.project_name),
                # 取込ファイルにフラグ列は無いため既定値（有効 / 非教育）
                "validFlg": True,
                "educationFlg": False,
            },
            op_user,
        )

    return result


# ---------------------------------------------------------------------------
# API 入口（Web 側からのリクエスト受付に対する業務処理・エラー送出はここで完結）
#
# NOTE: api 層（app/api/project.py）は「Web 側データの受け取り／返却」だけを担当し、
#       入力チェック・存在確認・業務エラー（HTTPException）の生成は本モジュールに集約する。
# ---------------------------------------------------------------------------

def _require_text(value: str | None, message_id: str) -> str:
    """必須文字列を検証して返す（空なら業務エラー）。

    message_id は messages.ts のメッセージコード。
    ログイン画面と同じく「API は業務 code のみを返し、文言はフロントで
    code → 文言に変換する」方針のため、code だけを渡す（文面は埋め込まない）。
    """
    text_value = _norm(value)
    if not text_value:
        raise BusinessException(status_code=400, message_id=message_id)
    return text_value


def _length_error(message: str):
    """文字数超過などの入力不備を業務エラーにする（詳細文は params で渡す）。"""
    return BusinessException(
        status_code=400, message_id="E_KADOU_057", params=[message]
    )


def fetch_project_list(db: Session, year_id: str) -> list[dict]:
    """プロジェクト一覧を取得する（API 入口）。"""
    return list_projects(db, year_id)


def register_project(
    db: Session,
    year_id: str,
    payload: ProjectSaveRequest,
    op_user: str | None = None,
) -> dict:
    """プロジェクトを新規登録し、登録した内容を返す（API 入口）。

    Raises:
        BusinessException: 顧客が未入力（E_KADOU_053）／案件が未入力（E_KADOU_054）／
                           文字数超過（E_KADOU_057）／登録失敗（E_KADOU_058）。
    """
    data = payload.model_dump()
    _require_text(data.get("customer"), "E_KADOU_053")
    _require_text(data.get("caseName"), "E_KADOU_054")

    # 一意キー (顧客/案件/チーム/Subチーム) が既存データと一致する場合は登録しない
    if project_key_exists(
        db,
        year_id,
        data.get("customer"),
        data.get("caseName"),
        data.get("team"),
        data.get("subTeam"),
    ):
        raise BusinessException(status_code=409, message_id="E_KADOU_066")

    try:
        return create_project(db, year_id, data, op_user or _DEFAULT_OP_USER)
    except ValueError as e:
        # 文字数超過などの入力不備
        raise _length_error(str(e))
    except IntegrityError:
        db.rollback()
        raise BusinessException(status_code=409, message_id="E_KADOU_066")


def modify_project(
    db: Session,
    year_id: str,
    key: str,
    payload: ProjectSaveRequest,
    op_user: str | None = None,
) -> dict:
    """プロジェクトを更新し、更新後の内容を返す（API 入口）。

    Raises:
        BusinessException: システム項目IDが空（E_KADOU_055）／顧客が未入力（E_KADOU_053）／
                           案件が未入力（E_KADOU_054）／文字数超過（E_KADOU_057）／
                           該当なし（E_KADOU_056）／更新失敗（E_KADOU_059）。
    """
    sys_project_id = _require_text(key, "E_KADOU_055")
    data = payload.model_dump()
    _require_text(data.get("customer"), "E_KADOU_053")
    _require_text(data.get("caseName"), "E_KADOU_054")

    # 一意キーが「他の」既存データと一致する場合は更新しない
    if project_key_exists(
        db,
        year_id,
        data.get("customer"),
        data.get("caseName"),
        data.get("team"),
        data.get("subTeam"),
        exclude_sys_id=sys_project_id,
    ):
        raise BusinessException(status_code=409, message_id="E_KADOU_066")

    try:
        updated = update_project(
            db, year_id, sys_project_id, data, op_user or _DEFAULT_OP_USER
        )
    except ValueError as e:
        raise _length_error(str(e))
    except IntegrityError:
        db.rollback()
        raise BusinessException(status_code=409, message_id="E_KADOU_059")

    if updated is None:
        raise BusinessException(status_code=404, message_id="E_KADOU_056")
    return updated


def remove_project(
    db: Session, year_id: str, key: str
) -> ProjectDeleteResult:
    """プロジェクトを削除する（API 入口）。

    Raises:
        BusinessException: システム項目IDが空（E_KADOU_055）／該当なし（E_KADOU_056）。
    """
    sys_project_id = _require_text(key, "E_KADOU_055")
    if not delete_project(db, year_id, sys_project_id):
        raise BusinessException(status_code=404, message_id="E_KADOU_056")
    return ProjectDeleteResult(code=0)


def import_project_rows(
    db: Session,
    year_id: str,
    payload: ProjectImportRequest,
    op_user: str | None = None,
) -> ProjectImportResult:
    """プロジェクト情報を一括取り込みする（API 入口）。

    ファイル全体を中止した場合は 409 を送出する（1 件も反映していない）。
    画面がプレビューを復元できるよう result 全体を detail に含める。

    Raises:
        HTTPException: 409（取り込み中止）
    """
    result = import_projects(db, year_id, payload, op_user or _DEFAULT_OP_USER)
    if result.aborted:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "KADOU_CONFLICT",
                # 業務コード：フロントは messageId として t() で翻訳する
                "message": "E_KADOU_060",
                # 中止理由は {0} で埋め込めるよう位置引数で返す
                "params": [result.abortReason] if result.abortReason else [],
                "detail": "business",
                # 画面がプレビューを復元できるように取り込み結果全体を返す
                "result": result.model_dump(),
            },
        )
    return result
