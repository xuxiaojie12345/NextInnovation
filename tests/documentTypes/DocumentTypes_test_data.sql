-- ============================================================================
-- Document Types 模块 (UD22) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/DocumentTypes/DocumentTypes_単体テスト仕様書.md
-- 对应前端：react-ud/src/DocumentTypes/DocumentTypes.tsx
-- 对应后端：DocumentController / DocumentListServiceImpl / HdocDocumentListMapper
--          （GET /api/UD20SelectHdocDocumentList，UD22 复用 UD20 接口）
--
-- 【运行前提】（真实后端模式）
-- 1) 前端 dev server (localhost:3000)、后端 (localhost:8081) 已启动。
-- 2) 后端已修复：DocumentListRecord 增加 description 字段（从 HDOC_DOCUMENT_LIST.DESCRIPTION 返回），
--    UD20SelectHdocDocumentList records 每项含 { doctype, businessUnit, user, date, description }。
-- 3) 从 Menu → "Document Types" 进入（iframe /document-types），只读表格（Key/Description 两列）。
--
-- 【数据说明】
-- 表格来自 HDOC_DOCUMENT_LIST 表（被 UD18/UD20/UD22 共用）。
-- 为获得可预测数据，seed 清空该表并插入受控文档类型（doctype + description 用于断言）：
--   DOT_A / Document Type A
--   DOT_B / Document Type B
--   DOT_C / Document Type C
-- 另确保登录用户 menuall（hdoc_admin）存在。
--
-- 执行：node tests/documentTypes/seed.js
-- ============================================================================

USE ud_test;

-- --- 清空并重置 HDOC_DOCUMENT_LIST（受控测试数据）---
DELETE FROM `HDOC_DOCUMENT_LIST`;

INSERT INTO `HDOC_DOCUMENT_LIST`
  (DOCTYPE, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('DOT_A', 'Document Type A', NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('DOT_B', 'Document Type B', NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('DOT_C', 'Document Type C', NOW(), 'system', 'test', NOW(), 'system', 'test');

-- --- 确保登录用户 menuall 存在且拥有 hdoc_admin（可访问 Document Types 菜单）---
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
