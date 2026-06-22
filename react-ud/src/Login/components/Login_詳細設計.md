# 登录模块 (Login Module) 详细设计说明书

| 文档编号     | DES-Login-001         | 版本号     | V1.0       |
| :----------- | :-------------------- | :--------- | :--------- |
| **模块名称** | Login                 | **作成日** | 2026-05-19 |
| **作成者**   | Lingma Assistant      | **状态**   | 正式稿     |

---

## 1. 背景 (Background)

Login 画面是 HDoc 系统的入口页面，用于用户身份验证。用户通过输入 UserID（用户ID）和 Password（密码）进行登录认证，认证成功后跳转到 HdocMenu（菜单）画面。

- **功能定位：**
  - 用户身份认证入口
  - 系统访问权限控制第一道防线
  - 提供友好的错误提示信息

- **前置条件：**
  - 用户已访问系统 URL
  - 系统后端服务正常运行
  - 数据库中存在用户信息

- **后置依赖：**
  - 认证成功：跳转到 HdocMenu 画面
  - 认证失败：显示错误信息，停留在当前页面

---

## 2. 画面项目定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item) | 種別 (Type) | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars)          | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                    |
| :------------ | :---------- | :--------: | :-------: | :----: | :-------------------------------- | :--------------: | :--------------: | :----------------: | :---------------------- |
| **UserID**    | TextField   |     Y      |    10     | Input  | 半角英数字 (`a-z, A-Z, 0-9`)      |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 自动去除首尾空格        |
| **Password**  | TextField   |     Y      |    32     | Input  | 半角英数字 + 記号 (Special Chars) |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 输入时显示为掩码 (`•`)  |
| **Message**   | Label       |     -      |    256    | Output | 任意可见字符                      |    左 (Left)     |    空 (Empty)    |      动态显示      | 仅在出错时显示红色文字  |
| **Login**     | Button      |     -      |     -     | Action | -                                 |   中 (Center)    |        -         |   活性 (Enabled)   | 点击触发校验与 API 调用 |

> **注：**
> - **半角英数字**：正则表达式 `[a-zA-Z0-9]`
> - **記号**：指 ASCII 范围内的可见符号（如 `!@#$%` 等），具体范围以后端安全策略为准。

---

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

所有校验逻辑均在用户点击 **[Login]** 按钮时同步或异步执行。

1. **开始**：用户点击 [Login] 按钮。
2. **前置处理**：获取 UserID 和 Password。
3. **空值校验 (Frontend Check)**：
   - 若 `UserID` 为空 **或** `Password` 为空：
     - 设置 `Message` = `Username and password are required.`
     - **终止**流程，不调用 API。
4. **API 调用 (Backend Check)**：
   - 若校验通过，调用 `AuthenticationApi(userID, password)`。
5. **结果处理**：
   - **认证成功**：清空 Message，保存 Token，携带 userId 参数跳转至 HdocMenu 画面。
   - **认证失败**：设置 `Message` = `We didn't recognize the username or password you entered. Please try again.`，停留在 Login 画面。

### 3.2 校验详细规格表

| No. |   检查时机   |     检查对象      |                检查条件                |                          错误消息 (Message Content)                           |                 动作                 |
| :-: | :----------: | :---------------: | :------------------------------------: | :---------------------------------------------------------------------------: | :----------------------------------: |
|  1  | Click Login  | UserID / Password | `Value == null` OR `Trim(Value) == ""` |                     `Username and password are required.`                     | 显示 Message，焦点停留在第一个空字段 |
|  2  | API Response |    Auth Result    |  `Status != Success` OR `Code == 401`  | `We didn't recognize the username or password you entered. Please try again.` | 显示 Message，建议清空 Password 字段 |

---

## 4. 接口定义 (API Specification)

### 4.1 AuthenticationApi（用户认证接口）

- **功能：** 当画面的 UserID 和 Password 输入完成以后，点击画面的 Login button，画面会呼出 AuthenticationApi 认证接口，进行用户信息的认证。
- **Method**: `POST`
- **Endpoint**: `/api/UD01/login`

#### Request Body

```json
{
  "userId": "string (Max 10, Alphanumeric)",
  "password": "string (Max 32, Alphanumeric + Symbols)"
}
```

#### Response Success 

```json
{
  "code": 200,
  "data": {
    "userId": "admin",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "登录成功"
}
```

#### Response Error 

```json
{
  "code": 401,
  "data": null,
  "message": "用户名或密码错误"
}
```
---

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **网络断开/超时**        | 捕获 Network Error | `网络连接失败，请稍后重试` |
| **认证失败异常**         | 显示后端返回的错误信息 | 后端返回的 message |
| **服务器内部错误 (500)** | 捕获 Server Error  | `系统维护中，请稍后重试`  |

---

## 6. 实现注意事项 (Implementation Notes)

1. **状态管理**：
   - 使用 React State 管理 `userId`, `password`, `message`, `isLoading`。
   - `Message` Label 默认隐藏（内容为空时不占位）。

2. **安全性**：
   - 严禁在前端日志中打印明文密码。
   - API 请求必须通过 HTTPS 发送。
   - Password 输入框使用 `type="password"` 实现掩码显示。

3. **UI 细节**：
   - Login 按钮在 `isLoading` 期间应设为 `disabled`，防止重复提交。
   - `Message` 文字颜色建议使用红色以起到警示作用。
   - 认证成功后需将 `userId` 通过路由 state 传递至 HdocMenu 画面。

4. **路由跳转**：
   - 使用 `useNavigate` Hook 进行页面跳转。
   - 跳转方式：`navigate('/hdoc-menu', { state: { userId } })`。

---

**文档结束**
