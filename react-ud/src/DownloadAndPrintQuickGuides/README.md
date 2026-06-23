# Download and Print Quick Guides 模块 (UD23)

## 概述

Download and Print Quick Guides模块提供快速指南文件的下载功能，文件内说明快速指南的打印方式与折页方法，为用户提供便捷的文档打印和折叠指导。该模块完全基于前端实现，不涉及后端API调用。

## 功能特性

- **快速指南缩略图展示**: 以网格形式展示8个快速指南文件的缩略图和下载链接
- **Volvo 3P Quick Guides**: 提供Volvo 3P系列快速指南的下载链接列表
- **返回导航**: 支持返回上一页功能
- **响应式布局**: 适配不同屏幕尺寸的设备

## 技术实现

### 组件结构

```
DownloadAndPrintQuickGuides/
── DownloadAndPrintQuickGuides.tsx      # React组件
└── DownloadAndPrintQuickGuides.css      # 样式文件
```

### 路由配置

- **路径**: `/DownloadAndPrintQuickGuides`
- **位置**: `App.tsx`中配置
- **访问方式**: 从HDoc Help页面点击"HDoc Quick Guide"链接进入

### 快速指南列表

#### 主快速指南（8个）

| ID | 名称 | 图片路径 |
|---|------|---------|
| wis | WIS Quick Guide | /images/quick-guides/wis.png |
| perf | PERF Quick Guide | /images/quick-guides/perf.png |
| w8 | W8 Quick Guide | /images/quick-guides/w8.png |
| hdoc | HDoc Quick Guide | /images/quick-guides/hdoc.png |
| edb | EDB Quick Guide | /images/quick-guides/edb.png |
| cos | COS Quick Guide | /images/quick-guides/cos.png |
| vbi-intranet | VBI Quick Guide (Intranet version) | /images/quick-guides/vbi-intranet.png |
| vbi-internet | VBI Quick Guide (Internet version) | /images/quick-guides/vbi-internet.png |

#### Volvo 3P Quick Guides（9个）

1. EDB Quick Guide
2. KRS Quick Guide
3. CVM Quick Guide
4. AVP Quick Guide
5. KAX Quick Guide
6. CAE Homepage Quick Guide
7. BPP Quick Guide
8. SPC Quick Guide
9. WebFRAME Quick Guide

## UI设计

### 样式特点

- **顶部栏**: 深蓝色背景 (#000080)，包含VOLVO标志
- **边框**: 浅蓝色边框 (#b4c7dc)，宽度2px
- **标题**: "Download and Print Quick Guides"使用橙色字体 (#ff6600)，粗体显示
- **Back链接**: 蓝色文字 (#0000ff)，带下划线
- **缩略图网格**: 
  - 桌面端：8列网格
  - 平板端：4列网格
  - 小屏幕：2列网格
  - 移动端：1列网格
- **链接**: 蓝色文字 (#0000ff)，带下划线，悬停时变为深蓝色 (#0000cc)
- **Volvo 3P标题**: 红色字体 (#cc0000)，粗体
- **说明文字**: 斜体黑色文字

### 响应式设计

支持多种设备显示：
- **≥1400px**: 8列网格布局
- **768px - 1400px**: 4列网格布局
- **480px - 768px**: 2列网格布局
- **<480px**: 单列布局

## 使用说明

### 访问方式

1. 登录系统后进入HDoc Help页面
2. 点击"HDoc Quick Guide"链接
3. 或直接访问 `/DownloadAndPrintQuickGuides` 路由

### 页面内容

#### 1. VOLVO Header
- 深蓝色背景条
- 左侧显示VOLVO标志

#### 2. 标题区域
- **Back按钮**: 点击返回上一页
- **页面标题**: "Download and Print Quick Guides"（橙色）

#### 3. 快速指南缩略图区
横向排列8个快速指南缩略图，每个包含：
- 缩略图图片（带边框）
- 下方蓝色可点击链接

#### 4. 说明文字
显示字体移除说明：
> (Note that the font Volvo Broad is removed from the Quick Guides because of problems)

#### 5. Volvo 3P Quick Guides
- 红色标题："Volvo 3P Quick Guides"
- 项目符号列表，包含9个指南链接

## 开发注意事项

### 无API依赖
本模块不涉及任何后端API调用，所有功能为纯前端实现。

### 图片资源管理
需要在 `public/images/quick-guides/` 目录下放置以下图片文件：
- wis.png
- perf.png
- w8.png
- hdoc.png
- edb.png
- cos.png
- vbi-intranet.png
- vbi-internet.png
- volvo-logo.png（VOLVO标志）
- placeholder-guide.png（占位符图片，用于图片加载失败时显示）

### 链接功能
当前所有链接的href设置为`#`并阻止默认行为，实际使用时需要：
1. 将真实文件URL添加到对应链接
2. 或使用download属性触发文件下载

示例：
```tsx
<a href="/files/wis-guide.pdf" download="WIS_Quick_Guide.pdf">
  WIS Quick Guide
</a>
```

### 样式定制
如需调整页面样式，请修改`DownloadAndPrintQuickGuides.css`文件，主要关注：
- `.volvo-header`: VOLVO头部样式
- `.page-title`: 页面标题样式
- `.guides-grid`: 缩略图网格布局
- `.guide-item`: 单个指南项样式
- `.volvo-3p-section`: Volvo 3P部分样式

## 测试要点

### 功能测试
- [ ] 页面正常加载显示
- [ ] Back按钮能正确返回上一页
- [ ] 所有缩略图正常显示
- [ ] 所有链接可点击
- [ ] 图片加载失败时显示占位符
- [ ] 响应式布局在不同设备上正常显示

### UI测试
- [ ] VOLVO深蓝色头部正确显示
- [ ] 橙色标题字体颜色和大小正确
- [ ] 缩略图网格布局符合设计要求
- [ ] 链接颜色和悬停效果正确
- [ ] Volvo 3P红色标题正确显示
- [ ] 说明文字斜体显示正确

### 兼容性测试
- [ ] Chrome浏览器
- [ ] Firefox浏览器
- [ ] Edge浏览器
- [ ] Safari浏览器
- [ ] 移动端设备（iOS、Android）

### 性能测试
- [ ] 页面加载速度符合要求
- [ ] 图片懒加载优化（如需要）
- [ ] 无内存泄漏

## 相关文件

- 组件: `react-ud/src/DownloadAndPrintQuickGuides/DownloadAndPrintQuickGuides.tsx`
- 样式: `react-ud/src/DownloadAndPrintQuickGuides/DownloadAndPrintQuickGuides.css`
- 路由: `react-ud/src/App.tsx`
- 详细设计: `react-ud/src/doc/work/詳細設計UD23.md`

## 版本历史

| 版本 | 日期 | 作者 | 说明 |
|-----|------|------|------|
| v1.0 | 2026-05-20 | AI Assistant | 初始版本创建 |
