-- ====================================================================
-- Login 模块（AuthenticationApi）后台初始化脚本
-- 对应《Login_詳細設計.md》5.1 AuthenticationApi
-- 说明：本脚本仅包含登录认证所需的最小数据集，
--       若目标库已存在 hdoc_user_infor 表结构，可直接执行 INSERT 部分。
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. 用户信息表（若已存在可跳过）
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hdoc_user_infor (
    USERID           VARCHAR(10)  NOT NULL COMMENT 'USERID',
    PASSWORD         VARCHAR(100) NOT NULL COMMENT 'PASSWORD',
    USERNAME         VARCHAR(100) NOT NULL COMMENT 'USERNAME',
    RESPONSIBLE      VARCHAR(100) NOT NULL COMMENT 'RESPONSIBLE',
    USERPOSITION     VARCHAR(100) NOT NULL COMMENT 'USERPOSITION',
    `E-MMAIL`        VARCHAR(100) NOT NULL COMMENT 'E-MMAIL',
    REGISTER_DATETIME DATETIME    NOT NULL COMMENT 'REGISTER_DATETIME',
    REGISTER_USER    VARCHAR(16)  NOT NULL COMMENT 'REGISTER_USER',
    REGISTER_PROCESS VARCHAR(32)  NOT NULL COMMENT 'REGISTER_PROCESS',
    UPDATE_DATETIME  DATETIME     NOT NULL COMMENT 'UPDATE_DATETIME',
    UPDATE_USER      VARCHAR(16)  NOT NULL COMMENT 'UPDATE_USER',
    UPDATE_PROCESS   VARCHAR(32)  NOT NULL COMMENT 'UPDATE_PROCESS',
    PRIMARY KEY (USERID, PASSWORD, USERNAME)
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'ユーザー情報テーブル';

-- --------------------------------------------------------------------
-- 2. 测试数据
--    - admin   / Admin@123   -> 认证成功（200）
--    - locked01/ Admin@123   -> 账户锁定（403），密码字段以 LOCKED 前缀标记
--    - user01  / User01@123  -> 认证成功（200）
-- --------------------------------------------------------------------
INSERT INTO hdoc_user_infor
(USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, `E-MMAIL`,
 REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
 UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
('admin',    'Admin@123',  'Administrator', 'Zhang San', 'Manager', 'admin@tpi.example.com',
 NOW(), 'system', 'init', NOW(), 'system', 'init'),
('locked01', 'LOCKED_Admin@123', 'Locked User', 'Li Si', 'Engineer', 'locked01@tpi.example.com',
 NOW(), 'system', 'init', NOW(), 'system', 'init'),
('user01',   'User01@123', 'Normal User', 'Wang Wu', 'Engineer', 'user01@tpi.example.com',
 NOW(), 'system', 'init', NOW(), 'system', 'init');

-- --------------------------------------------------------------------
-- 3. 用户功能权限表（若已存在可跳过）
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS HDOC_FUNCTION_AUTH (
    USERID           VARCHAR(10)  NOT NULL COMMENT 'USERID',
    `FUNCTION`       VARCHAR(100) NOT NULL COMMENT 'FUNCTION',
    REGISTER_DATETIME DATETIME    NOT NULL COMMENT 'REGISTER_DATETIME',
    REGISTER_USER    VARCHAR(16)  NOT NULL COMMENT 'REGISTER_USER',
    REGISTER_PROCESS VARCHAR(32)  NOT NULL COMMENT 'REGISTER_PROCESS',
    UPDATE_DATETIME  DATETIME     NOT NULL COMMENT 'UPDATE_DATETIME',
    UPDATE_USER      VARCHAR(16)  NOT NULL COMMENT 'UPDATE_USER',
    UPDATE_PROCESS   VARCHAR(32)  NOT NULL COMMENT 'UPDATE_PROCESS',
    PRIMARY KEY (USERID, `FUNCTION`)
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'ユーザ機能権限テーブル';

INSERT INTO HDOC_FUNCTION_AUTH
(USERID, `FUNCTION`, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
 UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
('admin', 'UD01', NOW(), 'system', 'init', NOW(), 'system', 'init'),
('admin', 'UD12', NOW(), 'system', 'init', NOW(), 'system', 'init'),
('user01', 'UD12', NOW(), 'system', 'init', NOW(), 'system', 'init');

-- --------------------------------------------------------------------
-- 4. 用户市场权限表（若已存在可跳过）
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS HDOC_MARKET_AUTH (
    USERID           VARCHAR(10) NOT NULL COMMENT 'USERID',
    MARKET           VARCHAR(3)  NOT NULL COMMENT 'MARKET',
    `TYPE`           VARCHAR(10) NOT NULL COMMENT 'TYPE',
    BU               VARCHAR(6)  NOT NULL COMMENT 'BU',
    REGISTER_DATETIME DATETIME   NOT NULL COMMENT 'REGISTER_DATETIME',
    REGISTER_USER    VARCHAR(16) NOT NULL COMMENT 'REGISTER_USER',
    REGISTER_PROCESS VARCHAR(32) NOT NULL COMMENT 'REGISTER_PROCESS',
    UPDATE_DATETIME  DATETIME    NOT NULL COMMENT 'UPDATE_DATETIME',
    UPDATE_USER      VARCHAR(16) NOT NULL COMMENT 'UPDATE_USER',
    UPDATE_PROCESS   VARCHAR(32) NOT NULL COMMENT 'UPDATE_PROCESS',
    PRIMARY KEY (USERID, MARKET, `TYPE`, BU)
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'ユーザmarket権限テーブル';

INSERT INTO HDOC_MARKET_AUTH
(USERID, MARKET, `TYPE`, BU, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
 UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
('admin', 'GLO', 'ADMIN', 'TPI', NOW(), 'system', 'init', NOW(), 'system', 'init'),
('user01', 'JP', 'USER', 'TPI', NOW(), 'system', 'init', NOW(), 'system', 'init');
