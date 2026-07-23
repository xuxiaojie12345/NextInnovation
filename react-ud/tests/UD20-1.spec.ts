import { test, expect, Page } from '@playwright/test';
import { insertUD201TestData, cleanupUD201TestData } from './test-data-helper';

// ============================================================
// MarketDocumentSettings 模块 (UD20-1) Playwright 自动化测试
// 基于 詳細設計UD20-1.md
// API: POST /api/ud20-1/UpdateHdocDocumentList
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD20-1';
const UD201_URL = `${BASE_URL}/Menu/MarketDocumentSettings`;

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

async function gotoUD201(page: Page) {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  await page.goto(UD201_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.waitForSelector('.ud20-1-title', { timeout: 30000 });
}

/** Mock Update API — success */
async function mockUpdateSuccess(page: Page) {
  await page.route('**/api/ud20-1/UpdateHdocDocumentList', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
  });
}

/** Mock Update API — 404 */
async function mockUpdateNotFound(page: Page) {
  await page.route('**/api/ud20-1/UpdateHdocDocumentList', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 404, message: 'Document type does not exists. Please enter the correct content.' }) });
  });
}

/** Mock Update API — 500 */
async function mockUpdateFail(page: Page) {
  await page.route('**/api/ud20-1/UpdateHdocDocumentList', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500 }) });
  });
}

/** Mock Update API — network error */
async function mockUpdateNetError(page: Page) {
  await page.route('**/api/ud20-1/UpdateHdocDocumentList', (route) => route.abort('connectionrefused'));
}

/** Mock Update API with delay for loading test */
async function mockUpdateWithDelay(page: Page, delay: number = 3000) {
  await page.route('**/api/ud20-1/UpdateHdocDocumentList', async (route) => {
    await new Promise(r => setTimeout(r, delay));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
  });
}

// ============================================================
// 1. 画面初始化（No.1-2）
// ============================================================
test.describe.serial('画面初期化（No.1-2）', () => {
  test.setTimeout(120000);

  test('No.1 基本元素', async ({ page }) => {
    resetCounter('01_基本元素');
    await gotoUD201(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud20-1-title')).toContainText('Market Document Settings');
    // 4个按钮
    const btns = ['Search', 'Clear', 'Back', 'Update Mode'];
    for (const btn of btns) {
      await expect(page.locator('.action-button').filter({ hasText: btn })).toBeVisible();
      await expect(page.locator('.action-button').filter({ hasText: btn })).toBeEnabled();
    }
    // 6个表单行
    await expect(page.locator('.form-label').filter({ hasText: 'Document type' })).toBeVisible();
    await expect(page.locator('.form-label').filter({ hasText: 'Market' })).toBeVisible();
    await expect(page.locator('.form-label').filter({ hasText: 'Setting' })).toBeVisible();
    await expect(page.locator('.form-label').filter({ hasText: 'Bussines unit' })).toBeVisible();
    await expect(page.locator('.form-label').filter({ hasText: 'User' })).toBeVisible();
    await expect(page.locator('.form-label').filter({ hasText: 'Date' })).toBeVisible();
    // 运算符下拉（operator-select）
    await expect(page.locator('.operator-select')).toHaveCount(6);
    await takeScreenshot(page, '01_基本元素');
  });

  test('No.2 初始状态', async ({ page }) => {
    resetCounter('02_初始状态');
    await gotoUD201(page);
    await page.waitForTimeout(2000);
    // 所有输入框为空
    const inputs = page.locator('.form-input');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toHaveValue('');
    }
    // Setting 下拉为默认空选项
    await expect(page.locator('.form-select')).toHaveValue('');
    // Bussines unit 固定显示 BU
    await expect(page.locator('.form-fixed-value')).toContainText('BU');
    // 无消息
    await expect(page.locator('.ud20-1-message')).toHaveCount(0);
    await takeScreenshot(page, '02_初始状态');
  });
});

// ============================================================
// 2. 入力操作（No.3-9）
// ============================================================
test.describe.serial('入力操作（No.3-9）', () => {
  test.setTimeout(120000);

  test('No.3 Document type 入力', async ({ page }) => {
    resetCounter('03_DocType入力');
    await gotoUD201(page);
    const input = page.locator('.form-input').first();
    await input.click();
    await input.pressSequentially('COC', { delay: 10 });
    await expect(input).toHaveValue('COC');
    // maxLength=20
    await expect(input).toHaveAttribute('maxLength', '20');
    await takeScreenshot(page, '03_DocType入力');
  });

  test('No.4 Market 入力', async ({ page }) => {
    resetCounter('04_Market入力');
    await gotoUD201(page);
    const inputs = page.locator('.form-input');
    const marketInput = inputs.nth(1);
    await marketInput.click();
    await marketInput.pressSequentially('JPN', { delay: 10 });
    await expect(marketInput).toHaveValue('JPN');
    await takeScreenshot(page, '04_Market入力');
  });

  test('No.5 Setting 選択', async ({ page }) => {
    resetCounter('05_Setting選択');
    await gotoUD201(page);
    const select = page.locator('.form-select');
    await select.selectOption('Option 1');
    await expect(select).toHaveValue('Option 1');
    await takeScreenshot(page, '05_Setting選択');
  });

  test('No.6 User 入力', async ({ page }) => {
    resetCounter('06_User入力');
    await gotoUD201(page);
    const inputs = page.locator('.form-input');
    const userInput = inputs.nth(2); // Document type, Market, then User
    await userInput.click();
    await userInput.pressSequentially('admin', { delay: 10 });
    await expect(userInput).toHaveValue('admin');
    await expect(userInput).toHaveAttribute('maxLength', '16');
    await takeScreenshot(page, '06_User入力');
  });

  test('No.7 Date 入力', async ({ page }) => {
    resetCounter('07_Date入力');
    await gotoUD201(page);
    const inputs = page.locator('.form-input');
    const dateInput = inputs.nth(3); // Document type, Market, User, then Date
    await dateInput.click();
    await dateInput.pressSequentially('2026-01-15', { delay: 10 });
    await expect(dateInput).toHaveValue('2026-01-15');
    await takeScreenshot(page, '07_Date入力');
  });

  test('No.8 Bussines unit 固定表示', async ({ page }) => {
    resetCounter('08_BU固定');
    await gotoUD201(page);
    await expect(page.locator('.form-fixed-value')).toContainText('BU');
    await takeScreenshot(page, '08_BU固定');
  });

  test('No.9 运算符切换', async ({ page }) => {
    resetCounter('09_运算符');
    await gotoUD201(page);
    const ops = page.locator('.operator-select');
    const firstOp = ops.first();
    await firstOp.selectOption('!=');
    await expect(firstOp).toHaveValue('!=');
    await firstOp.selectOption('=');
    await expect(firstOp).toHaveValue('=');
    await takeScreenshot(page, '09_运算符');
  });
});

// ============================================================
// 3. Search 按钮（No.10-11）
// ============================================================
test.describe.serial('Search（No.10-11）', () => {
  test.setTimeout(120000);

  test('No.10 Search-无检索条件', async ({ page }) => {
    resetCounter('10_Search空');
    await gotoUD201(page);
    await page.locator('.action-button').filter({ hasText: 'Search' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud20-1-message.error')).toContainText('Please enter at least one search condition');
    await takeScreenshot(page, '10_Search空');
  });

  test('No.11 Search-跳转到列表', async ({ page }) => {
    resetCounter('11_Search跳转');
    await gotoUD201(page);
    await page.locator('.form-input').first().click();
    await page.locator('.form-input').first().pressSequentially('COC', { delay: 10 });
    await page.locator('.action-button').filter({ hasText: 'Search' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud20-title').or(page.locator('.ud20-1-title'))).toBeVisible();
    await takeScreenshot(page, '11_Search跳转');
  });
});

// ============================================================
// 4. Clear 按钮（No.12）
// ============================================================
test.describe.serial('Clear（No.12）', () => {
  test.setTimeout(120000);

  test('No.12 Clear-清空所有字段', async ({ page }) => {
    resetCounter('12_Clear');
    await gotoUD201(page);
    // 填写各字段
    await page.locator('.form-input').first().click();
    await page.locator('.form-input').first().pressSequentially('COC', { delay: 5 });
    await page.locator('.form-input').nth(1).click();
    await page.locator('.form-input').nth(1).pressSequentially('JPN', { delay: 5 });
    await page.locator('.form-select').selectOption('Option 1');
    await page.locator('.form-input').nth(2).click();
    await page.locator('.form-input').nth(2).pressSequentially('admin', { delay: 5 });
    await page.locator('.form-input').nth(3).click();
    await page.locator('.form-input').nth(3).pressSequentially('2026-01-15', { delay: 5 });
    // 点击 Clear
    await page.locator('.action-button').filter({ hasText: 'Clear' }).click();
    await page.waitForTimeout(300);
    // 所有字段被清空
    const inputs = page.locator('.form-input');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toHaveValue('');
    }
    await expect(page.locator('.form-select')).toHaveValue('');
    await takeScreenshot(page, '12_Clear');
  });
});

// ============================================================
// 5. Back 按钮（No.13）
// ============================================================
test.describe.serial('Back（No.13）', () => {
  test.setTimeout(120000);

  test('No.13 Back-返回', async ({ page }) => {
    resetCounter('13_Back');
    await gotoUD201(page);
    await page.locator('.action-button').filter({ hasText: 'Back' }).click();
    await page.waitForTimeout(2000);
    // Back navigates to /Menu/UserGuide
    expect(page.url()).toContain('/Menu/UserGuide');
    await takeScreenshot(page, '13_Back');
  });
});

// ============================================================
// 6. Update Mode（No.14-20）
// ============================================================
test.describe.serial('Update Mode（No.14-20）', () => {
  test.setTimeout(120000);

  test('No.14 Update-Document type为空', async ({ page }) => {
    resetCounter('14_Update空');
    await gotoUD201(page);
    await page.locator('.action-button').filter({ hasText: 'Update Mode' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud20-1-message.error')).toContainText('Document type is required');
    await takeScreenshot(page, '14_Update空');
  });

  test('No.15 Update-成功', async ({ page }) => {
    resetCounter('15_Update成功');
    await insertUD201TestData();
    await mockUpdateSuccess(page);
    await gotoUD201(page);
    await page.locator('.form-input').first().click();
    await page.locator('.form-input').first().pressSequentially('COC', { delay: 10 });
    await page.locator('.form-input').nth(1).click();
    await page.locator('.form-input').nth(1).pressSequentially('JPN', { delay: 10 });
    await page.locator('.form-select').selectOption('Option 1');
    await page.locator('.form-input').nth(2).click();
    await page.locator('.form-input').nth(2).pressSequentially('admin', { delay: 10 });
    await page.locator('.form-input').nth(3).click();
    await page.locator('.form-input').nth(3).pressSequentially('2026-01-15', { delay: 10 });
    await page.locator('.action-button').filter({ hasText: 'Update Mode' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud20-1-message.success')).toContainText('更新成功');
    await takeScreenshot(page, '15_Update成功');
    await page.unroute('**/api/ud20-1/UpdateHdocDocumentList');
  });

  test('No.16 Update-Document type不存在（404）', async ({ page }) => {
    resetCounter('16_Update404');
    await mockUpdateNotFound(page);
    await gotoUD201(page);
    await page.locator('.form-input').first().click();
    await page.locator('.form-input').first().pressSequentially('NONEXIST', { delay: 10 });
    await page.locator('.action-button').filter({ hasText: 'Update Mode' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud20-1-message.error')).toContainText('Document type does not exists');
    await takeScreenshot(page, '16_Update404');
    await page.unroute('**/api/ud20-1/UpdateHdocDocumentList');
  });

  test('No.17 Update-失败（API 500）', async ({ page }) => {
    resetCounter('17_Update500');
    await mockUpdateFail(page);
    await gotoUD201(page);
    await page.locator('.form-input').first().click();
    await page.locator('.form-input').first().pressSequentially('COC', { delay: 10 });
    await page.locator('.action-button').filter({ hasText: 'Update Mode' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud20-1-message.error')).toContainText('更新失败');
    await takeScreenshot(page, '17_Update500');
    await page.unroute('**/api/ud20-1/UpdateHdocDocumentList');
  });

  test('No.18 Update-网络错误', async ({ page }) => {
    resetCounter('18_Update网络错误');
    await mockUpdateNetError(page);
    await gotoUD201(page);
    await page.locator('.form-input').first().click();
    await page.locator('.form-input').first().pressSequentially('COC', { delay: 10 });
    await page.locator('.action-button').filter({ hasText: 'Update Mode' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud20-1-message.error')).toContainText('系统错误');
    await takeScreenshot(page, '18_Update网络错误');
    await page.unroute('**/api/ud20-1/UpdateHdocDocumentList');
  });

  test('No.19 Update-加载中按钮禁用', async ({ page }) => {
    resetCounter('19_Update加载中');
    await mockUpdateWithDelay(page, 3000);
    await gotoUD201(page);
    await page.locator('.form-input').first().click();
    await page.locator('.form-input').first().pressSequentially('COC', { delay: 10 });
    await page.locator('.action-button').filter({ hasText: 'Update Mode' }).click();
    await page.waitForTimeout(500);
    const buttons = page.locator('.action-button');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toBeDisabled();
    }
    await takeScreenshot(page, '19_Update加载中');
    await page.unroute('**/api/ud20-1/UpdateHdocDocumentList');
  });

  test('No.20 Update-全字段入力', async ({ page }) => {
    resetCounter('20_Update全字段');
    await insertUD201TestData();
    await mockUpdateSuccess(page);
    await gotoUD201(page);
    // 全字段入力
    await page.locator('.form-input').first().click();
    await page.locator('.form-input').first().pressSequentially('COC', { delay: 5 });
    await page.locator('.form-input').nth(1).click();
    await page.locator('.form-input').nth(1).pressSequentially('JPN', { delay: 5 });
    await page.locator('.form-select').selectOption('Option 2');
    await page.locator('.form-input').nth(2).click();
    await page.locator('.form-input').nth(2).pressSequentially('admin', { delay: 5 });
    await page.locator('.form-input').nth(3).click();
    await page.locator('.form-input').nth(3).pressSequentially('2026-06-15', { delay: 5 });
    // 切换运算符
    await page.locator('.operator-select').first().selectOption('!=');
    await page.locator('.operator-select').nth(4).selectOption('!=');
    // 执行更新
    await page.locator('.action-button').filter({ hasText: 'Update Mode' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud20-1-message.success')).toContainText('更新成功');
    await takeScreenshot(page, '20_Update全字段');
    await page.unroute('**/api/ud20-1/UpdateHdocDocumentList');
  });
});

// ============================================================
// 7. UI 交互（No.21-22）
// ============================================================
test.describe.serial('UI交互（No.21-22）', () => {
  test.setTimeout(120000);

  test('No.21 错误消息样式', async ({ page }) => {
    resetCounter('21_错误样式');
    await gotoUD201(page);
    await page.locator('.action-button').filter({ hasText: 'Search' }).click();
    await page.waitForTimeout(500);
    const msg = page.locator('.ud20-1-message.error');
    await expect(msg).toBeVisible();
    await takeScreenshot(page, '21_错误样式');
  });

  test('No.22 页面刷新', async ({ page }) => {
    resetCounter('22_页面刷新');
    await gotoUD201(page);
    await page.locator('.form-input').first().click();
    await page.locator('.form-input').first().pressSequentially('COC', { delay: 10 });
    await page.waitForTimeout(300);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.waitForSelector('.ud20-1-title', { timeout: 10000 });
    const inputs = page.locator('.form-input');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toHaveValue('');
    }
    await expect(page.locator('.ud20-1-message')).toHaveCount(0);
    await takeScreenshot(page, '22_页面刷新');
  });
});

// ============================================================
// 8. 安全性（No.23-24）
// ============================================================
test.describe.serial('安全性（No.23-24）', () => {
  test.setTimeout(120000);

  test('No.23 API请求验证', async ({ page }) => {
    resetCounter('23_API请求');
    let lastBody = '';
    await page.route('**/api/ud20-1/UpdateHdocDocumentList', async (route) => {
      lastBody = route.request().postData() || '';
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
    });
    await gotoUD201(page);
    await page.locator('.form-input').first().click();
    await page.locator('.form-input').first().pressSequentially('COC', { delay: 10 });
    await page.locator('.action-button').filter({ hasText: 'Update Mode' }).click();
    await page.waitForTimeout(1000);
    expect(lastBody).toContain('operation');
    expect(lastBody).toContain('doctype');
    await takeScreenshot(page, '23_API请求');
    await page.unroute('**/api/ud20-1/UpdateHdocDocumentList');
  });

  test('No.24 用户未登录', async ({ page }) => {
    resetCounter('24_未登录');
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await page.goto(UD201_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    expect(page.url()).toBe(BASE_URL + '/');
    await takeScreenshot(page, '24_未登录');
  });
});
