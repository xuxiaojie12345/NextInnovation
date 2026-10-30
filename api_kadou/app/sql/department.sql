-- 部門管理画面で使う SQL（jn_department_master / jn_personnel_master）

-- :name: list
-- 部門一覧取得（年度指定）
SELECT department_id, department_name, location, kind
FROM jn_department_master
WHERE year_id = :year_id
ORDER BY department_id

-- :name: insert
-- 部門追加
INSERT INTO jn_department_master
  (year_id, department_id, department_name, location, kind,
   register_datetime, register_user, update_datetime, update_user)
VALUES
  (:year_id, :department_id, :department_name, :location, :kind,
   NOW(), :op_user, NOW(), :op_user)

-- :name: update
-- 部門更新
UPDATE jn_department_master
SET department_name = :department_name,
    location = :location,
    kind = :kind,
    update_datetime = NOW(),
    update_user = :op_user
WHERE year_id = :year_id AND department_id = :department_id

-- :name: delete
-- 部門削除
DELETE FROM jn_department_master
WHERE year_id = :year_id AND department_id = :department_id

-- :name: personnel_count
-- 部門に所属する要員数を取得（削除可否チェック用）
SELECT COUNT(*) AS cnt
FROM jn_personnel_master
WHERE year_id = :year_id AND department_id = :department_id