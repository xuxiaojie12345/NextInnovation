-- ログイン照合用 SELECT 文（書き込みは行わない）
SELECT user_id, shimei, yakushoku_kubun, department_id, password
FROM t_user
WHERE user_id = :user_id
LIMIT 1;
