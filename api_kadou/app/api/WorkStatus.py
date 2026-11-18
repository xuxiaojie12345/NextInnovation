from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.work_status import (
    WorkStatusOut,
    WorkStatusSaveRequest,
    WorkStatusSaveResponse,
)
from app.services.WorkStatus_service import (
    get_work_status_by_year as _get_work_status_by_year,
)
from app.services.WorkStatus_service import save_work_status as _save_work_status

router = APIRouter(prefix="/api/kadou")


@router.get("/workStatus/{year}", response_model=List[WorkStatusOut])
def get_work_status_by_year(
    year: str,
    db: Session = Depends(get_db),
):
    """稼働状況（週次アサイン）一覧取得。

    - 路径参数 year: 年度ID（jn_weekly_assignment_table.year_id で検索）
    - 请求体: 无
    - 返回: 該年度のアサイン一覧（camelCase）
      - employeeNo / weekStartDate / weekEndDate / sysProjectId / departmentId / isUnpaid / version
        ← jn_weekly_assignment_table の各列
      - personName（氏名）← jn_personnel_master（社員番号 + 年度ID で突合）
      - departmentName（所属部門名）← jn_department_master（所属部門ID + 年度ID で突合）
      - projectName（項目名）← jn_project_master（システム項目ID + 年度ID で突合）
      ※名称が引けない行は該当項目が null になる（行自体は返す）
    """
    return _get_work_status_by_year(db, year)


@router.post("/{year}/work-status", response_model=WorkStatusSaveResponse)
def save_work_status(
    year: str,
    payload: WorkStatusSaveRequest,
    db: Session = Depends(get_db),
):
    """稼働状況（週次アサイン）保存。

    - 路径参数 year: 年度ID（4 桁）
    - 请求体:
      - rows: 稼働表の行（社員番号 / 所属部門ID / 有効期間）
        氏名・役割は要員マスタ、部門名は部門マスタから解決するため受け取らない
      - assignment: 社員番号 → { 週キー(月曜 'YYYY-MM-DD') : システム項目ID }
        当年度の全週（1/1 を含む週 〜 12/31 を含む週）を欠けなく指定する。
        未配分の週は予約コード 'UNASSIGN' を指定する。
      - unpaid: 社員番号 → { 週キー : true }（BUFFER＝無償支援）
        割当のある週（UNASSIGN 以外）のみ指定できる。
    - 返回: {"code": 0}
      ※保存は当該年度の全量置換（既存データを削除してから登録する）
      ※年途中の異動は rows を複数行に分割して表現する
        （旧所属の activeTo = 異動前週、新所属の activeFrom = 異動当周）
    """
    return _save_work_status(db, year, payload)
