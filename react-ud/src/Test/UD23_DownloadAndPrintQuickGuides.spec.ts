// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD23_DownloadAndPrintQuickGuides 单元测试
// 测试规格书: テスト式样書UD23.md
// 画面文件: UD23_DownloadAndPrintQuickGuides.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD23');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

// UD23 为静态页面，无 API 调用


/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD23画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * 导航到 UD23 页面
 */
async function goToUD23(page: Page) {
  await login(page);
  await page.goto(BASE_URL + '/UD23');
  await page.waitForSelector('.ud23-container');
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
// 1. 画面初期表示 (No.1-5)
// ============================================================
test.describe('画面初期表示', () => {

  test('UD23_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '001';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    // 1. 页面容器可见
    await expect(page.locator('.ud23-container')).toBeVisible();

    // 2. Back 按钮位于页面左侧
    await expect(page.locator('.ud23-sidebar')).toBeVisible();
    await expect(page.locator('.ud23-back-btn')).toBeVisible();

    // 3. 页面标题显示
    await expect(page.locator('.ud23-title')).toHaveText('Download and Print Quick Guides');

    // 4. 活性指南区域可见
    await expect(page.locator('.ud23-section').first()).toBeVisible();

    // 5. Volvo 3P Quick Guides 区域可见
    await expect(page.locator('.ud23-volvo-section')).toBeVisible();

    await takeScreenshot(page, '整体布局確認');
  });

  test('UD23_002_画面初始化_Back按钮', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '002';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    const backBtn = page.locator('.ud23-back-btn');

    // 1. Back 按钮可见
    await expect(backBtn).toBeVisible();

    // 2. 按钮文字为 « Back
    await expect(backBtn).toHaveText('« Back');

    // 3. 处于可用状态（未禁用）
    await expect(backBtn).toBeEnabled();

    // 4. 位于页面左侧
    await expect(page.locator('.ud23-sidebar')).toBeVisible();

    await takeScreenshot(page, 'Back按钮確認');
  });

  test('UD23_003_画面初始化_活性指南区域', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '003';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    // 活性指南区域包含8项
    const guideItems = page.locator('.ud23-guide-item');
    await expect(guideItems).toHaveCount(8);

    // 每项均包含图片区域和下载链接
    for (let i = 0; i < 8; i++) {
      await expect(guideItems.nth(i).locator('.ud23-image-placeholder')).toBeVisible();
      await expect(guideItems.nth(i).locator('.ud23-download-link')).toBeVisible();
    }

    // 确认各指南标题
    const linkTexts = await page.locator('.ud23-download-link').allTextContents();
    expect(linkTexts.slice(0, 8)).toContain('WIS Quick Guide');
    expect(linkTexts.slice(0, 8)).toContain('PERF Quick Guide');
    expect(linkTexts.slice(0, 8)).toContain('W8 Quick Guide');
    expect(linkTexts.slice(0, 8)).toContain('HDoc Quick Guide');
    expect(linkTexts.slice(0, 8)).toContain('EDB Quick Guide');
    expect(linkTexts.slice(0, 8)).toContain('COS Quick Guide');
    expect(linkTexts.slice(0, 8)).toContain('VBI Quick Guide(Intranet version)1');
    expect(linkTexts.slice(0, 8)).toContain('VBI Quick Guide(Intranet version)2');

    await takeScreenshot(page, '活性指南区域確認');
  });

  test('UD23_004_画面初始化_活性指南下载链接', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '004';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    const activeLinks = page.locator('.ud23-section').first().locator('.ud23-download-link');

    // 1. WIS Quick Guide
    await expect(activeLinks.nth(0)).toHaveText('WIS Quick Guide');
    // 2. PERF Quick Guide
    await expect(activeLinks.nth(1)).toHaveText('PERF Quick Guide');
    // 3. W8 Quick Guide
    await expect(activeLinks.nth(2)).toHaveText('W8 Quick Guide');
    // 4. HDoc Quick Guide
    await expect(activeLinks.nth(3)).toHaveText('HDoc Quick Guide');
    // 5. EDB Quick Guide
    await expect(activeLinks.nth(4)).toHaveText('EDB Quick Guide');
    // 6. COS Quick Guide
    await expect(activeLinks.nth(5)).toHaveText('COS Quick Guide');
    // 7. VBI Quick Guide(Intranet version)1
    await expect(activeLinks.nth(6)).toHaveText('VBI Quick Guide(Intranet version)1');
    // 8. VBI Quick Guide(Intranet version)2
    await expect(activeLinks.nth(7)).toHaveText('VBI Quick Guide(Intranet version)2');

    await takeScreenshot(page, '活性指南下载链接確認');
  });

  test('UD23_005_画面初始化_Volvo3PQuickGuides区域', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '005';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    // 1. 显示标题 Volvo 3P Quick Guides
    await expect(page.locator('.ud23-volvo-title')).toHaveText('Volvo 3P Quick Guides');

    // 2. 包含9个下载链接
    const volvoLinks = page.locator('.ud23-volvo-links').locator('.ud23-download-link');
    await expect(volvoLinks).toHaveCount(9);

    // 3. 所有链接处于可用状态
    const linkCount = await volvoLinks.count();
    for (let i = 0; i < linkCount; i++) {
      await expect(volvoLinks.nth(i)).toBeVisible();
    }

    // 确认各链接文字
    const linkTexts = await volvoLinks.allTextContents();
    expect(linkTexts).toContain('EDB Quick Guide');
    expect(linkTexts).toContain('KRS Quick Guide');
    expect(linkTexts).toContain('CVM Quick Guide');
    expect(linkTexts).toContain('AVP Quick Guide');
    expect(linkTexts).toContain('KAX Quick Guide');
    expect(linkTexts).toContain('CAE Homepage Quick Guide');
    expect(linkTexts).toContain('BPP Quick Guide');
    expect(linkTexts).toContain('SPC Quick Guide');
    expect(linkTexts).toContain('WebFRAME Quick Guide');

    await takeScreenshot(page, 'Volvo3P区域確認');
  });

});

// ============================================================
// 2. Back 按钮操作 (No.6)
// ============================================================
test.describe('Back按钮操作', () => {

  test('UD23_006_Back_返回上一级画面', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '006';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    // 点击 Back 按钮
    await page.locator('.ud23-back-btn').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後');

    // 画面返回到上一级画面（通过 navigate(-1)）
    // 应返回到 Menu 或之前访问的页面
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/UD23');
  });

});

// ============================================================
// 3. 下载链接操作 (No.7-17)
// ============================================================
test.describe('下载链接操作', () => {

  test('UD23_007_下载_WIS Quick Guide', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '007';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    // 点击 WIS Quick Guide 下载链接
    const wisLink = page.locator('.ud23-download-link', { hasText: 'WIS Quick Guide' }).first();
    await wisLink.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    // 页面不显示错误消息
    await expect(page.locator('.ud23-container')).toBeVisible();
  });

  test('UD23_008_下载_PERF Quick Guide', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '008';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud23-download-link', { hasText: 'PERF Quick Guide' }).first().click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');
    await expect(page.locator('.ud23-container')).toBeVisible();
  });

  test('UD23_009_下载_HDoc Quick Guide', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '009';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud23-download-link', { hasText: 'HDoc Quick Guide' }).first().click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');
    await expect(page.locator('.ud23-container')).toBeVisible();
  });

  test('UD23_010_下载_EDB Quick Guide', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '010';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud23-download-link', { hasText: 'EDB Quick Guide' }).first().click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');
    await expect(page.locator('.ud23-container')).toBeVisible();
  });

  test('UD23_011_下载_COS Quick Guide', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '011';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud23-download-link', { hasText: 'COS Quick Guide' }).first().click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');
    await expect(page.locator('.ud23-container')).toBeVisible();
  });

  test('UD23_012_下载_VBI Intranet version1', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '012';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud23-download-link', { hasText: 'VBI Quick Guide(Intranet version)1' }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');
    await expect(page.locator('.ud23-container')).toBeVisible();
  });

  test('UD23_013_下载_VBI Intranet version2', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '013';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud23-download-link', { hasText: 'VBI Quick Guide(Intranet version)2' }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');
    await expect(page.locator('.ud23-container')).toBeVisible();
  });

  test('UD23_014_下载_Volvo3P_KRS Quick Guide', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '014';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud23-volvo-links .ud23-download-link', { hasText: 'KRS Quick Guide' }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');
    await expect(page.locator('.ud23-container')).toBeVisible();
  });

  test('UD23_015_下载_Volvo3P_CVM Quick Guide', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '015';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud23-volvo-links .ud23-download-link', { hasText: 'CVM Quick Guide' }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');
    await expect(page.locator('.ud23-container')).toBeVisible();
  });

  test('UD23_016_下载_Volvo3P_CAE Homepage Quick Guide', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '016';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud23-volvo-links .ud23-download-link', { hasText: 'CAE Homepage Quick Guide' }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');
    await expect(page.locator('.ud23-container')).toBeVisible();
  });

  test('UD23_017_下载_Volvo3P_WebFRAME Quick Guide', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '017';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud23-volvo-links .ud23-download-link', { hasText: 'WebFRAME Quick Guide' }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');
    await expect(page.locator('.ud23-container')).toBeVisible();
  });

});

// ============================================================
// 4. 异常处理 (No.18-20)
// ============================================================
test.describe('异常处理', () => {

  test('UD23_018_异常处理_图片加载失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '018';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    // 页面为静态页面，图片为占位符图标
    // 确认图片占位符可见
    const imageBoxes = page.locator('.ud23-image-box');
    await expect(imageBoxes.first()).toBeVisible();

    // 下载链接仍可用
    const firstLink = page.locator('.ud23-download-link').first();
    await expect(firstLink).toBeVisible();

    // 页面整体布局不受影响
    await expect(page.locator('.ud23-container')).toBeVisible();
    await expect(page.locator('.ud23-title')).toHaveText('Download and Print Quick Guides');

    await takeScreenshot(page, '操作後');
  });

  test('UD23_019_异常处理_文件下载失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '019';

    // 模拟网络断开
    await page.route('**/guides/**', route => {
      route.abort('connectionrefused');
    });

    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    // 点击任意下载链接
    await page.locator('.ud23-download-link', { hasText: 'WIS Quick Guide' }).first().click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    // 页面不崩溃
    await expect(page.locator('.ud23-container')).toBeVisible();

    await page.unroute('**/guides/**');
  });

  test('UD23_020_异常处理_文件资源不存在404', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '020';

    // 模拟下载文件不存在
    await page.route('**/guides/**', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'File not found' }),
      });
    });

    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    // 点击下载链接
    await page.locator('.ud23-download-link', { hasText: 'WIS Quick Guide' }).first().click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    // 页面不崩溃
    await expect(page.locator('.ud23-container')).toBeVisible();

    await page.unroute('**/guides/**');
  });

});

// ============================================================
// 5. 安全性 (No.21-23)
// ============================================================
test.describe('安全性', () => {

  test('UD23_021_安全性_未登录直接访问重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '021';

    // 1. 先登录系统，进入 UD23 画面
    await goToUD23(page);
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/UD23/);
    await expect(page.locator('.ud23-container')).toBeVisible();
    await takeScreenshot(page, 'UD23画面表示');

    // 2. 清除所有 localStorage 数据（模拟未登录状态）
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/UD23/);
    await expect(page.locator('.ud23-container')).toBeVisible();
    await takeScreenshot(page, 'localStorage清除後（画面未刷新）');

    // 3. 浏览器地址栏直接输入 UD23 画面的完整 URL 并访问
    await page.goto(BASE_URL + '/UD23');
    await page.waitForTimeout(2000);

    // 4. 确认结果：URL 变为根路径（Login 画面），UD23 画面不被显示
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('.ud23-container')).not.toBeVisible();
    await takeScreenshot(page, '重定向結果（Login画面）');
  });

  test('UD23_022_安全性_内网版本链接访问权限', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '022';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    // Intranet 版本链接包含 intranet-badge
    const intranetBadge = page.locator('.ud23-intranet-badge');
    await expect(intranetBadge).toHaveCount(2);
    await expect(intranetBadge.first()).toContainText('Intranet version');

    // 点击内网版本链接（页面不报错）
    await page.locator('.ud23-download-link', { hasText: 'VBI Quick Guide(Intranet version)1' }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    await expect(page.locator('.ud23-container')).toBeVisible();
  });

  test('UD23_023_安全性_文件路径安全', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '023';
    await goToUD23(page);
    await takeScreenshot(page, '初期表示');

    // 检查下载链接使用相对路径，不包含服务器绝对路径
    const links = page.locator('.ud23-download-link');
    const linkCount = await links.count();

    for (let i = 0; i < linkCount; i++) {
      const href = await links.nth(i).getAttribute('href');
      // 确认链接不以盘符或绝对路径开头
      expect(href).not.toMatch(/^[A-Za-z]:\\/);
      expect(href).not.toMatch(/^\/[A-Za-z]/);
      // 链接为相对路径
      expect(href).toMatch(/^\/guides\//);
    }

    await takeScreenshot(page, '操作後');
  });

});
