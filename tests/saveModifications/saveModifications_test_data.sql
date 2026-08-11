-- ============================================================================
-- Save Modifications 模块 (UD06) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/SaveModifications/SaveModifications_単体テスト仕様書.md
-- 对应前端：react-ud/src/SaveModifications/SaveModifications.tsx
-- 对应后端：ModificationServiceImpl.getModificationDetail / ModificationController
--
-- 【运行前提】
-- 1) 本数据面向【真实后端】模式：依赖后端 (localhost:8081) 正常运行、
--    数据库已按 react_ud_sql.txt 的 DDL 建表。
-- 2) 后端已增强：
--      - getModificationDetail：serie 为空时退化仅按 chassisNo(CHNO) 查询
--      - 返回 foundUnreleasedVersion=true + message="VERSION IS RELEASED"
--      - 查询无记录时返回 HTTP 404（"No modification data found."）
-- 3) 完整 Menu 链路进入：登录 -> Generate Doc -> GenerateHomologationDocument(028321)
--    -> GenerateDocument -> Modify Doc -> ModifyDocument -> Save -> SaveModifications
--    SaveModifications 从 ModifyDocument 的 state.chassis = "028321" 进入（无分隔符，
--    因此 serie=''、chassisNo='028321'，后端退化按 chassisNo 查询）。
-- 4) 需已执行 generateDocument_test_data.sql（提供 028321 底盘链路数据）与
--    modifyDocument_test_data.sql（提供 028321 的 HDOC_ADCA_MODIFICATION）。
--    本脚本确保 028321 的修改数据存在，可独立执行/重复执行。
--
-- 【数据说明】
--   - 底盘 028321 的 HDOC_ADCA_MODIFICATION（CHNO='028321'）提供 Storing / Doctype / Version：
--       EnginePower=200HP、Color=Blue、WheelType=Steel（含 doctype/vers）
--
-- 执行：mysql -h172.17.0.63 -uroot -p1234 react_ud < this_file.sql
-- ============================================================================

USE react_ud;

-- HDOC_VARIABLES：变量描述（主键 VARIABLE，供 doXIII 配套）
INSERT INTO `HDOC_VARIABLES`
  (VARIABLE, TYPE, DESCRIPTION, USERID,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('EnginePower', 'ENGINE', 'Engine power output', 'SYSTEM',
   NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('Color',       'BODY',   'Vehicle color',       'SYSTEM',
   NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('WheelType',   'CHASSIS','Wheel type',          'SYSTEM',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  DESCRIPTION = VALUES(DESCRIPTION),
  UPDATE_DATETIME = NOW(), UPDATE_USER = 'system', UPDATE_PROCESS = 'test';

-- HDOC_ADCA_MODIFICATION：底盘 028321 的修改记录（主键 SERIE,CHNO,DOCTYPE,LANG,VARIABLE,VERS）
INSERT INTO `HDOC_ADCA_MODIFICATION`
  (SERIE, CHNO, DOCTYPE, LANG, VARIABLE, VERS, NEWVAL, STA, BU, RELEASE_USER, RELEASE_DATE_TIME,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('99999', '028321', 'VIN_PLATE', 'EN', 'EnginePower', 1, '200HP', 1,   'BU1', 'release', NOW(),
   NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('99999', '028321', 'VIN_PLATE', 'EN', 'Color',       1, 'Blue',  1,   'BU1', 'release', NOW(),
   NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('99999', '028321', 'VIN_PLATE', 'EN', 'WheelType',   1, 'Steel', 0,   'BU1', 'release', NOW(),
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  NEWVAL = VALUES(NEWVAL), STA = VALUES(STA),
  UPDATE_DATETIME = NOW(), UPDATE_USER = 'system', UPDATE_PROCESS = 'test';

-- ============================================================================
-- 补充说明
-- ----------------------------------------------------------------------------
-- 运行测试前：
--   1) 确保后端 (8081) 已用最新代码启动（含 getModificationDetail 退化查询 + 404）
--   2) 确保前端 dev server (3000) 运行
--   3) 已执行 generateDocument_test_data.sql / modifyDocument_test_data.sql
--   4) 执行本 SQL
-- ============================================================================
