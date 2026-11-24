-- ============================================================
-- 要員稼働管理（WorkStatus）まとめ SQL
-- セクションは `-- :name: <セクション名>` で区切る。
-- 取得は load_sql("work_status.sql", "<セクション名>")。
-- ============================================================

-- :name: personnel
-- 指定年度の要員マスタ全行（異動の分割行を含む。表示行・現在所属の算出に使う）
-- 異動がない要員は 1 行、異動がある要員は 旧所属行＋新所属行 の複数行。
-- 旧所属行（idoubi なし）を先、異動で追加した新所属行（idoubi あり）を後に並べる。
SELECT
    employee_no,
    person_name,
    department_id,
    role,
    leave_plan,
    idou_flag,
    idoubi,
    register_datetime,
    register_user
FROM jn_personnel_master
WHERE year_id = :year_id
ORDER BY employee_no, (idoubi IS NOT NULL), idoubi

-- :name: search
-- 社員番号による要員1件取得（異動後の「現在の所属」を返す）
-- 異動時は異動後の所属の行を追加し、その行だけが idoubi（異動日）を持つ。
SELECT
    employee_no,
    person_name,
    department_id,
    role,
    leave_plan
FROM jn_personnel_master
WHERE year_id = :year_id
  AND employee_no = :employee_no
ORDER BY (idoubi IS NULL), idoubi DESC
LIMIT 1

-- :name: transfer
-- 異動（所属変更）の対象行の所属を更新
UPDATE jn_personnel_master
SET department_id = :department_id,
    update_user = :op_user
WHERE year_id = :year_id
  AND employee_no = :employee_no

-- :name: departments
-- 部門一覧（指定年度）
SELECT department_id, department_name, location, kind
FROM jn_department_master
WHERE year_id = :year_id
ORDER BY department_id

-- :name: projects
-- プロジェクト一覧（指定年度、週セルの選択肢の材料）
SELECT
    p.sys_project_id,
    p.project_id,
    p.customer,
    p.case_name,
    p.team,
    p.sub_team,
    p.department_id,
    d.department_name,
    p.project_name,
    p.valid_flg,
    p.education_flg
FROM jn_project_master p
LEFT JOIN jn_department_master d
    ON d.year_id = p.year_id
    AND d.department_id = p.department_id
WHERE p.year_id = :year_id
ORDER BY p.sys_project_id

-- :name: assignments
-- 週次割当（割当・BUFFER・UNASSIGN・楽観ロック用の版）
-- 要員マスタを起点に LEFT JOIN する（要員マスタ未登録の孤児データは返さない）。
-- department_id は異動前後の期間判定（表示行の分割）に使用する。
-- ※要員マスタは異動で複数行になるため、社員番号を DISTINCT してから結合する。
SELECT
    a.employee_no,
    a.week_start_date,
    m.department_id,
    a.sys_project_id,
    a.is_unpaid,
    a.version
FROM (
    SELECT DISTINCT employee_no, department_id
    FROM jn_personnel_master
    WHERE year_id = :year_id
) m
LEFT JOIN jn_weekly_assignment_table a
    ON a.year_id = :year_id
    AND a.employee_no = m.employee_no
    AND a.department_id = m.department_id
WHERE a.week_start_date IS NOT NULL
ORDER BY a.employee_no, a.week_start_date

-- :name: insert
-- 保存時：週次割当の1件挿入（グリッドの欠落週・新規セルの投入）
INSERT INTO jn_weekly_assignment_table
  (version, year_id, employee_no, department_id,
   week_start_date, week_end_date, sys_project_id, is_unpaid,
   register_user, register_datetime, update_user, update_datetime)
VALUES
  (:version, :year_id, :employee_no, :department_id,
   :week_start_date, :week_end_date, :sys_project_id, :is_unpaid,
   :register_user, :register_datetime, :update_user, :update_datetime)

-- :name: update
-- 保存時：画面で変更されたセル1件だけを更新する（全年度の一括更新はしない）
-- version を +1 し、送信された更新前 version と一致する場合のみ更新する（楽観ロック）
-- 所属部門IDは行の有効期間ごとに update_department で同期するため、ここでは更新しない。
UPDATE jn_weekly_assignment_table
SET sys_project_id = :sys_project_id,
    is_unpaid = :is_unpaid,
    version = version + 1,
    update_user = :update_user,
    update_datetime = :update_datetime
WHERE year_id = :year_id
  AND employee_no = :employee_no
  AND week_start_date = :week_start_date
  AND (:expected_version IS NULL OR version = :expected_version)

-- :name: update_department
-- 保存時：行の有効期間（週キー範囲）に該当し、所属が変わる週だけを同期する
-- （変更のない週は更新しない。更新した週は version を +1 する）
UPDATE jn_weekly_assignment_table
SET department_id = :department_id,
    version = version + 1,
    update_user = :update_user,
    update_datetime = :update_datetime
WHERE year_id = :year_id
  AND employee_no = :employee_no
  AND week_start_date >= :from_week
  AND week_start_date <= :to_week
  AND department_id <> :department_id

-- :name: count_work_before
-- 社員番号変更の可否：指定日（今週の月曜）より前の週に割当・BUFFER があるかを数える
SELECT COUNT(*) AS cnt
FROM jn_weekly_assignment_table
WHERE year_id = :year_id
  AND employee_no = :employee_no
  AND week_start_date < :before_week
  AND (COALESCE(sys_project_id, 'UNASSIGN') <> 'UNASSIGN' OR is_unpaid = '1')

-- :name: clear_assignments
-- 社員番号変更時：旧社員番号の週次割当を UNASSIGN に戻す（行は削除しない）
UPDATE jn_weekly_assignment_table
SET sys_project_id = 'UNASSIGN',
    is_unpaid = '0',
    version = version + 1,
    update_user = :update_user,
    update_datetime = :update_datetime
WHERE year_id = :year_id
  AND employee_no = :employee_no

-- :name: personnel_of_employee
-- 異動保存時：要員マスタの現在の行を取得する
-- 先頭が旧所属行（idoubi なし）、後ろが異動で追加した新所属行（idoubi あり）
SELECT
    employee_no,
    department_id,
    idou_flag,
    idoubi,
    person_name,
    role,
    leave_plan,
    register_datetime,
    register_user
FROM jn_personnel_master
WHERE year_id = :year_id
  AND employee_no = :employee_no
ORDER BY (idoubi IS NOT NULL), idoubi

-- :name: delete_personnel_rows
-- 異動保存時：要員マスタの行をいったん全件削除し、現在の異動状態で作り直す
DELETE FROM jn_personnel_master
WHERE year_id = :year_id
  AND employee_no = :employee_no

-- :name: update_leave_plan
-- 備考（退場予定）の更新：当該年度の社員の要員マスタ全行に反映する
UPDATE jn_personnel_master
SET leave_plan = :leave_plan,
    update_datetime = :now,
    update_user = :op_user
WHERE year_id = :year_id
  AND employee_no = :employee_no

-- :name: insert_personnel_row
-- 異動保存時：要員マスタの 1 行を追加する（異動時は新所属の行を追加）
INSERT INTO jn_personnel_master
  (year_id, employee_no, department_id, idou_flag, idoubi,
   person_name, role, leave_plan,
   register_datetime, register_user, update_datetime, update_user)
VALUES
  (:year_id, :employee_no, :department_id, :idou_flag, :idoubi,
   :person_name, :role, :leave_plan,
   :register_datetime, :register_user, :now_dt, :op_user)