# 登录模块 (Login Module) 内部设计说明书

| 文档编号     | INT-LOGIN-001         | 版本号     | v1.0       |
| :----------- | :-------------------- | :--------- | :--------- |
| **模块名称** | 用户登录 (User Login) | **作成日** | 2026-09-11 |
| **作成者**   | GitHub Copilot        | **状态**   | 正式稿     |

## 1. 概要

本模块是系统的入口页面，负责验证用户身份。用户输入 UserID 与 Password，经前端校验后调用后端
`AuthenticationApi` 进行认证，认证成功后跳转到主菜单（Menu）页面。

- **技术栈**：React 18 + React Hooks（useState / useEffect）
- **样式方案**：原生 CSS（`Login.css`）
- **路由**：`react-router-dom`（登录成功后跳转 `/menu`）
- **请求工具**：`axios`

## 2. 组件结构

```text
src/Login/
├── Login.jsx          # 登录页面组件（默认导出）
├── Login.css          # 登录页面样式（左右分栏 + 响应式）
├── api/
│   └── authApi.js     # AuthenticationApi 封装（axios 实例）
├── utils/
│   └── validators.js  # 可复用校验函数（空值 / 格式 / 长度）
└── fTRYDXFAD.jpeg     # 全屏背景图
```

## 3. 状态设计

| State       | 类型    | 初期值 | 说明                                             |
| :---------- | :------ | :----- | :----------------------------------------------- |
| `userID`    | string  | `""`   | UserID 输入值                                    |
| `password`  | string  | `""`   | Password 输入值                                  |
| `message`   | string  | `""`   | 错误消息，空字符串时 Message 区域不占位          |
| `isLoading` | boolean | `false`| 请求中标志，为 `true` 时 Login 按钮 `disabled`   |
| `showPwd`   | boolean | `false`| 密码明暗文切换标志（增强可用性）                 |

## 4. 处理流程

1. 用户点击 **Login** 按钮（或输入框中按回车键）触发 `handleSubmit`。
2. 获取 `userID` / `password` 并执行 `trim()` 去除首尾空格。
3. **空值校验**：任一为空则设置 `message = "Username and password are required."`，终止流程，不调用 API。
4. **格式校验**：UserID 必须为 10 位以内半角英数字；Password 为 32 位以内半角英数字或 ASCII 可见符号。
5. **API 调用**：调用 `AuthenticationApi(userID, password)`。
6. **结果处理**：
   - 成功（200）：保存 Token 到 `sessionStorage`，清空 Message，跳转 `/menu`。
   - 失败（401）：`We didn't recognize the username or password you entered. Please try again.`，并清空密码框。
   - 锁定（403）：`Your account is locked. Please contact your system administrator.`
   - 系统异常（500）：`System error. Please contact administrator.`
   - 网络异常：`Network error. Please check your connection.`

## 5. 接口定义

### 5.1 AuthenticationApi

| 项目     | 内容                     |
| :------- | :----------------------- |
| 功能     | 用户身份认证             |
| Method   | `POST`                   |
| Endpoint | `/api/auth/login`        |
| Request  | `{ userid, password }`   |

> 说明：当前工程未提供后端服务，`authApi.js` 中内置了 Mock 逻辑，
> 便于前端独立运行与联调；接入真实后端时仅需移除 Mock 分支即可。

## 6. 异常处理

| 异常场景         | 处理方式          | Message 显示内容                                                              |
| :--------------- | :---------------- | :---------------------------------------------------------------------------- |
| 用户ID或密码为空 | 前端校验拦截      | `Username and password are required.`                                         |
| 用户名或密码错误 | API 返回 401      | `We didn't recognize the username or password you entered. Please try again.` |
| 账户已锁定       | API 返回 403      | `Your account is locked. Please contact your system administrator.`           |
| 数据库连接失败   | 捕获异常返回 500  | `System error. Please contact administrator.`                                 |
| 网络断开 / 超时  | 捕获 Network Error| `Network error. Please check your connection.`                                |
| 输入非法字符     | 前端实时拦截      | 不允许输入非定义范围内的字符                                                  |

## 7. 实现注意事项

- 严禁在前端日志中打印明文密码。
- Message 文字颜色 `#ff4d4f`，内容为空时高度为 0（不占位）。
- 密码输入框 `type="password"`，显示为掩码（`•`）。
- 表单支持回车键提交。
- 响应式布局：窄屏时左右分栏切换为上下堆叠。

## 8. 修订履历

| 版本 | 修订日     | 修订内容 | 修订者         |
| :--- | :--------- | :------- | :------------- |
| v1.0 | 2026-09-11 | 初版作成 | GitHub Copilot |
