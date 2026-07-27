# Existing HDoc Variables 详细设计说明书

| 文档编号     | DES-Existing HDoc Variables-011 | 版本号     | v1.0       |
| :----------- | :------------------------------ | :--------- | :--------- |
| **模块名称** | Existing HDoc Variables         | **作成日** | 2026-07-16 |
| **作成者**   | GitHub Copilot                  | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块是 Existing HDoc Variables 页面，核心功能是基于前画面传入的检索条件展示 Homologation Variables 的检索结果列表，支持用户完成记录选择、返回检索条件画面、打印检索结果、跳转关联指定记录的 Homologation Variables 画面、导出 CSV 文件、跳转查看指定用户信息的全流程操作，实现现有 HDOC 变量数据的快速查询与关联业务跳转，满足业务人员高效处理 HDOC 系统变量数据的需求。

- **目标**：提供 Existing HDoc Variables 检索结果的可视化展示与多维度操作，支撑变量数据的快速查询、选择回填、条件还原、打印输出、CSV 导出及用户详情查阅等业务场景。
- **安全性**：
  - 仅可对 `HDOC_VARIABLES` 表执行查询（R）操作获取规则信息。
  - 禁止对该表执行任何新增、修改、删除类的操作，保障系统核心变量规则数据的安全性与稳定性。
- **用户体验**：
  - 所有操作按钮默认保持活性状态，控件文字对齐方式统一配置保证画面布局规整。
  - 跳转前画面时自动保留历史检索条件与已选记录内容。
  - 打印、导出操作无需额外二次确认即可直接执行，最大程度降低用户重复录入信息的操作成本。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| No. | 项目名 (Item)        | 种类 (Type) | 必须 (Req) | MaxLength | I/O     | 允许字符 (Allowed Chars)     | 字符对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注                                                                 |
| :-: | :------------------- | :---------- | :--------: | :-------: | :------ | :--------------------------- | :--------------: | :--------------: | :----------------: | :------------------------------------------------------------------- |
|  1  | **Variable**         | DataTable   |     -      |    30     | Output  | 半角英数字 + 符号            | 左 (Left)        | 空 (Empty)       | -                  | 数据来源表 `HDOC_VARIABLES` 的 VARIABLE 字段                         |
|  2  | **Type**             | DataTable   |     -      |    20     | Output  | 半角英数字 + 符号            | 左 (Left)        | 空 (Empty)       | -                  | 数据来源表 `HDOC_VARIABLES` 的 TYPE 字段                             |
|  3  | **Description**      | DataTable   |     -      |    100    | Output  | 半角英数字 + 符号            | 左 (Left)        | 空 (Empty)       | -                  | 数据来源表 `HDOC_VARIABLES` 的 DESCR 字段                            |
|  4  | **Created by user**  | DataTable   |     -      |    16     | Output  | 半角英数字 + 符号            | 左 (Left)        | 空 (Empty)       | -                  | 列内容支持点击跳转，数据来源表 `HDOC_VARIABLES` 的 REGISTER_USER 字段 |
|  5  | **Date**             | DataTable   |     -      |     -     | Output  | 日期                         | 左 (Left)        | 空 (Empty)       | -                  | 数据来源表 `HDOC_VARIABLES` 的 REGISTER_DATETIME 字段                |
|  6  | **Count**            | Label       |     -      |     -     | Output  | -                            | 左 (Left)        | 空 (Empty)       | -                  | 展示当前画面的检索结果总件数                                         |
|  7  | **Search**           | Button      |     -      |     -     | Action  | -                            | 中 (Center)      | 空 (Empty)       | 活性 (Enabled)     | 执行重新检索操作                                                     |
|  8  | **Down**             | Button      |     -      |     -     | Action  | -                            | 中 (Center)      | 空 (Empty)       | 活性 (Enabled)     | 跳转关联 Homologation Variables 画面（式样不明暂不做任何处理）       |
|  9  | **Back**             | Button      |     -      |     -     | Action  | -                            | 中 (Center)      | 空 (Empty)       | 活性 (Enabled)     | 返回前一个 Existing HDoc Variables 检索条件画面                      |
| 10  | **Print**            | Button      |     -      |     -     | Action  | -                            | 中 (Center)      | 空 (Empty)       | 活性 (Enabled)     | 打印当前展示的检索结果                                               |
| 11  | **Excel**            | Button      |     -      |     -     | Action  | -                            | 中 (Center)      | 空 (Empty)       | 活性 (Enabled)     | 将检索结果导出为 CSV 文件                                            |

> **注**：
>
> - **DataTable** 类型表示该控件为数据表格中的列，用于展示从后台接口获取的数据。
> - 数据表格每行记录前应提供 Checkbox 勾选框，供用户选择需要操作的数据行。
> - **Created by user** 列中的值以超链接形式展示，点击后触发 EDB User View 页面跳转。
> - **半角英数字 + 符号**：指 ASCII 范围内的可见符号（如 `!@#$%^&*()_+-=[]{};':"\\|,.<>/?` 等）及半角英数字。
> - **日期格式**：`YYYY-MM-DD`。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

#### 3.1.1 初始表示

画面正常表示，从前画面获取传入的检索条件，基于该条件调用 `UD11Search` API 查询 `HDOC_VARIABLES` 表加载对应的检索结果列表，同时展示检索结果总件数。

- Count 标签显示检索结果的总条数，格式为 `Number of lines found: XXX`。

#### 3.1.2 触发条件：用户点击 Search 按钮

1. **前置校验**：无前置校验逻辑。

2. **API 调用 (Backend Check)**：
   - 调用 `UD11Search` API，传入当前画面维护的检索条件参数，从 `HDOC_VARIABLES` 表中重新拉取匹配数据。

3. **结果处理**：
   - **成功**：正常加载全部匹配的变量检索结果并更新表格数据与 Count 标签。
   - **失败**：弹出系统数据加载异常提示，终止画面渲染。

#### 3.1.3 触发条件：用户点击 Select 按钮（行勾选选择）

1. **选中记录校验 (Frontend Check)**：
   - 若未勾选任意列表行记录：
     - 设置 `Message` = `Please first check the records that need to be selected.`
     - **终止流程**。

2. **结果处理**：
   - 用户勾选列表中的目标记录后点击 Select 按钮：
     - 直接跳转回前一个 Existing HDoc Variables 画面，自动将已选中记录的内容填充至对应展示区域。
   - 无额外后端处理逻辑，无失败分支。

#### 3.1.4 触发条件：用户点击 Back 按钮

1. **前置校验**：无任何校验逻辑，直接执行后续跳转操作。

2. **结果处理**：
   - 直接跳转回前一个 Existing HDoc Variables 检索条件画面，自动将之前录入的检索条件填充至对应输入区域。
   - 无额外后端处理逻辑，无失败分支。

#### 3.1.5 触发条件：用户点击 Print 按钮

1. **前置校验**：无任何校验逻辑，直接执行后续打印操作。

2. **结果处理**：
   - 直接调用系统打印能力（浏览器原生打印），将当前画面展示的所有检索结果发起打印。
   - 无额外后端处理逻辑，无失败分支。

#### 3.1.6 触发条件：用户点击 Down 按钮

- **说明**：式样不明暂不做任何处理。

#### 3.1.7 触发条件：用户点击 Excel 按钮

1. **前置校验**：无任何校验逻辑，直接执行后续导出操作。

2. **结果处理**：
   - 直接将当前检索结果导出为 CSV 文件输出到用户本地。
   - 无额外后端处理逻辑，无失败分支。

#### 3.1.8 触发条件：用户点击 Created by user 列中的链接

1. **前置校验**：无任何校验逻辑，直接执行后续跳转操作。

2. **结果处理**：
   - 直接跳转至 EDB User View 画面，加载对应用户的信息完成展示。
   - 无额外后端处理逻辑，无失败分支。

### 3.2 校验详细规格表

| No. | 检查时机               | 检查对象         | 检查条件                 | 错误消息 (Message Content)                              | 动作                     |
| :-: | :--------------------- | :--------------- | :----------------------- | :------------------------------------------------------ | :----------------------- |
|  1  | 点击 Select 按钮时     | 列表记录选中状态 | 未选中任何记录直接按下 Select 按钮 | `Please first check the records that need to be selected.` | 停留在当前检索结果画面 |

## 4. 接口定义 (API Specification)

### 4.1 UD11Search

- **功能**：根据传入的检索条件查询 `HDOC_VARIABLES` 表内匹配的变量规则数据，返回结果列表用于画面渲染展示。
- **Method**: `GET`
- **Endpoint**: `/hdoc/ud11/UD11HdocvariablesApi/UD11Search`

#### Request Body

```json
{
    "variable": "001",
    "type": "User Defined",
    "description": "description",
    "createdByUser": "UD001",
    "date": "2022-11-24"
}
```

#### Response Success (200 OK)

```json
{
    "code": 200,
    "message": null,
    "data": {
        "totalCount": 10,
        "variableList": [
            {
                "variable": "SAMPLE_VAR001",
                "type": "RULE",
                "descr": "descr",
                "registerUser": "USER001",
                "registerDatetime": "2022-11-24"
            }
        ]
    }
}
```

#### Response Error (500 Internal Server Error)

```json
{
    "code": 500,
    "message": "System error. Please contact administrator.",
    "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式                     | Message 显示内容                               |
| :----------------------- | :--------------------------- | :--------------------------------------------- |
| 接口调用超时或返回系统内部错误 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.`  |

## 6. 实现注意事项 (Implementation Notes)

1. **状态管理**：
   - 使用 React State 管理检索结果列表数据（`variableList`）、总条数（`totalCount`）、勾选状态（`selectedRecords`）、`message`、`isLoading`。
   - `Message` 区域默认隐藏（内容为空时不予显示）。

2. **页面初始化**：
   - 页面加载时通过路由参数或共享状态获取前 Existing HDoc Variables 画面传入的检索条件。
   - 自动调用 `UD11Search` API 获取匹配数据并渲染表格。
   - Count 标签初始值设为 `Number of lines found: 0`，数据加载完成后更新为实际总条数。

3. **数据表格**：
   - 表格每行记录前提供 Checkbox 勾选框，`selectedRecords` 状态维护所有选中行的唯一标识。
   - Created by user 列以超链接 `<a>` 标签渲染，点击时触发 EDB User View 页面跳转。

4. **Search 按钮逻辑**：
   - 点击后使用当前检索条件重新调用 `UD11Search` API，刷新表格数据。
   - 在 `isLoading` 期间按钮设为 `disabled` 状态，防止重复提交。

5. **Select 按钮逻辑**：
   - 选中记录后，通过路由参数或共享状态将选中记录的数据传递回前一个 Existing HDoc Variables 画面。
   - 回填字段映射规则：选中行的 variable → Variable、type → Type、descr → Description 等。

6. **Back 按钮逻辑**：
   - 跳转回前一个 Existing HDoc Variables 检索条件画面时，将原始检索条件通过路由参数或共享状态还原到各输入控件中。

7. **Down 按钮逻辑**：
   - 式样不明暂不做任何处理，按钮可保留在页面中但不绑定实际业务逻辑。

8. **Print 按钮逻辑**：
   - 调用 `window.print()` 触发浏览器原生打印功能。
   - 通过 `@media print` CSS 样式优化打印布局，隐藏不必要的操作按钮和勾选框。

9. **Excel 按钮逻辑**：
   - 将当前 `variableList` 数据转换为 CSV 格式字符串。
   - 通过创建 Blob 对象并生成下载链接，实现 CSV 文件的客户端导出。
   - CSV 文件命名格式建议为 `ExistingHDocVariables_YYYYMMDD_HHmmss.csv`。
   - CSV 内容包含表头行：Variable, Type, Description, Created by user, Date。

10. **Created by user 链接跳转**：
    - 点击后通过路由导航至 EDB User View 页面，传入当前行对应的 `registerUser` 值作为 UserID 参数。

11. **UI 细节**：
    - Search、Down、Back、Print、Excel 按钮在 `isLoading` 期间应设为 `disabled` 状态，防止重复提交。
    - `Message` 文字颜色使用红色（`#ff4d4f`）以起到警示作用。
