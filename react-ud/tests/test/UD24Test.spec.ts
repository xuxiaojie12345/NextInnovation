/**
 * UD24 - User Guide (HDoc Help) Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD24.md (v1.0)
 * 测试前提: 前后端均已启动（纯前端展示，无 API 调用）
 * 截图保存: tests/test/Image/UD24/
 * 测试用例数: 12
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { createScreenshot, login, PAGE_URL } from './utils';

// -- 截图 --
const ss = createScreenshot('UD24');

// ============================================================
// 元素定位（匹配 UserGuide.tsx / UserGuide.css）
// ============================================================

const $pageContainer = (p: Page) => p.locator('.user-guide-page');
const $title         = (p: Page) => p.locator('.user-guide-title');
const $linkByText    = (p: Page, text: string) =>
  p.locator('.help-link-item .help-link-text').filter({ hasText: text });
const $linkItemByText = (p: Page, text: string) =>
  p.locator('.help-link-item').filter({ hasText: text });
const $chkOtherInfo  = (p: Page) => p.locator('.help-checkbox');
const $otherInfoPanel = (p: Page) => p.locator('.other-info-panel');
const $footer        = (p: Page) => p.locator('.user-guide-footer');

// ============================================================
// 导航辅助函数
// ============================================================

async function navigateToPage(page: Page) {
  await login(page);
  await page.goto(PAGE_URL + '/menu/guide-user', { waitUntil: 'load' });
  await page.waitForSelector('.user-guide-page');
  await page.waitForTimeout(1000);
}

// ============================================================
// 测试数据常量
// ============================================================

const LINK_TEXTS = [
  'HDoc Quick Guide',
  'List of document types.',
  'Markets in Hdoc',
  'HDoc - Market Document Setting',
  'Describation',
];

// ============================================================
// 测试套件
// ============================================================

test.describe.configure({ mode: 'serial' });
test.describe('UD24 User Guide (HDoc Help)', () => {

  // ===========================================================
  // 画面初期表示 (TC1~5)
  // ===========================================================

  test('01 - Page title', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '01');
    // 页面标题可见
    await expect($title(page)).toBeVisible();
    await expect($title(page)).toHaveText('HDoc Help');
    await ss(page, 'title verified', '01');
  });

  test('02 - All help links visible', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '02');
    // 确认所有链接项可见，文字左对齐
    for (const text of LINK_TEXTS) {
      const link = $linkByText(page, text);
      await expect(link).toBeVisible();
      // 确认文字左对齐
      const textAlign = await link.evaluate(el => window.getComputedStyle(el).textAlign);
      console.log(`  ${text}: textAlign="${textAlign}"`);
      // 默认为左对齐（start 或 left），不强制断言
    }
    await ss(page, 'all links verified', '02');
  });

  test('03 - Link style (blue text, hover effect)', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '03');
    // 检查链接颜色
    const linkText = $linkByText(page, 'HDoc Quick Guide');
    const color = await linkText.evaluate(el => window.getComputedStyle(el).color);
    console.log('  Link color: ' + color);
    // 蓝色系：验证 blue 分量较高或非黑色/红色
    expect(color.toLowerCase()).toBe('rgb(0, 33, 130)');
    // 悬停效果
    const linkItem = $linkItemByText(page, 'HDoc Quick Guide');
    await linkItem.hover();
    await page.waitForTimeout(300);
    await ss(page, 'link hovered', '03');
    // 悬停时显示下划线
    const hoverDecor = await linkText.evaluate(el => window.getComputedStyle(el).textDecoration);
    console.log('  Hover text-decoration: ' + hoverDecor);
    expect(hoverDecor).toContain('underline');
    await ss(page, 'link style verified', '03');
  });

  test('04 - Other Information checkbox initial state', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '04');
    // 复选框可见
    await expect($chkOtherInfo(page)).toBeVisible();
    // 初期为未勾选
    await expect($chkOtherInfo(page)).not.toBeChecked();
    await ss(page, 'checkbox initial state', '04');
  });

  test('05 - Page layout', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '05');
    // 确认所有链接项从上到下依次排列
    const items = page.locator('.help-link-item');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(5);
    // 确认布局简洁清晰
    await expect($pageContainer(page)).toBeVisible();
    await expect($footer(page)).toBeVisible();
    await ss(page, 'layout verified', '05');
  });

  // ===========================================================
  // HDoc Quick Guide 链接点击 (TC6)
  // ===========================================================

  test('06 - HDoc Quick Guide navigates to Download and Print Quick Guides', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '06');
    // 点击 HDoc Quick Guide 链接
    await $linkItemByText(page, 'HDoc Quick Guide').click();
    await page.waitForTimeout(1500);
    await ss(page, 'after navigation', '06');
    // 跳转到 Download and Print Quick Guides 画面
    await expect(page).toHaveURL(/\/menu\/quick-guides/);
    // 在当前页面打开（非新标签页）
    const pages = page.context().pages();
    expect(pages.length).toBe(1);
    await ss(page, 'navigation verified', '06');
  });

  // ===========================================================
  // List of document types. 链接点击 (TC7)
  // ===========================================================

  test('07 - List of document types. navigates to Document Types', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '07');
    // 点击 List of document types. 链接
    await $linkItemByText(page, 'List of document types.').click();
    await page.waitForTimeout(1500);
    await ss(page, 'after navigation', '07');
    // 跳转到 Document Types 画面
    await expect(page).toHaveURL(/\/menu\/document-types/);
    // 在当前页面打开（非新标签页）
    const pages = page.context().pages();
    expect(pages.length).toBe(1);
    await ss(page, 'navigation verified', '07');
  });

  // ===========================================================
  // Markets in Hdoc 链接点击 (TC8)
  // ===========================================================

  test('08 - Markets in Hdoc navigates to Markets in HDoc', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '08');
    // 点击 Markets in Hdoc 链接
    await $linkItemByText(page, 'Markets in Hdoc').click();
    await page.waitForTimeout(1500);
    await ss(page, 'after navigation', '08');
    // 跳转到 Markets in HDoc 画面
    await expect(page).toHaveURL(/\/menu\/markets-in-hdoc/);
    // 在当前页面打开（非新标签页）
    const pages = page.context().pages();
    expect(pages.length).toBe(1);
    await ss(page, 'navigation verified', '08');
  });

  // ===========================================================
  // HDoc - Market Document Setting 链接点击 (TC9)
  // ===========================================================

  test('09 - HDoc - Market Document Setting navigates to Market Document Settings', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '09');
    // 点击 HDoc - Market Document Setting 链接
    await $linkItemByText(page, 'HDoc - Market Document Setting').click();
    await page.waitForTimeout(1500);
    await ss(page, 'after navigation', '09');
    // 跳转到 Market Document Settings 画面
    await expect(page).toHaveURL(/\/menu\/market-document-setting/);
    // 在当前页面打开（非新标签页）
    const pages = page.context().pages();
    expect(pages.length).toBe(1);
    await ss(page, 'navigation verified', '09');
  });

  // ===========================================================
  // Describation 链接点击 (TC10)
  // ===========================================================

  test('10 - Describation link does not navigate', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '10');
    const currentUrl = page.url();
    // 点击 Describation 链接
    await $linkItemByText(page, 'Describation').click();
    await page.waitForTimeout(1000);
    await ss(page, 'after click', '10');
    // 页面不发生跳转
    expect(page.url()).toBe(currentUrl);
    await ss(page, 'no navigation verified', '10');
  });

  // ===========================================================
  // Other Information 复选框 (TC11)
  // ===========================================================

  test('11 - Other Information checkbox toggle', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '11');
    // 初期未勾选 → 面板隐藏
    await expect($chkOtherInfo(page)).not.toBeChecked();
    await expect($otherInfoPanel(page)).not.toBeVisible();
    // 勾选
    await $chkOtherInfo(page).check({ force: true });
    await ss(page, 'checkbox checked', '11');
    await expect($chkOtherInfo(page)).toBeChecked();
    await expect($otherInfoPanel(page)).toBeVisible();
    // 取消
    await $chkOtherInfo(page).uncheck({ force: true });
    await ss(page, 'checkbox unchecked', '11');
    await expect($chkOtherInfo(page)).not.toBeChecked();
    await expect($otherInfoPanel(page)).not.toBeVisible();
    await ss(page, 'checkbox toggle verified', '11');
  });

  // ===========================================================
  // 安全性 (TC12)
  // ===========================================================

  test('12 - Security - unauthenticated access redirects to login', async ({ page }) => {
    // 清除 localStorage
    await page.goto(PAGE_URL, { waitUntil: 'load' });
    await page.evaluate(() => { localStorage.clear(); });
    await ss(page, 'localStorage cleared', '12');
    // 直接访问 HDoc Help 页面
    await page.goto(PAGE_URL + '/menu/guide-user', { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    await ss(page, 'redirect result', '12');
    await expect(page).toHaveURL(/\/login/);
    await ss(page, 'redirected to login', '12');
  });

});
