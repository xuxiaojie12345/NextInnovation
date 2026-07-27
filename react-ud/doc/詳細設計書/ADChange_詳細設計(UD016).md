# AD Change 详细设计说明书

| 文档编号     | DES-AD Change-016          | 版本号     | v1.0       |
| :----------- | :------------------------- | :--------- | :--------- |
| **模块名称** | AD Change                  | **作成日** | 2026-07-20 |
| **作成者**   | GitHub Copilot             | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块属于 UD HDoc & VBI(UDBI) 替换项目下的 AD Change 功能模块，核心功能是完成 Serie-Chnr 的追加、删除、校验操作，实现 AD 变更信息的获取与变更信息的持久化保存，保障 AD Change 相关业务操作正常执行。

- **目标**：提供完整的 Serie-Chnr 追加、删除、校验功能，所有业务操作的数据最终落地至 `HDOC_ADCA_CHANGE` 表，确保 AD Change 相关业务数据的一致性与合规性。
- **安全性**：
  - 仅执行授权范围内的 C（Create）、R（Read）、U（Update）操作。
  - ADD 操作需通过后端存在性校验（AFTER DEF CHANGE 激活状态检查），确保数据合法后方可写入。
- **用户体验**：
  - 所有输入控件默认为左对齐，操作按钮居中排列。
  - 所有控件初始状态均为激活可操作状态，无初始禁用项，降低用户操作门槛，提升交互流畅度。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| No. | 项目名 (Item)   | 种类 (Type) | 必须 (Req) | MaxLength | I/O    | 允许字符 (Allowed Chars) | 字符对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注 |
| :-: | :-------------- | :---------- | :--------: | :-------: | :----: | :----------------------- | :--------------: | :--------------: | :----------------: | :--- |
|  1  | **Serie-Chnr**  | TextField   |     Y      |    15     | Input  | -                        | 左 (Left)        | 空 (Empty)       | 活性 (Enabled)     | 无   |
|  2  | **Desc**        | TextField   |     -      |   4000    | Input  | -                        | 左 (Left)        | 空 (Empty)       | 活性 (Enabled)     | 无   |
|  3  | **ADD**         | Button      |     -      |     -     | Action | -                        | 中 (Center)      | -                | 活性 (Enabled)     | 无   |
|  4  | **DELETE**      | Button      |     -      |     -     | Action | -                        | 中 (Center)      | -                | 活性 (Enabled)     | 无   |
|  5  | **CHECK**       | Button      |     -      |     -     | Action | -                        | 中 (Center)      | -                | 活性 (Enabled)     | 无   |

> **注**：
>
> - Serie-Chnr 输入框最大长度为 15 字符。
> - Desc 输入框最大长度为 4000 字符。
> - 所有按钮默认为活性（Enabled）状态。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

所有校验逻辑均在用户点击对应操作按钮时按序执行。

### 3.1 处理流程

#### 3.1.1 初始表示

AD Change 页面加载时正常渲染所有控件，所有控件均处于激活可操作状态，输入框默认为空。

#### 3.1.2 ADD 操作：用户点击 ADD 按钮

1. **空值校验 (Frontend Check)**：
   - 若 Serie-Chnr 输入为空：
     - 设置 `Message` = `Serie-Chnr are required.`
     - **终止流程**。

2. **API 调用 (Backend Check)**：
   - 若前端校验通过，调用 `UD16InsertHdocAdcaChange` API，传入 Serie-Chnr 和 Desc。

3. **结果处理**：
   - **成功**：完成对应 Serie-Chnr 的新增操作，将数据持久化写入 `HDOC_ADCA_CHANGE` 表。
   - **失败（存在校验不通过）**：弹出提示 `Message` = `AFTER DEF CHANGE IS NOT ACTIVATED`，返回 Warning 级别提示，操作终止。

#### 3.1.3 DELETE 操作：用户点击 DELETE 按钮

1. **空值校验 (Frontend Check)**：
   - 若 Serie-Chnr 输入为空：
     - 设置 `Message` = `Serie-Chnr are required.`
     - **终止流程**。

2. **API 调用 (Backend Check)**：
   - 若前端校验通过，调用 `UD16UpdateHdocAdcaChange` API，传入 Serie-Chnr。

3. **结果处理**：
   - **成功**：更新 `HDOC_ADCA_CHANGE` 表中对应目标数据，完成删除标记操作。
   - **失败**：返回对应操作失败信息。

#### 3.1.4 CHECK 操作：用户点击 CHECK 按钮

1. **空值校验 (Frontend Check)**：
   - 若 Serie-Chnr 输入为空：
     - 设置 `Message` = `Serie-Chnr are required.`
     - **终止流程**。

2. **API 调用 (Backend Check)**：
   - 若前端校验通过，调用 `UD16SelectHdocAdcaChange` API，传入 Serie-Chnr。

3. **结果处理**：
   - **成功**：返回校验通过结果。
   - **失败**：返回对应校验不通过的提示信息。

### 3.2 校验详细规格表

| No. | 检查时机                               | 检查对象                         | 检查条件                                     | 错误消息 (Message Content)               | 动作                                                           | 错误级别 |
| :-: | :------------------------------------- | :------------------------------- | :------------------------------------------- | :--------------------------------------- | :------------------------------------------------------------- | :------- |
|  1  | 用户点击 ADD 按钮触发后端校验时        | Add 操作关联的 Serie-Chnr 数据   | 执行数据存在校验不通过，AFTER DEF CHANGE 未激活 | `AFTER DEF CHANGE IS NOT ACTIVATED`      | 系统返回 Warning 级别的提示消息，终止当前 ADD 操作流程         | Warning  |

## 4. 接口定义 (API Specification)

### 4.1 UD16InsertHdocAdcaChange — 新增 AD Change 数据 API

- **功能**：完成 Serie-Chnr 相关数据的新增操作，将 AD 变更新增数据写入 `HDOC_ADCA_CHANGE` 表。
- **Method**: `POST`
- **Endpoint**: `/api/ud016/UD16ADChangeApi/UD16InsertHdocAdcaChange`

#### Request Body

```json
{
  "serieChnr": "SAMPLE001",
  "desc": "测试新增描述"
}
```

#### Response Error (400 Bad Request)

```json
{
  "code": 400,
  "msg": "AFTER DEF CHANGE IS NOT ACTIVATED",
  "data": null
}
```

### 4.2 UD16UpdateHdocAdcaChange — 删除 AD Change 数据 API

- **功能**：根据传入的 Serie-Chnr 信息更新 `HDOC_ADCA_CHANGE` 表中对应的目标数据，完成删除标记操作。
- **Method**: `POST`
- **Endpoint**: `/api/ud016/UD16ADChangeApi/UD16UpdateHdocAdcaChange`

#### Request Body

```json
{
  "serieChnr": "SAMPLE-001"
}
```

#### Response Error (400 Bad Request)

```json
{
  "code": 400,
  "msg": "Target data does not exist.",
  "data": null
}
```

### 4.3 UD16SelectHdocAdcaChange — 校验 AD Change 数据 API

- **功能**：对传入的 Serie-Chnr 和 Desc 信息执行合法性校验，返回校验结果。
- **Method**: `POST`
- **Endpoint**: `/api/ud016/UD16ADChangeApi/UD16SelectHdocAdcaChange`

#### Request Body

```json
{
  "serieChnr": "SAMPLE-001"
}
```

#### Response Error (400 Bad Request)

```json
{
  "code": 400,
  "msg": "Target data does not exist.",
  "data": null
}
```

#### Response Error (500 Internal Server Error)

```json
{
  "code": 500,
  "msg": "Target data exists.",
  "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                     | 处理方式             | Message 显示内容                               |
| :--------------------------- | :------------------- | :--------------------------------------------- |
| 接口调用超时或返回系统内部错误 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.` |

## 6. 实现注意事项 (Implementation Notes)

1. **状态管理**：
   - 使用 React State 管理 `serieChnr`、`desc`、`message`、`isLoading`。
   - `Message` Label 默认隐藏（内容为空时不予显示）。

2. **输入限制**：
   - Serie-Chnr 输入框最大长度限制为 15 字符。
   - Desc 输入框最大长度限制为 4000 字符。

3. **安全性**：
   - ADD 操作需通过后端存在性校验，确保 `AFTER DEF CHANGE` 激活状态合法后方可写入 `HDOC_ADCA_CHANGE` 表。
   - 仅执行授权范围内的 C（Create）、R（Read）、U（Update）操作，不涉及 D（Delete）物理删除，DELETE 操作为逻辑删除标记。

4. **UI 细节**：
   - 所有操作按钮在 `isLoading` 期间应设为 `disabled` 状态，防止重复提交。
   - `Message` 文字颜色使用红色（`#ff4d4f`）以起到警示作用。
   - 所有输入控件左对齐，操作按钮居中排列。

5. **操作按钮分组**：
   - **ADD 按钮**：新增 Serie-Chnr 数据，需通过后端存在性校验。
   - **DELETE 按钮**：逻辑删除标记操作，更新 `HDOC_ADCA_CHANGE` 表对应数据。
   - **CHECK 按钮**：合法性校验操作，仅查询校验不修改数据。
