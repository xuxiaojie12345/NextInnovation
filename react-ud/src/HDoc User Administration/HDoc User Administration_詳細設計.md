# HDoc用户管理模块 (HDoc User Administration Module) 详细设计说明书

| 文档编号     | DES-USER-AUTH-008         | 版本号     | v1.0       |
| :----------- | :-------------------- | :--------- | :--------- |
| **模块名称** | HDoc用户权限管理 (HDoc User Administration) | **作成日** | 2023-10-XX |
| **作成者**   | Lingma Assistant      | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块是系统的核心权限管理中心，用于配置和管理用户在 HDoc 系统中的各项功能权限及 Market 访问权限。管理员通过输入 UserID 查询用户信息，并为其分配不同的角色（如 Standard User, Rule Admin 等）以及对应的 Market 范围。

- **目标**：实现细粒度的用户权限控制，确保用户只能访问其被授权的功能和市场数据。
- **核心功能**：支持从 Saviynt 系统同步用户名，配置 9 种不同的业务角色及其关联的 Market，并提供批量更新和删除权限的功能。
- **安全性**：所有权限变更需实时写入 `DOC_MARKET_AUTH` 和 `HDOC_FUNCTION_AUTH` 表。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item) | 種別 (Type) | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars)          | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                    |
| :------------ | :---------- | :--------: | :-------: | :----: | :-------------------------------- | :--------------: | :--------------: | :----------------: | :---------------------- |
| **UserID**    | TextField   |     Y      |    10     | Input  | 半角英数字                        |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 检索关键字              |
| **User Info** | Button      |     -      |     -     | Action | -                                 |   中 (Center)    |        -         |   活性 (Enabled)   | 触发用户信息查询        |
| **User**      | Label       |     -      |     -     | Output | 任意可见字符                      |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 显示从 Saviynt 获取的用户名 |
| **Standard User** | Checkbox | N | - | Input | Boolean | 左 (Left) | Unchecked | 活性 (Enabled) | 选中后激活关联的 Market 下拉框 |
| **Market (Std)** | DropDownList | N | - | Input | 来自 MARKET_MASTER | 左 (Left) | `-EU` | 活性 (Enabled) | 默认显示 -EU |
| **Rule Admin** | Checkbox | N | - | Input | Boolean | 左 (Left) | Unchecked | 活性 (Enabled) | - |
| **Market (Rule)** | DropDownList | N | - | Input | 来自 MARKET_MASTER | 左 (Left) | 空 | 活性 (Enabled) | - |
| **Template Admin** | Checkbox | N | - | Input | Boolean | 左 (Left) | Unchecked | 活性 (Enabled) | - |
| **Market (Temp)** | DropDownList | N | - | Input | 来自 MARKET_MASTER | 左 (Left) | 空 | 活性 (Enabled) | - |
| **Document Auth Admin** | Checkbox | N | - | Input | Boolean | 左 (Left) | Unchecked | 活性 (Enabled) | - |
| **Market (Doc)** | DropDownList | N | - | Input | 来自 MARKET_MASTER | 左 (Left) | 空 | 活性 (Enabled) | - |
| **User Admin** | Checkbox | N | - | Input | Boolean | 左 (Left) | Unchecked | 活性 (Enabled) | - |
| **Adaptation user** | Checkbox | N | - | Input | Boolean | 左 (Left) | Unchecked | 活性 (Enabled) | - |
| **Market (Adapt)** | DropDownList | N | - | Input | - | 左 (Left) | `-EU` | 活性 (Enabled) | 默认显示 -EU |
| **Manage Variable List** | Checkbox | N | - | Input | Boolean | 左 (Left) | Unchecked | 活性 (Enabled) | - |
| **Show change variants fields** | Checkbox | N | - | Input | Boolean | 左 (Left) | Unchecked | 活性 (Enabled) | - |
| **Market Super User** | DropDownList | N | - | Input | 来自 MARKET_MASTER | 左 (Left) | 空 | 活性 (Enabled) | - |
| **Update Role** | Button | N | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 保存权限配置 |
| **Delete Role** | Button | N | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 清空该用户所有权限 |

> **注**：
> - **角色与 Market 联动**：每个带有 Market 下拉框的角色（Checkbox），在选中时应允许选择特定的 Market 范围。
> - **默认值**：`Standard User` 和 `Adaptation user` 的 Market 默认值为 `-EU`。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

1.  **User Info 按钮点击**：
    - 获取输入的 `UserID`。
    - 调用 `AuthenticationApi` 或 Saviynt 接口查询用户是否存在。
    - 若存在，填充 `User` Label，并从 `HDOC_FUNCTION_AUTH` 和 `DOC_MARKET_AUTH` 加载当前权限状态到 Checkbox 和 DropDownList。
    - 若不存在，报错 `We didn't recognize the userid you entered...`。
2.  **Update Role 按钮点击**：
    - 校验 `UserID` 是否有效。
    - 收集所有选中的 Checkbox 及其对应的 Market 值。
    - 调用更新 API，同步更新 `DOC_MARKET_AUTH` 和 `HDOC_FUNCTION_AUTH` 表。
    - 成功后提示 `Role updated successfully.`。
3.  **Delete Role 按钮点击**：
    - 弹出确认框：`Are you sure you want to delete all roles for this user?`。
    - 确认后调用删除 API，清除该用户在两个权限表中的所有记录。
    - 重置页面上的所有 Checkbox 和 DropDownList。

### 3.2 校验详细规格表

| No. |   检查时机   |     检查对象      |                检查条件                |                          错误消息 (Message Content)                           |                 动作                 |
| :-: | :----------: | :---------------: | :------------------------------------: | :---------------------------------------------------------------------------: | :----------------------------------: |
|  1  | Click User Info | UserID          | `Saviynt.Count(UserID) == 0`           |                     `We didn't recognize the userid you entered. Please try again.`                     | 显示 Error Message，不加载数据 |
|  2  | Click Update | UserID            | `DB.Count(UserID) == 0`                |                     `We didn't recognize the userid you entered. Please try again.`                     | 显示 Error Message，终止提交 |

## 4. 接口定义 (API Specification)

### 4.1 GetUserInfoApi

- **功能**：从 Saviynt 获取用户基本信息。
- **Method**: `GET`
- **Endpoint**: `/api/admin/users/{userID}`

### 4.2 GetUserRolesApi

- **功能**：获取用户当前的权限配置。
- **Method**: `GET`
- **Endpoint**: `/api/admin/users/{userID}/roles`

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": {
    "userName": "John Doe",
    "roles": [
      { "roleName": "Standard User", "market": "-EU" },
      { "roleName": "Rule Admin", "market": "JPN" }
    ]
  },
  "message": "success"
}
```

### 4.3 UpdateUserRolesApi

- **功能**：更新用户权限。
- **Method**: `PUT`
- **Endpoint**: `/api/admin/users/{userID}/roles`

#### Request Body

```json
{
  "roles": [
    { "roleName": "Standard User", "market": "-EU" },
    { "roleName": "Template Admin", "market": "USA" }
  ]
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **Saviynt 连接失败**     | 捕获 Network Error | `Failed to connect to Saviynt system.`         |
| **服务器内部错误 (500)** | 捕获 Server Error  | `System error. Please contact administrator.`  |
| **权限冲突**             | 后端校验失败       | `Invalid role combination.`                   |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 管理 `userID`, `userName`, `rolesState`（一个包含所有角色和对应 Market 的对象）。
    - 建议使用 `useReducer` 或复杂的 State 对象来管理 9 个角色及其关联的 Market 状态。
2.  **UI 细节**：
    - 页面布局建议采用两列或三列布局，将角色 Checkbox 与其对应的 Market 下拉框成对排列，以保持界面整洁。
    - `Delete Role` 按钮建议使用红色警示样式。
    - 当 Checkbox 未选中时，其对应的 Market 下拉框应设为 `disabled` 状态，以防止无效数据提交。
3.  **数据一致性**：
    - 更新操作应作为事务处理，确保 `DOC_MARKET_AUTH` 和 `HDOC_FUNCTION_AUTH` 两张表的数据同时成功或同时回滚。