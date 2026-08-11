-- ============================================================================
-- Modify Document 模块 (UD05) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/ModifyDocument/ModifyDocument_単体テスト仕様書.md
-- 对应前端：react-ud/src/ModifyDocument/ModifyDocument.tsx
-- 对应后端：ModificationServiceImpl.getVariableModification / updateModification
--
-- 【运行前提】
-- 1) 本数据面向【真实后端】模式：依赖后端 (localhost:8081) 正常运行、
--    数据库已按 react_ud_sql.txt 的 DDL 建表。
-- 2) 后端已增强：
--      - getVariableModification 从 HDOC_ADCA_MODIFICATION (WHERE CHNO=chassisNo) 取变量
--      - description 从 HDOC_VARIABLES 按变量名查询
--      - currentValue = NEWVAL、modifiedValue 初始 = NEWVAL
--      - editable = (STA == 1)
--      - /api/download/template 新增模板下载接口
-- 3) 完整 Menu 链路进入：登录 -> Generate Doc -> GenerateHomologationDocument
--    -> GenerateDocument(028321) -> 点 Modify Doc 链接 -> ModifyDocument(chassisNo=028321)
--    （因此主底盘用 028321，与 GenerateDocument 测试数据共用）
--
-- 【数据说明】
--   - 底盘 028321 的 HDOC_ADCA_MODIFICATION（CHNO='028321'，注意与 GenerateDocument
--     用的 '028321000' 区分）：EnginePower / Color(可编辑) + WheelType(只读 STA=0)
--   - HDOC_VARIABLES 提供变量描述
--
-- 执行：mysql -h172.17.0.63 -uroot -p1234 react_ud < this_file.sql
-- 脚本使用 INSERT ... ON DUPLICATE KEY UPDATE，可重复执行。
-- ============================================================================

USE react_ud;

-- ----------------------------------------------------------------------------
-- 1. HDOC_VARIABLES：变量描述（主键 VARIABLE）
-- ----------------------------------------------------------------------------
INSERT INTO `HDOC_VARIABLES`
  (VARIABLE, TYPE, DESCRIPTION, USERID,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('EnginePower', 'ENGINE', 'Engine power output', 'SYSTEM',
   NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('Color',       'BODY',   'Vehicle color',       'SYSTEM',
   NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('WheelType',   'CHASSIS','Wheel type',          'SYSTEM',
   NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('AXLE_CONF',   'CHASSIS','Axle configuration',  'SYSTEM',
   NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('WB_MM',       'CHASSIS','Wheelbase (mm)',      'SYSTEM',
   NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  DESCRIPTION = VALUES(DESCRIPTION),
  UPDATE_DATETIME = NOW(), UPDATE_USER = 'system', UPDATE_PROCESS = 'test';

-- ----------------------------------------------------------------------------
-- 2. HDOC_ADCA_MODIFICATION：变量修改数据（主键 SERIE,CHNO,DOCTYPE,LANG,VARIABLE,VERS）
--    chassisNo=028321 完整链路主场景
--    STA=1 -> editable=true（可编辑）；STA=0 -> editable=false（只读）
--    NEWVAL 同时作为 currentValue 与 modifiedValue 初始值
-- ----------------------------------------------------------------------------
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
--   1) 确保后端 (8081) 已用最新代码启动（含 ModifyDocument 增强 + /api/download/template）
--   2) 确保前端 dev server (3000) 运行
--   3) 已执行 generateDocument_test_data.sql（提供 028321 底盘/GenerateDocument 数据）
--   4) 执行本 SQL
-- ============================================================================
