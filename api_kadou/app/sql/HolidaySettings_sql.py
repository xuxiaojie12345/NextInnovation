from sqlalchemy import text

# 休日マスタの日付存在チェック（同一日付は年度内で一意）
SQL_SELECT_HOLIDAY_COUNT_BY_DATE = text("""
SELECT COUNT(*) AS cnt
FROM JN_HOLIDAY_MASTER
WHERE year_id = :yearId
  AND holiday_date = :holidayDate;
""")

# 年度内の休日一覧
SQL_SELECT_HOLIDAYS_BY_YEAR = text("""
SELECT
    holiday_id,
    holiday_kind,
    holiday_date,
    holiday_name
FROM
    JN_HOLIDAY_MASTER
WHERE
    year_id = :yearId
ORDER BY
    holiday_date;
""")

# 日付を指定して 1 件取得（登録直後のレコード取得用）
SQL_SELECT_HOLIDAY_BY_DATE = text("""
SELECT
    holiday_id,
    holiday_kind,
    holiday_date,
    holiday_name
FROM
    JN_HOLIDAY_MASTER
WHERE
    year_id = :yearId
    AND holiday_date = :holidayDate;
""")

# 休日IDを指定して 1 件取得
SQL_SELECT_HOLIDAY_BY_ID = text("""
SELECT
    holiday_id,
    holiday_kind,
    holiday_date,
    holiday_name
FROM
    JN_HOLIDAY_MASTER
WHERE
    year_id = :yearId
    AND holiday_id = :holidayId;
""")

# 更新時の日付重複チェック（更新対象自身は除く）
SQL_SELECT_HOLIDAY_COUNT_BY_DATE_EXCLUDING_ID = text("""
SELECT COUNT(*) AS cnt
FROM JN_HOLIDAY_MASTER
WHERE year_id = :yearId
  AND holiday_date = :holidayDate
  AND holiday_id <> :holidayId;
""")

# 休日マスタ登録（holiday_id は自動採番）
SQL_INSERT_HOLIDAY_MASTER = text("""
INSERT INTO JN_HOLIDAY_MASTER (
    year_id,
    holiday_kind,
    holiday_date,
    holiday_name,
    register_user,
    update_user
) VALUES (
    :yearId,
    :holidayKind,
    :holidayDate,
    :holidayName,
    :registerUser,
    :updateUser
);
""")

# 休日マスタ更新
SQL_UPDATE_HOLIDAY_MASTER = text("""
UPDATE JN_HOLIDAY_MASTER
SET
    holiday_kind = :holidayKind,
    holiday_date = :holidayDate,
    holiday_name = :holidayName,
    update_user = :updateUser
WHERE
    year_id = :yearId
    AND holiday_id = :holidayId;
""")

# 休日マスタ削除
SQL_DELETE_HOLIDAY_MASTER = text("""
DELETE FROM JN_HOLIDAY_MASTER
WHERE
    year_id = :yearId
    AND holiday_id = :holidayId;
""")