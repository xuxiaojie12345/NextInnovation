# Save Modifications 模块 (Save Modifications Module) 详细设计说明书

| 文档编号     | DES-Save Modifications-006 | 版本号     | v1.0       |
| :----------- | :------------------------- | :--------- | :--------- |
| **模块名称** | Save Modifications         | **作成日** | 2026-07-13 |
| **作成者**   | GitHub Copilot             | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块是 Save Modifications 功能模块，核心目标是向用户呈现对应的业务修改详情，支持用户查看相关变更信息后关闭页面，完成本次修改确认查看的操作流程。

- **目标**：向用户清晰展示指定底盘（Chassis）相关的全部修改信息，确保用户能够完整查阅所有变更内容后关闭页面。
- **安全性**：当前无额外特殊安全约束，所有展示数据需从指定数据源准确获取，保证展示的修改信息与业务系统存储的 Modify 信息完全一致，避免出现信息偏差。
- **用户体验**：
  - 所有展示文本按指定规则对齐布局，保证页面内容排版整齐易读。
  - 页面加载完成后「Close」按钮保持活性状态，用户可以随时点击触发页面关闭，操作路径简洁无多余步骤。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| No. | 项目名 (Item) | 种类 (Type) | 必须 (Req) | MaxLength | I/O | 允许字符 (Allowed Chars) | 字符对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注 |
| :-: | :------------ | :---------- | :--------: | :-------: | :-: | :----------------------- | :--------------: | :--------------: | :----------------: | :--- |
|  1  | **Chassis serie** | Label | - | - | Output | - | 左 (Left) | - | 显示 (Visible) | 获取 `chassisSeries-chassisNo` 中「-」之前的内容 |
|  2  | **Chassis number** | Label | - | - | Output | - | 左 (Left) | - | 显示 (Visible) | 获取 `chassisSeries-chassisNo` 中「-」之后的内容 |
|  3  | **Doctype** | Label | - | - | Output | - | 左 (Left) | - | 显示 (Visible) | 数据源为 `HDOC_ADCA_MODIFICATION` 表的 `DOCTYPE` 字段 |
|  4  | **Version** | Label | - | - | Output | - | 左 (Left) | - | 显示 (Visible) | 数据源为 `HDOC_ADCA_MODIFICATION` 表的 `VERS` 字段 |
|  5  | **Storing** | Label | - | - | Output | - | 左 (Left) | - | 显示 (Visible) | 数据源为 `HDOC_ADCA_MODIFICATION` 表的 `VARIABLE`/`NEWVAL` 字段 |
|  6  | **FOUND UNRELEASED VERSION** | Label | - | - | Output | - | 左 (Left) | - | 显示 (Visible) | 数据源为 `HDOC_ADCA_MODIFICATION` 表的 `VERS` 字段 |
|  7  | **Message** | Label | - | - | Output | - | 左 (Left) | `VERSION IS RELEASED` | 动态显示 | 对应预设提示内容 |
|  8  | **Close** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 触发页面关闭操作 |

> **注**：
> - **Chassis serie** 与 **Chassis number** 通过解析传入的 `chassisSeries-chassisNo` 组合值获得，以「-」为分隔符分割。
> - **Storing** 展示内容为 `VARIABLE` 与 `NEWVAL` 的组合信息。
> - **Message** 初始值为 `VERSION IS RELEASED`，在出现异常时替换为对应的错误提示内容。
> - **Close** 按钮始终保持活性状态，用户可随时点击关闭页面。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

#### 3.1.1 初始表示

页面启动后从指定数据源拉取对应的修改内容数据，完整加载所有画面控件，保证 Save Modifications 画面正常展示，完成所有修正内容的渲染显示。

1. **页面加载**：获取页面传入参数 `chassisSeries` 和 `chassisNo`。
2. **API 调用**：调用 `getSaveModificationsInfo` 接口，从 `HDOC_ADCA_MODIFICATION` 表中获取 Modify 相关信息。
3. **数据渲染**：
   - 解析返回数据，将各字段映射至对应控件。
   - **Chassis serie**：从 `chassisSeries` 参数获取。
   - **Chassis number**：从 `chassisNo` 参数获取。
   - **Doctype**：从 `data.doctype` 获取。
   - **Version**：从 `data.vers` 获取。
   - **Storing**：从 `data.storing.variable` 和 `data.storing.newval` 组合展示。
   - **FOUND UNRELEASED VERSION**：从 `data.versiono` 获取。
   - **Message**：默认为 `VERSION IS RELEASED`。
4. **等待用户操作**：页面处于查看状态，等待用户点击 **Close** 按钮。

#### 3.1.2 触发条件：用户点击 Close 按钮

1. **开始**：用户点击 **Close** 按钮。
2. **关闭操作**：触发页面关闭流程，关闭当前页面或返回上一级页面。
3. **终止**：操作完成，流程结束。

### 3.2 校验详细规格表

本页面无额外空值类前端校验，所有展示字段均从指定数据源前置获取完成后渲染输出。

| No. | 检查时机 | 检查对象 | 检查条件 | 错误消息 (Message Content) | 动作 |
| :-: | :------- | :------- | :------- | :------------------------- | :--- |
| -   | -        | -        | -        | -                          | -    |

> **注**：当前版本无前端校验逻辑，后续如有校验需求可在此表追加。

## 4. 接口定义 (API Specification)

### 4.1 getSaveModificationsInfo

- **功能**：从 `HDOC_ADCA_MODIFICATION` 表中查询获取 Modify 相关的全部修改信息，为 Save Modifications 页面提供展示数据源。
- **Method**: `GET`
- **Endpoint**: `/api/hdoc/UD06SaveModificationsApi/UD06SelectHdocAdcaModification`

#### Request Body

```json
{
  "chassisSeries": "string",
  "chassisNo": "string"
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
  "code": "200",
  "msg": null,
  "data": {
    "chassisSerie": "JPCT",
    "chassisNumber": "028321",
    "doctype": "DIM-PLATE",
    "vers": "1",
    "storing": {
      "variable": "SEAT_1",
      "newval": "SEAT_2"
    },
    "versiono": "1"
  }
}
```

#### Response Error (500 Internal Server Error)

```json
{
  "code": "500",
  "msg": "System error. Please contact administrator.",
  "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景 | 处理方式 | Message 显示内容 |
| :------- | :------- | :--------------- |
| 查询接口调用超时或返回系统内部错误 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.` |

## 6. 实现注意事项 (Implementation Notes)

1. **状态管理**：
   - 使用 React State 管理 `chassisSerie`、`chassisNumber`、`doctype`、`vers`、`storing`、`versiono`、`message`、`isLoading`。
   - `Message` Label 初始值为 `VERSION IS RELEASED`，异常时替换为错误提示内容。

2. **参数获取**：
   - **Chassis serie** 与 **Chassis number** 通过页面传入参数直接获取，无需解析操作。
   - 如传入参数为组合格式（如 `JPCT-028321`），需以「-」为分隔符分割后分别赋值。

3. **数据映射**：
   - 所有展示字段严格对应 API 返回的 `data` 对象字段。
   - **Storing** 展示时建议以 `variable → newval` 格式呈现（如 `SEAT_1 → SEAT_2`），便于用户直观理解变更内容。

4. **UI 细节**：
   - **Close** 按钮始终保持活性（Enabled）状态，不因数据加载状态而禁用。
   - 页面加载期间可显示 Loading 状态提示，加载完成后渲染全部数据。
   - 所有 Label 采用左对齐布局，Button 采用居中对齐。
   - **Message** 文字颜色建议使用红色（`#ff4d4f`）以起到警示作用；正常状态为 `VERSION IS RELEASED` 时使用默认颜色。

5. **异常场景处理**：
   - 当 API 返回错误或网络异常时，除展示错误消息外，页面基础控件（标题、Close 按钮等）应正常保留展示。
   - 数据加载异常时，各数据字段控件可展示为空或占位符 `-`。

6. **页面关闭**：
   - 点击 **Close** 按钮后，执行页面关闭操作（如关闭当前标签页、返回上一级页面或触发路由回退）。
   - 具体关闭方式需根据系统整体导航方案确定。
