-- 部門追加
INSERT INTO jn_department_master
  (year_id, department_id, department_name, location, kind,
   register_datetime, register_user, update_datetime, update_user)
VALUES
  (:year_id, :department_id, :department_name, :location, :kind,
   NOW(), :op_user, NOW(), :op_user)