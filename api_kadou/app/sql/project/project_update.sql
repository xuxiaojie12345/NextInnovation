-- プロジェクト管理画面：プロジェクトの更新（年度 + システム項目IDで特定）
UPDATE jn_project_master
SET customer = :customer,
    case_name = :case_name,
    team = :team,
    sub_team = :sub_team,
    department_id = :department_id,
    project_id = :project_id,
    project_name = :project_name,
    update_datetime = NOW(),
    update_user = :op_user
WHERE year_id = :year_id
  AND sys_project_id = :sys_project_id
