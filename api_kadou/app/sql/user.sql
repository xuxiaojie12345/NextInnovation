-- ユーザー管理画面で使う SQL（jn_user_table）

-- :name: list
-- ユーザー一覧取得
SELECT user_id, shimei, yakushoku_kubun, department_id, password
FROM jn_user_table
ORDER BY user_id

-- :name: get
-- ユーザー単件取得（登録・更新後に返す）
SELECT user_id, shimei, yakushoku_kubun, department_id, password
FROM jn_user_table
WHERE user_id = :user_id
LIMIT 1

-- :name: insert
-- ユーザー追加
INSERT INTO jn_user_table
  (user_id, shimei, yakushoku_kubun, department_id, password,
   register_datetime, register_user, update_datetime, update_user)
VALUES
  (:user_id, :shimei, :yakushoku_kubun, :department_id, :password,
   NOW(), :register_user, NOW(), :update_user)

-- :name: update
-- ユーザー更新
UPDATE jn_user_table
SET shimei = :shimei,
    yakushoku_kubun = :yakushoku_kubun,
    department_id = :department_id,
    password = :password,
    update_datetime = NOW(),
    update_user = :update_user
WHERE user_id = :user_id

-- :name: delete
-- ユーザー削除
DELETE FROM jn_user_table
WHERE user_id = :user_id