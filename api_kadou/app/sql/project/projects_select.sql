-- プロジェクト管理画面：指定年度のプロジェクト一覧（年度指定）
-- 所属部門名は同じ年度の部門マスタから取得する
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
ORDER BY p.sys_project_id
