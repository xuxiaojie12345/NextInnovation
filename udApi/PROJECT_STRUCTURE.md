# 登录功能 - 完整代码结构

## 📁 文件清单

### Java源代码 (8个文件)

```
src/main/java/com/web/app/
├── controller/
│   └── LoginController.java          ✅ REST API控制器
├── service/
│   ├── UserService.java              ✅ 业务接口
│   └── impl/
│       └── UserServiceImpl.java      ✅ 业务实现（含密码验证）
├── mapper/
│   └── UserMapper.java               ✅ MyBatis Mapper接口
├── domain/
│   ├── User.java                     ✅ 用户实体类
│   ├── LoginRequest.java             ✅ 登录请求DTO
│   └── LoginResponse.java            ✅ 登录响应DTO
└── tool/
    └── Result.java                   ✅ 统一响应封装类
```

### 资源配置 (2个文件)

```
src/main/resources/
├── mapper/
│   └── UserMapper.xml                ✅ MyBatis SQL映射
└── sql/
    └── user_table.sql                ✅ 数据库建表脚本
```

### 文档和测试 (2个文件)

```
根目录/
├── LOGIN_README.md                   ✅ 详细使用文档
└── test-login.sh                     ✅ 自动化测试脚本
```

### Maven配置更新

```
pom.xml                               ✅ 添加validation依赖
```

---

## 🔑 核心功能说明

### 1. 密码验证流程

```
用户输入密码 → MD5加密 → 与数据库比对 → 返回结果
```

**代码位置**: `UserServiceImpl.login()` 方法

```java
// 4. 验证密码（使用MD5加密比对）
String encryptedPassword = encryptPassword(password);
if (!encryptedPassword.equals(user.getPassword())) {
    throw new RuntimeException("用户名或密码错误");
}
```

### 2. 用户状态检查

```
查询用户 → 检查status字段 → 0=禁用, 1=启用
```

**代码位置**: `UserServiceImpl.login()` 方法

```java
// 3. 验证用户状态
if (user.getStatus() != null && user.getStatus() == 0) {
    throw new RuntimeException("账号已被禁用，请联系管理员");
}
```

### 3. Token生成

```
UUID随机生成 → 去除横杠 → 返回Token字符串
```

**代码位置**: `UserServiceImpl.generateToken()` 方法

```java
private String generateToken() {
    return UUID.randomUUID().toString().replace("-", "");
}
```

---

## 🗄️ 数据库表结构

### user表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| username | VARCHAR(50) | 用户名，唯一索引 |
| password | VARCHAR(100) | MD5加密后的密码 |
| real_name | VARCHAR(50) | 真实姓名 |
| email | VARCHAR(100) | 邮箱 |
| phone | VARCHAR(20) | 手机号，普通索引 |
| status | TINYINT | 状态：0-禁用，1-启用 |
| create_time | DATETIME | 创建时间 |
| update_time | DATETIME | 更新时间 |

---

## 🚀 快速启动步骤

### Step 1: 准备数据库

```bash
# 连接到MySQL
mysql -h 172.17.0.63 -u root -p

# 选择数据库
USE react_ud;

# 执行建表脚本
source src/main/resources/sql/user_table.sql;
```

### Step 2: 启动应用

```bash
# Maven方式
mvn spring-boot:run

# 或者打包后运行
mvn clean package
java -jar target/pay.jar
```

### Step 3: 测试登录

**方式1: 使用curl**
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

**方式2: 使用Postman**
- Method: POST
- URL: http://localhost:8081/api/auth/login
- Body (raw JSON):
```json
{
  "username": "admin",
  "password": "123456"
}
```

**方式3: 使用Swagger UI**
- 访问: http://localhost:8081/swagger-ui/index.html
- 找到 "用户登录接口"
- 点击 "Try it out"
- 输入用户名和密码
- 点击 "Execute"

---

## 📊 API响应示例

### 成功响应

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "userId": 1,
    "username": "admin",
    "realName": "管理员",
    "token": "a1b2c3d4e5f6g7h8i9j0..."
  }
}
```

### 失败响应

```json
{
  "code": 500,
  "message": "用户名或密码错误",
  "data": null
}
```

---

## 🔒 安全特性

✅ **已实现**:
- MD5密码加密存储
- 用户状态验证（启用/禁用）
- 参数非空验证
- 详细的日志记录

⚠️ **生产环境建议增强**:
- 使用BCrypt替代MD5
- 使用JWT替代UUID Token
- 添加登录失败次数限制
- 添加图形验证码
- 使用HTTPS传输
- 添加IP白名单
- 记录登录日志（IP、时间、设备）

---

## 🐛 故障排查

### 问题1: 无法连接数据库
**解决**: 检查 `application-dev.yml` 中的数据库配置

### 问题2: 提示"用户名或密码错误"
**解决**: 
- 确认数据库中已有测试数据
- 密码必须是MD5加密后的值
- 测试密码: 123456

### 问题3: Swagger无法访问
**解决**: 
- 确认应用已启动
- 访问: http://localhost:8081/swagger-ui/index.html
- 检查端口是否为8081

---

## 📝 后续扩展建议

1. **添加注册功能**: 创建 `/api/auth/register` 接口
2. **添加找回密码**: 通过邮箱或手机验证码重置密码
3. **Token刷新**: 实现Token自动续期机制
4. **权限控制**: 集成Spring Security或Shiro
5. **多因素认证**: 添加短信验证码、邮箱验证等
6. **第三方登录**: 集成微信、QQ、GitHub等OAuth2登录

---

## 📞 技术支持

如有问题，请查看：
- 详细文档: `LOGIN_README.md`
- 测试脚本: `test-login.sh`
- 应用日志: 根据 `log4j2-dev.xml` 配置查看
