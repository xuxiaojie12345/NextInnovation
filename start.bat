@echo off
echo ========================================
echo   NextInnovation 项目启动脚本
echo ========================================
echo.

echo [1/3] 检查数据库连接...
echo 请确保 MySQL 服务正在运行
echo 数据库: react_ud
echo 地址: 172.17.0.63:3306
echo.

echo [2/3] 启动后端服务 (api-ud)...
start "Backend API - Port 8081" cmd /k "cd /d e:\UDWorkspace\NextInnovation\api-ud && mvn spring-boot:run"
echo 后端服务启动中...
timeout /t 5 /nobreak >nul
echo.

echo [3/3] 启动前端服务 (react-ud)...
start "Frontend React - Port 3000" cmd /k "cd /d e:\UDWorkspace\NextInnovation\react-ud && npm start"
echo 前端服务启动中...
echo.

echo ========================================
echo   服务启动完成！
echo ========================================
echo.
echo 后端 API: http://localhost:8081
echo Swagger:  http://localhost:8081/swagger-ui/index.html
echo 前端页面: http://localhost:3000
echo.
echo 测试账号:
echo   UserID: admin
echo   Password: admin123
echo.
echo ========================================
pause
