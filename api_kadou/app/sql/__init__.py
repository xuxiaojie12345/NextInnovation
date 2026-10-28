"""SQL ファイルの読み込みヘルパー。

すべての SQL 文はこのパッケージ（app/sql/）内の .sql ファイルとして一元管理する。
"""
from pathlib import Path

SQL_DIR = Path(__file__).resolve().parent


def load_sql(filename: str) -> str:
    """app/sql/ 配下の SQL ファイルを文字列として返す。"""
    path = SQL_DIR / filename
    if not path.is_file():
        raise FileNotFoundError(f"SQL ファイルが見つかりません: {path}")
    return path.read_text(encoding="utf-8")
