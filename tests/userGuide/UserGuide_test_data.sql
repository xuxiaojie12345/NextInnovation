-- ============================================================================
-- User Guide 模块 (UD24) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/UserGuide/UserGuide_単体テスト仕様書.md
-- 对应前端：react-ud/src/UserGuide/UserGuide.tsx
-- 对应后端：无 API 调用（纯前端静态内容 + 链接跳转 + Other Information 复选框切换）
--
-- 【运行前提】（真实前端模式）
-- 1) 前端 dev server (localhost:3000) 已启动（本模块不依赖后端）。
-- 2) 从 Menu → "User Guide" 进入（iframe /user-guide，需要 hdoc 权限）。
-- 3) 前端已删除 "Describation" 链接（该 /describation 路由不存在，按用户决策移除并更新设计书/仕様書）。
-- 4) 本模块无 API、无数据库表；仅确保登录用户 menuall 拥有 hdoc 权限可访问 Menu。
--
-- 执行：node tests/userGuide/seed.js
-- ============================================================================

USE ud_test;

-- --- 确保登录用户 menuall 存在且拥有 hdoc（可访问 User Guide 菜单）---
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
