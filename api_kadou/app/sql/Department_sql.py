from sqlalchemy import text

# jn_department_master 表查询 SQL
# 根据 year_id 查询，返回 department_id / department_name / department_alisa / location / kind
DEPARTMENT_SELECT_BY_YEAR = text("""
SELECT
    department_id,
    department_name,
    department_alisa,
    location,
    kind
FROM
    jn_department_master
WHERE
    year_id = :year_id
""")

# jn_department_master 表插入 SQL
# department_id は AUTO_INCREMENT のため INSERT 対象外（登録後に採番値を取得する）
DEPARTMENT_INSERT = text("""
INSERT INTO jn_department_master
    (year_id, department_name, department_alisa, location, kind, register_user, update_user)
VALUES
    (:year_id, :department_name, :department_alisa, :location, :kind, :register_user, :update_user)
""")

DEPARTMENT_UPDATE = text("""
UPDATE jn_department_master
SET
    department_name = :department_name,
    department_alisa = :department_alisa,
    location = :location,
    kind = :kind,
    update_user = :update_user
WHERE
    year_id = :year_id
    AND department_id = :department_id
""")

DEPARTMENT_DELETE = text("""
DELETE FROM jn_department_master
WHERE
    year_id = :year_id
    AND department_id = :department_id
""")
