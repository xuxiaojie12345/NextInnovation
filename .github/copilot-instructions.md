# NextInnovation 项目开发规范

## 技术栈
- **后端**: Java 8, Spring Boot 2.7.x, MyBatis, MySQL (Druid)
- **前端**: React 18, TypeScript
- **构建**: Maven (后端), npm (前端)

## 后端规范

### 代码风格
- 使用 Lombok (`@Data` 等) 减少样板代码
- Controller 类使用 `@RestController` 和 `@RequestMapping("/api/...")`（路径格式不限制大小写，如 `/api/UD03`、`/api/ud04` 均可）
- Service 层接口放在 `service` 包，实现类放在 `service.impl` 包
- Mapper 接口放在 `mapper` 包，使用 `@MapperScan` 扫描（已在 `Application.java` 配置）

### 命名规范
- Controller: `XxxController`
- Service 接口: `XxxService`
- Service 实现: `XxxServiceImpl`
- Mapper: `XxxMapper`
- 实体类: `Xxx`（与数据库表名对应）

### 数据库
- Mapper XML 文件放在 `src/main/resources/mapper/`
- 使用 MyBatis 的 `@Param` 注解命名参数
- 实体类字段使用驼峰命名，数据库字段使用下划线命名

### 日志
- 使用 Log4j2（已在 pom.xml 排除默认的 Logback）
- 使用 `LogManager`/`Logger`（Log4j2 原生 API）或 Lombok `@Slf4j` 均可

## 前端规范

### 组件
- 每个组件一个独立文件夹，包含 `.tsx` 文件（必要时可包含 `.css` 文件）
- 组件文件夹使用 PascalCase 命名
- 使用函数式组件 + Hooks

### API 调用
- 通过 `setupProxy.js` 代理到后端 `localhost:8081`
- API 路径以 `/api/` 开头
- `axios` 实例中也可直接指定 `baseURL: 'http://localhost:8081'`

## 通用规范

### Git
- 提交信息使用中文或英文均可，但需清晰描述变更内容
- 不要提交 `target/`、`node_modules/`、`.idea/` 等目录
- `.gitignore` 分别在 `api-ud/` 和 `react-ud/` 子目录中管理

### 配置
- 开发环境配置在 `application-dev.yml`
- 测试环境配置在 `application-test.yml`
- 生产环境配置在 `application-prod.yml`
- 默认激活 dev profile
