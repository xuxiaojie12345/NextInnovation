-- ============================================================================
-- Homologation Variables Result List 模块 (UD09) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/HomologationVariablesResultList/HomologationVariablesResultList_単体テスト仕様書.md
-- 对应前端：react-ud/src/HomologationVariablesResultList/HomologationVariablesResultList.tsx
-- 对应后端：SearchController / RuleServiceImpl（UD09Search / UD09DeleteSelected）
--
-- 【运行前提】
-- 1) 本数据面向【真实后端】模式：依赖后端 (localhost:8081) 正常运行、数据库 ud_test 已按 DDL 建表。
-- 2) 后端需支持：
--      - UD09Search（检索 HDOC_USER_DEFINED_RULES，返回 totalCount + records）
--      - UD09DeleteSelected（批量删除选中规则）
-- 3) ResultList 从 location.state.searchCriteria 读取检索条件；直接导航 /homologation-variables-result-list
--    时为无条件检索，返回全部记录（totalCount=3）。
--
-- 【数据说明】
--   本模块主要依赖 HDOC_USER_DEFINED_RULES 已有种子数据（3 条规则，与 UD08 共用 seed）。
--   执行本文件可幂等重种/复位这 3 条规则，保证测试可重复运行：
--      - PC=01 / NUM=100 / MARKET=JP  / EnginePower=200HP  (VS=VARIANT1)
--      - PC=01 / NUM=101 / MARKET=DE  / EnginePower=350HP  (VS=VARIANT2, VS2=V2)
--      - PC=02 / NUM=200 / MARKET=JP  / Color=Blue         (VS=VARIANT3)
--
-- 执行：node tests/homologationVariablesResultList/seed.js
-- ============================================================================

USE ud_test;

-- HDOC_USER_DEFINED_RULES：规则记录（主键 PC + NUM + MARKET）；
-- 先删除测试期间可能产生的临时记录，再重种 3 条种子记录（保证 totalCount=3）。
DELETE FROM `HDOC_USER_DEFINED_RULES`
WHERE (PC, NUM, MARKET) IN
  (('01',200,'JP'), ('01',300,'JP'), ('01',300,'DE'), ('02',210,'JP'), ('02',220,'JP'), ('02',230,'JP'));

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
