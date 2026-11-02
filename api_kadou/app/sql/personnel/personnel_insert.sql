-- 要員の新規追加（要員情報画面 / 一括取り込み 共通）
--
-- 登録日時・登録者 にはリクエスト時のシステム日時と操作者IDをセットする。
-- 新規登録時は 更新日時・更新者 も 登録日時・登録者 と同じ値にする
-- （同一リクエストで同じ :now_dt / :op_user を渡しているため必ず一致する）。
-- 異動フラグには初期値 :idou_flag=0 をセットする。
INSERT INTO jn_personnel_master
  (year_id, employee_no, department_id, idou_flag, idoubi,
   person_name, role, leave_plan,
   register_datetime, register_user, update_datetime, update_user)
VALUES
  (:year_id, :employee_no, :department_id, :idou_flag, :idoubi,
   :person_name, :role, :leave_plan,
   :now_dt, :op_user, :now_dt, :op_user)
