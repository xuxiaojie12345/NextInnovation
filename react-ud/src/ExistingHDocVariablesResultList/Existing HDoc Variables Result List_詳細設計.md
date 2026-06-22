# 现有HDoc变量结果列表模块 (Existing HDoc Variables Result List Module) 详细设计说明书

| 文档编号     | DES-HDOC-RES-004         | 版本号     | v1.0       |
| :----------- | :-------------------- | :--------- | :--------- |
| **模块名称** | 现有HDoc变量结果列表 (Existing HDoc Variables Result List) | **作成日** | 2023-10-XX |
| **作成者**   | Lingma Assistant      | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于展示“现有HDoc变量”的检索结果。用户在前一画面输入检索条件后，系统将查询 `HDOC_VARIABLES` 表并在此画面以列表形式展示结果。

- **目标**：清晰展示检索到的变量数据，支持选择回传、下钻检索、打印及导出操作。
- **交互性**：提供“Select”按钮将选定行数据回传至编辑画面；提供“Down”按钮携带变量名跳转至“同族变量”画面进行关联检索。
- **安全性**：导出功能需确保仅授权用户可访问敏感数据。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item) | 種別 (Type) | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars)          | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                    |
| :------------ | :---------- | :--------: | :-------: | :----: | :-------------------------------- | :--------------: | :--------------: | :----------------: | :---------------------- |
| **Variable**  | DataTable Column | N | 30 | Output | 半角英数字 + 記号 | 左 (Left) | - | - | 核心检索字段 |
| **Type**      | DataTable Column | N | 20 | Output | 半角英数字 + 記号 | 左 (Left) | - | - | 固定选项：VDA, User Defined |
| **Description**| DataTable Column| N | 100 | Output | 半角英数字 + 記号 | 左 (Left) | - | - | 变量描述 |
| **Created by user**| DataTable Column| N | 16 | Output | 半角英数字 + 記号 | 左 (Left) | - | Link | 点击跳转 EDB User View |
| **Date**      | DataTable Column | N | - | Output | 日付 (YYYY-MM-DD HH:mm:ss) | 左 (Left) | - | - | 注册日期时间 |
| **Count**     | Label       | N | - | Output | 数字 | 左 (Left) | `Number of lines found: 0` | - | 显示检索结果总行数 |
| **Search**    | Button      | N | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 重新执行检索（可选） |
| **Down**      | Button      | N | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 选中后跳转至 Homologation Variables |
| **Back**      | Button      | N | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 返回检索条件画面 |
| **Print**     | Button      | N | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 打印当前列表 |
| **Excel**     | Button      | N | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 导出 CSV 文件 |

> **注**：
> - **Link 行为**：点击 `Created by user` 列的链接时，携带 UserID 跳转至 `EDB User View` 画面。
> - **Down 按钮逻辑**：必须选中一行记录后方可点击，否则给出警告。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

1.  **初始化/加载**：
    - 接收前画面传递的检索条件。
    - 调用后端 API 获取 `HDOC_VARIABLES` 数据。
    - 渲染表格，更新 `Count` Label。
2.  **Select 按钮点击**：
    - 检查是否已选中某一行。
    - 若未选中，提示 `Please select a record first.`。
    - 若已选中，将该行数据（Variable, Type, Description 等）封装，跳转回“Existing HDoc Variables”编辑画面并填充表单。
3.  **Down 按钮点击**：
    - **前置校验**：检查是否已选中某一行。
    - 若未选中，显示 Warning：`No key defined for table.`。
    - 若已选中，获取该行的 `Variable` 值，跳转至“Homologation Variables”画面，并以该 Variable 为条件自动执行检索，仅显示匹配的 Variant 记录。
4.  **Back 按钮点击**：
    - 销毁当前画面状态，跳转回“Existing HDoc Variables”检索条件画面，保留之前的检索条件。
5.  **Excel 按钮点击**：
    - 调用导出 API，下载包含当前检索结果的 CSV 文件。

### 3.2 校验详细规格表

| No. |   检查时机   |     检查对象      |                检查条件                |                          错误消息 (Message Content)                           |                 动作                 |
| :-: | :----------: | :---------------: | :------------------------------------: | :---------------------------------------------------------------------------: | :----------------------------------: |
|  1  | Click Down   | Row Selection     | `SelectedRow == null`                  |                     `No key defined for table.`                     | 显示 Warning Message，不执行跳转 |
|  2  | Click Select | Row Selection     | `SelectedRow == null`                  |                     `Please select a record first.`                     | 显示 Alert/Toast，不执行跳转 |
|  3  | API Response | Search Result     |  `Data is empty`                       | `No records found matching your criteria.` | 清空表格，Count 显示为 0 |

## 4. 接口定义 (API Specification)

### 4.1 GetExistingVariablesApi

- **功能**：根据检索条件获取现有变量列表。
- **Method**: `POST`
- **Endpoint**: `/api/hdoc/existing-variables/search`

#### Request Body

```json
{
  "variable": "string",
  "type": "string",
  "description": "string"
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": [
    {
      "variable": "VAR_001",
      "type": "User Defined",
      "description": "Test Variable",
      "registerUser": "admin",
      "registerDatetime": "2023-10-27 10:00:00"
    }
  ],
  "message": "success"
}
```

### 4.2 ExportVariablesApi

- **功能**：导出检索结果为 CSV。
- **Method**: `GET`
- **Endpoint**: `/api/hdoc/existing-variables/export?variable=xxx&type=yyy`

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **网络断开/超时**        | 捕获 Network Error | `Network error. Please check your connection.` |
| **服务器内部错误 (500)** | 捕获 Server Error  | `System error. Please contact administrator.`  |
| **无检索结果**           | 前端判断 Data 为空 | `No records found matching your criteria.`     |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 管理 `dataList`, `selectedRow`, `totalCount`, `isLoading`。
    - 建议使用 Ant Design 或 Material UI 的 Table 组件，开启 `rowSelection` 模式。
2.  **性能优化**：
    - 若数据量较大，建议启用后端分页。
    - 导出功能若数据量超过 10,000 条，建议采用异步任务处理，避免请求超时。
3.  **UI 细节**：
    - `Created by user` 列应渲染为蓝色下划线文本，鼠标悬停时显示手型光标。
    - `Down` 按钮在未选中行时应设为 `disabled` 或点击后给出明确警告，以提升用户体验。
    - `Count Label` 应实时反映当前表格中的行数。