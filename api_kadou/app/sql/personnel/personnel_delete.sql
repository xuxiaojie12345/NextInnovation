-- 要員情報画面：要員の削除（年度 + 社員番号）
DELETE FROM jn_personnel_master
WHERE year_id = :year_id
  AND employee_no = :employee_no
