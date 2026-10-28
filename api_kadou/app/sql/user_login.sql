-- ログイン照合用 SELECT 文（データは読み取りのみ。書き込みは行わない）
-- year_id は現在処理対象の年度（ログイン時は現在の西暦を指定する）
SELECT
    u.user_id,
    u.shimei,
    u.yakushoku_kubun,
    u.department_id,
    d.department_name
FROM jn_user_table u
LEFT JOIN jn_department_master d
    ON u.department_id = d.department_id
    AND d.year_id = :year_id
WHERE u.user_id = :user_id
  AND u.password = :password
LIMIT 1