# Vehicle Specification 模块详细设计说明书

| 文档编号     | DES-VehicleSpecification-007-Generated | 版本号     | v1.0       |
| :----------- | :------------------------------------ | :--------- | :--------- |
| **模块名称** | Vehicle Specification                 | **作成日** | 2026-07-15 |
| **作成者**   | GitHub Copilot                        | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块为 VDA-Vehicle Specification 页面，用于展示基于 Chassis no 查询得到的车辆详细规格信息，支持业务人员对单车全量规格参数的快速查阅。

- **目标**：基于前画面传入的 Chassis no 参数，从业务数据表中检索对应车辆规格数据，按照统一排版规范展示车辆规格和 Symbol 信息，满足 HDOC 业务对车辆信息透明化和可读性的要求。
- **安全性**：
  - 仅执行读取操作，不允许对业务数据表进行修改。
  - 查询条件必须严格限定 Chassis no，避免越权读取其它车辆数据。
  - 除了必要字段外，不在前端保留敏感中间数据。
- **用户体验**：
  - 输出内容统一左对齐，保证列表阅读顺序和视觉一致性。
  - Variant 项目的 DESCRIPTION 字段通过 Tooltip 形式展示，用户将光标悬停即可查看补充说明。
  - 采用固定长度补全规则，避免字段长度不一致导致展示错位。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输出项详细定义如下：

| No. | 项目名 (Item)               | 种类 (Type) | 必须 (Req) | MaxLength | I/O   | 允许字符 (Allowed Chars) | 文字对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注 |
| :-: | :-------------------------- | :---------- | :--------: | :-------: | :----: | :----------------------- | :--------------: | :--------------: | :----------------: | :--- |
| 1   | **Chassis no**              | Label       | -          | -         | Output | -                        | 左 (Left)        | -               | -                 | 通过前画面传入 |
| 2   | **Model**                   | Label       | -          | -         | Output | -                        | 左 (Left)        | -               | -                 | 来自 `HDOC_REC_DATA_OM.MODEL` |
| 3   | **Built week**              | Label       | -          | -         | Output | -                        | 左 (Left)        | -               | -                 | 来自 `HDOC_REC_DATA_OM.BUILD` |
| 4   | **Product type**            | Label       | -          | -         | Output | -                        | 左 (Left)        | -               | -                 | 来自 `HDOC_REC_DATA_VDA_GENERAL.PRODUCT_TYPE` |
| 5   | **VIN**                     | Label       | -          | -         | Output | -                        | 左 (Left)        | -               | -                 | 来自 `HDOC_REC_DATA_VDA_GENERAL.VIN` |
| 6   | **Engine no**               | Label       | -          | -         | Output | -                        | 左 (Left)        | -               | -                 | 当前式样暂固定显示 `428320` |
| 7   | **Country of Operation**    | Label       | -          | -         | Output | -                        | 左 (Left)        | -               | -                 | 来自 `HDOC_REC_DATA_VDA_GENERAL.COUNTRY_OF_OPERATION` |
| 8   | **SYMBOL_STR**              | Label       | -          | -         | Output | -                        | 左 (Left)        | -               | -                 | 由 `SYMBOL` 和 `FUNCTION_GROUP` 组合生成 |
| 9   | **DESCRIPTION**             | Tooltip     | -          | -         | Output | -                        | 左 (Left)        | -               | 悬停显示          | 来自 `HDOC_REC_DATA_KOLA_VARIANT.DESCRIPTION` |
| 10  | **S-Note NO**               | Label       | -          | -         | Output | -                        | 左 (Left)        | -               | -                 | 来自 `HDOC_REC_DATA_OM.CUSTOMER_ADAP` |

> **注**：
>
> - **Engine no**：当前样式不明确，先使用固定值 `428320`。后续如有业务规格变更，应同步调整。
> - **DESCRIPTION**：以 Tooltip 形式展现，不作为页面常驻文本。
> - **SYMBOL_STR**：应统一采用左对齐、半角空格补全的展示规则，保证排列整齐。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

#### 3.1.1 初始表示

页面加载时展示 VDA-Vehicle Specification 页面结构，准备接收并展示 Chassis 对应的车辆规格数据。

#### 3.1.2 触发条件：页面初始化加载

从前画面路由参数或状态管理中获取 `chassisNo`。若 `chassisNo` 为空，则展示错误信息并终止加载。

#### 3.1.3 前端校验 (Frontend Check)

- 若 `chassisNo` 为空或格式非法，直接展示错误提示，停止后续 API 调用。
- 当前版本业务定义为仅读取展示，前端无需对业务字段执行额外校验。

#### 3.1.4 后端调用 (Backend Check)

调用 `UD07VehicleSpecificationApi`，传入 `chassisNo`，从业务表中读取车辆规格数据。

#### 3.1.5 结果处理

- **成功**：
  - 渲染 Chassis no、Model、Built week、Product type、VIN、Engine no、Country of Operation、SYMBOL_STR、S-Note NO；
  - 将 DESCRIPTION 绑定到对应 Variant 项目，并支持鼠标悬停显示 Tooltip；
  - 若 Symbol 组合存在多个元素，按定义排序并依次展示。
- **失败**：
  - 展示错误消息，终止页面加载，并提示用户联系管理员或返回上一级页面。

#### 3.1.6 SYMBOL_STR 专属数据处理逻辑

1. 查询 `HDOC_REC_DATA_VDA_VARIANTS`：
   - 条件：`Chassis no`
   - 返回字段：`FAMILY_ID`、`VARIANT_ID`
2. 查询 `HDOC_REC_DATA_KOLA_VARIANT`：
   - 条件：`FAMILY_ID` 和 `VARIANT_ID`
   - 返回字段：`Symbol`、`DESCRIPTION`
3. 处理规则：
   - `Symbol` 字段展示时取前 8 个字符；
   - 若少于 8 个字符，以左对齐半角空格补齐至 8 个字符；
   - `FUNCTION_GROUP` 以左对齐、半角空格补足至 4 个字符；
   - 以 `FUNCTION_GROUP + FAMILY_ID` 组合排序，生成最终展示顺序。
4. 输出字段：
   - `display`：已经截取与补全后的 Symbol 展示值；
   - `description`：对应的 DESCRIPTION 说明文本。

### 3.2 校验详细规格表

| No. | 检查时机 | 检查对象 | 检查条件 | 错误消息 (Message Content) | 动作 |
| :-: | :------- | :------- | :------- | :------------------------- | :--- |
| 1   | 页面初始化 | `chassisNo` | 为空或缺失 | `Chassis no is required.` | 展示错误信息，终止加载 |
| 2   | API 返回   | 数据读取结果 | 失败 / 无匹配记录 | `Unable to load vehicle specification. Please contact administrator.` | 展示错误信息，建议用户重试或返回 |

## 4. 接口定义 (API Specification)

### 4.1 UD07VehicleSpecificationApi

- **功能**：根据传入的 `chassisNo` 参数，从指定业务数据表中获取对应车辆的全量规格参数，并完成字段处理后返回给前端。
- **Method**：`GET`
- **Endpoint**：`/api/ud07/UD07VehicleSpecificationApi`

#### Request Body

```json
{
  "chassisNo": "string"
}
```

##### 请求示例

```json
{
  "chassisNo": "JPCT 028321"
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "msg": null,
  "data": {
    "model": "UD-HDE",
    "builtWeek": "1617",
    "productType": "EM 64 R",
    "vin": "USCZZ1235689",
    "engineNo": "428320",
    "countryOfOperation": "CN",
    "symbolList": [
      {
        "display": "SYMBOL11",
        "description": "Description of SYMBOL11"
      },
      {
        "display": "SYMBOL12",
        "description": "Description of SYMBOL12"
      }
    ],
    "sNoteNo": "S-NOTE001"
  }
}
```

##### 响应字段说明

| 字段名 | 类型 | 说明 |
| :----- | :--- | :--- |
| `model` | string | 来自 `HDOC_REC_DATA_OM.MODEL` |
| `builtWeek` | string | 来自 `HDOC_REC_DATA_OM.BUILD` |
| `productType` | string | 来自 `HDOC_REC_DATA_VDA_GENERAL.PRODUCT_TYPE` |
| `vin` | string | 来自 `HDOC_REC_DATA_VDA_GENERAL.VIN` |
| `engineNo` | string | 当前暂固定返回 `428320` |
| `countryOfOperation` | string | 来自 `HDOC_REC_DATA_VDA_GENERAL.COUNTRY_OF_OPERATION` |
| `symbolList` | array | 关联 `HDOC_REC_DATA_VDA_VARIANTS` 和 `HDOC_REC_DATA_KOLA_VARIANT` 表后生成的 Symbol 列表 |
| `sNoteNo` | string | 来自 `HDOC_REC_DATA_OM.CUSTOMER_ADAP` |

##### Response Error (400 / 500)

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
| API 调用超时 | 记录日志，提示用户重试 | `System error. Please contact administrator.` |
| API 返回 500 | 记录日志，提示用户联系管理员 | `System error. Please contact administrator.` |
| 数据为空或无匹配记录 | 提示用户检查 Chassis no 或返回上一页面 | `Unable to load vehicle specification. Please contact administrator.` |

## 6. 实现注意事项 (Implementation Notes)

1. **状态管理**：
   - 使用 React state 管理 `chassisNo`、`model`、`builtWeek`、`productType`、`vin`、`engineNo`、`countryOfOperation`、`symbolList`、`sNoteNo`、`errorMessage`、`isLoading`。
   - `errorMessage` 默认为空，出错时展示对应信息。
2. **页面初始化**：
   - 页面加载时从路由参数或应用状态获取 `chassisNo`。
   - 若 `chassisNo` 为空，则不调用 API，直接显示错误。
   - 自动调用 `UD07VehicleSpecificationApi`，展示加载状态直至返回结果。
3. **Symbol 处理**：
   - 服务器端或前端负责将 `Symbol` 截取为前 8 个字符并补全空格。
   - `FUNCTION_GROUP` 补齐到 4 位后，与 `FAMILY_ID` 拼接排序以保证一致性。
4. **Tooltip 显示**：
   - DESCRIPTION 字段作为 Tooltip 绑定在对应 Variant 项目上。
   - 鼠标悬停时显示，移出时隐藏。
5. **排版规则**：
   - 所有文本统一左对齐，避免视觉错位。
   - 长度不足的字段使用半角空格补齐，保持表格/列表结构稳定。
6. **安全与稳定性**：
   - 不在前端日志中打印原始业务数据。
   - API 查询仅读取车辆规格，不修改业务数据。
   - 若后续需求将 `engineNo` 改为真实业务字段，应同步调整接口和展示规则。
