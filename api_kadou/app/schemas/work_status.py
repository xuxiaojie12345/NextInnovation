from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class WorkStatusOut(BaseModel):
    """稼働状況（週次アサイン）1 行分 - 画面用に camelCase で返す

    jn_weekly_assignment_table の各列に、名称解決した以下を付加する:
      - person_name     ← jn_personnel_master（社員番号 + 年度ID で突合）
      - department_name ← jn_department_master（所属部門ID + 年度ID で突合）
      - project_name    ← jn_project_master（システム項目ID + 年度ID で突合）
    """

    model_config = ConfigDict(populate_by_name=True)

    employee_no: str = Field(serialization_alias="employeeNo", description="社員番号")
    person_name: Optional[str] = Field(
        default=None, serialization_alias="personName", description="氏名"
    )
    department_id: str = Field(
        serialization_alias="departmentId", description="所属部門ID"
    )
    department_name: Optional[str] = Field(
        default=None, serialization_alias="departmentName", description="所属部門名"
    )
    sys_project_id: str = Field(
        serialization_alias="sysProjectId", description="システム項目ID"
    )
    project_name: Optional[str] = Field(
        default=None, serialization_alias="projectName", description="項目名"
    )
    week_start_date: str = Field(
        serialization_alias="weekStartDate", description="開始周键（周一日期）"
    )
    week_end_date: str = Field(
        serialization_alias="weekEndDate", description="終了周键（周日日期）"
    )
    is_unpaid: Optional[str] = Field(
        default=None, serialization_alias="isUnpaid", description="无偿支援（1=是）"
    )
    version: Optional[int] = Field(default=None, description="バージョン番号")


class WorkStatusRowIn(BaseModel):
    """保存対象の稼働表 1 行（社員の所属有効期間）

    ※氏名・役割は要員マスタ、部門名は部門マスタから解決するため受け取らない。
    ※activeFrom / activeTo は週キー（月曜 'YYYY-MM-DD'）。
      未指定 = 年度初め / 年度末。異動時は同一社員を複数行に分割する。
    """

    model_config = ConfigDict(populate_by_name=True)

    employee_no: str = Field(alias="employeeNo", min_length=1, max_length=5)
    department_id: str = Field(alias="departmentId", min_length=1, max_length=10)
    active_from: Optional[str] = Field(default=None, alias="activeFrom")
    active_to: Optional[str] = Field(default=None, alias="activeTo")


class WorkStatusSaveRequest(BaseModel):
    """稼働状況（週次アサイン）保存リクエスト

    - rows: 稼働表の行（社員番号・所属部門ID・有効期間）
    - assignment: 社員番号 → { 週キー(月曜 'YYYY-MM-DD') : システム項目ID or 'UNASSIGN' }
      画面で変更された週だけを指定する（未配分は 'UNASSIGN'）
    - unpaid: 社員番号 → { 週キー : true }（BUFFER＝無償支援。割当週のみ指定可）
    - deletedEmployeeNos: 行削除で業務データ（割当・BUFFER）を削除した社員番号
      ※ rows / assignment / unpaid には「画面で変更された社員」だけを指定する
      ※ 行削除・社員番号変更の社員は当年度の全週を assignment に指定する
    """

    rows: List[WorkStatusRowIn] = Field(default_factory=list)
    assignment: Dict[str, Dict[str, str]] = Field(default_factory=dict)
    unpaid: Dict[str, Dict[str, bool]] = Field(default_factory=dict)
    deleted_employee_nos: List[str] = Field(
        default_factory=list, alias="deletedEmployeeNos"
    )


class WorkStatusSaveResponse(BaseModel):
    """保存レスポンス（固定で code = 0）"""

    code: int = Field(default=0, description="0 = 正常終了")


class TransferRequest(BaseModel):
    """所属変更（異動）リクエスト

    - employeeNo: 異動する社員番号
    - newDepartmentId: 新しい所属部門ID
    - transferWeekKey: 適用開始週（月曜 'YYYY-MM-DD'）
      この週以降の週次レコードの所属部門を新しい部門へ更新する
    """

    model_config = ConfigDict(populate_by_name=True)

    employee_no: str = Field(alias="employeeNo", min_length=1, max_length=5)
    new_department_id: str = Field(alias="newDepartmentId", min_length=1)
    transfer_week_key: str = Field(alias="transferWeekKey")


class TransferResponse(BaseModel):
    """異動レスポンス（固定で code = 0）"""

    code: int = Field(default=0, description="0 = 正常終了")
