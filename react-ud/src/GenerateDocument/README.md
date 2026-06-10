# Generate Document (UD04) - 详细设计文档

## 1. 模块概述

### 1.1 模块名称
Generate document (生成文档)

### 1.2 模块编号
UD04

### 1.3 功能描述
本模块用于显示和下载车辆认证文档，主要功能包括：
- 显示指定底盘号的接收信息（OM、VDA、KOLA数据）
- 显示S-Note信息和轮胎主数据
- 显示ADCA变更状态，支持跳转到修改文档页面
- 显示VIN Plate参数和模板信息
- 提供文档下载功能
- 显示系统时间和程序版本信息

### 1.4 面向用户
需要查看和下载车辆认证文档的授权用户，如质量管理人员、文档管理员等

## 2. 技术栈

- **前端框架**: React 18 + TypeScript
- **路由管理**: react-router-dom
- **样式**: CSS3
- **API通信**: Fetch API
- **后端接口**: Spring Boot REST API

## 3. 文件结构

```
react-ud/src/GenerateDocument/
├── GenerateDocument.tsx      # 主组件
├── GenerateDocument.css      # 样式文件
└── index.tsx                 # 模块入口文件
```

## 4. 组件说明

### 4.1 GenerateDocument组件

#### 4.1.1 主要功能
- 页面初始化时调用API获取底盘相关的所有信息
- 显示OM、VDA、KOLA接收数据
- 根据ADCA变更状态显示不同的链接样式和功能
- 提供文档下载功能
- 提供跳转到其他页面的链接功能
- 显示系统时间和程序版本

#### 4.1.2 状态管理
```typescript
interface DocumentData {
  serie: string;              // Chassis series
  chnr: string;               // Chassis no
  model: string;              // Model
  spec: string;               // Spec week
  ordernumber: string;        // Ordernumber
  build: string;              // Build week
  customerAdap: string;       // S-Note NO
  countryOfOperation: string; // Market
  loadIndex: string;          // Load Index
  act: string;                // ADCA变更状态 (Y/N)
  variable: string;           // Replacing parameters
  newval: string;             // New value
  template: string;           // Using template
  generatedFilePath: string;  // Generated document path
  serverTime: string;         // Server time
  programVersion: string;     // Program version
}
```

#### 4.1.3 主要方法

| 方法名 | 说明 | 参数 | 返回值 |
|--------|------|------|--------|
| fetchDocumentData | 获取文档数据 | 无 | Promise<void> |
| handleDownloadDocument | 处理文档下载 | 无 | void |
| handleModifyDocument | 跳转到修改文档页面 | 无 | void |
| handleAnalyzeRules | 跳转到分析规则页面 | 无 | void |

### 4.2 API接口

#### UD04SelectGeneratedocumentApi

**功能**: 根据底盘号查询并返回所有相关的文档信息和数据

**Method**: GET

**Endpoint**: `/api/UD04/selectGeneratedocument`

**Request Parameters**:
- `chassisNo`: 底盘号（字符串类型，最大长度10字符，必填）

**Response Success (200)**:
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "serie": "JPCT",
    "chnr": "013945",
    "model": "IDO",
    "spec": "201617",
    "ordernumber": "15101319",
    "build": "2016173",
    "customerAdap": "S1810111",
    "countryOfOperation": "IDO",
    "loadIndex": "FTLI-150",
    "act": "Y",
    "variable": "AXLE_CONF",
    "newval": "New Value",
    "template": "_eu/VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.trf",
    "generatedFilePath": "/path/to/file.trf",
    "serverTime": "2022-12-06 07:30:31",
    "programVersion": "4.2.1"
  }
}
```

**Response Error (404)**:
```json
{
  "message": "Chassis not found"
}
```

**Response Error (500)**:
```json
{
  "message": "Internal server error"
}
```

## 5. 画面项目定义

| No. | 項目名 | 種別 | 必須 | MaxLength | I/O | 許容文字 | 文字配置 | 初期値 | 表示制御 | 备注 |
|-----|--------|------|------|-----------|-----|----------|----------|--------|----------|------|
| 1 | Chassis series | Label | - | 5 | Output | - | 左 | - | - | 底盘系列号，从HDOC_REC_DATA_OM表获取SERIE字段 |
| 2 | Chassis no | Label | - | 10 | Output | - | 左 | - | - | 底盘编号，从HDOC_REC_DATA_OM表获取CHNR字段 |
| 3 | Model | Label | - | 50 | Output | - | 左 | - | - | 车型，从HDOC_REC_DATA_OM表获取MODEL字段 |
| 4 | Spec week | Label | - | 10 | Output | - | 左 | - | - | 规格周次，从HDOC_REC_DATA_OM表获取SPEC字段 |
| 5 | Market | Label | - | 10 | Output | - | 左 | - | - | 市场，从HDOC_REC_DATA_VDA_GENERAL表获取COUNTRY_OF_OPERATION字段 |
| 6 | Master Market | Label | - | - | Output | - | 左 | -EU | - | 主市场，固定显示为"-EU" |
| 7 | S-Note NO | Label | - | 4000 | Output | - | 左 | - | - | S-Note编号，从HDOC_REC_DATA_OM表获取CUSTOMER_ADAP字段 |
| 8 | S-Note Message | Label | - | 256 | Output | - | 左 | - | 条件显示 | S-Note消息，若存在S-Note信息则固定显示"The S-Notes above can affect homologation documents."，红色显示 |
| 9 | Load Index | Label | - | 10 | Output | - | 左 | - | - | 载重指数，从HDOC_REC_DATA_KOLA_TIRE_MASTER表获取LOAD_INDEX字段 |
| 10 | Analyze Rules | Link | - | 10 | Output | - | 左 | - | 活性 | 分析规则链接，点击可查看分析规则详情 |
| 11 | Modify Doc Link | Link | - | 1 | Output | - | 左 | - | 条件显示 | ADCA变更激活时显示"After def change detected. Document need to be modified."，文字显示为红色，点击跳转到Modify Document页面 |
| 12 | Using template | Label | - | 20 | Output | - | 左 | - | - | 使用的模板，显示VPPS VIN PLATE创建批处理的Template信息 |
| 13 | Replacing parameters | Label | - | 40 | Output | - | 左 | - | 条件显示 | 替换参数，从HDOC_ADCA_MODIFICATION表获取VARIABLE和NEWVAL字段 |
| 14 | Generated document | Link | - | - | Output | - | 左 | - | 活性 | 已生成文档链接，点击下载VPPS VIN PLATE创建批处理生成的.trf文件 |
| 15 | Date | Label | - | 20 | Output | - | 左 | - | - | 当前时间，显示服务器时间，格式为"YYYY-MM-DD HH:MM:SS" |
| 16 | HDoc version | Label | - | 20 | Output | - | 左 | - | - | 程序版本，显示当前程序版本号 |
| 17 | Error message area | Label | - | - | Output | - | 左 | - | - | 错误消息区域，显示系统错误或提示信息 |

## 6. 业务逻辑

### 6.1 页面初始化流程

1. 页面加载时，从URL参数或localStorage获取底盘号
2. 调用UD04SelectGeneratedocumentApi API获取底盘相关的所有信息
3. API返回成功后，将数据显示到对应的标签字段
4. 若ADCA变更状态为激活状态（ACT="Y"），Modify Doc Link显示为红色并启用点击功能
5. 若发生错误，在Error message area区域显示错误消息

### 6.2 ADCA变更状态判断流程

1. 从API返回数据中读取ACT字段值
2. 若ACT为激活状态（"Y"）：
   - Modify Doc Link文字颜色设置为红色
   - 显示提示信息"After def change detected. Document need to be modified."
   - 启用链接点击事件，点击后跳转到/modify-document路由
   - 从API返回数据中获取VARIABLE和NEWVAL字段，显示在Replacing parameters区域
3. 若ACT为非激活状态（"N"）：
   - Modify Doc Link不显示
   - 不显示提示信息
   - Replacing parameters区域显示为空

### 6.3 文档下载流程

1. 用户点击Generated document链接
2. 触发浏览器下载功能
3. 请求VPPS VIN PLATE创建批处理生成的.trf文件
4. 文件路径从API返回数据中获取
5. 浏览器自动下载文件到本地
6. 文件名包含底盘号和文档类型信息

## 7. 异常处理

| 异常场景 | 处理方式 | Message显示内容 |
|---------|---------|----------------|
| 网络连接失败 | 捕获网络异常，显示通用错误消息 | "System error. Please contact administrator." |
| API超时 | 设置超时时间（建议10秒），超时后显示错误 | "System error. Please contact administrator." |
| API返回404 | 显示底盘号不存在消息 | "Chassis not found" |
| API返回500 | 显示系统错误消息 | "System error. Please contact administrator." |
| JSON解析失败 | 捕获解析异常，显示系统错误 | "System error. Please contact administrator." |
| 未预期的JavaScript错误 | 使用try-catch包裹关键代码，记录错误日志，显示系统错误 | "System error. Please contact administrator." |
| 用户未登录 | 检查会话状态，跳转到登录页面 | "Please login first" |
| 文件下载失败 | 捕获下载异常，显示文件不存在消息 | "Document file not found" |

## 8. 样式规范

### 8.1 颜色规范
- **标题颜色**: #000080（深蓝色）
- **边框颜色**: #000080（深蓝色，2px）
- **错误提示颜色**: #ff0000（红色）
- **链接颜色**: #0000ff（蓝色）
- **链接悬停颜色**: #0000cc（深蓝色）
- **警告消息颜色**: #ff0000（红色）

### 8.2 字体规范
- **字体家族**: Arial, sans-serif
- **标题字号**: 20px
- **正文内容字号**: 14px
- **错误消息字号**: 14px

### 8.3 布局规范
- **容器内边距**: 15px
- **信息组间距**: 8px
- **最小高度**: 500px

## 9. 使用说明

### 9.1 前置条件
- 用户已成功登录系统
- 用户已从Generate Homologation Document页面提交搜索条件
- 底盘号已保存在localStorage或通过URL参数传递

### 9.2 操作步骤

1. **访问页面**
   - 从Generate Homologation Document页面点击Submit按钮
   - 或直接访问 `/generate-document?chassisNo={底盘号}`

2. **查看文档信息**
   - 页面自动加载并显示底盘相关的所有信息
   - 查看OM、VDA、KOLA接收数据
   - 查看S-Note信息和轮胎主数据
   - 查看ADCA变更状态（如有）

3. **下载文档**
   - 点击"Generated document"链接
   - 浏览器自动下载.trf文件

4. **修改文档（如需要）**
   - 若ADCA变更状态为激活状态，会显示红色的警告消息
   - 点击"Modify Doc"链接跳转到修改文档页面

5. **查看分析规则**
   - 点击"Analyze Rules"链接
   - 在新窗口中打开分析规则详情页面

### 9.3 注意事项
- 若底盘号不存在，会显示"Chassis not found"错误消息
- 若发生系统错误，会显示"System error. Please contact administrator."错误消息
- S-Note信息存在时，会显示红色的提示消息
- ADCA变更激活时，Modify Doc链接显示为红色并可点击

## 10. 路由配置

在`App.tsx`中添加以下路由配置：

```typescript
import GenerateDocument from "./GenerateDocument/GenerateDocument";

// ...

<Route
  path='/generate-document'
  element={<GenerateDocument />}
/>
```

## 11. 依赖关系

### 11.1 上游模块
- **Login**: 用户登录认证
- **Menu**: 菜单导航
- **GenerateHomologationDocument**: 生成同源性文档（UD03）

### 11.2 下游模块
- **ModifyDocument**: 修改文档（待开发）
- **AnalyzeRules**: 分析规则（待开发）

### 11.3 后端依赖
- **UD04SelectGeneratedocumentApi**: 获取文档数据API

## 12. 测试要点

### 12.1 功能测试
- [ ] 页面初始化时正确显示底盘信息
- [ ] ADCA变更激活时正确显示红色警告和可点击链接
- [ ] ADCA变更非激活时不显示警告和链接
- [ ] 文档下载功能正常工作
- [ ] 跳转到Modify Document页面功能正常
- [ ] 跳转到Analyze Rules页面功能正常
- [ ] 系统时间和版本号正确显示

### 12.2 异常测试
- [ ] 底盘号不存在时显示正确错误消息
- [ ] 网络错误时显示正确错误消息
- [ ] API返回500时显示正确错误消息
- [ ] 文件下载失败时显示正确错误消息

### 12.3 兼容性测试
- [ ] Chrome浏览器
- [ ] Firefox浏览器
- [ ] Edge浏览器
- [ ] Safari浏览器
- [ ] 移动端响应式布局

## 13. 更新日志

| 版本 | 日期 | 作者 | 更新内容 |
|------|------|------|----------|
| 1.0 | 2026-05-21 | System | 初始版本发布 |

## 14. 附录

### 14.1 数据库表结构

#### HDOC_REC_DATA_OM表
| 字段名 | 类型 | 说明 |
|--------|------|------|
| SERIE | VARCHAR(5) | 底盘系列号 |
| CHNR | VARCHAR(10) | 底盘编号 |
| MODEL | VARCHAR(50) | 车型 |
| SPEC | VARCHAR(10) | 规格周次 |
| CUSTOMER_ADAP | VARCHAR(4000) | 客户适配信息（S-Note编号） |
| ORDERNUMBER | VARCHAR(20) | 订单号 |
| BUILD | VARCHAR(10) | 构建周次 |

#### HDOC_REC_DATA_VDA_GENERAL表
| 字段名 | 类型 | 说明 |
|--------|------|------|
| COUNTRY_OF_OPERATION | VARCHAR(10) | 运营国家/市场 |

#### HDOC_REC_DATA_KOLA_TIRE_MASTER表
| 字段名 | 类型 | 说明 |
|--------|------|------|
| LOAD_INDEX | VARCHAR(10) | 载重指数 |

#### HDOC_ADCA_CHANGE表
| 字段名 | 类型 | 说明 |
|--------|------|------|
| ACT | VARCHAR(1) | 激活状态（Y/N） |

#### HDOC_ADCA_MODIFICATION表
| 字段名 | 类型 | 说明 |
|--------|------|------|
| VARIABLE | VARCHAR(40) | 变量名 |
| NEWVAL | VARCHAR(40) | 新值 |

### 14.2 相关文件
- [详细设计模板](../doc/内部設計模板.md)
- [UD03详细设计](../doc/work/詳細設計UD03.md)
- [API文档](../../api-ud/src/main/java/com/web/app/controller/UD03_API_DOCUMENTATION.md)
