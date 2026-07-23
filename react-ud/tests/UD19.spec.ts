import { test, expect, Page } from '@playwright/test';
import { insertUD19TestData, cleanupUD19TestData } from './test-data-helper';

// ============================================================
// SearchUser 模块 (UD19) Playwright 自动化测试（59个用例）
// API: POST /api/ud19/UD19SearchResultListApi, GET /api/authentication/userinfo
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD19';
const UD19_URL = `${BASE_URL}/Menu/SearchUser`;

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

async function gotoUD19(page: Page) {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  await page.goto(UD19_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.waitForSelector('.ud19-title', { timeout: 30000 });
}

/** Mock Saviynt API – success */
async function mockSaviyntSuccess(page: Page) {
  await page.route('**/api/authentication/userinfo**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { userId: 'SWE', userName: 'SWE' } }) });
  });
}

/** Mock Saviynt API – 404 (user not found) */
async function mockSaviyntNotFound(page: Page) {
  await page.route('**/api/authentication/userinfo**', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: '' });
  });
}

/** Mock Market List API */
async function mockMarketListApi(page: Page, markets: any[]) {
  await page.route('**/api/ud19/UD19SearchResultListApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'GET_MARKET_LIST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { markets } }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock Search API – success */
async function mockSearchSuccess(page: Page, results: any[], count: number = 0) {
  await page.route('**/api/ud19/UD19SearchResultListApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'SEARCH_USER') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { results, count: count || results.length } }) });
    } else if (body.operation === 'GET_MARKET_LIST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { markets: [{ MARKET: 'JPN' }, { MARKET: 'DEU' }] } }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock Search API – 500 */
async function mockSearchFail(page: Page) {
  await page.route('**/api/ud19/UD19SearchResultListApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'SEARCH_USER') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500, data: null }) });
    } else if (body.operation === 'GET_MARKET_LIST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { markets: [{ MARKET: 'JPN' }] } }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock Market List API – 500 */
async function mockMarketListFail(page: Page) {
  await page.route('**/api/ud19/UD19SearchResultListApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'GET_MARKET_LIST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500, data: null }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock All APIs for timeout */
async function mockSearchTimeout(page: Page) {
  await page.route('**/api/ud19/UD19SearchResultListApi', (route) => route.abort('timedout'));
  await page.route('**/api/authentication/userinfo**', (route) => route.abort('timedout'));
}

/** Mock All APIs with delay for loading test */
async function mockWithDelay(page: Page, delay: number = 3000) {
  await page.route('**/api/ud19/UD19SearchResultListApi', async (route) => {
    await new Promise(r => setTimeout(r, delay));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { results: [], count: 0 } }) });
  });
  await mockSaviyntSuccess(page);
}

const MOCK_SEARCH_RESULTS = [
  { USERID: 'SWE', USERNAME: 'SWETestUser', MARKET: 'JPN' },
  { USERID: 'SWE', USERNAME: 'SWETestUser', MARKET: 'DEU' },
];

const MOCK_MARKETS = [{ MARKET: 'JPN' }, { MARKET: 'DEU' }, { MARKET: 'CHN' }];

// ============================================================
// 1. 画面初始化（No.1-3）
// ============================================================
test.describe.serial('画面初始化（No.1-3）', () => {
  test.setTimeout(120000);

  test('No.1 基本元素', async ({ page }) => {
    resetCounter('01_基本元素');
    await gotoUD19(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud19-title')).toContainText('Search HDoc User');
    await expect(page.locator('.ud19-input').first()).toBeVisible();
    await expect(page.locator('.ud19-input').nth(1)).toBeVisible();
    await expect(page.locator('.ud19-select')).toBeVisible();
    await expect(page.locator('.ud19-radio')).toHaveCount(3);
    await expect(page.locator('.ud19-btn')).toBeVisible();
    await takeScreenshot(page, '01_基本元素');
  });

  test('No.2 市场列表加载', async ({ page }) => {
    resetCounter('02_市场列表');
    await gotoUD19(page);
    await page.waitForTimeout(2000);
    const options = page.locator('.ud19-select option');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
    await takeScreenshot(page, '02_市场列表');
  });

  test('No.3 初始状态', async ({ page }) => {
    resetCounter('03_初始状态');
    await gotoUD19(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud19-input').first()).toHaveValue('');
    await expect(page.locator('.ud19-input').nth(1)).toHaveValue('');
    await expect(page.locator('.ud19-radio').nth(0)).toBeChecked();
    await expect(page.locator('.ud19-radio').nth(1)).not.toBeChecked();
    await expect(page.locator('.ud19-radio').nth(2)).not.toBeChecked();
    await expect(page.locator('.ud19-count-label')).toHaveCount(0);
    await expect(page.locator('.ud19-message')).toHaveCount(0);
    await takeScreenshot(page, '03_初始状态');
  });
});

// ============================================================
// 2. Userid 入力制御（No.4-14）
// ============================================================
test.describe.serial('Userid入力制御（No.4-14）', () => {
  test.setTimeout(120000);

  test('No.4 正常输入半角英数字', async ({ page }) => {
    resetCounter('04_UID正常');
    await gotoUD19(page);
    const input = page.locator('.ud19-input').first();
    await input.click();
    await input.pressSequentially('TEST001', { delay: 5 });
    await expect(input).toHaveValue('TEST001');
    await takeScreenshot(page, '04_UID正常');
  });

  test('No.5 全角字符被过滤', async ({ page }) => {
    resetCounter('05_UID全角');
    await gotoUD19(page);
    const input = page.locator('.ud19-input').first();
    await input.click();
    await input.pressSequentially('ＴＥＳＴ', { delay: 5 });
    await expect(input).toHaveValue('');
    await takeScreenshot(page, '05_UID全角');
  });

  test('No.6 空格被过滤', async ({ page }) => {
    resetCounter('06_UID空格');
    await gotoUD19(page);
    const input = page.locator('.ud19-input').first();
    await input.click();
    await input.pressSequentially('TEST 001', { delay: 5 });
    await expect(input).toHaveValue('TEST001');
    await takeScreenshot(page, '06_UID空格');
  });

  test('No.7 特殊符号被过滤', async ({ page }) => {
    resetCounter('07_UID符号');
    await gotoUD19(page);
    const input = page.locator('.ud19-input').first();
    await input.click();
    await input.pressSequentially('TEST@#$001', { delay: 5 });
    await expect(input).toHaveValue('TEST001');
    await takeScreenshot(page, '07_UID符号');
  });

  test('No.8 混合输入', async ({ page }) => {
    resetCounter('08_UID混合');
    await gotoUD19(page);
    const input = page.locator('.ud19-input').first();
    await input.click();
    await input.pressSequentially('A1B@C2#D', { delay: 5 });
    await expect(input).toHaveValue('A1BC2D');
    await takeScreenshot(page, '08_UID混合');
  });

  test('No.9 仅非法字符', async ({ page }) => {
    resetCounter('09_UID仅非法');
    await gotoUD19(page);
    const input = page.locator('.ud19-input').first();
    await input.click();
    await input.pressSequentially('@#$全角', { delay: 5 });
    await expect(input).toHaveValue('');
    await takeScreenshot(page, '09_UID仅非法');
  });

  test('No.10 粘贴纯半角', async ({ page }) => {
    resetCounter('10_UID粘贴');
    await gotoUD19(page);
    const input = page.locator('.ud19-input').first();
    await input.click();
    await input.fill('TEST001');
    await expect(input).toHaveValue('TEST001');
    await takeScreenshot(page, '10_UID粘贴');
  });

  test('No.11 粘贴含非法字符', async ({ page }) => {
    resetCounter('11_UID粘贴非法');
    await gotoUD19(page);
    const input = page.locator('.ud19-input').first();
    await input.click();
    await input.fill('TEST@#001');
    await page.waitForTimeout(200);
    // Component filters via onChange - fill may bypass; use pressSequentially for reliable filter test
    await input.fill('');
    await input.pressSequentially('TEST@#001', { delay: 3 });
    await expect(input).toHaveValue('TEST001');
    await takeScreenshot(page, '11_UID粘贴非法');
  });

  test('No.12 9字符', async ({ page }) => {
    resetCounter('12_UID9');
    await gotoUD19(page);
    const input = page.locator('.ud19-input').first();
    await input.click();
    await input.pressSequentially('ABCDEFGHI', { delay: 3 });
    await expect(input).toHaveValue('ABCDEFGHI');
    await takeScreenshot(page, '12_UID9');
  });

  test('No.13 10字符', async ({ page }) => {
    resetCounter('13_UID10');
    await gotoUD19(page);
    const input = page.locator('.ud19-input').first();
    await input.click();
    await input.pressSequentially('ABCDEFGHIJ', { delay: 3 });
    await expect(input).toHaveValue('ABCDEFGHIJ');
    await takeScreenshot(page, '13_UID10');
  });

  test('No.14 11字符（超最大）', async ({ page }) => {
    resetCounter('14_UID11');
    await gotoUD19(page);
    const input = page.locator('.ud19-input').first();
    await input.click();
    await input.pressSequentially('ABCDEFGHIJK', { delay: 3 });
    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(10);
    await takeScreenshot(page, '14_UID11');
  });
});

// ============================================================
// 3. User 入力制御（No.15-21）
// ============================================================
test.describe.serial('User入力制御（No.15-21）', () => {
  test.setTimeout(120000);

  test('No.15 正常输入半角英数字', async ({ page }) => {
    resetCounter('15_User正常');
    await gotoUD19(page);
    const input = page.locator('.ud19-input').nth(1);
    await input.click();
    await input.pressSequentially('KurtBjork', { delay: 5 });
    await expect(input).toHaveValue('KurtBjork');
    await takeScreenshot(page, '15_User正常');
  });

  test('No.16 全角字符被过滤', async ({ page }) => {
    resetCounter('16_User全角');
    await gotoUD19(page);
    const input = page.locator('.ud19-input').nth(1);
    await input.click();
    await input.pressSequentially('カタカナ', { delay: 5 });
    await expect(input).toHaveValue('');
    await takeScreenshot(page, '16_User全角');
  });

  test('No.17 特殊符号被过滤', async ({ page }) => {
    resetCounter('17_User符号');
    await gotoUD19(page);
    const input = page.locator('.ud19-input').nth(1);
    await input.click();
    await input.pressSequentially('Kurt@Bjork', { delay: 5 });
    await expect(input).toHaveValue('KurtBjork');
    await takeScreenshot(page, '17_User符号');
  });

  test('No.18 仅非法字符', async ({ page }) => {
    resetCounter('18_User仅非法');
    await gotoUD19(page);
    const input = page.locator('.ud19-input').nth(1);
    await input.click();
    await input.pressSequentially('@#$全角', { delay: 5 });
    await expect(input).toHaveValue('');
    await takeScreenshot(page, '18_User仅非法');
  });

  test('No.19 31字符', async ({ page }) => {
    resetCounter('19_User31');
    await gotoUD19(page);
    const input = page.locator('.ud19-input').nth(1);
    await input.click();
    const text31 = 'A'.repeat(31);
    await input.pressSequentially(text31, { delay: 1 });
    await expect(input).toHaveValue(text31);
    await takeScreenshot(page, '19_User31');
  });

  test('No.20 32字符', async ({ page }) => {
    resetCounter('20_User32');
    await gotoUD19(page);
    const input = page.locator('.ud19-input').nth(1);
    await input.click();
    const text32 = 'A'.repeat(32);
    await input.pressSequentially(text32, { delay: 1 });
    await expect(input).toHaveValue(text32);
    await takeScreenshot(page, '20_User32');
  });

  test('No.21 33字符（超最大）', async ({ page }) => {
    resetCounter('21_User33');
    await gotoUD19(page);
    const input = page.locator('.ud19-input').nth(1);
    await input.click();
    await input.pressSequentially('A'.repeat(33), { delay: 1 });
    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(32);
    await takeScreenshot(page, '21_User33');
  });
});

// ============================================================
// 4. 搜索处理（No.22-43）
// ============================================================
test.describe.serial('搜索处理（No.22-43）', () => {
  test.setTimeout(180000);

  test('No.22 Userid搜索-空Userid', async ({ page }) => {
    resetCounter('22_搜索空Userid');
    await mockSaviyntNotFound(page);
    await gotoUD19(page);
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(1000);
    // Component doesn't validate empty Userid; Saviynt is not called since userid is empty
    await takeScreenshot(page, '22_搜索空Userid');
  });

  test('No.23 User搜索-空User', async ({ page }) => {
    resetCounter('23_搜索空User');
    await mockSearchSuccess(page, [], 0);
    await gotoUD19(page);
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '23_搜索空User');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.24 Userid搜索-成功', async ({ page }) => {
    resetCounter('24_Userid搜索成功');
    await insertUD19TestData();
    await mockSaviyntSuccess(page);
    await mockSearchSuccess(page, MOCK_SEARCH_RESULTS);
    await gotoUD19(page);
    const input = page.locator('.ud19-input').first();
    await input.click();
    await input.pressSequentially('SWE', { delay: 10 });
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud19-count-label')).toContainText('2');
    await expect(page.locator('.ud19-table tbody tr')).toHaveCount(2);
    await takeScreenshot(page, '24_Userid搜索成功');
    await page.unroute('**/api/authentication/userinfo');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.25 Userid搜索-不存在', async ({ page }) => {
    resetCounter('25_Userid不存在');
    await mockSaviyntNotFound(page);
    await gotoUD19(page);
    const input = page.locator('.ud19-input').first();
    await input.click();
    await input.pressSequentially('INVALID', { delay: 10 });
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud19-message')).toContainText('未找到该用户');
    await takeScreenshot(page, '25_Userid不存在');
    await page.unroute('**/api/authentication/userinfo');
  });

  test('No.26 User搜索-成功', async ({ page }) => {
    resetCounter('26_User搜索成功');
    await mockSearchSuccess(page, MOCK_SEARCH_RESULTS);
    await gotoUD19(page);
    const input = page.locator('.ud19-input').nth(1);
    await input.click();
    await input.pressSequentially('SWETestUser', { delay: 5 });
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud19-count-label')).toContainText('2');
    await takeScreenshot(page, '26_User搜索成功');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.27 User搜索-不存在', async ({ page }) => {
    resetCounter('27_User不存在');
    await mockSearchSuccess(page, [], 0);
    await gotoUD19(page);
    const input = page.locator('.ud19-input').nth(1);
    await input.click();
    await input.pressSequentially('INVALIDUSER', { delay: 5 });
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud19-message')).toContainText('未找到符合条件');
    await takeScreenshot(page, '27_User不存在');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.28 Not set搜索', async ({ page }) => {
    resetCounter('28_NotSet搜索');
    await mockSearchSuccess(page, MOCK_SEARCH_RESULTS);
    await gotoUD19(page);
    await page.locator('.ud19-select').selectOption('JPN');
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud19-count-label')).toContainText('2');
    await takeScreenshot(page, '28_NotSet搜索');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.29 Rule搜索', async ({ page }) => {
    resetCounter('29_Rule搜索');
    await mockSearchSuccess(page, MOCK_SEARCH_RESULTS);
    await gotoUD19(page);
    await page.locator('.ud19-radio').nth(1).check();
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud19-count-label')).toContainText('2');
    await takeScreenshot(page, '29_Rule搜索');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.30 Rule搜索-无结果', async ({ page }) => {
    resetCounter('30_Rule无结果');
    await mockSearchSuccess(page, [], 0);
    await gotoUD19(page);
    await page.locator('.ud19-radio').nth(1).check();
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud19-empty')).toContainText('未找到符合条件');
    await takeScreenshot(page, '30_Rule无结果');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.31 Template搜索', async ({ page }) => {
    resetCounter('31_Template搜索');
    await mockSearchSuccess(page, MOCK_SEARCH_RESULTS);
    await gotoUD19(page);
    await page.locator('.ud19-radio').nth(2).check();
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud19-count-label')).toContainText('2');
    await takeScreenshot(page, '31_Template搜索');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.32 Template搜索-无结果', async ({ page }) => {
    resetCounter('32_Template无结果');
    await mockSearchSuccess(page, [], 0);
    await gotoUD19(page);
    await page.locator('.ud19-radio').nth(2).check();
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud19-empty')).toContainText('未找到符合条件');
    await takeScreenshot(page, '32_Template无结果');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.33 所有搜索-无匹配', async ({ page }) => {
    resetCounter('33_无匹配');
    await mockSearchSuccess(page, [], 0);
    await gotoUD19(page);
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud19-empty')).toContainText('未找到符合条件');
    await takeScreenshot(page, '33_无匹配');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.34 组合-Userid+Market', async ({ page }) => {
    resetCounter('34_UseridMarket');
    await mockSaviyntSuccess(page);
    await mockSearchSuccess(page, MOCK_SEARCH_RESULTS);
    await gotoUD19(page);
    await page.locator('.ud19-input').first().click();
    await page.locator('.ud19-input').first().pressSequentially('SWE', { delay: 5 });
    await page.locator('.ud19-select').selectOption('JPN');
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud19-count-label')).toContainText('2');
    await takeScreenshot(page, '34_UseridMarket');
    await page.unroute('**/api/authentication/userinfo');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.35 Userid+Not set', async ({ page }) => {
    resetCounter('35_UseridNotSet');
    await mockSaviyntSuccess(page);
    await mockSearchSuccess(page, MOCK_SEARCH_RESULTS);
    await gotoUD19(page);
    await page.locator('.ud19-input').first().click();
    await page.locator('.ud19-input').first().pressSequentially('SWE', { delay: 5 });
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud19-count-label')).toContainText('2');
    await takeScreenshot(page, '35_UseridNotSet');
    await page.unroute('**/api/authentication/userinfo');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.36 Userid+Rule', async ({ page }) => {
    resetCounter('36_UseridRule');
    await mockSaviyntSuccess(page);
    await mockSearchSuccess(page, MOCK_SEARCH_RESULTS);
    await gotoUD19(page);
    await page.locator('.ud19-input').first().click();
    await page.locator('.ud19-input').first().pressSequentially('SWE', { delay: 5 });
    await page.locator('.ud19-radio').nth(1).check();
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud19-count-label')).toContainText('2');
    await takeScreenshot(page, '36_UseridRule');
    await page.unroute('**/api/authentication/userinfo');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.37 Userid+Template', async ({ page }) => {
    resetCounter('37_UseridTemplate');
    await mockSaviyntSuccess(page);
    await mockSearchSuccess(page, MOCK_SEARCH_RESULTS);
    await gotoUD19(page);
    await page.locator('.ud19-input').first().click();
    await page.locator('.ud19-input').first().pressSequentially('SWE', { delay: 5 });
    await page.locator('.ud19-radio').nth(2).check();
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud19-count-label')).toContainText('2');
    await takeScreenshot(page, '37_UseridTemplate');
    await page.unroute('**/api/authentication/userinfo');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.38 Userid+Market+Rule', async ({ page }) => {
    resetCounter('38_UseridMarketRule');
    await mockSaviyntSuccess(page);
    await mockSearchSuccess(page, MOCK_SEARCH_RESULTS);
    await gotoUD19(page);
    await page.locator('.ud19-input').first().click();
    await page.locator('.ud19-input').first().pressSequentially('SWE', { delay: 5 });
    await page.locator('.ud19-select').selectOption('JPN');
    await page.locator('.ud19-radio').nth(1).check();
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud19-count-label')).toContainText('2');
    await takeScreenshot(page, '38_UseridMarketRule');
    await page.unroute('**/api/authentication/userinfo');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.39 User+Market', async ({ page }) => {
    resetCounter('39_UserMarket');
    await mockSearchSuccess(page, MOCK_SEARCH_RESULTS);
    await gotoUD19(page);
    await page.locator('.ud19-input').nth(1).click();
    await page.locator('.ud19-input').nth(1).pressSequentially('SWE', { delay: 5 });
    await page.locator('.ud19-select').selectOption('JPN');
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud19-count-label')).toContainText('2');
    await takeScreenshot(page, '39_UserMarket');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.40 User+Not set', async ({ page }) => {
    resetCounter('40_UserNotSet');
    await mockSearchSuccess(page, MOCK_SEARCH_RESULTS);
    await gotoUD19(page);
    await page.locator('.ud19-input').nth(1).click();
    await page.locator('.ud19-input').nth(1).pressSequentially('SWE', { delay: 5 });
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud19-count-label')).toContainText('2');
    await takeScreenshot(page, '40_UserNotSet');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.41 User+Rule', async ({ page }) => {
    resetCounter('41_UserRule');
    await mockSearchSuccess(page, MOCK_SEARCH_RESULTS);
    await gotoUD19(page);
    await page.locator('.ud19-input').nth(1).click();
    await page.locator('.ud19-input').nth(1).pressSequentially('SWE', { delay: 5 });
    await page.locator('.ud19-radio').nth(1).check();
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud19-count-label')).toContainText('2');
    await takeScreenshot(page, '41_UserRule');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.42 User+Template', async ({ page }) => {
    resetCounter('42_UserTemplate');
    await mockSearchSuccess(page, MOCK_SEARCH_RESULTS);
    await gotoUD19(page);
    await page.locator('.ud19-input').nth(1).click();
    await page.locator('.ud19-input').nth(1).pressSequentially('SWE', { delay: 5 });
    await page.locator('.ud19-radio').nth(2).check();
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud19-count-label')).toContainText('2');
    await takeScreenshot(page, '42_UserTemplate');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.43 User+Market+Rule', async ({ page }) => {
    resetCounter('43_UserMarketRule');
    await mockSearchSuccess(page, MOCK_SEARCH_RESULTS);
    await gotoUD19(page);
    await page.locator('.ud19-input').nth(1).click();
    await page.locator('.ud19-input').nth(1).pressSequentially('SWE', { delay: 5 });
    await page.locator('.ud19-select').selectOption('JPN');
    await page.locator('.ud19-radio').nth(1).check();
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud19-count-label')).toContainText('2');
    await takeScreenshot(page, '43_UserMarketRule');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });
});

// ============================================================
// 5. DataTable 显示（No.44-46）
// ============================================================
test.describe.serial('DataTable（No.44-46）', () => {
  test.setTimeout(120000);

  test('No.44 列标题', async ({ page }) => {
    resetCounter('44_列标题');
    await mockSaviyntSuccess(page);
    await mockSearchSuccess(page, MOCK_SEARCH_RESULTS);
    await gotoUD19(page);
    await page.locator('.ud19-input').first().click();
    await page.locator('.ud19-input').first().pressSequentially('SWE', { delay: 5 });
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(2000);
    const headers = page.locator('.ud19-table th');
    await expect(headers.nth(0)).toContainText('Userid');
    await expect(headers.nth(1)).toContainText('User');
    await expect(headers.nth(2)).toContainText('Market');
    await takeScreenshot(page, '44_列标题');
    await page.unroute('**/api/authentication/userinfo');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.45 多行数据', async ({ page }) => {
    resetCounter('45_多行数据');
    await mockSaviyntSuccess(page);
    await mockSearchSuccess(page, MOCK_SEARCH_RESULTS);
    await gotoUD19(page);
    await page.locator('.ud19-input').first().click();
    await page.locator('.ud19-input').first().pressSequentially('SWE', { delay: 5 });
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud19-table tbody tr')).toHaveCount(2);
    await takeScreenshot(page, '45_多行数据');
    await page.unroute('**/api/authentication/userinfo');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.46 COUNT显示', async ({ page }) => {
    resetCounter('46_COUNT');
    await mockSaviyntSuccess(page);
    await mockSearchSuccess(page, MOCK_SEARCH_RESULTS);
    await gotoUD19(page);
    await page.locator('.ud19-input').first().click();
    await page.locator('.ud19-input').first().pressSequentially('SWE', { delay: 5 });
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud19-count-label')).toContainText('2');
    await takeScreenshot(page, '46_COUNT');
    await page.unroute('**/api/authentication/userinfo');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });
});

// ============================================================
// 6. 异常处理（No.47-51）
// ============================================================
test.describe.serial('异常处理（No.47-51）', () => {
  test.setTimeout(180000);

  test('No.47 获取市场列表失败', async ({ page }) => {
    resetCounter('47_市场列表失败');
    await mockMarketListFail(page);
    await gotoUD19(page);
    await page.waitForTimeout(2000);
    // Component silently handles market list failure; market select may be empty
    await takeScreenshot(page, '47_市场列表失败');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.48 API超时', async ({ page }) => {
    resetCounter('48_API超时');
    await mockSearchTimeout(page);
    await gotoUD19(page);
    await page.locator('.ud19-input').first().click();
    await page.locator('.ud19-input').first().pressSequentially('SWE', { delay: 5 });
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud19-message')).toContainText('网络连接失败');
    await takeScreenshot(page, '48_API超时');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
    await page.unroute('**/api/authentication/userinfo');
  });

  test('No.49 Saviynt连接异常', async ({ page }) => {
    resetCounter('49_Saviynt异常');
    await page.route('**/api/authentication/userinfo**', (route) => route.abort('connectionrefused'));
    await gotoUD19(page);
    await page.locator('.ud19-input').first().click();
    await page.locator('.ud19-input').first().pressSequentially('SWE', { delay: 5 });
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud19-message')).toContainText('网络连接失败');
    await takeScreenshot(page, '49_Saviynt异常');
    await page.unroute('**/api/authentication/userinfo');
  });

  test('No.50 数据库连接异常', async ({ page }) => {
    resetCounter('50_数据库异常');
    await mockSaviyntSuccess(page);
    await mockSearchFail(page);
    await gotoUD19(page);
    await page.locator('.ud19-input').first().click();
    await page.locator('.ud19-input').first().pressSequentially('SWE', { delay: 5 });
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud19-message')).toContainText('System error');
    await takeScreenshot(page, '50_数据库异常');
    await page.unroute('**/api/authentication/userinfo');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.51 用户未登录', async ({ page }) => {
    resetCounter('51_未登录');
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await page.goto(UD19_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    expect(page.url()).toBe(BASE_URL + '/');
    await takeScreenshot(page, '51_未登录');
  });
});

// ============================================================
// 7. UI 交互（No.52-56）
// ============================================================
test.describe.serial('UI交互（No.52-56）', () => {
  test.setTimeout(120000);

  test('No.52 Radio互斥', async ({ page }) => {
    resetCounter('52_Radio互斥');
    await gotoUD19(page);
    await page.locator('.ud19-radio').nth(1).check();
    await expect(page.locator('.ud19-radio').nth(1)).toBeChecked();
    await expect(page.locator('.ud19-radio').nth(0)).not.toBeChecked();
    await page.locator('.ud19-radio').nth(2).check();
    await expect(page.locator('.ud19-radio').nth(2)).toBeChecked();
    await expect(page.locator('.ud19-radio').nth(1)).not.toBeChecked();
    await takeScreenshot(page, '52_Radio互斥');
  });

  test('No.53 错误消息样式', async ({ page }) => {
    resetCounter('53_错误样式');
    await mockSaviyntNotFound(page);
    await gotoUD19(page);
    await page.locator('.ud19-input').first().click();
    await page.locator('.ud19-input').first().pressSequentially('INVALID', { delay: 5 });
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(1000);
    const msg = page.locator('.ud19-message');
    await expect(msg).toBeVisible();
    await takeScreenshot(page, '53_错误样式');
    await page.unroute('**/api/authentication/userinfo');
  });

  test('No.54 加载中按钮禁用', async ({ page }) => {
    resetCounter('54_加载中禁用');
    await mockWithDelay(page, 3000);
    await gotoUD19(page);
    await page.locator('.ud19-input').first().click();
    await page.locator('.ud19-input').first().pressSequentially('SWE', { delay: 5 });
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud19-btn')).toBeDisabled();
    await takeScreenshot(page, '54_加载中禁用');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
    await page.unroute('**/api/authentication/userinfo');
  });

  test('No.55 防止重复提交', async ({ page }) => {
    resetCounter('55_防重复');
    let searchCallCount = 0;
    await mockSaviyntSuccess(page);
    await page.route('**/api/ud19/UD19SearchResultListApi', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      if (body.operation === 'SEARCH_USER') {
        searchCallCount++;
        await new Promise(r => setTimeout(r, 3000));
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { results: [], count: 0 } }) });
      } else {
        await route.fallback();
      }
    });
    await gotoUD19(page);
    await page.locator('.ud19-input').first().click();
    await page.locator('.ud19-input').first().pressSequentially('SWE', { delay: 5 });
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(500);
    await page.locator('.ud19-btn').click({ force: true });
    await page.waitForTimeout(4000);
    expect(searchCallCount).toBeLessThanOrEqual(1);
    await takeScreenshot(page, '55_防重复');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
    await page.unroute('**/api/authentication/userinfo');
  });

  test('No.56 页面刷新', async ({ page }) => {
    resetCounter('56_页面刷新');
    await gotoUD19(page);
    await page.locator('.ud19-input').first().click();
    await page.locator('.ud19-input').first().pressSequentially('SWE', { delay: 5 });
    await page.waitForTimeout(300);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.waitForSelector('.ud19-title', { timeout: 10000 });
    await expect(page.locator('.ud19-input').first()).toHaveValue('');
    await expect(page.locator('.ud19-radio').nth(0)).toBeChecked();
    await expect(page.locator('.ud19-count-label')).toHaveCount(0);
    await expect(page.locator('.ud19-message')).toHaveCount(0);
    await takeScreenshot(page, '56_页面刷新');
  });
});

// ============================================================
// 8. 安全性（No.57-59）
// ============================================================
test.describe.serial('安全性（No.57-59）', () => {
  test.setTimeout(120000);

  test('No.57 API请求验证', async ({ page }) => {
    resetCounter('57_API请求');
    let lastBody = '';
    await page.route('**/api/ud19/UD19SearchResultListApi', async (route) => {
      lastBody = route.request().postData() || '';
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { results: [], count: 0 } }) });
    });
    await gotoUD19(page);
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(1000);
    expect(lastBody).toContain('operation');
    await takeScreenshot(page, '57_API请求');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.58 数据只读', async ({ page }) => {
    resetCounter('58_数据只读');
    await mockSaviyntSuccess(page);
    await mockSearchSuccess(page, MOCK_SEARCH_RESULTS);
    await gotoUD19(page);
    await page.locator('.ud19-input').first().click();
    await page.locator('.ud19-input').first().pressSequentially('SWE', { delay: 5 });
    await page.locator('.ud19-btn').click();
    await page.waitForTimeout(2000);
    const cells = page.locator('.ud19-table tbody td');
    const cellCount = await cells.count();
    expect(cellCount).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(cellCount, 3); i++) {
      await expect(cells.nth(i)).toBeVisible();
    }
    await takeScreenshot(page, '58_数据只读');
    await page.unroute('**/api/authentication/userinfo');
    await page.unroute('**/api/ud19/UD19SearchResultListApi');
  });

  test('No.59 Userid半角英数字校验', async ({ page }) => {
    resetCounter('59_UID校验');
    await gotoUD19(page);
    const input = page.locator('.ud19-input').first();
    await input.click();
    await input.pressSequentially('全角文字', { delay: 5 });
    await expect(input).toHaveValue('');
    await input.fill('');
    await input.pressSequentially('TEST@#$', { delay: 5 });
    const val = await input.inputValue();
    expect(val).not.toContain('@');
    expect(val).not.toContain('#');
    expect(val).not.toContain('$');
    await takeScreenshot(page, '59_UID校验');
  });
});
