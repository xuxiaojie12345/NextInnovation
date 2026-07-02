# 搜索用户模块 (Search User Module) 详细设计说明书

| 文档编号     | DES-SEARCH-USER-UD19       | 版本号     | v1.0       |
| :----------- | :------------------------- | :--------- | :--------- |
| **模块名称** | Search User                | **作成日** | 2022-11-30 |
| **作成者**   | UD 刘                      | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于搜索HDoc系统的用户信息。用户可以通过输入UserID、User名称、选择Market或勾选特定权限类型（Not set、Rule、Template）来搜索用户。搜索结果将显示用户的UserID、User名称和Market信息，并显示检索结果的记录数。

- **目标**：提供灵活的用户搜索功能，支持多种搜索条件和权限过滤。
- **安全性**：所有数据从Saviynt系统和用户权限表中获取；支持按权限类型过滤搜索结果。
- **用户体验**：提供清晰的搜索条件输入区，支持组合搜索；结果显示包含COUNT统计，便于用户了解搜索范围。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

#### 2.1.1 搜索条件区域

| 項目名 (Item)      | 種別 (Type)    | 必須 (Req) | MaxLength |   I/O    | 許容文字 (Allowed Chars)      | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                                               |
| :----------------- | :------------- | :--------: | :-------: | :------: | :---------------------------- | :--------------: | :--------------: | :----------------: | :------------------------------------------------- |
| **Userid**         | TextField      |     -      |    10     | Input    | 半角英数字                    |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 检索条件，输入用户ID                               |
| **User**           | TextField      |     -      |    32     | Input    | 半角英数字                    |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 检索条件，输入用户名                               |
| **Market**         | Dropdown       |     -      |     -     | Input    | -                             |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 检索条件，来自MARKET_MASTER.MARKET                 |
| **Not set**        | RadioButton    |     -      |     -     | Input    | -                             |    左 (Left)     | 未选中           |   活性 (Enabled)   | 检索条件，搜索所有用户                             |
| **Rule**           | RadioButton    |     -      |     -     | Input    | -                             |    左 (Left)     | 未选中           |   活性 (Enabled)   | 检索条件，搜索拥有Rule Admin权限的用户             |
| **Template**       | RadioButton    |     -      |     -     | Input    | -                             |    左 (Left)     | 未选中           |   活性 (Enabled)   | 检索条件，搜索拥有Template Admin权限的用户         |
| **Search**         | Button         |     -      |     -     | Action   | -                             |   中 (Center)    |        -         |   活性 (Enabled)   | 执行搜索操作                                       |

#### 2.1.2 检索结果区域

| 項目名 (Item)      | 種別 (Type)    | 必須 (Req) | MaxLength |   I/O    | 許容文字 (Allowed Chars)      | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                                               |
| :----------------- | :------------- | :--------: | :-------: | :------: | :---------------------------- | :--------------: | :--------------: | :----------------: | :------------------------------------------------- |
| **Userid**         | DataTable Column |   -      |     -     | Output   | -                             |    左 (Left)     | -                | -                  | 来自Saviynt.Userid                                 |
| **User**           | DataTable Column |   -      |     -     | Output   | -                             |    左 (Left)     | -                | -                  | 来自Saviynt.User                                   |
| **Market**         | DataTable Column |   -      |     -     | Output   | -                             |    左 (Left)     | -                | -                  | 来自MARKET_MASTER.MARKET                           |
| **COUNT**          | Label          |     -      |     -     | Output   | -                             |    左 (Left)     | 0                | -                  | 显示检索结果的记录数                               |

> **注**：
> - **搜索逻辑**：
>   1. 输入Userid点击Search：从Saviynt获取User名称，从用户Market权限表获取Market
>   2. 输入User点击Search：先从Saviynt获取Userid，然后根据Userid从用户Market权限表获取Market
>   3. 勾选Not set点击Search：搜索所有用户
>   4. 勾选Rule点击Search：搜索拥有Rule Admin权限的用户
>   5. 勾选Template点击Search：搜索拥有Template Admin权限的用户
> - **RadioButton互斥**：Not set、Rule、Template三个单选按钮为互斥关系，只能选择一个

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

#### 3.1.1 页面初始化流程

1.  **开始**：页面加载事件触发。
2.  **API 调用**：
    - 调用 `GetMarketListApi()` 获取Market下拉列表数据。
3.  **结果处理**：
    - **成功**：填充Market下拉列表选项。
    - **失败**：显示错误消息。

#### 3.1.2 Search操作流程

1.  **开始**：用户输入搜索条件后点击 Search 按钮。
2.  **前置处理**：获取所有搜索条件的值（Userid、User、Market、RadioButton选择）。
3.  **搜索条件校验 (Frontend Check)**：
    - 若同时输入了Userid和User：
      - 设置 Message = `Please enter either Userid or User, not both.`
      - **终止**流程。
    - 若选择了多个RadioButton：
      - 设置 Message = `Please select only one permission type.`
      - **终止**流程。
4.  **API 调用 (Backend Check)**：
    - 调用 `SearchUsersApi(searchCriteria)` 执行搜索操作。
    - API内部逻辑：
      1. 若输入Userid：从Saviynt获取User，从HDOC_MARKET_AUTH获取Market
      2. 若输入User：从Saviynt获取Userid，从HDOC_MARKET_AUTH获取Market
      3. 若选择Not set：搜索所有用户
      4. 若选择Rule：从HDOC_FUNCTION_AUTH筛选拥有Rule Admin权限的用户
      5. 若选择Template：从HDOC_FUNCTION_AUTH筛选拥有Template Admin权限的用户
5.  **结果处理**：
    - **成功**：将搜索结果填充到DataTable中，更新COUNT值。
    - **失败**：若无数据：显示 `No users found matching the search criteria.`；若其他错误：显示具体错误消息。

### 3.2 校验详细规格表

| No. |   检查时机   |       检查对象       |                  检查条件                   |                          错误消息 (Message Content)                           |    错误级别    |                 动作                 |
| :-: | :----------: | :------------------: | :-----------------------------------------: | :---------------------------------------------------------------------------: | :------------: | :----------------------------------: |
|  1  | Click Search | Userid和User          | 两者同时不为空                              |                     `Please enter either Userid or User, not both.`                     |     Error      | 显示错误消息，终止操作 |
|  2  | Click Search | RadioButton选择      | 多个RadioButton被选中                       |                     `Please select only one permission type.`                     |     Error      | 显示错误消息，终止操作 |
|  3  |  API 响应   | 搜索结果              |      无匹配的用户                           |                     `No users found matching the search criteria.`                     |     Error      | 显示错误消息，清空DataTable |

## 4. 接口定义 (API Specification)

### 4.1 GetMarketListApi

- **功能**：获取Market下拉列表数据。
- **Method**: `GET`
- **Endpoint**: `/api/ud19/getmarketlist`

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "获取Market列表成功",
  "data": [
    { "market": "EU", "description": "Europe" },
    { "market": "US", "description": "United States" }
  ]
}
```

### 4.2 SearchUsersApi

- **功能**：搜索用户信息。
- **Method**: `POST`
- **Endpoint**: `/api/ud19/searchusers`

#### Request Body

```json
{
  "userId": "user001",
  "userName": "John Doe",
  "market": "EU",
  "permissionType": "rule"
}
```

##### 请求字段说明

| 字段名         | 类型   | 说明                                                                              |
| :------------- | :----- | :-------------------------------------------------------------------------------- |
| userId         | String | 用户ID，最大10字符，半角英数字                                                    |
| userName       | String | 用户名，最大32字符，半角英数字                                                    |
| market         | String | 市场代码                                                                          |
| permissionType | String | 权限类型："notset"、"rule"、"template" 或 null                                    |

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "搜索成功",
  "data": {
    "count": 5,
    "users": [
      {
        "userId": "user001",
        "userName": "John Doe",
        "market": "EU"
      },
      {
        "userId": "user002",
        "userName": "Jane Smith",
        "market": "US"
      }
    ]
  }
}
```

##### 响应字段说明

| 字段名   | 类型   | 说明                                                                              |
| :------- | :----- | :-------------------------------------------------------------------------------- |
| count    | Number | 检索结果的记录数                                                                  |
| users    | Array  | 用户列表                                                                          |
| ├─ userId  | String | 用户ID，来自Saviynt                                                               |
| ─ userName | String | 用户名，来自Saviynt                                                               |
| ─ market   | String | 市场代码，来自MARKET_MASTER                                                       |

#### Response Error (400/500)

```json
{
  "success": false,
  "message": "No users found matching the search criteria.",
  "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **同时输入Userid和User** | 前端校验拦截       | `Please enter either Userid or User, not both.` |
| **选择多个RadioButton**  | 前端校验拦截       | `Please select only one permission type.`      |
| **无匹配用户**           | API返回400错误     | `No users found matching the search criteria.` |
| **Saviynt连接失败**      | API返回500错误     | `Failed to connect to Saviynt system.`         |
| **数据库连接异常**       | API返回500错误     | `System error. Please contact administrator.`  |
| **API超时**              | 前端捕获超时异常   | `Request timeout. Please try again later.`     |
| **网络异常**             | 前端捕获网络异常   | `Network connection failed. Please check your network settings.` |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 管理 `userId`, `userName`, `market`, `permissionType`, `searchResults`, `count`, `errorMessage`, `isLoading`。
    - permissionType存储选中的RadioButton值（"notset"、"rule"、"template" 或 null）。
    - searchResults为数组，存储搜索结果的用户列表。
2.  **安全性**：
    - API 请求必须携带有效的认证Token。
    - Saviynt系统调用需确保网络连接安全。
3.  **UI 细节**：
    - Userid和User输入框应支持自动去除首尾空格。
    - Market下拉列表支持搜索过滤。
    - Not set、Rule、Template三个RadioButton应设置为互斥关系（使用相同的name属性）。
    - Search按钮在 `isLoading` 期间应设为 `disabled`，防止重复提交。
    - COUNT标签应动态更新，显示当前搜索结果的记录数。
    - `Message` 文字颜色建议使用红色 (`#ff4d4f` 或 `#c62828`) 以起到警示作用。
4.  **性能优化**：
    - Market列表可在页面加载时一次性获取并缓存。
    - 搜索结果可添加分页功能，避免一次性加载大量数据。
5.  **搜索逻辑实现**：
    - 后端需实现以下搜索逻辑：
      ```javascript
      // 伪代码示例
      if (userId) {
        // 从Saviynt获取userName
        userName = getSaviyntUserName(userId);
        // 从HDOC_MARKET_AUTH获取market
        market = getMarketFromAuth(userId);
      } else if (userName) {
        // 从Saviynt获取userId
        userId = getSaviyntUserId(userName);
        // 从HDOC_MARKET_AUTH获取market
        market = getMarketFromAuth(userId);
      } else if (permissionType === 'notset') {
        // 搜索所有用户
        users = getAllUsers();
      } else if (permissionType === 'rule') {
        // 从HDOC_FUNCTION_AUTH筛选Rule Admin权限的用户
        users = getUsersWithPermission('RULE_ADMIN');
      } else if (permissionType === 'template') {
        // 从HDOC_FUNCTION_AUTH筛选Template Admin权限的用户
        users = getUsersWithPermission('TEMPLATE_ADMIN');
      }
      ```

---
