# 车辆规格模块 (Vehicle Specification Module) 详细设计说明书

| 文档编号     | DES-VEHICLE-SPEC-UD07   | 版本号     | v1.1       |
| :----------- | :---------------------- | :--------- | :--------- |
| **模块名称** | Vehicle Specification   | **作成日** | 2022-11-21 |
| **作成者**   | UD 刘 / UD 李           | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于显示所选底盘（Chassis）的详细车辆规格信息。页面从上一画面接收底盘号参数，并展示该底盘对应的型号、制造周、产品类型、VIN、发动机号、运营国家等详细信息。同时支持通过工具提示（Tooltip）显示变体（Variant）的说明信息。

- **目标**：为用户提供清晰的车辆规格查看界面，支持悬停显示详细说明。
- **安全性**：所有数据均为只读展示，基于底盘号从多个数据源表检索关联数据。
- **用户体验**：采用Label形式展示各项车辆信息，鼠标悬停在变体符号上时自动显示DESCRIPTION说明。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item)                | 種別 (Type) | 必須 (Req) | MaxLength |  I/O    | 許容文字 (Allowed Chars) | 文字配置 (Align) | 初期値 (Default)        | 表示制御 (Control) | 备注                                                                 |
| :--------------------------- | :---------- | :--------: | :-------: | :-----: | :----------------------- | :--------------: | :---------------------- | :----------------- | :------------------------------------------------------------------- |
| **Chassis no（底盘号）**     | Label       |     -      |     -     | Output  | -                        |    左 (Left)     | =F9（由前画面传递）     | -                  | 从上一画面接收                                                     |
| **Model（型号）**            | Label       |     -      |     -     | Output  | -                        |    左 (Left)     | -                       | -                  | 从HDOC_REC_DATA_OM.MODEL获取                                       |
| **Built week（制造周）**     | Label       |     -      |     -     | Output  | -                        |    左 (Left)     | -                       | -                  | 从HDOC_REC_DATA_OM.BUILD获取                                       |
| **Product type（产品类型）** | Label       |     -      |     -     | Output  | -                        |    左 (Left)     | -                       | -                  | 从HDOC_REC_DATA_VDA_GENERAL.PRODUCT_TYPE获取                       |
| **VIN（车架号）**            | Label       |     -      |     -     | Output  | -                        |    左 (Left)     | -                       | -                  | 从HDOC_REC_DATA_VDA_GENERAL.VIN获取                                |
| **Engine no（发动机号）**    | Label       |     -      |     -     | Output  | -                        |    左 (Left)     | -                       | -                  | 多表联合查询获取（见数据检索逻辑）                                 |
| **Country of Operation**     | Label       |     -      |     -     | Output  | -                        |    左 (Left)     | -                       | -                  | 从HDOC_REC_DATA_VDA_GENERAL.COUNTRY_OF_OPERATION获取               |
| **SYMBOL_STR（符号串）**     | Label       |     -      |     -     | Output  | -                        |    左 (Left)     | -                       | -                  | 多表联合查询获取，Symbol前8位（不足补空格），按FUNCTION_GROUP排序  |
| **DESCRIPTION（说明）**      | Tooltip     |     -      |     -     | Output  | -                        |    左 (Left)     | -                       | 动态显示           | 鼠标悬停在SYMBOL_STR上时显示，从HDOC_REC_DATA_KOLA_VARIANT.DESCRIPTION获取 |
| **S-Note NO（S-Note编号）**  | Label       |     -      |     -     | Output  | -                        |    左 (Left)     | -                       | -                  | 从HDOC_REC_DATA_OM.CUSTOMER_ADAP获取                               |
| **S-Note Desc（S-Note描述）**| Label       |     -      |     -     | Output  | -                        |    左 (Left)     | -                       | -                  | 从HDOC_REC_DATA_KAP_SNOTE.DESCRIPTION获取                          |

> **注**：
> - **版本变更**：v1.1已删除"S-Note说明显示"相关功能
> - **数据检索逻辑**：
>   - Engine no 和 SYMBOL_STR 需要通过多表联合查询获取：
>     1. 从 HDOC_REC_DATA_VDA_VARIANTS 检索 FAMILY_ID, VARIANT_ID（条件：Chassis no）
>     2. 从 HDOC_REC_DATA_KOLA_VARIANT 检索 Symbol, FUNCTION_GROUP（条件：FAMILY_ID, VARIANT_ID）
>   - SYMBOL_STR 显示规则：
>     - 取得 Symbol 的前8位
>     - 不足8位时左侧补半角空格
>     - 排序规则：将 FUNCTION_GROUP 左对齐补足4位半角空格，再连接 FAMILY_ID（3位）

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

1.  **开始**：页面加载事件触发。
2.  **前置处理**：从URL参数或state中获取 Chassis no（=F9）。
3.  **空值校验 (Frontend Check)**：
    - 若 `Chassis no` 为空：
      - 设置 Message = `No chassis number provided.`
      - **终止**流程，不显示任何数据。
4.  **API 调用 (Backend Check)**：
    - 调用 `GetVehicleSpecificationApi(chassisNo)` 获取车辆规格数据。
    - API内部执行以下数据检索：
      1. 从 HDOC_REC_DATA_OM 获取 Model, Built week, S-Note NO
      2. 从 HDOC_REC_DATA_VDA_GENERAL 获取 Product type, VIN, Country of Operation
      3. 从 HDOC_REC_DATA_VDA_VARIANTS + HDOC_REC_DATA_KOLA_VARIANT 联合查询获取 Engine no, SYMBOL_STR
      4. 从 HDOC_REC_DATA_KAP_SNOTE 获取 S-Note Desc
5.  **结果处理**：
    - **成功**：将所有字段数据填充到对应的Label中。
    - **失败**：若无数据：显示 `No data found for this chassis.`；若其他错误：显示具体错误消息。
6.  **Tooltip交互**：
    - 用户鼠标悬停在 SYMBOL_STR 上时，显示 DESCRIPTION 的Tooltip。

### 3.2 校验详细规格表

| No. |   检查时机   |       检查对象       |          检查条件           | 错误消息 (Message Content) |              动作               |
| :-: | :----------: | :------------------: | :-------------------------: | :------------------------: | :-----------------------------: |
|  1  |  页面初始化  |    Chassis no参数    | `Value == null` OR `== ""`  |      `No chassis number provided.`       |   显示错误消息，不加载数据   |
|  2  |  API 响应   | 车辆规格数据查询结果 |      无对应底盘的数据       |      `No data found for this chassis.`       |   显示错误消息，清空所有字段   |
|  3  |  API 响应   |    服务器错误        |  `Status != Success`  | `System error. Please contact administrator.` |   显示错误消息   |

## 4. 接口定义 (API Specification)

### 4.1 GetVehicleSpecificationApi

- **功能**：根据底盘号获取完整的车辆规格信息。
- **Method**: `GET`
- **Endpoint**: `/api/ud07/getvehiclespec`

#### Request Params

```json
{
  "chassisNo": "string (从上一画面传递)"
}
```

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "获取车辆规格成功",
  "data": {
    "chassisNo": "ABC123456",
    "model": "Model X",
    "builtWeek": "2022W45",
    "productType": "SUV",
    "vin": "WVWZZZ3CZWE123456",
    "engineNo": "DPX123456789",
    "countryOfOperation": "DE",
    "symbolStr": "  DPX1234",
    "description": "This is a variant description for tooltip display",
    "sNoteNo": "SN001",
    "sNoteDesc": "Customer adaptation note"
  }
}
```

##### 响应字段说明

| 字段名             | 类型   | 说明                                                                              |
| :----------------- | :----- | :-------------------------------------------------------------------------------- |
| chassisNo          | String | 底盘号，从上一画面传递                                                            |
| model              | String | 型号，来自HDOC_REC_DATA_OM.MODEL                                                  |
| builtWeek          | String | 制造周，来自HDOC_REC_DATA_OM.BUILD                                                |
| productType        | String | 产品类型，来自HDOC_REC_DATA_VDA_GENERAL.PRODUCT_TYPE                              |
| vin                | String | VIN车架号，来自HDOC_REC_DATA_VDA_GENERAL.VIN                                      |
| engineNo           | String | 发动机号，通过多表联合查询获取                                                    |
| countryOfOperation | String | 运营国家，来自HDOC_REC_DATA_VDA_GENERAL.COUNTRY_OF_OPERATION                      |
| symbolStr          | String | 符号串，Symbol前8位（不足补空格），按FUNCTION_GROUP+FAMILY_ID排序                 |
| description        | String | 说明，用于Tooltip显示，来自HDOC_REC_DATA_KOLA_VARIANT.DESCRIPTION                 |
| sNoteNo            | String | S-Note编号，来自HDOC_REC_DATA_OM.CUSTOMER_ADAP                                    |
| sNoteDesc          | String | S-Note描述，来自HDOC_REC_DATA_KAP_SNOTE.DESCRIPTION                               |

#### Response Error (400/500)

```json
{
  "success": false,
  "message": "No data found for this chassis.",
  "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **未传递底盘号参数**     | 前端校验拦截       | `No chassis number provided.`                  |
| **底盘号无对应数据**     | API返回400错误     | `No data found for this chassis.`              |
| **数据库连接异常**       | API返回500错误     | `System error. Please contact administrator.`  |
| **API超时**              | 前端捕获超时异常   | `Request timeout. Please try again later.`     |
| **网络异常**             | 前端捕获网络异常   | `Network connection failed. Please check your network settings.` |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 管理 `vehicleSpec`, `errorMessage`, `isLoading`。
    - 页面加载时从location.state或URL参数获取chassisNo。
2.  **安全性**：
    - API 请求必须携带有效的认证Token。
    - 所有数据均为只读展示，禁止修改操作。
3.  **UI 细节**：
    - 所有字段使用Label形式展示，左对齐。
    - SYMBOL_STR 字段应支持鼠标悬停显示Tooltip，Tooltip内容为DESCRIPTION。
    - Tooltip样式建议使用浅色背景、深色文字，带边框和阴影效果。
    - 若某个字段值为空，显示 `-` 或留空（根据业务需求决定）。
    - 建议在页面顶部显示标题 "Vehicle Specification"，并显示当前底盘号。
4.  **性能优化**：
    - 多表联合查询应在后端完成，避免前端多次API调用。
    - Tooltip内容可预加载，避免悬停时才发起请求。
5.  **数据检索逻辑实现**：
    - Engine no 和 SYMBOL_STR 的查询需要在后端执行SQL JOIN操作：
      ```sql
      SELECT 
        kv.SYMBOL, 
        kv.FUNCTION_GROUP,
        kv.DESCRIPTION
      FROM HDOC_REC_DATA_VDA_VARIANTS vdv
      INNER JOIN HDOC_REC_DATA_KOLA_VARIANT kv 
        ON vdv.FAMILY_ID = kv.FAMILY_ID 
        AND vdv.VARIANT_ID = kv.VARIANT_ID
      WHERE vdv.CHASSIS_NO = ?
      ORDER BY LPAD(kv.FUNCTION_GROUP, 4, ' ') || vdv.FAMILY_ID
      ```
    - SYMBOL_STR 显示时需截取前8位，不足部分左侧补空格。

---
