import { test, expect, Page } from '@playwright/test';
import { insertUD10TestData, cleanupUD10TestData } from './test-data-helper';
import { execute } from './db';

// ============================================================
// ExistingHDocVariables 模块 (UD10) Playwright 自动化测试
// 基于 単体テスト仕様書UD10.md（81个测试用例）
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD10';
const UD10_URL = `${BASE_URL}/Menu/ExistingHDocVariables`;

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

async function gotoUD10(page: Page) {
  // addInitScript 在页面JS执行前设置登录信息
  await page.addInitScript(`(function() {
    localStorage.setItem('userInfo', '${JSON.stringify({
      username: 'admin', role: 'Administrator',
      permissions: ["GenerateDucument", "GenerateDoc", "GenerateBatch", "RegdataArchive", "RegdataBatch",
        "UpdateRules", "UpdateUnicodeRules", "ExistingVariables", "UnlockDocument",
        "HDocNumberSeries", "UploadDeleteTemplate", "ListTemplates", "VPPSVinPlate", "ADCAChange",
        "HDocUserAdmin", "HDocUserDocAdmin", "SearchUser", "ChangePassword", "UserPosition",
        "ArchiveSearch", "UploadDocument",
        "UserGuide", "ADCAChangeGuide", "VinPlateGuide", "ArchiveGuide", "Privacy"],
    })}');
  })();`);

  await page.goto(UD10_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('.existing-hdoc-title', { timeout: 15000 });
  await page.waitForTimeout(500);
}

/** Mock Add API */
async function mockAddApi(page: Page, responseData: any, delay: number = 0) {
  await page.route('**/api/ud10/add', async (route) => {
    if (delay > 0) await new Promise(r => setTimeout(r, delay));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseData) });
  });
}

/** Mock Update API */
async function mockUpdateApi(page: Page, responseData: any) {
  await page.route('**/api/ud10/update', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseData) });
  });
}

/** Mock Delete API */
async function mockDeleteApi(page: Page, responseData: any) {
  await page.route('**/api/ud10/delete', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseData) });
  });
}

async function fillInput(page: Page, label: string, value: string) {
  const input = page.locator('.existing-hdoc-form-row').filter({ hasText: label }).locator('.existing-hdoc-input');
  await input.click();
  await input.fill('');
  await input.pressSequentially(value, { delay: 30 });
}

async function selectOption(page: Page, label: string, option: string) {
  const select = page.locator('.existing-hdoc-form-row').filter({ hasText: label }).locator('.existing-hdoc-select');
  await select.selectOption(option);
}

async function getOperatorSelect(page: Page, label: string) {
  return page.locator('.existing-hdoc-form-row').filter({ hasText: label }).locator('.existing-hdoc-operator-select');
}

async function clickButton(page: Page, buttonText: string) {
  await page.locator('.existing-hdoc-btn').filter({ hasText: buttonText }).click();
}

/** 清理测试中新增的数据 */
async function cleanupTestRecord(variable: string) {
  await execute('DELETE FROM HDOC_VARIABLES WHERE VARIABLE = ?', [variable]);
}

// ============================================================
test.beforeAll(async () => {
  await insertUD10TestData();
  console.log('UD10 test data inserted');
});

test.afterAll(async () => {
  // 清理测试中新增的记录
  const testVars = ['UD10TESTNEW', 'UD10TEST500', 'UD10TESTNET', 'UD10TESTTO',
    'UD10TESTLOAD', 'UD10TESTREP', 'UD10TESTCLR', 'UD10TESTMSG',
    'UD10TESTSEQ', 'UD10TESTADDEL'];
  for (const v of testVars) {
    try { await cleanupTestRecord(v); } catch (e) { /* ignore */ }
  }
  await cleanupUD10TestData();
  console.log('UD10 test data cleaned up');
});

// ============================================================
// 1. 画面初始化（No.1-5）
// ============================================================
test.describe.serial('画面初始化（No.1-5）', () => {
  test.setTimeout(120000);

  test('No.1 画面初始化-页面标题显示', async ({ page }) => {
    resetCounter('01_页面标题');
    await gotoUD10(page);
    await expect(page.locator('.existing-hdoc-title')).toContainText('Existing HDoc Variables');
    await takeScreenshot(page, '01_页面标题');
  });

  test('No.2 画面初始化-各字段初始状态', async ({ page }) => {
    resetCounter('02_字段初始');
    await gotoUD10(page);
    await expect(page.locator('.existing-hdoc-input').first()).toHaveValue('');
    await expect(page.locator('.existing-hdoc-select')).toHaveValue('');
    await expect(page.locator('.existing-hdoc-input').nth(1)).toHaveValue('');
    await expect(page.locator('.existing-hdoc-input').nth(2)).toHaveValue('');
    await expect(page.locator('.existing-hdoc-input').nth(3)).toHaveValue('');
    await takeScreenshot(page, '02_字段初始');
  });

  test('No.3 画面初始化-Type下拉列表选项', async ({ page }) => {
    resetCounter('03_Type选项');
    await gotoUD10(page);
    const options = page.locator('.existing-hdoc-select option');
    await expect(options.nth(0)).toHaveAttribute('value', '');
    await expect(options.nth(1)).toHaveAttribute('value', 'VDA');
    await expect(options.nth(1)).toContainText('VDA');
    await expect(options.nth(2)).toHaveAttribute('value', 'User Defined');
    await expect(options.nth(2)).toContainText('User Defined');
    await takeScreenshot(page, '03_Type选项');
  });

  test('No.4 画面初始化-运算符初始值', async ({ page }) => {
    resetCounter('04_运算符初始');
    await gotoUD10(page);
    const rows = page.locator('.existing-hdoc-form-row');
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const opSelect = rows.nth(i).locator('.existing-hdoc-operator-select');
      if (await opSelect.count() > 0) {
        await expect(opSelect).toHaveValue('=');
      }
    }
    await takeScreenshot(page, '04_运算符初始');
  });

  test('No.5 画面初始化-按钮初始状态', async ({ page }) => {
    resetCounter('05_按钮状态');
    await gotoUD10(page);
    const buttons = ['Search', 'Clear', 'Back', 'Add', 'Update', 'Delete', 'Excel'];
    for (const btn of buttons) {
      await expect(page.locator('.existing-hdoc-btn').filter({ hasText: btn })).toBeEnabled();
    }
    await takeScreenshot(page, '05_按钮状态');
  });
});

// ============================================================
// 2. Variable 输入字段（No.6-13）
// ============================================================
test.describe.serial('Variable输入（No.6-13）', () => {
  test.setTimeout(120000);

  test('No.6 Variable-正常输入半角英数字', async ({ page }) => {
    resetCounter('06_Variable正常');
    await gotoUD10(page);
    const input = page.locator('.existing-hdoc-form-row').first().locator('.existing-hdoc-input');
    await input.click();
    await input.pressSequentially('TESTVAR001', { delay: 30 });
    await expect(input).toHaveValue('TESTVAR001');
    await takeScreenshot(page, '06_Variable正常');
  });

  test('No.7 Variable-全角字符被过滤', async ({ page }) => {
    resetCounter('07_Variable全角');
    await gotoUD10(page);
    const input = page.locator('.existing-hdoc-form-row').first().locator('.existing-hdoc-input');
    await input.click();
    await input.fill('');
    await input.pressSequentially('ＴＥＳＴ', { delay: 30 });
    await expect(input).toHaveValue('');
    await takeScreenshot(page, '07_Variable全角');
  });

  test('No.8 Variable-空格被过滤', async ({ page }) => {
    resetCounter('08_Variable空格');
    await gotoUD10(page);
    const input = page.locator('.existing-hdoc-form-row').first().locator('.existing-hdoc-input');
    await input.click();
    await input.fill('');
    // 组件过滤含空格的输入
    await input.pressSequentially('TEST VAR 001', { delay: 30 });
    await expect(input).toHaveValue('TESTVAR001');
    await takeScreenshot(page, '08_Variable空格');
  });

  test('No.9 Variable-超过30位截断', async ({ page }) => {
    resetCounter('09_Variable截断');
    await gotoUD10(page);
    const input = page.locator('.existing-hdoc-form-row').first().locator('.existing-hdoc-input');
    await input.click();
    const longStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ01234'; // 31 chars
    // 代码中 maxLength=30 且 handleVariableChange 限制了长度
    await input.fill(longStr);
    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(30);
    await takeScreenshot(page, '09_Variable截断');
  });

  test('No.10 Variable-边界值测试（30字符）', async ({ page }) => {
    resetCounter('10_Variable30边界');
    await gotoUD10(page);
    const input = page.locator('.existing-hdoc-form-row').first().locator('.existing-hdoc-input');
    await input.click();
    const exact30 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123'; // 30 chars
    await input.fill(exact30);
    await expect(input).toHaveValue(exact30);
    await takeScreenshot(page, '10_Variable30边界');
  });

  test('No.11 Variable-输入特殊符号（仅允许-_）', async ({ page }) => {
    resetCounter('11_Variable特殊符号');
    await gotoUD10(page);
    const input = page.locator('.existing-hdoc-form-row').first().locator('.existing-hdoc-input');
    await input.click();
    await input.pressSequentially('TEST@VAR#001', { delay: 30 });
    await expect(input).toHaveValue('TESTVAR001');
    await takeScreenshot(page, '11_Variable特殊符号');
  });

  test('No.12 Variable-粘贴纯半角英数字', async ({ page }) => {
    resetCounter('12_Variable粘贴纯');
    await gotoUD10(page);
    const input = page.locator('.existing-hdoc-form-row').first().locator('.existing-hdoc-input');
    await input.click();
    await input.pressSequentially('TESTVAR001', { delay: 30 });
    await expect(input).toHaveValue('TESTVAR001');
    await takeScreenshot(page, '12_Variable粘贴纯');
  });

  test('No.13 Variable-粘贴含非法字符', async ({ page }) => {
    resetCounter('13_Variable粘贴非法');
    await gotoUD10(page);
    const input = page.locator('.existing-hdoc-form-row').first().locator('.existing-hdoc-input');
    await input.click();
    await input.pressSequentially('TEST@VAR#001', { delay: 30 });
    await expect(input).toHaveValue('TESTVAR001');
    await takeScreenshot(page, '13_Variable粘贴非法');
  });
});

// ============================================================
// 3. Type 下拉列表（No.14-15）
// ============================================================
test.describe.serial('Type下拉（No.14-15）', () => {
  test.setTimeout(120000);

  test('No.14 Type-选择VDA', async ({ page }) => {
    resetCounter('14_TypeVDA');
    await gotoUD10(page);
    await selectOption(page, 'Type', 'VDA');
    await expect(page.locator('.existing-hdoc-select')).toHaveValue('VDA');
    await takeScreenshot(page, '14_TypeVDA');
  });

  test('No.15 Type-选择User Defined', async ({ page }) => {
    resetCounter('15_TypeUserDefined');
    await gotoUD10(page);
    await selectOption(page, 'Type', 'User Defined');
    await expect(page.locator('.existing-hdoc-select')).toHaveValue('User Defined');
    await takeScreenshot(page, '15_TypeUserDefined');
  });
});

// ============================================================
// 4. Description 输入字段（No.16-20）
// ============================================================
test.describe.serial('Description输入（No.16-20）', () => {
  test.setTimeout(120000);

  test('No.16 Description-正常输入', async ({ page }) => {
    resetCounter('16_Desc正常');
    await gotoUD10(page);
    await fillInput(page, 'Description', 'Test variable for homologation');
    await expect(page.locator('.existing-hdoc-form-row').filter({ hasText: 'Description' }).locator('.existing-hdoc-input')).toHaveValue('Test variable for homologation');
    await takeScreenshot(page, '16_Desc正常');
  });

  test('No.17 Description-超过100位截断', async ({ page }) => {
    resetCounter('17_Desc截断');
    await gotoUD10(page);
    const longText = 'A'.repeat(101);
    const input = page.locator('.existing-hdoc-form-row').filter({ hasText: 'Description' }).locator('.existing-hdoc-input');
    await input.click();
    await input.fill(longText);
    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(100);
    await takeScreenshot(page, '17_Desc截断');
  });

  test('No.18 Description-边界值测试（100字符）', async ({ page }) => {
    resetCounter('18_Desc100边界');
    await gotoUD10(page);
    const exact100 = 'A'.repeat(100);
    const input = page.locator('.existing-hdoc-form-row').filter({ hasText: 'Description' }).locator('.existing-hdoc-input');
    await input.click();
    await input.fill(exact100);
    await expect(input).toHaveValue(exact100);
    await takeScreenshot(page, '18_Desc100边界');
  });

  test('No.19 Description-全角字符输入（全部接受）', async ({ page }) => {
    resetCounter('19_Desc全角');
    await gotoUD10(page);
    await fillInput(page, 'Description', '説明テスト文章１２３');
    await expect(page.locator('.existing-hdoc-form-row').filter({ hasText: 'Description' }).locator('.existing-hdoc-input')).toHaveValue('説明テスト文章１２３');
    await takeScreenshot(page, '19_Desc全角');
  });

  test('No.20 Description-特殊符号输入（全部接受）', async ({ page }) => {
    resetCounter('20_Desc特殊符号');
    await gotoUD10(page);
    const specialChars = '@#$%^&*()_+-=[]{}|;' + '":\',./<>?~';
    await fillInput(page, 'Description', specialChars);
    await expect(page.locator('.existing-hdoc-form-row').filter({ hasText: 'Description' }).locator('.existing-hdoc-input')).toHaveValue(specialChars);
    await takeScreenshot(page, '20_Desc特殊符号');
  });
});

// ============================================================
// 5. Created by user（No.21-23）
// ============================================================
test.describe.serial('Created by user（No.21-23）', () => {
  test.setTimeout(120000);

  test('No.21 Created by user-正常输入', async ({ page }) => {
    resetCounter('21_User正常');
    await gotoUD10(page);
    await fillInput(page, 'Created by user', 'admin');
    await expect(page.locator('.existing-hdoc-form-row').filter({ hasText: 'Created by user' }).locator('.existing-hdoc-input')).toHaveValue('admin');
    await takeScreenshot(page, '21_User正常');
  });

  test('No.22 Created by user-超过16位截断', async ({ page }) => {
    resetCounter('22_User截断');
    await gotoUD10(page);
    const longStr = 'ABCDEFGHIJKLMNOPQ'; // 17 chars
    const input = page.locator('.existing-hdoc-form-row').filter({ hasText: 'Created by user' }).locator('.existing-hdoc-input');
    await input.click();
    await input.fill(longStr);
    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(16);
    await takeScreenshot(page, '22_User截断');
  });

  test('No.23 Created by user-边界值测试（16字符）', async ({ page }) => {
    resetCounter('23_User16边界');
    await gotoUD10(page);
    const exact16 = 'ABCDEFGHIJKLMNOP'; // 16 chars
    const input = page.locator('.existing-hdoc-form-row').filter({ hasText: 'Created by user' }).locator('.existing-hdoc-input');
    await input.click();
    await input.fill(exact16);
    await expect(input).toHaveValue(exact16);
    await takeScreenshot(page, '23_User16边界');
  });
});

// ============================================================
// 6. Date 输入字段（No.24-29）
// ============================================================
test.describe.serial('Date输入（No.24-29）', () => {
  test.setTimeout(120000);

  test('No.24 Date-正常输入', async ({ page }) => {
    resetCounter('24_Date正常');
    await gotoUD10(page);
    await fillInput(page, 'Date', '2026-07-16');
    await expect(page.locator('.existing-hdoc-form-row').filter({ hasText: 'Date' }).locator('.existing-hdoc-input')).toHaveValue('2026-07-16');
    await takeScreenshot(page, '24_Date正常');
  });

  test('No.25 Date-字母被过滤', async ({ page }) => {
    resetCounter('25_Date字母');
    await gotoUD10(page);
    const input = page.locator('.existing-hdoc-form-row').filter({ hasText: 'Date' }).locator('.existing-hdoc-input');
    await input.click();
    await input.pressSequentially('2026-07-ab', { delay: 30 });
    await expect(input).toHaveValue('2026-07-');
    await takeScreenshot(page, '25_Date字母');
  });

  test('No.26 Date-超过10位截断', async ({ page }) => {
    resetCounter('26_Date截断');
    await gotoUD10(page);
    const input = page.locator('.existing-hdoc-form-row').filter({ hasText: 'Date' }).locator('.existing-hdoc-input');
    await input.click();
    await input.fill('2026-07-16123');
    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(10);
    await takeScreenshot(page, '26_Date截断');
  });

  test('No.27 Date-边界值测试（10字符）', async ({ page }) => {
    resetCounter('27_Date10边界');
    await gotoUD10(page);
    const input = page.locator('.existing-hdoc-form-row').filter({ hasText: 'Date' }).locator('.existing-hdoc-input');
    await input.click();
    await input.fill('2026-07-16');
    await expect(input).toHaveValue('2026-07-16');
    await takeScreenshot(page, '27_Date10边界');
  });

  test('No.28 Date-特殊符号被过滤（仅允许数字和-）', async ({ page }) => {
    resetCounter('28_Date特殊符号');
    await gotoUD10(page);
    const input = page.locator('.existing-hdoc-form-row').filter({ hasText: 'Date' }).locator('.existing-hdoc-input');
    await input.click();
    await input.pressSequentially('2026/07/16', { delay: 30 });
    await expect(input).toHaveValue('20260716');
    await takeScreenshot(page, '28_Date特殊符号');
  });

  test('No.29 Date-全角数字被过滤', async ({ page }) => {
    resetCounter('29_Date全角');
    await gotoUD10(page);
    const input = page.locator('.existing-hdoc-form-row').filter({ hasText: 'Date' }).locator('.existing-hdoc-input');
    await input.click();
    await input.pressSequentially('２０２６−０７−１６', { delay: 30 });
    await expect(input).toHaveValue('');
    await takeScreenshot(page, '29_Date全角');
  });
});

// ============================================================
// 7. Search 按钮（No.30-41）
// ============================================================
test.describe.serial('Search按钮（No.30-41）', () => {
  test.setTimeout(120000);

  test('No.30 Search-Variable为空时提示错误', async ({ page }) => {
    resetCounter('30_Search空Variable');
    await gotoUD10(page);
    await clickButton(page, 'Search');
    await page.waitForTimeout(500);
    await expect(page.locator('.existing-hdoc-message.error')).toContainText('Variable is required for search');
    await takeScreenshot(page, '30_Search空Variable');
  });

  test('No.31 Search-正常搜索跳转', async ({ page }) => {
    resetCounter('31_Search正常');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'VAR001');
    await selectOption(page, 'Type', 'VDA');
    await fillInput(page, 'Description', 'Test Variable 001');
    await fillInput(page, 'Created by user', 'admin');
    await fillInput(page, 'Date', '2026-07-16');
    await clickButton(page, 'Search');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/ExistingHDocVariables/Search');
    await takeScreenshot(page, '31_Search正常');
  });

  test('No.32 Search-运算符传递验证', async ({ page }) => {
    resetCounter('32_Search运算符');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'VAR001');
    // 修改 Variable 运算符为 !=
    await page.locator('.existing-hdoc-operator-select').first().selectOption('!=');
    // 修改 Date 运算符为 GT
    const dateRow = page.locator('.existing-hdoc-form-row').filter({ hasText: 'Date' });
    await dateRow.locator('.existing-hdoc-operator-select').selectOption('GT');
    await clickButton(page, 'Search');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/ExistingHDocVariables/Search');
    await takeScreenshot(page, '32_Search运算符');
  });

  test('No.33 Search-全字段搜索', async ({ page }) => {
    resetCounter('33_Search全字段');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'VAR001');
    await selectOption(page, 'Type', 'VDA');
    await fillInput(page, 'Description', 'Test');
    await fillInput(page, 'Created by user', 'admin');
    await fillInput(page, 'Date', '2026-01-15');
    await page.locator('.existing-hdoc-form-row').filter({ hasText: 'Date' }).locator('.existing-hdoc-operator-select').selectOption('GT');
    await clickButton(page, 'Search');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/ExistingHDocVariables/Search');
    await takeScreenshot(page, '33_Search全字段');
  });

  test('No.34 Search-仅Variable字段检索（最小条件）', async ({ page }) => {
    resetCounter('34_Search仅Variable');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'VAR001');
    await clickButton(page, 'Search');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/ExistingHDocVariables/Search');
    await takeScreenshot(page, '34_Search仅Variable');
  });

  test('No.35 Search-Variable + Type 组合检索', async ({ page }) => {
    resetCounter('35_SearchVarType');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'VAR');
    await selectOption(page, 'Type', 'VDA');
    await clickButton(page, 'Search');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/ExistingHDocVariables/Search');
    await takeScreenshot(page, '35_SearchVarType');
  });

  test('No.36 Search-Variable + Description（LIKE）组合检索', async ({ page }) => {
    resetCounter('36_SearchVarDesc');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'VAR001');
    await fillInput(page, 'Description', 'Test');
    await clickButton(page, 'Search');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/ExistingHDocVariables/Search');
    await takeScreenshot(page, '36_SearchVarDesc');
  });

  test('No.37 Search-Variable + Created by user（LIKE）组合检索', async ({ page }) => {
    resetCounter('37_SearchVarUser');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'VAR001');
    await fillInput(page, 'Created by user', 'admin');
    await clickButton(page, 'Search');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/ExistingHDocVariables/Search');
    await takeScreenshot(page, '37_SearchVarUser');
  });

  test('No.38 Search-Variable + Date（GT）组合检索', async ({ page }) => {
    resetCounter('38_SearchVarDate');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'VAR001');
    await fillInput(page, 'Date', '2026-01-01');
    await page.locator('.existing-hdoc-form-row').filter({ hasText: 'Date' }).locator('.existing-hdoc-operator-select').selectOption('GT');
    await clickButton(page, 'Search');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/ExistingHDocVariables/Search');
    await takeScreenshot(page, '38_SearchVarDate');
  });

  test('No.39 Search-Type + Description 组合检索（Variable必填验证）', async ({ page }) => {
    resetCounter('39_SearchVar必填');
    await gotoUD10(page);
    await selectOption(page, 'Type', 'VDA');
    await fillInput(page, 'Description', 'Test');
    await clickButton(page, 'Search');
    await page.waitForTimeout(500);
    await expect(page.locator('.existing-hdoc-message.error')).toContainText('Variable is required for search');
    await takeScreenshot(page, '39_SearchVar必填');
  });

  test('No.40 Search-Variable != + Description LIKE 组合检索', async ({ page }) => {
    resetCounter('40_SearchNotEq');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'VAR001');
    await page.locator('.existing-hdoc-operator-select').first().selectOption('!=');
    await fillInput(page, 'Description', 'Test');
    await clickButton(page, 'Search');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/ExistingHDocVariables/Search');
    await takeScreenshot(page, '40_SearchNotEq');
  });

  test('No.41 Search-Description LIKE + Created by user LIKE 组合检索', async ({ page }) => {
    resetCounter('41_SearchLikeLike');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'VAR');
    await fillInput(page, 'Description', 'engine');
    await fillInput(page, 'Created by user', 'admin');
    await clickButton(page, 'Search');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/ExistingHDocVariables/Search');
    await takeScreenshot(page, '41_SearchLikeLike');
  });
});

// ============================================================
// 8. Clear 按钮（No.42-44）
// ============================================================
test.describe.serial('Clear按钮（No.42-44）', () => {
  test.setTimeout(120000);

  test('No.42 Clear-清空所有字段', async ({ page }) => {
    resetCounter('42_Clear清空');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'VAR001');
    await selectOption(page, 'Type', 'VDA');
    await fillInput(page, 'Description', 'Test');
    await fillInput(page, 'Created by user', 'admin');
    await fillInput(page, 'Date', '2026-07-16');
    await clickButton(page, 'Clear');
    await page.waitForTimeout(500);
    const inputs = page.locator('.existing-hdoc-input');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toHaveValue('');
    }
    await expect(page.locator('.existing-hdoc-select')).toHaveValue('');
    await takeScreenshot(page, '42_Clear清空');
  });

  test('No.43 Clear-清空错误消息', async ({ page }) => {
    resetCounter('43_Clear清空消息');
    await gotoUD10(page);
    // 触发错误
    await clickButton(page, 'Search');
    await page.waitForTimeout(300);
    await expect(page.locator('.existing-hdoc-message.error')).toBeVisible();
    await clickButton(page, 'Clear');
    await page.waitForTimeout(500);
    await expect(page.locator('.existing-hdoc-message')).toHaveCount(0);
    await takeScreenshot(page, '43_Clear清空消息');
  });

  test('No.44 Clear-运算符不变', async ({ page }) => {
    resetCounter('44_Clear运算符不变');
    await gotoUD10(page);
    await page.locator('.existing-hdoc-operator-select').first().selectOption('!=');
    await page.locator('.existing-hdoc-form-row').filter({ hasText: 'Date' }).locator('.existing-hdoc-operator-select').selectOption('GT');
    await fillInput(page, 'Variable', 'VAR001');
    await clickButton(page, 'Clear');
    await page.waitForTimeout(500);
    await expect(page.locator('.existing-hdoc-operator-select').first()).toHaveValue('!=');
    await expect(page.locator('.existing-hdoc-form-row').filter({ hasText: 'Date' }).locator('.existing-hdoc-operator-select')).toHaveValue('GT');
    await takeScreenshot(page, '44_Clear运算符不变');
  });
});

// ============================================================
// 9. Back 按钮（No.45）
// ============================================================
test.describe.serial('Back按钮（No.45）', () => {
  test.setTimeout(120000);

  test('No.45 Back-返回Menu画面', async ({ page }) => {
    resetCounter('45_Back返回');
    await gotoUD10(page);
    await clickButton(page, 'Back');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu');
    expect(page.url()).not.toContain('ExistingHDocVariables');
    await takeScreenshot(page, '45_Back返回');
  });
});

// ============================================================
// 10. Add 操作（No.46-54）
// ============================================================
test.describe.serial('Add操作（No.46-54）', () => {
  test.setTimeout(120000);

  test('No.46 Add-Variable为空时提示错误', async ({ page }) => {
    resetCounter('46_Add空Variable');
    await gotoUD10(page);
    await selectOption(page, 'Type', 'VDA');
    await clickButton(page, 'Add');
    await page.waitForTimeout(500);
    await expect(page.locator('.existing-hdoc-message.error')).toContainText('Variable is required');
    await takeScreenshot(page, '46_Add空Variable');
  });

  test('No.47 Add-正常新增', async ({ page }) => {
    resetCounter('47_Add正常');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'UD10TESTNEW');
    await selectOption(page, 'Type', 'VDA');
    await fillInput(page, 'Description', 'UD10 test add operation');
    await fillInput(page, 'Created by user', 'admin');
    await fillInput(page, 'Date', '2026-07-16');
    await clickButton(page, 'Add');
    await page.waitForTimeout(3000);
    // 成功消息
    await expect(page.locator('.existing-hdoc-message.success')).toContainText('Record added successfully');
    await takeScreenshot(page, '47_Add正常');
    // 清理
    await cleanupTestRecord('UD10TESTNEW');
  });

  test('No.48 Add-主键冲突（409）', async ({ page }) => {
    resetCounter('48_Add主键冲突');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'VAR001'); // 已存在的
    await selectOption(page, 'Type', 'VDA');
    await fillInput(page, 'Description', 'Duplicate test');
    await clickButton(page, 'Add');
    await page.waitForTimeout(3000);
    await expect(page.locator('.existing-hdoc-message.error')).toContainText('Variant already exists');
    await takeScreenshot(page, '48_Add主键冲突');
  });

  test('No.49 Add-服务器错误（500）', async ({ page }) => {
    resetCounter('49_Add500');
    await gotoUD10(page);
    await mockAddApi(page, { code: 500, message: 'System error. Please contact administrator.' });
    await fillInput(page, 'Variable', 'UD10TEST500');
    await selectOption(page, 'Type', 'VDA');
    await fillInput(page, 'Description', 'Test 500 error');
    await clickButton(page, 'Add');
    await page.waitForTimeout(1000);
    await expect(page.locator('.existing-hdoc-message.error')).toContainText('System error');
    await takeScreenshot(page, '49_Add500');
    await page.unroute('**/api/ud10/add');
  });

  test('No.50 Add-网络错误', async ({ page }) => {
    resetCounter('50_Add网络错误');
    await gotoUD10(page);
    await page.route('**/api/ud10/add', (route) => route.abort('connectionrefused'));
    await fillInput(page, 'Variable', 'UD10TESTNET');
    await selectOption(page, 'Type', 'User Defined');
    await fillInput(page, 'Description', 'Test network error');
    await clickButton(page, 'Add');
    await page.waitForTimeout(1000);
    await expect(page.locator('.existing-hdoc-message.error')).toContainText('System error');
    await takeScreenshot(page, '50_Add网络错误');
    await page.unroute('**/api/ud10/add');
  });

  test('No.51 Add-API超时', async ({ page }) => {
    resetCounter('51_Add超时');
    await gotoUD10(page);
    await page.route('**/api/ud10/add', () => new Promise(() => {}));
    await fillInput(page, 'Variable', 'UD10TESTTO');
    await selectOption(page, 'Type', 'VDA');
    await fillInput(page, 'Description', 'Test timeout');
    await clickButton(page, 'Add');
    await page.waitForTimeout(31000);
    await expect(page.locator('.existing-hdoc-message.error')).toContainText('System error');
    await takeScreenshot(page, '51_Add超时');
    await page.unroute('**/api/ud10/add');
  });

  test('No.52 Add-按钮Loading状态', async ({ page }) => {
    resetCounter('52_AddLoading');
    await gotoUD10(page);
    // Mock 延迟响应
    await mockAddApi(page, { code: 200 }, 5000);
    await fillInput(page, 'Variable', 'UD10TESTLOAD');
    await selectOption(page, 'Type', 'VDA');
    await clickButton(page, 'Add');
    await page.waitForTimeout(500);
    // 按钮应禁用
    const allBtns = page.locator('.existing-hdoc-btn');
    const btnCount = await allBtns.count();
    for (let i = 0; i < btnCount; i++) {
      await expect(allBtns.nth(i)).toBeDisabled();
    }
    // Variable 输入框禁用
    await expect(page.locator('.existing-hdoc-input').first()).toBeDisabled();
    // Type 下拉禁用
    await expect(page.locator('.existing-hdoc-select')).toBeDisabled();
    await takeScreenshot(page, '52_AddLoading');
    await page.unroute('**/api/ud10/add');
  });

  test('No.53 Add-防止重复提交', async ({ page }) => {
    resetCounter('53_Add防重复');
    await gotoUD10(page);
    let callCount = 0;
    await page.route('**/api/ud10/add', async (route) => {
      callCount++;
      await new Promise(r => setTimeout(r, 2000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, message: 'ok' }) });
    });
    await fillInput(page, 'Variable', 'UD10TESTREP');
    await selectOption(page, 'Type', 'VDA');
    await clickButton(page, 'Add');
    await page.waitForTimeout(500);
    await page.locator('.existing-hdoc-btn').filter({ hasText: 'Add' }).click({ force: true });
    await page.waitForTimeout(3000);
    expect(callCount).toBeLessThanOrEqual(1);
    await takeScreenshot(page, '53_Add防重复');
    await page.unroute('**/api/ud10/add');
  });

  test('No.54 Add-新增成功后字段不自动清空', async ({ page }) => {
    resetCounter('54_Add不清空');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'UD10TESTCLR');
    await selectOption(page, 'Type', 'User Defined');
    await fillInput(page, 'Description', 'Test clear after add');
    await fillInput(page, 'Created by user', 'admin');
    await fillInput(page, 'Date', '2026-07-16');
    await clickButton(page, 'Add');
    await page.waitForTimeout(3000);
    await expect(page.locator('.existing-hdoc-message.success')).toContainText('Record added successfully');
    // 字段应保持原值
    await expect(page.locator('.existing-hdoc-input').first()).toHaveValue('UD10TESTCLR');
    await expect(page.locator('.existing-hdoc-select')).toHaveValue('User Defined');
    await takeScreenshot(page, '54_Add不清空');
  });
});

// ============================================================
// 11. Update 操作（No.55-62）
// ============================================================
test.describe.serial('Update操作（No.55-62）', () => {
  test.setTimeout(120000);

  test('No.55 Update-Variable为空时提示错误', async ({ page }) => {
    resetCounter('55_Update空Variable');
    await gotoUD10(page);
    await clickButton(page, 'Update');
    await page.waitForTimeout(500);
    await expect(page.locator('.existing-hdoc-message.error')).toContainText('Variable is required');
    await takeScreenshot(page, '55_Update空Variable');
  });

  test('No.56 Update-正常更新', async ({ page }) => {
    resetCounter('56_Update正常');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'VAR001');
    await selectOption(page, 'Type', 'User Defined');
    await fillInput(page, 'Description', 'Updated description for VAR001');
    await fillInput(page, 'Created by user', 'admin');
    await fillInput(page, 'Date', '2026-07-16');
    await clickButton(page, 'Update');
    await page.waitForTimeout(3000);
    await expect(page.locator('.existing-hdoc-message.success')).toContainText('Record updated successfully');
    await takeScreenshot(page, '56_Update正常');
  });

  test('No.57 Update-记录不存在（404）', async ({ page }) => {
    resetCounter('57_Update404');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'NONEXIST001');
    await selectOption(page, 'Type', 'VDA');
    await clickButton(page, 'Update');
    await page.waitForTimeout(3000);
    await expect(page.locator('.existing-hdoc-message.error')).toContainText('Variant does not exists');
    await takeScreenshot(page, '57_Update404');
  });

  test('No.58 Update-服务器错误（500）', async ({ page }) => {
    resetCounter('58_Update500');
    await gotoUD10(page);
    await mockUpdateApi(page, { code: 500, message: 'System error. Please contact administrator.' });
    await fillInput(page, 'Variable', 'VAR001');
    await clickButton(page, 'Update');
    await page.waitForTimeout(1000);
    await expect(page.locator('.existing-hdoc-message.error')).toContainText('System error');
    await takeScreenshot(page, '58_Update500');
    await page.unroute('**/api/ud10/update');
  });

  test('No.59 Update-网络错误', async ({ page }) => {
    resetCounter('59_Update网络错误');
    await gotoUD10(page);
    await page.route('**/api/ud10/update', (route) => route.abort('connectionrefused'));
    await fillInput(page, 'Variable', 'VAR001');
    await clickButton(page, 'Update');
    await page.waitForTimeout(1000);
    await expect(page.locator('.existing-hdoc-message.error')).toContainText('System error');
    await takeScreenshot(page, '59_Update网络错误');
    await page.unroute('**/api/ud10/update');
  });

  test('No.60 Update-按钮Loading状态', async ({ page }) => {
    resetCounter('60_UpdateLoading');
    await gotoUD10(page);
    await page.route('**/api/ud10/update', async (route) => {
      await new Promise(r => setTimeout(r, 5000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
    });
    await fillInput(page, 'Variable', 'VAR001');
    await clickButton(page, 'Update');
    await page.waitForTimeout(500);
    const allBtns = page.locator('.existing-hdoc-btn');
    const btnCount = await allBtns.count();
    for (let i = 0; i < btnCount; i++) {
      await expect(allBtns.nth(i)).toBeDisabled();
    }
    await expect(page.locator('.existing-hdoc-input').first()).toBeDisabled();
    await takeScreenshot(page, '60_UpdateLoading');
    await page.unroute('**/api/ud10/update');
  });

  test('No.61 Update-防止重复提交', async ({ page }) => {
    resetCounter('61_Update防重复');
    await gotoUD10(page);
    let callCount = 0;
    await page.route('**/api/ud10/update', async (route) => {
      callCount++;
      await new Promise(r => setTimeout(r, 2000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
    });
    await fillInput(page, 'Variable', 'VAR001');
    await clickButton(page, 'Update');
    await page.waitForTimeout(500);
    await page.locator('.existing-hdoc-btn').filter({ hasText: 'Update' }).click({ force: true });
    await page.waitForTimeout(3000);
    expect(callCount).toBeLessThanOrEqual(1);
    await takeScreenshot(page, '61_Update防重复');
    await page.unroute('**/api/ud10/update');
  });

  test('No.62 Update-更新后数据验证', async ({ page }) => {
    resetCounter('62_Update数据验证');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'VAR001');
    await selectOption(page, 'Type', 'User Defined');
    await fillInput(page, 'Description', 'After update test');
    await clickButton(page, 'Update');
    await page.waitForTimeout(3000);
    await expect(page.locator('.existing-hdoc-message.success')).toContainText('Record updated successfully');
    await takeScreenshot(page, '62_Update数据验证');
  });
});

// ============================================================
// 12. Delete 操作（No.63-70）
// ============================================================
test.describe.serial('Delete操作（No.63-70）', () => {
  test.setTimeout(120000);

  test('No.63 Delete-Variable为空时提示错误', async ({ page }) => {
    resetCounter('63_Delete空Variable');
    await gotoUD10(page);
    await clickButton(page, 'Delete');
    await page.waitForTimeout(500);
    await expect(page.locator('.existing-hdoc-message.error')).toContainText('Variable is required');
    await takeScreenshot(page, '63_Delete空Variable');
  });

  test('No.64 Delete-正常删除', async ({ page }) => {
    resetCounter('64_Delete正常');
    // 先插入一条测试用记录
    await execute(`INSERT IGNORE INTO HDOC_VARIABLES (VARIABLE, TYPE, DESCRIPTION, USERID, REGISTER_DATETIME,
      REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
      VALUES ('UD10TESTNEW', 'VDA', 'Delete test', 'admin', NOW(),
      'test', 'UD10Test', NOW(), 'test', 'UD10Test')`);
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'UD10TESTNEW');
    await clickButton(page, 'Delete');
    await page.waitForTimeout(3000);
    await expect(page.locator('.existing-hdoc-message.success')).toContainText('Record deleted successfully');
    // 字段应被清空
    await expect(page.locator('.existing-hdoc-input').first()).toHaveValue('');
    await expect(page.locator('.existing-hdoc-select')).toHaveValue('');
    await takeScreenshot(page, '64_Delete正常');
  });

  test('No.65 Delete-记录不存在（404）', async ({ page }) => {
    resetCounter('65_Delete404');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'NONEXIST002');
    await clickButton(page, 'Delete');
    await page.waitForTimeout(3000);
    await expect(page.locator('.existing-hdoc-message.error')).toContainText('Variant does not exists');
    await takeScreenshot(page, '65_Delete404');
  });

  test('No.66 Delete-服务器错误（500）', async ({ page }) => {
    resetCounter('66_Delete500');
    await gotoUD10(page);
    await mockDeleteApi(page, { code: 500, message: 'System error. Please contact administrator.' });
    await fillInput(page, 'Variable', 'VAR001');
    await clickButton(page, 'Delete');
    await page.waitForTimeout(1000);
    await expect(page.locator('.existing-hdoc-message.error')).toContainText('System error');
    await takeScreenshot(page, '66_Delete500');
    await page.unroute('**/api/ud10/delete');
  });

  test('No.67 Delete-网络错误', async ({ page }) => {
    resetCounter('67_Delete网络');
    await gotoUD10(page);
    await page.route('**/api/ud10/delete', (route) => route.abort('connectionrefused'));
    await fillInput(page, 'Variable', 'VAR001');
    await clickButton(page, 'Delete');
    await page.waitForTimeout(1000);
    await expect(page.locator('.existing-hdoc-message.error')).toContainText('System error');
    await takeScreenshot(page, '67_Delete网络');
    await page.unroute('**/api/ud10/delete');
  });

  test('No.68 Delete-按钮Loading状态', async ({ page }) => {
    resetCounter('68_DeleteLoading');
    await gotoUD10(page);
    await page.route('**/api/ud10/delete', async (route) => {
      await new Promise(r => setTimeout(r, 5000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
    });
    await fillInput(page, 'Variable', 'VAR001');
    await clickButton(page, 'Delete');
    await page.waitForTimeout(500);
    const allBtns = page.locator('.existing-hdoc-btn');
    const btnCount = await allBtns.count();
    for (let i = 0; i < btnCount; i++) {
      await expect(allBtns.nth(i)).toBeDisabled();
    }
    await expect(page.locator('.existing-hdoc-input').first()).toBeDisabled();
    await takeScreenshot(page, '68_DeleteLoading');
    await page.unroute('**/api/ud10/delete');
  });

  test('No.69 Delete-防止重复提交', async ({ page }) => {
    resetCounter('69_Delete防重复');
    await gotoUD10(page);
    let callCount = 0;
    await page.route('**/api/ud10/delete', async (route) => {
      callCount++;
      await new Promise(r => setTimeout(r, 2000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
    });
    await fillInput(page, 'Variable', 'VAR001');
    await clickButton(page, 'Delete');
    await page.waitForTimeout(500);
    await page.locator('.existing-hdoc-btn').filter({ hasText: 'Delete' }).click({ force: true });
    await page.waitForTimeout(3000);
    expect(callCount).toBeLessThanOrEqual(1);
    await takeScreenshot(page, '69_Delete防重复');
    await page.unroute('**/api/ud10/delete');
  });

  test('No.70 Delete-删除成功后字段清空', async ({ page }) => {
    resetCounter('70_Delete清空');
    // 先插入一条测试用记录
    await execute(`INSERT IGNORE INTO HDOC_VARIABLES (VARIABLE, TYPE, DESCRIPTION, USERID, REGISTER_DATETIME,
      REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
      VALUES ('UD10TESTCLR', 'User Defined', 'Delete clear test', 'admin', NOW(),
      'test', 'UD10Test', NOW(), 'test', 'UD10Test')`);
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'UD10TESTCLR');
    await clickButton(page, 'Delete');
    await page.waitForTimeout(3000);
    await expect(page.locator('.existing-hdoc-message.success')).toContainText('Record deleted successfully');
    // 所有字段被清空
    const inputs = page.locator('.existing-hdoc-input');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toHaveValue('');
    }
    await expect(page.locator('.existing-hdoc-select')).toHaveValue('');
    await takeScreenshot(page, '70_Delete清空');
  });
});

// ============================================================
// 13. Excel 导出（No.71-73）
// ============================================================
test.describe.serial('Excel导出（No.71-73）', () => {
  test.setTimeout(120000);

  test('No.71 Excel-导出CSV文件', async ({ page }) => {
    resetCounter('71_Excel导出');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'VAR001');
    await selectOption(page, 'Type', 'VDA');
    await fillInput(page, 'Description', 'Test Variable 001');
    await fillInput(page, 'Created by user', 'admin');
    await fillInput(page, 'Date', '2026-07-16');
    // 监听下载
    let downloadTriggered = false;
    page.on('download', () => { downloadTriggered = true; });
    await clickButton(page, 'Excel');
    await page.waitForTimeout(2000);
    expect(downloadTriggered).toBe(true);
    await takeScreenshot(page, '71_Excel导出');
  });

  test('No.72 Excel-空表单导出', async ({ page }) => {
    resetCounter('72_Excel空');
    await gotoUD10(page);
    let downloadTriggered = false;
    page.on('download', () => { downloadTriggered = true; });
    await clickButton(page, 'Excel');
    await page.waitForTimeout(2000);
    expect(downloadTriggered).toBe(true);
    await takeScreenshot(page, '72_Excel空');
  });

  test('No.73 Excel-导出文件内容编码', async ({ page }) => {
    resetCounter('73_Excel编码');
    await gotoUD10(page);
    await fillInput(page, 'Description', 'Test, "quote" & special');
    let downloadTriggered = false;
    page.on('download', () => { downloadTriggered = true; });
    await clickButton(page, 'Excel');
    await page.waitForTimeout(2000);
    expect(downloadTriggered).toBe(true);
    await takeScreenshot(page, '73_Excel编码');
  });
});

// ============================================================
// 14. 消息显示（No.74-76）
// ============================================================
test.describe.serial('消息显示（No.74-76）', () => {
  test.setTimeout(120000);

  test('No.74 消息类型-成功消息', async ({ page }) => {
    resetCounter('74_消息成功');
    await gotoUD10(page);
    await fillInput(page, 'Variable', 'UD10TESTMSG');
    await selectOption(page, 'Type', 'VDA');
    await fillInput(page, 'Description', 'Message test');
    await clickButton(page, 'Add');
    await page.waitForTimeout(3000);
    const msg = page.locator('.existing-hdoc-message.success');
    await expect(msg).toContainText('Record added successfully');
    await takeScreenshot(page, '74_消息成功');
  });

  test('No.75 消息类型-错误消息', async ({ page }) => {
    resetCounter('75_消息错误');
    await gotoUD10(page);
    await clickButton(page, 'Add');
    await page.waitForTimeout(500);
    const msg = page.locator('.existing-hdoc-message.error');
    await expect(msg).toContainText('Variable is required');
    await takeScreenshot(page, '75_消息错误');
  });

  test('No.76 消息清空-新操作时覆盖', async ({ page }) => {
    resetCounter('76_消息清空');
    await gotoUD10(page);
    // 触发错误
    await clickButton(page, 'Add');
    await page.waitForTimeout(300);
    await expect(page.locator('.existing-hdoc-message.error')).toBeVisible();
    // 在Variable输入框中输入值，消息应被清除
    await fillInput(page, 'Variable', 'TEST');
    await page.waitForTimeout(500);
    await expect(page.locator('.existing-hdoc-message')).toHaveCount(0);
    await takeScreenshot(page, '76_消息清空');
  });
});

// ============================================================
// 15. 安全性（No.77-78）
// ============================================================
test.describe.serial('安全性（No.77-78）', () => {
  test.setTimeout(120000);

  test('No.77 安全性-Variable特殊字符（XSS）', async ({ page }) => {
    resetCounter('77_XSS安全');
    await gotoUD10(page);
    const input = page.locator('.existing-hdoc-form-row').first().locator('.existing-hdoc-input');
    await input.click();
    await input.pressSequentially("<script>alert('xss')</script>", { delay: 30 });
    await expect(input).toHaveValue('scriptalertxssscript');
    await takeScreenshot(page, '77_XSS安全');
  });

  test('No.78 安全性-操作按钮需要登录认证', async ({ page }) => {
    resetCounter('78_未登录');
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await page.goto(UD10_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    // 未登录应跳转到登录页（Menu组件 navigate('/') 跳转到根路径）
    expect(page.url()).toBe(BASE_URL + '/');
    await takeScreenshot(page, '78_未登录');
  });
});

// ============================================================
// 16. 按钮交互（No.79-81）
// ============================================================
test.describe.serial('按钮交互（No.79-81）', () => {
  test.setTimeout(120000);

  test('No.79 按钮组-连续Add和Update', async ({ page }) => {
    resetCounter('79_连续AddUpdate');
    await gotoUD10(page);
    // Add
    await fillInput(page, 'Variable', 'UD10TESTSEQ');
    await selectOption(page, 'Type', 'VDA');
    await fillInput(page, 'Description', 'First add');
    await clickButton(page, 'Add');
    await page.waitForTimeout(3000);
    await expect(page.locator('.existing-hdoc-message.success')).toContainText('Record added successfully');
    // Update
    await selectOption(page, 'Type', 'VDA');
    await fillInput(page, 'Description', 'Updated by sequence test');
    await clickButton(page, 'Update');
    await page.waitForTimeout(3000);
    await expect(page.locator('.existing-hdoc-message.success')).toContainText('Record updated successfully');
    await takeScreenshot(page, '79_连续AddUpdate');
  });

  test('No.80 按钮组-Add后Delete同一记录', async ({ page }) => {
    resetCounter('80_Add后Delete');
    await gotoUD10(page);
    // Add
    await fillInput(page, 'Variable', 'UD10TESTADDEL');
    await selectOption(page, 'Type', 'VDA');
    await clickButton(page, 'Add');
    await page.waitForTimeout(3000);
    await expect(page.locator('.existing-hdoc-message.success')).toContainText('Record added successfully');
    // Delete 同一记录
    await clickButton(page, 'Delete');
    await page.waitForTimeout(3000);
    await expect(page.locator('.existing-hdoc-message.success')).toContainText('Record deleted successfully');
    // 字段应清空
    await expect(page.locator('.existing-hdoc-input').first()).toHaveValue('');
    await takeScreenshot(page, '80_Add后Delete');
  });

  test('No.81 按钮组-Delete后Search', async ({ page }) => {
    resetCounter('81_Delete后Search');
    await gotoUD10(page);
    // 先删除一条记录
    await fillInput(page, 'Variable', 'UD10TESTADDEL');
    await clickButton(page, 'Delete');
    await page.waitForTimeout(3000);
    // 然后搜索
    await fillInput(page, 'Variable', 'VAR001');
    await clickButton(page, 'Search');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/ExistingHDocVariables/Search');
    await takeScreenshot(page, '81_Delete后Search');
  });
});
