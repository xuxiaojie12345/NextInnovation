-- プロジェクト管理画面：プロジェクトの新規追加
INSERT INTO jn_project_master
  (year_id, sys_project_id, customer, case_name, team, sub_team,
   department_id, project_id, project_name,
   register_datetime, register_user, update_datetime, update_user)
VALUES
  (:year_id, :sys_project_id, :customer, :case_name, :team, :sub_team,
   :department_id, :project_id, :project_name,
   NOW(), :op_user, NOW(), :op_user)
