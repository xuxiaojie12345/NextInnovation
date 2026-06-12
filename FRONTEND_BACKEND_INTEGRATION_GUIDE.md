# 前后端连接指南

## 概述
本文档说明如何将前端（react-ud）与后端（api-ud）进行连接和集成。

## 架构说明

```
┌─────────────────┐         HTTP/API         ┌──────────────────┐
│   React Frontend │  ◄────────────────────►  │  Spring Boot     │
│   (Port 3000)    │                          │  Backend         │
│                  │                          │  (Port 8080)     │
└─────────────────┘                          └──────────────────┘
```

## 1. 后端配置（已完成）

### 1.1 CORS 跨域配置
后端已配置 `SimpleCORSFilter.java`，允许前端跨域访问：
- 允许的源：`*`（所有源）
- 允许的方法：POST, GET, OPTIONS, DELETE, HEAD
- 允许的头部：access-control-allow-origin, authority, content-type, version-info, X-Requested-With

### 1.2 API 端点
所有 API 端点都以 `/api/` 为前缀，例如：
- 登录：`POST http://localhost:8080/api/AuthenticationApi/login`
- 文档类型查询：`POST http://localhost:8080/api/UD03SelectHdocdocumentlistApi/types`

## 2. 前端配置

### 2.1 API 服务层
已创建 `src/services/api.ts`，包含所有 API 调用封装：

```typescript
// 使用示例
import { authApi, documentApi } from '../services/api';

// 登录
const result = await authApi.login('userid', 'password');

// 获取文档类型
const docTypes = await documentApi.getDocumentTypes();
```

### 2.2 环境配置
创建了以下环境配置文件：

**开发环境** (`.env.development`):
```bash
REACT_APP_API_BASE_URL=http://localhost:8080
```

**生产环境** (`.env.production`):
```bash
REACT_APP_API_BASE_URL=https://your-production-api-domain.com
```

### 2.3 用户认证
创建了 `src/contexts/AuthContext.tsx` 用于管理用户认证状态：
- 登录后保存用户信息到 localStorage
- 提供 `useAuth()` Hook 在组件中使用认证状态
- 自动从 localStorage 恢复用户会话

## 3. 启动步骤

### 3.1 启动后端
```bash
cd api-ud
./mvnw clean install
./mvnw spring-boot:run
```

后端将在 `http://localhost:8080` 启动

### 3.2 启动前端
```bash
cd react-ud
npm install
npm start
```

前端将在 `http://localhost:3000` 启动

### 3.3 访问 Swagger 文档
启动后端后，访问：`http://localhost:8080/swagger-ui/index.html`

## 4. API 调用示例

### 4.1 用户登录
```typescript
import { authApi } from '../services/api';

const handleLogin = async () => {
  try {
    const result = await authApi.login('admin', '123456');
    
    if (result.code === 200) {
      // 登录成功
      console.log('User:', result.data);
      localStorage.setItem('currentUser', JSON.stringify(result.data));
    } else {
      // 登录失败
      console.error(result.msg);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

### 4.2 获取文档类型列表
```typescript
import { documentApi } from '../services/api';

const loadDocumentTypes = async () => {
  try {
    const response = await documentApi.getDocumentTypes();
    if (response.code === 200) {
      console.log('Document Types:', response.data.documentTypes);
    }
  } catch (error) {
    console.error('Failed to load document types:', error);
  }
};
```

### 4.3 查询用户信息
```typescript
import { userApi } from '../services/api';

const loadUserInfo = async (userid: string) => {
  try {
    const response = await userApi.getUserInfo(userid);
    if (response.code === 200) {
      console.log('User Info:', response.data);
    }
  } catch (error) {
    console.error('Failed to load user info:', error);
  }
};
```

### 4.4 VIN Plate 操作
```typescript
import { vinPlateApi } from '../services/api';

// 查看信息
const viewVinPlate = async (chassisNumber: string) => {
  const response = await vinPlateApi.viewInfo(chassisNumber);
  console.log('VIN Plate Info:', response.data);
};

// 设置为完成
const setVinPlateOk = async (chassisNumber: string) => {
  const response = await vinPlateApi.setOk(chassisNumber);
  console.log('Result:', response.msg);
};
```

## 5. 已集成的功能模块

### 5.1 认证模块
- ✅ 用户登录 (`/api/AuthenticationApi/login`)
- ✅ 会话管理（localStorage）

### 5.2 文档管理
- ✅ 文档类型查询 (`/api/UD03SelectHdocdocumentlistApi/types`)
- ✅ 文档列表获取 (`/api/UD20MarketDocumentSettingsApi/document-list`)

### 5.3 用户管理
- ✅ 用户信息查询 (`/api/UD17HDocUserAdministrationApi/UD17Userinfo`)
- ✅ 用户角色更新 (`/api/UD17HDocUserAdministrationApi/UD17UpdateRole`)
- ✅ 用户角色删除 (`/api/UD17HDocUserAdministrationApi/UD17DeleteRole`)

### 5.4 HDoc 变量管理
- ✅ 变量搜索 (`/api/UD11HdocvariablesApi/UD11Search`)
- ✅ 变量新增 (`/api/UD10HdocvariablesApi/UD10Add`)
- ✅ 变量更新 (`/api/UD10HdocvariablesApi/UD10Update`)
- ✅ 变量删除 (`/api/UD10HdocvariablesApi/UD10Delete`)

### 5.5 ADCA 变更管理
- ✅ ADCA 查询 (`/api/UD16ADChangeApi/UD16SelectHdocAdcaChange`)
- ✅ ADCA 新增 (`/api/UD16ADChangeApi/UD16InsertHdocAdcaChange`)
- ✅ ADCA 删除 (`/api/UD16ADChangeApi/UD16UpdateHdocAdcaChange`)

### 5.6 VIN Plate 管理
- ✅ 查看信息 (`/api/UD15SelecthdocsenddatavinplateApi/UD15ViewInfo`)
- ✅ 重新生成 (`/api/UD15SelecthdocsenddatavinplateApi/UD15SetRegenerate`)
- ✅ 设置为完成 (`/api/UD15SelecthdocsenddatavinplateApi/UD15SetOK`)
- ✅ 更改为基本信息 (`/api/UD15SelecthdocsenddatavinplateApi/UD15ChangetoBasicInfo`)
- ✅ 更改为高级信息 (`/api/UD15SelecthdocsenddatavinplateApi/UD15ChangetoAdvancedInfo`)

## 6. 响应格式规范

所有 API 返回统一的响应格式：

```typescript
interface ApiResponse {
  code: number;      // 200: 成功, 其他: 失败
  msg: string;       // 响应消息
  data: any;         // 响应数据
}
```

### 成功响应示例
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

### 失败响应示例
```json
{
  "code": 401,
  "msg": "密码不正确",
  "data": null
}
```

## 7. 错误处理

前端已实现统一的错误处理：

```typescript
try {
  const result = await apiRequest('/api/some-endpoint', 'POST', data);
  
  if (result.code === 200) {
    // 处理成功
  } else {
    // 处理业务错误
    console.error(result.msg);
  }
} catch (error) {
  // 处理网络错误
  console.error('Network error:', error);
}
```

## 8. 安全注意事项

### 8.1 HTTPS
- 生产环境必须使用 HTTPS
- 修改 `.env.production` 中的 API URL 为 HTTPS 地址

### 8.2 Token 管理
- 当前使用 localStorage 存储用户信息
- 建议后续实现 JWT Token 机制
- Token 应设置过期时间

### 8.3 密码安全
- 当前后端使用明文密码比对（仅用于测试）
- 生产环境必须使用 BCrypt 等加密方式

## 9. 常见问题

### Q1: 前端调用 API 时出现 CORS 错误
**A**: 确保后端 `SimpleCORSFilter` 已正确配置并生效。检查浏览器控制台是否有 CORS 相关错误。

### Q2: 前端无法连接到后端
**A**: 
1. 确认后端已在 8080 端口启动
2. 检查 `.env.development` 中的 API URL 是否正确
3. 检查防火墙设置

### Q3: 登录后刷新页面需要重新登录
**A**: 这是正常行为。如需保持登录状态，可以：
1. 使用 AuthContext 的自动恢复功能（已实现）
2. 实现 Token 刷新机制

### Q4: API 返回 404 错误
**A**: 
1. 检查 API 路径是否正确
2. 确认后端 Controller 的 `@RequestMapping` 路径
3. 查看 Swagger 文档确认可用的端点

## 10. 下一步工作

### 10.1 待完善功能
- [ ] 实现更多页面的 API 调用
- [ ] 添加加载状态和错误提示 UI
- [ ] 实现权限控制（根据用户权限显示/隐藏菜单项）
- [ ] 添加请求拦截器和响应拦截器
- [ ] 实现 Token 自动刷新机制

### 10.2 性能优化
- [ ] 添加 API 请求缓存
- [ ] 实现请求防抖和节流
- [ ] 添加请求重试机制

### 10.3 测试
- [ ] 编写 API 服务的单元测试
- [ ] 进行端到端测试
- [ ] 压力测试和性能测试

## 11. 联系方式

如有问题，请联系开发团队或查看项目文档。

---

**最后更新时间**: 2026-06-12
