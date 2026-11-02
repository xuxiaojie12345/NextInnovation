-- 要員情報画面：削除前チェック用
-- 指定年度 + 社員番号の週割当件数を返す（jn_weekly_assignment_table）
SELECT COUNT(*) AS cnt
FROM jn_weekly_assignment_table
WHERE year_id = :year_id
  AND employee_no = :employee_no
