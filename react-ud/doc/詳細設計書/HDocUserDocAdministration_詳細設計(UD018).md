# HDoc User Doc Administration 模块详细设计说明书

| 文档编号     | DES-HDoc User Doc Administration-018 | 版本号     | v1.0       |
| :----------- | :----------------------------------- | :--------- | :--------- |
| **模块名称** | HDoc User Doc Administration         | **作成日** | 2026-07-22 |
| **作成者**   | GitHub Copilot                       | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块是 HDOC 系统的用户文档权限管理画面，核心功能是完成 HDoc 系统内用户的文档权限设置。支持通过输入 UserID 查询对应用户的基础信息与可分配权限，完成指定用户的文档权限配置，实现对用户文档访问权限的精准管控。

- **目標**：实现 HDOC 系统内用户文档权限的统一查询与分配管理，确保用户对文档的访问权限得到精准控制。
- **安全性**：
  - 所有用户权限相关操作必须先校验 UserID 在用户功能权限表中是否合法，仅存在于用户功能权限表内的用户才可执行权限查询与设置操作，避免非法用户权限的篡改。
  - 所有接口调用异常需记录系统日志，防止敏感信息泄露。
- **用户体验**：
  - 输入 UserID 点击 User Info 按钮后自动从 Saviynt 拉取对应用户名，减少用户手动填写的操作成本。
  - 所有不合法的操作场景都给出明确的英文错误提示，便于操作人员快速定位问题。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| No. | 项目名 (Item) | 种类 (Type) | 必须 (Req) | MaxLength | I/O | 允许字符 (Allowed Chars) | 字符对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注 |
| :-: | :------------ | :---------- | :--------: | :-------: | :-: | :----------------------- | :--------------: | :--------------: | :----------------: | :--- |
| 1 | **UserID** | TextField | Y | 10 | Input | 半角英数字 (`a-z, A-Z, 0-9`) | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 自动去除首尾空格 |
| 2 | **User** | Label | - | - | Output | 任意可见字符 | 左 (Left) | 空 (Empty) | 活性 (Enabled) | User 名从 Saviynt 获取 |
| 3 | **Document** | Pull-downList | - | 50 | Input | 半角英数字 (`a-z, A-Z, 0-9`) | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 手动输入文档名称 |
| 4 | **User Info** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 点击触发用户信息查询 |
| 5 | **Update** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 点击触发文档权限更新 |

> **注**：
>
> - **半角英数字**：正则表达式 `[a-zA-Z0-9]`
> - **Document** 为 Pull-downList（下拉列表）类型，允许用户输入文档名称进行检索选择，最大长度 50 字符。
> - 页面所有控件默认保持活性状态，无需额外操作即可进行交互。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

所有校验逻辑在用户点击对应按钮时按序执行。

### 3.1 处理流程

#### 3.1.1 初始表示

画面正常加载，所有控件按初始状态展示。UserID 输入框、User 标签、Document 下拉列表、User Info 按钮、Update 按钮均处于活性状态，User 标签内容为空，Document 下拉列表为空。

#### 3.1.2 触发条件：点击「User Info」按钮

1. **空值校验 (Frontend Check)**：
   - 获取 UserID 输入值，执行 `trim()` 去除首尾空格。
   - 若 `UserID` 为空：
     - 设置 `Message` = `UserID are required.`
     - **终止流程**，不调用 API。
2. **后端校验 (Backend Check)**：
   - 调用 `UD18HDocUserDocAdministrationApi.UD18SelectHdocFunctionAuth` 接口校验该 UserID 是否存在于用户功能权限表中。
   - 若校验通过（用户存在），同时调用 Saviynt 的 `AuthenticationApi` 接口获取对应用户名。
3. **结果处理**：
   - **成功**：
     - User 标签自动填充从 Saviynt 获取到的 User 名。
     - 同时调用 `UD18HDocUserDocAdministrationApi.UD20SelectHdocDocumentList` 接口获取文档类型列表，供 Document 下拉列表使用。
   - **失败**：
     - 若 UserID 不存在于用户功能权限表中，设置 `Message` = `We didn't recognize the userid you entered. Please try again.`
     - **终止流程**，保留用户已输入的 UserID 内容，支持用户重新操作。

#### 3.1.3 触发条件：点击「Update」按钮

1. **空值校验 (Frontend Check)**：
   - 获取 UserID 输入值，执行 `trim()` 去除首尾空格。
   - 若 `UserID` 为空：
     - 设置 `Message` = `UserID are required.`
     - **终止流程**，不调用 API。
2. **后端校验 (Backend Check)**：
   - 调用 `UD18HDocUserDocAdministrationApi.UD18SelectHdocFunctionAuth` 接口校验该 UserID 是否存在于用户功能权限表中。
   - 若校验通过，获取 Document 下拉列表的输入/选择内容，调用 `UD18HDocUserDocAdministrationApi.UD18CreateHdocUserDoc` 接口更新 `HDOC_USER_DOC` 表数据。
3. **结果处理**：
   - **成功**：提示文档权限更新完成的成功消息，该用户的文档权限配置即时生效。
   - **失败**：
     - 若 UserID 不存在于用户功能权限表中，设置 `Message` = `We didn't recognize the userid you entered. Please try again.`
     - 若接口返回系统错误，设置 `Message` = `System error. Please contact administrator.`
     - 原有用户文档权限保持不变。

### 3.2 校验详细规格表

| No. | 检查时机 | 检查对象 | 检查条件 | 错误消息 (Message Content) | 动作 |
| :-: | :------- | :------- | :------- | :------------------------- | :--- |
| 1 | 点击 User Info 按钮时 | UserID | `UserID` 为空（`null` 或 `trim() == ""`） | `UserID are required.` | 展示错误提示，终止用户信息查询流程 |
| 2 | 点击 User Info 按钮时 | UserID | 输入的 UserID 不存在于用户功能权限表中（API 返回 404） | `We didn't recognize the userid you entered. Please try again.` | 展示错误提示，终止用户信息查询流程 |
| 3 | 点击 Update 按钮时 | UserID | `UserID` 为空（`null` 或 `trim() == ""`） | `UserID are required.` | 展示错误提示，终止权限更新流程 |
| 4 | 点击 Update 按钮时 | UserID | 输入的 UserID 不存在于用户功能权限表中（API 返回 404） | `We didn't recognize the userid you entered. Please try again.` | 展示错误提示，终止权限更新流程 |

## 4. 接口定义 (API Specification)

### 4.1 UD18HDocUserDocAdministrationApi.UD20SelectHdocDocumentList

- **功能**：获取可分配的文档类型列表，供 Document 下拉列表使用。
- **Method**: `GET`
- **Endpoint**: `/api/ud018/UD18HDocUserDocAdministrationApi/UD20SelectHdocDocumentList`

#### Request Body

```json
{}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": {
    "doctypeInfo": [
      {
        "doctype": "UD_TEST",
        "description": "UD_templat(pdf)"
      },
      {
        "doctype": "UD_TEST1",
        "description": "UD_templat1(pdf)"
      },
      {
        "doctype": "UD_TEST2",
        "description": "UD_templat2(pdf)"
      }
    ]
  }
}
```

### 4.2 UD18HDocUserDocAdministrationApi.AuthenticationApi

- **功能**：根据输入的 UserID 从 Saviynt 获取对应的用户名称，同时返回该用户已分配的文档权限列表。
- **Method**: `GET`
- **Endpoint**: `/api/ud018/UD18HDocUserDocAdministrationApi/AuthenticationApi`

#### Request Body

```json
{
  "userid": "string (Max 10, Alphanumeric)"
}
```

##### 请求示例

```json
{
  "userid": "TEST001"
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": {
    "username": "张三",
    "doctype": ["UD_TEST", "UD_TEST2", "UD_TEST3"]
  }
}
```

### 4.3 UD18HDocUserDocAdministrationApi.UD18SelectHdocFunctionAuth

- **功能**：校验 UserID 是否存在于用户功能权限表 `HDOC_FUNCTION_AUTH` 中。
- **Method**: `GET`
- **Endpoint**: `/api/ud018/UD18HDocUserDocAdministrationApi/UD18SelectHdocFunctionAuth`

#### Request Body

```json
{
  "userid": "string (Max 10, Alphanumeric)"
}
```

##### 请求示例

```json
{
  "userid": "TEST001"
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": {
    "isExists": true
  },
  "message": null
}
```

#### Response Error (404)

```json
{
  "code": 404,
  "data": null,
  "message": "We didn't recognize the userid you entered. Please try again."
}
```

### 4.4 UD18HDocUserDocAdministrationApi.UD18CreateHdocUserDoc

- **功能**：新规指定用户的文档权限配置，更新 `HDOC_USER_DOC` 表数据。
- **Method**: `PUT`
- **Endpoint**: `/api/ud018/UD18HDocUserDocAdministrationApi/UD18CreateHdocUserDoc`

#### Request Body

```json
{
  "userid": "string (Max 10, Alphanumeric)",
  "authDocName": "string (Max 50, Alphanumeric)"
}
```

##### 请求示例

```json
{
  "userid": "TEST001",
  "authDocName": "项目设计书"
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": null,
  "message": "Document permission updated successfully."
}
```

#### Response Error (500)

```json
{
  "code": 500,
  "data": null,
  "message": "System error. Please contact administrator."
}
```

### 4.5 UD18HDocUserDocAdministrationApi.UD18DeleteHdocUserDoc

- **功能**：删除指定用户的文档权限配置。
- **Method**: `PUT`
- **Endpoint**: `/api/ud018/UD18HDocUserDocAdministrationApi/UD18DeleteHdocUserDoc`

#### Request Body

```json
{
  "userid": "string (Max 10, Alphanumeric)",
  "authDocName": "string (Max 50, Alphanumeric)"
}
```

##### 请求示例

```json
{
  "userid": "TEST001",
  "authDocName": "项目设计书"
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": null,
  "message": "Document permission deleted successfully."
}
```

#### Response Error (500)

```json
{
  "code": 500,
  "data": null,
  "message": "System error. Please contact administrator."
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景 | 处理方式 | Message 显示内容 |
| :------- | :------- | :--------------- |
| 接口调用超时或返回系统内部错误 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.` |
| 网络断开/连接失败 | 捕获 Network Error，提示用户检查网络连接 | `Network error. Please check your connection.` |
| 接口返回非预期格式数据 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.` |

## 6. 实现注意事项 (Implementation Notes)

1. **状态管理**：
   - 使用 React State 管理 `userID`、`userName`、`document`、`message`、`isLoading`。
   - `Message` 区域默认隐藏（内容为空时不予显示）。
   - Document 下拉列表的数据源在点击 User Info 成功后通过 `UD20SelectHdocDocumentList` 接口动态获取并填充。

2. **输入限制**：
   - UserID：通过正则 `/^[a-zA-Z0-9]*$/` 控制仅允许半角英数字输入，最大长度 10 字符。
   - 输入时自动去除首尾空格（`trim()`）。
   - Document 下拉列表支持手动输入，通过后端接口对输入的文档名称进行匹配检索。

3. **控件联动逻辑**：
   - 点击 User Info 成功后，自动调用 Saviynt 接口填充 User 标签，同时加载 Document 下拉列表的可选数据。
   - 若 User Info 查询失败，Document 下拉列表保持为空状态，Update 按钮操作将被终止。

4. **安全性**：
   - 所有涉及用户权限的操作（User Info / Update）必须先调用 `UD18SelectHdocFunctionAuth` 接口校验 UserID 是否存在于用户功能权限表中。
   - 严禁在前端日志中打印用户敏感信息。
   - 所有 API 请求必须通过 HTTPS 发送。

5. **UI 细节**：
   - User Info 和 Update 按钮在 `isLoading` 期间应设为 `disabled` 状态，防止重复提交。
   - `Message` 文字颜色使用红色（`#ff4d4f`）以起到警示作用。
   - 成功消息使用绿色（`#52c41a`）以与错误消息区分。

6. **删除操作支持**：
   - 若需要支持删除指定用户的文档权限，可调用 `UD18DeleteHdocUserDoc` 接口，传入 UserID 与文档名称，删除 `HDOC_USER_DOC` 表中对应的权限记录。
   - 建议在 Delete 操作前增加确认弹窗，防止误操作。
