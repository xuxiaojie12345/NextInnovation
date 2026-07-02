# 市场文档设置列表模块 (Market Document Settings List Module) 详细设计说明书

| 文档编号     | DES-MARKET-DOC-SETTINGS-UD20   | 版本号     | v1.0       |
| :----------- | :----------------------------- | :--------- | :--------- |
| **模块名称** | Market Document Settings List  | **作成日** | 2022-11-30 |
| **作成者**   | UD 刘                          | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于显示HDoc系统的市场文档设置列表。用户可以选择某条记录并返回前画面，将选中的文档信息自动填充到前画面的相应字段中。该功能主要用于文档选择和配置，帮助用户快速定位和选择所需的文档模板。

- **目标**：向具有文档管理权限的系统用户提供文档选择和查看功能。
- **安全性**：需要从HDOC_DOCUMENT_LIST表读取文档信息；所有数据均为只读展示（除选择操作外）；Select操作必须校验是否已选择记录；User链接跳转到EDB用户查看画面。
- **用户体验**：以表格形式清晰展示所有文档信息；提供RadioBox单选机制，确保用户只能选择一个记录；支持打印功能，方便用户保存文档列表；User列提供链接，可快速查看用户详细信息；Select操作后自动将数据传递到前画面，提升操作效率。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item)           | 種別 (Type)                         | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars) | 文字配置 (Align) |  初期値 (Default)   | 表示制御 (Control) | 备注                                           |
| :---------------------- | :---------------------------------- | :--------: | :-------: | :----: | :----------------------- | :--------------: | :-----------------: | :----------------: | :--------------------------------------------- |
| **Document type**       | TextField (DataTable Column)        |     -      |    20     | Output | -                        |    左 (Left)     |          -          |         -          | 从HDOC_DOCUMENT_LIST.DOCTYPE获取               |
| **Business unit**       | TextField (DataTable Column)        |     -      |     -     | Output | -                        |    左 (Left)     |         BU          |         -          | 固定显示'BU'                                   |
| **User**                | TextField (DataTable Column + Link) |     -      |    16     | Output | -                        |    左 (Left)     |          -          |         -          | 从HDOC_DOCUMENT_LIST.REGISTER_USER获取，带链接 |
| **Date**                | TextField (DataTable Column)        |     -      |     -     | Output | -                        |    左 (Left)     |          -          |         -          | 从HDOC_DOCUMENT_LIST.REGISTER_DATETIME获取     |
| **RadioBox (Select列)** | RadioBox                            |     -      |     -     | Input  | -                        |   中 (Center)    | 未选中 (Unselected) |   活性 (Enabled)   | 每行一个，单选模式                             |
| **Select**              | Button                              |     -      |     -     | Action | -                        |   中 (Center)    |          -          |   活性 (Enabled)   | 选择记录并返回前画面                           |
| **Back**                | Button                              |     -      |     -     | Action | -                        |   中 (Center)    |          -          |   活性 (Enabled)   | 返回前画面                                     |
| **Print**               | Button                              |     -      |     -     | Action | -                        |   中 (Center)    |          -          |   活性 (Enabled)   | 打印文档列表                                   |

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

所有校验逻辑均在页面加载时或用户执行操作时执行。

### 3.1 处理流程

#### 3.1.1 页面初始化流程

1.  **开始**：页面加载事件触发。
2.  **前置处理**：无。
3.  **API 调用 (Backend Check)**：
    - 调用 `GetDocumentListApi()` 获取文档列表。
    - API内部逻辑：
      1. 查询HDOC_DOCUMENT_LIST表，获取所有文档记录
      2. 提取DOCTYPE、REGISTER_USER、REGISTER_DATETIME字段
      3. 按REGISTER_DATETIME降序排序（最新注册的排在前面）
      4. 返回文档列表
4.  **结果处理**：
    - **成功**：将文档列表填充到DataTable；为每行添加RadioBox控件；Business unit列固定显示'BU'。
    - **失败**：若无数据：显示"No data found"错误消息；若其他错误：显示具体错误消息。

#### 3.1.2 Select操作流程

1.  **开始**：用户点击Select按钮。
2.  **前置处理**：
    - 获取当前选中的RadioBox状态。
    - 确定哪一行被选中。
3.  **空值校验 (Frontend Check)**：
    - 若没有RadioBox被选中：
      - 设置Message = "No data found"。
      - Message级别 = Error。
      - **终止**流程，不关闭画面。
4.  **数据处理**：
    - 获取选中行的数据：
      - Document type
      - Business unit（固定为'BU'）
      - User
      - Date
    - 将数据存储到状态管理或URL参数中。
5.  **画面迁移**：
    - 关闭当前画面。
    - 返回前画面【HDoc - Market Document Setting】。
    - 前画面接收数据并自动填充到相应字段。
6.  **结果处理**：
    - **成功**：当前画面关闭；前画面显示选中的文档信息。
    - **失败**：显示"No data found"错误消息；保持当前画面打开。

#### 3.1.3 Back操作流程

1.  **开始**：用户点击Back按钮。
2.  **处理逻辑**：
    - 无需校验。
    - 直接执行画面关闭操作。
3.  **结果处理**：
    - **成功**：当前画面关闭，返回前画面【HDoc - Market Document Setting】。
    - **失败**：无。

#### 3.1.4 Print操作流程

1.  **开始**：用户点击Print按钮。
2.  **处理逻辑**：
    - 调用浏览器打印API（window.print()）。
    - 生成打印内容，包含：
      - 页面标题
      - DataTable所有数据
      - 打印时间
3.  **结果处理**：
    - **成功**：打开打印预览窗口。
    - **失败**：显示"打印功能不可用"提示。

#### 3.1.5 User链接点击流程

1.  **开始**：用户点击User链接。
2.  **处理逻辑**：
    - 获取该行的User值。
    - 构建EDB用户查看画面的URL，携带Userid参数。
    - 迁移到【SearchUser】画面。
3.  **结果处理**：
    - **成功**：打开SearchUser画面，显示用户信息。
    - **失败**：若用户不存在，显示错误提示。

### 3.2 校验详细规格表

| No. |   检查时机   |       检查对象       |          检查条件           | 错误消息 (Message Content) |              动作               |
| :-: | :----------: | :------------------: | :-------------------------: | :------------------------: | :-----------------------------: |
|  1  |  Select操作  |   RadioBox选择状态   | 必须有且仅有一个记录被选中  |      `No data found`       | 终止流程，显示Error级别错误消息 |
|  2  |  页面初始化  | HDOC_DOCUMENT_LIST表 |      至少存在一条记录       |      `No data found`       |   显示错误消息，DataTable为空   |
|  3  | User链接点击 |        User值        | User必须在系统中存在        |        `用户不存在`        |   显示错误提示，不打开新窗口    |

## 4. 接口定义 (API Specification)

### 4.1 GetDocumentListApi

- **功能**：获取市场文档设置列表。
- **Method**: `GET`
- **Endpoint**: `/api/ud20/getdocumentlist`

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "获取文档列表成功",
  "data": [
    {
      "doctype": "COC_EUB1",
      "registerUser": "user001",
      "registerDatetime": "2022-11-30 10:30:00"
    },
    {
      "doctype": "VDA_US",
      "registerUser": "user002",
      "registerDatetime": "2022-11-29 15:45:00"
    }
  ]
}
```

##### 响应字段说明

| 字段名           | 类型   | 说明                                                                              |
| :--------------- | :----- | :-------------------------------------------------------------------------------- |
| doctype          | String | 文档类型，来自HDOC_DOCUMENT_LIST.DOCTYPE，最大20字符                              |
| registerUser     | String | 注册用户，来自HDOC_DOCUMENT_LIST.REGISTER_USER，最大16字符，若为空显示'-'         |
| registerDatetime | String | 注册日期时间，来自HDOC_DOCUMENT_LIST.REGISTER_DATETIME，格式：YYYY-MM-DD HH:mm:ss |

#### Response Error (400/500)

```json
{
  "success": false,
  "message": "No data found",
  "data": null
}
```

或

```json
{
  "success": false,
  "message": "系统错误，请稍后重试",
  "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                       | 处理方式                             | Message 显示内容                 |
| :----------------------------- | :----------------------------------- | :------------------------------- |
| **未选择记录就点击Select**     | 前端校验拦截，不发起后续操作         | `No data found`（Error级别）     |
| **HDOC_DOCUMENT_LIST表无数据** | API返回400错误，前端显示错误消息     | `No data found`                  |
| **数据库连接异常**             | API返回500错误，前端显示通用错误消息 | `系统错误，请稍后重试`           |
| **API超时**                    | 前端捕获超时异常，显示超时提示       | `请求超时，请检查网络连接后重试` |
| **网络异常**                   | 前端捕获网络异常，显示网络错误提示   | `网络连接失败，请检查网络设置`   |
| **打印功能不可用**             | 前端捕获打印异常，显示提示消息       | `打印功能不可用`                 |
| **User在系统中不存在**         | 前端校验或API返回错误，显示提示      | `用户不存在`                     |
| **前画面未正确接收数据**       | 前端显示警告消息                     | `数据传递失败，请重新选择`       |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 管理 `documents`, `selectedIndex`, `errorMessage`, `isLoading`。
    - 确保RadioBox组的选择状态互斥，只能选择一个记录。
2.  **安全性**：
    - API 请求必须通过 HTTPS 发送。
    - 需要用户登录认证后才能访问。
3.  **UI 细节**：
    - Select 按钮在 `isLoading` 期间应设为 `disabled`，防止重复提交。
    - Message 文字颜色建议使用红色 (`#ff4d4f`) 以起到警示作用。
    - Business unit 列固定显示'BU'。
    - User 列显示为链接，点击后跳转到SearchUser画面查看用户详情。
    - 表格采用斑马纹样式，偶数行浅蓝色背景，奇数行白色背景。
4.  **性能优化**：
    - 文档列表可在页面加载时一次性获取。
    - 若数据量较大，可考虑添加分页功能。
5.  **画面迁移逻辑**：
    - Select操作成功后，使用React Router的navigate函数返回前画面，并通过state传递选中的数据：
      ```javascript
      navigate(-1, {
        state: {
          selectedDocument: {
            documentType: selectedDocument.doctype,
            businessUnit: "BU",
            user: selectedDocument.registerUser,
            date: selectedDocument.registerDatetime
          },
          isFromSelection: true
        }
      });
      ```

---
