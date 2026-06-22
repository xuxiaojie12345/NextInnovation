# 可用模板列表模块 (List Available Templates Module) 详细设计说明书

| 文档编号     | DES-TEMPLATE-LIST-007    | 版本号     | v1.0       |
| :----------- | :-------------------- | :--------- | :--------- |
| **模块名称** | 可用模板列表 (List Available Templates) | **作成日** | 2023-10-XX |
| **作成者**   | Lingma Assistant      | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于展示系统中已存储的 HDoc 模板文件列表。用户通过选择特定的 Market，可以查看该市场目录下所有可用的模板文件及其详细信息（如文件名、是否被规则引用、最后修改时间、文件大小等）。

- **目标**：提供透明的模板文件管理视图，帮助用户了解哪些模板正在被业务规则（HDOC_USER_DEFINED_RULES）使用。
- **核心功能**：按 Market 筛选文件，支持点击文件名直接下载模板。
- **数据关联**：自动关联 `HDOC_USER_DEFINED_RULES` 表，显示模板对应的变量名（Used 列）。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item) | 種別 (Type) | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars)          | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                    |
| :------------ | :---------- | :--------: | :-------: | :----: | :-------------------------------- | :--------------: | :--------------: | :----------------: | :---------------------- |
| **SelectMarket**| DropDownList|     N      |     3     | Input  | 半角英字 (来自 MARKET_MASTER)     |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 触发列表刷新          |
| **Filename**  | DataTable Column | N | - | Output | 任意可见字符 (.rtf/.docx)         |    左 (Left)     |        -         |   Link (Download)  | 点击触发下载          |
| **Used**      | DataTable Column | N | - | Output | 任意可见字符 (Variable Name)      |    左 (Left)     |        -         |         -          | 若被规则引用则显示变量名 |
| **Last Mod.** | DataTable Column | N | - | Output | Date/Time String                  |    左 (Left)     |        -         |         -          | 文件最后修改时间      |
| **Size**      | DataTable Column | N | - | Output | Number (KB/MB)                    |    左 (Left)     |        -         |         -          | 文件大小                |

> **注**：
> - **Used 列逻辑**：如果该模板文件名在 `HDOC_USER_DEFINED_RULES` 表的 `VARIABLE` 字段中被引用，则在此列显示该变量名；否则显示为空或“-”。
> - **下载行为**：点击 `Filename` 链接时，浏览器应直接开始下载该文件。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

1.  **初始化/加载**：
    - 从后端获取 `MARKET_MASTER` 列表，填充 `SelectMarket` 下拉框。
2.  **SelectMarket 变更**：
    - 用户选择一个 Market。
    - 调用 API 获取该 Market 文件夹下的所有文件信息。
    - 同时查询 `HDOC_USER_DEFINED_RULES` 以匹配“Used”信息。
    - 渲染表格。
3.  **Filename 点击**：
    - 获取当前行的文件路径和名称。
    - 调用下载接口或直接访问文件 URL。

### 3.2 校验详细规格表

| No. |   检查时机   |     检查对象      |                检查条件                |                          错误消息 (Message Content)                           |                 动作                 |
| :-: | :----------: | :---------------: | :------------------------------------: | :---------------------------------------------------------------------------: | :----------------------------------: |
|  1  | Market Change| API Response      |  `Folder is empty`                     | `No templates found for this market.` | 清空表格，显示提示信息 |
|  2  | Download     | File Existence    |  `File not found on server`            | `The requested template no longer exists.` | 显示 Error Toast |

## 4. 接口定义 (API Specification)

### 4.1 GetMarketListApi

- **功能**：获取所有可用的 Market 代码列表。
- **Method**: `GET`
- **Endpoint**: `/api/templates/markets`

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": ["JPN", "USA", "EUR"],
  "message": "success"
}
```

### 4.2 GetTemplatesByMarketApi

- **功能**：获取指定 Market 下的模板文件详情及引用情况。
- **Method**: `GET`
- **Endpoint**: `/api/templates/list?market={marketCode}`

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": [
    {
      "filename": "template_v1.rtf",
      "usedBy": "VAR_001",
      "lastModified": "2023-11-25 14:30:00",
      "size": "2048 KB"
    },
    {
      "filename": "template_v2.rtf",
      "usedBy": null,
      "lastModified": "2023-11-20 09:15:00",
      "size": "1024 KB"
    }
  ],
  "message": "success"
}
```

### 4.3 DownloadTemplateApi

- **功能**：下载指定的模板文件。
- **Method**: `GET`
- **Endpoint**: `/api/templates/download?market={marketCode}&filename={fileName}`
- **Response**: `Content-Type: application/octet-stream`

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **网络断开/超时**        | 捕获 Network Error | `Network error. Please check your connection.` |
| **服务器内部错误 (500)** | 捕获 Server Error  | `System error. Please contact administrator.`  |
| **文件读取权限不足**     | 捕获 Auth Error    | `Access denied. You do not have permission.`   |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 管理 `marketList`, `selectedMarket`, `templateData`, `isLoading`。
    - 建议使用 `useEffect` 监听 `selectedMarket` 的变化以自动触发数据加载。
2.  **性能优化**：
    - 如果某个 Market 下的文件数量非常多，建议后端提供分页或模糊搜索功能。
    - “Used”列的查询涉及跨表/跨源关联，建议在后端一次性完成聚合，避免前端多次请求。
3.  **UI 细节**：
    - `Filename` 列应渲染为蓝色下划线文本，鼠标悬停时显示手型光标和“Download”提示。
    - 表格建议增加斑马纹（Zebra Striping）以提高大量数据时的可读性。
    - `Last Mod.` 和 `Size` 列应保持固定的格式（如日期统一为 `YYYY-MM-DD`，大小统一为 KB）。
