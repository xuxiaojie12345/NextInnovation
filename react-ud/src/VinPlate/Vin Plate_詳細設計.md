# VIN铭牌模块 (Vin Plate Module) 详细设计说明书

| 文档编号     | DES-VIN-PLATE-005         | 版本号     | v1.0       |
| :----------- | :-------------------- | :--------- | :--------- |
| **模块名称** | VIN铭牌管理 (Vin Plate) | **作成日** | 2023-10-XX |
| **作成者**   | Lingma Assistant      | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于管理和查询车辆底盘号（Chassis Number）相关的 VIN Plate 信息。用户可以输入底盘号查询详细信息，并对数据的处理状态（Status）和类型（Type）进行手动干预和更新。

- **目标**：提供对 `HDOC_SEND_DATA_VIN_PLATE` 表中数据的检索、状态流转及类型切换功能。
- **核心功能**：支持查看 XML 原始数据（Print Items 和 Variant Data），并能将状态重置为“待处理”或标记为“已完成”。
- **交互性**：通过不同的按钮实现业务状态的快速切换（如从 Basic 切换到 Advanced）。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item) | 種別 (Type) | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars)          | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                    |
| :------------ | :---------- | :--------: | :-------: | :----: | :-------------------------------- | :--------------: | :--------------: | :----------------: | :---------------------- |
| **Chassis number (Input)** | TextField | N | 15 | Input | 半角英数字 | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 检索关键字 |
| **View Info** | Button | N | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 查询详细信息 |
| **Set Regenerate** | Button | N | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 状态置为 '0' (New) |
| **Set OK** | Button | N | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 状态置为 '1' (XML Created) |
| **Change to Basic Info** | Button | N | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 状态置 '0', Type 置 '1' |
| **Change to Advanced Info** | Button | N | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 状态置 '0', Type 置 '2' |
| **Chassis number (Display)** | Label | N | - | Output | - | 左 (Left) | - | - | 显示当前查询的底盘号 |
| **Plate type** | Label | N | - | Output | - | 左 (Left) | - | - | 显示 TYPE (1:Basic, 2:Advanced) |
| **Status** | Label | N | - | Output | - | 左 (Left) | - | - | 显示 STATUS (0:New, 1:Done) |
| **Error Message** | Label | N | - | Output | - | 左 (Left) | - | - | 显示错误或警告信息 |
| **Def.** | Label | N | - | Output | Date/Time | 左 (Left) | - | - | 注册日期时间 (REGISTER_DATETIME) |
| **Data ready** | Label | N | - | Output | - | 左 (Left) | - | - | DOC_READY 标志位 |
| **Sent to CAB factory** | Label | N | - | Output | - | 左 (Left) | - | - | DOC_SENT 标志位 |
| **Print items** | Label (Multi-line) | N | - | Output | XML Content | 左 (Left) | - | - | 解析 XML_DOC 中的 PrintItemName |
| **VP Data** | Label (Multi-line) | N | - | Output | XML Content | 左 (Left) | - | - | 解析 XML_DOC 中的 Variant Name & Value |

> **注**：
> - **Status 映射**：`0` = 新規追加 (New), `1` = xml doc 作成済み (Created)。
> - **Type 映射**：`1` = Basic, `2` = ADVANCED (with weights)。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

1.  **View Info 按钮点击**：
    - 获取输入的 `Chassis number`。
    - 调用 API 查询 `HDOC_SEND_DATA_VIN_PLATE`。
    - 若找到记录，填充所有 Output Label；若未找到，在 `Error Message` 显示 `Chassis number XXX not found.`。
2.  **Set Regenerate 按钮点击**：
    - 校验 `Chassis number` 是否存在。
    - 调用更新 API，将 `STATUS` 设为 `'0'`。
    - 刷新页面显示最新状态。
3.  **Set OK 按钮点击**：
    - 校验 `Chassis number` 是否存在。
    - 调用更新 API，将 `STATUS` 设为 `'1'`。
    - 刷新页面显示最新状态。
4.  **Change to Basic Info 按钮点击**：
    - 校验 `Chassis number` 是否存在。
    - 调用更新 API，将 `STATUS` 设为 `'0'`，`TYPE` 设为 `'1'`。
    - 刷新页面显示最新状态。
5.  **Change to Advanced Info 按钮点击**：
    - 校验 `Chassis number` 是否存在。
    - 调用更新 API，将 `STATUS` 设为 `'0'`，`TYPE` 设为 `'2'`。
    - 刷新页面显示最新状态。

### 3.2 校验详细规格表

| No. |   检查时机   |     检查对象      |                检查条件                |                          错误消息 (Message Content)                           |                 动作                 |
| :-: | :----------: | :---------------: | :------------------------------------: | :---------------------------------------------------------------------------: | :----------------------------------: |
|  1  | Any Action   | Chassis number    | `DB.Count(Chassis) == 0`               |                     `Chassis number [XXX] not found.`                     | 在 Error Message Label 显示 Warning |
|  2  | Any Action   | Chassis number    | `Input is empty`                       |                     `Please enter a Chassis number.`                     | 在 Error Message Label 显示 Warning |

## 4. 接口定义 (API Specification)

### 4.1 GetVinPlateInfoApi

- **功能**：根据底盘号获取 VIN Plate 详细信息。
- **Method**: `GET`
- **Endpoint**: `/api/vin-plate/{chassisNumber}`

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": {
    "chassisNumber": "VF123456789",
    "type": "1",
    "status": "0",
    "msg": "",
    "registerDatetime": "2023-11-21 09:00:00",
    "docReady": "Y",
    "docSent": "N",
    "xmlDoc": "<XML>...</XML>"
  },
  "message": "success"
}
```

### 4.2 UpdateVinPlateStatusApi

- **功能**：更新 VIN Plate 的状态和类型。
- **Method**: `PUT`
- **Endpoint**: `/api/vin-plate/status`

#### Request Body

```json
{
  "chassisNumber": "string",
  "status": "string (0 or 1)",
  "type": "string (1 or 2)"
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **网络断开/超时**        | 捕获 Network Error | `Network error. Please check your connection.` |
| **服务器内部错误 (500)** | 捕获 Server Error  | `System error. Please contact administrator.`  |
| **XML 解析失败**         | 前端捕获异常       | `Failed to parse XML data.`                    |

## 6. 实现注意事项 (Implementation Notes)

1.  **XML 解析**：
    - 后端返回的 `xmlDoc` 字段包含原始 XML。前端需使用 `DOMParser` 或第三方库（如 `fast-xml-parser`）提取 `PrintItemName` 和 `Variant` 信息并格式化显示在 Label 中。
2.  **状态管理**：
    - 使用 React State 管理 `chassisInput`, `vinData`, `errorMessage`, `isLoading`。
    - 在执行更新操作（Set Regenerate 等）时，建议增加 Loading 遮罩层防止重复点击。
3.  **UI 细节**：
    - `Print items` 和 `VP Data` 区域建议使用 `<pre>` 标签或具有滚动条的文本域展示，以保持 XML 结构的可读性。
    - 按钮组建议根据业务逻辑分组排列（例如：查询一组，状态更新一组，类型切换一组）。