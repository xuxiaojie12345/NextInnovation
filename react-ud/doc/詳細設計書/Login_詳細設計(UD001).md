# 登录模块 (Login Module) 详细设计说明书

| 文档编号     | DES-Login-001         | 版本号     | v1.0       |
| :----------- | :-------------------- | :--------- | :--------- |
| **模块名称** | Login                 | **作成日** | 2026-07-09 |
| **作成者**   | GitHub Copilot        | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块是系统的入口，负责实现登录身份校验，保障系统访问安全。用户通过输入 UserID 和 Password，按下 Login 按钮触发 ISAM 认证，完成用户身份的合法性验证。

- **目标**：实现系统登录的身份校验能力，确保只有持有系统合法账号的 HDOC 业务使用者能够进入系统。
- **安全性**：
  - UserID 仅允许半角英数字输入。
  - Password 允许半角英数字 + 符号输入。
  - 所有认证请求通过 ISAM AuthenticationApi 完成读取校验。
  - 不直接在前端存储或校验用户核心凭证信息。
- **用户体验**：输入错误时即时展示对应错误提示信息，引导用户修正输入内容。所有输入控件默认处于活性状态，支持常规操作逻辑。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| No. | 项目名 (Item) | 种类 (Type) | 必须 (Req) | MaxLength | I/O | 允许字符 (Allowed Chars) | 字符对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注 |
| :-: | :------------ | :---------- | :--------: | :-------: | :-: | :----------------------- | :--------------: | :--------------: | :----------------: | :--- |
|  1  | **UserID**    | TextField   |     Y      |    10     | Input | 半角英数字 (`a-z, A-Z, 0-9`) | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 自动去除首尾空格 |
|  2  | **Password**  | TextField   |     Y      |    32     | Input | 半角英数字 + 符号 (`!@#$%` 等可視記号) | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 输入时显示为掩码 (`•`) |
|  3  | **Message**   | Label       |     -      |    256    | Output | -                        | 左 (Left) | 空 (Empty) | 动态显示         | 仅在出错时显示 |
|  4  | **Login**     | Button      |     -      |     -     | Action | -                        | 中 (Center) | - | 活性 (Enabled) | 点击触发校验与 API 调用 |

> **注**：
>
> - **半角英数字**：正则表达式 `[a-zA-Z0-9]`
> - **記号**：指 ASCII 范围内的可见符号（如 `!@#$%^&*()_+-=[]{};':"\\|,.<>/?` 等）
> - **Password** 输入时使用 `type="password"` 实现掩码显示

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

所有校验逻辑均在用户点击 **Login** 按钮时按序执行。

### 3.1 处理流程

#### 3.1.1 初始表示

画面正常展示，UserID 输入框、Password 输入框、Login 按钮处于活性状态，Message 区域初始为空。

#### 3.1.2 触发条件：用户按下 Login 按钮

1. **前置处理**：获取 UserID 和 Password，执行 `trim()` 去除首尾空格。
2. **空值校验 (Frontend Check)**：
   - 若 `UserID` 为空白：
     - 设置 `Message` = `Username and password are required.`
     - **终止流程**，不调用 API。
   - 若 `Password` 为空白：
     - 设置 `Message` = `Username and password are required.`
     - **终止流程**，不调用 API。
3. **API 调用 (Backend Check)**：
   - 若前端校验通过，调用 `AuthenticationApi(userId, password)` 执行用户信息认证。
4. **结果处理**：
   - **认证成功**：完成登录流程，进入系统菜单页面。
   - **认证失败**：设置 `Message` = `We didn't recognize the username or password you entered. Please try again.`

### 3.2 校验详细规格表

| No. | 检查时机 | 检查对象 | 检查条件 | 错误消息 (Message Content) | 动作 |
| :-: | :------- | :------- | :------- | :------------------------- | :--- |
|  1  | 按下 Login 按钮 | UserID | UserID 为空（`null` 或 `trim() == ""`） | `Username and password are required.` | 展示警告级提示，终止后续认证流程 |
|  2  | 按下 Login 按钮 | Password | Password 为空（`null` 或 `trim() == ""`） | `Username and password are required.` | 展示警告级提示，终止后续认证流程 |
|  3  | ISAM 认证接口返回时 | 用户存在校验 | 用户ID 或密码不正确（HTTP 401） | `We didn't recognize the username or password you entered. Please try again.` | 展示错误级提示，返回登录页面等待用户重新输入 |

## 4. 接口定义 (API Specification)

### 4.1 AuthenticationApi

- **功能**：对输入的 UserID 和 Password 进行用户身份合法性校验，读取匹配已登记的用户认证信息。
- **Method**: `POST`
- **Endpoint**: `/api/ud01/AuthenticationApi`

#### Request Body

```json
{
  "userId": "string",
  "password": "string"
}
```

##### 请求示例

```json
{
  "userId": "AD001",
  "password": "P@ssw0rd123"
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "message": null,
  "data": {
    "userId":"AD001"
  }
}
```

#### Response Error (401 Unauthorized)

```json
{
  "code": 401,
  "message": "We didn't recognize the username or password you entered. Please try again.",
  "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景 | 处理方式 | Message 显示内容 |
| :------- | :------- | :--------------- |
| 登录接口调用超时或返回系统内部错误 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.` |

## 6. 实现注意事项 (Implementation Notes)

1. **状态管理**：
   - 使用 React State 管理 `userID`、`password`、`message`、`isLoading`。
   - `Message` Label 默认隐藏（内容为空时不予显示）。

2. **输入限制**：
   - UserID：通过正则 `/^[a-zA-Z0-9]*$/` 控制仅允许半角英数字输入，最大长度 10 字符。
   - Password：通过正则 `/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/` 控制允许半角英数字 + 符号输入，最大长度 32 字符。

3. **安全性**：
   - Password 输入框使用 `type="password"` 实现掩码显示。
   - 严禁在前端日志中打印明文密码。
   - 所有认证请求通过 ISAM AuthenticationApi 完成，前端不存储或校验用户核心凭证信息。

4. **UI 细节**：
   - Login 按钮在 `isLoading` 期间应设为 `disabled` 状态，防止重复提交。
   - `Message` 文字颜色使用红色（`#ff4d4f`）以起到警示作用。

5. **画面迁移**：
   - 认证成功后，通过路由导航跳转至系统菜单页面（`/Menu`）。
