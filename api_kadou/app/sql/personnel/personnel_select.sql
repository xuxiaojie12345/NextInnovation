-- 要員情報画面：社員番号による1件取得（年度指定）
-- 所属部門名は同じ年度の部門マスタから取得する
SELECT
    p.employee_no,
    p.person_name,
    p.department_id,
    d.department_name,
    p.role,
    p.leave_plan
FROM jn_personnel_master p
LEFT JOIN jn_department_master d
    ON d.year_id = p.year_id
    AND d.department_id = p.department_id
WHERE p.year_id = :year_id
  AND p.employee_no = :employee_no
ORDER BY p.department_id
LIMIT 1
