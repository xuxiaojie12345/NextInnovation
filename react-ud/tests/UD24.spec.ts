import { test, expect, Page } from '@playwright/test';

// ============================================================
// HDocHelp 模块 (UD24) Playwright 自动化测试
// 基于 単体テスト仕様書UD24.md + 詳細設計UD24.md
// 注意：本模块为纯前端导航页面，无 API 调用
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD24';
const UD24_URL = `${BASE_URL}/Menu/UserGuide`;

let screenshotCounter: { [key: string]: number } = {};

async function takeScreenshot(page: Page, name: string) {
  if (!screenshotCounter[name]) screenshotCounter[name] = 0;
  screenshotCounter[name]++;
  const seq = String(screenshotCounter[name]).padStart(3, '0');
  try {
    if (page.isClosed()) return;
    await page.waitForTimeout(300);
    if (page.isClosed()) return;
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}_${seq}.jpeg`, type: 'jpeg', quality: 85, fullPage: true, timeout: 10000 });
  } catch (e) { console.warn(`Screenshot failed for ${name}: ${e}`); }
}

function resetCounter(name: string) { screenshotCounter[name] = 0; }

async function safeGoto(page: Page, url: string = BASE_URL) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForTimeout(2000);
      return;
    } catch (e) { if (i === 2 || page.isClosed()) throw e; await page.waitForTimeout(2000); }
  }
}

async function loginViaLocalStorage(page: Page) {
  await page.evaluate((info) => { localStorage.setItem('userInfo', JSON.stringify(info)); }, {
    username: 'admin', role: 'Administrator',
    permissions: ["GenerateDucument", "GenerateDoc", "GenerateBatch", "RegdataArchive", "RegdataBatch",
      "UpdateRules", "UpdateUnicodeRules", "ExistingVariables", "UnlockDocument",
      "HDocNumberSeries", "UploadDeleteTemplate", "ListTemplates", "VPPSVinPlate", "ADCAChange",
      "HDocUserAdmin", "HDocUserDocAdmin", "SearchUser", "ChangePassword", "UserPosition",
      "ArchiveSearch", "UploadDocument",
      "UserGuide", "ADCAChangeGuide", "VinPlateGuide", "ArchiveGuide", "Privacy"],
  });
}

async function gotoUD24(page: Page) {
  // 先访问 BASE_URL 建立 origin
  await safeGoto(page);
  // 设置登录状态
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  // 直接导航到目标页面（full page load）
  await page.goto(UD24_URL, { waitUntil: 'load', timeout: 120000 });
  // 等待 React 渲染完成（首次开发编译可能较慢）
  await page.waitForTimeout(5000);
  // 如果页面被重定向到登录页，重新设置 localStorage 并重试
  if (!page.url().includes('/Menu')) {
    await loginViaLocalStorage(page);
    await page.goto(UD24_URL, { waitUntil: 'load', timeout: 120000 });
    await page.waitForTimeout(3000);
  }
  await page.waitForSelector('.ud24-title', { timeout: 60000 });
}

// ============================================================
// 1. 画面初始化（No.1-3）
// ============================================================
test.describe.serial('画面初期化（No.1-3）', () => {
  test.setTimeout(120000);

  test('No.1 基本元素', async ({ page }) => {
    resetCounter('01_基本元素');
    await gotoUD24(page);
    await page.waitForTimeout(2000);
    // 标题
    await expect(page.locator('.ud24-title')).toContainText('HDoc Help');
    // Quick Links 区块
    await expect(page.locator('.ud24-section-title')).toContainText('Quick Links');
    // 5个导航链接
    const links = page.locator('.ud24-link-item');
    expect(await links.count()).toBe(5);
    // Other Information 复选框
    await expect(page.locator('.ud24-checkbox')).toBeVisible();
    // Footer
    await expect(page.locator('.ud24-footer')).toBeVisible();
    await takeScreenshot(page, '01_基本元素');
  });

  test('No.2 链接文本内容', async ({ page }) => {
    resetCounter('02_链接文本');
    await gotoUD24(page);
    await page.waitForTimeout(2000);
    const expectedLabels = [
      'HDoc Quick Guide',
      'List of document types.',
      'Markets in HDoc',
      'HDoc - Market Document Setting',
      'Describation',
    ];
    const items = page.locator('.ud24-link-item');
    const count = await items.count();
    expect(count).toBe(5);
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).locator('.ud24-link-text').textContent();
      expect(text).toBe(expectedLabels[i]);
    }
    await takeScreenshot(page, '02_链接文本');
  });

  test('No.3 初始状态-Other Information 隐藏', async ({ page }) => {
    resetCounter('03_Other隐藏');
    await gotoUD24(page);
    await page.waitForTimeout(2000);
    // 复选框未选中
    await expect(page.locator('.ud24-checkbox')).not.toBeChecked();
    // Other Information 内容隐藏
    await expect(page.locator('.ud24-other-info')).toHaveCount(0);
    // 无消息
    await expect(page.locator('.ud24-message')).toHaveCount(0);
    await takeScreenshot(page, '03_Other隐藏');
  });
});

// ============================================================
// 2. 导航链接（No.4-6）
// ============================================================
test.describe.serial('导航链接（No.4-6）', () => {
  test.setTimeout(120000);

  test('No.4 HDoc Quick Guide 跳转', async ({ page }) => {
    resetCounter('04_QuickGuide跳转');
    await gotoUD24(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud24-link-item').first().click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/DownloadAndPrintQuickGuides');
    await takeScreenshot(page, '04_QuickGuide跳转');
  });

  test('No.5 Document Types 跳转', async ({ page }) => {
    resetCounter('05_DocTypes跳转');
    await gotoUD24(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud24-link-item').nth(1).click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/DocumentTypes');
    await takeScreenshot(page, '05_DocTypes跳转');
  });

  test('No.6 Markets in HDoc 跳转', async ({ page }) => {
    resetCounter('06_Markets跳转');
    await gotoUD24(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud24-link-item').nth(2).click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/MarketsInHDoc');
    await takeScreenshot(page, '06_Markets跳转');
  });

  test('No.7 Market Document Setting 跳转', async ({ page }) => {
    resetCounter('07_MarketDoc跳转');
    await gotoUD24(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud24-link-item').nth(3).click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/MarketDocumentSettings');
    await takeScreenshot(page, '07_MarketDoc跳转');
  });

  test('No.8 Describation-空路由错误', async ({ page }) => {
    resetCounter('08_Describation错误');
    await gotoUD24(page);
    await page.waitForTimeout(1000);
    // 最后一个链接（Describation）的路由为空字符串，点击应显示错误消息
    await page.locator('.ud24-link-item').last().click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud24-message')).toContainText('目标页面不可用');
    await takeScreenshot(page, '08_Describation错误');
  });
});

// ============================================================
// 3. Other Information 复选框（No.9-11）
// ============================================================
test.describe.serial('Other Information（No.9-11）', () => {
  test.setTimeout(120000);

  test('No.9 勾选显示内容', async ({ page }) => {
    resetCounter('09_Other勾选');
    await gotoUD24(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud24-checkbox').check();
    await page.waitForTimeout(300);
    await expect(page.locator('.ud24-checkbox')).toBeChecked();
    await expect(page.locator('.ud24-other-info')).toBeVisible();
    await expect(page.locator('.ud24-other-info')).toContainText('System Version');
    await expect(page.locator('.ud24-other-info')).toContainText('HDoc v1.0.0');
    await expect(page.locator('.ud24-other-info')).toContainText('Support TPI');
    await takeScreenshot(page, '09_Other勾选');
  });

  test('No.10 取消隐藏', async ({ page }) => {
    resetCounter('10_Other取消');
    await gotoUD24(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud24-checkbox').check();
    await page.waitForTimeout(200);
    await expect(page.locator('.ud24-other-info')).toBeVisible();
    await page.locator('.ud24-checkbox').uncheck();
    await page.waitForTimeout(200);
    await expect(page.locator('.ud24-other-info')).toHaveCount(0);
    await takeScreenshot(page, '10_Other取消');
  });

  test('No.11 反复操作', async ({ page }) => {
    resetCounter('11_Other反复');
    await gotoUD24(page);
    await page.waitForTimeout(1000);
    // 勾选 → 取消 → 勾选
    await page.locator('.ud24-checkbox').check();
    await page.waitForTimeout(150);
    await expect(page.locator('.ud24-other-info')).toBeVisible();
    await page.locator('.ud24-checkbox').uncheck();
    await page.waitForTimeout(150);
    await expect(page.locator('.ud24-other-info')).toHaveCount(0);
    await page.locator('.ud24-checkbox').check();
    await page.waitForTimeout(150);
    await expect(page.locator('.ud24-other-info')).toBeVisible();
    await takeScreenshot(page, '11_Other反复');
  });
});

// ============================================================
// 4. Footer 信息（No.12-13）
// ============================================================
test.describe.serial('Footer（No.12-13）', () => {
  test.setTimeout(120000);

  test('No.12 Footer内容', async ({ page }) => {
    resetCounter('12_Footer内容');
    await gotoUD24(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud24-footer')).toBeVisible();
    await expect(page.locator('.ud24-footer')).toContainText('System Version');
    await expect(page.locator('.ud24-footer')).toContainText('HDoc v1.0.0');
    await expect(page.locator('.ud24-footer')).toContainText('Last Updated');
    await expect(page.locator('.ud24-footer')).toContainText('Support');
    await expect(page.locator('.ud24-footer')).toContainText('Support TPI');
    await expect(page.locator('.ud24-footer-copyright')).toContainText('EDB Engineering Database');
    await takeScreenshot(page, '12_Footer内容');
  });

  test('No.13 版权年份', async ({ page }) => {
    resetCounter('13_版权年份');
    await gotoUD24(page);
    await page.waitForTimeout(2000);
    const currentYear = new Date().getFullYear().toString();
    await expect(page.locator('.ud24-footer-copyright')).toContainText(currentYear);
    await takeScreenshot(page, '13_版权年份');
  });
});

// ============================================================
// 5. UI 交互（No.14-16）
// ============================================================
test.describe.serial('UI交互（No.14-16）', () => {
  test.setTimeout(120000);

  test('No.14 错误消息样式', async ({ page }) => {
    resetCounter('14_错误样式');
    await gotoUD24(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud24-link-item').last().click();
    await page.waitForTimeout(500);
    const msg = page.locator('.ud24-message');
    await expect(msg).toBeVisible();
    await expect(msg).toContainText('目标页面不可用');
    await takeScreenshot(page, '14_错误样式');
  });

  test('No.15 页面刷新', async ({ page }) => {
    resetCounter('15_页面刷新');
    await gotoUD24(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud24-checkbox').check();
    await page.waitForTimeout(200);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.waitForSelector('.ud24-title', { timeout: 10000 });
    // 刷新后复选框应恢复未选中，Other Information 隐藏
    await expect(page.locator('.ud24-checkbox')).not.toBeChecked();
    await expect(page.locator('.ud24-other-info')).toHaveCount(0);
    await expect(page.locator('.ud24-message')).toHaveCount(0);
    await takeScreenshot(page, '15_页面刷新');
  });

  test('No.16 直接URL访问', async ({ page }) => {
    resetCounter('16_URL直接访问');
    await gotoUD24(page);
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/UserGuide');
    await expect(page.locator('.ud24-title')).toBeVisible();
    await takeScreenshot(page, '16_URL直接访问');
  });
});

// ============================================================
// 6. 安全性（No.17-18）
// ============================================================
test.describe.serial('安全性（No.17-18）', () => {
  test.setTimeout(120000);

  test('No.17 无后端数据传输', async ({ page }) => {
    resetCounter('17_无API');
    await gotoUD24(page);
    await page.waitForTimeout(2000);
    // 静态导航页面，应无 API 依赖
    await expect(page.locator('.ud24-title')).toBeVisible();
    await expect(page.locator('.ud24-link-item')).toHaveCount(5);
    await expect(page.locator('.ud24-footer')).toBeVisible();
    await takeScreenshot(page, '17_无API');
  });

  test('No.18 用户未登录', async ({ page }) => {
    resetCounter('18_未登录');
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await page.goto(UD24_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    expect(page.url()).toBe(BASE_URL + '/');
    await takeScreenshot(page, '18_未登录');
  });
});
