# Generate Doc 模块详细设计说明书

| 文档编号     | DES-Generate Doc-004  | 版本号     | v1.0       |
| :----------- | :-------------------- | :--------- | :--------- |
| **模块名称** | Generate Doc          | **作成日** | 2026-07-10 |
| **作成者**   | GitHub Copilot        | **状态**   | 正式稿     |

## 1. 背景 (Background)

本页面为 Generate Document 页面，基于前画面传入的设定条件调用 VPPS VIN PLATE 作成批处理生成 VIN Plate 文档，完成指定 Chassis 的车辆相关信息展示、VIN Plate 文档生成与下载、关联页面跳转的核心功能。

- **目标**：支撑 HDOC 业务下的车辆铭牌文档快速生成需求，实现 VIN Plate 文档的生成与下载。
- **安全性**：无额外特殊安全约束，所有展示数据均从指定业务数据表读取，禁止未授权的数据修改操作。
- **用户体验**：
  - 页面加载后自动完成初始数据拉取与批处理调用，无需用户额外手动触发基础生成动作。
  - 关键关联操作提供直观的链接入口，AD-Chang 状态激活时 Modify 链接自动标红高亮提示用户。
  - 生成的 VIN Plate 文档可直接点击链接一键下载，优化操作路径。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输出项的详细定义如下：

| No. | 项目名 (Item) | 种类 (Type) | 必须 (Req) | MaxLength | I/O | 允许字符 (Allowed Chars) | 文字对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注 |
| :-: | :------------ | :---------- | :--------: | :-------: | :-: | :----------------------- | :--------------: | :--------------: | :----------------: | :--- |
| 1 | **Chassis no** | Label | - | 15 | Output | - | 左 (Left) | - | - | 从前画面获取 Chassis series、Chassis no 字段信息展示 |
| 2 | **Ordernumber** | Label | - | 16 | Output | - | 左 (Left) | - | - | 从 `HDOC_REC_DATA_OM` 表读取 `ORDERNUMBER` 字段信息展示 |
| 3 | **Build week** | Label | - | 10 | Output | - | 左 (Left) | - | - | 从 `HDOC_REC_DATA_OM` 表读取 `BUILD` 字段信息展示 |
| 4 | **Spec week** | Label | - | 10 | Output | - | 左 (Left) | - | - | 从 `HDOC_REC_DATA_OM` 表读取 `SPEC` 字段信息展示 |
| 5 | **Market** | Label | - | 10 | Output | - | 左 (Left) | - | - | 从 `HDOC_REC_DATA_VDA_GENERAL` 表读取 `COUNTRY_OF_OPERATION` 字段信息展示 |
| 6 | **Master Market** | Label | - | - | Output | - | 左 (Left) | `-EU` | - | 固定设置值为 `-EU` |
| 7 | **S-Note NO** | Label | - | 4000 | Output | - | 左 (Left) | - | - | 从 `HDOC_REC_DATA_OM` 表读取 `CUSTOMER_ADAP` 字段信息展示 |
| 8 | **S-Note Message** | Label | - | 256 | Output | - | 左 (Left) | - | - | 存在 S-Note 信息时固定显示文本 `The S-Notes above can affect homologation documents.` |
| 9 | **Load Index** | Label | - | 10 | Output | - | 左 (Left) | - | - | 从 `HDOC_REC_DATA_KOLA_TIRE_MASTER` 表读取 `LOAD_INDEX` 字段信息展示 |
| 10 | **Analyze Rules** | Link | - | 10 | Action | - | 左 (Left) | - | 活性 (Enabled) | 点击后跳转至「HDOC DEBUG」画面 |
| 11 | **Modify Doc Link** | Link | - | 1 | Output/Action | - | 左 (Left) | - | 动态 | 当 AD-Change 状态为激活时，以红色显示文本 `After def change detected. Document need to be modified.`，点击后跳转至「Modify Document」画面 |
| 12 | **Using template** | Label | - | 20 | Output | - | 左 (Left) | - | - | 从 VPPS VIN PLATE 作成批处理返回的 Template 字段信息展示 |
| 13 | **Replacing parameters** | Label | - | 40 | Output | - | 左 (Left) | - | - | 从 `HDOC_ADCA_MODIFICATION` 表读取 `VARIABLE`、`NEWVAL` 字段信息展示 |
| 14 | **Generated document** | Link | - | - | Action | - | 左 (Left) | - | - | 点击后下载由 VPPS VIN PLATE 作成批处理生成的已填充值的「Vin Plate」.trf 文件 |
| 15 | **Date** | Label | - | 20 | Output | - | 左 (Left) | - | - | 取服务器当前时间展示，格式示例 `2022-12-02 05:11:45` |
| 16 | **HDoc version** | Label | - | 20 | Output | - | 左 (Left) | - | - | 取当前程序的版本号信息展示 |
| 17 | **Error message area** | Label | - | - | Output | - | 左 (Left) | - | - | 用于展示页面运行过程中抛出的错误信息 |

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

#### 3.1.1 初始表示

页面加载后基于前画面传入的设定条件，调用 VPPS VIN PLATE 作成批处理生成 VIN Plate，依次完成以下信息展示：

1. 展示当前 Chassis 的接收信息（Chassis no、Ordernumber、Build week、Spec week、Market、Master Market）。
2. 展示当前 Chassis 的 S-Note 信息（S-Note NO、S-Note Message）。
3. 展示当前 Chassis 的 Tire Master 信息（Load Index）。
4. 展示 VIN Plate 的名称与关联参数（Using template、Replacing parameters）。
5. 展示服务器当前时间（Date）。
6. 展示当前程序版本号（HDoc version）。
7. 若当前 Chassis 的 AD-Chang 状态为激活，将 Modify 链接标红展示。

最终完成画面的正常渲染。

#### 3.1.2 触发条件：[页面加载自动触发 / 对应链接点击触发]

**前端校验 (Frontend Check)：**
- 本页面初期展示无额外空值校验逻辑，直接执行后端批处理调用动作。

#### 3.1.3 API 调用 (Backend Check)

调用 `UD04SelectGeneratedocumentApi` 执行 VPPS VIN PLATE 生成批处理，同时从各关联业务数据表拉取对应展示字段信息。

#### 3.1.4 结果处理

- **成功**：所有控件信息正常渲染，可正常跳转关联子页面、下载生成的 VIN Plate 文件。
- **失败**：将对应的错误信息展示在 Error message area 区域。

### 3.2 校验详细规格表

| No. | 检查时机 | 检查对象 | 检查条件 | 错误消息 (Message Content) | 动作 |
| :-: | :------- | :------- | :------- | :------------------------- | :--- |
| 1 | VPPS VIN PLATE 批处理执行完成后 | 批处理执行结果 | 批处理异常终止，VIN Plate 创建失败 | `Batch processing failed: Failed to make the Inplate Error reson:XXX` | 将错误信息展示在 Error message area 区域，中断后续文档生成流程 |
| 2 | Template 文件读取时 | Template 取得 | Vin Plate 的 Template 文件不存在 | `Can not find template for doctype VIN-PLATE` | 将错误信息展示在 Error message area 区域，中断文档加载流程 |
| 3 | Template 规则匹配时 | Template 取得 | Template 文件名未在 `HDOC_USER_DEFINED_RULES` 表中匹配到对应记录 | `Can not find TEMPLATE-VIN-PLATE. No match in user defined rules.` | 将错误信息展示在 Error message area 区域，中断文档生成流程 |
| 4 | Template 参数校验时 | Template 取得 | Template 中配置的参数未在 `HDOC_USER_DEFINED_RULES` 表中匹配到对应记录 | `No template rule defined for this truck. XXX XXX` | 将错误信息展示在 Error message area 区域，中断文档生成流程 |

## 4. 接口定义 (API Specification)

### 4.1 UD04SelectGeneratedocumentApi

- **功能**：完成 Generate Document 页面初始化数据拉取，返回页面所有展示控件所需的字段数据。
- **Method**: `POST`
- **Endpoint**: `/api/ud04/UD04SelectGeneratedocumentApi`

#### Request Body

```json
{
  "chassisSeries": "string",
  "chassisNo": number
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
  "msg": null,
  "data": {
    "chassisInfo": "JPCT013759",
    "ordernumber": "ORD123456",
    "buildWeek": 202245,
    "specWeek": 202244,
    "market": "DE",
    "masterMarket": "-EU",
    "sNoteNo": "CUSTOMER_ADAP_DATA_JPCT_8889",
    "sNoteMessage": "The S-Notes above can affect homologation documents.",
    "loadIndex": "148K",
    "adChangeActive": true,
    "modifyLinkText": "Modify",
    "usingTemplate": "VIN_PLATE_template_v2.trf",
    "replacingParameters": [
      { "variable": "TIRE_SIZE", "newVal": "245/45R18" }
    ],
    "generatedFileUrl": "/api/download/vinplate/VIN_PLATE_template_v2.trf",
    "serverDate": "2022-12-02 05:11:45",
    "hDocVersion": "2.1.0"
  }
}
```

#### 字段说明

| 字段名称 | 备注说明 |
| :------- | :------- |
| `chassisInfo` | 参数 `chassisSeries` + `ChassisNo` 拼接结果 |
| `ordernumber` | `HDOC_REC_DATA_OM` 表的 `ORDERNUMBER` 字段 |
| `buildWeek` | `HDOC_REC_DATA_OM` 表的 `BUILD` 字段 |
| `specWeek` | `HDOC_REC_DATA_OM` 表的 `SPEC` 字段 |
| `market` | `HDOC_REC_DATA_VDA_GENERAL` 表的 `COUNTRY_OF_OPERATION` 字段 |
| `masterMarket` | 固定值 `-EU` |
| `sNoteNo` | `HDOC_REC_DATA_OM` 表的 `CUSTOMER_ADAP` 字段 |
| `sNoteMessage` | 存在 S-Note 信息时固定显示文本 `The S-Notes above can affect homologation documents.`；不存在 S-Note 信息时空白表示 |
| `loadIndex` | `HDOC_REC_DATA_KOLA_TIRE_MASTER` 表的 `LOAD_INDEX` 字段 |
| `adChangeActive` | `HDOC_ADCA_CHANGE` 表的 `ACT` 字段，`ACT='Y'` 时为 `true`，否则为 `false` |
| `modifyLinkText` | 固定值 `Modify` |
| `usingTemplate` | VPPS VIN PLATE 批处理生成的文件名 |
| `replacingParameters` | `HDOC_ADCA_MODIFICATION` 表读取的 `VARIABLE`、`NEWVAL` 字段 |
| `generatedFileUrl` | VPPS VIN PLATE 批处理生成的文件下载链接 |
| `serverDate` | 服务器系统时间，格式 `YYYY-MM-DD hh:mm:ss` |
| `hDocVersion` | 系统程序版本号 |

#### Response Error (400 Bad Request)

```json
{
  "code": 400,
  "msg": "Batch processing failed: Failed to make the Inplate Error reson:XXX",
  "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景 | 处理方式 | Message 显示内容 |
| :------- | :------- | :--------------- |
| VPPS VIN PLATE 批处理异常终止，VIN Plate 创建失败 | 终止后续文档生成动作，将错误信息返回至页面 | `Batch processing failed: Failed to make the Inplate Error reson:XXX` |
| Vin Plate 的 Template 文件物理不存在 | 终止 Template 读取流程，返回错误提示 | `Can not find template for doctype VIN-PLATE` |
| Template 文件名未在 `HDOC_USER_DEFINED_RULES` 中找到匹配记录 | 中断规则匹配流程，返回错误提示 | `Can not find TEMPLATE-VIN-PLATE. No match in user defined rules.` |
| Template 中的配置参数未在 `HDOC_USER_DEFINED_RULES` 中定义规则 | 中断参数填充流程，返回错误提示 | `No template rule defined for this truck. XXX XXX` |
| 返回系统内部错误 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.` |

## 6. 实现注意事项 (Implementation Notes)

1. **状态管理**：
   - 使用 React State 管理所有页面展示数据（`chassisInfo`、`ordernumber`、`buildWeek`、`specWeek`、`market`、`masterMarket`、`sNoteNo`、`sNoteMessage`、`loadIndex`、`usingTemplate`、`replacingParameters`、`generatedFileUrl`、`serverDate`、`hDocVersion`、`errorMessage`、`adChangeActive`、`isLoading`）。
   - `Error message area` 默认隐藏（内容为空时不予显示）。

2. **页面初始化**：
   - 页面加载时从前画面（路由参数或状态管理）获取 `ChassisSeries` 和 `chassisNo`。
   - 自动调用 `UD04SelectGeneratedocumentApi` 完成数据拉取。

3. **条件渲染**：
   - `S-Note Message`：仅当存在 S-Note 信息时显示固定文本，否则隐藏。
   - `Modify Doc Link`：根据 `adChangeActive` 字段控制显示，激活时以红色（`#ff0000`）高亮展示，点击后跳转至「Modify Document」画面。

4. **链接跳转**：
   - `Analyze Rules`：点击后跳转至「HDOC DEBUG」画面。
   - `Modify Doc Link`：点击后跳转至「Modify Document」画面。
   - `Generated document`：点击后通过 `generatedFileUrl` 下载 VIN Plate 的 `.trf` 文件。

5. **UI 细节**：
   - 所有 Label 类型的控件统一左对齐展示。
   - `Date` 格式为 `YYYY-MM-DD hh:mm:ss`，取服务器系统时间。
   - `Error message area` 文字颜色建议使用红色（`#ff4d4f`）以起到警示作用。
