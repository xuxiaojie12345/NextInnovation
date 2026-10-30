-- 一括取り込み：年度 + 社員番号で既存データの有無を判定する
SELECT employee_no
FROM jn_personnel_master
WHERE year_id = :year_id
  AND employee_no = :employee_no
LIMIT 1
