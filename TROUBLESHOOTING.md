# Login 画面错误排查指南

## ❌ 错误信息

```
Service unavailable. Please try again later.
```

---

## 🔍 问题分析

### 错误触发条件
在 [`Login.tsx`](e:\UDWorkspace\NextInnovation\react-ud\src\Login\Login.tsx) 中：

```typescript
catch (error: any) {
  if (error.response) {
    // 服务器返回了响应，但状态码不是 200 或 401
    if (error.response.status === 401) {
      // 认证失败
    } else {
      // ⚠️ 其他错误状态码（500, 503, 404 等）
      setMessage({
        text: "Service unavailable. Please try again later.",
        type: "error",
      });
    }
  } else if (error.request) {
    // 网络错误（请求发送了但没有收到响应）
    setMessage({
      text: "Connection timeout. Please check your network.",
      type: "error",
    });
  }
}
```

---

## 📋 可能原因及解决方案

### 原因 1：后端服务未启动 ⭐⭐⭐⭐⭐

**症状**：
- 前端无法连接到后端
- 浏览器控制台显示网络错误
- Network 标签中请求状态为 `(failed)` 或 `503`

**检查方法**：
```bash
# 检查后端服务是否运行
# 访问 http://localhost:8081/swagger-ui/index.html
```

**解决方案**：
```bash
cd e:\UDWorkspace\NextInnovation\api-ud
mvn spring-boot:run
```

**验证**：
看到以下日志表示启动成功：
```
Started Application in X.XXX seconds
Swagger的URL : http://localhost:8081/swagger-ui/index.html
```

---

### 原因 2：数据库连接失败 ⭐⭐⭐⭐

**症状**：
- 后端启动时报错
- 日志显示数据库连接异常
- 登录时返回 500 错误

**检查方法**：
查看后端启动日志：
```
Caused by: com.mysql.cj.jdbc.exceptions.CommunicationsException
```

**解决方案**：

1. **确认 MySQL 服务正在运行**
   ```bash
   # Windows
   services.msc  # 检查 MySQL 服务状态
   
   # 或使用命令
   net start | findstr MySQL
   ```

2. **检查数据库配置**
   文件：[`application-dev.yml`](e:\UDWorkspace\NextInnovation\api-ud\src\main\resources\application-dev.yml)
   ```yaml
   spring:
     datasource:
       url: jdbc:mysql://172.17.0.63:3306/react_ud
       username: root
       password: 1234
   ```

3. **确认数据库和表已创建**
   ```sql
   -- 连接数据库
   mysql -h 172.17.0.63 -u root -p
   
   -- 检查数据库是否存在
   SHOW DATABASES;
   
   -- 使用数据库
   USE react_ud;
   
   -- 检查表是否存在
   SHOW TABLES;
   
   -- 如果没有 userInfo 表，执行建表脚本
   source e:/UDWorkspace/NextInnovation/api-ud/src/main/resources/sql/user_info.sql
   ```

---

### 原因 3：端口被占用 ⭐⭐⭐

**症状**：
- 后端启动失败
- 日志显示 `Address already in use`

**解决方案**：

1. **检查端口占用**
   ```bash
   # Windows
   netstat -ano | findstr :8081
   ```

2. **结束占用端口的进程**
   ```bash
   # 假设 PID 是 12345
   taskkill /F /PID 12345
   ```

3. **或者修改端口**
   修改 `application-dev.yml`：
   ```yaml
   server:
     port: 8082  # 改为其他端口
   ```
   
   同时修改前端 `package.json`：
   ```json
   {
     "proxy": "http://localhost:8082"
   }
   ```

---

### 原因 4：Proxy 配置未生效 ⭐⭐⭐⭐

**症状**：
- 前端请求直接发送到 localhost:3000 而不是 8081
- Network 标签显示 404 错误

**检查方法**：

1. **确认 package.json 配置**
   ```json
   {
     "proxy": "http://localhost:8081"
   }
   ```

2. **重启前端服务**（修改 proxy 后必须重启）
   ```bash
   # 停止当前前端服务（Ctrl+C）
   # 然后重新启动
   npm start
   ```

3. **检查实际请求地址**
   - 打开浏览器开发者工具（F12）
   - 切换到 Network 标签
   - 点击 Login 按钮
   - 查看请求 URL 应该是：`http://localhost:3000/api/auth/login`

---

### 原因 5：CORS 跨域问题 ⭐⭐

**症状**：
- 浏览器控制台显示 CORS 错误
- Network 标签显示请求被阻止

**解决方案**：

后端已配置 CORS，检查以下文件：

1. **SimpleCORSFilter.java**
   ```java
   @Component
   public class SimpleCORSFilter implements Filter {
     public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) {
       HttpServletResponse response = (HttpServletResponse) res;
       response.setHeader("Access-Control-Allow-Origin", "*");
       // ...
     }
   }
   ```

2. **AuthController.java**
   ```java
   @CrossOrigin(origins = "*")
   @RestController
   @RequestMapping("/api/auth")
   public class AuthController { ... }
   ```

---

### 原因 6：编译错误导致后端未正常启动 ⭐⭐⭐⭐⭐

**症状**：
- 后端启动时立即报错退出
- 日志显示 `BeanCreationException` 或 `Unresolved compilation problem`

**最近修复的问题**：
- ✅ 已添加 `@CrossOrigin` 的 import 语句

**解决方案**：
```bash
cd e:\UDWorkspace\NextInnovation\api-ud
mvn clean compile
mvn spring-boot:run
```

---

## 🔧 完整排查步骤

### Step 1：检查后端服务状态

```bash
# 1. 访问 Swagger
http://localhost:8081/swagger-ui/index.html

# 2. 如果无法访问，检查后端是否在运行
# 查看任务管理器或终端输出
```

### Step 2：检查数据库

```sql
-- 1. 连接数据库
mysql -h 172.17.0.63 -u root -p

-- 2. 检查数据库
SHOW DATABASES LIKE 'react_ud';

-- 3. 检查表
USE react_ud;
SHOW TABLES LIKE 'userInfo';

-- 4. 检查测试数据
SELECT * FROM userInfo;
```

### Step 3：检查前端配置

```bash
# 1. 确认 proxy 配置
cat package.json | grep proxy

# 2. 重启前端服务
npm start
```

### Step 4：测试 API 调用

**方法 1：使用 Postman**
```
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
  "userID": "admin",
  "password": "admin123"
}
```

**方法 2：使用 curl**
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userID":"admin","password":"admin123"}'
```

**方法 3：使用浏览器控制台**
```javascript
// 在浏览器控制台（F12）执行
fetch('http://localhost:8081/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({userID: 'admin', password: 'admin123'})
})
.then(r => r.json())
.then(console.log);
```

### Step 5：查看详细错误信息

**前端**：
1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 查看红色错误信息
4. 切换到 Network 标签
5. 查看失败的请求详情

**后端**：
1. 查看后端终端输出
2. 查找 ERROR 或 Exception 关键字
3. 复制完整的堆栈跟踪信息

---

## 📊 快速诊断流程图

```
点击 Login 按钮报错
    ↓
检查浏览器 Network 标签
    ↓
请求状态是什么？
    ├─ (failed) → 后端服务未启动 → 启动后端服务
    ├─ 404 → Proxy 配置问题 → 检查 package.json 并重启前端
    ├─ 500 → 后端内部错误 → 查看后端日志
    ├─ 503 → 服务不可用 → 检查后端是否正常运行
    └─ 其他 → 查看详细错误信息
    ↓
检查后端日志
    ├─ 数据库连接错误 → 检查 MySQL 和数据库配置
    ├─ 编译错误 → mvn clean compile
    ├─ 端口占用 → 释放端口或修改配置
    └─ 其他错误 → 根据具体错误处理
```

---

## ✅ 验证清单

- [ ] 后端服务正在运行（访问 Swagger 确认）
- [ ] MySQL 数据库正在运行
- [ ] `react_ud` 数据库已创建
- [ ] `userInfo` 表已创建并有测试数据
- [ ] 前端 `package.json` 配置了 proxy
- [ ] 前端服务已重启（修改 proxy 后）
- [ ] 后端无编译错误
- [ ] 端口 8081 和 3000 未被占用
- [ ] 防火墙允许本地连接

---

## 🚀 一键启动脚本

使用项目根目录的 [`start.bat`](e:\UDWorkspace\NextInnovation\start.bat)：

```bash
# Windows
start.bat
```

该脚本会：
1. 提示检查数据库
2. 启动后端服务（新窗口）
3. 启动前端服务（新窗口）
4. 显示访问地址和测试账号

---

## 📝 常见错误速查

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| Service unavailable | 后端返回非 401 错误码 | 检查后端日志，通常是 500 错误 |
| Connection timeout | 网络不通，后端未响应 | 确认后端服务正在运行 |
| 404 Not Found | 路径错误或 proxy 未配置 | 检查 proxy 配置并重启前端 |
| 500 Internal Server Error | 后端代码异常 | 查看后端日志定位具体问题 |
| CORS error | 跨域配置问题 | 检查 @CrossOrigin 和 CORS Filter |

---

## 💡 建议

1. **先确保后端能独立运行**
   - 访问 Swagger 测试 API
   - 使用 Postman 测试登录接口

2. **再启动前端进行测试**
   - 确保 proxy 配置正确
   - 打开浏览器控制台监控请求

3. **遇到问题查看日志**
   - 前端：浏览器 Console 和 Network
   - 后端：终端输出的日志

---

**更新日期**: 2026-05-14  
**版本**: v1.0
