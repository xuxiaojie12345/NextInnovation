-- 要員情報画面：指定年度の登録要員数
SELECT COUNT(*) AS personnel_count
FROM jn_personnel_master
WHERE year_id = :year_id
