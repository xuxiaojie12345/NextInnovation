# Menu 模块实现说明

## 📁 文件结构

```
react-ud/src/Menu/
├── Menu.tsx          # Menu 组件主文件
├── Menu.css          # Menu 组件样式文件
├── menu.png          # Menu 画面参考图片
├── Menu_内部設計書.md  # Menu 内部设计文档
└── Menu_ドキュメント.txt # Menu 需求文档
```

## ✨ 功能特性

### 1. 菜单分类
Menu 画面包含四大类菜单功能：

#### 📄 Generate Document（文档生成）
- Generate>>Generate Doc

#### ⚙️ Admin（管理功能）
- Admin>>Update user defined variables (rules)
- Admin>>Existing HDoc variables
- Admin>>Upload/Delete template
- Admin>>List available templates
- Admin>>VPPS Vin plate
- Admin>>AD/CA Change

#### 👥 User Administration（用户管理）
- User Administration>>HDoc User Administration
- User Administration>>HDoc User Doc Administration
- User Administration>>Search User
- User Administration>>Change Password

#### 📚 Documentation（文档说明）
- Documentation>>User Guide

### 2. 技术实现

#### 前端技术栈
- **框架**: React + TypeScript
- **路由**: react-router-dom (useNavigate, useLocation)
- **样式**: CSS3 (Flexbox 布局)

#### 核心功能
- ✅ 菜单项按分类分组显示
- ✅ 点击菜单项跳转到对应路由
- ✅ 显示登录用户信息（从 Login 页面传递或 localStorage 获取）
- ✅ 响应式设计，支持移动端
- ✅ Hover 效果和交互反馈

### 3. 样式特点

- **渐变背景**: 紫色渐变背景 (#667eea → #764ba2)
- **卡片式布局**: 白色圆角卡片，带阴影效果
- **分类标题**: 蓝色下划线分隔，清晰醒目
- **菜单链接**: 
  - 默认蓝色文字 (#1890ff)
  - Hover 时浅蓝背景 + 右移动画
  - Active 时深蓝背景
- **用户信息**: 右上角显示欢迎信息

## 🔗 路由配置

需要在 `App.tsx` 中添加以下路由配置：

```typescript
import Menu from "./Menu/Menu";

// 在 Routes 中添加
<Route path='/Menu' element={<Menu />} />

// 后续需要添加的子页面路由
<Route path="/generate/doc" element={<GenerateDoc />} />
<Route path="/admin/update-variables" element={<UpdateVariables />} />
<Route path="/admin/hdoc-variables" element={<HDocVariables />} />
<Route path="/admin/template-management" element={<TemplateManagement />} />
<Route path="/admin/list-templates" element={<ListTemplates />} />
<Route path="/admin/vpps-vin-plate" element={<VPPSVinPlate />} />
<Route path="/admin/ad-ca-change" element={<ADCAChange />} />
<Route path="/user-admin/hdoc-user-admin" element={<HDocUserAdmin />} />
<Route path="/user-admin/hdoc-doc-admin" element={<HDocDocAdmin />} />
<Route path="/user-admin/search-user" element={<SearchUser />} />
<Route path="/user-admin/change-password" element={<ChangePassword />} />
<Route path="/documentation/user-guide" element={<UserGuide />} />
```

## 🎯 使用流程

1. **登录成功后**自动跳转到 Menu 页面
2. **查看菜单**：所有菜单项按分类组织显示
3. **点击菜单项**：跳转到对应的功能页面
4. **用户信息**：右上角显示当前登录的 UserID

## 📱 响应式设计

- **桌面端**：最大宽度 800px，居中显示
- **平板/手机**：自适应宽度，调整字体大小和间距

## 🔧 扩展建议

### 1. 权限控制
可以根据用户角色动态显示/隐藏菜单项：

```typescript
const filteredMenus = menuItems.filter(item => {
  // 根据用户角色过滤
  return hasPermission(item.path, userRole);
});
```

### 2. 国际化支持
使用 i18next 实现多语言：

```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
// 使用: {t('menu.generate')}
```

### 3. 菜单配置化
将菜单数据抽取到独立的配置文件：

```typescript
// menuConfig.ts
export const MENU_CONFIG = [
  { id: 1, label: "...", path: "...", category: "..." },
  // ...
];
```

## 📝 注意事项

1. **路由路径**：确保所有菜单项的路由已在 App.tsx 中配置
2. **用户信息**：通过 location.state 或 localStorage 获取 UserID
3. **样式定制**：可根据实际需求调整颜色、字体等样式
4. **图标支持**：如需添加图标，可引入 @mui/icons-material 或 antd icons

## 🚀 测试要点

- [ ] 所有 12 个菜单项正确显示
- [ ] 菜单项按分类正确分组
- [ ] 点击菜单项能正确跳转
- [ ] Hover 效果正常
- [ ] 响应式布局在不同设备上正常显示
- [ ] 用户信息显示正确

---

**创建日期**: 2026-05-14  
**版本**: v1.0
