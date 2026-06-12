# 系统架构说明

## 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户浏览器                                 │
│                     (http://localhost:3000)                      │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ HTTP Requests
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                    React Frontend (react-ud)                     │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   Login      │    │    Menu      │    │   Other Pages    │  │
│  │   Component  │    │   Component  │    │   Components     │  │
│  └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘  │
│         │                   │                      │            │
│         └───────────────────┼──────────────────────┘            │
│                             │                                   │
│                    ┌────────▼────────┐                          │
│                    │  API Service    │                          │
│                    │  Layer          │                          │
│                    │  (api.ts)       │                          │
│                    └────────┬────────┘                          │
│                             │                                   │
│                    ┌────────▼────────┐                          │
│                    │ Auth Context    │                          │
│                    │ (User Session)  │                          │
│                    └────────┬────────┘                          │
└─────────────────────────────┼──────────────────────────────────┘
                              │
                              │ Fetch API (JSON)
                              │ CORS Enabled
                              │
┌─────────────────────────────▼──────────────────────────────────┐
│                 Spring Boot Backend (api-ud)                    │
│                  (http://localhost:8080)                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              SimpleCORSFilter (跨域配置)                   │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │                   Controllers (14个)                      │  │
│  │  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐  │  │
│  │  │AuthController│ │UserController│ │DocumentController│  │  │
│  │  └─────────────┘ └──────────────┘ └──────────────────┘  │  │
│  │  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐  │  │
│  │  │VariablesCtrl│ │ADCACtrl      │ │VinPlateCtrl      │  │  │
│  │  └─────────────┘ └──────────────┘ └──────────────────┘  │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │                   Services (2个)                          │  │
│  │  ┌──────────────┐ ┌──────────────────────────────────┐  │  │
│  │  │LoginService  │ │Other Business Services           │  │  │
│  │  └──────────────┘ └──────────────────────────────────┘  │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │                MyBatis Mappers (11个)                     │  │
│  │  ┌────────────┐ ┌─────────────┐ ┌────────────────────┐  │  │
│  │  │UserMapper  │ │DocMapper    │ │VariablesMapper     │  │  │
│  │  └────────────┘ └─────────────┘ └────────────────────┘  │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │              XML Mapping Files (11个)                     │  │
│  │         (SQL Statements & Result Maps)                    │  │
│  └────────────────────┬─────────────────────────────────────┘  │
└───────────────────────┼────────────────────────────────────────┘
                        │
                        │ JDBC
                        │
┌───────────────────────▼────────────────────────────────────────┐
│                     MySQL Database                              │
│                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐   │
│  │hdoc_user_    │ │HDOC_DOCUMENT │ │HDOC_VARIABLES        │   │
│  │infor         │ │_LIST         │ │                      │   │
│  └──────────────┘ └──────────────┘ └──────────────────────┘   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐   │
│  │HDOC_USER_    │ │HDOC_ADCA_    │ │HDOC_SEND_DATA_VIN_   │   │
│  │DEFINED_RULES │ │CHANGE        │ │PLATE                 │   │
│  └──────────────┘ └──────────────┘ └──────────────────────┘   │
│  ┌──────────────┐ ┌──────────────┐                            │
│  │PRODUCT_CLASS │ │MARKET_MASTER │                            │
│  │_MASTER       │ │              │                            │
│  └──────────────┘ └──────────────┘                            │
└────────────────────────────────────────────────────────────────┘
```

## 数据流图

### 登录流程
```
用户输入               前端验证              API调用              后端处理              数据库
  │                     │                     │                     │                     │
  ├─ UserID/Password ──►│                     │                     │                     │
  │                     ├─ 空值校验           │                     │                     │
  │                     ├─ 格式校验           │                     │                     │
  │                     │                     │                     │                     │
  │                     ├─ POST /login ──────►│                     │                     │
  │                     │                     ├─ 查询用户 ─────────►│                     │
  │                     │                     │                     ├─ SELECT * FROM     │
  │                     │                     │                     │   hdoc_user_infor  │
  │                     │                     │                     │                     │
  │                     │                     │◄─ User Object ──────┤                     │
  │                     │                     │                     │                     │
  │                     │                     ├─ 验证密码           │                     │
  │                     │                     │                     │                     │
  │                     │◄─ Response JSON ────┤                     │                     │
  │                     │   {code: 200,       │                     │                     │
  │                     │    data: {...}}     │                     │                     │
  │                     │                     │                     │                     │
  │                     ├─ 保存到             │                     │                     │
  │                     │   localStorage      │                     │                     │
  │                     │                     │                     │                     │
  │◄─ 跳转到 Menu ──────┤                     │                     │                     │
  │                     │                     │                     │                     │
```

### API 调用流程
```
React Component
      │
      │ 1. 调用 API 函数
      ▼
src/services/api.ts
      │
      │ 2. 构建请求
      │    - URL
      │    - Method
      │    - Headers
      │    - Body
      ▼
Fetch API
      │
      │ 3. HTTP Request
      │    Content-Type: application/json
      ▼
Spring Boot Controller
      │
      │ 4. 接收请求
      │    @RequestBody
      ▼
Service Layer
      │
      │ 5. 业务逻辑处理
      ▼
MyBatis Mapper
      │
      │ 6. 执行 SQL
      ▼
MySQL Database
      │
      │ 7. 返回结果
      ▼
MyBatis Mapper
      │
      │ 8. 映射结果集
      ▼
Service Layer
      │
      │ 9. 封装响应
      ▼
Controller
      │
      │ 10. 返回 JSON
      │     CommonResponse
      ▼
Fetch API
      │
      │ 11. 解析响应
      ▼
api.ts
      │
      │ 12. 返回 Promise
      ▼
React Component
      │
      │ 13. 更新 UI
      ▼
```

## 关键组件说明

### 1. 前端 API 服务层 (`src/services/api.ts`)

**职责**:
- 封装所有后端 API 调用
- 统一错误处理
- 提供类型安全的接口

**结构**:
```typescript
export const authApi = {
  login: (userId, password) => apiRequest('/api/AuthenticationApi/login', 'POST', {...})
};

export const documentApi = {
  getDocumentTypes: () => apiRequest('/api/UD03SelectHdocdocumentlistApi/types', 'POST')
};

// ... 其他 API
```

### 2. 用户认证 Context (`src/contexts/AuthContext.tsx`)

**职责**:
- 管理用户会话状态
- 提供登录/登出功能
- 自动恢复用户会话

**使用方式**:
```typescript
const { user, login, logout, isAuthenticated } = useAuth();
```

### 3. 后端 CORS 配置 (`SimpleCORSFilter.java`)

**职责**:
- 允许跨域请求
- 设置允许的 HTTP 方法
- 设置允许的请求头

**配置**:
```java
response.setHeader("Access-Control-Allow-Origin", "*");
response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE, HEAD");
```

### 4. 统一响应格式 (`CommonResponse.java`)

**结构**:
```java
{
  "code": 200,        // 状态码
  "msg": "成功",      // 消息
  "data": {...}       // 数据
}
```

**静态方法**:
```java
CommonResponse.success(data);
CommonResponse.error(message);
```

## 通信协议

### HTTP 方法
- **GET**: 查询数据（如获取文档列表）
- **POST**: 创建/更新数据（如登录、新增变量）
- **PUT**: 更新数据（预留）
- **DELETE**: 删除数据（预留）

### 请求格式
```json
{
  "userId": "admin",
  "password": "123456"
}
```

### 响应格式
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "userid": "admin",
    "username": "Administrator"
  }
}
```

## 安全机制

### 当前实现
1. ✅ CORS 跨域控制
2. ✅ 前端输入验证
3. ✅ 后端参数校验
4. ⚠️ 明文密码（仅测试用）

### 建议增强
1. 🔒 HTTPS 加密传输
2. 🔒 BCrypt 密码加密
3. 🔒 JWT Token 认证
4. 🔒 CSRF 保护
5. 🔒 速率限制
6. 🔒 SQL 注入防护（MyBatis 已提供）

## 性能优化建议

### 前端
1. API 请求缓存
2. 请求防抖和节流
3. 懒加载组件
4. 代码分割

### 后端
1. 数据库连接池优化（Druid）
2. MyBatis 二级缓存
3. 异步处理
4. 分页查询

---

**架构版本**: 1.0.0  
**最后更新**: 2026-06-12
