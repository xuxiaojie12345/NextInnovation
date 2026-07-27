# HDoc Template Check 模块详细设计说明书

| 文档编号     | DES-HDoc Template Check-013 | 版本号     | v1.0       |
| :----------- | :-------------------------- | :--------- | :--------- |
| **模块名称** | HDoc Template Check         | **作成日** | 2026-07-17 |
| **作成者**   | GitHub Copilot              | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块为 HDoc Template Check 对应功能页面，核心目标是支持用户指定 Template 文件后点击 Check 按钮完成文件内容校验，读取 Template 文件内容，提取两个 `$` 符号之间包含的变量内容，统计文件内的变量总个数，校验完成后支持用户直接下载已完成检查的 Template 结果文件。

- **目标**：支持用户完成「选择文件 → 点击校验 → 下载结果」三步操作，实现 Template 文件的变量校验与结果导出。
- **安全性**：无额外特殊安全性要求，需保证文件读取操作的权限可控，避免非法文件访问导致系统异常，所有文件解析过程需在本地沙箱内完成，禁止将用户上传的 Template 文件流出至外部非授权路径。
- **用户体验**：
  - 页面所有控件默认处于激活可用状态。
  - 校验触发后如存在异常场景，将立即展示对应明确的错误信息引导用户修正操作。
  - 整体操作链路精简，无多余冗余步骤。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| No. | 项目名 (Item) | 种类 (Type) | 必须 (Req) | MaxLength | I/O | 允许字符 (Allowed Chars) | 文字对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注 |
| :-: | :------------ | :---------- | :--------: | :-------: | :-: | :----------------------- | :--------------: | :--------------: | :----------------: | :--- |
| 1 | **Template File** | File Input | - | - | Input | - | 左 (Left) | 空 (Empty) | 活性 (Enabled) | 支持用户选择本地的 Template 文件 |
| 2 | **Check** | Button | - | - | Action | - | 左 (Left) | - | 活性 (Enabled) | 点击触发文件校验流程 |
| 3 | **Download checked template** | Link | - | - | Output | - | 左 (Left) | - | 活性 (Enabled) | 校验成功后激活，点击下载检查后的结果文件 |
| 4 | **Message** | Label | - | - | Output | - | 左 (Left) | - | 动态显示 | 用于页面各类错误提示信息的展示区域 |

> **注**：
>
> - **Template File**：文件输入控件，通过文件选择对话框选取本地 Template 文件。
> - **Download checked template**：校验成功后保持激活状态，用户点击后触发文件下载。
> - **Message**：默认隐藏，仅在出错时显示对应错误消息，文字颜色建议使用红色（`#ff4d4f`）。

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

#### 3.1.1 初始化显示

页面可正常完成加载展示，所有控件均处于激活可用状态，Template File 输入框默认内容为空，无额外默认值预填充，Message 区域默认隐藏。

#### 3.1.2 校验操作：[用户点击 Check 按钮触发]

**开始**：用户点击 Check 按钮触发校验流程。

**空值校验 (Frontend Check)**：

1. **Template File 空值检查**：
   - 若用户未选中任何 Template 文件直接按下 Check 按钮：
     - 设置 `Message` = `ERROR: Unable to access file!`
     - **终止**当前校验流程，停留在当前页面等待用户重新操作。

2. **Template 文件内容解析**：
   - 系统尝试读取已选择的 Template 文件内容。
   - 提取两个 `$` 符号之间的所有内容（即 `$...$` 格式的变量）。
   - 统计得到 Template 文件内的变量总个数。
   - 若 Template 文件内不存在任何符合规则的变量（统计得到的变量总个数为 0）：
     - 设置 `Message` = `ERROR: The file content is incorrect!`
     - **终止**当前校验流程，停留在当前页面等待用户重新上传符合要求的文件。

#### 3.1.3 API 调用 (Backend Check)

无后端 API 调用，所有校验逻辑均在客户端（前端）本地完成。

#### 3.1.4 结果处理

- **成功**：系统完成 Template 文件全量校验，Download checked template 链接保持激活状态，用户点击该链接即可直接下载已完成检查的 Template 结果文件。
- **失败**：返回对应系统异常错误提示，中断后续操作流程，页面保留用户本次选中的文件路径信息供用户重试。

### 3.2 校验详细规格表

| No. | 检查时机 | 检查对象 | 检查条件 | 错误消息 (Message Content) | 动作 |
| :-: | :------- | :------- | :------- | :------------------------- | :--- |
| 1 | 用户点击 Check 按钮时 | Check 控件 | 用户未选中任何 Template 文件，直接触发 Check 按钮点击事件 | `ERROR: Unable to access file!` | 页面显示对应错误提示，立即中断后续文件读取和校验流程，保留当前页面所有控件状态，等待用户重新选择文件后再次发起校验 |
| 2 | 用户点击 Check 按钮，系统成功读取 Template 文件内容完成解析后 | Check 控件 | Template 文件内不存在任何由两个 `$` 符号包裹的有效变量，统计得到的变量总个数为 0 | `ERROR: The file content is incorrect!` | 页面显示对应错误提示，立即终止后续校验流程，提示用户检查上传的 Template 文件内容是否符合规则，等待用户重新上传合规文件后重试校验 |

## 4. 接口定义 (API Specification)

无后端 API 调用。本模块所有处理逻辑均在前端本地完成，不涉及与后端服务的交互。

## 5. 异常处理 (Exception Handling)

| 异常场景 | 处理方式 | Message 显示内容 |
| :------- | :------- | :--------------- |
| 文件读取过程中发生系统异常（如文件格式不支持、文件损坏等） | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.` |
| 接口调用超时或返回系统内部错误 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.` |

## 6. 实现注意事项 (Implementation Notes)

1. **状态管理**：
   - 使用 React State 管理 `selectedFile`（选中的文件对象）、`checkResult`（校验结果）、`downloadUrl`（下载链接）、`message`（错误消息）、`isLoading`（加载状态）。
   - `Message` Label 默认隐藏（内容为空时不占位或高度为 0）。
   - `Download checked template` 链接默认激活可用，用户点击后执行文件下载逻辑。

2. **文件读取与解析**：
   - 使用 `FileReader` API 读取用户选择的 Template 文件内容。
   - 使用正则表达式 `/\$([^$]+)\$/g` 提取两个 `$` 符号之间的所有变量内容。
   - 统计匹配到的变量总个数作为校验依据。

3. **校验结果文件生成**：
   - 校验完成后，将原始 Template 文件内容附加校验结果信息（如变量总个数等）生成新的结果文件。
   - 使用 `Blob` 和 `URL.createObjectURL()` 生成下载链接，供用户下载。

4. **UI 细节**：
   - Check 按钮在 `isLoading` 期间应设为 `disabled` 状态，防止重复提交。
   - `Message` 文字颜色建议使用红色（`#ff4d4f`）以起到警示作用。
   - 错误提示展示后，用户重新选择文件或再次点击 Check 时，应自动清除上一次的错误消息。

5. **安全性**：
   - 所有文件解析过程在本地浏览器沙箱内完成。
   - 禁止将用户上传的 Template 文件内容发送至外部非授权路径。
   - 文件读取操作需限制文件类型，建议仅允许 `.txt`、`.docx`、`.template` 等文本或模板格式文件。

---
