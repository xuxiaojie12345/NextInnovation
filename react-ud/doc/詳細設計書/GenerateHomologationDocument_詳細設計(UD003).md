# Generate Homologation Document 模块详细设计说明书

| 文档编号     | DES-Generate Homologation Document-003 | 版本号     | v1.0       |
| :----------- | :------------------------------------- | :--------- | :--------- |
| **模块名称** | Generate Homologation Document         | **作成日** | 2026-07-10 |
| **作成者**   | GitHub Copilot                         | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块为 Generate Homologation Document对应功能页面，核心功能是支持用户录入车辆相关查询条件，点击提交后进入 Generate document 页面，最终实现 Homologation Document 的自动生成能力。

- **目标**：支持用户录入车辆查询条件，配套提供条件重置、帮助页面跳转的辅助操作，实现 Homologation Document 的自动生成。
- **安全性**：无额外特殊安全要求，所有输入字段需完成前后端双重校验，避免非法字符传入后台影响业务数据准确性。
- **用户体验**：
  - 页面初始化时自动回显用户上一次提交的查询条件，减少用户重复录入操作。
  - 校验不通过时实时返回明确的错误提示信息，引导用户快速修正输入内容。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| No. | 项目名 (Item) | 种类 (Type) | 必须 (Req) | MaxLength | I/O | 允许字符 (Allowed Chars) | 文字对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注 |
| :-: | :------------ | :---------- | :--------: | :-------: | :-: | :----------------------- | :--------------: | :--------------: | :----------------: | :--- |
| 1 | **Chassis series** | TextField | Y | 5 | Input | 半角英字 (`a-z, A-Z`) | 左 (Left) | 空（自动回显上一次的指定条件） | 活性 (Enabled) | 自动默认显示上次指定的查询条件 |
| 2 | **Chassis no** | TextField | Y | 10 | Input | 半角数字 (`0-9`) | 左 (Left) | 空（自动回显上一次的指定条件） | 活性 (Enabled) | 自动默认显示上次指定的查询条件 |
| 3 | **Document type** | Pull-down List | Y | - | Input | 半角英数字+符号 | 左 (Left) | 空（自动回显上一次的指定条件） | 活性 (Enabled) | 下拉选项从 `HDOC_DOCUMENT_LIST` 表的 `DOCTYPE` 字段获取，自动默认显示上次指定的查询条件 |
| 4 | **Submit** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 点击后进入 Generate document 页面 |
| 5 | **Reset** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 点击后将页面恢复为初始化显示状态 |
| 6 | **HDoc Help** | Button | - | - | Action | - | 中 (Center) | - | 活性 (Enabled) | 点击后跳转至 HDoc Help 页面 |
| 7 | **Support Mail** | Label | - | - | Output | - | 左 (Left) | - | - | 内容确认中预留 |
| 8 | **error message area** | Label | - | - | Output | - | 左 (Left) | - | - | 用于页面各类错误提示信息的展示区域 |

> **注**：
>
> - **半角英字**：正则表达式 `[a-zA-Z]`
> - **半角数字**：正则表达式 `[0-9]`
> - **半角英数字+符号**：正则表达式 `[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]`

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

#### 3.1.1 初始化显示

正常加载 Generate Homologation Document 页面，自动将用户上一次使用的查询条件回显到对应输入项中（Chassis series、Chassis no、Document type），完整展示所有页面控件。

#### 3.1.2 提交操作：[用户点击 Submit 按钮触发]

**前端校验（按顺序执行，一旦命中错误即终止后续校验并提示）：**

1. **Chassis series 校验**：
   - **必填检查**：若输入内容为空：
     - 设置 `Message` = `Chassis series are required.`
     - **终止流程**
   - **长度检查**：若输入内容长度不等于 1-5 位：
     - 设置 `Message` = `Chassis series must be 1-5 alphabetic characters.`
     - **终止流程**
   - **字符检查**：若输入内容包含非半角英字的字符：
     - 设置 `Message` = `Chassis series must be 1-5 alphabetic characters.`
     - **终止流程**

2. **Chassis no 校验**：
   - **必填检查**：若输入内容为空：
     - 设置 `Message` = `Chassis no are required.`
     - **终止流程**
   - **长度检查**：若输入内容长度不等于 1-10 位：
     - 设置 `Message` = `Chassis no must be 1-10 numeric digits.`
     - **终止流程**
   - **字符检查**：若输入内容包含非半角数字的字符：
     - 设置 `Message` = `Chassis no must be 1-10 numeric digits.`
     - **终止流程**

3. **Document type 校验**：
   - **必填检查**：若未选择任意下拉选项：
     - 设置 `Message` = `Document type are required`
     - **终止流程**

#### 3.1.3 API 调用 (Backend Check)

调用 `IsExistsChassisApi` 接口，传入当前页面的Chassis no参数。

#### 3.1.4 结果处理

- **成功**：跳转至 VIN Plate 创建结果页面，展示对应 Chassis 的 VIN Plate 创建结果。
- **失败**：页面 `error message area` 位置显示 `Chassis no is not exists`，**终止生成流程**。

#### 3.1.5 重置操作：[用户点击 Reset 按钮触发]

清空所有输入项的已录入内容，将页面恢复为初始化显示状态。

#### 3.1.6 帮助跳转操作：[用户点击 Help 按钮触发]

直接跳转加载 HDoc Help 页面。

### 3.2 校验详细规格表

| No. | 检查时机 | 检查对象 | 检查分类 | 检查条件 | 错误消息 (Message Content) | 动作 |
| :-: | :------- | :------- | :------- | :------- | :------------------------- | :--- |
| 1 | 点击 Submit 按钮触发前端校验 | Chassis series | 必填检查 | 输入内容为空 | `Chassis series are required.` | 聚焦到 Chassis series 输入框，在 error message area 显示提示，不发起后台请求 |
| 2 | 点击 Submit 按钮触发前端校验 | Chassis series | 长度检查 | 输入内容长度 != 1-5 位 | `Chassis series must be 1-5 alphabetic characters.` | 聚焦到 Chassis series 输入框，在 error message area 显示提示，不发起后台请求 |
| 3 | 点击 Submit 按钮触发前端校验 | Chassis series | 字符检查 | 输入内容包含非半角英字 | `Chassis series must be 1-5 alphabetic characters.` | 聚焦到 Chassis series 输入框，在 error message area 显示提示，不发起后台请求 |
| 4 | 点击 Submit 按钮触发前端校验 | Chassis no | 必填检查 | 输入内容为空 | `Chassis no are required.` | 聚焦到 Chassis no 输入框，在 error message area 显示提示，不发起后台请求 |
| 5 | 点击 Submit 按钮触发前端校验 | Chassis no | 长度检查 | 输入内容长度 != 1-10 位 | `Chassis no must be 1-10 numeric digits.` | 聚焦到 Chassis no 输入框，在 error message area 显示提示，不发起后台请求 |
| 6 | 点击 Submit 按钮触发前端校验 | Chassis no | 字符检查 | 输入内容包含非半角数字 | `Chassis no must be 1-10 numeric digits.` | 聚焦到 Chassis no 输入框，在 error message area 显示提示，不发起后台请求 |
| 7 | 点击 Submit 按钮触发前端校验 | Document type | 必填检查 | 未选择任何下拉选项 | `Document type are required` | 聚焦到 Document type 下拉控件，在 error message area 显示提示，不发起后台请求 |
| 8 | 点击 Submit 按钮触发后台校验 | 所有查询条件 | 存在性检查 | 查询后没有匹配的对应结果 | `Chassis no is not exists` | 在 error message area 显示提示，不跳转生成结果页面 |

## 4. 接口定义 (API Specification)

### 4.1 UD03SelectHdocdocumentlistApi

- **功能**：获取所有可用的文档类型列表，用于填充 Document type 下拉框。数据来源于 `HDOC_DOCUMENT_LIST` 表。
- **Method**: `GET`
- **Endpoint**: `/api/ud03/UD03SelectHdocdocumentlistApi`

#### 请求示例

```
GET /api/ud03/UD03SelectHdocdocumentlistApi
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "msg": null,
  "data": {
    "documentTypes": [
      {
        "code": "VIN_CERT",
        "description": "VIN Plate Certificate"
      },
      {
        "code": "HOMOLOG",
        "description": "Homologation Document"
      },
      {
        "code": "CONFORM",
        "description": "Certificate of Conformity"
      }
    ]
  }
}
```

> **注**：
>
> - `code` 对应物理表中的 `DOCTYPE` 字段（主键，VARCHAR2(20)）
> - `description` 对应物理表中的 `DESCRIPTION` 字段（VARCHAR2(500)）
> - 前端下拉框显示 `description`，提交时使用 `code` 值

## 5. 异常处理 (Exception Handling)

| 异常场景 | 处理方式 | Message 显示内容 |
| :------- | :------- | :--------------- |
| 后台接口调用超时或返回系统内部错误 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.` |

## 6. 实现注意事项 (Implementation Notes)

1. **状态管理**：
   - 使用 React State 管理 `chassisSeries`、`chassisNo`、`documentType`、`documentTypeList`（下拉选项列表）、`errorMessage`、`isLoading`。
   - `error message area` 默认隐藏（内容为空时不予显示）。
   - `Support Mail` Label 固定显示内容确认中。

2. **输入限制**：
   - **Chassis series**：通过正则 `/^[a-zA-Z]*$/` 控制仅允许半角英字输入，最大长度 5 字符。
   - **Chassis no**：通过正则 `/^[0-9]*$/` 控制仅允许半角数字输入，最大长度 10 字符。

3. **初始化回显**：
   - 页面加载时需从本地存储（localStorage 或 sessionStorage）或后端接口获取用户上一次提交的查询条件，自动回显到对应输入项中。

4. **下拉数据加载**：
   - 页面初始化时调用 `SelectHdocdocumentlistApi` 获取文档类型列表，填充 Document type 下拉框。
   - 下拉框显示 `description`，提交时使用 `code` 值。

5. **UI 细节**：
   - Submit 按钮在 `isLoading` 期间应设为 `disabled` 状态，防止重复提交。
   - `error message area` 文字颜色建议使用红色（`#ff4d4f`）以起到警示作用。
   - Reset 按钮点击后清空所有输入项，将页面恢复为初始化显示状态。
   - Help 按钮点击后直接跳转至 HDoc Help 页面。
