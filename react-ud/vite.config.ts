/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Vite 配置
 * ------------------------------------------------------------------
 * 本工程由 CRA(react-scripts) 迁移至 Vite：
 *  - 入口为项目根目录的 index.html
 *  - 环境变量使用 import.meta.env（VITE_ 前缀）
 *  - 单元测试使用 Vitest + jsdom（规约 24：后端用 JUnit 5，前端用 Vitest）
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    /**
     * 开发代理：将 /api 前缀请求转发至后端 api-ud（Spring Boot，端口 8081）
     * 这样前端 authApi.ts 使用相对路径 '/api/auth/login' 即可直连后端，
     * 避免浏览器跨域（CORS）问题，也无需在代码中硬编码后端地址。
     */
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  /**
   * Vitest 配置
   * - environment: jsdom，提供 DOM 与 sessionStorage 等浏览器 API
   * - setupFiles: 引入 jest-dom 断言扩展（与 setupTests.ts 一致）
   * - globals: 启用 describe / test / expect 全局注入
   */
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
  },
});
