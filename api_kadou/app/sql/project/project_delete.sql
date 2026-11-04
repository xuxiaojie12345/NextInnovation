-- プロジェクト管理画面：プロジェクトの削除（年度 + システム項目IDで特定）
DELETE FROM jn_project_master
WHERE year_id = :year_id
  AND sys_project_id = :sys_project_id
