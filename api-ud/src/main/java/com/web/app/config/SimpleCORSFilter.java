package com.web.app.config;

import org.springframework.stereotype.Component;
import javax.servlet.*;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * @author ycl
 */
@Component
public class SimpleCORSFilter implements Filter {
  public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
      throws IOException, ServletException {
    HttpServletResponse response = (HttpServletResponse) res;
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE, HEAD");
    response.setHeader("Access-Control-Max-Age", "3600");
    // 允许前端发送 Authorization 等常用头，避免预检失败
    response.setHeader("Access-Control-Allow-Headers",
        "Origin, Accept, X-Requested-With, Content-Type, Authorization, Version-Info");
    // 如需暴露特定响应头可在此添加
    response.setHeader("Access-Control-Expose-Headers", "Authorization");

    // 如果是预检请求直接返回 200，不再继续后续过滤链
    if ("OPTIONS".equalsIgnoreCase(((javax.servlet.http.HttpServletRequest) req).getMethod())) {
      response.setStatus(javax.servlet.http.HttpServletResponse.SC_OK);
      return;
    }

    chain.doFilter(req, res);
  }

  public void init(FilterConfig filterConfig) {
  }

  public void destroy() {
  }

}
