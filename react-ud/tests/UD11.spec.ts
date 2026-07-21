import { test, expect, Page } from '@playwright/test';
import { insertUD10TestData, cleanupUD10TestData } from './test-data-helper';

// ============================================================
// ExistingHDocVariablesResultList 模块 (UD11) Playwright 自动化测试
// 基于 単体テスト仕様書UD11.md（30个测试用例）
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD11';
const UD10_URL = `${BASE_URL}/Menu/ExistingHDocVariables`;
const UD11_URL = `${BASE_URL}/Menu/ExistingHDocVariables/Search`;

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

/** 从 UD10 搜索跳转到 UD11 页面 */
async function searchFromUD10(page: Page, conditions: Record<string, string>) {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  await page.goto(UD10_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.waitForSelector('.existing-hdoc-title', { timeout: 10000 });

  // 填写搜索条件
  if (conditions.variable !== undefined) {
    const input = page.locator('.existing-hdoc-form-row').filter({ hasText: 'Variable' }).locator('.existing-hdoc-input');
    await input.click();
    await input.fill('');
    await input.pressSequentially(conditions.variable, { delay: 20 });
  }
  if (conditions.type !== undefined) {
    await page.locator('.existing-hdoc-select').selectOption(conditions.type);
  }
  if (conditions.description !== undefined) {
    const input = page.locator('.existing-hdoc-form-row').filter({ hasText: 'Description' }).locator('.existing-hdoc-input');
    await input.click();
    await input.fill('');
    await input.pressSequentially(conditions.description, { delay: 20 });
  }
  if (conditions.userid !== undefined) {
    const input = page.locator('.existing-hdoc-form-row').filter({ hasText: 'Created by user' }).locator('.existing-hdoc-input');
    await input.click();
    await input.fill('');
    await input.pressSequentially(conditions.userid, { delay: 20 });
  }
  if (conditions.registerDatetime !== undefined) {
    const input = page.locator('.existing-hdoc-form-row').filter({ hasText: 'Date' }).locator('.existing-hdoc-input');
    await input.click();
    await input.fill('');
    await input.pressSequentially(conditions.registerDatetime, { delay: 20 });
  }
  // 设置运算符
  if (conditions.variableOp) {
    await page.locator('.existing-hdoc-operator-select').first().selectOption(conditions.variableOp);
  }

  // 点击 Search
  await page.locator('.existing-hdoc-btn').filter({ hasText: 'Search' }).click();
  await page.waitForTimeout(2000);
}

/** 直接跳转到 UD11 页面（用于异常场景，需先 Mock API） */
async function gotoUD11Direct(page: Page, searchState: Record<string, string> = {}) {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  // 设置 location.state 通过 replaceState
  await page.goto(UD11_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(500);
  await page.evaluate((state) => {
    window.history.replaceState(state, '', '/Menu/ExistingHDocVariables/Search');
  }, searchState);
  // 重新加载页面让 React 读取新的 state
  await page.goto(UD11_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
}

/** Mock UD11 Search API */
async function mockSearchApi(page: Page, data: any[], delay: number = 0) {
  await page.route('**/api/ud11/search', async (route) => {
    if (delay > 0) await new Promise(r => setTimeout(r, delay));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data }) });
  });
}

/** Mock UD11 Search API failure (500) */
async function mockSearchApiFail(page: Page) {
  await page.route('**/api/ud11/search', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500, message: 'Error', data: null }) });
  });
}

/** Mock UD11 Search API timeout */
async function mockSearchApiTimeout(page: Page) {
  await page.route('**/api/ud11/search', () => new Promise(() => {}));
}

/** Mock UD11 Search API invalid JSON */
async function mockSearchApiInvalidJson(page: Page) {
  await page.route('**/api/ud11/search', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: 'invalid json' });
  });
}

async function fillUD10Input(page: Page, label: string, value: string) {
  const input = page.locator('.existing-hdoc-form-row').filter({ hasText: label }).locator('.existing-hdoc-input');
  await input.click();
  await input.fill('');
  await input.pressSequentially(value, { delay: 20 });
}

// ============================================================
test.beforeAll(async () => {
  await insertUD10TestData();
  console.log('UD11 test data (UD10 records) inserted');
});

test.afterAll(async () => {
  await cleanupUD10TestData();
  console.log('UD11 test data cleaned up');
});

// ============================================================
// 1. 画面初始化（No.1-6）
// ============================================================
test.describe.serial('画面初始化（No.1-6）', () => {
  test.setTimeout(180000);

  test('No.1 页面标题显示', async ({ page }) => {
    resetCounter('01_页面标题');
    await searchFromUD10(page, { variable: 'VAR001' });
    await page.waitForSelector('.ud11-title', { timeout: 10000 });
    await expect(page.locator('.ud11-title')).toContainText('Existing HDoc Variables');
    await takeScreenshot(page, '01_页面标题');
  });

  test('No.2 页面初始化-搜索条件从State接收', async ({ page }) => {
    resetCounter('02_搜索条件State');
    let requestBody = '';
    await page.route('**/api/ud11/search', async (route) => {
      requestBody = route.request().postData() || '';
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: [] }) });
    });
    await searchFromUD10(page, {
      variable: 'VAR001', type: 'VDA', description: 'Test', userid: 'admin', registerDatetime: '2026-07-16'
    });
    await page.waitForTimeout(2000);
    expect(requestBody).toContain('VAR001');
    expect(requestBody).toContain('VDA');
    expect(requestBody).toContain('Test');
    expect(requestBody).toContain('admin');
    expect(requestBody).toContain('2026-07-16');
    await takeScreenshot(page, '02_搜索条件State');
    await page.unroute('**/api/ud11/search');
  });

  test('No.3 画面初始化-Count Label显示', async ({ page }) => {
    resetCounter('03_Count显示');
    await mockSearchApi(page, [
      { variable: 'VAR001', type: 'VDA', description: 'Test Variable 001', registerUser: 'admin', registerDatetime: '2026-07-16T10:30:00' },
      { variable: 'VAR002', type: 'VDA', description: 'Test Variable 002', registerUser: 'admin', registerDatetime: '2026-07-16T10:30:00' },
      { variable: 'VAR003', type: 'User Defined', description: 'User defined test variable', registerUser: 'operator', registerDatetime: '2026-02-01T09:00:00' },
    ]);
    await searchFromUD10(page, { variable: 'VAR' });
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud11-count')).toContainText('3');
    await takeScreenshot(page, '03_Count显示');
    await page.unroute('**/api/ud11/search');
  });

  test('No.4 画面初始化-Count Label-0条记录', async ({ page }) => {
    resetCounter('04_Count零');
    await mockSearchApi(page, []);
    await searchFromUD10(page, { variable: 'NONEXISTENT' });
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud11-count')).toContainText('0');
    await expect(page.locator('.ud11-empty')).toContainText('No data found');
    await takeScreenshot(page, '04_Count零');
    await page.unroute('**/api/ud11/search');
  });

  test('No.5 画面初始化-DataTable列标题', async ({ page }) => {
    resetCounter('05_列标题');
    await mockSearchApi(page, [
      { variable: 'VAR001', type: 'VDA', description: 'Test', registerUser: 'admin', registerDatetime: '2026-07-16T10:30:00' },
    ]);
    await searchFromUD10(page, { variable: 'VAR001' });
    await page.waitForTimeout(2000);
    const headers = page.locator('.ud11-table th');
    // th[0] is radio indicator column
    await expect(headers.nth(1)).toContainText('Variable');
    await expect(headers.nth(2)).toContainText('Type');
    await expect(headers.nth(3)).toContainText('Description');
    await expect(headers.nth(4)).toContainText('Created by user');
    await expect(headers.nth(5)).toContainText('Date');
    await takeScreenshot(page, '05_列标题');
    await page.unroute('**/api/ud11/search');
  });

  test('No.6 画面初始化-按钮显示', async ({ page }) => {
    resetCounter('06_按钮显示');
    await mockSearchApi(page, [
      { variable: 'VAR001', type: 'VDA', description: 'Test', registerUser: 'admin', registerDatetime: '2026-07-16T10:30:00' },
    ]);
    await searchFromUD10(page, { variable: 'VAR001' });
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud11-btn').filter({ hasText: 'Select' })).toBeEnabled();
    await expect(page.locator('.ud11-btn').filter({ hasText: 'Down' })).toBeDisabled();
    await expect(page.locator('.ud11-btn').filter({ hasText: 'Back' })).toBeEnabled();
    await expect(page.locator('.ud11-btn').filter({ hasText: 'Print' })).toBeEnabled();
    await expect(page.locator('.ud11-btn').filter({ hasText: 'Excel' })).toBeEnabled();
    await takeScreenshot(page, '06_按钮显示');
    await page.unroute('**/api/ud11/search');
  });
});

// ============================================================
// 2. DataTable列显示（No.7-13）
// ============================================================
test.describe.serial('DataTable列显示（No.7-13）', () => {
  test.setTimeout(180000);

  const SAMPLE_RECORDS = [
    { variable: 'VAR001', type: 'VDA', description: 'Test variable description', registerUser: 'admin', registerDatetime: '2026-07-16T10:30:00' },
    { variable: 'VAR002', type: 'VDA', description: '', registerUser: 'operator', registerDatetime: '2026-01-16T10:30:00' },
    { variable: 'VAR003', type: 'User Defined', description: 'User defined test variable', registerUser: 'testuser', registerDatetime: '2026-02-01T09:00:00' },
  ];

  test('No.7 Variable列显示', async ({ page }) => {
    resetCounter('07_Variable列');
    await mockSearchApi(page, [SAMPLE_RECORDS[0]]);
    await searchFromUD10(page, { variable: 'VAR001' });
    await page.waitForTimeout(2000);
    const firstRow = page.locator('.ud11-table tbody tr').first();
    await expect(firstRow.locator('td').nth(1)).toContainText('VAR001');
    await takeScreenshot(page, '07_Variable列');
    await page.unroute('**/api/ud11/search');
  });

  test('No.8 Type列显示', async ({ page }) => {
    resetCounter('08_Type列');
    await mockSearchApi(page, [SAMPLE_RECORDS[0]]);
    await searchFromUD10(page, { variable: 'VAR001' });
    await page.waitForTimeout(2000);
    const firstRow = page.locator('.ud11-table tbody tr').first();
    await expect(firstRow.locator('td').nth(2)).toContainText('VDA');
    await takeScreenshot(page, '08_Type列');
    await page.unroute('**/api/ud11/search');
  });

  test('No.9 Description列显示', async ({ page }) => {
    resetCounter('09_Description列');
    await mockSearchApi(page, [SAMPLE_RECORDS[0]]);
    await searchFromUD10(page, { variable: 'VAR001' });
    await page.waitForTimeout(2000);
    const firstRow = page.locator('.ud11-table tbody tr').first();
    await expect(firstRow.locator('td').nth(3)).toContainText('Test variable description');
    await takeScreenshot(page, '09_Description列');
    await page.unroute('**/api/ud11/search');
  });

  test('No.10 Description列-空值', async ({ page }) => {
    resetCounter('10_Description空');
    await mockSearchApi(page, [SAMPLE_RECORDS[1]]);
    await searchFromUD10(page, { variable: 'VAR002' });
    await page.waitForTimeout(2000);
    const firstRow = page.locator('.ud11-table tbody tr').first();
    const descTd = firstRow.locator('td').nth(3);
    const text = await descTd.textContent();
    expect(text?.trim()).toBe('');
    await takeScreenshot(page, '10_Description空');
    await page.unroute('**/api/ud11/search');
  });

  test('No.11 Created by user列显示', async ({ page }) => {
    resetCounter('11_CreatedBy列');
    await mockSearchApi(page, [SAMPLE_RECORDS[0]]);
    await searchFromUD10(page, { variable: 'VAR001' });
    await page.waitForTimeout(2000);
    const firstRow = page.locator('.ud11-table tbody tr').first();
    await expect(firstRow.locator('.ud11-user-link')).toContainText('admin');
    await takeScreenshot(page, '11_CreatedBy列');
    await page.unroute('**/api/ud11/search');
  });

  test('No.12 Created by user列-不同用户', async ({ page }) => {
    resetCounter('12_CreatedBy多用户');
    await mockSearchApi(page, SAMPLE_RECORDS);
    await searchFromUD10(page, { variable: 'VAR' });
    await page.waitForTimeout(2000);
    const rows = page.locator('.ud11-table tbody tr');
    await expect(rows.nth(0).locator('.ud11-user-link')).toContainText('admin');
    await expect(rows.nth(1).locator('.ud11-user-link')).toContainText('operator');
    await expect(rows.nth(2).locator('.ud11-user-link')).toContainText('testuser');
    await takeScreenshot(page, '12_CreatedBy多用户');
    await page.unroute('**/api/ud11/search');
  });

  test('No.13 Date列显示', async ({ page }) => {
    resetCounter('13_Date列');
    await mockSearchApi(page, [SAMPLE_RECORDS[0]]);
    await searchFromUD10(page, { variable: 'VAR001' });
    await page.waitForTimeout(2000);
    const firstRow = page.locator('.ud11-table tbody tr').first();
    // Date should show YYYY-MM-DD (split at T)
    await expect(firstRow.locator('td').nth(5)).toContainText('2026-07-16');
    await takeScreenshot(page, '13_Date列');
    await page.unroute('**/api/ud11/search');
  });
});

// ============================================================
// 3. Radio选择（No.14-16）
// ============================================================
test.describe.serial('Radio选择（No.14-16）', () => {
  test.setTimeout(180000);

  const THREE_RECORDS = [
    { variable: 'VAR001', type: 'VDA', description: 'Test 1', registerUser: 'admin', registerDatetime: '2026-07-16T10:30:00' },
    { variable: 'VAR002', type: 'VDA', description: 'Test 2', registerUser: 'admin', registerDatetime: '2026-01-16T10:30:00' },
    { variable: 'VAR003', type: 'User Defined', description: 'Test 3', registerUser: 'operator', registerDatetime: '2026-02-01T09:00:00' },
  ];

  test('No.14 Radio行单选-选择一行', async ({ page }) => {
    resetCounter('14_Radio选择');
    await mockSearchApi(page, THREE_RECORDS);
    await searchFromUD10(page, { variable: 'VAR' });
    await page.waitForTimeout(2000);
    await page.locator('.ud11-table tbody tr').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud11-row-selected')).toBeVisible();
    await takeScreenshot(page, '14_Radio选择');
    await page.unroute('**/api/ud11/search');
  });

  test('No.15 Radio行单选-切换选择', async ({ page }) => {
    resetCounter('15_Radio切换');
    await mockSearchApi(page, THREE_RECORDS);
    await searchFromUD10(page, { variable: 'VAR' });
    await page.waitForTimeout(2000);
    const rows = page.locator('.ud11-table tbody tr');
    await rows.first().click();
    await page.waitForTimeout(300);
    await rows.nth(1).click();
    await page.waitForTimeout(300);
    expect(await page.locator('.ud11-row-selected').count()).toBe(1);
    await takeScreenshot(page, '15_Radio切换');
    await page.unroute('**/api/ud11/search');
  });

  test('No.16 Radio行单选-点击行触发', async ({ page }) => {
    resetCounter('16_点击行触发');
    await mockSearchApi(page, THREE_RECORDS);
    await searchFromUD10(page, { variable: 'VAR' });
    await page.waitForTimeout(2000);
    const thirdRow = page.locator('.ud11-table tbody tr').nth(2);
    // 点击数据区域（非 Radio 按钮）
    await thirdRow.locator('td').nth(2).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud11-row-selected')).toBeVisible();
    await takeScreenshot(page, '16_点击行触发');
    await page.unroute('**/api/ud11/search');
  });
});

// ============================================================
// 4. Select按钮（No.17-18）
// ============================================================
test.describe.serial('Select按钮（No.17-18）', () => {
  test.setTimeout(180000);

  test('No.17 Select操作-选中后点击返回UD10', async ({ page }) => {
    resetCounter('17_Select返回');
    await mockSearchApi(page, [
      { variable: 'VAR001', type: 'VDA', description: 'Test Variable 001', registerUser: 'admin', registerDatetime: '2026-07-16T10:30:00' },
    ]);
    await searchFromUD10(page, { variable: 'VAR001' });
    await page.waitForTimeout(2000);
    await page.locator('.ud11-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.locator('.ud11-btn').filter({ hasText: 'Select' }).click();
    await page.waitForTimeout(2000);
    // 确认返回 UD10 页面
    await expect(page.locator('.existing-hdoc-title')).toBeVisible();
    // 确认数据被填充到 UD10 输入框
    await expect(page.locator('.existing-hdoc-input').first()).toHaveValue('VAR001');
    await expect(page.locator('.existing-hdoc-select')).toHaveValue('VDA');
    await takeScreenshot(page, '17_Select返回');
    await page.unroute('**/api/ud11/search');
  });

  test('No.18 Select操作-未选中记录时点击', async ({ page }) => {
    resetCounter('18_Select未选中');
    await mockSearchApi(page, [
      { variable: 'VAR001', type: 'VDA', description: 'Test', registerUser: 'admin', registerDatetime: '2026-07-16T10:30:00' },
      { variable: 'VAR002', type: 'VDA', description: 'Test 2', registerUser: 'admin', registerDatetime: '2026-01-16T10:30:00' },
    ]);
    await searchFromUD10(page, { variable: 'VAR' });
    await page.waitForTimeout(2000);
    await page.locator('.ud11-btn').filter({ hasText: 'Select' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud11-message.error')).toContainText('Please select a record');
    await takeScreenshot(page, '18_Select未选中');
    await page.unroute('**/api/ud11/search');
  });
});

// ============================================================
// 5. Back按钮（No.19-20）
// ============================================================
test.describe.serial('Back按钮（No.19-20）', () => {
  test.setTimeout(180000);

  test('No.19 Back操作-返回UD10保留搜索条件', async ({ page }) => {
    resetCounter('19_Back返回保留条件');
    await mockSearchApi(page, [
      { variable: 'VAR001', type: 'VDA', description: 'Test', registerUser: 'admin', registerDatetime: '2026-07-16T10:30:00' },
    ]);
    await searchFromUD10(page, { variable: 'VAR001', type: 'VDA' });
    await page.waitForTimeout(2000);
    await page.locator('.ud11-btn').filter({ hasText: 'Back' }).click();
    await page.waitForTimeout(2000);
    // 确认返回 UD10
    await expect(page.locator('.existing-hdoc-title')).toBeVisible();
    // 搜索条件应被恢复
    await expect(page.locator('.existing-hdoc-input').first()).toHaveValue('VAR001');
    await expect(page.locator('.existing-hdoc-select')).toHaveValue('VDA');
    await takeScreenshot(page, '19_Back返回保留条件');
    await page.unroute('**/api/ud11/search');
  });

  test('No.20 Back操作-带运算符返回', async ({ page }) => {
    resetCounter('20_Back带运算符');
    await mockSearchApi(page, [
      { variable: 'VAR001', type: 'VDA', description: 'Test', registerUser: 'admin', registerDatetime: '2026-07-16T10:30:00' },
    ]);
    await searchFromUD10(page, { variable: 'VAR001', variableOp: '!=' });
    await page.waitForTimeout(2000);
    await page.locator('.ud11-btn').filter({ hasText: 'Back' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.existing-hdoc-title')).toBeVisible();
    // 运算符应恢复为 !=
    await expect(page.locator('.existing-hdoc-operator-select').first()).toHaveValue('!=');
    await takeScreenshot(page, '20_Back带运算符');
    await page.unroute('**/api/ud11/search');
  });
});

// ============================================================
// 6. Print按钮（No.21）
// ============================================================
test.describe.serial('Print按钮（No.21）', () => {
  test.setTimeout(180000);

  test('No.21 Print操作-打印页面', async ({ page }) => {
    resetCounter('21_Print打印');
    await mockSearchApi(page, [
      { variable: 'VAR001', type: 'VDA', description: 'Test', registerUser: 'admin', registerDatetime: '2026-07-16T10:30:00' },
    ]);
    await searchFromUD10(page, { variable: 'VAR001' });
    await page.waitForTimeout(2000);
    let printCalled = false;
    await page.evaluate(() => { window.print = () => { (window as any).__printCalled = true; }; });
    await page.locator('.ud11-btn').filter({ hasText: 'Print' }).click();
    await page.waitForTimeout(500);
    const wasCalled = await page.evaluate(() => (window as any).__printCalled === true);
    expect(wasCalled).toBe(true);
    await takeScreenshot(page, '21_Print打印');
    await page.unroute('**/api/ud11/search');
  });
});

// ============================================================
// 7. Excel按钮（No.22-23）
// ============================================================
test.describe.serial('Excel按钮（No.22-23）', () => {
  test.setTimeout(180000);

  test('No.22 Excel操作-CSV导出', async ({ page }) => {
    resetCounter('22_Excel导出');
    await mockSearchApi(page, [
      { variable: 'VAR001', type: 'VDA', description: 'Test 1', registerUser: 'admin', registerDatetime: '2026-07-16T10:30:00' },
      { variable: 'VAR002', type: 'VDA', description: 'Test 2', registerUser: 'admin', registerDatetime: '2026-01-16T10:30:00' },
      { variable: 'VAR003', type: 'User Defined', description: 'Test 3', registerUser: 'operator', registerDatetime: '2026-02-01T09:00:00' },
    ]);
    await searchFromUD10(page, { variable: 'VAR' });
    await page.waitForTimeout(2000);
    let downloadTriggered = false;
    page.on('download', () => { downloadTriggered = true; });
    await page.locator('.ud11-btn').filter({ hasText: 'Excel' }).click();
    await page.waitForTimeout(2000);
    expect(downloadTriggered).toBe(true);
    await takeScreenshot(page, '22_Excel导出');
    await page.unroute('**/api/ud11/search');
  });

  test('No.23 Excel操作-空数据导出', async ({ page }) => {
    resetCounter('23_Excel空数据');
    await mockSearchApi(page, []);
    await searchFromUD10(page, { variable: 'NONEXISTENT' });
    await page.waitForTimeout(2000);
    let downloadTriggered = false;
    page.on('download', () => { downloadTriggered = true; });
    await page.locator('.ud11-btn').filter({ hasText: 'Excel' }).click();
    await page.waitForTimeout(2000);
    // 空数据时显示警告消息，不触发下载
    await expect(page.locator('.ud11-message.warning')).toContainText('No data to export');
    expect(downloadTriggered).toBe(false);
    await takeScreenshot(page, '23_Excel空数据');
    await page.unroute('**/api/ud11/search');
  });
});

// ============================================================
// 8. Down按钮（No.24）
// ============================================================
test.describe.serial('Down按钮（No.24）', () => {
  test.setTimeout(180000);

  test('No.24 Down按钮-非活性状态', async ({ page }) => {
    resetCounter('24_Down禁用');
    await mockSearchApi(page, [
      { variable: 'VAR001', type: 'VDA', description: 'Test', registerUser: 'admin', registerDatetime: '2026-07-16T10:30:00' },
    ]);
    await searchFromUD10(page, { variable: 'VAR001' });
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud11-btn').filter({ hasText: 'Down' })).toBeDisabled();
    // 点击无反应
    await page.locator('.ud11-btn').filter({ hasText: 'Down' }).click({ force: true });
    await page.waitForTimeout(500);
    // 页面应保持不变
    await expect(page.locator('.ud11-title')).toBeVisible();
    await takeScreenshot(page, '24_Down禁用');
    await page.unroute('**/api/ud11/search');
  });
});

// ============================================================
// 9. Created by user链接（No.25）
// ============================================================
test.describe.serial('Created by user链接（No.25）', () => {
  test.setTimeout(180000);

  test('No.25 Created by user链接-跳转UD25', async ({ page }) => {
    resetCounter('25_用户链接跳转');
    await mockSearchApi(page, [
      { variable: 'VAR001', type: 'VDA', description: 'Test', registerUser: 'admin', registerDatetime: '2026-07-16T10:30:00' },
    ]);
    await searchFromUD10(page, { variable: 'VAR001' });
    await page.waitForTimeout(2000);
    await page.locator('.ud11-user-link').first().click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/EDBUserView');
    await takeScreenshot(page, '25_用户链接跳转');
    await page.unroute('**/api/ud11/search');
  });
});

// ============================================================
// 10. 异常处理（No.26-29）
// ============================================================
test.describe.serial('异常处理（No.26-29）', () => {
  test.setTimeout(180000);

  test('No.26 异常处理-API返回500', async ({ page }) => {
    resetCounter('26_API500');
    await mockSearchApiFail(page);
    await searchFromUD10(page, { variable: 'VAR001' });
    await page.waitForTimeout(3000);
    await expect(page.locator('.ud11-message.error')).toContainText('System error');
    await expect(page.locator('.ud11-count')).toContainText('0');
    await takeScreenshot(page, '26_API500');
    await page.unroute('**/api/ud11/search');
  });

  test('No.27 异常处理-JSON解析失败', async ({ page }) => {
    resetCounter('27_JSON解析失败');
    await mockSearchApiInvalidJson(page);
    await searchFromUD10(page, { variable: 'VAR001' });
    await page.waitForTimeout(3000);
    await expect(page.locator('.ud11-message.error')).toContainText('System error');
    await expect(page.locator('.ud11-count')).toContainText('0');
    await takeScreenshot(page, '27_JSON解析失败');
    await page.unroute('**/api/ud11/search');
  });

  test('No.28 异常处理-API超时', async ({ page }) => {
    resetCounter('28_API超时');
    await mockSearchApiTimeout(page);
    await searchFromUD10(page, { variable: 'VAR001' });
    await page.waitForTimeout(15000);
    await expect(page.locator('.ud11-message.error')).toContainText('System error');
    await expect(page.locator('.ud11-count')).toContainText('0');
    await takeScreenshot(page, '28_API超时');
    await page.unroute('**/api/ud11/search');
  });

  test('No.29 异常处理-网络断开', async ({ page }) => {
    resetCounter('29_网络断开');
    await page.route('**/api/ud11/search', (route) => route.abort('connectionrefused'));
    await searchFromUD10(page, { variable: 'VAR001' });
    await page.waitForTimeout(3000);
    await expect(page.locator('.ud11-message.error')).toContainText('System error');
    await expect(page.locator('.ud11-count')).toContainText('0');
    await takeScreenshot(page, '29_网络断开');
    await page.unroute('**/api/ud11/search');
  });
});

// ============================================================
// 11. 画面迁移综合（No.30）
// ============================================================
test.describe.serial('画面迁移综合（No.30）', () => {
  test.setTimeout(180000);

  test('No.30 画面迁移-Search→Select返回→再Search', async ({ page }) => {
    resetCounter('30_连续迁移');
    // 第一次 Search
    await mockSearchApi(page, [
      { variable: 'VAR001', type: 'VDA', description: 'Test Variable 001', registerUser: 'admin', registerDatetime: '2026-07-16T10:30:00' },
    ]);
    await searchFromUD10(page, { variable: 'VAR001' });
    await page.waitForTimeout(2000);
    // Select 返回
    await page.locator('.ud11-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.locator('.ud11-btn').filter({ hasText: 'Select' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.existing-hdoc-title')).toBeVisible();
    await expect(page.locator('.existing-hdoc-input').first()).toHaveValue('VAR001');
    // 再次 Search
    await page.unroute('**/api/ud11/search');
    await mockSearchApi(page, [
      { variable: 'VAR001', type: 'VDA', description: 'Test', registerUser: 'admin', registerDatetime: '2026-07-16T10:30:00' },
    ]);
    await page.locator('.existing-hdoc-btn').filter({ hasText: 'Search' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud11-title')).toBeVisible();
    await takeScreenshot(page, '30_连续迁移');
    await page.unroute('**/api/ud11/search');
  });
});
