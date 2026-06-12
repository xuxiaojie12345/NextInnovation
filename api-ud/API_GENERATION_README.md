# API-UD 后端代码生成说明

## 概述
根据 `全体APIのプロンプト（20260527）.txt` 文档要求，已生成完整的 Spring Boot 后端代码。

## 项目结构
```
api-ud/src/main/java/com/web/app/
├── entity/                    # 实体类
│   ├── User.java
│   ├── HdocDocumentList.java
│   ├── ProductClassMaster.java
│   ├── MarketMaster.java
│   ├── HdocVariables.java
│   ├── HdocUserDefinedRules.java
│   ├── HdocAdcaChange.java
│   ├── HdocAdcaModification.java
│   ├── HdocSendDataVinPlate.java
│   ├── HdocFunctionAuth.java
│   ├── HdocMarketAuth.java
│   └── HdocUserDoc.java
├── dto/                       # 数据传输对象
│   ├── LoginRequest.java
│   ├── LoginResponse.java
│   └── CommonResponse.java
├── mapper/                    # Mapper接口
│   ├── UserMapper.java
│   ├── HdocDocumentListMapper.java
│   ├── ProductClassMasterMapper.java
│   ├── MarketMasterMapper.java
│   ├── HdocVariablesMapper.java
│   ├── HdocUserDefinedRulesMapper.java
│   ├── HdocAdcaChangeMapper.java
│   ├── HdocAdcaModificationMapper.java
│   ├── HdocSendDataVinPlateMapper.java
│   ├── UserPermissionMapper.java
│   └── UserDocumentPermissionMapper.java
├── service/                   # 服务层
│   ├── LoginService.java
│   └── impl/
│       └── LoginServiceImpl.java
└── controller/                # 控制器层
    ├── AuthenticationController.java
    ├── UD03SelectHdocdocumentlistController.java
    ├── UD05ModifyDocumentController.java
    ├── UD06SaveModificationsController.java
    ├── UD08HomologationVariablesController.java
    ├── UD09DeleteHdocuserdefinedrulesController.java
    ├── UD10HdocvariablesController.java
    ├── UD11HdocvariablesController.java
    ├── UD14SearchresultistController.java
    ├── UD15SelecthdocsenddatavinplateController.java
    ├── UD16ADChangeController.java
    ├── UD17HDocUserAdministrationController.java
    ├── UD18HDocUserDocAdministrationController.java
    └── UD20MarketDocumentSettingsController.java

api-ud/src/main/resources/mapper/  # MyBatis XML映射文件
├── UserMapper.xml
├── HdocDocumentListMapper.xml
├── ProductClassMasterMapper.xml
├── MarketMasterMapper.xml
├── HdocVariablesMapper.xml
├── HdocUserDefinedRulesMapper.xml
├── HdocAdcaChangeMapper.xml
├── HdocAdcaModificationMapper.xml
├── HdocSendDataVinPlateMapper.xml
├── UserPermissionMapper.xml
└── UserDocumentPermissionMapper.xml
```

## 已实现的API列表

### 1. AuthenticationApi - 认证API
- **POST** `/api/AuthenticationApi/login` - 用户登录

### 2. UD03SelectHdocdocumentlistApi - 文档类型查询
- **POST** `/api/UD03SelectHdocdocumentlistApi/types` - 查询文档类型列表

### 3. UD05ModifyDocumentApi - 修改文档
- **POST** `/api/UD05ModifyDocumentApi/UD05SelectVariableModification` - 查询变量修改信息
- **POST** `/api/UD05ModifyDocumentApi/UD05UpdateHdocAdcaModification` - 更新ADCA修改信息

### 4. UD06SaveModificationsApi - 保存修改
- **POST** `/api/UD06SaveModificationsApi/UD06SelectHdocAdcaModification` - 查询ADCA修改信息

### 5. UD08HomologationVariablesApi - 同源变量管理
- **GET** `/api/UD08HomologationVariablesApi/UD08SelectProductclassmaster` - 查询产品类别主数据
- **GET** `/api/UD08HomologationVariablesApi/UD08SelectMarketmaster` - 查询市场主数据
- **POST** `/api/UD08HomologationVariablesApi/UD08Add` - 新增用户定义规则
- **POST** `/api/UD08HomologationVariablesApi/UD08Update` - 更新用户定义规则
- **POST** `/api/UD08HomologationVariablesApi/UD08Delete` - 删除用户定义规则

### 6. UD09DeleteHdocuserdefinedrulesApi - 删除用户定义规则
- **POST** `/api/UD09DeleteHdocuserdefinedrulesApi/UD09Seach` - 搜索用户定义规则
- **POST** `/api/UD09DeleteHdocuserdefinedrulesApi/UD09DeleteSelected` - 删除选中的记录

### 7. UD10HdocvariablesApi - HDoc变量管理
- **POST** `/api/UD10HdocvariablesApi/UD10Add` - 新增HDoc变量
- **POST** `/api/UD10HdocvariablesApi/UD10Update` - 更新HDoc变量
- **POST** `/api/UD10HdocvariablesApi/UD10Delete` - 删除HDoc变量

### 8. UD11HdocvariablesApi - HDoc变量搜索
- **POST** `/api/UD11HdocvariablesApi/UD11Search` - 搜索HDoc变量

### 9. UD14SearchresultistApi - 搜索结果列表
- **POST** `/api/UD14SearchresultistApi/UD14SelectMarketmaster` - 查询市场主数据
- **POST** `/api/UD14SearchresultistApi/UD14SelectHdocuserdefinedrules` - 根据市场查询用户定义规则

### 10. UD15SelecthdocsenddatavinplateApi - VIN Plate数据
- **GET** `/api/UD15SelecthdocsenddatavinplateApi/UD15ViewInfo` - 查看VIN Plate信息
- **POST** `/api/UD15SelecthdocsenddatavinplateApi/UD15SetRegenerate` - 设置为重新生成
- **POST** `/api/UD15SelecthdocsenddatavinplateApi/UD15SetOK` - 设置为完成
- **POST** `/api/UD15SelecthdocsenddatavinplateApi/UD15ChangetoBasicInfo` - 更改为基本信息
- **POST** `/api/UD15SelecthdocsenddatavinplateApi/UD15ChangetoAdvancedInfo` - 更改为高级信息

### 11. UD16ADChangeApi - AD变更管理
- **POST** `/api/UD16ADChangeApi/UD16SelectHdocAdcaChange` - 查询ADCA变更
- **POST** `/api/UD16ADChangeApi/UD16InsertHdocAdcaChange` - 新增ADCA变更
- **POST** `/api/UD16ADChangeApi/UD16UpdateHdocAdcaChange` - 删除ADCA变更（逻辑删除）

### 12. UD17HDocUserAdministrationApi - 用户管理
- **POST** `/api/UD17HDocUserAdministrationApi/UD17Userinfo` - 查询用户信息
- **POST** `/api/UD17HDocUserAdministrationApi/UD17UpdateRole` - 更新用户角色
- **POST** `/api/UD17HDocUserAdministrationApi/UD17DeleteRole` - 删除用户角色

### 13. UD18HDocUserDocAdministrationApi - 用户文档管理
- **GET** `/api/UD18HDocUserDocAdministrationApi/document-list` - 获取文档列表
- **POST** `/api/UD18HDocUserDocAdministrationApi/select-user-doc` - 查询用户文档权限
- **POST** `/api/UD18HDocUserDocAdministrationApi/update-user-doc` - 更新用户文档权限

### 14. UD20MarketDocumentSettingsApi - 市场文档设置
- **GET** `/api/UD20MarketDocumentSettingsApi/document-list` - 获取文档列表
- **POST** `/api/UD20MarketDocumentSettingsApi/update` - 更新文档设置

## 技术栈
- **核心框架**: Spring Boot 2.7.6
- **持久层**: MyBatis 2.2.2 + Druid 1.2.5 连接池
- **数据库**: MySQL
- **API文档**: Swagger 3.0.0 (Springfox)
- **日志框架**: Log4j2
- **构建工具**: Maven
- **编程语言**: Java 1.8
- **辅助库**: Lombok, PageHelper, commons-lang

## 使用说明

### 启动项目
```bash
cd api-ud
./mvnw clean install
./mvnw spring-boot:run
```

### 访问Swagger文档
启动后访问: http://localhost:8080/swagger-ui/index.html

### 数据库配置
请根据实际环境修改 `src/main/resources/application-dev.yml` 中的数据库连接配置。

## 注意事项

1. **密码加密**: 当前实现使用明文密码比对，生产环境应使用BCrypt等加密方式
2. **Token管理**: 登录成功后应生成JWT Token，当前简化处理直接返回用户信息
3. **异常处理**: 建议添加全局异常处理器
4. **参数校验**: 建议使用 @Valid 注解进行更严格的参数校验
5. **事务管理**: 建议在Service层添加 @Transactional 注解
6. **日志记录**: 建议在各层添加详细的日志记录

## 待完善功能

以下API在文档中提到但未完全实现，需要根据实际需求补充：
- UD04SelectGeneratedocumentApi - Generate document画面信息查询
- UD07VehicleSpecificationApi - VDA - Vehicle Specification画面信息查询
- UD12UploadDeletetemplatApi - Upload&Delete template画面信息检索，更新，删除
- UD19SearchResultListApi - Search HDoc User画面的检索

这些API需要额外的实体类和业务逻辑支持，可根据实际需求继续开发。
