# UD04 Generate Document 模块

## 功能说明

本模块根据前画面（UD03）传入的参数（Chassis series 和 Chassis no），展示 VIN Plate 生成的结果信息。

### 核心功能

- 显示车辆认证文档的生成结果
- 包括订单信息、构建信息、市场信息等
- 支持跳转到相关功能页面（Modify Document、Vehicle Specification等）
- 关键信息突出显示，条件性显示S-Note消息和Modify Doc链接

## 技术实现

### 组件文件

- **TypeScript组件**: `UD04_GenerateDocument.tsx`
- **样式文件**: `UD04_GenerateDocument.css`

### 状态管理

```typescript
interface GenerateDocumentState {
  chassisNo: string;                    // Chassis no（从前画面传入）
  ordernumber: string;                  // 订单号
  buildWeek: string;                    // 构建周
  specWeek: string;                     // 规格周
  market: string;                       // 市场
  masterMarket: string;                 // 主市场（固定显示"-EU"）
  sNoteNo: string;                      // S-Note编号
  sNoteMessage: string;                 // S-Note消息
  loadIndex: string;                    // 负载指数
  act: string;                          // AD-Change状态（Y/N）
  newval: string;                       // 新值
  variable: string;                     // 变量
  usingTemplate: string;                // 使用的模板
  replacingParameters: string;          // 替换参数
  date: string;                         // 日期
  hdocVersion: string;                  // HDoc版本
  message: string;                      // 错误消息
  isLoading: boolean;                   // 加载状态
}
```

### API接口

**接口地址**: GET `/api/ud04/getdocumentdata`

**请求参数** (URL参数):
```
/api/ud04/getdocumentdata?chassisSerie=ABC12&chassisNo=1234567890
```

**响应格式**:
```json
{
  "code": 200,
  "data": {
    "ordernumber": "ORD123456",
    "build": "2024-W01",
    "spec": "2024-W02",
    "countryOfOperation": "China",
    "loadIndex": "91",
    "act": "Y",
    "newval": "newValue",
    "variable": "variableName",
    "sNoteNo": "SN001"
  },
  "messageList": []
}
```

## 路由配置

在 `App.tsx` 中已配置路由：

```typescript
<Route path='/UD04' element={<UD04_GenerateDocument />} />
```

## 页面跳转

### 从UD03跳转过来

UD03通过navigate传递参数：

```typescript
navigate('/UD04', {
  state: {
    chassisSeries: trimmedChassisSeries,
    chassisNo: trimmedChassisNo,
    documentType: trimmedDocumentType,
  },
});
```

### 跳转到其他页面

1. **点击Chassis no Link** → 跳转到UD07 Vehicle Specification
2. **点击Modify Doc Link** → 跳转到UD05 Modify Document（仅当ACT="Y"时显示）
3. **点击Generated document Link** → 下载或查看生成的文档

## 校验规则

| No. | 检查时机 | 检查对象 | 检查条件 | 错误消息 |
|-----|---------|---------|---------|---------|
| 1 | API返回 | 认证结果 | Status != Success 或 Code != 200 | We can not get the data. Please try again. |

## 条件显示

1. **Modify Doc Link**: 仅当 `act="Y"` 时显示，使用红色字体
2. **S-Note Message**: 仅当 S-Note 数据存在时显示固定文本

## 用户体验

- 加载期间显示loading动画
- 错误消息以红色背景显示 (#ff4d4f)
- Link使用蓝色下划线样式，hover时颜色变浅
- Modify Doc Link使用醒目的红色
- 响应式设计，支持移动端显示

## 样式隔离

所有CSS选择器都使用 `.ud04-container` 前缀，确保样式不会污染其他模块。

## 待完善功能

1. Generated document Link的下载/查看功能实现
2. Analyze Rules Link的功能实现
3. 后端API接口开发（`/api/ud04/getdocumentdata`）
