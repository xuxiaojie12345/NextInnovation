# Market Document Settings (UD20) - 主画面

## 模块说明

本模块是HDoc系统的市场文档设置主画面（Market Document Settings），用于输入文档类型并跳转到列表页面进行查询和选择。

## 功能特性

- 输入Document type（文档类型）
- Search按钮：验证输入后跳转到Market Document Settings List画面
- Clear按钮：清空输入框和错误信息
- Back按钮：返回前画面

## 样式特点

完全按照"20的前画面.png"的样式设计：
- 标题：蓝色粗体 "HDoc - Market Document Settings"
- 表单区域：带边框的容器，包含Document type输入框
- 按钮区域：浅灰色背景（#e8eef8），包含Search、Clear、Back三个按钮
- 输入框：白色背景，蓝色边框，最大宽度300px
- 错误提示：红色背景框显示错误信息

## 路由配置

路径：`/market-document-settings`

在App.tsx中已添加路由配置。

## 使用方式

1. 从其他页面导航到此画面
2. 在Document type输入框中输入文档类型（必填，最大20字符）
3. 点击Search按钮：
   - 若未输入内容，显示错误提示"Please enter a document type."
   - 若已输入，跳转到Market Document Settings List画面并传递搜索条件
4. 点击Clear按钮：清空输入框和错误信息
5. 点击Back按钮：直接返回前画面

## 数据流转

```
Market Document Settings (此画面)
    ↓ [Search]
Market Document Settings List (列表画面)
    ↓ [Select]
前画面（接收选中的文档信息）
```

## 注意事项

- Document type为必填字段
- 输入长度限制为20字符
- 输入时会自动清除错误提示
- 所有按钮均为标准样式，悬停时有颜色变化效果
