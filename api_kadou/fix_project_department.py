"""jn_project_master.department_id の履歴データ補正スクリプト

取込時に「部門名称 / 部門別名」がそのまま department_id へ登録されていた分を、
部門マスタの department_id へ変換する。

使い方:
    cd api_kadou
    ..\\.venv\\Scripts\\python.exe fix_project_department.py          # 確認のみ
    ..\\.venv\\Scripts\\python.exe fix_project_department.py --apply  # 実際に更新
"""
import sys

from sqlalchemy import text

from app.db.session import SessionLocal


def match_key(value) -> str:
    """部門名称 / 別名の照合キー（空白をすべて除去）"""
    if value is None:
        return ""
    return "".join(str(value).split())


def main(apply: bool) -> None:
    db = SessionLocal()

    # 部門マスタの索引（年度ごと）
    dept_index: dict[tuple[str, str], list[str]] = {}
    for r in db.execute(
        text(
            "SELECT year_id, department_id, department_name, department_alisa "
            "FROM jn_department_master"
        )
    ).mappings():
        year = str(r["year_id"])
        dept_id = str(r["department_id"])
        for key in (r["department_name"], r["department_alisa"]):
            k = match_key(key)
            if not k:
                continue
            ids = dept_index.setdefault((year, k), [])
            if dept_id not in ids:
                ids.append(dept_id)

    rows = db.execute(
        text(
            "SELECT year_id, sys_project_id, customer, department_id "
            "FROM jn_project_master ORDER BY year_id, sys_project_id"
        )
    ).mappings().all()

    fixes: list[tuple[str, int, str, str]] = []
    unknown: list[dict] = []
    for r in rows:
        year = str(r["year_id"])
        current = (r["department_id"] or "").strip()
        if not current:
            continue
        # 既に有効な部門ID なら対象外
        if current.isdigit() and (year, current) in {
            (y, i) for (y, _k) in dept_index for i in dept_index[(y, _k)]
        }:
            continue
        ids = dept_index.get((year, match_key(current)), [])
        if len(ids) == 1:
            fixes.append((year, r["sys_project_id"], current, ids[0]))
        else:
            unknown.append(dict(r))

    print(f"=== 補正対象: {len(fixes)} 件 ===")
    for year, pid, before, after in fixes:
        print(f"  {year} / PJ.{pid:04d}: {before!r} -> {after!r}")

    if unknown:
        print(f"=== 部門マスタに一致しない: {len(unknown)} 件（手動確認） ===")
        for r in unknown:
            print(f"  {r}")

    if not apply:
        print("\n（確認のみ。更新するには --apply を付けて実行してください）")
        db.close()
        return

    for year, pid, _before, after in fixes:
        db.execute(
            text(
                "UPDATE jn_project_master SET department_id = :dept "
                "WHERE year_id = :year AND sys_project_id = :pid"
            ),
            {"dept": after, "year": year, "pid": pid},
        )
    db.commit()
    print(f"\n{len(fixes)} 件を更新しました。")
    db.close()


if __name__ == "__main__":
    main("--apply" in sys.argv)
