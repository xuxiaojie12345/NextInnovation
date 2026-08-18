-- ============================================================================
-- HDoc User Doc Administration 模块 (UD18) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/HDocUserDocAdministration/HDocUserDocAdministration_単体テスト仕様書.md
-- 对应前端：react-ud/src/HDocUserDocAdministration/HDocUserDocAdministration.tsx
-- 对应后端：UserAdminController / UserAdminServiceImpl / HdocUserDocMapper / DocumentController
--          （UD18SelectHdocFunctionAuth / UD18SelectHdocUserDoc / UD18DeleteHdocUserDoc /
--            UD18CreateHdocUserDoc / UD20SelectHdocDocumentList）
--
-- 【运行前提】（真实后端模式）
-- 1) 前端 dev server (localhost:3000)、后端 (localhost:8081) 已启动。
-- 2) 后端 UD18 修复已完成（HdocUserDocMapper.insertBatch 补齐 NOT NULL 审计列并修正属性名；
--    UD18SelectHdocUserDoc 返回 userName 且校验用户存在；UD18CreateHdocUserDoc 校验用户存在且
--    返回仕様书消息 "User document permissions updated successfully."）
--
-- 【数据说明】
-- HDOC_DOCUMENT_LIST：确保测试文档（UD_TEST/UD_SPEC）存在 → 页面动态生成复选框。
--   user123  : 用于 Update/Delete 测试（seed 每次重置为无文档权限，保证可重复）
--   ud18doc  : 预置文档权限（HDOC_USER_DOC=UD_TEST,UD_SPEC）→ 测 User Info 回显
--   menuall  : 登录用户（hdoc_user_admin），无文档权限
--
-- 执行：node tests/hDocUserDocAdministration/seed.js
-- ============================================================================

USE ud_test;

-- HDOC_DOCUMENT_LIST：测试文档（幂等）
INSERT INTO `HDOC_DOCUMENT_LIST`
  (DOCTYPE, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('UD_TEST', 'Unit Test Doc', NOW(),'system','test', NOW(),'system','test'),
  ('UD_SPEC', 'Unit Spec Doc', NOW(),'system','test', NOW(),'system','test')
ON DUPLICATE KEY UPDATE
  DESCRIPTION=VALUES(DESCRIPTION), UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- hdoc_user_infor：登录用户 menuall + 目标用户（幂等）
INSERT INTO `hdoc_user_infor`
  (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('menuall', 'Menu@123', 'Menu All', 'Menu All', 'Admin', 'menuall@example.com',
   NOW(),'system','test', NOW(),'system','test'),
  ('user123', 'Pass@123', 'John Doe', 'John', 'User', 'john.doe@example.com',
   NOW(),'system','test', NOW(),'system','test'),
  ('ud18doc', 'Pass@123', 'Doc User', 'Doc', 'User', 'doc@example.com',
   NOW(),'system','test', NOW(),'system','test')
ON DUPLICATE KEY UPDATE
  USERNAME=VALUES(USERNAME), UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- HDOC_FUNCTION_AUTH：menuall 拥有 hdoc_user_admin（进入画面权限）
INSERT INTO `HDOC_FUNCTION_AUTH`
  (USERID, `FUNCTION`, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('menuall', 'hdoc_user_admin', NOW(),'system','test', NOW(),'system','test')
ON DUPLICATE KEY UPDATE
  UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- HDOC_USER_DOC：ud18doc 预置文档权限（测回显）
INSERT INTO `HDOC_USER_DOC`
  (USERID, DOCTYPE, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('ud18doc', 'UD_TEST', NOW(),'system','test', NOW(),'system','test'),
  ('ud18doc', 'UD_SPEC', NOW(),'system','test', NOW(),'system','test')
ON DUPLICATE KEY UPDATE
  UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- 重置 user123 文档权限为空（保证 Update/Delete 测试可重复）
DELETE FROM `HDOC_USER_DOC` WHERE USERID='user123';
