from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.project import (
    ProjectCreate,
    ProjectImportResult,
    ProjectImportRow,
    ProjectOut,
    ProjectQueryOut,
)
from app.services.Project_service import (
    create_project as _create_project,
    delete_project as _delete_project,
    get_projects_by_year as _get_projects_by_year,
    import_projects as _import_projects,
    update_project as _update_project,
)

router = APIRouter(prefix="/api/kadou")


@router.post("/projects/{year}", response_model=ProjectOut)
def create_project(
    year: str,
    project: ProjectCreate,
    db: Session = Depends(get_db),
):
    """新增項目。

    - 路径参数 year: 年度ID（写入 year_id）
    - 请求体: 項目情報
      - projectCode → project_id（項目ID）
      - customer / caseName / team / subTeam / departmentId / project_name → 同名列
      - projectId（システム項目ID）は DB 側の AUTO_INCREMENT で採番するため使用しない
      - abbr はテーブルに列がないため保存しない
    - 返回: 新增后的項目对象（含 DB 采番后的 sys_project_id）
    """
    return _create_project(db, year, project)


@router.get("/projects/{year}", response_model=List[ProjectQueryOut])
def get_projects_by_year(
    year: str,
    db: Session = Depends(get_db),
):
    """画面初期データ取得（該年度の項目一覧）。

    - 路径参数 year: 年度ID
    - 请求体: 无
    - 返回: 該年度の項目一覧（camelCase）
      - projectId ← sys_project_id（文字列化したシステム項目ID）
      - projectCode ← project_id
      - abbr は customer の頭文字・case_name・team・sub_team を「・」で連結した値
        （例: 桜井商事／基幹刷新／第一／A → 桜・基幹刷新・第一・A）
    """
    return _get_projects_by_year(db, year)


@router.post("/projects/import/{year}", response_model=ProjectImportResult)
def import_projects(
    year: str,
    rows: List[ProjectImportRow],
    db: Session = Depends(get_db),
):
    """プロジェクト一括取込。

    - 路径参数 year: 年度ID（写入 year_id）
    - 请求体: 取込行の配列（フロントで解析済みのデータ行）
      - customer / caseName / team / subTeam / department / projectCode / name
      - department（所属部門）は部門名。該当年度の部門マスタから department_id を解決する
      - projectCode（項目ID）・name（Project名称）は任意
    - 返回: 取込結果
      - imported: 取込件数
      - skipped: スキップ件数
      - warnings: スキップ理由（行番号 + メッセージ）
    """
    return _import_projects(db, year, rows)


@router.put("/projects/{year}/{key}", response_model=ProjectOut)
def update_project(
    year: str,
    key: int,
    project: ProjectCreate,
    db: Session = Depends(get_db),
):
    """更新項目。

    - 路径参数 year: 年度ID
    - 路径参数 key: システム項目ID（int）＝更新対象
    - 请求体: 更新后的項目情報（新增と同じ形式）
      - projectId / abbr はテーブルに対応する列がないため使用しない
    - 返回: 更新后的項目对象
    """
    return _update_project(db, year, key, project)


@router.delete("/projects/{year}/{key}")
def delete_project(
    year: str,
    key: int,
    db: Session = Depends(get_db),
):
    """删除項目。

    - 路径参数 year: 年度ID
    - 路径参数 key: システム項目ID（int）＝删除対象
    - 请求体: 无
    - 返回: 固定 {"code": 0}（成功时）
    """
    _delete_project(db, year, key)
    return {"code": 0}
