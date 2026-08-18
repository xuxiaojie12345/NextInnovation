-- ============================================================================
-- Existing HDoc Variables Result List 模块 (UD11) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/ExistingHDocVariablesResultList/ExistingHDocVariablesResultList_単体テスト仕様書.md
-- 对应前端：react-ud/src/ExistingHDocVariablesResultList/ExistingHDocVariablesResultList.tsx
--         + react-ud/src/ExistingHDocVariables/ExistingHDocVariables.tsx (UD10，Back/回填)
--         + react-ud/src/HomologationVariables/HomologationVariables.tsx (UD08，Down 跳转)
-- 对应后端：SearchController / VariableServiceImpl（UD11Search）
--
-- 【运行前提】
-- 1) 本数据面向【真实后端】模式：依赖后端 (localhost:8081) 正常、数据库 ud_test 已按 DDL 建表。
-- 2) 后端需支持 UD11Search（检索 HDOC_VARIABLES，返回 totalCount + records）。
-- 3) 检索无条件时返回全部种子记录（totalCount=5）。
--
-- 【数据说明】本模块依赖 HDOC_VARIABLES（变量主数据）：
--   种子 5 条：AXLE_CONF/CHASSIS、Color/BODY、EnginePower/VDA、WB_MM/BODY、WheelType/CHASSIS
--   EnginePower 类型设为 'VDA'，用于 No.1 携带条件(Variable=ENGINE, Type=VDA)检索、No.8 回填、No.11 Down 过滤。
--   执行本文件会幂等重种 5 条种子变量，保证无条件检索 totalCount=5、可重复运行。
--
-- 执行：node tests/existingHDocVariablesResultList/seed.js
-- ============================================================================

USE ud_test;

-- 清理测试产生的临时记录（Down/回填等不会新增记录，此处仅防御性清理）
DELETE FROM `HDOC_VARIABLES`
WHERE VARIABLE IN ('NEW_VAR', 'DELETE_TARGET', 'TEMP_VAR1', 'TEMP_VAR2', 'NONEXIST_TEST');

-- 幂等重种 5 条种子变量（主键 VARIABLE）
INSERT INTO `HDOC_VARIABLES`
  (VARIABLE, TYPE, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('AXLE_CONF',   'CHASSIS', 'Axle configuration', NOW(), 'menuall', 'test', NOW(), 'menuall', 'test'),
  ('Color',       'BODY',    'Vehicle color',       NOW(), 'menuall', 'test', NOW(), 'menuall', 'test'),
  ('EnginePower', 'VDA',     'Engine power output', NOW(), 'menuall', 'test', NOW(), 'menuall', 'test'),
  ('WB_MM',       'BODY',    'Wheelbase (mm)',      NOW(), 'menuall', 'test', NOW(), 'menuall', 'test'),
  ('WheelType',   'CHASSIS', 'Wheel type',          NOW(), 'menuall', 'test', NOW(), 'menuall', 'test')
ON DUPLICATE KEY UPDATE
  TYPE = VALUES(TYPE), DESCRIPTION = VALUES(DESCRIPTION),
  UPDATE_DATETIME = NOW(), UPDATE_USER = 'menuall', UPDATE_PROCESS = 'test';
