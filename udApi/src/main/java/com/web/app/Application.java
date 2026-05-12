package com.web.app;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;

import javax.servlet.ServletException;

// import org.slf4j.Logger;
// import org.slf4j.LoggerFactory;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

@MapperScan(basePackages = "com.web.app.mapper") // 扫描mapper包
@SpringBootApplication
public class Application {
  private static final Logger logger = LogManager.getLogger(Application.class);

  public static void main(String[] args) throws InterruptedException, ServletException {
    // 禁用热修补(spring-boot-devtools)
    // System.setProperty("spring.devtools.restart.enabled", "false");
    ConfigurableApplicationContext app = SpringApplication.run(Application.class, args);
    Environment env = app.getBean(Environment.class);
    String ip = "http://localhost:";
    String port = env.getProperty("server.port");
    port = port == null ? "8080" : port;
    String swg = ip + port + "/swagger-ui/index.html";

    // logger.fatal("--------- Log测试 --------");
    // logger.debug("This is a debug message.");
    // logger.info("This is an info message.");
    // logger.warn("This is a warning message.");
    // logger.error("This is an error message.");
    // logger.fatal("This is a fatal error message.");
    logger.info("Swagger的URL : " + swg);
  }
}
