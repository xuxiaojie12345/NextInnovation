"""要員情報画面（PersonnelInfoScreen）の API

API_ID  : PersonnelInfoScreen
API_PATH: /api/kadou/personnel/{employeeNo}/{year}  (GET)

NOTE: 本モジュールは「Web 側データの受け取り／返却」のみを担当する。
      入力チェック・存在確認・業務エラーの生成は services/personnel.py に集約する。
      既存の部門管理（app/api/department.py）と同じ router に相乗りせず、
      独立した router として登録する（既存コードへ影響を与えないため）。
"""
from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy.orm import Session

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
    fetch_personnel_info,
    fetch_weekly_count,
    import_personnel_or_raise,
    register_personnel,
    remove_personnel,
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
    # 中止（409）の判定と発生は services/personnel.py に集約している。
    return import_personnel_or_raise(db, year, payload, x_user_id)


@router.get("/{employeeNo}/{year}", response_model=PersonnelInfo)
def get_personnel_info(
    employeeNo: str, year: str, db: Session = Depends(get_db)
):
    """要員情報画面：社員番号で要員情報を1件取得する。"""
    return PersonnelInfo(**fetch_personnel_info(db, year, employeeNo))


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
    saved = register_personnel(db, year, employeeNo, payload, x_user_id)
    return PersonnelInfo(**saved)


@router.get("/{employeeNo}/{year}/weekly-count", response_model=PersonnelWeeklyCount)
def get_weekly_count(
    employeeNo: str, year: str, db: Session = Depends(get_db)
):
    """要員情報画面：指定年度 + 社員番号の週割当件数を返す（削除確認用）。

    jn_weekly_assignment_table を year_id と employee_no で絞り込んで数える。
    """
    return PersonnelWeeklyCount(
        year=year,
        employeeNo=employeeNo.strip(),
        count=fetch_weekly_count(db, year, employeeNo),
    )


@router.delete("/{employeeNo}/{year}", response_model=PersonnelDeleteResult)
def remove_personnel_endpoint(
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
    _, deleted_weekly_count = remove_personnel(
        db, year, employeeNo, delete_weekly=deleteWeekly
    )
    return PersonnelDeleteResult(
        code=0,
        deletedWeeklyCount=deleted_weekly_count,
    )
