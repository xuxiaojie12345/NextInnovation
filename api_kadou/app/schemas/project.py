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
    # 部門マスタと照合せず、そのまま department_id として登録する。
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
    # 画面でユーザーが「取り込まない」を選んだ行のファイル上行番号。
    # 部分重複行のみ有効（完全重複行は指定に関係なく取り込まない）
    skipLines: list[int] = []
    # ファイル内に「全項目完全一致」の行が2行以上あった場合に、
    # ファイル全体の取り込みを中止する（既定 true）
    abortOnFileDuplicate: bool = True


class ProjectImportResult(BaseModel):
    """一括取り込みの結果"""

    added: int = 0
    skipped: int = 0
    # 既存データと重複した件数（略称 / 項目ID / Project名称 のいずれか一致）
    duplicated: int = 0
    # 既存データと重複した行のファイル上での行番号（画面で「重複」を判定する用）
    # ※ 完全重複・部分重複の両方を含む
    duplicatedLines: list[int] = []
    # 重複した行ごとの理由（行番号 → ['略称', '項目ID', 'Project名称'] の部分集合）
    duplicatedReasons: dict[int, list[str]] = {}
    # 全項目（顧客/案件/チーム/Subチーム/所属部門/項目ID/Project名称）が
    # 既存データと完全一致した行のファイル上行番号。
    # この行は強制的に取り込まない（ユーザー選択の対象外）
    fullDuplicateLines: list[int] = []
    # 略称 / 項目ID / Project名称 のいずれかだけが一致した行（部分重複）の行番号。
    # 画面では既定で取り込み対象（チェックON）とし、ユーザーが外した行だけ取り込まない
    partialDuplicateLines: list[int] = []
    # 既存データ・直前の行と重複せず、そのまま追加できる行の行番号
    addableLines: list[int] = []
    # ファイル全体を中止したか（致命的な問題）
    aborted: bool = False
    # ファイル全体を中止した理由（aborted=true のときのみ）
    abortReason: Optional[str] = None
    warnings: list[str] = []


class ProjectDeleteResult(BaseModel):
    """プロジェクト削除レスポンス（DELETE）"""

    code: int = 0
