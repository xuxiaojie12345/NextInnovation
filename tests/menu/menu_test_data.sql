-- ============================================================================
-- Menu 模块 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/Menu/Menu_単体テスト仕様書.md
-- 对应前端：react-ud/src/Menu/Menu.tsx
--
-- 【运行前提】
-- 1) 本数据面向【真实后端】模式：依赖 React 后端 (localhost:8081) 正常运行、
--    数据库已按 react_ud_sql.txt 的 DDL 建表。
-- 2) 需先创建 hdoc_user_infor 与 HDOC_FUNCTION_AUTH 表（见 react_ud_sql.txt）。
-- 3) 密码为【明文】存储（后端已删除 MD5 加密逻辑）。
-- 4) USERID 长度 <= 10，与前端 maxLength 一致。
--
-- 【权限字段说明】
-- HDOC_FUNCTION_AUTH 表的权限列在 DDL 中为 `FUNCTION`（MySQL 保留字，需反引号）。
-- 后端通过 GET /api/user/GetUserFunctionAuth（请求头 userId）查询该表，
-- 返回 permissions 列表，前端据此动态显示菜单。
-- ============================================================================

USE react_ud;

-- ----------------------------------------------------------------------------
-- 1. 清空测试用户与其权限（保证脚本可重复执行）
-- ----------------------------------------------------------------------------
DELETE FROM `HDOC_FUNCTION_AUTH` WHERE USERID IN
  ('menuall','menuhdoc','menuvar','menuadm','menuuadm','menunone','menuretry','menutab');
DELETE FROM `hdoc_user_infor` WHERE USERID IN
  ('menuall','menuhdoc','menuvar','menuadm','menuuadm','menunone','menuretry','menutab');

-- ----------------------------------------------------------------------------
-- 2. 登录用户（hdoc_user_infor）
--    密码一律 Menu@123
-- ----------------------------------------------------------------------------
INSERT INTO `hdoc_user_infor`
  (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('menuall',  'Menu@123', 'Menu All',       'Menu All',       'Admin',         'menuall@example.com',   NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('menuhdoc', 'Menu@123', 'Menu HDoc User', 'Menu HDoc User', 'Engineer',      'menuhdoc@example.com',  NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('menuvar',  'Menu@123', 'Menu Variable',  'Menu Variable',  'Engineer',      'menuvar@example.com',   NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('menuadm',  'Menu@123', 'Menu Admin',     'Menu Admin',     'Manager',       'menuadm@example.com',   NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('menuuadm', 'Menu@123', 'Menu UserAdmin', 'Menu UserAdmin', 'Manager',       'menuuadm@example.com',  NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('menunone', 'Menu@123', 'Menu None',      'Menu None',      'Guest',         'menunone@example.com',  NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('menuretry','Menu@123', 'Menu Retry',     'Menu Retry',     'Engineer',      'menuretry@example.com', NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('menutab',  'Menu@123', 'Menu Tab',       'Menu Tab',       'Engineer',      'menutab@example.com',   NOW(), 'system', 'test', NOW(), 'system', 'test');

-- ----------------------------------------------------------------------------
-- 3. 功能权限（HDOC_FUNCTION_AUTH）
-- ----------------------------------------------------------------------------
-- 3.1 menuall：拥有所有权限 → 全菜单显示（式样书 No.6 / No.12 / No.22 / No.23 / No.24）
INSERT INTO `HDOC_FUNCTION_AUTH`
  (USERID, `FUNCTION`, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('menuall',  'hdoc',            NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('menuall',  'hdoc_variables',  NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('menuall',  'hdoc_admin',      NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('menuall',  'hdoc_user_admin', NOW(), 'system', 'test', NOW(), 'system', 'test');

-- 3.2 menuhdoc：仅 hdoc → Generate>>Generate Doc 与 Documentation>>User Guide
--     （式样书 No.5 部分权限）
INSERT INTO `HDOC_FUNCTION_AUTH`
  (USERID, `FUNCTION`, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('menuhdoc', 'hdoc', NOW(), 'system', 'test', NOW(), 'system', 'test');

-- 3.3 menuvar：仅 hdoc_variables → Admin>>Update user defined variables /
--     Existing HDoc variables（式样书 No.5 部分权限）
INSERT INTO `HDOC_FUNCTION_AUTH`
  (USERID, `FUNCTION`, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('menuvar', 'hdoc_variables', NOW(), 'system', 'test', NOW(), 'system', 'test');

-- 3.4 menuadm：仅 hdoc_admin → Admin 分组下全部 hdoc_admin 菜单项（式样书 No.7）
INSERT INTO `HDOC_FUNCTION_AUTH`
  (USERID, `FUNCTION`, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('menuadm', 'hdoc_admin', NOW(), 'system', 'test', NOW(), 'system', 'test');

-- 3.5 menuuadm：仅 hdoc_user_admin → User Administration 分组（式样书 No.8）
INSERT INTO `HDOC_FUNCTION_AUTH`
  (USERID, `FUNCTION`, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('menuuadm', 'hdoc_user_admin', NOW(), 'system', 'test', NOW(), 'system', 'test');

-- 3.6 menunone：无任何权限 → “YOU ARE NOT AUTHORIZED ...” 提示（式样书 No.9）
--     （不插入任何权限记录）

-- 3.7 menuretry：先无权限，用于式样书 No.10“无权限→重试后恢复”场景。
--     【注意】No.10 需要 API 先后返回不同结果，纯真实后端下需人工在
--     Retry 前为该用户补插 hdoc 权限后再点击 Retry，否则重试仍显示无权限。
--     此处默认不插入权限。

-- 3.8 menutab：拥有全部权限，用于式样书 No.24（Tab 键焦点）等 UI 用例
INSERT INTO `HDOC_FUNCTION_AUTH`
  (USERID, `FUNCTION`, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('menutab',  'hdoc',            NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('menutab',  'hdoc_variables',  NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('menutab',  'hdoc_admin',      NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('menutab',  'hdoc_user_admin', NOW(), 'system', 'test', NOW(), 'system', 'test');

-- ============================================================================
-- 补充说明
-- ----------------------------------------------------------------------------
-- 运行测试前：
--   1) 确保 react-ud 后端 (8081) 运行
--   2) 确保前端 dev server (3000) 运行
--   3) 执行本 SQL（mysql -u<user> -p react_ud < menu_test_data.sql）
-- 登录测试用户统一密码：Menu@123
-- ============================================================================
