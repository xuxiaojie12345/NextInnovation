# 保存修改模块 (Save Modifications Module) 详细设计说明书

| 文档编号     | DES-SAVE-MOD-UD06         | 版本号     | v1.0       |
| :----------- | :------------------------ | :--------- | :--------- |
| **模块名称** | Save Modifications        | **作成日** | 2022-11-21 |
| **作成者**   | UD 刘                     | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于显示AD/CA变更的修改内容。页面从上一画面接收底盘系列号和底盘号参数，并展示对应的文档类型、版本、存储信息等修改详情。用户查看后可点击Close按钮关闭画面。

- **目标**：为用户提供清晰的修改内容查看界面，支持快速关闭返回。
- **安全性**：所有数据均为只读展示，基于底盘号从HDOC_ADCA_MODIFICATION表检索关联数据。
- **用户体验**：采用Label形式展示各项修改信息，简洁明了；提供Close按钮一键关闭。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item)                    | 種別 (Type) | 必須 (Req) | MaxLength |  I/O    | 許容文字 (Allowed Chars) | 文字配置 (Align) | 初期値 (Default)        | 表示制御 (Control) | 备注                                      |
| :------------------------------- | :---------- | :--------: | :-------: | :-----: | :----------------------- | :--------------: | :---------------------- | :----------------: | :---------------------------------------- |
| **Chassis serie（底盘系列）**    | Label       |     -      |     -     | Output  | -                        |    左 (Left)     | =F8（由前画面传递）     | -                  | 获取"-"前的内容                           |
| **Chassis number（底盘号）**     | Label       |     -      |     -     | Output  | -                        |    左 (Left)     | =F9（由前画面传递）     | -                  | 获取"-"后的内容                           |
| **Doctype**                      | Label       |     -      |     -     | Output  | -                        |    左 (Left)     | -                       | -                  | 来自HDOC_ADCA_MODIFICATION.DOCTYPE        |
| **Version**                      | Label       |     -      |     -     | Output  | -                        |    左 (Left)     | -                       | -                  | 来自HDOC_ADCA_MODIFICATION.VERS           |
| **Storing**                      | Label       |     -      |     -     | Output  | -                        |    左 (Left)     | -                       | -                  | 来自HDOC_ADCA_MODIFICATION.VARIABLE/NEWVAL |
| **FOUND UNRELEASED VERSION**     | Label       |     -      |     -     | Output  | -                        |    左 (Left)     | -                       | -                  | 来自HDOC_ADCA_MODIFICATION.VERS           |
| **Message**                      | Label       |     -      |     -     | Output  | -                        |    左 (Left)     | -                       | -                  | 固定显示 'VERSION IS RELEASED'            |
| **Close**                        | Button      |     -      |     -     | Action  | -                        |   中 (Center)    | -                       |   活性 (Enabled)   | 关闭当前画面                              |

> **注**：
> - Chassis serie 和 Chassis number 从上一画面传递的参数中解析：
>   - Chassis serie：获取"-"前的内容
>   - Chassis number：获取"-"后的内容

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

1.  **开始**：页面加载事件触发。
2.  **前置处理**：从URL参数或state中获取 Chassis serie (=F8) 和 Chassis number (=F9)。
3.  **空值校验 (Frontend Check)**：
    - 若 `Chassis serie` 或 `Chassis number` 为空：
      - 设置 Message = `No chassis information provided.`
      - **终止**流程，不显示任何数据。
4.  **API 调用 (Backend Check)**：
    - 调用 `GetModificationInfoApi(chassisSerie, chassisNumber)` 获取修改信息。
5.  **结果处理**：
    - **成功**：将所有字段数据填充到对应的Label中。
    - **失败**：若无数据：显示 `No modification data found for this chassis.`；若其他错误：显示具体错误消息。
6.  **Close操作**：
    - 用户点击 Close 按钮后，关闭当前画面，返回上一画面。

### 3.2 校验详细规格表

| No. |   检查时机   |       检查对象       |          检查条件           | 错误消息 (Message Content) |              动作               |
| :-: | :----------: | :------------------: | :-------------------------: | :------------------------: | :-----------------------------: |
|  1  |  页面初始化  | Chassis参数          | `Value == null` OR `== ""`  |      `No chassis information provided.`       |   显示错误消息，不加载数据   |
|  2  |  API 响应   | 修改信息查询结果     |      无对应底盘的数据       |      `No modification data found for this chassis.`       |   显示错误消息，清空所有字段   |
|  3  |  API 响应   |    服务器错误        |  `Status != Success`  | `System error. Please contact administrator.` |   显示错误消息   |

## 4. 接口定义 (API Specification)

### 4.1 GetModificationInfoApi

- **功能**：根据底盘系列号和底盘号获取AD/CA修改信息。
- **Method**: `GET`
- **Endpoint**: `/api/ud06/getmodificationinfo`

#### Request Params

```json
{
  "chassisSerie": "string (从上一画面传递，'-'前的内容)",
  "chassisNumber": "string (从上一画面传递，'-'后的内容)"
}
```

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "获取修改信息成功",
  "data": {
    "chassisSerie": "ABC",
    "chassisNumber": "123456",
    "doctype": "COC",
    "version": "V1.0",
    "storing": "VARIABLE_NAME / NEW_VALUE",
    "foundUnreleasedVersion": "V0.9",
    "message": "VERSION IS RELEASED"
  }
}
```

##### 响应字段说明

| 字段名                 | 类型   | 说明                                                                              |
| :--------------------- | :----- | :-------------------------------------------------------------------------------- |
| chassisSerie           | String | 底盘系列号，从上一画面传递（'-'前的内容）                                         |
| chassisNumber          | String | 底盘号，从上一画面传递（'-'后的内容）                                             |
| doctype                | String | 文档类型，来自HDOC_ADCA_MODIFICATION.DOCTYPE                                      |
| version                | String | 版本，来自HDOC_ADCA_MODIFICATION.VERS                                             |
| storing                | String | 存储信息，来自HDOC_ADCA_MODIFICATION.VARIABLE/NEWVAL                              |
| foundUnreleasedVersion | String | 发现的未发布版本，来自HDOC_ADCA_MODIFICATION.VERS                                 |
| message                | String | 固定消息 'VERSION IS RELEASED'                                                    |

#### Response Error (400/500)

```json
{
  "success": false,
  "message": "No modification data found for this chassis.",
  "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **未传递底盘参数**       | 前端校验拦截       | `No chassis information provided.`             |
| **底盘号无对应数据**     | API返回400错误     | `No modification data found for this chassis.` |
| **数据库连接异常**       | API返回500错误     | `System error. Please contact administrator.`  |
| **API超时**              | 前端捕获超时异常   | `Request timeout. Please try again later.`     |
| **网络异常**             | 前端捕获网络异常   | `Network connection failed. Please check your network settings.` |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 管理 `modificationInfo`, `errorMessage`, `isLoading`。
    - 页面加载时从location.state或URL参数获取chassisSerie和chassisNumber。
2.  **安全性**：
    - API 请求必须携带有效的认证Token。
    - 所有数据均为只读展示，禁止修改操作。
3.  **UI 细节**：
    - 所有字段使用Label形式展示，左对齐。
    - Message字段固定显示 'VERSION IS RELEASED'，可使用绿色或蓝色突出显示。
    - Close按钮应位于页面底部中央位置，便于用户操作。
    - 若某个字段值为空，显示 `-` 或留空（根据业务需求决定）。
    - 建议在页面顶部显示标题 "Save Modifications"，并显示当前底盘信息。
4.  **性能优化**：
    - 数据查询应在后端完成，避免前端多次API调用。
    - 页面加载时应显示Loading状态，提升用户体验。
5.  **参数解析逻辑**：
    - 从上一画面传递的参数中解析Chassis serie和Chassis number：
      ```javascript
      const fullChassisNo = location.state?.chassisNo || ''; // 例如："ABC-123456"
      const [chassisSerie, chassisNumber] = fullChassisNo.split('-');
      ```
    - 若参数格式不正确（无'-'分隔符），应显示错误提示。

---
