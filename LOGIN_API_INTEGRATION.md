# Login API 前后端对接说明

## 1. 概述

本文档说明Login模块的前后端对接细节，包括API端点、请求参数、响应格式等。

## 2. API端点

### 2.1 用户登录接口

**端点**: `POST /api/authentication/login`

**描述**: 用户通过用户名和密码进行身份验证

**Content-Type**: `application/json`

## 3. 请求参数

### 3.1 请求体（Request Body）

```json
{
  "username": "string",    // 用户名（前端显示为UserID）
  "password": "string"     // 密码
}
```

### 3.2 参数说明

| 字段名 | 类型 | 必填 | 说明 | 前端对应字段 |
|--------|------|------|------|--------------|
| userid | string | 是 | 用户ID，最大长度50个字符 | userID |
| password | string | 是 | 密码，长度6-100个字符 | password |

### 3.3 前端参数映射

前端表单使用`userID`字段，在发送API请求时转换为后端期望的`userid`字段（小写）：

```typescript
// 前端代码
const response = await apiClient.post('/api/authentication/login', {
  userid: formData.userID,  // 将userID转换为userid（小写）
  password: formData.password
});
```

## 4. 响应格式

### 4.1 成功响应（200状态码）

```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "string",           // JWT访问令牌
    "userId": "string",          // 用户ID
    "username": "string",        // 用户名
    "role": "string",            // 用户角色（如：USER、ADMIN）
    "loginTime": "string"        // 登录时间（格式：yyyy-MM-dd HH:mm:ss）
  }
}
```

### 4.2 失败响应（500状态码）

```json
{
  "code": 500,
  "msg": "We didn't recognize the username or password you entered. Please try again.",
  "errorCode": "LOGIN_ERROR"
}
```

### 4.3 其他错误响应

#### 网络异常
```json
{
  "code": 500,
  "msg": "Network error. Please check your connection and try again."
}
```

#### 超时
```json
{
  "code": 500,
  "msg": "Request timeout. Please try again."
}
```

## 5. 前端实现

### 5.1 文件结构

```
react-ud/src/
├── Login/
│   ├── Login.tsx              # 登录组件
│   └── Login.css              # 登录样式
└── api/
    └── apiClient.ts           # Axios配置和拦截器
```

### 5.2 Axios配置（apiClient.ts）

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动添加token到请求头
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理401未授权错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/Login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 5.3 登录流程

1. **用户输入**：用户在LoginForm中输入UserID和Password
2. **前端校验**：
   - 检查是否为空
   - 检查字符格式（UserID只允许半角英数字，Password允许半角英数字+符号）
   - 实时过滤非法字符
3. **调用API**：使用apiClient.post()调用`/api/authentication/login`
4. **处理响应**：
   - 成功：保存token到localStorage，跳转到Menu页面
   - 失败：显示错误消息
5. **后续请求**：所有后续API请求自动携带token（通过请求拦截器）

### 5.4 关键代码片段

``typescript
// 调用登录API
const callAuthenticationApi = async (): Promise<void> => {
  try {
    setIsLoading(true);

    const response = await apiClient.post<LoginSuccessResponse>('/api/authentication/login', {
      username: formData.userID,  // 注意：后端期望username字段
      password: formData.password
    });

    if (response.data.code === 200) {
      // 保存token到localStorage
      localStorage.setItem('authToken', response.data.data.token);
      
      // 跳转到Menu页面
      navigate('/Menu', { 
        state: { 
          userID: response.data.data.userId,
          userName: response.data.data.username 
        } 
      });
    }
  } catch (error: any) {
    // 错误处理...
  } finally {
    setIsLoading(false);
  }
};
```

## 6. 后端实现

### 6.1 文件结构

```
api-ud/src/main/java/com/web/app/
├── controller/
│   └── AuthenticationController.java    # 认证控制器
├── service/
│   ├── AuthenticationService.java       # 认证服务接口
│   └── impl/
│       └── AuthenticationServiceImpl.java # 认证服务实现
├── mapper/
│   ├── UserMapper.java                  # 用户数据访问接口
│   └── UserMapper.xml                   # MyBatis映射文件
├── entity/
│   └── User.java                        # 用户实体类
├── dto/
│   ├── LoginRequest.java                # 登录请求DTO
│   ├── LoginResponse.java               # 登录响应DTO
│   └── ApiResponse.java                 # 统一响应对象
└── exception/
    ├── BusinessException.java           # 业务异常
    └── GlobalExceptionHandler.java      # 全局异常处理器
```

### 6.2 Controller层

```java
@RestController
@RequestMapping("/api/authentication")
public class AuthenticationController {
    
    @Autowired
    private AuthenticationService authenticationService;
    
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Validated @RequestBody LoginRequest loginRequest) {
        try {
            LoginResponse response = authenticationService.login(loginRequest);
            return ApiResponse.success("登录成功", response);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage(), "LOGIN_ERROR");
        }
    }
}
```

### 6.3 Service层

```java
@Service
public class AuthenticationServiceImpl implements AuthenticationService {
    
    @Autowired
    private UserMapper userMapper;
    
    @Override
    public LoginResponse login(LoginRequest loginRequest) {
        // 1. 参数校验
        if (loginRequest.getUserid() == null || loginRequest.getUserid().trim().isEmpty()) {
            throw new BusinessException("用户ID不能为空");
        }
        
        if (loginRequest.getPassword() == null || loginRequest.getPassword().trim().isEmpty()) {
            throw new BusinessException("密码不能为空");
        }
        
        // 2. 查询用户（根据userid查询）
        User user = userMapper.selectByUserId(loginRequest.getUserid());
        
        // 3. 验证密码
        if (!user.getPassword().equals(loginRequest.getPassword())) {
            throw new BusinessException("We didn't recognize the username or password you entered. Please try again.");
        }
        
        // 4. 检查用户状态
        if (user.getStatus() == 0) {
            throw new BusinessException("用户已被禁用");
        }
        
        // 5. 生成Token
        String token = generateToken(user.getUserId(), user.getUsername());
        
        // 6. 返回响应
        return new LoginResponse(token, user.getUserId(), user.getUsername(), "USER", loginTime);
    }
}
```

### 6.4 Mapper层

```xml
<!-- UserMapper.xml -->
<select id="selectByUsername" resultMap="BaseResultMap">
    SELECT USER_ID, USERNAME, PASSWORD, EMAIL, RESPONSIBLE, 
           USER_POSITION, CREATE_TIME, UPDATE_TIME, STATUS
    FROM HDOC_USER_INFOR
    WHERE USERNAME = #{username}
</select>
```

## 7. 数据库表结构

### 7.1 HDOC_USER_INFOR表

| 字段名 | 类型 | 说明 |
|--------|------|------|
| USER_ID | VARCHAR | 用户ID（主键） |
| USERNAME | VARCHAR | 用户名 |
| PASSWORD | VARCHAR | 密码（应加密存储） |
| EMAIL | VARCHAR | 邮箱 |
| RESPONSIBLE | VARCHAR | 负责人 |
| USER_POSITION | VARCHAR | 用户职位 |
| CREATE_TIME | TIMESTAMP | 创建时间 |
| UPDATE_TIME | TIMESTAMP | 更新时间 |
| STATUS | INTEGER | 状态（0:禁用 1:启用） |

## 8. 安全注意事项

### 8.1 密码处理
- ✅ 前端：Password字段使用`type="password"`进行掩码显示
- ✅ 传输：使用HTTPS加密协议
- ⚠️ 后端：当前实现使用明文密码比较，生产环境应使用BCrypt等加密算法

### 8.2 Token管理
- ✅ Token存储在localStorage中
- ✅ 每次请求自动携带token（通过请求拦截器）
- ✅ 401错误时清除token并跳转登录页
- ⚠️ 建议：生产环境使用HttpOnly Cookie存储token，防止XSS攻击

### 8.3 输入验证
- ✅ 前端：实时过滤非法字符
- ✅ 前端：空值检查和格式校验
- ✅ 后端：参数非空、长度、格式校验
- ✅ 后端：防止SQL注入（使用MyBatis参数化查询）

### 8.4 错误处理
- ✅ 统一的错误提示信息，不泄露具体失败原因
- ✅ 全局异常处理器捕获所有异常
- ✅ 开发环境记录详细日志，生产环境仅返回通用错误消息

## 9. 测试建议

### 9.1 功能测试
1. **正常登录**：输入正确的用户名和密码，验证能否成功登录并跳转
2. **错误密码**：输入错误的密码，验证是否显示统一错误消息
3. **空值校验**：不输入用户名或密码，验证是否显示"Username and password are required."
4. **格式校验**：输入非法字符，验证是否实时过滤
5. **用户禁用**：尝试登录已禁用的账户，验证是否显示相应错误消息

### 9.2 安全测试
1. **SQL注入**：尝试在用户名或密码中输入SQL注入语句，验证是否被阻止
2. **XSS攻击**：尝试在输入框中输入JavaScript代码，验证是否被过滤
3. **Token过期**：模拟token过期场景，验证是否正确跳转登录页
4. **暴力破解**：连续多次输入错误密码，验证是否有锁定机制（当前未实现）

### 9.3 性能测试
1. **并发登录**：模拟多个用户同时登录，验证系统性能
2. **响应时间**：测量登录接口的响应时间，确保在可接受范围内

## 10. 常见问题

### Q1: 为什么前端使用userID字段，而后端期望userid字段？
A: 这是为了保持前端UI的一致性（显示为UserID），同时在API层面使用小写的`userid`命名规范。在发送API请求时进行了字段映射转换。

### Q2: Token如何刷新？
A: 当前实现未包含token刷新机制。建议在token即将过期时（如过期前5分钟）自动调用刷新接口获取新token。

### Q3: 如何实现记住我功能？
A: 可以在登录成功后将token保存到sessionStorage（关闭浏览器后失效）或localStorage（长期有效），并提供"记住我"选项让用户选择。

### Q4: 如何处理多设备登录？
A: 当前实现允许多设备同时登录。如需限制单设备登录，需要在生成token时记录设备信息，并在每次请求时验证设备一致性。

## 11. 下一步工作

1. **完善密码加密**：使用BCrypt对密码进行加密存储和验证
2. **实现Token刷新机制**：添加refresh token接口
3. **添加登录日志**：记录用户登录时间、IP、设备信息等
4. **实现账户锁定**：连续多次登录失败后锁定账户
5. **添加验证码**：防止自动化攻击
6. **优化错误提示**：提供更友好的错误消息（但不泄露敏感信息）
