# Existing HDoc Variables 模块详细设计说明书

| 文档编号     | DES-Existing HDoc Variables-010 | 版本号     | v1.0       |
| :----------- | :------------------------------ | :--------- | :--------- |
| **模块名称** | Existing HDoc Variables         | **作成日** | 2026-07-15 |
| **作成者**   | GitHub Copilot                  | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块属于 UD HDoc & VBI(UDBI)替换项目 HDOC 业务域下的功能页面，承载用户自定义变量全生命周期管理能力，完整覆盖 `HDOC_VARIABLES` 表中 Variant 的新增、更新、删除、检索全流程操作，同时支持变量数据的 CSV 文件导出输出，支撑业务人员高效完成已有 HDoc 变量的配置与维护工作。

- **目标**：实现用户自定义变量的全生命周期管理，包括查询检索、新增注册、更新修改、删除移除及 CSV 导出功能，满足 Update user defined variables (rules) 业务需求。
- **安全性**：
  - 所有涉及 `HDOC_VARIABLES` 表的写操作，必须提前完成全量参数合法性校验，拦截非法数据写入数据库。
  - 所有变量变更操作的请求链路需关联操作人标识与操作时间，实现全流程操作可追溯。
  - 禁止无权限用户直接跳过前端校验调用后端操作接口。
- **用户体验**：
  - 页面控件布局贴合业务人员日常变量配置的操作习惯，所有输入控件默认左对齐便于内容浏览读取，操作按钮统一居中对齐降低操作寻找成本。
  - Clear 按钮支持一键清空所有已输入的内容，免去用户手动逐字段删除的重复操作。
  - 操作触发校验不通过时优先提示当前首个错误字段的具体问题，快速引导用户修正输入内容。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| No. | 项目名 (Item) | 种类 (Type) | 必须 (Req) | MaxLength | I/O | 允许文字 (Allowed Chars) | 文字对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注 |
| :-: | :------------ | :---------- | :--------: | :-------: | :-: | :----------------------- | :--------------: | :--------------: | :----------------: | :--- |
| 1 | **Variable** | TextField | Y | 30 | Input | 半角英数字+记号 | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 点击 Add/Update/Delete 按钮时，该项为必填项 |
| 2 | **Type** | Pull-downList | - | 20 | Input | 半角英数字+记号 | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 下拉选项固定显示：`VDA`、`User Defined` |
| 3 | **Description** | TextField | - | 100 | Input | 半角英数字+记号 | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 无特殊配置规则 |
| 4 | **Created by user** | TextField | - | 16 | Input | 半角英数字+记号 | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 无特殊配置规则 |
| 5 | **Date** | TextField | - | - | Input | 日期 | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 无特殊配置规则 |
| 6 | **Search** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 点击后跳转至 Existing HDoc Variables 搜索结果页面 |
| 7 | **Clear** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 点击后清空所有已输入的内容 |
| 8 | **Back** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 点击后跳转回原跳转来源页面 |
| 9 | **Add** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 点击后提交输入内容完成变量新增操作 |
| 10 | **Update** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 点击后提交输入内容完成变量更新操作 |
| 11 | **Delete** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 点击后删除对应的 Variant 记录 |
| 12 | **Excel** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 点击后输出 CSV 文件 |

> **注**：
>
> - **半角英数字+记号**：指半角英文字母（`a-z, A-Z`）、数字（`0-9`）及 ASCII 范围内的可见符号。
> - **Type（Pull-downList）**：下拉选项固定为 `VDA` 和 `User Defined` 两个值，不支持用户自定义输入。
> - **Date**：输入格式为 `YYYY-MM-DD`，如 `2022-11-24`。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

#### 3.1.1 初始表示

画面正常显示 Homologation Variables 页面的所有查询条件控件。Variable、Type、Description、Created by user、Date 输入控件初始为空，Search、Clear、Back、Add、Update、Delete、Excel 按钮均处于活性状态。

---

#### 3.1.2 操作一：点击 Search 按钮

**开始：用户点击 Search 按钮**

1. **空值校验 (Frontend Check)**：
   - 若 `Variable` 未输入内容：
     - 设置 `Message` = `Variable are required`
     - **终止流程**
2. **格式校验 (Frontend Check)**：
   - 若 `Variable` / `Type` / `Description` / `Created by user` 的输入内容不符合半角英数字+记号规则：
     - 设置 `Message` = `{对应字段} must be a half width English numeral/symbol`
     - **终止流程**
   - 若 `Date` 的输入内容不符合日期格式规则：
     - 设置 `Message` = `The date format of Date is incorrect`
     - **终止流程**
3. **API 调用 (Backend Check)**：
   - 调用 HDOC_VARIABLES 查询接口，根据页面提交的查询条件检索对应变量数据。
4. **结果处理**：
   - **成功**：跳转至 Homologation Variables 搜索结果页面，展示前页面提交的查询条件对应的检索结果。
   - **失败**：返回系统异常提示，停留在 Homologation Variables 初始页面。

---

#### 3.1.3 操作二：点击 Clear 按钮

**开始：用户点击 Clear 按钮**

1. **空值校验等 (Frontend Check)**：
   - 直接执行清空操作，无额外校验逻辑。
2. **API 调用 (Backend Check)**：
   - 无后端接口调用。
3. **结果处理**：
   - **成功**：所有输入控件的已填写内容全部清空，页面恢复为初始显示状态。
   - **失败**：无异常场景。

---

#### 3.1.4 操作三：点击 Back 按钮

**开始：用户点击 Back 按钮**

1. **空值校验等 (Frontend Check)**：
   - 直接执行跳转操作，无额外校验逻辑。
2. **API 调用 (Backend Check)**：
   - 无后端接口调用。
3. **结果处理**：
   - **成功**：页面跳转回之前的来源跳转页面。
   - **失败**：无异常场景。

---

#### 3.1.5 操作四：点击 Add 按钮

**开始：用户点击 Add 按钮**

1. **空值校验 (Frontend Check)**：
   - 若 `Variable` 未输入内容：
     - 设置 `Message` = `Variable are required`
     - **终止流程**
2. **格式校验 (Frontend Check)**：
   - 若 `Variable` / `Type` / `Description` / `Created by user` 的输入内容不符合半角英数字+记号规则：
     - 设置 `Message` = `{对应字段} must be a half width English numeral/symbol`
     - **终止流程**
   - 若 `Date` 的输入内容不符合日期格式规则：
     - 设置 `Message` = `The date format of Date is incorrect`
     - **终止流程**
3. **API 调用 (Backend Check)**：
   - 调用 `UD10HdocvariablesApi.UD10Add` 新增接口，校验待新增的 Variant 是否已存在于 `HDOC_VARIABLES` 表中。
4. **结果处理**：
   - **成功**：输入内容完成注册，新增的变量数据写入 `HDOC_VARIABLES` 表，返回操作成功提示。
   - **失败**：设置 `Message` = `Variant already exists. Please enter the correct content`，**终止新增流程**。

---

#### 3.1.6 操作五：点击 Update 按钮

**开始：用户点击 Update 按钮**

1. **空值校验 (Frontend Check)**：
   - 若 `Variable` 未输入内容：
     - 设置 `Message` = `Variable are required`
     - **终止流程**
2. **格式校验 (Frontend Check)**：
   - 若 `Variable` / `Type` / `Description` / `Created by user` 的输入内容不符合半角英数字+记号规则：
     - 设置 `Message` = `{对应字段} must be a half width English numeral/symbol`
     - **终止流程**
   - 若 `Date` 的输入内容不符合日期格式规则：
     - 设置 `Message` = `The date format of Date is incorrect`
     - **终止流程**
3. **API 调用 (Backend Check)**：
   - 调用 `UD10HdocvariablesApi.UD10Update` 更新接口，校验待更新的 Variant 是否存在于 `HDOC_VARIABLES` 表中。
4. **结果处理**：
   - **成功**：输入内容完成更新，`HDOC_VARIABLES` 表中对应 Variant 记录完成修改，返回操作成功提示。
   - **失败**：设置 `Message` = `Variant does not exists. Please enter the correct content`，**终止更新流程**。

---

#### 3.1.7 操作六：点击 Delete 按钮

**开始：用户点击 Delete 按钮**

1. **空值校验 (Frontend Check)**：
   - 若 `Variable` 未输入内容：
     - 设置 `Message` = `Variable are required`
     - **终止流程**
2. **格式校验 (Frontend Check)**：
   - 若 `Variable` 的输入内容不符合半角英数字+记号规则：
     - 设置 `Message` = `Variable must be a half width English numeral/symbol`
     - **终止流程**
3. **API 调用 (Backend Check)**：
   - 调用 `UD10HdocvariablesApi.UD10Delete` 删除接口，校验待删除的 Variant 是否存在于 `HDOC_VARIABLES` 表中。
4. **结果处理**：
   - **成功**：对应 Variant 的记录完成删除，`HDOC_VARIABLES` 表中对应数据被移除，返回操作成功提示。
   - **失败**：设置 `Message` = `Variant does not exists. Please enter the correct content`，**终止删除流程**。

---

#### 3.1.8 操作七：点击 Excel 按钮

**开始：用户点击 Excel 按钮**

1. **空值校验等 (Frontend Check)**：
   - 直接执行导出操作，无额外校验逻辑。
2. **API 调用 (Backend Check)**：
   - 调用 HDOC_VARIABLES 导出接口，生成当前查询条件对应的全量变量 CSV 文件。
3. **结果处理**：
   - **成功**：CSV 文件完成生成，触发浏览器文件下载。
   - **失败**：返回导出异常提示，停留在当前页面。

### 3.2 校验详细规格表

| No. | 检查时机 | 检查对象 | 检查条件 | 错误消息 (Message Content) | 动作 |
| :-: | :------- | :------- | :------- | :------------------------- | :--- |
| 1 | 点击 Search/Add/Update/Delete 按钮 | Variable | Variable 为空未输入内容 | `Variable are required` | 弹出错误提示，终止当前操作流程 |
| 2 | 点击 Search/Add/Update 按钮 | Variable / Type / Description / Created by user | 对应字段输入内容不符合半角英数字+记号规则 | `{对应字段} must be a half width English numeral/symbol` | 弹出错误提示，终止当前操作流程 |
| 3 | 点击 Search/Add/Update 按钮 | Date | Date 输入内容不符合日期格式要求 | `The date format of Date is incorrect` | 弹出错误提示，终止当前操作流程 |
| 4 | Add 操作后端执行阶段 | Variant | 待新增的 Variant 已经存在于 `HDOC_VARIABLES` 表中 | `Variant already exists. Please enter the correct content` | 弹出错误提示，终止新增流程 |
| 5 | Update/Delete 操作后端执行阶段 | Variant | 待更新/待删除的 Variant 不存在于 `HDOC_VARIABLES` 表中 | `Variant does not exists. Please enter the correct content` | 弹出错误提示，终止当前操作流程 |

## 4. 接口定义 (API Specification)

### 4.1 UD10HdocvariablesApi.UD10Add

- **功能**：将页面提交的变量信息写入 `HDOC_VARIABLES` 表，完成 Variant 的新增操作。
- **Method**: `POST`
- **Endpoint**: `/api/ud010/UD10HdocvariablesApi/UD10Add`

#### Request Body

```json
{
  "variable": "001",
  "type": "User Defined",
  "description": "description",
  "createdByUser": "UD001",
  "date": "2022-11-24"
}
```

##### 请求参数字段说明

| 字段名 | 类型 | 必须 | 说明 |
| :----- | :--- | :--: | :--- |
| `variable` | string | Y | Variant 标识，最大 30 字符，半角英数字+记号 |
| `type` | string | - | 类型值（`VDA` / `User Defined`），最大 20 字符 |
| `description` | string | - | 变量描述，最大 100 字符 |
| `createdByUser` | string | - | 创建人标识，最大 16 字符 |
| `date` | string | - | 日期，格式 `YYYY-MM-DD` |

#### Response Success (200 OK)

```json
{
  "code": 200,
  "msg": null,
  "data": null
}
```

#### Response Error (500 Internal Server Error)

```json
{
  "code": 500,
  "msg": "Variant already exists. Please enter the correct content",
  "data": null
}
```

---

### 4.2 UD10HdocvariablesApi.UD10Update

- **功能**：根据提交的 Variable 匹配 `HDOC_VARIABLES` 表中的对应记录，完成变量信息的更新操作。
- **Method**: `POST`
- **Endpoint**: `/api/ud010/UD10HdocvariablesApi/UD10Update`

#### Request Body

```json
{
  "variable": "001",
  "type": "User Defined",
  "description": "description",
  "createdByUser": "UD001",
  "date": "2022-11-24"
}
```

##### 请求参数字段说明

| 字段名 | 类型 | 必须 | 说明 |
| :----- | :--- | :--: | :--- |
| `variable` | string | Y | Variant 标识，用于定位待更新的记录 |
| `type` | string | - | 类型值 |
| `description` | string | - | 变量描述 |
| `createdByUser` | string | - | 创建人标识 |
| `date` | string | - | 日期，格式 `YYYY-MM-DD` |

#### Response Success (200 OK)

```json
{
  "code": 200,
  "msg": null,
  "data": null
}
```

#### Response Error (500 Internal Server Error)

```json
{
  "code": 500,
  "msg": "Variant does not exists. Please enter the correct content",
  "data": null
}
```

---

### 4.3 UD10HdocvariablesApi.UD10Delete

- **功能**：根据提交的 Variable，删除 `HDOC_VARIABLES` 表中对应的 Variant 记录。
- **Method**: `POST`
- **Endpoint**: `/api/ud010/UD10HdocvariablesApi/UD10Delete`

#### Request Body

```json
{
  "variable": "001"
}
```

##### 请求参数字段说明

| 字段名 | 类型 | 必须 | 说明 |
| :----- | :--- | :--: | :--- |
| `variable` | string | Y | 待删除的 Variant 标识 |

#### Response Success (200 OK)

```json
{
  "code": 200,
  "msg": null,
  "data": null
}
```

#### Response Error (500 Internal Server Error)

```json
{
  "code": 500,
  "msg": "Variant does not exists. Please enter the correct content",
  "data": null
}
```

---

### 4.4 UD10HdocvariablesApi.UD10Search

- **功能**：根据页面提交的查询条件，从 `HDOC_VARIABLES` 表中检索对应的变量数据。
- **Method**: `POST`
- **Endpoint**: `/api/ud010/UD10HdocvariablesApi/UD10Search`

#### Request Body

```json
{
  "variable": "001",
  "type": "User",
  "description": "description",
  "createdByUser": "UD001",
  "date": "2022-11-24"
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "msg": null,
  "data": [
    {
      "variable": "001",
      "type": "User",
      "description": "description",
      "createdByUser": "UD001",
      "date": "2022-11-24"
    }
  ]
}
```

#### Response Error (500 Internal Server Error)

```json
{
  "code": 500,
  "msg": "System error. Please contact administrator.",
  "data": null
}
```

---

### 4.5 UD10HdocvariablesApi.UD10Export

- **功能**：生成当前查询条件对应的全量变量 CSV 文件并返回下载链接。
- **Method**: `POST`
- **Endpoint**: `/api/ud010/UD10HdocvariablesApi/UD10Export`

#### Request Body

```json
{
  "variable": "001",
  "type": "User",
  "description": "description",
  "createdByUser": "UD001",
  "date": "2022-11-24"
}
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "msg": null,
  "data": {
    "fileUrl": "/api/ud010/export/hdoc_variables_20260715.csv"
  }
}
```

#### Response Error (500 Internal Server Error)

```json
{
  "code": 500,
  "msg": "System error. Please contact administrator.",
  "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景 | 处理方式 | Message 显示内容 |
| :------- | :------- | :--------------- |
| 接口调用超时或返回系统内部错误 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.` |
| 新增操作时 Variant 已存在 | 返回冲突提示，终止新增流程 | `Variant already exists. Please enter the correct content` |
| 更新/删除操作时 Variant 不存在 | 返回错误提示，终止当前操作流程 | `Variant does not exists. Please enter the correct content` |
| CSV 导出失败 | 返回导出异常提示，停留在当前页面 | `System error. Please contact administrator.` |

## 6. 实现注意事项 (Implementation Notes)

1. **状态管理**：
   - 使用 React State 管理 `variable`、`type`、`description`、`createdByUser`、`date`、`message`、`isLoading`。
   - `message` 在无错误时默认隐藏（内容为空时不予显示）。

2. **输入限制**：
   - **Variable**：最大长度 30 字符，通过正则 `^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$` 控制仅允许半角英数字+记号输入。
   - **Type**：固定下拉选项 `VDA` / `User Defined`，不允许自由输入。
   - **Description**：最大长度 100 字符，允许半角英数字+记号。
   - **Created by user**：最大长度 16 字符，允许半角英数字+记号。
   - **Date**：格式校验 `YYYY-MM-DD`，如 `2022-11-24`。

3. **按钮操作**：
   - 所有操作按钮在 `isLoading` 期间应设为 `disabled` 状态，防止重复提交。
   - **Search**：校验通过后跳转至搜索结果页面。
   - **Clear**：点击后重置所有输入控件的状态为初始空值。
   - **Back**：点击后通过路由导航返回上一来源页面。
   - **Add**：前端校验 + 后端唯一性校验，通过后写入 `HDOC_VARIABLES` 表。
   - **Update**：前端校验 + 后端存在性校验，通过后更新 `HDOC_VARIABLES` 表对应记录。
   - **Delete**：前端校验 + 后端存在性校验，通过后删除 `HDOC_VARIABLES` 表对应记录。
   - **Excel**：点击后调用导出接口，触发浏览器 CSV 文件下载。

4. **错误提示**：
   - 优先提示当前首个错误字段的具体问题，引导用户快速修正。
   - `Message` 文字颜色使用红色（`#ff4d4f`）以起到警示作用。

5. **操作可追溯性**：
   - 所有新增、更新、删除操作需关联当前登录用户标识与操作时间戳。
   - 建议在请求中附加 `userId` 和 `timestamp` 字段，或在后端统一拦截处理。
