-- プロジェクト管理画面（一括取り込み）：重複判定用の既存プロジェクト一覧
-- 判定条件（一意制約）: (year_id, customer, case_name, team, sub_team)
--   ※ 所属部門 / 項目ID / Project名称 / フラグ類は判定に含めない
--   ※ 比較はアプリ側で「前後空白除去のみ」で行い、大文字/小文字は区別する
SELECT
    p.sys_project_id,
    p.customer,
    p.case_name,
    p.team,
    p.sub_team
FROM jn_project_master p
WHERE p.year_id = :year_id
ORDER BY p.sys_project_id
