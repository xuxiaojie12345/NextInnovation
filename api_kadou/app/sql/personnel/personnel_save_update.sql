-- 要員情報画面：要員の更新（年度 + 社員番号で特定）
UPDATE jn_personnel_master
SET department_id = :department_id,
    person_name = :person_name,
    role = :role,
    leave_plan = :leave_plan,
    update_datetime = NOW(),
    update_user = :op_user
WHERE year_id = :year_id
  AND employee_no = :employee_no
