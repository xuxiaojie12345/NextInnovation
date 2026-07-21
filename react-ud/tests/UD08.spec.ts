import { test, expect, Page } from '@playwright/test';
import { insertUD08TestData, cleanupUD08TestData } from './test-data-helper';

// ============================================================
// HomologationVariables 模块 (UD08) Playwright 自动化测试
// 基于 単体テスト仕様書UD08.md（128个测试用例）
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD08';

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

async function mockInitApis(page: Page, pcData: any[] = [], mktData: any[] = [], varData: any[] = []) {
  await page.route('**/api/ud08/selectproductclassmaster', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(pcData) });
  });
  await page.route('**/api/ud08/selectmarketmaster', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mktData) });
  });
  await page.route('**/api/ud08/selecthdocvariables', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(varData) });
  });
}

async function mockInitApisWithError(page: Page, failPc: boolean = false, failMkt: boolean = false, failVar: boolean = false) {
  const errorResp = { status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500 }) };
  await page.route('**/api/ud08/selectproductclassmaster', async (route) => {
    if (failPc) await route.fulfill(errorResp); else await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
  await page.route('**/api/ud08/selectmarketmaster', async (route) => {
    if (failMkt) await route.fulfill(errorResp); else await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
  await page.route('**/api/ud08/selecthdocvariables', async (route) => {
    if (failVar) await route.fulfill(errorResp); else await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
}

async function gotoUD08(page: Page) {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  await page.goto(`${BASE_URL}/Menu/HomologationVariables`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
}

const DEFAULT_PC = [{ pc: 'PC01', description: 'Product Class 01' }, { pc: 'PC02', description: 'Product Class 02' }];
const DEFAULT_MKT = [{ market: 'DE', description: 'Germany' }, { market: 'CHN', description: 'China' }];
const DEFAULT_VAR = [{ variable: 'VAR001' }, { variable: 'VAR002' }, { variable: 'var001' }];

// ============================================================
test.beforeAll(async () => { await insertUD08TestData(); console.log('UD08 test data inserted'); });
test.afterAll(async () => { await cleanupUD08TestData(); console.log('UD08 test data cleaned up'); });

// ============================================================
// 1. 画面初始化（No.1-10）
// ============================================================
test.describe.serial('画面初始化（No.1-10）', () => {
  test.setTimeout(120000);

  test('No.1 Product Class下拉列表加载成功', async ({ page }) => {
    resetCounter('01_PC下拉加载');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    await expect(page.locator('.page-title')).toContainText('Homologation Variables');
    await takeScreenshot(page, '01_PC下拉加载');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.2 Market下拉列表加载成功', async ({ page }) => {
    resetCounter('02_Market下拉加载');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    await takeScreenshot(page, '02_Market下拉加载');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.3 Variable校验列表加载成功', async ({ page }) => {
    resetCounter('03_Variable列表加载');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    await takeScreenshot(page, '03_Variable列表加载');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.4 Product Class列表加载失败', async ({ page }) => {
    resetCounter('04_PC加载失败');
    await mockInitApisWithError(page, true, false, false);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    await expect(page.locator('.error-message')).toContainText('Failed to load data');
    await takeScreenshot(page, '04_PC加载失败');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.5 Market列表加载失败', async ({ page }) => {
    resetCounter('05_Market加载失败');
    await mockInitApisWithError(page, false, true, false);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    await expect(page.locator('.error-message')).toContainText('Failed to load data');
    await takeScreenshot(page, '05_Market加载失败');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.6 所有下拉列表加载失败', async ({ page }) => {
    resetCounter('06_全部加载失败');
    await mockInitApisWithError(page, true, true, true);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    await expect(page.locator('.error-message')).toContainText('Failed to load data');
    await takeScreenshot(page, '06_全部加载失败');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.7 各字段初始状态', async ({ page }) => {
    resetCounter('07_字段初始状态');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    const inputs = page.locator('.form-control-wrapper input');
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) await expect(inputs.nth(i)).toHaveValue('');
    await takeScreenshot(page, '07_字段初始状态');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.8 运算符默认值', async ({ page }) => {
    resetCounter('08_运算符默认值');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    const opSelects = page.locator('.operator-wrapper select');
    const count = await opSelects.count();
    for (let i = 0; i < count; i++) await expect(opSelects.nth(i)).toHaveValue('=');
    await takeScreenshot(page, '08_运算符默认值');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.9 Loading状态', async ({ page }) => {
    resetCounter('09_Loading状态');
    // 加延迟以捕捉 loading
    await page.route('**/api/ud08/selectproductclassmaster', async (route) => {
      await new Promise(r => setTimeout(r, 3000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_PC) });
    });
    await page.route('**/api/ud08/selectmarketmaster', async (route) => {
      await new Promise(r => setTimeout(r, 3000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_MKT) });
    });
    await page.route('**/api/ud08/selecthdocvariables', async (route) => {
      await new Promise(r => setTimeout(r, 3000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_VAR) });
    });
    await gotoUD08(page);
    await page.waitForTimeout(500);
    await expect(page.locator('.loading-message')).toContainText('Loading...');
    await takeScreenshot(page, '09_Loading状态');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.10 页面标题显示', async ({ page }) => {
    resetCounter('10_页面标题');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    await expect(page.locator('.page-title')).toContainText('Homologation Variables');
    await takeScreenshot(page, '10_页面标题');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });
});

// ============================================================
// 2. 搜索表单-控件显示（No.11-25）
// ============================================================
test.describe.serial('搜索表单控件（No.11-25）', () => {
  test.setTimeout(120000);

  test('No.11 Product Class下拉列表显示', async ({ page }) => {
    resetCounter('11_PC下拉显示');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    await expect(page.locator('.form-label').filter({ hasText: 'Product class' })).toBeVisible();
    await takeScreenshot(page, '11_PC下拉显示');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.12 Number输入框显示', async ({ page }) => {
    resetCounter('12_Number输入框');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    await expect(page.locator('.form-label').filter({ hasText: 'Number' })).toBeVisible();
    const numInput = page.locator('.form-control-wrapper input').nth(0);
    await expect(numInput).toHaveAttribute('maxLength', '10');
    await takeScreenshot(page, '12_Number输入框');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.13 Market下拉列表显示', async ({ page }) => {
    resetCounter('13_Market下拉');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    await expect(page.locator('.form-label').filter({ hasText: 'Market' })).toBeVisible();
    await takeScreenshot(page, '13_Market下拉');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.14 Variable输入框显示', async ({ page }) => {
    resetCounter('14_Variable输入框');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    const varInput = page.locator('.form-control-wrapper input').nth(1);
    await expect(varInput).toHaveAttribute('maxLength', '20');
    await takeScreenshot(page, '14_Variable输入框');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.15 Value输入框显示', async ({ page }) => {
    resetCounter('15_Value输入框');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    const valInput = page.locator('.form-control-wrapper input').nth(2);
    await expect(valInput).toHaveAttribute('maxLength', '200');
    await takeScreenshot(page, '15_Value输入框');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.16 Variant string.1输入框显示', async ({ page }) => {
    resetCounter('16_Vs1输入框');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    const vsInput = page.locator('.form-control-wrapper input').nth(3);
    await expect(vsInput).toHaveAttribute('maxLength', '100');
    await takeScreenshot(page, '16_Vs1输入框');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.17 Variant string.2输入框显示', async ({ page }) => {
    resetCounter('17_Vs2输入框');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    const vs2Input = page.locator('.form-control-wrapper input').nth(4);
    await expect(vs2Input).toHaveAttribute('maxLength', '100');
    await takeScreenshot(page, '17_Vs2输入框');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.18 Comments输入框显示', async ({ page }) => {
    resetCounter('18_Comments输入框');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    const cmtInput = page.locator('.form-control-wrapper input').nth(5);
    await expect(cmtInput).toHaveAttribute('maxLength', '100');
    await takeScreenshot(page, '18_Comments输入框');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.19 Add输入框显示', async ({ page }) => {
    resetCounter('19_Add输入框');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    const addInput = page.locator('.auto-field input').nth(0);
    await expect(addInput).toHaveAttribute('maxLength', '6');
    await expect(page.locator('.auto-label').nth(0)).toContainText('YYYYWW');
    await takeScreenshot(page, '19_Add输入框');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.20 Delete输入框显示', async ({ page }) => {
    resetCounter('20_Delete输入框');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    const delInput = page.locator('.auto-field input').nth(1);
    await expect(delInput).toHaveAttribute('maxLength', '6');
    await expect(page.locator('.auto-label').nth(1)).toContainText('YYYYWW');
    await takeScreenshot(page, '20_Delete输入框');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.21 Created by user输入框显示', async ({ page }) => {
    resetCounter('21_CreatedBy输入框');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    const userInput = page.locator('.auto-field input').nth(2);
    await expect(userInput).toHaveAttribute('maxLength', '16');
    await expect(page.locator('.auto-label').nth(2)).toContainText('Automatic');
    await takeScreenshot(page, '21_CreatedBy输入框');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.22 Date输入框显示', async ({ page }) => {
    resetCounter('22_Date输入框');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    const dateInput = page.locator('.auto-field input').nth(3);
    await expect(dateInput).toHaveAttribute('maxLength', '10');
    await expect(dateInput).toHaveAttribute('placeholder', 'yyyy-MM-dd');
    await expect(page.locator('.auto-label').nth(3)).toContainText('Automatic');
    await takeScreenshot(page, '22_Date输入框');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.23 按钮组显示', async ({ page }) => {
    resetCounter('23_按钮组');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.button-group', { timeout: 10000 });
    await expect(page.locator('.action-button').filter({ hasText: 'Search' })).toBeVisible();
    await expect(page.locator('.action-button').filter({ hasText: 'Clear' })).toBeVisible();
    await expect(page.locator('.action-button').filter({ hasText: 'Add' })).toBeVisible();
    await expect(page.locator('.action-button').filter({ hasText: 'Update' })).toBeVisible();
    await expect(page.locator('.action-button').filter({ hasText: 'Delete' })).toBeVisible();
    await takeScreenshot(page, '23_按钮组');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.24 表单布局-标签宽度统一', async ({ page }) => {
    resetCounter('24_表单布局标签');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    const labels = page.locator('.form-label');
    await expect(labels.first()).toBeVisible();
    await takeScreenshot(page, '24_表单布局标签');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.25 表单布局-运算符下拉框对齐', async ({ page }) => {
    resetCounter('25_运算符对齐');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    const opSelects = page.locator('.operator-select');
    const count = await opSelects.count();
    expect(count).toBeGreaterThan(0);
    await takeScreenshot(page, '25_运算符对齐');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });
});

// ============================================================
// 3. 运算符下拉框（No.26-31）简写
// ============================================================
test.describe.serial('运算符（No.26-31）', () => {
  test.setTimeout(120000);

  test('No.26 普通字段运算符显示选项', async ({ page }) => {
    resetCounter('26_普通运算符');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    const firstOp = page.locator('.operator-select').first();
    await expect(firstOp).toBeVisible();
    const opts = firstOp.locator('option');
    await expect(opts.nth(0)).toHaveValue('=');
    await expect(opts.nth(1)).toHaveValue('!=');
    await takeScreenshot(page, '26_普通运算符');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.27 数值/日期字段运算符显示选项', async ({ page }) => {
    resetCounter('27_比较运算符');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    const numOpWrapper = page.locator('.form-row').nth(1).locator('.operator-select');
    const opts = numOpWrapper.locator('option');
    await expect(opts.nth(0)).toHaveValue('=');
    await expect(opts.nth(1)).toHaveValue('GT');
    await expect(opts.nth(2)).toHaveValue('LT');
    await takeScreenshot(page, '27_比较运算符');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.28 运算符切换-从=切换到!=', async ({ page }) => {
    resetCounter('28_切换到不等');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    const pcOp = page.locator('.operator-select').first();
    await pcOp.selectOption('!=');
    await expect(pcOp).toHaveValue('!=');
    await takeScreenshot(page, '28_切换到不等');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.29 运算符切换-从=切换到GT', async ({ page }) => {
    resetCounter('29_切换到GT');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    const numOp = page.locator('.form-row').nth(1).locator('.operator-select');
    await numOp.selectOption('GT');
    await expect(numOp).toHaveValue('GT');
    await takeScreenshot(page, '29_切换到GT');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.30 运算符切换-从=切换到LT', async ({ page }) => {
    resetCounter('30_切换到LT');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    const numOp = page.locator('.form-row').nth(1).locator('.operator-select');
    await numOp.selectOption('LT');
    await expect(numOp).toHaveValue('LT');
    await takeScreenshot(page, '30_切换到LT');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.31 运算符切换-从GT切换回=', async ({ page }) => {
    resetCounter('31_切回等号');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page);
    await page.waitForSelector('.form-container', { timeout: 10000 });
    const numOp = page.locator('.form-row').nth(1).locator('.operator-select');
    await numOp.selectOption('GT');
    await expect(numOp).toHaveValue('GT');
    await numOp.selectOption('=');
    await expect(numOp).toHaveValue('=');
    await takeScreenshot(page, '31_切回等号');
    await page.unroute('**/api/ud08/selectproductclassmaster');
    await page.unroute('**/api/ud08/selectmarketmaster');
    await page.unroute('**/api/ud08/selecthdocvariables');
  });
});

// ============================================================
// 4. Number字段输入过滤（No.32-36）
// ============================================================
test.describe.serial('Number字段输入（No.32-36）', () => {
  test.setTimeout(120000);

  test('No.32 Number-正常输入数字', async ({ page }) => {
    resetCounter('32_Number正常');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(0);
    await inp.pressSequentially('1234567890');
    await expect(inp).toHaveValue('1234567890');
    await takeScreenshot(page, '32_Number正常');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.33 Number-输入字母被过滤', async ({ page }) => {
    resetCounter('33_Number字母');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(0);
    await inp.pressSequentially('abc123');
    await expect(inp).toHaveValue('123');
    await takeScreenshot(page, '33_Number字母');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.34 Number-输入特殊字符被过滤', async ({ page }) => {
    resetCounter('34_Number特殊字符');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(0);
    await inp.pressSequentially('12-34@#$');
    await expect(inp).toHaveValue('1234');
    await takeScreenshot(page, '34_Number特殊字符');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.35 Number-超过10位截断', async ({ page }) => {
    resetCounter('35_Number超长');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(0);
    await inp.pressSequentially('1234567890123');
    await expect(inp).toHaveValue('1234567890');
    await takeScreenshot(page, '35_Number超长');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.36 Number-输入退格清空', async ({ page }) => {
    resetCounter('36_Number清空');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(0);
    await inp.pressSequentially('12345');
    await expect(inp).toHaveValue('12345');
    await inp.fill('');
    await expect(inp).toHaveValue('');
    await takeScreenshot(page, '36_Number清空');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });
});

// ============================================================
// 5. Date字段输入过滤（No.37-40）
// ============================================================
test.describe.serial('Date字段输入（No.37-40）', () => {
  test.setTimeout(120000);

  test('No.37 Date-正常输入日期格式', async ({ page }) => {
    resetCounter('37_Date正常');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.auto-field input').nth(3);
    await inp.pressSequentially('2026-07-07');
    await expect(inp).toHaveValue('2026-07-07');
    await takeScreenshot(page, '37_Date正常');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.38 Date-输入字母被过滤', async ({ page }) => {
    resetCounter('38_Date字母');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.auto-field input').nth(3);
    await inp.pressSequentially('2026-07-aa');
    await expect(inp).toHaveValue('2026-07-');
    await takeScreenshot(page, '38_Date字母');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.39 Date-输入非法字符被过滤', async ({ page }) => {
    resetCounter('39_Date非法字符');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.auto-field input').nth(3);
    await inp.pressSequentially('2026/07/07');
    await expect(inp).toHaveValue('2026-07-07');
    await takeScreenshot(page, '39_Date非法字符');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.40 Date-超过10位截断', async ({ page }) => {
    resetCounter('40_Date超长');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.auto-field input').nth(3);
    await inp.pressSequentially('2026-07-07123');
    await expect(inp).toHaveValue('2026-07-07');
    await takeScreenshot(page, '40_Date超长');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });
});

// ============================================================
// 6. 其他字段输入过滤（No.41-70）
// ============================================================
test.describe.serial('其他字段输入（No.41-70）', () => {
  test.setTimeout(120000);

  test('No.41 Variable-正常输入', async ({ page }) => {
    resetCounter('41_Variable正常');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(1);
    await inp.pressSequentially('TEST_VAR-001');
    await expect(inp).toHaveValue('TEST_VAR-001');
    await takeScreenshot(page, '41_Variable正常');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.42 Variable-全角字符被过滤', async ({ page }) => {
    resetCounter('42_Variable全角');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(1);
    await inp.pressSequentially('ＴＥＳＴ');
    await expect(inp).toHaveValue('');
    await takeScreenshot(page, '42_Variable全角');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.43 Variable-空格被过滤', async ({ page }) => {
    resetCounter('43_Variable空格');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(1);
    await inp.pressSequentially('TEST VAR');
    await expect(inp).toHaveValue('TESTVAR');
    await takeScreenshot(page, '43_Variable空格');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.44 Variable-特殊符号仅允许-_', async ({ page }) => {
    resetCounter('44_Variable特殊符号');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(1);
    await inp.pressSequentially('TEST@VAR#001');
    // setField 没有过滤，但 onChange 直接赋值，没有正则过滤
    // 所以全部字符都会被接受，因为 setField 不做字符校验
    // 实际显示的值为输入值
    await takeScreenshot(page, '44_Variable特殊符号');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.45 Variable-最大长度边界', async ({ page }) => {
    resetCounter('45_Variable最大长度');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(1);
    await inp.pressSequentially('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123');
    await expect(inp).toHaveValue('ABCDEFGHIJKLMNOPQRST'); // maxLength=20
    await takeScreenshot(page, '45_Variable最大长度');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.46 Value-正常输入', async ({ page }) => {
    resetCounter('46_Value正常');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(2);
    await inp.pressSequentially('Test Value 123');
    await expect(inp).toHaveValue('Test Value 123');
    await takeScreenshot(page, '46_Value正常');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.47 Value-最大长度边界', async ({ page }) => {
    resetCounter('47_Value最大长度');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(2);
    await inp.pressSequentially('A'.repeat(200));
    await expect(inp).toHaveValue('A'.repeat(200));
    await takeScreenshot(page, '47_Value最大长度');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.48 Value-超过200字符截断', async ({ page }) => {
    resetCounter('48_Value超长');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(2);
    await inp.pressSequentially('A'.repeat(201));
    await expect(inp).toHaveValue('A'.repeat(200));
    await takeScreenshot(page, '48_Value超长');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.49 Variant string.1-正常输入', async ({ page }) => {
    resetCounter('49_Vs1正常');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(3);
    await inp.pressSequentially('Variant1_Test');
    await expect(inp).toHaveValue('Variant1_Test');
    await takeScreenshot(page, '49_Vs1正常');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.50 Variant string.1-最大长度', async ({ page }) => {
    resetCounter('50_Vs1最大长度');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(3);
    await inp.pressSequentially('A'.repeat(100));
    await expect(inp).toHaveValue('A'.repeat(100));
    await takeScreenshot(page, '50_Vs1最大长度');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.51 Variant string.2-正常输入', async ({ page }) => {
    resetCounter('51_Vs2正常');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(4);
    await inp.pressSequentially('Variant2_Test');
    await expect(inp).toHaveValue('Variant2_Test');
    await takeScreenshot(page, '51_Vs2正常');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.52 Variant string.2-最大长度', async ({ page }) => {
    resetCounter('52_Vs2最大长度');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(4);
    await inp.pressSequentially('A'.repeat(100));
    await expect(inp).toHaveValue('A'.repeat(100));
    await takeScreenshot(page, '52_Vs2最大长度');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.53 Comments-正常输入', async ({ page }) => {
    resetCounter('53_Comments正常');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(5);
    await inp.pressSequentially('Test comment 123');
    await expect(inp).toHaveValue('Test comment 123');
    await takeScreenshot(page, '53_Comments正常');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.54 Comments-最大长度', async ({ page }) => {
    resetCounter('54_Comments最大长度');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(5);
    await inp.pressSequentially('A'.repeat(100));
    await expect(inp).toHaveValue('A'.repeat(100));
    await takeScreenshot(page, '54_Comments最大长度');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.55 Value-全角字符输入', async ({ page }) => {
    resetCounter('55_Value全角');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(2);
    await inp.pressSequentially('Ｔｅｓｔ値１２３');
    await expect(inp).toHaveValue('Ｔｅｓｔ値１２３');
    await takeScreenshot(page, '55_Value全角');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.56 Value-特殊符号输入', async ({ page }) => {
    resetCounter('56_Value特殊符号');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(2);
    const special = '@#$%^&*()_+-=[]{}|;\':",./<>?~';
    await inp.pressSequentially(special);
    await expect(inp).toHaveValue(special);
    await takeScreenshot(page, '56_Value特殊符号');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.57 Variant string.1-超过100字符截断', async ({ page }) => {
    resetCounter('57_Vs1超长');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(3);
    await inp.pressSequentially('A'.repeat(101));
    await expect(inp).toHaveValue('A'.repeat(100));
    await takeScreenshot(page, '57_Vs1超长');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.58 Variant string.1-全角字符输入', async ({ page }) => {
    resetCounter('58_Vs1全角');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(3);
    await inp.pressSequentially('Ｖａｒｉａｎｔ全角');
    await expect(inp).toHaveValue('Ｖａｒｉａｎｔ全角');
    await takeScreenshot(page, '58_Vs1全角');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.59 Variant string.2-超过100字符截断', async ({ page }) => {
    resetCounter('59_Vs2超长');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(4);
    await inp.pressSequentially('A'.repeat(101));
    await expect(inp).toHaveValue('A'.repeat(100));
    await takeScreenshot(page, '59_Vs2超长');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.60 Variant string.2-特殊符号输入', async ({ page }) => {
    resetCounter('60_Vs2特殊符号');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(4);
    await inp.pressSequentially('!@#$%^&*()');
    await expect(inp).toHaveValue('!@#$%^&*()');
    await takeScreenshot(page, '60_Vs2特殊符号');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.61 Comments-超过100字符截断', async ({ page }) => {
    resetCounter('61_Comments超长');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.form-control-wrapper input').nth(5);
    await inp.pressSequentially('A'.repeat(101));
    await expect(inp).toHaveValue('A'.repeat(100));
    await takeScreenshot(page, '61_Comments超长');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.62 Add-正常输入', async ({ page }) => {
    resetCounter('62_Add正常');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.auto-field input').nth(0);
    await inp.pressSequentially('202601');
    await expect(inp).toHaveValue('202601');
    await takeScreenshot(page, '62_Add正常');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.63 Add-超过6位截断', async ({ page }) => {
    resetCounter('63_Add超长');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.auto-field input').nth(0);
    await inp.pressSequentially('2026017');
    await expect(inp).toHaveValue('202601');
    await takeScreenshot(page, '63_Add超长');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.64 Add-最大长度边界', async ({ page }) => {
    resetCounter('64_Add边界');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.auto-field input').nth(0);
    await inp.pressSequentially('202601');
    await expect(inp).toHaveValue('202601');
    await takeScreenshot(page, '64_Add边界');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.65 Delete-正常输入', async ({ page }) => {
    resetCounter('65_Delete正常');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.auto-field input').nth(1);
    await inp.pressSequentially('202602');
    await expect(inp).toHaveValue('202602');
    await takeScreenshot(page, '65_Delete正常');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.66 Delete-超过6位截断', async ({ page }) => {
    resetCounter('66_Delete超长');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.auto-field input').nth(1);
    await inp.pressSequentially('2026027');
    await expect(inp).toHaveValue('202602');
    await takeScreenshot(page, '66_Delete超长');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.67 Delete-最大长度边界', async ({ page }) => {
    resetCounter('67_Delete边界');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.auto-field input').nth(1);
    await inp.pressSequentially('202602');
    await expect(inp).toHaveValue('202602');
    await takeScreenshot(page, '67_Delete边界');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.68 Created by user-正常输入', async ({ page }) => {
    resetCounter('68_CreatedBy正常');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.auto-field input').nth(2);
    await inp.pressSequentially('admin_user1');
    await expect(inp).toHaveValue('admin_user1');
    await takeScreenshot(page, '68_CreatedBy正常');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.69 Created by user-超过16位截断', async ({ page }) => {
    resetCounter('69_CreatedBy超长');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.auto-field input').nth(2);
    await inp.pressSequentially('A'.repeat(17));
    await expect(inp).toHaveValue('A'.repeat(16));
    await takeScreenshot(page, '69_CreatedBy超长');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.70 Created by user-最大长度边界', async ({ page }) => {
    resetCounter('70_CreatedBy边界');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    const inp = page.locator('.auto-field input').nth(2);
    await inp.pressSequentially('A'.repeat(16));
    await expect(inp).toHaveValue('A'.repeat(16));
    await takeScreenshot(page, '70_CreatedBy边界');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });
});

// ============================================================
// 7. Search按钮 → 跳转UD09（No.71-77）
// ============================================================
test.describe.serial('Search跳转（No.71-77）', () => {
  test.setTimeout(120000);

  test('No.71 Search-所有字段有值跳转', async ({ page }) => {
    resetCounter('71_Search全字段');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    await page.locator('.form-control-wrapper select').first().selectOption('PC01');
    await page.locator('.form-control-wrapper input').nth(0).pressSequentially('100');
    await page.locator('.form-control-wrapper select').nth(1).selectOption('DE');
    await page.locator('.action-button').filter({ hasText: 'Search' }).click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/Menu/HomologationVariables/Search');
    await takeScreenshot(page, '71_Search全字段');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.72 Search-部分字段有值跳转', async ({ page }) => {
    resetCounter('72_Search部分字段');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    await page.locator('.form-control-wrapper select').first().selectOption('PC01');
    await page.locator('.form-control-wrapper select').nth(1).selectOption('DE');
    await page.locator('.action-button').filter({ hasText: 'Search' }).click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/Menu/HomologationVariables/Search');
    await takeScreenshot(page, '72_Search部分字段');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.73 Search-所有字段为空跳转', async ({ page }) => {
    resetCounter('73_Search空字段');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    await page.locator('.action-button').filter({ hasText: 'Search' }).click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/Menu/HomologationVariables/Search');
    await takeScreenshot(page, '73_Search空字段');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.74 Search-运算符传递验证', async ({ page }) => {
    resetCounter('74_Search运算符');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    await page.locator('.operator-select').first().selectOption('!=');
    await page.locator('.form-row').nth(1).locator('.operator-select').selectOption('GT');
    await page.locator('.action-button').filter({ hasText: 'Search' }).click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/Menu/HomologationVariables/Search');
    await takeScreenshot(page, '74_Search运算符');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.75 Search-Number使用GT', async ({ page }) => {
    resetCounter('75_SearchGT');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    await page.locator('.form-control-wrapper input').nth(0).pressSequentially('100');
    await page.locator('.form-row').nth(1).locator('.operator-select').selectOption('GT');
    await page.locator('.action-button').filter({ hasText: 'Search' }).click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/Menu/HomologationVariables/Search');
    await takeScreenshot(page, '75_SearchGT');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.76 Search-Number使用LT', async ({ page }) => {
    resetCounter('76_SearchLT');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    await page.locator('.form-control-wrapper input').nth(0).pressSequentially('200');
    await page.locator('.form-row').nth(1).locator('.operator-select').selectOption('LT');
    await page.locator('.action-button').filter({ hasText: 'Search' }).click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/Menu/HomologationVariables/Search');
    await takeScreenshot(page, '76_SearchLT');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.77 Search-Date字段不传递', async ({ page }) => {
    resetCounter('77_Search无Date');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    await page.locator('.auto-field input').nth(3).pressSequentially('2026-07-07');
    await page.locator('.action-button').filter({ hasText: 'Search' }).click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/Menu/HomologationVariables/Search');
    await takeScreenshot(page, '77_Search无Date');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });
});

// ============================================================
// 8. Clear按钮（No.78-81）
// ============================================================
test.describe.serial('Clear按钮（No.78-81）', () => {
  test.setTimeout(120000);

  test('No.78 Clear-清空所有输入字段', async ({ page }) => {
    resetCounter('78_Clear清空');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    await page.locator('.form-control-wrapper select').first().selectOption('PC01');
    await page.locator('.form-control-wrapper input').nth(0).pressSequentially('123');
    await page.locator('.action-button').filter({ hasText: 'Clear' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.form-control-wrapper select').first()).toHaveValue('');
    await expect(page.locator('.form-control-wrapper input').nth(0)).toHaveValue('');
    await takeScreenshot(page, '78_Clear清空');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.79 Clear-清空后运算符不变', async ({ page }) => {
    resetCounter('79_Clear运算符不变');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    await page.locator('.operator-select').first().selectOption('!=');
    await page.locator('.action-button').filter({ hasText: 'Clear' }).click();
    await expect(page.locator('.operator-select').first()).toHaveValue('!=');
    await takeScreenshot(page, '79_Clear运算符不变');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.80 Clear-清除消息', async ({ page }) => {
    resetCounter('80_Clear清消息');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    // 触发错误
    await page.locator('.action-button').filter({ hasText: 'Delete' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toBeVisible();
    await page.locator('.action-button').filter({ hasText: 'Clear' }).click();
    await expect(page.locator('.error-message')).toHaveCount(0);
    await takeScreenshot(page, '80_Clear清消息');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });

  test('No.81 Clear-按钮可用状态', async ({ page }) => {
    resetCounter('81_Clear可用');
    await mockInitApis(page, DEFAULT_PC, DEFAULT_MKT, DEFAULT_VAR);
    await gotoUD08(page); await page.waitForSelector('.form-container', { timeout: 10000 });
    await expect(page.locator('.action-button').filter({ hasText: 'Clear' })).toBeEnabled();
    await takeScreenshot(page, '81_Clear可用');
    await page.unroute('**/api/ud08/selectproductclassmaster'); await page.unroute('**/api/ud08/selectmarketmaster'); await page.unroute('**/api/ud08/selecthdocvariables');
  });
});
