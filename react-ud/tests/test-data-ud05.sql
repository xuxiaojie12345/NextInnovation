-- ============================================================
-- UD05 测试数据 - HDOC_VARIABLES + HDOC_ADCA_MODIFICATION
-- ============================================================

-- HDOC_VARIABLES
INSERT IGNORE INTO HDOC_VARIABLES (VARIABLE, DESCRIPTION) VALUES
('VAR001', 'Variable 1 Description'),
('VAR002', 'Variable 2 Description'),
('VAR003', 'Variable 3 Description'),
('VAR008', 'Chassis Info Variable'),
('VAR009', 'Navigation Test Variable'),
('VAR010', 'Market Display Variable'),
('VAR011', 'Template Link Variable'),
('VAR012', 'Template Click Variable'),
('VAR013', 'Header Display Variable'),
('VAR014_A', 'Data Row A'),
('VAR014_B', 'Data Row B'),
('VAR014_C', 'Data Row C'),
('VAR016_1', 'Column Display 1'),
('VAR016_2', 'Column Display 2'),
('VAR018', 'Save Jump Variable'),
('VAR019', 'UD07 Jump Variable'),
('VAR021', 'Title Display Variable'),
('VAR022', 'Button Display Variable'),
('VAR023', 'Initial State Variable'),
('VAR024', 'Responsive Layout Variable'),
('VAR025', 'DB Verify Var 1'),
('VAR026', 'DB Verify Var 2'),
('VAR027', 'Multi DB Var A'),
('VAR028', 'Multi DB Var B');

-- HDOC_ADCA_MODIFICATION
INSERT IGNORE INTO HDOC_ADCA_MODIFICATION
(SERIE, CHNO, DOCTYPE, LANG, VARIABLE, VERS, NEWVAL, STA, BU,
 REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
 UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
('S001', 'CH001', 'VIN_PLATE', 'EN', 'VAR001', 1, '初期値1', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S001', 'CH001', 'VIN_PLATE', 'EN', 'VAR002', 1, '初期値2', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S001', 'CH001', 'VIN_PLATE', 'EN', 'VAR003', 1, '初期値3', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S008', 'CH008', 'COC',      'EN', 'VAR008', 1, 'TEST_VAL_8',  0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S009', 'CH009', 'COC',      'EN', 'VAR009', 1, 'TEST_VAL_9',  0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S010', 'CH010', 'EEC',      'EN', 'VAR010', 1, 'TEST_VAL_10', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S011', 'CH011', 'VIN_PLATE','EN', 'VAR011', 1, 'TEST_VAL_11', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S012', 'CH012', 'VIN_PLATE','EN', 'VAR012', 1, 'TEST_VAL_12', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S013', 'CH013', 'COC',      'EN', 'VAR013', 1, 'TEST_VAL_13', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S014', 'CH014', 'COC',      'EN', 'VAR014_A', 1, 'VAL_A', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S014', 'CH014', 'COC',      'EN', 'VAR014_B', 1, 'VAL_B', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S014', 'CH014', 'COC',      'EN', 'VAR014_C', 1, 'VAL_C', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S016', 'CH016', 'VIN_PLATE','EN', 'VAR016_1', 1, 'VAL_1', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S016', 'CH016', 'VIN_PLATE','EN', 'VAR016_2', 1, 'VAL_2', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S018', 'CH018', 'COC',      'EN', 'VAR009', 1, '旧值', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S019', 'CH019', 'VIN_PLATE','EN', 'VAR019', 1, 'JUMP_VAL', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S021', 'CH021', 'COC',      'EN', 'VAR021', 1, 'TITLE_VAL', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S022', 'CH022', 'COC',      'EN', 'VAR022', 1, 'BTN_VAL', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S023', 'CH023', 'VIN_PLATE','EN', 'VAR023', 1, 'INIT_VAL', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S024', 'CH024', 'COC',      'EN', 'VAR024', 1, 'RESP_VAL', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S025', 'CH025', 'COC',      'EN', 'VAR025', 1, 'DB_VAL_1', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S025', 'CH025', 'COC',      'EN', 'VAR026', 1, 'DB_VAL_2', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S026', 'CH026', 'COC',      'EN', 'VAR027', 1, 'OLD_A', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test'),
('S026', 'CH026', 'COC',      'EN', 'VAR028', 1, 'OLD_B', 0, 'BU01', NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test');
