# 下载和打印快速指南模块 (Download and Print Quick Guides Module) 详细设计说明书

| 文档编号     | DES-DOWNLOAD-QUICK-GUIDES-UD23   | 版本号     | v1.0       |
| :----------- | :------------------------------- | :--------- | :--------- |
| **模块名称** | Download and Print Quick Guides  | **作成日** | 2022-11-30 |
| **作成者**   | UD 刘                            | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块用于提供HDoc系统快速指南（Quick Guides）的下载和打印说明。用户可以在此页面下载Volvo 3P Quick Guides文件，并查看快速指南的打印方法和折叠方法说明。该功能主要用于帮助用户快速获取系统使用指南。

- **目标**：提供清晰的快速指南下载和打印说明界面。
- **安全性**：所有数据均为只读展示；下载链接需确保文件来源安全。
- **用户体验**：采用简洁的链接和说明文本形式，支持快速下载和查看打印/折叠方法。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item)                        | 種別 (Type)    | 必須 (Req) | MaxLength |   I/O    | 許容文字 (Allowed Chars)      | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                                               |
| :----------------------------------- | :------------- | :--------: | :-------: | :------: | :---------------------------- | :--------------: | :--------------: | :----------------: | :------------------------------------------------- |
| **Download and Print Quick Guides**  | Link           |     -      |     -     | Action   | -                             |    左 (Left)     | -                | -                  | 主标题链接                                         |
| **Volvo 3P Quick Guides**            | Link           |     -      |     -     | Action   | -                             |    左 (Left)     | -                | -                  | 点击下载Volvo 3P Quick Guides文件                  |
| **To print do the following**        | Checkbox       |     -      |     -     | Output   | -                             |    左 (Left)     | 未选中           | -                  | 打印方法说明（复选框形式展示）                     |
| **To fold do the following**         | Checkbox       |     -      |     -     | Output   | -                             |    左 (Left)     | 未选中           | -                  | 折叠方法说明（复选框形式展示）                     |

> **注**：
> - **Volvo 3P Quick Guides链接行为**：
>   - 点击后触发文件下载
>   - 文件格式可能为PDF或Word文档
>   - 文件存储在服务器指定目录
> - **To print do the following**：
>   - 显示快速指南的打印方法说明
>   - 以复选框形式展示，但实际为只读说明文本
> - **To fold do the following**：
>   - 显示快速指南的折叠方法说明
>   - 以复选框形式展示，但实际为只读说明文本

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

#### 3.1.1 页面初始化流程

1.  **开始**：页面加载事件触发。
2.  **前置处理**：无。
3.  **结果处理**：
    - **成功**：显示所有链接和说明文本。
    - **失败**：无。

#### 3.1.2 Volvo 3P Quick Guides下载流程

1.  **开始**：用户点击 Volvo 3P Quick Guides 链接。
2.  **处理逻辑**：
    - 构建文件下载URL。
    - 触发浏览器下载操作。
3.  **结果处理**：
    - **成功**：浏览器开始下载文件。
    - **失败**：显示 `File not found.` 错误提示。

### 3.2 校验详细规格表

| No. |   检查时机   |       检查对象       |          检查条件           | 错误消息 (Message Content) |              动作               |
| :-: | :----------: | :------------------: | :-------------------------: | :------------------------: | :-----------------------------: |
|  1  |  文件下载    | 文件存在性           |      文件不存在             |      `File not found.`       |   显示错误提示，不下载   |

## 4. 接口定义 (API Specification)

### 4.1 DownloadQuickGuideApi

- **功能**：下载Volvo 3P Quick Guides文件。
- **Method**: `GET`
- **Endpoint**: `/api/ud23/downloadquickguide`

#### Response

- Content-Type: `application/pdf` 或 `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Content-Disposition: `attachment; filename="Volvo_3P_Quick_Guides.pdf"`
- Body: 文件二进制流

#### Response Error (404 Not Found)

```json
{
  "success": false,
  "message": "File not found.",
  "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **文件不存在**           | API返回404错误     | `File not found.`                              |
| **文件下载失败**         | 前端捕获异常       | `Failed to download file. Please try again later.` |
| **网络异常**             | 前端捕获网络异常   | `Network connection failed. Please check your network settings.` |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 管理 `toPrintChecked`, `toFoldChecked`（两个复选框的状态）。
    - 实际上这两个复选框仅用于展示说明文本，不需要用户交互。
2.  **安全性**：
    - 文件下载链接需确保文件来源安全。
    - 建议对文件进行病毒扫描后再提供下载。
3.  **UI 细节**：
    - Volvo 3P Quick Guides链接使用蓝色下划线样式，hover时改变颜色或添加背景色以提供视觉反馈。
    - To print do the following 和 To fold do the following 使用复选框形式展示，但设置为只读（disabled属性）。
    - 建议在页面顶部显示标题 "Download and Print Quick Guides"。
    - 打印方法和折叠方法的说明文本应清晰易读，可使用列表或步骤形式展示。
4.  **性能优化**：
    - 文件下载使用独立的API端点，避免阻塞主页面加载。
    - 若文件较大，可考虑添加下载进度提示。
5.  **文件存储说明**：
    - Volvo 3P Quick Guides文件应存储在服务器指定目录
    - 文件名建议使用英文，避免中文乱码问题
    - 文件格式建议使用PDF，确保跨平台兼容性

---
