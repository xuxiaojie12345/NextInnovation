from sqlalchemy import text

# jn_project_master 表插入 SQL
# sys_project_id は AUTO_INCREMENT のため INSERT 対象外（登録後に採番値を取得する）
PROJECT_INSERT = text("""
INSERT INTO jn_project_master
    (year_id, customer, case_name, team, sub_team, department_id,
     project_id, project_name, register_user, update_user)
VALUES
    (:year_id, :customer, :case_name, :team, :sub_team, :department_id,
     :project_id, :project_name, :register_user, :update_user)
""")

# jn_project_master 表查询 SQL
# 根据 year_id 查询該年度の項目一覧（システム項目ID 順）
PROJECT_SELECT_BY_YEAR = text("""
SELECT
    sys_project_id,
    year_id,
    customer,
    case_name,
    team,
    sub_team,
    department_id,
    project_id,
    project_name
FROM
    jn_project_master
WHERE
    year_id = :year_id
ORDER BY
    sys_project_id
""")

# jn_project_master 表更新 SQL
# 主键（year_id + sys_project_id）で対象を特定する
PROJECT_UPDATE = text("""
UPDATE jn_project_master
SET
    customer = :customer,
    case_name = :case_name,
    team = :team,
    sub_team = :sub_team,
    department_id = :department_id,
    project_id = :project_id,
    project_name = :project_name,
    update_user = :update_user
WHERE
    year_id = :year_id
    AND sys_project_id = :sys_project_id
""")

# jn_project_master 表削除 SQL
PROJECT_DELETE = text("""
DELETE FROM jn_project_master
WHERE
    year_id = :year_id
    AND sys_project_id = :sys_project_id
""")
