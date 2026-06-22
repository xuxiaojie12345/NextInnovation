# HDoc模板校验模块 (HDoc Template Check Module) 详细设计说明书

| 文档编号     | DES-TEMPLATE-CHECK-009    | 版本号     | v1.0       |
| :----------- | :-------------------- | :--------- | :--------- |
| **模块名称** | HDoc模板校验 (HDoc Template Check) | **作成日** | 2023-10-XX |
| **作成者**   | Lingma Assistant      | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于对上传的 HDoc 模板文件（通常为 RTF 格式）进行内容校验。系统会解析文件内容，提取位于 `$` 符号之间的变量定义，并统计变量数量，以确保模板格式的规范性。

- **目标**：在模板正式投入使用前，自动检测其内部变量定义的完整性与正确性。
- **核心功能**：文件读取、变量模式匹配（Regex）、错误提示及校验后的文件下载。
- **交互性**：提供“Check”按钮触发校验，校验通过后显示下载链接。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item) | 種別 (Type) | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars)          | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                    |
| :------------ | :---------- | :--------: | :-------: | :----: | :-------------------------------- | :--------------: | :--------------: | :----------------: | :---------------------- |
| **Template File** | File Input | Y* | - | Input | .rtf, .docx | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 选择待校验的本地文件 |
| **Check** | Button | N | - | Action | - | 左 (Left) | - | 活性 (Enabled) | 触发文件内容解析与校验 |
| **Download checked template link** | Link | N | - | Output | URL String | 左 (Left) | 隐藏/空 | 动态显示 | 校验成功后显示，点击下载 |

> **注**：
> - **变量识别规则**：系统需识别文件中所有被 `$` 包裹的内容（例如 `$VARIABLE_NAME$`）。
> - **Link 行为**：该链接仅在文件校验通过且无致命错误时显示。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

1.  **Check 按钮点击**：
    - **前置校验**：检查是否已选择 `Template File`。若未选择，报错 `ERROR: Unable to access file!`。
    - **文件读取**：后端接收文件并打开，读取文本内容。
    - **内容解析**：使用正则表达式查找所有 `$...$` 模式的字符串。
    - **逻辑校验**：
        - 若文件中未找到任何变量定义，报错 `ERROR: The file content is incorrect!`。
        - 若找到变量，统计个数并记录日志。
    - **结果反馈**：
        - 校验成功：显示 `Download checked template link`。
        - 校验失败：在页面显著位置显示红色错误消息。
2.  **Download Link 点击**：
    - 用户点击链接，浏览器下载经过校验（或已修复格式）的模板文件。

### 3.2 校验详细规格表

| No. |   检查时机   |     检查对象      |                检查条件                |                          错误消息 (Message Content)                           |                 动作                 |
| :-: | :----------: | :---------------: | :------------------------------------: | :---------------------------------------------------------------------------: | :----------------------------------: |
|  1  | Click Check  | Template File     | `File == null`                         |                     `ERROR: Unable to access file!`                     | 显示 Error Message，终止处理 |
|  2  | File Parsing | File Content      | `Count(Variables between $) == 0`      |                     `ERROR: The file content is incorrect!`             | 显示 Error Message，不显示下载链接 |

## 4. 接口定义 (API Specification)

### 4.1 CheckTemplateApi

- **功能**：上传并校验模板文件内容。
- **Method**: `POST`
- **Endpoint**: `/api/templates/check`
- **Content-Type**: `multipart/form-data`

#### Request Params

- `file`: The template file to be checked.

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": {
    "isValid": true,
    "variableCount": 15,
    "downloadUrl": "/api/templates/download-checked/xyz123.rtf"
  },
  "message": "Template check passed."
}
```

#### Response Error (400 Bad Request)

```json
{
  "code": 400,
  "data": null,
  "message": "ERROR: The file content is incorrect!"
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **文件格式不支持**       | 前端/后端拦截     | `Only .rtf files are supported for checking.`  |
| **文件损坏/无法读取**    | 捕获 IO Error      | `ERROR: Unable to access file!`                |
| **服务器内部错误 (500)** | 捕获 Server Error  | `System error. Please contact administrator.`  |

## 6. 实现注意事项 (Implementation Notes)

1.  **文件解析逻辑**：
    - 由于 RTF 文件包含大量格式控制符，建议后端使用专门的 RTF 解析库（如 Java 的 `RTFEditorKit` 或 Python 的 `pyrtf`）提取纯文本后再进行 `$` 符号匹配。
2.  **状态管理**：
    - 使用 React State 管理 `selectedFile`, `checkResult`, `downloadUrl`, `errorMessage`。
    - 校验过程中应显示 Loading 状态，因为文件解析可能需要几秒钟。
3.  **UI 细节**：
    - `Download checked template link` 建议使用蓝色下划线样式，并在旁边显示“校验通过”的绿色对勾图标。
    - 错误消息应使用醒目的红色字体，并尽可能指出具体是哪一部分内容不符合规范（如果后端能提供更详细的错误定位）。