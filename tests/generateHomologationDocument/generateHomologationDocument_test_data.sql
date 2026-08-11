-- ============================================================================
-- Generate Homologation Document 模块 (UD03) 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/GenerateHomologationDocument/GenerateHomologationDocument_単体テスト仕様書.md
-- 对应前端：react-ud/src/GenerateHomologationDocument/GenerateHomologationDocument.tsx
--
-- 【运行前提】
-- 1) 本数据面向【真实后端】模式：依赖 React 后端 (localhost:8081) 正常运行、
--    数据库已按 react_ud_sql.txt 的 DDL 建表。
-- 2) 需先创建 HDOC_DOCUMENT_LIST 表（见 react_ud_sql.txt）。
-- 3) 文档类型下拉框数据来源：GET /api/UD03SelectHdocdocumentlistApi
--    （后端从 HDOC_DOCUMENT_LIST 表读取，DOCTYPE 映射为 code、DESCRIPTION 映射为 description）。
--
-- 【说明】
-- 数据库中可能已存在其他文档类型（如 123 / certificate / dimension_plate 等），
-- 本脚本仅追加/覆盖与规格书 No.8 一致的 3 笔标准数据，不影响现有数据。
-- 使用 INSERT ... ON DUPLICATE KEY UPDATE 保证脚本可重复执行。
-- ============================================================================

USE react_ud;

-- ----------------------------------------------------------------------------
-- HDOC_DOCUMENT_LIST：文档类型主数据
-- 规格书 No.8 期望的 3 笔标准数据（code/description 对应 DOCTYPE/DESCRIPTION）
-- ----------------------------------------------------------------------------
INSERT INTO `HDOC_DOCUMENT_LIST`
  (DOCTYPE, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('VIN_CERT', 'VIN Plate Certificate',      NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('HOMOLOG',  'Homologation Document',      NOW(), 'system', 'test', NOW(), 'system', 'test'),
  ('CONFORM',  'Certificate of Conformity',  NOW(), 'system', 'test', NOW(), 'system', 'test')
ON DUPLICATE KEY UPDATE
  DESCRIPTION = VALUES(DESCRIPTION),
  UPDATE_DATETIME = NOW(),
  UPDATE_USER = 'system',
  UPDATE_PROCESS = 'test';

-- ============================================================================
-- 补充说明
-- ----------------------------------------------------------------------------
-- 运行测试前：
--   1) 确保 react-ud 后端 (8081) 运行
--   2) 确保前端 dev server (3000) 运行
--   3) 执行本 SQL（mysql -u<user> -p react_ud < this_file.sql）
--
-- 画面访问：
--   Generate Homologation Document 画面路由为 /GenerateHomologationDocument，
--   画面无 session 守卫，可直接访问；文档类型接口无需有效登录即可返回数据。
-- ============================================================================
