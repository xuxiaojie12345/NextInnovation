-- プロジェクト管理画面：システム項目ID による1件取得（年度指定）
SELECT
    p.sys_project_id,
    p.project_id,
    p.customer,
    p.case_name,
    p.team,
    p.sub_team,
    p.department_id,
    d.department_name,
    p.project_name,
    p.valid_flg,
    p.education_flg
FROM jn_project_master p
LEFT JOIN jn_department_master d
    ON d.year_id = p.year_id
    AND d.department_id = p.department_id
WHERE p.year_id = :year_id
  AND p.sys_project_id = :sys_project_id
LIMIT 1
