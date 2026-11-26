"""済南稼働率統計サービス（済南稼働率統計画面用）

NOTE: api 層（app/api/jinanWorkRate.py）は「Web 側データの受け取り／返却」だけを担当し、
      入力チェック・存在確認・業務エラーの生成は本モジュールに集約する
      （要員情報 app/services/personnel.py / プロジェクト管理 app/services/project.py と同じ方針）。

集計ルール（画面仕様）:
  1. 総人数              : 対象部門の要員マスタ全員 − 当週の離職人数（内・退職）
                           （離職者は稼働する人員ではないため総人数から除外する。
                             判定は週単位：下半期に退職しても上半期の週では在籍として計上する）
  2. 離職人数            : 稼動表の当週プロジェクトが「顧客 = 内・案件名 = 退職」の要員数
  3. 総稼動人数          : 稼動表の当週プロジェクトの有効flg = '1' の要員数
  4. 総稼動率            : 総稼動人数 ÷ 総人数
  5. 非契約稼動人数      : 稼動表の is_unpaid = '1' の要員数
  6. 教育実施人数        : 稼動表の当週プロジェクトの教育flg = '1' の要員数
  7. 現地稼動人数（日本出張含） : 総稼動人数と同じ
  8. 現地稼動率          : 総稼動率と同じ
  9. 契約稼動率          : (総稼動人数 - 非契約稼動人数) ÷ 総人数

  NOTE: 同一週（同一 week_start_date）に「顧客 = 内・案件名 = 退職」の割当がある要員は
        「離職人数」にだけ数え、総稼動人数・非契約稼動人数・教育実施人数には数えない
        （離職者の二重計上を防ぐ）。

  NOTE: 総人数（headcount）は「対象部門の要員マスタ全員 − 当週の離職（内・退職）人数」で算出する。
        離職判定は週単位（week_start_date = 当週の月曜）で行う。
        例：下半期に退職する要員は、上半期の週では在籍者として総人数に計上し、
            退職した週以降だけ総人数から除外する（0 未満にはしない）。
        総稼動人数・非契約稼動人数・教育実施人数も、すべて当週の割当だけを数える。

  いずれも「要員マスタ（社員番号）→ 稼動表（週割当）→ プロジェクトマスタ」の
  連表（JOIN）で取得する。統計は保存しない（毎回集計する）。
"""
from datetime import date, timedelta

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.errors import BusinessException
from app.sql import load_sql

# 集計対象拠点（部門マスタの location）
_TARGET_LOCATION = "JN"

# 離職（内・退職）を表すプロジェクトの 顧客 / 案件名
# NOTE: プロジェクトマスタの「顧客 = 内」「案件名 = 退職」の項目を離職として扱う
#       （システム項目ID は年ごとに変わり得るため、名称で判定する）。
LEAVE_CUSTOMER = "内"
LEAVE_CASE_NAME = "退職"

# 年度の書式（4桁の数字）
_YEAR_LENGTH = 4


def _current_monday() -> str:
    """今日を含む週の月曜日（'YYYY-MM-DD'）を返す。

    統計の集計基準週（当週）に使う。
    離職の判定を週単位で行うため、当週の week_start_date を SQL へ渡す。
    """
    today = date.today()
    return (today - timedelta(days=today.weekday())).strftime("%Y-%m-%d")


# ============================================================
# 1. 変換ヘルパー
# ============================================================
def _as_int(v) -> int:
    """DB の COUNT 結果などを安全に int にする（NULL は 0）。"""
    return 0 if v is None else int(v)


def _rate(num: int, den: int) -> float:
    """率（%）= 分子 ÷ 分母 × 100。分母が 0 以下なら 0.0。小数第 1 位で丸める。"""
    if den <= 0:
        return 0.0
    return round(num / den * 100, 1)


def _row_to_stat(r) -> dict:
    """SQL の1行（部門別の件数合計）を画面（フロントエンド）の形式へ変換する。"""
    headcount = _as_int(r["headcount"])
    leavers = _as_int(r["leavers"])
    active_total = _as_int(r["active_total"])
    non_contract = _as_int(r["non_contract"])
    training = _as_int(r["training"])
    contract = max(0, active_total - non_contract)
    return {
        "departmentId": str(int(r["department_id"])),
        "departmentName": r["department_name"] or "",
        "headcount": headcount,
        "leavers": leavers,
        "activeTotal": active_total,
        # 4. 総稼動率
        "activeRate": _rate(active_total, headcount),
        "nonContractActive": non_contract,
        "training": training,
        # 7. 現地稼動人数（日本出張含） = 総稼動人数
        "localActive": active_total,
        # 8. 現地稼動率 = 総稼動率
        "localRate": _rate(active_total, headcount),
        # 9. 契約稼動率 = (総稼動人数 - 非契約稼動人数) ÷ 総人数
        "contractRate": _rate(contract, headcount),
    }


def _total_of(rows: list[dict]) -> dict:
    """済南拠点全体（対象部門の合計）の統計値を算出する。

    率は部門ごとの率を平均せず、合計値から再計算する。
    """
    headcount = sum(r["headcount"] for r in rows)
    leavers = sum(r["leavers"] for r in rows)
    active_total = sum(r["activeTotal"] for r in rows)
    non_contract = sum(r["nonContractActive"] for r in rows)
    training = sum(r["training"] for r in rows)
    contract = max(0, active_total - non_contract)
    return {
        "headcount": headcount,
        "leavers": leavers,
        "activeTotal": active_total,
        "activeRate": _rate(active_total, headcount),
        "nonContractActive": non_contract,
        "training": training,
        "localActive": active_total,
        "localRate": _rate(active_total, headcount),
        "contractRate": _rate(contract, headcount),
    }


# ============================================================
# 2. 取得（API 入口）
# ============================================================
def _validate_year(year: str) -> str:
    """年度を検証して返す（4桁の数字以外は業務エラー 400）。"""
    value = (year or "").strip()
    if len(value) != _YEAR_LENGTH or not value.isdigit():
        raise BusinessException(status_code=400, message_id="E_KADOU_026")
    return value


def fetch_jinan_work_rate(db: Session, year: str) -> dict:
    """済南稼働率統計を取得する（API 入口）。

    Returns:
        dict: 年度 / 対象部門の統計値一覧 / 拠点全体の合計

    Raises:
        BusinessException: 年度の書式が不正（E_KADOU_026）
    """
    year_id = _validate_year(year)
    try:
        rows = (
            db.execute(
                text(load_sql("stats/jinan_stats.sql", "count_sums")),
                {
                    "year_id": year_id,
                    "location": _TARGET_LOCATION,
                    "leave_customer": LEAVE_CUSTOMER,
                    "leave_case_name": LEAVE_CASE_NAME,
                    # 集計基準週（当週の月曜）。離職判定を週単位で行うために使う
                    "week_start_date": _current_monday(),
                },
            )
            .mappings()
            .all()
        )
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001 - DB 例外は業務エラーへ変換する
        # NOTE: 接続断・スキーマ不整合は main.py の例外ハンドラで 503 に変換されるため、
        #       ここでは「統計の取得に失敗した」業務エラー（500）として返す。
        raise BusinessException(status_code=500, message_id="E_KADOU_045") from e

    departments = [_row_to_stat(r) for r in rows]
    return {
        "year": year_id,
        "location": _TARGET_LOCATION,
        "departments": departments,
        "total": _total_of(departments),
        "leaveCustomer": LEAVE_CUSTOMER,
        "leaveCaseName": LEAVE_CASE_NAME,
    }
