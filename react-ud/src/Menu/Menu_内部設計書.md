# Menu 画面内部详细设计书

## 1. 文档概述

### 1.1 背景
Menu 画面是系统的主菜单导航页面，为用户提供系统各功能模块的入口。用户登录成功后进入此页面，通过点击不同的菜单项跳转到相应的功能页面。

### 1.2 目的
本文档旨在详细描述 Menu 画面的功能设计、参数定义、处理逻辑和技术实现方案，为开发人员提供清晰的开发指导。

### 1.3 适用范围
本文档适用于 Menu 画面的设计、开发和测试阶段。

---

## 2. 功能概要

Menu 画面提供以下四大类菜单功能：

### 2.1 Generate Document（文档生成）
- Generate>>Generate Doc

### 2.2 Admin（管理功能）
- Admin>>Update user defined variables (rules)
- Admin>>Existing HDoc variables
- Admin>>Upload/Delete template
- Admin>>List available templates
- Admin>>VPPS Vin plate
- Admin>>AD/CA Change

### 2.3 User Administration（用户管理）
- User Administration>>HDoc User Administration
- User Administration>>HDoc User Doc Administration
- User Administration>>Search User
- User Administration>>Change Password

### 2.4 Documentation（文档说明）
- Documentation>>User Guide

---

## 3. 参数定义

### 3.1 菜单项参数列表

| No | 项目名 | 种别 | 必须 | MaxLength | 数据元_表格 | 数据元_项目 | I/O | 许容文字 | 文字配置 | 初期值 | 表示制御 |
|----|--------|------|------|-----------|-------------|-------------|-----|----------|----------|--------|----------|
| 1 | Generate>>Generate Doc | Link | - | - | - | - | Input | - | 左 | - | 活性 |
| 2 | Admin>>Update user defined variables (rules) | Link | - | - | - | - | Input | - | 左 | - | 活性 |
| 3 | Admin>>Existing HDoc variables | Link | - | - | - | - | Input | - | 左 | - | 活性 |
| 4 | Admin>>Upload/Delete template | Link | - | - | - | - | Input | - | 左 | - | 活性 |
| 5 | Admin>>List available templates | Link | - | - | - | - | Input | - | 左 | - | 活性 |
| 6 | Admin>>VPPS Vin plate | Link | - | - | - | - | Input | - | 左 | - | 活性 |
| 7 | Admin>>AD/CA Change | Link | - | - | - | - | Input | - | 左 | - | 活性 |
| 8 | User Administration>>HDoc User Administration | Link | - | - | - | - | Input | - | 左 | - | 活性 |
| 9 | User Administration>>HDoc User Doc Administration | Link | - | - | - | - | Input | - | 左 | - | 活性 |
| 10 | User Administration>>Search User | Link | - | - | - | - | Input | - | 左 | - | 活性 |
| 11 | User Administration>>Change Password | Link | - | - | - | - | Input | - | 左 | - | 活性 |
| 12 | Documentation>>User Guide | Link | - | - | - | - | Input | - | 左 | - | 活性 |

### 3.2 参数说明

#### 3.2.1 项目名
- **说明**：菜单项显示的名称，采用"分类>>功能名"的格式
- **用途**：在界面上展示给用户，标识菜单功能

#### 3.2.2 种别（Link）
- **说明**：所有菜单项均为链接类型
- **用途**：点击后跳转到对应的功能页面

#### 3.2.3 必须（-）
- **说明**：菜单项不涉及必填验证

#### 3.2.4 MaxLength（-）
- **说明**：菜单项不涉及长度限制

#### 3.2.5 数据元（-）
- **说明**：菜单项不从数据库获取数据

#### 3.2.6 I/O（Input）
- **说明**：用户输入操作（点击）

#### 3.2.7 许容文字（-）
- **说明**：无特殊字符限制

#### 3.2.8 文字配置（左）
- **说明**：菜单项文本左对齐显示

#### 3.2.9 初期值（-）
- **说明**：菜单项无初始值

#### 3.2.10 表示制御（活性）
- **说明**：所有菜单项默认为激活状态，可点击

---

## 4. 处理逻辑

### 4.1 初始化处理

#### 4.1.1 处理时机
- 用户登录成功后进入 Menu 画面时

#### 4.1.2 处理内容
1. 加载菜单组件
2. 渲染所有菜单项（12个菜单项）
3. 按分类组织菜单结构
4. 设置所有菜单项为激活状态

#### 4.1.3 处理流程
```
开始
  ↓
加载 Menu 组件
  ↓
初始化菜单数据结构
  ↓
渲染菜单列表
  ↓
显示所有菜单项（激活状态）
  ↓
结束
```

### 4.2 菜单点击处理

#### 4.2.1 处理时机
- 用户点击任意菜单项时

#### 4.2.2 处理内容
1. 捕获点击事件
2. 识别被点击的菜单项
3. 执行路由跳转
4. 导航到对应的功能页面

#### 4.2.3 处理流程
```
开始
  ↓
用户点击菜单项
  ↓
触发 onClick 事件
  ↓
获取菜单项对应的路由路径
  ↓
执行路由跳转
  ↓
导航到目标页面
  ↓
结束
```

#### 4.2.4 菜单项与路由映射

| 序号 | 菜单项 | 建议路由路径 |
|------|--------|--------------|
| 1 | Generate>>Generate Doc | /generate/doc |
| 2 | Admin>>Update user defined variables (rules) | /admin/update-variables |
| 3 | Admin>>Existing HDoc variables | /admin/hdoc-variables |
| 4 | Admin>>Upload/Delete template | /admin/template-management |
| 5 | Admin>>List available templates | /admin/list-templates |
| 6 | Admin>>VPPS Vin plate | /admin/vpps-vin-plate |
| 7 | Admin>>AD/CA Change | /admin/ad-ca-change |
| 8 | User Administration>>HDoc User Administration | /user-admin/hdoc-user-admin |
| 9 | User Administration>>HDoc User Doc Administration | /user-admin/hdoc-doc-admin |
| 10 | User Administration>>Search User | /user-admin/search-user |
| 11 | User Administration>>Change Password | /user-admin/change-password |
| 12 | Documentation>>User Guide | /documentation/user-guide |

---

## 5. 画面布局

### 5.1 整体布局结构

```
┌─────────────────────────────────────┐
│          Menu 画面                   │
├─────────────────────────────────────┤
│                                     │
│  ┌─ Generate Document ─────────┐   │
│  │ • Generate>>Generate Doc    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─ Admin ─────────────────────┐   │
│  │ • Update user defined       │   │
│  │   variables (rules)         │   │
│  │ • Existing HDoc variables   │   │
│  │ • Upload/Delete template    │   │
│  │ • List available templates  │   │
│  │ • VPPS Vin plate            │   │
│  │ • AD/CA Change              │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─ User Administration ───────┐   │
│  │ • HDoc User Administration  │   │
│  │ • HDoc User Doc             │   │
│  │   Administration            │   │
│  │ • Search User               │   │
│  │ • Change Password           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─ Documentation ─────────────┐   │
│  │ • User Guide                │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 5.2 样式规范

#### 5.2.1 分类标题样式
- **字体大小**：18px
- **字体粗细**：bold
- **颜色**：#333333
- **间距**：上下各 10px

#### 5.2.2 菜单项样式
- **字体大小**：14px
- **颜色**：#1890ff（默认）、#40a9ff（hover）
- **对齐方式**：左对齐
- **内边距**：8px 16px
- **光标**：pointer
- **装饰**：无下划线

#### 5.2.3 容器样式
- **最大宽度**：800px
- **居中显示**：margin: 0 auto
- **背景色**：#ffffff
- **内边距**：20px
- **圆角**：4px
- **阴影**：0 2px 8px rgba(0, 0, 0, 0.1)

---

## 6. 技术实现

### 6.1 组件结构

```
Menu.tsx
├── 导入依赖
│   ├── React
│   ├── react-router-dom (useNavigate)
│   └── CSS 样式文件
├── 数据结构定义
│   └── menuItems 数组
├── 事件处理函数
│   └── handleMenuClick
└── JSX 渲染
    ├── 页面标题
    └── 菜单列表
        ├── 分类标题
        └── 菜单项链接
```

### 6.2 数据结构

#### 6.2.1 菜单项接口定义

```typescript
interface MenuItem {
  id: number;
  label: string;
  path: string;
  category: string;
}
```

#### 6.2.2 菜单数据示例

```typescript
const menuItems: MenuItem[] = [
  {
    id: 1,
    label: "Generate>>Generate Doc",
    path: "/generate/doc",
    category: "Generate Document"
  },
  {
    id: 2,
    label: "Admin>>Update user defined variables (rules)",
    path: "/admin/update-variables",
    category: "Admin"
  },
  // ... 其他菜单项
];
```

### 6.3 事件处理

#### 6.3.1 菜单点击处理函数

```typescript
const handleMenuClick = (path: string) => {
  navigate(path);
};
```

### 6.4 路由配置

需要在 `App.tsx` 中配置对应的路由：

```typescript
<Route path="/generate/doc" element={<GenerateDoc />} />
<Route path="/admin/update-variables" element={<UpdateVariables />} />
// ... 其他路由
```

---

## 7. Check 项

### 7.1 功能检查
- [ ] 所有 12 个菜单项正确显示
- [ ] 菜单项按分类正确分组
- [ ] 点击菜单项能正确跳转到对应页面
- [ ] 所有菜单项处于激活状态

### 7.2 UI 检查
- [ ] 菜单项文本左对齐
- [ ] 分类标题清晰可见
- [ ] hover 效果正常
- [ ] 响应式布局正常

### 7.3 兼容性检查
- [ ] Chrome 浏览器正常显示
- [ ] Firefox 浏览器正常显示
- [ ] Safari 浏览器正常显示

---

## 8. API 调用

本画面无需调用后端 API。

---

## 9. 注意事项

### 9.1 路由配置
- 确保所有菜单项对应的路由已在 `App.tsx` 中正确配置
- 路由路径应与菜单项的 path 属性保持一致

### 9.2 权限控制
- 当前设计所有菜单项均为激活状态
- 如需根据用户角色控制菜单显示，需后续扩展权限控制逻辑

### 9.3 国际化支持
- 当前菜单项使用英文显示
- 如需支持多语言，建议使用 i18next 进行国际化配置

### 9.4 可扩展性
- 菜单数据结构采用数组形式，便于后续增删菜单项
- 建议将菜单配置抽取到独立的配置文件，便于维护

---

## 10. 修订历史

| 版本 | 日期 | 修订内容 | 修订人 |
|------|------|----------|--------|
| 1.0 | 2026-05-13 | 初始版本创建 | - |

---

**文档结束**
