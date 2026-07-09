-- ============================================================
-- UD08 测试数据 - Product Class Master / Market Master / HDOC_VARIABLES
-- ============================================================

-- PRODUCT_CLASS_MASTER
INSERT IGNORE INTO PRODUCT_CLASS_MASTER (PC, DESCRIPTION) VALUES
('PC01', 'Product Class 01 Description'),
('PC02', 'Product Class 02 Description');

-- MARKET_MASTER
INSERT IGNORE INTO MARKET_MASTER (MARKET, DESCRIPTION) VALUES
('DE', 'Germany'),
('CHN', 'China'),
('JPN', 'Japan');

-- HDOC_VARIABLES
INSERT IGNORE INTO HDOC_VARIABLES (VARIABLE, DESCRIPTION) VALUES
('VAR001', 'Test Variable 001'),
('VAR002', 'Test Variable 002');
