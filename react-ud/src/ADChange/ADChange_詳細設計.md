# AD变更模块 (AD Change Module) 详细设计说明书

| 文档编号     | DES-AD-CHANGE-UD16        | 版本号     | v1.0       |
| :----------- | :------------------------ | :--------- | :--------- |
| **模块名称** | AD Change                 | **作成日** | 2022-11-21 |
| **作成者**   | UD 刘                     | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于进行Serie-Chnr（系列-底盘号）的追加、删除和检查操作。管理员可以输入Serie-Chnr和描述信息，执行ADD、DELETE或CHECK操作，管理ADCA变更表中的记录。

- **目标**：提供简洁的AD变更管理界面，支持记录的增删查操作。
- **安全性**：ADD操作需校验记录是否已激活；所有操作基于HDOC_ADCA_CHANGE表进行CRUD操作。
- **用户体验**：采用简单的表单形式，包含Serie-Chnr和Desc两个输入字段，以及三个操作按钮。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item)      | 種別 (Type)    | 必須 (Req) | MaxLength |   I/O    | 許容文字 (Allowed Chars)      | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                                               |
| :----------------- | :------------- | :--------: | :-------: | :------: | :---------------------------- | :--------------: | :--------------: | :----------------: | :------------------------------------------------- |
| **Serie-Chnr**     | TextField      |     -      |    15     | Input    | -                             |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 输入系列-底盘号                                    |
| **Desc**           | TextField      |     -      |   4000    | Input    | -                             |    左 (Left)     |    空 (Empty)    |   活性 (Enabled)   | 输入描述信息                                       |
| **ADD**            | Button         |     -      |     -     | Action   | -                             |   中 (Center)    |        -         |   活性 (Enabled)   | 追加记录                                           |
| **DELETE**         | Button         |     -      |     -     | Action   | -                             |   中 (Center)    |        -         |   活性 (Enabled)   | 删除记录                                           |
| **CHECK**          | Button         |     -      |     -     | Action   | -                             |   中 (Center)    |        -         |   活性 (Enabled)   | 检查记录状态                                       |

> **注**：
> - **Serie-Chnr格式**：建议格式为"系列号-底盘号"，例如"ABC-123456"
> - **Desc字段**：支持多行文本输入，最大长度4000字符

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

所有校验逻辑均在用户执行操作时同步或异步执行。

### 3.1 处理流程  

#### 3.1.1 ADD操作流程

1.  **开始**：用户输入Serie-Chnr和Desc后点击 ADD 按钮。
2.  **前置处理**：获取Serie-Chnr和Desc字段的值。
3.  **API 调用 (Backend Check)**：
    - 调用 `AddADChangeApi(serieChnr, desc)` 执行插入操作。
4.  **结果处理**：
    - **成功**：清空表单，显示成功消息。
    - **失败**：
      - 若记录未激活：显示 `AFTER DEF CHANGE IS NOT ACTIVATED`
      - Message级别 = Warning
      - 若其他错误：显示具体错误消息。

#### 3.1.2 DELETE操作流程

1.  **开始**：用户输入Serie-Chnr后点击 DELETE 按钮。
2.  **前置处理**：获取Serie-Chnr字段的值。
3.  **必填校验 (Frontend Check)**：
    - 若 `Serie-Chnr` 为空：
      - 设置 Message = `Serie-Chnr is required for delete operation.`
      - **终止**流程。
4.  **API 调用 (Backend Check)**：
    - 调用 `DeleteADChangeApi(serieChnr)` 执行删除操作。
5.  **结果处理**：
    - **成功**：清空表单，显示成功消息。
    - **失败**：
      - 若记录不存在：显示 `Record does not exist.`
      - 若其他错误：显示具体错误消息。

#### 3.1.3 CHECK操作流程

1.  **开始**：用户输入Serie-Chnr后点击 CHECK 按钮。
2.  **前置处理**：获取Serie-Chnr字段的值。
3.  **必填校验 (Frontend Check)**：
    - 若 `Serie-Chnr` 为空：
      - 设置 Message = `Serie-Chnr is required for check operation.`
      - **终止**流程。
4.  **API 调用 (Backend Check)**：
    - 调用 `CheckADChangeApi(serieChnr)` 查询记录状态。
5.  **结果处理**：
    - **成功**：显示记录详细信息（包括激活状态）。
    - **失败**：
      - 若记录不存在：显示 `Record does not exist.`
      - 若其他错误：显示具体错误消息。

### 3.2 校验详细规格表

| No. |   检查时机   |       检查对象       |                  检查条件                   |                          错误消息 (Message Content)                           |    错误级别    |                 动作                 |
| :-: | :----------: | :------------------: | :-----------------------------------------: | :---------------------------------------------------------------------------: | :------------: | :----------------------------------: |
|  1  | ADD操作      | 记录激活状态         | 记录未激活                                  |                     `AFTER DEF CHANGE IS NOT ACTIVATED`                     |    Warning     | 显示警告消息，终止操作 |
|  2  | DELETE操作   | Serie-Chnr           | 值为空                                      |                     `Serie-Chnr is required for delete operation.`                     |     Error      | 显示错误消息，终止操作 |
|  3  | CHECK操作    | Serie-Chnr           | 值为空                                      |                     `Serie-Chnr is required for check operation.`                     |     Error      | 显示错误消息，终止操作 |
|  4  | DELETE操作   | 记录存在性           | 记录不存在                                  |                     `Record does not exist.`                     |     Error      | 显示错误消息，终止操作 |
|  5  | CHECK操作    | 记录存在性           | 记录不存在                                  |                     `Record does not exist.`                     |     Error      | 显示错误消息，终止操作 |

## 4. 接口定义 (API Specification)

### 4.1 AddADChangeApi

- **功能**：新增AD变更记录。
- **Method**: `POST`
- **Endpoint**: `/api/ud16/addadchange`

#### Request Body

```json
{
  "serieChnr": "ABC-123456",
  "desc": "This is a test description for AD change."
}
```

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "AD change record added successfully",
  "data": null
}
```

#### Response Error (400 Bad Request)

```json
{
  "success": false,
  "message": "AFTER DEF CHANGE IS NOT ACTIVATED",
  "data": null
}
```

### 4.2 DeleteADChangeApi

- **功能**：删除AD变更记录。
- **Method**: `DELETE`
- **Endpoint**: `/api/ud16/deleteadchange`

#### Request Body

```json
{
  "serieChnr": "ABC-123456"
}
```

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "AD change record deleted successfully",
  "data": null
}
```

#### Response Error (400 Bad Request)

```json
{
  "success": false,
  "message": "Record does not exist.",
  "data": null
}
```

### 4.3 CheckADChangeApi

- **功能**：检查AD变更记录状态。
- **Method**: `GET`
- **Endpoint**: `/api/ud16/checkadchange`

#### Request Params

```json
{
  "serieChnr": "ABC-123456"
}
```

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "获取记录成功",
  "data": {
    "serieChnr": "ABC-123456",
    "desc": "This is a test description for AD change.",
    "isActive": true,
    "createdDate": "2022-11-21",
    "createdBy": "user001"
  }
}
```

#### Response Error (400 Bad Request)

```json
{
  "success": false,
  "message": "Record does not exist.",
  "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **记录未激活**           | API返回400错误     | `AFTER DEF CHANGE IS NOT ACTIVATED`            |
| **Serie-Chnr为空**       | 前端校验拦截       | `Serie-Chnr is required for delete/check operation.` |
| **记录不存在**           | API返回400错误     | `Record does not exist.`                       |
| **数据库连接异常**       | API返回500错误     | `System error. Please contact administrator.`  |
| **API超时**              | 前端捕获超时异常   | `Request timeout. Please try again later.`     |
| **网络异常**             | 前端捕获网络异常   | `Network connection failed. Please check your network settings.` |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 管理 `serieChnr`, `desc`, `checkResult`, `errorMessage`, `isLoading`。
    - checkResult用于存储CHECK操作返回的记录详细信息。
2.  **安全性**：
    - API 请求必须携带有效的认证Token。
    - 所有AD变更操作需记录日志，便于审计。
3.  **UI 细节**：
    - Serie-Chnr输入框应支持自动去除首尾空格。
    - Desc字段建议使用多行文本框（Textarea），高度适中，支持滚动。
    - 三个按钮在 `isLoading` 期间应设为 `disabled`，防止重复提交。
    - `Message` 文字颜色建议使用红色 (`#ff4d4f` 或 `#c62828`) 以起到警示作用，Warning级别可使用橙色 (`#fa8c16`)。
    - CHECK操作成功后，应在页面下方显示记录详细信息，包括激活状态、创建日期、创建人等。
4.  **性能优化**：
    - CHECK操作可缓存结果，避免频繁查询同一记录。
    - 所有操作应在后端完成数据校验，前端仅做基础非空校验。
5.  **数据流逻辑**：
    - ADD操作流程：
      1. 前端发送Serie-Chnr和Desc到后端
      2. 后端检查记录是否已激活
      3. 若未激活，返回Warning错误
      4. 若已激活，插入HDOC_ADCA_CHANGE表
      5. 返回成功消息到前端
    - DELETE操作流程：
      1. 前端发送Serie-Chnr到后端
      2. 后端检查记录是否存在
      3. 若存在，从HDOC_ADCA_CHANGE表删除
      4. 返回成功消息到前端
    - CHECK操作流程：
      1. 前端发送Serie-Chnr到后端
      2. 后端查询HDOC_ADCA_CHANGE表
      3. 返回记录详细信息到前端
      4. 前端显示记录详情（包括isActive状态）

---
