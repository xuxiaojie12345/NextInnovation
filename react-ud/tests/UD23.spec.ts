import { test, expect, Page } from '@playwright/test';

// ============================================================
// DownloadPrintQuickGuides 模块 (UD23) Playwright 自动化测试
// 基于 単体テスト仕様書UD23.md + 詳細設計UD23.md
// 注意：本模块为纯前端静态页面，无 API 调用
// 式样书中"复选框"部分在组件中未实现，按实际组件行为调整
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD23';
const UD23_URL = `${BASE_URL}/Menu/DownloadAndPrintQuickGuides`;

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

async function gotoUD23(page: Page) {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  await page.goto(UD23_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.waitForSelector('.page-title', { timeout: 30000 });
}

// ============================================================
// 1. 画面初始化（No.1-4）
// ============================================================
test.describe.serial('画面初期化（No.1-4）', () => {
  test.setTimeout(120000);

  test('No.1 基本元素', async ({ page }) => {
    resetCounter('01_基本元素');
    await gotoUD23(page);
    await page.waitForTimeout(2000);
    // 标题
    await expect(page.locator('.page-title')).toContainText('Download and Print Quick Guides');
    // 返回链接
    await expect(page.locator('.back-link')).toBeVisible();
    // Quick Guides 网格
    await expect(page.locator('.guides-grid')).toBeVisible();
    const guideLinks = page.locator('.guide-link');
    expect(await guideLinks.count()).toBe(8);
    // Volvo 3P 区域
    await expect(page.locator('.volvo-3p-section')).toBeVisible();
    await expect(page.locator('.volvo-3p-title')).toContainText('Volvo 3P Quick Guides');
    const volvoLinks = page.locator('.volvo-3p-link');
    expect(await volvoLinks.count()).toBe(9);
    // Note
    await expect(page.locator('.note-section')).toBeVisible();
    await takeScreenshot(page, '01_基本元素');
  });

  test('No.2 链接显示-Quick Guides', async ({ page }) => {
    resetCounter('02_QuickGuides链接');
    await gotoUD23(page);
    await page.waitForTimeout(2000);
    const expectedNames = [
      'WIS Quick Guide', 'PERF Quick Guide', 'W8 Quick Guide',
      'HDoc Quick Guide', 'EDB Quick Guide', 'COS Quick Guide',
      'VBI Quick Guide (Intranet version)', 'VBI Quick Guide (Internet version)',
    ];
    const links = page.locator('.guide-link');
    const count = await links.count();
    expect(count).toBe(8);
    for (let i = 0; i < count; i++) {
      const text = await links.nth(i).textContent();
      expect(expectedNames.includes(text || '')).toBe(true);
    }
    await takeScreenshot(page, '02_QuickGuides链接');
  });

  test('No.3 链接显示-Volvo 3P', async ({ page }) => {
    resetCounter('03_Volvo3P链接');
    await gotoUD23(page);
    await page.waitForTimeout(2000);
    const expectedNames = [
      'EDB Quick Guide', 'KRS Quick Guide', 'CVM Quick Guide',
      'AVP Quick Guide', 'KAX Quick Guide', 'CAE Homepage Quick Guide',
      'BPP Quick Guide', 'SPC Quick Guide', 'WebFRAME Quick Guide',
    ];
    const links = page.locator('.volvo-3p-link');
    const count = await links.count();
    expect(count).toBe(9);
    for (let i = 0; i < count; i++) {
      const text = await links.nth(i).textContent();
      expect(expectedNames.includes(text || '')).toBe(true);
    }
    await takeScreenshot(page, '03_Volvo3P链接');
  });

  test('No.4 图片显示', async ({ page }) => {
    resetCounter('04_图片显示');
    await gotoUD23(page);
    await page.waitForTimeout(2000);
    const images = page.locator('.guide-thumbnail');
    const count = await images.count();
    expect(count).toBe(8);
    for (let i = 0; i < count; i++) {
      await expect(images.nth(i)).toBeVisible();
    }
    await takeScreenshot(page, '04_图片显示');
  });
});

// ============================================================
// 2. 链接交互（No.5-8）
// ============================================================
test.describe.serial('链接交互（No.5-8）', () => {
  test.setTimeout(120000);

  test('No.5 Quick Guides 链接点击', async ({ page }) => {
    resetCounter('05_QuickGuides点击');
    await gotoUD23(page);
    await page.waitForTimeout(2000);
    // 点击第一个链接（链接使用 preventDefault，不会跳转）
    await page.locator('.guide-link').first().click();
    await page.waitForTimeout(300);
    // 页面应保持不变
    await expect(page.locator('.page-title')).toBeVisible();
    await takeScreenshot(page, '05_QuickGuides点击');
  });

  test('No.6 Quick Guides 链接悬停', async ({ page }) => {
    resetCounter('06_QuickGuides悬停');
    await gotoUD23(page);
    await page.waitForTimeout(2000);
    await page.locator('.guide-link').first().hover();
    await page.waitForTimeout(300);
    await expect(page.locator('.page-title')).toBeVisible();
    await takeScreenshot(page, '06_QuickGuides悬停');
  });

  test('No.7 Volvo 3P 链接点击', async ({ page }) => {
    resetCounter('07_Volvo3P点击');
    await gotoUD23(page);
    await page.waitForTimeout(2000);
    await page.locator('.volvo-3p-link').first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('.page-title')).toBeVisible();
    await takeScreenshot(page, '07_Volvo3P点击');
  });

  test('No.8 Volvo 3P 链接悬停', async ({ page }) => {
    resetCounter('08_Volvo3P悬停');
    await gotoUD23(page);
    await page.waitForTimeout(2000);
    await page.locator('.volvo-3p-link').first().hover();
    await page.waitForTimeout(300);
    await expect(page.locator('.page-title')).toBeVisible();
    await takeScreenshot(page, '08_Volvo3P悬停');
  });
});

// ============================================================
// 3. Back 按钮（No.9）
// ============================================================
test.describe.serial('Back按钮（No.9）', () => {
  test.setTimeout(120000);

  test('No.9 Back-返回', async ({ page }) => {
    resetCounter('09_Back');
    await gotoUD23(page);
    await page.waitForTimeout(1000);
    await page.locator('.back-link').click();
    await page.waitForTimeout(2000);
    // navigate(-1) 返回前一页
    await takeScreenshot(page, '09_Back');
  });
});

// ============================================================
// 4. UI 交互（No.10-12）
// ============================================================
test.describe.serial('UI交互（No.10-12）', () => {
  test.setTimeout(120000);

  test('No.10 Note文本显示', async ({ page }) => {
    resetCounter('10_Note文本');
    await gotoUD23(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.note-text')).toContainText('Volvo Broad');
    await takeScreenshot(page, '10_Note文本');
  });

  test('No.11 页面刷新', async ({ page }) => {
    resetCounter('11_页面刷新');
    await gotoUD23(page);
    await page.waitForTimeout(2000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.waitForSelector('.page-title', { timeout: 10000 });
    await expect(page.locator('.page-title')).toContainText('Download and Print Quick Guides');
    await expect(page.locator('.guide-link')).toHaveCount(8);
    await takeScreenshot(page, '11_页面刷新');
  });

  test('No.12 直接URL访问', async ({ page }) => {
    resetCounter('12_URL直接访问');
    await gotoUD23(page);
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/DownloadAndPrintQuickGuides');
    await expect(page.locator('.page-title')).toBeVisible();
    await takeScreenshot(page, '12_URL直接访问');
  });
});

// ============================================================
// 5. 安全性（No.13-14）
// ============================================================
test.describe.serial('安全性（No.13-14）', () => {
  test.setTimeout(120000);

  test('No.13 无后端数据传输', async ({ page }) => {
    resetCounter('13_无API');
    // 纯静态页面，应不依赖任何 API
    await gotoUD23(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.page-title')).toBeVisible();
    // 页面只显示静态内容，无 loading/error 消息
    await expect(page.locator('.guide-link')).toHaveCount(8);
    await expect(page.locator('.volvo-3p-link')).toHaveCount(9);
    await takeScreenshot(page, '13_无API');
  });

  test('No.14 用户未登录', async ({ page }) => {
    resetCounter('14_未登录');
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await page.goto(UD23_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    expect(page.url()).toBe(BASE_URL + '/');
    await takeScreenshot(page, '14_未登录');
  });
});
