# HDoc User Administration 模块详细设计说明书

| 文档编号     | DES-HDoc User Administration-017 | 版本号     | v1.0       |
| :----------- | :------------------------------- | :--------- | :--------- |
| **模块名称** | HDoc User Administration         | **作成日** | 2026-07-22 |
| **作成者**   | GitHub Copilot                   | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块是 HDOC 系统的用户权限管理画面，负责完成用户权限的统一配置管理。支持录入 UserID 获取对应用户的基础信息与已有功能权限，提供更新指定用户权限、删除指定用户全部权限的操作能力，最终实现 HDOC 系统内全类型用户的功能权限、市场权限的统一管控。

- **目標**：实现 HDOC 系统内用户功能权限与市场权限的统一查询、分配与回收管理，确保系统权限管理的规范性与可追溯性。
- **安全性**：
  - 所有涉及用户权限查询、修改、删除的操作，均需进行用户 ID 合法性校验，仅识别到系统内已存在的有效用户才可进行后续操作。
  - 用户市场权限下拉列表数据仅可从 `MARKET_MASTER` 主表中读取，不允许自定义输入值，保障权限配置的数据源合规性。
- **用户体验**：
  - 页面所有控件默认保持活性状态，无需额外跳转即可完成全流程权限配置操作。
  - Standard User、Adaptation user 对应的 Market 下拉选项默认预置显示 `-EU-`，减少常规场景下的用户手动选择操作成本。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| No. | 项目名 (Item) | 种类 (Type) | 必须 (Req) | MaxLength | I/O | 允许字符 (Allowed Chars) | 字符对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注 |
| :-: | :------------ | :---------- | :--------: | :-------: | :-: | :----------------------- | :--------------: | :--------------: | :----------------: | :--- |
| 1 | **UserID** | TextField | Y | 10 | Input | 半角英数字 (`a-z, A-Z, 0-9`) | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 自动去除首尾空格 |
| 2 | **User Info** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 点击触发用户信息查询 |
| 3 | **User** | Label | - | - | Output | 任意可见字符 | 左 (Left) | 空 (Empty) | 活性 (Enabled) | User 名从 Saviynt 获取 |
| 4 | **Standard User** | Checkbox | - | - | Input | - | 左 (Left) | 未选中 | 活性 (Enabled) | - |
| 5 | **Standard User 对应 Market** | Pull-downList | - | - | Input | - | 左 (Left) | `-EU-` | 活性 (Enabled) | 默认显示 `-EU-` |
| 6 | **Rule Admin** | Checkbox | - | - | Input | - | 左 (Left) | 未选中 | 活性 (Enabled) | - |
| 7 | **Rule Admin 对应 Market** | Pull-downList | - | - | Input | - | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 数据来源为 `MARKET_MASTER` 表的 `MARKET` 字段 |
| 8 | **Template Admin** | Checkbox | - | - | Input | - | 左 (Left) | 未选中 | 活性 (Enabled) | - |
| 9 | **Template Admin 对应 Market** | Pull-downList | - | - | Input | - | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 数据来源为 `MARKET_MASTER` 表的 `MARKET` 字段 |
| 10 | **Document Auth Admin** | Checkbox | - | - | Input | - | 左 (Left) | 未选中 | 活性 (Enabled) | - |
| 11 | **Document Auth Admin 对应 Market** | Pull-downList | - | - | Input | - | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 数据来源为 `MARKET_MASTER` 表的 `MARKET` 字段 |
| 12 | **User Admin** | Checkbox | - | - | Input | - | 左 (Left) | 未选中 | 活性 (Enabled) | - |
| 13 | **Adaptation user** | Checkbox | - | - | Input | - | 左 (Left) | 未选中 | 活性 (Enabled) | - |
| 14 | **Adaptation user 对应 Market** | Pull-downList | - | - | Input | - | 左 (Left) | `-EU-` | 活性 (Enabled) | 默认显示 `-EU-` |
| 15 | **Manage Variable List** | Checkbox | - | - | Input | - | 左 (Left) | 未选中 | 活性 (Enabled) | - |
| 16 | **Market Super User** | Pull-downList | - | - | Input | - | 左 (Left) | 空 (Empty) | 活性 (Enabled) | - |
| 17 | **Market Super User 对应 Market** | Pull-downList | - | - | Input | - | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 数据来源为 `MARKET_MASTER` 表的 `MARKET` 字段 |
| 18 | **Update Role** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 点击触发权限更新操作 |
| 19 | **Delete Role** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 点击触发权限删除操作 |

> **注**：
>
> - **半角英数字**：正则表达式 `[a-zA-Z0-9]`
> - **Pull-downList** 下拉列表的数据来源：Standard User 与 Adaptation user 的 Market 默认值为 `-EU-`；其余带 Market 的下拉列表数据来源于 `MARKET_MASTER` 表的 `MARKET` 字段。
> - **Market Super User** 为下拉列表选择控件，用于指定该用户作为超级用户所管辖的市场范围。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

所有校验逻辑在用户点击对应按钮时按序执行。

### 3.1 处理流程

#### 3.1.1 初始表示

画面正常表示，所有控件处于活性状态。Standard User 对应 Market 下拉列表默认显示 `-EU-`，Adaptation user 对应 Market 下拉列表默认显示 `-EU-`，其余下拉列表初始为空，所有复选框初始为未选中状态。

#### 3.1.2 触发条件：点击「User Info」按钮

1. **空值校验 (Frontend Check)**：
   - 获取 UserID 输入值，执行 `trim()` 去除首尾空格。
   - 若 `UserID` 为空：
     - 设置 `Message` = `UserID are required.`
     - **终止流程**，不调用 API。
2. **用户存在性校验 (Frontend Check)**：
   - 若输入的 UserID 不存在于系统中：
     - 设置 `Message` = `We didn't recognize the userid you entered. Please try again.`
     - **终止流程**，不调用 API。
3. **API 调用 (Backend Check)**：
   - 若前端校验通过，调用 `UD17HDocUserAdministrationApi.UD17Userinfo` 接口。
   - 该接口调用 Saviynt 的 AuthenticationApi 获取该 UserID 对应的 User 名。
   - 同时查询 `HDOC_FUNCTION_AUTH` 用户功能权限表获取该用户的已有功能权限。
   - 查询 `DOC_MARKET_AUTH` 用户市场权限表获取该用户的已有市场权限。
4. **结果处理**：
   - **成功**：
     - User 标签自动填充获取到的 User 名。
     - 各功能权限复选框根据获取的权限数据自动设置选中/未选中状态。
     - 对应市场下拉列表自动回显该用户的已配置市场权限信息。
   - **失败**：
     - 提示对应错误信息（如 `We didn't recognize the userid you entered. Please try again.`）。
     - 保留用户已输入的 UserID 内容，支持用户重新操作。

#### 3.1.3 触发条件：点击「Update Role」按钮

1. **空值校验 (Frontend Check)**：
   - 获取 UserID 输入值，执行 `trim()` 去除首尾空格。
   - 若 `UserID` 为空：
     - 设置 `Message` = `UserID are required.`
     - **终止流程**，不调用 API。
2. **用户存在性校验 (Frontend Check)**：
   - 若输入的 UserID 不存在于系统中：
     - 设置 `Message` = `We didn't recognize the userid you entered. Please try again.`
     - **终止流程**，不调用 API。
3. **API 调用 (Backend Check)**：
   - 若前端校验通过，调用 `UD17HDocUserAdministrationApi.UD17UpdateRole` 接口。
   - 传入当前画面中所有权限复选框的选中状态及对应 Market 下拉列表的选中值。
   - 更新 `HDOC_FUNCTION_AUTH` 表的用户功能权限。
   - 同步更新 `DOC_MARKET_AUTH` 表的用户市场权限。
4. **结果处理**：
   - **成功**：提示权限更新完成的成功消息，最新权限配置即时生效。
   - **失败**：提示对应错误信息，原有用户权限保持不变。

#### 3.1.4 触发条件：点击「Delete Role」按钮

1. **空值校验 (Frontend Check)**：
   - 获取 UserID 输入值，执行 `trim()` 去除首尾空格。
   - 若 `UserID` 为空：
     - 设置 `Message` = `UserID are required.`
     - **终止流程**，不调用 API。
2. **用户存在性校验 (Frontend Check)**：
   - 若输入的 UserID 不存在于系统中：
     - 设置 `Message` = `We didn't recognize the userid you entered. Please try again.`
     - **终止流程**，不调用 API。
3. **API 调用 (Backend Check)**：
   - 若前端校验通过，调用 `UD17HDocUserAdministrationApi.UD17DeleteRole` 接口。
   - 删除 `HDOC_FUNCTION_AUTH` 和 `DOC_MARKET_AUTH` 中该 UserID 对应的全部权限记录。
4. **结果处理**：
   - **成功**：提示权限删除完成的成功消息，该用户所有 HDOC 系统权限被清空。
   - **失败**：提示对应错误信息，原有用户权限保持不变。

### 3.2 校验详细规格表

| No. | 检查时机 | 检查对象 | 检查条件 | 错误消息 (Message Content) | 动作 |
| :-: | :------- | :------- | :------- | :------------------------- | :--- |
| 1 | 点击 User Info 按钮 | UserID | `UserID` 为空（`null` 或 `trim() == ""`） | `UserID are required.` | 展示错误提示，终止当前用户信息查询流程 |
| 2 | 点击 User Info 按钮 | UserID | 输入的用户 ID 在系统中不存在（API 返回 404） | `We didn't recognize the userid you entered. Please try again.` | 展示错误提示，终止当前用户信息查询流程 |
| 3 | 点击 Update Role 按钮 | UserID | `UserID` 为空（`null` 或 `trim() == ""`） | `UserID are required.` | 展示错误提示，终止当前权限更新流程 |
| 4 | 点击 Update Role 按钮 | UserID | 输入的用户 ID 在系统中不存在（API 返回 400） | `We didn't recognize the userid you entered. Please try again.` | 展示错误提示，终止当前权限更新流程 |
| 5 | 点击 Delete Role 按钮 | UserID | `UserID` 为空（`null` 或 `trim() == ""`） | `UserID are required.` | 展示错误提示，终止当前权限删除流程 |
| 6 | 点击 Delete Role 按钮 | UserID | 输入的用户 ID 在系统中不存在（API 返回 400） | `We didn't recognize the userid you entered. Please try again.` | 展示错误提示，终止当前权限删除流程 |

## 4. 接口定义 (API Specification)

### 4.1 UD17HDocUserAdministrationApi.UD17Userinfo

- **功能**：根据输入的 UserID 从 Saviynt 获取对应用户名，同时查询该用户已配置的功能权限和市场权限。
- **Method**: `GET`
- **Endpoint**: `/api/ud017/UD17HDocUserAdministrationApi/UD17Userinfo`

#### Request Body

```json
{
  "user_id": "string (Max 10, Alphanumeric)"
}
```

##### 请求示例

```json
{
  "user_id": "U0012345678"
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": {
    "userId": "user123",
    "userName": "John Doe",
    "permissions": {
      "standardUser": { "enabled": true, "market": "-EU" },
      "ruleAdmin": { "enabled": false, "market": null },
      "templateAdmin": { "enabled": true, "market": "JPN" },
      "documentAuthAdmin": { "enabled": false, "market": null },
      "userAdmin": { "enabled": false, "market": null },
      "adaptationUser": { "enabled": false, "market": null },
      "manageVariableList": { "enabled": false, "market": null },
      "showChangeVariantsFields": { "enabled": false, "market": null },
      "marketSuperUser": { "enabled": false, "market": null }
    }
  },
  "message": null
}
```

#### Response Error (404/500)

```json
{
  "code": 404,
  "data": null,
  "message": "We didn't recognize the userid you entered. Please try again."
}
```

### 4.2 UD17HDocUserAdministrationApi.UD17UpdateRole

- **功能**：根据传入的 UserID 更新对应用户的功能权限与市场权限配置。
- **Method**: `PUT`
- **Endpoint**: `/api/ud017/UD17HDocUserAdministrationApi/UD17UpdateRole`

#### Request Body

```json
{
  "user_id": "string (Max 10)",
  "permissions": {
    "standardUser": { "enabled": true, "market": "string or null" },
    "ruleAdmin": { "enabled": true, "market": "string or null" },
    "templateAdmin": { "enabled": true, "market": "string or null" },
    "documentAuthAdmin": { "enabled": true, "market": "string or null" },
    "userAdmin": { "enabled": true, "market": null },
    "adaptationUser": { "enabled": true, "market": "string or null" },
    "manageVariableList": { "enabled": true, "market": null },
    "showChangeVariantsFields": { "enabled": true, "market": null },
    "marketSuperUser": { "enabled": true, "market": "string or null" }
  }
}
```

##### 请求示例

```json
{
  "user_id": "U0012345678",
  "permissions": {
    "standardUser": { "enabled": true, "market": "-EU" },
    "ruleAdmin": { "enabled": false, "market": null },
    "templateAdmin": { "enabled": true, "market": "JPN" },
    "documentAuthAdmin": { "enabled": false, "market": null },
    "userAdmin": { "enabled": false, "market": null },
    "adaptationUser": { "enabled": false, "market": null },
    "manageVariableList": { "enabled": false, "market": null },
    "showChangeVariantsFields": { "enabled": false, "market": null },
    "marketSuperUser": { "enabled": false, "market": null }
  }
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": null,
  "message": "Role updated successfully."
}
```

#### Response Error (400)

```json
{
  "code": 400,
  "data": null,
  "message": "We didn't recognize the userid you entered. Please try again."
}
```

### 4.3 UD17HDocUserAdministrationApi.UD17DeleteRole

- **功能**：根据传入的 UserID 删除该用户对应的全部功能权限与市场权限记录。
- **Method**: `DELETE`
- **Endpoint**: `/api/ud017/UD17HDocUserAdministrationApi/UD17DeleteRole`

#### Request Body

```json
{
  "user_id": "string (Max 10, Alphanumeric)"
}
```

##### 请求示例

```json
{
  "user_id": "U0012345678"
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": null,
  "message": "Role deleted successfully."
}
```

#### Response Error (400)

```json
{
  "code": 400,
  "data": null,
  "message": "We didn't recognize the userid you entered. Please try again."
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
   - 使用 React State 管理 `userID`、`userName`、`message`、`isLoading`。
   - 各权限复选框与对应的 Market 下拉列表使用独立的状态管理，便于单独更新和读取。
   - `Message` 区域默认隐藏（内容为空时不予显示）。

2. **输入限制**：
   - UserID：通过正则 `/^[a-zA-Z0-9]*$/` 控制仅允许半角英数字输入，最大长度 10 字符。
   - 输入时自动去除首尾空格（`trim()`）。

3. **控件联动逻辑**：
   - **Standard User** 复选框选中时，对应的 Market 下拉列表保持活性；取消选中时，Market 下拉列表可置为禁用或清空状态。
   - **Adaptation user** 复选框同样与对应 Market 下拉列表联动。
   - 各权限复选框与市场下拉列表的活性状态可独立控制，但建议选中复选框时激活对应 Market 下拉列表。
   - **Market Super User** 为独立的下拉选择控件，不依赖复选框选中状态。

4. **下拉列表数据源**：
   - Standard User 与 Adaptation user 的 Market 下拉列表默认值固定为 `-EU-`。
   - Rule Admin、Template Admin、Document Auth Admin、Market Super User 对应的 Market 下拉列表数据均从 `MARKET_MASTER` 表的 `MARKET` 字段动态读取。

5. **UI 细节**：
   - User Info、Update Role、Delete Role 按钮在 `isLoading` 期间应设为 `disabled` 状态，防止重复提交。
   - `Message` 文字颜色使用红色（`#ff4d4f`）以起到警示作用。
   - 成功消息使用绿色（`#52c41a`）以与错误消息区分。

6. **流程安全性**：
   - 每次点击 User Info 按钮时重新获取用户权限信息，覆盖上一次的显示结果。
   - Update Role 操作仅更新当前画面中可见的权限配置项，不影响未展示或未变更的权限记录。
   - Delete Role 操作需谨慎处理，建议在点击后增加确认弹窗，防止误操作导致用户权限被清空。
