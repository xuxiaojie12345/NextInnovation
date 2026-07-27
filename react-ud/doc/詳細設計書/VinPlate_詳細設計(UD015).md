# Vin Plate 详细设计说明书

| 文档编号     | DES-Vin Plate-015          | 版本号     | v1.0       |
| :----------- | :------------------------- | :--------- | :--------- |
| **模块名称** | Vin Plate                  | **作成日** | 2022-07-20 |
| **作成者**   | GitHub Copilot             | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块为 Vin Plate 功能模块，用于支持用户输入 Chassis number，查询并展示对应底盘的 VIN Plate 相关详细信息，同时支持对指定底盘的状态（STATUS）、类型（TYPE）属性进行更新操作，实现 Vin Plate 全流程的信息管理。

- **目标**：提供完整的 VIN Plate 信息查询与状态管理功能，包括查看 VIN Plate 详细信息、更新底盘再生状态、更新文档完成状态、切换 Basic/Advanced 信息类型，确保用户可灵活管理底盘 VIN Plate 数据。
- **安全性**：
  - 所有针对 `HDOC_SEND_DATA_VIN_PLATE` 表的更新操作均需基于合法的 Chassis number 校验通过后才可执行，避免误改非目标底盘的数据。
  - Chassis number 为空时禁止发起任何 API 调用。
- **用户体验**：
  - 所有功能按钮默认保持激活状态，用户输入 Chassis number 后即可直接点击对应按钮触发操作。
  - 操作结果实时在页面对应标签区域展示，无多余跳转步骤。
  - 错误信息以 Label 形式在页面内显示，避免频繁弹窗打断操作流。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| No. | 项目名 (Item)            | 种类 (Type) | 必须 (Req) | MaxLength | I/O    | 允许字符 (Allowed Chars) | 字符对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注                                                       |
| :-: | :----------------------- | :---------- | :--------: | :-------: | :----: | :----------------------- | :--------------: | :--------------: | :----------------: | :--------------------------------------------------------- |
|  1  | **Chassis number**       | TextField   |     Y      |    15     | Input  | -                        | 左 (Left)        | 空 (Empty)       | 活性 (Enabled)     | 用于输入待操作的底盘编号                                   |
|  2  | **View Info**            | Button      |     -      |     -     | Action | -                        | 中 (Center)      | -                | 活性 (Enabled)     | 点击后查询并展示 VIN Plate 详细信息                        |
|  3  | **Set Regenerate**       | Button      |     -      |     -     | Action | -                        | 中 (Center)      | -                | 活性 (Enabled)     | 点击后将对应底盘的状态更新为 `'0'`（新規追加）             |
|  4  | **Set OK**               | Button      |     -      |     -     | Action | -                        | 中 (Center)      | -                | 活性 (Enabled)     | 点击后将对应底盘的状态更新为 `'1'`（xml doc 作成済み）     |
|  5  | **Change to Basic Info** | Button      |     -      |     -     | Action | -                        | 中 (Center)      | -                | 活性 (Enabled)     | 点击后将对应底盘的状态更新为 `'0'`、TYPE 更新为 `'1'`（basic） |
|  6  | **Change to Advanced Info** | Button   |     -      |     -     | Action | -                        | 中 (Center)      | -                | 活性 (Enabled)     | 点击后将对应底盘的状态更新为 `'0'`、TYPE 更新为 `'2'`（ADVANCED (with weights)） |
|  7  | **Chassis number**       | Label       |     -      |     -     | Output | -                        | 左 (Left)        | 空 (Empty)       | -                  | 从画面设定内容的 Chassis number 字段获取并展示             |
|  8  | **Plate type**           | Label       |     -      |     -     | Output | -                        | 左 (Left)        | 空 (Empty)       | -                  | 从 `HDOC_SEND_DATA_VIN_PLATE` 表的 TYPE 字段获取并展示     |
|  9  | **Status**               | Label       |     -      |     -     | Output | -                        | 左 (Left)        | 空 (Empty)       | -                  | 从 `HDOC_SEND_DATA_VIN_PLATE` 表的 STATUS 字段获取并展示   |
| 10  | **Error Message**        | Label       |     -      |     -     | Output | -                        | 左 (Left)        | 空 (Empty)       | -                  | 从 `HDOC_SEND_DATA_VIN_PLATE` 表的 MSG 字段获取并展示      |
| 11  | **Def.**                 | Label       |     -      |     -     | Output | -                        | 左 (Left)        | 空 (Empty)       | -                  | 从 `HDOC_SEND_DATA_VIN_PLATE` 表的 REGISTER_DATETIME 字段获取并展示 |
| 12  | **Data ready**           | Label       |     -      |     -     | Output | -                        | 左 (Left)        | 空 (Empty)       | -                  | 从 `HDOC_SEND_DATA_VIN_PLATE` 表的 DOC_READY 字段获取并展示 |
| 13  | **Sent to CAB factory**  | Label       |     -      |     -     | Output | -                        | 左 (Left)        | 空 (Empty)       | -                  | 从 `HDOC_SEND_DATA_VIN_PLATE` 表的 DOC_SENT 字段获取并展示 |
| 14  | **Print items**          | Label       |     -      |     -     | Output | -                        | 左 (Left)        | 空 (Empty)       | -                  | 从 `HDOC_SEND_DATA_VIN_PLATE` 表 XML_DOC 字段中提取 PrintItemName 对应的项目值展示 |
| 15  | **VP Data**              | Label       |     -      |     -     | Output | -                        | 左 (Left)        | 空 (Empty)       | -                  | 从 `HDOC_SEND_DATA_VIN_PLATE` 表 XML_DOC 字段中提取各 Variant 名和对应 Value 展示 |

> **注**：
>
> - Chassis number 输入框最大长度为 15 字符。
> - 所有输出类 Label 在初始加载时内容为空，查询成功后动态填充。
> - 错误信息（Message）以 Label 形式展示，文字颜色使用红色（`#ff4d4f`）以起到警示作用。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

所有校验逻辑均在用户点击对应操作按钮时按序执行。

### 3.1 处理流程

#### 3.1.1 初始表示

画面正常加载后，展示 Vin Plate 页面的所有控件。

- Chassis number 输入框默认清空。
- 所有功能按钮（View Info、Set Regenerate、Set OK、Change to Basic Info、Change to Advanced Info）保持激活状态。
- 所有输出类 Label（Chassis number、Plate type、Status、Error Message、Def.、Data ready、Sent to CAB factory、Print items、VP Data）初始为空。

#### 3.1.2 触发条件：用户按下 View Info 按钮

1. **空值校验 (Frontend Check)**：
   - 若 Chassis number 输入为空：
     - 设置 `Message` = `Chassis number are required.`
     - **终止流程**。

2. **API 调用 (Backend Check)**：
   - 若前端校验通过，调用 `UD15ViewInfo` API，传入输入的 Chassis number。

3. **结果处理**：
   - **成功**：加载返回的 VIN Plate 详细信息，展示 VIN Plate 送信数据状态、类型等基本信息，同时展示 Template 的 XML 文件内的 Print Items 信息、Variant 信息。
   - **失败**：返回 `Chassis number XXX not found.` 警告信息。

#### 3.1.3 触发条件：用户按下 Set Regenerate 按钮

1. **空值校验 (Frontend Check)**：
   - 若 Chassis number 输入为空：
     - 设置 `Message` = `Chassis number are required.`
     - **终止流程**。

2. **API 调用 (Backend Check)**：
   - 若前端校验通过，调用 `UD15SetRegenerate` API，传入输入的 Chassis number。

3. **结果处理**：
   - **成功**：将 `HDOC_SEND_DATA_VIN_PLATE` 表中对应 Chassis 的 STATUS 更新为 `'0'`（新規追加），页面 Status 标签同步更新展示最新状态。
   - **失败**：返回 `Chassis number XXX not found.` 警告信息。

#### 3.1.4 触发条件：用户按下 Set OK 按钮

1. **空值校验 (Frontend Check)**：
   - 若 Chassis number 输入为空：
     - 设置 `Message` = `Chassis number are required.`
     - **终止流程**。

2. **API 调用 (Backend Check)**：
   - 若前端校验通过，调用 `UD15SetOK` API，传入输入的 Chassis number。

3. **结果处理**：
   - **成功**：将 `HDOC_SEND_DATA_VIN_PLATE` 表中对应 Chassis 的 STATUS 更新为 `'1'`（xml doc 作成済み），页面 Status 标签同步更新展示最新状态。
   - **失败**：返回 `Chassis number XXX not found.` 警告信息。

#### 3.1.5 触发条件：用户按下 Change to Basic Info 按钮

1. **空值校验 (Frontend Check)**：
   - 若 Chassis number 输入为空：
     - 设置 `Message` = `Chassis number are required.`
     - **终止流程**。

2. **API 调用 (Backend Check)**：
   - 若前端校验通过，调用 `UD15ChangetoBasicInfo` API，传入输入的 Chassis number。

3. **结果处理**：
   - **成功**：将 `HDOC_SEND_DATA_VIN_PLATE` 表中对应 Chassis 的 STATUS 更新为 `'0'`（新規追加），TYPE 更新为 `'1'`（basic），页面 Status、Plate type 标签同步更新展示最新属性。
   - **失败**：返回 `Chassis number XXX not found.` 警告信息。

#### 3.1.6 触发条件：用户按下 Change to Advanced Info 按钮

1. **空值校验 (Frontend Check)**：
   - 若 Chassis number 输入为空：
     - 设置 `Message` = `Chassis number are required.`
     - **终止流程**。

2. **API 调用 (Backend Check)**：
   - 若前端校验通过，调用 `UD15ChangetoAdvancedInfo` API，传入输入的 Chassis number。

3. **结果处理**：
   - **成功**：将 `HDOC_SEND_DATA_VIN_PLATE` 表中对应 Chassis 的 STATUS 更新为 `'0'`（新規追加），TYPE 更新为 `'2'`（ADVANCED (with weights)），页面 Status、Plate type 标签同步更新展示最新属性。
   - **失败**：返回 `Chassis number XXX not found.` 警告信息。

### 3.2 校验详细规格表

| No. | 检查时机                         | 检查对象       | 检查条件                       | 错误消息 (Message Content)            | 动作                                                   |
| :-: | :------------------------------- | :------------- | :----------------------------- | :------------------------------------ | :----------------------------------------------------- |
|  1  | 任意功能按钮点击时               | Chassis number | 搜索条件匹配的内容不存在时     | `Chassis number XXX not found.`       | 抛出 Warning 级别的提示，终止后续数据库读写操作，不执行数据更新 |
|  2  | 任意功能按钮点击时（前端校验）   | Chassis number | Chassis number 为空（`null` 或 `trim() == ""`） | `Chassis number are required.`        | 展示警告级提示，终止后续流程，不发起 API 调用          |

## 4. 接口定义 (API Specification)

### 4.1 UD15ViewInfo — 查询 VIN Plate 详情 API

- **功能**：根据传入的 Chassis number 从 `HDOC_SEND_DATA_VIN_PLATE` 表中读取对应底盘的全量 VIN Plate 相关信息并返回。
- **Method**: `GET`
- **Endpoint**: `/api/ud015/UD15SelecthdocsenddatavinplateApi/UD15ViewInfo`

#### Request

```
GET /api/ud015/UD15SelecthdocsenddatavinplateApi/UD15ViewInfo?chassisNo=xxx
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": {
    "chassisNumber": "123456",
    "plateType": "1",
    "status": "0",
    "errorMessage": null,
    "registerDatetime": "2022-11-21 10:00:00",
    "docReady": "2022-11-21 12:00:00",
    "docSent": null,
    "printItems": ["Item1", "Item2", "Item3"],
    "vpData": [
      { "variant": "Variant1", "value": "Value1" },
      { "variant": "Variant2", "value": "Value2" }
    ]
  },
  "message": null
}
```

#### Response Error (500 Internal Server Error)

```json
{
  "code": 500,
  "data": null,
  "msg": "Chassis number XXX not found."
}
```

### 4.2 UD15SetRegenerate — 更新底盘再生状态 API

- **功能**：根据传入的 Chassis number 将 `HDOC_SEND_DATA_VIN_PLATE` 表中对应底盘的 STATUS 字段更新为 `'0'`。
- **Method**: `PUT`
- **Endpoint**: `/api/ud015/UD15SelecthdocsenddatavinplateApi/UD15SetRegenerate`

#### Request Body

```json
{
  "chassisNumber": "xxx"
}
```

#### Response Error (500 Internal Server Error)

```json
{
  "code": 500,
  "data": null,
  "msg": "Chassis number XXX not found."
}
```

### 4.3 UD15SetOK — 更新底盘文档完成状态 API

- **功能**：根据传入的 Chassis number 将 `HDOC_SEND_DATA_VIN_PLATE` 表中对应底盘的 STATUS 字段更新为 `'1'`。
- **Method**: `PUT`
- **Endpoint**: `/api/ud015/UD15SelecthdocsenddatavinplateApi/UD15SetOK`

#### Request Body

```json
{
  "chassisNumber": "xxx"
}
```

#### Response Error (500 Internal Server Error)

```json
{
  "code": 500,
  "data": null,
  "msg": "Chassis number XXX not found."
}
```

### 4.4 UD15ChangetoBasicInfo — 更新底盘 Basic 信息类型 API

- **功能**：根据传入的 Chassis number 将 `HDOC_SEND_DATA_VIN_PLATE` 表中对应底盘的 STATUS 更新为 `'0'`，TYPE 更新为 `'1'`。
- **Method**: `PUT`
- **Endpoint**: `/api/ud015/UD15SelecthdocsenddatavinplateApi/UD15ChangetoBasicInfo`

#### Request Body

```json
{
  "chassisNumber": "xxx"
}
```

#### Response Error (500 Internal Server Error)

```json
{
  "code": 500,
  "data": null,
  "msg": "Chassis number XXX not found."
}
```

### 4.5 UD15ChangetoAdvancedInfo — 更新底盘 Advanced 信息类型 API

- **功能**：根据传入的 Chassis number 将 `HDOC_SEND_DATA_VIN_PLATE` 表中对应底盘的 STATUS 更新为 `'0'`，TYPE 更新为 `'2'`。
- **Method**: `PUT`
- **Endpoint**: `/api/ud015/UD15SelecthdocsenddatavinplateApi/UD15ChangetoAdvancedInfo`

#### Request Body

```json
{
  "chassisNumber": "xxx"
}
```

#### Response Error (500 Internal Server Error)

```json
{
  "code": 500,
  "data": null,
  "msg": "Chassis number XXX not found."
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                     | 处理方式             | Message 显示内容                               |
| :--------------------------- | :------------------- | :--------------------------------------------- |
| 接口调用超时或返回系统内部错误 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.` |

## 6. 实现注意事项 (Implementation Notes)

1. **状态管理**：
   - 使用 React State 管理 `chassisNumber`、`vinPlateData`（含 chassisNumber、plateType、status、errorMessage、registerDatetime、docReady、docSent、printItems、vpData）、`message`、`isLoading`。
   - `Message` Label 默认隐藏（内容为空时不予显示）。

2. **输入限制**：
   - Chassis number 输入框最大长度限制为 15 字符。

3. **安全性**：
   - 所有更新操作（Set Regenerate、Set OK、Change to Basic Info、Change to Advanced Info）均需先通过 Chassis number 空值校验，再通过后端存在性校验，确保操作合法性。
   - 严禁在前端日志中打印敏感数据。

4. **UI 细节**：
   - 所有功能按钮在 `isLoading` 期间应设为 `disabled` 状态，防止重复提交。
   - `Message` 文字颜色使用红色（`#ff4d4f`）以起到警示作用。
   - 各按钮应具备明确的 hover 效果，提升操作可识别性。

5. **操作按钮分组**：
   - **查询操作**：View Info 按钮 — 仅查询展示数据，不修改数据库。
   - **状态更新操作**：Set Regenerate、Set OK 按钮 — 仅更新 STATUS 字段。
   - **类型切换操作**：Change to Basic Info、Change to Advanced Info 按钮 — 同时更新 STATUS 和 TYPE 字段。
