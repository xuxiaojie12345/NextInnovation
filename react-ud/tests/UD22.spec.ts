import { test, expect, Page } from '@playwright/test';

// ============================================================
// DocumentTypes 模块 (UD22) Playwright 自动化测试
// 基于 詳細設計UD22.md
// API: GET /api/ud22/getdocumenttypes
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD22';
const UD22_URL = `${BASE_URL}/Menu/DocumentTypes`;

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

async function gotoUD22(page: Page) {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  await page.goto(UD22_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.waitForSelector('.ud22-title', { timeout: 30000 });
}

/** Mock API — success */
async function mockApiSuccess(page: Page, data: any[]) {
  await page.route('**/api/ud22/getdocumenttypes**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data }) });
  });
}

/** Mock API — empty */
async function mockApiEmpty(page: Page) {
  await page.route('**/api/ud22/getdocumenttypes**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: [] }) });
  });
}

/** Mock API — 500 */
async function mockApiFail(page: Page) {
  await page.route('**/api/ud22/getdocumenttypes**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500, data: null }) });
  });
}

/** Mock API — network error */
async function mockApiNetError(page: Page) {
  await page.route('**/api/ud22/getdocumenttypes**', (route) => route.abort('connectionrefused'));
}

/** Mock with delay for loading test */
async function mockApiWithDelay(page: Page, data: any[], delay: number = 2000) {
  await page.route('**/api/ud22/getdocumenttypes**', async (route) => {
    await new Promise(r => setTimeout(r, delay));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data }) });
  });
}

const MOCK_DOC_TYPES = [
  { Key: 'COC', Description: 'Certificate of Conformity' },
  { Key: 'EEC', Description: 'European Economic Community' },
  { Key: 'VCC', Description: 'Vehicle Certification Code' },
];

// ============================================================
// 1. 画面初始化（No.1-3）
// ============================================================
test.describe.serial('画面初期化（No.1-3）', () => {
  test.setTimeout(120000);

  test('No.1 基本元素', async ({ page }) => {
    resetCounter('01_基本元素');
    await mockApiSuccess(page, MOCK_DOC_TYPES);
    await gotoUD22(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud22-title')).toContainText('Document Types');
    await expect(page.locator('.ud22-table')).toBeVisible();
    const headers = page.locator('.ud22-table th');
    await expect(headers.nth(0)).toContainText('Key');
    await expect(headers.nth(1)).toContainText('Description');
    await takeScreenshot(page, '01_基本元素');
    await page.unroute('**/api/ud22/getdocumenttypes**');
  });

  test('No.2 初始状态', async ({ page }) => {
    resetCounter('02_初始状态');
    await mockApiSuccess(page, MOCK_DOC_TYPES);
    await gotoUD22(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud22-message')).toHaveCount(0);
    await takeScreenshot(page, '02_初始状态');
    await page.unroute('**/api/ud22/getdocumenttypes**');
  });

  test('No.3 多行数据', async ({ page }) => {
    resetCounter('03_多行数据');
    await mockApiSuccess(page, MOCK_DOC_TYPES);
    await gotoUD22(page);
    await page.waitForTimeout(2000);
    const rows = page.locator('.ud22-table tbody tr');
    expect(await rows.count()).toBe(3);
    // 按 Key 升序排序
    await expect(rows.nth(0).locator('td').nth(0)).toContainText('COC');
    await expect(rows.nth(0).locator('td').nth(1)).toContainText('Certificate of Conformity');
    await expect(rows.nth(1).locator('td').nth(0)).toContainText('EEC');
    await expect(rows.nth(1).locator('td').nth(1)).toContainText('European Economic Community');
    await expect(rows.nth(2).locator('td').nth(0)).toContainText('VCC');
    await expect(rows.nth(2).locator('td').nth(1)).toContainText('Vehicle Certification Code');
    await takeScreenshot(page, '03_多行数据');
    await page.unroute('**/api/ud22/getdocumenttypes**');
  });
});

// ============================================================
// 2. DataTable 显示（No.4-5）
// ============================================================
test.describe.serial('DataTable（No.4-5）', () => {
  test.setTimeout(120000);

  test('No.4 排序-按Key升序', async ({ page }) => {
    resetCounter('04_排序');
    const unsorted = [
      { Key: 'VCC', Description: 'Vehicle Certification Code' },
      { Key: 'COC', Description: 'Certificate of Conformity' },
      { Key: 'EEC', Description: 'European Economic Community' },
    ];
    await mockApiSuccess(page, unsorted);
    await gotoUD22(page);
    await page.waitForTimeout(2000);
    const rows = page.locator('.ud22-table tbody tr');
    await expect(rows.nth(0).locator('td').nth(0)).toContainText('COC');
    await expect(rows.nth(1).locator('td').nth(0)).toContainText('EEC');
    await expect(rows.nth(2).locator('td').nth(0)).toContainText('VCC');
    await takeScreenshot(page, '04_排序');
    await page.unroute('**/api/ud22/getdocumenttypes**');
  });

  test('No.5 空数据', async ({ page }) => {
    resetCounter('05_空数据');
    await mockApiEmpty(page);
    await gotoUD22(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud22-empty-row')).toContainText('No data found');
    await expect(page.locator('.ud22-message')).toContainText('无法获取文档类型信息');
    await takeScreenshot(page, '05_空数据');
    await page.unroute('**/api/ud22/getdocumenttypes**');
  });
});

// ============================================================
// 3. 异常处理（No.6-8）
// ============================================================
test.describe.serial('异常处理（No.6-8）', () => {
  test.setTimeout(180000);

  test('No.6 API 返回 500', async ({ page }) => {
    resetCounter('06_API500');
    await mockApiFail(page);
    await gotoUD22(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud22-message')).toContainText('无法获取文档类型信息');
    await takeScreenshot(page, '06_API500');
    await page.unroute('**/api/ud22/getdocumenttypes**');
  });

  test('No.7 网络断开', async ({ page }) => {
    resetCounter('07_网络断开');
    await mockApiNetError(page);
    await gotoUD22(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud22-message')).toContainText('系统错误');
    await takeScreenshot(page, '07_网络断开');
    await page.unroute('**/api/ud22/getdocumenttypes**');
  });

  test('No.8 加载中显示', async ({ page }) => {
    resetCounter('08_加载中');
    await mockApiWithDelay(page, MOCK_DOC_TYPES, 2000);
    await gotoUD22(page);
    await page.waitForTimeout(500);
    await expect(page.locator('.ud22-loading')).toContainText('Loading');
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud22-loading')).toHaveCount(0);
    await takeScreenshot(page, '08_加载中');
    await page.unroute('**/api/ud22/getdocumenttypes**');
  });
});

// ============================================================
// 4. UI 交互（No.9-10）
// ============================================================
test.describe.serial('UI交互（No.9-10）', () => {
  test.setTimeout(120000);

  test('No.9 错误消息样式', async ({ page }) => {
    resetCounter('09_错误样式');
    await mockApiFail(page);
    await gotoUD22(page);
    await page.waitForTimeout(2000);
    const msg = page.locator('.ud22-message');
    await expect(msg).toBeVisible();
    await takeScreenshot(page, '09_错误样式');
    await page.unroute('**/api/ud22/getdocumenttypes**');
  });

  test('No.10 页面刷新', async ({ page }) => {
    resetCounter('10_页面刷新');
    await mockApiSuccess(page, MOCK_DOC_TYPES);
    await gotoUD22(page);
    await page.waitForTimeout(2000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.waitForSelector('.ud22-title', { timeout: 10000 });
    await expect(page.locator('.ud22-table')).toBeVisible();
    await expect(page.locator('.ud22-message')).toHaveCount(0);
    await takeScreenshot(page, '10_页面刷新');
    await page.unroute('**/api/ud22/getdocumenttypes**');
  });
});

// ============================================================
// 5. 安全性（No.11-12）
// ============================================================
test.describe.serial('安全性（No.11-12）', () => {
  test.setTimeout(120000);

  test('No.11 API请求验证', async ({ page }) => {
    resetCounter('11_API请求');
    let requestUrl = '';
    await page.route('**/api/ud22/getdocumenttypes**', async (route) => {
      requestUrl = route.request().url();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: [] }) });
    });
    await gotoUD22(page);
    await page.waitForTimeout(2000);
    expect(requestUrl).toContain('/api/ud22/getdocumenttypes');
    await takeScreenshot(page, '11_API请求');
    await page.unroute('**/api/ud22/getdocumenttypes**');
  });

  test('No.12 用户未登录', async ({ page }) => {
    resetCounter('12_未登录');
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await page.goto(UD22_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    expect(page.url()).toBe(BASE_URL + '/');
    await takeScreenshot(page, '12_未登录');
  });
});
