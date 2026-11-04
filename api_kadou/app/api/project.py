"""プロジェクト管理画面（ProjectManagementScreen）の API

API_ID  : ProjectManagementScreen
API_PATH: /api/kadou/projects/{year}            (GET  一覧)
          /api/kadou/projects/{year}            (POST 追加)
          /api/kadou/projects/{year}/{key}      (PUT  更新)
          /api/kadou/projects/{year}/{key}      (DELETE 削除)
          /api/kadou/projects/import/{year}     (POST 一括取り込み)

NOTE: 既存の部門管理（app/api/department.py）・要員情報（app/api/personnel.py）とは
      別の router として登録する（既存コードへ影響を与えないため）。
"""
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.exc import IntegrityError
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
    create_project,
    delete_project,
    import_projects,
    list_projects,
    update_project,
)

router = APIRouter(prefix="/api/kadou/projects", tags=["projects"])


@router.get("/{year}", response_model=list[ProjectInfo])
def get_projects(year: str, db: Session = Depends(get_db)):
    """プロジェクト管理画面：指定年度のプロジェクト一覧を返す。"""
    return list_projects(db, year)


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
    """
    op_user = (x_user_id or "").strip() or "ADMIN"
    result = import_projects(db, year, payload, op_user)

    # ファイル全体を中止した場合は 409 で返す（1件も反映していない）
    if result.aborted:
        raise HTTPException(
            status_code=409,
            detail={
                "message": result.abortReason or "取り込みを中止しました。",
                "result": result.model_dump(),
            },
        )
    return result


@router.post("/{year}", response_model=ProjectInfo, status_code=201)
def add_project(
    year: str,
    payload: ProjectSaveRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    """プロジェクト管理画面：プロジェクトを追加して追加後のオブジェクトを返す。"""
    if not payload.customer.strip():
        raise HTTPException(status_code=400, detail="顧客を入力してください。")
    if not payload.caseName.strip():
        raise HTTPException(status_code=400, detail="案件を入力してください。")

    op_user = (x_user_id or "").strip() or "ADMIN"
    try:
        created = create_project(db, year, payload.model_dump(), op_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except IntegrityError:
        raise HTTPException(
            status_code=409, detail="プロジェクトの登録に失敗しました。"
        )
    return ProjectInfo(**created)


@router.put("/{year}/{key}", response_model=ProjectInfo)
def edit_project(
    year: str,
    key: str,
    payload: ProjectSaveRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    """プロジェクト管理画面：プロジェクトを更新して更新後のオブジェクトを返す。"""
    project_id = key.strip()
    if not project_id:
        raise HTTPException(
            status_code=400, detail="システム項目IDを指定してください。"
        )
    if not payload.customer.strip():
        raise HTTPException(status_code=400, detail="顧客を入力してください。")
    if not payload.caseName.strip():
        raise HTTPException(status_code=400, detail="案件を入力してください。")

    op_user = (x_user_id or "").strip() or "ADMIN"
    try:
        updated = update_project(
            db, year, project_id, payload.model_dump(), op_user
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except IntegrityError:
        raise HTTPException(
            status_code=409, detail="プロジェクトの更新に失敗しました。"
        )
    if updated is None:
        raise HTTPException(status_code=404, detail="プロジェクトが見つかりません。")
    return ProjectInfo(**updated)


@router.delete("/{year}/{key}", response_model=ProjectDeleteResult)
def remove_project(year: str, key: str, db: Session = Depends(get_db)):
    """プロジェクト管理画面：プロジェクトを削除する。"""
    project_id = key.strip()
    if not project_id:
        raise HTTPException(
            status_code=400, detail="システム項目IDを指定してください。"
        )
    if not delete_project(db, year, project_id):
        raise HTTPException(status_code=404, detail="プロジェクトが見つかりません。")
    return ProjectDeleteResult(code=0)
