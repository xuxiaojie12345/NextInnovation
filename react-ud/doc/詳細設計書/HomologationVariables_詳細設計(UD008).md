# Homologation Variables 详细设计说明书

| 文档编号     | DES-Homologation Variables-008 | 版本号     | v1.0       |
| :----------- | :----------------------------- | :--------- | :--------- |
| **模块名称** | Homologation Variables         | **作成日** | 2026-07-15 |
| **作成者**   | GitHub Copilot                 | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块为 Homologation Variables 功能模块，用于实现用户自定义规则（rules）的全生命周期管理，支持通过指定条件检索 Homologation Variables 相关数据，同时提供新增、修改、删除自定义规则的操作能力，保障整车认证相关变量数据的可配置性与维护便捷性。

- **目标**：提供完整的 Homologation Variables 检索、新增、修改、删除功能，确保用户可灵活管理系统中的自定义变量规则数据。
- **安全性**：
  - 执行 Add、Update、Delete 操作时，针对 Product class、Number、Market 三个核心字段进行必填校验与重复主键校验。
  - 核心数据操作前需关联校验 `HDOC_VARIABLES` 基础表的变量合法性，避免非法数据流入业务系统。
- **用户体验**：
  - 页面操作入口清晰，所有操作按钮默认保持激活状态。
  - 点击 Clear 按钮可一键清空所有输入内容，降低用户重复操作成本。
  - 操作触发后即时返回明确的处理结果提示，帮助用户快速定位异常原因。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| No. | 项目名 (Item)        | 种类 (Type)    | 必须 (Req) | MaxLength | I/O           | 允许字符 (Allowed Chars)     | 字符对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注                                                           |
| :-: | :------------------- | :------------- | :--------: | :-------: | :------------ | :--------------------------- | :--------------: | :--------------: | :----------------: | :------------------------------------------------------------- |
|  1  | **Product class**    | Pull-downList  |     Y      |     2     | Input/Output  | 半角英数字 + 符号            | 左 (Left)        | 空 (Empty)       | 活性 (Enabled)     | Add/Update/Delete 操作时为必填项                               |
|  2  | **Number**           | TextField      |     Y      |    10     | Input/Output  | 半角数字                     | 左 (Left)        | 空 (Empty)       | 活性 (Enabled)     | Add/Update/Delete 操作时为必填项                               |
|  3  | **Market**           | Pull-downList  |     Y      |     3     | Input/Output  | 半角英数字 + 符号            | 左 (Left)        | 空 (Empty)       | 活性 (Enabled)     | Add/Update/Delete 操作时为必填项                               |
|  4  | **Variable**         | TextField      |     -      |    20     | Input/Output  | 半角英数字 + 符号            | 左 (Left)        | 空 (Empty)       | 活性 (Enabled)     | 若输入内容以 `TEMPLATE-` 开头，需移除前缀后校验剩余内容是否在 `HDOC_VARIABLES` 表中存在 |
|  5  | **Value**            | TextField      |     -      |    200    | Input/Output  | 半角英数字 + 符号            | 左 (Left)        | 空 (Empty)       | 活性 (Enabled)     | 无特殊约束                                                     |
|  6  | **Variant string.1** | TextField      |     -      |    100    | Input/Output  | 半角英数字 + 符号            | 左 (Left)        | 空 (Empty)       | 活性 (Enabled)     | 无特殊约束                                                     |
|  7  | **Variant string.2** | TextField      |     -      |    100    | Input/Output  | 半角英数字 + 符号            | 左 (Left)        | 空 (Empty)       | 活性 (Enabled)     | 无特殊约束                                                     |
|  8  | **Comments**         | TextField      |     -      |    100    | Input/Output  | 半角英数字 + 符号            | 左 (Left)        | 空 (Empty)       | 活性 (Enabled)     | 无特殊约束                                                     |
|  9  | **Add**              | TextField      |     -      |     6     | Input/Output  | 半角英数字 + 符号            | 左 (Left)        | 空 (Empty)       | 活性 (Enabled)     | 存储新增操作的日期信息                                         |
| 10  | **Delete**           | TextField      |     -      |     6     | Input/Output  | 半角英数字 + 符号            | 左 (Left)        | 空 (Empty)       | 活性 (Enabled)     | 存储删除操作的日期信息                                         |
| 11  | **Created by user**  | TextField      |     -      |    16     | Input/Output  | 半角英数字 + 符号            | 左 (Left)        | 空 (Empty)       | 活性 (Enabled)     | 存储最后更新操作的用户信息                                     |
| 12  | **Date**             | TextField      |     -      |     -     | Input/Output  | 日期                         | 左 (Left)        | 空 (Empty)       | 活性 (Enabled)     | 存储最后更新操作的时间信息                                     |
| 13  | **Search**           | Button         |     -      |     -     | Action        | -                            | 中 (Center)      | -                | 活性 (Enabled)     | 点击后执行数据检索并跳转至 Homologation Variables 检索结果页面 |
| 14  | **Clear**            | Button         |     -      |     -     | Action        | -                            | 中 (Center)      | -                | 活性 (Enabled)     | 点击后清空当前页面所有输入内容                                 |
| 15  | **Add**              | Button         |     -      |     -     | Action        | -                            | 中 (Center)      | -                | 活性 (Enabled)     | 点击后提交当前输入的新数据完成新增注册                         |
| 16  | **Update**           | Button         |     -      |     -     | Action        | -                            | 中 (Center)      | -                | 活性 (Enabled)     | 点击后提交当前修改的内容完成数据更新                           |
| 17  | **Delete**           | Button         |     -      |     -     | Action        | -                            | 中 (Center)      | -                | 活性 (Enabled)     | 点击后提交指定条件完成对应数据的删除操作                       |

> **注**：
>
> - **半角英数字**：正则表达式 `[a-zA-Z0-9]`
> - **半角数字**：正则表达式 `[0-9]`
> - **半角英数字 + 符号**：指 ASCII 范围内的可见符号（如 `!@#$%^&*()_+-=[]{};':"\\|,.<>/?` 等）及半角英数字
> - **日期格式**：`YYYYMMDD`，正则表达式 `^\d{8}$`

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

所有校验逻辑均在用户点击对应操作按钮时按序执行。

### 3.1 处理流程

#### 3.1.1 初始表示

页面正常加载后，展示 Homologation Variables 页面的所有检索条件控件。

- Product class 下拉选项从 `PRODUCT_CLASS_MASTER` 表获取全量产品类别数据。
- Market 下拉选项从 `MARKET_MASTER` 表获取全量市场数据。
- 其余输入项默认清空。
- 所有操作按钮保持激活状态。

#### 3.1.2 触发条件：用户按下 Search 按钮

1. **字符类型校验 (Frontend Check)**：
   - 若 Number 输入内容非半角数字：
     - 设置 `Message` = `Number must be numeric digits.`
     - **终止流程**。
   - 若 Product class、Market、Variable、Value、Variant string.1、Variant string.2、Comments、Add、Delete、Created by user 输入内容不符合半角英数字 + 符号规则：
     - 设置 `Message` = `对应字段名 must be a half width English numeral/symbol.`
     - **终止流程**。
   - 若 Date 输入内容不符合日期格式：
     - 设置 `Message` = `The date format of Date is incorrect.`
     - **终止流程**。

2. **API 调用 (Backend Check)**：
   - 若前端校验通过，调用 `HomologationVariablesSearchAPI` 执行数据检索。

3. **结果处理**：
   - **成功**：根据输入的检索条件，从 `HDOC_USER_DEFINED_RULES` 表中筛选匹配的结果，跳转展示 Homologation Variables 检索结果页面。
   - **失败**：弹出系统异常提示，终止跳转操作。

#### 3.1.3 触发条件：用户按下 Clear 按钮

1. **前置校验**：无前置校验步骤。

2. **结果处理**：
   - **成功**：页面所有输入控件内容全部清空，重置为初始状态。

#### 3.1.4 触发条件：用户按下 Add 按钮

1. **空值校验 (Frontend Check)**：
   - 若 Product class、Number、Market 任意一项为空：
     - 设置 `Message` = `Product class, Number, Market are required`
     - **终止流程**。

2. **字符类型校验 (Frontend Check)**：
   - 若 Number 输入内容非半角数字：
     - 设置 `Message` = `Number must be numeric digits.`
     - **终止流程**。
   - 若 Product class、Market、Variable、Value、Variant string.1、Variant string.2、Comments、Add、Delete、Created by user 输入内容不符合半角英数字 + 符号规则：
     - 设置 `Message` = `对应字段名 must be a half width English numeral/symbol.`
     - **终止流程**。
   - 若 Date 输入内容不符合日期格式：
     - 设置 `Message` = `The date format of Date is incorrect.`
     - **终止流程**。

3. **API 调用 (Backend Check)**：
   - 若前端校验通过，调用 `HomologationVariablesAddAPI`。
   - **后端重复主键校验**：
     - 若已存在相同 Product class、Number、Market 的记录：
       - 设置 `Message` = `Primary key conflict, Please enter the correct content`
       - **终止流程**。
   - **后端变量合法性校验**：
     - 若 Variable 输入内容移除 `TEMPLATE-` 前缀后，无法在 `HDOC_VARIABLES` 表中匹配到对应记录：
       - 设置 `Message` = `Variant does not exist, Please enter the correct content`
       - **终止流程**。

4. **结果处理**：
   - **成功**：将输入的新数据写入 `HDOC_USER_DEFINED_RULES` 表，返回新增成功提示。
   - **失败**：弹出新增失败异常提示。

#### 3.1.5 触发条件：用户按下 Update 按钮

1. **空值校验 (Frontend Check)**：
   - 若 Product class、Number、Market 任意一项为空：
     - 设置 `Message` = `Product class, Number, Market are required`
     - **终止流程**。

2. **字符类型校验 (Frontend Check)**：
   - 若 Number 输入内容非半角数字：
     - 设置 `Message` = `Number must be numeric digits.`
     - **终止流程**。
   - 若 Product class、Market、Variable、Value、Variant string.1、Variant string.2、Comments、Add、Delete、Created by user 输入内容不符合半角英数字 + 符号规则：
     - 设置 `Message` = `对应字段名 must be a half width English numeral/symbol.`
     - **终止流程**。
   - 若 Date 输入内容不符合日期格式：
     - 设置 `Message` = `The date format of Date is incorrect.`
     - **终止流程**。

3. **API 调用 (Backend Check)**：
   - 若前端校验通过，调用 `HomologationVariablesUpdateAPI`。
   - **后端存在性校验**：
     - 若 Product class、Number、Market 匹配的目标记录不存在：
       - 设置 `Message` = `Data does not exist, Please enter the correct content`
       - **终止流程**。
   - **后端重复主键校验**：
     - 若更新操作导致 Product class、Number、Market 出现重复记录：
       - 设置 `Message` = `Primary key conflict, Please enter the correct content`
       - **终止流程**。
   - **后端变量合法性校验**：
     - 若 Variable 输入内容移除 `TEMPLATE-` 前缀后，无法在 `HDOC_VARIABLES` 表中匹配到对应记录：
       - 设置 `Message` = `Variant does not exist, Please enter the correct content`
       - **终止流程**。

4. **结果处理**：
   - **成功**：根据输入条件更新 `HDOC_USER_DEFINED_RULES` 表中对应记录，返回更新成功提示。
   - **失败**：弹出更新失败异常提示。

#### 3.1.6 触发条件：用户按下 Delete 按钮

1. **空值校验 (Frontend Check)**：
   - 若 Product class、Number、Market 任意一项为空：
     - 设置 `Message` = `Product class, Number, Market are required`
     - **终止流程**。

2. **字符类型校验 (Frontend Check)**：
   - 若 Number 输入内容非半角数字：
     - 设置 `Message` = `Number must be numeric digits.`
     - **终止流程**。
   - 若 Product class、Market 输入内容不符合半角英数字 + 符号规则：
     - 设置 `Message` = `对应字段名 must be a half width English numeral/symbol.`
     - **终止流程**。

3. **API 调用 (Backend Check)**：
   - 若前端校验通过，调用 `HomologationVariablesDeleteAPI`。
   - **后端存在性校验**：
     - 若 Product class、Number、Market 匹配的目标记录不存在：
       - 设置 `Message` = `Data does not exist, Please enter the correct content`
       - **终止流程**。

4. **结果处理**：
   - **成功**：从 `HDOC_USER_DEFINED_RULES` 表中删除匹配的记录，返回删除成功提示。
   - **失败**：弹出删除失败异常提示。

### 3.2 校验详细规格表

| No. | 检查时机            | 检查对象                                                                 | 检查条件                                                     | 错误消息 (Message Content)                                           | 动作                               |
| :-: | :------------------ | :----------------------------------------------------------------------- | :----------------------------------------------------------- | :------------------------------------------------------------------- | :--------------------------------- |
|  1  | Search 按钮点击     | Number                                                                   | Number 输入内容包含非半角数字字符                            | `Number must be numeric digits.`                                     | 终止检索流程，聚焦到 Number 输入框 |
|  2  | Search 按钮点击     | Product class、Market、Variable、Value、Variant string.1、Variant string.2、Comments、Add、Delete、Created by user | 输入内容不符合半角英数字 + 符号规则                          | `对应字段名 must be a half width English numeral/symbol.`            | 终止检索流程，聚焦到异常输入框     |
|  3  | Search 按钮点击     | Date                                                                     | 输入内容不符合日期格式                                       | `The date format of Date is incorrect.`                              | 终止检索流程，聚焦到 Date 输入框   |
|  4  | Add 按钮点击        | Product class、Number、Market                                            | 三个字段任意一项为空                                         | `Product class, Number, Market are required`                         | 终止新增流程，聚焦到空输入字段     |
|  5  | Add 按钮点击        | Number                                                                   | Number 输入内容包含非半角数字字符                            | `Number must be numeric digits.`                                     | 终止新增流程，聚焦到 Number 输入框 |
|  6  | Add 按钮点击        | Product class、Market、Variable、Value、Variant string.1、Variant string.2、Comments、Add、Delete、Created by user | 输入内容不符合半角英数字 + 符号规则                          | `对应字段名 must be a half width English numeral/symbol.`            | 终止新增流程，聚焦到异常输入框     |
|  7  | Add 按钮点击        | Date                                                                     | 输入内容不符合日期格式                                       | `The date format of Date is incorrect.`                              | 终止新增流程，聚焦到 Date 输入框   |
|  8  | Add 接口后端校验    | 新增全量数据                                                             | 已存在相同 Product class、Number、Market 的记录              | `Primary key conflict, Please enter the correct content`             | 终止新增流程，返回错误提示         |
|  9  | Add 接口后端校验    | Variable                                                                 | Variable 输入移除 `TEMPLATE-` 前缀后，`HDOC_VARIABLES` 表中无匹配记录 | `Variant does not exist, Please enter the correct content`            | 终止新增流程，返回错误提示         |
| 10  | Update 按钮点击     | Product class、Number、Market                                            | 三个字段任意一项为空                                         | `Product class, Number, Market are required`                         | 终止更新流程，聚焦到空输入字段     |
| 11  | Update 按钮点击     | Number                                                                   | Number 输入内容包含非半角数字字符                            | `Number must be numeric digits.`                                     | 终止更新流程，聚焦到 Number 输入框 |
| 12  | Update 按钮点击     | Product class、Market、Variable、Value、Variant string.1、Variant string.2、Comments、Add、Delete、Created by user | 输入内容不符合半角英数字 + 符号规则                          | `对应字段名 must be a half width English numeral/symbol.`            | 终止更新流程，聚焦到异常输入框     |
| 13  | Update 按钮点击     | Date                                                                     | 输入内容不符合日期格式                                       | `The date format of Date is incorrect.`                              | 终止更新流程，聚焦到 Date 输入框   |
| 14  | Update 接口后端校验 | 更新全量数据                                                             | Product class、Number、Market 匹配的待更新记录不存在         | `Data does not exist, Please enter the correct content`              | 终止更新流程，返回错误提示         |
| 15  | Update 接口后端校验 | 更新全量数据                                                             | 更新操作导致 Product class、Number、Market 出现重复主键      | `Primary key conflict, Please enter the correct content`             | 终止更新流程，返回错误提示         |
| 16  | Update 接口后端校验 | Variable                                                                 | Variable 输入移除 `TEMPLATE-` 前缀后，`HDOC_VARIABLES` 表中无匹配记录 | `Variant does not exist, Please enter the correct content`            | 终止更新流程，返回错误提示         |
| 17  | Delete 按钮点击     | Product class、Number、Market                                            | 三个字段任意一项为空                                         | `Product class, Number, Market are required`                         | 终止删除流程，聚焦到空输入字段     |
| 18  | Delete 按钮点击     | Number                                                                   | Number 输入内容包含非半角数字字符                            | `Number must be numeric digits.`                                     | 终止删除流程，聚焦到 Number 输入框 |
| 19  | Delete 按钮点击     | Product class、Market                                                    | 输入内容不符合半角英数字 + 符号规则                          | `对应字段名 must be a half width English numeral/symbol.`            | 终止删除流程，聚焦到异常输入框     |
| 20  | Delete 接口后端校验 | 删除全量数据                                                             | Product class、Number、Market 匹配的待删除记录不存在         | `Data does not exist, Please enter the correct content`              | 终止删除流程，返回错误提示         |

## 4. 接口定义 (API Specification)

### 4.1 UD08SelectProductclassmaster

- **功能**：从 `PRODUCT_CLASS_MASTER` 表获取全量产品类别数据，返回检索结果集合。
- **Method**: `GET`
- **Endpoint**: `/api/hdoc/UD08HomologationVariablesApi/UD08SelectProductclassmaster`

#### Request Body

```json
{

}
```

#### Response Success (200 OK)

```json
{
    "code": 200,
    "message": null,
    "data": [
        "01",
        "02",
        "03"
    ]
}
```

#### Response Error (500 Internal Server Error)

```json
{
    "code": 500,
    "message": "System error, please contact administrator",
    "data": null
}
```

### 4.2 UD08SelectMarketmaster

- **功能**：从 `MARKET_MASTER` 表获取全量市场数据，返回检索结果集合。
- **Method**: `GET`
- **Endpoint**: `/api/ud08/UD08HomologationVariablesApi/UD08SelectMarketmaster`

#### Request Body

```json
{

}
```

#### Response Success (200 OK)

```json
{
    "code": 200,
    "message": null,
    "data": [
        "CN",
        "JP",
        "US"
    ]
}
```

#### Response Error (500 Internal Server Error)

```json
{
    "code": 500,
    "message": "System error, please contact administrator",
    "data": null
}
```

### 4.3 UD08SelectHdocvariables

- **功能**：从 `HDOC_VARIABLES` 表获取 Variable 列表，用于校验 Variable 输入值是否存在。
- **Method**: `GET`
- **Endpoint**: `/api/UD08SelectHdocvariables`

#### Request Body

```json
{
    "variable": "TEST_VAR"
}
```

#### Response Success (200 OK)

```json
{
    "code": 200,
    "message": null,
    "data": 1
}
```

#### Response Error (500 Internal Server Error)

```json
{
    "code": 500,
    "message": "System error, please contact administrator",
    "data": null
}
```

### 4.4 UD08Add

- **功能**：校验新增数据合法性后，将新的用户自定义规则写入 `HDOC_USER_DEFINED_RULES` 表。
- **Method**: `POST`
- **Endpoint**: `/api/ud08/UD08HomologationVariablesApi/UD08Add`

#### Request Body

```json
{
    "productClass": "01",
    "number": "1234567890",
    "market": "CN",
    "variable": "TEST_VAR",
    "value": "TEST_VALUE",
    "variantString1": "VS1",
    "variantString2": "VS2",
    "comments": "TEST_comments",
    "addDate": "20221124",
    "deleteDate": "",
    "updateUser": "UD01"
}
```

#### Response Success (200 OK)

```json
{
    "code": 200,
    "message": null,
    "data": null
}
```

#### Response Error (400 Bad Request)

```json
{
    "code": 400,
    "message": "Primary key conflict, Please enter the correct content",
    "data": null
}
```

### 4.5 UD08Update

- **功能**：校验待更新数据存在性与合法性后，修改 `HDOC_USER_DEFINED_RULES` 表中匹配的记录内容。
- **Method**: `PUT`
- **Endpoint**: `/api/ud08/UD08HomologationVariablesApi/UD08Update`

#### Request Body

```json
{
    "productClass": "01",
    "number": "1234567890",
    "market": "CN",
    "variable": "NEW_VAR",
    "value": "NEW_VALUE",
    "variantString1": "NEW_VS1",
    "variantString2": "NEW_VS2",
    "comments": "TEST_comments",
    "addDate": "20221124",
    "deleteDate": "",
    "updateUser": "UD001"
}
```

#### Response Success (200 OK)

```json
{
    "code": 200,
    "message": null,
    "data": null
}
```

#### Response Error (400 Bad Request)

```json
{
    "code": 400,
    "message": "Data does not exist, Please enter the correct content",
    "data": null
}
```

### 4.6 UD08Delete

- **功能**：校验待删除数据存在性后，移除 `HDOC_USER_DEFINED_RULES` 表中匹配的目标记录。
- **Method**: `DELETE`
- **Endpoint**: `/api/hdoc/UD08HomologationVariablesApi/UD08Delete`

#### Request Body

```json
{
    "productClass": "01",
    "number": "1234567890",
    "market": "CN"
}
```

#### Response Success (200 OK)

```json
{
    "code": 200,
    "message": null,
    "data": null
}
```

#### Response Error (400 Bad Request)

```json
{
    "code": 400,
    "message": "Data does not exist, Please enter the correct content",
    "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式                     | Message 显示内容                               |
| :----------------------- | :--------------------------- | :--------------------------------------------- |
| 接口调用超时或返回系统内部错误 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.`  |

## 6. 实现注意事项 (Implementation Notes)

1. **状态管理**：
   - 使用 React State 管理各输入控件的值（productClass、number、market、variable、value、variantString1、variantString2、comments、add、delete、createdByUser、date）、message、isLoading。
   - `Message` 区域默认隐藏（内容为空时不予显示）。

2. **输入限制**：
   - Number：通过正则 `/^[0-9]*$/` 控制仅允许半角数字输入，最大长度 10 字符。
   - Product class、Market、Variable、Value、Variant string.1、Variant string.2、Comments、Add、Delete、Created by user：通过正则 `/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/` 控制允许半角英数字 + 符号输入。
   - Date：通过正则 `/^\d{8}$/` 校验 `YYYYMMDD` 格式。

3. **下拉选项加载**：
   - Product class 下拉选项在页面初始化时通过 `UD08SelectProductclassmaster` API 获取。
   - Market 下拉选项在页面初始化时通过 `UD08SelectMarketmaster` API 获取。

4. **Variable 前缀处理**：
   - 若 Variable 输入内容以 `TEMPLATE-` 开头，需移除该前缀后，将剩余内容作为关键字调用 `UD08SelectHdocvariables` API 校验其在 `HDOC_VARIABLES` 表中是否存在。

5. **UI 细节**：
   - Search、Clear、Add、Update、Delete 按钮在 `isLoading` 期间应设为 `disabled` 状态，防止重复提交。
   - `Message` 文字颜色使用红色（`#ff4d4f`）以起到警示作用。

6. **画面迁移**：
   - Search 操作成功后，通过路由导航跳转至 Homologation Variables 检索结果页面。
