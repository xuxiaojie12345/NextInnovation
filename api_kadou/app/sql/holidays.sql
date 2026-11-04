-- 休日管理画面で使う SQL（jn_holiday_master）

-- :name: findby_holidays
-- 休日一覧取得（年度指定）
SELECT holiday_id,
       year_id,
       holiday_kind,
       holiday_date,
       holiday_name
FROM jn_holiday_master
WHERE year_id = :year_id
ORDER BY holiday_date

-- :name: add_holiday
-- 休日追加
INSERT INTO jn_holiday_master (
    year_id,
    holiday_date,
    holiday_name,
    holiday_kind,
    register_datetime,
    register_user,
    update_datetime,
    update_user
) VALUES (
    :year_id,    
    :holiday_date,
    :holiday_name,
    :holiday_kind,
    CURRENT_TIMESTAMP,
    :user_id,
    CURRENT_TIMESTAMP,
    :user_id
);

-- :name: update_holiday
-- 休日更新
UPDATE jn_holiday_master
SET holiday_date = :holiday_date,
    holiday_name = :holiday_name,
    holiday_kind = :holiday_kind,
    update_datetime = CURRENT_TIMESTAMP,
    update_user = :user_id
WHERE year_id = :year_id
  AND holiday_id = :holiday_id;

-- :name: delete_holiday
-- 休日削除
DELETE FROM jn_holiday_master
WHERE year_id = :year_id
  AND holiday_id = :holiday_id;
