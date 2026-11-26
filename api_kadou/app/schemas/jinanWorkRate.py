"""済南稼働率統計画面（JinanWorkRateScreen）のスキーマ定義"""
from typing import Optional

from pydantic import BaseModel


class JinanDepartmentStat(BaseModel):
    """部門別の統計値（GET /api/kadou/{year}/stats/jinan の departments 要素）"""

    # 部門ID（部門マスタの department_id）
    departmentId: str
    # 部門名
    departmentName: str
    # 総人数
    headcount: int = 0
    # 離職人数
    leavers: int = 0
    # 総稼動人数
    activeTotal: int = 0
    # 総稼動率（%）
    activeRate: float = 0.0
    # 非契約稼動人数
    nonContractActive: int = 0
    # 教育実施人数
    training: int = 0
    # 現地稼動人数（日本出張含） = 総稼動人数
    localActive: int = 0
    # 現地稼動率（%） = 総稼動率
    localRate: float = 0.0
    # 契約稼動率（%） = (総稼動人数 - 非契約稼動人数) / 総人数
    contractRate: float = 0.0


class JinanWorkRateStat(BaseModel):
    """済南拠点全体（対象部門の合計）の統計値。

    部門別の値と同じ項目を返す（画面は「全社」の表示に使う）。
    """

    headcount: int = 0
    leavers: int = 0
    activeTotal: int = 0
    activeRate: float = 0.0
    nonContractActive: int = 0
    training: int = 0
    localActive: int = 0
    localRate: float = 0.0
    contractRate: float = 0.0


class JinanWorkRateResponse(BaseModel):
    """済南稼働率統計レスポンス

    API_ID  : JinanWorkRateScreen
    API_PATH: /api/kadou/{year}/stats/jinan
    """

    # 対象年度
    year: str
    # 集計対象拠点（'JN'）
    location: str = "JN"
    # 実際に集計した基準週（'YYYYMMDD' の月曜）
    weekStartDate: str = ""
    # 集計対象部門（部門マスタから動的生成。追加・削除で増減する）
    departments: list[JinanDepartmentStat] = []
    # 済南拠点全体（対象部門の合計から算出）
    total: JinanWorkRateStat = JinanWorkRateStat()
    # 離職と判定するプロジェクトの 顧客 / 案件名（画面の注記表示用）
    leaveCustomer: Optional[str] = None
    leaveCaseName: Optional[str] = None
