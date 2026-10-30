"""要員情報画面（PersonnelInfoScreen）のスキーマ定義"""
from typing import Optional

from pydantic import BaseModel


class PersonnelInfo(BaseModel):
    """要員情報（GET /api/kadou/personnel/{employeeNo}/{year} のレスポンス）"""

    id: Optional[str] = None
    employeeNo: str
    name: str
    department: Optional[str] = None
    role: Optional[str] = None
    leavePlan: Optional[str] = None


class PersonnelCount(BaseModel):
    """登録要員数（GET /api/kadou/personnel/count/{year} のレスポンス）"""

    year: str
    count: int


class PersonnelImportRow(BaseModel):
    """一括取り込みの1件分（社員番号 / 名前 / 役割 / 所属）"""

    employeeNo: str
    name: str
    role: str = ""
    department: str = ""
    # ファイル上の行番号（警告メッセージに含めるため。未指定可）
    line: Optional[int] = None


class PersonnelImportRequest(BaseModel):
    """一括取り込みリクエスト（POST /api/kadou/personnel/import/{year}）"""

    rows: list[PersonnelImportRow]
    # true = 検証のみ（DB へは書き込まない）
    dryRun: bool = False
    # true = 既存データの重複を上書きする（false なら重複があれば全体中止）
    overwrite: bool = False


class PersonnelImportResult(BaseModel):
    """一括取り込みの結果"""

    added: int = 0
    updated: int = 0
    skipped: int = 0
    # 既存データと重複した件数（新規追加・更新の対象外）
    duplicated: int = 0
    # ファイル全体を中止したか（重複エラーなどの致命的な問題）
    aborted: bool = False
    # ファイル全体を中止した理由（aborted=true のときのみ）
    abortReason: Optional[str] = None
    warnings: list[str] = []


class PersonnelSaveRequest(BaseModel):
    """要員の保存リクエスト（PUT /api/kadou/personnel/{employeeNo}/{year}）

    年度 + 社員番号で既存データを判定し、存在すれば更新・なければ追加する。
    """

    name: str
    # 所属は部門ID（部門マスタの departmentId）で受け取る
    departmentId: Optional[str] = None
    role: str = ""
    leavePlan: Optional[str] = None


class PersonnelDeleteResult(BaseModel):
    """要員削除レスポンス（DELETE）"""

    code: int = 0
