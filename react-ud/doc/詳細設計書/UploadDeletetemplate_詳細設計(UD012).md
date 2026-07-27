# Upload & Delete Template 模块详细设计说明书

| 文档编号     | DES-HDOC-UploadDeleteTemplate-012 | 版本号     | v1.0       |
| :----------- | :-------------------------------- | :--------- | :--------- |
| **模块名称** | Upload & Delete Template          | **作成日** | 2026-07-17 |
| **作成者**   | GitHub Copilot                    | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块为 Upload & Delete Template 页面，核心实现 Template 模板文件的上传、删除操作，同时提供跳转至 HDoc Template Check 画面的入口，支持用户完成 rtf 格式 Template 文件的校验操作，帮助用户高效完成指定文件夹内模板文件的管理维护。

- **目标**：提供 Template 模板文件的上传、删除及校验功能，实现对指定 Market 文件夹内模板文件的生命周期管理。
- **安全性**：
  - 所有涉及模板文件的上传、删除操作都保留操作留痕。
  - 删除操作前增加二次确认步骤，防止用户误删重要模板文件。
  - 上传的文件仅能写入指定文件夹，删除操作仅可针对指定文件夹内的模板文件执行，避免越权访问或修改其他路径下的业务文件。
- **用户体验**：
  - 操作触发后及时给出对应级别的提示信息。
  - 错误场景给出明确的报错提示。
  - 删除操作通过告警提示用户确认操作。
  - 成功执行操作后返回清晰的完成反馈。
  - 所有控件默认处于激活状态，操作路径简洁直观，降低用户的操作学习成本。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| No. | 项目名 (Item) | 种类 (Type) | 必须 (Req) | MaxLength | I/O | 允许字符 (Allowed Chars) | 文字对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注 |
| :-: | :------------ | :---------- | :--------: | :-------: | :-: | :----------------------- | :--------------: | :--------------: | :----------------: | :--- |
| 1 | **Template File** | File Input | - | - | Input | - | 左 (Left) | 空 (Empty) | 活性 (Enabled) | HDoc Template Upload 功能的文件选择项，用于选择待上传的模板文件 |
| 2 | **Market（上传区域）** | Pull-down List | - | 3 | Input | 半角英字 (`a-z, A-Z`) | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 下拉选项数据来源于 `MARKET_MASTER` 表的 `MARKET` 字段 |
| 3 | **Upload file** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 点击后执行选中的 Template 文件上传操作 |
| 4 | **Market（删除区域）** | Pull-down List | - | 3 | Input | 半角英字 (`a-z, A-Z`) | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 下拉选项数据来源于 `MARKET_MASTER` 表的 `MARKET` 字段 |
| 5 | **Templates** | Pull-down List | - | - | Input | 半角英字 (`a-z, A-Z`) | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 下拉选项数据来源于 Market 文件夹下的文件名，选择待删除的模板 |
| 6 | **Delete** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 点击后执行选中的 Template 文件删除操作 |
| 7 | **Check Template (Only for rtf files)** | Link | - | - | Action | - | 左 (Left) | - | 活性 (Enabled) | 点击后跳转至「HDoc Template Check」画面 |
| 8 | **Check** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | HDoc Template Check 画面的操作按钮，点击后执行选中 Template 文件的校验操作 |

> **注**：
>
> - **半角英字**：正则表达式 `[a-zA-Z]`
> - **Market（上传区域）** 与 **Market（删除区域）** 共用同一数据源，均来源于 `MARKET_MASTER` 表的 `MARKET` 字段
> - **Templates** 下拉选项的内容随 **Market（删除区域）** 选择变化而动态更新

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

#### 3.1.1 初始表示

画面正常显示，所有控件默认处于活性（Enabled）状态，所有输入项初始值为空。

#### 3.1.2 上传操作：[用户点击 Upload file 按钮触发]

1. **前置处理**：获取用户选择的 Template File 以及 Market（上传区域）的选中值。
2. **空值校验 (Frontend Check)**：
   - 若用户未选择任何 Template File：
     - 设置 `Message` = `NO FILE UPLOADED`
     - 信息级别：Error
     - **终止流程**，不调用 API。
3. **API 调用 (Backend Check)**：
   - 若前端校验通过，以 `form-data` 格式调用 `UD12UploadDeletetemplatApi.UD12UploadFlie` 接口，将选中的 Template 文件上传至指定 Market 对应的文件夹中。
4. **结果处理**：
   - **成功**：
     - 设置 `Message` = `TEMPLATE XXX WAS SUCESSFULLY UPLOADED TO MARKET JPN`（XXX 为上传的文件名，JPN 为选中的 Market）
     - 信息级别：Information
     - 刷新页面可查看已上传的文件列表
   - **失败**：
     - 显示对应的文件上传失败错误提示
     - 信息级别：Error

#### 3.1.3 删除操作：[用户点击 Delete 按钮触发]

1. **前置处理**：获取用户选择的 Market（删除区域）和 Templates 的选中值。
2. **二次确认 (Frontend Check)**：
   - 触发确认弹窗，设置 `Message` = `Do you really want to delete template?`
   - 信息级别：Warning
   - 若用户选择取消操作：
     - **终止流程**，不调用 API。
3. **API 调用 (Backend Check)**：
   - 若用户确认操作，以 JSON 格式调用 `UD12UploadDeletetemplatApi.UD12DeleteFlie` 接口，删除选中 Market 对应文件夹内选定的 Template 文件。
4. **结果处理**：
   - **成功**：
     - 设置 `Message` = `TEMPLATE XXX WAS SUCESSFULLY DELETE FROM MARKET JPN`（XXX 为删除的文件名，JPN 为选中的 Market）
     - 信息级别：Information
     - 刷新页面更新 Templates 下拉选项的可选内容
   - **失败**：
     - 显示对应的文件删除失败错误提示
     - 信息级别：Error

#### 3.1.4 跳转操作：[用户点击 Check Template (Only for rtf files) 链接触发]

- 直接跳转至「HDoc Template Check」画面，画面加载后所有控件正常显示。

#### 3.1.5 校验操作：[用户在 HDoc Template Check 画面选择 Template 文件后点击 Check 按钮触发]

1. **前置处理**：获取用户在 HDoc Template Check 画面选择的 Template 文件。
2. **API 调用**：调用对应的 Template 校验接口。
3. **结果处理**：
   - **成功**：返回模板校验通过提示。
   - **失败**：返回模板校验失败对应的问题提示。

### 3.2 校验详细规格表

| No. | 检查时机 | 检查对象 | 检查条件 | 错误消息 (Message Content) | 动作 |
| :-: | :------- | :------- | :------- | :------------------------- | :--- |
| 1 | 点击 Upload 按钮时 | 上传操作 | 未选择任何 Template 文件直接点击 Upload 按钮 | `NO FILE UPLOADED` | 弹出 Error 级别提示，终止后续上传流程 |
| 2 | 上传操作执行完成时 | 上传操作 | Template 文件正常上传完成 | `TEMPLATE XXX WAS SUCESSFULLY UPLOADED TO MARKET JPN` | 弹出 Information 级别提示，刷新页面可查看已上传的文件列表 |
| 3 | 点击 Delete 按钮时 | 删除操作 | 点击 Delete 按钮触发操作 | `Do you really want to delete template?` | 弹出 Warning 级别二次确认弹窗，等待用户确认或取消 |
| 4 | 删除操作执行完成时 | 删除操作 | Template 文件正常从指定文件夹删除完成 | `TEMPLATE XXX WAS SUCESSFULLY DELETE FROM MARKET JPN` | 弹出 Information 级别提示，刷新页面更新 Templates 下拉选项的可选内容 |

## 4. 接口定义 (API Specification)

### 4.1 UD12UploadDeletetemplatApi.UD12SelectMarket

- **功能**：获取下拉选项数据，来源于 `MARKET_MASTER` 表的 `MARKET` 字段。
- **Method**: `GET`
- **Endpoint**: `/api/ud012/UD12UploadDeletetemplatApi/UD12SelectMarket`

#### Request

```json
{
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "msg": null,
  "data": ["JPN", "EDG", "SNG", "TB"]
}
```

##### 响应字段说明

| 字段名 | 类型 | 说明 |
| :----- | :--- | :--- |
| code | int | 状态码 200 表示成功 |
| msg | string | 成功时返回 null |
| data | string[] | Market 编码数组，供下拉选项使用 |

#### Response Error (400 Bad Request)

```json
{
  "code": 400,
  "msg": "NO FILE UPLOADED",
  "data": null
}
```

### 4.2 UD12UploadDeletetemplatApi.UD12UploadFlie

- **功能**：将用户选中的 Template 文件上传至指定 Market 对应的文件夹内。
- **Method**: `POST`
- **Endpoint**: `/api/ud012/UD12UploadDeletetemplatApi/UD12UploadFlie`
- **Content-Type**: `multipart/form-data`

#### Request (form-data)

| 参数名 | 类型 | 必填 | 说明 |
| :----- | :--- | :--: | :--- |
| market | string | Y | Market 编码，例如 `JPN` |
| file | File | Y | 待上传的 `.rtf` 模板文件流 |

##### 请求示例

```
market: "JPN"
file: 待上传的template.rtf文件
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "msg": "TEMPLATE XXX WAS SUCESSFULLY UPLOADED TO MARKET JPN",
  "data": null
}
```

##### 响应字段说明

| 字段名 | 类型 | 说明 |
| :----- | :--- | :--- |
| code | int | 状态码 200 表示上传成功 |
| msg | string | 成功消息，包含文件名和 Market 信息 |
| data | null | 成功时 data 为空 |

#### Response Error (400 Bad Request)

```json
{
  "code": 400,
  "msg": "NO FILE UPLOADED",
  "data": null
}
```

### 4.3 UD12UploadDeletetemplatApi.UD12DeleteFlie

- **功能**：删除指定 Market 对应文件夹内用户选中的 Template 文件。
- **Method**: `POST`
- **Endpoint**: `/api/ud012/UD12UploadDeletetemplatApi/UD12DeleteFlie`
- **Content-Type**: `application/json`

#### Request Body

| 参数名 | 类型 | 必填 | 说明 |
| :----- | :--- | :--: | :--- |
| market | string | Y | Market 编码，例如 `JPN` |
| templateName | string | Y | 待删除的模板文件名，例如 `XXX.rtf` |

##### 请求示例

```json
{
  "market": "JPN",
  "templateName": "XXX.rtf"
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "msg": "TEMPLATE XXX WAS SUCESSFULLY DELETE FROM MARKET JPN",
  "data": null
}
```

##### 响应字段说明

| 字段名 | 类型 | 说明 |
| :----- | :--- | :--- |
| code | int | 状态码 200 表示删除成功 |
| msg | string | 成功消息，包含文件名和 Market 信息 |
| data | null | 成功时 data 为空 |

#### Response Error (400 Bad Request)

```json
{
  "code": 400,
  "msg": "NO FILE UPLOADED",
  "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景 | 处理方式 | Message 显示内容 |
| :------- | :------- | :--------------- |
| 接口调用超时或返回系统内部错误 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.` |

## 6. 实现注意事项 (Implementation Notes)

1. **状态管理**：
   - 使用 React State 管理 `uploadMarket`、`deleteMarket`、`selectedFile`、`templateList`、`message`、`isLoading`。
   - `Message` 区域根据信息级别（Information / Warning / Error）显示不同样式的提示信息。

2. **输入限制**：
   - Market（上传区域 / 删除区域）下拉列表数据来源于 `UD12SelectMarket` 接口返回的 `MARKET_MASTER` 数据。
   - Templates 下拉列表内容根据选中的 Market（删除区域）动态加载对应文件夹下的文件列表。

3. **上传功能**：
   - 使用 `<input type="file">` 控件实现文件选择，支持 `.rtf` 格式的模板文件。
   - 文件上传请求以 `form-data` 格式发送，包含 `market` 和 `file` 两个字段。
   - Upload file 按钮在 `isLoading` 期间应设为 `disabled` 状态，防止重复提交。

4. **删除功能**：
   - 点击 Delete 按钮后首先弹出 Warning 级别二次确认弹窗。
   - 用户确认后以 JSON 格式调用删除接口，传递 `market` 和 `templateName` 参数。
   - 删除成功后刷新 Templates 下拉选项内容。

5. **跳转功能**：
   - Check Template (Only for rtf files) 链接点击后通过路由导航跳转至「HDoc Template Check」画面。

6. **UI 细节**：
   - Error 级别消息使用红色（`#ff4d4f`）以起到警示作用。
   - Information 级别消息使用蓝色（`#1890ff`）表示操作完成反馈。
   - Warning 级别消息使用黄色（`#faad14`）用于删除二次确认弹窗。
   - 上传区域与删除区域在视觉上进行适当分隔，便于用户区分功能区域。
