-- ============================================================================
-- Login 模块 测试数据 (Unit Test Data)
-- 对应测试式样书：react-ud/src/Login/Login_単体テスト仕様書.md
--
-- 【重要注意】
-- 1) 本数据针对后端代码实际查询的表 `hdoc_user_infor`（后端已由 user_info 改名而来）。
--    注：当前 react_ud_sql.txt 中的 DDL 仍为 `user_info`，需先将 DDL 改为 hdoc_user_infor
--    并新增 EMAIL 列（替换原 E-MMAIL 列）后，再执行本 INSERT。
--
-- 2) 密码为【明文】存储：后端已删除 MD5Util 加密逻辑，
--    数据库中的 PASSWORD 必须与前端输入明文一致。
--
-- 3) USERID 长度 <= 10，PASSWORD 长度 <= 32（与前端 maxLength 一致）。
-- ============================================================================

USE react_ud;

-- ------- 登录成功场景数据 -------
-- 普通用户（测试式样书 No.9 / No.11）
INSERT INTO `hdoc_user_infor`
  (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('john.doe', 'P@ssw0rd123', 'John Doe', 'John Doe', 'Engineer', 'john.doe@example.com',
   NOW(), 'system', 'test', NOW(), 'system', 'test');

-- 管理员用户（测试式样书 No.10）
INSERT INTO `hdoc_user_infor`
  (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('admin', 'Admin!@34', 'Administrator', 'Administrator', 'Manager', 'admin@example.com',
   NOW(), 'system', 'test', NOW(), 'system', 'test');

-- 普通用户（8位ID，用于长度/其他校验场景）
INSERT INTO `hdoc_user_infor`
  (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL,
   REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('jane2000', 'P@ssw0rd123', 'Jane Smith', 'Jane Smith', 'Technician', 'jane@example.com',
   NOW(), 'system', 'test', NOW(), 'system', 'test');

-- ------- 登录失败(密码/用户不存在)场景说明 -------
-- 不需要插入"错误密码"用户。错误密码场景直接用上面存在的用户 + 任意错误密码即可触发 401。
-- "用户不存在"场景直接使用一个不存在的 USERID（如 'unknown.user' / 'nonexist'）即可。

-- ------- 为常规登录 / 菜单授权准备的功能权限 (可选) -------
-- 若后续验证登录后跳转 Menu，需要在 hdoc_function_auth 为用户配置权限。
-- 示例（为 john.doe 授予 hdoc 权限，登录后可看到菜单项）：
INSERT INTO `react_ud`.`hdoc_function_auth`
  (USERID, `FUNCTION`, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
   UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
VALUES
  ('john.doe', 'hdoc', NOW(), 'system', 'test', NOW(), 'system', 'test');
