const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8081',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      pathRewrite: {
        '^/api': '/api'
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`[Proxy Response] ${proxyRes.statusCode} ${req.originalUrl}`);
      },
      onError: (err, req, res) => {
        console.error('[Proxy Error]', err);
        res.status(500).send('Proxy Error: ' + err.message);
      }
    })
  );
};
