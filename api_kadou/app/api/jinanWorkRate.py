"""済南稼働率統計画面（JinanWorkRateScreen）の API

API_ID  : JinanWorkRateScreen
API_PATH: /api/kadou/{year}/stats/jinan  (GET)

NOTE: 本モジュールは「Web 側データの受け取り／返却」のみを担当する。
      入力チェック・業務エラーの生成は services/jinanWorkRate.py に集約する。
      既存の要員管理（app/api/personnel.py）・プロジェクト管理（app/api/project.py）と
      同じ構成に合わせ、独立した router として登録する。
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.jinanWorkRate import JinanWorkRateResponse
from app.services.jinanWorkRate import fetch_jinan_work_rate

router = APIRouter(prefix="/api/kadou", tags=["stats"])


@router.get("/{year}/stats/jinan", response_model=JinanWorkRateResponse)
def get_jinan_work_rate(year: str, db: Session = Depends(get_db)):
    """済南稼働率統計：指定年度の拠点 JN の稼働率統計を返す。

    対象部門は部門マスタ（location = 'JN' かつ kind ≠ partner）から動的生成する。
    統計は保存せず、要員マスタ・稼動表・プロジェクトマスタの連表で毎回集計する。
    """
    return JinanWorkRateResponse(**fetch_jinan_work_rate(db, year))
