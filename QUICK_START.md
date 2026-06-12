# 快速启动指南

## 一键启动前后端

### Windows 用户

#### 方法 1: 分别启动（推荐）

**终端 1 - 启动后端:**
```bash
cd e:\git20260511\NextInnovation\api-ud
mvnw.cmd spring-boot:run
```

**终端 2 - 启动前端:**
```bash
cd e:\git20260511\NextInnovation\react-ud
npm start
```

#### 方法 2: 使用批处理文件

创建 `start-all.bat`:
```batch
@echo off
echo Starting Backend...
start cmd /k "cd /d e:\git20260511\NextInnovation\api-ud && mvnw.cmd spring-boot:run"

timeout /t 10 /nobreak >nul

echo Starting Frontend...
start cmd /k "cd /d e:\git20260511\NextInnovation\react-ud && npm start"

echo Both services are starting...
echo Backend: http://localhost:8080
echo Frontend: http://localhost:3000
echo Swagger: http://localhost:8080/swagger-ui/index.html
```

### Mac/Linux 用户

创建 `start-all.sh`:
```bash
#!/bin/bash

echo "Starting Backend..."
cd e:/git20260511/NextInnovation/api-ud
./mvnw spring-boot:run &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 10

echo "Starting Frontend..."
cd e:/git20260511/NextInnovation/react-ud
npm start &
FRONTEND_PID=$!

echo "Both services are starting..."
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Backend: http://localhost:8080"
echo "Frontend: http://localhost:3000"
echo "Swagger: http://localhost:8080/swagger-ui/index.html"
```

## 访问地址

启动成功后，可以访问以下地址：

- **前端应用**: http://localhost:3000
- **后端 API**: http://localhost:8080
- **Swagger 文档**: http://localhost:8080/swagger-ui/index.html

## 测试登录

使用以下测试账号登录：
- **UserID**: admin
- **Password**: 123456

（注意：需要在数据库中创建对应的用户记录，或修改后端的登录验证逻辑）

## 停止服务

### Windows
- 在命令行窗口按 `Ctrl + C` 停止服务
- 或关闭命令行窗口

### Mac/Linux
```bash
# 查找并停止 Java 进程
kill $(ps aux | grep 'spring-boot' | awk '{print $2}')

# 查找并停止 Node 进程
kill $(ps aux | grep 'react-scripts' | awk '{print $2}')
```

## 常见问题

### 1. 端口被占用

**后端 8080 端口被占用:**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8080
kill -9 <PID>
```

**前端 3000 端口被占用:**
```bash
# 修改 react-ud/package.json 中的 start 脚本
"start": "PORT=3001 react-scripts start"
```

### 2. Maven 依赖下载失败

```bash
cd api-ud
mvnw.cmd clean install -U
```

### 3. npm 安装失败

```bash
cd react-ud
# 清除缓存
npm cache clean --force
# 重新安装
npm install
```

### 4. 数据库连接失败

检查 `api-ud/src/main/resources/application-dev.yml` 中的数据库配置：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/your_database
    username: your_username
    password: your_password
```

## 开发提示

### 热重载
- **后端**: 使用 `spring-boot-devtools`，修改代码后自动重启
- **前端**: React 开发服务器支持热模块替换（HMR）

### 调试
- **后端**: 在 IDE 中设置断点，以 Debug 模式启动
- **前端**: 使用浏览器开发者工具，React DevTools

### 日志查看
- **后端日志**: 控制台输出 + `api-ud/logs/` 目录
- **前端日志**: 浏览器控制台（F12）

## 环境变量

前端支持以下环境变量：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| REACT_APP_API_BASE_URL | 后端 API 地址 | http://localhost:8080 |

修改 `.env.development` 或 `.env.production` 文件来配置。

---

**祝开发愉快！** 🚀
