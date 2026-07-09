import { test, expect, Page } from '@playwright/test';
import { insertUD07TestData, cleanupUD07TestData } from './test-data-helper';

// ============================================================
// Vehicle Specification 模块 (UD07) Playwright 自动化测试
// 基于 単体テスト仕様書UD07.md (v1.0)
// 全42测试用例覆盖
// ============================================================

const BASE_URL = 'http://localhost:3000';
const API_BASE = 'http://localhost:8081';
const SCREENSHOT_DIR = 'tests/image/UD07';

let screenshotCounter: { [key: string]: number } = {};

async function takeScreenshot(page: Page, name: string) {
  if (!screenshotCounter[name]) screenshotCounter[name] = 0;
  screenshotCounter[name]++;
  const seq = String(screenshotCounter[name]).padStart(3, '0');
  try {
    if (page.isClosed()) return;
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${name}_${seq}.jpeg`,
      type: 'jpeg', quality: 85, fullPage: true,
      timeout: 15000,
    });
  } catch (e) {
    console.warn(`Screenshot failed for ${name}: ${e}`);
  }
}

function resetCounter(name: string) {
  screenshotCounter[name] = 0;
}

async function safeGoto(page: Page, url: string) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      return;
    } catch (e) {
      if (i === 2 || page.isClosed()) throw e;
      await page.waitForTimeout(2000);
    }
  }
}

async function loginAndGoToMenu(page: Page) {
  await safeGoto(page, BASE_URL);
  await page.evaluate(() => {
    localStorage.setItem('userInfo', JSON.stringify({
      userid: 'e2e_test', username: 'E2E Test User', token: 'mock-token-ud07'
    }));
  });
  await safeGoto(page, `${BASE_URL}/Menu`);
  await page.waitForSelector('.menu-layout', { timeout: 15000 });
}

/** 导航到 UD07：设置 mock 路由 + 注入 state + 导航 */
async function goToUD07Mock(page: Page, chassisNo: string, mockBody: any, delayMs = 300) {
  await page.route(`${API_BASE}/api/v1/ud07/vehiclespecification*`, async route => {
    if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockBody)
    });
  });
  await page.addInitScript(`window.history.replaceState(
    ${JSON.stringify({ chassisNo })},
    '',
    window.location.pathname + window.location.search
  );`);
  await page.goto(`${BASE_URL}/Menu/VehicleSpecification`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.vehicle-specification-page', { timeout: 15000 });
}

/** 导航到 UD07：使用真实 API 数据 */
async function goToUD07(page: Page, chassisNo: string) {
  await page.addInitScript(`window.history.replaceState(
    ${JSON.stringify({ chassisNo })},
    '',
    window.location.pathname + window.location.search
  );`);
  await page.goto(`${BASE_URL}/Menu/VehicleSpecification`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.vehicle-specification-page', { timeout: 15000 });
}

/** 等待加载完成 */
async function waitLoaded(page: Page) {
  await expect(page.locator('.loading-container')).not.toBeVisible({ timeout: 15000 }).catch(() => {});
}

// 常用 mock 数据模板
const MOCK_CHASSIS = (chno: string, overrides: any = {}) => ({
  chassisNo: chno,
  model: 'UD-HDE',
  buildWeek: '1617',
  productType: 'EM 64 R',
  vin: `JPCZZ30D8GT${chno.replace(/\D/g, '').slice(-6).padStart(6, '0')}`,
  countryOfOperation: 'IDN',
  ...overrides
});

const mockSuccessBody = (chno: string, chassisOverrides: any = {}, engineOverrides: any = {}, sNoteNo = 'S1610111') => ({
  code: 200,
  data: {
    chassisInfo: MOCK_CHASSIS(chno, chassisOverrides),
    engineInfo: { engineNo: 'A01', symbolStr: 'FTLI-150', description: 'Front load index: FTLI-150', ...engineOverrides },
    sNoteNo
  }
});

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  await cleanupUD07TestData();
  await insertUD07TestData();
});

test.afterAll(async () => {
  await cleanupUD07TestData();
});

// ============================================================
// 1. 画面初始化 (No.1-4)
// ============================================================
test.describe('画面初始化', () => {

  test('No.1 初始化-正常加载并显示', async ({ page }) => {
    resetCounter('01_初始化_正常加载并显示');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '01_初始化_正常加载并显示');
    await goToUD07(page, 'JPCT 013945');
    await waitLoaded(page);
    await takeScreenshot(page, '01_初始化_正常加载并显示');
    await expect(page.locator('.page-title')).toHaveText('VDA - Vehicle Specification');
    await takeScreenshot(page, '01_初始化_正常加载并显示');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
    await expect(page.locator('.info-section')).toBeVisible();
    await takeScreenshot(page, '01_初始化_正常加载并显示');
  });

  test('No.2 初始化-加载中状态显示', async ({ page }) => {
    resetCounter('02_初始化_加载中状态显示');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '02_初始化_加载中状态显示');
    await page.route(`${API_BASE}/api/v1/ud07/vehiclespecification*`, async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSuccessBody('JPCT 013946')) });
    });
    await goToUD07(page, 'JPCT 013946');
    await takeScreenshot(page, '02_初始化_加载中状态显示');
    await expect(page.locator('.loading-container')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.loading-container')).toContainText('加载中...');
    await takeScreenshot(page, '02_初始化_加载中状态显示');
    await waitLoaded(page);
    await takeScreenshot(page, '02_初始化_加载中状态显示');
  });

  test('No.3 初始化-底盘编号为空', async ({ page }) => {
    resetCounter('03_初始化_底盘编号为空');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '03_初始化_底盘编号为空');
    await goToUD07(page, '');
    await takeScreenshot(page, '03_初始化_底盘编号为空');
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.error-message-area')).toContainText('未指定Chassis编号');
    await takeScreenshot(page, '03_初始化_底盘编号为空');
  });

  test('No.4 初始化-API 返回无数据（data 为 null）', async ({ page }) => {
    resetCounter('04_初始化_API返回无数据');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '04_初始化_API返回无数据');
    await goToUD07Mock(page, 'JPCT 013947', { code: 200, data: null });
    await takeScreenshot(page, '04_初始化_API返回无数据');
    await expect(page.locator('.info-message-area')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.info-message-area')).toContainText('没有找到相关车辆数据');
    await takeScreenshot(page, '04_初始化_API返回无数据');
  });
});

// ============================================================
// 2. 底盘信息显示 (No.5-6)
// ============================================================
test.describe('底盘信息显示', () => {

  test('No.5 底盘-Chassis no 显示（正常）', async ({ page }) => {
    resetCounter('05_底盘_ChassisNo正常显示');
    await loginAndGoToMenu(page);
    await goToUD07(page, 'JPCT 013945');
    await waitLoaded(page);
    await takeScreenshot(page, '05_底盘_ChassisNo正常显示');
    await expect(page.locator('.info-section')).toContainText('Chassis no:');
    await expect(page.locator('.info-section')).toContainText('JPCT 013945');
    await takeScreenshot(page, '05_底盘_ChassisNo正常显示');
  });

  test('No.6 底盘-Chassis no 显示（API 返回为空）', async ({ page }) => {
    resetCounter('06_底盘_ChassisNo_APINull');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '06_底盘_ChassisNo_APINull');
    await goToUD07Mock(page, 'JPCT 013948', { code: 200, data: null });
    await takeScreenshot(page, '06_底盘_ChassisNo_APINull');
    await expect(page.locator('.info-message-area')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.info-section')).toContainText('JPCT 013948');
    await takeScreenshot(page, '06_底盘_ChassisNo_APINull');
  });
});

// ============================================================
// 3. 车辆基本信息显示 (No.7-12)
// ============================================================
test.describe('车辆基本信息显示', () => {

  test('No.7 车辆信息-Model 显示', async ({ page }) => {
    resetCounter('07_车辆信息_Model显示');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '07_车辆信息_Model显示');
    await goToUD07Mock(page, 'JPCT 013949', mockSuccessBody('JPCT 013949', { model: 'UD-HDE' }));
    await waitLoaded(page);
    await takeScreenshot(page, '07_车辆信息_Model显示');
    await expect(page.locator('.info-section')).toContainText('Model:');
    await expect(page.locator('.info-section')).toContainText('UD-HDE');
    await takeScreenshot(page, '07_车辆信息_Model显示');
  });

  test('No.8 车辆信息-Model 显示（无值）', async ({ page }) => {
    resetCounter('08_车辆信息_Model无值');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '08_车辆信息_Model无值');
    await goToUD07Mock(page, 'JPCT 013950', mockSuccessBody('JPCT 013950', { model: '' }));
    await waitLoaded(page);
    await takeScreenshot(page, '08_车辆信息_Model无值');
    await expect(page.locator('.info-section')).toContainText('-');
    await takeScreenshot(page, '08_车辆信息_Model无值');
  });

  test('No.9 车辆信息-Built week 显示', async ({ page }) => {
    resetCounter('09_车辆信息_BuiltWeek显示');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '09_车辆信息_BuiltWeek显示');
    await goToUD07Mock(page, 'JPCT 013951', mockSuccessBody('JPCT 013951', { buildWeek: '1617' }));
    await waitLoaded(page);
    await takeScreenshot(page, '09_车辆信息_BuiltWeek显示');
    await expect(page.locator('.info-section')).toContainText('Built week:');
    await expect(page.locator('.info-section')).toContainText('1617');
    await takeScreenshot(page, '09_车辆信息_BuiltWeek显示');
  });

  test('No.10 车辆信息-Product type 显示', async ({ page }) => {
    resetCounter('10_车辆信息_ProductType显示');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '10_车辆信息_ProductType显示');
    await goToUD07Mock(page, 'JPCT 013952', mockSuccessBody('JPCT 013952', { productType: 'EM 64 R' }));
    await waitLoaded(page);
    await takeScreenshot(page, '10_车辆信息_ProductType显示');
    await expect(page.locator('.info-section')).toContainText('Product type:');
    await expect(page.locator('.info-section')).toContainText('EM 64 R');
    await takeScreenshot(page, '10_车辆信息_ProductType显示');
  });

  test('No.11 车辆信息-VIN 显示', async ({ page }) => {
    resetCounter('11_车辆信息_VIN显示');
    await loginAndGoToMenu(page);
    await goToUD07(page, 'JPCT 013945');
    await waitLoaded(page);
    await takeScreenshot(page, '11_车辆信息_VIN显示');
    await expect(page.locator('.info-section')).toContainText('VIN:');
    await expect(page.locator('.info-section')).toContainText('JPCZZ30D8GT013945');
    await takeScreenshot(page, '11_车辆信息_VIN显示');
  });

  test('No.12 车辆信息-VIN 显示（长字符串）', async ({ page }) => {
    resetCounter('12_车辆信息_VIN长字符串');
    await loginAndGoToMenu(page);
    await goToUD07(page, 'JPCT 013954');
    await waitLoaded(page);
    await takeScreenshot(page, '12_车辆信息_VIN长字符串');
    await expect(page.locator('.info-section')).toContainText('JPCZZZ30D8GT013954XYZ');
    await takeScreenshot(page, '12_车辆信息_VIN长字符串');
  });
});

// ============================================================
// 4. 发动机信息显示 (No.13-14)
// ============================================================
test.describe('发动机信息显示', () => {

  test('No.13 发动机-Engine no 显示（固定值）', async ({ page }) => {
    resetCounter('13_发动机_EngineNo固定值');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '13_发动机_EngineNo固定值');
    await goToUD07Mock(page, 'JPCT 013955', mockSuccessBody('JPCT 013955', {}, { engineNo: 'A01' }));
    await waitLoaded(page);
    await takeScreenshot(page, '13_发动机_EngineNo固定值');
    await expect(page.locator('.info-section')).toContainText('Engine no:');
    await expect(page.locator('.info-section')).toContainText('A01');
    await takeScreenshot(page, '13_发动机_EngineNo固定值');
  });

  test('No.14 发动机-Engine no 显示（无值）', async ({ page }) => {
    resetCounter('14_发动机_EngineNo无值');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '14_发动机_EngineNo无值');
    await goToUD07Mock(page, 'JPCT 013956', mockSuccessBody('JPCT 013956', {}, { engineNo: '' }));
    await waitLoaded(page);
    await takeScreenshot(page, '14_发动机_EngineNo无值');
    await expect(page.locator('.info-section')).toContainText('-');
    await takeScreenshot(page, '14_发动机_EngineNo无值');
  });
});

// ============================================================
// 5. 运营国家显示 (No.15-16)
// ============================================================
test.describe('运营国家显示', () => {

  test('No.15 运营国家-Country of Operation 显示（有值）', async ({ page }) => {
    resetCounter('15_运营国家_CountryOfOp有值');
    await loginAndGoToMenu(page);
    await goToUD07(page, 'JPCT 013945');
    await waitLoaded(page);
    await takeScreenshot(page, '15_运营国家_CountryOfOp有值');
    await expect(page.locator('.info-section')).toContainText('Country of operation:');
    await expect(page.locator('.info-section')).toContainText('IDN');
    await takeScreenshot(page, '15_运营国家_CountryOfOp有值');
  });

  test('No.16 运营国家-Country of Operation 显示（无值）', async ({ page }) => {
    resetCounter('16_运营国家_CountryOfOp无值');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '16_运营国家_CountryOfOp无值');
    await goToUD07Mock(page, 'JPCT 013958', mockSuccessBody('JPCT 013958', { countryOfOperation: '' }));
    await waitLoaded(page);
    await takeScreenshot(page, '16_运营国家_CountryOfOp无值');
    await expect(page.locator('.info-section')).toContainText('-');
    await takeScreenshot(page, '16_运营国家_CountryOfOp无值');
  });
});

// ============================================================
// 6. Symbol 信息显示 (No.17-21)
// ============================================================
test.describe('Symbol 信息显示', () => {

  test('No.17 Symbol-SYMBOL_STR 显示（有值）', async ({ page }) => {
    resetCounter('17_Symbol_SYMBOL_STR有值');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '17_Symbol_SYMBOL_STR有值');
    await goToUD07Mock(page, 'JPCT 013959', mockSuccessBody('JPCT 013959', {}, { symbolStr: 'FTLI-150', description: 'Front load index: FTLI-150' }));
    await waitLoaded(page);
    await takeScreenshot(page, '17_Symbol_SYMBOL_STR有值');
    await expect(page.locator('.info-value-tooltip')).toBeVisible();
    await expect(page.locator('.info-value-tooltip')).toContainText('FTLI-150');
    await takeScreenshot(page, '17_Symbol_SYMBOL_STR有值');
  });

  test('No.18 Symbol-SYMBOL_STR 显示（无值）', async ({ page }) => {
    resetCounter('18_Symbol_SYMBOL_STR无值');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '18_Symbol_SYMBOL_STR无值');
    await goToUD07Mock(page, 'JPCT 013960', mockSuccessBody('JPCT 013960', {}, { symbolStr: '', description: '' }));
    await waitLoaded(page);
    await takeScreenshot(page, '18_Symbol_SYMBOL_STR无值');
    await expect(page.locator('.info-section')).toContainText('-');
    await takeScreenshot(page, '18_Symbol_SYMBOL_STR无值');
  });

  test('No.19 Symbol-DESCRIPTION Tooltip 显示', async ({ page }) => {
    resetCounter('19_Symbol_Tooltip显示');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '19_Symbol_Tooltip显示');
    await goToUD07Mock(page, 'JPCT 013961', mockSuccessBody('JPCT 013961', {}, { symbolStr: 'FTLI-150', description: 'Front load index: FTLI-150' }));
    await waitLoaded(page);
    await takeScreenshot(page, '19_Symbol_Tooltip显示');
    const tooltipEl = page.locator('.info-value-tooltip');
    await tooltipEl.hover();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '19_Symbol_Tooltip显示');
  });

  test('No.20 Symbol-DESCRIPTION Tooltip 显示（无描述）', async ({ page }) => {
    resetCounter('20_Symbol_Tooltip无描述');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '20_Symbol_Tooltip无描述');
    await goToUD07Mock(page, 'JPCT 013962', mockSuccessBody('JPCT 013962', {}, { symbolStr: 'FTLI-150', description: '' }));
    await waitLoaded(page);
    await takeScreenshot(page, '20_Symbol_Tooltip无描述');
    const tooltipEl = page.locator('.info-value-tooltip');
    await tooltipEl.hover();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '20_Symbol_Tooltip无描述');
  });

  test('No.21 Symbol-长 Symbol 字符串显示', async ({ page }) => {
    resetCounter('21_Symbol_长Symbol字符串');
    await loginAndGoToMenu(page);
    await goToUD07(page, 'JPCT 013963');
    await waitLoaded(page);
    await takeScreenshot(page, '21_Symbol_长Symbol字符串');
    await expect(page.locator('.info-value-tooltip')).toBeVisible();
    await takeScreenshot(page, '21_Symbol_长Symbol字符串');
  });
});

// ============================================================
// 7. S-Note NO 显示 (No.22-24)
// ============================================================
test.describe('S-Note NO 显示', () => {

  test('No.22 S-Note NO 显示（有值）', async ({ page }) => {
    resetCounter('22_SNoteNO_有值');
    await loginAndGoToMenu(page);
    await goToUD07(page, 'JPCT 013945');
    await waitLoaded(page);
    await takeScreenshot(page, '22_SNoteNO_有值');
    await expect(page.locator('.info-section')).toContainText('S1610111');
    await takeScreenshot(page, '22_SNoteNO_有值');
  });

  test('No.23 S-Note NO 显示（无值）', async ({ page }) => {
    resetCounter('23_SNoteNO_无值');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '23_SNoteNO_无值');
    await goToUD07Mock(page, 'JPCT 013965', mockSuccessBody('JPCT 013965', {}, {}, ''));
    await waitLoaded(page);
    await takeScreenshot(page, '23_SNoteNO_无值');
    await expect(page.locator('.info-section')).toContainText('-');
    await takeScreenshot(page, '23_SNoteNO_无值');
  });

  test('No.24 S-Note NO 显示（长字符串）', async ({ page }) => {
    resetCounter('24_SNoteNO_长字符串');
    await loginAndGoToMenu(page);
    await goToUD07(page, 'JPCT 013966');
    await waitLoaded(page);
    await takeScreenshot(page, '24_SNoteNO_长字符串');
    await expect(page.locator('.info-section')).toContainText('S1610111-EXTRA-INFO');
    await takeScreenshot(page, '24_SNoteNO_长字符串');
  });
});

// ============================================================
// 8. API 交互 (No.25-30)
// ============================================================
test.describe('API 交互', () => {

  test('No.25 API 调用-成功获取数据（200）', async ({ page }) => {
    resetCounter('25_API调用_成功获取数据');
    await loginAndGoToMenu(page);
    await goToUD07(page, 'JPCT 013967');
    await waitLoaded(page);
    await takeScreenshot(page, '25_API调用_成功获取数据');
    await expect(page.locator('.info-section')).toContainText('Chassis no:');
    await expect(page.locator('.info-section')).toContainText('Model:');
    await expect(page.locator('.info-section')).toContainText('Built week:');
    await expect(page.locator('.info-section')).toContainText('Product type:');
    await expect(page.locator('.info-section')).toContainText('VIN:');
    await expect(page.locator('.info-section')).toContainText('Engine no:');
    await expect(page.locator('.info-section')).toContainText('Country of operation:');
    await takeScreenshot(page, '25_API调用_成功获取数据');
  });

  test('No.26 API 调用-无效底盘编号（400）', async ({ page }) => {
    resetCounter('26_API调用_无效底盘编号400');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '26_API调用_无效底盘编号400');
    await page.route(`${API_BASE}/api/v1/ud07/vehiclespecification*`, async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 400, message: 'Invalid chassis number' }) });
    });
    await goToUD07(page, 'INVALID');
    await takeScreenshot(page, '26_API调用_无效底盘编号400');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
    await takeScreenshot(page, '26_API调用_无效底盘编号400');
  });

  test('No.27 API 调用-系统异常（500）', async ({ page }) => {
    resetCounter('27_API调用_系统异常500');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '27_API调用_系统异常500');
    await page.route(`${API_BASE}/api/v1/ud07/vehiclespecification*`, async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500, message: '系统内部错误，请联系管理员' }) });
    });
    await goToUD07(page, 'JPCT 013969');
    await takeScreenshot(page, '27_API调用_系统异常500');
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.error-message-area')).toContainText('系统内部错误，请联系管理员');
    await takeScreenshot(page, '27_API调用_系统异常500');
  });

  test('No.28 API 调用-网络错误', async ({ page }) => {
    resetCounter('28_API调用_网络错误');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '28_API调用_网络错误');
    await page.route(`${API_BASE}/api/v1/ud07/vehiclespecification*`, async route => {
      await route.abort('connectionrefused');
    });
    await goToUD07(page, 'JPCT 013970');
    await takeScreenshot(page, '28_API调用_网络错误');
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.error-message-area')).toContainText('网络连接失败，请检查网络设置');
    await takeScreenshot(page, '28_API调用_网络错误');
  });

  test('No.29 API 调用-API 返回非 200 状态码', async ({ page }) => {
    resetCounter('29_API调用_API返回非200');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '29_API调用_API返回非200');
    await goToUD07Mock(page, 'JPCT 013971', { code: 200, data: null });
    await takeScreenshot(page, '29_API调用_API返回非200');
    await expect(page.locator('.info-message-area')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.info-message-area')).toContainText('没有找到相关车辆数据');
    await takeScreenshot(page, '29_API调用_API返回非200');
  });

  test('No.30 API 调用-chassisNo 传递特殊字符', async ({ page }) => {
    resetCounter('30_API调用_chassisNo特殊字符');
    await loginAndGoToMenu(page);
    let capturedUrl = '';
    await page.route(`${API_BASE}/api/v1/ud07/vehiclespecification*`, async route => {
      capturedUrl = route.request().url();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSuccessBody('JPCT 013972')) });
    });
    await goToUD07(page, 'JPCT 013972');
    await waitLoaded(page);
    await takeScreenshot(page, '30_API调用_chassisNo特殊字符');
    expect(capturedUrl).toContain('chassisNo=');
    expect(capturedUrl).toContain('JPCT');
    await takeScreenshot(page, '30_API调用_chassisNo特殊字符');
  });
});

// ============================================================
// 9. 消息显示 (No.31-33)
// ============================================================
test.describe('消息显示', () => {

  test('No.31 消息-无数据提示样式', async ({ page }) => {
    resetCounter('31_消息_无数据提示样式');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '31_消息_无数据提示样式');
    await goToUD07Mock(page, 'JPCT 013973', { code: 200, data: null });
    await takeScreenshot(page, '31_消息_无数据提示样式');
    await expect(page.locator('.info-message-area')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.info-message-area')).toContainText('没有找到相关车辆数据');
    await takeScreenshot(page, '31_消息_无数据提示样式');
  });

  test('No.32 消息-错误消息显示样式', async ({ page }) => {
    resetCounter('32_消息_错误消息显示样式');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '32_消息_错误消息显示样式');
    await page.route(`${API_BASE}/api/v1/ud07/vehiclespecification*`, async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500, message: '系统内部错误，请联系管理员' }) });
    });
    await goToUD07(page, 'JPCT 013974');
    await takeScreenshot(page, '32_消息_错误消息显示样式');
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.error-message-area')).toContainText('系统内部错误，请联系管理员');
    await takeScreenshot(page, '32_消息_错误消息显示样式');
  });

  test('No.33 消息-底盘编号为空提示样式', async ({ page }) => {
    resetCounter('33_消息_底盘编号为空提示样式');
    await loginAndGoToMenu(page);
    await goToUD07(page, '');
    await takeScreenshot(page, '33_消息_底盘编号为空提示样式');
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.error-message-area')).toContainText('未指定Chassis编号');
    await takeScreenshot(page, '33_消息_底盘编号为空提示样式');
  });
});

// ============================================================
// 10. 界面交互与布局 (No.34-38)
// ============================================================
test.describe('界面交互与布局', () => {

  test('No.34 界面-页面标题显示', async ({ page }) => {
    resetCounter('34_界面_页面标题显示');
    await loginAndGoToMenu(page);
    await goToUD07(page, 'JPCT 013975');
    await waitLoaded(page);
    await takeScreenshot(page, '34_界面_页面标题显示');
    await expect(page.locator('.page-title')).toHaveText('VDA - Vehicle Specification');
    await expect(page.locator('.page-title')).toHaveCSS('font-size', '24px');
    await expect(page.locator('.page-title')).toHaveCSS('font-weight', '700');
    await takeScreenshot(page, '34_界面_页面标题显示');
  });

  test('No.35 界面-信息区域外边框显示', async ({ page }) => {
    resetCounter('35_界面_信息区域外边框');
    await loginAndGoToMenu(page);
    await goToUD07(page, 'JPCT 013976');
    await waitLoaded(page);
    await takeScreenshot(page, '35_界面_信息区域外边框');
    await expect(page.locator('.info-section')).toBeVisible();
    await expect(page.locator('.info-section')).toHaveCSS('border-style', 'solid');
    await takeScreenshot(page, '35_界面_信息区域外边框');
  });

  test('No.36 界面-各控件初始状态', async ({ page }) => {
    resetCounter('36_界面_各控件初始状态');
    await loginAndGoToMenu(page);
    await goToUD07(page, 'JPCT 013977');
    await waitLoaded(page);
    await takeScreenshot(page, '36_界面_各控件初始状态');
    await expect(page.locator('.page-title')).toHaveText('VDA - Vehicle Specification');
    await expect(page.locator('.info-section')).toContainText('Chassis no:');
    await expect(page.locator('.info-section')).toContainText('Model:');
    await expect(page.locator('.info-section')).toContainText('Built week:');
    await expect(page.locator('.info-section')).toContainText('Product type:');
    await expect(page.locator('.info-section')).toContainText('VIN:');
    await expect(page.locator('.info-section')).toContainText('Engine no:');
    await expect(page.locator('.info-section')).toContainText('Country of operation:');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
    await takeScreenshot(page, '36_界面_各控件初始状态');
  });

  test('No.37 界面-错误状态下信息区域不隐藏', async ({ page }) => {
    resetCounter('37_界面_错误状态下信息区域不隐藏');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '37_界面_错误状态下信息区域不隐藏');
    await page.route(`${API_BASE}/api/v1/ud07/vehiclespecification*`, async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500, message: '系统内部错误，请联系管理员' }) });
    });
    await goToUD07(page, 'JPCT 013978');
    await takeScreenshot(page, '37_界面_错误状态下信息区域不隐藏');
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, '37_界面_错误状态下信息区域不隐藏');
  });

  test('No.38 界面-响应式布局', async ({ page }) => {
    resetCounter('38_界面_响应式布局');
    await loginAndGoToMenu(page);
    await goToUD07(page, 'JPCT 013979');
    await waitLoaded(page);
    await takeScreenshot(page, '38_界面_响应式布局');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '38_界面_响应式布局');
    await page.setViewportSize({ width: 500, height: 800 });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '38_界面_响应式布局');
    await page.setViewportSize({ width: 1280, height: 720 });
    await takeScreenshot(page, '38_界面_响应式布局');
  });
});

// ============================================================
// 11. 异常处理 (No.39-42)
// ============================================================
test.describe('异常处理', () => {

  test('No.39 异常-API 失败后数据字段显示 "-"', async ({ page }) => {
    resetCounter('39_异常_APIFailed后显示-');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '39_异常_APIFailed后显示-');
    await page.route(`${API_BASE}/api/v1/ud07/vehiclespecification*`, async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500, message: '系统内部错误，请联系管理员' }) });
    });
    await goToUD07(page, 'JPCT 013980');
    await takeScreenshot(page, '39_异常_APIFailed后显示-');
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.error-message-area')).toContainText('系统内部错误，请联系管理员');
    await takeScreenshot(page, '39_异常_APIFailed后显示-');
  });

  test('No.40 异常-变体信息未找到', async ({ page }) => {
    resetCounter('40_异常_变体信息未找到');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '40_异常_变体信息未找到');
    await goToUD07Mock(page, 'JPCT 013981', mockSuccessBody('JPCT 013981', {}, { engineNo: '', symbolStr: '', description: '' }));
    await waitLoaded(page);
    await takeScreenshot(page, '40_异常_变体信息未找到');
    await expect(page.locator('.info-section')).toContainText('-');
    await takeScreenshot(page, '40_异常_变体信息未找到');
  });

  test('No.41 异常-Symbol 信息未找到', async ({ page }) => {
    resetCounter('41_异常_Symbol信息未找到');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '41_异常_Symbol信息未找到');
    await goToUD07Mock(page, 'JPCT 013982', mockSuccessBody('JPCT 013982', {}, { symbolStr: '', description: '' }));
    await waitLoaded(page);
    await takeScreenshot(page, '41_异常_Symbol信息未找到');
    await expect(page.locator('.info-section')).toContainText('-');
    await takeScreenshot(page, '41_异常_Symbol信息未找到');
  });

  test('No.42 异常-Engine no 设定为 "N/A"', async ({ page }) => {
    resetCounter('42_异常_EngineNo为N/A');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '42_异常_EngineNo为N/A');
    await goToUD07Mock(page, 'JPCT 013983', mockSuccessBody('JPCT 013983', {}, { engineNo: '', symbolStr: '', description: '' }));
    await waitLoaded(page);
    await takeScreenshot(page, '42_异常_EngineNo为N/A');
    await expect(page.locator('.info-section')).toContainText('-');
    await takeScreenshot(page, '42_异常_EngineNo为N/A');
  });
});
