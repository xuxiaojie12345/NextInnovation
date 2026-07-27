# 菜单模块 (Menu Module) 详细设计说明书

| 文档编号     | DES-Menu-002          | 版本号     | v1.0       |
| :----------- | :-------------------- | :--------- | :--------- |
| **模块名称** | Menu                  | **作成日** | 2026-07-09 |
| **作成者**   | GitHub Copilot        | **状态**   | 正式稿     |

## 1. 背景 (Background)

本模块是 HDOC 系统菜单画面，为登录用户提供进入系统各功能页面的统一入口。

- **目标**：基于登录注册用户的权限，动态展示对应可访问的功能菜单链接，实现菜单的精准权限过滤，仅向用户开放其有权限操作的功能项，保障系统功能访问的合规性与便捷性。
- **安全性要求**：必须严格执行权限校验逻辑，注册用户不具备权限的功能不得在菜单中展示。
- **用户体验**：所有菜单链接统一左对齐展示，页面布局整齐易读；所有可访问的菜单链接默认保持激活状态，用户点击即可直接跳转对应功能页面，操作路径简洁流畅。

## 2. 画面参数定义 (Screen Parameters)

### 2.1 控件属性表

根据需求，各菜单项的详细定义如下：

| No. | 项目名 (Item) | 种类 (Type) | 必须 (Req) | MaxLength | I/O | 允许字符 (Allowed Chars) | 字符对齐 (Align) | 初始值 (Default) | 显示控制 (Control) | 备注 |
| :-: | :------------ | :---------- | :--------: | :-------: | :-: | :----------------------- | :--------------: | :--------------: | :----------------: | :--- |
| 1 | Generate>>Generate Doc | Link | - | - | Input | - | 左 (Left) | - | 活性 (Enabled) | 仅拥有对应权限的用户可见 |
| 2 | Admin>>Update user defined variables (rules) | Link | - | - | Input | - | 左 (Left) | - | 活性 (Enabled) | 仅拥有对应权限的用户可见 |
| 3 | Admin>>Existing HDoc variables | Link | - | - | Input | - | 左 (Left) | - | 活性 (Enabled) | 仅拥有对应权限的用户可见 |
| 4 | Admin>>Upload/Delete template | Link | - | - | Input | - | 左 (Left) | - | 活性 (Enabled) | 仅拥有对应权限的用户可见 |
| 5 | Admin>>List available templates | Link | - | - | Input | - | 左 (Left) | - | 活性 (Enabled) | 仅拥有对应权限的用户可见 |
| 6 | Admin>>VPPS Vin plate | Link | - | - | Input | - | 左 (Left) | - | 活性 (Enabled) | 仅拥有对应权限的用户可见 |
| 7 | Admin>>AD/CA Change | Link | - | - | Input | - | 左 (Left) | - | 活性 (Enabled) | 仅拥有对应权限的用户可见 |
| 8 | User Administration>>HDoc User Administration | Link | - | - | Input | - | 左 (Left) | - | 活性 (Enabled) | 仅拥有对应权限的用户可见 |
| 9 | User Administration>>HDoc User Doc Administration | Link | - | - | Input | - | 左 (Left) | - | 活性 (Enabled) | 仅拥有对应权限的用户可见 |
| 10 | User Administration>>Search User | Link | - | - | Input | - | 左 (Left) | - | 活性 (Enabled) | 仅拥有对应权限的用户可见 |
| 11 | Documentation>>User Guide | Link | - | - | Input | - | 左 (Left) | - | 活性 (Enabled) | 仅拥有对应权限的用户可见 |

### 2.2 画面布局结构

```
┌──────────────────────────────────────────┐
│               VOLVO Logo                  │  ← 顶部标识区域
├──────────────────────────────────────────┤
│                                          │
│  Generate Document                       │  ← 分类标题
│   » Generate Doc                         │  ← 菜单项
│                                          │
│  Admin                                   │  ← 分类标题
│   » Update user defined variables (rules)│
│   » Existing HDoc variables              │
│   » Upload/Delete template               │
│   » List available templates             │
│   » VPPS Vin plate                       │
│   » AD/CA Change                         │
│                                          │
│  User Administration                     │  ← 分类标题
│   » HDoc User Administration             │
│   » HDoc User Doc Administration         │
│   » Search User                          │
│                                          │
│  Documentation                           │  ← 分类标题
│   » User Guide                           │
│                                          │
└──────────────────────────────────────────┘
```

## 3. 业务逻辑与校验规则 (Business Logic & Checks)

### 3.1 处理流程

#### 3.1.1 初始表示

画面正常表示。从用户功能权限表 `HDOC_FUNCTION_AUTH` 中获取当前登录注册用户的权限信息，基于获取到的权限数据筛选生成 Menu 菜单列表，仅展示用户持有对应权限的功能项，无权限的功能项不进行展示。

#### 3.1.2 触发条件：画面加载完成后自动触发权限校验逻辑

**全画面共通权限校验（Frontend Check）：**
- 若用户请求访问其未持有权限的功能页面：
  - 设置 `Message` = `YOU (XXXXXXXX) ARE NOT AUTHORIZED TO ACCESS THIS PAGE`
  - 终止流程，拦截跳转动作。

#### 3.1.3 API 调用（Backend Check）

调用 `GetUserPermissionsApi`，关联读取 `HDOC_FUNCTION_AUTH` 用户功能权限表，仅执行查询（R）操作获取用户权限数据。

#### 3.1.4 结果处理

- **成功**：返回当前用户的所有可访问权限菜单列表，正常渲染菜单画面。
- **失败**：返回权限校验警告提示 `YOU (XXXXXXXX) ARE NOT AUTHORIZED TO ACCESS THIS PAGE`。

### 3.2 校验详细规格表

| No. | 检查时机 | 检查对象 | 检查条件 | 错误消息 (Message Content) | 动作 |
| :-: | :------- | :------- | :------- | :------------------------- | :--- |
| 1 | 用户触发未授权功能访问事件时 | 用户权限（全画面共通） | 检测到用户尝试访问自身不持有操作权限的功能 | `YOU (XXXXXXXX) ARE NOT AUTHORIZED TO ACCESS THIS PAGE` | 弹出 Warning 级别警告提示，拦截当前页面跳转动作，停留在当前菜单画面 |

## 4. 接口定义 (API Specification)

### 4.1 GetUserPermissionsApi

- **功能**：根据当前登录用户标识，从用户功能权限表 `HDOC_FUNCTION_AUTH` 中查询该用户持有的所有功能操作权限，返回对应的可访问菜单列表。
- **Method**: `GET`
- **Endpoint**: `/api/ud02/GetUserPermissionsApi`

#### Request 参数

| 参数名 | 类型 | 必须 | 说明 |
| :----- | :--- | :--: | :--- |
| userId | string | Y | 当前登录用户标识 |

##### 请求示例

```
GET /api/ud02/GetUserPermissionsApi?userId=UD001
```

#### Response Success (200 OK)

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "permissions": [
      "Generate",
      "Admin",
      "User Administration",
      "Documentation"
    ]
  }
}
```

#### Response Error (403 Forbidden)

```json
{
  "code": 403,
  "message": "YOU (XXXXXXXX) ARE NOT AUTHORIZED TO ACCESS THIS PAGE",
  "data": null
}
```

## 5. 异常处理 (Exception Handling)

| 异常场景 | 处理方式 | Message 显示内容 |
| :------- | :------- | :--------------- |
| 访问无权限的功能页面 | 拦截跳转请求，抛出 Warning 级别警告 | `YOU (XXXXXXXX) ARE NOT AUTHORIZED TO ACCESS THIS PAGE` |
| 接口调用超时或返回系统内部错误 | 记录系统日志，提示用户联系管理员 | `System error. Please contact administrator.` |
| 未登录或Token过期 | 前端拦截 | 自动跳转到登录页面 |

## 6. 实现注意事项 (Implementation Notes)

1. **权限管理**：
   - 画面初始化时调用 `GetUserPermissionsApi` 获取当前用户权限列表。
   - 根据返回的权限数据动态渲染菜单项，无权限的功能项不予展示。
   - 用户点击菜单项跳转前，需进行前端权限校验，拦截未授权访问。

2. **状态管理**：
   - 使用 React State 管理 `permissions`（权限列表）、`menuItems`（可访问菜单项）、`message`（错误消息）。
   - `message` 在无错误时默认隐藏。

3. **路由导航**：
   - 建议菜单项与路由路径的映射关系如下：

| 序号 | 菜单项 | 建议路由路径 |
| :--: | :----- | :----------- |
| 1 | Generate>>Generate Doc | `/generate/doc` |
| 2 | Admin>>Update user defined variables (rules) | `/admin/update-variables` |
| 3 | Admin>>Existing HDoc variables | `/admin/hdoc-variables` |
| 4 | Admin>>Upload/Delete template | `/admin/template-management` |
| 5 | Admin>>List available templates | `/admin/list-templates` |
| 6 | Admin>>VPPS Vin plate | `/admin/vpps-vin-plate` |
| 7 | Admin>>AD/CA Change | `/admin/ad-ca-change` |
| 8 | User Administration>>HDoc User Administration | `/user-admin/hdoc-user-admin` |
| 9 | User Administration>>HDoc User Doc Administration | `/user-admin/hdoc-doc-admin` |
| 10 | User Administration>>Search User | `/user-admin/search-user` |
| 11 | Documentation>>User Guide | `/documentation/user-guide` |

4. **UI 细节**：
   - 所有菜单项统一左对齐展示。
   - 菜单项使用 `»` 符号作为前置标识。
   - 按功能分类（Generate、Admin、User Administration、Documentation）分组展示。
   - 错误提示使用 Warning 级别的样式进行展示。
