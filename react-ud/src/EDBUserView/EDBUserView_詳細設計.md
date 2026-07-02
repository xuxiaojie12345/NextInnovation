# EDB用户视图模块 (EDB User View Module) 详细设计说明书

| 文档编号     | DES-EDB-USER-VIEW-UD25     | 版本号     | v1.0       |
| :----------- | :------------------------- | :--------- | :--------- |
| **模块名称** | EDB User View              | **作成日** | 2022-11-30 |
| **作成者**   | UD 刘                      | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于显示EDB系统的用户详细信息。页面从Saviynt系统获取用户的UserID、Responsible、User Position和E-mail等信息，并以只读形式展示给用户。该功能主要用于查看用户的完整联系信息和职位信息。

- **目标**：提供清晰的用户信息查看界面，支持快速返回前画面。
- **安全性**：所有数据均为只读展示，从Saviynt系统获取；支持清除输入内容和返回操作。
- **用户体验**：采用简洁的表单形式展示用户信息；提供Clear按钮清空内容，Back按钮返回前画面。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item)          | 種別 (Type)    | 必須 (Req) | MaxLength |   I/O    | 許容文字 (Allowed Chars)      | 文字配置 (Align) | 初期値 (Default)        | 表示制御 (Control) | 备注                                               |
| :--------------------- | :------------- | :--------: | :-------: | :------: | :---------------------------- | :--------------: | :---------------------- | :----------------: | :------------------------------------------------- |
| **Userid**             | TextField      |     -      |     -     | Output   | -                             |    左 (Left)     | =F7（从Saviynt获取）    |   活性 (Enabled)   | 来自Saviynt.F7                                     |
| **Responsible**        | TextField      |     -      |     -     | Output   | -                             |    左 (Left)     | =F8（从Saviynt获取）    |   活性 (Enabled)   | 来自Saviynt.F8                                     |
| **User Position**      | TextField      |     -      |     -     | Output   | -                             |    左 (Left)     | =F9（从Saviynt获取）    |   活性 (Enabled)   | 来自Saviynt.F9                                     |
| **E-mail**             | TextField      |     -      |     -     | Output   | -                             |    左 (Left)     | =F10（从Saviynt获取）   |   活性 (Enabled)   | 来自Saviynt.F10                                    |
| **Clear**              | Button         |     -      |     -     | Action   | -                             |   中 (Center)    | -                       |   活性 (Enabled)   | 清除所有输入内容                                   |
| **Back**               | Button         |     -      |     -     | Action   | -                             |   中 (Center)    | -                       |   活性 (Enabled)   | 返回前画面                                         |

> **注**：
> - 所有用户信息字段均从Saviynt系统获取，分别为F7、F8、F9、F10字段
> - Clear按钮点击后清空所有字段内容
> - Back按钮点击后返回前画面（通常是MarketDocumentSettingsList或SearchUser）

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

#### 3.1.1 页面初始化流程

1.  **开始**：页面加载事件触发。
2.  **前置处理**：从URL参数或state中获取 Userid。
3.  **空值校验 (Frontend Check)**：
    - 若 `Userid` 为空：
      - 设置 Message = `No user ID provided.`
      - **终止**流程，不显示任何数据。
4.  **API 调用 (Backend Check)**：
    - 调用 `GetUserInfoFromSaviyntApi(userID)` 从Saviynt获取用户详细信息。
5.  **结果处理**：
    - **成功**：将所有字段数据填充到对应的TextField中。
    - **失败**：若无数据：显示 `User not found in Saviynt system.`；若其他错误：显示具体错误消息。

#### 3.1.2 Clear操作流程

1.  **开始**：用户点击 Clear 按钮。
2.  **处理逻辑**：
    - 清空所有字段（Userid、Responsible、User Position、E-mail）。
3.  **结果处理**：
    - **成功**：所有字段显示为空。
    - **失败**：无。

#### 3.1.3 Back操作流程

1.  **开始**：用户点击 Back 按钮。
2.  **处理逻辑**：
    - 无需校验。
    - 直接执行画面关闭操作。
3.  **结果处理**：
    - **成功**：当前画面关闭，返回前画面。
    - **失败**：无。

### 3.2 校验详细规格表

| No. |   检查时机   |       检查对象       |          检查条件           | 错误消息 (Message Content) |              动作               |
| :-: | :----------: | :------------------: | :-------------------------: | :------------------------: | :-----------------------------: |
|  1  |  页面初始化  | Userid参数           | `Value == null` OR `== ""`  |      `No user ID provided.`       |   显示错误消息，不加载数据   |
|  2  |  API 响应   | Saviynt查询结果      |      用户不存在             |      `User not found in Saviynt system.`       |   显示错误消息，清空所有字段   |
|  3  |  API 响应   |    服务器错误        |  `Status != Success`  | `System error. Please contact administrator.` |   显示错误消息   |

## 4. 接口定义 (API Specification)

### 4.1 GetUserInfoFromSaviyntApi

- **功能**：从Saviynt系统获取用户详细信息。
- **Method**: `GET`
- **Endpoint**: `/api/ud25/getuserfromsaviynt`

#### Request Params

```json
{
  "userId": "string (从上一画面传递)"
}
```

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "获取用户信息成功",
  "data": {
    "userId": "user001",
    "responsible": "John Doe",
    "userPosition": "Manager",
    "email": "john.doe@example.com"
  }
}
```

##### 响应字段说明

| 字段名       | 类型   | 说明                                                                              |
| :----------- | :----- | :-------------------------------------------------------------------------------- |
| userId       | String | 用户ID，来自Saviynt.F7                                                            |
| responsible  | String | 负责人，来自Saviynt.F8                                                            |
| userPosition | String | 用户职位，来自Saviynt.F9                                                          |
| email        | String | 电子邮件，来自Saviynt.F10                                                         |

#### Response Error (400/500)

```json
{
  "success": false,
  "message": "User not found in Saviynt system.",
  "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **未传递Userid参数**     | 前端校验拦截       | `No user ID provided.`                         |
| **Saviynt中用户不存在**  | API返回400错误     | `User not found in Saviynt system.`            |
| **Saviynt连接失败**      | API返回500错误     | `Failed to connect to Saviynt system.`         |
| **数据库连接异常**       | API返回500错误     | `System error. Please contact administrator.`  |
| **API超时**              | 前端捕获超时异常   | `Request timeout. Please try again later.`     |
| **网络异常**             | 前端捕获网络异常   | `Network connection failed. Please check your network settings.` |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 管理 `userId`, `responsible`, `userPosition`, `email`, `errorMessage`, `isLoading`。
    - 页面加载时从location.state或URL参数获取userId。
2.  **安全性**：
    - API 请求必须携带有效的认证Token。
    - 所有数据均为只读展示，禁止修改操作。
    - Saviynt系统调用需确保网络连接安全。
3.  **UI 细节**：
    - 所有字段使用TextField形式展示，但设置为只读（disabled或readOnly属性）。
    - 所有字段左对齐显示。
    - Clear和Back按钮在 `isLoading` 期间应设为 `disabled`，防止重复提交。
    - `Message` 文字颜色建议使用红色 (`#ff4d4f` 或 `#c62828`) 以起到警示作用。
    - 建议在页面顶部显示标题 "EDB User View"。
4.  **性能优化**：
    - 用户信息可在页面加载时一次性获取。
    - Saviynt调用可添加缓存机制，避免频繁查询同一用户。
5.  **数据来源说明**：
    - 所有字段均从Saviynt系统获取，分别为F7、F8、F9、F10字段
    - 若某个字段值为空，显示 `-` 或留空（根据业务需求决定）

---
