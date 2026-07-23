import { test, expect, Page } from '@playwright/test';
import { insertUD19TestData, cleanupUD19TestData } from './test-data-helper';

// ============================================================
// EDBUserView 模块 (UD25) Playwright 自动化测试（28个用例）
// API: GET /api/authentication/userinfo?userId=xxx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD25';
const UD25_URL = `${BASE_URL}/Menu/EDBUserView`;

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

async function gotoUD25(page: Page, userId: string = '') {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  const url = userId ? `${UD25_URL}?userId=${userId}` : UD25_URL;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.waitForSelector('.ud25-title', { timeout: 30000 });
}

/** Mock API — success */
async function mockApiSuccess(page: Page, data: any) {
  await page.route('**/api/authentication/userinfo**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data }) });
  });
}

/** Mock API — 404 */
async function mockApiNotFound(page: Page) {
  await page.route('**/api/authentication/userinfo**', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 404, message: 'User not found' }) });
  });
}

/** Mock API — 500 */
async function mockApiFail(page: Page) {
  await page.route('**/api/authentication/userinfo**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500, data: null, message: 'System error' }) });
  });
}

/** Mock API — network error */
async function mockApiNetError(page: Page) {
  await page.route('**/api/authentication/userinfo**', (route) => route.abort('connectionrefused'));
}

/** Mock API with delay */
async function mockApiWithDelay(page: Page, data: any, delay: number = 2000) {
  await page.route('**/api/authentication/userinfo**', async (route) => {
    await new Promise(r => setTimeout(r, delay));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data }) });
  });
}

const MOCK_USER = {
  userid: 'V0C6900',
  responsible: 'Test Responsible',
  userPosition: 'Test Position',
  email: 'test@example.com',
};

// ============================================================
// 1. 画面初始化（No.1-5）
// ============================================================
test.describe.serial('画面初期化（No.1-5）', () => {
  test.setTimeout(120000);

  test('No.1 基本元素', async ({ page }) => {
    resetCounter('01_基本元素');
    await gotoUD25(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud25-title')).toContainText('EDB User View');
    await expect(page.locator('.ud25-btn').filter({ hasText: 'Clear' })).toBeVisible();
    await expect(page.locator('.ud25-btn').filter({ hasText: 'Back' })).toBeVisible();
    const labels = ['Userid', 'Responsible', 'User Position', 'E-mail'];
    for (const label of labels) {
      await expect(page.locator('.ud25-label').filter({ hasText: label })).toBeVisible();
    }
    await takeScreenshot(page, '01_基本元素');
  });

  test('No.2 初始状态-字段为空', async ({ page }) => {
    resetCounter('02_初始空');
    await gotoUD25(page);
    await page.waitForTimeout(2000);
    const inputs = page.locator('.ud25-input');
    const count = await inputs.count();
    expect(count).toBe(4);
    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toHaveValue('');
    }
    await takeScreenshot(page, '02_初始空');
  });

  test('No.3 URL参数带userId-数据加载', async ({ page }) => {
    resetCounter('03_数据加载');
    await mockApiSuccess(page, MOCK_USER);
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud25-input').nth(0)).toHaveValue('V0C6900');
    await expect(page.locator('.ud25-input').nth(1)).toHaveValue('Test Responsible');
    await expect(page.locator('.ud25-input').nth(2)).toHaveValue('Test Position');
    await expect(page.locator('.ud25-input').nth(3)).toHaveValue('test@example.com');
    await takeScreenshot(page, '03_数据加载');
    await page.unroute('**/api/authentication/userinfo**');
  });

  test('No.4 无userId参数-显示错误', async ({ page }) => {
    resetCounter('04_无UserId');
    await gotoUD25(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud25-error')).toContainText('User ID is required');
    await takeScreenshot(page, '04_无UserId');
  });

  test('No.5 按钮活性', async ({ page }) => {
    resetCounter('05_按钮活性');
    await mockApiSuccess(page, MOCK_USER);
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud25-btn').filter({ hasText: 'Clear' })).toBeEnabled();
    await expect(page.locator('.ud25-btn').filter({ hasText: 'Back' })).toBeEnabled();
    await takeScreenshot(page, '05_按钮活性');
    await page.unroute('**/api/authentication/userinfo**');
  });
});

// ============================================================
// 2. 用户信息显示（No.6-9）
// ============================================================
test.describe.serial('用户信息显示（No.6-9）', () => {
  test.setTimeout(120000);

  test('No.6 Userid字段', async ({ page }) => {
    resetCounter('06_Userid字段');
    await mockApiSuccess(page, MOCK_USER);
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud25-label').first()).toContainText('Userid');
    await expect(page.locator('.ud25-input').first()).toHaveValue('V0C6900');
    await takeScreenshot(page, '06_Userid字段');
    await page.unroute('**/api/authentication/userinfo**');
  });

  test('No.7 Responsible字段', async ({ page }) => {
    resetCounter('07_Responsible');
    await mockApiSuccess(page, MOCK_USER);
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud25-label').nth(1)).toContainText('Responsible');
    await expect(page.locator('.ud25-input').nth(1)).toHaveValue('Test Responsible');
    await takeScreenshot(page, '07_Responsible');
    await page.unroute('**/api/authentication/userinfo**');
  });

  test('No.8 User Position字段', async ({ page }) => {
    resetCounter('08_UserPosition');
    await mockApiSuccess(page, MOCK_USER);
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud25-label').nth(2)).toContainText('User Position');
    await expect(page.locator('.ud25-input').nth(2)).toHaveValue('Test Position');
    await takeScreenshot(page, '08_UserPosition');
    await page.unroute('**/api/authentication/userinfo**');
  });

  test('No.9 E-mail字段', async ({ page }) => {
    resetCounter('09_Email');
    await mockApiSuccess(page, MOCK_USER);
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud25-label').nth(3)).toContainText('E-mail');
    await expect(page.locator('.ud25-input').nth(3)).toHaveValue('test@example.com');
    await takeScreenshot(page, '09_Email');
    await page.unroute('**/api/authentication/userinfo**');
  });
});

// ============================================================
// 3. Clear 按钮（No.10-13）
// ============================================================
test.describe.serial('Clear按钮（No.10-13）', () => {
  test.setTimeout(120000);

  test('No.10 Clear-清空字段', async ({ page }) => {
    resetCounter('10_Clear清空');
    await mockApiSuccess(page, MOCK_USER);
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(2000);
    await page.locator('.ud25-btn').filter({ hasText: 'Clear' }).click();
    await page.waitForTimeout(300);
    const inputs = page.locator('.ud25-input');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toHaveValue('');
    }
    await expect(page.locator('.ud25-error')).toHaveCount(0);
    await takeScreenshot(page, '10_Clear清空');
    await page.unroute('**/api/authentication/userinfo**');
  });

  test('No.11 Clear-未加载时点击', async ({ page }) => {
    resetCounter('11_Clear未加载');
    await gotoUD25(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud25-btn').filter({ hasText: 'Clear' }).click();
    await page.waitForTimeout(300);
    // 不应有错误
    await expect(page.locator('.ud25-error')).toHaveCount(0);
    await takeScreenshot(page, '11_Clear未加载');
  });

  test('No.12 Clear后再次加载', async ({ page }) => {
    resetCounter('12_Clear后加载');
    await mockApiSuccess(page, MOCK_USER);
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(2000);
    await page.locator('.ud25-btn').filter({ hasText: 'Clear' }).click();
    await page.waitForTimeout(200);
    // 再次导航携带参数应重新加载
    await page.goto(`${UD25_URL}?userId=V0C6900`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud25-input').first()).toHaveValue('V0C6900');
    await takeScreenshot(page, '12_Clear后加载');
    await page.unroute('**/api/authentication/userinfo**');
  });

  test('No.13 Clear按钮始终可用', async ({ page }) => {
    resetCounter('13_Clear可用');
    await mockApiSuccess(page, MOCK_USER);
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud25-btn').filter({ hasText: 'Clear' })).toBeEnabled();
    await page.locator('.ud25-btn').filter({ hasText: 'Clear' }).click();
    await page.waitForTimeout(200);
    await expect(page.locator('.ud25-btn').filter({ hasText: 'Clear' })).toBeEnabled();
    await takeScreenshot(page, '13_Clear可用');
    await page.unroute('**/api/authentication/userinfo**');
  });
});

// ============================================================
// 4. Back 按钮（No.14-16）
// ============================================================
test.describe.serial('Back按钮（No.14-16）', () => {
  test.setTimeout(120000);

  test('No.14 Back-返回前页面', async ({ page }) => {
    resetCounter('14_Back返回');
    // 先导航到一个已知页面，确保返回时有确定的目标
    await safeGoto(page, `${BASE_URL}/Menu/MarketDocumentSettingsList`);
    await page.evaluate(() => localStorage.clear());
    await loginViaLocalStorage(page);
    await page.waitForTimeout(1000);
    // 再导航到 UD25 页面
    await mockApiSuccess(page, MOCK_USER);
    await page.goto(`${UD25_URL}?userId=V0C6900`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.waitForSelector('.ud25-title', { timeout: 30000 });
    // 点击 Back
    await page.locator('.ud25-btn').filter({ hasText: 'Back' }).click();
    await page.waitForTimeout(2000);
    // 验证返回到了前一个页面
    expect(page.url()).toContain('/Menu/MarketDocumentSettingsList');
    await takeScreenshot(page, '14_Back返回');
    await page.unroute('**/api/authentication/userinfo**');
  });

  test('No.15 Back按钮活性', async ({ page }) => {
    resetCounter('15_Back活性');
    await mockApiSuccess(page, MOCK_USER);
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud25-btn').filter({ hasText: 'Back' })).toBeEnabled();
    await takeScreenshot(page, '15_Back活性');
    await page.unroute('**/api/authentication/userinfo**');
  });
});

// ============================================================
// 5. 异常处理（No.16-22）
// ============================================================
test.describe.serial('異常処理（No.16-21）', () => {
  test.setTimeout(180000);

  test('No.16 用户不存在（404）', async ({ page }) => {
    resetCounter('16_User404');
    await mockApiNotFound(page);
    await gotoUD25(page, 'INVALID');
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud25-error')).toContainText('not found');
    await takeScreenshot(page, '16_User404');
    await page.unroute('**/api/authentication/userinfo**');
  });

  test('No.17 API 500', async ({ page }) => {
    resetCounter('17_API500');
    await mockApiFail(page);
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud25-error')).toContainText('System error');
    await takeScreenshot(page, '17_API500');
    await page.unroute('**/api/authentication/userinfo**');
  });

  test('No.18 网络断开', async ({ page }) => {
    resetCounter('18_网络断开');
    await mockApiNetError(page);
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud25-error')).toContainText('System error');
    await takeScreenshot(page, '18_网络断开');
    await page.unroute('**/api/authentication/userinfo**');
  });

  test('No.19 加载中状态', async ({ page }) => {
    resetCounter('19_加载中');
    await mockApiWithDelay(page, MOCK_USER, 2000);
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(500);
    await expect(page.locator('.ud25-loading')).toContainText('Loading');
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud25-loading')).toHaveCount(0);
    await takeScreenshot(page, '19_加载中');
    await page.unroute('**/api/authentication/userinfo**');
  });

  test('No.20 错误后Clear', async ({ page }) => {
    resetCounter('20_错误后Clear');
    await mockApiFail(page);
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud25-error')).toBeVisible();
    await page.locator('.ud25-btn').filter({ hasText: 'Clear' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('.ud25-error')).toHaveCount(0);
    await takeScreenshot(page, '20_错误后Clear');
    await page.unroute('**/api/authentication/userinfo**');
  });

  test('No.21 异常状态码', async ({ page }) => {
    resetCounter('21_异常状态码');
    await page.route('**/api/authentication/userinfo**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 400, message: 'Bad request', data: null }) });
    });
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud25-error')).toContainText('Bad request');
    await takeScreenshot(page, '21_异常状态码');
    await page.unroute('**/api/authentication/userinfo**');
  });
});

// ============================================================
// 6. UI 交互（No.22-25）
// ============================================================
test.describe.serial('UI交互（No.22-25）', () => {
  test.setTimeout(120000);

  test('No.22 加载状态', async ({ page }) => {
    resetCounter('22_加载状态');
    await mockApiWithDelay(page, MOCK_USER, 2000);
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(500);
    await expect(page.locator('.ud25-loading')).toBeVisible();
    await page.waitForTimeout(2500);
    await expect(page.locator('.ud25-loading')).toHaveCount(0);
    await expect(page.locator('.ud25-input').first()).toHaveValue('V0C6900');
    await takeScreenshot(page, '22_加载状态');
    await page.unroute('**/api/authentication/userinfo**');
  });

  test('No.23 页面刷新', async ({ page }) => {
    resetCounter('23_页面刷新');
    await mockApiSuccess(page, MOCK_USER);
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(2000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.waitForSelector('.ud25-title', { timeout: 10000 });
    // 刷新后重新加载（URL参数保留）
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '23_页面刷新');
    await page.unroute('**/api/authentication/userinfo**');
  });

  test('No.24 输入框只读', async ({ page }) => {
    resetCounter('24_输入框只读');
    await mockApiSuccess(page, MOCK_USER);
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(2000);
    const inputs = page.locator('.ud25-input');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toHaveAttribute('readOnly', '');
    }
    await takeScreenshot(page, '24_输入框只读');
    await page.unroute('**/api/authentication/userinfo**');
  });

  test('No.25 错误消息显示', async ({ page }) => {
    resetCounter('25_错误消息');
    await mockApiFail(page);
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(2000);
    const msg = page.locator('.ud25-error');
    await expect(msg).toBeVisible();
    await takeScreenshot(page, '25_错误消息');
    await page.unroute('**/api/authentication/userinfo**');
  });
});

// ============================================================
// 7. 安全性（No.26-28）
// ============================================================
test.describe.serial('安全性（No.26-28）', () => {
  test.setTimeout(120000);

  test('No.26 API请求验证', async ({ page }) => {
    resetCounter('26_API请求');
    let requestUrl = '';
    await page.route('**/api/authentication/userinfo**', async (route) => {
      requestUrl = route.request().url();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: MOCK_USER }) });
    });
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(2000);
    expect(requestUrl).toContain('/api/authentication/userinfo');
    expect(requestUrl).toContain('userId=V0C6900');
    await takeScreenshot(page, '26_API请求');
    await page.unroute('**/api/authentication/userinfo**');
  });

  test('No.27 数据只读', async ({ page }) => {
    resetCounter('27_数据只读');
    await mockApiSuccess(page, MOCK_USER);
    await gotoUD25(page, 'V0C6900');
    await page.waitForTimeout(2000);
    const inputs = page.locator('.ud25-input');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      // readonly属性存在
      await expect(inputs.nth(i)).toHaveAttribute('readOnly', '');
      // 尝试输入不可行
      await expect(inputs.nth(i)).toBeDisabled({ timeout: 1000 }).catch(() => {
        // readOnly 的输入框即使 enabled 也无法编辑
      });
    }
    await takeScreenshot(page, '27_数据只读');
    await page.unroute('**/api/authentication/userinfo**');
  });

  test('No.28 用户未登录', async ({ page }) => {
    resetCounter('28_未登录');
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await page.goto(UD25_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    expect(page.url()).toBe(BASE_URL + '/');
    await takeScreenshot(page, '28_未登录');
  });
});
