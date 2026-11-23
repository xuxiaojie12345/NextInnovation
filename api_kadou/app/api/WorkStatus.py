from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.user import current_user_id
from app.db.session import get_db
from app.schemas.work_status import (
    TransferRequest,
    TransferResponse,
    WorkStatusOut,
    WorkStatusSaveRequest,
    WorkStatusSaveResponse,
)
from app.services.WorkStatus_service import (
    get_work_status_by_year as _get_work_status_by_year,
)
from app.services.WorkStatus_service import save_work_status as _save_work_status
from app.services.WorkStatus_service import transfer_employee as _transfer_employee

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
        画面で変更された週だけを指定する（未配分は 'UNASSIGN'）。
        行削除・社員番号変更の社員は当年度の全週を指定する（削除 → 登録し直す）。
      - unpaid: 社員番号 → { 週キー : true }（BUFFER＝無償支援）
        割当のある週（UNASSIGN 以外）のみ指定できる。
      - deletedEmployeeNos: 行削除で業務データを削除した社員番号
    - 返回: {"code": 0}
      ※指定された「社員 × 週」の行だけを更新する（他の週のデータは変更しない）
      ※年途中の異動は rows を複数行に分割して表現する
        （旧所属の activeTo = 異動前週、新所属の activeFrom = 異動当周）
    """
    return _save_work_status(db, year, payload)


@router.post("/{year}/transfer", response_model=TransferResponse)
def transfer(
    year: str,
    payload: TransferRequest,
    user_id: str = Depends(current_user_id),
    db: Session = Depends(get_db),
):
    """所属変更（異動）確定。

    - 路径参数 year: 年度ID（4 桁）
    - 请求体:
      - employeeNo: 異動する社員番号
      - newDepartmentId: 新しい所属部門ID
      - transferWeekKey: 適用開始週（月曜 'YYYY-MM-DD'）
    - 処理（1 トランザクション）:
      1. 要員マスタの元レコードに 異動フラグ(idou_flag)・異動開始日(idoubi) を設定
      2. 要員マスタに新しい所属部門のレコードを追加
      3. jn_weekly_assignment_table の適用開始週以降の所属部門ID を新部門へ更新
      4. 週次データが無い要員は、適用開始週で所属を分割した週次レコードを新規登録
    - 返回: {"code": 0}
      ※同一社員は 1 年度につき 1 回まで（既に異動済みなら 400）
    """
    return _transfer_employee(db, year, payload, user_id)
