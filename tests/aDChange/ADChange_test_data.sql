-- ============================================================================
-- AD Change 模块 (UD16) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/ADChange/ADChange_単体テスト仕様書.md
-- 对应前端：react-ud/src/ADChange/ADChange.tsx
-- 对应后端：AdcaChangeController / AdcaChangeServiceImpl / HdocAdcaChangeMapper
--          （UD16SelectHdocAdcaChange / UD16InsertHdocAdcaChange /
--            UD16UpdateHdocAdcaChange）
--
-- 【运行前提】（真实后端模式）
-- 1) 前端 dev server (localhost:3000)、后端 (localhost:8081) 已启动。
-- 2) 后端 AD Change 修复已完成（insert 补齐 NOT NULL 列；CHECK/ADD/DELETE
--    分别处理 404/409/400 与仕様书文案）；前端 CHECK 按 data.act 显示 ACTIVE/INACTIVE。
--
-- 【数据说明】
-- HDOC_ADCA_CHANGE（主键 SERIE+CHNR；Serie 最长5、Chnr 最长10、带 '-' 共 ≤15，
--   确保可用前端 maxLength=15 完整输入）。
--   1) AUS-123456：ACT='Y'（CHECK-ACTIVE / ADD-已存在 409）
--   2) EUR-654321：ACT='N'（CHECK-INACTIVE）
--   3) XXX-999999：不存在（CHECK/DELETE not found）
--   4) JPN-777777：初始不存在（ADD 成功，专用）
--   5) JPN-888888：初始不存在（ADD Desc 空：前端校验，不上 API）
--   6) USA-333333：ACT='Y'（DELETE 成功，专用）
--   7) CAN-444444：ACT='N'（DELETE 已 INACTIVE 400，专用）
-- 另幂等确保登录用户 menuall（hdoc_admin 权限）存在。
--
-- 执行：node tests/aDChange/seed.js
-- ============================================================================

USE ud_test;

-- hdoc_user_infor：登录用户 menuall（主键 USERID+PASSWORD+USERNAME）
INSERT INTO `hdoc_user_infor`
  (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('menuall', 'Menu@123', 'Menu All', 'Menu All', 'Admin', 'menuall@example.com',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  USERNAME = VALUES(USERNAME),
  UPDATE_DATETIME = NOW(), UPDATE_USER = 'system', UPDATE_PROCESS = 'test';

-- HDOC_FUNCTION_AUTH：menuall 权限（含 hdoc_admin 以进入 AD Change）
INSERT INTO `HDOC_FUNCTION_AUTH`
  (USERID, `FUNCTION`, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('menuall', 'hdoc',            NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('menuall', 'hdoc_variables',  NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('menuall', 'hdoc_admin',      NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('menuall', 'hdoc_user_admin', NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  UPDATE_DATETIME = NOW(), UPDATE_USER = 'system', UPDATE_PROCESS = 'test';

-- ============================================================================
-- HDOC_ADCA_CHANGE 测试数据（每次运行前由 seed 幂等重置状态）
-- ============================================================================
-- AUS-123456：ACT='Y'（CHECK-ACTIVE / ADD-已存在 409）
INSERT INTO `HDOC_ADCA_CHANGE`
  (SERIE, CHNR, ACT, BU, REASON, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('AUS', '123456', 'Y', 'BU1', 'ADCA test active',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  ACT=VALUES(ACT), BU=VALUES(BU), REASON=VALUES(REASON),
  UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- EUR-654321：ACT='N'（CHECK-INACTIVE / DELETE 已 INACTIVE 400 参考）
INSERT INTO `HDOC_ADCA_CHANGE`
  (SERIE, CHNR, ACT, BU, REASON, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('EUR', '654321', 'N', 'BU1', 'ADCA test inactive',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  ACT=VALUES(ACT), BU=VALUES(BU), REASON=VALUES(REASON),
  UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- USA-333333：ACT='Y'（DELETE 成功专用，DEDICATED）
INSERT INTO `HDOC_ADCA_CHANGE`
  (SERIE, CHNR, ACT, BU, REASON, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('USA', '333333', 'Y', 'BU1', 'for delete success',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  ACT=VALUES(ACT), BU=VALUES(BU), REASON=VALUES(REASON),
  UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- CAN-444444：ACT='N'（DELETE 已 INACTIVE 400 专用，DEDICATED）
INSERT INTO `HDOC_ADCA_CHANGE`
  (SERIE, CHNR, ACT, BU, REASON, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('CAN', '444444', 'N', 'BU1', 'already inactive',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  ACT=VALUES(ACT), BU=VALUES(BU), REASON=VALUES(REASON),
  UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- 清理浏览器/探测产生的临时 AD Change 记录（保证可重复执行）
DELETE FROM `HDOC_ADCA_CHANGE`
  WHERE (SERIE='JPN' AND CHNR IN ('777777','888888'))
     OR (SERIE='XXX' AND CHNR='999999');
