-- ========================================
-- 登录功能 SQL 测试脚本
-- ========================================

-- 1. 验证表结构
DESC user_info;

-- 2. 查看所有用户数据
SELECT 
    id,
    USERID AS '用户ID',
    PASSWORD AS '密码',
    USERNAME AS '用户名',
    email AS '邮箱',
    CASE status 
        WHEN 1 THEN '启用'
        WHEN 0 THEN '禁用'
        ELSE '未知'
    END AS '状态'
FROM user_info;

-- 3. 测试登录查询 - admin用户
-- 这模拟了 UserMapper.findByUserId("admin", "admin123") 的执行
SELECT 
    USERID,
    PASSWORD,
    USERNAME
FROM user_info
WHERE USERID = 'admin'
AND PASSWORD = 'admin123';

-- 预期结果：应该返回1条记录

-- 4. 测试登录查询 - test001用户
SELECT 
    USERID,
    PASSWORD,
    USERNAME
FROM user_info
WHERE USERID = 'test001'
AND PASSWORD = 'test123';

-- 预期结果：应该返回1条记录

-- 5. 测试错误的密码
SELECT 
    USERID,
    PASSWORD,
    USERNAME
FROM user_info
WHERE USERID = 'admin'
AND PASSWORD = 'wrongpassword';

-- 预期结果：应该返回0条记录（空结果集）

-- 6. 测试不存在的用户
SELECT 
    USERID,
    PASSWORD,
    USERNAME
FROM user_info
WHERE USERID = 'nonexistent'
AND PASSWORD = 'somepassword';

-- 预期结果：应该返回0条记录（空结果集）

-- 7. 检查是否有重复的用户ID
SELECT 
    USERID,
    COUNT(*) AS '出现次数'
FROM user_info
GROUP BY USERID
HAVING COUNT(*) > 1;

-- 预期结果：应该返回空结果集（没有重复）

-- 8. 统计用户数量
SELECT 
    COUNT(*) AS '总用户数',
    SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS '启用用户数',
    SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) AS '禁用用户数'
FROM user_info;

-- 9. 性能测试 - 查看执行计划
EXPLAIN SELECT 
    USERID,
    PASSWORD,
    USERNAME
FROM user_info
WHERE USERID = 'admin'
AND PASSWORD = 'admin123';

-- 预期结果：应该使用 uk_userid 索引

-- ========================================
-- 清理测试数据（可选）
-- ========================================

-- 如果需要重置数据，可以执行以下语句：
-- DELETE FROM user_info;
-- 
-- INSERT INTO user_info (USERID, PASSWORD, USERNAME, email, status) VALUES
-- ('admin', 'admin123', '管理员', 'admin@example.com', 1),
-- ('test001', 'test123', '测试用户', 'test@example.com', 1);
