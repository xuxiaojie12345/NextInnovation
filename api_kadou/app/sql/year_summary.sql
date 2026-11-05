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
    -- 固定 2025〜2036 の年度を常に返す（データが無い年度は 0 件表示）
    SELECT '2025' AS year_id
    UNION ALL SELECT '2026'
    UNION ALL SELECT '2027'
    UNION ALL SELECT '2028'
    UNION ALL SELECT '2029'
    UNION ALL SELECT '2030'
    UNION ALL SELECT '2031'
    UNION ALL SELECT '2032'
    UNION ALL SELECT '2033'
    UNION ALL SELECT '2034'
    UNION ALL SELECT '2035'
    UNION ALL SELECT '2036'
) base
LEFT JOIN (
    SELECT year_id, COUNT(DISTINCT department_id) AS departmentCount
    FROM jn_department_master
    GROUP BY year_id
) dept ON base.year_id COLLATE utf8mb4_unicode_ci = dept.year_id COLLATE utf8mb4_unicode_ci
LEFT JOIN (
    SELECT year_id, COUNT(DISTINCT employee_no) AS personnelCount
    FROM jn_personnel_master
    GROUP BY year_id
) person ON base.year_id COLLATE utf8mb4_unicode_ci = person.year_id COLLATE utf8mb4_unicode_ci
LEFT JOIN (
    SELECT year_id, COUNT(DISTINCT sys_project_id) AS projectCount
    FROM jn_project_master
    GROUP BY year_id
) proj ON base.year_id COLLATE utf8mb4_unicode_ci = proj.year_id COLLATE utf8mb4_unicode_ci
LEFT JOIN (
    SELECT year_id, COUNT(DISTINCT holiday_id) AS holidayCount
    FROM jn_holiday_master
    GROUP BY year_id
) hol ON base.year_id COLLATE utf8mb4_unicode_ci = hol.year_id COLLATE utf8mb4_unicode_ci
ORDER BY base.year_id;