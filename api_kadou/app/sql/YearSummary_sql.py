from sqlalchemy import text

# 年度ごとの部門数
SQL_COUNT_DEPARTMENTS_BY_YEAR = text("""
SELECT
    year_id,
    COUNT(DISTINCT department_id) AS cnt
FROM
    JN_DEPARTMENT_MASTER
GROUP BY
    year_id
""")

# 年度ごとの要員数（同一社員番号は 1 名として数える）
SQL_COUNT_PERSONNEL_BY_YEAR = text("""
SELECT
    year_id,
    COUNT(DISTINCT employee_no) AS cnt
FROM
    JN_PERSONNEL_MASTER
GROUP BY
    year_id
""")

# 年度ごとのプロジェクト数
SQL_COUNT_PROJECTS_BY_YEAR = text("""
SELECT
    year_id,
    COUNT(*) AS cnt
FROM
    JN_PROJECT_MASTER
GROUP BY
    year_id
""")

# 年度ごとの休日数
SQL_COUNT_HOLIDAYS_BY_YEAR = text("""
SELECT
    year_id,
    COUNT(*) AS cnt
FROM
    JN_HOLIDAY_MASTER
GROUP BY
    year_id
""")
