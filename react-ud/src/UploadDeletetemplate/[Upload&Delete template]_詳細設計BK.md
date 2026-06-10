# [Upload&Delete template] 详细设计说明书

| 文档编号     | DES-[Upload&Delete template]-001 | 版本号     | v1.0       |
| :----------- | :------------------------------- | :--------- | :--------- |
| **模块名称** | Upload&Delete template           | **作成日** | 2026-06-09 |
| **作成者**   | Qoder                            | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于 HDoc 模板文件的上传、删除和归档操作，支持不同 Market 的模板管理。

- **目标**：提供用户友好的界面来管理不同 Market 的 HDoc 模板文件，包括上传新模板和删除已有模板。
- **功能性**：支持文件选择、Market 选择、模板列表联动显示、上传确认和删除确认。
- **用户体验**：采用下拉列表联动机制，根据选择的 Market 动态加载对应的模板列表；通过对话框确认删除操作，防止误删；使用 Label 形式在页面内显示操作结果消息。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 项目定义_HDoc Template Upload

HDoc Template Upload 区域包含以下控件：

| 項目名 (Item)     | 種別 (Type)    | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars) | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注              |
| :---------------- | :------------- | :--------: | :-------: | :----: | :----------------------- | :--------------: | :--------------: | :----------------: | :---------------- |
| **Template File** | File Input     |     -      |     -     | Input  | -                        |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 支持常见文件格式  |
| **Market**        | Pull-down List |     -      |     3     | Input  | 半角英字                 |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 与 Templates 联动 |
| **Upload file**   | Button         |     -      |     -     | Action | -                        |   中 (Center)    |        -         |   活性 (Enabled)   | 点击触发上传流程  |

### 2.2 项目定义_HDoc Template Delete

HDoc Template Delete 区域包含以下控件：

| 項目名 (Item) | 種別 (Type)    | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars) | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                 |
| :------------ | :------------- | :--------: | :-------: | :----: | :----------------------- | :--------------: | :--------------: | :----------------: | :------------------- |
| **Market**    | Pull-down List |     -      |     3     | Input  | 半角英字                 |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 与 Templates 联动    |
| **Templates** | Pull-down List |     -      |     -     | Input  | 半角英字                 |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 根据 Market 动态加载 |
| **Delete**    | Button         |     -      |     -     | Action | -                        |   中 (Center)    |        -         |   活性 (Enabled)   | 点击触发删除流程     |

### 2.3 输出项定义

| 項目名 (Item) | 種別 (Type) | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars) | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                   |
| :------------ | :---------- | :--------: | :-------: | :----: | :----------------------- | :--------------: | :--------------: | :----------------: | :--------------------- |
| **Message**   | Label       |     -      |    256    | Output | 任意可见字符             |    左 (Left)     |    空 (Empty)    |      动态显示      | 仅在操作后显示结果消息 |

> **注**：
>
> - **半角英字**：正则表达式 `[a-zA-Z]`
> - **Pull-down List 联动**：当 Market 值改变时，自动调用 API 获取该 Market 下的模板列表并更新 Templates 下拉框
> - **File Input**：支持 `.doc`, `.docx`, `.pdf` 等常见文档格式

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

所有校验逻辑均在用户点击相应按钮时执行。

### 3.1 处理流程

#### 3.1.1 初期表示

1. **开始**：页面加载完成。
2. **调用 API**：
   - 调用 `UD12UploadDeletetemplatApi` 中 `UD12SelectMarket` 方法，取得 MARKET 的返回值。
   - 将返回值赋给画面项目 **Market**（两个区域的 Market 下拉框）。
3. **联动加载**：
   - 调用 `UD12UploadDeletetemplatApi` 中 `getTemplates` 方法，传入默认或已选择的 Market 值。
   - 返回所有模板名称，并将返回值赋给画面项目 **Templates**。
4. **结束**：初始化完成，等待用户操作。

#### 3.1.2 上传流程：[点击 Upload file 按钮]

1. **开始**：用户点击 [Upload file] 按钮。
2. **前置处理**：
   - 获取画面项目 **Template File** 的值。
   - 获取画面项目 **Market** 的值（Upload 区域的 Market）。
3. **空值校验 (Frontend Check)**：
   - 若 **Template File** 为空：
     - 设置 `Message` = `NO FILE UPLOADED`
     - **终止**流程，不调用 API。
   - 若 **Market** 为空：
     - 设置 `Message` = `请选择Market`
     - **终止**流程，不调用 API。
4. **API 调用 (Backend Check)**：
   - 若校验通过，调用 `UD12UploadDeleteTemplateApi` 中 `upload` 方法。
   - 传入参数：**Template File**, **Market**。
5. **结果处理**：
   - **成功**：设置 `Message` = `TEMPLATE XXX WAS SUCESSFULLY UPLOADED TO MARKET JPN`（XXX 为文件名，JPN 为 Market 值）
   - **失败**：设置 `Message` = 服务器返回的错误消息

#### 3.1.3 删除流程：[点击 Delete 按钮]

1. **开始**：用户点击 [Delete] 按钮。
2. **前置处理**：
   - 获取画面项目 **Market** 的值（Delete 区域的 Market）。
   - 获取画面项目 **Templates** 的值。
3. **空值校验 (Frontend Check)**：
   - 若 **Market** 为空 **或** **Templates** 为空：
     - 设置 `Message` = `请选择Market或Templates`
     - **终止**流程，不调用 API。
4. **Dialog 弹出确认**：
   - 弹出确认对话框，显示文字：`Do you really want to delete template?`
   - **确认按钮**：[删除]
   - **取消按钮**：[取消]
5. **用户选择处理**：
   - 若点击 **[删除]** 按钮：
     - 调用 `UD12UploadDeleteTemplateApi` 中 `delete` 方法。
     - 传入参数：**Market**, **Templates**。
   - 若点击 **[取消]** 按钮：
     - **终止**流程，不调用 API。
   - 若点击其他区域或关闭对话框：
     - **终止**流程，不调用 API。
6. **结果处理**：
   - **成功**：设置 `Message` = `TEMPLATE XXX WAS SUCESSFULLY DELETE FROM MARKET JPN`（XXX 为模板名，JPN 为 Market 值）
   - **失败**：设置 `Message` = 服务器返回的错误消息

### 3.2 校验详细规格表

| No. |     检查时机      |   检查对象    |          检查条件          | 错误消息 (Message Content) |          动作          |
| :-: | :---------------: | :-----------: | :------------------------: | :------------------------: | :--------------------: |
|  1  | Click Upload file | Template File | `Value == null` OR `Empty` |     `NO FILE UPLOADED`     | 显示 Message，终止流程 |
|  2  | Click Upload file |    Market     | `Value == null` OR `Empty` |       `请选择Market`       | 显示 Message，终止流程 |
|  3  |   Click Delete    |    Market     | `Value == null` OR `Empty` |       `请选择Market`       | 显示 Message，终止流程 |
|  4  |   Click Delete    |   Templates   | `Value == null` OR `Empty` |      `NO FILE DELETE`      | 显示 Message，终止流程 |

## 4. 接口定义 (API Specification)

### 4.1 UD12SelectMarket

- **功能**：获取所有可用的 Market 列表。
- **Method**: `POST`
- **Endpoint**: `/api/market/UD12SelectMarket`

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": ["JPN", "USA", "CHN"],
  "message": "success"
}
```

### 4.2 getTemplates

- **功能**：根据 Market 获取该市场下的所有模板名称列表。
- **Method**: `POST`
- **Endpoint**: `/api/market/getTemplates`

#### Request Body

```json
{
  "market": "string (Max 3, Alphanumeric)"
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": ["template1.docx", "template2.pdf", "template3.doc"],
  "message": "success"
}
```

### 4.3 upload

- **功能**：实现文件的上传。
- **Method**: `POST`
- **Endpoint**: `/api/market/UD12UploadFlie`

#### Request Body (multipart/form-data)

```
Template File: [File Object]
Market: "string (Max 3, Alphanumeric)"
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "message": "success"
}
```

#### Response Error (401 Unauthorized)

```json
{
  "code": 401,
  "data": {},
  "message": "Invalid credentials"
}
```

### 4.4 delete

- **功能**：实现文件的删除。
- **Method**: `POST`
- **Endpoint**: `/api/market/UD12DeleteTemplate`

#### Request Body

```json
{
  "market": "string (Max 3, Alphanumeric)",
  "templateName": "string"
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "message": "success"
}
```

#### Response Error (401 Unauthorized)

```json
{
  "code": 401,
  "data": {},
  "message": "Invalid credentials"
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式               | Message 显示内容                             |
| :----------------------- | :--------------------- | :------------------------------------------- |
| **网络断开/超时**        | catch 块捕获，输出日志 | `Upload failed. Please try again.`           |
| **服务器内部错误 (500)** | catch 块捕获           | 服务器返回的错误消息                         |
| **文件格式不支持**       | 前端或后端校验         | `Unsupported file format. Please try again.` |
| **文件过大**             | 后端校验               | `File size exceeds the limit.`               |
| **模板不存在**           | 后端校验               | `Template not found in specified market.`    |

## 6. 代码实现说明

### 6.1 组件结构

- **组件文件**：`UploadDeleteTemplate.tsx`
- **样式文件**：`UploadDeleteTemplate.css`
- **API 文件**：`src/api/index.ts`

### 6.2 状态管理

组件使用 React Hooks 进行状态管理：

- `selectedFile`: 选择的模板文件
- `uploadMarket`: Upload 区域选择的 Market
- `deleteMarket`: Delete 区域选择的 Market
- `selectedTemplate`: Delete 区域选择的 Templates
- `markets`: Market 列表
- `templates`: Templates 列表
- `message`: 消息显示内容
- `isLoading`: 加载状态标志
- `showConfirmDialog`: 确认对话框显示状态

### 6.3 关键方法

- `fetchMarkets()`: 获取 Market 列表
- `fetchTemplatesByMarket(market)`: 根据 Market 获取模板列表
- `handleUploadClick()`: 处理上传操作
- `handleDeleteClick()`: 处理删除操作
- `confirmDelete()`: 确认删除操作
- `cancelDelete()`: 取消删除操作

### 6.4 校验规则实现

所有校验规则均在对应的事件处理方法中实现，详见代码注释。
