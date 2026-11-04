-- プロジェクト管理画面：システム項目ID の存在確認（年度指定）
SELECT 1
FROM jn_project_master
WHERE year_id = :year_id
  AND sys_project_id = :sys_project_id
LIMIT 1
