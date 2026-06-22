# Generate Homologation Document 模块 (Generate Homologation Document Module) 详细设计说明书

| 文档编号     | DES-HDOC-001                | 版本号     | v1.1       |
| :----------- | :-------------------------- | :--------- | :--------- |
| **模块名称** |  homologation 文档生成 (Generate Homologation Document) | **作成日** | 2022-11-21 |
| **作成者**   | UD 劉 / UD 李               | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块属于 UD HDoc & VBI(UDBI) 替换项目的一部分，主要用于根据底盘系列、底盘号和文档类型生成相应的认证文档（Homologation Document）。

- **目标**：允许用户输入特定的车辆标识信息，检索并生成对应的 VIN Plate 或相关文档。
- **用户体验**：支持记住上一次的搜索条件，提供重置功能以快速清空表单，并在出错时通过页面内的 Label 显示错误信息。
- **业务流程**：
    1.  **初始显示**：加载页面时，自动填充上次使用的搜索条件。
    2.  **提交处理**：验证输入后，调用后端服务生成文档，并跳转至结果页面。
    3.  **帮助支持**：提供 Help 按钮跳转至帮助页面。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item) | 種別 (Type) | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars)          | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                    |
| :------------ | :---------- | :--------: | :-------: | :----: | :-------------------------------- | :--------------: | :--------------: | :----------------: | :---------------------- |
| **Chassis series** | TextField   |     Y      |     5     | Input  | 半角英字 (`a-z, A-Z`)             |    左 (Left)     | 上次搜索值或空   |   活性 (Enabled)   | 自动去除首尾空格        |
| **Chassis no**     | TextField   |     Y      |    10     | Input  | 半角数字 (`0-9`)                  |    左 (Left)     | 上次搜索值或空   |   活性 (Enabled)   | 自动去除首尾空格        |
| **Document type**  | DropDownList|     Y      |     -     | Input  | 半角英数字 + 記号                 |    左 (Left)     | 上次搜索值或空   |   活性 (Enabled)   | 数据源: `HDOC_DOCUMENT_LIST` |
| **Submit**         | Button      |     -      |     -     | Action | -                                 |   中 (Center)    |        -         |   活性 (Enabled)   | 触发校验与文档生成      |
| **Reset**          | Button      |     -      |     -     | Action | -                                 |   中 (Center)    |        -         |   活性 (Enabled)   | 重置为初始状态          |
| **Help**           | Button      |     -      |     -     | Action | -                                 |   中 (Center)    |        -         |   活性 (Enabled)   | 跳转至 Help 页面        |
| **Support Mail**   | Label       |     -      |     -     | Output | 任意可见字符                      |    左 (Left)     |   (内容确认中)   |      静态显示      | 显示支持邮箱信息        |
| **Error Message**  | Label       |     -      |     -     | Output | 任意可见字符                      |    左 (Left)     |    空 (Empty)    |      动态显示      | 仅在出错时显示红色文字  |

> **注**：
>
> - **半角英字**：正则表达式 `[a-zA-Z]`
> - **半角数字**：正则表达式 `[0-9]`
> - **Document type**：下拉列表选项需从后端接口 `HDOC_DOCUMENT_LIST` 获取。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

所有校验逻辑均在用户点击 **[Submit]** 按钮时执行。

### 3.1 处理流程

1.  **开始**：用户点击 [Submit] 按钮。
2.  **前置处理**：获取 `Chassis series`, `Chassis no`, `Document type values`，执行 `trim()` 去除首尾空白。
3.  **必填校验 (Frontend Check)**：
    - 若任一必填项 (`Chassis series`, `Chassis no`, `Document type`) 为空：
      - 设置 `Error Message` = `Please fill in all required fields.` (示例消息，具体依UI规范定)
      - **终止**流程，不调用 API。
4.  **API 调用 (Backend Check)**：
    - 若校验通过，调用文档生成接口，传入筛选条件。
5.  **结果处理**：
    - **成功**：跳转至 "Generate document" 画面，展示 VIN Plate 创建结果。
    - **失败 (无数据)**：设置 `Error Message` = `Chassis no is not exists`。
    - **其他错误**：显示相应的系统错误信息。

### 3.2 校验详细规格表

| No. |   检查时机   |     检查对象      |                检查条件                |                          错误消息 (Message Content)                           |                 动作                 |
| :-: | :----------: | :---------------: | :------------------------------------: | :---------------------------------------------------------------------------: | :----------------------------------: |
|  1  | Click Submit | 所有必填字段       | `Value == null` OR `Trim(Value) == ""` |                     `Please fill in all required fields.`                     | 显示 Error Message，焦点停留在第一个空字段 |
|  2  | API Response | 数据库查询结果     |  `Result Count == 0`                   |                        `Chassis no is not exists`                             | 显示 Error Message                   |
|  3  | API Response | 服务器异常         |  `Status != Success`                   |                     `System error. Please try again later.`                   | 显示 Error Message                   |

## 4. 接口定义 (API Specification)

### 4.1 Get Document Types (初始化/下拉框数据)

- **功能**：获取可用的文档类型列表。
- **Method**: `GET`
- **Endpoint**: `/api/hdoc/document-types` (示例路径)
- **Source Table**: `HDOC_DOCUMENT_LIST`

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": [
    { "value": "TYPE_A", "label": "Type A Document" },
    { "value": "TYPE_B", "label": "Type B Document" }
  ]
}
```

### 4.2 Generate Document (提交处理)

- **功能**：根据条件生成 Homologation 文档。
- **Method**: `POST`
- **Endpoint**: `/api/hdoc/generate` (示例路径)

#### Request Body

```json
{
  "chassisSeries": "string (Max 5, Alphabetic)",
  "chassisNo": "string (Max 10, Numeric)",
  "documentType": "string"
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": {
    "redirectUrl": "/generate-document-result",
    "documentId": "DOC-123456"
  },
  "message": "success"
}
```

#### Response Error (404 Not Found - Chassis Not Exists)

```json
{
  "code": 404,
  "data": null,
  "message": "Chassis no is not exists"
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **网络断开/超时**        | 捕获 Network Error | `Network error. Please check your connection.` |
| **服务器内部错误 (500)** | 捕获 Server Error  | `System error. Please contact administrator.`  |
| **输入格式错误**         | 前端实时拦截       | 仅允许输入定义的字符类型（如 Chassis No 仅数字） |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 或 Context 管理表单数据 (`chassisSeries`, `chassisNo`, `documentType`)。
    - **持久化**：需使用 `localStorage` 或 `sessionStorage` 保存上一次的搜索条件，以便在页面刷新或重新进入时自动回填 (`Initial Value`)。
2.  **安全性**：
    - 对输入数据进行严格 sanitization，防止注入攻击。
    - API 请求必须通过 HTTPS 发送。
3.  **UI 细节**：
    - [Submit](file://f:\git\NextInnovation\react-ud\src\Generate_Homologation_Document\GenerateHomologationDocument.tsx#L10-L10) 按钮在请求进行中应设为 `disabled`，防止重复提交。
    - `Error Message` Label 默认隐藏，当有错误内容时显示，建议使用红色字体以起到警示作用。
    - [Reset](file://f:\git\NextInnovation\react-ud\src\Generate_Homologation_Document\GenerateHomologationDocument.tsx#L11-L11) 按钮点击后，应将表单重置为“初始显示”状态（即清除当前输入，若需保留上次搜索条件则需明确业务定义，通常 Reset 指清空当前会话输入或恢复默认）。*注：根据文档描述“画面を初期表示する”，通常指清空或恢复至刚进入页面的状态（含上次记忆值）。*
    - [Help](file://f:\git\NextInnovation\react-ud\src\Generate_Homologation_Document\GenerateHomologationDocument.tsx#L12-L12) 按钮点击后，打开新窗口或路由跳转至 Help 页面。