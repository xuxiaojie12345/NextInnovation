-- 要員情報画面：週割当の削除
-- 年度 + 社員番号を検索条件として、当該要員の週割当を全件削除する
DELETE FROM jn_weekly_assignment_table
WHERE year_id = :year_id
  AND employee_no = :employee_no
