-- ============================================================================
-- Homologation Variables 模块 (UD08/UD09) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/HomologationVariables/HomologationVariables_単体テスト仕様書.md
-- 对应前端：react-ud/src/HomologationVariables/HomologationVariables.tsx
--         + react-ud/src/HomologationVariablesResultList/HomologationVariablesResultList.tsx
-- 对应后端：HomologationVariablesController / RuleServiceImpl / MasterDataServiceImpl
--
-- 【运行前提】
-- 1) 本数据面向【真实后端】模式：依赖后端 (localhost:8081) 正常运行、数据库 ud_test 已按 DDL 建表。
-- 2) 后端需支持：
--      - UD08SelectProductclassmaster / UD08SelectMarketmaster / UD08SelectHdocvariables（下拉框）
--      - UD08Add / UD08Update / UD08Delete（增删改）
--      - UD09Search（检索 HDOC_USER_DEFINED_RULES）
-- 3) 前端字段已与后端 SelectListResponse(code/description) 对齐（下拉框读 code），
--    且后端 addRule 已设置 NUM 主键。
--
-- 【数据说明】
--   - PRODUCT_CLASS_MASTER / MARKET_MASTER：下拉框选项
--   - HDOC_VARIABLES：Variable 校验列表（Add/Update 时校验 variable 是否合法）
--   - HDOC_USER_DEFINED_RULES：规则记录（Search/Update/Delete）
--
-- 执行：node tests/homologationVariables/seed.js
-- ============================================================================

USE ud_test;

-- PRODUCT_CLASS_MASTER：产品分类（主键 PC）
INSERT INTO `PRODUCT_CLASS_MASTER`
  (PC, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('01', 'Heavy Duty', NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('02', 'Medium Duty', NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('03', 'Light Duty', NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  DESCRIPTION = VALUES(DESCRIPTION),
  UPDATE_DATETIME = NOW(), UPDATE_USER = 'system', UPDATE_PROCESS = 'test';

-- MARKET_MASTER：市场（主键 MARKET）
INSERT INTO `MARKET_MASTER`
  (MARKET, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('JP', 'Japan',     NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('DE', 'Germany',   NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('SE', 'Sweden',    NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  DESCRIPTION = VALUES(DESCRIPTION),
  UPDATE_DATETIME = NOW(), UPDATE_USER = 'system', UPDATE_PROCESS = 'test';

-- HDOC_VARIABLES：变量校验列表（主键 VARIABLE，UP_DATE 为 null）
INSERT INTO `HDOC_VARIABLES`
  (VARIABLE, TYPE, DESCRIPTION, USERID, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('AXLE_CONF',   'CHASSIS', 'Axle configuration', 'SYSTEM', NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('Color',       'BODY',    'Vehicle color',       'SYSTEM', NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('EnginePower', 'ENGINE',  'Engine power output', 'SYSTEM', NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('WB_MM',       'BODY',    'Wheelbase (mm)',      'SYSTEM', NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('WheelType',   'CHASSIS', 'Wheel type',          'SYSTEM', NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  DESCRIPTION = VALUES(DESCRIPTION),
  UPDATE_DATETIME = NOW(), UPDATE_USER = 'system', UPDATE_PROCESS = 'test';

-- HDOC_USER_DEFINED_RULES：规则记录（主键 PC + NUM + MARKET）
INSERT INTO `HDOC_USER_DEFINED_RULES`
  (PC, NUM, MARKET, VS, VS2, VARIABLE, VAL, USERID, UP_DATE, COMMENTS, ADD_DATE, DELETE_DATE,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  -- 主链验证数据：PC=01 / NUM=100 / MARKET=JP / EnginePower = 200HP
  ('01', 100, 'JP', 'VARIANT1', '',   'EnginePower', '200HP', 'menuall', '202608', 'Rule engine power JP', '202601', NULL,
   NOW(), 'menuall', 'test', NOW(), 'menuall', 'test'),
  -- 多条件 / Market 筛选：PC=01 / NUM=101 / MARKET=DE / EnginePower = 350HP
  ('01', 101, 'DE', 'VARIANT2', 'V2', 'EnginePower', '350HP', 'menuall', '202608', 'Rule engine power DE', '202601', NULL,
   NOW(), 'menuall', 'test', NOW(), 'menuall', 'test'),
  -- Market=JP / 另一变量：PC=02 / NUM=200 / MARKET=JP / Color = Blue
  ('02', 200, 'JP', 'VARIANT3', '',   'Color',       'Blue',   'menuall', '202608', 'Rule color JP',        '202602', NULL,
   NOW(), 'menuall', 'test', NOW(), 'menuall', 'test')
ON DUPLICATE KEY UPDATE
  VS = VALUES(VS), VS2 = VALUES(VS2), VARIABLE = VALUES(VARIABLE), VAL = VALUES(VAL),
  COMMENTS = VALUES(COMMENTS), ADD_DATE = VALUES(ADD_DATE), DELETE_DATE = VALUES(DELETE_DATE),
  UPDATE_DATETIME = NOW(), UPDATE_USER = 'menuall', UPDATE_PROCESS = 'test';
