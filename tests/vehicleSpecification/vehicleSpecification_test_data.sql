-- ============================================================================
-- Vehicle Specification 模块 (UD07) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/VehicleSpecification/VehicleSpecification_単体テスト仕様書.md
-- 对应前端：react-ud/src/VehicleSpecification/VehicleSpecification.tsx
-- 对应后端：GenerateDocumentServiceImpl.getVehicleSpecification
--
-- 【运行前提】
-- 1) 本数据面向【真实后端】模式：依赖后端 (localhost:8081)、数据库已按 react_ud_sql.txt 建表。
-- 2) 后端已增强 getVehicleSpecification：
--      - VDA_GENERAL(VIN) -> builtWeek/productType/vin/countryOfOperation
--      - OM(VIN) -> model/customerAdap
--      - KOLA_VARIANT(DESCRIPTION=chassisNo 关联) -> symbolList(按 sortKey 升序, display 8位)
--        + engineNo(FAMILY_ID LIKE 'DPX%' 的 SYMBOL)
--      - KAP_SNOTE(SNOTE=OM.CUSTOMER_ADAP) -> sNoteDesc(VARIANT_ID/描述)
-- 3) 完整 Menu 链路进入：ModifyDocument 的 chassis no 链接 window.open
--    /vda-vehicle-specification?chassisNo=028321（query 方式）。
-- 4) 主底盘用 028321（已有 OM/VDA data），本脚本补充 VDA_GENERAL.PRODUCT_TYPE、
--    OM.CUSTOMER_ADAP、KOLA_VARIANT(028321 符号)、KAP_SNOTE(SN001 描述)。
--
-- 执行：mysql -h172.17.0.63 -uroot -p1234 react_ud < this_file.sql
-- ============================================================================

USE react_ud;

-- ----------------------------------------------------------------------------
-- 1. VDA_GENERAL（VIN=028321）：补充 PRODUCT_TYPE
-- ----------------------------------------------------------------------------
INSERT INTO `HDOC_REC_DATA_VDA_GENERAL`
  (SERIE, CHNR, VIN, COUNTRY_OF_OPERATION, PRODUCT_TYPE, MAIN_SPEC_WEEK, BUILD_WEEK,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('99999', '028321000', '028321', 'DE', 'VAN', '202244', '202245',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  PRODUCT_TYPE = VALUES(PRODUCT_TYPE), COUNTRY_OF_OPERATION = VALUES(COUNTRY_OF_OPERATION),
  UPDATE_DATETIME = NOW(), UPDATE_USER = 'system', UPDATE_PROCESS = 'test';

-- ----------------------------------------------------------------------------
-- 2. OM（VIN=028321）：补充 CUSTOMER_ADAP（S-Note code）
-- ----------------------------------------------------------------------------
INSERT INTO `HDOC_REC_DATA_OM`
  (ORDERNUMBER, SERIE, CHNR, MODEL, VIN, CUSTOMER_ADAP,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('ORD100001', '99999', '028321000', 'MODEL-A', '028321', 'SN001',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  CUSTOMER_ADAP = VALUES(CUSTOMER_ADAP),
  UPDATE_DATETIME = NOW(), UPDATE_USER = 'system', UPDATE_PROCESS = 'test';

-- ----------------------------------------------------------------------------
-- 3. KOLA_VARIANT（DESCRIPTION=028321 关联该底盘的符号）
--    engine: FAMILY_ID DPX* -> engineNo；symbol1/symbol2 用 functionGroup 控制 sortKey
-- ----------------------------------------------------------------------------
INSERT INTO `HDOC_REC_DATA_KOLA_VARIANT`
  (FAMILY_ID, VARIANT_ID, FUNCTION_GROUP, SYMBOL, DESCRIPTION, TRANS_TS,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('DPX12', 'VA001', 'DPX', 'DPX12345', '028321', 'TRANS_V',
   NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('A001',  'VA002', 'FG01', 'SYMBOL1',  '028321', 'TRANS_V',
   NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('A002',  'VA003', 'FG02', 'SYMBOL2',  '028321', 'TRANS_V',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  SYMBOL = VALUES(SYMBOL), FUNCTION_GROUP = VALUES(FUNCTION_GROUP), DESCRIPTION = VALUES(DESCRIPTION),
  UPDATE_DATETIME = NOW(), UPDATE_USER = 'system', UPDATE_PROCESS = 'test';

-- ----------------------------------------------------------------------------
-- 4. KAP_SNOTE（SNOTE=SN001 -> sNoteDesc）
--    KAP_SNOTE.VARIANT_ID 物理含义为 DESCRIPTION（S-Note 描述）
-- ----------------------------------------------------------------------------
INSERT INTO `HDOC_REC_DATA_KAP_SNOTE`
  (SNOTE, VARIANT_ID, TRANS_TS,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('SN001', 'Special customer adaptation', 'TRANS_S',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  VARIANT_ID = VALUES(VARIANT_ID),
  UPDATE_DATETIME = NOW(), UPDATE_USER = 'system', UPDATE_PROCESS = 'test';

-- ============================================================================
-- 补充说明
-- ----------------------------------------------------------------------------
-- 运行测试前：
--   1) 确保后端 (8081) 已用最新代码启动（含 getVehicleSpecification 完整组装）
--   2) 确保前端 dev server (3000) 运行
--   3) 已执行 generateDocument_test_data.sql / modifyDocument_test_data.sql
--   4) 执行本 SQL
-- ============================================================================
