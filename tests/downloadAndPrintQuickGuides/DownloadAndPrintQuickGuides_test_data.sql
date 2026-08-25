-- ============================================================================
-- Download and Print Quick Guides 模块 (UD23) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/DownloadAndPrintQuickGuides/DownloadAndPrintQuickGuides_単体テスト仕様書.md
-- 对应前端：react-ud/src/DownloadAndPrintQuickGuides/DownloadAndPrintQuickGuides.tsx
-- 对应后端：无 API 调用（纯前端静态内容 + 链接跳转/下载 + 复选框切换说明）
--
-- 【运行前提】（真实前端模式）
-- 1) 前端 dev server (localhost:3000) 已启动（本模块不依赖后端）。
-- 2) 从 Menu → "Download and Print Quick Guides" 进入（iframe /download-print-quick-guides）。
-- 3) 本模块无 API、无数据库表；仅确保登录用户 menuall 拥有 hdoc_admin 可访问 Menu。
--
-- 【差异说明】
-- 两个下载链接指向 /quick-guides/*.pdf，但 public 目录未提供这些文件，
-- 点击会导航/打开到 404（符合仕様書 No.9/22 的"链接失效 → 浏览器 404"场景）。
-- 测试主要断言链接属性（href / target=_blank / download）与复选框切换行为。
--
-- 执行：node tests/downloadAndPrintQuickGuides/seed.js
-- ============================================================================

USE ud_test;

-- --- 确保登录用户 menuall 存在且拥有 hdoc_admin（可访问 Download and Print Quick Guides 菜单）---
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
