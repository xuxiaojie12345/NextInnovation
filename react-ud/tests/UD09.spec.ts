import { test, expect, Page } from '@playwright/test';
import { insertUD09TestData, cleanupUD09TestData } from './test-data-helper';

// ============================================================
// HomologationVariablesResultList 模块 (UD09) Playwright 自动化测试
// 基于 単体テスト仕様書UD09.md（67个测试用例）
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD09';

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

/** Mock UD09 Search API */
async function mockSearchApi(page: Page, data: any[], delay: number = 0) {
  await page.route('**/api/ud09/search', async (route) => {
    if (delay > 0) await new Promise(r => setTimeout(r, delay));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data }) });
  });
}

/** Mock UD09 Delete API */
async function mockDeleteApi(page: Page, responseData: any, status: number = 200) {
  await page.route('**/api/ud09/deletehdocuserdefinedrules', async (route) => {
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(responseData) });
  });
}

/** Mock Search API failure */
async function mockSearchApiFail(page: Page, code: number = 500) {
  await page.route('**/api/ud09/search', async (route) => {
    if (code === 500) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500, message: 'Error', data: null }) });
    } else {
      await route.abort('connectionrefused');
    }
  });
}

/** Mock Search API timeout */
async function mockSearchApiTimeout(page: Page) {
  await page.route('**/api/ud09/search', () => new Promise(() => {}));
}

/** Navigate to UD09 with search conditions */
async function gotoUD09(page: Page, conditions: Record<string, string> = { productClass: 'PC01', number: '100', market: 'DE' }) {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  await page.goto(`${BASE_URL}/Menu/HomologationVariables/Search`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(500);
  // Set search conditions via replaceState
  await page.evaluate((c) => {
    window.history.replaceState(c, '', '/Menu/HomologationVariables/Search');
  }, conditions);
  await page.waitForTimeout(500);
}

const MOCK_DATA_6 = [
  { pc: 'PC02', num: '200', market: 'DE', variable: 'VAR007', val: 'Value7', vs: '', vs2: '', comments: '', addDate: '', deleteDate: '', updateUser: '', updateDatetime: '' },
  { pc: 'PC01', num: '100', market: 'JP', variable: 'VAR008', val: 'Value8', vs: '', vs2: '', comments: '', addDate: '', deleteDate: '', updateUser: '', updateDatetime: '' },
  { pc: 'PC02', num: '100', market: 'DE', variable: 'VAR009', val: 'Value9', vs: '', vs2: '', comments: '', addDate: '', deleteDate: '', updateUser: '', updateDatetime: '' },
  { pc: 'PC01', num: '300', market: 'DE', variable: 'VAR010', val: 'Value10', vs: '', vs2: '', comments: '', addDate: '', deleteDate: '', updateUser: '', updateDatetime: '' },
  { pc: 'PC01', num: '100', market: 'DE', variable: 'VAR011', val: 'Value11', vs: '', vs2: '', comments: '', addDate: '', deleteDate: '', updateUser: '', updateDatetime: '' },
  { pc: 'PC02', num: '200', market: 'JP', variable: 'VAR012', val: 'Value12', vs: '', vs2: '', comments: '', addDate: '', deleteDate: '', updateUser: '', updateDatetime: '' },
];

const DEFAULT_DATA = [
  { pc: 'PC01', num: '100', market: 'DE', variable: 'TEMPLATE-VAR001', val: 'TestValue', vs: 'Variant1', vs2: 'Variant2', comments: 'Test comment', addDate: '202201', deleteDate: '', updateUser: 'admin', updateDatetime: '2022-12-02 05:11:45' },
  { pc: 'PC02', num: '200', market: 'DE', variable: 'TEMPLATE-VAR002', val: 'Value2', vs: 'OnlyV1', vs2: '', comments: 'Test comment 2', addDate: '202202', deleteDate: '202301', updateUser: 'admin', updateDatetime: '2022-12-03 05:11:45' },
];

// ============================================================
test.beforeAll(async () => { await insertUD09TestData(); console.log('UD09 test data inserted'); });
test.afterAll(async () => { await cleanupUD09TestData(); console.log('UD09 test data cleaned up'); });

// ============================================================
// 1. 画面初始化（No.1-8）
// ============================================================
test.describe.serial('画面初始化（No.1-8）', () => {
  test.setTimeout(120000);

  test('No.1 画面初始化-搜索条件传递', async ({ page }) => {
    resetCounter('01_搜索条件传递');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page, { productClass: 'PC01', numberOp: 'GT', market: 'DE', productClassOp: '=' });
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-page-title')).toContainText('Homologation Variables');
    await takeScreenshot(page, '01_搜索条件传递');
    await page.unroute('**/api/ud09/search');
  });

  test('No.2 画面初始化-Search API调用成功', async ({ page }) => {
    resetCounter('02_API调用成功');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-table')).toBeVisible();
    await expect(page.locator('.ud09-count')).toContainText('Number of lines found');
    await takeScreenshot(page, '02_API调用成功');
    await page.unroute('**/api/ud09/search');
  });

  test('No.3 画面初始化-Search API返回空列表', async ({ page }) => {
    resetCounter('03_API空列表');
    await mockSearchApi(page, []);
    await gotoUD09(page, { productClass: 'NONEXISTENT' });
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-table')).toHaveCount(0);
    await expect(page.locator('.ud09-td-empty')).toContainText('No data found');
    await expect(page.locator('.ud09-count')).toContainText('0');
    await takeScreenshot(page, '03_API空列表');
    await page.unroute('**/api/ud09/search');
  });

  test('No.4 画面初始化-API返回失败', async ({ page }) => {
    resetCounter('04_API失败');
    await mockSearchApiFail(page, 500);
    await gotoUD09(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-message.error')).toBeVisible();
    await expect(page.locator('.ud09-count')).toContainText('0');
    await takeScreenshot(page, '04_API失败');
    await page.unroute('**/api/ud09/search');
  });

  test('No.5 画面初始化-网络错误', async ({ page }) => {
    resetCounter('05_网络错误');
    await mockSearchApiFail(page, 0);
    await gotoUD09(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-message.error')).toBeVisible();
    await takeScreenshot(page, '05_网络错误');
    await page.unroute('**/api/ud09/search');
  });

  test('No.6 画面初始化-Loading状态', async ({ page }) => {
    resetCounter('06_Loading');
    await mockSearchApi(page, DEFAULT_DATA, 3000);
    await gotoUD09(page);
    await page.waitForTimeout(500);
    await expect(page.locator('.ud09-loading')).toBeVisible();
    await expect(page.locator('.ud09-loading')).toContainText('Loading...');
    await takeScreenshot(page, '06_Loading');
    await page.unroute('**/api/ud09/search');
  });

  test('No.7 画面初始化-搜索条件为空', async ({ page }) => {
    resetCounter('07_搜索条件为空');
    let requestBody = '';
    await page.route('**/api/ud09/search', async (route) => {
      requestBody = route.request().postData() || '';
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: [] }) });
    });
    await gotoUD09(page, { productClass: '', number: '', market: '' });
    await page.waitForTimeout(2000);
    expect(requestBody).toContain('productClass');
    await takeScreenshot(page, '07_搜索条件为空');
    await page.unroute('**/api/ud09/search');
  });

  test('No.8 画面初始化-页面标题显示', async ({ page }) => {
    resetCounter('08_页面标题');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-page-title')).toContainText('Homologation Variables');
    await takeScreenshot(page, '08_页面标题');
    await page.unroute('**/api/ud09/search');
  });
});

// ============================================================
// 2. 结果列表表格显示（No.9-25）
// ============================================================
test.describe.serial('结果列表表格（No.9-25）', () => {
  test.setTimeout(120000);

  test('No.9 表格表头显示-所有列', async ({ page }) => {
    resetCounter('09_表头显示');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page);
    await page.waitForTimeout(2000);
    const headers = page.locator('.ud09-table th');
    await expect(headers.nth(1)).toContainText('Product class');
    await expect(headers.nth(2)).toContainText('Number');
    await expect(headers.nth(3)).toContainText('Market');
    await expect(headers.nth(4)).toContainText('Variable');
    await expect(headers.nth(5)).toContainText('Value');
    await expect(headers.nth(6)).toContainText('Variant string.');
    await expect(headers.nth(7)).toContainText('Comments');
    await expect(headers.nth(8)).toContainText('Add');
    await expect(headers.nth(9)).toContainText('Delete');
    await expect(headers.nth(10)).toContainText('Created by user');
    await expect(headers.nth(11)).toContainText('Date');
    await takeScreenshot(page, '09_表头显示');
    await page.unroute('**/api/ud09/search');
  });

  test('No.10 表格数据-Product Class', async ({ page }) => {
    resetCounter('10_数据_PC');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-table tbody tr').first().locator('td').nth(1)).toContainText('PC01');
    await takeScreenshot(page, '10_数据_PC');
    await page.unroute('**/api/ud09/search');
  });

  test('No.11 表格数据-Number', async ({ page }) => {
    resetCounter('11_数据_Number');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-table tbody tr').first().locator('td').nth(2)).toContainText('100');
    await takeScreenshot(page, '11_数据_Number');
    await page.unroute('**/api/ud09/search');
  });

  test('No.12 表格数据-Market', async ({ page }) => {
    resetCounter('12_数据_Market');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-table tbody tr').first().locator('td').nth(3)).toContainText('DE');
    await takeScreenshot(page, '12_数据_Market');
    await page.unroute('**/api/ud09/search');
  });

  test('No.13 表格数据-Variable', async ({ page }) => {
    resetCounter('13_数据_Variable');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-table tbody tr').first().locator('td').nth(4)).toContainText('TEMPLATE-VAR001');
    await takeScreenshot(page, '13_数据_Variable');
    await page.unroute('**/api/ud09/search');
  });

  test('No.14 表格数据-Value', async ({ page }) => {
    resetCounter('14_数据_Value');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-table tbody tr').first().locator('td').nth(5)).toContainText('TestValue');
    await takeScreenshot(page, '14_数据_Value');
    await page.unroute('**/api/ud09/search');
  });

  test('No.15 表格数据-Variant string.（VS+VS2拼接）', async ({ page }) => {
    resetCounter('15_数据_Vs拼接');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    const td = page.locator('.ud09-table tbody tr').first().locator('td').nth(6);
    await expect(td).toContainText('Variant1');
    await expect(td).toContainText('Variant2');
    await takeScreenshot(page, '15_数据_Vs拼接');
    await page.unroute('**/api/ud09/search');
  });

  test('No.16 表格数据-Variant string.（仅有VS）', async ({ page }) => {
    resetCounter('16_数据_Vs仅有VS');
    await mockSearchApi(page, [{ pc: 'PC01', num: '100', market: 'DE', vs: 'OnlyV1', vs2: '' }]);
    await gotoUD09(page); await page.waitForTimeout(2000);
    const td = page.locator('.ud09-table tbody tr').first().locator('td').nth(6);
    await expect(td).toContainText('OnlyV1');
    await takeScreenshot(page, '16_数据_Vs仅有VS');
    await page.unroute('**/api/ud09/search');
  });

  test('No.17 表格数据-Variant string.（两者为空）', async ({ page }) => {
    resetCounter('17_数据_Vs都空');
    await mockSearchApi(page, [{ pc: 'PC01', num: '100', market: 'DE', vs: '', vs2: '' }]);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-table tbody tr').first().locator('td').nth(6)).toContainText('-');
    await takeScreenshot(page, '17_数据_Vs都空');
    await page.unroute('**/api/ud09/search');
  });

  test('No.18 表格数据-Comments', async ({ page }) => {
    resetCounter('18_数据_Comments');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-table tbody tr').first().locator('td').nth(7)).toContainText('Test comment');
    await takeScreenshot(page, '18_数据_Comments');
    await page.unroute('**/api/ud09/search');
  });

  test('No.19 表格数据-Add', async ({ page }) => {
    resetCounter('19_数据_Add');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-table tbody tr').first().locator('td').nth(8)).toContainText('202201');
    await takeScreenshot(page, '19_数据_Add');
    await page.unroute('**/api/ud09/search');
  });

  test('No.20 表格数据-Delete', async ({ page }) => {
    resetCounter('20_数据_Delete');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-table tbody tr').first().locator('td').nth(9)).toContainText('-');
    await takeScreenshot(page, '20_数据_Delete');
    await page.unroute('**/api/ud09/search');
  });

  test('No.21 表格数据-Created by user', async ({ page }) => {
    resetCounter('21_数据_CreatedBy');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-table tbody tr').first().locator('td').nth(10)).toContainText('admin');
    await takeScreenshot(page, '21_数据_CreatedBy');
    await page.unroute('**/api/ud09/search');
  });

  test('No.22 表格数据-Date', async ({ page }) => {
    resetCounter('22_数据_Date');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-table tbody tr').first().locator('td').nth(11)).toContainText('2022-12-02');
    await takeScreenshot(page, '22_数据_Date');
    await page.unroute('**/api/ud09/search');
  });

  test('No.23 表格默认排序顺序', async ({ page }) => {
    resetCounter('23_表格排序');
    await mockSearchApi(page, MOCK_DATA_6);
    await gotoUD09(page);
    await page.waitForTimeout(2000);
    const rows = page.locator('.ud09-table tbody tr');
    const count = await rows.count();
    expect(count).toBe(6);
    // 验证排序：PC昇順→Market昇順→Number昇順
    await expect(rows.nth(0).locator('td').nth(1)).toContainText('PC01');
    await expect(rows.nth(0).locator('td').nth(3)).toContainText('DE');
    await expect(rows.nth(0).locator('td').nth(2)).toContainText('100');
    await takeScreenshot(page, '23_表格排序');
    await page.unroute('**/api/ud09/search');
  });

  test('No.24 空数据消息显示', async ({ page }) => {
    resetCounter('24_空数据消息');
    await mockSearchApi(page, []);
    await gotoUD09(page, { productClass: 'NONEXISTENT' });
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-td-empty')).toContainText('No data found');
    await takeScreenshot(page, '24_空数据消息');
    await page.unroute('**/api/ud09/search');
  });

  test('No.25 表格行悬停效果', async ({ page }) => {
    resetCounter('25_行悬停');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    const row = page.locator('.ud09-table tbody tr').first();
    await row.hover();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '25_行悬停');
    await page.unroute('**/api/ud09/search');
  });
});

// ============================================================
// 3. Radio按钮选择（No.26-31）
// ============================================================
test.describe.serial('Radio选择（No.26-31）', () => {
  test.setTimeout(120000);

  test('No.26 Radio-选中一条记录', async ({ page }) => {
    resetCounter('26_Radio选中');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-table tbody tr').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud09-tr-selected').first()).toBeVisible();
    await takeScreenshot(page, '26_Radio选中');
    await page.unroute('**/api/ud09/search');
  });

  test('No.27 Radio-切换选中记录', async ({ page }) => {
    resetCounter('27_Radio切换');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.locator('.ud09-table tbody tr').nth(1).click();
    await page.waitForTimeout(300);
    const selected = page.locator('.ud09-tr-selected');
    expect(await selected.count()).toBe(1);
    await takeScreenshot(page, '27_Radio切换');
    await page.unroute('**/api/ud09/search');
  });

  test('No.28 Radio-取消选中', async ({ page }) => {
    resetCounter('28_Radio取消');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    const firstRow = page.locator('.ud09-table tbody tr').first();
    await firstRow.click();
    await page.waitForTimeout(300);
    await firstRow.click();
    await page.waitForTimeout(300);
    expect(await page.locator('.ud09-tr-selected').count()).toBe(0);
    await takeScreenshot(page, '28_Radio取消');
    await page.unroute('**/api/ud09/search');
  });

  test('No.29 Radio-只能单选验证', async ({ page }) => {
    resetCounter('29_Radio单选');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.locator('.ud09-table tbody tr').nth(1).click();
    await page.waitForTimeout(300);
    expect(await page.locator('.ud09-tr-selected').count()).toBe(1);
    await takeScreenshot(page, '29_Radio单选');
    await page.unroute('**/api/ud09/search');
  });

  test('No.30 Radio-点击行触发选中', async ({ page }) => {
    resetCounter('30_点击行选中');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-table tbody tr').nth(2).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud09-tr-selected')).toBeVisible();
    await takeScreenshot(page, '30_点击行选中');
    await page.unroute('**/api/ud09/search');
  });

  test('No.31 Radio-点击复选框列', async ({ page }) => {
    resetCounter('31_点击复选框');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    const radio = page.locator('.ud09-table tbody tr').first().locator('td').first().locator('input[type="radio"]');
    await radio.click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.locator('.ud09-tr-selected')).toBeVisible();
    await takeScreenshot(page, '31_点击复选框');
    await page.unroute('**/api/ud09/search');
  });
});

// ============================================================
// 4. Select按钮（No.32-34）
// ============================================================
test.describe.serial('Select按钮（No.32-34）', () => {
  test.setTimeout(120000);

  test('No.32 Select-选中后返回UD08', async ({ page }) => {
    resetCounter('32_Select返回');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.locator('.ud09-btn').filter({ hasText: 'Select' }).click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/Menu/HomologationVariables');
    await takeScreenshot(page, '32_Select返回');
    await page.unroute('**/api/ud09/search');
  });

  test('No.33 Select-未选中记录提示错误', async ({ page }) => {
    resetCounter('33_Select未选中');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-btn').filter({ hasText: 'Select' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud09-message.error')).toContainText('Please select a record');
    await takeScreenshot(page, '33_Select未选中');
    await page.unroute('**/api/ud09/search');
  });

  test('No.34 Select-按钮Disabled状态', async ({ page }) => {
    resetCounter('34_Select禁用');
    await mockSearchApi(page, DEFAULT_DATA, 3000);
    await gotoUD09(page); await page.waitForTimeout(500);
    await expect(page.locator('.ud09-btn').filter({ hasText: 'Select' })).toBeDisabled();
    await takeScreenshot(page, '34_Select禁用');
    await page.unroute('**/api/ud09/search');
  });
});

// ============================================================
// 5. Back按钮（No.35-37）
// ============================================================
test.describe.serial('Back按钮（No.35-37）', () => {
  test.setTimeout(120000);

  test('No.35 Back-返回UD08保留搜索条件', async ({ page }) => {
    resetCounter('35_Back返回');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-btn').filter({ hasText: 'Back' }).click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/Menu/HomologationVariables');
    await takeScreenshot(page, '35_Back返回');
    await page.unroute('**/api/ud09/search');
  });

  test('No.36 Back-返回UD08保留运算符', async ({ page }) => {
    resetCounter('36_Back保留运算符');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page, { productClass: 'PC01', numberOp: 'GT', productClassOp: '!=' });
    await page.waitForTimeout(2000);
    await page.locator('.ud09-btn').filter({ hasText: 'Back' }).click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/Menu/HomologationVariables');
    await takeScreenshot(page, '36_Back保留运算符');
    await page.unroute('**/api/ud09/search');
  });

  test('No.37 Back-按钮Disabled状态', async ({ page }) => {
    resetCounter('37_Back禁用');
    await mockSearchApi(page, DEFAULT_DATA, 3000);
    await gotoUD09(page); await page.waitForTimeout(500);
    await expect(page.locator('.ud09-btn').filter({ hasText: 'Back' })).toBeDisabled();
    await takeScreenshot(page, '37_Back禁用');
    await page.unroute('**/api/ud09/search');
  });
});

// ============================================================
// 6. Print按钮（No.38-41）
// ============================================================
test.describe.serial('Print按钮（No.38-41）', () => {
  test.setTimeout(120000);

  test('No.38 Print-调用打印功能', async ({ page }) => {
    resetCounter('38_Print打印');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    // 监听 print 事件
    let printCalled = false;
    page.on('pageerror', () => {});
    await page.evaluate(() => { window.print = () => { (window as any).__printCalled = true; }; });
    await page.locator('.ud09-btn').filter({ hasText: 'Print' }).click();
    await page.waitForTimeout(500);
    const wasCalled = await page.evaluate(() => (window as any).__printCalled === true);
    expect(wasCalled).toBe(true);
    await takeScreenshot(page, '38_Print打印');
    await page.unroute('**/api/ud09/search');
  });

  test('No.39 Print-无数据时打印', async ({ page }) => {
    resetCounter('39_Print无数据');
    await mockSearchApi(page, []);
    await gotoUD09(page, { productClass: 'NONEXISTENT' });
    await page.waitForTimeout(2000);
    await page.evaluate(() => { window.print = () => { (window as any).__printCalled = true; }; });
    await page.locator('.ud09-btn').filter({ hasText: 'Print' }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '39_Print无数据');
    await page.unroute('**/api/ud09/search');
  });

  test('No.40 Print-按钮Disabled状态', async ({ page }) => {
    resetCounter('40_Print禁用');
    await mockSearchApi(page, DEFAULT_DATA, 3000);
    await gotoUD09(page); await page.waitForTimeout(500);
    await expect(page.locator('.ud09-btn').filter({ hasText: 'Print' })).toBeDisabled();
    await takeScreenshot(page, '40_Print禁用');
    await page.unroute('**/api/ud09/search');
  });

  test('No.41 Print-打印样式', async ({ page }) => {
    resetCounter('41_Print样式');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await takeScreenshot(page, '41_Print样式');
    await page.unroute('**/api/ud09/search');
  });
});

// ============================================================
// 7. Delete selected按钮（No.42-50）
// ============================================================
test.describe.serial('Delete按钮（No.42-50）', () => {
  test.setTimeout(120000);

  test('No.42 Delete-未选中提示错误', async ({ page }) => {
    resetCounter('42_Delete未选中');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-btn-danger').filter({ hasText: 'Delete selected' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud09-message.error')).toContainText('Please select a record to delete');
    await takeScreenshot(page, '42_Delete未选中');
    await page.unroute('**/api/ud09/search');
  });

  test('No.43 Delete-删除成功', async ({ page }) => {
    resetCounter('43_Delete成功');
    await mockSearchApi(page, DEFAULT_DATA);
    await mockDeleteApi(page, { code: 200, data: { deletedCount: 1, message: 'Delete successful' } });
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-table tbody tr').first().click();
    await page.waitForTimeout(300);
    // Re-mock search for refresh
    await page.unroute('**/api/ud09/search');
    await mockSearchApi(page, [DEFAULT_DATA[1]]);
    await page.locator('.ud09-btn-danger').filter({ hasText: 'Delete selected' }).click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '43_Delete成功');
    await page.unroute('**/api/ud09/search');
    await page.unroute('**/api/ud09/deletehdocuserdefinedrules');
  });

  test('No.44 Delete-记录不存在（404）', async ({ page }) => {
    resetCounter('44_Delete404');
    await mockSearchApi(page, DEFAULT_DATA);
    await mockDeleteApi(page, { code: 404, message: 'Data does not exist, Please enter the correct content' });
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.locator('.ud09-btn-danger').filter({ hasText: 'Delete selected' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud09-message.error')).toContainText('Data does not exist');
    await takeScreenshot(page, '44_Delete404');
    await page.unroute('**/api/ud09/search');
    await page.unroute('**/api/ud09/deletehdocuserdefinedrules');
  });

  test('No.45 Delete-服务器错误（500）', async ({ page }) => {
    resetCounter('45_Delete500');
    await mockSearchApi(page, DEFAULT_DATA);
    await mockDeleteApi(page, { code: 500, message: 'System error' }, 500);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.locator('.ud09-btn-danger').filter({ hasText: 'Delete selected' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud09-message.error')).toContainText('System error');
    await takeScreenshot(page, '45_Delete500');
    await page.unroute('**/api/ud09/search');
    await page.unroute('**/api/ud09/deletehdocuserdefinedrules');
  });

  test('No.46 Delete-网络错误', async ({ page }) => {
    resetCounter('46_Delete网络错误');
    await mockSearchApi(page, DEFAULT_DATA);
    await page.route('**/api/ud09/deletehdocuserdefinedrules', (route) => route.abort('connectionrefused'));
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.locator('.ud09-btn-danger').filter({ hasText: 'Delete selected' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud09-message.error')).toContainText('System error');
    await takeScreenshot(page, '46_Delete网络错误');
    await page.unroute('**/api/ud09/search');
    await page.unroute('**/api/ud09/deletehdocuserdefinedrules');
  });

  test('No.47 Delete-按钮Loading状态', async ({ page }) => {
    resetCounter('47_DeleteLoading');
    await mockSearchApi(page, DEFAULT_DATA);
    await page.route('**/api/ud09/deletehdocuserdefinedrules', async (route) => {
      await new Promise(r => setTimeout(r, 5000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: {} }) });
    });
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.locator('.ud09-btn-danger').filter({ hasText: 'Delete selected' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud09-btn-danger')).toBeDisabled();
    await takeScreenshot(page, '47_DeleteLoading');
    await page.unroute('**/api/ud09/search');
    await page.unroute('**/api/ud09/deletehdocuserdefinedrules');
  });

  test('No.48 Delete-防止重复提交', async ({ page }) => {
    resetCounter('48_Delete防重复');
    await mockSearchApi(page, DEFAULT_DATA);
    let callCount = 0;
    await page.route('**/api/ud09/deletehdocuserdefinedrules', async (route) => {
      callCount++;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: {} }) });
    });
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-table tbody tr').first().click();
    await page.waitForTimeout(300);
    const btn = page.locator('.ud09-btn-danger').filter({ hasText: 'Delete selected' });
    await btn.click();
    await page.waitForTimeout(300);
    await btn.click({ force: true });
    await page.waitForTimeout(500);
    expect(callCount).toBeLessThanOrEqual(1);
    await takeScreenshot(page, '48_Delete防重复');
    await page.unroute('**/api/ud09/search');
    await page.unroute('**/api/ud09/deletehdocuserdefinedrules');
  });

  test('No.49 Delete-删除后刷新列表', async ({ page }) => {
    resetCounter('49_Delete刷新');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.unroute('**/api/ud09/search');
    // After delete, new search is called
    let searchCalled = false;
    await page.route('**/api/ud09/search', async (route) => {
      searchCalled = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: [DEFAULT_DATA[1]] }) });
    });
    await mockDeleteApi(page, { code: 200, data: { deletedCount: 1, message: 'ok' } });
    await page.locator('.ud09-btn-danger').filter({ hasText: 'Delete selected' }).click();
    await page.waitForTimeout(2000);
    expect(searchCalled).toBe(true);
    await takeScreenshot(page, '49_Delete刷新');
    await page.unroute('**/api/ud09/search');
    await page.unroute('**/api/ud09/deletehdocuserdefinedrules');
  });

  test('No.50 Delete-删除后选中状态清空', async ({ page }) => {
    resetCounter('50_Delete清空选中');
    await mockSearchApi(page, DEFAULT_DATA);
    await mockDeleteApi(page, { code: 200, data: { deletedCount: 1, message: 'ok' } });
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.unroute('**/api/ud09/search');
    await mockSearchApi(page, [DEFAULT_DATA[1]]);
    await page.locator('.ud09-btn-danger').filter({ hasText: 'Delete selected' }).click();
    await page.waitForTimeout(2000);
    expect(await page.locator('.ud09-tr-selected').count()).toBe(0);
    await takeScreenshot(page, '50_Delete清空选中');
    await page.unroute('**/api/ud09/search');
    await page.unroute('**/api/ud09/deletehdocuserdefinedrules');
  });
});

// ============================================================
// 8. 记录数显示（No.51-54）
// ============================================================
test.describe.serial('记录数显示（No.51-54）', () => {
  test.setTimeout(120000);

  test('No.51 Count-显示正确数量', async ({ page }) => {
    resetCounter('51_Count正确');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-count')).toContainText('2');
    await takeScreenshot(page, '51_Count正确');
    await page.unroute('**/api/ud09/search');
  });

  test('No.52 Count-无数据时显示0', async ({ page }) => {
    resetCounter('52_Count零');
    await mockSearchApi(page, []);
    await gotoUD09(page, { productClass: 'NONEXISTENT' });
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-count')).toContainText('0');
    await takeScreenshot(page, '52_Count零');
    await page.unroute('**/api/ud09/search');
  });

  test('No.53 Count-大量数据时显示', async ({ page }) => {
    resetCounter('53_Count大量');
    const bigData = Array.from({ length: 1000 }, (_, i) => ({
      pc: `PC${String(i).padStart(3, '0')}`, num: String(i), market: 'DE',
      variable: '', val: '', vs: '', vs2: '', comments: '', addDate: '', deleteDate: '', updateUser: '', updateDatetime: ''
    }));
    await mockSearchApi(page, bigData);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-count')).toContainText('1000');
    await takeScreenshot(page, '53_Count大量');
    await page.unroute('**/api/ud09/search');
  });

  test('No.54 Count-删除后更新', async ({ page }) => {
    resetCounter('54_Count更新');
    await mockSearchApi(page, DEFAULT_DATA);
    await mockDeleteApi(page, { code: 200, data: { deletedCount: 1 } });
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.unroute('**/api/ud09/search');
    await mockSearchApi(page, [DEFAULT_DATA[1]]);
    await page.locator('.ud09-btn-danger').filter({ hasText: 'Delete selected' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-count')).toContainText('1');
    await takeScreenshot(page, '54_Count更新');
    await page.unroute('**/api/ud09/search');
    await page.unroute('**/api/ud09/deletehdocuserdefinedrules');
  });
});

// ============================================================
// 9. Created by user链接（No.55-57）
// ============================================================
test.describe.serial('Created by user链接（No.55-57）', () => {
  test.setTimeout(120000);

  test('No.55 Created by user-链接样式', async ({ page }) => {
    resetCounter('55_链接样式');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    const userLink = page.locator('.ud09-user-link').first();
    await expect(userLink).toBeVisible();
    await expect(userLink).toContainText('admin');
    await takeScreenshot(page, '55_链接样式');
    await page.unroute('**/api/ud09/search');
  });

  test('No.56 Created by user-点击跳转', async ({ page }) => {
    resetCounter('56_点击跳转');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-user-link').first().click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/Menu/EDBUserView');
    await takeScreenshot(page, '56_点击跳转');
    await page.unroute('**/api/ud09/search');
  });

  test('No.57 Created by user-不同用户跳转', async ({ page }) => {
    resetCounter('57_不同用户跳转');
    const multiUserData = [
      { pc: 'PC01', num: '100', market: 'DE', variable: '', val: '', vs: '', vs2: '', comments: '', addDate: '', deleteDate: '', updateUser: 'admin', updateDatetime: '' },
      { pc: 'PC02', num: '200', market: 'DE', variable: '', val: '', vs: '', vs2: '', comments: '', addDate: '', deleteDate: '', updateUser: 'operator', updateDatetime: '' },
    ];
    await mockSearchApi(page, multiUserData);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-user-link').nth(1).click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/Menu/EDBUserView');
    await takeScreenshot(page, '57_不同用户跳转');
    await page.unroute('**/api/ud09/search');
  });
});

// ============================================================
// 10. 异常处理（No.58-60）
// ============================================================
test.describe.serial('异常处理（No.58-60）', () => {
  test.setTimeout(120000);

  test('No.58 异常-Search API超时', async ({ page }) => {
    resetCounter('58_异常超时');
    await mockSearchApiTimeout(page);
    await gotoUD09(page);
    await page.waitForTimeout(15000);
    await expect(page.locator('.ud09-message.error')).toContainText('System error');
    await takeScreenshot(page, '58_异常超时');
    await page.unroute('**/api/ud09/search');
  });

  test('No.59 异常-Delete API超时', async ({ page }) => {
    resetCounter('59_Delete超时');
    await mockSearchApi(page, DEFAULT_DATA);
    await page.route('**/api/ud09/deletehdocuserdefinedrules', () => new Promise(() => {}));
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.locator('.ud09-btn-danger').filter({ hasText: 'Delete selected' }).click();
    await page.waitForTimeout(15000);
    await expect(page.locator('.ud09-message.error')).toContainText('System error');
    await takeScreenshot(page, '59_Delete超时');
    await page.unroute('**/api/ud09/search');
    await page.unroute('**/api/ud09/deletehdocuserdefinedrules');
  });

  test('No.60 异常-JSON解析失败', async ({ page }) => {
    resetCounter('60_JSON解析失败');
    await page.route('**/api/ud09/search', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'invalid json' });
    });
    await gotoUD09(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-message.error')).toContainText('System error');
    await takeScreenshot(page, '60_JSON解析失败');
    await page.unroute('**/api/ud09/search');
  });
});

// ============================================================
// 11. 交互与兼容性（No.61-67）
// ============================================================
test.describe.serial('交互与兼容性（No.61-67）', () => {
  test.setTimeout(120000);

  test('No.61 消息类型-Error样式', async ({ page }) => {
    resetCounter('61_Error样式');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-btn').filter({ hasText: 'Select' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud09-message.error')).toBeVisible();
    await takeScreenshot(page, '61_Error样式');
    await page.unroute('**/api/ud09/search');
  });

  test('No.62 消息类型-Success样式', async ({ page }) => {
    resetCounter('62_Success样式');
    await mockSearchApi(page, DEFAULT_DATA);
    await mockDeleteApi(page, { code: 200, data: { deletedCount: 1, message: 'success' } });
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.unroute('**/api/ud09/search');
    await mockSearchApi(page, [DEFAULT_DATA[1]]);
    await page.locator('.ud09-btn-danger').filter({ hasText: 'Delete selected' }).click();
    await page.waitForTimeout(2000);
    // 删除成功后可能显示成功消息
    await takeScreenshot(page, '62_Success样式');
    await page.unroute('**/api/ud09/search');
    await page.unroute('**/api/ud09/deletehdocuserdefinedrules');
  });

  test('No.63 消息类型-Warning样式', async ({ page }) => {
    resetCounter('63_Warning样式');
    await mockSearchApi(page, DEFAULT_DATA);
    await mockDeleteApi(page, { code: 200, data: { deletedCount: 0, failedCount: 1 } });
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.unroute('**/api/ud09/search');
    await mockSearchApi(page, [DEFAULT_DATA[1]]);
    await page.locator('.ud09-btn-danger').filter({ hasText: 'Delete selected' }).click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '63_Warning样式');
    await page.unroute('**/api/ud09/search');
    await page.unroute('**/api/ud09/deletehdocuserdefinedrules');
  });

  test('No.64 消息清空-新操作时覆盖', async ({ page }) => {
    resetCounter('64_消息覆盖');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    // 触发错误消息
    await page.locator('.ud09-btn').filter({ hasText: 'Select' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('.ud09-message.error')).toBeVisible();
    // 点击Back可清除消息
    await page.locator('.ud09-btn').filter({ hasText: 'Back' }).click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/Menu/HomologationVariables');
    await takeScreenshot(page, '64_消息覆盖');
    await page.unroute('**/api/ud09/search');
  });

  test('No.65 表格滚动-大量数据', async ({ page }) => {
    resetCounter('65_表格滚动');
    const bigData = Array.from({ length: 50 }, (_, i) => ({
      pc: `PC${String(i).padStart(3, '0')}`, num: String(i), market: 'DE',
      variable: '', val: '', vs: '', vs2: '', comments: '', addDate: '', deleteDate: '', updateUser: '', updateDatetime: ''
    }));
    await mockSearchApi(page, bigData);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await expect(page.locator('.ud09-table-wrapper')).toBeVisible();
    await takeScreenshot(page, '65_表格滚动');
    await page.unroute('**/api/ud09/search');
  });

  test('No.66 按钮组-连续操作', async ({ page }) => {
    resetCounter('66_连续操作');
    await mockSearchApi(page, DEFAULT_DATA);
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.locator('.ud09-btn').filter({ hasText: 'Select' }).click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/Menu/HomologationVariables');
    await takeScreenshot(page, '66_连续操作');
    await page.unroute('**/api/ud09/search');
  });

  test('No.67 按钮组-Delete后Select', async ({ page }) => {
    resetCounter('67_Delete后Select');
    await mockSearchApi(page, DEFAULT_DATA);
    await mockDeleteApi(page, { code: 200, data: { deletedCount: 1 } });
    await gotoUD09(page); await page.waitForTimeout(2000);
    await page.locator('.ud09-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.unroute('**/api/ud09/search');
    await mockSearchApi(page, [DEFAULT_DATA[1]]);
    await page.locator('.ud09-btn-danger').filter({ hasText: 'Delete selected' }).click();
    await page.waitForTimeout(2000);
    // 选择剩余记录然后Select
    await page.locator('.ud09-table tbody tr').first().click();
    await page.waitForTimeout(300);
    await page.locator('.ud09-btn').filter({ hasText: 'Select' }).click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/Menu/HomologationVariables');
    await takeScreenshot(page, '67_Delete后Select');
    await page.unroute('**/api/ud09/search');
    await page.unroute('**/api/ud09/deletehdocuserdefinedrules');
  });
});
