import { test, expect, Page } from '@playwright/test';
import { insertUD03TestData, cleanupUD03TestData } from './test-data-helper';

// ============================================================
// MarketDocumentSettingsList 模块 (UD20) Playwright 自动化测试
// 基于 詳細設計UD20.md
// API: GET /api/ud20/marketdocumentsettings
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD20';
const UD20_URL = `${BASE_URL}/Menu/MarketDocumentSettingsList`;

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

async function gotoUD20(page: Page, searchParams: string = '') {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  const url = searchParams ? `${UD20_URL}?${searchParams}` : UD20_URL;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.waitForSelector('.ud20-title', { timeout: 30000 });
}

/** Mock API — success */
async function mockApiSuccess(page: Page, data: any[]) {
  await page.route('**/api/ud20/marketdocumentsettings**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data }) });
  });
}

/** Mock API — empty */
async function mockApiEmpty(page: Page) {
  await page.route('**/api/ud20/marketdocumentsettings**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: [] }) });
  });
}

/** Mock API — 500 */
async function mockApiFail(page: Page) {
  await page.route('**/api/ud20/marketdocumentsettings**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500, data: null }) });
  });
}

/** Mock API — network error */
async function mockApiNetError(page: Page) {
  await page.route('**/api/ud20/marketdocumentsettings**', (route) => route.abort('connectionrefused'));
}

/** Mock API with delay for loading test */
async function mockApiWithDelay(page: Page, data: any[], delay: number = 3000) {
  await page.route('**/api/ud20/marketdocumentsettings**', async (route) => {
    await new Promise(r => setTimeout(r, delay));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data }) });
  });
}

const MOCK_DOCUMENTS = [
  { DOCTYPE: 'COC', UPDATE_USER: 'admin', REGISTER_DATETIME: '2026-01-15 10:30:00' },
  { DOCTYPE: 'VCC', UPDATE_USER: 'operator', REGISTER_DATETIME: '2026-02-20 14:00:00' },
  { DOCTYPE: 'EEC', UPDATE_USER: 'admin', REGISTER_DATETIME: '2026-03-10 09:00:00' },
];

// ============================================================
// 1. 画面初始化（No.1-3）
// ============================================================
test.describe.serial('画面初期化（No.1-3）', () => {
  test.setTimeout(120000);

  test('No.1 基本元素', async ({ page }) => {
    resetCounter('01_基本元素');
    await mockApiSuccess(page, MOCK_DOCUMENTS);
    await gotoUD20(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud20-title')).toContainText('Market Document Settings');
    // 3个按钮
    const btns = ['Select', 'Back', 'Print'];
    for (const btn of btns) {
      await expect(page.locator('.action-button').filter({ hasText: btn })).toBeVisible();
      await expect(page.locator('.action-button').filter({ hasText: btn })).toBeEnabled();
    }
    // 表格
    await expect(page.locator('.ud20-table')).toBeVisible();
    const headers = page.locator('.ud20-table th');
    await expect(headers.nth(1)).toContainText('Document type');
    await expect(headers.nth(2)).toContainText('Bussines unit');
    await expect(headers.nth(3)).toContainText('User');
    await expect(headers.nth(4)).toContainText('Date');
    await takeScreenshot(page, '01_基本元素');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });

  test('No.2 数据加载', async ({ page }) => {
    resetCounter('02_数据加载');
    await mockApiSuccess(page, MOCK_DOCUMENTS);
    await gotoUD20(page);
    await page.waitForTimeout(2000);
    const rows = page.locator('.ud20-table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    await takeScreenshot(page, '02_数据加载');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });

  test('No.3 初始状态-无消息', async ({ page }) => {
    resetCounter('03_初始状态');
    await mockApiSuccess(page, MOCK_DOCUMENTS);
    await gotoUD20(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud20-message')).toHaveCount(0);
    // 无选中行
    await expect(page.locator('.ud20-row-selected')).toHaveCount(0);
    await takeScreenshot(page, '03_初始状态');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });
});

// ============================================================
// 2. DataTable 显示（No.4-6）
// ============================================================
test.describe.serial('DataTable（No.4-6）', () => {
  test.setTimeout(120000);

  test('No.4 列内容显示', async ({ page }) => {
    resetCounter('04_列内容');
    await mockApiSuccess(page, MOCK_DOCUMENTS);
    await gotoUD20(page);
    await page.waitForTimeout(2000);
    const firstRow = page.locator('.ud20-table tbody tr').first();
    await expect(firstRow.locator('td').nth(1)).toContainText('EEC');
    await expect(firstRow.locator('td').nth(2)).toContainText('BU');
    await expect(firstRow.locator('td').nth(3)).toContainText('admin');
    await expect(firstRow.locator('td').nth(4)).toContainText('2026-03-10');
    await takeScreenshot(page, '04_列内容');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });

  test('No.5 空数据', async ({ page }) => {
    resetCounter('05_空数据');
    await mockApiEmpty(page);
    await gotoUD20(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud20-empty-row')).toContainText('No data found');
    await expect(page.locator('.ud20-message.error')).toContainText('No data found');
    await takeScreenshot(page, '05_空数据');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });

  test('No.6 日期降序排序', async ({ page }) => {
    resetCounter('06_排序');
    await mockApiSuccess(page, MOCK_DOCUMENTS);
    await gotoUD20(page);
    await page.waitForTimeout(2000);
    // 按日期降序：EEC(2026-03-10) > VCC(2026-02-20) > COC(2026-01-15)
    const firstDoc = page.locator('.ud20-table tbody tr').nth(0).locator('td').nth(1);
    const secondDoc = page.locator('.ud20-table tbody tr').nth(1).locator('td').nth(1);
    const thirdDoc = page.locator('.ud20-table tbody tr').nth(2).locator('td').nth(1);
    await expect(firstDoc).toContainText('EEC');
    await expect(secondDoc).toContainText('VCC');
    await expect(thirdDoc).toContainText('COC');
    await takeScreenshot(page, '06_排序');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });
});

// ============================================================
// 3. Radio 选择（No.7-9）
// ============================================================
test.describe.serial('Radio选择（No.7-9）', () => {
  test.setTimeout(120000);

  test('No.7 单行选择', async ({ page }) => {
    resetCounter('07_单行选择');
    await mockApiSuccess(page, MOCK_DOCUMENTS);
    await gotoUD20(page);
    await page.waitForTimeout(2000);
    await page.locator('.ud20-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('.ud20-row-selected')).toHaveCount(1);
    await takeScreenshot(page, '07_单行选择');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });

  test('No.8 切换选择', async ({ page }) => {
    resetCounter('08_切换选择');
    await mockApiSuccess(page, MOCK_DOCUMENTS);
    await gotoUD20(page);
    await page.waitForTimeout(2000);
    await page.locator('.ud20-table tbody tr').first().click();
    await page.waitForTimeout(200);
    await page.locator('.ud20-table tbody tr').nth(1).click();
    await page.waitForTimeout(200);
    expect(await page.locator('.ud20-row-selected').count()).toBe(1);
    await takeScreenshot(page, '08_切换选择');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });

  test('No.9 点击行触发Radio', async ({ page }) => {
    resetCounter('09_点击行选Radio');
    await mockApiSuccess(page, MOCK_DOCUMENTS);
    await gotoUD20(page);
    await page.waitForTimeout(2000);
    await page.locator('.ud20-table tbody tr').nth(2).locator('td').nth(1).click();
    await page.waitForTimeout(300);
    await expect(page.locator('.ud20-row-selected')).toBeVisible();
    await takeScreenshot(page, '09_点击行选Radio');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });
});

// ============================================================
// 4. Select 按钮（No.10-11）
// ============================================================
test.describe.serial('Select（No.10-11）', () => {
  test.setTimeout(120000);

  test('No.10 Select-未选中时点击', async ({ page }) => {
    resetCounter('10_Select未选中');
    await mockApiSuccess(page, MOCK_DOCUMENTS);
    await gotoUD20(page);
    await page.waitForTimeout(2000);
    await page.locator('.action-button').filter({ hasText: 'Select' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud20-message.error')).toContainText('No data found');
    await takeScreenshot(page, '10_Select未选中');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });

  test('No.11 Select-选中后返回', async ({ page }) => {
    resetCounter('11_Select选中');
    await mockApiSuccess(page, MOCK_DOCUMENTS);
    await gotoUD20(page);
    await page.waitForTimeout(2000);
    await page.locator('.ud20-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.locator('.action-button').filter({ hasText: 'Select' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud20-1-title')).toBeVisible();
    await takeScreenshot(page, '11_Select选中');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });
});

// ============================================================
// 5. Back 按钮（No.12-13）
// ============================================================
test.describe.serial('Back（No.12-13）', () => {
  test.setTimeout(120000);

  test('No.12 Back-返回', async ({ page }) => {
    resetCounter('12_Back');
    await mockApiSuccess(page, MOCK_DOCUMENTS);
    await gotoUD20(page);
    await page.waitForTimeout(2000);
    await page.locator('.action-button').filter({ hasText: 'Back' }).click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/MarketDocumentSettings');
    await takeScreenshot(page, '12_Back');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });
});

// ============================================================
// 6. Print 按钮（No.13）
// ============================================================
test.describe.serial('Print（No.13）', () => {
  test.setTimeout(120000);

  test('No.13 Print-打印', async ({ page }) => {
    resetCounter('13_Print');
    await mockApiSuccess(page, MOCK_DOCUMENTS);
    await gotoUD20(page);
    await page.waitForTimeout(2000);
    let printCalled = false;
    await page.evaluate(() => { window.print = () => { (window as any).__printCalled = true; }; });
    await page.locator('.action-button').filter({ hasText: 'Print' }).click();
    await page.waitForTimeout(500);
    const wasCalled = await page.evaluate(() => (window as any).__printCalled === true);
    expect(wasCalled).toBe(true);
    await expect(page.locator('.ud20-print-timestamp')).toBeVisible();
    await takeScreenshot(page, '13_Print');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });
});

// ============================================================
// 7. User 链接（No.14）
// ============================================================
test.describe.serial('User链接（No.14）', () => {
  test.setTimeout(120000);

  test('No.14 User链接-跳转', async ({ page }) => {
    resetCounter('14_User链接');
    await mockApiSuccess(page, MOCK_DOCUMENTS);
    await gotoUD20(page);
    await page.waitForTimeout(2000);
    // window.open(_blank) 会打开新标签页，需捕获新 Page
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      page.locator('.ud20-user-link').first().click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    await newPage.waitForTimeout(2000);
    expect(newPage.url()).toContain('/Menu/EDBUserView');
    await takeScreenshot(newPage, '14_User链接');
    await newPage.close();
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });
});

// ============================================================
// 8. 异常处理（No.15-17）
// ============================================================
test.describe.serial('异常处理（No.15-17）', () => {
  test.setTimeout(180000);

  test('No.15 API 500', async ({ page }) => {
    resetCounter('15_API500');
    await mockApiFail(page);
    await gotoUD20(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud20-message.error')).toContainText('No data found');
    await takeScreenshot(page, '15_API500');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });

  test('No.16 网络断开', async ({ page }) => {
    resetCounter('16_网络断开');
    await mockApiNetError(page);
    await gotoUD20(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud20-message.error')).toContainText('网络连接失败');
    await takeScreenshot(page, '16_网络断开');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });

  test('No.17 加载中按钮禁用', async ({ page }) => {
    resetCounter('17_加载中禁用');
    await mockApiWithDelay(page, MOCK_DOCUMENTS, 3000);
    await gotoUD20(page);
    await page.waitForTimeout(500);
    const buttons = page.locator('.action-button');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toBeDisabled();
    }
    await takeScreenshot(page, '17_加载中禁用');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });
});

// ============================================================
// 9. UI 交互（No.18-19）
// ============================================================
test.describe.serial('UI交互（No.18-19）', () => {
  test.setTimeout(120000);

  test('No.18 错误消息样式', async ({ page }) => {
    resetCounter('18_错误样式');
    await mockApiSuccess(page, MOCK_DOCUMENTS);
    await gotoUD20(page);
    await page.waitForTimeout(2000);
    await page.locator('.action-button').filter({ hasText: 'Select' }).click();
    await page.waitForTimeout(500);
    const msg = page.locator('.ud20-message.error');
    await expect(msg).toBeVisible();
    await takeScreenshot(page, '18_错误样式');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });

  test('No.19 页面刷新', async ({ page }) => {
    resetCounter('19_页面刷新');
    await mockApiSuccess(page, MOCK_DOCUMENTS);
    await gotoUD20(page);
    await page.waitForTimeout(2000);
    await page.locator('.ud20-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.waitForSelector('.ud20-title', { timeout: 10000 });
    await expect(page.locator('.ud20-row-selected')).toHaveCount(0);
    await expect(page.locator('.ud20-message')).toHaveCount(0);
    await takeScreenshot(page, '19_页面刷新');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });
});

// ============================================================
// 10. 安全性（No.20-22）
// ============================================================
test.describe.serial('安全性（No.20-22）', () => {
  test.setTimeout(120000);

  test('No.20 API请求验证', async ({ page }) => {
    resetCounter('20_API请求');
    let requestUrl = '';
    await page.route('**/api/ud20/marketdocumentsettings**', async (route) => {
      requestUrl = route.request().url();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: MOCK_DOCUMENTS }) });
    });
    await gotoUD20(page);
    await page.waitForTimeout(2000);
    expect(requestUrl).toContain('/api/ud20/marketdocumentsettings');
    await takeScreenshot(page, '20_API请求');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });

  test('No.21 用户未登录', async ({ page }) => {
    resetCounter('21_未登录');
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await page.goto(UD20_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    expect(page.url()).toBe(BASE_URL + '/');
    await takeScreenshot(page, '21_未登录');
  });

  test('No.22 从UD20-1携带条件跳转', async ({ page }) => {
    resetCounter('22_条件跳转');
    await mockApiSuccess(page, MOCK_DOCUMENTS);
    // 模拟从 UD20-1 携带 documentType=COC 参数跳转
    await gotoUD20(page, 'documentType=COC&documentTypeOp==');
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud20-table')).toBeVisible();
    const rows = page.locator('.ud20-table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    await takeScreenshot(page, '22_条件跳转');
    await page.unroute('**/api/ud20/marketdocumentsettings**');
  });
});
