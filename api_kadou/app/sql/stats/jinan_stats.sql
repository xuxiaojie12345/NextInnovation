-- ============================================================
-- 済南稼働率統計（JinanWorkRateScreen）まとめ SQL
-- セクションは `-- :name: <セクション名>` で区切る。
-- 取得は load_sql("stats/jinan_stats.sql", "<セクション名>")。
--
-- NOTE: 統計は保存せず、毎回 DB から集計する（要員 / 稼動 / プロジェクトの
--       三つのマスタを連表して年度単位で合計する）。
--       集計対象部門は部門マスタから動的生成する
--       （拠点 = 'JN' かつ 種別 ≠ 協力会社。部門の追加・削除が列の増減に反映される）。
-- ============================================================

-- :name: departments
-- 集計対象部門（拠点 = 'JN' かつ 協力会社以外）を部門マスタから動的生成する。
-- 部門の追加・削除がそのまま統計の部門列の増減に反映される。
SELECT
    d.department_id,
    d.department_name
FROM jn_department_master d
WHERE d.year_id = :year_id
  AND TRIM(d.location) = :location
  AND COALESCE(d.kind, 'dept') <> 'partner'
ORDER BY d.department_id

-- :name: count_sums
-- 部門別の件数合計（総人数 / 離職人数 / 総稼動人数 / 非契約稼動人数 / 教育実施人数）
--
--   ・headcount     : 要員マスタで 対象拠点（:location）の部門に所属する要員数
--                     （異動で複数行になるため社員番号で DISTINCT して数える）
--   ・leavers       : 稼動表の当週プロジェクトが「内・退職」（:leave_project_id）の要員数
--   ・active_total  : 稼動表の当週プロジェクトの有効flg = '1' の要員数
--   ・non_contract  : 稼動表の is_unpaid = '1'（無償支援）の要員数
--   ・training      : 稼動表の当週プロジェクトの教育flg = '1' の要員数
--
-- NOTE: いずれも「要員マスタ（社員番号）→ 稼動表（週割当）→ プロジェクトマスタ」の
--       連表（JOIN）で取得する。稼動表の部門IDは文字列・数値が混在するため、
--       両辺を数値化して比較する。
--
-- NOTE: 同一週（同一 week_start_date）に「内・退職」（:leave_project_id）の割当がある要員は
--       「離職人数」にだけ数え、総稼動人数・非契約稼動人数・教育実施人数には数えない
--       （二重計上を防ぐ）。総人数（headcount）は従来どおり要員マスタで数える。
SELECT
    d.department_id,
    d.department_name,
    (
        SELECT COUNT(DISTINCT p.employee_no)
        FROM jn_personnel_master p
        WHERE p.year_id = :year_id
          AND CAST(p.department_id AS UNSIGNED) = d.department_id
    ) AS headcount,
    (
        SELECT COUNT(DISTINCT a.employee_no)
        FROM jn_personnel_master p
        INNER JOIN jn_weekly_assignment_table a
            ON a.year_id = p.year_id
           AND a.employee_no = p.employee_no
        WHERE p.year_id = :year_id
          AND CAST(p.department_id AS UNSIGNED) = d.department_id
          AND a.sys_project_id = :leave_project_id
    ) AS leavers,
    (
        SELECT COUNT(DISTINCT a.employee_no)
        FROM jn_personnel_master p
        INNER JOIN jn_weekly_assignment_table a
            ON a.year_id = p.year_id
           AND a.employee_no = p.employee_no
        INNER JOIN jn_project_master pr
            ON pr.year_id = a.year_id
           AND pr.sys_project_id = CAST(a.sys_project_id AS SIGNED)
        WHERE p.year_id = :year_id
          AND CAST(p.department_id AS UNSIGNED) = d.department_id
          AND pr.valid_flg = '1'
          -- 同一週に「内・退職」の割当があれば離職者として除外する
          AND NOT EXISTS (
              SELECT 1
              FROM jn_weekly_assignment_table lv
              WHERE lv.year_id = a.year_id
                AND lv.employee_no = a.employee_no
                AND lv.week_start_date = a.week_start_date
                AND lv.sys_project_id = :leave_project_id
          )
    ) AS active_total,
    (
        SELECT COUNT(DISTINCT a.employee_no)
        FROM jn_personnel_master p
        INNER JOIN jn_weekly_assignment_table a
            ON a.year_id = p.year_id
           AND a.employee_no = p.employee_no
        WHERE p.year_id = :year_id
          AND CAST(p.department_id AS UNSIGNED) = d.department_id
          AND a.is_unpaid = '1'
          -- 同一週に「内・退職」の割当があれば離職者として除外する
          AND NOT EXISTS (
              SELECT 1
              FROM jn_weekly_assignment_table lv
              WHERE lv.year_id = a.year_id
                AND lv.employee_no = a.employee_no
                AND lv.week_start_date = a.week_start_date
                AND lv.sys_project_id = :leave_project_id
          )
    ) AS non_contract,
    (
        SELECT COUNT(DISTINCT a.employee_no)
        FROM jn_personnel_master p
        INNER JOIN jn_weekly_assignment_table a
            ON a.year_id = p.year_id
           AND a.employee_no = p.employee_no
        INNER JOIN jn_project_master pr
            ON pr.year_id = a.year_id
           AND pr.sys_project_id = CAST(a.sys_project_id AS SIGNED)
        WHERE p.year_id = :year_id
          AND CAST(p.department_id AS UNSIGNED) = d.department_id
          AND pr.education_flg = '1'
          -- 同一週に「内・退職」の割当があれば離職者として除外する
          AND NOT EXISTS (
              SELECT 1
              FROM jn_weekly_assignment_table lv
              WHERE lv.year_id = a.year_id
                AND lv.employee_no = a.employee_no
                AND lv.week_start_date = a.week_start_date
                AND lv.sys_project_id = :leave_project_id
          )
    ) AS training
FROM jn_department_master d
WHERE d.year_id = :year_id
  AND TRIM(d.location) = :location
  AND COALESCE(d.kind, 'dept') <> 'partner'
ORDER BY d.department_id
