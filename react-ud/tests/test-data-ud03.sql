-- ============================================================
-- UD03 测试数据 - HDOC_DOCUMENT_LIST
-- ============================================================
INSERT INTO HDOC_DOCUMENT_LIST (DOCTYPE, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES 
('COC', 'Certificate of Conformity', NOW(), 'test', 'UD03Test', NOW(), 'test', 'UD03Test'),
('VCC', 'Vehicle Certification Code', NOW(), 'test', 'UD03Test', NOW(), 'test', 'UD03Test'),
('EEC', 'European Economic Community', NOW(), 'test', 'UD03Test', NOW(), 'test', 'UD03Test');
