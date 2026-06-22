# Generate Document 模块 (Generate Document Module) 详细设计说明书

| 文档编号     | DES-GDOC-001                | 版本号     | v1.2       |
| :----------- | :-------------------------- | :--------- | :--------- |
| **模块名称** | 文档生成结果展示 (Generate Document Result) | **作成日** | 2022-11-21 |
| **作成者**   | UD 劉 / UD 李               | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块是“Generate Homologation Document”流程的结果展示页面。当用户在前一页面提交搜索条件后，系统调用 VPPS VIN PLATE 创建批处理程序，并将生成的 VIN Plate 及相关车辆信息显示在此页面。

- **目标**：展示特定底盘号（Chassis No）的接收信息、S-Note、轮胎主数据以及生成的 VIN Plate 下载链接。
- **业务逻辑**：
    1.  **自动执行**：进入页面时自动触发后台批处理生成 VIN Plate。
    2.  **信息展示**：显示订单号、构建周、市场信息等。
    3.  **异常处理**：若 AD-Change 状态激活，提供修改入口；若批处理失败，显示错误信息。
    4.  **导航功能**：提供跳转至调试页面、修改页面或车辆详细信息页面的链接。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item) | 種別 (Type) | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars)          | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                    |
| :------------ | :---------- | :--------: | :-------: | :----: | :-------------------------------- | :--------------: | :--------------: | :----------------: | :---------------------- |
| **Chassis no**    | Label       |     -      |    15     | Output | 半角英数字                        |    左 (Left)     | 前画面传入值     |      静态显示      | 包含 Series + No        |
| **Ordernumber**   | Label       |     -      |    16     | Output | 半角英数字                        |    左 (Left)     | API 返回         |      静态显示      | 来源: `HDOC_REC_DATA_OM` |
| **Build week**    | Label       |     -      |    10     | Output | 半角数字                          |    左 (Left)     | API 返回         |      静态显示      | 来源: `HDOC_REC_DATA_OM` |
| **Spec week**     | Label       |     -      |    10     | Output | 半角数字                          |    左 (Left)     | API 返回         |      静态显示      | 来源: `HDOC_REC_DATA_OM` |
| **Market**        | Label       |     -      |    10     | Output | 半角英字                          |    左 (Left)     | API 返回         |      静态显示      | 来源: VDA `COUNTRY_OF_OPERATION` |
| **Master Market** | Label       |     -      |     -     | Output | 固定字符串                        |    左 (Left)     | `-EU`            |      静态显示      | 固定值                  |
| **S-Note NO**     | Label       |     -      |   4000    | Output | 任意可见字符                      |    左 (Left)     | API 返回         |      动态显示      | 来源: `CUSTOMER_ADAP`   |
| **S-Note Desc**   | Label       |     -      |   256     | Output | 任意可见字符                      |    左 (Left)     | API 返回         |      动态显示      | 来源: `DESCRIPTION`     |
| **S-Note Message**| Label       |     -      |   256     | Output | 固定提示语                        |    左 (Left)     | 条件显示         |      动态显示      | 若有 S-Note 则显示警示语 |
| **Load Index**    | Label       |     -      |    10     | Output | 半角数字                          |    左 (Left)     | API 返回         |      静态显示      | 来源: Tire Master       |
| **Analyze Rules** | Link        |     -      |    10     | Action | -                                 |    左 (Left)     |        -         |   活性 (Enabled)   | 跳转至 HDOC DEBUG 页面  |
| **Modify Doc**    | Link        |     -      |     1     | Action | -                                 |    左 (Left)     | 条件显示         |   活性/非活性      | AD-Change 激活时红字显示 |
| **Using template**| Label       |     -      |    20     | Output | 文件名                            |    左 (Left)     | API 返回         |      静态显示      | 批处理使用的模板名      |
| **Replacing params**| Label     |     -      |    40     | Output | 键值对字符串                      |    左 (Left)     | API 返回         |      静态显示      | 显示替换的参数          |
| **Generated doc** | Link        |     -      |     -     | Action | -                                 |    左 (Left)     |        -         |   活性 (Enabled)   | 下载 .trf 文件          |
| **Date**          | Label       |     -      |    20     | Output | `yyyy-MM-dd HH:mm:ss`             |    左 (Left)     | 服务器时间       |      静态显示      |                         |
| **HDoc version**  | Label       |     -      |    20     | Output | 版本号字符串                      |    左 (Left)     | 程序版本         |      静态显示      |                         |
| **Error message** | Label       |     -      |     -     | Output | 任意可见字符                      |    左 (Left)     |    空 (Empty)    |      动态显示      | 仅在出错时显示红色文字  |

> **注**：
>
> - **Modify Doc Link**：当 `HDOC_ADCA_CHANGE.ACT` 为活性状态时，该链接文字颜色应为红色，并显示提示信息：“After def change detected. Document need to be modified.”
> - **S-Note Message**：若存在 S-Note 信息，固定显示：“The S-Notes above can affect homologation documents.”

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

1.  **开始**：页面加载（从上一页面跳转而来，携带 Chassis 信息）。
2.  **后台批处理调用**：
    - 调用 VPPS VIN PLATE 创建批处理。
    - 获取生成的 Template 文件名及替换参数。
3.  **数据获取**：
    - 并行或串行调用多个接口获取 OM、VDA、KOLA、ADCA 等数据。
4.  **状态判断**：
    - 检查 AD-Change 状态，决定“Modify Doc”链接的显示与样式。
    - 检查批处理结果，决定“Generated document”链接是否可用。
5.  **渲染页面**：展示所有标签信息及操作链接。

### 3.2 校验详细规格表

| No. |   检查时机   |     检查对象      |                检查条件                |                          错误消息 (Message Content)                           |                 动作                 |
| :-: | :----------: | :---------------: | :------------------------------------: | :---------------------------------------------------------------------------: | :----------------------------------: |
|  1  | Batch Result | 批处理执行结果     |  `Status == Failed`                    | `Batch processing failed: Failed to make the Inplate\nError reason: XXX`    | 显示 Error Message，禁用下载链接     |
|  2  | Template Check| 模板文件存在性     |  `Template File Not Found`             |                   `Can not find template for doctype VIN-PLATE`             | 显示 Error Message                   |
|  3  | Rule Check   | 模板规则匹配       |  `Template Name not in User Defined Rules` | `Can not find TEMPLATE-VIN-PLATE. No match in user defined rules.`      | 显示 Error Message                   |
|  4  | Rule Check   | 模板参数匹配       |  `Params not in User Defined Rules`    | `No template rule defined for this truck.\nXXX\nXXX`                        | 显示 Error Message                   |

## 4. 接口定义 (API Specification)

### 4.1 Get Document Details

- **功能**：获取指定底盘号的所有展示数据。
- **Method**: `GET`
- **Endpoint**: `/api/hdoc/generate/details?chassisSeries={series}&chassisNo={no}`

#### Response Success (200 OK)

```json
{
  "code": 200,
  "data": {
    "chassisInfo": {
      "chassisNo": "ABC123456789",
      "orderNumber": "ORD-987654",
      "buildWeek": "2022-W45",
      "specWeek": "2022-W40",
      "market": "DE",
      "masterMarket": "-EU"
    },
    "sNote": {
      "noteNo": "SN-001",
      "description": "Special adaptation for winter package",
      "hasImpact": true
    },
    "tireMaster": {
      "loadIndex": "120"
    },
    "adChange": {
      "isActive": true,
      "modificationDetails": [
        { "variable": "PARAM_A", "newValue": "VAL_1" }
      ]
    },
    "generationResult": {
      "templateName": "VIN_PLATE_V1.trf",
      "downloadUrl": "/api/hdoc/download/DOC-123",
      "generatedAt": "2022-12-02 05:11:45"
    },
    "systemInfo": {
      "version": "v1.2.0"
    }
  },
  "message": "success"
}

#### Response Error (500 Internal Server Error)

```json
{
  "code": 500,
  "data": null,
  "message": "Batch processing failed: Failed to make the Inplate\nError reason: Database connection timeout"
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                                         |
| :----------------------- | :----------------- | :------------------------------------------------------- |
| **批处理失败**           | 捕获 Backend Error | `Batch processing failed: Failed to make the Inplate`     |
| **模板文件缺失**         | 捕获 File Error    | `Can not find template for doctype VIN-PLATE`            |
| **规则配置错误**         | 捕获 Config Error  | `No template rule defined for this truck.`               |
| **网络断开/超时**        | 捕获 Network Error | `Network error. Please check your connection.`           |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 管理加载状态 `isLoading`，在数据请求期间显示 Loading 动画。
    - 所有的展示数据（Label）应在组件挂载（useEffect）时一次性或分块请求获取。
2.  **安全性**：
    - 下载链接 Generated document 应使用临时签名 URL 或经过身份验证的接口，防止未授权下载。
    - 避免在 URL 中明文传递敏感的车辆识别信息，建议使用 POST 请求或加密参数。
3.  **UI 细节**：
    - Modify Doc Link 在 `adChange.isActive` 为 `true` 时，CSS 颜色应设为红色 (`#ff4d4f`)。
    - Analyze Rules 和 Generated document 链接应带有下划线或手型光标，明确其可点击性。
    - Error message area 应位于页面顶部或显著位置，确保用户能第一时间看到批处理或数据获取的错误。