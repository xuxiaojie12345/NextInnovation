# 登录功能使用说明

## 📋 功能概述

实现了基于用户名和密码的用户登录功能，包含：
- ✅ 用户名密码验证
- ✅ 用户状态检查（启用/禁用）
- ✅ MD5密码加密
- ✅ Token生成
- ✅ 统一响应格式
- ✅ Swagger API文档

## 🗄️ 数据库准备

### 1. 执行SQL脚本

在MySQL数据库 `react_ud` 中执行以下SQL文件：
```
src/main/resources/sql/user_table.sql
```

该脚本会：
- 创建 `user` 表
- 插入2条测试数据

### 2. 测试账号

| 用户名 | 密码 | 说明 |
|--------|------|------|
| admin | 123456 | 管理员账号 |
| test | 123456 | 测试账号 |

## 🔌 API接口

### 1. 用户登录

**接口地址**: `POST http://localhost:8081/api/auth/login`

**请求头**:
```
Content-Type: application/json
```

**请求体**:
```json
{
  "username": "admin",
  "password": "123456"
}
```

**成功响应** (200):
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "userId": 1,
    "username": "admin",
    "realName": "管理员",
    "token": "a1b2c3d4e5f6..."
  }
}
```

**失败响应** (500):
```json
{
  "code": 500,
  "message": "用户名或密码错误",
  "data": null
}
```

### 2. 健康检查

**接口地址**: `GET http://localhost:8081/api/auth/health`

**响应**:
```json
{
  "code": 200,
  "message": "服务正常运行",
  "data": "服务正常运行"
}
```

## 📖 Swagger文档

启动项目后访问：
```
http://localhost:8081/swagger-ui/index.html
```

可以在Swagger界面中直接测试登录接口。

## 🧪 测试方法

### 方法1: 使用curl命令

```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

### 方法2: 使用Postman

1. 创建POST请求
2. URL: `http://localhost:8081/api/auth/login`
3. Body选择raw + JSON
4. 输入:
```json
{
  "username": "admin",
  "password": "123456"
}
```
5. 发送请求

### 方法3: 使用Swagger UI

1. 访问 `http://localhost:8081/swagger-ui/index.html`
2. 找到 "用户登录接口" -> "/api/auth/login"
3. 点击 "Try it out"
4. 输入用户名和密码
5. 点击 "Execute"

## 🔐 安全说明

### 当前实现
- 使用MD5加密存储密码
- 使用UUID生成简单Token

### 生产环境建议
1. **密码加密**: 建议使用BCrypt等更安全的加密算法
2. **Token机制**: 建议使用JWT (JSON Web Token)
3. **HTTPS**: 生产环境必须使用HTTPS传输
4. **限流**: 添加登录失败次数限制，防止暴力破解
5. **验证码**: 添加图形验证码或短信验证码
6. **日志审计**: 记录登录日志，包括IP、时间等信息

## 📝 代码结构

```
com.web.app
├── controller
│   └── LoginController.java          # 登录控制器
├── service
│   ├── UserService.java              # 用户服务接口
│   └── impl
│       └── UserServiceImpl.java      # 用户服务实现
├── mapper
│   └── UserMapper.java               # 用户Mapper接口
├── domain
│   ├── User.java                     # 用户实体
│   ├── LoginRequest.java             # 登录请求DTO
│   └── LoginResponse.java            # 登录响应DTO
└── tool
    └── Result.java                   # 统一响应结果类

resources
├── mapper
│   └── UserMapper.xml                # MyBatis映射文件
└── sql
    └── user_table.sql                # 数据库建表脚本
```

## ⚙️ 配置说明

登录功能使用的配置已在 `application-dev.yml` 中设置：
- 数据库连接: MySQL (172.17.0.63:3306/react_ud)
- MyBatis Mapper位置: classpath:mapper/*.xml
- 服务器端口: 8081

## 🚀 启动步骤

1. 确保MySQL数据库已启动
2. 执行 `user_table.sql` 创建表和测试数据
3. 运行Spring Boot应用
4. 访问Swagger文档或直接调用API

## ❓ 常见问题

### Q1: 提示"用户名或密码错误"
- 检查数据库中是否有对应用户
- 确认密码是否正确（测试密码为123456）
- 检查密码是否经过MD5加密存储

### Q2: 提示"账号已被禁用"
- 检查用户的status字段是否为1
- 执行SQL: `UPDATE user SET status = 1 WHERE username = 'xxx';`

### Q3: 无法连接数据库
- 检查 `application-dev.yml` 中的数据库配置
- 确认MySQL服务是否启动
- 确认网络连接是否正常
