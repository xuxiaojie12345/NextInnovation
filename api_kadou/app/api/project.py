"""プロジェクト管理画面（ProjectManagementScreen）の API

API_ID  : ProjectManagementScreen
API_PATH: /api/kadou/projects/{year}            (GET  一覧)
          /api/kadou/projects/{year}            (POST 追加)
          /api/kadou/projects/{year}/{key}      (PUT  更新)
          /api/kadou/projects/{year}/{key}      (DELETE 削除)
          /api/kadou/projects/import/{year}     (POST 一括取り込み)

"""
from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.project import (
    ProjectDeleteResult,
    ProjectImportRequest,
    ProjectImportResult,
    ProjectInfo,
    ProjectSaveRequest,
)
from app.services.project import (
    fetch_project_list,
    import_project_rows,
    modify_project,
    register_project,
    remove_project,
)

router = APIRouter(prefix="/api/kadou/projects", tags=["projects"])


@router.get("/{year}", response_model=list[ProjectInfo])
def get_projects(year: str, db: Session = Depends(get_db)):
    """プロジェクト管理画面：指定年度のプロジェクト一覧を返す。"""
    return fetch_project_list(db, year)


@router.post("/import/{year}", response_model=ProjectImportResult)
def post_project_import(
    year: str,
    payload: ProjectImportRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    """プロジェクト情報の一括取り込み。

    - dryRun=true : 検証のみ（DB へは書き込まない）
    取り込んだ行はすべて新しいプロジェクトとして追加する。
    （中止時の 409 送出はサービス側で行う）
    """
    return import_project_rows(db, year, payload, x_user_id)


@router.post("/{year}", response_model=ProjectInfo, status_code=201)
def add_project(
    year: str,
    payload: ProjectSaveRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    """プロジェクト管理画面：プロジェクトを追加して追加後のオブジェクトを返す。"""
    return ProjectInfo(**register_project(db, year, payload, x_user_id))


@router.put("/{year}/{key}", response_model=ProjectInfo)
def edit_project(
    year: str,
    key: str,
    payload: ProjectSaveRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    """プロジェクト管理画面：プロジェクトを更新して更新後のオブジェクトを返す。"""
    return ProjectInfo(**modify_project(db, year, key, payload, x_user_id))


@router.delete("/{year}/{key}", response_model=ProjectDeleteResult)
def remove_project_endpoint(year: str, key: str, db: Session = Depends(get_db)):
    """プロジェクト管理画面：プロジェクトを削除する。"""
    return remove_project(db, year, key)

