# Login模块说明文档

## 概述

Login模块提供用户登录认证功能，通过输入UserID和Password进行身份验证，认证成功后迁移到系统主菜单页面。

## 技术栈

- **React**: 18.x
- **TypeScript**: 4.x
- **react-router-dom**: 路由跳转
- **axios**: HTTP请求
- **原生CSS**: 样式方案

## 功能特性

### 1. 表单输入
- **UserID输入框**
  - 最大长度：10字符
  - 允许字符：半角英数字（a-z, A-Z, 0-9）
  - 实时字符过滤
  
- **Password输入框**
  - 最大长度：32字符
  - 允许字符：半角英数字+符号
  - 掩码显示（•）
  - 实时字符过滤

### 2. 前端校验
- 空值校验
- 字符格式校验
- 统一错误提示

### 3. API调用
- Endpoint: `POST /api/authentication`
- Content-Type: `application/json`
- 请求参数：`{ userID: string, password: string }`

### 4. 错误处理
- 网络异常
- API超时
- 认证失败（401）
- 系统错误

### 5. 页面跳转
- 成功后跳转到Menu页面
- 传递参数：`{ userID, userName }`

### 6. 固定文言
- EDB Engineering Database（Logo）
- Use Outlook id and password
- Support联系信息
- 账户锁定警告

### 7. 背景图
- 使用fTRYDXFAD.jpeg作为页面背景
- 覆盖整个屏幕
- 响应式适配

## 使用方法

### 1. 引入组件

```tsx
import Login from './Login/Login';

function App() {
  return (
    <Routes>
      <Route path="/Login" element={<Login />} />
      <Route path="/Menu" element={<Menu />} />
    </Routes>
  );
}
```

### 2. 路由配置

在App.tsx中配置路由：

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login/Login';
import Menu from './Menu/Menu';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Menu" element={<Menu />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## API接口

### AuthenticationApi

**功能**: 验证UserID和Password

**Method**: POST

**Endpoint**: `/api/authentication`

#### Request

```json
{
  "userID": "user123",
  "password": "pass@word1"
}
```

#### Response Success (200)

```json
{
  "code": 200,
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userInfo": {
    "userId": "user123",
    "userName": "Test User"
  }
}
```

#### Response Error (401)

```json
{
  "code": 401,
  "message": "Invalid credentials",
  "errorCode": "AUTH_FAILED"
}
```

## 错误消息

| 场景 | 消息内容 |
|------|---------|
| 空值 | Username and password are required. |
| 认证失败 | We didn't recognize the username or password you entered. Please try again. |
| 网络异常 | Network error. Please check your connection and try again. |
| API超时 | Request timeout. Please try again. |
| 系统错误 | System error. Please contact support. |

## 样式定制

### 修改颜色

在Login.css中修改颜色变量：

```css
/* 主色调 */
color: #003366; /* Volvo品牌色 */

/* 错误消息 */
background-color: #ffebee;
color: #c62828;

/* 固定文言 */
color: #666666;
```

### 修改背景图

在Login.css中修改背景图路径：

```css
.login-container {
  background-image: url('../your-background.jpeg');
}
```

### 修改响应式断点

在Login.css中修改媒体查询：

```css
/* 平板设备 */
@media (max-width: 768px) {
  /* ... */
}

/* 手机设备 */
@media (max-width: 480px) {
  /* ... */
}
```

## 安全性

- ✅ Password字段掩码处理
- ✅ HTTPS传输支持
- ✅ 不存储明文密码
- ✅ 统一错误提示（不区分用户名和密码错误）
- ✅ 字符过滤（防止注入攻击）

## 浏览器兼容性

- ✅ Chrome (所有版本)
- ✅ Firefox (所有版本)
- ✅ Safari (所有版本)
- ✅ Edge (所有版本)
- ✅ IE11+ (部分支持)

## 常见问题

### Q1: TypeScript报CSS导入错误？

A: 这是IDE的类型检查警告，不影响运行。已在react-app-env.d.ts中添加类型声明。

### Q2: 背景图不显示？

A: 检查以下项：
1. 文件路径是否正确：`../fTRYDXFAD.jpeg`
2. 文件是否存在于src目录
3. 文件名是否正确（区分大小写）

### Q3: API调用失败？

A: 检查以下项：
1. API endpoint是否正确
2. 后端服务是否启动
3. 网络连接是否正常
4. CORS配置是否正确

### Q4: 字符验证不起作用？

A: 检查以下项：
1. handleInputChange函数是否正确绑定
2. 正则表达式是否正确
3. maxLength属性是否设置

## 文件结构

```
Login/
├── Login.tsx           # 登录组件（320行）
├── Login.css           # 样式文件（265行）
├── 詳細設計UD01.md     # 内部设计文档
├── README.md           # 本文件
└── 代码生成总结.md      # 代码生成总结
```

## 更新日志

### v1.0 (2026-06-08)
- ✅ 初始版本发布
- ✅ 实现完整的登录功能
- ✅ 添加字符验证
- ✅ 添加背景图
- ✅ 添加4个固定文言情节
- ✅ 符合详细设计文档的所有要求

## 联系方式

如有问题或建议，请联系Support TPI。