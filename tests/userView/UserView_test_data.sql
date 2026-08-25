-- ============================================================================
-- User View (UD25) 测试数据
-- 对应后端：AuthenticationServiceImpl（/api/authentication，needPassword=false 时按 userId 查用户）
-- 对应表：hdoc_user_infor
-- 说明：
--   user123 : 仕様書 No.7-13 指定的测试用户。
--             按仕様書预期显示值对齐：Responsible=John Doe / User Position=Manager。
--             （其他模块 seed 也会重置 user123；本 seed 在本模块运行前执行，自包含。）
--   unknown : No.14 不存在的 userId（无需插入，直接使用不存在的值）
-- ============================================================================

-- 1) 确保 user123 存在并按仕様書预期值对齐
INSERT INTO `hdoc_user_infor`
  (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('user123', 'Pass@123', 'John Doe', 'John Doe', 'Manager', 'john.doe@example.com',
   NOW(), 'system', 'seed', NOW(), 'system', 'seed')
ON DUPLICATE KEY UPDATE
  USERNAME='John Doe', RESPONSIBLE='John Doe', USERPOSITION='Manager',
  EMAIL='john.doe@example.com', UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='seed';

-- 2) 确保登录用户 menuall 存在（后端登录用，UserView 直接访问时非必需，但保持一致）
INSERT INTO `hdoc_user_infor`
  (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('menuall', 'Menu@123', 'Menu All', 'Menu All', 'Admin', 'menuall@example.com',
   NOW(), 'system', 'seed', NOW(), 'system', 'seed')
ON DUPLICATE KEY UPDATE
  USERNAME='Menu All', RESPONSIBLE='Menu All', USERPOSITION='Admin',
  EMAIL='menuall@example.com';
