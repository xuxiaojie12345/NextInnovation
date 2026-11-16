-- プロジェクト管理画面（一括取り込み）：所属部門名 → 部門ID の解決
-- 取込ファイルの「所属部門」列は部門名称（または部門別名）で記述されるため、
-- jn_project_master.department_id へ登録する前に部門マスタから ID を引く。
-- NOTE: 同一名称が複数ある場合は呼び出し側で「特定できない」と判定するため、
--       ここでは候補をすべて返す（ORDER BY は安定した順序のため）。
SELECT
    d.department_id,
    d.department_name,
    d.department_alisa
FROM jn_department_master d
WHERE d.year_id = :year_id
ORDER BY d.department_id
