from sqlalchemy import bindparam, text

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
    (
        SELECT p.person_name
        FROM jn_personnel_master p
        WHERE p.year_id = a.year_id
          AND p.employee_no = a.employee_no
        ORDER BY p.update_datetime DESC, p.register_datetime DESC
        LIMIT 1
    ) AS person_name,
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

# 稼働状況（週次アサイン）保存：行削除・社員番号変更した社員の
# 当該年度データのみ削除する（画面で変更された週だけを更新するため、
# 通常の変更では年度全量・社員全量の削除は行わない）
WORK_STATUS_DELETE_BY_EMPLOYEES = text("""
DELETE FROM jn_weekly_assignment_table
WHERE year_id = :year_id
  AND employee_no IN :employee_nos
""").bindparams(bindparam("employee_nos", expanding=True))

# 稼働状況（週次アサイン）1 週分の更新
# 画面で変更された「社員 × 週」の行だけを更新する（他の週には触れない）
WORK_STATUS_UPDATE_BY_WEEK = text("""
UPDATE jn_weekly_assignment_table
SET
    department_id = :department_id,
    sys_project_id = :sys_project_id,
    is_unpaid = :is_unpaid,
    version = COALESCE(version, 0) + 1,
    update_user = :update_user
WHERE year_id = :year_id
  AND employee_no = :employee_no
  AND week_start_date = :week_start_date
""")

# 稼働状況（週次アサイン）1 週分の登録
# ※対象社員のデータを削除してから登録するため、version は常に 1 を設定する
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

# 異動：指定社員の「適用開始週（week_start_date >= :fromWeek）」以降の週次レコードの
# 所属部門ID を新しい部門へ一括更新する（割当・BUFFER は変更しない）
WORK_STATUS_UPDATE_DEPARTMENT_FROM_WEEK = text("""
UPDATE jn_weekly_assignment_table
SET
    department_id = :new_department_id,
    version = COALESCE(version, 0) + 1,
    update_user = :update_user
WHERE year_id = :year_id
  AND employee_no = :employee_no
  AND week_start_date >= :from_week
""")
