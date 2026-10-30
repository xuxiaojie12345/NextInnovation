"""SQL ファイルの読み込みヘルパー。

すべての SQL 文はこのパッケージ（app/sql/）内の .sql ファイルとして一元管理する。
1 ファイルに複数の SQL 文を含める場合は、文ごとに `-- :name: <セクション名>` の
見出し行を置き、 load_sql(filename, name) でセクションを指定して取り出せる。
```
-- :name: list
SELECT ...
-- :name: insert
INSERT ...
```
"""
import re
from pathlib import Path

SQL_DIR = Path(__file__).resolve().parent

# セクション見出し（例: "-- :name: list"）
_SECTION_RE = re.compile(r"^--\s*:name:\s*(\S+)\s*$", re.MULTILINE)


def load_sql(filename: str, name: str | None = None) -> str:
    """app/sql/ 配下の SQL ファイルを文字列として返す。

    name にセクション名を指定した場合は、そのセクションの SQL 文のみを返す。
    name を省略した場合はファイル全体を返す（単一文のファイル向け）。
    """
    path = SQL_DIR / filename
    if not path.is_file():
        raise FileNotFoundError(f"SQL ファイルが見つかりません: {path}")
    sql = path.read_text(encoding="utf-8")
    if name is None:
        return sql

    matches = list(_SECTION_RE.finditer(sql))
    for i, m in enumerate(matches):
        if m.group(1) == name:
            start = m.end()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(sql)
            return sql[start:end].strip()
    raise ValueError(
        f"SQL ファイル {filename} にセクション '{name}' が見つかりません。"
    )