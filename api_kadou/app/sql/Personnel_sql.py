from sqlalchemy import text

SQL_GET_JN_PERSONNEL_MASTER = text("""
    SELECT employee_no AS employeeNo, 
           department_id AS departmentId, 
           person_name AS name, 
           `role` AS role, 
           leave_plan AS leavePlan
    FROM `JN_PERSONNEL_MASTER`
    WHERE year_id = :year
    AND employee_no = :employeeNo
    ORDER BY update_datetime DESC, register_datetime DESC
    LIMIT 1
""")

SQL_LIST_JN_PERSONNEL_MASTER = text("""
    SELECT employee_no AS employeeNo, department_id AS departmentId,
           person_name AS name, `role` AS role, leave_plan AS leavePlan,
           update_datetime, register_datetime
    FROM `JN_PERSONNEL_MASTER`
    WHERE year_id = :year
    ORDER BY employee_no, update_datetime DESC, register_datetime DESC
""")

SQL_GET_JN_DEPARTMENT_MASTER = text("""
    SELECT department_name
    FROM `JN_DEPARTMENT_MASTER`
    WHERE year_id = :year
    AND department_id = :departmentId
""")

SQL_INSERT_JN_PERSONNEL_MASTER = text("""
INSERT INTO `JN_PERSONNEL_MASTER`
    (year_id, employee_no, department_id, idou_flag, idoubi, person_name,
     `role`, leave_plan, register_datetime, register_user, update_datetime,
     update_user)
VALUES
    (:year, :employeeNo, :departmentId, :idouFlag, :idoubi, :personName,
     :role, :leavePlan, :registerDatetime, :registerUser, :updateDatetime,
     :updateUser)
""")

SQL_DELETE_JN_PERSONNEL_MASTER = text("""
DELETE FROM `JN_PERSONNEL_MASTER`
WHERE year_id = :year
AND employee_no = :employeeNo
""")

SQL_UPDATE_JN_PERSONNEL_MASTER = text("""
UPDATE `JN_PERSONNEL_MASTER`
SET department_id = :departmentId,
    person_name = :personName,
    `role` = :role,
    leave_plan = :leavePlan,
    update_datetime = :updateDatetime,
    update_user = :updateUser
WHERE year_id = :year
AND employee_no = :employeeNo
""")
