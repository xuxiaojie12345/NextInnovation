# UD03模块 - Select Hdoc Document List API

## 模块概述
UD03模块提供查询文档类型列表的功能，从HDOC_DOCUMENT_LIST表中检索所有DOCTYPE字段值并返回给前端，用于填充下拉选择框。

## 架构设计

### 1. 目录结构
```
api-ud/src/main/java/com/web/app/
├── controller/
│   └── UD03SelectHdocdocumentlistController.java    # 控制器层
├── service/
│   ├── UD03SelectHdocdocumentlistService.java       # 服务接口
│   └── impl/
│       └── UD03SelectHdocdocumentlistServiceImpl.java # 服务实现
├── mapper/
│   └── HdocDocumentListMapper.java                  # 数据访问接口
└── domain/
    ├── UD03SelectHdocdocumentlistRequest.java       # 请求对象（无参数）
    └── UD03SelectHdocdocumentlistResponse.java      # 响应数据对象

api-ud/src/main/resources/mapper/
└── HdocDocumentListMapper.xml                       # MyBatis映射文件
```

### 2. 调用流程
```
前端 (React) 
  ↓ POST /api/UD03/selectHdocdocumentlist
控制器层 (UD03SelectHdocdocumentlistController)
  ↓ 接收POST请求
服务层 (UD03SelectHdocdocumentlistServiceImpl)
  ↓ 业务逻辑处理
数据访问层 (HdocDocumentListMapper)
  ↓ 执行SQL查询
数据库 (MySQL) - HDOC_DOCUMENT_LIST表
  ↓ 返回DOCTYPE列表
服务层 → 控制器层 → 前端
```

## API接口说明

### 接口信息
- **路径**: `/api/UD03/selectHdocdocumentlist`
- **方法**: POST
- **Content-Type**: application/json
- **请求参数**: 无

### 请求示例
```javascript
fetch('http://localhost:8081/api/UD03/selectHdocdocumentlist', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
```

### 响应格式
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "doctypeList": [
      "VIN Plate",
      "VP_XML2(With weights)",
      "COC",
      "TYPE_APPROVAL"
    ]
  }
}
```

### 响应字段说明
| 字段名 | 类型 | 说明 |
|--------|------|------|
| code | Integer | 响应码 (200: 成功, 500: 系统错误) |
| msg | String | 响应消息 |
| data | Object | 响应数据对象 |
| data.doctypeList | Array<String> | 文档类型列表 |

### 错误响应示例

#### 系统错误 (500)
```json
{
  "code": 500,
  "msg": "System error. Please contact administrator.",
  "data": null
}
```

## 数据库设计

### 涉及的表
**HDOC_DOCUMENT_LIST** - 文档类型列表配置表

### 查询SQL
```sql
SELECT DOCTYPE 
FROM HDOC_DOCUMENT_LIST
```

### 表结构说明
| 字段名 | 类型 | 说明 |
|--------|------|------|
| DOCTYPE | VARCHAR | 文档类型名称 |

## 业务逻辑

### 处理流程
1. 接收前端POST请求（无需参数）
2. 调用Service层的selectHdocdocumentlist方法
3. Service层调用Mapper执行数据库全表查询
4. 判断查询结果:
   - 无数据: 返回空列表（不视为错误）
   - 有数据: 封装为UD03SelectHdocdocumentlistResponse对象
5. 记录查询日志（时间、IP、操作人等）
6. 构建标准响应体返回给前端

### 特殊处理
- 即使查询结果为空，也返回成功响应（code: 200），只是doctypeList为空数组
- 这样前端可以根据实际情况显示"暂无数据"或使用备用数据

## 前端集成

### React组件调用示例
```typescript
const fetchDocumentTypeList = async () => {
  try {
    const API_BASE_URL = "http://localhost:8081";
    const response = await fetch(
      `${API_BASE_URL}/api/UD03/selectHdocdocumentlist`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.code === 200 && data.data?.doctypeList) {
      // 处理成功响应，将字符串数组转换为选项对象数组
      const options = data.data.doctypeList.map((type: string) => ({
        value: type,
        label: type,
      }));
      setDocumentTypeList(options);
      
      // 默认选中第一个选项
      if (options.length > 0) {
        setDocumentType(options[0].value);
      }
    } else {
      // 使用备用数据
      setFallbackDocumentTypes();
    }
  } catch (error) {
    console.error("Failed to fetch document type list:", error);
    // API调用失败时，使用备用数据
    setFallbackDocumentTypes();
  }
};
```

### 备用数据机制
当API调用失败时，前端应提供备用数据确保功能可用：
```typescript
const setFallbackDocumentTypes = () => {
  const fallbackTypes = [
    "VIN_PLATE",
    "COC",
    "TYPE_APPROVAL",
    "HOMOLOGATION_CERTIFICATE",
  ];
  
  const options = fallbackTypes.map((type: string) => ({
    value: type,
    label: type,
  }));
  
  setDocumentTypeList(options);
};
```

## 日志说明

### 日志级别
- **INFO**: 记录正常业务流程（请求接收、查询成功、数据条数等）
- **WARN**: 记录警告信息（未找到数据等）
- **ERROR**: 记录系统错误（异常堆栈信息）

### 日志示例
```
========== UD03 Controller: Received POST request ==========
========== UD03 Select Hdocdocumentlist Start ==========
Query successful - Found 4 document types
Document types: [VIN Plate, VP_XML2(With weights), COC, TYPE_APPROVAL]
========== UD03 Select Hdocdocumentlist End ==========
Response code: 200, msg: 查询成功
Document type count: 4
========== UD03 Controller: Request completed ==========
```

## 注意事项

1. **跨域配置**: Controller已添加`@CrossOrigin(origins = "*")`注解，允许跨域访问
2. **请求方式**: 虽然无参数，但使用POST而非GET，符合RESTful规范中"查询操作可能改变状态"的语义
3. **空数据处理**: 查询结果为空时仍返回成功响应，前端需自行判断列表是否为空
4. **性能优化**: 建议对HDOC_DOCUMENT_LIST表建立索引或缓存机制，因为此接口可能被频繁调用
5. **安全性**: 实际部署时应限制跨域来源，避免使用通配符"*"

## 开发规范

1. 所有接口统一使用ApiResponse封装响应
2. 成功响应code为200，失败响应使用对应的HTTP状态码
3. 所有业务异常应在Service层捕获并转换为标准响应
4. 关键业务操作必须记录日志
5. 无参数的POST请求也应保持完整的分层架构
6. SQL查询使用MyBatis XML方式，便于维护和优化

## 测试用例

### 正常场景
- 表中有数据：返回包含doctypeList的成功响应
- 表中无数据：返回doctypeList为空数组的成功响应

### 异常场景
- 数据库连接失败：返回500错误
- SQL执行异常：返回500错误

### 性能测试
- 大量数据（1000+条）：验证响应时间和内存占用
- 并发请求：验证线程安全性和数据库连接池配置
