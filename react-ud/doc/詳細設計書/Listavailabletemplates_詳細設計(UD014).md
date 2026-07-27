# List Available Templates 模块详细设计说明书

| 文档编号     | DES-List available templates-014 | 版本号     | v1.0       |
| :----------- | :------------------------------- | :--------- | :--------- |
| **模块名称** | List Available Templates         | **作成日** | 2026-07-17 |
| **作成者**   | GitHub Copilot                   | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块为 List Available Templates 对应功能页面，核心功能是提供指定市场下存储的模板文件清单查询能力：页面初始化阶段展示基础操作区域，待用户选择指定 Market 值后，系统从对应 Market 文件夹中拉取所有存储的模板文件信息完成列表展示，同时支持用户直接点击文件名称对应的链接完成模板文件的一键下载操作，完整实现模板资源的可视化查询与快速获取需求。

- **目标**：支持用户通过选择 Market 查询对应模板文件列表，并通过点击文件名称直接下载模板文件。
- **安全性**：模块所有数据读取操作仅允许从 `MARKET_MASTER` 主表、`HDOC_USER_DEFINED_RULES` 业务表以及指定路径的 Market 文件夹中执行，全程不触发任何业务数据写入操作，保障核心配置数据的不可篡改。
- **用户体验**：
  - 页面初始状态下 Market 下拉选择框默认处于激活可操作状态，无需用户执行额外前置引导步骤。
  - 所有列表字段的展示内容统一左对齐排布，适配用户常规浏览习惯。
  - 点击文件名称后直接触发下载流程，无多余跳转页面，最大化压缩用户获取模板资源的操作路径。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| No. | 项目名 (Item) | 种类 (Type) | 必须 (Req) | MaxLength | I/O | 允许字符 (Allowed Chars) | 文字对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注 |
| :-: | :------------ | :---------- | :--------: | :-------: | :-: | :----------------------- | :--------------: | :--------------: | :----------------: | :--- |
| 1 | **SelectMarket** | Pull-down List | - | 3 | Input | 半角英数字 (`a-z, A-Z, 0-9`) | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 数据源为 `MARKET_MASTER` 主表的 `MARKET` 字段，提供可选择的市场选项 |
| 2 | **Filename** | DataTable | - | - | Output | - | 左 (Left) | 空 (Empty) | - | 数据源为对应 Market 文件夹下存储的文件名称，字段内容为可点击的超链接，点击即可下载对应文件 |
| 3 | **Used** | DataTable | - | - | Output | - | 左 (Left) | 空 (Empty) | - | 数据源为 `HDOC_USER_DEFINED_RULES` 表的 `VARIABLE` 字段，仅当 `HDOC_USER_DEFINED_RULES` 中存在对应登记信息时，展示对应的 VARIABLE 内容 |
| 4 | **Last Mod.** | DataTable | - | - | Output | - | 左 (Left) | 空 (Empty) | - | 数据源为对应 Market 文件夹下的文件更新日期，展示模板文件的最后修改时间 |
| 5 | **Size** | DataTable | - | - | Output | - | 左 (Left) | 空 (Empty) | - | 数据源为对应 Market 文件夹下的文件大小，展示模板文件的存储体积 |
| 6 | **Message** | Label | - | - | Output | - | 左 (Left) | - | 动态显示 | 用于页面各类错误提示信息的展示区域 |

> **注**：
>
> - **SelectMarket**：下拉选项从 `MARKET_MASTER` 表的 `MARKET` 字段获取，选择后触发模板列表查询。
> - **Filename**：以超链接形式展示，用户点击后触发文件下载。
> - **Message**：默认隐藏，仅在出错时显示对应错误消息，文字颜色建议使用红色（`#ff4d4f`）。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

#### 3.1.1 初始化显示

画面正常展示，调用 `UD14SelectMarketmaster` 接口加载 `MARKET_MASTER` 表中的所有有效市场选项至 SelectMarket 下拉框，模板列表区域（Filename、Used、Last Mod.、Size）初始仅展示对应列表表头，无数据内容展示。

#### 3.1.2 查询操作：[用户在 SelectMarket 下拉列表中选中需要查询的目标 Market]

**开始**：用户从 SelectMarket 下拉列表中选中一个 Market 值。

**API 调用 (Backend Check)**：

调用 `UD14SelectHdocuserdefinedrules` 接口，传入选中的 Market 参数。

**结果处理**：

- **成功**：在页面列表区域渲染展示选中 Market 下的所有模板文件信息（Filename、Used、Last Mod.、Size），无额外成功提示弹窗。
- **失败**：设置 `Message` = `System error. Please contact administrator.`

#### 3.1.3 下载操作：[用户点击列表内任意 Filename 字段的文件链接]

**开始**：用户点击列表中任意一个 Filename 超链接。

**API 调用 (Backend Check)**：

调用 `UD14downfile` 接口，传入选中的 Market 和 Filename 参数。

**结果处理**：

- **成功**：自动唤起浏览器的文件下载进程，将目标模板文件下载至用户本地。
- **失败**：设置 `Message` = `System error. Please contact administrator.`

### 3.2 校验详细规格表

无前端校验规则。所有处理逻辑依赖后端接口返回结果，根据成功/失败状态进行相应处理。

## 4. 接口定义 (API Specification)

### 4.1 UD14SelectMarketmaster

- **功能**：获取 `MARKET_MASTER` 表的 `MARKET` 字段，填充到画面 Market 下拉框。
- **Method**: `GET`
- **Endpoint**: `/api/ud014/UD14SearchresultistApi/UD14SelectMarketmaster`

#### Request

```
GET /api/ud014/UD14SearchresultistApi/UD14SelectMarketmaster
```

#### Response Success (200 OK)

```json
{
  "code": "200",
  "message": "查询成功",
  "data": [
    "CN",
    "BJ",
    "JPJ",
    "US"
  ]
}
```

#### Response Error (500)

```json
{
  "code": 500,
  "message": "System error. Please contact administrator.",
  "data": null
}
```

### 4.2 UD14SelectHdocuserdefinedrules

- **功能**：根据前端传入的 Market 参数，拉取 `HDOC_USER_DEFINED_RULES` 表的关联规则信息，同时读取对应 Market 文件夹下的所有文件属性，组装成完整的模板列表数据返回前端。
- **Method**: `GET`
- **Endpoint**: `/api/ud014/UD14SearchresultistApi/UD14SelectHdocuserdefinedrules`

#### Request

```
GET /api/ud014/UD14SearchresultistApi/UD14SelectHdocuserdefinedrules?market={选中的Market编码}
```

请求示例：

```
GET /api/ud014/UD14SearchresultistApi/UD14SelectHdocuserdefinedrules?market=CN
```

#### Response Success (200 OK)

```json
{
  "code": "200",
  "message": "查询成功",
  "data": [
    {
      "filename": "filename.docx",
      "used": "usedValue",
      "lastMod": "2022-11-20 10:30:00",
      "size": "2.3MB"
    }
  ]
}
```

#### Response Error (500)

```json
{
  "code": 500,
  "message": "System error. Please contact administrator.",
  "data": null
}
```

### 4.3 UD14downfile

- **功能**：根据前端传入的 Filename 与 Market 参数，定位到对应 Market 文件夹下的目标模板文件，返回文件流供浏览器下载。
- **Method**: `GET`
- **Endpoint**: `/api/ud014/UD14SearchresultistApi/UD14downfile`

#### Request

```
GET /api/ud014/UD14SearchresultistApi/UD14downfile?market={选中的Market编码}&filename={目标文件名称}
```

请求示例：

```
GET /api/ud014/UD14SearchresultistApi/UD14downfile?market=CN&filename=filename.docx
```

#### Response Success (200 OK)

直接返回对应文件的二进制流，浏览器自动触发下载操作。

#### Response Error (500)

```json
{
  "code": 500,
  "message": "System error. Please contact administrator.",
  "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景 | 处理方式 | Message 显示内容 |
| :------- | :------- | :--------------- |
| 查询模板列表接口调用超时或返回系统内部错误 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.` |
| 下载模板文件接口调用超时或返回系统内部错误 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.` |

## 6. 实现注意事项 (Implementation Notes)

1. **状态管理**：
   - 使用 React State 管理 `marketList`（下拉选项列表）、`selectedMarket`（选中的 Market 值）、`templateList`（模板文件列表数据）、`message`（错误消息）、`isLoading`（加载状态）。
   - `Message` Label 默认隐藏（内容为空时不占位或高度为 0）。
   - 模板列表数据初始为空数组，下拉框触发查询后更新。

2. **初始化数据加载**：
   - 页面加载时调用 `UD14SelectMarketmaster` 接口获取 Market 下拉选项列表，填充 SelectMarket 下拉框。
   - 下拉框默认无选中项，模板列表区域仅显示表头。

3. **下拉选择触发查询**：
   - SelectMarket 下拉框的 `onChange` 事件中调用 `UD14SelectHdocuserdefinedrules` 接口，传入选中的 Market 值。
   - 每次切换 Market 选项时重新请求对应模板列表数据。

4. **文件下载**：
   - Filename 列以超链接（`<a>` 标签）形式展示。
   - 点击超链接时调用 `UD14downfile` 接口，以 `window.open()` 或动态创建 `<a>` 标签 + `download` 属性的方式触发浏览器下载。
   - 建议使用 `blob` 方式处理文件流，确保大文件下载的稳定性。

5. **UI 细节**：
   - 所有列表字段（Filename、Used、Last Mod.、Size）统一左对齐。
   - SelectMarket 下拉框在 `isLoading` 期间应设为 `disabled` 状态，防止重复提交查询。
   - `Message` 文字颜色建议使用红色（`#ff4d4f`）以起到警示作用。
   - 错误提示展示后，用户切换 Market 选项或再次操作时，应自动清除上一次的错误消息。

6. **安全性**：
   - 所有数据读取操作仅从 `MARKET_MASTER` 主表、`HDOC_USER_DEFINED_RULES` 业务表以及指定路径的 Market 文件夹中执行。
   - 全程不触发任何业务数据写入操作。

---
