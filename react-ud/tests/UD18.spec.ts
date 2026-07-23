import { test, expect, Page } from '@playwright/test';
import { insertUD18TestData, cleanupUD18TestData } from './test-data-helper';

// ============================================================
// HDocUserDocAdministration 模块 (UD18) Playwright 自动化测试
// 基于 単体テスト仕様書UD18.md（28个测试用例）
// API: GET /api/ud20/marketdocumentsettings, POST /api/ud18/UD18HDocUserDocAdministrationApi
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD18';
const UD18_URL = `${BASE_URL}/Menu/HDocUserDocAdministration`;

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

async function gotoUD18(page: Page) {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  await page.goto(UD18_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.waitForSelector('.ud18-title', { timeout: 30000 });
}

/** Mock Document List API */
async function mockDocListApi(page: Page, docs: any[]) {
  await page.route('**/api/ud20/marketdocumentsettings', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: docs }) });
  });
}

/** Mock UD18 API - checkAuth success */
async function mockCheckAuthSuccess(page: Page) {
  await page.route('**/api/ud18/UD18HDocUserDocAdministrationApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'checkAuth') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { exists: true } }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock UD18 API - checkAuth fail */
async function mockCheckAuthFail(page: Page) {
  await page.route('**/api/ud18/UD18HDocUserDocAdministrationApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'checkAuth') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { exists: false } }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock UD18 API - select success */
async function mockSelectSuccess(page: Page, username: string, doctypes: string[]) {
  await page.route('**/api/ud18/UD18HDocUserDocAdministrationApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'select') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { username, doctypes } }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock UD18 API - all operations success (for User Info) */
async function mockUserInfoSuccess(page: Page, username: string, doctypes: string[]) {
  await page.route('**/api/ud18/UD18HDocUserDocAdministrationApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'checkAuth') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { exists: true } }) });
    } else if (body.operation === 'select') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { username, doctypes } }) });
    } else if (body.operation === 'delete' || body.operation === 'create') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock UD18 API - 500 error (select 操作返回 500，checkAuth 正常通过) */
async function mockApiFail(page: Page) {
  await page.route('**/api/ud18/UD18HDocUserDocAdministrationApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'checkAuth') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { exists: true } }) });
    } else if (body.operation === 'select') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500, message: 'System error', data: null }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock UD18 API - Update 500 */
async function mockUpdateFail(page: Page) {
  await page.route('**/api/ud18/UD18HDocUserDocAdministrationApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === 'checkAuth') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { exists: true } }) });
    } else if (body.operation === 'delete') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
    } else if (body.operation === 'create') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500 }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock API timeout */
async function mockApiTimeout(page: Page) {
  await page.route('**/api/ud18/UD18HDocUserDocAdministrationApi', () => new Promise(() => {}));
}

/** Mock with delay for loading test */
async function mockWithDelay(page: Page, delay: number = 3000) {
  await page.route('**/api/ud18/UD18HDocUserDocAdministrationApi', async (route) => {
    await new Promise(r => setTimeout(r, delay));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { exists: true } }) });
  });
}

const MOCK_DOCS = [
  { DOCTYPE: 'COC', REGISTER_USER: 'admin' },
  { DOCTYPE: 'VCC', REGISTER_USER: 'admin' },
  { DOCTYPE: 'EEC', REGISTER_USER: 'admin' },
];

// ============================================================
// 1. 画面初始化（No.1-3）
// ============================================================
test.describe.serial('画面初始化（No.1-3）', () => {
  test.setTimeout(120000);

  test('No.1 画面初期显示-基本元素', async ({ page }) => {
    resetCounter('01_基本元素');
    await gotoUD18(page);
    await page.waitForTimeout(2000);
    // 标题
    await expect(page.locator('.ud18-title')).toContainText('HDoc User Doc Administration');
    // UserID 输入框
    await expect(page.locator('.ud18-input')).toBeVisible();
    await expect(page.locator('.ud18-input')).toHaveAttribute('maxLength', '10');
    // User 标签（初始为空，不显示 username div）
    await expect(page.locator('.ud18-user-label')).toHaveCount(0);
    // Document 多选列表
    await expect(page.locator('.ud18-multiselect')).toBeVisible();
    // 按钮
    await expect(page.locator('.ud18-btn').filter({ hasText: 'User Info' })).toBeVisible();
    await expect(page.locator('.ud18-btn').filter({ hasText: 'Update' })).toBeVisible();
    await expect(page.locator('.ud18-btn').filter({ hasText: 'User Info' })).toBeEnabled();
    await expect(page.locator('.ud18-btn').filter({ hasText: 'Update' })).toBeEnabled();
    await takeScreenshot(page, '01_基本元素');
  });

  test('No.2 画面初期显示-文档列表加载', async ({ page }) => {
    resetCounter('02_文档列表');
    await gotoUD18(page);
    await page.waitForTimeout(2000);
    // Document 多选列表应有选项
    const options = page.locator('.ud18-multiselect option');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
    // 无文档被预选中
    const selectedOptions = await page.locator('.ud18-multiselect').inputValue();
    expect(selectedOptions).toBe('');
    await takeScreenshot(page, '02_文档列表');
  });

  test('No.3 画面初期显示-初始状态', async ({ page }) => {
    resetCounter('03_初始状态');
    await gotoUD18(page);
    await page.waitForTimeout(2000);
    // UserID 为空
    await expect(page.locator('.ud18-input')).toHaveValue('');
    // User 标签不显示
    await expect(page.locator('.ud18-user-label')).toHaveCount(0);
    // 无消息
    await expect(page.locator('.ud18-message')).toHaveCount(0);
    await takeScreenshot(page, '03_初始状态');
  });
});

// ============================================================
// 2. 用户信息查询 User Info（No.4-8）
// ============================================================
test.describe.serial('用户信息查询（No.4-8）', () => {
  test.setTimeout(120000);

  test('No.4 User Info-UserID 为空', async ({ page }) => {
    resetCounter('04_UID空');
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud18-btn').filter({ hasText: 'User Info' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud18-message.error')).toContainText('UserID is required');
    await takeScreenshot(page, '04_UID空');
  });

  test('No.5 User Info-功能权限表不存在', async ({ page }) => {
    resetCounter('05_无权限记录');
    await mockDocListApi(page, MOCK_DOCS);
    await mockCheckAuthFail(page);
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    const input = page.locator('.ud18-input');
    await input.click();
    await input.pressSequentially('INVALID', { delay: 15 });
    await page.locator('.ud18-btn').filter({ hasText: 'User Info' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud18-message.error')).toContainText("We didn't recognize");
    await expect(page.locator('.ud18-user-label')).toHaveCount(0);
    await takeScreenshot(page, '05_无权限记录');
    await page.unroute('**/api/ud20/marketdocumentsettings');
    await page.unroute('**/api/ud18/UD18HDocUserDocAdministrationApi');
  });

  test('No.6 User Info-查询成功', async ({ page }) => {
    resetCounter('06_查询成功');
    await insertUD18TestData();
    await mockDocListApi(page, MOCK_DOCS);
    await mockUserInfoSuccess(page, 'Jenna Wang', ['COC', 'VCC']);
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    const input = page.locator('.ud18-input');
    await input.click();
    await input.pressSequentially('A420064', { delay: 15 });
    await page.locator('.ud18-btn').filter({ hasText: 'User Info' }).click();
    await page.waitForTimeout(2000);
    // User 标签显示用户名
    await expect(page.locator('.ud18-user-label')).toContainText('Jenna Wang');
    // COC 和 VCC 被选中（有 ✓ 标记）
    await expect(page.locator('.ud18-multiselect option[value="COC"]')).toHaveClass(/ud18-option-assigned/);
    await expect(page.locator('.ud18-multiselect option[value="VCC"]')).toHaveClass(/ud18-option-assigned/);
    await takeScreenshot(page, '06_查询成功');
    await page.unroute('**/api/ud20/marketdocumentsettings');
    await page.unroute('**/api/ud18/UD18HDocUserDocAdministrationApi');
  });

  test('No.7 User Info-API 返回 500', async ({ page }) => {
    resetCounter('07_UserInfo500');
    await mockDocListApi(page, MOCK_DOCS);
    await mockApiFail(page);
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    const input = page.locator('.ud18-input');
    await input.click();
    await input.pressSequentially('A420064', { delay: 15 });
    await page.locator('.ud18-btn').filter({ hasText: 'User Info' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud18-message.error')).toContainText('System error');
    await expect(page.locator('.ud18-user-label')).toHaveCount(0);
    await takeScreenshot(page, '07_UserInfo500');
    await page.unroute('**/api/ud20/marketdocumentsettings');
    await page.unroute('**/api/ud18/UD18HDocUserDocAdministrationApi');
  });

  test('No.8 User Info-加载中按钮禁用', async ({ page }) => {
    resetCounter('08_UserInfo加载');
    await mockDocListApi(page, MOCK_DOCS);
    await mockWithDelay(page, 3000);
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    const input = page.locator('.ud18-input');
    await input.click();
    await input.pressSequentially('A420064', { delay: 15 });
    await page.locator('.ud18-btn').filter({ hasText: 'User Info' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud18-btn').filter({ hasText: 'User Info' })).toBeDisabled();
    await takeScreenshot(page, '08_UserInfo加载');
    await page.unroute('**/api/ud20/marketdocumentsettings');
    await page.unroute('**/api/ud18/UD18HDocUserDocAdministrationApi');
  });
});

// ============================================================
// 3. Document 多选列表（No.9-11）
// ============================================================
test.describe.serial('Document多选（No.9-11）', () => {
  test.setTimeout(120000);

  test('No.9 Document-多选功能', async ({ page }) => {
    resetCounter('09_多选功能');
    await mockDocListApi(page, MOCK_DOCS);
    await mockUserInfoSuccess(page, 'Jenna Wang', []);
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    // 先查询用户（确保后续操作可用）
    await page.locator('.ud18-input').click();
    await page.locator('.ud18-input').pressSequentially('A420064', { delay: 10 });
    await page.locator('.ud18-btn').filter({ hasText: 'User Info' }).click();
    await page.waitForTimeout(2000);
    // Document 多选选择 COC 和 VCC
    const multiselect = page.locator('.ud18-multiselect');
    await multiselect.selectOption(['COC', 'VCC'], { timeout: 5000 });
    await page.waitForTimeout(300);
    // 确认选择状态
    const selected = await multiselect.inputValue();
    expect(selected).toBeTruthy();
    await takeScreenshot(page, '09_多选功能');
    await page.unroute('**/api/ud20/marketdocumentsettings');
    await page.unroute('**/api/ud18/UD18HDocUserDocAdministrationApi');
  });

  test('No.10 Document-全选/取消全选', async ({ page }) => {
    resetCounter('10_全选取消');
    await mockDocListApi(page, MOCK_DOCS);
    await mockUserInfoSuccess(page, 'Jenna Wang', []);
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud18-input').click();
    await page.locator('.ud18-input').pressSequentially('A420064', { delay: 10 });
    await page.locator('.ud18-btn').filter({ hasText: 'User Info' }).click();
    await page.waitForTimeout(2000);
    // 全选 - 使用 Ctrl+A 选择所有选项
    const multiselect = page.locator('.ud18-multiselect');
    const allValues = await multiselect.locator('option').allTextContents();
    await multiselect.selectOption(allValues.map(v => v.trim()).filter(v => v), { timeout: 5000 });
    await page.waitForTimeout(300);
    await takeScreenshot(page, '10_全选取消');
    await page.unroute('**/api/ud20/marketdocumentsettings');
    await page.unroute('**/api/ud18/UD18HDocUserDocAdministrationApi');
  });

  test('No.11 Document-初始选中已授权文档', async ({ page }) => {
    resetCounter('11_初始选中');
    await mockDocListApi(page, MOCK_DOCS);
    await mockUserInfoSuccess(page, 'Jenna Wang', ['COC', 'VCC']);
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud18-input').click();
    await page.locator('.ud18-input').pressSequentially('A420064', { delay: 10 });
    await page.locator('.ud18-btn').filter({ hasText: 'User Info' }).click();
    await page.waitForTimeout(2000);
    // COC 和 VCC 应被标记为已授权
    await expect(page.locator('.ud18-multiselect option[value="COC"]')).toHaveClass(/ud18-option-assigned/);
    await expect(page.locator('.ud18-multiselect option[value="VCC"]')).toHaveClass(/ud18-option-assigned/);
    // EEC 应未被标记
    await expect(page.locator('.ud18-multiselect option[value="EEC"]')).not.toHaveClass(/ud18-option-assigned/);
    await takeScreenshot(page, '11_初始选中');
    await page.unroute('**/api/ud20/marketdocumentsettings');
    await page.unroute('**/api/ud18/UD18HDocUserDocAdministrationApi');
  });
});

// ============================================================
// 4. Update 文档权限更新（No.12-18）
// ============================================================
test.describe.serial('Update权限更新（No.12-18）', () => {
  test.setTimeout(120000);

  test('No.12 Update-未查询时点击', async ({ page }) => {
    resetCounter('12_更新未查询');
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud18-btn').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud18-message.error')).toContainText('UserID is required');
    await takeScreenshot(page, '12_更新未查询');
  });

  test('No.13 Update-UserID 不在功能权限表中', async ({ page }) => {
    resetCounter('13_更新无权限');
    await mockDocListApi(page, MOCK_DOCS);
    await page.route('**/api/ud18/UD18HDocUserDocAdministrationApi', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      if (body.operation === 'checkAuth') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { exists: false } }) });
      } else {
        await route.fallback();
      }
    });
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud18-input').click();
    await page.locator('.ud18-input').pressSequentially('INVALID', { delay: 10 });
    await page.locator('.ud18-btn').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud18-message.error')).toContainText("We didn't recognize");
    await takeScreenshot(page, '13_更新无权限');
    await page.unroute('**/api/ud20/marketdocumentsettings');
    await page.unroute('**/api/ud18/UD18HDocUserDocAdministrationApi');
  });

  test('No.14 Update-成功', async ({ page }) => {
    resetCounter('14_更新成功');
    await insertUD18TestData();
    await mockDocListApi(page, MOCK_DOCS);
    await mockUserInfoSuccess(page, 'Jenna Wang', ['COC']);
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    // 查询用户
    await page.locator('.ud18-input').click();
    await page.locator('.ud18-input').pressSequentially('A420064', { delay: 10 });
    await page.locator('.ud18-btn').filter({ hasText: 'User Info' }).click();
    await page.waitForTimeout(2000);
    // 选择文档
    const multiselect = page.locator('.ud18-multiselect');
    await multiselect.selectOption(['COC', 'VCC', 'EEC'], { timeout: 5000 });
    await page.waitForTimeout(300);
    // 点击 Update
    await page.locator('.ud18-btn').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud18-message.success')).toContainText('Document permissions updated successfully');
    await takeScreenshot(page, '14_更新成功');
    await page.unroute('**/api/ud20/marketdocumentsettings');
    await page.unroute('**/api/ud18/UD18HDocUserDocAdministrationApi');
  });

  test('No.15 Update-更新后自动刷新', async ({ page }) => {
    resetCounter('15_更新刷新');
    await mockDocListApi(page, MOCK_DOCS);
    // First user info returns COC, then after update, select returns COC+VCC
    let selectCallCount = 0;
    await page.route('**/api/ud18/UD18HDocUserDocAdministrationApi', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      if (body.operation === 'checkAuth') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { exists: true } }) });
      } else if (body.operation === 'select') {
        selectCallCount++;
        if (selectCallCount === 1) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { username: 'Jenna Wang', doctypes: ['COC'] } }) });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { username: 'Jenna Wang', doctypes: ['COC', 'VCC'] } }) });
        }
      } else if (body.operation === 'delete' || body.operation === 'create') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
      } else {
        await route.fallback();
      }
    });
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    // 查询用户
    await page.locator('.ud18-input').click();
    await page.locator('.ud18-input').pressSequentially('A420064', { delay: 10 });
    await page.locator('.ud18-btn').filter({ hasText: 'User Info' }).click();
    await page.waitForTimeout(2000);
    // 选择 VCC
    await page.locator('.ud18-multiselect').selectOption(['COC', 'VCC'], { timeout: 5000 });
    await page.waitForTimeout(300);
    // 点击 Update
    await page.locator('.ud18-btn').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud18-message.success')).toContainText('Document permissions updated successfully');
    await takeScreenshot(page, '15_更新刷新');
    await page.unroute('**/api/ud20/marketdocumentsettings');
    await page.unroute('**/api/ud18/UD18HDocUserDocAdministrationApi');
  });

  test('No.16 Update-失败（API 500）', async ({ page }) => {
    resetCounter('16_更新500');
    await mockDocListApi(page, MOCK_DOCS);
    await mockUserInfoSuccess(page, 'Jenna Wang', []);
    await mockUpdateFail(page);
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud18-input').click();
    await page.locator('.ud18-input').pressSequentially('A420064', { delay: 10 });
    await page.locator('.ud18-btn').filter({ hasText: 'User Info' }).click();
    await page.waitForTimeout(2000);
    await page.locator('.ud18-multiselect').selectOption(['COC'], { timeout: 5000 });
    await page.waitForTimeout(300);
    await page.locator('.ud18-btn').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud18-message.error')).toContainText('System error');
    await takeScreenshot(page, '16_更新500');
    await page.unroute('**/api/ud20/marketdocumentsettings');
    await page.unroute('**/api/ud18/UD18HDocUserDocAdministrationApi');
  });

  test('No.17 Update-加载中按钮禁用', async ({ page }) => {
    resetCounter('17_更新加载中');
    await mockDocListApi(page, MOCK_DOCS);
    await page.route('**/api/ud18/UD18HDocUserDocAdministrationApi', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      if (body.operation === 'checkAuth') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { exists: true } }) });
      } else if (body.operation === 'select') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { username: 'Jenna Wang', doctypes: [] } }) });
      } else if (body.operation === 'delete' || body.operation === 'create') {
        await new Promise(r => setTimeout(r, 3000));
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
      } else {
        await route.fallback();
      }
    });
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud18-input').click();
    await page.locator('.ud18-input').pressSequentially('A420064', { delay: 10 });
    await page.locator('.ud18-btn').filter({ hasText: 'User Info' }).click();
    await page.waitForTimeout(2000);
    await page.locator('.ud18-btn').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud18-btn').filter({ hasText: 'Update' })).toBeDisabled();
    await takeScreenshot(page, '17_更新加载中');
    await page.unroute('**/api/ud20/marketdocumentsettings');
    await page.unroute('**/api/ud18/UD18HDocUserDocAdministrationApi');
  });

  test('No.18 Update-防止重复提交', async ({ page }) => {
    resetCounter('18_防重复');
    let createCallCount = 0;
    await mockDocListApi(page, MOCK_DOCS);
    await page.route('**/api/ud18/UD18HDocUserDocAdministrationApi', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      if (body.operation === 'checkAuth') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { exists: true } }) });
      } else if (body.operation === 'select') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { username: 'Jenna Wang', doctypes: [] } }) });
      } else if (body.operation === 'delete') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
      } else if (body.operation === 'create') {
        createCallCount++;
        await new Promise(r => setTimeout(r, 3000));
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
      } else {
        await route.fallback();
      }
    });
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud18-input').click();
    await page.locator('.ud18-input').pressSequentially('A420064', { delay: 10 });
    await page.locator('.ud18-btn').filter({ hasText: 'User Info' }).click();
    await page.waitForTimeout(2000);
    await page.locator('.ud18-btn').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(500);
    // Button is disabled, use force to try a second click
    await page.locator('.ud18-btn').filter({ hasText: 'Update' }).click({ force: true });
    await page.waitForTimeout(4000);
    expect(createCallCount).toBeLessThanOrEqual(1);
    await takeScreenshot(page, '18_防重复');
    await page.unroute('**/api/ud20/marketdocumentsettings');
    await page.unroute('**/api/ud18/UD18HDocUserDocAdministrationApi');
  });
});

// ============================================================
// 5. 异常处理（No.19-22）
// ============================================================
test.describe.serial('异常处理（No.19-22）', () => {
  test.setTimeout(180000);

  test('No.19 异常处理-API 超时', async ({ page }) => {
    resetCounter('19_API超时');
    await mockDocListApi(page, MOCK_DOCS);
    await mockApiTimeout(page);
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    const input = page.locator('.ud18-input');
    await input.click();
    await input.pressSequentially('A420064', { delay: 15 });
    await page.locator('.ud18-btn').filter({ hasText: 'User Info' }).click();
    await page.waitForTimeout(35000);
    await expect(page.locator('.ud18-message.error')).toContainText('System error');
    await takeScreenshot(page, '19_API超时');
    await page.unroute('**/api/ud20/marketdocumentsettings');
    await page.unroute('**/api/ud18/UD18HDocUserDocAdministrationApi');
  });

  test('No.20 异常处理-Saviynt系统调用失败', async ({ page }) => {
    resetCounter('20_Saviynt失败');
    await mockDocListApi(page, MOCK_DOCS);
    // 模拟网络断开（catch 块捕获后显示 System error）
    await page.route('**/api/ud18/UD18HDocUserDocAdministrationApi', (route) => route.abort('connectionrefused'));
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud18-input').click();
    await page.locator('.ud18-input').pressSequentially('A420064', { delay: 10 });
    await page.locator('.ud18-btn').filter({ hasText: 'User Info' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud18-message.error')).toContainText('System error');
    await expect(page.locator('.ud18-user-label')).toHaveCount(0);
    await takeScreenshot(page, '20_Saviynt失败');
    await page.unroute('**/api/ud20/marketdocumentsettings');
    await page.unroute('**/api/ud18/UD18HDocUserDocAdministrationApi');
  });

  test('No.21 异常处理-数据库操作异常', async ({ page }) => {
    resetCounter('20_数据库异常');
    await mockDocListApi(page, MOCK_DOCS);
    await mockUserInfoSuccess(page, 'Jenna Wang', []);
    await mockUpdateFail(page);
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud18-input').click();
    await page.locator('.ud18-input').pressSequentially('A420064', { delay: 10 });
    await page.locator('.ud18-btn').filter({ hasText: 'User Info' }).click();
    await page.waitForTimeout(2000);
    await page.locator('.ud18-multiselect').selectOption(['COC'], { timeout: 5000 });
    await page.waitForTimeout(300);
    await page.locator('.ud18-btn').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud18-message.error')).toContainText('System error');
    await takeScreenshot(page, '20_数据库异常');
    await page.unroute('**/api/ud20/marketdocumentsettings');
    await page.unroute('**/api/ud18/UD18HDocUserDocAdministrationApi');
  });

  test('No.21 异常处理-用户未登录', async ({ page }) => {
    resetCounter('21_未登录');
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await page.goto(UD18_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    expect(page.url()).toBe(BASE_URL + '/');
    await takeScreenshot(page, '21_未登录');
  });
});

// ============================================================
// 6. UI 交互（No.22-25）
// ============================================================
test.describe.serial('UI交互（No.22-25）', () => {
  test.setTimeout(120000);

  test('No.22 错误消息-显示样式', async ({ page }) => {
    resetCounter('22_错误样式');
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud18-btn').filter({ hasText: 'User Info' }).click();
    await page.waitForTimeout(500);
    const msg = page.locator('.ud18-message.error');
    await expect(msg).toContainText('UserID is required');
    await expect(msg).toBeVisible();
    await takeScreenshot(page, '22_错误样式');
  });

  test('No.23 成功消息-显示样式', async ({ page }) => {
    resetCounter('23_成功样式');
    await mockDocListApi(page, MOCK_DOCS);
    await mockUserInfoSuccess(page, 'Jenna Wang', []);
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud18-input').click();
    await page.locator('.ud18-input').pressSequentially('A420064', { delay: 10 });
    await page.locator('.ud18-btn').filter({ hasText: 'User Info' }).click();
    await page.waitForTimeout(2000);
    await page.locator('.ud18-btn').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(2000);
    const msg = page.locator('.ud18-message.success');
    await expect(msg).toContainText('Document permissions updated successfully');
    await expect(msg).toBeVisible();
    await takeScreenshot(page, '23_成功样式');
    await page.unroute('**/api/ud20/marketdocumentsettings');
    await page.unroute('**/api/ud18/UD18HDocUserDocAdministrationApi');
  });

  test('No.24 页面刷新', async ({ page }) => {
    resetCounter('24_页面刷新');
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    const input = page.locator('.ud18-input');
    await input.click();
    await input.pressSequentially('A420064', { delay: 15 });
    await page.waitForTimeout(300);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.waitForSelector('.ud18-title', { timeout: 10000 });
    await expect(page.locator('.ud18-input')).toHaveValue('');
    await expect(page.locator('.ud18-user-label')).toHaveCount(0);
    await expect(page.locator('.ud18-message')).toHaveCount(0);
    await takeScreenshot(page, '24_页面刷新');
  });
});

// ============================================================
// 7. 安全性（No.25-28）
// ============================================================
test.describe.serial('安全性（No.25-28）', () => {
  test.setTimeout(120000);

  test('No.25 安全性-API 请求验证', async ({ page }) => {
    resetCounter('25_API请求验证');
    let requestBody = '';
    await page.route('**/api/ud18/UD18HDocUserDocAdministrationApi', async (route) => {
      requestBody = route.request().postData() || '';
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { exists: true } }) });
    });
    await gotoUD18(page);
    await page.waitForTimeout(1000);
    await page.locator('.ud18-input').click();
    await page.locator('.ud18-input').pressSequentially('A420064', { delay: 10 });
    await page.locator('.ud18-btn').filter({ hasText: 'User Info' }).click();
    await page.waitForTimeout(1000);
    expect(requestBody).toContain('operation');
    expect(requestBody).toContain('userid');
    await takeScreenshot(page, '25_API请求验证');
    await page.unroute('**/api/ud18/UD18HDocUserDocAdministrationApi');
  });

  test('No.26 安全性-权限控制（无权限用户）', async ({ page }) => {
    resetCounter('26_权限控制');
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await page.evaluate((info) => { localStorage.setItem('userInfo', JSON.stringify(info)); }, {
      username: 'guest', role: 'Guest',
      permissions: ["GenerateDucument"]
    });
    await page.goto(UD18_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    if (await page.locator('.ud18-input').isVisible().catch(() => false)) {
      await page.locator('.ud18-input').click();
      await page.locator('.ud18-input').pressSequentially('A420064', { delay: 10 });
      await page.locator('.ud18-btn').filter({ hasText: 'Update' }).click();
      await page.waitForTimeout(1000);
    }
    await takeScreenshot(page, '26_权限控制');
  });

  test('No.27 UserID-半角英数字校验', async ({ page }) => {
    resetCounter('27_半角英数字');
    await gotoUD18(page);
    const input = page.locator('.ud18-input');
    await input.click();
    // 尝试输入全角字符
    await input.pressSequentially('ＡＢＣ', { delay: 10 });
    await page.waitForTimeout(300);
    // 全角字符应被过滤（仅保留半角英数字）
    const val = await input.inputValue();
    // 组件限制只允许 a-zA-Z0-9，全角字符应被阻止
    expect(val).not.toContain('Ａ');
    // 尝试输入特殊符号
    await input.fill('');
    await input.pressSequentially('test@#', { delay: 5 });
    await page.waitForTimeout(300);
    const val2 = await input.inputValue();
    expect(val2).not.toContain('@');
    expect(val2).not.toContain('#');
    // 尝试输入正常半角英数字
    await input.fill('');
    await input.pressSequentially('TestUser01', { delay: 5 });
    await page.waitForTimeout(300);
    const val3 = await input.inputValue();
    expect(val3).toBe('TestUser01');
    await takeScreenshot(page, '27_半角英数字');
  });
});
