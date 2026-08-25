-- ============================================================================
-- Markets in HDoc 模块 (UD21) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/MarketsInHDoc/MarketsInHDoc_単体テスト仕様書.md
-- 对应前端：react-ud/src/MarketsInHDoc/MarketsInHDoc.tsx
-- 对应后端：UserAdminController / MasterDataService（GET /api/UD19SelectMarketMaster，UD21 复用）
--
-- 【运行前提】（真实后端模式）
-- 1) 前端 dev server (localhost:3000)、后端 (localhost:8081) 已启动。
-- 2) 后端 UD19SelectMarketMaster 返回 [{market, description}]（此接口被 UD19/UD21 共用）。
-- 3) 从 Menu → "Markets in HDoc" 进入（iframe /markets-in-hdoc），只读表格，无操作控件。
--
-- 【数据说明】
-- 表格来自 MARKET_MASTER 表（被 UD08/12/14/17/19/21 等多模块共用）。
-- 为确保内容可断言且不破坏其他模块，seed 以 ON DUPLICATE 幂等确保 JPN/Japan、EU/Europe、JP/Japan、DE/Germany 存在。
-- 表格共 3 列：Market（MARKET）、Description（DESCRIPTION）、Weights from Hdoc（前端固定 "-"）。
-- 另确保登录用户 menuall（hdoc_admin）存在，可访问该 Menu 菜单。
--
-- 执行：node tests/marketsInHDoc/seed.js
-- ============================================================================

USE ud_test;

-- MARKET_MASTER：确保关键市场存在（幂等，不删除既有数据）
INSERT INTO `MARKET_MASTER`
  (MARKET, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('JPN','Japan',   NOW(),'system','test', NOW(),'system','test'),
  ('EU','Europe',   NOW(),'system','test', NOW(),'system','test'),
  ('JP','Japan',    NOW(),'system','test', NOW(),'system','test'),
  ('DE','Germany',  NOW(),'system','test', NOW(),'system','test')
ON DUPLICATE KEY UPDATE
  DESCRIPTION=VALUES(DESCRIPTION), UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- --- 确保登录用户 menuall 存在且拥有 hdoc_admin（可访问 Markets in HDoc 菜单）---
INSERT INTO `hdoc_user_infor`
  (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('menuall', 'Menu@123', 'Menu All', 'Menu All', 'Admin', 'menuall@example.com',
   NOW(),'system','test', NOW(),'system','test')
ON DUPLICATE KEY UPDATE
  USERNAME=VALUES(USERNAME), UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

INSERT INTO `HDOC_FUNCTION_AUTH`
  (USERID, `FUNCTION`, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('menuall', 'hdoc',             NOW(),'system','test', NOW(),'system','test'),
  ('menuall', 'hdoc_variables',   NOW(),'system','test', NOW(),'system','test'),
  ('menuall', 'hdoc_admin',       NOW(),'system','test', NOW(),'system','test'),
  ('menuall', 'hdoc_user_admin',  NOW(),'system','test', NOW(),'system','test')
ON DUPLICATE KEY UPDATE
  UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';
