-- ============================================================================
-- HDoc Template Check 模块 (UD13) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/HDocTemplateCheck/HDocTemplateCheck_単体テスト仕様書.md
-- 对应前端：react-ud/src/HDocTemplateCheck/HDocTemplateCheck.tsx
--
-- 【特别说明】
-- UD13 为【纯前端】功能（FileReader 读取本地文件 → 正则提取 $...$ 变量），
-- 不调用后端 API，也不访问数据库/MARKET_MASTER 等业务表。
-- 因此本模块的"测试数据"主要是：
--   1) 登录用户（menuall，含 hdoc_admin 权限）—— 用于从 Menu 进入
--      "Upload/Delete template" 画面并点击 "Check Template" 链接进入 UD13。
--   2) 各类 .rtf 测试文件内容（无需落盘，测试中通过 setInputFiles 的内存 buffer 提供）。
--
-- 本文件仅幂等确保 menuall 用户及其功能权限存在（可独立运行）。
-- 执行：node tests/hDocTemplateCheck/seed.js
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

-- HDOC_FUNCTION_AUTH：menuall 权限（hdoc / hdoc_variables / hdoc_admin / hdoc_user_admin）
--   UD13 需要能进入 "Upload/Delete template"（permission=hdoc_admin）→ 点 Check Template 链接
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
