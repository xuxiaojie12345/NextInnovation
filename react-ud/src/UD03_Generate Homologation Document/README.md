# UD03 Generate Homologation Document 模块

## 功能说明

本模块用于根据用户输入的 Chassis series、Chassis no 和 Document type 数据，提交生成同质化认证文件。

### 核心功能
- ✅ 接收用户输入的车辆信息和文档类型
- ✅ 前端校验（必填、格式、长度）
- ✅ 默认显示上次输入的条件
- ✅ 提交成功后跳转到 UD04 Generate document 画面
- ✅ 支持 Reset 清空输入
- ✅ 支持 Help 跳转帮助页面

## 文件结构

```
UD03_Generate Homologation Document/
├── UD03_GenerateHomologationDocument.tsx    # React组件实现
├── UD03_GenerateHomologationDocument.css    # 样式文件
└── README.md                                 # 说明文档
```

## 技术栈

- **框架**: React 18
- **语言**: TypeScript
- **路由**: react-router-dom
- **HTTP客户端**: axios (统一配置在 `../api/config`)
- **样式**: 原生CSS

## 状态管理

```typescript
interface GenerateDocumentState {
  chassisSeries: string;        // Chassis series输入值
  chassisNo: string;            // Chassis no输入值
  documentType: string;         // Document type选择值
  documentTypeOptions: string[]; // Document type选项列表
  message: string;              // 错误消息
  isLoading: boolean;           // 加载状态
}
```

## API接口

### 获取Document type列表

- **接口地址**: GET `/api/ud03/getHdocDocumentList`
- **请求参数**: 无
- **响应格式**:
```json
{
  "code": 200,
  "data": {
    "doctype": ["DOCTYPE1", "DOCTYPE2", "DOCTYPE3"]
  },
  "messageList": []
}
```

## 校验规则

| 字段 | 必填 | 最大长度 | 允许字符 | 错误消息 |
|------|------|----------|----------|----------|
| Chassis series | ✅ | 5 | 半角英字 | Chassis series is required. |
| Chassis no | ✅ | 10 | 半角数字 | Chassis no is required. |
| Document type | ✅ | - | 下拉选择 | Document type is required. |

## 按钮功能

### Submit 按钮
1. 校验所有输入字段
2. 校验通过后缓存数据到localStorage
3. 跳转到 UD04 画面并传递参数

### Reset 按钮
1. 清空所有输入字段
2. 清除错误消息
3. 恢复到初始状态

### Help 按钮
1. 跳转到 UD24 HDoc Help 画面

## 使用示例

### 在 App.tsx 中引入

```typescript
import UD03_GenerateHomologationDocument from './UD03_Generate Homologation Document/UD03_GenerateHomologationDocument';

// 在Routes中添加
<Route path='/UD03' element={<UD03_GenerateHomologationDocument />} />
```

### 从其他页面跳转

```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/UD03');
```

## localStorage 数据

### 读取的数据
- `lastChassisSeries`: 上次输入的Chassis series
- `lastChassisNo`: 上次输入的Chassis no
- `lastDocumentType`: 上次选择的Document type

### 写入的数据
- 提交成功后会更新上述三个值

## 注意事项

1. **API依赖**: 需要后端提供 `/api/ud03/getHdocDocumentList` 接口
2. **路由配置**: 确保在 App.tsx 中配置了正确的路由
3. **axios配置**: 已使用统一的 apiClient，baseURL 指向 `http://localhost:8081`
4. **响应式设计**: 支持PC、平板、手机等多种设备

## 待完善项

1. 后端API接口开发（UD03SelectHdocdocumentlistApi）
2. 添加Loading动画效果
3. 优化用户体验（如添加确认对话框）
