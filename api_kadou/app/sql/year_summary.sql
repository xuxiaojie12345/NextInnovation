-- 年度ごとのデータ概要（YearSelect 画面用）
-- weekCount は SQL では算出せず、API 側（app/services/year.py）で算出する。
-- 参照：フロントエンド src/data/yearWeeks.ts の buildYearWeeks と同じロジック
SELECT
    base.year_id AS `year`,
    COALESCE(dept.departmentCount, 0)  AS departmentCount,
    COALESCE(person.personnelCount, 0) AS personnelCount,
    COALESCE(proj.projectCount, 0)     AS projectCount,
    COALESCE(hol.holidayCount, 0)      AS holidayCount
FROM (
    -- ここがポイント：指定部門が存在する年度だけ抽出
    SELECT DISTINCT year_id
    FROM jn_department_master
) base
LEFT JOIN (
    SELECT year_id, COUNT(DISTINCT department_id) AS departmentCount
    FROM jn_department_master
    GROUP BY year_id
) dept ON base.year_id = dept.year_id
LEFT JOIN (
    SELECT year_id, COUNT(DISTINCT employee_no) AS personnelCount
    FROM jn_weekly_assignment_table
    GROUP BY year_id
) person ON base.year_id = person.year_id
LEFT JOIN (
    SELECT year_id, COUNT(DISTINCT sys_project_id) AS projectCount
    FROM jn_project_master
    GROUP BY year_id
) proj ON base.year_id = proj.year_id
LEFT JOIN (
    SELECT year_id, COUNT(DISTINCT holiday_date) AS holidayCount
    FROM jn_holiday_master
    GROUP BY year_id
) hol ON base.year_id = hol.year_id
ORDER BY base.year_id;