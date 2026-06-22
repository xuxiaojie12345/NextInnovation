# 现有HDoc变量模块 (Existing HDoc Variables Module) 详细设计说明书

| 文档编号     | DES-HDOC-VARS-003         | 版本号     | v1.0       |
| :----------- | :-------------------- | :--------- | :--------- |
| **模块名称** | 更新用户自定义变量 (Update user defined variables) | **作成日** | 2023-10-XX |
| **作成者**   | Lingma Assistant      | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于管理和维护系统中的“同族变量”（Homologation Variables）。用户可以在此画面进行变量的检索、新增、更新、删除以及导出操作。

- **目标**：提供对用户自定义规则（User Defined Rules）的全生命周期管理。
- **核心功能**：支持对 `HDOC_VARIABLES` 表的 CRUD 操作，并提供 Excel (CSV) 导出功能。
- **交互性**：与“检索结果画面”联动，支持从检索画面回传数据进行编辑。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item) | 種別 (Type) | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars)          | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                    |
| :------------ | :---------- | :--------: | :-------: | :----: | :-------------------------------- | :--------------: | :--------------: | :----------------: | :---------------------- |
| **Variable**  | TextField   |     Y*     |    30     | Input  | 半角英数字 + 記号                 |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | Add/Update/Delete 时必填 |
| **Type**      | DropDownList|     N      |    20     | Input  | 半角英数字 + 記号                 |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 固定选项：VDA, User Defined |
| **Description**| TextField  |     N      |   100     | Input  | 半角英数字 + 記号                 |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | -                       |
| **Created by user**| TextField|    N      |    16     | Input  | 半角英数字 + 記号                 |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | -                       |
| **Date**      | TextField   |     N      |     -     | Input  | 日付 (YYYY-MM-DD)                 |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 建议使用日期选择器组件    |
| **Search**    | Button      |     -      |     -     | Action | -                                 |   中 (Center)    |        -         |   活性 (Enabled)   | 触发检索                |
| **Clear**     | Button      |     -      |     -     | Action | -                                 |   中 (Center)    |        -         |   活性 (Enabled)   | 清空所有输入框          |
| **Back**      | Button      |     -      |     -     | Action | -                                 |   中 (Center)    |        -         |   活性 (Enabled)   | 返回迁移元画面          |
| **Add**       | Button      |     -      |     -     | Action | -                                 |   中 (Center)    |        -         |   活性 (Enabled)   | 新增记录                |
| **Update**    | Button      |     -      |     -     | Action | -                                 |   中 (Center)    |        -         |   活性 (Enabled)   | 更新记录                |
| **Delete**    | Button      |     -      |     -     | Action | -                                 |   中 (Center)    |        -         |   活性 (Enabled)   | 删除记录                |
| **Excel**     | Button      |     -      |     -     | Action | -                                 |   中 (Center)    |        -         |   活性 (Enabled)   | 导出 CSV 文件           |

> **注**：
> - **Variable 必填逻辑**：虽然初始显示非必填，但在执行 Add/Update/Delete 操作时，若 `Variable` 为空，则视为校验失败。
> - **Type 选项**：下拉列表内容固定为 `["VDA", "User Defined"]`。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

1.  **初始化/加载**：
    - 如果是从检索结果画面跳转而来，自动填充 `Variable` 等字段。
    - 否则，显示空白表单。
2.  **Search 按钮点击**：
    - 获取当前输入的检索条件。
    - 调用检索 API，跳转至“Existing HDoc Variables 检索结果画面”。
3.  **Clear 按钮点击**：
    - 将所有输入字段（Variable, Type, Description 等）重置为初始值（空）。
4.  **Add 按钮点击**：
    - **前置校验**：检查 `Variable` 是否为空。
    - **存在性校验**：检查该 `Variable` 是否已存在于数据库中。
    - 若不存在，调用新增 API；若存在，报错 `Variant already exists...`。
5.  **Update 按钮点击**：
    - **前置校验**：检查 `Variable` 是否为空。
    - **存在性校验**：检查该 `Variable` 是否存在于数据库中。
    - 若存在，调用更新 API；若不存在，报错 `Variant does not exists...`。
6.  **Delete 按钮点击**：
    - **前置校验**：检查 `Variable` 是否为空。
    - **存在性校验**：检查该 `Variable` 是否存在于数据库中。
    - 若存在，弹出确认框后调用删除 API；若不存在，报错 `Variant does not exists...`。
7.  **Excel 按钮点击**：
    - 调用导出 API，下载 CSV 格式的文件。

### 3.2 校验详细规格表

| No. |   检查时机   |     检查对象      |                检查条件                |                          错误消息 (Message Content)                           |                 动作                 |
| :-: | :----------: | :---------------: | :------------------------------------: | :---------------------------------------------------------------------------: | :----------------------------------: |
|  1  | Click Add    | Variable          | `DB.Count(Variable) > 0`               |                     `Variant already exists. Please enter the correct content.`                     | 显示 Error Message，终止提交 |
|  2  | Click Update | Variable          | `DB.Count(Variable) == 0`              |                     `Variant does not exists. Please enter the correct content.`                     | 显示 Error Message，终止提交 |
|  3  | Click Delete | Variable          | `DB.Count(Variable) == 0`              |                     `Variant does not exists. Please enter the correct content.`                     | 显示 Error Message，终止提交 |
|  4  | CRUD Ops     | Variable          | `Value == null` OR `Trim(Value) == ""` |                     `Variable is required.`                     | 显示 Error Message，焦点停留在 Variable |

## 4. 接口定义 (API Specification)

### 4.1 SearchVariablesApi

- **功能**：检索变量列表。
- **Method**: `POST`
- **Endpoint**: `/api/hdoc/variables/search`

### 4.2 AddVariableApi

- **功能**：新增变量。
- **Method**: `POST`
- **Endpoint**: `/api/hdoc/variables`
- **Request Body**:

```json
{
  "variable": "string",
  "type": "string",
  "description": "string",
  "createdByUser": "string",
  "date": "string"
}
```

### 4.3 UpdateVariableApi

- **功能**：更新变量。
- **Method**: `PUT`
- **Endpoint**: `/api/hdoc/variables/{variableName}`

### 4.4 DeleteVariableApi

- **功能**：删除变量。
- **Method**: `DELETE`
- **Endpoint**: `/api/hdoc/variables/{variableName}`

### 4.5 ExportVariablesApi

- **功能**：导出 CSV。
- **Method**: `GET`
- **Endpoint**: `/api/hdoc/variables/export`
- **Response**: `Content-Type: text/csv`

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **网络断开/超时**        | 捕获 Network Error | `Network error. Please check your connection.` |
| **服务器内部错误 (500)** | 捕获 Server Error  | `System error. Please contact administrator.`  |
| **并发冲突**             | 捕获 DB Error      | `Record has been modified by another user.`    |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 管理表单字段及 `isLoading` 状态。
    - 建议使用 `useEffect` 监听路由参数，以便在从结果页返回时自动填充数据。
2.  **安全性**：
    - 删除操作必须包含二次确认机制（Confirm Dialog）。
    - 导出接口需校验用户权限，防止敏感数据泄露。
3.  **UI 细节**：
    - `Date` 字段建议使用标准的日期选择器（DatePicker），以确保日期格式统一。
    - 按钮组（Search, Clear, Back 等）建议在页面底部或顶部固定排列，保持布局一致性。
    - 错误消息建议使用红色字体显示在对应输入框下方或页面顶部的 Alert 区域。
