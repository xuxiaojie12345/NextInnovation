# FastAPI 后端项目

## 启动步骤

### 1. 创建虚拟环境
```bash
python -m venv venv
venv\Scripts\activate
```

### 2. 安装依赖
```bash
pip install -r requirements.txt
```

### 3. 修改 .env 中的数据库密码

### 4. 启动服务
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. 访问接口文档
http://127.0.0.1:8000/docs

### 登录接口
`POST /api/login/login`，请求体为 `{"userId":"用户ID","password":"密码"}`。
前端开发服务器默认使用 `http://localhost:3000`，后端已允许 `localhost` 和 `127.0.0.1` 两种来源跨域访问。

### 人员接口
- `GET /api/personnel/list?year=2026`：获取该年度的人员列表。
- `POST /api/personnel/save?year=2026`：新增或更新单个人员，JSON 字段为 `employeeNo`、`departmentId`、`name`、`role`、`leavePlan`。
- `POST /api/personnel/import?year=2026`：批量保存人员数组。
- `DELETE /api/personnel/delete?year=2026&employeeNo=10001`：删除该年度的人员记录。
