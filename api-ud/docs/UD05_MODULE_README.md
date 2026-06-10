# UD05模块 - Modify Document API

## 模块概述
UD05模块提供修改文档的功能，包括初期表示时查询Variant信息和Save按钮压下时更新Modify信息。

## 架构设计

### 1. 目录结构
```
api-ud/src/main/java/com/web/app/
├── controller/
│   └── UD05ModifyDocumentController.java          # 控制器层
├── service/
│   ├── UD05ModifyDocumentService.java             # 服务接口
│   └── impl/
│       └── UD05ModifyDocumentServiceImpl.java     # 服务实现
├── mapper/
│   └── HdocAdcaModificationMapper.java            # 数据访问接口
└── domain/
    ├── UD05SelectModifydocumentRequest.java       # 请求对象（初期表示）
    ├── UD05ModifyDocumentSaveRequest.java         # 保存请求对象
    └── UD05ModifyDocumentResponse.java            # 响应数据对象

api-ud/src/main/resources/mapper/
└── HdocAdcaModificationMapper.xml                 # MyBatis映射文件
```

### 2. 调用流程

#### 初期表示流程
```
前端 (React) 
  ↓ GET /api/UD05/modifyDocumentUnit?chassisSeries=xxx&chassisNo=xxx
控制器层 (UD05ModifyDocumentController)
  ↓ 接收GET请求，提取参数
服务层 (UD05ModifyDocumentServiceImpl.getModifyDocument)
  ↓ 参数校验
数据访问层 (HdocAdcaModificationMapper.selectVariantInfo)
  ↓ 执行LEFT JOIN查询
数据库 (MySQL)
  ↓ 返回Variant信息列表
服务层 → 控制器层 → 前端
```

#### Save流程
```
前端 (React) 
  ↓ POST /api/UD05/modifyDocumentSave
控制器层 (UD05ModifyDocumentController)
  ↓ 接收POST请求，解析JSON
服务层 (UD05ModifyDocumentServiceImpl.saveModifyDocument)
  ↓ 参数校验
数据访问层 (HdocAdcaModificationMapper.updateNewval)
  ↓ 循环执行UPDATE语句
数据库 (MySQL)
  ↓ 更新HDOC_ADCA_MODIFICATION表
服务层 → 控制器层 → 前端
```

## API接口说明

### 接口1：初期表示 - 查询Variant信息

#### 接口信息
- **路径**: `/api/UD05/modifyDocumentUnit`
- **方法**: GET
- **Content-Type**: application/json

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| chassisSeries | String | 是 | Chassis series (4位) | jpct |
| chassisNo | String | 是 | Chassis no | 028321 |

#### 请求示例
```
GET http://localhost:8081/api/UD05/modifyDocumentUnit?chassisSeries=jpct&chassisNo=028321
```

#### 响应格式
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "market": "AUS",
    "template": "aus/UD_TEST.odt",
    "variables": [
      {
        "variable": "VIN",
        "description": "Vehicle Identification Number",
        "currentValue": "JPCYZ50A2LT028321",
        "newval": ""
      },
      {
        "variable": "VIN_TEXT2",
        "description": "Additional text on Eicher-Trucks VIN plate for VIPL",
        "currentValue": "VTA-050077",
        "newval": ""
      }
    ]
  }
}
```

### 接口2：Save按钮 - 更新Modify信息

#### 接口信息
- **路径**: `/api/UD05/modifyDocumentSave`
- **方法**: POST
- **Content-Type**: application/json

#### 请求体格式
```json
{
  "chassisSeries": "jpct",
  "chassisNo": "028321",
  "updateUser": "CURRENT_USER",
  "variables": [
    {
      "variable": "VIN",
      "newval": "NEW_VALUE_1"
    },
    {
      "variable": "VIN_TEXT2",
      "newval": "NEW_VALUE_2"
    }
  ]
}
```

#### 请求示例
```javascript
fetch('http://localhost:8081/api/UD05/modifyDocumentSave', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    chassisSeries: 'jpct',
    chassisNo: '028321',
    updateUser: 'user123',
    variables: [
      { variable: 'VIN', newval: 'NEW_VIN_VALUE' },
      { variable: 'SEAT_NO', newval: '5' }
    ]
  })
})
```

#### 响应格式
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": null
}
```

### 错误响应示例

#### 参数验证失败 (400)
```json
{
  "code": 400,
  "msg": "Chassis series is required.",
  "data": null
}
```

#### 数据未找到 (404)
```json
{
  "code": 404,
  "msg": "Chassis not found",
  "data": null
}
```

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
1. **HDOC_ADCA_MODIFICATION** - ADCA修改表（主表）
2. **HDOC_VARIABLES** - 变量定义表

### 查询SQL（初期表示）
```sql
SELECT
    b.VARIABLE AS variable,
    b.DESCRIPTION AS description,
    a.NEWVAL AS newval,
    a.NEWVAL AS currentValue
FROM
    HDOC_ADCA_MODIFICATION a
LEFT JOIN
    HDOC_VARIABLES b
ON
    a.VARIABLE = b.VARIABLE
WHERE
    a.SERIE = #{chassisSeries}
    AND a.CHNO = #{chassisNo}
```

### 更新SQL（Save按钮）
```sql
UPDATE HDOC_ADCA_MODIFICATION
SET 
    NEWVAL = #{newval},
    UPDATE_USER = #{updateUser},
    UPDATE_DATETIME = NOW()
WHERE 
    SERIE = #{chassisSeries}
    AND CHNO = #{chassisNo}
    AND VARIABLE = #{variable}
```

## 业务逻辑

### 参数校验规则

#### 初期表示校验
1. **Chassis series**:
   - 不能为空
   - 长度必须为4个字符
   - 只能包含字母和数字

2. **Chassis no**:
   - 不能为空
   - 长度不能超过10个字符
   - 只能包含字母和数字

#### Save按钮校验
1. **基础参数**: 同初期表示校验
2. **Variables列表**:
   - 不能为空
   - 每个VariableItem的variable字段不能为空
   - newval字段可以为空（表示不更新该字段）

### 处理流程

#### 初期表示流程
1. 接收前端GET请求，提取chassisSeries和chassisNo参数
2. 调用Service层的getModifyDocument方法
3. Service层进行参数校验
4. 校验通过后，调用Mapper执行LEFT JOIN查询
5. 判断查询结果:
   - 无数据: 返回空列表（不视为错误）
   - 有数据: 封装为UD05ModifyDocumentResponse对象
6. 记录查询日志
7. 构建标准响应体返回给前端

#### Save流程
1. 接收前端POST请求，解析JSON请求体
2. 调用Service层的saveModifyDocument方法
3. Service层进行参数校验
4. 校验通过后，遍历variables列表
5. 对每个有值的变量，调用Mapper执行UPDATE语句
6. 统计更新成功的记录数
7. 记录操作日志
8. 构建标准响应体返回给前端

## 前端集成

### React组件调用示例

#### 初期表示
```typescript
const fetchDocumentData = async (chassisNo: string) => {
  const chassisSeries = chassisNo.substring(0, 4);
  const chassisNoPart = chassisNo.substring(4);
  
  const API_BASE_URL = "http://localhost:8081";
  const response = await fetch(
    `${API_BASE_URL}/api/UD05/modifyDocumentUnit?chassisSeries=${encodeURIComponent(chassisSeries)}&chassisNo=${encodeURIComponent(chassisNoPart)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  
  const data = await response.json();
  
  if (data.code === 200 && data.data) {
    setMarket(data.data.market || "-");
    setTemplate(data.data.template || "-");
    
    // 将后端返回的newval字段映射为modifiedValue
    const variablesWithModifiedValue = (data.data.variables || []).map((v: any) => ({
      variable: v.variable,
      description: v.description,
      currentValue: v.currentValue || v.newval || "",
      modifiedValue: "" // 初始化为空，用户输入新值
    }));
    
    setVariables(variablesWithModifiedValue);
  }
};
```

#### Save按钮
```typescript
const handleSave = async () => {
  const chassisSeries = chassisNo.substring(0, 4);
  const chassisNoPart = chassisNo.substring(4);
  
  const requestBody = {
    chassisSeries: chassisSeries,
    chassisNo: chassisNoPart,
    updateUser: "CURRENT_USER",
    variables: variables
      .filter((v) => v.modifiedValue && v.modifiedValue.trim() !== "")
      .map((v) => ({
        variable: v.variable,
        newval: v.modifiedValue,
      })),
  };
  
  const API_BASE_URL = "http://localhost:8081";
  const response = await fetch(`${API_BASE_URL}/api/UD05/modifyDocumentSave`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
  
  const data = await response.json();
  
  if (data.code === 200) {
    alert("Document updated successfully!");
    navigate(`/generate-document?chassisNo=${encodeURIComponent(chassisNo)}`);
  }
};
```

## 日志说明

### 日志级别
- **INFO**: 记录正常业务流程（请求接收、查询/更新成功等）
- **WARN**: 记录警告信息（参数验证失败、无数据等）
- **ERROR**: 记录系统错误（异常堆栈信息）

### 日志示例

#### 初期表示
```
========== UD05 Controller: Received GET request for modifyDocumentUnit ==========
Chassis series: jpct
Chassis no: 028321
========== UD05 Get Modify Document Start ==========
Request - Chassis series: jpct, Chassis no: 028321
Query successful - Found 10 variant items
========== UD05 Get Modify Document End ==========
Response code: 200, msg: 查询成功
========== UD05 Controller: Request completed ==========
```

#### Save按钮
```
========== UD05 Controller: Received POST request for modifyDocumentSave ==========
Chassis series: jpct
Chassis no: 028321
Variables count: 2
========== UD05 Save Modify Document Start ==========
Request - Chassis series: jpct, Chassis no: 028321, Variables count: 2
Updated variable: VIN with new value: NEW_VIN_VALUE
Updated variable: SEAT_NO with new value: 5
Update completed - Total updated: 2 records
========== UD05 Save Modify Document End ==========
Response code: 200, msg: 操作成功
========== UD05 Controller: Request completed ==========
```

## 注意事项

1. **跨域配置**: Controller已添加`@CrossOrigin(origins = "*")`注解，允许跨域访问
2. **参数拆分**: 前端需要将完整的chassisNo拆分为chassisSeries（前4位）和chassisNo（剩余部分）
3. **空数据处理**: 初期表示查询结果为空时仍返回成功响应，只是variables为空数组
4. **选择性更新**: Save时只更新modifiedValue有值的字段，为空的字段不更新
5. **性能优化**: Save时循环执行UPDATE语句，建议批量更新时注意性能
6. **安全性**: 实际部署时应限制跨域来源，updateUser应从用户会话中获取

## 开发规范

1. 所有接口统一使用ApiResponse封装响应
2. 成功响应code为200，失败响应使用对应的HTTP状态码
3. 所有业务异常应在Service层捕获并转换为标准响应
4. 关键业务操作必须记录日志
5. 参数校验必须在Service层完成
6. SQL查询使用MyBatis XML方式，便于维护和优化
7. LEFT JOIN确保即使HDOC_VARIABLES表中没有对应记录也能返回数据

## 测试用例

### 初期表示测试
- **正常场景**: 表中有数据，返回包含variables的成功响应
- **空数据场景**: 表中无数据，返回variables为空数组的成功响应
- **参数缺失**: chassisSeries或chassisNo为空，返回400错误
- **参数格式错误**: 包含非法字符，返回400错误

### Save按钮测试
- **正常场景**: 更新成功，返回200响应
- **部分更新**: 只有部分变量有值，只更新有值的字段
- **全部为空**: 所有modifiedValue都为空，返回400错误
- **参数缺失**: 必要参数缺失，返回400错误

### 性能测试
- **大量变量**: 100+个变量同时更新，验证响应时间和数据库性能
- **并发更新**: 多用户同时更新同一底盘号，验证数据一致性
