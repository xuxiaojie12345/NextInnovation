package com.web.app.config;

import org.springframework.stereotype.Component;
import javax.servlet.*;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * CORS跨域过滤器
 * 允许前端从不同端口/域名访问后端API
 * 
 * @author ycl
 */
@Component
public class SimpleCORSFilter implements Filter {
  public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
      throws IOException, ServletException {
    HttpServletResponse response = (HttpServletResponse) res;
    
    // 允许所有来源访问（开发环境）
    response.setHeader("Access-Control-Allow-Origin", "*");
    
    // 允许的HTTP方法
    response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE, PUT, PATCH, HEAD");
    
    // 预检请求缓存时间（秒）
    response.setHeader("Access-Control-Max-Age", "3600");
    
    // 允许的请求头（添加Authorization以支持Token认证）
    response.setHeader("Access-Control-Allow-Headers", 
        "access-control-allow-origin, " +
        "authority, " +
        "content-type, " +
        "version-info, " +
        "X-Requested-With, " +
        "Authorization, " +                    // 新增：支持Bearer Token认证
        "Accept, " +                           // 新增：支持Accept头
        "Origin, " +                           // 新增：支持Origin头
        "Cache-Control");                      // 新增：支持缓存控制
    
    chain.doFilter(req, res);
  }

  public void init(FilterConfig filterConfig) {
  }

  public void destroy() {
  }

}
