"""要員稼働管理画面（WorkStatus）の API

API_ID  : WorkStatus
API_PATH:
  GET /api/kadou/{year}/work-status   稼働表の取得
  PUT /api/kadou/{year}/work-status   稼働表の保存（当年全量置換）

NOTE: 本モジュールは「Web 側データの受け取り／返却」のみを担当する。
      週キー換算・周割当の持替・業務エラーは services/workStatus.py に集約する。
"""
from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.workStatus import (
    WorkStatusLoadResponse,
    WorkStatusSaveRequest,
    WorkStatusSaveResult,
)
from app.services.workStatus import load_work_status, save_work_status

router = APIRouter(prefix="/api/kadou", tags=["workstatus"])


@router.get("/{year}/work-status", response_model=WorkStatusLoadResponse)
def get_work_status(year: str, db: Session = Depends(get_db)):
    """要員稼働管理：指定年度の稼働表（要員・部門・プロジェクト・週割当）を返す。"""
    return load_work_status(db, int(year))


@router.put("/{year}/work-status", response_model=WorkStatusSaveResult)
def put_work_status(
    year: str,
    payload: WorkStatusSaveRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    """要員稼働管理：稼働表を当年全量置換で保存する。

    登録者/登録日時は既存行があれば引き継ぎ、週割当は入荷通りに置き換える。
    deletedEmployeeNos の社員は週割当・要員マスタからも削除される。
    """
    op_user = (x_user_id or "").strip() or "ADMIN"
    return save_work_status(db, int(year), payload, op_user)