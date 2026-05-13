# Getting Started

### Reference Documentation

For further reference, please consider the following sections:

-   [Official Apache Maven documentation](https://maven.apache.org/guides/index.html)
-   [Spring Boot Maven Plugin Reference Guide](https://docs.spring.io/spring-boot/docs/2.7.6/maven-plugin/)
-   [Spring Configuration Processor](https://docs.spring.io/spring-boot/docs/2.6.11/reference/htmlsingle/#appendix.configuration-metadata.annotation-processor)
-   [Spring Web](https://docs.spring.io/spring-boot/docs/2.6.11/reference/htmlsingle/#web)
-   [MyBatis Framework](https://mybatis.org/spring-boot-starter/mybatis-spring-boot-autoconfigure/)
-   [JDBC API](https://docs.spring.io/spring-boot/docs/2.6.11/reference/htmlsingle/#data.sql)
-   [Spring Boot DevTools](https://docs.spring.io/spring-boot/docs/2.6.11/reference/htmlsingle/#using.devtools)
-   [Thymeleaf](https://docs.spring.io/spring-boot/docs/2.6.11/reference/htmlsingle/#web.servlet.spring-mvc.template-engines)

### Guides

The following guides illustrate how to use some features concretely:

-   [Building a RESTful Web Service](https://spring.io/guides/gs/rest-service/)
-   [Serving Web Content with Spring MVC](https://spring.io/guides/gs/serving-web-content/)
-   [Building REST services with Spring](https://spring.io/guides/tutorials/rest/)
-   [MyBatis Quick Start](https://github.com/mybatis/spring-boot-starter/wiki/Quick-Start)
-   [Accessing Relational Data using JDBC with Spring](https://spring.io/guides/gs/relational-data-access/)
-   [Managing Transactions](https://spring.io/guides/gs/managing-transactions/)
-   [Accessing data with MySQL](https://spring.io/guides/gs/accessing-data-mysql/)
-   [Handling Form Submission](https://spring.io/guides/gs/handling-form-submission/)

http://localhost:8080/swagger-ui/index.html

### 多环境(application.yml 文件中的[active]分配)统一打包

-   [active: dev]开发环境
-   [active: prod]生产环境
-   [active: test]测试环境
    mvn clean package

### 多环境(application.yml 文件中的[active]分配)统一运行

mvn clean install
mvn spring-boot:run
java -jar target/pay.jar

### maven 命令(打包/运行), 必须带有环境参数

--mvn clean package -P prod
--java -jar target/pay.jar--spring.profiles.active=prod

### 打包的时候跳过测试(pom.xml)

    <properties>
        <!--打包的时候跳过测试-->
        <skipTests>true</skipTests>
    </properties>
