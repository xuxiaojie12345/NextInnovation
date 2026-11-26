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
--                     から、離職（顧客 = '内' かつ 案件名 = '退職'）の要員数を差し引いた人数
--                     （異動で複数行になるため社員番号で DISTINCT して数える）
--   ・leavers       : 稼動表の当週プロジェクト（プロジェクトマスタ連表）の
--                     顧客 = '内' かつ 案件名 = '退職' の要員数
--   ・active_total  : 稼動表の当週プロジェクトの有効flg = '1' の要員数
--   ・non_contract  : 稼動表の is_unpaid = '1'（無償支援）の要員数
--   ・training      : 稼動表の当週プロジェクトの教育flg = '1' の要員数
--
-- NOTE: いずれも「要員マスタ（社員番号）→ 稼動表（週割当）→ プロジェクトマスタ」の
--       連表（JOIN）で取得する。稼動表の部門IDは文字列・数値が混在するため、
--       両辺を数値化して比較する。
--
-- NOTE: 離職（内・退職）の判定はプロジェクトマスタの 顧客・案件名 で行う
--       （システム項目ID は年ごとに変わり得るため）。
--       「顧客 = :leave_customer かつ 案件名 = :leave_case_name」の項目を離職として扱う。
--
-- NOTE: 同一週（同一 week_start_date）に「顧客 = 内・案件名 = 退職」の割当がある要員は
--       「離職人数」にだけ数え、総稼動人数・非契約稼動人数・教育実施人数には数えない
--       （二重計上を防ぐ）。
--
-- NOTE: 総人数（headcount）は「対象部門の要員マスタ全員 − 当週の離職（内・退職）人数」で算出する。
--       離職者は稼働する人員ではないため、総人数から除外する
--       （以前は要員マスタ全員をそのまま総人数としていた）。
--
-- NOTE: 異動がある要員は要員マスタに 2 行（旧所属・新所属）存在する。
--       単純に数えると同一人物が旧部門・新部門の両方で計上され、合計が +1 される。
--       そのため総人数は「当週（:week_start_date）時点で有効な 1 行」だけを数える。
--       当週時点の所属行 = 異動日(idoubi)が当週以前で最も新しい行
--       （当週以前の異動が無ければ異動日が空の行）。
--       これにより、異動週より前は旧部門、異動週以降は新部門で各 1 名として計上される。
--
-- NOTE: 離職の判定は「週単位」で行う（:week_start_date = 当週の月曜）。
--       例えば下半期に退職する要員は、上半期の週では在籍者として総人数に計上し、
--       退職した週以降だけ総人数から除外する。
--       ※ 稼動表の week_start_date と突き合わせて、当週に「内・退職」の割当がある
--         要員だけを離職者として差し引く（他の週の離職者は減らさない）。
--
-- NOTE: 集計基準週（:week_start_date）は当週（今日を含む週の月曜）。
--       総稼動人数・非契約稼動人数・教育実施人数も、すべてこの当週の割当だけを数える。
SELECT
    d.department_id,
    d.department_name,
    (
        -- 総人数 = 対象部門の要員マスタ全員 − 当週の離職（内・退職）人数
        --  （負にならないよう 0 で下限を切る）
        GREATEST(
            0,
            (
                -- 対象部門に「当週時点で所属している」要員数。
                -- 異動があると要員マスタは 1 人 2 行（旧所属・新所属）になる。
                -- そのまま数えると同じ人が旧部門と新部門の両方で計上されるため、
                -- 当週（:week_start_date）時点で有効な「1 行だけ」を対象にする。
                --
                -- 当週時点の所属行の決め方（_pick_current_row と同じ考え方）:
                --   ・当週以前の異動行のうち、最も新しい異動日を持つ行
                --   ・当週以前の異動行が無ければ、異動日が空の行（異動していない）
                --   ※ 当週より後の異動行は「まだ起きていない」ので対象外
                SELECT COUNT(DISTINCT p.employee_no)
                FROM jn_personnel_master p
                WHERE p.year_id = :year_id
                  AND CAST(p.department_id AS UNSIGNED) = d.department_id
                  -- この行が「当週時点の所属行」であること
                  AND COALESCE(p.idoubi, '') = (
                      -- 当週以前で最も新しい異動日（無ければ '' を返す）
                      SELECT COALESCE(MAX(COALESCE(q.idoubi, '')), '')
                      FROM jn_personnel_master q
                      WHERE q.year_id = p.year_id
                        AND q.employee_no = p.employee_no
                        AND COALESCE(q.idoubi, '') <= :week_start_date
                  )
            )
            - (
                SELECT COUNT(DISTINCT p.employee_no)
                FROM jn_personnel_master p
                INNER JOIN jn_weekly_assignment_table a
                    ON a.year_id = p.year_id
                   AND a.employee_no = p.employee_no
                INNER JOIN jn_project_master pr
                    ON pr.year_id = a.year_id
                   AND pr.sys_project_id = CAST(a.sys_project_id AS SIGNED)
                WHERE p.year_id = :year_id
                  AND CAST(p.department_id AS UNSIGNED) = d.department_id
                  -- 当週に離職（内・退職）の割当がある要員だけを差し引く
                  AND a.week_start_date = :week_start_date
                  AND TRIM(pr.customer) = :leave_customer
                  AND TRIM(pr.case_name) = :leave_case_name
            )
        )
    ) AS headcount,
    (
        SELECT COUNT(DISTINCT p.employee_no)
        FROM jn_personnel_master p
        INNER JOIN jn_weekly_assignment_table a
            ON a.year_id = p.year_id
           AND a.employee_no = p.employee_no
        INNER JOIN jn_project_master pr
            ON pr.year_id = a.year_id
           AND pr.sys_project_id = CAST(a.sys_project_id AS SIGNED)
        WHERE p.year_id = :year_id
          AND CAST(p.department_id AS UNSIGNED) = d.department_id
          -- 当週の割当だけを対象にする
          AND a.week_start_date = :week_start_date
          -- 離職判定：顧客 = '内' かつ 案件名 = '退職'
          AND TRIM(pr.customer) = :leave_customer
          AND TRIM(pr.case_name) = :leave_case_name
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
          -- 当週の割当だけを対象にする
          AND a.week_start_date = :week_start_date
          AND pr.valid_flg = '1'
          -- 同一週に「内・退職」の割当があれば離職者として除外する
          AND NOT EXISTS (
              SELECT 1
              FROM jn_weekly_assignment_table lv
              INNER JOIN jn_project_master lpr
                  ON lpr.year_id = lv.year_id
                 AND lpr.sys_project_id = CAST(lv.sys_project_id AS SIGNED)
              WHERE lv.year_id = a.year_id
                AND lv.employee_no = a.employee_no
                AND lv.week_start_date = a.week_start_date
                AND TRIM(lpr.customer) = :leave_customer
                AND TRIM(lpr.case_name) = :leave_case_name
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
          -- 当週の割当だけを対象にする
          AND a.week_start_date = :week_start_date
          AND a.is_unpaid = '1'
          -- 同一週に「内・退職」の割当があれば離職者として除外する
          AND NOT EXISTS (
              SELECT 1
              FROM jn_weekly_assignment_table lv
              INNER JOIN jn_project_master lpr
                  ON lpr.year_id = lv.year_id
                 AND lpr.sys_project_id = CAST(lv.sys_project_id AS SIGNED)
              WHERE lv.year_id = a.year_id
                AND lv.employee_no = a.employee_no
                AND lv.week_start_date = a.week_start_date
                AND TRIM(lpr.customer) = :leave_customer
                AND TRIM(lpr.case_name) = :leave_case_name
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
          -- 当週の割当だけを対象にする
          AND a.week_start_date = :week_start_date
          AND pr.education_flg = '1'
          -- 同一週に「内・退職」の割当があれば離職者として除外する
          AND NOT EXISTS (
              SELECT 1
              FROM jn_weekly_assignment_table lv
              INNER JOIN jn_project_master lpr
                  ON lpr.year_id = lv.year_id
                 AND lpr.sys_project_id = CAST(lv.sys_project_id AS SIGNED)
              WHERE lv.year_id = a.year_id
                AND lv.employee_no = a.employee_no
                AND lv.week_start_date = a.week_start_date
                AND TRIM(lpr.customer) = :leave_customer
                AND TRIM(lpr.case_name) = :leave_case_name
          )
    ) AS training
FROM jn_department_master d
WHERE d.year_id = :year_id
  AND TRIM(d.location) = :location
  AND COALESCE(d.kind, 'dept') <> 'partner'
ORDER BY d.department_id
