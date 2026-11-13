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
            "team": _norm(data.get("team")) or None,
            "sub_team": _norm(data.get("subTeam")) or None,
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


def _abbr_key(customer, case_name, team, sub_team) -> str:
    """重複判定用の「略称」キー（全角スペース除去・トリム・小文字化）。"""
    return _norm(
        build_project_abbr(
            _norm(customer), _norm(case_name), _norm(team), _norm(sub_team)
        )
    ).lower()


def _text_key(value) -> str:
    """重複判定用の文字列キー（全角スペース除去・トリム・小文字化）。"""
    return _norm(value).lower()


def _existing_keys(db: Session, year_id: str) -> tuple[set, set, set, set]:
    """指定年度の既存プロジェクトから重複判定用のキー集合を作る。

    判定条件（いずれか一致で重複）：
      1) 略称（顧客の1文字目・案件・チーム・Subチーム）
      2) 項目ID（project_id）
      3) Project名称（project_name）
    空文字のキーは集合に含めない（未入力同士を重複扱いしないため）。

    4つ目は「全項目完全一致」判定用のキー集合
    （顧客/案件/チーム/Subチーム/所属部門/項目ID/Project名称 を連結したもの）。
    """
    rows = (
        db.execute(
            text(load_sql("project/project_duplicate_select.sql")),
            {"year_id": year_id},
        )
        .mappings()
        .all()
    )
    abbrs: set[str] = set()
    codes: set[str] = set()
    names: set[str] = set()
    fulls: set[str] = set()
    for r in rows:
        abbr = _text_key(r["abbr"])
        if abbr:
            abbrs.add(abbr)
        code = _text_key(r["project_id"])
        if code:
            codes.add(code)
        name = _text_key(r["project_name"])
        if name:
            names.add(name)
        fulls.add(
            _full_key(
                r["customer"],
                r["case_name"],
                r["team"],
                r["sub_team"],
                r["department_id"],
                r["project_id"],
                r["project_name"],
            )
        )
    return abbrs, codes, names, fulls


def _full_key(
    customer, case_name, team, sub_team, department, project_code, project_name
) -> str:
    """全項目完全一致の判定用キー（1行分の全フィールドを連結）。

    対象: 顧客 / 案件 / チーム / Subチーム / 所属部門 / 項目ID / Project名称
    正規化（全角スペース→半角、前後トリム、小文字化）したうえで連結する。
    """
    return "\x1f".join(
        [
            _text_key(customer),
            _text_key(case_name),
            _text_key(team),
            _text_key(sub_team),
            _text_key(department),
            _text_key(project_code),
            _text_key(project_name),
        ]
    )


def import_projects(
    db: Session,
    year_id: str,
    payload: ProjectImportRequest,
    op_user: str = _DEFAULT_OP_USER,
) -> ProjectImportResult:
    """プロジェクト情報を一括取り込みする。

    取り込みルール（画面の仕様と 1 対 1 で対応）:
      1) 既存データと重複しない行 ……… そのまま追加する
      2) 既存データと「全項目完全一致」の行 … 追加しない（強制。ユーザー選択不可）
      3) ファイル内に「全項目完全一致」の行が 2 行以上ある … ファイル全体を中止する
         （1 件も登録しない / aborted=True）
      4) 略称・項目ID・Project名称 のいずれかだけが一致する行（部分重複）
         … 既定では追加する。画面でユーザーが「取り込まない」を選んだ行
         （payload.skipLines）だけ追加しない
      5) 上記が混在する場合 … 行ごとに上記を判定し、1)〜4) を同時に適用する

    dryRun=True のときは検証のみ行い、DB へは書き込まない。
    「所属部門」列の値は部門マスタと照合せず、書かれている内容を
    そのまま jn_project_master.department_id へ登録する。
    """
    result = ProjectImportResult()

    # --- 0) ファイル内の「全項目完全一致」行を検出（行番号ベース）---
    # 上記(3): ファイル内に同じ内容の行が 2 行以上あれば、行の追加可否に
    #          関係なくファイル全体を中止する（1 件も登録しない）
    file_dup_lines: list[int] = []
    if payload.abortOnFileDuplicate:
        seen_full: dict[str, int] = {}
        for row in payload.rows:
            full = _full_key(
                row.customer,
                row.caseName,
                row.team,
                row.subTeam,
                row.department,
                row.projectCode,
                row.project_name,
            )
            first_line = seen_full.get(full)
            if first_line is None:
                seen_full[full] = row.line if row.line is not None else 0
                continue
            # 2 行目以降（1 行目も含めて中止対象として報告する）
            if first_line not in file_dup_lines:
                file_dup_lines.append(first_line)
            if row.line is not None and row.line not in file_dup_lines:
                file_dup_lines.append(row.line)
        if file_dup_lines:
            result.aborted = True
            result.abortReason = (
                "取り込みファイル内に、全項目（顧客/案件/チーム/Subチーム/"
                "所属部門/項目ID/Project名称）が完全に一致する行が複数あります"
                f"（{', '.join(str(n) for n in sorted(file_dup_lines))} 行目）。"
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

    # --- 2) 既存データとの重複判定（DB を参照）---
    # 完全重複（全項目一致）は強制的に取り込まない。
    # 部分重複（略称/項目ID/Project名称のいずれか）は既定で取り込むが、
    # 画面でユーザーが外した行（skipLines）は取り込まない。
    skip_lines = set(payload.skipLines or [])
    abbrs, codes, names, fulls = _existing_keys(db, year_id)
    to_add = []
    for row in valid_rows:
        abbr = _abbr_key(row.customer, row.caseName, row.team, row.subTeam)
        code = _text_key(row.projectCode)
        name = _text_key(row.project_name)
        full = _full_key(
            row.customer,
            row.caseName,
            row.team,
            row.subTeam,
            row.department,
            row.projectCode,
            row.project_name,
        )
        # 該当した条件をすべて集める（画面で「どれが重複したか」を出すため）
        reasons: list[str] = []
        if abbr and abbr in abbrs:
            reasons.append("略称")
        if code and code in codes:
            reasons.append("項目ID")
        if name and name in names:
            reasons.append("Project名称")

        # (2) 既存データと全項目完全一致 → 強制的に取り込まない
        if full in fulls:
            result.duplicated += 1
            if row.line is not None:
                result.duplicatedLines.append(row.line)
                result.duplicatedReasons[row.line] = ["全項目一致"]
                result.fullDuplicateLines.append(row.line)
            continue

        # (4) 部分重複 → 既定は取り込む。ユーザーが外した行だけ取り込まない
        if reasons:
            result.duplicated += 1
            if row.line is not None:
                result.duplicatedLines.append(row.line)
                result.duplicatedReasons[row.line] = reasons
                result.partialDuplicateLines.append(row.line)
                if row.line in skip_lines:
                    # ユーザーが取り込まないことを選んだ行
                    result.skipped += 1
                    continue

        # (1) 追加する行のキーを集合へ入れて、以降の行を重複として判定する
        if abbr:
            abbrs.add(abbr)
        if code:
            codes.add(code)
        if name:
            names.add(name)
        fulls.add(full)
        if row.line is not None:
            result.addableLines.append(row.line)
        to_add.append(row)

    result.added = len(to_add)

    # --- 3) 検証のみ（dryRun）→ ここで終了 ---
    if payload.dryRun:
        return result

    # --- 4) 新規追加（完全重複・ユーザーが除外した行は追加しない）---
    for row in to_add:
        create_project(
            db,
            year_id,
            {
                "customer": _norm(row.customer),
                "caseName": _norm(row.caseName),
                "team": _norm(row.team),
                "subTeam": _norm(row.subTeam),
                # 部門マスタとの照合は行わない（ファイルの値をそのまま登録する）
                "departmentId": _norm(row.department),
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

    try:
        return create_project(db, year_id, data, op_user or _DEFAULT_OP_USER)
    except ValueError as e:
        # 文字数超過などの入力不備
        raise _length_error(str(e))
    except IntegrityError:
        db.rollback()
        raise BusinessException(status_code=409, message_id="E_KADOU_058")


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
