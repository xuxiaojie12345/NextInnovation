# 数据库连接测试脚本
# 用于验证 userInfo 表是否存在以及能否正常查询数据

echo "=== 数据库连接测试 ==="
mysql -h 172.17.0.63 -u root -p -e "
SHOW DATABASES LIKE 'react_ud';
USE react_ud;
SHOW TABLES LIKE 'userInfo';
SELECT COUNT(*) as total_users FROM userInfo;
SELECT userID, userName FROM userInfo LIMIT 5;
"

echo "=== 后端启动测试 ==="
echo "请先确保后端服务已启动，然后执行以下命令："
echo ""
echo "curl -X POST http://localhost:8081/api/auth/login \"
echo "  -H \"Content-Type: application/json\" \"
echo "  -d '{\"userID\":\"admin\",\"password\":\"admin123\"}'"
echo ""

echo "=== 预期响应 ==="
echo "成功响应："
echo "{"
echo "  \"code\": 200,"
echo "  \"data\": {"
echo "    \"userID\": \"admin\","
echo "    \"userName\": \"Administrator\","
echo "    \"token\": \"...\","
echo "    \"expiresIn\": 3600"
echo "  },"
echo "  \"message\": \"success\""
echo "}"
echo ""
echo "失败响应："
echo "{"
echo "  \"code\": 401,"
echo "  \"data\": null,"
echo "  \"message\": \"Invalid credentials\""
echo "}"
