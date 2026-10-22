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
