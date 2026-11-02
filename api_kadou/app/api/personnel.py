"""要員情報画面（PersonnelInfoScreen）の API

API_ID  : PersonnelInfoScreen
API_PATH: /api/kadou/personnel/{employeeNo}/{year}  (GET)

NOTE: 既存の部門管理（app/api/department.py）と同じ router に相乗りせず、
      独立した router として登録する（既存コードへ影響を与えないため）。
"""
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.audit import normalize_op_user
from app.db.session import get_db
from app.schemas.personnel import (
    PersonnelCount,
    PersonnelDeleteResult,
    PersonnelImportRequest,
    PersonnelImportResult,
    PersonnelInfo,
    PersonnelSaveRequest,
    PersonnelWeeklyCount,
)
from app.services.personnel import (
    count_personnel,
    count_weekly_assignments,
    delete_personnel,
    get_personnel,
    import_personnel,
    save_personnel,
)

router = APIRouter(prefix="/api/kadou/personnel", tags=["personnel"])


@router.get("/count/{year}", response_model=PersonnelCount)
def get_personnel_count(year: str, db: Session = Depends(get_db)):
    """現在の登録要員数（jn_personnel_master の件数）を返す。"""
    return PersonnelCount(year=year, count=count_personnel(db, year))


@router.post("/import/{year}", response_model=PersonnelImportResult)
def post_personnel_import(
    year: str,
    payload: PersonnelImportRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    """社員情報の一括取り込み。

    年度 + 社員番号で既存データを判定し、存在すれば更新、しなければ追加する。

    - dryRun=true  : 検証のみ（DB へは書き込まない）
    - overwrite=false かつ既存データと重複 : ファイル全体を中止（409）
    - ファイル内で社員番号が重複 : ファイル全体を中止（409）

    新規追加時は登録日時／登録者 = システム日時／ログインユーザー、
    更新日時／更新者も同じ値、異動フラグ = '0' をセットする。
    更新時は更新日時／更新者のみ書き換える。
    """
    op_user = normalize_op_user(x_user_id)
    result = import_personnel(db, year, payload, op_user)

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


@router.get("/{employeeNo}/{year}", response_model=PersonnelInfo)
def get_personnel_info(
    employeeNo: str, year: str, db: Session = Depends(get_db)
):
    """要員情報画面：社員番号で要員情報を1件取得する。"""
    employee_no = employeeNo.strip()
    if not employee_no:
        raise HTTPException(status_code=400, detail="社員番号を指定してください。")

    personnel = get_personnel(db, year, employee_no)
    if personnel is None:
        raise HTTPException(
            status_code=404,
            detail=f"社員番号「{employee_no}」の要員情報が見つかりません。",
        )
    return PersonnelInfo(**personnel)


@router.put("/{employeeNo}/{year}", response_model=PersonnelInfo)
def put_personnel(
    employeeNo: str,
    year: str,
    payload: PersonnelSaveRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    """要員情報画面：要員を保存する（存在すれば更新・なければ追加）。

    新規追加時は登録日時／登録者 = システム日時／ログインユーザー、
    更新日時／更新者も同じ値、異動フラグ = '0' をセットする。
    更新時は更新日時／更新者のみ書き換える。
    """
    employee_no = employeeNo.strip()
    if not employee_no:
        raise HTTPException(status_code=400, detail="社員番号を指定してください。")
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="名前を入力してください。")

    op_user = normalize_op_user(x_user_id)
    try:
        saved, _created = save_personnel(db, year, employee_no, payload, op_user)
    except ValueError as e:
        # 部門マスタ未登録など、入力内容ではなくマスタ不足による保存不可
        raise HTTPException(status_code=400, detail=str(e)) from e
    return PersonnelInfo(**saved)


@router.get("/{employeeNo}/{year}/weekly-count", response_model=PersonnelWeeklyCount)
def get_weekly_count(
    employeeNo: str, year: str, db: Session = Depends(get_db)
):
    """要員情報画面：指定年度 + 社員番号の週割当件数を返す（削除確認用）。

    jn_weekly_assignment_table を year_id と employee_no で絞り込んで数える。
    """
    employee_no = employeeNo.strip()
    if not employee_no:
        raise HTTPException(status_code=400, detail="社員番号を指定してください。")
    return PersonnelWeeklyCount(
        year=year,
        employeeNo=employee_no,
        count=count_weekly_assignments(db, year, employee_no),
    )


@router.delete("/{employeeNo}/{year}", response_model=PersonnelDeleteResult)
def remove_personnel(
    employeeNo: str,
    year: str,
    deleteWeekly: bool = Query(
        default=False,
        description="true のとき、jn_weekly_assignment_table の当該年度・社員番号の週割当も削除する",
    ),
    db: Session = Depends(get_db),
):
    """要員情報画面：要員を削除する。

    deleteWeekly=true の場合、年度 + 社員番号を検索条件として
    jn_weekly_assignment_table（要員稼動管理の週割当）も同時に削除する。
    """
    employee_no = employeeNo.strip()
    if not employee_no:
        raise HTTPException(status_code=400, detail="社員番号を指定してください。")

    # 削除前に件数を控える（実際に消えた件数を返すため）
    weekly_count = count_weekly_assignments(db, year, employee_no)

    if not delete_personnel(db, year, employee_no, delete_weekly=deleteWeekly):
        raise HTTPException(
            status_code=404,
            detail=f"社員番号「{employee_no}」の要員情報が見つかりません。",
        )
    return PersonnelDeleteResult(
        code=0,
        deletedWeeklyCount=weekly_count if deleteWeekly else 0,
    )
