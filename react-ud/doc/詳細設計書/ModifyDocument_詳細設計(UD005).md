# Modify Document 模块详细设计说明书

| 文档编号     | DES-Modify Document-005 | 版本号     | v1.0       |
| :----------- | :---------------------- | :--------- | :--------- |
| **模块名称** | Modify Document         | **作成日** | 2026-07-13 |
| **作成者**   | GitHub Copilot          | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块是 Modify Document 功能模块，核心功能是展示可修改的项目，支持用户录入修正后的值完成修改提交、下载指定的 VIN Plate 空模板文件、查看指定底盘号的详情信息。

- **目标**：最终实现文档修改内容的确认与提交流程。
- **安全性**：所有数据读取操作均仅针对指定的业务数据表执行查询操作，不允许未经授权的数据修改。涉及底盘号信息展示时需严格校验数据来源合法性，仅展示授权范围内的车辆详细数据。
- **用户体验**：所有可交互元素布局清晰，输入项默认处于激活可编辑状态，操作后页面跳转逻辑直观，错误提示明确展示具体问题，避免用户出现无效操作。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

| No. | 项目名 (Item) | 种类 (Type) | 必须 (Req) | MaxLength | I/O | 允许字符 (Allowed Chars) | 文字对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注 |
| :-: | :------------ | :---------- | :--------: | :-------: | :-: | :----------------------- | :--------------: | :--------------: | :----------------: | :--- |
| 1 | **chassis no** | Label | - | - | Output | - | 左 (Left) | - | - | 数据来源为前画面的 chassis no 字段 |
| 2 | **Market** | Label | - | - | Output | - | 左 (Left) | - | - | 数据来源为前画面的 Market 字段 |
| 3 | **Template 文件** | Link | - | - | Output | - | 左 (Left) | - | - | 数据来源为 Template 文件的 Template 名字段，点击后下载名为 `aus/UD_TEST.odt` 的「Vin Plate」无值 .trf 文件 |
| 4 | **Variable** | DataTable | - | - | Output | - | 左 (Left) | - | - | 数据来源为 Template 文件的 Template 项目字段 |
| 5 | **Description** | DataTable | - | - | Output | - | 左 (Left) | - | - | 数据来源为 `HDOC_VARIABLES` 表的 `DESCRIPTION` 字段 |
| 6 | **Current value** | DataTable | - | - | Output | - | 左 (Left) | - | - | 数据优先从 `HDOC_ADCA_MODIFICATION` 表的 `NEWVAL` 字段获取；Modify 中不存在对应数据时，从 `HDOC_REC_DATA_KOLA_VARIANT` 表的 `SYMBOL` 字段获取 |
| 7 | **Modified value** | TextField | - | 500 | Input | - | 左 (Left) | 空白 | 活性 (Enabled) | Modify 中不存在对应数据的情况下默认值为空白 |
| 8 | **Save** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 点击后跳转至「Save Modifications」页面展示所有已录入的修正内容 |

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

#### 3.1.1 初始表示

Modify Document 画面正常展示所有可修正的项目，包含 chassis no、Market 标签信息，Template 文件链接，以及 Variable、Description、Current value、Modified value 的数据表格区域，Save 按钮默认处于激活状态。

#### 3.1.2 触发条件与处理

**A. 用户点击 Save 按钮触发**

**空值校验 (Frontend Check)：**
- 若所有 Modified value 输入项均未录入任何内容，直接点击 Save 按钮：
  - 设置 `Message` = `NO UNRELEASED VERSION EXISTS!`
  - **终止流程**

**API 调用 (Backend Check)：**
- 调用 `UD05ModifyDocumentApi.UD05UpdateHdocAdcaModification`，校验通过后将用户录入的 Modified value 数据提交至业务系统。

**结果处理：**
- **成功**：页面跳转至 Save Modifications 画面，完整展示所有提交的修正内容。
- **失败**：页面保持在 Modify Document 画面，展示对应错误信息，保留用户已录入的所有输入内容不丢失。

**B. 用户点击链接 `Template: aus/UD_TEST.odt` 触发**
- 直接下载「Vin Plate」的未填入值的 `.trf` 模板文件，页面无跳转。

**C. 用户点击链接 `Chassis no` 触发**
- 跳转至 VDA - Vehicle Specification 画面，展示该对应 Chassis 的全部详细信息。

#### 3.1.3 API 调用详情

| 调用时机 | API 方法 | 用途 |
| :------- | :------- | :--- |
| 页面初始化 | `UD05ModifyDocumentApi.UD05SelectVariableModification` | 读取 Template 文件、`HDOC_VARIABLES`、`HDOC_ADCA_MODIFICATION`、`HDOC_REC_DATA_KOLA_VARIANT` 四张数据源表的对应数据完成页面渲染 |
| 点击 Save | `UD05ModifyDocumentApi.UD05UpdateHdocAdcaModification` | 校验通过后将用户录入的 Modified value 数据提交至业务系统，跳转至 Save Modifications 画面 |

### 3.2 校验详细规格表

| No. | 检查时机 | 检查对象 | 检查条件 | 错误消息 (Message Content) | 动作 |
| :-: | :------- | :------- | :------- | :------------------------- | :--- |
| 1 | 用户点击 Save 按钮时 | 所有 Modified value 输入项 | 所有输入项均未录入任何内容 | `NO UNRELEASED VERSION EXISTS!` | 终止提交流程，页面展示该错误提示，不跳转至 Save Modifications 画面 |

## 4. 接口定义 (API Specification)

### 4.1 UD05ModifyDocumentApi.UD05SelectVariableModification

- **功能**：获取 Modify Document 画面所需的全部初始数据，完成页面初始化渲染。
- **Method**: `GET`
- **Endpoint**: `/api/ud005/UD05ModifyDocumentApi/UD05SelectVariableModification`

#### Request Body

```json
{
  "chassisSeries": "string",
  "chassisNo": "string"
}
```

##### 请求示例

```json
{
  "chassisSeries": "JPCT",
  "chassisNo": "028321"
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": {
    "variableInfo": [
      {
        "variable": "VIN1",
        "description": "Description1",
        "currentValue": "PK1"
      },
      {
        "variable": "VIN2",
        "description": "Description2",
        "currentValue": "PK2"
      },
      {
        "variable": "VIN3",
        "description": "Description3",
        "currentValue": "PK3"
      }
    ]
  },
  "msg": null
}
```

### 4.2 UD05ModifyDocumentApi.UD05UpdateHdocAdcaModification

- **功能**：校验用户录入的 Modified value 数据，保存修改内容至业务系统。
- **Method**: `POST`
- **Endpoint**: `/api/ud005/UD05ModifyDocumentApi/UD05UpdateHdocAdcaModification`

#### Request Body

```json
{
  "chassisSeries": "string",
  "chassisNo": "string",
  "variableInfo": [
    {
      "variable": "string",
      "description": "string",
      "currentValue": "string"
    }
  ]
}
```

##### 请求示例

```json
{
  "chassisSeries": "JPCT",
  "chassisNo": "028321",
  "variableInfo": [
    {
      "variable": "VIN1",
      "description": "Description1",
      "currentValue": "PK1"
    },
    {
      "variable": "VIN2",
      "description": "Description2",
      "currentValue": "PK2"
    },
    {
      "variable": "VIN3",
      "description": "Description3",
      "currentValue": "PK3"
    }
  ]
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": null,
  "msg": null
}
```

#### Response Error (400 / 500)

```json
{
  "code": 400,
  "data": null,
  "msg": "System error. Please contact administrator."
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景 | 处理方式 | Message 显示内容 |
| :------- | :------- | :--------------- |
| 接口调用超时或返回系统内部错误 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.` |

## 6. 实现注意事项 (Implementation Notes)

1. **状态管理**：
   - 使用 React State 管理 `chassisNo`、`market`、`templateFileName`、`variableInfo`（包含 variable、description、currentValue、modifiedValue 的数组）、`errorMessage`、`isLoading`。
   - `Error message` 默认隐藏（内容为空时不予显示）。

2. **数据来源与优先级**：
   - **Current value**：优先从 `HDOC_ADCA_MODIFICATION` 表的 `NEWVAL` 字段获取；若 Modify 中不存在对应数据，则从 `HDOC_REC_DATA_KOLA_VARIANT` 表的 `SYMBOL` 字段获取。
   - **Modified value 初始值**：Modify 中不存在对应数据的情况下默认值为空白。

3. **页面初始化**：
   - 页面加载时从前画面（路由参数或状态管理）获取 `chassisSeries` 和 `chassisNo`。
   - 自动调用 `UD05SelectVariableModification` 完成数据拉取并渲染 DataTable。

4. **Save 提交逻辑**：
   - 点击 Save 时先执行前端空值校验：若所有 Modified value 均为空，显示 `NO UNRELEASED VERSION EXISTS!` 并终止。
   - 校验通过后调用 `UD05UpdateHdocAdcaModification` 提交数据。
   - 提交失败时保留用户已录入的所有输入内容不丢失。

5. **链接操作**：
   - **Template 链接**：点击后直接下载 `aus/UD_TEST.odt` 的「Vin Plate」无值 `.trf` 文件，页面不跳转。
   - **Chassis no 链接**：点击后跳转至 VDA - Vehicle Specification 画面展示该 Chassis 的详细信息。

6. **UI 细节**：
   - Variable、Description、Current value 以 DataTable 形式展示，每行对应一个变量项目。
   - Modified value 列使用 TextField 输入框，默认处于激活可编辑状态。
   - Save 按钮在 `isLoading` 期间应设为 `disabled` 状态，防止重复提交。
   - `Error message` 文字颜色建议使用红色（`#ff4d4f`）以起到警示作用。