# 更新用户定义变量模块 (Homologation Variables Module) 详细设计说明书

| 文档编号     | DES-HOMOLOGATION-VAR-UD08   | 版本号     | v1.0       |
| :----------- | :-------------------------- | :--------- | :--------- |
| **模块名称** | Homologation Variables      | **作成日** | 2022-11-24 |
| **作成者**   | UD 刘                       | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于管理HDoc系统的用户定义变量规则（User Defined Rules）。用户可以检索、新增、更新和删除规则记录。该功能主要用于维护产品类别、市场与变量之间的映射关系，支持文档生成时的动态变量替换。

- **目标**：提供完整的CRUD操作界面，支持用户定义规则的增删改查。
- **安全性**：所有操作需校验主键唯一性和变量存在性；Add/Update/Delete操作必须填写Product class、Number、Market三个必填字段。
- **用户体验**：提供清晰的检索条件输入区，支持一键清空；操作结果通过错误消息即时反馈。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item)          | 種別 (Type)    | 必須 (Req) | MaxLength |   I/O    | 許容文字 (Allowed Chars)      | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                                               |
| :--------------------- | :------------- | :--------: | :-------: | :------: | :---------------------------- | :--------------: | :--------------: | :----------------: | :------------------------------------------------- |
| **Product class**      | Dropdown       |     Y      |     2     | Input/Output | 半角英数字+符号               |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | Add/Update/Delete时必须，数据源：PRODUCT_CLASS_MASTER.PC |
| **Number**             | TextField      |     Y      |    10     | Input/Output | 半角数字                      |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | Add/Update/Delete时必须                            |
| **Market**             | Dropdown       |     Y      |     3     | Input/Output | 半角英数字+符号               |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | Add/Update/Delete时必须，数据源：MARKET_MASTER.MARKET |
| **Variable**           | TextField      |     -      |    20     | Input/Output | 半角英数字+符号               |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 若输入内容为'TEMPLATE-XXX'，则去掉前缀后检查是否存在于HDOC_VARIABLES |
| **Value**              | TextField      |     -      |    200    | Input/Output | 半角英数字+符号               |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | -                                                  |
| **Variant string.1**   | TextField      |     -      |    100    | Input/Output | 半角英数字+符号               |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | -                                                  |
| **Variant string.2**   | TextField      |     -      |    100    | Input/Output | 半角英数字+符号               |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | -                                                  |
| **Comments**           | TextField      |     -      |    100    | Input/Output | 半角英数字+符号               |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | -                                                  |
| **Add (YYYYWW)**       | TextField      |     -      |     6     | Input/Output | 半角英数字+符号               |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 来自HDOC_USER_DEFINED_RULES.ADD_DATE               |
| **Delete (YYYYWW)**    | TextField      |     -      |     6     | Input/Output | 半角英数字+符号               |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 来自HDOC_USER_DEFINED_RULES.DELETE_DATE            |
| **Created by user**    | TextField      |     -      |    16     | Input/Output | 半角英数字+符号               |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 来自HDOC_USER_DEFINED_RULES.UPDATE_USER            |
| **Date**               | TextField      |     -      |     -     | Input/Output | 日期                          |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 来自HDOC_USER_DEFINED_RULES.UPDATE_DATETIME        |
| **Search**             | Button         |     -      |     -     | Action     | -                             |   中 (Center)    |        -         |   活性 (Enabled)   | 跳转到检索结果画面                                 |
| **Clear**              | Button         |     -      |     -     | Action     | -                             |   中 (Center)    |        -         |   活性 (Enabled)   | 清空所有输入内容                                   |
| **Add**                | Button         |     -      |     -     | Action     | -                             |   中 (Center)    |        -         |   活性 (Enabled)   | 追加注册输入内容                                   |
| **Update**             | Button         |     -      |     -     | Action     | -                             |   中 (Center)    |        -         |   活性 (Enabled)   | 更新输入内容                                       |
| **Delete**             | Button         |     -      |     -     | Action     | -                             |   中 (Center)    |        -         |   活性 (Enabled)   | 删除输入内容                                       |

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

所有校验逻辑均在用户执行操作时同步或异步执行。

### 3.1 处理流程

#### 3.1.1 页面初始化流程

1.  **开始**：页面加载事件触发。
2.  **API 调用**：
    - 调用 `GetDropdownDataApi()` 获取 Product class 和 Market 的下拉列表数据。
3.  **结果处理**：
    - **成功**：填充下拉列表选项。
    - **失败**：显示错误消息。

#### 3.1.2 Search操作流程

1.  **开始**：用户点击 Search 按钮。
2.  **前置处理**：获取所有输入字段的值。
3.  **画面迁移**：
    - 将检索条件保存到state。
    - 跳转到 HomologationVariablesResultList 画面，传递检索条件。

#### 3.1.3 Clear操作流程

1.  **开始**：用户点击 Clear 按钮。
2.  **处理逻辑**：
    - 清空所有输入字段（Product class、Number、Market、Variable等）。
    - 重置下拉列表为默认未选择状态。

#### 3.1.4 Add操作流程

1.  **开始**：用户点击 Add 按钮。
2.  **前置处理**：获取所有输入字段的值。
3.  **必填校验 (Frontend Check)**：
    - 若 `Product class`、`Number`、`Market` 任一为空：
      - 设置 Message = `Product class, Number, and Market are required.`
      - **终止**流程。
4.  **API 调用 (Backend Check)**：
    - 调用 `AddRuleApi(ruleData)` 执行插入操作。
5.  **结果处理**：
    - **成功**：清空表单，显示成功消息。
    - **失败**：
      - 若主键冲突：显示 `Primary key conflict, Please enter the correct content`
      - 若变量不存在：显示 `Variant does not exist, Please enter the correct content`

#### 3.1.5 Update操作流程

1.  **开始**：用户点击 Update 按钮。
2.  **前置处理**：获取所有输入字段的值。
3.  **必填校验 (Frontend Check)**：
    - 若 `Product class`、`Number`、`Market` 任一为空：
      - 设置 Message = `Product class, Number, and Market are required.`
      - **终止**流程。
4.  **API 调用 (Backend Check)**：
    - 调用 `UpdateRuleApi(ruleData)` 执行更新操作。
5.  **结果处理**：
    - **成功**：显示成功消息。
    - **失败**：
      - 若记录不存在：显示 `Data does not exist, Please enter the correct content`
      - 若主键冲突：显示 `Primary key conflict, Please enter the correct content`
      - 若变量不存在：显示 `Variant does not exist, Please enter the correct content`

#### 3.1.6 Delete操作流程

1.  **开始**：用户点击 Delete 按钮。
2.  **前置处理**：获取所有输入字段的值。
3.  **必填校验 (Frontend Check)**：
    - 若 `Product class`、`Number`、`Market` 任一为空：
      - 设置 Message = `Product class, Number, and Market are required.`
      - **终止**流程。
4.  **API 调用 (Backend Check)**：
    - 调用 `DeleteRuleApi(ruleData)` 执行删除操作。
5.  **结果处理**：
    - **成功**：清空表单，显示成功消息。
    - **失败**：
      - 若记录不存在：显示 `Data does not exist, Please enter the correct content`

### 3.2 校验详细规格表

| No. |   检查时机   |       检查对象       |                  检查条件                   |                          错误消息 (Message Content)                           |    错误级别    |                 动作                 |
| :-: | :----------: | :------------------: | :-----------------------------------------: | :---------------------------------------------------------------------------: | :------------: | :----------------------------------: |
|  1  | Add操作      | Product/Number/Market  | 三者组合已存在                                |                     `Primary key conflict, Please enter the correct content`                     |     Error      | 显示错误消息，终止操作 |
|  2  | Add操作      | Variable             | 输入的Variant在HDOC_VARIABLES中不存在         |                     `Variant does not exist, Please enter the correct content`                     |     Error      | 显示错误消息，终止操作 |
|  3  | Update操作   | Product/Number/Market  | 记录不存在                                    |                     `Data does not exist, Please enter the correct content`                     |     Error      | 显示错误消息，终止操作 |
|  4  | Update操作   | Product/Number/Market  | 三者组合与其他记录重复                        |                     `Primary key conflict, Please enter the correct content`                     |     Error      | 显示错误消息，终止操作 |
|  5  | Update操作   | Variable             | 输入的Variant在HDOC_VARIABLES中不存在         |                     `Variant does not exist, Please enter the correct content`                     |     Error      | 显示错误消息，终止操作 |
|  6  | Delete操作   | Product/Number/Market  | 记录不存在                                    |                     `Data does not exist, Please enter the correct content`                     |     Error      | 显示错误消息，终止操作 |

## 4. 接口定义 (API Specification)

### 4.1 GetDropdownDataApi

- **功能**：获取Product class和Market的下拉列表数据。
- **Method**: `GET`
- **Endpoint**: `/api/ud08/getdropdowndata`

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "获取下拉列表成功",
  "data": {
    "productClasses": [
      { "pc": "PC01", "description": "Product Class 01" },
      { "pc": "PC02", "description": "Product Class 02" }
    ],
    "markets": [
      { "market": "EU", "description": "Europe" },
      { "market": "US", "description": "United States" }
    ]
  }
}
```

### 4.2 AddRuleApi

- **功能**：新增用户定义规则。
- **Method**: `POST`
- **Endpoint**: `/api/ud08/addrule`

#### Request Body

```json
{
  "productClass": "PC01",
  "number": "1234567890",
  "market": "EU",
  "variable": "TEMPLATE-VAR001",
  "value": "Test Value",
  "variantString1": "VS1",
  "variantString2": "VS2",
  "comments": "Test comment"
}
```

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "Rule added successfully",
  "data": null
}
```

#### Response Error (400 Bad Request)

```json
{
  "success": false,
  "message": "Primary key conflict, Please enter the correct content",
  "data": null
}
```

### 4.3 UpdateRuleApi

- **功能**：更新用户定义规则。
- **Method**: `PUT`
- **Endpoint**: `/api/ud08/updaterule`

#### Request Body

```json
{
  "productClass": "PC01",
  "number": "1234567890",
  "market": "EU",
  "variable": "TEMPLATE-VAR001",
  "value": "Updated Value",
  "variantString1": "VS1",
  "variantString2": "VS2",
  "comments": "Updated comment"
}
```

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "Rule updated successfully",
  "data": null
}
```

### 4.4 DeleteRuleApi

- **功能**：删除用户定义规则。
- **Method**: `DELETE`
- **Endpoint**: `/api/ud08/deleterule`

#### Request Body

```json
{
  "productClass": "PC01",
  "number": "1234567890",
  "market": "EU"
}
```

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "Rule deleted successfully",
  "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **必填字段为空**         | 前端校验拦截       | `Product class, Number, and Market are required.` |
| **主键冲突**             | API返回400错误     | `Primary key conflict, Please enter the correct content` |
| **变量不存在**           | API返回400错误     | `Variant does not exist, Please enter the correct content` |
| **记录不存在**           | API返回400错误     | `Data does not exist, Please enter the correct content` |
| **网络断开/超时**        | 捕获 Network Error | `Network error or server unavailable. Please try again later.` |
| **服务器内部错误 (500)** | 捕获 Server Error  | `System error. Please contact administrator.`  |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 管理 `productClass`, `number`, `market`, `variable`, `value`, `variantString1`, `variantString2`, `comments`, `addDate`, `deleteDate`, `createdByUser`, `date`, `errorMessage`, `isLoading`。
    - 使用 useEffect 在页面加载时获取下拉列表数据。
2.  **安全性**：
    - API 请求必须携带有效的认证Token。
    - Variable字段若以'TEMPLATE-'开头，需在后端去除前缀后校验是否存在于HDOC_VARIABLES表。
3.  **UI 细节**：
    - Product class 和 Market 使用下拉列表组件，支持搜索过滤。
    - Number 字段仅允许输入数字，前端实时校验。
    - 所有按钮在 `isLoading` 期间应设为 `disabled`，防止重复提交。
    - `Message` 文字颜色建议使用红色 (`#ff4d4f` 或 `#c62828`) 以起到警示作用。
    - Clear按钮点击后应清空所有字段并重置下拉列表。
4.  **性能优化**：
    - 下拉列表数据可缓存，避免每次进入页面都调用API。
    - Variable字段的TEMPLATE-前缀检查应在后端完成，减少前端复杂度。
5.  **数据校验逻辑**：
    - Add/Update操作时，后端需执行以下校验：
      1. 检查Product class、Number、Market组合是否已存在（主键冲突）
      2. 若Variable以'TEMPLATE-'开头，去除前缀后检查是否存在于HDOC_VARIABLES表
      3. 所有字段长度不超过定义的最大长度

---
