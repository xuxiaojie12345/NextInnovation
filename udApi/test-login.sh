# 登录功能测试脚本
# 使用前请确保：
# 1. MySQL数据库已启动
# 2. 已执行 src/main/resources/sql/user_table.sql 创建表和测试数据
# 3. Spring Boot应用已启动（端口8081）

echo "========================================="
echo "   登录功能测试脚本"
echo "========================================="
echo ""

# 测试1: 正确用户名和密码
echo "【测试1】正确的用户名和密码 (admin/123456)"
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
echo ""
echo ""

# 测试2: 错误的密码
echo "【测试2】错误的密码 (admin/wrong)"
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrong"}'
echo ""
echo ""

# 测试3: 不存在的用户
echo "【测试3】不存在的用户名 (nonexist/123456)"
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"nonexist","password":"123456"}'
echo ""
echo ""

# 测试4: 空用户名
echo "【测试4】空用户名"
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"","password":"123456"}'
echo ""
echo ""

# 测试5: 空密码
echo "【测试5】空密码"
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":""}'
echo ""
echo ""

# 测试6: 健康检查
echo "【测试6】健康检查接口"
curl -X GET http://localhost:8081/api/auth/health
echo ""
echo ""

echo "========================================="
echo "   测试完成"
echo "========================================="
