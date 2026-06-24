# Menu组件说明

## 概述

Menu组件是系统的主菜单页面，提供各个功能模块的入口链接。用户通过点击不同的链接，可以迁移到对应的功能画面，实现系统的各项业务功能。

## 功能特性

- ✅ 所有功能链接清晰分类展示（Generate、Admin、User Administration、Documentation）
- ✅ 链接采用常表示方式，用户可随时访问
- ✅ 统一的左对齐布局，保持界面整洁
- ✅ 快速导航到各个功能模块，减少操作步骤
- ✅ PC端居左显示，支持响应式设计
- ✅ 仅已认证用户可以访问此页面

## 技术栈

- React 18 + React Hooks
- TypeScript
- 原生CSS
- react-router-dom（路由跳转）

## 项目结构

```
Menu/
├── Menu.tsx          # Menu组件主文件
├── Menu.css          # Menu组件样式文件
├── menu.png          # UI设计图
└── README.md         # 本说明文档
```

## 使用方法

### 在App.tsx中引入使用

```typescript
import Menu from './Menu/Menu';

// 在路由配置中使用
<Route path="/menu" element={<Menu />} />
```

### 从Login页面跳转

登录成功后，使用navigate跳转到Menu页面：

```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/menu');
```

## 菜单结构

严格按照**詳細設計UD02.md**中定义的16个项番实现：

### 项番1: Generate Document (Label - 分组标题)
主标题，显示为"Generate Document"

### 项番2: Generate (Label - 子分组标题)
#### 项番3: » Generate Doc (Link - Screen ID: 03)
- 路由: `/generate-document`
- 用途: 跳转到Generate Homologation Document画面

### 项番4: Admin (Label - 分组标题)
#### 项番5: » Update user defined variables (rules) (Link - Screen ID: 08)
- 路由: `/homologation-variables`
- 用途: 跳转到Homologation Variables画面

#### 项番6: » Existing HDoc variables (Link - Screen ID: 10)
- 路由: `/existing-hdoc-variables`
- 用途: 跳转到Existing HDoc Variables画面

#### 项番7: » Upload/Delete template (Link - Screen ID: 12)
- 路由: `/upload-delete-template`
- 用途: 跳转到Upload&Deletetemplate画面

#### 项番8: » List available templates (Link - Screen ID: 14)
- 路由: `/list-available-templates`
- 用途: 跳转到List availableTemplates画面

#### 项番9: » VPPS Vin plate (Link - Screen ID: 15)
- 路由: `/vin-plate`
- 用途: 跳转到Vin Plate画面

#### 项番10: » AD/CA Change (Link - Screen ID: 16)
- 路由: `/ad-ca-change`
- 用途: 跳转到AD Change画面

### 项番11: User Administration (Label - 分组标题)
#### 项番12: » HDoc User Administration (Link - Screen ID: 17)
- 路由: `/hdoc-user-admin`
- 用途: 跳转到HDoc User Admin画面

#### 项番13: » HDoc User Doc Administration (Link - Screen ID: 18)
- 路由: `/hdoc-user-doc-admin`
- 用途: 跳转到HDoc User Doc Administration画面

#### 项番14: » Search User (Link - Screen ID: 19)
- 路由: `/search-user`
- 用途: 跳转到Search User画面

### 项番15: Documentation (Label - 分组标题)
#### 项番16: » User Guide (Link - Screen ID: 24)
- 路由: `/user-guide`
- 用途: 跳转到HDoc Help画面

## 样式规范

- **主色调**: Volvo品牌色 (#003366)
- **背景色**: #f5f5f5
- **字体**: Arial, sans-serif
- **布局**: 所有项目在画面左侧显示
- **响应式**: 支持PC、平板、手机三个断点

## 安全要求

- 仅已认证用户可以访问此页面
- 各功能链接的访问权限需在后端进行验证
- 防止未授权用户直接访问受限功能

## 注意事项

1. 本组件默认导出，可直接在App.tsx中引入使用
2. 样式文件单独存放，不内嵌style
3. 所有代码均有完整的JSDoc注释
4. 无冗余代码和无效注释
5. 代码格式规范，符合前端开发规范
6. **严格按照詳細設計UD02.md中定义的16个项番实现**
7. **移除了多余的logout按钮和user信息**

## 参考文档

- [詳細設計UD02.md](./詳細設計UD02.md) - Menu画面详细设计书
- [menu.png](./menu.png) - UI设计图
