# 前后端接口配置说明

## 📋 概述

本文档详细说明 NextInnovation 项目的前后端接口配置，确保前后端服务能够正确通信。

---

## 🔧 配置详情

### 1. 后端配置 (api-ud)

#### 1.1 服务端口
- **配置文件**: `application-dev.yml`
- **端口**: `8081`
- **访问地址**: `http://localhost:8081`

#### 1.2 API 路径
- **基础路径**: `/api/auth`
- **登录接口**: `POST /api/auth/login`

#### 1.3 CORS 配置
已在 `SimpleCORSFilter.java` 中配置跨域访问：
```java
response.setHeader("Access-Control-Allow-Origin", "*");
response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE, HEAD");
response.setHeader("Access-Control-Allow-Headers", "access-control-allow-origin, authority, content-type, version-info, X-Requested-With");
```

#### 1.4 数据库配置
- **数据库类型**: MySQL
- **连接地址**: `jdbc:mysql://172.17.0.63:3306/react_ud`
- **用户名**: `root`
- **密码**: `1234`
- **表名**: `userInfo`

---

### 2. 前端配置 (react-ud)

#### 2.1 服务端口
- **默认端口**: `3000`
- **访问地址**: `http://localhost:3000`

#### 2.2 代理配置
在 `package.json` 中配置了代理：
```json
{
  "proxy": "http://localhost:8081"
}
```

**作用**：将前端的 `/api` 请求自动代理到后端的 `http://localhost:8081/api`

#### 2.3 API 调用方式
- **HTTP 客户端**: Axios
- **配置文件**: `src/api/axiosConfig.ts`
- **认证 API**: `src/api/authApi.ts`

**示例**：
```typescript
import { login } from "../api/authApi";

const response = await login(userID, password);
```

实际请求流程：
```
前端 http://localhost:3000/api/auth/login
    ↓ (通过 proxy 代理)
后端 http://localhost:8081/api/auth/login
```

---

## 📡 接口定义

### 登录接口

#### 请求
- **URL**: `POST /api/auth/login`
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "userID": "string (最大10字符，半角英数字)",
  "password": "string (最大32字符)"
}
```

#### 响应成功 (200)
```json
{
  "code": 200,
  "data": {
    "userID": "admin",
    "userName": "Administrator",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  },
  "message": "success"
}
```

#### 响应失败 (401)
```json
{
  "code": 401,
  "data": null,
  "message": "Invalid credentials"
}
```

#### 响应失败 (400)
```json
{
  "code": 400,
  "data": null,
  "message": "UserID is required" // 或 "Password is required"
}
```

#### 响应失败 (500)
```json
{
  "code": 500,
  "data": null,
  "message": "Internal server error"
}
```

---

## ✅ 配置检查清单

### 后端检查
- [x] Spring Boot 应用启动正常
- [x] 端口配置为 8081
- [x] CORS 过滤器已配置
- [x] MyBatis Mapper 扫描路径正确
- [x] 数据库连接配置正确
- [x] userInfo 表已创建
- [x] AuthController 路径映射正确 (`/api/auth/login`)

### 前端检查
- [x] React 应用启动正常
- [x] package.json 中配置了 proxy
- [x] Axios 配置正确
- [x] API 调用路径正确 (`/api/auth/login`)
- [x] 错误处理完善

---

## 🚀 启动步骤

### 1. 准备数据库
```sql
-- 执行 SQL 脚本创建表和测试数据
source e:/UDWorkspace/NextInnovation/api-ud/src/main/resources/sql/user_info.sql
```

### 2. 启动后端服务
```bash
cd e:\UDWorkspace\NextInnovation\api-ud
mvn spring-boot:run
```

**验证**：访问 http://localhost:8081/swagger-ui/index.html 查看 Swagger 文档

### 3. 启动前端服务
```bash
cd e:\UDWorkspace\NextInnovation\react-ud
npm start
```

**验证**：访问 http://localhost:3000 查看登录页面

### 4. 测试登录
1. 打开浏览器访问 http://localhost:3000
2. 输入测试账号：
   - UserID: `admin`
   - Password: `admin123`
3. 点击 Login 按钮
4. 成功则跳转到 Menu 页面

---

## 🔍 常见问题排查

### 问题 1: 前端调用 API 返回 404
**原因**: 代理配置未生效  
**解决**: 
1. 确认 `package.json` 中有 `"proxy": "http://localhost:8081"`
2. 重启前端服务（修改 package.json 后必须重启）

### 问题 2: 后端返回 CORS 错误
**原因**: CORS 配置未生效  
**解决**: 
1. 确认 `SimpleCORSFilter.java` 已配置
2. 确认 `@CrossOrigin(origins = "*")` 注解在 Controller 上

### 问题 3: 数据库连接失败
**原因**: 数据库地址或凭据错误  
**解决**: 
1. 检查 `application-dev.yml` 中的数据库配置
2. 确认 MySQL 服务正在运行
3. 确认 `react_ud` 数据库已创建
4. 执行 `user_info.sql` 创建表和测试数据

### 问题 4: 登录失败，返回 401
**原因**: 用户名或密码错误  
**解决**: 
1. 检查数据库中是否有对应的用户记录
2. 确认输入的 UserID 和 Password 与数据库一致
3. 查看后端日志确认查询结果

### 问题 5: 前端无法导入 CSS 文件
**原因**: TypeScript 类型声明问题  
**解决**: 
这是正常的 TypeScript 警告，不影响运行。如需消除警告，可在 `react-app-env.d.ts` 中添加：
```typescript
declare module '*.css';
```

---

## 📝 注意事项

1. **端口占用**: 确保 8081 和 3000 端口未被其他程序占用
2. **数据库依赖**: 后端服务依赖 MySQL 数据库，必须先启动数据库
3. **代理重启**: 修改 `package.json` 的 proxy 配置后，必须重启前端服务
4. **Token 管理**: 登录成功后 Token 存储在 localStorage，注意安全性
5. **环境变量**: 生产环境应使用环境变量配置 API 地址，而非硬编码

---

## 🔗 相关文件

### 前端
- `react-ud/package.json` - Proxy 配置
- `react-ud/src/api/axiosConfig.ts` - Axios 配置
- `react-ud/src/api/authApi.ts` - 认证 API
- `react-ud/src/Login/Login.tsx` - 登录组件

### 后端
- `api-ud/src/main/resources/application-dev.yml` - 数据库和端口配置
- `api-ud/src/main/java/com/web/app/config/SimpleCORSFilter.java` - CORS 配置
- `api-ud/src/main/java/com/web/app/controller/AuthController.java` - 登录控制器
- `api-ud/src/main/java/com/web/app/mapper/UserMapper.java` - 用户 Mapper
- `api-ud/src/main/resources/mapper/UserMapper.xml` - SQL 映射
- `api-ud/src/main/resources/sql/user_info.sql` - 建表脚本

---

**更新日期**: 2026-05-14  
**版本**: v1.0
