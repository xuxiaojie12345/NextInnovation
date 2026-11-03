from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import List, Optional


class ProjectCreate(BaseModel):
    """新增項目 - 接收前端入参

    ※テーブルに対応する列がない項目は使用しない:
      - projectId: システム項目ID はテーブル側の AUTO_INCREMENT(int) で採番する
      - abbr: 略称（画面表示用のため DB には保存しない）
    """

    model_config = ConfigDict(populate_by_name=True)

    project_code: str = Field(alias="projectCode", max_length=20, description="項目ID")
    customer: str = Field(max_length=100, description="顧客")
    case_name: str = Field(alias="caseName", max_length=100, description="案件名")
    team: Optional[str] = Field(default=None, max_length=30, description="チーム")
    sub_team: Optional[str] = Field(
        alias="subTeam", default=None, max_length=30, description="Subチーム"
    )
    department_id: str = Field(alias="departmentId", max_length=10, description="部門ID")
    project_name: str = Field(max_length=30, description="項目名")


class ProjectOut(BaseModel):
    """返回给前端的数据（与 jn_project_master 的列一一对应）"""

    model_config = ConfigDict(from_attributes=True)

    sys_project_id: int
    year_id: str
    customer: str
    case_name: str
    team: Optional[str] = None
    sub_team: Optional[str] = None
    department_id: str
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    register_datetime: Optional[datetime] = None
    register_user: Optional[str] = None
    update_datetime: Optional[datetime] = None
    update_user: Optional[str] = None


class ProjectQueryOut(BaseModel):
    """查询項目列表 - 画面用に camelCase で返す（abbr はテーブルに列がないため組み立て値）"""

    model_config = ConfigDict(populate_by_name=True)

    project_id: str = Field(serialization_alias="projectId", description="システム項目ID")
    project_code: Optional[str] = Field(
        default=None, serialization_alias="projectCode", description="項目ID"
    )
    customer: str = Field(description="顧客")
    case_name: str = Field(serialization_alias="caseName", description="案件名")
    team: Optional[str] = Field(default=None, description="チーム")
    sub_team: Optional[str] = Field(
        default=None, serialization_alias="subTeam", description="Subチーム"
    )
    abbr: str = Field(description="略称（顧客頭文字・案件名・チーム・Subチームの連結）")
    department_id: str = Field(serialization_alias="departmentId", description="部門ID")
    project_name: Optional[str] = Field(default=None, description="項目名")


class ProjectImportRow(BaseModel):
    """一括取込 1 行分（フロントの ProjectImportRow に対応）

    「所属部門」は部門名で受け取り、部門マスタから department_id を解決する。
    """

    model_config = ConfigDict(populate_by_name=True)

    customer: str = Field(max_length=100, description="顧客")
    case_name: str = Field(alias="caseName", max_length=100, description="案件名")
    team: Optional[str] = Field(default=None, max_length=30, description="チーム")
    sub_team: Optional[str] = Field(
        alias="subTeam", default=None, max_length=30, description="Subチーム"
    )
    department: str = Field(max_length=20, description="所属部門名")
    project_code: Optional[str] = Field(
        alias="projectCode", default=None, max_length=20, description="項目ID"
    )
    name: Optional[str] = Field(default=None, max_length=30, description="Project名称")


class ProjectImportWarning(BaseModel):
    """取込できなかった行の警告"""

    row: int = Field(description="取込データ内の行番号（1 始まり）")
    message: str = Field(description="警告内容")


class ProjectImportResult(BaseModel):
    """一括取込の結果"""

    code: int = Field(default=0, description="0 = 正常終了")
    imported: int = Field(description="取込件数")
    skipped: int = Field(description="取込対象外（スキップ）件数")
    warnings: List[ProjectImportWarning] = Field(
        default_factory=list, description="スキップした理由"
    )
