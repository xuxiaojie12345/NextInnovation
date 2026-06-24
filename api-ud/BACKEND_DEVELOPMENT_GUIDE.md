# NextInnovation API 后端开发说明

## 1. 项目概述

本项目是NextInnovation系统的后端API服务，基于Spring Boot 2.7.6构建，提供完整的用户管理、文档管理、权限控制等功能。

## 2. 技术栈

- **核心框架**: Spring Boot 2.7.6
- **持久层**: MyBatis 2.2.2 + Druid 1.2.5 连接池
- **数据库**: MySQL
- **API文档**: Swagger 3.0.0 (Springfox)
- **日志框架**: Log4j2
- **构建工具**: Maven
- **编程语言**: Java 1.8
- **辅助库**: Lombok, PageHelper, commons-lang

## 3. 项目结构

```
api-ud/
├── src/main/java/com/web/app/
│   ├── Application.java              # 主启动类
│   ├── config/                       # 配置类
│   │   ├── SwaggerConfig.java        # Swagger配置
│   │   ├── CorsConfig.java           # CORS跨域配置
│   │   └── WebConfig.java            # Web配置
│   ├── controller/                   # 控制器层
│   │   ├── AuthenticationController.java
│   │   ├── UD03SelectHdocdocumentlistController.java
│   │   ├── UD04SelectGeneratedocumentController.java
│   │   ├── UD05ModifyDocumentController.java
│   │   ├── UD06SaveModificationsController.java
│   │   ├── UD07VehicleSpecificationController.java
│   │   ├── UD08HomologationVariablesController.java
│   │   ├── UD09DeleteHdocuserdefinedrulesController.java
│   │   ├── UD10HdocvariablesController.java
│   │   ├── UD11HdocvariablesController.java
│   │   ├── UD12UploadDeleteTemplateController.java
│   │   ├── UD14SearchresultistController.java
│   │   ├── UD15SelecthdocsenddatavinplateController.java
│   │   ├── UD16ADChangeController.java
│   │   ├── UD17HDocUserAdministrationController.java
│   │   ├── UD18HDocUserDocAdministrationController.java
│   │   └── UD19SearchResultListController.java
│   ├── service/                      # 业务逻辑层
│   │   ├── AuthenticationService.java
│   │   ├── UD03SelectHdocdocumentlistService.java
│   │   ├── ... (其他Service接口)
│   │   └── impl/                     # 业务逻辑实现
│   │       ├── AuthenticationServiceImpl.java
│   │       ├── UD03SelectHdocdocumentlistServiceImpl.java
│   │       └── ... (其他Service实现)
│   ├── mapper/                       # 数据访问层
│   │   ├── UserMapper.java
│   │   ├── DocumentListMapper.java
│   │   └── ... (其他Mapper接口)
│   ├── entity/                       # 实体类
│   │   ├── User.java
│   │   ├── HdocDocumentList.java
│   │   └── ... (其他Entity)
│   ├── dto/                          # 数据传输对象
│   │   ├── ApiResponse.java          # 统一响应对象
│   │   ├── LoginRequest.java
│   │   ├── LoginResponse.java
│   │   └── ... (其他DTO)
│   └── exception/                    # 异常处理
│       ├── BusinessException.java    # 业务异常
│       └── GlobalExceptionHandler.java # 全局异常处理
── src/main/resources/
    ├── mapper/                       # MyBatis映射文件
    │   ├── UserMapper.xml
    │   ├── DocumentListMapper.xml
    │   └── ... (其他Mapper XML)
    ├── application.yml               # 主配置文件
    ├── application-dev.yml           # 开发环境配置
    ├── application-test.yml          # 测试环境配置
    └── application-prod.yml          # 生产环境配置
```

## 4. API列表

### 4.1 认证相关
- **AuthenticationApi**: 用户登录验证
  - POST `/api/authentication/login`

### 4.2 文档管理相关
- **UD03SelectHdocdocumentlistApi**: 获取用户文件列表
  - GET `/api/ud03/select-hdoc-document-list`
  
- **UD04SelectGeneratedocumentApi**: 获取文件信息
  - GET `/api/ud04/select-generated-document`
  
- **UD05ModifyDocumentApi**: 修改文件信息
  - PUT `/api/ud05/modify-document`
  
- **UD06SaveModificationsApi**: 显示修改后的文件信息
  - GET `/api/ud06/save-modifications`

### 4.3 车辆规格相关
- **UD07VehicleSpecificationApi**: 获取底盘信息
  - GET `/api/ud07/vehicle-specification`

### 4.4 变量管理相关
- **UD08HomologationVariablesApi**: 用户自定义规则查询和保存
  - GET `/api/ud08/variables/{variableName}`
  - POST `/api/ud08/variables`
  
- **UD09DeleteHdocuserdefinedrulesApi**: 用户自定义规则删除
  - DELETE `/api/ud09/delete-hdoc-user-defined-rules`
  
- **UD10HdocvariablesApi**: 获取用户自定义变量信息
  - GET `/api/ud10/hdoc-variables`
  
- **UD11HdocvariablesApi**: 获取用户自定义变量信息
  - GET `/api/ud11/hdoc-variables`

### 4.5 模板管理相关
- **UD12UploadDeleteTemplateApi**: 文件上传、删除、模板管理
  - POST `/api/ud12/upload-file`
  - DELETE `/api/ud12/delete-file`

### 4.6 搜索结果相关
- **UD14SearchresultistApi**: 获取格纳文件一览
  - GET `/api/ud14/search-result-list`

### 4.7 数据发送相关
- **UD15SelecthdocsenddatavinplateApi**: 获取用户发送数据信息
  - GET `/api/ud15/select-hdoc-send-data-vin-plate`

### 4.8 产品编号变更相关
- **UD16ADChangeApi**: 产品编号的变更
  - GET `/api/ud16/select-hdoc-adca-change`
  - POST `/api/ud16/update-hdoc-adca-change`

### 4.9 用户管理相关
- **UD17HDocUserAdministrationApi**: 用户权限和市场权限更新和删除
  - GET `/api/ud17/select-market-master`
  - GET `/api/ud17/user-info`
  - GET `/api/ud17/market-auth`
  - DELETE `/api/ud17/delete-hdoc-function-auth`
  - DELETE `/api/ud17/delete-hdoc-market-auth`
  - POST `/api/ud17/create-hdoc-function-auth`
  - POST `/api/ud17/create-hdoc-market-auth`

### 4.10 用户文档权限相关
- **UD18HDocUserDocAdministrationApi**: 设定用户的文件权限
  - GET `/api/ud18/document-list`
  - GET `/api/ud18/function-auth/{userId}`
  - GET `/api/ud18/authentication/{userId}`
  - GET `/api/ud18/user-doc/{userId}`
  - DELETE `/api/ud18/user-doc/{userId}`
  - POST `/api/ud18/user-doc`

### 4.11 用户搜索相关
- **UD19SearchResultListApi**: 获取用户权限等信息
  - GET `/api/ud19/market-master`
  - GET `/api/ud19/search-users`

### 4.12 文档列表相关
- **UD20GetDocumentListApi**: 获取文档信息
  - GET `/api/ud20/document-list`
  - POST `/api/ud20/document-types`
  - PUT `/api/ud20-1/update`

## 5. 开发规范

### 5.1 代码编写规范
- 遵循MVC三层架构模式
- 使用Lombok减少样板代码
- 保持Controller、Service、Mapper层职责分离
- 所有注释使用中文

### 5.2 错误处理
- 对输入参数进行验证
- 统一的异常处理机制
- 返回标准的错误响应格式

### 5.3 响应格式
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    // 具体数据
  }
}
```

### 5.4 错误响应格式
```json
{
  "code": 500,
  "msg": "系统错误，请稍后重试",
  "errorCode": "ERROR_CODE"
}
```

## 6. 数据库表结构

根据react_ud_sql.txt文件，主要包含以下表：
- HDOC_USER_INFOR: 用户信息表
- HDOC_DOCUMENT_LIST: 文档列表表
- HDOC_MARKET_AUTH: 市场权限表
- HDOC_FUNCTION_AUTH: 功能权限表
- HDOC_USER_DOC: 用户文档权限表
- MARKET_MASTER: 市场主数据表
- HDOC_REC_DATA_OM: OM记录数据表
- HDOC_REC_DATA_VDA_GENERAL: VDA通用记录数据表
- HDOC_REC_DATA_VDA_VARIANTS: VDA变体记录数据表
- HDOC_REC_DATA_KOLA_VARIANT: KOLA变体记录数据表
- HDOC_ADCA_MODIFICATION: ADCA修改表
- HDOC_VARIABLES: 变量表
- HDOC_USER_DEFINED_RULES: 用户自定义规则表
- HDOC_SEND_DATA_VIN_PLATE: VIN Plate发送数据表
- HDOC_ADCA_CHANGE: ADCA变更表

## 7. 下一步工作

1. 创建Entity实体类（基于SQL文件）
2. 创建DTO数据传输对象
3. 创建Mapper接口和XML映射文件
4. 创建Service接口和实现类
5. 创建Controller控制器类
6. 配置Swagger API文档
7. 配置CORS跨域支持
8. 编写单元测试

## 8. 注意事项

- 所有API都需要进行身份认证和权限验证
- 敏感操作需要记录操作日志
- 数据传输过程使用HTTPS加密协议
- 防止SQL注入和XSS攻击
- 所有注释必须使用中文，禁止使用日文
