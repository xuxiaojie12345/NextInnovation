package com.web.app;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

/**
 * アプリケーションメイン起動クラス
 */
@MapperScan(basePackages = "com.web.app.mapper") // 扫描mapper包
@SpringBootApplication
public class Application {
    private static final Logger logger = LogManager.getLogger(Application.class);

    public static void main(String[] args) {
        ConfigurableApplicationContext app = SpringApplication.run(Application.class, args);
        Environment env = app.getBean(Environment.class);
        String ip = "http://localhost:";
        String port = env.getProperty("server.port");
        port = port == null ? "8080" : port;
        String swg = ip + port + "/swagger-ui/index.html";

        logger.info("Swagger的URL : " + swg);
    }
}
