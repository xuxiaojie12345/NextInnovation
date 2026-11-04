"""プロジェクト管理画面（ProjectManagementScreen）のスキーマ定義"""
from typing import Optional, Union

from pydantic import BaseModel


class ProjectInfo(BaseModel):
    """プロジェクト（GET /api/kadou/projects/{year} の要素）"""

    # システム項目ID（主キーの一部。DB は INT のため int も許容する）
    projectId: Optional[Union[str, int]] = None
    # 項目ID（任意入力。主キーではない）
    projectCode: Optional[str] = None
    customer: str
    caseName: str
    team: Optional[str] = None
    subTeam: Optional[str] = None
    # 略称（サーバー側で自動生成する。画面からは編集不可）
    abbr: Optional[str] = None
    # 所属部門ID（部門マスタの department_id は INT）
    departmentId: Optional[Union[str, int]] = None
    # Project名称
    project_name: Optional[str] = None


class ProjectSaveRequest(BaseModel):
    """プロジェクトの登録・更新リクエスト

    POST /api/kadou/projects/{year}
    PUT  /api/kadou/projects/{year}/{key}

    NOTE: projectId（システム項目ID）はシステム採番のため、POST では無視される。
    """

    customer: str
    caseName: str
    team: Optional[str] = None
    subTeam: Optional[str] = None
    # 所属部門ID（部門マスタの department_id は INT のため int も許容する）
    departmentId: Optional[Union[str, int]] = None
    # 項目ID（任意入力）
    projectCode: Optional[str] = None
    # Project名称
    project_name: Optional[str] = None


class ProjectImportRow(BaseModel):
    """一括取り込みの1件分

    顧客 / 案件 / チーム / Subチーム / 所属部門 / 項目ID / Project名称
    """

    customer: str
    caseName: str
    team: str = ""
    subTeam: str = ""
    # 所属部門（取込ファイルの「所属部門」列の値）。
    # 部門マスタの部門別名（department_alisa）と照合して department_id へ解決する。
    department: str = ""
    projectCode: str = ""
    project_name: str = ""
    # ファイル上の行番号（警告メッセージに含めるため。未指定可）
    line: Optional[int] = None


class ProjectImportRequest(BaseModel):
    """一括取り込みリクエスト（POST /api/kadou/projects/import/{year}）"""

    rows: list[ProjectImportRow]
    # true = 検証のみ（DB へは書き込まない）
    dryRun: bool = False


class ProjectImportResult(BaseModel):
    """一括取り込みの結果"""

    added: int = 0
    skipped: int = 0
    # ファイル全体を中止したか（致命的な問題）
    aborted: bool = False
    # ファイル全体を中止した理由（aborted=true のときのみ）
    abortReason: Optional[str] = None
    warnings: list[str] = []


class ProjectDeleteResult(BaseModel):
    """プロジェクト削除レスポンス（DELETE）"""

    code: int = 0
