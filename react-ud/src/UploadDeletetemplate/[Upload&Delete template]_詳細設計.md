# [Upload&Delete template] 详细设计说明书

| 文档编号     | DES-[Upload&Delete template]-001 | 版本号     | v1.0       |
| :----------- | :------------------------------- | :--------- | :--------- |
| **模块名称** | [Upload&Delete template]         | **作成日** | 2026-06-01 |
| **作成者**   | 系统助手                         | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于 HDoc 模板文件的上传、删除和归档操作，支持不同 Market 的模板管理。用户可以通过该界面上传新的模板文件到指定的 Market，也可以从已有的 Market 中删除不需要的模板。

- **目标**：提供直观的模板管理界面，确保模板文件能够正确上传和删除。
- **安全性**：删除操作需二次确认，防止误操作。
- **用户体验**：采用 Label 形式在页面内显示操作结果和错误信息，避免频繁弹窗打断操作流。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 项目定义\_HDoc Template Upload

| 項目名 (Item)     | 種別 (Type)    | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars) | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注             |
| :---------------- | :------------- | :--------: | :-------: | :----: | :----------------------: | :--------------: | :--------------: | :----------------: | :--------------- |
| **Template File** | File Input     |     Y      |     -     | Input  |            -             |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 文件选择控件     |
| **Market**        | Pull-down List |     Y      |     3     | Input  |         半角英字         |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 下拉选择框       |
| **Upload file**   | Button         |     -      |     -     | Action |            -             |   中 (Center)    |        -         |   活性 (Enabled)   | 点击触发上传操作 |

### 2.2 项目定义\_HDoc Template Delete

| 項目名 (Item) | 種別 (Type)    | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars) | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注             |
| :------------ | :------------- | :--------: | :-------: | :----: | :----------------------: | :--------------: | :--------------: | :----------------: | :--------------- |
| **Market**    | Pull-down List |     Y      |     3     | Input  |         半角英字         |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 下拉选择框       |
| **Templates** | Pull-down List |     Y      |     -     | Input  |         半角英字         |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 下拉选择框       |
| **Delete**    | Button         |     -      |     -     | Action |            -             |   中 (Center)    |        -         |   活性 (Enabled)   | 点击触发删除操作 |

## 3. 功能描述 (Functional Description)

### 3.1 功能1: HDoc Template Upload（模板上传）

**功能说明：Template File选择**

- **4.1** 点击"选择文件"按钮打开文件选择对话框
- **4.2** 选择要上传的文件
- **4.3** 选择的文件名显示在画面上

**功能说明：Market选择**

- **4.1** 点击下拉列表中选择

**功能说明：Upload file按钮按下**

- **4.1** 点击"Upload file"按钮
- **4.2** 如果文件未选择，显示错误消息"NO FILE UPLOADED."
- **4.3** 如果文件已选择，API呼出，执行上传处理

### 3.2 功能2: HDoc Template Delete（模板删除）

**功能说明：Market选择**

- **4.1** 点击下拉列表中选择

**功能说明：Templates选择**

- **4.1** 从Templates下拉列表中选择要删除的模板
- **4.2** 如果模板未选择，显示提示"Please select a template first."

**功能说明：Delete按钮按下**

- **4.1** 点击"Delete"按钮
- **4.2** 弹出确认对话框"Do you really want to delete template?"
- **4.3** 如果选择取消，中止处理
- **4.4** 如果选择确定，API呼出，执行删除处理

## 4. 业务逻辑与校验规则 (Business Logic & Checks)

### 4.1 处理流程

#### 4.1.1 初期表示：

- 调用 `UD12UploadDeletetemplatApi` 中 `UD12SelectMarket` 方法，取得 MARKET 的返回值。

#### 4.1.2 开始：点击 upload file 按钮

- **前置处理**：获取 Template File，Market 的值
- **空值校验等 (Frontend Check)**：
  - 若 Template File 为空时：
    - 设置 Message = "NO FILE UPLOADED"
    - 终止流程，不调用 API
  - 若 Market 为空时：
    - 设置 Message = "请选择Market"
    - 终止流程，不调用 API
- **API调用 (Backend Check)**：
  - 若校验通过，调用 `UD12UploadDeleteTemplateApi(Template File, Market)`。
- **结果处理**：
  - 成功：设置 Message = "TEMPLATE XXX WAS SUCESSFULLY UPLOADED TO MARKET JPN"
  - 失败：显示相应的错误信息

#### 4.1.3 开始：点击 delete 按钮

- **前置处理**：获取后台返回 Market，Templates 的值
- **空值校验 (Frontend Check)**：
  - 若 Market 或 Templates 为空时：
    - 设置 Message = "请选择Market或Templates"
    - 终止流程，不调用 API
    - 校验通过，接收后台返回的market对应的模板列表，Market，Templates两个下路况联动
- **确认对话框**：
  - dialog弹出，文字表示"【Do you really want to delete template?】"
  - dialog画面：
    - 确认按钮：[删除]
    - 取消按钮：[取消]
    - 若点击删除按钮：
      - 调用 `UD12UploadDeleteTemplateApi(Market, Templates)`。
    - 若点击取消按钮：
      - 终止流程，不调用 API
- **结果处理**：
  - 成功：设置 Message = "TEMPLATE XXX WAS SUCESSFULLY DELETE FROM MARKET JPN"
  - 失败：显示相应的错误信息

### 4.2 校验详细规格表

| No. |       检查时机        |   检查对象    |       检查条件       | 错误消息 (Message Content) |     动作     |
| :-: | :-------------------: | :-----------: | :------------------: | :------------------------: | :----------: |
|  1  | 点击 upload file 按钮 | Template File | Template File 为空时 |      NO FILE UPLOADED      | 显示 Message |
|  2  | 点击 upload file 按钮 |    Market     |    Market 为空时     |        请选择Market        | 显示 Message |
|  3  |   点击 delete 按钮    |    Market     |    Market 为空时     |        请选择Market        | 显示 Message |
|  4  |   点击 delete 按钮    |   Templates   |   Templates 为空时   |       NO FILE DELETE       | 显示 Message |

## 5. 接口定义 (API Specification)

### 5.1 UD12UploadDeletetemplatApi

#### 5.1.1 功能：market取得结果

- **Method**: `POST`
- **Endpoint**: `/api/market/UD12UploadFlie`

##### Response Success (200 OK)

```json
{
  "code": 200,
  "data": ["string"],
  "message": "success"
}
```

#### 5.1.2 功能：实现文件的上传与删除

- **Method**: `POST`
- **Endpoint**: `/api/market/UD12UploadFlie`

##### Request Body

```json
{
  "Template File": "string",
  "Market": "string"
}
```

##### Response Success (200 OK)

```json
{
  "code": 200,
  "message": "success"
}
```

##### Response Error (401 Unauthorized)

```json
{
  "code": 401,
  "data": {},
  "message": "Invalid credentials"
}
```

## 6. 异常处理 (Exception Handling)

| 异常场景              | 处理方式                        | Message显示内容                  |
| :-------------------- | :------------------------------ | :------------------------------- |
| **网络错误**          | catch块捕获，输出错误日志       | Upload failed. Please try again. |
| **服务器错误（500）** | catch块捕获，显示服务器错误消息 | 服务器返回的错误消息             |
