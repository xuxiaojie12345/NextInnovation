"""要員情報サービス（要員情報画面用）"""
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.audit import normalize_op_user, system_now
from app.schemas.personnel import (
    PersonnelImportRequest,
    PersonnelImportResult,
    PersonnelImportRow,
    PersonnelSaveRequest,
)
from app.sql import load_sql

# 操作者が指定されない場合のフォールバック（認証情報が取れないとき用）
_DEFAULT_OP_USER = normalize_op_user(None)

# 未指定時の既定値（DB の NOT NULL 制約を満たすため）
_DEFAULT_ROLE = "要員"
# 異動フラグの初期値：0 = 異動なし
_DEFAULT_IDOU_FLAG = "0"

# 文字列長の上限（DB 定義に合わせる）
_MAX_EMPLOYEE_NO = 5
_MAX_PERSON_NAME = 20
_MAX_ROLE = 6
_MAX_DEPARTMENT_NAME = 20


def get_personnel(db: Session, year_id: str, employee_no: str) -> dict | None:
    """年度 + 社員番号で要員情報を1件取得する。存在しない場合は None を返す。"""
    row = (
        db.execute(
            text(load_sql("personnel/personnel_select.sql")),
            {"year_id": year_id, "employee_no": employee_no},
        )
        .mappings()
        .first()
    )
    if row is None:
        return None
    return {
        "id": row["employee_no"],
        "employeeNo": row["employee_no"],
        "name": row["person_name"],
        "department": row["department_name"],
        "role": row["role"],
        "leavePlan": row["leave_plan"],
    }


def count_personnel(db: Session, year_id: str) -> int:
    """指定年度の登録要員数を返す。"""
    return int(
        db.execute(
            text(load_sql("personnel/personnel_count.sql")), {"year_id": year_id}
        ).scalar_one()
    )


def save_personnel(
    db: Session,
    year_id: str,
    employee_no: str,
    data: PersonnelSaveRequest,
    op_user: str = _DEFAULT_OP_USER,
) -> tuple[dict, bool]:
    """要員を保存する（年度 + 社員番号で upsert）。

    既存データがあれば更新し、なければ追加する。
    - 新規追加時：登録日時／登録者 = システム日時／ログインユーザー、
      更新日時／更新者も同じ値、異動フラグ = '0' をセットする。
    - 更新時：更新日時／更新者だけを書き換える（登録日時／登録者は保持）。
    戻り値は (保存後の要員情報, 新規追加だったか)。
    """
    op_user = normalize_op_user(op_user)
    now_dt = system_now(db)
    current = get_personnel(db, year_id, employee_no)

    if current is not None:
        # 既存データ → 更新
        # NOTE: 所属は更新時に変更できない（画面の「所属は変更不可」仕様）
        db.execute(
            text(load_sql("personnel/personnel_save_update.sql")),
            {
                "year_id": year_id,
                "employee_no": employee_no,
                "person_name": data.name,
                "role": data.role or current.get("role") or _DEFAULT_ROLE,
                "leave_plan": (
                    data.leavePlan
                    if data.leavePlan is not None
                    else current.get("leavePlan")
                ),
                "now_dt": now_dt,
                "op_user": op_user,
            },
        )
        db.commit()
        saved = get_personnel(db, year_id, employee_no) or current
        return saved, False

    # 新規データ → 追加
    # 所属は必須（未指定のまま登録すると誤った部門に紐づくため、推測での補完はしない）
    if not data.departmentId:
        raise ValueError("所属を選択してください。")

    db.execute(
        text(load_sql("personnel/personnel_insert.sql")),
        {
            "year_id": year_id,
            "employee_no": employee_no,
            "department_id": int(data.departmentId),
            "idou_flag": _DEFAULT_IDOU_FLAG,
            "idoubi": None,
            "person_name": data.name,
            "role": data.role or _DEFAULT_ROLE,
            "leave_plan": data.leavePlan,
            "now_dt": now_dt,
            "op_user": op_user,
        },
    )
    db.commit()
    saved = get_personnel(db, year_id, employee_no) or {
        "id": employee_no,
        "employeeNo": employee_no,
        "name": data.name,
        "department": None,
        "role": data.role or _DEFAULT_ROLE,
        "leavePlan": data.leavePlan,
    }
    return saved, True


def count_weekly_assignments(db: Session, year_id: str, employee_no: str) -> int:
    """指定年度 + 社員番号の週割当件数（jn_weekly_assignment_table）を返す。

    要員削除の確認ダイアログで「週割当も削除するか」を判断させるために使う。
    """
    return int(
        db.execute(
            text(load_sql("personnel/weekly_assignment_count.sql")),
            {"year_id": year_id, "employee_no": employee_no},
        ).scalar_one()
    )


def delete_personnel(
    db: Session,
    year_id: str,
    employee_no: str,
    delete_weekly: bool = False,
) -> bool:
    """要員を削除する。削除できた場合は True を返す。

    Args:
        delete_weekly: True のとき、jn_weekly_assignment_table の当該年度・
            当該社員番号の週割当も同時に削除する（年度 + 社員番号で特定）。

    NOTE: 週割当の削除は「画面の要員情報を消すので、稼働管理の実データも
          消すか」を利用者に選ばせる仕様のため、既定は False（消さない）。
          どちらも同一トランザクションで実行する。
    """
    res = db.execute(
        text(load_sql("personnel/personnel_delete.sql")),
        {"year_id": year_id, "employee_no": employee_no},
    )
    deleted = res.rowcount > 0

    if deleted and delete_weekly:
        # 年度 + 社員番号を検索条件として週割当を削除する
        db.execute(
            text(load_sql("personnel/weekly_assignment_delete.sql")),
            {"year_id": year_id, "employee_no": employee_no},
        )

    db.commit()
    return deleted


def _resolve_department_id(
    db: Session, year_id: str, department_name: str
) -> str | None:
    """部門名から部門IDを引く。該当なしの場合は None を返す。"""
    if not department_name:
        return None
    return db.execute(
        text(load_sql("personnel/department_by_name.sql")),
        {"year_id": year_id, "department_name": department_name},
    ).scalar()


def _normalize(row: PersonnelImportRow) -> PersonnelImportRow:
    """取り込み行の前後空白を除去する。"""
    return PersonnelImportRow(
        employeeNo=row.employeeNo.strip(),
        name=row.name.strip(),
        role=row.role.strip(),
        department=row.department.strip(),
        line=row.line,
    )


def _label(row: PersonnelImportRow) -> str:
    """警告メッセージ用の行ラベル（「3行目：」形式）。"""
    return f"{row.line}行目：" if row.line else ""


def _validate(row: PersonnelImportRow, require_department: bool = True) -> str | None:
    """取り込み行の検証。問題があれば警告メッセージを返す。

    Args:
        require_department: 所属の必須チェックを行うか。
            既存データの上書き行は所属を更新しないため、False で呼ぶ。
    """
    problems = _validate_all(row, require_department)
    return problems[0] if problems else None


def _fill_duplicated_info(
    db: Session,
    year_id: str,
    payload: PersonnelImportRequest,
    result: PersonnelImportResult,
) -> None:
    """中止時でも「既存データと重複する行」の情報を結果へ詰める。

    画面は中止でもプレビューを表示し、上書き行は所属を更新しないため
    「DB 上の既存所属」をグレー表示する。その判定に必要な
    duplicatedEmployeeNos / duplicatedDepartments / duplicated を返す。

    NOTE: 部門の存在チェックやファイル内重複の判定は行わない（中止理由とは別）。
    """
    dup_nos: list[str] = []
    for row in payload.rows:
        normalized_no = (row.employeeNo or "").strip()
        if not normalized_no or normalized_no in dup_nos:
            continue
        existing = (
            db.execute(
                text(load_sql("personnel/personnel_select.sql")),
                {"year_id": year_id, "employee_no": normalized_no},
            )
            .mappings()
            .first()
        )
        if existing is None:
            continue
        dup_nos.append(normalized_no)
        if existing["department_name"]:
            result.duplicatedDepartments[normalized_no] = existing[
                "department_name"
            ]

    result.duplicated = len(dup_nos)
    result.duplicatedEmployeeNos = dup_nos


def _validate_all(
    row: PersonnelImportRow, require_department: bool = True
) -> list[str]:
    """取り込み行の検証を行い、問題を「すべて」返す（1 行 0〜複数件）。

    画面側で「取り込めない内容」をまとめて表示できるよう、
    最初の 1 件で打ち切らずに全項目をチェックする。

    Args:
        require_department: 所属の必須チェックを行うか。
            既存データの上書き行は所属を更新しないため、False で呼ぶ。
    """
    label = _label(row)
    problems: list[str] = []
    if not row.employeeNo:
        problems.append(f"{label}社員番号が空欄")
    elif len(row.employeeNo) > _MAX_EMPLOYEE_NO:
        problems.append(
            f"{label}社員番号「{row.employeeNo}」が "
            f"{_MAX_EMPLOYEE_NO} 文字を超えています"
        )
    if not row.name:
        problems.append(f"{label}社員番号「{row.employeeNo}」の名前が空欄")
    elif len(row.name) > _MAX_PERSON_NAME:
        problems.append(
            f"{label}社員番号「{row.employeeNo}」の名前が "
            f"{_MAX_PERSON_NAME} 文字を超えています"
        )
    if require_department and not row.department:
        problems.append(f"{label}社員番号「{row.employeeNo}」の所属が空欄")
    if len(row.role) > _MAX_ROLE:
        problems.append(
            f"{label}社員番号「{row.employeeNo}」の役割が "
            f"{_MAX_ROLE} 文字を超えています"
        )
    if len(row.department) > _MAX_DEPARTMENT_NAME:
        problems.append(
            f"{label}社員番号「{row.employeeNo}」の所属が "
            f"{_MAX_DEPARTMENT_NAME} 文字を超えています"
        )
    return problems


def import_personnel(
    db: Session,
    year_id: str,
    payload: PersonnelImportRequest,
    op_user: str = _DEFAULT_OP_USER,
) -> PersonnelImportResult:
    """社員情報を一括取り込みする。

    年度 + 社員番号で既存データを判定し、
    存在すれば更新、存在しなければ追加する。

    仕様（docs/react-kadou-data-design.html 8.1 / 8.4）:
      - ファイル内で社員番号が重複している場合はファイル全体を中止する
      - 所属が空欄、または部門マスタに存在しない場合はファイル全体を中止する
      - 既存データと重複している場合、overwrite=False ならファイル全体を中止する
      - 既存データの更新時は所属を変更しない（新規追加時のみ所属を設定する）
      - dryRun=True のときは検証のみ行い、DB へは書き込まない
    """
    result = PersonnelImportResult()
    op_user = normalize_op_user(op_user)
    now_dt = system_now(db)

    # --- 1) 行単位の検証（所属空欄はここで検出してファイル全体を中止） ---
    valid_rows: list[PersonnelImportRow] = []
    invalid_messages: list[str] = []
    # 所属だけが空欄の行（dryRun では画面で選び直せるため中止しない）
    pending_department_rows: list[PersonnelImportRow] = []
    for raw in payload.rows:
        row = _normalize(raw)
        # 所属が空欄の行は、既存データと重複していれば「上書き（所属は変更しない）」
        # として扱えるため、所属必須チェックを保留して先に登録有無を調べる。
        problems = _validate_all(row, require_department=bool(row.department))
        if problems:
            invalid_messages.extend(problems)
            continue
        if not row.department:
            pending_department_rows.append(row)
            continue
        valid_rows.append(row)

    if invalid_messages:
        result.aborted = True
        result.abortReason = (
            f"入力内容に不備が {len(invalid_messages)} 件あります。"
            "ファイル全体の取り込みを中止しました。"
        )
        result.warnings.extend(invalid_messages)
        result.skipped = len(payload.rows)
        # NOTE: 画面は中止でもプレビューを表示し、「上書き（＝所属は変更しない）」
        #       行をグレー表示する。その判定に必要な情報をここでも返しておく。
        #       （ここが空だと上書き行が「追加」扱いになり所属列が壊れる）
        _fill_duplicated_info(db, year_id, payload, result)
        return result

    # --- 2) ファイル内の重複を検出（重複があればファイル全体を中止） ---
    seen: dict[str, PersonnelImportRow] = {}
    duplicates: list[str] = []
    for row in valid_rows + pending_department_rows:
        first = seen.get(row.employeeNo)
        if first is not None:
            origin = f"{first.line}行目の" if first.line else "同一ファイル内の"
            duplicates.append(
                f"{_label(row)}社員番号「{row.employeeNo}」が"
                f"{origin}社員番号と重複しています"
            )
            continue
        seen[row.employeeNo] = row

    if duplicates:
        result.aborted = True
        result.abortReason = (
            f"ファイル内に社員番号の重複が {len(duplicates)} 件あります。"
            "取り込みを中止しました。"
        )
        result.warnings.extend(duplicates)
        result.skipped = len(payload.rows)
        return result

    # --- 2.5) 所属が未確定の行（E列×N列が部門マスタに一致しない）---
    # 既存データと重複する行（＝上書き）は所属を更新しないため、未確定でも取り込める。
    # 新規追加の行だけは所属が必須なので、確定していない場合はファイル全体を中止する。
    pending_existing_rows: list[PersonnelImportRow] = []
    pending_new_rows: list[PersonnelImportRow] = []
    for r in pending_department_rows:
        exists = (
            db.execute(
                text(load_sql("personnel/personnel_exists.sql")),
                {"year_id": year_id, "employee_no": r.employeeNo},
            ).first()
            is not None
        )
        (pending_existing_rows if exists else pending_new_rows).append(r)

    if pending_new_rows and not payload.dryRun:
        result.aborted = True
        result.abortReason = (
            f"所属を特定できない行が {len(pending_new_rows)} 件あります。"
            "プレビュー上で所属を選択してください。"
        )
        result.warnings.extend(
            f"{_label(r)}社員番号「{r.employeeNo}」の所属が未確定です"
            for r in pending_new_rows
        )
        result.skipped = len(payload.rows)
        return result

    if pending_department_rows:
        result.pendingDepartmentNos = [r.employeeNo for r in pending_department_rows]

    # --- 3) 既存データとの重複を検出 ---
    # 所属が部門マスタに存在しない行があれば、誤った部門で登録しないよう全体を中止する
    unknown_departments: list[str] = []
    new_rows: list[tuple[PersonnelImportRow, str]] = []
    dup_rows: list[tuple[PersonnelImportRow, str]] = []
    for row in valid_rows:
        department_id = _resolve_department_id(db, year_id, row.department)
        if department_id is None:
            unknown_departments.append(
                f"{_label(row)}社員番号「{row.employeeNo}」の所属「{row.department}」が"
                "部門マスタにありません"
            )
            continue
        exists = (
            db.execute(
                text(load_sql("personnel/personnel_exists.sql")),
                {"year_id": year_id, "employee_no": row.employeeNo},
            ).first()
            is not None
        )
        if exists:
            dup_rows.append((row, department_id))
        else:
            new_rows.append((row, department_id))

    if unknown_departments:
        result.aborted = True
        result.abortReason = (
            f"部門マスタに存在しない所属が {len(unknown_departments)} 件あります。"
            "ファイル全体の取り込みを中止しました。"
        )
        result.warnings.extend(unknown_departments)
        result.skipped = len(payload.rows)
        return result

    # 所属が未確定でも既存データと重複する行は「上書き（所属は変更しない）」対象にする
    for row in pending_existing_rows:
        dup_rows.append((row, ""))

    result.duplicated = len(dup_rows)
    # 画面で「追加／上書き」を行単位で判定できるよう、重複した社員番号を返す
    result.duplicatedEmployeeNos = [row.employeeNo for row, _ in dup_rows]

    # 上書き行の所属は更新しないため、画面には DB 上の既存所属を表示する
    for row, _ in dup_rows:
        existing = (
            db.execute(
                text(load_sql("personnel/personnel_select.sql")),
                {"year_id": year_id, "employee_no": row.employeeNo},
            )
            .mappings()
            .first()
        )
        if existing and existing["department_name"]:
            result.duplicatedDepartments[row.employeeNo] = existing[
                "department_name"
            ]

    # 重複があり、上書きが許可されていない → ファイル全体を中止する
    # NOTE: dryRun はプレビュー表示が目的のため中止しない（画面で選択させる）
    if dup_rows and not payload.overwrite and not payload.dryRun:
        result.aborted = True
        result.abortReason = (
            f"既存データと重複する社員番号が {len(dup_rows)} 件あります。"
            "「重複を上書きして取り込む」を選択すると更新されます。"
        )
        result.warnings.extend(
            f"{_label(row)}社員番号「{row.employeeNo}」は既に登録されています"
            for row, _ in dup_rows
        )
        result.skipped = len(payload.rows)
        # 中止時も「上書きした場合の内訳」を返す（プレビューに追加件数を表示するため）
        result.added = len(new_rows)
        result.updated = len(dup_rows)
        return result

    # --- 4) 検証のみ（dryRun）→ ここで終了 ---
    if payload.dryRun:
        # 追加件数 = 所属確定済みの新規行 + 未確定行のうち既存に無い行
        dup_nos = {row.employeeNo for row, _ in dup_rows}
        pending_new = [
            r for r in pending_department_rows if r.employeeNo not in dup_nos
        ]
        result.added = len(new_rows) + len(pending_new)
        result.updated = len(dup_rows)
        return result

    # --- 5) 新規追加 ---
    # 所属はここまでで必ず解決済み（空欄・部門マスタに無い行は上で全体中止している）
    for row, department_id in new_rows:
        no = row.employeeNo

        db.execute(
            text(load_sql("personnel/personnel_insert.sql")),
            {
                "year_id": year_id,
                "employee_no": no,
                "department_id": int(department_id),
                "idou_flag": _DEFAULT_IDOU_FLAG,
                "idoubi": None,
                "person_name": row.name,
                "role": row.role or _DEFAULT_ROLE,
                "leave_plan": None,
                "now_dt": now_dt,
                "op_user": op_user,
            },
        )
        result.added += 1

    # --- 6) 既存データの更新（重複分を上書き） ---
    # NOTE: 所属は更新時に変更できない（画面の「所属は変更不可」仕様）。
    #       所属がファイル内容と違っても、DB の既存値を維持する。
    for row, department_id in dup_rows:
        no = row.employeeNo
        current = (
            db.execute(
                text(load_sql("personnel/personnel_select.sql")),
                {"year_id": year_id, "employee_no": no},
            )
            .mappings()
            .first()
        )
        if current is None:
            continue

        # 役割が空欄の場合は現在の役割を維持する
        role = row.role or current["role"]

        db.execute(
            text(load_sql("personnel/personnel_update.sql")),
            {
                "year_id": year_id,
                "employee_no": no,
                "person_name": row.name,
                "role": role,
                "now_dt": now_dt,
                "op_user": op_user,
            },
        )
        result.updated += 1

    db.commit()
    return result
