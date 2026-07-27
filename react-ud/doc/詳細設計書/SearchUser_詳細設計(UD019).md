# Search User 模块详细设计说明书

| 文档编号     | DES-Search User-019  | 版本号     | v1.0       |
| :----------- | :------------------- | :--------- | :--------- |
| **模块名称** | Search User          | **作成日** | 2026-07-22 |
| **作成者**   | GitHub Copilot       | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块是 HDOC 系统的用户检索画面，核心功能是实现 Search HDoc User 画面的用户检索能力。支持通过 UserID、User 名称、Market 权限、功能权限等多种条件查询 HDoc 系统内的用户信息，覆盖精准用户查找、全量用户遍历、特定权限用户筛选等多种使用场景，最终在 Search HDoc User 检索结果画面展示对应的用户信息与检索结果总记录数，完成 HDoc 系统的用户查询需求。

- **目標**：实现 HDOC 系统内用户的多维度检索能力，支持用户按不同条件灵活查找系统用户信息并查看检索结果。
- **安全性**：
  - 所有用户身份核心数据必须对接官方认证数据源 Saviynt 获取权威结果。
  - 用户功能权限、Market 权限等敏感数据从专属的业务权限表读取，全程保障用户敏感信息来源合规、数据准确，避免非法篡改或错误数据流出。
- **用户体验**：
  - 所有检索相关的输入、操作控件默认处于激活可操作状态，无需用户额外解锁即可直接输入检索条件。
  - 提供多种检索模式自由切换（Not set / Rule / Template），适配不同用户的查询习惯，简化查询操作流程。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| No. | 项目名 (Item) | 种类 (Type) | 必须 (Req) | MaxLength | I/O | 允许字符 (Allowed Chars) | 字符对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注 |
| :-: | :------------ | :---------- | :--------: | :-------: | :-: | :----------------------- | :--------------: | :--------------: | :----------------: | :--- |
| 1 | **Userid** | TextField | - | 10 | Input | 半角英数字 (`a-z, A-Z, 0-9`) | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 搜索条件 |
| 2 | **User** | TextField | - | 32 | Input | 半角英数字 (`a-z, A-Z, 0-9`) | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 搜索条件 |
| 3 | **Market** | Pull-downList | - | - | Input | - | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 搜索条件，数据来源为 `MARKET_MASTER` 表的 `MARKET` 字段 |
| 4 | **Not set** | RadioBox | - | - | Input | - | 左 (Left) | 未选中 | 活性 (Enabled) | 搜索条件，遍历全量用户 |
| 5 | **Rule** | RadioBox | - | - | Input | - | 左 (Left) | 未选中 | 活性 (Enabled) | 搜索条件，筛选 Rule Admin 权限用户 |
| 6 | **Template** | RadioBox | - | - | Input | - | 左 (Left) | 未选中 | 活性 (Enabled) | 搜索条件，筛选 Template Admin 权限用户 |
| 7 | **Search** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 检索触发按钮 |
| 8 | **Userid** | DataTable | - | - | Output | - | 左 (Left) | - | - | 搜索结果展示项，数据来源为 Saviynt 的 Userid 字段 |
| 9 | **User** | DataTable | - | - | Output | - | 左 (Left) | - | - | 搜索结果展示项，数据来源为 Saviynt 的 User 字段 |
| 10 | **Market** | DataTable | - | - | Output | - | 左 (Left) | - | - | 搜索结果展示项，数据来源为 `MARKET_MASTER` 的 `MARKET` 字段 |
| 11 | **COUNT** | DataTable | - | - | Output | - | 左 (Left) | - | - | 显示搜索结果的记录数 |

> **注**：
>
> - **半角英数字**：正则表达式 `[a-zA-Z0-9]`
> - **Market** 下拉列表的数据来源于 `MARKET_MASTER` 表的 `MARKET` 字段。
> - **Not set** / **Rule** / **Template** 为 RadioBox 单选按钮组，同一时刻仅可选中一项。
> - DataTable 的 **Userid**、**User**、**Market**、**COUNT** 列为搜索结果展示区域，仅在检索完成后显示数据。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

所有校验逻辑在用户点击 **Search** 按钮时按序执行。

### 3.1 处理流程

#### 3.1.1 初始表示

画面正常表示，所有输入控件（Userid、User、Market 下拉列表、Not set / Rule / Template 单选按钮组、Search 按钮）均处于活性状态。检索结果 DataTable 区域初始为空，COUNT 显示为 0。

#### 3.1.2 触发条件：点击「Search」按钮触发检索

1. **字符校验 (Frontend Check)**：
   - 获取 Userid 和 User 输入值，执行 `trim()` 去除首尾空格。
   - 若 Userid 输入内容包含非半角英数字的非法字符：
     - 设置 `Message` = `Userid must be a half width English numeral.`
     - **终止流程**，光标自动定位到 Userid 输入框。
   - 若 User 输入内容包含非半角英数字的非法字符：
     - 设置 `Message` = `User must be a half width English numeral.`
     - **终止流程**，光标自动定位到 User 输入框。

2. **API 调用 (Backend Check)**：
   - 根据不同检索条件，调用 `UD19SearchResultListApi.UD19SearchHdoc` 接口执行检索。
   - 调用 `HDOC_FUNCTION_AUTH` 获取用户功能权限信息。
   - 调用 `HDOC_MARKET_AUTH` 获取用户 Market 权限信息。
   - 调用 `MARKET_MASTER` 获取 Market 主数据。

3. **结果处理**：
   - **按 Userid 检索**：
     - 从 Saviynt 获取对应用户名。
     - 通过 Userid 从用户 Market 权限表获取对应的 Market 信息。
     - 返回匹配的用户结果列表。
   - **按 User 检索**：
     - 从 Saviynt 获取对应用户的 Userid。
     - 再通过 Userid 从用户 Market 权限表获取对应的 Market 信息。
     - 返回匹配的用户结果列表。
   - **勾选 Not set 检索**：
     - 遍历查询系统内全部用户的相关信息并返回全量结果。
   - **勾选 Rule 检索**：
     - 筛选所有持有 Rule Admin 权限的用户并返回结果。
   - **勾选 Template 检索**：
     - 筛选所有持有 Template Admin 权限的用户并返回结果。
   - **成功**：
     - 展示 Search HDoc User 检索结果画面。
     - DataTable 区域输出匹配的用户列表（Userid、User、Market）。
     - COUNT 字段显示检索结果的总记录数。
   - **失败**：
     - 返回对应错误提示信息，终止检索流程。
     - 原有检索结果保持不变。

### 3.2 校验详细规格表

| No. | 检查时机 | 检查对象 | 检查条件 | 错误消息 (Message Content) | 动作 |
| :-: | :------- | :------- | :------- | :------------------------- | :--- |
| 1 | 点击 Search 按钮时 | Userid 输入框 | 输入内容包含非半角英数字字符 | `Userid must be a half width English numeral.` | 终止检索流程，光标自动定位到 Userid 输入框 |
| 2 | 点击 Search 按钮时 | User 输入框 | 输入内容包含非半角英数字字符 | `User must be a half width English numeral.` | 终止检索流程，光标自动定位到 User 输入框 |

## 4. 接口定义 (API Specification)

### 4.1 UD19SearchResultListApi.UD19SearchHdoc

- **功能**：根据输入的 Userid 或 User 名称获取对应用户情报，支持按 Userid、User 名称、Not set（全量）、Rule（Rule Admin 权限筛选）、Template（Template Admin 权限筛选）等多种方式检索。
- **Method**: `GET`
- **Endpoint**: `/api/ud19/UD19SearchResultListApi/UD19SearchHdoc`

#### Request Body

```json
{
  "userid": "string (Max 10, Alphanumeric)",
  "username": "string (Max 32, Alphanumeric)"
}
```

##### 请求示例

```json
{
  "userid": "U123456789",
  "username": "DemoUser"
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": {
    "userid": "U123456789",
    "user": "JOIN QIAO",
    "market": "EU",
    "count": "10"
  }
}
```

### 4.2 UD19SearchResultListApi.UD19SelectMarketMaster

- **功能**：获取 Market 主数据一览，供 Market 下拉列表使用。
- **Method**: `GET`
- **Endpoint**: `/api/ud19/UD19SearchResultListApi/UD19SelectMarketMaster`

#### Request Body

```json
{}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": ["CN", "JP", "US", "EU"]
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
   - 使用 React State 管理 `userid`、`user`、`market`、`searchMode`（Not set / Rule / Template）、`searchResults`（DataTable 数据）、`count`、`message`、`isLoading`。
   - `Message` 区域默认隐藏（内容为空时不予显示）。
   - DataTable 的检索结果初始为空数组，COUNT 初始为 0。

2. **输入限制**：
   - Userid：通过正则 `/^[a-zA-Z0-9]*$/` 控制仅允许半角英数字输入，最大长度 10 字符。
   - User：通过正则 `/^[a-zA-Z0-9\s]*$/` 控制仅允许半角英数字输入（含空格），最大长度 32 字符。
   - 输入时自动去除首尾空格（`trim()`）。

3. **检索模式切换**：
   - Not set / Rule / Template 为 RadioBox 单选按钮组，同一时刻仅可选中一项。
   - 选中 Not set 时：遍历查询系统内全部用户，返回全量结果。
   - 选中 Rule 时：筛选所有持有 Rule Admin 权限的用户。
   - 选中 Template 时：筛选所有持有 Template Admin 权限的用户。
   - 未选中任何 RadioBox 时，默认根据 Userid / User 输入内容执行精确或模糊检索。

4. **Market 下拉列表**：
   - 画面加载时调用 `UD19SelectMarketMaster` 接口获取 Market 主数据列表并填充下拉选项。
   - 选择 Market 后，检索结果将按所选 Market 进行过滤。

5. **UI 细节**：
   - Search 按钮在 `isLoading` 期间应设为 `disabled` 状态，防止重复提交。
   - `Message` 文字颜色使用红色（`#ff4d4f`）以起到警示作用。
   - DataTable 区域在无检索结果时显示空表格或"无数据"提示。
   - COUNT 字段显示检索结果的总记录数，当无结果时显示 0。

6. **数据源说明**：
   - Userid 和 User 数据来源于 Saviynt 认证数据源。
   - Market 数据来源于 `MARKET_MASTER` 主表。
   - 功能权限数据来源于 `HDOC_FUNCTION_AUTH` 表。
   - Market 权限数据来源于 `HDOC_MARKET_AUTH` 表。
