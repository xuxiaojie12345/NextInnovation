-- ============================================================================
-- Market Document Settings List 模块 (UD20) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/MarketDocumentSettingsList/MarketDocumentSettingsList_単体テスト仕様書.md
-- 对应前端：react-ud/src/MarketDocumentSettingsList/MarketDocumentSettingsList.tsx
-- 对应后端：DocumentController / DocumentListServiceImpl / HdocDocumentListMapper
--          （UD20SelectHdocDocumentList）
--
-- 【运行前提】（真实后端模式）
-- 1) 前端 dev server (localhost:3000)、后端 (localhost:8081) 已启动。
-- 2) 前端已修改：Select 按钮去掉 disabled={!selectedDoctype}（未选中可点击并提示 "No data found."，
--    符合仕様書 No.14）。从 Menu 进入本列表画面（iframe /market-document-settings-list）。
--
-- 【数据说明】
-- 本模块列表来自 HDOC_DOCUMENT_LIST 表（被 UD18/UD22 共用）。为获得可预测的测试数据，
-- seed 会清空该表并重新插入受控记录（doctype / register_user / register_datetime 用于断言）。
--   doctype='UD20A'  user='user123' date='2022-11-30 10:30:00'
--   doctype='UD20B'  user='user124' date='2023-01-15 09:00:00'
--   doctype='UD20C'  user='admin'    date='2024-06-01 14:45:00'
-- 另确保登录用户 menuall（hdoc_admin）存在，可访问该 Menu 菜单。
--
-- 【Business unit】前端固定显示 "BU"，不从后端获取。
-- 【Date 列】后端返回 REGISTER_DATETIME 的 LocalDateTime.toString()，含 'T'，如 "2022-11-30T10:30:00"。
--
-- 执行：node tests/marketDocumentSettingsList/seed.js
-- ============================================================================

USE ud_test;

-- --- 清空并重置 HDOC_DOCUMENT_LIST（受控测试数据）---
DELETE FROM `HDOC_DOCUMENT_LIST`;

INSERT INTO `HDOC_DOCUMENT_LIST`
  (DOCTYPE, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('UD20A', 'UD20 Document A', '2022-11-30 10:30:00', 'user123', 'test',
   '2022-11-30 10:30:00', 'user123', 'test'),
  ('UD20B', 'UD20 Document B', '2023-01-15 09:00:00', 'user124', 'test',
   '2023-01-15 09:00:00', 'user124', 'test'),
  ('UD20C', 'UD20 Document C', '2024-06-01 14:45:00', 'admin', 'test',
   '2024-06-01 14:45:00', 'admin', 'test');

-- --- 确保登录用户 menuall 存在且拥有 hdoc_admin（可访问 Market Document Settings List 菜单）---
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
