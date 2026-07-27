# Market Document Settings List 模块详细设计说明书

| 文档编号     | DES-Market Document Settings List-020 | 版本号     | v1.0       |
| :----------- | :------------------------------------ | :--------- | :--------- |
| **模块名称** | Market Document Settings List         | **作成日** | 2026-07-22 |
| **作成者**   | GitHub Copilot                        | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块是 Market Document Settings List 画面，核心功能是展示 HDoc - Market Document Setting 的搜索结果，支持用户选择记录后点击 Select 按钮跳转回前页面并自动回填选中内容、点击 Back 按钮直接跳转返回前画面、点击 Print 按钮打印当前展示的搜索结果、点击 User 链接跳转查看对应用户信息。同时支持从该搜索结果页面选中的信息自动回显到 Market Document Settings 的搜索画面，以及提供 EDB User View 画面完成用户完整信息展示。

- **目標**：为市场文档配置的查询、关联查看操作提供完整的流程支撑，实现搜索结果的选择回显、页面导航、打印输出及用户信息跳转查看等功能。
- **安全性**：
  - 所有数据从指定业务表 `HDOC_DOCUMENT_LIST` 获取，仅支持查询（R）操作，不提供任何数据修改权限，保障业务文档原始数据的安全性。
  - 页面不提供新增、编辑、删除等数据变更功能。
- **用户体验**：
  - 页面操作逻辑简洁直观，返回、选择、打印等高频常规功能通过独立按钮提供直接入口。
  - 用户信息通过可点击文本链接直接跳转查看，无需用户额外输入操作。
  - 选中目标记录后自动将内容带回前页面，减少用户二次录入的冗余操作，提升操作流畅度。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| No. | 项目名 (Item) | 种类 (Type) | 必须 (Req) | MaxLength | I/O | 允许字符 (Allowed Chars) | 字符对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注 |
| :-: | :------------ | :---------- | :--------: | :-------: | :-: | :----------------------- | :--------------: | :--------------: | :----------------: | :--- |
| 1 | **Document type** | TextField | - | 20 | Output | - | 左 (Left) | - | - | 数据来源表 `HDOC_DOCUMENT_LIST` 的 `DOCTYPE` 字段 |
| 2 | **Bussines unit** | TextField | - | - | Output | - | 左 (Left) | BU | - | 固定显示：BU |
| 3 | **User** | TextField | - | 16 | Output | - | 左 (Left) | - | - | 数据来源表 `HDOC_DOCUMENT_LIST` 的 `REGISTER_USER` 字段，支持点击跳转查看用户信息 |
| 4 | **Date** | TextField | - | - | Output | - | 左 (Left) | - | - | 数据来源表 `HDOC_DOCUMENT_LIST` 的 `REGISTER_DATETIME` 字段 |
| 5 | **Select** | Button | - | - | Action | - | - | - | 活性 (Enabled) | 用于提交选中的记录，返回前页面并自动回显选中内容 |
| 6 | **Back** | Button | - | - | Action | - | - | - | 活性 (Enabled) | 用于跳转返回至前一个页面 |
| 7 | **Print** | Button | - | - | Action | - | - | - | 活性 (Enabled) | 用于打印当前展示的搜索结果 |

> **注**：
>
> - **Document type**、**Bussines unit**、**User**、**Date** 为 DataTable 表格中的列，展示搜索结果列表。
> - **User** 列以可点击链接形式呈现，点击后跳转至 EDB User View 画面查看用户完整信息。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

#### 3.1.1 初始表示

画面正常渲染展示，调用 `UD20GetDocumentListApi.UD20SelectHdocDocumentList` 接口从 `HDOC_DOCUMENT_LIST` 表获取文档一览信息，渲染展示 HDoc - Market Document Setting 的搜索结果列表。Select、Back、Print 按钮均处于活性状态。

#### 3.1.2 触发条件：点击「Select」按钮

1. **空值校验 (Frontend Check)**：
   - 若未选中任意记录直接点击 Select 按钮：
     - 设置 `Message` = `No data found`
     - 错误级别为 Error
     - **终止后续流程**。
2. **API 调用 (Backend Check)**：
   - 若已选中记录，调用 `UD20GetDocumentListApi.UD20SelectHdocDocumentList` 接口获取对应选中记录的详情数据。
3. **结果处理**：
   - **成功**：跳转至前页面（Market Document Settings 搜索画面），自动将选中的内容回显到前页面对应的输入项位置。
   - **失败**：提示系统异常，请稍后重试。

#### 3.1.3 触发条件：点击「Back」按钮

1. **空值校验 (Frontend Check)**：无额外校验步骤。
2. **API 调用 (Backend Check)**：无后端接口调用。
3. **结果处理**：
   - **成功**：直接跳转返回前页面（Market Document Settings 搜索画面），不携带任何选中数据。

#### 3.1.4 触发条件：点击「Print」按钮

1. **空值校验 (Frontend Check)**：无额外校验步骤。
2. **API 调用 (Backend Check)**：
   - 调用当前搜索结果打印服务接口，拉取全量打印数据。
3. **结果处理**：
   - **成功**：唤起系统打印组件，将当前页面的搜索结果输出为打印内容。
   - **失败**：提示打印服务异常，请稍后重试。

#### 3.1.5 触发条件：点击「User」链接

1. **空值校验 (Frontend Check)**：无额外校验步骤。
2. **API 调用 (Backend Check)**：
   - 调用 EDB 用户信息查询接口，传入当前行对应的 `REGISTER_USER` 用户标识。
3. **结果处理**：
   - **成功**：跳转至 EDB User View 画面，展示该条记录对应的完整用户信息。
   - **失败**：提示用户信息获取失败，请稍后重试。

### 3.2 校验详细规格表

| No. | 检查时机 | 检查对象 | 检查条件 | 错误消息 (Message Content) | 错误级别 | 动作 |
| :-: | :------- | :------- | :------- | :------------------------- | :------- | :--- |
| 1 | 点击 Select 按钮时 | Select 按钮 | 未选中任意记录，直接点击 Select 按钮 | `No data found` | Error | 中断跳转流程，在页面展示错误提示信息 |

## 4. 接口定义 (API Specification)

### 4.1 UD20GetDocumentListApi.UD20SelectHdocDocumentList

- **功能**：查询 `HDOC_DOCUMENT_LIST` 表中的文档一览信息，用于 Market Document Settings List 页面的搜索结果渲染。
- **Method**: `GET`
- **Endpoint**: `/api/ud20/document/UD20GetDocumentListApi.UD20SelectHdocDocumentList`

#### Request Body

```json
{}
```

#### Response Success (200 OK)

```json
{
  "status": "success",
  "code": 200,
  "data": {
    "totalCount": 3,
    "records": [
      {
        "doctype": "UD_TEST",
        "businessUnit": "BU",
        "user": "user123",
        "date": "2022-11-30 10:30:00"
      },
      {
        "doctype": "UD_SPEC",
        "businessUnit": "BU",
        "user": "user456",
        "date": "2022-11-29 14:20:00"
      }
    ]
  },
  "message": "Success"
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景 | 处理方式 | Message 显示内容 |
| :------- | :------- | :--------------- |
| 接口调用超时或返回系统内部错误 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.` |
| 网络断开/连接失败 | 捕获 Network Error，提示用户检查网络连接 | `Network error. Please check your connection.` |
| 打印服务异常 | 记录系统日志，提示用户稍后重试 | `Print service error. Please try again later.` |
| 用户信息获取失败 | 记录系统日志，提示用户稍后重试 | `Failed to retrieve user information. Please try again later.` |

## 6. 实现注意事项 (Implementation Notes)

1. **状态管理**：
   - 使用 React State 管理 `documentList`（搜索结果列表）、`selectedRecord`（选中的记录）、`message`、`isLoading`。
   - `Message` 区域默认隐藏（内容为空时不予显示）。

2. **页面导航**：
   - **Select 按钮**：选中记录后点击，跳转回前页面（Market Document Settings 搜索画面），并将选中记录的数据通过路由参数或状态管理传递给前页面。
   - **Back 按钮**：直接调用路由回退操作（`history.back()` 或路由导航），返回前页面，不携带数据。
   - **Print 按钮**：调用 `window.print()` 或系统打印组件，输出当前页面内容。
   - **User 链接**：点击后跳转至 EDB User View 画面，需将 `REGISTER_USER` 参数传递至目标页面。

3. **数据回显机制**：
   - 点击 Select 按钮后，选中的记录数据（Document type、Bussines unit、User、Date）需通过路由参数、状态管理或本地存储传递至前页面。
   - 前页面在接收数据后，自动填充对应的搜索条件输入项。

4. **仅查询模式**：
   - 本页面仅从 `HDOC_DOCUMENT_LIST` 表读取数据，不提供任何新增、编辑、删除操作。
   - 所有数据均为只读展示。

5. **UI 细节**：
   - Select、Back、Print 按钮在 `isLoading` 期间应设为 `disabled` 状态，防止重复提交。
   - `Message` 文字颜色使用红色（`#ff4d4f`）以起到警示作用。
   - User 列以超链接样式（蓝色、下划线）呈现，提示用户可点击跳转。
   - 搜索结果列表支持单行选中，选中行应有高亮效果以指示当前选中状态。
   - 表格展示无数据时显示"无数据"提示信息。

6. **打印功能**：
   - 点击 Print 按钮时，调用 `window.print()` 方法或使用前端打印库。
   - 打印内容应仅包含搜索结果表格主体，排除按钮等操作区域。
   - 可通过 CSS `@media print` 样式控制打印区域的显示与隐藏。
