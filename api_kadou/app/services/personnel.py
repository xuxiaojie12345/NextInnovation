"""要員情報サービス（要員情報画面用）"""
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.personnel import (
    PersonnelImportRequest,
    PersonnelImportResult,
    PersonnelImportRow,
    PersonnelSaveRequest,
)
from app.sql import load_sql

# 操作者が指定されない場合のフォールバック（認証情報が取れないとき用）
_DEFAULT_OP_USER = "ADMIN"

# 未指定時の既定値（DB の NOT NULL 制約を満たすため）
_DEFAULT_DEPARTMENT_ID = "D001"
_DEFAULT_ROLE = "要員"
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
    戻り値は (保存後の要員情報, 新規追加だったか)。
    """
    current = get_personnel(db, year_id, employee_no)

    if current is not None:
        # 既存データ → 更新
        # 所属が未指定なら現在の所属を維持する
        department_id = data.departmentId or db.execute(
            text(load_sql("personnel/personnel_select.sql")),
            {"year_id": year_id, "employee_no": employee_no},
        ).mappings().first()["department_id"]

        db.execute(
            text(load_sql("personnel/personnel_save_update.sql")),
            {
                "year_id": year_id,
                "employee_no": employee_no,
                "department_id": department_id,
                "person_name": data.name,
                "role": data.role or current.get("role") or _DEFAULT_ROLE,
                "leave_plan": (
                    data.leavePlan
                    if data.leavePlan is not None
                    else current.get("leavePlan")
                ),
                "op_user": op_user,
            },
        )
        db.commit()
        saved = get_personnel(db, year_id, employee_no) or current
        return saved, False

    # 新規データ → 追加
    db.execute(
        text(load_sql("personnel/personnel_insert.sql")),
        {
            "year_id": year_id,
            "employee_no": employee_no,
            "department_id": data.departmentId or _DEFAULT_DEPARTMENT_ID,
            "idou_flag": _DEFAULT_IDOU_FLAG,
            "idoubi": None,
            "person_name": data.name,
            "role": data.role or _DEFAULT_ROLE,
            "leave_plan": data.leavePlan,
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


def delete_personnel(db: Session, year_id: str, employee_no: str) -> bool:
    """要員を削除する。削除できた場合は True を返す。"""
    res = db.execute(
        text(load_sql("personnel/personnel_delete.sql")),
        {"year_id": year_id, "employee_no": employee_no},
    )
    db.commit()
    return res.rowcount > 0


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


def _validate(row: PersonnelImportRow) -> str | None:
    """取り込み行の検証。問題があれば警告メッセージを返す。"""
    label = _label(row)
    if not row.employeeNo:
        return f"{label}社員番号が空欄"
    if len(row.employeeNo) > _MAX_EMPLOYEE_NO:
        return (
            f"{label}社員番号「{row.employeeNo}」が "
            f"{_MAX_EMPLOYEE_NO} 文字を超えています"
        )
    if not row.name:
        return f"{label}社員番号「{row.employeeNo}」の名前が空欄"
    if len(row.name) > _MAX_PERSON_NAME:
        return (
            f"{label}社員番号「{row.employeeNo}」の名前が "
            f"{_MAX_PERSON_NAME} 文字を超えています"
        )
    if len(row.role) > _MAX_ROLE:
        return (
            f"{label}社員番号「{row.employeeNo}」の役割が "
            f"{_MAX_ROLE} 文字を超えています"
        )
    if len(row.department) > _MAX_DEPARTMENT_NAME:
        return (
            f"{label}社員番号「{row.employeeNo}」の所属が "
            f"{_MAX_DEPARTMENT_NAME} 文字を超えています"
        )
    return None


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
      - 既存データと重複している場合、overwrite=False ならファイル全体を中止する
      - dryRun=True のときは検証のみ行い、DB へは書き込まない
    """
    result = PersonnelImportResult()

    # --- 1) 行単位の検証 ---
    valid_rows: list[PersonnelImportRow] = []
    for raw in payload.rows:
        row = _normalize(raw)
        warning = _validate(row)
        if warning is not None:
            result.warnings.append(warning)
            result.skipped += 1
            continue
        valid_rows.append(row)

    # --- 2) ファイル内の重複を検出（重複があればファイル全体を中止） ---
    seen: dict[str, PersonnelImportRow] = {}
    duplicates: list[str] = []
    for row in valid_rows:
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

    # --- 3) 既存データとの重複を検出 ---
    new_rows: list[tuple[PersonnelImportRow, str]] = []
    dup_rows: list[tuple[PersonnelImportRow, str]] = []
    for row in valid_rows:
        department_id = _resolve_department_id(db, year_id, row.department)
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

    result.duplicated = len(dup_rows)

    # 重複があり、上書きが許可されていない → ファイル全体を中止する
    if dup_rows and not payload.overwrite:
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
        result.added = len(new_rows)
        result.updated = len(dup_rows)
        return result

    # --- 5) 新規追加 ---
    for row, department_id in new_rows:
        no = row.employeeNo
        if department_id is None:
            if row.department:
                result.warnings.append(
                    f"{_label(row)}社員番号「{no}」の所属「{row.department}」が"
                    f"部門マスタに無いため、既定値「{_DEFAULT_DEPARTMENT_ID}」で登録しました"
                )
            department_id = _DEFAULT_DEPARTMENT_ID

        db.execute(
            text(load_sql("personnel/personnel_insert.sql")),
            {
                "year_id": year_id,
                "employee_no": no,
                "department_id": department_id,
                "idou_flag": _DEFAULT_IDOU_FLAG,
                "idoubi": None,
                "person_name": row.name,
                "role": row.role or _DEFAULT_ROLE,
                "leave_plan": None,
                "op_user": op_user,
            },
        )
        result.added += 1

    # --- 6) 既存データの更新（重複分を上書き） ---
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

        # 所属が空欄 or 部門マスタに無い場合は、現在の所属を維持する
        if department_id is None:
            if row.department:
                result.warnings.append(
                    f"{_label(row)}社員番号「{no}」の所属「{row.department}」が"
                    "部門マスタに無いため、現在の所属を維持しました"
                )
            department_id = current["department_id"]

        # 役割が空欄の場合は現在の役割を維持する
        role = row.role or current["role"]

        db.execute(
            text(load_sql("personnel/personnel_update.sql")),
            {
                "year_id": year_id,
                "employee_no": no,
                "department_id": department_id,
                "person_name": row.name,
                "role": role,
                "op_user": op_user,
            },
        )
        result.updated += 1

    db.commit()
    return result
