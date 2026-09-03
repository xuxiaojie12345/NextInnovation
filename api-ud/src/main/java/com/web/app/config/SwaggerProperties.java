package com.web.app.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Swagger設定プロパティ
 */
@Component
@ConfigurationProperties("swagger3")
@Data
public class SwaggerProperties {

    private String basePackage;
    private String name;
    private String url;
    private String email;
    private String version;
    private String groupName;
    private String title;
    private String description;
    private String termsofServiceUrl;
    private String license;
    private String licenseUrl;
}
