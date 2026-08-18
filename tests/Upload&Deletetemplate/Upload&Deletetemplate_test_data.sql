-- ============================================================================
-- Upload & Delete Template 模块 (UD12) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/Upload&Deletetemplate/Upload&Deletetemplate_単体テスト仕様書.md
-- 对应前端：react-ud/src/Upload&Deletetemplate/Upload&Deletetemplate.tsx
-- 对应后端：TemplateController / FileServiceImpl / MasterDataServiceImpl
--          （UD12SelectMarket / UD12GetTemplatesByMarket / UD12UploadFile / UD12DeleteFile）
--
-- 【运行前提】
-- 1) 本数据面向【真实后端】模式：依赖后端 (localhost:8081) 正常、数据库 ud_test 已按 DDL 建表。
-- 2) 后端需支持：
--      - UD12SelectMarket（检索 MARKET_MASTER）
--      - UD12GetTemplatesByMarket（列 uploads/{market} 模板文件）
--      - UD12UploadFile / UD12DeleteFile（真实文件上传/删除，upload-dir=./uploads）
-- 3) 文件上传依赖真实文件系统（后端 workdir 下 ./uploads/{MARKET}/文件），
--    测试会真实创建/删除 uploads 下的模板文件。
--
-- 【数据说明】
--   MARKET_MASTER：Market 下拉（规格书示例 JPN/EU）。本文件幂等种入 JPN(Japan) 与 EU(Europe)，
--   不覆盖已有 JP/DE/SE。Upload/Delete 测试用 JPN/EU，与规格书一致。
--
-- 执行：node tests/Upload&Deletetemplate/seed.js
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
