# Homologation Variable Result List 详细设计说明书

| 文档编号     | DES-Homologation Variable Result List-009 | 版本号     | v1.0       |
| :----------- | :---------------------------------------- | :--------- | :--------- |
| **模块名称** | HDOC                                      | **作成日** | 2026-07-15 |
| **作成者**   | GitHub Copilot                            | **状态**   | 正式稿     |

## 1. 背景 (Background)

本页面为 Homologation Variables Result List 页面，核心目标是基于前 Homologation Variables 页面传入的检索条件，从 `HDOC_USER_DEFINED_RULES` 规则表中拉取匹配数据展示检索结果，支持用户执行勾选记录返回上页回填、返回上页还原检索条件、打印检索结果、删除选中记录、跳转 EDB User View 用户详情页面五类操作，完成 Homologation 变量相关检索结果的全流程交互。

- **目标**：提供 Homologation Variables 检索结果的可视化展示与交互操作，支撑检索结果的选择回填、条件还原、打印输出、记录删除及用户详情查阅等业务场景。
- **安全性**：
  - 仅允许对 `HDOC_USER_DEFINED_RULES` 数据表执行查询和删除操作。
  - 删除操作仅可针对用户已勾选的选中记录执行，禁止无选中状态下触发删除逻辑，避免出现规则数据误删的风险。
- **用户体验**：
  - 页面初始化时自动加载前页面传入的检索条件对应的结果集，无需用户重复操作。
  - 用户点击 Back 按钮时自动还原前 Homologation Variables 页面的全部检索条件，操作流程连贯无多余步骤。
  - 页面所有功能按钮默认设为活性状态，保证常规操作始终处于可点击状态。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| No. | 项目名 (Item)        | 种类 (Type) | 必须 (Req) | MaxLength | I/O     | 允许字符 (Allowed Chars) | 字符对齐 (Align) | 初始值 (Default)               | 显示控制 (Control) | 备注                                                                 |
| :-: | :------------------- | :---------- | :--------: | :-------: | :------ | :----------------------- | :--------------: | :----------------------------- | :----------------: | :------------------------------------------------------------------- |
|  1  | **Product class**    | DataTable   |     -      |     -     | Output  | -                        | 左 (Left)        | -                              | -                  | 数据源为 `HDOC_USER_DEFINED_RULES` 表的 PC 字段，排序优先级：Product Class, Market, Number |
|  2  | **Number**           | DataTable   |     -      |     -     | Output  | -                        | 左 (Left)        | -                              | -                  | 数据源为 `HDOC_USER_DEFINED_RULES` 表的 NUM 字段                     |
|  3  | **Market**           | DataTable   |     -      |     -     | Output  | -                        | 左 (Left)        | -                              | -                  | 数据源为 `HDOC_USER_DEFINED_RULES` 表的 MARKET 字段                  |
|  4  | **Variable**         | DataTable   |     -      |     -     | Output  | -                        | 左 (Left)        | -                              | -                  | 数据源为 `HDOC_USER_DEFINED_RULES` 表的 MARKET 字段                  |
|  5  | **Value**            | DataTable   |     -      |     -     | Output  | -                        | 左 (Left)        | -                              | -                  | 数据源为 `HDOC_USER_DEFINED_RULES` 表的 VAL 字段                     |
|  6  | **Variant string.**  | DataTable   |     -      |     -     | Output  | -                        | 左 (Left)        | -                              | -                  | 数据源为 `HDOC_USER_DEFINED_RULES` 表的 VS 字段                      |
|  7  | **Comments**         | DataTable   |     -      |     -     | Output  | -                        | 左 (Left)        | -                              | -                  | 数据源为 `HDOC_USER_DEFINED_RULES` 表的 VS2 字段                     |
|  8  | **Add**              | DataTable   |     -      |     -     | Output  | -                        | 左 (Left)        | -                              | -                  | 数据源为 `HDOC_USER_DEFINED_RULES` 表的 ADD_DATE 字段                |
|  9  | **Delete**           | DataTable   |     -      |     -     | Output  | -                        | 左 (Left)        | -                              | -                  | 数据源为 `HDOC_USER_DEFINED_RULES` 表的 DELETE_DATE 字段             |
| 10  | **Created by user**  | DataTable   |     -      |     -     | Output  | -                        | 左 (Left)        | -                              | -                  | 数据源为 `HDOC_USER_DEFINED_RULES` 表的 REGISTER_USER 字段，点击列中链接可跳转至 EDB User View 页面 |
| 11  | **Date**             | DataTable   |     -      |     -     | Output  | -                        | 左 (Left)        | -                              | -                  | 数据源为 `HDOC_USER_DEFINED_RULES` 表的 REGISTER_DATETIME 字段       |
| 12  | **Count**            | Label       |     -      |     -     | Output  | -                        | 左 (Left)        | `Number of lines found: XXX`   | -                  | 用于展示当前页面检索结果的总条数                                     |
| 13  | **Select**           | Button      |     -      |     -     | Action  | -                        | 中 (Center)      | -                              | 活性 (Enabled)     | 勾选列表记录后点击，跳转返回前 Homologation Variables 页面，自动回填选中的记录内容 |
| 14  | **Back**             | Button      |     -      |     -     | Action  | -                        | 中 (Center)      | -                              | 活性 (Enabled)     | 点击跳转返回前 Homologation Variables 页面，自动还原该页面此前设置的所有检索条件 |
| 15  | **Print**            | Button      |     -      |     -     | Action  | -                        | 中 (Center)      | -                              | 活性 (Enabled)     | 点击可打印当前页面展示的全部 Homologation Variables 检索结果         |
| 16  | **Delete selected**  | Button      |     -      |     -     | Action  | -                        | 中 (Center)      | -                              | 活性 (Enabled)     | 点击可删除用户已勾选的全部选中记录                                   |

> **注**：
>
> - **DataTable** 类型表示该控件为数据表格中的列，用于展示从后台接口获取的数据。
> - 数据表格每行记录前应提供 Checkbox 勾选框，供用户选择需要操作的数据行。
> - **Created by user** 列中的值以超链接形式展示，点击后触发 EDB User View 页面跳转。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

所有校验逻辑均在用户点击对应操作按钮时按序执行。

### 3.1 处理流程

#### 3.1.1 初始表示

画面正常表示，基于前 Homologation Variables 页面传入的检索条件，调用后台接口从 `HDOC_USER_DEFINED_RULES` 表中拉取匹配的规则数据，渲染生成检索结果列表。

- Count 标签显示检索结果的总条数，格式为 `Number of lines found: XXX`。
- 排序优先级：Product Class → Market → Number（升序）。

#### 3.1.2 触发条件：用户点击 Select 按钮

1. **选中记录校验 (Frontend Check)**：
   - 若未勾选任意列表行记录：
     - 设置 `Message` = `Please first check the records that need to be selected.`
     - **终止流程**。

2. **结果处理**：
   - **成功**：直接跳转至前 Homologation Variables 页面，将选中的记录内容自动回填至对应字段。
   - 无额外后端处理逻辑，无失败分支。

#### 3.1.3 触发条件：用户点击 Back 按钮

1. **前置校验**：无任何校验逻辑，直接执行后续跳转操作。

2. **结果处理**：
   - **成功**：直接跳转至前 Homologation Variables 页面，自动还原该页面此前设置的所有检索条件。
   - 无额外后端处理逻辑，无失败分支。

#### 3.1.4 触发条件：用户点击 Print 按钮

1. **前置校验**：无任何校验逻辑，直接执行后续打印操作。

2. **结果处理**：
   - **成功**：调用浏览器原生打印能力，将当前页面展示的 Homologation Variables 检索结果内容输出至打印设备。
   - 无额外后端处理逻辑，无失败分支。

#### 3.1.5 触发条件：用户点击 Delete selected 按钮

1. **选中记录校验 (Frontend Check)**：
   - 若未勾选任意列表行记录：
     - 设置 `Message` = `Please first check the records that need to be selected.`
     - **终止流程**。

2. **API 调用 (Backend Check)**：
   - 若前端校验通过，调用 `deleteHdocUserDefinedRules` 接口，传入已选中记录的唯一标识列表。

3. **结果处理**：
   - **成功**：选中规则记录删除完成，页面自动刷新最新的检索结果列表。
   - **失败**：选中的记录删除失败，弹出异常提示（如权限不足）。

#### 3.1.6 触发条件：用户点击 Created by user 列中的链接

1. **前置校验**：无任何校验逻辑。

2. **结果处理**：
   - **成功**：从后台拉取对应用户的详情信息并在 EDB User View 页面展示。
   - **失败**：获取用户信息失败，弹出异常提示。

### 3.2 校验详细规格表

| No. | 检查时机                | 检查对象             | 检查条件                   | 错误消息 (Message Content)                              | 动作                                       |
| :-: | :---------------------- | :------------------- | :------------------------- | :------------------------------------------------------ | :----------------------------------------- |
|  1  | 点击 Select 按钮时      | 检索结果列表的勾选状态 | 未勾选任意一条列表记录     | `Please first check the records that need to be selected.` | 停留在当前页面，不执行跳转操作             |
|  2  | 点击 Delete selected 按钮时 | 检索结果列表的勾选状态 | 未勾选任意一条列表记录     | `Please first check the records that need to be selected.` | 停留在当前页面，不发起后端删除请求         |

## 4. 接口定义 (API Specification)

### 4.1 UD09Seach

- **功能**：根据传入的 Homologation Variables 检索条件从 `HDOC_USER_DEFINED_RULES` 表中获取匹配的规则信息。
- **Method**: `GET`
- **Endpoint**: `/api/ud09/UD09DeleteHdocuserdefinedrulesApi/UD09Seach`

#### Request Body

```json
{
    "productClass": "01",
    "number": "1234567890",
    "market": "CN",
    "variable": "TEST_VAR",
    "value": "TEST_VALUE",
    "variantString1": "VS1",
    "variantString2": "VS2",
    "comments": "TEST_comments"
}
```

#### Response Success (200 OK)

```json
{
    "code": 200,
    "msg": null,
    "data": {
        "totalCount": 10,
        "recordList": [
            {
                "pc": "01",
                "num": "1234567890",
                "market": "CN",
                "val": "V001",
                "vs": "S001",
                "vs2": "S002",
                "addDate": "2022-11-20",
                "deleteDate": "",
                "registerUser": "U001",
                "registerDatetime": "2022-11-20"
            }
        ]
    }
}
```

#### Response Error (500 Internal Server Error)

```json
{
    "code": 500,
    "message": "System error, please contact administrator",
    "data": null
}
```

### 4.2 UD09DeleteSelected

- **功能**：删除 `HDOC_USER_DEFINED_RULES` 表中用户选中的规则记录。
- **Method**: `POST`
- **Endpoint**: `/api/ud09/UD09DeleteHdocuserdefinedrulesApi/UD09DeleteSelected`

#### Request Body

```json
{
    "productClass": "01",
    "number": "1234567890",
    "market": "CN"
}
```

#### Response Success (200 OK)

```json
{
    "code": 200,
    "msg": null,
    "data": null
}
```

#### Response Error (500 Internal Server Error)

```json
{
    "code": 500,
    "message": "System error, please contact administrator",
    "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式                     | Message 显示内容                               |
| :----------------------- | :--------------------------- | :--------------------------------------------- |
| 接口调用超时或返回系统内部错误 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.`  |

## 6. 实现注意事项 (Implementation Notes)

1. **状态管理**：
   - 使用 React State 管理检索结果列表数据（`recordList`）、总条数（`totalCount`）、勾选状态（`selectedRecords`）、`message`、`isLoading`。
   - `Message` 区域默认隐藏（内容为空时不予显示）。

2. **页面初始化**：
   - 页面加载时通过路由参数或共享状态获取前 Homologation Variables 页面传入的检索条件。
   - 自动调用 `UD09Seach` API 获取匹配数据并渲染表格。
   - Count 标签初始值设为 `Number of lines found: 0`，数据加载完成后更新为实际总条数。

3. **数据表格**：
   - 表格数据按 Product Class → Market → Number 升序排列。
   - 每行记录前提供 Checkbox 勾选框，`selectedRecords` 状态维护所有选中行的唯一标识（Product Class + Number + Market 组合键）。
   - Created by user 列以超链接 `<a>` 标签渲染，点击时触发 EDB User View 页面跳转。

4. **Select 按钮逻辑**：
   - 选中记录后，通过路由参数或共享状态将选中记录的数据传递回前 Homologation Variables 页面。
   - 回填字段映射规则：选中行的 PC → Product class、NUM → Number、MARKET → Market 等。

5. **Back 按钮逻辑**：
   - 跳转回前 Homologation Variables 页面时，将原始检索条件通过路由参数或共享状态还原到各输入控件中。

6. **Print 按钮逻辑**：
   - 调用 `window.print()` 触发浏览器原生打印功能。
   - 通过 `@media print` CSS 样式优化打印布局，隐藏不必要的操作按钮和勾选框。

7. **Delete selected 按钮逻辑**：
   - 删除成功后自动调用 `UD09Seach` API 刷新检索结果列表。
   - 删除失败时展示错误提示，不清除当前列表。

8. **Created by user 链接跳转**：
   - 点击后调用 `getEdbUserInfo(UserID)` 接口获取用户详情，通过路由导航至 EDB User View 页面并传入用户信息。

9. **UI 细节**：
   - Select、Back、Print、Delete selected 按钮在 `isLoading` 期间应设为 `disabled` 状态，防止重复提交。
   - `Message` 文字颜色使用红色（`#ff4d4f`）以起到警示作用。
