-- 部門一覧取得（年度指定）
SELECT department_id, department_name, location, kind
FROM jn_department_master
WHERE year_id = :year_id
ORDER BY department_id