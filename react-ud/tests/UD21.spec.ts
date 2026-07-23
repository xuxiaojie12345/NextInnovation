import { test, expect, Page } from '@playwright/test';

// ============================================================
// MarketsInHDoc 模块 (UD21) Playwright 自动化测试
// 基于 詳細設計UD21.md
// API: POST /api/ud19/UD19SearchResultListApi（operation=GET_MARKET_LIST）
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD21';
const UD21_URL = `${BASE_URL}/Menu/MarketsInHDoc`;

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

async function gotoUD21(page: Page) {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  await page.goto(UD21_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.waitForSelector('.ud21-title', { timeout: 30000 });
}

/** Mock Market List API — success */
async function mockApiSuccess(page: Page, markets: any[]) {
  await page.route('**/api/ud19/UD19SearchResultListApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'GET_MARKET_LIST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { markets } }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock Market List API — empty */
async function mockApiEmpty(page: Page) {
  await page.route('**/api/ud19/UD19SearchResultListApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'GET_MARKET_LIST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { markets: [] } }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock Market List API — 500 */
async function mockApiFail(page: Page) {
  await page.route('**/api/ud19/UD19SearchResultListApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'GET_MARKET_LIST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500, data: null }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock Market List API — network error */
async function mockApiNetError(page: Page) {
  await page.route('**/api/ud19/UD19SearchResultListApi', (route) => route.abort('connectionrefused'));
}

/** Mock with delay for loading test */
async function mockApiWithDelay(page: Page, markets: any[], delay: number = 2000) {
  await page.route('**/api/ud19/UD19SearchResultListApi', async (route) => {
    await new Promise(r => setTimeout(r, delay));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { markets } }) });
  });
}

const MOCK_MARKETS = [
  { MARKET: 'CHN', DESCRIPTION: 'China', WEIGHTS: 'X' },
  { MARKET: 'DEU', DESCRIPTION: 'Germany', WEIGHTS: '' },
  { MARKET: 'JPN', DESCRIPTION: 'Japan', WEIGHTS: 'X(*)' },
];

// ============================================================
// 1. 画面初始化（No.1-3）
// ============================================================
test.describe.serial('画面初期化（No.1-3）', () => {
  test.setTimeout(120000);

  test('No.1 基本元素', async ({ page }) => {
    resetCounter('01_基本元素');
    await mockApiSuccess(page, MOCK_MARKETS);
    await gotoUD21(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud21-title')).toContainText('Markets in HDoc');
    await expect(page.locator('.ud21-table')).toBeVisible();
    const headers = page.locator('.ud21-table th');
    await expect(headers.nth(0)).toContainText('Market');
    await expect(headers.nth(1)).toContainText('Description');
    await expect(headers.nth(2)).toContainText('Weights from Hdoc');
    await takeScreenshot(page, '01_基本元素');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.2 初始状态-无消息', async ({ page }) => {
    resetCounter('02_初始状态');
    await mockApiSuccess(page, MOCK_MARKETS);
    await gotoUD21(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud21-message')).toHaveCount(0);
    await takeScreenshot(page, '02_初始状态');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.3 数据加载-多行显示', async ({ page }) => {
    resetCounter('03_多行显示');
    await mockApiSuccess(page, MOCK_MARKETS);
    await gotoUD21(page);
    await page.waitForTimeout(2000);
    const rows = page.locator('.ud21-table tbody tr');
    expect(await rows.count()).toBe(3);
    // 按 Market 升序：CHN, DEU, JPN
    await expect(rows.nth(0).locator('td').nth(0)).toContainText('CHN');
    await expect(rows.nth(0).locator('td').nth(1)).toContainText('China');
    await expect(rows.nth(0).locator('td').nth(2)).toContainText('X');
    await expect(rows.nth(1).locator('td').nth(0)).toContainText('DEU');
    await expect(rows.nth(1).locator('td').nth(1)).toContainText('Germany');
    await expect(rows.nth(1).locator('td').nth(2)).toContainText('');
    await expect(rows.nth(2).locator('td').nth(0)).toContainText('JPN');
    await expect(rows.nth(2).locator('td').nth(1)).toContainText('Japan');
    await expect(rows.nth(2).locator('td').nth(2)).toContainText('X(*)');
    await takeScreenshot(page, '03_多行显示');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });
});

// ============================================================
// 2. DataTable 显示（No.4-6）
// ============================================================
test.describe.serial('DataTable（No.4-6）', () => {
  test.setTimeout(120000);

  test('No.4 排序-按Market升序', async ({ page }) => {
    resetCounter('04_排序');
    const unsorted = [
      { MARKET: 'JPN', DESCRIPTION: 'Japan', WEIGHTS: '' },
      { MARKET: 'CHN', DESCRIPTION: 'China', WEIGHTS: '' },
      { MARKET: 'DEU', DESCRIPTION: 'Germany', WEIGHTS: '' },
    ];
    await mockApiSuccess(page, unsorted);
    await gotoUD21(page);
    await page.waitForTimeout(2000);
    const rows = page.locator('.ud21-table tbody tr');
    await expect(rows.nth(0).locator('td').nth(0)).toContainText('CHN');
    await expect(rows.nth(1).locator('td').nth(0)).toContainText('DEU');
    await expect(rows.nth(2).locator('td').nth(0)).toContainText('JPN');
    await takeScreenshot(page, '04_排序');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.5 空数据', async ({ page }) => {
    resetCounter('05_空数据');
    await mockApiEmpty(page);
    await gotoUD21(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud21-empty-row')).toContainText('No data found');
    await expect(page.locator('.ud21-message')).toContainText('No data found');
    await takeScreenshot(page, '05_空数据');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.6 全字段表示', async ({ page }) => {
    resetCounter('06_全字段');
    const markets = [
      { MARKET: 'USA', DESCRIPTION: 'United States', WEIGHTS: 'X' },
      { MARKET: 'FRA', DESCRIPTION: 'France', WEIGHTS: 'X(*)' },
    ];
    await mockApiSuccess(page, markets);
    await gotoUD21(page);
    await page.waitForTimeout(2000);
    const firstRow = page.locator('.ud21-table tbody tr').first();
    await expect(firstRow.locator('td').nth(0)).toContainText('FRA');
    await expect(firstRow.locator('td').nth(1)).toContainText('France');
    await expect(firstRow.locator('td').nth(2)).toContainText('X(*)');
    const secondRow = page.locator('.ud21-table tbody tr').nth(1);
    await expect(secondRow.locator('td').nth(0)).toContainText('USA');
    await expect(secondRow.locator('td').nth(1)).toContainText('United States');
    await expect(secondRow.locator('td').nth(2)).toContainText('X');
    await takeScreenshot(page, '06_全字段');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });
});

// ============================================================
// 3. 异常处理（No.7-9）
// ============================================================
test.describe.serial('异常处理（No.7-9）', () => {
  test.setTimeout(180000);

  test('No.7 API 返回 500', async ({ page }) => {
    resetCounter('07_API500');
    await mockApiFail(page);
    await gotoUD21(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud21-message')).toContainText('No data found');
    await takeScreenshot(page, '07_API500');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.8 网络断开', async ({ page }) => {
    resetCounter('08_网络断开');
    await mockApiNetError(page);
    await gotoUD21(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud21-message')).toContainText('系统错误');
    await takeScreenshot(page, '08_网络断开');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.9 加载中显示', async ({ page }) => {
    resetCounter('09_加载中');
    await mockApiWithDelay(page, MOCK_MARKETS, 2000);
    await gotoUD21(page);
    await page.waitForTimeout(500);
    await expect(page.locator('.ud21-loading')).toContainText('Loading');
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud21-loading')).toHaveCount(0);
    await takeScreenshot(page, '09_加载中');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });
});

// ============================================================
// 4. UI 交互（No.10-11）
// ============================================================
test.describe.serial('UI交互（No.10-11）', () => {
  test.setTimeout(120000);

  test('No.10 错误消息样式', async ({ page }) => {
    resetCounter('10_错误样式');
    await mockApiFail(page);
    await gotoUD21(page);
    await page.waitForTimeout(2000);
    const msg = page.locator('.ud21-message');
    await expect(msg).toBeVisible();
    await takeScreenshot(page, '10_错误样式');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.11 页面刷新', async ({ page }) => {
    resetCounter('11_页面刷新');
    await mockApiSuccess(page, MOCK_MARKETS);
    await gotoUD21(page);
    await page.waitForTimeout(2000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.waitForSelector('.ud21-title', { timeout: 10000 });
    await expect(page.locator('.ud21-table')).toBeVisible();
    await expect(page.locator('.ud21-message')).toHaveCount(0);
    await takeScreenshot(page, '11_页面刷新');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });
});

// ============================================================
// 5. 安全性（No.12-13）
// ============================================================
test.describe.serial('安全性（No.12-13）', () => {
  test.setTimeout(120000);

  test('No.12 API请求验证', async ({ page }) => {
    resetCounter('12_API请求');
    let lastBody = '';
    await page.route('**/api/ud19/UD19SearchResultListApi', async (route) => {
      lastBody = route.request().postData() || '';
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { markets: [] } }) });
    });
    await gotoUD21(page);
    await page.waitForTimeout(2000);
    expect(lastBody).toContain('GET_MARKET_LIST');
    await takeScreenshot(page, '12_API请求');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.13 用户未登录', async ({ page }) => {
    resetCounter('13_未登录');
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await page.goto(UD21_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    expect(page.url()).toBe(BASE_URL + '/');
    await takeScreenshot(page, '13_未登录');
  });
});
