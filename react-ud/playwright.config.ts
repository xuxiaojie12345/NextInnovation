import { defineConfig } from '@playwright/test';

/**
 * Playwright 配置文件（react-ud）
 *
 * 要点：
 * - 使用「系统已安装的 Google Chrome」（channel: 'chrome'），无需下载 Playwright 的 Chromium 内核；
 * - 测试目录：src/Test，测试文件：*.spec.ts（如 UD01_playwright.spec.ts）；
 * - 被测应用地址默认 http://localhost:3000，可用环境变量 BASE_URL 覆盖；
 * - 截图由测试用例内部控制（保存到 src/Test/screenshots/<观点名称>/），此处关闭框架自动截图。
 */
export default defineConfig({
  testDir: './src/Test',
  testMatch: '**/*.spec.ts',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    // 使用系统已安装的 Chrome（避免下载 Playwright 专用浏览器内核）
    channel: 'chrome',
    headless: true,
    viewport: { width: 1280, height: 800 },
    screenshot: 'off',
    trace: 'off',
    video: 'off',
  },
});
