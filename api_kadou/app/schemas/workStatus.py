"""要員稼働管理画面（WorkStatus）のスキーマ定義"""
from typing import Optional

from pydantic import BaseModel


class DepartmentDto(BaseModel):
    """部門マスタ（画面側で departmentId → 表示名を解決する用）"""

    departmentId: str
    name: str = ""
    location: Optional[str] = None
    kind: str = "dept"


class PersonnelDto(BaseModel):
    """要員マスタ（employeeNo で 氏名・役割・退場予定 を解決する用）"""

    employeeNo: str
    name: str = ""
    departmentId: Optional[str] = None
    role: str = ""
    leavePlan: Optional[str] = None


class ProjectDto(BaseModel):
    """プロジェクトマスタ（週セルの選択肢。UNASSIGN・内・退職は含めない）"""

    projectId: str
    projectCode: str = ""
    customer: str = ""
    caseName: str = ""
    team: str = ""
    subTeam: str = ""
    abbr: str = ""
    departmentId: str = ""
    name: str = ""
    validFlg: Optional[str] = None
    educationFlg: Optional[str] = None


class WorkStatusRowDto(BaseModel):
    """稼働表の1表示行（id / name / role / departmentName は持たない）

    name / role / leavePlan は employeeNo で要員マスタから解決、
    departmentName は departmentId で部門マスタから解決する（画面側解決）。
    activeFrom/activeTo は idoubi（異動開始日）から後端が週キーへ換算して詰める。
    NULL は返さない：未指定は省略（None）。
    """

    key: str
    employeeNo: str
    departmentId: str
    activeFrom: Optional[str] = None
    activeTo: Optional[str] = None
    employeeNoLocked: Optional[bool] = None
    splitFromKey: Optional[str] = None
    # 異動フラグ（'0' = 異動前 / '1' = 異動後の行）。明細部の並び順に使う
    transferFlag: str = "0"


class WorkStatusDataDto(BaseModel):
    """workStatus 本体（rows / assignment / unpaid / versions）"""

    rows: list[WorkStatusRowDto] = []
    # 割当：employeeNo → { 週キー(月曜YYYY-MM-DD): sys_project_id or 'UNASSIGN' }
    assignment: dict[str, dict[str, str]] = {}
    # 無償支援（BUFFER）：employeeNo → { 週キー: true }（非BUFFER週はキー無し）
    unpaid: dict[str, dict[str, bool]] = {}
    # 楽観ロック用の版：employeeNo → { 週キー: version }
    versions: dict[str, dict[str, int]] = {}


class WorkStatusLoadResponse(BaseModel):
    """GET /api/kadou/{year}/work-status のレスポンス"""

    year: int
    personnel: list[PersonnelDto] = []
    departments: list[DepartmentDto] = []
    projects: list[ProjectDto] = []
    workStatus: WorkStatusDataDto = WorkStatusDataDto()


class WorkStatusSaveRow(BaseModel):
    """保存リクエストの rows 1件（key は DB に送らない）"""

    key: str = ""
    employeeNo: str
    departmentId: str
    activeFrom: Optional[str] = None
    activeTo: Optional[str] = None


class WorkStatusSaveCell(BaseModel):
    """保存リクエストの変更セル 1件（1セル＝週次割当テーブル1レコード）"""

    employeeNo: str
    # 週キー（月曜YYYY-MM-DD）
    weekKey: str
    # 変更後のプロジェクトID（None = 未割当）
    projectId: Optional[str] = None
    # 変更後の無償支援（BUFFER）
    isUnpaid: bool = False
    # 更新前の version（None = バージョン確認なし。新規セルなど）
    version: Optional[int] = None


class WorkStatusSaveDepartment(BaseModel):
    """保存リクエストの現在所属更新 1件（異動で変更した要員）"""

    employeeNo: str
    departmentId: str


class WorkStatusSaveRenumber(BaseModel):
    """保存リクエストの社員番号変更 1件（旧番号 → 新番号）"""

    fromNo: str
    toNo: str


class WorkStatusSaveRequest(BaseModel):
    """PUT /api/kadou/{year}/work-status（当年全量置換）"""

    rows: list[WorkStatusSaveRow] = []
    assignment: dict[str, dict[str, str]] = {}
    unpaid: dict[str, dict[str, bool]] = {}
    # 行削除・社員番号変更で消した社員番号（保存後、週割当を削除する。要員マスタは削除しない）
    deletedEmployeeNos: list[str] = []
    # 画面で変更したセル（このセルだけを version + 1 で更新する）
    changedCells: list[WorkStatusSaveCell] = []
    # 異動で変更した要員の現在所属（保存成功時に要員マスタへ反映する）
    departmentUpdates: list[WorkStatusSaveDepartment] = []
    # 社員番号変更（旧番号の週割当は削除せず UNASSIGN に戻す）
    renumbers: list[WorkStatusSaveRenumber] = []


class WorkStatusSaveResult(BaseModel):
    """PUT /api/kadou/{year}/work-status のレスポンス"""

    code: int = 0