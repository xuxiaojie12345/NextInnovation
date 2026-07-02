# HDoc用户文档管理模块 (HDoc User Doc Administration Module) 详细设计说明书

| 文档编号     | DES-USER-DOC-ADMIN-UD18   | 版本号     | v1.0       |
| :----------- | :------------------------ | :--------- | :--------- |
| **模块名称** | HDoc User Doc Administration | **作成日** | 2022-11-29 |
| **作成者**   | UD 刘                     | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于设置和管理HDoc系统的用户文档权限。管理员可以输入UserID，查询该用户在Saviynt系统中的用户名及其拥有的文档权限，并进行更新操作。该功能主要用于维护用户对各类文档的访问权限。

- **目标**：提供清晰的用户文档权限管理界面，支持权限的查询和更新操作。
- **安全性**：所有操作需校验UserID是否存在于用户功能权限表中；仅当用户存在时才能执行权限检索和设置操作。
- **用户体验**：采用简洁的表单形式，支持自动从Saviynt获取用户名并显示用户当前拥有的权限列表。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item)      | 種別 (Type)    | 必須 (Req) | MaxLength |   I/O    | 許容文字 (Allowed Chars)      | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                                               |
| :----------------- | :------------- | :--------: | :-------: | :------: | :---------------------------- | :--------------: | :--------------: | :----------------: | :------------------------------------------------- |
| **UserID**         | TextField      |     Y      |    10     | Input    | 半角英数字                    |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 输入待查询的用户ID                                 |
| **User**           | Label          |     -      |     -     | Output   | -                             |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 从Saviynt获取的用户名                              |
| **Document**       | TextField      |     -      |     -     | Input    | -                             |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 来自HDOC_DOCUMENT_LIST.DESCRIPTION，显示文档列表   |
| **User Info**      | Button         |     -      |     -     | Action   | -                             |   中 (Center)    |        -         |   活性 (Enabled)   | 查询用户信息并显示权限                             |
| **Update**         | Button         |     -      |     -     | Action   | -                             |   中 (Center)    |        -         |   活性 (Enabled)   | 更新用户文档权限                                   |

> **注**：
> - **User Info按钮行为**：
>   1. 检查UserID是否存在于用户功能权限表（HDOC_FUNCTION_AUTH）中
>   2. 若存在，从Saviynt获取用户名并显示在User字段
>   3. 自动选择该用户当前拥有的文档权限并在Document列表中显示
> - **Update按钮行为**：
>   1. 再次检查UserID是否存在于用户功能权限表中
>   2. 若存在，将用户选择的文档权限保存到HDOC_USER_DOC表

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

所有校验逻辑均在用户执行操作时同步或异步执行。

### 3.1 处理流程

#### 3.1.1 页面初始化流程

1.  **开始**：页面加载事件触发。
2.  **API 调用**：
    - 调用 `GetDocumentListApi()` 获取所有可用文档列表。
3.  **结果处理**：
    - **成功**：填充Document下拉列表或多选框。
    - **失败**：显示错误消息。

#### 3.1.2 User Info操作流程

1.  **开始**：用户输入UserID后点击 User Info 按钮。
2.  **前置处理**：获取UserID字段的值。
3.  **必填校验 (Frontend Check)**：
    - 若 `UserID` 为空：
      - 设置 Message = `User ID is required.`
      - **终止**流程。
4.  **API 调用 (Backend Check)**：
    - 调用 `CheckUserExistsApi(userID)` 检查用户是否存在于HDOC_FUNCTION_AUTH表中。
5.  **结果处理**：
    - **用户不存在**：
      - 显示 `We didn't recognize the userid you entered. Please try again.`
      - Message级别 = Error
      - **终止**流程。
    - **用户存在**：
      - 调用 `GetUserInfoFromSaviyntApi(userID)` 从Saviynt获取用户名。
      - 调用 `GetUserPermissionsApi(userID)` 获取用户当前拥有的文档权限。
      - 将用户名显示在User字段。
      - 自动勾选用户已拥有的文档权限。

#### 3.1.3 Update操作流程

1.  **开始**：用户选择/修改文档权限后点击 Update 按钮。
2.  **前置处理**：获取UserID字段和所有选中的Document值。
3.  **必填校验 (Frontend Check)**：
    - 若 `UserID` 为空：
      - 设置 Message = `User ID is required.`
      - **终止**流程。
4.  **API 调用 (Backend Check)**：
    - 调用 `CheckUserExistsApi(userID)` 再次检查用户是否存在于HDOC_FUNCTION_AUTH表中。
5.  **结果处理**：
    - **用户不存在**：
      - 显示 `We didn't recognize the userid you entered. Please try again.`
      - Message级别 = Error
      - **终止**流程。
    - **用户存在**：
      - 调用 `UpdateUserDocPermissionsApi(userID, selectedDocuments)` 更新用户文档权限。
      - 显示成功消息。

### 3.2 校验详细规格表

| No. |   检查时机   |       检查对象       |                  检查条件                   |                          错误消息 (Message Content)                           |    错误级别    |                 动作                 |
| :-: | :----------: | :------------------: | :-----------------------------------------: | :---------------------------------------------------------------------------: | :------------: | :----------------------------------: |
|  1  | User Info操作 | UserID              | 用户ID在HDOC_FUNCTION_AUTH表中不存在        |                     `We didn't recognize the userid you entered. Please try again.`                     |     Error      | 显示错误消息，终止操作 |
|  2  | Update操作   | UserID              | 用户ID在HDOC_FUNCTION_AUTH表中不存在        |                     `We didn't recognize the userid you entered. Please try again.`                     |     Error      | 显示错误消息，终止操作 |
|  3  | User Info操作 | UserID              | UserID为空                                  |                     `User ID is required.`                     |     Error      | 显示错误消息，终止操作 |
|  4  | Update操作   | UserID              | UserID为空                                  |                     `User ID is required.`                     |     Error      | 显示错误消息，终止操作 |

## 4. 接口定义 (API Specification)

### 4.1 GetDocumentListApi

- **功能**：获取所有可用文档列表。
- **Method**: `GET`
- **Endpoint**: `/api/ud18/getdocumentlist`

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "获取文档列表成功",
  "data": [
    {
      "doctype": "COC",
      "description": "Certificate of Conformity"
    },
    {
      "doctype": "VDA",
      "description": "Vehicle Data Sheet"
    }
  ]
}
```

### 4.2 CheckUserExistsApi

- **功能**：检查用户是否存在于用户功能权限表中。
- **Method**: `GET`
- **Endpoint**: `/api/ud18/checkuserexists`

#### Request Params

```json
{
  "userId": "string (最大10字符，半角英数字)"
}
```

#### Response Success (200 OK) - 用户存在

```json
{
  "success": true,
  "message": "User exists",
  "data": {
    "exists": true
  }
}
```

#### Response Success (200 OK) - 用户不存在

```json
{
  "success": false,
  "message": "We didn't recognize the userid you entered. Please try again.",
  "data": {
    "exists": false
  }
}
```

### 4.3 GetUserInfoFromSaviyntApi

- **功能**：从Saviynt系统获取用户名。
- **Method**: `GET`
- **Endpoint**: `/api/ud18/getuserfromsaviynt`

#### Request Params

```json
{
  "userId": "string"
}
```

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "获取用户信息成功",
  "data": {
    "userId": "user001",
    "userName": "John Doe"
  }
}
```

### 4.4 GetUserPermissionsApi

- **功能**：获取用户当前拥有的文档权限。
- **Method**: `GET`
- **Endpoint**: `/api/ud18/getuserpermissions`

#### Request Params

```json
{
  "userId": "string"
}
```

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "获取用户权限成功",
  "data": {
    "userId": "user001",
    "documents": ["COC", "VDA", "VIN_PLATE"]
  }
}
```

### 4.5 UpdateUserDocPermissionsApi

- **功能**：更新用户文档权限。
- **Method**: `PUT`
- **Endpoint**: `/api/ud18/updateuserdocpermissions`

#### Request Body

```json
{
  "userId": "user001",
  "documents": ["COC", "VDA", "VIN_PLATE"]
}
```

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "User document permissions updated successfully",
  "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **UserID为空**           | 前端校验拦截       | `User ID is required.`                         |
| **用户不存在**           | API返回错误        | `We didn't recognize the userid you entered. Please try again.` |
| **Saviynt连接失败**      | API返回500错误     | `Failed to connect to Saviynt system.`         |
| **数据库连接异常**       | API返回500错误     | `System error. Please contact administrator.`  |
| **API超时**              | 前端捕获超时异常   | `Request timeout. Please try again later.`     |
| **网络异常**             | 前端捕获网络异常   | `Network connection failed. Please check your network settings.` |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 管理 `userId`, `userName`, `documentList`, `selectedDocuments`, `errorMessage`, `isLoading`。
    - documentList存储所有可用文档，selectedDocuments存储用户当前选中的文档权限。
2.  **安全性**：
    - API 请求必须携带有效的认证Token。
    - 所有权限更新操作需记录日志，便于审计。
3.  **UI 细节**：
    - UserID输入框应支持自动去除首尾空格。
    - Document列表建议使用多选框（Checkbox）形式展示，便于用户直观看到哪些文档已被选中。
    - User Info和Update按钮在 `isLoading` 期间应设为 `disabled`，防止重复提交。
    - `Message` 文字颜色建议使用红色 (`#ff4d4f` 或 `#c62828`) 以起到警示作用。
    - 成功更新后应显示绿色成功消息，例如："User document permissions updated successfully."
4.  **性能优化**：
    - 文档列表可在页面加载时一次性获取并缓存。
    - User Info操作可合并多个API调用，减少网络请求次数。
5.  **数据流逻辑**：
    - User Info操作流程：
      1. 前端发送UserID到后端
      2. 后端检查HDOC_FUNCTION_AUTH表
      3. 若存在，调用Saviynt API获取用户名
      4. 查询HDOC_USER_DOC表获取用户当前权限
      5. 返回用户名和权限列表到前端
    - Update操作流程：
      1. 前端发送UserID和选中的文档列表到后端
      2. 后端再次检查HDOC_FUNCTION_AUTH表
      3. 若存在，删除HDOC_USER_DOC表中该用户的旧权限
      4. 插入新的权限记录
      5. 返回成功消息到前端

---
