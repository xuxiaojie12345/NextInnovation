根据您提供的需求规格，我为您生成了标准的**《登录模块详细设计说明书》**。这份文档涵盖了背景、参数定义、业务逻辑校验以及接口调用规范，可直接用于开发指导和测试验收。

---

# 登录模块 (Login Module) 详细设计说明书

| 文档编号     | DES-LOGIN-001         | 版本号     | v1.0       |
| :----------- | :-------------------- | :--------- | :--------- |
| **模块名称** | 用户登录 (User Login) | **作成日** | 2023-10-XX |
| **作成者**   | Lingma Assistant      | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块是系统的入口，负责验证用户身份。用户通过输入 UserID 和 Password，经由前端校验后调用后端 `AuthenticationApi` 进行认证。

- **目标**：确保只有授权用户能进入系统，并提供清晰的错误反馈。
- **安全性**：密码字段需掩码显示，所有敏感数据传输需加密。
- **用户体验**：采用 Label 形式在页面内显示错误信息，避免频繁弹窗打断操作流。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item) | 種別 (Type) | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars)          | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                    |
| :------------ | :---------- | :--------: | :-------: | :----: | :-------------------------------- | :--------------: | :--------------: | :----------------: | :---------------------- |
| **UserID**    | TextField   |     Y      |    10     | Input  | 半角英数字 (`a-z, A-Z, 0-9`)      |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 自动去除首尾空格        |
| **Password**  | TextField   |     Y      |    32     | Input  | 半角英数字 + 記号 (Special Chars) |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 输入时显示为掩码 (`•`)  |
| **Message**   | Label       |     -      |    256    | Output | 任意可见字符                      |    左 (Left)     |    空 (Empty)    |      动态显示      | 仅在出错时显示红色文字  |
| **Login**     | Button      |     -      |     -     | Action | -                                 |   中 (Center)    |        -         |   活性 (Enabled)   | 点击触发校验与 API 调用 |

> **注**：
>
> - **半角英数字**：正则表达式 `[a-zA-Z0-9]`
> - **記号**：指 ASCII 范围内的可见符号（如 `!@#$%` 等），具体范围以后端安全策略为准。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

所有校验逻辑均在用户点击 **[Login]** 按钮时同步或异步执行。

### 3.1 处理流程

1.  **开始**：用户点击 [Login] 按钮。
2.  **前置处理**：获取 UserID 和 Password，执行 `trim()` 去除首尾空白。
3.  **空值校验 (Frontend Check)**：
    - 若 `UserID` 为空 **或** `Password` 为空：
      - 设置 `Message` = `Username and password are required.`
      - **终止**流程，不调用 API。
4.  **API 调用 (Backend Check)**：
    - 若校验通过，调用 `AuthenticationApi(userID, password)`。
5.  **结果处理**：
    - **认证成功**：清空 Message，保存 Token，跳转首页。
    - **认证失败**：设置 `Message` = `We didn't recognize the username or password you entered. Please try again.`

### 3.2 校验详细规格表

| No. |   检查时机   |     检查对象      |                检查条件                |                          错误消息 (Message Content)                           |                 动作                 |
| :-: | :----------: | :---------------: | :------------------------------------: | :---------------------------------------------------------------------------: | :----------------------------------: |
|  1  | Click Login  | UserID / Password | `Value == null` OR `Trim(Value) == ""` |                     `Username and password are required.`                     | 显示 Message，焦点停留在第一个空字段 |
|  2  | API Response |    Auth Result    |  `Status != Success` OR `Code == 401`  | `We didn't recognize the username or password you entered. Please try again.` | 显示 Message，建议清空 Password 字段 |

## 4. 接口定义 (API Specification)

### 4.1 AuthenticationApi

- **功能**：验证用户凭证并返回认证结果。
- **Method**: `POST`
- **Endpoint**: `/api/auth/login` (示例路径)

#### Request Body

```json
{
  "userID": "string (Max 10, Alphanumeric)",
  "password": "string (Max 32, Alphanumeric + Symbols)"
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": {
    "token": "eyJhbGciOi...",
    "userInfo": { ... }
  },
  "message": "success"
}
```

#### Response Error (401 Unauthorized)

```json
{
  "code": 401,
  "data": null,
  "message": "Invalid credentials"
}
```
