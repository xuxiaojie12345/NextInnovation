-- プロジェクト一括取り込み：「所属部門」列の値を部門マスタの部門別名
-- （department_alisa）と照合して部門IDを引く（年度指定）
--
--   ・完全一致（大文字小文字は照合順序に従う）で、前後空白は呼び出し側で除去済み
--   ・別名は重複し得るため、一致が 1 件に絞れたときだけ確定する
--     （0 件・2 件以上は「特定できなかった行」として扱い、登録しない）
SELECT department_id
FROM jn_department_master
WHERE year_id = :year_id
  AND department_alisa = :department_alias
ORDER BY department_id
LIMIT 2
