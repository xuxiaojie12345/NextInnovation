-- 部門更新
UPDATE jn_department_master
SET department_name = :department_name,
    location = :location,
    kind = :kind,
    update_datetime = NOW(),
    update_user = :op_user
WHERE year_id = :year_id AND department_id = :department_id