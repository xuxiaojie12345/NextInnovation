const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8081',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api'
      }
    })
  );

  // 代理 /login 到后端 (Login.tsx 使用 GET /login)
  app.use(
    '/login',
    createProxyMiddleware({
      target: 'http://localhost:8081',
      changeOrigin: true
    })
  );

  // 代理 /admin 开头的请求到后端 (UD12 使用 /admin/Upload&DeleteTemplate/*)
  app.use(
    '/admin',
    createProxyMiddleware({
      target: 'http://localhost:8081',
      changeOrigin: true
    })
  );
};
