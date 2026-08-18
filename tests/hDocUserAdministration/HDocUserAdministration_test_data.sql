-- ============================================================================
-- HDoc User Administration 模块 (UD17) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/HDocUserAdministration/HDocUserAdministration_単体テスト仕様書.md
-- 对应前端：react-ud/src/HDocUserAdministration/HDocUserAdministration.tsx
-- 对应后端：UserAdminController / UserAdminServiceImpl / HdocFunctionAuthMapper 等
--          （UD17Userinfo / UD17UpdateRole / UD17DeleteRole / UD17SelectMarketmaster）
--
-- 【运行前提】（真实后端模式）
-- 1) 前端 dev server (localhost:3000)、后端 (localhost:8081) 已启动。
-- 2) 后端 UD17 修复已完成（权限改为唯一角色码 + 互斥单选模型；Market 接口；404 文案）
-- 3) 前端已实现角色互斥单选（复选框只能选一个）、Market 加载、删除 Show change variants fields
--
-- 【业务规则】
-- 角色的复选在业务上只能选中一个（互斥单选）。后端 HDOC_FUNCTION_AUTH.FUNCTION 存唯一角色码：
--   standardUser->hdoc_user_standard, ruleAdmin->hdoc_user_rule,
--   templateAdmin->hdoc_user_template, documentAuthAdmin->hdoc_user_docadmin,
--   userAdmin->hdoc_user_admin, adaptationUser->hdoc_user_adaptation,
--   manageVariableList->hdoc_user_varlist, marketSuperUser->hdoc_user_super
--   需要 Market 的角色写入 HDOC_MARKET_AUTH（TYPE=角色名）。
--
-- 【数据说明】
-- 目标用户（hdoc_user_infor 主键 USERID+PASSWORD+USERNAME）：
--   ud17std  : Standard User（FUNCTION=hdoc_user_standard）
--   ud17rule : Rule Admin（FUNCTION=hdoc_user_rule + MARKET_AUTH(JPN)）
--   ud17none : 无角色
--   user123  : 用于 Update/Delete 测试（seed 每次重置为无角色，保证可重复）
-- 另确保登录用户 menuall（hdoc_user_admin）与 MARKET_MASTER（JPN/EU 等）存在。
--
-- 执行：node tests/hDocUserAdministration/seed.js
-- ============================================================================

USE ud_test;

-- MARKET_MASTER：确保市场下拉有数据（幂等，不覆盖既有）
INSERT INTO `MARKET_MASTER`
  (MARKET, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('JPN','Japan', NOW(),'system','test', NOW(),'system','test'),
  ('EU','Europe', NOW(),'system','test', NOW(),'system','test'),
  ('JP','Japan',  NOW(),'system','test', NOW(),'system','test'),
  ('DE','Germany',NOW(),'system','test', NOW(),'system','test')
ON DUPLICATE KEY UPDATE
  DESCRIPTION=VALUES(DESCRIPTION), UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- hdoc_user_infor：登录用户 menuall + 目标用户
INSERT INTO `hdoc_user_infor`
  (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('menuall', 'Menu@123', 'Menu All', 'Menu All', 'Admin', 'menuall@example.com',
   NOW(),'system','test', NOW(),'system','test'),
  ('user123', 'Pass@123', 'John Doe', 'John', 'User', 'john.doe@example.com',
   NOW(),'system','test', NOW(),'system','test'),
  ('ud17std', 'Pass@123', 'Standard User', 'Std', 'User', 'std@example.com',
   NOW(),'system','test', NOW(),'system','test'),
  ('ud17rule','Pass@123', 'Rule User', 'Rule', 'Admin', 'rule@example.com',
   NOW(),'system','test', NOW(),'system','test'),
  ('ud17none','Pass@123', 'No Role User', 'NoR', 'User', 'none@example.com',
   NOW(),'system','test', NOW(),'system','test')
ON DUPLICATE KEY UPDATE
  USERNAME=VALUES(USERNAME), UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- HDOC_FUNCTION_AUTH：menuall 全权限 + 预设目标用户角色码
INSERT INTO `HDOC_FUNCTION_AUTH`
  (USERID, `FUNCTION`, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('menuall', 'hdoc',             NOW(),'system','test', NOW(),'system','test'),
  ('menuall', 'hdoc_variables',   NOW(),'system','test', NOW(),'system','test'),
  ('menuall', 'hdoc_admin',       NOW(),'system','test', NOW(),'system','test'),
  ('menuall', 'hdoc_user_admin',  NOW(),'system','test', NOW(),'system','test'),
  ('ud17std', 'hdoc_user_standard', NOW(),'system','test', NOW(),'system','test'),
  ('ud17rule','hdoc_user_rule',   NOW(),'system','test', NOW(),'system','test')
ON DUPLICATE KEY UPDATE
  UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- HDOC_MARKET_AUTH：ud17rule 关联 JPN（TYPE=ruleAdmin）
INSERT INTO `HDOC_MARKET_AUTH`
  (USERID, MARKET, `TYPE`, BU, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('ud17rule', 'JPN', 'ruleAdmin', 'BU1', NOW(),'system','test', NOW(),'system','test')
ON DUPLICATE KEY UPDATE
  MARKET=VALUES(MARKET), UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- 重置 user123 为无角色（保证 Update/Delete 测试可重复）
DELETE FROM `HDOC_FUNCTION_AUTH` WHERE USERID='user123';
DELETE FROM `HDOC_MARKET_AUTH` WHERE USERID='user123';
