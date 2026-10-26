/**
 * 開発用プロキシ設定（Create React App が自動で読み込む）
 * `/api` で始まるリクエストを FastAPI バックエンド（localhost:8000）へ転送する。
 */
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      // 明示的に IPv4 を指定（Node 17+ では localhost が ::1 に解決されることがあり、
      // バックエンドが 0.0.0.0 のみで待受していると接続拒否になるため）
      target: "http://127.0.0.1:8000",
      changeOrigin: true,
    }),
  );
};
