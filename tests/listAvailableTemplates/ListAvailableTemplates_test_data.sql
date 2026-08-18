-- ============================================================================
-- List Available Templates 模块 (UD14) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/ListAvailableTemplates/ListAvailableTemplates_単体テスト仕様書.md
-- 对应前端：react-ud/src/ListAvailableTemplates/ListAvailableTemplates.tsx
-- 对应后端：AvailableTemplatesController / FileServiceImpl / MasterDataServiceImpl
--          （UD14SelectMarketmaster / UD14SelectHdocuserdefinedrules / UD14downfile）
--
-- 【运行前提】（纯真实后端模式）
-- 1) 前端 dev server (localhost:3000)、后端 (localhost:8081) 已启动。
-- 2) 后端已实现 UD14SelectHdocuserdefinedrules（接收 market、列 uploads/{market}、
--    结合 HDOC_USER_DEFINED_RULES.VARIABLE 判断 Used、返回 filename/used/lastMod/size）。
--
-- 【数据说明】
-- 1) MARKET_MASTER：市场下拉（幂等确保 JPN/EU 存在，不覆盖已有 JP/DE/SE）。
-- 2) HDOC_USER_DEFINED_RULES：种入 VARIABLE=TEMPLATE-EXAMPLE，
--    使 uploads/{JPN,EU}/template_example.odt 的 Used 列显示 "TEMPLATE-EXAMPLE"（规格书 No.18）。
-- 3) 模板文件（test.odt / template_example.odt / 不同大小文件等）由 seed.js 创建于后端 uploads/{JPN,EU}。
--
-- 执行：node tests/listAvailableTemplates/seed.js
-- ============================================================================

USE ud_test;

-- MARKET_MASTER：市场（主键 MARKET）
INSERT INTO `MARKET_MASTER`
  (MARKET, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('JPN', 'Japan',   NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('EU',  'Europe',  NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  DESCRIPTION = VALUES(DESCRIPTION),
  UPDATE_DATETIME = NOW(), UPDATE_USER = 'system', UPDATE_PROCESS = 'test';

-- HDOC_USER_DEFINED_RULES：用于 Used 列判断（filename -> VARIABLE 候选匹配）
--   template_example.odt -> 基础名 template_example -> TEMPLATE-EXAMPLE（_ 转 -，大写）
INSERT INTO `HDOC_USER_DEFINED_RULES`
  (PC, NUM, MARKET, VS, VS2, VARIABLE, VAL, USERID, UP_DATE, COMMENTS, ADD_DATE, DELETE_DATE,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('XX', 1, 'JPN', 'VS', 'VS2', 'TEMPLATE-EXAMPLE', 'VAL1', 'menuall', '20260814', 'UD14 test', '202608', NULL,
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  VAL = VALUES(VAL),
  UPDATE_DATETIME = NOW(), UPDATE_USER = 'system', UPDATE_PROCESS = 'test';
