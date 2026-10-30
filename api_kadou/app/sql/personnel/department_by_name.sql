-- 一括取り込み：部門名から部門IDを引く（年度指定）
SELECT department_id
FROM jn_department_master
WHERE year_id = :year_id
  AND department_name = :department_name
ORDER BY department_id
LIMIT 1
