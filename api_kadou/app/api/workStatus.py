"""要員稼働管理画面（WorkStatus）の API

API_ID  : WorkStatus
API_PATH:
  GET /api/kadou/{year}/work-status   稼働表の取得
  PUT /api/kadou/{year}/work-status   稼働表の保存（当年全量置換）

NOTE: 本モジュールは「Web 側データの受け取り／返却」のみを担当する。
      週キー換算・週割当の持ち替え・業務エラーは services/workStatus.py に集約する。
"""
from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.workStatus import (
    PersonnelMasterRowsResponse,
    WorkStatusLoadResponse,
    WorkStatusSaveRequest,
    WorkStatusSaveResult,
)
from app.services.workStatus import (
    list_personnel_master_rows,
    load_work_status,
    save_work_status,
)

router = APIRouter(prefix="/api/kadou", tags=["workstatus"])


@router.get(
    "/{year}/work-status/personnel/{employee_no}/rows",
    response_model=PersonnelMasterRowsResponse,
)
def get_personnel_master_rows(
    year: str, employee_no: str, db: Session = Depends(get_db)
):
    """要員稼働管理：指定社員の要員マスタ行を返す（行削除の存在チェック用）。

    行の識別キーは year_id + employee_no + department_id + idou_flag + idoubi。
    """
    return PersonnelMasterRowsResponse(
        rows=list_personnel_master_rows(db, int(year), employee_no)
    )


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

    - 週次割当は受信した payload（assignment / unpaid）の内容で更新する。
    - deletedEmployeeNos の社員は週次割当を削除し、要員マスタは削除せず
      現在の所属 1 行に戻す（異動フラグを解除する）。
    - renumbers（社員番号変更）は、新番号に旧番号の内容を移植し、
      旧番号は週次割当を UNASSIGN に戻す（要員マスタは変更しない）。
    """
    op_user = (x_user_id or "").strip() or "ADMIN"
    return save_work_status(db, int(year), payload, op_user)