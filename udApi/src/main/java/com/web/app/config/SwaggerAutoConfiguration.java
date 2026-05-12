package com.web.app.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.service.Contact;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;

import java.util.ArrayList;

/**
 * 我们引入的swagger启动器不包含自动配置类
 * 所以我们必须自己将自动配置类声明出来
 */
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@EnableConfigurationProperties(SwaggerProperties.class)
@Configuration
public class SwaggerAutoConfiguration {

  @Autowired
  private SwaggerProperties swaggerProperties;

  /**
   * dockect对象对应真实文档
   */
  @Bean
  public Docket docket() {
    // 创建docket对象 指定3.0版本
    Docket docket = new Docket(DocumentationType.OAS_30);// 指定swagger3.0版本

    // 使用配置文件中的内容设置docket对象的相关属性
    docket.groupName(swaggerProperties.getGroupName())// 设置组织名称
        .enable(true) // 开关 ，测试环境开启 正式环境关闭不然占用资源
        .groupName("default") // 分组
        .apiInfo(genApiInfo())// 设置其他几个属性
        .select()
        // 设置swagger读取的controller包
        // RequestHandlerSelectors配置要扫描接口的方式
        // basePackage() 扫描指定路径下的包
        // any() 扫描所有
        // none() 都不扫描
        // withClassAnnotation()扫描指定的注解
        // GetMapping()扫描方法上的注解
        // .apis(RequestHandlerSelectors.basePackage("com.web.app.controller"))
        .apis(RequestHandlerSelectors.basePackage(swaggerProperties.getBasePackage()))
        // 根据请求路径匹配，
        // 一般用 ant 匹配路径； any 是匹配任意路径，
        // none 是都不匹配，
        // regex 是正则匹配；
        .paths(PathSelectors.any())
        .build();// 最后要加 build() 方法；
    return docket;

  }

  /**
   * 创建ApiInfo对象
   * 其实就是使用ApiInfo来封装我们配置其他的几个属性
   * <p>
   * new ApiInfo()源码
   * public ApiInfo(String title,
   * String description,
   * String version,
   * String termsOfServiceUrl,
   * Contact contact,
   * String license,
   * String licenseUrl,
   * Collection<VendorExtension> vendorExtensions) {
   *
   * @return
   */
  private ApiInfo genApiInfo() {
    Contact contact = new Contact(swaggerProperties.getName(), swaggerProperties.getUrl(),
        swaggerProperties.getEmail());
    ApiInfo apiInfo = new ApiInfo(
        swaggerProperties.getTitle(),
        swaggerProperties.getDescription(),
        swaggerProperties.getVersion(),
        swaggerProperties.getTermsofServiceUrl(),
        contact,
        swaggerProperties.getLicense(),
        swaggerProperties.getLicenseUrl(),

        new ArrayList<>()

    );
    return apiInfo;
  }

}
