# 模板上传与删除模块 (Upload & Delete Template Module) 详细设计说明书

| 文档编号     | DES-TEMPLATE-006         | 版本号     | v1.0       |
| :----------- | :-------------------- | :--------- | :--------- |
| **模块名称** | 模板上传与删除 (Upload & Delete Template) | **作成日** | 2023-10-XX |
| **作成者**   | Lingma Assistant      | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于管理 HDoc 系统的文档模板文件。管理员可以在此画面上传新的 RTF 模板文件到指定的 Market 文件夹，或删除已存在的模板。此外，还提供跳转到“HDoc Template Check”画面的链接以进行模板校验。

- **目标**：实现模板文件的物理存储管理（上传/删除），并确保文件被放置在正确的 Market 目录下。
- **核心功能**：支持文件上传、基于 Market 和文件名的删除操作，以及模板校验跳转。
- **安全性**：删除操作需二次确认，防止误删重要模板。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表 - 上传区域 (Upload Section)

| 項目名 (Item) | 種別 (Type) | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars)          | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                    |
| :------------ | :---------- | :--------: | :-------: | :----: | :-------------------------------- | :--------------: | :--------------: | :----------------: | :---------------------- |
| **Template File** | File Input | Y* | - | Input | .rtf, .docx (根据后端限制) | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 点击选择本地文件 |
| **Market** | DropDownList | N | 3 | Input | 半角英字 (e.g., JPN, USA) | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 对应服务器上的文件夹名 |
| **Upload file** | Button | N | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 触发上传逻辑 |

### 2.2 控件属性表 - 删除区域 (Delete Section)

| 項目名 (Item) | 種別 (Type) | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars)          | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                    |
| :------------ | :---------- | :--------: | :-------: | :----: | :-------------------------------- | :--------------: | :--------------: | :----------------: | :---------------------- |
| **Market** | DropDownList | N | 3 | Input | 来自 `MARKET_MASTER` | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 选择后联动加载 Templates |
| **Templates** | DropDownList | N | - | Input | 半角英字 (文件名) | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 显示选定 Market 下的现有文件 |
| **Delete** | Button | N | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 触发删除逻辑 |

### 2.3 其他控件

| 項目名 (Item) | 種別 (Type) | 動作 | 备注 |
| :------------ | :---------- | :--- | :--- |
| **Check Template Link** | Link | 跳转 | 跳转至「HDoc Template Check」画面 |

> **注**：
> - **Market 联动**：在删除区域，选择 `Market` 后，`Templates` 下拉列表应自动刷新，显示该文件夹下的所有可用模板文件。
> - **文件限制**：建议前端限制只能选择 `.rtf` 格式的文件，以符合“Only for rtf files”的校验要求。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

1.  **Upload 按钮点击**：
    - **前置校验**：检查是否已选择 `Template File`。若未选择，报错 `NO FILE UPLOADED`。
    - 调用上传 API，将文件发送至后端指定的 `Market` 文件夹。
    - 成功后，显示 Information：`TEMPLATE [FILENAME] WAS SUCESSFULLY UPLOADED TO MARKET [MARKET_CODE]`。
2.  **Delete 按钮点击**：
    - **前置校验**：检查是否已选择 `Market` 和 `Templates`。
    - 弹出确认框：`Do you really want to delete template?`。
    - 确认后调用删除 API。
    - 成功后，显示 Information：`TEMPLATE [FILENAME] WAS SUCESSFULLY DELETE FROM MARKET [MARKET_CODE]`，并刷新 `Templates` 列表。
3.  **Check Template Link 点击**：
    - 直接跳转至模板校验画面。

### 3.2 校验详细规格表

| No. |   检查时机   |     检查对象      |                检查条件                |                          错误消息 (Message Content)                           |                 动作                 |
| :-: | :----------: | :---------------: | :------------------------------------: | :---------------------------------------------------------------------------: | :----------------------------------: |
|  1  | Click Upload | Template File     | `File == null`                         |                     `NO FILE UPLOADED`                     | 显示 Error Message，终止提交 |
|  2  | Click Delete | Confirmation      | 用户点击确认框的“Cancel”               |                     -                     | 取消删除操作 |
|  3  | API Response | Upload/Delete     |  `Status != Success`                   | `Operation failed. Please contact administrator.` | 显示错误信息 |

## 4. 接口定义 (API Specification)

### 4.1 UploadTemplateApi

- **功能**：上传模板文件到指定 Market 目录。
- **Method**: `POST`
- **Endpoint**: `/api/templates/upload`
- **Content-Type**: `multipart/form-data`

#### Request Params

- `file`: The template file.
- `market`: The target market code (e.g., "JPN").

### 4.2 GetTemplatesByMarketApi

- **功能**：获取指定 Market 下的模板文件列表。
- **Method**: `GET`
- **Endpoint**: `/api/templates/list?market={marketCode}`

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": ["template_v1.rtf", "template_v2.rtf"],
  "message": "success"
}
```

### 4.3 DeleteTemplateApi

- **功能**：删除指定 Market 下的模板文件。
- **Method**: `DELETE`
- **Endpoint**: `/api/templates/delete?market={marketCode}&filename={fileName}`

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **文件已存在**           | 后端返回冲突错误   | `Template already exists in this market.`      |
| **磁盘空间不足**         | 捕获 Server Error  | `Server storage is full. Upload failed.`       |
| **网络断开/超时**        | 捕获 Network Error | `Network error. Please check your connection.` |

## 6. 实现注意事项 (Implementation Notes)

1.  **文件上传组件**：
    - 建议使用 React 的 `<input type="file" />` 或 UI 库的 Upload 组件。
    - 上传过程中应显示进度条或 Loading 状态，因为模板文件可能较大。
2.  **状态管理**：
    - 使用 React State 管理 `selectedUploadFile`, `uploadMarket`, `deleteMarket`, `deleteTemplate`, `messageList`。
    - `deleteMarket` 变化时，自动触发 `GetTemplatesByMarketApi` 更新 `deleteTemplate` 的选项。
3.  **UI 细节**：
    - 成功消息（Information）建议使用绿色或蓝色提示框。
    - 错误消息（Error）建议使用红色提示框。
    - 确认框（Warning）应醒目显示，确保用户知晓删除操作的不可逆性。
