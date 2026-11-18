from sqlalchemy import text

# 稼働状況（週次アサイン）検索 SQL
# jn_weekly_assignment_table を年度IDで検索し、以下を名称解決して返す
#   - 社員番号 + 年度ID → jn_personnel_master.person_name（氏名）
#   - 所属部門ID + 年度ID → jn_department_master.department_name（所属部門名）
#   - システム項目ID + 年度ID → jn_project_master.project_name（項目名）
# 名称が引けない場合でもアサイン行自体は返すため LEFT JOIN とする
WORK_STATUS_SELECT_BY_YEAR = text("""
SELECT
    a.year_id,
    a.employee_no,
    p.person_name,
    a.department_id,
    d.department_name,
    a.sys_project_id,
    pj.project_name,
    a.week_start_date,
    a.week_end_date,
    a.is_unpaid,
    a.version
FROM
    jn_weekly_assignment_table a
LEFT JOIN
    jn_personnel_master p
    ON p.year_id = a.year_id
    AND p.employee_no = a.employee_no
LEFT JOIN
    jn_department_master d
    ON d.year_id = a.year_id
    AND d.department_id = a.department_id
LEFT JOIN
    jn_project_master pj
    ON pj.year_id = a.year_id
    AND pj.sys_project_id = a.sys_project_id
WHERE
    a.year_id = :year_id
ORDER BY
    a.employee_no,
    a.week_start_date,
    a.sys_project_id
""")

# 稼働状況（週次アサイン）保存：当該年度のデータを全量置換する
WORK_STATUS_DELETE_BY_YEAR = text("""
DELETE FROM jn_weekly_assignment_table
WHERE year_id = :year_id
""")

# 稼働状況（週次アサイン）1 週分の登録
# ※保存は「年度単位の全量置換」のため、version は常に 1 を設定する
WORK_STATUS_INSERT = text("""
INSERT INTO jn_weekly_assignment_table
    (
        version,
        year_id,
        employee_no,
        department_id,
        week_start_date,
        week_end_date,
        sys_project_id,
        is_unpaid,
        register_user,
        update_user
    )
VALUES
    (
        :version,
        :year_id,
        :employee_no,
        :department_id,
        :week_start_date,
        :week_end_date,
        :sys_project_id,
        :is_unpaid,
        :register_user,
        :update_user
    )
""")
