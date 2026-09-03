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
 * Swagger自動設定クラス
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
        Docket docket = new Docket(DocumentationType.OAS_30);

        docket.groupName(swaggerProperties.getGroupName())
                .enable(true)
                .groupName("default")
                .apiInfo(genApiInfo())
                .select()
                .apis(RequestHandlerSelectors.basePackage(swaggerProperties.getBasePackage()))
                .paths(PathSelectors.any())
                .build();
        return docket;
    }

    /**
     * ApiInfoの生成
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
                new ArrayList<>());
        return apiInfo;
    }
}
