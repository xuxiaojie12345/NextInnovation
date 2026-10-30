-- 一括取り込み：要員の新規追加
INSERT INTO jn_personnel_master
  (year_id, employee_no, department_id, idou_flag, idoubi,
   person_name, role, leave_plan,
   register_datetime, register_user, update_datetime, update_user)
VALUES
  (:year_id, :employee_no, :department_id, :idou_flag, :idoubi,
   :person_name, :role, :leave_plan,
   NOW(), :op_user, NOW(), :op_user)
