# 同族变量结果列表模块 (Homologation Variables Result List Module) 详细设计说明书

| 文档编号     | DES-HOMOLOGATION-002         | 版本号     | v1.0       |
| :----------- | :-------------------- | :--------- | :--------- |
| **模块名称** | 同族变量结果列表 (Homologation Variables Result List) | **作成日** | 2023-10-XX |
| **作成者**   | Lingma Assistant      | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于展示“同族变量”功能的检索结果。用户在前一画面输入检索条件后，系统将查询 `HDOC_USER_DEFINED_RULES` 表并在此画面以列表形式展示结果。

- **目标**：清晰展示检索到的规则数据，支持选择、返回、打印及删除操作。
- **交互性**：提供“Select”按钮将选定行数据回传至前画面；提供“Back”按钮返回检索画面。
- **安全性**：删除操作需确认，且仅允许有权限的用户执行。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item) | 種別 (Type) | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars)          | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                    |
| :------------ | :---------- | :--------: | :-------: | :----: | :-------------------------------- | :--------------: | :--------------: | :----------------: | :---------------------- |
| **Product class** | DataTable Column | N | - | Output | 任意可见字符 | 左 (Left) | - | - | 排序字段 1 |
| **Number** | DataTable Column | N | - | Output | 任意可见字符 | 左 (Left) | - | - | 排序字段 3 |
| **Market** | DataTable Column | N | - | Output | 任意可见字符 | 左 (Left) | - | - | 排序字段 2 |
| **Variable** | DataTable Column | N | - | Output | 任意可见字符 | 左 (Left) | - | - | - |
| **Value** | DataTable Column | N | - | Output | 任意可见字符 | 左 (Left) | - | - | - |
| **Variant string.** | DataTable Column | N | - | Output | 任意可见字符 | 左 (Left) | - | - | - |
| **Comments** | DataTable Column | N | - | Output | 任意可见字符 | 左 (Left) | - | - | - |
| **Add** | DataTable Column | N | - | Output | Date (YYYY-MM-DD) | 左 (Left) | - | - | ADD_DATE |
| **Delete** | DataTable Column | N | - | Output | Date (YYYY-MM-DD) | 左 (Left) | - | - | DELETE_DATE |
| **Created by user** | DataTable Column | N | - | Output | 任意可见字符 | 左 (Left) | - | Link | 点击跳转 EDB User View |
| **Date** | DataTable Column | N | - | Output | DateTime (YYYY-MM-DD HH:mm:ss) | 左 (Left) | - | - | REGISTER_DATETIME |
| **Count** | Label | N | - | Output | 数字 | 左 (Left) | `Number of lines found: 0` | - | 显示检索结果总行数 |
| **Select** | Button | N | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 选中行后有效，回传数据 |
| **Back** | Button | N | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 返回检索画面 |
| **Print** | Button | N | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 打印当前列表 |
| **Delete selected** | Button | N | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 删除选中行，需二次确认 |

> **注**：
> - **排序规则**：默认按 `Product Class` -> `Market` -> `Number` 升序排列。
> - **Link 行为**：点击 `Created by user` 列的链接时，携带 UserID 跳转至 `EDB User View` 画面。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

1.  **初始化/加载**：
    - 接收前画面传递的检索条件。
    - 调用后端 API 获取 `HDOC_USER_DEFINED_RULES` 数据。
    - 渲染表格，更新 `Count` Label。
2.  **Select 按钮点击**：
    - 检查是否已选中某一行。
    - 若未选中，提示 `Please select a record first.`。
    - 若已选中，将该行数据封装，跳转回“Homologation Variables”画面并填充表单。
3.  **Back 按钮点击**：
    - 销毁当前画面状态，跳转回“Homologation Variables”画面，保留之前的检索条件。
4.  **Delete selected 按钮点击**：
    - 检查是否已选中某一行。
    - 弹出确认框：`Are you sure you want to delete this record?`。
    - 确认后调用删除 API，成功后刷新列表并更新 `Count`。
5.  **Print 按钮点击**：
    - 触发浏览器打印对话框或生成 PDF 预览。

### 3.2 校验详细规格表

| No. |   检查时机   |     检查对象      |                检查条件                |                          错误消息 (Message Content)                           |                 动作                 |
| :-: | :----------: | :---------------: | :------------------------------------: | :---------------------------------------------------------------------------: | :----------------------------------: |
|  1  | Click Select | Row Selection     | `SelectedRow == null`                  |                     `Please select a record first.`                     | 显示 Alert/Toast，不执行跳转 |
|  2  | Click Delete | Row Selection     | `SelectedRow == null`                  |                     `Please select a record to delete.`                     | 显示 Alert/Toast |
|  3  | API Response | Delete Result     |  `Status != Success`                   | `Failed to delete the record. Please try again.` | 显示错误信息，不刷新列表 |

## 4. 接口定义 (API Specification)

### 4.1 GetHomologationVariablesApi

- **功能**：根据检索条件获取同族变量列表。
- **Method**: `POST`
- **Endpoint**: `/api/homologation/variables/search`

#### Request Body

```json
{
  "productClass": "string",
  "market": "string",
  "number": "string"
  // 其他检索条件...
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": [
    {
      "pc": "A01",
      "num": "1001",
      "market": "JP",
      "variable": "VAR_01",
      "val": "100",
      "vs": "VS_A",
      "vs2": "Comment A",
      "addDate": "2023-01-01",
      "deleteDate": null,
      "registerUser": "user01",
      "registerDatetime": "2023-01-01 10:00:00"
    }
  ],
  "message": "success"
}
```

### 4.2 DeleteHomologationVariableApi

- **功能**：删除指定的规则记录。
- **Method**: `DELETE`
- **Endpoint**: `/api/homologation/variables/{id}`

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **网络断开/超时**        | 捕获 Network Error | `Network error. Please check your connection.` |
| **服务器内部错误 (500)** | 捕获 Server Error  | `System error. Please contact administrator.`  |
| **无检索结果**           | 前端判断 Data 为空 | `No records found matching your criteria.`     |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 管理 `dataList`, `selectedRow`, `totalCount`, `isLoading`。
    - 建议使用 Ant Design 或 Material UI 的 Table 组件以实现高效的行列渲染。
2.  **性能优化**：
    - 若数据量较大（超过 1000 条），建议启用后端分页或前端虚拟滚动。
3.  **UI 细节**：
    - `Created by user` 列应渲染为蓝色下划线文本，鼠标悬停时显示手型光标。
    - `Delete selected` 按钮建议使用红色或警示色，以提醒用户该操作的不可逆性。
    - `Count Label` 应实时反映当前表格中的行数。
