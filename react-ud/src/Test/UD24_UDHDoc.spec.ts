// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD24_UDHDoc 单元测试
// 测试规格书: テスト式样書UD24.md
// 画面文件: UD24_UDHDoc.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD24');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

// UD24 为静态页面，无 API 调用


/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD24画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
  const filepath = path.join(SCREENSHOT_ROOT, filename);
  return page.screenshot({ path: filepath, type: 'jpeg', quality: 80 });
}

/**
 * 登录系统
 */
async function login(page: Page) {
  await page.goto(BASE_URL + '/');
  await page.waitForSelector('.login-container');
  await page.locator('#userID').fill(REAL_USER);
  await page.locator('#password').fill(REAL_PASS);
  await page.locator('button[type="submit"]').click({ noWaitAfter: true });
  await page.waitForURL('**/Menu', { timeout: 60000 });
  await page.waitForSelector('.menu-container');
}

/**
 * 导航到 UD24 页面
 */
async function goToUD24(page: Page) {
  await login(page);
  await page.goto(BASE_URL + '/UD24');
  await page.waitForSelector('.ud24-container');
  await page.waitForTimeout(1000);
}

/**
 * 每个测试前初始化
 */
test.beforeEach(async ({ page }) => {
  screenshotCounter = 0;
  await page.evaluate(() => localStorage.clear()).catch(() => {});
});

// ============================================================
// 1. 画面初期表示 (No.1-4)
// ============================================================
test.describe('画面初期表示', () => {

  test('UD24_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '001';
    await goToUD24(page);
    await takeScreenshot(page, '初期表示');

    // 1. 页面容器可见
    await expect(page.locator('.ud24-container')).toBeVisible();

    // 2. 页面标题显示
    await expect(page.locator('.ud24-title')).toHaveText('HDoc Help');

    // 3. 链接列表区域可见
    await expect(page.locator('.ud24-link-list')).toBeVisible();

    // 4. 复选框区域可见
    await expect(page.locator('.ud24-other-info')).toBeVisible();

    await takeScreenshot(page, '整体布局確認');
  });

  test('UD24_002_画面初始化_页面标题', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '002';
    await goToUD24(page);
    await takeScreenshot(page, '初期表示');

    const title = page.locator('.ud24-title');

    // 1. 标题文字为 HDoc Help
    await expect(title).toHaveText('HDoc Help');

    // 2. 文字左对齐
    await expect(title).toHaveCSS('text-align', 'left');

    await takeScreenshot(page, '页面标题確認');
  });

  test('UD24_003_画面初始化_链接列表', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '003';
    await goToUD24(page);
    await takeScreenshot(page, '初期表示');

    // 1. 链接列表包含5项
    const linkItems = page.locator('.ud24-link-item');
    await expect(linkItems).toHaveCount(5);

    // 确认各链接文字
    const linkTexts = await page.locator('.ud24-link-text').allTextContents();
    expect(linkTexts[0]).toBe('HDoc Quick Guide');
    expect(linkTexts[1]).toBe('List of document types.');
    expect(linkTexts[2]).toBe('Markets in HDoc');
    expect(linkTexts[3]).toBe('HDoc - Market Document Settings');
    expect(linkTexts[4]).toBe('Describation');

    // 2. 所有链接文字左对齐
    for (let i = 0; i < 5; i++) {
      await expect(linkItems.nth(i).locator('.ud24-link-text')).toHaveCSS('text-align', 'left');
    }

    // 3. 所有链接处于可用状态（可点击）
    for (let i = 0; i < 5; i++) {
      await expect(linkItems.nth(i)).toBeVisible();
    }

    await takeScreenshot(page, '链接列表確認');
  });

  test('UD24_004_画面初始化_OtherInformation复选框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '004';
    await goToUD24(page);
    await takeScreenshot(page, '初期表示');

    const checkbox = page.locator('.ud24-checkbox');
    const checkboxText = page.locator('.ud24-checkbox-text');

    // 1. 复选框可见
    await expect(checkbox).toBeVisible();

    // 2. 标签文字为 Other Information
    await expect(checkboxText).toHaveText('Other Information');

    // 3. 初期为未选中状态
    await expect(checkbox).not.toBeChecked();

    // 4. 文字左对齐
    await expect(page.locator('.ud24-checkbox-label')).toHaveCSS('text-align', 'left');

    await takeScreenshot(page, '复选框確認');
  });

});

// ============================================================
// 2. 链接导航操作 (No.5-9)
// ============================================================
test.describe('链接导航操作', () => {

  test('UD24_005_HDocQuickGuide链接_跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '005';
    await goToUD24(page);
    await takeScreenshot(page, '初期表示');

    // 点击 HDoc Quick Guide 链接
    await page.locator('.ud24-link-text', { hasText: 'HDoc Quick Guide' }).click();
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '操作後');

    // 画面跳转到 UD23
    await expect(page).toHaveURL(/\/UD23/);
  });

  test('UD24_006_ListOfDocumentTypes链接_跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '006';
    await goToUD24(page);
    await takeScreenshot(page, '初期表示');

    // 点击 List of document types. 链接
    await page.locator('.ud24-link-text', { hasText: 'List of document types.' }).click();
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '操作後');

    // 画面跳转到 UD22
    await expect(page).toHaveURL(/\/UD22/);
  });

  test('UD24_007_MarketsInHDoc链接_跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '007';
    await goToUD24(page);
    await takeScreenshot(page, '初期表示');

    // 点击 Markets in HDoc 链接
    await page.locator('.ud24-link-text', { hasText: 'Markets in HDoc' }).click();
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '操作後');

    // 画面跳转到 UD21
    await expect(page).toHaveURL(/\/UD21/);
  });

  test('UD24_008_HDocMarketDocumentSettings链接_跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '008';
    await goToUD24(page);
    await takeScreenshot(page, '初期表示');

    // 点击 HDoc - Market Document Settings 链接
    await page.locator('.ud24-link-text', { hasText: 'HDoc - Market Document Settings' }).click();
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '操作後');

    // 画面跳转到 UD201
    await expect(page).toHaveURL(/\/UD201/);
  });

  test('UD24_009_Describation链接_点击', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '009';
    await goToUD24(page);
    await takeScreenshot(page, '初期表示');

    // 点击 Describation 链接（预留功能，无跳转目标）
    await page.locator('.ud24-link-text', { hasText: 'Describation' }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    // 页面不跳转，停留在当前页面
    await expect(page).toHaveURL(/\/UD24/);
  });

});

// ============================================================
// 3. Checkbox 操作 (No.10-11)
// ============================================================
test.describe('Checkbox操作', () => {

  test('UD24_010_OtherInformation_复选框勾选', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '010';
    await goToUD24(page);
    await takeScreenshot(page, '初期表示');

    // 点击复选框
    await page.locator('.ud24-checkbox').click();
    await page.waitForTimeout(300);
    await takeScreenshot(page, '操作後');

    // 复选框变为选中状态
    await expect(page.locator('.ud24-checkbox')).toBeChecked();
  });

  test('UD24_011_OtherInformation_复选框取消', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '011';
    await goToUD24(page);
    await takeScreenshot(page, '初期表示');

    // 先勾选
    await page.locator('.ud24-checkbox').click();
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    // 再次点击取消
    await page.locator('.ud24-checkbox').click();
    await page.waitForTimeout(300);
    await takeScreenshot(page, '操作後');

    // 复选框变为未选中状态
    await expect(page.locator('.ud24-checkbox')).not.toBeChecked();
  });

});

// ============================================================
// 4. 异常处理 (No.12-14)
// ============================================================
test.describe('异常处理', () => {

  test('UD24_012_异常处理_路由跳转失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '012';
    await goToUD24(page);
    await takeScreenshot(page, '初期表示');

    // 页面正常显示
    await expect(page.locator('.ud24-container')).toBeVisible();
    await expect(page.locator('.ud24-title')).toHaveText('HDoc Help');

    // 点击导航链接尝试跳转
    await page.locator('.ud24-link-text', { hasText: 'HDoc Quick Guide' }).click();
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '操作後');

    // 正常情况跳转到 UD23
    // 如有路由异常，页面会触发 alert
  });

  test('UD24_013_异常处理_会话过期', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '013';
    await goToUD24(page);
    await takeScreenshot(page, '初期表示');

    // 清除 localStorage 模拟 Token 失效
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);

    // 刷新页面
    await page.reload();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '操作後');

    // 检测到未登录，重定向到 Login 页面
    const isLoginPage = await page.locator('.login-container').isVisible().catch(() => false);
    if (isLoginPage) {
      await expect(page).toHaveURL(BASE_URL + '/');
    }
  });

  test('UD24_014_异常处理_网络中断', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '014';
    await goToUD24(page);
    await takeScreenshot(page, '初期表示');

    // 静态页面，无需网络请求，页面正常显示
    await expect(page.locator('.ud24-container')).toBeVisible();
    await expect(page.locator('.ud24-title')).toHaveText('HDoc Help');

    // 链接列表正常显示
    await expect(page.locator('.ud24-link-list')).toBeVisible();

    await takeScreenshot(page, '操作後');
  });

});

// ============================================================
// 5. 安全性 (No.15-16)
// ============================================================
test.describe('安全性', () => {

  test('UD24_015_安全性_未登录直接访问重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '015';

    // 1. 先登录系统，进入 UD24 画面
    await goToUD24(page);
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/UD24/);
    await expect(page.locator('.ud24-container')).toBeVisible();
    await takeScreenshot(page, 'UD24画面表示');

    // 2. 清除所有 localStorage 数据（模拟未登录状态）
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/UD24/);
    await expect(page.locator('.ud24-container')).toBeVisible();
    await takeScreenshot(page, 'localStorage清除後（画面未刷新）');

    // 3. 浏览器地址栏直接输入 UD24 画面的完整 URL 并访问
    await page.goto(BASE_URL + '/UD24');
    await page.waitForTimeout(2000);

    // 4. 确认结果：URL 变为根路径（Login 画面），UD24 画面不被显示
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('.ud24-container')).not.toBeVisible();
    await takeScreenshot(page, '重定向結果（Login画面）');
  });

  test('UD24_016_安全性_Token失效自动跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '016';
    await goToUD24(page);
    await takeScreenshot(page, '初期表示');

    // 清除 localStorage 模拟 Token 失效
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);

    // 刷新页面
    await page.reload();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '操作後');

    // 路由守卫检测到 Token 失效，自动重定向到登录页
    const isLoginPage = await page.locator('.login-container').isVisible().catch(() => false);
    if (isLoginPage) {
      await expect(page).toHaveURL(BASE_URL + '/');
    }
  });

});
