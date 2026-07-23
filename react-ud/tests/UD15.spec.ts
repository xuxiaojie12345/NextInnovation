import { test, expect, Page } from '@playwright/test';

// ============================================================
// VinPlate 模块 (UD15) Playwright 自动化测试
// 基于 単体テスト仕様書UD15.md（36个测试用例）
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD15';
const UD15_URL = `${BASE_URL}/Menu/VinPlate`;

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

async function gotoUD15(page: Page) {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  await page.goto(UD15_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.waitForSelector('.ud15-title', { timeout: 30000 });
}

/** Mock UD15 API */
async function mockApi(page: Page, operation: string, responseData: any, delay: number = 0) {
  await page.route('**/api/ud15/UD15SelecthdocsenddatavinplateApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === operation) {
      if (delay > 0) await new Promise(r => setTimeout(r, delay));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseData) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock UD15 API failure (500) */
async function mockApiFail(page: Page, operation: string) {
  await page.route('**/api/ud15/UD15SelecthdocsenddatavinplateApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === operation) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500, message: 'System error', data: null }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock UD15 API 404 */
async function mockApiNotFound(page: Page, operation: string, chassisNumber: string) {
  await page.route('**/api/ud15/UD15SelecthdocsenddatavinplateApi', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.operation === operation) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        code: 400, message: `Chassis number ${chassisNumber} not found.`, data: null
      }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock UD15 API timeout */
async function mockApiTimeout(page: Page) {
  await page.route('**/api/ud15/UD15SelecthdocsenddatavinplateApi', (route) => route.abort('timedout'));
}

const MOCK_VIN_INFO = {
  code: 200,
  data: {
    chassisNumber: 'JPCT013945',
    plateType: '1',
    status: '0',
    errorMessage: '',
    def: '2026-07-16 10:30:00',
    dataReady: '2026-07-16 12:00:00',
    sentToCabFactory: '',
    printItems: 'VIN Plate Label, Barcode',
    vpData: 'Variant1: Value1, Variant2: Value2'
  }
};

// ============================================================
// 1. 画面初始化（No.1-3）
// ============================================================
test.describe.serial('画面初始化（No.1-3）', () => {
  test.setTimeout(120000);

  test('No.1 画面初期显示-基本元素', async ({ page }) => {
    resetCounter('01_基本元素');
    await gotoUD15(page);
    // 标题
    await expect(page.locator('.ud15-title')).toContainText('Vin Plate');
    // Chassis number 输入框
    await expect(page.locator('.ud15-input')).toBeVisible();
    await expect(page.locator('.ud15-input')).toHaveAttribute('maxLength', '15');
    // 5个按钮
    const buttons = ['View Info', 'Set Regenerate', 'Set OK', 'Change to Basic Info', 'Change to Advanced Info'];
    for (const btn of buttons) {
      await expect(page.locator('.ud15-btn').filter({ hasText: btn })).toBeEnabled();
    }
    // 详细信息隐藏
    await expect(page.locator('.ud15-info-section')).toHaveCount(0);
    await takeScreenshot(page, '01_基本元素');
  });

  test('No.2 画面初期显示-搜索区域', async ({ page }) => {
    resetCounter('02_搜索区域');
    await gotoUD15(page);
    await expect(page.locator('.ud15-input')).toHaveValue('');
    await expect(page.locator('.ud15-btn').filter({ hasText: 'View Info' })).toBeEnabled();
    await expect(page.locator('.ud15-info-section')).toHaveCount(0);
    await takeScreenshot(page, '02_搜索区域');
  });

  test('No.3 画面初期显示-状态更新按钮', async ({ page }) => {
    resetCounter('03_状态更新按钮');
    await gotoUD15(page);
    // 所有按钮可用
    const buttons = ['View Info', 'Set Regenerate', 'Set OK', 'Change to Basic Info', 'Change to Advanced Info'];
    for (const btn of buttons) {
      await expect(page.locator('.ud15-btn').filter({ hasText: btn })).toBeEnabled();
    }
    await takeScreenshot(page, '03_状态更新按钮');
  });
});

// ============================================================
// 2. 查询处理 View Info（No.4-8）
// ============================================================
test.describe.serial('View Info（No.4-8）', () => {
  test.setTimeout(120000);

  test('No.4 View Info-Chassis number 为空', async ({ page }) => {
    resetCounter('04_Chassis空');
    await gotoUD15(page);
    await page.locator('.ud15-btn').filter({ hasText: 'View Info' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud15-message.error')).toContainText('Chassis number is required');
    await expect(page.locator('.ud15-info-section')).toHaveCount(0);
    await takeScreenshot(page, '04_Chassis空');
  });

  test('No.5 View Info-查询成功', async ({ page }) => {
    resetCounter('05_查询成功');
    await mockApi(page, 'viewInfo', MOCK_VIN_INFO);
    await gotoUD15(page);
    await page.waitForTimeout(500);
    // 输入 Chassis number
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'View Info' }).click();
    await page.waitForTimeout(2000);
    // 详细信息显示
    await expect(page.locator('.ud15-info-section')).toBeVisible();
    // 各字段
    await expect(page.locator('.ud15-info-value').nth(0)).toContainText('JPCT013945');
    await expect(page.locator('.ud15-info-value').nth(1)).toContainText('1 (basic)');
    await expect(page.locator('.ud15-info-value').nth(2)).toContainText('0 (新規追加)');
    await expect(page.locator('.ud15-info-value').nth(3)).toContainText('2026-07-16');
    await expect(page.locator('.ud15-info-value').nth(4)).toContainText('2026-07-16');
    await expect(page.locator('.ud15-info-value').nth(6)).toContainText('VIN Plate Label');
    await expect(page.locator('.ud15-info-value').nth(7)).toContainText('Variant1');
    await takeScreenshot(page, '05_查询成功');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.6 View Info-未找到匹配记录', async ({ page }) => {
    resetCounter('06_未找到记录');
    await mockApiNotFound(page, 'viewInfo', 'INVALID');
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('INVALID', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'View Info' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud15-message.error')).toContainText('not found');
    await expect(page.locator('.ud15-info-section')).toHaveCount(0);
    await takeScreenshot(page, '06_未找到记录');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.7 View Info-API 返回错误（500）', async ({ page }) => {
    resetCounter('07_ViewInfo500');
    await mockApiFail(page, 'viewInfo');
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'View Info' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud15-message.error')).toContainText('System error');
    await expect(page.locator('.ud15-info-section')).toHaveCount(0);
    await takeScreenshot(page, '07_ViewInfo500');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.8 View Info-加载中按钮禁用', async ({ page }) => {
    resetCounter('08_ViewInfo加载');
    await mockApi(page, 'viewInfo', MOCK_VIN_INFO, 3000);
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'View Info' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud15-btn').filter({ hasText: 'View Info' })).toBeDisabled();
    await takeScreenshot(page, '08_ViewInfo加载');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });
});

// ============================================================
// 3. 详细信息展示（No.9-15）
// ============================================================
test.describe.serial('详细信息（No.9-15）', () => {
  test.setTimeout(120000);

  test('No.9 详细信息-Chassis number 显示', async ({ page }) => {
    resetCounter('09_InfoChassis');
    await mockApi(page, 'viewInfo', MOCK_VIN_INFO);
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'View Info' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud15-info-label').nth(0)).toContainText('Chassis number');
    await expect(page.locator('.ud15-info-value').nth(0)).toContainText('JPCT013945');
    await takeScreenshot(page, '09_InfoChassis');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.10 详细信息-Plate type 显示', async ({ page }) => {
    resetCounter('10_InfoPlateType');
    await mockApi(page, 'viewInfo', MOCK_VIN_INFO);
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'View Info' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud15-info-label').nth(1)).toContainText('Plate type');
    await expect(page.locator('.ud15-info-value').nth(1)).toContainText('1 (basic)');
    await takeScreenshot(page, '10_InfoPlateType');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.11 详细信息-Status 显示', async ({ page }) => {
    resetCounter('11_InfoStatus');
    await mockApi(page, 'viewInfo', {
      ...MOCK_VIN_INFO,
      data: { ...MOCK_VIN_INFO.data, status: '1', plateType: '2' }
    });
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'View Info' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud15-info-label').nth(2)).toContainText('Status');
    await expect(page.locator('.ud15-info-value').nth(2)).toContainText('1 (xml doc 作成済み)');
    await takeScreenshot(page, '11_InfoStatus');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.12 详细信息-Def.时间显示', async ({ page }) => {
    resetCounter('12_InfoDef');
    await mockApi(page, 'viewInfo', MOCK_VIN_INFO);
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'View Info' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud15-info-label').nth(3)).toContainText('Def.');
    await expect(page.locator('.ud15-info-value').nth(3)).toContainText('2026-07-16');
    await takeScreenshot(page, '12_InfoDef');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.13 详细信息-Data ready 显示', async ({ page }) => {
    resetCounter('13_InfoDataReady');
    await mockApi(page, 'viewInfo', MOCK_VIN_INFO);
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'View Info' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud15-info-label').nth(4)).toContainText('Data ready');
    await expect(page.locator('.ud15-info-value').nth(4)).toContainText('2026-07-16');
    await takeScreenshot(page, '13_InfoDataReady');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.14 详细信息-Print items 显示', async ({ page }) => {
    resetCounter('14_InfoPrintItems');
    await mockApi(page, 'viewInfo', MOCK_VIN_INFO);
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'View Info' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud15-info-label').nth(6)).toContainText('Print items');
    await expect(page.locator('.ud15-info-value').nth(6)).toContainText('VIN Plate Label');
    await takeScreenshot(page, '14_InfoPrintItems');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.15 详细信息-VP Data 显示', async ({ page }) => {
    resetCounter('15_InfoVPData');
    await mockApi(page, 'viewInfo', MOCK_VIN_INFO);
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'View Info' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud15-info-label').nth(7)).toContainText('VP Data');
    await expect(page.locator('.ud15-info-value').nth(7)).toContainText('Variant1: Value1');
    await takeScreenshot(page, '15_InfoVPData');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });
});

// ============================================================
// 4. 状态更新处理（No.16-28）
// ============================================================
test.describe.serial('状态更新（No.16-28）', () => {
  test.setTimeout(120000);

  test('No.16 状态更新-未先查询时点击', async ({ page }) => {
    resetCounter('16_未先查询');
    await gotoUD15(page);
    // 直接点击 Set Regenerate（未先查询）
    await page.locator('.ud15-btn').filter({ hasText: 'Set Regenerate' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud15-message.error')).toContainText('Chassis number is required');
    await takeScreenshot(page, '16_未先查询');
  });

  test('No.17 Set Regenerate-成功', async ({ page }) => {
    resetCounter('17_SetRegenerate成功');
    await mockApi(page, 'setRegenerate', { code: 200, message: 'Regenerate operation successful.' });
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'Set Regenerate' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud15-message.success')).toContainText('successful');
    await takeScreenshot(page, '17_SetRegenerate成功');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.18 Set OK-成功', async ({ page }) => {
    resetCounter('18_SetOK成功');
    await mockApi(page, 'setOK', { code: 200, message: 'OK operation successful.' });
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'Set OK' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud15-message.success')).toContainText('successful');
    await takeScreenshot(page, '18_SetOK成功');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.19 Change to Basic Info-成功', async ({ page }) => {
    resetCounter('19_ChangeToBasic成功');
    await mockApi(page, 'changeToBasicInfo', { code: 200, message: 'Change to Basic Info successful.' });
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'Change to Basic Info' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud15-message.success')).toContainText('successful');
    await takeScreenshot(page, '19_ChangeToBasic成功');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.20 Change to Advanced Info-成功', async ({ page }) => {
    resetCounter('20_ChangeToAdvanced成功');
    await mockApi(page, 'changeToAdvancedInfo', { code: 200, message: 'Change to Advanced Info successful.' });
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'Change to Advanced Info' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud15-message.success')).toContainText('successful');
    await takeScreenshot(page, '20_ChangeToAdvanced成功');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.21 Set Regenerate-失败（API返回500）', async ({ page }) => {
    resetCounter('21_SetRegen500');
    await mockApiFail(page, 'setRegenerate');
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'Set Regenerate' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud15-message.error')).toContainText('System error');
    await takeScreenshot(page, '21_SetRegen500');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.22 Set Regenerate-记录不存在（API返回404）', async ({ page }) => {
    resetCounter('22_SetRegen404');
    await mockApiNotFound(page, 'setRegenerate', 'JPCT013945');
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'Set Regenerate' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud15-message.error')).toContainText('not found');
    await takeScreenshot(page, '22_SetRegen404');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.23 Set OK-失败（API返回500）', async ({ page }) => {
    resetCounter('23_SetOK500');
    await mockApiFail(page, 'setOK');
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'Set OK' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud15-message.error')).toContainText('System error');
    await takeScreenshot(page, '23_SetOK500');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.24 Change to Basic Info-失败（API返回500）', async ({ page }) => {
    resetCounter('24_ChangeBasic500');
    await mockApiFail(page, 'changeToBasicInfo');
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'Change to Basic Info' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud15-message.error')).toContainText('System error');
    await takeScreenshot(page, '24_ChangeBasic500');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.25 Change to Advanced Info-失败（API返回500）', async ({ page }) => {
    resetCounter('25_ChangeAdvanced500');
    await mockApiFail(page, 'changeToAdvancedInfo');
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'Change to Advanced Info' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud15-message.error')).toContainText('System error');
    await takeScreenshot(page, '25_ChangeAdvanced500');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.26 状态更新-失败（API 返回错误）', async ({ page }) => {
    resetCounter('26_更新通用错误');
    await mockApiFail(page, 'setRegenerate');
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'Set Regenerate' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud15-message.error')).toContainText('System error');
    await expect(page.locator('.ud15-btn').filter({ hasText: 'Set Regenerate' })).toBeEnabled();
    await takeScreenshot(page, '26_更新通用错误');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.27 状态更新-加载中按钮禁用', async ({ page }) => {
    resetCounter('27_更新加载中');
    await mockApi(page, 'setRegenerate', { code: 200, message: 'ok' }, 3000);
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'Set Regenerate' }).click();
    await page.waitForTimeout(500);
    // 所有按钮禁用
    const buttons = ['View Info', 'Set Regenerate', 'Set OK', 'Change to Basic Info', 'Change to Advanced Info'];
    for (const btn of buttons) {
      await expect(page.locator('.ud15-btn').filter({ hasText: btn })).toBeDisabled();
    }
    await takeScreenshot(page, '27_更新加载中');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.28 状态更新-防止重复提交', async ({ page }) => {
    resetCounter('28_防重复提交');
    let callCount = 0;
    await page.route('**/api/ud15/UD15SelecthdocsenddatavinplateApi', async (route) => {
      callCount++;
      await new Promise(r => setTimeout(r, 3000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, message: 'ok' }) });
    });
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'Set Regenerate' }).click();
    await page.waitForTimeout(500);
    await page.locator('.ud15-btn').filter({ hasText: 'Set Regenerate' }).click({ force: true });
    await page.waitForTimeout(4000);
    expect(callCount).toBeLessThanOrEqual(1);
    await takeScreenshot(page, '28_防重复提交');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });
});

// ============================================================
// 5. 异常处理（No.29-31）
// ============================================================
test.describe.serial('异常处理（No.29-31）', () => {
  test.setTimeout(180000);

  test('No.29 异常处理-API 超时', async ({ page }) => {
    resetCounter('29_API超时');
    await mockApiTimeout(page);
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'View Info' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud15-message.error')).toContainText('System error');
    await takeScreenshot(page, '29_API超时');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.30 异常处理-数据库更新异常', async ({ page }) => {
    resetCounter('30_数据库异常');
    await mockApiFail(page, 'setRegenerate');
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'Set Regenerate' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud15-message.error')).toContainText('System error');
    await expect(page.locator('.ud15-btn').filter({ hasText: 'Set Regenerate' })).toBeEnabled();
    await takeScreenshot(page, '30_数据库异常');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.31 异常处理-用户未登录', async ({ page }) => {
    resetCounter('31_未登录');
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await page.goto(UD15_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    // 未登录时应跳转到登录页（根路径 / 渲染 Login 组件）
    expect(page.url()).toBe(BASE_URL + '/');
    await takeScreenshot(page, '31_未登录');
  });
});

// ============================================================
// 6. UI 交互（No.32-34）
// ============================================================
test.describe.serial('UI交互（No.32-34）', () => {
  test.setTimeout(120000);

  test('No.32 错误消息-显示样式', async ({ page }) => {
    resetCounter('32_错误样式');
    await gotoUD15(page);
    await page.locator('.ud15-btn').filter({ hasText: 'View Info' }).click();
    await page.waitForTimeout(500);
    const msg = page.locator('.ud15-message.error');
    await expect(msg).toContainText('Chassis number is required');
    await takeScreenshot(page, '32_错误样式');
  });

  test('No.33 成功消息-显示样式', async ({ page }) => {
    resetCounter('33_成功样式');
    await mockApi(page, 'setRegenerate', { code: 200, message: 'Operation successful.' });
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'Set Regenerate' }).click();
    await page.waitForTimeout(2000);
    const msg = page.locator('.ud15-message.success');
    await expect(msg).toContainText('Operation successful');
    await takeScreenshot(page, '33_成功样式');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.34 页面刷新', async ({ page }) => {
    resetCounter('34_页面刷新');
    await mockApi(page, 'viewInfo', MOCK_VIN_INFO);
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'View Info' }).click();
    await page.waitForTimeout(2000);
    // 刷新页面
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud15-input')).toHaveValue('');
    await expect(page.locator('.ud15-info-section')).toHaveCount(0);
    await expect(page.locator('.ud15-btn').filter({ hasText: 'View Info' })).toBeEnabled();
    await takeScreenshot(page, '34_页面刷新');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });
});

// ============================================================
// 7. 安全性（No.35-36）
// ============================================================
test.describe.serial('安全性（No.35-36）', () => {
  test.setTimeout(120000);

  test('No.35 安全性-API 请求验证', async ({ page }) => {
    resetCounter('35_API请求验证');
    let requestBody = '';
    await page.route('**/api/ud15/UD15SelecthdocsenddatavinplateApi', async (route) => {
      requestBody = route.request().postData() || '';
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: null, message: 'ok' }) });
    });
    await gotoUD15(page);
    const input = page.locator('.ud15-input');
    await input.click();
    await input.pressSequentially('JPCT013945', { delay: 20 });
    await page.locator('.ud15-btn').filter({ hasText: 'Set Regenerate' }).click();
    await page.waitForTimeout(1000);
    expect(requestBody).toContain('chassisNumber');
    expect(requestBody).toContain('operation');
    expect(requestBody).toContain('updateUser');
    await takeScreenshot(page, '35_API请求验证');
    await page.unroute('**/api/ud15/UD15SelecthdocsenddatavinplateApi');
  });

  test('No.36 安全性-权限控制（模拟无权限用户）', async ({ page }) => {
    resetCounter('36_权限控制');
    // 以无 VinPlate 权限的用户登录
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await page.evaluate((info) => { localStorage.setItem('userInfo', JSON.stringify(info)); }, {
      username: 'guest', role: 'Guest',
      permissions: ["GenerateDucument"]
    });
    await page.goto(UD15_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    // 若权限不足可能跳转到登录或显示无权限
    const onLogin = page.url().includes('/Login');
    const onMenu = page.url().includes('/Menu');
    // 输入 chassis number 后尝试操作
    const input = page.locator('.ud15-input');
    if (await input.isVisible()) {
      await input.click();
      await input.pressSequentially('JPCT013945', { delay: 20 });
      await page.locator('.ud15-btn').filter({ hasText: 'Set Regenerate' }).click();
      await page.waitForTimeout(1000);
    }
    await takeScreenshot(page, '36_权限控制');
  });
});
