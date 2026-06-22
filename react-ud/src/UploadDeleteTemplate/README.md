# UploadDeleteTemplate 页面说明

## 功能概述
HDoc模板上传删除页面（Upload Delete Template Page）用于管理HDoc模板文件的上传和删除操作。该页面支持选择并上传模板文件到指定市场文件夹，从指定市场文件夹删除模板文件，并提供模板检查链接跳转功能。

## 主要功能

### 1. 页面初始化
- 调用API获取可用的市场列表
- 将市场列表填充到Upload区域和Delete区域的Market下拉列表中
- Templates下拉列表初始化为空或禁用状态
- 清空错误消息和成功消息区域

### 2. HDoc Template Upload区域

#### 输入字段
- **Template File**：文件选择输入框，用于选择要上传的模板文件
- **Market**：市场选择下拉列表，显示可用的市场选项

#### Upload file按钮
- 用户选择文件和市场后点击Upload file按钮
- 前端校验：检查是否选择了文件
  - 若未选择文件，显示错误消息"NO FILE UPLOADED"
- 构建FormData对象，包含文件和market参数
- 调用文件上传API（POST方法）
- 成功：显示成功消息"TEMPLATE XXX WAS SUCESSFULLY UPLOADED TO MARKET JPN"
- 失败：显示相应错误消息

### 3. HDoc Template Delete区域

#### 输入字段
- **Market**：市场选择下拉列表，数据来源MARKET_MASTER表的MARKET字段
- **Templates**：模板选择下拉列表，根据所选市场动态加载该市场文件夹下的文件名

#### 市场选择联动
- 用户在Delete区域的Market下拉列表中选择市场
- 自动调用API获取该市场文件夹下的模板文件列表
- 将文件列表填充到Templates下拉列表中
- 若该市场下无文件，显示"No templates available"

#### Delete按钮
- 用户选择市场和模板后点击Delete按钮
- 前端校验：检查是否选择了市场和模板
  - 若未选择，显示错误消息"Please select market and template."
- 显示确认对话框"Do you really want to delete template?"
  - 若用户点击取消，终止流程
  - 若用户点击确认，继续执行
- 调用文件删除API（POST方法）
- 成功：显示成功消息"TEMPLATE XXX WAS SUCESSFULLY DELETE FROM MARKET JPN"，并刷新Templates下拉列表
- 失败：显示相应错误消息

### 4. Check Template链接
- 显示为蓝色可点击链接："Check Template (Only for rtf files)"
- 点击跳转到/HDocTemplateCheck路由
- 仅适用于rtf文件检查

## 技术实现

### 技术栈
- React + TypeScript
- React Hooks (useState, useEffect)
- React Router (useNavigate)
- Fetch API进行HTTP请求
- FormData用于文件上传

### 状态管理
- `loading`: API加载状态
- `error`: 错误消息内容
- `successMessage`: 成功消息内容
- `uploadMarketList`: Upload区域的市场列表
- `deleteMarketList`: Delete区域的市场列表
- `selectedUploadMarket`: Upload区域选中的市场代码
- `selectedDeleteMarket`: Delete区域选中的市场代码
- `templatesList`: 模板文件列表
- `selectedTemplate`: 选中的模板文件名
- `selectedFile`: 选中的上传文件对象

### API接口

#### 1. 获取市场列表API
- Method: GET
- Endpoint: /api/template/markets
- 功能：获取可用的市场列表
- 响应：JSON数组，包含marketCode和marketName

#### 2. 获取模板文件列表API
- Method: GET
- Endpoint: /api/template/files/{marketCode}
- 功能：根据市场代码获取该市场文件夹下的模板文件列表
- 路径参数：marketCode（市场代码）
- 响应：JSON数组，包含fileName和filePath

#### 3. 文件上传API
- Method: POST
- Endpoint: /api/template/upload
- 功能：上传模板文件到指定市场文件夹
- 请求格式：multipart/form-data
- 请求参数：file（文件对象）、market（市场代码）
- 特殊处理：验证文件类型和大小

#### 4. 文件删除API
- Method: POST
- Endpoint: /api/template/delete
- 功能：从指定市场文件夹删除模板文件
- 请求格式：JSON对象
- 请求参数：market（市场代码）、fileName（文件名）
- 特殊处理：验证文件和路径存在性

### 路由配置
- **路径**: /UploadDeleteTemplate
- **配置位置**: src/App.tsx
- **访问方式**: 直接访问或通过菜单导航

## 文件结构
```
src/UploadDeleteTemplate/
├── UploadDeleteTemplate.tsx    # 组件主文件
└── UploadDeleteTemplate.css    # 样式文件
```

## 数据处理流程

### 页面初始化
1. 调用获取市场列表API
2. 解析响应数据
3. 填充两个Market下拉列表
4. Templates下拉列表初始化为空

### 文件上传流程
1. 用户选择文件
2. 用户选择市场
3. 点击Upload file按钮
4. 前端校验文件是否选择
5. 构建FormData对象
6. 调用文件上传API
7. 处理响应结果

### 模板删除流程
1. 用户选择市场
2. 自动加载该市场下的模板文件列表
3. 用户选择模板
4. 点击Delete按钮
5. 前端校验市场和模板是否选择
6. 显示确认对话框
7. 用户确认后调用文件删除API
8. 成功后刷新Templates下拉列表

### 市场选择联动流程
1. 用户在Delete区域选择市场
2. 触发onChange事件
3. 调用获取模板文件列表API
4. 更新templatesList状态
5. 填充Templates下拉列表

## 错误处理

### 前端校验错误
- "NO FILE UPLOADED" - 未选择文件点击Upload
- "Please select market and template." - 未选择市场或模板点击Delete

### 后端API错误
- "Invalid file type or size" - 文件类型或大小无效（HTTP 400）
- "File not found" - 文件不存在（HTTP 404）
- "System error. Please contact administrator." - 系统错误（HTTP 500或其他）

### 确认对话框
- "Do you really want to delete template?" - 删除前的确认提示

### 成功消息
- "TEMPLATE XXX WAS SUCESSFULLY UPLOADED TO MARKET JPN" - 上传成功
- "TEMPLATE XXX WAS SUCESSFULLY DELETE FROM MARKET JPN" - 删除成功

## 样式特点
- 页面分为两个区域：HDoc Template Upload区域和HDoc Template Delete区域
- 两个区域用边框和背景色区分
- 区域标题清晰标识功能
- 错误消息红色背景显示
- 成功消息绿色背景显示
- 按钮颜色区分功能（Upload蓝色、Delete红色）
- Check Template链接蓝色显示
- 响应式设计，支持移动端
- 统一的配色方案

## 数据源说明

所有数据来源于以下数据源：

1. **MARKET_MASTER表** - 市场主数据表
   - 用途：获取市场列表
   - 操作类型：R（Read）
   - 关键字段：
     - MARKET：市场代码，字符串类型，最大长度3字符

2. **Market文件夹** - 市场模板文件夹
   - 用途：读取、上传、删除模板文件
   - 操作类型：R（Read）、C（Create）、D（Delete）
   - 文件命名规则：半角英字

## 待确认事项
1. 文件类型限制：允许上传的文件类型有哪些（rtf、docx等）
2. 文件大小限制：最大允许上传的文件大小
3. API的具体endpoint路径
4. HDoc Template Check页面的具体实现
5. Market文件夹的物理路径
6. 文件命名规则：上传的文件是否需要重命名

## 开发规范遵循
- ✅ 使用TypeScript类型定义
- ✅ 使用React Hooks进行状态管理
- ✅ 实时输入验证
- ✅ 清晰的错误处理
- ✅ 中文注释
- ✅ 符合项目代码规范
- ✅ 响应式CSS设计
- ✅ 确认对话框防止误删除

## 使用方法
1. 访问 /UploadDeleteTemplate 路由
2. 页面自动加载市场列表
3. 在Upload区域选择文件和市场，点击Upload file上传
4. 在Delete区域选择市场，自动加载该市场下的模板文件
5. 选择要删除的模板，点击Delete按钮
6. 确认删除操作
7. 点击Check Template链接跳转到模板检查页面

## 注意事项
- Upload file按钮需要先选择文件才能操作
- Delete按钮需要先选择市场和模板才能操作
- 删除操作前会显示确认对话框
- 删除成功后会自动刷新Templates下拉列表
- Market下拉列表显示格式：市场代码 - 市场名称
- Templates下拉列表显示文件名
- Check Template链接仅适用于rtf文件检查
