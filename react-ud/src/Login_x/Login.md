# EDB Engineering Database 登录功能详细设计书

## 1. 背景 (Background)

### 1.1 画面概述

本页面为 **EDB Engineering Database** 系统的统一登录入口。画面采用全屏背景图片（具体资源待定），布局上严格分为左右两栏，各占屏幕宽度的 50%。整体风格简洁、现代，左侧用于品牌展示与信息告知，右侧用于用户交互与登录操作。

### 1.2 界面布局详解

#### 1.2.1 左侧区域：信息展示区

- **布局位置**：屏幕左半部分 (`flex: 1`)。
- **背景样式**：透明（无底色），直接透出底层背景图。
- **文字样式**：所有文字均为**白色** (`#FFFFFF`)，以确保在深色或复杂背景图上的可读性。
- **对齐方式**：内容在左侧区域内**垂直居中、水平居中**。
- **显示内容**：
  1.  **主标题**：`EDB Engineering Database`
      - 格式要求：**EDB** 部分加粗 (`font-weight: bold`)，其余部分正常。
  2.  **副标题**：`Use Outlook id and password`
  3.  **支持信息**：`Support, authorization request or improvement suggestions, send mail to: Support TPI`

#### 1.2.2 右侧区域：登录交互区

- **布局位置**：屏幕右半部分 (`flex: 1`)。
- **背景样式**：透明（无底色）。
- **表单布局**：
  - 表单容器在右侧区域内**垂直居中**。
  - 表单内部元素（输入框）**左对齐**起始。
  - [Login](file://e:\git20260511\NextInnovation\react-ud\src\Login_x\Login.tsx#L176-L181) 按钮在表单容器内**居中**显示。
  - **无表单标题**：不显示“Login”或“Sign In”等大标题，仅保留输入控件，减少视觉干扰。
- **静态提示信息**：
  - 位于登录表单下方。
  - 文字颜色：**红色** (`#DC3545` 或类似警示红)。
  - 对齐方式：**左对齐**。
  - 显示内容（固定文本）：
    1.  `If you get error message: "Your account is locked. Please contact your system administrator"`
    2.  `Please try this alternative login link before contacting support Login`
    3.  `We are working to find root cause of problem`

## 2. 参数定义 (Parameter Definition)

| 項目名                                                                                 | 種別      | 必須 | MaxLength |  I/O   | 合规文字          | 文字配置 | 初期値 | 表示制御 | 备注                             |
| :------------------------------------------------------------------------------------- | :-------- | :--: | :-------: | :----: | :---------------- | :------: | :----: | :------: | :------------------------------- |
| [UserID](file://e:\git20260511\NextInnovation\react-ud\src\Login_x\Login.tsx#L8-L8)    | textfield |  Y   |    10     | Input  | 半角英文数字      |    左    |   空   |   活性   | 对应 Outlook ID                  |
| [Password](file://e:\git20260511\NextInnovation\react-ud\src\Login_x\Login.tsx#L9-L9)  | textfield |  Y   |    32     | Input  | 半角英文数字+符号 |    左    |   空   |   活性   | 密码掩码显示 (`type="password"`) |
| `Message`                                                                              | label     |  -   |    256    | Output | -                 |    左    |   空   |    -     | 动态显示校验或认证错误信息       |
| [Login](file://e:\git20260511\NextInnovation\react-ud\src\Login_x\Login.tsx#L176-L181) | button    |  -   |     -     | Action | -                 |    中    |   -    |   活性   | 触发认证流程，加载时禁用         |

## 3. 业务逻辑与校验规则 (Business Logic & Validation)

### 3.1 前端校验 (Frontend Validation)

在用户点击 [Login](file://e:\git20260511\NextInnovation\react-ud\src\Login_x\Login.tsx#L176-L181) 按钮时，立即执行以下非空校验。若校验失败，**不调用 API**，并在 `Message` 标签中显示警告信息。

| 检查対象                                                                              | 检查内容                             | 错误信息 (Error Message)              | 错误类型 | UI 行为                                                                                                                    |
| :------------------------------------------------------------------------------------ | :----------------------------------- | :------------------------------------ | :------: | :------------------------------------------------------------------------------------------------------------------------- |
| [UserID](file://e:\git20260511\NextInnovation\react-ud\src\Login_x\Login.tsx#L8-L8)   | 值为空字符串 (`""`) 或仅包含空白字符 | `Username and password are required.` | Warning  | 聚焦到 [UserID](file://e:\git20260511\NextInnovation\react-ud\src\Login_x\Login.tsx#L8-L8) 输入框，显示黄色/橙色警告背景   |
| [Password](file://e:\git20260511\NextInnovation\react-ud\src\Login_x\Login.tsx#L9-L9) | 值为空字符串 (`""`) 或仅包含空白字符 | `Username and password are required.` | Warning  | 聚焦到 [Password](file://e:\git20260511\NextInnovation\react-ud\src\Login_x\Login.tsx#L9-L9) 输入框，显示黄色/橙色警告背景 |

_注：若两者均为空，优先校验 [UserID](file://e:\git20260511\NextInnovation\react-ud\src\Login_x\Login.tsx#L8-L8)。_

### 3.2 后端认证校验 (Backend Authentication)

当前端校验通过后，调用 `AuthenticationApi` 进行身份验证。

| 检查対象              | 检查内容                                       | 错误信息 (Error Message)                                                      | 错误类型 | UI 行为                                                                                                                                                                                                                      |
| :-------------------- | :--------------------------------------------- | :---------------------------------------------------------------------------- | :------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 用户存在性/密码正确性 | API 返回认证失败 (HTTP 401/403 或业务代码错误) | `We didn't recognize the username or password you entered. Please try again.` |  Error   | 显示红色错误背景，**清空 [Password](file://e:\git20260511\NextInnovation\react-ud\src\Login_x\Login.tsx#L9-L9) 字段**，保留 [UserID](file://e:\git20260511\NextInnovation\react-ud\src\Login_x\Login.tsx#L8-L8) 以便用户修改 |

### 3.3 异常处理

- **网络异常/服务器错误 (HTTP 5xx)**：
  - 消息：`System error. Please try again later.`
  - 类型：Error
- **账户锁定 (特定业务错误码)**：
  - 若 API 返回特定锁定错误码，前端可额外高亮显示静态提示中的第一句，或弹出模态框引导联系管理员。

## 4. 接口设计 (API Specification)

### 4.1 认证接口 (AuthenticationApi)

- **接口名称**: `authenticate`
- **请求方法**: `POST`
- **Content-Type**: `application/json`

#### 请求参数 (Request Body)

```json
{
  "userId": "string", // 映射自 [UserID](file://e:\git20260511\NextInnovation\react-ud\src\Login_x\Login.tsx#L8-L8)，Max 10
  "password": "string" // 映射自 [Password](file://e:\git20260511\NextInnovation\react-ud\src\Login_x\Login.tsx#L9-L9)，Max 32
}
```

#### 响应定义 (Response)

**成功 (Success):**

- **Status Code**: 200 OK
- **Body**:
  ```json
  {
    "token": "eyJhbGciOi...",
    "expiresIn": 3600,
    "userInfo": { ... }
  }
  ```
- **动作**: 保存 Token 至 LocalStorage/SessionStorage/Cookie，跳转至系统主页。

**失败 (Failure):**

- **Status Code**: 401 Unauthorized
- **Body**:
  ```json
  {
    "errorCode": "INVALID_CREDENTIALS",
    "message": "Invalid username or password"
  }
  ```
- **动作**: 显示动态 Error 消息。

## 5. 安全性与非功能性需求 (Security & NFR)

1.  **数据传输安全**：必须使用 HTTPS 协议传输登录凭据。
2.  **密码保护**：
    - 前端输入框使用 `type="password"` 掩码显示。
    - 认证成功后，前端内存中不应明文存储密码。
    - 认证失败后，前端应清空密码输入框，防止残留。
3.  **防暴力破解**：
    - 后端应实施速率限制 (Rate Limiting)。
    - 连续多次失败后，后端应返回账户锁定状态。
4.  **用户体验 (UX)**：
    - **加载状态**：点击登录后，按钮变为禁用状态并显示 "Logging in..."，防止重复提交。
    - **即时反馈**：用户开始重新输入时，自动清除之前的错误/警告消息，减少视觉噪音。
    - **焦点管理**：校验失败时，自动聚焦到第一个错误的输入框，方便用户修正。
    - **无障碍访问**：确保输入框有适当的 `aria-label` 或关联的 [label](file://e:\git20260511\NextInnovation\react-ud\src\Menu\Menu.tsx#L4-L4)（即使视觉上隐藏），以便屏幕阅读器识别。

## 6. 附录：UI 交互流程图 (Pseudo-Flow)

1.  **Start**: 用户访问登录页。
2.  **Input**: 用户输入 [UserID](file://e:\git20260511\NextInnovation\react-ud\src\Login_x\Login.tsx#L8-L8) 和 [Password](file://e:\git20260511\NextInnovation\react-ud\src\Login_x\Login.tsx#L9-L9)。
3.  **Click**: 用户点击 [Login](file://e:\git20260511\NextInnovation\react-ud\src\Login_x\Login.tsx#L176-L181)。
4.  **Validate Frontend**:
    - If [UserID](file://e:\git20260511\NextInnovation\react-ud\src\Login_x\Login.tsx#L8-L8) is Empty -> Show Warning "Username and password are required." -> End.
    - If [Password](file://e:\git20260511\NextInnovation\react-ud\src\Login_x\Login.tsx#L9-L9) is Empty -> Show Warning "Username and password are required." -> End.
5.  **Call API**: Send POST to `AuthenticationApi`.
6.  **Wait**: Show Loading State (Disable Button).
7.  **Receive Response**:
    - If Success -> Save Token -> Redirect to Dashboard.
    - If Fail (Invalid Creds) -> Show Error "We didn't recognize..." -> Clear Password Field -> Enable Button.
    - If Fail (Network/System) -> Show Error "System error..." -> Enable Button.
8.  **End**.
