# Markets in HDoc 模块详细设计说明书

| 文档编号     | DES-Markets in HDoc-021 | 版本号     | v1.0       |
| :----------- | :---------------------- | :--------- | :--------- |
| **模块名称** | Markets in HDoc         | **作成日** | 2026-07-22 |
| **作成者**   | GitHub Copilot          | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块是 Markets in HDoc 页面，核心功能是在 Markets in HDoc 页面完成 Market 一览信息的展示，从 `MARKET_MASTER` 业务表中读取对应数据完成页面全量信息渲染。

- **目標**：实现 Market 主数据的一览展示，为用户提供 Market 编码、描述说明及 HDoc 权重值的统一查看入口。
- **安全性**：
  - 仅对业务库中 `MARKET_MASTER` 表执行只读（R）操作，不进行任何数据写入、修改或删除行为，保证源数据安全。
- **用户体验**：
  - 所有输出类展示字段统一采用左对齐排版，保证列表信息浏览整洁统一。
  - 无多余默认占位值干扰用户查阅真实业务数据。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| No. | 项目名 (Item) | 种类 (Type) | 必须 (Req) | MaxLength | I/O | 允许字符 (Allowed Chars) | 字符对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注 |
| :-: | :------------ | :---------- | :--------: | :-------: | :-: | :----------------------- | :--------------: | :--------------: | :----------------: | :--- |
| 1 | **Market** | TextField | - | - | Output | - | 左 (Left) | - | - | 数据源表为 `MARKET_MASTER`，数据源字段为 `Market`，用于展示市场编码信息 |
| 2 | **Description** | TextField | - | - | Output | - | 左 (Left) | - | - | 数据源表为 `MARKET_MASTER`，数据源字段为 `Description`，用于展示市场对应的描述说明 |
| 3 | **Weights from Hdoc** | TextField | - | - | Output | - | 左 (Left) | - | - | 无绑定数据源表及字段，用于展示 HDoc 中维护的对应权重值 |

> **注**：
>
> - **Market**、**Description**、**Weights from Hdoc** 为 DataTable 表格中的列，展示 Market 一览数据。
> - 所有展示列统一采用左对齐排版。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

#### 3.1.1 初始表示

画面正常表示，页面加载完成后自动触发 Market 一览数据的获取流程。

#### 3.1.2 触发条件：页面加载完成后自动触发

1. **空值校验 (Frontend Check)**：无前端前置校验逻辑。
2. **API 调用 (Backend Check)**：
   - 调用 `UD21SearchResultListApi.UD21SelectMarketMaster` 接口拉取 Market 一览数据。
3. **结果处理**：
   - **成功**：页面加载完成，完整展示全量 Market 一览数据（Market 编码、Description 描述说明、Weights from Hdoc 权重值）。
   - **失败**：弹出对应等级的警告提示信息，不阻断页面基础渲染，表格区域显示为空。

### 3.2 校验详细规格表

| No. | 检查时机 | 检查对象 | 检查条件 | 错误消息 (Message Content) | 动作 |
| :-: | :------- | :------- | :------- | :------------------------- | :--- |
| - | 无 | - | - | - | - |

> **注**：本模块仅为 Market 一览信息的展示画面，不涉及用户输入操作，无前端校验逻辑。

## 4. 接口定义 (API Specification)

### 4.1 UD21SearchResultListApi.UD21SelectMarketMaster

- **功能**：从 `MARKET_MASTER` 表中获取 Market 一览数据，包括 Market 编码、描述说明及 HDoc 权重值。
- **Method**: `GET`
- **Endpoint**: `/api/ud21/UD21SearchResultListApi/UD21SelectMarketMaster`

#### Request Body

```json
{}
```

#### Response Success (200 OK)

```json
{
  "code": "200",
  "data": [
    {
      "market": "CN",
      "description": "中国区市场",
      "weightsFromHdoc": "15.2"
    },
    {
      "market": "US",
      "description": "美国区市场",
      "weightsFromHdoc": "22.7"
    }
  ]
}
```

> **注**：响应中字段名请以前后端协商确认为准，注意 `market`/`Market`、`description`/`Description` 等大小写差异。

## 5. 异常处理 (Exception Handling)

| 异常场景 | 处理方式 | Message 显示内容 |
| :------- | :------- | :--------------- |
| 接口调用超时或返回系统内部错误 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.` |
| 网络断开/连接失败 | 捕获 Network Error，提示用户检查网络连接 | `Network error. Please check your connection.` |
| 接口返回数据为空 | 表格展示空数据状态，显示"无数据"提示 | - |

## 6. 实现注意事项 (Implementation Notes)

1. **状态管理**：
   - 使用 React State 管理 `marketList`（Market 一览数据列表）、`message`、`isLoading`。
   - `message` 区域默认隐藏（内容为空时不予显示）。

2. **数据加载时机**：
   - 页面加载完成后（`useEffect` 或 `componentDidMount`）自动调用 `UD21SelectMarketMaster` 接口获取数据。
   - 无需用户触发任何操作即可完成数据加载与页面渲染。

3. **只读模式**：
   - 本页面仅从 `MARKET_MASTER` 表读取数据，不提供任何新增、编辑、删除操作。
   - 所有展示字段均为纯文本输出，不可编辑。

4. **UI 细节**：
   - 所有列表列统一采用左对齐（Left）排版，保持信息浏览的整洁统一。
   - 列表字段无默认占位值，避免干扰用户查阅真实业务数据。
   - 数据加载期间显示 Loading 状态指示器。
   - 数据加载失败时，表格区域显示为空，并在页面顶部展示对应错误提示信息。
   - 表格展示无数据时显示"无数据"提示信息。

5. **响应字段映射**：
   - 注意后端响应数据中字段名的大小写（如 `market` 与 `Market`、`description` 与 `Description`），需根据实际接口响应进行前端字段映射。
   - `weightsFromHdoc` 字段在响应中为字符串类型（如 `"15.2"`），前端直接展示即可，无需额外格式转换。
