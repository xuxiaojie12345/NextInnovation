-- プロジェクト管理画面（一括取り込み）：重複判定用の既存プロジェクト一覧
-- 判定条件（いずれか一致で重複）：
--   1) 略称（顧客の1文字目・案件・チーム・Subチーム）
--   2) 項目ID（project_id）
--   3) Project名称（project_name）
-- 完全重複判定用に、全項目（所属部門を含む）も取得する。
-- 略称は DB に保持していないため、画面（サービス層）と同じ規則で組み立てて比較する。
SELECT
    p.sys_project_id,
    p.project_id,
    p.customer,
    p.case_name,
    p.team,
    p.sub_team,
    p.department_id,
    p.project_name,
    CONCAT_WS(
        '・',
        NULLIF(LEFT(TRIM(COALESCE(p.customer, '')), 1), ''),
        NULLIF(TRIM(COALESCE(p.case_name, '')), ''),
        NULLIF(TRIM(COALESCE(p.team, '')), ''),
        NULLIF(TRIM(COALESCE(p.sub_team, '')), '')
    ) AS abbr
FROM jn_project_master p
WHERE p.year_id = :year_id
ORDER BY p.sys_project_id
