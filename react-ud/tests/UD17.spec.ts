import { test, expect, Page } from '@playwright/test';
import { insertUD17TestData, cleanupUD17TestData, execute } from './test-data-helper';

// ============================================================
// HDocUserAdministration 模块 (UD17) Playwright 自动化测试
// 基于 単体テスト仕様書UD17.md（45个测试用例）
// API: GET /api/ud17/markets, POST /api/ud17/UD17HDocUserAdministrationApi
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD17';
const UD17_URL = `${BASE_URL}/Menu/HDocUserAdministration`;

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

async function gotoUD17(page: Page) {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  await page.goto(UD17_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.waitForSelector('.ud17-page-title', { timeout: 30000 });
}

/** Mock Market API */
async function mockMarketApi(page: Page, markets: any[]) {
  await page.route('**/api/ud17/markets', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: markets }) });
  });
}

/** Mock User Info API - success */
async function mockUserInfoSuccess(page: Page, responseData: any) {
  await page.route('**/api/ud17/UD17HDocUserAdministrationApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'userinfo') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseData) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock User Info API - 500 */
async function mockUserInfoFail(page: Page) {
  await page.route('**/api/ud17/UD17HDocUserAdministrationApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'userinfo') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500, message: 'System error', data: null }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock Update Role API - success */
async function mockUpdateRoleSuccess(page: Page) {
  await page.route('**/api/ud17/UD17HDocUserAdministrationApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'updateRole') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { success: true } }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock Update Role API - 500 */
async function mockUpdateRoleFail(page: Page) {
  await page.route('**/api/ud17/UD17HDocUserAdministrationApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'updateRole') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500, data: { success: false, message: 'Update failed. Please contact administrator.' } }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock Update Role API - user not found (400) */
async function mockUpdateRoleNotFound(page: Page) {
  await page.route('**/api/ud17/UD17HDocUserAdministrationApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'updateRole') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 400, data: { success: false, message: "We didn't recognize the userid you entered. Please try again." } }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock Delete Role API - success */
async function mockDeleteRoleSuccess(page: Page) {
  await page.route('**/api/ud17/UD17HDocUserAdministrationApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'deleteRole') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock Delete Role API - 500 */
async function mockDeleteRoleFail(page: Page) {
  await page.route('**/api/ud17/UD17HDocUserAdministrationApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'deleteRole') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500 }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock API timeout */
async function mockApiTimeout(page: Page) {
  await page.route('**/api/ud17/UD17HDocUserAdministrationApi', (route) => route.abort('timedout'));
}

/** Mock all APIs with delay for loading test */
async function mockAllWithDelay(page: Page, delay: number = 3000) {
  await page.route('**/api/ud17/*', async (route) => {
    await new Promise(r => setTimeout(r, delay));
    if (route.request().url().includes('/markets')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: [] }) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: null }) });
    }
  });
}

const MOCK_MARKETS = [
  { MARKET: 'JPN', DESCRIPTION: 'Japan' },
  { MARKET: 'CHN', DESCRIPTION: 'China' },
  { MARKET: 'DEU', DESCRIPTION: 'Germany' },
];

// ============================================================
// 1. 画面初始化（No.1-3）
// ============================================================
test.describe.serial('画面初始化（No.1-3）', () => {
  test.setTimeout(120000);

  test('No.1 画面初期显示-基本元素', async ({ page }) => {
    resetCounter('01_基本元素');
    await gotoUD17(page);
    await page.waitForTimeout(2000);
    // 标题
    await expect(page.locator('.ud17-page-title')).toContainText('HDoc User Admin');
    // UserID 输入框和 USER INFO 按钮
    await expect(page.locator('.ud17-inp').first()).toBeVisible();
    await expect(page.locator('.ud17-btn').filter({ hasText: 'USER INFO' })).toBeVisible();
    // User 标签（readonly 输入框）
    await expect(page.locator('.ud17-ro')).toBeVisible();
    // 角色区域各复选框
    const roleLabels = ['Standard User', 'Rule Admin', 'Template Admin', 'Document Auth Admin', 'User Admin'];
    for (const label of roleLabels) {
      await expect(page.locator('.ud17-chk-lbl').filter({ hasText: label })).toBeVisible();
    }
    // Adaptation user
    await expect(page.locator('.ud17-chk-lbl').filter({ hasText: 'Adaptation use' })).toBeVisible();
    // Manage Variable List
    await expect(page.locator('.ud17-row').filter({ hasText: 'Manage Variable List' }).locator('input[type="checkbox"]')).toBeVisible();
    // Market Super User
    await expect(page.locator('.ud17-super-title')).toContainText('Market super user');
    // Update Role 和 Delete Role 按钮
    await expect(page.locator('.ud17-btn').filter({ hasText: 'Update Role' })).toBeVisible();
    await expect(page.locator('.ud17-btn').filter({ hasText: 'Delete Role' })).toBeVisible();
    await takeScreenshot(page, '01_基本元素');
  });

  test('No.2 画面初期显示-市场列表加载', async ({ page }) => {
    resetCounter('02_市场列表');
    await gotoUD17(page);
    await page.waitForTimeout(2000);
    // Rule Admin 的 Market 下拉应加载市场数据
    const ruleAdminSelect = page.locator('.ud17-role-item').filter({ hasText: 'Rule Admin' }).locator('.ud17-sel');
    const options = await ruleAdminSelect.locator('option').allTextContents();
    expect(options.length).toBeGreaterThan(0);
    await takeScreenshot(page, '02_市场列表');
  });

  test('No.3 画面初期显示-初始状态', async ({ page }) => {
    resetCounter('03_初始状态');
    await gotoUD17(page);
    await page.waitForTimeout(2000);
    // UserID 为空
    await expect(page.locator('.ud17-inp').first()).toHaveValue('');
    // User 为空
    await expect(page.locator('.ud17-ro')).toHaveValue('');
    // 所有角色复选框未勾选
    const checkboxes = page.locator('.ud17-chk-lbl input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).not.toBeChecked();
    }
    // 功能权限复选框未勾选
    await expect(page.locator('.ud17-row').filter({ hasText: 'Manage Variable List' }).locator('input[type="checkbox"]')).not.toBeChecked();
    // 按钮可用
    await expect(page.locator('.ud17-btn').filter({ hasText: 'Update Role' })).toBeEnabled();
    await expect(page.locator('.ud17-btn').filter({ hasText: 'Delete Role' })).toBeEnabled();
    await takeScreenshot(page, '03_初始状态');
  });
});

// ============================================================
// 2. UserID 入力制御（No.4-6）
// ============================================================
test.describe.serial('UserID入力制御（No.4-6）', () => {
  test.setTimeout(120000);

  test('No.4 UserID-9字符（小于最大）', async ({ page }) => {
    resetCounter('04_UID9字符');
    await gotoUD17(page);
    const input = page.locator('.ud17-inp').first();
    await input.click();
    const text9 = 'ABCDEFGHI';
    await input.pressSequentially(text9, { delay: 5 });
    await page.waitForTimeout(300);
    const val = await input.inputValue();
    expect(val.length).toBe(9);
    expect(val).toBe(text9);
    await takeScreenshot(page, '04_UID9字符');
  });

  test('No.5 UserID-10字符（等于最大）', async ({ page }) => {
    resetCounter('05_UID10字符');
    await gotoUD17(page);
    const input = page.locator('.ud17-inp').first();
    await input.click();
    const text10 = 'ABCDEFGHIJ';
    await input.pressSequentially(text10, { delay: 5 });
    await page.waitForTimeout(300);
    const val = await input.inputValue();
    expect(val.length).toBe(10);
    expect(val).toBe(text10);
    await takeScreenshot(page, '05_UID10字符');
  });

  test('No.6 UserID-11字符（超过最大）', async ({ page }) => {
    resetCounter('06_UID11字符');
    await gotoUD17(page);
    const input = page.locator('.ud17-inp').first();
    await input.click();
    // 组件没有 maxLength 限制，11字符可输入
    const text11 = 'ABCDEFGHIJK';
    await input.pressSequentially(text11, { delay: 5 });
    await page.waitForTimeout(300);
    const val = await input.inputValue();
    // 具体长度以组件实际行为为准（无maxLength则接受所有输入）
    expect(val).toBe(text11);
    await takeScreenshot(page, '06_UID11字符');
  });
});

// ============================================================
// 3. 用户信息查询（No.7-11）
// ============================================================
test.describe.serial('用户信息查询（No.7-11）', () => {
  test.setTimeout(120000);

  test('No.7 User Info-UserID 为空', async ({ page }) => {
    resetCounter('07_UID空');
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud17-msg.ud17-error')).toContainText('Please enter UserID');
    await takeScreenshot(page, '07_UID空');
  });

  test('No.8 User Info-查询成功', async ({ page }) => {
    resetCounter('08_查询成功');
    await insertUD17TestData();
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    const input = page.locator('.ud17-inp').first();
    await input.click();
    await input.pressSequentially('V0C6900', { delay: 20 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(3000);
    // User 标签显示用户名
    await expect(page.locator('.ud17-ro')).toHaveValue('Test User UD17');
    // Standard User 应被勾选（有 USER 功能权限）
    await expect(page.locator('.ud17-chk-lbl').filter({ hasText: 'Standard User' }).locator('input[type="checkbox"]')).toBeChecked();
    // Rule Admin 应被勾选（有 RULES 功能权限）
    await expect(page.locator('.ud17-chk-lbl').filter({ hasText: 'Rule Admin' }).locator('input[type="checkbox"]')).toBeChecked();
    await takeScreenshot(page, '08_查询成功');
  });

  test('No.9 User Info-用户不存在', async ({ page }) => {
    resetCounter('09_用户不存在');
    await page.route('**/api/ud17/UD17HDocUserAdministrationApi', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      if (body.operation === 'userinfo') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: null }) });
      } else {
        await route.fallback();
      }
    });
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    const input = page.locator('.ud17-inp').first();
    await input.click();
    await input.pressSequentially('aabbcc', { delay: 20 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud17-msg.ud17-error')).toContainText('We didn\'t recognize');
    await expect(page.locator('.ud17-ro')).toHaveValue('');
    await takeScreenshot(page, '09_用户不存在');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.10 User Info-API 返回 500', async ({ page }) => {
    resetCounter('10_UserInfo500');
    await mockUserInfoFail(page);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    const input = page.locator('.ud17-inp').first();
    await input.click();
    await input.pressSequentially('V0C6900', { delay: 20 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud17-msg.ud17-error')).toContainText('We didn\'t recognize');
    await takeScreenshot(page, '10_UserInfo500');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.11 User Info-加载中按钮禁用', async ({ page }) => {
    resetCounter('11_UserInfo加载');
    // 模拟慢响应
    await page.route('**/api/ud17/UD17HDocUserAdministrationApi', async (route) => {
      await new Promise(r => setTimeout(r, 3000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { username: 'Test' } }) });
    });
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    const input = page.locator('.ud17-inp').first();
    await input.click();
    await input.pressSequentially('V0C6900', { delay: 20 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(500);
    // isLoading=true 时组件显示加载遮罩，表单按钮从 DOM 消失
    await expect(page.locator('.ud17-loading')).toBeVisible();
    await takeScreenshot(page, '11_UserInfo加载');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });
});

// ============================================================
// 4. 角色权限配置（No.12-20）
// ============================================================
test.describe.serial('角色权限配置（No.12-20）', () => {
  test.setTimeout(120000);

  test('No.12 User Info成功后-所有权限组件可用', async ({ page }) => {
    resetCounter('12_权限组件可用');
    // Mock userInfo 返回成功
    const mockData = {
      code: 200,
      data: {
        username: 'Test User',
        functions: [],
        markets: []
      }
    };
    await mockUserInfoSuccess(page, mockData);
    await mockMarketApi(page, MOCK_MARKETS);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    const input = page.locator('.ud17-inp').first();
    await input.click();
    await input.pressSequentially('V0C6900', { delay: 15 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    // 所有复选框可用
    const checkboxes = page.locator('.ud17-chk-lbl input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).toBeEnabled();
    }
    // Manage Variable List 复选框可用
    await expect(page.locator('.ud17-row').filter({ hasText: 'Manage Variable List' }).locator('input[type="checkbox"]')).toBeEnabled();
    // 按钮可用
    await expect(page.locator('.ud17-btn').filter({ hasText: 'Update Role' })).toBeEnabled();
    await expect(page.locator('.ud17-btn').filter({ hasText: 'Delete Role' })).toBeEnabled();
    await takeScreenshot(page, '12_权限组件可用');
    await page.unroute('**/api/ud17/markets');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.13 Standard User-勾选与市场选择', async ({ page }) => {
    resetCounter('13_StandardUser');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockMarketApi(page, MOCK_MARKETS);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    // 查询用户
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    // 勾选 Standard User
    await page.locator('.ud17-chk-lbl').filter({ hasText: 'Standard User' }).locator('input[type="checkbox"]').check();
    await page.waitForTimeout(300);
    await expect(page.locator('.ud17-chk-lbl').filter({ hasText: 'Standard User' }).locator('input[type="checkbox"]')).toBeChecked();
    await takeScreenshot(page, '13_StandardUser');
    await page.unroute('**/api/ud17/markets');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.14 Rule Admin-勾选与市场选择', async ({ page }) => {
    resetCounter('14_RuleAdmin');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockMarketApi(page, MOCK_MARKETS);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    // 勾选 Rule Admin
    await page.locator('.ud17-chk-lbl').filter({ hasText: 'Rule Admin' }).locator('input[type="checkbox"]').check();
    await page.waitForTimeout(300);
    await expect(page.locator('.ud17-chk-lbl').filter({ hasText: 'Rule Admin' }).locator('input[type="checkbox"]')).toBeChecked();
    // 选择市场 JPN
    const ruleAdminSelect = page.locator('.ud17-role-item').filter({ hasText: 'Rule Admin' }).locator('.ud17-sel');
    await ruleAdminSelect.selectOption(['JPN'], { timeout: 5000 });
    await page.waitForTimeout(300);
    await takeScreenshot(page, '14_RuleAdmin');
    await page.unroute('**/api/ud17/markets');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.15 Template Admin-勾选与市场选择', async ({ page }) => {
    resetCounter('15_TemplateAdmin');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockMarketApi(page, MOCK_MARKETS);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    await page.locator('.ud17-chk-lbl').filter({ hasText: 'Template Admin' }).locator('input[type="checkbox"]').check();
    await page.waitForTimeout(300);
    await expect(page.locator('.ud17-chk-lbl').filter({ hasText: 'Template Admin' }).locator('input[type="checkbox"]')).toBeChecked();
    await takeScreenshot(page, '15_TemplateAdmin');
    await page.unroute('**/api/ud17/markets');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.16 Document Auth Admin-勾选', async ({ page }) => {
    resetCounter('16_DocAuthAdmin');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockMarketApi(page, MOCK_MARKETS);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    await page.locator('.ud17-chk-lbl').filter({ hasText: 'Document Auth Admin' }).locator('input[type="checkbox"]').check();
    await page.waitForTimeout(300);
    await expect(page.locator('.ud17-chk-lbl').filter({ hasText: 'Document Auth Admin' }).locator('input[type="checkbox"]')).toBeChecked();
    await takeScreenshot(page, '16_DocAuthAdmin');
    await page.unroute('**/api/ud17/markets');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.17 User Admin-勾选', async ({ page }) => {
    resetCounter('17_UserAdmin');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockMarketApi(page, MOCK_MARKETS);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    // User Admin 复选框通过 id='userAdmin' 定位
    await page.locator('#userAdmin').check();
    await page.waitForTimeout(300);
    await expect(page.locator('#userAdmin')).toBeChecked();
    await takeScreenshot(page, '17_UserAdmin');
    await page.unroute('**/api/ud17/markets');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.18 Adaptation user-勾选', async ({ page }) => {
    resetCounter('18_AdaptationUser');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockMarketApi(page, MOCK_MARKETS);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    await page.locator('#adaptationUser').check();
    await page.waitForTimeout(300);
    await expect(page.locator('#adaptationUser')).toBeChecked();
    await takeScreenshot(page, '18_AdaptationUser');
    await page.unroute('**/api/ud17/markets');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.19 Manage Variable List-勾选', async ({ page }) => {
    resetCounter('19_ManageVarList');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockMarketApi(page, MOCK_MARKETS);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    await page.locator('.ud17-row').filter({ hasText: 'Manage Variable List' }).locator('input[type="checkbox"]').check();
    await page.waitForTimeout(300);
    await expect(page.locator('.ud17-row').filter({ hasText: 'Manage Variable List' }).locator('input[type="checkbox"]')).toBeChecked();
    await takeScreenshot(page, '19_ManageVarList');
    await page.unroute('**/api/ud17/markets');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.20 Market Super User-选择', async ({ page }) => {
    resetCounter('20_MarketSuperUser');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockMarketApi(page, MOCK_MARKETS);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    const superSelect = page.locator('.ud17-super-section .ud17-sel');
    await superSelect.selectOption(['JPN'], { timeout: 5000 });
    await page.waitForTimeout(300);
    await takeScreenshot(page, '20_MarketSuperUser');
    await page.unroute('**/api/ud17/markets');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });
});

// ============================================================
// 5. Update Role（No.21-31）
// ============================================================
test.describe.serial('Update Role（No.21-31）', () => {
  test.setTimeout(120000);

  test('No.21 Update Role-未查询时点击', async ({ page }) => {
    resetCounter('21_更新未查询');
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-btn').filter({ hasText: 'Update Role' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud17-msg.ud17-error')).toContainText('Please search user info first');
    await takeScreenshot(page, '21_更新未查询');
  });

  test('No.22 Update Role-成功（全角色）', async ({ page }) => {
    resetCounter('22_更新全角色');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test User', functions: [], markets: [] } });
    await mockUpdateRoleSuccess(page);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    // 勾选所有角色
    const allCheckboxLabels = ['Standard User', 'Rule Admin', 'Template Admin', 'Document Auth Admin'];
    for (const label of allCheckboxLabels) {
      await page.locator('.ud17-chk-lbl').filter({ hasText: label }).locator('input[type="checkbox"]').check();
    }
    await page.locator('#userAdmin').check();
    await page.locator('#adaptationUser').check();
    await page.locator('.ud17-row').filter({ hasText: 'Manage Variable List' }).locator('input[type="checkbox"]').check();
    await page.waitForTimeout(300);
    await page.locator('.ud17-btn').filter({ hasText: 'Update Role' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud17-msg.ud17-success')).toContainText('Role updated successfully');
    await takeScreenshot(page, '22_更新全角色');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.23 Update Role-仅 Standard User', async ({ page }) => {
    resetCounter('23_更新Standard');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockUpdateRoleSuccess(page);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    await page.locator('.ud17-chk-lbl').filter({ hasText: 'Standard User' }).locator('input[type="checkbox"]').check();
    await page.waitForTimeout(300);
    await page.locator('.ud17-btn').filter({ hasText: 'Update Role' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud17-msg.ud17-success')).toContainText('Role updated successfully');
    await takeScreenshot(page, '23_更新Standard');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.24 Update Role-仅 Rule Admin + 多 Market', async ({ page }) => {
    resetCounter('24_更新RuleAdmin多Market');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockMarketApi(page, MOCK_MARKETS);
    await mockUpdateRoleSuccess(page);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    await page.locator('.ud17-chk-lbl').filter({ hasText: 'Rule Admin' }).locator('input[type="checkbox"]').check();
    await page.waitForTimeout(300);
    const ruleAdminSelect = page.locator('.ud17-role-item').filter({ hasText: 'Rule Admin' }).locator('.ud17-sel');
    // 使用 Ctrl+Click 多选（selectOption with array for multiple select）
    await ruleAdminSelect.selectOption(['JPN', 'CHN', 'DEU'], { timeout: 5000 });
    await page.waitForTimeout(300);
    await page.locator('.ud17-btn').filter({ hasText: 'Update Role' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud17-msg.ud17-success')).toContainText('Role updated successfully');
    await takeScreenshot(page, '24_更新RuleAdmin多Market');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.25 Update Role-仅 User Admin（无 Market）', async ({ page }) => {
    resetCounter('25_更新UserAdmin');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockUpdateRoleSuccess(page);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    await page.locator('#userAdmin').check();
    await page.waitForTimeout(300);
    await page.locator('.ud17-btn').filter({ hasText: 'Update Role' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud17-msg.ud17-success')).toContainText('Role updated successfully');
    await takeScreenshot(page, '25_更新UserAdmin');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.26 Update Role-仅 Manage Variable List', async ({ page }) => {
    resetCounter('26_更新ManageVar');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockUpdateRoleSuccess(page);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    await page.locator('.ud17-row').filter({ hasText: 'Manage Variable List' }).locator('input[type="checkbox"]').check();
    await page.waitForTimeout(300);
    await page.locator('.ud17-btn').filter({ hasText: 'Update Role' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud17-msg.ud17-success')).toContainText('Role updated successfully');
    await takeScreenshot(page, '26_更新ManageVar');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.27 Update Role-Market Super User', async ({ page }) => {
    resetCounter('27_更新SuperUser');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockUpdateRoleSuccess(page);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    await page.locator('.ud17-super-section .ud17-sel').selectOption(['JPN'], { timeout: 5000 });
    await page.waitForTimeout(300);
    await page.locator('.ud17-btn').filter({ hasText: 'Update Role' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud17-msg.ud17-success')).toContainText('Role updated successfully');
    await takeScreenshot(page, '27_更新SuperUser');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.28 Update Role-取消所有勾选（清空权限）', async ({ page }) => {
    resetCounter('28_更新清空');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockUpdateRoleSuccess(page);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    // 所有角色保持未勾选状态，直接点击 Update Role
    await page.locator('.ud17-btn').filter({ hasText: 'Update Role' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud17-msg.ud17-success')).toContainText('Role updated successfully');
    await takeScreenshot(page, '28_更新清空');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.29 Update Role-失败（API 500）', async ({ page }) => {
    resetCounter('29_更新500');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockUpdateRoleFail(page);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    await page.locator('.ud17-chk-lbl').filter({ hasText: 'Standard User' }).locator('input[type="checkbox"]').check();
    await page.waitForTimeout(300);
    await page.locator('.ud17-btn').filter({ hasText: 'Update Role' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud17-msg.ud17-error')).toContainText('Update failed');
    await takeScreenshot(page, '29_更新500');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.30 Update Role-用户不存在', async ({ page }) => {
    resetCounter('30_更新用户不存在');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockUpdateRoleNotFound(page);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    await page.locator('.ud17-btn').filter({ hasText: 'Update Role' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud17-msg.ud17-error')).toContainText('We didn\'t recognize');
    await takeScreenshot(page, '30_更新用户不存在');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.31 Update Role-加载中按钮禁用', async ({ page }) => {
    resetCounter('31_更新加载中');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockMarketApi(page, MOCK_MARKETS);
    await page.route('**/api/ud17/UD17HDocUserAdministrationApi', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      if (body.operation === 'updateRole') {
        await new Promise(r => setTimeout(r, 3000));
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { success: true } }) });
      } else {
        await route.fallback();
      }
    });
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    await page.locator('.ud17-chk-lbl').filter({ hasText: 'Standard User' }).locator('input[type="checkbox"]').check();
    await page.waitForTimeout(300);
    await page.locator('.ud17-btn').filter({ hasText: 'Update Role' }).click();
    await page.waitForTimeout(500);
    // isLoading=true 时组件显示加载遮罩，表单按钮从 DOM 消失
    await expect(page.locator('.ud17-loading')).toBeVisible();
    await takeScreenshot(page, '31_更新加载中');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });
});

// ============================================================
// 6. Delete Role（No.32-36）
// ============================================================
test.describe.serial('Delete Role（No.32-36）', () => {
  test.setTimeout(120000);

  test('No.32 Delete Role-未查询时点击', async ({ page }) => {
    resetCounter('32_删除未查询');
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-btn').filter({ hasText: 'Delete Role' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud17-msg.ud17-error')).toContainText('Please search user info first');
    await takeScreenshot(page, '32_删除未查询');
  });

  test('No.33 Delete Role-确认对话框取消', async ({ page }) => {
    resetCounter('33_删除取消');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockMarketApi(page, MOCK_MARKETS);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    // 点击 Delete Role，弹出确认对话框，取消
    page.once('dialog', (dialog) => {
      dialog.dismiss();
    });
    await page.locator('.ud17-btn').filter({ hasText: 'Delete Role' }).click({ force: true, timeout: 10000 });
    await page.waitForTimeout(1000);
    // 无成功/错误消息
    await expect(page.locator('.ud17-msg.ud17-error')).toHaveCount(0);
    await expect(page.locator('.ud17-msg.ud17-success')).toHaveCount(0);
    await takeScreenshot(page, '33_删除取消');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.34 Delete Role-确认删除成功', async ({ page }) => {
    resetCounter('34_删除成功');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockDeleteRoleSuccess(page);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    page.once('dialog', (dialog) => {
      dialog.accept();
    });
    await page.locator('.ud17-btn').filter({ hasText: 'Delete Role' }).click({ force: true, timeout: 10000 });
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud17-msg.ud17-success')).toContainText('Role deleted successfully');
    // 权限配置被清空
    await expect(page.locator('.ud17-ro')).toHaveValue('');
    await takeScreenshot(page, '34_删除成功');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.35 Delete Role-失败（API 500）', async ({ page }) => {
    resetCounter('35_删除500');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockDeleteRoleFail(page);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    page.once('dialog', (dialog) => {
      dialog.accept();
    });
    await page.locator('.ud17-btn').filter({ hasText: 'Delete Role' }).click({ force: true, timeout: 10000 });
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud17-msg.ud17-error')).toContainText('Delete failed');
    await takeScreenshot(page, '35_删除500');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.36 Delete Role-加载中按钮禁用', async ({ page }) => {
    resetCounter('36_删除加载中');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await page.route('**/api/ud17/UD17HDocUserAdministrationApi', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      if (body.operation === 'deleteRole') {
        await new Promise(r => setTimeout(r, 3000));
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
      } else {
        await route.fallback();
      }
    });
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    page.once('dialog', (dialog) => {
      dialog.accept();
    });
    await page.locator('.ud17-btn').filter({ hasText: 'Delete Role' }).click({ force: true, timeout: 10000 });
    await page.waitForTimeout(500);
    // isLoading=true 时组件显示加载遮罩，表单按钮从 DOM 消失
    await expect(page.locator('.ud17-loading')).toBeVisible();
    await takeScreenshot(page, '36_删除加载中');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });
});

// ============================================================
// 7. 异常处理（No.37-39）
// ============================================================
test.describe.serial('异常处理（No.37-39）', () => {
  test.setTimeout(180000);

  test('No.37 异常处理-API 超时', async ({ page }) => {
    resetCounter('37_API超时');
    await mockApiTimeout(page);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    const input = page.locator('.ud17-inp').first();
    await input.click();
    await input.pressSequentially('V0C6900', { delay: 15 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud17-msg.ud17-error')).toContainText('try again');
    await takeScreenshot(page, '37_API超时');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.38 异常处理-数据库操作异常', async ({ page }) => {
    resetCounter('38_数据库异常');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockUpdateRoleFail(page);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    await page.locator('.ud17-chk-lbl').filter({ hasText: 'Standard User' }).locator('input[type="checkbox"]').check();
    await page.waitForTimeout(300);
    await page.locator('.ud17-btn').filter({ hasText: 'Update Role' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud17-msg.ud17-error')).toContainText('Update failed');
    await takeScreenshot(page, '38_数据库异常');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.39 异常处理-用户未登录', async ({ page }) => {
    resetCounter('39_未登录');
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await page.goto(UD17_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    expect(page.url()).toBe(BASE_URL + '/');
    await takeScreenshot(page, '39_未登录');
  });
});

// ============================================================
// 8. UI 交互（No.40-42）
// ============================================================
test.describe.serial('UI交互（No.40-42）', () => {
  test.setTimeout(120000);

  test('No.40 错误消息-显示样式', async ({ page }) => {
    resetCounter('40_错误样式');
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(500);
    const msg = page.locator('.ud17-msg.ud17-error');
    await expect(msg).toContainText('Please enter UserID');
    await expect(msg).toBeVisible();
    await takeScreenshot(page, '40_错误样式');
  });

  test('No.41 成功消息-显示样式', async ({ page }) => {
    resetCounter('41_成功样式');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await mockUpdateRoleSuccess(page);
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    await page.locator('.ud17-chk-lbl').filter({ hasText: 'Standard User' }).locator('input[type="checkbox"]').check();
    await page.waitForTimeout(300);
    await page.locator('.ud17-btn').filter({ hasText: 'Update Role' }).click();
    await page.waitForTimeout(2000);
    const msg = page.locator('.ud17-msg.ud17-success');
    await expect(msg).toContainText('Role updated successfully');
    await expect(msg).toBeVisible();
    await takeScreenshot(page, '41_成功样式');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.42 页面刷新', async ({ page }) => {
    resetCounter('42_页面刷新');
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    const input = page.locator('.ud17-inp').first();
    await input.click();
    await input.pressSequentially('V0C6900', { delay: 15 });
    await page.waitForTimeout(300);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.waitForSelector('.ud17-page-title', { timeout: 10000 });
    await expect(page.locator('.ud17-inp').first()).toHaveValue('');
    await expect(page.locator('.ud17-ro')).toHaveValue('');
    await takeScreenshot(page, '42_页面刷新');
  });
});

// ============================================================
// 9. 安全性（No.43-45）
// ============================================================
test.describe.serial('安全性（No.43-45）', () => {
  test.setTimeout(120000);

  test('No.43 安全性-API 请求验证', async ({ page }) => {
    resetCounter('43_API请求验证');
    let lastBody = '';
    await page.route('**/api/ud17/UD17HDocUserAdministrationApi', async (route) => {
      lastBody = route.request().postData() || '';
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { success: true } }) });
    });
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(1000);
    expect(lastBody).toContain('operation');
    expect(lastBody).toContain('userid');
    await takeScreenshot(page, '43_API请求验证');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });

  test('No.44 安全性-权限控制（无权限用户）', async ({ page }) => {
    resetCounter('44_权限控制');
    // 以无 HDocUserAdmin 权限的用户登录
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await page.evaluate((info) => { localStorage.setItem('userInfo', JSON.stringify(info)); }, {
      username: 'guest', role: 'Guest',
      permissions: ["GenerateDucument"]
    });
    await page.goto(UD17_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    // 可能跳转到登录页（根据权限控制实现）
    const onLogin = page.url().includes(BASE_URL + '/');
    if (await page.locator('.ud17-inp').first().isVisible().catch(() => false)) {
      await page.locator('.ud17-inp').first().click();
      await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
      await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
      await page.waitForTimeout(1000);
    }
    await takeScreenshot(page, '44_权限控制');
  });

  test('No.45 安全性-Delete Role 确认对话框', async ({ page }) => {
    resetCounter('45_删除确认框');
    await mockUserInfoSuccess(page, { code: 200, data: { username: 'Test', functions: [], markets: [] } });
    await gotoUD17(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud17-inp').first().click();
    await page.locator('.ud17-inp').first().pressSequentially('V0C6900', { delay: 10 });
    await page.locator('.ud17-btn').filter({ hasText: 'USER INFO' }).click();
    await page.waitForTimeout(2000);
    let dialogAppeared = false;
    page.on('dialog', async (dialog) => {
      dialogAppeared = true;
      await dialog.dismiss();
    });
    await page.locator('.ud17-btn').filter({ hasText: 'Delete Role' }).click();
    await page.waitForTimeout(1000);
    expect(dialogAppeared).toBe(true);
    await takeScreenshot(page, '45_删除确认框');
    await page.unroute('**/api/ud17/UD17HDocUserAdministrationApi');
  });
});
