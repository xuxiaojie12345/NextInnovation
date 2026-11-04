-- プロジェクト管理画面：システム項目ID の最大値（年度指定）
SELECT MAX(sys_project_id)
FROM jn_project_master
WHERE year_id = :year_id
