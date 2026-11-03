-- 要員情報画面：要員の更新（年度 + 社員番号で特定）
--
-- 更新日時・更新者 のみ書き換える（登録日時・登録者・異動フラグは変更しない）。
-- NOTE: 所属（department_id）は更新時に変更できない（画面の「所属は変更不可」仕様に合わせる）。
UPDATE jn_personnel_master
SET person_name = :person_name,
    role = :role,
    leave_plan = :leave_plan,
    update_datetime = :now_dt,
    update_user = :op_user
WHERE year_id = :year_id
  AND employee_no = :employee_no
