-- ============================================================================
-- Search User 模块 (UD19) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/SearchUser/SearchUser_単体テスト仕様書.md
-- 对应前端：react-ud/src/SearchUser/SearchUser.tsx
-- 对应后端：UserAdminController / UserAdminServiceImpl / HdocUserInfoMapper 等
--          （UD19SelectMarketMaster / UD19SearchHdoc）
--
-- 【运行前提】（真实后端模式）
-- 1) 前端 dev server (localhost:3000)、后端 (localhost:8081) 已启动。
-- 2) 后端 UD19 修复已完成（Market 返回 {market,description}；roleType 过滤 RULE/TEMPLATE；
--    userId/userName/market 搜索条件）。
-- 3) 前端已实现检索条件（Userid max10 / User max32 / Market 下拉 / Role Radio）+ Search
--    + 结果表格 (Userid/User/Market) + COUNT。
--
-- 【业务规则】
-- 检索条件：Userid、User、Market、Role（Not set / Rule / Template）。
-- Role 过滤基于 HDOC_FUNCTION_AUTH.FUNCTION 唯一角色码：
--   ruleAdmin  -> hdoc_user_rule
--   templateAdmin -> hdoc_user_template
-- Market 过滤基于 HDOC_MARKET_AUTH.MARKET。
--
-- 【数据说明】
-- hdoc_user_infor（主键 USERID）：
--   menuall    : 登录用户（FUNCTION=hdoc_user_admin）
--   user123    : 用于 Userid/User 搜索（John Doe）
--   ud17rule   : Rule Admin（FUNCTION=hdoc_user_rule + MARKET_AUTH(JPN)）
--   ud19templ  : Template Admin（FUNCTION=hdoc_user_template + MARKET_AUTH(EU)）
-- 另确保 MARKET_MASTER（JPN/EU/JP/DE）存在。
--
-- 执行：node tests/searchUser/seed.js
-- ============================================================================

USE ud_test;

-- MARKET_MASTER：确保市场下拉有数据（幂等）
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
  ('ud17rule','Pass@123', 'Rule User', 'Rule', 'Admin', 'rule@example.com',
   NOW(),'system','test', NOW(),'system','test'),
  ('ud19templ','Pass@123','Template User', 'Templ', 'Admin', 'templ@example.com',
   NOW(),'system','test', NOW(),'system','test')
ON DUPLICATE KEY UPDATE
  USERNAME=VALUES(USERNAME), UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- HDOC_FUNCTION_AUTH：menuall 全权限 + 目标用户角色码
INSERT INTO `HDOC_FUNCTION_AUTH`
  (USERID, `FUNCTION`, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('menuall', 'hdoc',             NOW(),'system','test', NOW(),'system','test'),
  ('menuall', 'hdoc_variables',   NOW(),'system','test', NOW(),'system','test'),
  ('menuall', 'hdoc_admin',       NOW(),'system','test', NOW(),'system','test'),
  ('menuall', 'hdoc_user_admin',  NOW(),'system','test', NOW(),'system','test'),
  ('ud17rule','hdoc_user_rule',   NOW(),'system','test', NOW(),'system','test'),
  ('ud19templ','hdoc_user_template', NOW(),'system','test', NOW(),'system','test')
ON DUPLICATE KEY UPDATE
  UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- HDOC_MARKET_AUTH：ud17rule -> JPN，ud19templ -> EU
INSERT INTO `HDOC_MARKET_AUTH`
  (USERID, MARKET, `TYPE`, BU, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('ud17rule', 'JPN', 'ruleAdmin', 'BU1', NOW(),'system','test', NOW(),'system','test'),
  ('ud19templ','EU',  'template', 'BU1', NOW(),'system','test', NOW(),'system','test')
ON DUPLICATE KEY UPDATE
  MARKET=VALUES(MARKET), UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';
