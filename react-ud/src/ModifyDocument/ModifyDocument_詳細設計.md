# 修改文档模块 (Modify Document Module) 详细设计说明书

| 文档编号     | DES-MODIFY-DOC-UD05       | 版本号     | v1.0       |
| :----------- | :------------------------ | :--------- | :--------- |
| **模块名称** | Modify Document           | **作成日** | 2022-11-21 |
| **作成者**   | UD 刘                     | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于显示和修改VIN Plate文档中的可变项目。用户可以从上一画面接收底盘号和市场参数，查看当前值并输入修改后的值。点击Save按钮后，跳转到Save Modifications画面显示修改内容。同时支持下载Template文件和查看底盘详细信息。

- **目标**：提供清晰的文档修改界面，支持变量值的查看和修改操作。
- **安全性**：Modified value字段允许用户输入，但需校验至少有一个项目被修改；所有数据基于底盘号从多个数据源表检索。
- **用户体验**：采用数据表格形式展示Variable、Description、Current value、Modified value；支持Template文件下载和底盘详情查看链接。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item)          | 種別 (Type)    | 必須 (Req) | MaxLength |   I/O    | 許容文字 (Allowed Chars)      | 文字配置 (Align) | 初期値 (Default)        | 表示制御 (Control) | 备注                                                                 |
| :--------------------- | :------------- | :--------: | :-------: | :------: | :---------------------------- | :--------------: | :---------------------- | :----------------: | :------------------------------------------------------------------- |
| **chassis no**         | Label          |     -      |     -     | Output   | -                             |    左 (Left)     | =F9（由前画面传递）     | -                  | 从上一画面接收                                                     |
| **Market**             | Label          |     -      |     -     | Output   | -                             |    左 (Left)     | =F10（由前画面传递）    | -                  | 从上一画面接收                                                     |
| **Template文件**       | Link           |     -      |     -     | Output   | -                             |    左 (Left)     | Template名              | -                  | 点击下载Vin Plate的.trf文件（不含值）                              |
| **Variable**           | DataTable Column |   -      |     -     | Output   | -                             |    左 (Left)     | -                       | -                  | 来自Template文件的项目                                             |
| **Description**        | DataTable Column |   -      |     -     | Output   | -                             |    左 (Left)     | -                       | -                  | 来自HDOC_VARIABLES.DESCRIPTION                                     |
| **Current value**      | DataTable Column |   -      |     -     | Output   | -                             |    左 (Left)     | -                       | -                  | 来自HDOC_ADCA_MODIFICATION.NEWVAL或HDOC_REC_DATA_KOLA_VARIANT.SYMBOL |
| **Modified value**     | DataTable Column |   -      |    500    | Input    | -                             |    左 (Left)     | 空 (Empty)              |   活性 (Enabled)   | 如果Modify中不存在，则为空                                         |
| **Save**               | Button         |     -      |     -     | Action   | -                             |   中 (Center)    | -                       |   活性 (Enabled)   | 保存修改并跳转到Save Modifications画面                             |

> **注**：
> - **数据检索逻辑**：
>   - Current value的获取规则：
>     1. 优先从 HDOC_ADCA_MODIFICATION.NEWVAL 获取（如果存在Modify记录）
>     2. 若Modify中不存在，则从 HDOC_REC_DATA_KOLA_VARIANT.SYMBOL 获取
>   - Modified value初始为空，用户可输入修改后的值（最大500字符）
> - **链接行为**：
>   - Template文件链接：点击下载Vin Plate的.trf文件（不含值）
>   - Chassis no链接：点击跳转到Vehicle Specification画面，显示底盘详细信息

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

所有校验逻辑均在用户执行操作时同步或异步执行。

### 3.1 处理流程

#### 3.1.1 页面初始化流程

1.  **开始**：页面加载事件触发。
2.  **前置处理**：从URL参数或state中获取 chassis no (=F9) 和 Market (=F10)。
3.  **空值校验 (Frontend Check)**：
    - 若 `chassis no` 或 `Market` 为空：
      - 设置 Message = `No chassis or market information provided.`
      - **终止**流程，不显示任何数据。
4.  **API 调用 (Backend Check)**：
    - 调用 `GetModifyDocumentApi(chassisNo, market)` 获取修改文档数据。
    - API内部执行以下数据检索：
      1. 从 Template文件解析 Variable 列表
      2. 从 HDOC_VARIABLES 获取 Description
      3. 从 HDOC_ADCA_MODIFICATION + HDOC_REC_DATA_KOLA_VARIANT 获取 Current value
5.  **结果处理**：
    - **成功**：将所有数据填充到DataTable中。
    - **失败**：若无数据：显示 `No data found for this chassis.`；若其他错误：显示具体错误消息。

#### 3.1.2 Save操作流程

1.  **开始**：用户点击 Save 按钮。
2.  **前置处理**：获取所有 Modified value 字段的值。
3.  **必填校验 (Frontend Check)**：
    - 若所有 Modified value 字段均为空（未在任何项目中输入内容）：
      - 设置 Message = `NO UNRELEASED VERSION EXISTS!`
      - Message级别 = Error
      - **终止**流程，不跳转画面。
4.  **数据处理**：
    - 收集所有非空的 Modified value 及其对应的 Variable、Current value。
    - 将数据存储到state或临时变量中。
5.  **画面迁移**：
    - 跳转到 Save Modifications 画面。
    - 传递修改内容数据（包括 chassis no、doctype、version、storing等）。

#### 3.1.3 Template文件下载流程

1.  **开始**：用户点击 Template文件 链接。
2.  **处理逻辑**：
    - 构建Template文件的下载URL。
    - 触发浏览器下载 .trf 文件（不含值）。
3.  **结果处理**：
    - **成功**：浏览器开始下载文件。
    - **失败**：显示 `Template file not found.` 错误提示。

#### 3.1.4 Chassis no链接点击流程

1.  **开始**：用户点击 Chassis no 链接。
2.  **处理逻辑**：
    - 获取当前 chassis no 值。
    - 跳转到 Vehicle Specification 画面，传递 chassis no 参数。
3.  **结果处理**：
    - **成功**：打开 Vehicle Specification 画面，显示底盘详细信息。
    - **失败**：若底盘不存在，显示错误提示。

### 3.2 校验详细规格表

| No. |   检查时机   |       检查对象       |                  检查条件                   |                          错误消息 (Message Content)                           |    错误级别    |                 动作                 |
| :-: | :----------: | :------------------: | :-----------------------------------------: | :---------------------------------------------------------------------------: | :------------: | :----------------------------------: |
|  1  | Click Save   | Modified value       | 所有Modified value字段均为空                |                     `NO UNRELEASED VERSION EXISTS!`                     |     Error      | 显示错误消息，终止操作，不跳转画面 |
|  2  |  页面初始化  | Chassis/Market参数   | `Value == null` OR `== ""`                  |                     `No chassis or market information provided.`                     |     Error      | 显示错误消息，不加载数据 |
|  3  |  API 响应   | 修改文档数据查询结果 |      无对应底盘的数据                       |                     `No data found for this chassis.`                     |     Error      | 显示错误消息，清空DataTable |

## 4. 接口定义 (API Specification)

### 4.1 GetModifyDocumentApi

- **功能**：根据底盘号和市场获取修改文档数据。
- **Method**: `GET`
- **Endpoint**: `/api/ud05/getmodifydocument`

#### Request Params

```json
{
  "chassisNo": "string (从上一画面传递)",
  "market": "string (从上一画面传递)"
}
```

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "获取修改文档成功",
  "data": {
    "chassisNo": "ABC-123456",
    "market": "EU",
    "templateFile": "aus/UD_TEST.odt",
    "variables": [
      {
        "variable": "VIN_NUMBER",
        "description": "Vehicle Identification Number",
        "currentValue": "WVWZZZ3CZWE123456",
        "modifiedValue": ""
      },
      {
        "variable": "ENGINE_TYPE",
        "description": "Engine Type Code",
        "currentValue": "DPX123",
        "modifiedValue": ""
      }
    ]
  }
}
```

##### 响应字段说明

| 字段名       | 类型     | 说明                                                                              |
| :----------- | :------- | :-------------------------------------------------------------------------------- |
| chassisNo    | String   | 底盘号，从上一画面传递                                                            |
| market       | String   | 市场，从上一画面传递                                                              |
| templateFile | String   | Template文件路径，例如 "aus/UD_TEST.odt"                                          |
| variables    | Array    | 变量列表                                                                          |
| ├─ variable  | String   | 变量名，来自Template文件的项目                                                    |
| ├─ description | String | 描述，来自HDOC_VARIABLES.DESCRIPTION                                              |
| ├─ currentValue | String | 当前值，来自HDOC_ADCA_MODIFICATION.NEWVAL或HDOC_REC_DATA_KOLA_VARIANT.SYMBOL      |
| ─ modifiedValue | String | 修改后的值，初始为空，用户可输入                                                  |

#### Response Error (400/500)

```json
{
  "success": false,
  "message": "No data found for this chassis.",
  "data": null
}
```

### 4.2 DownloadTemplateApi

- **功能**：下载Template文件（.trf格式，不含值）。
- **Method**: `GET`
- **Endpoint**: `/api/ud05/downloadtemplate/{templateName}`

#### Response

- Content-Type: `application/octet-stream`
- Content-Disposition: `attachment; filename="{templateName}.trf"`

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **未修改任何内容就Save** | 前端校验拦截       | `NO UNRELEASED VERSION EXISTS!`                |
| **未传递底盘/市场参数**  | 前端校验拦截       | `No chassis or market information provided.`   |
| **底盘号无对应数据**     | API返回400错误     | `No data found for this chassis.`              |
| **Template文件不存在**   | API返回404错误     | `Template file not found.`                     |
| **数据库连接异常**       | API返回500错误     | `System error. Please contact administrator.`  |
| **API超时**              | 前端捕获超时异常   | `Request timeout. Please try again later.`     |
| **网络异常**             | 前端捕获网络异常   | `Network connection failed. Please check your network settings.` |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 管理 `chassisNo`, `market`, `templateFile`, `variables`, `errorMessage`, `isLoading`。
    - 页面加载时从location.state或URL参数获取chassisNo和market。
    - variables数组中的每个对象包含 variable、description、currentValue、modifiedValue 四个字段。
2.  **安全性**：
    - API 请求必须携带有效的认证Token。
    - Modified value 字段允许用户输入，但需在后端校验输入内容的合法性（长度不超过500字符）。
3.  **UI 细节**：
    - 采用数据表格形式展示，表头包含 Variable、Description、Current value、Modified value 四列。
    - Modified value 列使用可编辑的TextField组件，初始值为空。
    - Template文件链接使用蓝色下划线样式，点击后触发下载。
    - Chassis no 显示为链接样式，点击后跳转到 Vehicle Specification 画面。
    - Save 按钮在 `isLoading` 期间应设为 `disabled`，防止重复提交。
    - `Message` 文字颜色建议使用红色 (`#ff4d4f` 或 `#c62828`) 以起到警示作用。
4.  **性能优化**：
    - 数据查询应在后端完成，避免前端多次API调用。
    - Template文件下载可使用独立的API端点，避免阻塞主页面加载。
5.  **数据检索逻辑实现**：
    - Current value的获取需要在后端执行以下逻辑：
      ```sql
      -- 优先从HDOC_ADCA_MODIFICATION获取
      SELECT NEWVAL as currentValue
      FROM HDOC_ADCA_MODIFICATION
      WHERE CHASSIS_NO = ? AND VARIABLE = ?
      
      -- 若不存在，则从HDOC_REC_DATA_KOLA_VARIANT获取
      SELECT SYMBOL as currentValue
      FROM HDOC_REC_DATA_KOLA_VARIANT
      WHERE FAMILY_ID = ? AND VARIANT_ID = ?
      ```
    - Modified value初始为空字符串，用户输入后保存到state中。
6.  **画面迁移逻辑**：
    - Save操作成功后，跳转到 Save Modifications 画面时，需传递以下数据：
      - chassisSerie（从chassisNo解析'-'前的内容）
      - chassisNumber（从chassisNo解析'-'后的内容）
      - doctype（从Template文件名解析）
      - version（从API响应获取）
      - storing（拼接VARIABLE和NEWVAL）
      - 修改内容列表（所有非空的Modified value）

---
