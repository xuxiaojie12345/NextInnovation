-- ============================================================
-- UD06 测试数据 - HDOC_ADCA_MODIFICATION
-- ============================================================

-- 用于 API 调用测试（No.23, No.29 等需要从 API 获取数据的用例）
INSERT IGNORE INTO HDOC_ADCA_MODIFICATION
(SERIE, CHNO, DOCTYPE, LANG, VARIABLE, VERS, NEWVAL, STA, BU,
 REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
 UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
('S023', 'CH023', 'COC', 'EN', 'VAR_APITEST', 1, 'API_TEST_VALUE', 0, 'BU01',
 NOW(), 'test', 'UD06Test', NOW(), 'test', 'UD06Test'),
('S029', 'CH029', 'EEC', 'EN', 'VAR_SQLTEST', 2, 'SQL_TEST_VALUE', 0, 'BU01',
 NOW(), 'test', 'UD06Test', NOW(), 'test', 'UD06Test');
