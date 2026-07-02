# 用户指南模块 (User Guide Module) 详细设计说明书

| 文档编号     | DES-USER-GUIDE-UD24        | 版本号     | v1.0       |
| :----------- | :------------------------- | :--------- | :--------- |
| **模块名称** | User Guide                 | **作成日** | 2022-11-30 |
| **作成者**   | UD 刘                      | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于显示HDoc系统的帮助信息和相关文档链接。用户可以通过点击不同的链接跳转到相应的功能页面，包括快速指南下载、文档类型列表、市场列表和市场文档设置等。该功能主要用于为用户提供系统使用帮助和相关资源导航。

- **目标**：提供清晰的帮助信息导航界面，支持用户快速访问相关文档和功能页面。
- **安全性**：所有链接均为只读展示，点击后跳转到对应页面。
- **用户体验**：采用简洁的链接列表形式，支持快速导航到各个帮助页面。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item)                          | 種別 (Type)    | 必須 (Req) | MaxLength |   I/O    | 許容文字 (Allowed Chars)      | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                                               |
| :------------------------------------- | :------------- | :--------: | :-------: | :------: | :---------------------------- | :--------------: | :--------------: | :----------------: | :------------------------------------------------- |
| **HDoc Quick Guide**                   | Link           |     -      |     -     | Action   | -                             |    左 (Left)     | -                | -                  | 跳转到Download and Print Quick Guides画面          |
| **List of document types.**            | Link           |     -      |     -     | Action   | -                             |    左 (Left)     | -                | -                  | 跳转到Document Types画面                           |
| **Markets in HDoc**                    | Link           |     -      |     -     | Action   | -                             |    左 (Left)     | -                | -                  | 跳转到Markets in HDoc画面                          |
| **HDoc - Market Document Setting**     | Link           |     -      |     -     | Action   | -                             |    左 (Left)     | -                | -                  | 跳转到Market Document Settings List画面            |
| **Describation**                       | Link           |     -      |     -     | Action   | -                             |    左 (Left)     | -                | -                  | 描述链接（具体跳转目标待定）                       |
| **Other Information**                  | Checkbox       |     -      |     -     | Output   | -                             |    左 (Left)     | 未选中           | -                  | 其他信息复选框                                     |

> **注**：
> - **链接行为**：
>   1. HDoc Quick Guide → Download and Print Quick Guides画面
>   2. List of document types. → Document Types画面
>   3. Markets in HDoc → Markets in HDoc画面
>   4. HDoc - Market Document Setting → Market Document Settings List画面
>   5. Describation → 具体跳转目标需要进一步确认

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

#### 3.1.1 页面初始化流程

1.  **开始**：页面加载事件触发。
2.  **前置处理**：无。
3.  **结果处理**：
    - **成功**：显示所有链接和复选框。
    - **失败**：无。

#### 3.1.2 链接点击流程

1.  **开始**：用户点击任意链接。
2.  **处理逻辑**：
    - 根据点击的链接类型，跳转到对应的目标页面。
3.  **结果处理**：
    - **成功**：打开目标页面。
    - **失败**：若目标页面不存在，显示错误提示。

### 3.2 校验详细规格表

| No. |   检查时机   |       检查对象       |          检查条件           | 错误消息 (Message Content) |              动作               |
| :-: | :----------: | :------------------: | :-------------------------: | :------------------------: | :-----------------------------: |
|  1  |  链接点击    | 目标页面             |      目标页面不存在         |      `Target page not found.`       |   显示错误提示，不跳转   |

## 4. 接口定义 (API Specification)

本模块无需后端API支持，所有操作均为前端路由跳转。

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **目标页面不存在**       | 前端拦截           | `Target page not found.`                       |
| **路由配置错误**         | 前端捕获异常       | `Navigation error. Please contact administrator.` |
| **网络异常**             | 前端捕获网络异常   | `Network connection failed. Please check your network settings.` |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 管理 `otherInformationChecked`（Other Information复选框状态）。
    - 无需管理其他字段状态，因为均为静态链接。
2.  **安全性**：
    - 所有链接均为内部路由跳转，无需额外安全校验。
    - 确保所有目标页面已正确配置路由。
3.  **UI 细节**：
    - 所有链接使用蓝色下划线样式，hover时改变颜色或添加背景色以提供视觉反馈。
    - Other Information复选框默认未选中。
    - 建议在页面顶部显示标题 "User Guide" 或 "HDoc Help"。
    - 链接列表应清晰排列，便于用户快速定位。
4.  **性能优化**：
    - 所有链接均为前端路由跳转，无需API调用，响应速度快。
    - 可使用React Router的Link组件实现声明式导航。
5.  **路由配置说明**：
    - 需要在App.tsx中确保以下路由已配置：
      - `/download-and-print-quick-guides` → DownloadAndPrintQuickGuides组件
      - `/document-types` → DocumentTypes组件
      - `/markets-in-hdoc` → MarketsInHDoc组件
      - `/market-document-settings-list` → MarketDocumentSettingsList组件
    - Describation链接的具体跳转目标需要进一步确认

---
