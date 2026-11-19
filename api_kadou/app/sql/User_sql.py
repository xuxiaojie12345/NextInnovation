from sqlalchemy import text

# jn_user_table 表查询 SQL（ユーザー管理画面で使用）

# ユーザー一覧取得
USER_SELECT_ALL = text("""
SELECT user_id, shimei, yakushoku_kubun, department_id, password
FROM jn_user_table
ORDER BY user_id
""")

# ユーザー単件取得（登録・更新後に返す）
USER_SELECT_BY_ID = text("""
SELECT user_id, shimei, yakushoku_kubun, department_id, password
FROM jn_user_table
WHERE user_id = :user_id
LIMIT 1
""")

# ユーザー追加（重複チェックはサービス層で SELECT してから行う）
USER_INSERT = text("""
INSERT INTO jn_user_table
  (user_id, shimei, yakushoku_kubun, department_id, password,
   register_datetime, register_user, update_datetime, update_user)
VALUES
  (:user_id, :shimei, :yakushoku_kubun, :department_id, :password,
   NOW(), :register_user, NOW(), :update_user)
""")

# ユーザー更新（ユーザーIDは変更しない）
USER_UPDATE = text("""
UPDATE jn_user_table
SET shimei = :shimei,
    yakushoku_kubun = :yakushoku_kubun,
    department_id = :department_id,
    password = :password,
    update_datetime = NOW(),
    update_user = :update_user
WHERE user_id = :user_id
""")

# ユーザー削除
USER_DELETE = text("""
DELETE FROM jn_user_table
WHERE user_id = :user_id
""")
