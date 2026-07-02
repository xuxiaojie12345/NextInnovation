# HDoc中的市场模块 (Markets in HDoc Module) 详细设计说明书

| 文档编号     | DES-MARKETS-IN-HDOC-UD21   | 版本号     | v1.0       |
| :----------- | :------------------------- | :--------- | :--------- |
| **模块名称** | Markets in HDoc            | **作成日** | 2022-11-30 |
| **作成者**   | UD 刘                      | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于显示HDoc系统中所有市场的列表信息。页面从MARKET_MASTER表中读取Market代码和描述信息，并以表格形式展示给用户。该功能主要用于查看系统中配置的所有可用市场。

- **目标**：提供清晰的市场列表查看界面，支持用户快速浏览所有可用市场信息。
- **安全性**：所有数据均为只读展示，基于MARKET_MASTER表检索。
- **用户体验**：采用简洁的表格形式展示Market、Description、Weights from HDoc三列信息。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item)          | 種別 (Type)    | 必須 (Req) | MaxLength |   I/O    | 許容文字 (Allowed Chars)      | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                                               |
| :--------------------- | :------------- | :--------: | :-------: | :------: | :---------------------------- | :--------------: | :--------------: | :----------------: | :------------------------------------------------- |
| **Market**             | TextField      |     -      |     -     | Output   | -                             |    左 (Left)     | =F7              | -                  | 来自MARKET_MASTER.F7                               |
| **Description**        | TextField      |     -      |     -     | Output   | -                             |    左 (Left)     | =F8              | -                  | 来自MARKET_MASTER.F8                               |
| **Weights from HDoc**  | TextField      |     -      |     -     | Output   | -                             |    左 (Left)     | -                | -                  | 权重信息（具体来源待定）                           |

> **注**：
> - Market 和 Description 字段直接从 MARKET_MASTER 表的 F7 和 F8 列获取
> - Weights from HDoc 字段的来源需要进一步确认，当前设计书中未明确指定数据源

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

#### 3.1.1 页面初始化流程

1.  **开始**：页面加载事件触发。
2.  **API 调用 (Backend Check)**：
    - 调用 `GetMarketsListApi()` 获取所有市场列表。
3.  **结果处理**：
    - **成功**：将所有市场数据填充到DataTable中。
    - **失败**：若无数据：显示 `No data found.`；若其他错误：显示具体错误消息。

### 3.2 校验详细规格表

| No. |   检查时机   |       检查对象       |          检查条件           | 错误消息 (Message Content) |              动作               |
| :-: | :----------: | :------------------: | :-------------------------: | :------------------------: | :-----------------------------: |
|  1  |  页面初始化  | MARKET_MASTER表      |      无数据                 |      `No data found.`       |   显示错误消息，DataTable为空   |
|  2  |  API 响应   |    服务器错误        |  `Status != Success`  | `System error. Please contact administrator.` |   显示错误消息   |

## 4. 接口定义 (API Specification)

### 4.1 GetMarketsListApi

- **功能**：获取所有市场列表信息。
- **Method**: `GET`
- **Endpoint**: `/api/ud21/getmarketslist`

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "获取市场列表成功",
  "data": [
    {
      "market": "EU",
      "description": "Europe",
      "weightsFromHdoc": "1.0"
    },
    {
      "market": "US",
      "description": "United States",
      "weightsFromHdoc": "1.2"
    },
    {
      "market": "JP",
      "description": "Japan",
      "weightsFromHdoc": "0.9"
    }
  ]
}
```

##### 响应字段说明

| 字段名            | 类型   | 说明                                                                              |
| :---------------- | :----- | :-------------------------------------------------------------------------------- |
| market            | String | 市场代码，来自MARKET_MASTER.F7                                                    |
| description       | String | 市场描述，来自MARKET_MASTER.F8                                                    |
| weightsFromHdoc   | String | HDoc中的权重值                                                                    |

#### Response Error (400/500)

```json
{
  "success": false,
  "message": "No data found.",
  "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **无市场数据**           | API返回400错误     | `No data found.`                               |
| **数据库连接异常**       | API返回500错误     | `System error. Please contact administrator.`  |
| **API超时**              | 前端捕获超时异常   | `Request timeout. Please try again later.`     |
| **网络异常**             | 前端捕获网络异常   | `Network connection failed. Please check your network settings.` |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 管理 `marketsList`, `errorMessage`, `isLoading`。
    - marketsList为数组，每个元素包含 market、description、weightsFromHdoc 三个字段。
2.  **安全性**：
    - API 请求必须携带有效的认证Token。
    - 所有数据均为只读展示，禁止修改操作。
3.  **UI 细节**：
    - 采用数据表格形式展示，表头包含 Market、Description、Weights from HDoc 三列。
    - 所有字段左对齐显示。
    - 若某个字段值为空，显示 `-` 或留空（根据业务需求决定）。
    - 建议在页面顶部显示标题 "Markets in HDoc"。
4.  **性能优化**：
    - 市场列表数据可在页面加载时一次性获取并缓存。
    - 若数据量较大，可考虑添加分页或滚动加载功能。
5.  **数据来源说明**：
    - Market 和 Description 字段明确来自 MARKET_MASTER 表的 F7 和 F8 列
    - Weights from HDoc 字段的具体来源需要在后端实现时确认

---
