/**
 * 開発時の API プロキシ設定（CRA の setupProxy）
 *
 * フロント（:3000）から /api への呼び出しをバックエンド（:8000）へ転送する。
 * package.json の "proxy" だけでは反映されない場合があるため、こちらで明示する。
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
    }),
  );
};
