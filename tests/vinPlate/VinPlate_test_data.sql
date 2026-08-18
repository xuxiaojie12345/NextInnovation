-- ============================================================================
-- Vin Plate 模块 (UD15) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/VinPlate/VinPlate_単体テスト仕様書.md
-- 对应前端：react-ud/src/VinPlate/VinPlate.tsx
-- 对应后端：VinPlateController / VinPlateServiceImpl / HdocSendDataVinPlateMapper
--          （UD15ViewInfo / UD15SetRegenerate / UD15SetOK /
--            UD15ChangetoBasicInfo / UD15ChangetoAdvancedInfo）
--
-- 【运行前提】（真实后端模式）
-- 1) 前端 dev server (localhost:3000)、后端 (localhost:8081) 已启动。
-- 2) 后端 VinPlate 修复已完成（mapper updateStatus 使用 ORDERNUMBER；
--    service 对 0 影响行抛 404；前端字段映射 + XML_DOC 解析）。
--
-- 【数据说明】
-- HDOC_SEND_DATA_VIN_PLATE（主键 SERIE+CHNR；Query/Update 均按 ORDERNUMBER=chassisNo）：
--   1) 112233：TYPE=1(basic)、STATUS=0(新規追加)、MSG=file not found、
--      XML_DOC 含 2 个 PrintItemName + 2 个 Variant（用于 Print items / VP Data 断言）
--   2) 223344：TYPE=2(ADVANCED)、STATUS=2(送信済み)、MSG=null、
--      XML_DOC=<Data/>（Print items / VP Data 为空）
--   3) 334455：STATUS=9(エラー)、MSG=exception occurred、DOC_READY/DOC_SENT=null
--   4) 445566：TYPE=2(ADVANCED)、STATUS=1(xml doc 作成済み)
--   5) 556677：TYPE=1(basic)、STATUS=1(xml doc 作成済み)
-- 另幂等确保登录用户 menuall（hdoc_admin 权限）存在，可从 Menu 进入 VPPS Vin plate。
--
-- 执行：node tests/vinPlate/seed.js
-- ============================================================================

USE ud_test;

-- hdoc_user_infor：登录用户 menuall（主键 USERID+PASSWORD+USERNAME）
INSERT INTO `hdoc_user_infor`
  (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('menuall', 'Menu@123', 'Menu All', 'Menu All', 'Admin', 'menuall@example.com',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  USERNAME = VALUES(USERNAME),
  UPDATE_DATETIME = NOW(), UPDATE_USER = 'system', UPDATE_PROCESS = 'test';

-- HDOC_FUNCTION_AUTH：menuall 权限（含 hdoc_admin 以进入 VPPS Vin plate）
INSERT INTO `HDOC_FUNCTION_AUTH`
  (USERID, `FUNCTION`, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('menuall', 'hdoc',            NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('menuall', 'hdoc_variables',  NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('menuall', 'hdoc_admin',      NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('menuall', 'hdoc_user_admin', NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  UPDATE_DATETIME = NOW(), UPDATE_USER = 'system', UPDATE_PROCESS = 'test';

-- ============================================================================
-- HDOC_SEND_DATA_VIN_PLATE 测试数据
-- ============================================================================
-- 112233：TYPE=1(basic), STATUS=0(新規追加), MSG=file not found, 含 Print items + VP Data
INSERT INTO `HDOC_SEND_DATA_VIN_PLATE`
  (SERIE, CHNR, PC, ADDED, DOC_READY, DOC_SENT, BU, STATUS, XML_DOC, MSG,
   TYPE, IS_JS_DIVISION, ORDERNUMBER, FILENAME_ON_DISK, ADCA_CHANGE_FLG,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('S1', 'CH001', 'PC', '2022-11-01', '2022-11-21', '2022-11-22', 'BU1', 0,
   '<Data><PrintItems><PrintItemName>PlateNo</PrintItemName><PrintItemName>TypeNo</PrintItemName></PrintItems><Variants><Variant name="V1">Value1</Variant><Variant name="V2">Value2</Variant></Variants></Data>',
   'file not found', '1', 'N', '112233', 'f1.xml', 'N',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  STATUS=VALUES(STATUS), TYPE=VALUES(TYPE), DOC_READY=VALUES(DOC_READY),
  DOC_SENT=VALUES(DOC_SENT), MSG=VALUES(MSG), XML_DOC=VALUES(XML_DOC), BU=VALUES(BU),
  UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- 223344：TYPE=2(ADVANCED), STATUS=2(送信済み), MSG=null, XML_DOC=<Data/>（空）
INSERT INTO `HDOC_SEND_DATA_VIN_PLATE`
  (SERIE, CHNR, PC, ADDED, DOC_READY, DOC_SENT, BU, STATUS, XML_DOC, MSG,
   TYPE, IS_JS_DIVISION, ORDERNUMBER, FILENAME_ON_DISK, ADCA_CHANGE_FLG,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('S1', 'CH002', 'PC', '2022-11-02', '2022-11-21', '2022-11-23', 'BU1', 2,
   '<Data/>', NULL, '2', 'N', '223344', 'f2.xml', 'N',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  STATUS=VALUES(STATUS), TYPE=VALUES(TYPE), DOC_READY=VALUES(DOC_READY),
  DOC_SENT=VALUES(DOC_SENT), MSG=VALUES(MSG), XML_DOC=VALUES(XML_DOC), BU=VALUES(BU),
  UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- 334455：STATUS=9(エラー), MSG=exception occurred, DOC_READY/DOC_SENT=null
INSERT INTO `HDOC_SEND_DATA_VIN_PLATE`
  (SERIE, CHNR, PC, ADDED, DOC_READY, DOC_SENT, BU, STATUS, XML_DOC, MSG,
   TYPE, IS_JS_DIVISION, ORDERNUMBER, FILENAME_ON_DISK, ADCA_CHANGE_FLG,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('S1', 'CH003', 'PC', '2022-11-03', NULL, NULL, 'BU1', 9,
   '<Data/>', 'exception occurred', '1', 'N', '334455', 'f3.xml', 'N',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  STATUS=VALUES(STATUS), TYPE=VALUES(TYPE), DOC_READY=VALUES(DOC_READY),
  DOC_SENT=VALUES(DOC_SENT), MSG=VALUES(MSG), XML_DOC=VALUES(XML_DOC), BU=VALUES(BU),
  UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- 445566：TYPE=2(ADVANCED), STATUS=1(xml doc 作成済み)
INSERT INTO `HDOC_SEND_DATA_VIN_PLATE`
  (SERIE, CHNR, PC, ADDED, DOC_READY, DOC_SENT, BU, STATUS, XML_DOC, MSG,
   TYPE, IS_JS_DIVISION, ORDERNUMBER, FILENAME_ON_DISK, ADCA_CHANGE_FLG,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('S1', 'CH004', 'PC', '2022-11-04', '2022-11-21', NULL, 'BU1', 1,
   '<Data/>', NULL, '2', 'N', '445566', 'f4.xml', 'N',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  STATUS=VALUES(STATUS), TYPE=VALUES(TYPE), DOC_READY=VALUES(DOC_READY),
  DOC_SENT=VALUES(DOC_SENT), MSG=VALUES(MSG), XML_DOC=VALUES(XML_DOC), BU=VALUES(BU),
  UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- 556677：TYPE=1(basic), STATUS=1(xml doc 作成済み)
INSERT INTO `HDOC_SEND_DATA_VIN_PLATE`
  (SERIE, CHNR, PC, ADDED, DOC_READY, DOC_SENT, BU, STATUS, XML_DOC, MSG,
   TYPE, IS_JS_DIVISION, ORDERNUMBER, FILENAME_ON_DISK, ADCA_CHANGE_FLG,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('S1', 'CH005', 'PC', '2022-11-05', NULL, NULL, 'BU1', 1,
   '<Data/>', NULL, '1', 'N', '556677', 'f5.xml', 'N',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  STATUS=VALUES(STATUS), TYPE=VALUES(TYPE), DOC_READY=VALUES(DOC_READY),
  DOC_SENT=VALUES(DOC_SENT), MSG=VALUES(MSG), XML_DOC=VALUES(XML_DOC), BU=VALUES(BU),
  UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- ============================================================================
-- 以下为更新操作专用底盘（每个更新操作独立 chassis，避免用例间互相污染）
-- ============================================================================
-- 667788：Set Regenerate 专用（初始 STATUS=9），操作后应为 0
INSERT INTO `HDOC_SEND_DATA_VIN_PLATE`
  (SERIE, CHNR, PC, ADDED, DOC_READY, DOC_SENT, BU, STATUS, XML_DOC, MSG,
   TYPE, IS_JS_DIVISION, ORDERNUMBER, FILENAME_ON_DISK, ADCA_CHANGE_FLG,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('S2', 'CH006', 'PC', '2022-11-06', NULL, NULL, 'BU1', 9,
   '<Data/>', 'pending', '1', 'N', '667788', 'f6.xml', 'N',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  STATUS=VALUES(STATUS), TYPE=VALUES(TYPE), DOC_READY=VALUES(DOC_READY),
  DOC_SENT=VALUES(DOC_SENT), MSG=VALUES(MSG), XML_DOC=VALUES(XML_DOC), BU=VALUES(BU),
  UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- 778899：Set OK 专用（初始 STATUS=2），操作后应为 1
INSERT INTO `HDOC_SEND_DATA_VIN_PLATE`
  (SERIE, CHNR, PC, ADDED, DOC_READY, DOC_SENT, BU, STATUS, XML_DOC, MSG,
   TYPE, IS_JS_DIVISION, ORDERNUMBER, FILENAME_ON_DISK, ADCA_CHANGE_FLG,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('S2', 'CH007', 'PC', '2022-11-07', NULL, NULL, 'BU1', 2,
   '<Data/>', NULL, '2', 'N', '778899', 'f7.xml', 'N',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  STATUS=VALUES(STATUS), TYPE=VALUES(TYPE), DOC_READY=VALUES(DOC_READY),
  DOC_SENT=VALUES(DOC_SENT), MSG=VALUES(MSG), XML_DOC=VALUES(XML_DOC), BU=VALUES(BU),
  UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- 889900：Change to Basic 专用（初始 TYPE=2, STATUS=2），操作后应为 TYPE=1, STATUS=0
INSERT INTO `HDOC_SEND_DATA_VIN_PLATE`
  (SERIE, CHNR, PC, ADDED, DOC_READY, DOC_SENT, BU, STATUS, XML_DOC, MSG,
   TYPE, IS_JS_DIVISION, ORDERNUMBER, FILENAME_ON_DISK, ADCA_CHANGE_FLG,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('S2', 'CH008', 'PC', '2022-11-08', NULL, NULL, 'BU1', 2,
   '<Data/>', NULL, '2', 'N', '889900', 'f8.xml', 'N',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  STATUS=VALUES(STATUS), TYPE=VALUES(TYPE), DOC_READY=VALUES(DOC_READY),
  DOC_SENT=VALUES(DOC_SENT), MSG=VALUES(MSG), XML_DOC=VALUES(XML_DOC), BU=VALUES(BU),
  UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';

-- 990011：Change to Advanced 专用（初始 TYPE=1, STATUS=1），操作后应为 TYPE=2, STATUS=0
INSERT INTO `HDOC_SEND_DATA_VIN_PLATE`
  (SERIE, CHNR, PC, ADDED, DOC_READY, DOC_SENT, BU, STATUS, XML_DOC, MSG,
   TYPE, IS_JS_DIVISION, ORDERNUMBER, FILENAME_ON_DISK, ADCA_CHANGE_FLG,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('S2', 'CH009', 'PC', '2022-11-09', NULL, NULL, 'BU1', 1,
   '<Data/>', NULL, '1', 'N', '990011', 'f9.xml', 'N',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  STATUS=VALUES(STATUS), TYPE=VALUES(TYPE), DOC_READY=VALUES(DOC_READY),
  DOC_SENT=VALUES(DOC_SENT), MSG=VALUES(MSG), XML_DOC=VALUES(XML_DOC), BU=VALUES(BU),
  UPDATE_DATETIME=NOW(), UPDATE_USER='system', UPDATE_PROCESS='test';
