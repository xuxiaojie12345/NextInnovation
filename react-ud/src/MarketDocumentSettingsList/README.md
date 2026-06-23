# Market Document Settings List (UD20)

## 模块说明

本模块用于展示HDoc系统的市场文档设置列表（Market Document Settings List）。

## 功能特性

- 显示文档类型、业务单元、注册用户和注册日期等信息
- 支持单选选择记录
- Select按钮：选择记录并返回前画面，自动填充选中的文档信息
- Back按钮：返回前画面
- Print按钮：打印当前页面
- User列链接：点击跳转到EDB用户查看页面

## 样式特点

完全按照20.png的样式设计：
- 标题：蓝色粗体 "HDoc - Market Document Settings"
- 按钮区域：浅灰色背景，包含Select、Back、Print三个按钮
- 表格：带边框，表头浅蓝色背景
- 行样式：偶数行浅蓝色背景（#e8eef8），奇数行白色背景
- RadioBox：每行一个单选框，位于第一列
- 链接：User列的链接为蓝色下划线样式

## API接口

### GET /api/ud20/getdocumentlist

获取市场文档设置列表

**响应示例：**
```json
{
  "code": 200,
  "msg": "获取文档列表成功",
  "data": [
    {
      "doctype": "COC_EUB1",
      "description": "xxx",
      "registerUser": "user001",
      "registerDatetime": "2026-05-25 10:30:00"
    }
  ]
}
```

## 路由配置

路径：`/market-document-settings-list`

在App.tsx中已添加路由配置。

## 使用方式

1. 从其他页面导航到此页面
2. 页面加载时自动调用API获取文档列表
3. 用户通过RadioBox选择一条记录
4. 点击Select按钮返回前画面并传递选中的数据
5. 点击Back按钮直接返回前画面
6. 点击Print按钮打印页面内容
7. 点击User链接查看用户详细信息

## 注意事项

- Bussines unit列固定显示'VBC'
- User列为空或为"-"时不显示链接
- 未选择记录时点击Select会显示错误提示"No data found"
- 所有数据均为只读展示
