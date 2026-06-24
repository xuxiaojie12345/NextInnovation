# 菜单模块 (Menu Module) 详细设计说明书

| 文档编号     | DES-MENU-UD02         | 版本号     | v1.1       |
| :----------- | :-------------------- | :--------- | :--------- |
| **模块名称** | 菜单画面 (Menu Screen) | **作成日** | 2022-11-21 |
| **作成者**   | UD 刘 / UD 李         | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块是HDoc系统的主菜单页面，负责根据登录用户的权限动态显示对应的功能菜单列表。用户通过点击菜单项导航到相应的功能页面。

- **目标**：为用户提供清晰的导航入口，确保只显示用户有权限访问的功能。
- **安全性**：基于用户权限动态过滤菜单项，无权限功能不显示。
- **用户体验**：采用分级菜单结构，支持Generate、Admin、User Administration、Documentation四大分类，便于用户快速定位所需功能。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各输入输出项的详细定义如下：

| 項目名 (Item)                                                 | 種別 (Type) | 必須 (Req) | MaxLength |  I/O   | 許容文字 (Allowed Chars) | 文字配置 (Align) | 初期値 (Default) | 表示制御 (Control) | 备注                              |
| :------------------------------------------------------------ | :---------- | :--------: | :-------: | :----: | :----------------------- | :--------------: | :--------------: | :----------------: | :-------------------------------- |
| **Generate >> Generate Doc**                                  | Link        |     -      |     -     | Action | -                        |    左 (Left)     |        -         |   活性 (Enabled)   | 仅显示有权限的用户                |
| **Admin >> Update user defined variables (rules)**            | Link        |     -      |     -     | Action | -                        |    左 (Left)     |        -         |   活性 (Enabled)   | 仅显示有权限的用户                |
| **Admin >> Existing HDoc variables**                          | Link        |     -      |     -     | Action | -                        |    左 (Left)     |        -         |   活性 (Enabled)   | 仅显示有权限的用户                |
| **Admin >> Upload/Delete template**                           | Link        |     -      |     -     | Action | -                        |    左 (Left)     |        -         |   活性 (Enabled)   | 仅显示有权限的用户                |
| **Admin >> List available templates**                         | Link        |     -      |     -     | Action | -                        |    左 (Left)     |        -         |   活性 (Enabled)   | 仅显示有权限的用户                |
| **Admin >> VPPS Vin plate**                                   | Link        |     -      |     -     | Action | -                        |    左 (Left)     |        -         |   活性 (Enabled)   | 仅显示有权限的用户                |
| **Admin >> AD/CA Change**                                     | Link        |     -      |     -     | Action | -                        |    左 (Left)     |        -         |   活性 (Enabled)   | 仅显示有权限的用户                |
| **User Administration >> HDoc User Administration**           | Link        |     -      |     -     | Action | -                        |    左 (Left)     |        -         |   活性 (Enabled)   | 仅显示有权限的用户                |
| **User Administration >> HDoc User Doc Administration**       | Link        |     -      |     -     | Action | -                        |    左 (Left)     |        -         |   活性 (Enabled)   | 仅显示有权限的用户                |
| **User Administration >> Search User**                        | Link        |     -      |     -     | Action | -                        |    左 (Left)     |        -         |   活性 (Enabled)   | 仅显示有权限的用户                |
| **Documentation >> User Guide**                               | Link        |     -      |     -     | Action | -                        |    左 (Left)     |        -         |   活性 (Enabled)   | 仅显示有权限的用户                |
| **Message**                                                   | Label       |     -      |    256    | Output | 任意可见字符             |    左 (Left)     |    空 (Empty)    |      动态显示      | 仅在无权限时显示警告消息          |

> **注**：
> - **菜单层级结构**：
>   ```
>   Generate
>     └── Generate Doc
>   
>   Admin
>     ├── Update user defined variables (rules)
>     ├── Existing HDoc variables
>     ├── Upload/Delete template
>     ├── List available templates
>     ├── VPPS Vin plate
>     └── AD/CA Change
>   
>   User Administration
>     ├── HDoc User Administration
>     ├── HDoc User Doc Administration
>     └── Search User
>   
>   Documentation
>     └── User Guide
>   ```
> - **版本变更**：v1.1已删除"Change Password"功能

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

所有校验逻辑均在页面加载时执行。

### 3.1 处理流程

1.  **开始**：页面加载事件触发。
2.  **前置处理**：从localStorage或sessionStorage获取当前登录用户的userID。
3.  **API 调用 (Backend Check)**：
    - 调用 `GetUserPermissionsApi(userID)` 获取用户权限列表。
4.  **结果处理**：
    - **成功**：
      - 根据返回的权限列表，动态渲染有权限的菜单项。
      - 无权限的菜单项不显示（隐藏）。
    - **失败**：
      - 若用户无任何权限：显示 `YOU (XXXXXXXX) ARE NOT AUTHORIZED TO ACCESS THIS PAGE` 错误消息。
      - 若其他错误：显示具体错误消息。
5.  **菜单点击处理**：
    - 用户点击菜单链接后，导航到对应的功能页面。

### 3.2 校验详细规格表

| No. |   检查时机   |       检查对象       |                  检查条件                   |                          错误消息 (Message Content)                           |    错误级别    |                 动作                 |
| :-: | :----------: | :------------------: | :-----------------------------------------: | :---------------------------------------------------------------------------: | :------------: | :----------------------------------: |
|  1  |  页面初始化  | 用户功能权限表 (HDOC_FUNCTION_AUTH) | 用户无任何可用权限 |                     `YOU (XXXXXXXX) ARE NOT AUTHORIZED TO ACCESS THIS PAGE`                     |    Warning     | 显示 Message，隐藏所有菜单项 |
|  2  |  API 响应   |    Auth Result    |  `Status != Success` OR `Code == 401/403`  | `System error. Please contact administrator.` |     Error      | 显示 Message，隐藏所有菜单项 |

## 4. 接口定义 (API Specification)

### 4.1 GetUserPermissionsApi

- **功能**：获取当前登录用户的功能权限列表。
- **Method**: `GET`
- **Endpoint**: `/api/menu/getpermissions`

#### Request Params

```json
{
  "userId": "string (从登录状态获取)"
}
```

#### Response Success (200 OK)

```json
{
  "success": true,
  "message": "获取权限成功",
  "data": {
    "userId": "user001",
    "permissions": [
      "generate_doc",
      "admin_update_variables",
      "admin_existing_variables",
      "admin_upload_template",
      "admin_list_templates",
      "admin_vpps_vin_plate",
      "admin_ad_ca_change",
      "user_admin_hdoc_user",
      "user_admin_hdoc_user_doc",
      "user_admin_search_user",
      "documentation_user_guide"
    ]
  }
}
```

##### 权限代码映射表

| 权限代码                      | 对应菜单项                                      |
| :---------------------------- | :---------------------------------------------- |
| `generate_doc`                | Generate >> Generate Doc                        |
| `admin_update_variables`      | Admin >> Update user defined variables (rules)  |
| `admin_existing_variables`    | Admin >> Existing HDoc variables                |
| `admin_upload_template`       | Admin >> Upload/Delete template                 |
| `admin_list_templates`        | Admin >> List available templates               |
| `admin_vpps_vin_plate`        | Admin >> VPPS Vin plate                         |
| `admin_ad_ca_change`          | Admin >> AD/CA Change                           |
| `user_admin_hdoc_user`        | User Administration >> HDoc User Administration |
| `user_admin_hdoc_user_doc`    | User Administration >> HDoc User Doc Administration |
| `user_admin_search_user`      | User Administration >> Search User              |
| `documentation_user_guide`    | Documentation >> User Guide                     |

#### Response Error (401/403 Unauthorized)

```json
{
  "success": false,
  "message": "YOU (user001) ARE NOT AUTHORIZED TO ACCESS THIS PAGE",
  "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景                 | 处理方式           | Message 显示内容                               |
| :----------------------- | :----------------- | :--------------------------------------------- |
| **用户无任何权限**       | API返回403错误     | `YOU (XXXXXXXX) ARE NOT AUTHORIZED TO ACCESS THIS PAGE` |
| **网络断开/超时**        | 捕获 Network Error | `Network error or server unavailable. Please try again later.` |
| **服务器内部错误 (500)** | 捕获 Server Error  | `System error. Please contact administrator.`  |
| **未登录或Token过期**    | 前端拦截           | 自动跳转到登录页面                             |

## 6. 实现注意事项 (Implementation Notes)

1.  **状态管理**：
    - 使用 React State 管理 `permissions`, `menuItems`, `errorMessage`, `isLoading`。
    - 页面加载时从localStorage获取当前登录用户的userID。
    - 根据permissions数组动态过滤并渲染menuItems。
2.  **安全性**：
    - 所有菜单项的显示必须基于后端返回的权限列表，严禁仅在前端硬编码隐藏。
    - API 请求必须携带有效的认证Token。
3.  **UI 细节**：
    - 菜单采用分级折叠/展开结构，每个大类（Generate、Admin等）可独立展开/收起。
    - 菜单链接使用蓝色下划线样式，hover时改变颜色或添加背景色以提供视觉反馈。
    - `Message` Label 默认隐藏，仅在无权限或出错时显示，文字颜色建议使用红色 (`#ff4d4f` 或 `#c62828`)。
    - 若用户有部分权限，只显示有权限的菜单项，无权限项完全不渲染（而非禁用）。
    - 建议在页面顶部显示当前登录用户名，例如："Welcome, XXXXXXXX"。
4.  **性能优化**：
    - 权限数据可在登录时一并获取并缓存，避免每次进入菜单页都调用API。
    - 使用React.memo优化菜单项组件，避免不必要的重渲染。

---
