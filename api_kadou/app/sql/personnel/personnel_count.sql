-- 要員情報画面：指定年度の登録要員数（異動で複数行ある場合は 1 名として数える）
SELECT COUNT(DISTINCT employee_no) AS personnel_count
FROM jn_personnel_master
WHERE year_id = :year_id
