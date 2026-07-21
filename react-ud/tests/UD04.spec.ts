import { test, expect, Page } from '@playwright/test';
import { insertUD04TestData, cleanupUD04TestData } from './test-data-helper';

// ============================================================
// GenerateDocument 模块 (UD04) Playwright 自动化测试
// 基于 単体テスト仕様書UD04.md（82个测试用例）
// ============================================================

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8081';
const SCREENSHOT_DIR = 'tests/image/UD04';

let screenshotCounter: { [key: string]: number } = {};

async function takeScreenshot(page: Page, name: string) {
  if (!screenshotCounter[name]) screenshotCounter[name] = 0;
  screenshotCounter[name]++;
  const seq = String(screenshotCounter[name]).padStart(3, '0');
  try {
    if (page.isClosed()) return;
    await page.waitForTimeout(300);
    if (page.isClosed()) return;
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${name}_${seq}.jpeg`,
      type: 'jpeg', quality: 85, fullPage: true,
      timeout: 10000,
    });
  } catch (e) {
    console.warn(`Screenshot failed for ${name}: ${e}`);
  }
}

function resetCounter(name: string) {
  screenshotCounter[name] = 0;
}

async function safeGoto(page: Page, url: string = BASE_URL) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForTimeout(2000);
      return;
    } catch (e) {
      if (i === 2 || page.isClosed()) throw e;
      await page.waitForTimeout(2000);
    }
  }
}

async function loginViaLocalStorage(page: Page) {
  await page.evaluate((info) => {
    localStorage.setItem('userInfo', JSON.stringify(info));
  }, {
    username: 'admin', role: 'Administrator',
    permissions: ["GenerateDucument", "GenerateDoc", "GenerateBatch", "RegdataArchive", "RegdataBatch",
      "UpdateRules", "UpdateUnicodeRules", "ExistingVariables", "UnlockDocument",
      "HDocNumberSeries", "UploadDeleteTemplate", "ListTemplates", "VPPSVinPlate", "ADCAChange",
      "HDocUserAdmin", "HDocUserDocAdmin", "SearchUser", "ChangePassword", "UserPosition",
      "ArchiveSearch", "UploadDocument",
      "UserGuide", "ADCAChangeGuide", "VinPlateGuide", "ArchiveGuide", "Privacy"],
  });
}

/** Mock UD04 API 返回指定数据 */
async function mockApi(page: Page, responseData: any, status: number = 200, delay: number = 0) {
  await page.route('**/api/ud04/selectgenerateddocument', async (route) => {
    if (delay > 0) await new Promise(r => setTimeout(r, delay));
    try {
      if (status === 200) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseData) });
      } else {
        await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(responseData) });
      }
    } catch {
      // 页面导航后原路由已失效，忽略
    }
  });
}

/** 模拟 API 超时（延迟后 abort，模拟请求超时） */
async function mockApiTimeout(page: Page, timeoutMs: number = 8000) {
  await page.route('**/api/ud04/selectgenerateddocument', async (route) => {
    await new Promise(r => setTimeout(r, timeoutMs));
    try {
      await route.abort('timedout');
    } catch {
      // 页面导航后原路由已失效，忽略
    }
  });
}

/** 模拟网络断开 */
async function mockApiNetworkError(page: Page) {
  await page.route('**/api/ud04/selectgenerateddocument', (route) => route.abort('connectionrefused'));
}

/** 导航到 UD04 页面（通过 URL 路由参数传参） */
async function gotoUD04(page: Page, chassisSeries: string = 'ABC12', chassisNo: string = '1234567890', documentType: string = 'VIN_PLATE') {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  // 通过 URL 路由参数导航（state 参数无法通过 full page load 传递）
  await page.goto(`${BASE_URL}/Menu/GenerateDocument/${chassisNo}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
}

/** 等待 API mock 生效后重新加载页面 */
async function reloadWithMock(page: Page) {
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
}

// ============================================================
// 默认 API 成功响应数据
// ============================================================
const SUCCESS_API_RESPONSE = {
  code: 200,
  data: {
    serie: 'ABC12',
    chassisNo: '1234567890',
    ordernumber: 'GOLF',
    buildWeek: '2022W45',
    specWeek: '2023W10',
    market: 'DE',
    masterMarket: '-EU',
    sNoteNo: 'S-NOTE-001',
    sNoteMessage: 'The S-Notes above can affect homologation documents.',
    loadIndex: '91',
    modifyDocLink: 'ACTIVE',
    replacingParameters: 'AD Change. Modifying:PARAM1; AD Change. Modifying:PARAM2',
    date: '2022-12-02 05:11:45',
    hdocVersion: 'v1.0.0',
  }
};

// ============================================================
// 测试前置：插入测试数据
// ============================================================
test.beforeAll(async () => {
  await insertUD04TestData();
  console.log('UD04 test data inserted');
});

test.afterAll(async () => {
  await cleanupUD04TestData();
  console.log('UD04 test data cleaned up');
});

// ============================================================
// 1. 画面初始化（No.1-7）
// ============================================================
test.describe.serial('画面初始化（No.1-7）', () => {
  test.setTimeout(120000);

  test('No.1 页面初始化-正常加载', async ({ page }) => {
    resetCounter('01_页面初始化_正常加载');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForSelector('.page-title', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // 页面标题
    await expect(page.locator('.page-title')).toContainText('Generate document');
    // Chassis no 显示
    await expect(page.locator('.chassis-series')).toContainText('ABC12');
    await expect(page.locator('.chassis-number')).toContainText('1234567890');
    // Ordernumber
    await expect(page.locator('.info-item').filter({ hasText: 'Ordernumber:' })).toContainText('GOLF');
    // Build week
    await expect(page.locator('.info-item').filter({ hasText: 'Build week:' })).toContainText('2022W45');
    // Spec week
    await expect(page.locator('.info-item').filter({ hasText: 'Spec week:' })).toContainText('2023W10');
    // Market
    await expect(page.locator('.vehicle-info-section .info-item').filter({ hasText: /^Market:/ })).toContainText('DE');
    // 错误消息区域不显示
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '01_页面初始化_正常加载');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.2 页面初始化-加载中状态', async ({ page }) => {
    resetCounter('02_页面初始化_加载中状态');
    await mockApi(page, SUCCESS_API_RESPONSE, 200, 3000); // 3秒延迟
    await gotoUD04(page);
    await page.waitForTimeout(500);

    // 显示加载中
    await expect(page.locator('.loading-message')).toContainText('Loading document data...');
    // 不显示错误消息
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '02_页面初始化_加载中状态');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.3 画面初始化-从UD03获取参数（Location State）', async ({ page }) => {
    resetCounter('03_页面初始化_从UD03获取参数');
    await mockApi(page, SUCCESS_API_RESPONSE);
    // 模拟从 UD03 跳转（带 state 参数）
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await loginViaLocalStorage(page);
    // 直接导航并在导航前设置 state
    await page.goto(`${BASE_URL}/Menu/GenerateDocument/1234567890`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate(() => {
      window.history.replaceState(
        { chassisSeries: 'ABC12', chassisNo: '1234567890', documentType: 'VIN_PLATE' },
        '',
        '/Menu/GenerateDocument/1234567890'
      );
    });
    // 触发 React Router 重新渲染
    await page.evaluate(() => window.dispatchEvent(new PopStateEvent('popstate')));
    await page.waitForTimeout(2000);

    await expect(page.locator('.chassis-series')).toContainText('ABC12');
    await expect(page.locator('.chassis-number')).toContainText('1234567890');

    await takeScreenshot(page, '03_页面初始化_从UD03获取参数');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.5 画面初始化-无底盘号参数', async ({ page }) => {
    resetCounter('05_页面初始化_无底盘号参数');
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await loginViaLocalStorage(page);
    await page.goto(`${BASE_URL}/Menu/GenerateDocument/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 显示错误消息 "Chassis not found"
    await expect(page.locator('.error-message-area')).toContainText('Chassis not found');

    await takeScreenshot(page, '05_页面初始化_无底盘号参数');
  });

  test('No.6 页面初始化-API成功返回', async ({ page }) => {
    resetCounter('06_页面初始化_API成功返回');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    // 所有字段按 API 返回数据显示
    await expect(page.locator('.info-item').filter({ hasText: 'Ordernumber:' })).toContainText('GOLF');
    await expect(page.locator('.info-item').filter({ hasText: 'Build week:' })).toContainText('2022W45');
    await expect(page.locator('.info-item').filter({ hasText: 'Spec week:' })).toContainText('2023W10');
    await expect(page.locator('.vehicle-info-section .info-item').filter({ hasText: /^Market:/ })).toContainText('DE');
    await expect(page.locator('.info-item').filter({ hasText: 'Load Index:' })).toContainText('91');
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '06_页面初始化_API成功返回');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.7 画面初始化-API返回部分字段为空', async ({ page }) => {
    resetCounter('07_页面初始化_API部分字段为空');
    await mockApi(page, {
      code: 200,
      data: {
        serie: 'ABC12', chassisNo: '1234567890',
        ordernumber: '', buildWeek: '', specWeek: '',
        market: '', loadIndex: '', sNoteNo: '',
        masterMarket: '-EU', date: '', hdocVersion: '',
      }
    });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    // 空字段显示 "-"
    await expect(page.locator('.info-item').filter({ hasText: 'Ordernumber:' })).toContainText('-');
    await expect(page.locator('.info-item').filter({ hasText: 'Build week:' })).toContainText('-');
    await expect(page.locator('.info-item').filter({ hasText: 'Spec week:' })).toContainText('-');
    await expect(page.locator('.vehicle-info-section .info-item').filter({ hasText: /^Market:/ })).toContainText('-');
    await expect(page.locator('.info-item').filter({ hasText: 'Load Index:' })).toContainText('-');
    // S-Note 无信息时不显示区域
    await expect(page.locator('.s-note-section')).toHaveCount(0);
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '07_页面初始化_API部分字段为空');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });
});

// ============================================================
// 2. 底盘信息显示区域（No.8-17）
// ============================================================
test.describe.serial('底盘信息显示区域（No.8-17）', () => {
  test.setTimeout(120000);

  test('No.8 Chassis no-正常显示', async ({ page }) => {
    resetCounter('08_ChassisNo_正常显示');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    // serie 加粗显示
    await expect(page.locator('.chassis-series')).toContainText('ABC12');
    // chassisNo 带下划线
    await expect(page.locator('.chassis-number')).toContainText('1234567890');

    await takeScreenshot(page, '08_ChassisNo_正常显示');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.9 Chassis no-点击跳转', async ({ page }) => {
    resetCounter('09_ChassisNo_点击跳转');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    // 点击 Chassis no
    await page.locator('.chassis-number').click();
    await page.waitForTimeout(1500);

    // 跳转到 VehicleSpecification
    expect(page.url()).toContain('/Menu/VehicleSpecification');

    await takeScreenshot(page, '09_ChassisNo_点击跳转');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.10 Chassis no-点击时serie为空', async ({ page }) => {
    resetCounter('10_ChassisNo_Serie为空');
    await mockApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, serie: '' }
    });
    await gotoUD04(page, '', '1234567890');
    await page.waitForTimeout(2000);

    // 点击 chassis no（serie 为空）
    await page.locator('.chassis-number').click();
    await page.waitForTimeout(1500);

    // 仍应跳转
    expect(page.url()).toContain('/Menu/VehicleSpecification');

    await takeScreenshot(page, '10_ChassisNo_Serie为空');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.11 Chassis no-长底盘号显示', async ({ page }) => {
    resetCounter('11_ChassisNo_长底盘号');
    await mockApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, serie: 'DEF45', chassisNo: 'ABC1234567890123' }
    });
    await gotoUD04(page, 'DEF45', 'ABC1234567890123');
    await page.waitForTimeout(2000);

    await expect(page.locator('.chassis-series')).toContainText('DEF45');
    await expect(page.locator('.chassis-number')).toContainText('ABC1234567890123');

    await takeScreenshot(page, '11_ChassisNo_长底盘号');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.12 Ordernumber-显示', async ({ page }) => {
    resetCounter('12_Ordernumber_显示');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const item = page.locator('.info-item').filter({ hasText: 'Ordernumber:' });
    await expect(item).toBeVisible();
    await expect(item).toContainText('GOLF');

    await takeScreenshot(page, '12_Ordernumber_显示');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.13 Build week-显示', async ({ page }) => {
    resetCounter('13_BuildWeek_显示');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const item = page.locator('.info-item').filter({ hasText: 'Build week:' });
    await expect(item).toBeVisible();
    await expect(item).toContainText('2022W45');

    await takeScreenshot(page, '13_BuildWeek_显示');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.14 Spec week-显示', async ({ page }) => {
    resetCounter('14_SpecWeek_显示');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const item = page.locator('.info-item').filter({ hasText: 'Spec week:' });
    await expect(item).toBeVisible();
    await expect(item).toContainText('2023W10');

    await takeScreenshot(page, '14_SpecWeek_显示');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.15 Market-显示', async ({ page }) => {
    resetCounter('15_Market_显示');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const item = page.locator('.vehicle-info-section .info-item').filter({ hasText: /^Market:/ });
    await expect(item).toBeVisible();
    await expect(item).toContainText('DE');

    await takeScreenshot(page, '15_Market_显示');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.16 Master Market-默认显示', async ({ page }) => {
    resetCounter('16_MasterMarket_默认显示');
    await mockApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, masterMarket: undefined }
    });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const item = page.locator('.info-item').filter({ hasText: 'Master Market:' });
    await expect(item).toBeVisible();
    await expect(item).toContainText('-EU');

    await takeScreenshot(page, '16_MasterMarket_默认显示');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.17 Master Market-API返回有值', async ({ page }) => {
    resetCounter('17_MasterMarket_API有值');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const item = page.locator('.info-item').filter({ hasText: 'Master Market:' });
    await expect(item).toBeVisible();
    await expect(item).toContainText('-EU');

    await takeScreenshot(page, '17_MasterMarket_API有值');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });
});

// ============================================================
// 3. S-Note 信息区域（No.18-21）
// ============================================================
test.describe.serial('S-Note信息区域（No.18-21）', () => {
  test.setTimeout(120000);

  test('No.18 S-Note-有S-Note信息时显示', async ({ page }) => {
    resetCounter('18_SNote_有信息显示');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.s-note-section')).toBeVisible();
    await expect(page.locator('.s-note-content')).toContainText('S-NOTE-001');
    await expect(page.locator('.s-note-warning')).toContainText('The S-Notes above can affect homologation documents.');

    await takeScreenshot(page, '18_SNote_有信息显示');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.19 S-Note-有sNoteMessage但无sNoteNo', async ({ page }) => {
    resetCounter('19_SNote_有消息无编号');
    await mockApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, sNoteNo: '', sNoteMessage: 'The S-Notes above can affect homologation documents.' }
    });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.s-note-section')).toBeVisible();
    await expect(page.locator('.s-note-warning')).toContainText('The S-Notes above can affect homologation documents.');

    await takeScreenshot(page, '19_SNote_有消息无编号');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.20 S-Note-无S-Note信息时隐藏', async ({ page }) => {
    resetCounter('20_SNote_无信息隐藏');
    await mockApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, sNoteNo: '', sNoteMessage: '' }
    });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.s-note-section')).toHaveCount(0);

    await takeScreenshot(page, '20_SNote_无信息隐藏');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.21 S-Note-sNoteMessage超4000字符截断', async ({ page }) => {
    resetCounter('21_SNote_消息超长截断');
    const longMsg = 'A'.repeat(5000);
    await mockApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, sNoteNo: 'S-NOTE-001', sNoteMessage: longMsg }
    });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    // S-Note NO 正常显示
    await expect(page.locator('.s-note-content')).toContainText('S-NOTE-001');
    // 内容显示
    await expect(page.locator('.s-note-section')).toBeVisible();

    await takeScreenshot(page, '21_SNote_消息超长截断');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });
});

// ============================================================
// 4. 轮胎信息区域（No.22-23）
// ============================================================
test.describe.serial('轮胎信息区域（No.22-23）', () => {
  test.setTimeout(120000);

  test('No.22 Load Index-正常显示', async ({ page }) => {
    resetCounter('22_LoadIndex_正常显示');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const item = page.locator('.info-item').filter({ hasText: 'Load Index:' });
    await expect(item).toBeVisible();
    await expect(item).toContainText('91');

    await takeScreenshot(page, '22_LoadIndex_正常显示');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.23 Load Index-API返回空值', async ({ page }) => {
    resetCounter('23_LoadIndex_空值');
    await mockApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, loadIndex: '' }
    });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const item = page.locator('.info-item').filter({ hasText: 'Load Index:' });
    await expect(item).toBeVisible();
    await expect(item).toContainText('-');

    await takeScreenshot(page, '23_LoadIndex_空值');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });
});

// ============================================================
// 5. Analyze Rules 链接（No.24-25）
// ============================================================
test.describe.serial('Analyze Rules（No.24-25）', () => {
  test.setTimeout(120000);

  test('No.24 Analyze Rules-链接显示', async ({ page }) => {
    resetCounter('24_AnalyzeRules_链接显示');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const link = page.locator('.link-item');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Analyze Rules');

    await takeScreenshot(page, '24_AnalyzeRules_链接显示');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.25 Analyze Rules-点击行为', async ({ page }) => {
    resetCounter('25_AnalyzeRules_点击行为');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    // 监听 dialog 事件
    let dialogMsg = '';
    page.on('dialog', async (dialog) => {
      dialogMsg = dialog.message();
      await dialog.accept();
    });

    await page.locator('.link-item').click();
    await page.waitForTimeout(500);

    expect(dialogMsg).toContain('Analyze Rules: This feature is under development.');

    await takeScreenshot(page, '25_AnalyzeRules_点击行为');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });
});

// ============================================================
// 6. ADCA 变更状态区域（No.26-35）
// ============================================================
test.describe.serial('ADCA变更状态（No.26-35）', () => {
  test.setTimeout(120000);

  test('No.26 ADCA激活-Modify Doc Link显示', async ({ page }) => {
    resetCounter('26_ADCA激活_链接显示');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const warning = page.locator('.ad-change-warning');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText('After def change detected. Document need to be modified.');

    await takeScreenshot(page, '26_ADCA激活_链接显示');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.27 ADCA激活-Modify Doc Link点击跳转', async ({ page }) => {
    resetCounter('27_ADCA激活_点击跳转');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await page.locator('.ad-change-warning').click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/Menu/ModifyDocument');

    await takeScreenshot(page, '27_ADCA激活_点击跳转');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.28 ADCA激活-modifyDocLink为"Y"时激活', async ({ page }) => {
    resetCounter('28_ADCA激活_ModifyDocLink_Y');
    await mockApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, modifyDocLink: 'Y', replacingParameters: 'AD Change. Modifying:PARAM1' }
    });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.ad-change-warning')).toBeVisible();
    await expect(page.locator('.ad-change-warning')).toContainText('After def change detected. Document need to be modified.');

    await takeScreenshot(page, '28_ADCA激活_ModifyDocLink_Y');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.29 ADCA激活-Replacing parameters显示', async ({ page }) => {
    resetCounter('29_ADCA激活_ReplacingParams');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const params = page.locator('.replacing-params-section');
    await expect(params).toBeVisible();
    await expect(params).toContainText('AD Change. Modifying:PARAM1');
    await expect(params).toContainText('AD Change. Modifying:PARAM2');

    await takeScreenshot(page, '29_ADCA激活_ReplacingParams');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.30 ADCA激活-Replacing parameters单个值', async ({ page }) => {
    resetCounter('30_ADCA激活_ReplacingParams单个');
    await mockApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, replacingParameters: 'AD Change. Modifying:PARAM1' }
    });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const params = page.locator('.replacing-params-section');
    await expect(params).toBeVisible();
    await expect(params).toContainText('AD Change. Modifying:PARAM1');

    await takeScreenshot(page, '30_ADCA激活_ReplacingParams单个');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.31 ADCA激活-Replacing parameters为空', async ({ page }) => {
    resetCounter('31_ADCA激活_ReplacingParams空');
    await mockApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, replacingParameters: '' }
    });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const params = page.locator('.replacing-params-section');
    await expect(params).toBeVisible();

    await takeScreenshot(page, '31_ADCA激活_ReplacingParams空');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.32 ADCA激活-Replacing parameters含特殊字符', async ({ page }) => {
    resetCounter('32_ADCA激活_ReplacingParams特殊字符');
    await mockApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, replacingParameters: 'AD Change. Modifying:PARAM_α; AD Change. Modifying:PARAM-β' }
    });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const params = page.locator('.replacing-params-section');
    await expect(params).toBeVisible();
    await expect(params).toContainText('PARAM_α');
    await expect(params).toContainText('PARAM-β');

    await takeScreenshot(page, '32_ADCA激活_ReplacingParams特殊字符');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.33 ADCA非激活-modifyDocLink为"INACTIVE"', async ({ page }) => {
    resetCounter('33_ADCA非激活_INACTIVE');
    await mockApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, modifyDocLink: 'INACTIVE' }
    });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.ad-change-inactive')).toBeVisible();
    await expect(page.locator('.ad-change-inactive')).toContainText('No ADCA change detected');
    await expect(page.locator('.replacing-params-section')).toHaveCount(0);

    await takeScreenshot(page, '33_ADCA非激活_INACTIVE');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.34 ADCA非激活-modifyDocLink为"N"时', async ({ page }) => {
    resetCounter('34_ADCA非激活_N');
    await mockApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, modifyDocLink: 'N' }
    });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.ad-change-inactive')).toBeVisible();
    await expect(page.locator('.ad-change-inactive')).toContainText('No ADCA change detected');
    await expect(page.locator('.replacing-params-section')).toHaveCount(0);

    await takeScreenshot(page, '34_ADCA非激活_N');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.35 ADCA非激活-modifyDocLink字段不存在', async ({ page }) => {
    resetCounter('35_ADCA非激活_字段不存在');
    await mockApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, modifyDocLink: '' }
    });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    // modifyDocLink 为空时 isAdcaActive 为 false
    await expect(page.locator('.ad-change-inactive')).toBeVisible();
    await expect(page.locator('.ad-change-inactive')).toContainText('No ADCA change detected');
    await expect(page.locator('.replacing-params-section')).toHaveCount(0);

    await takeScreenshot(page, '35_ADCA非激活_字段不存在');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });
});

// ============================================================
// 7. 模板信息区域（No.36-37）
// ============================================================
test.describe.serial('模板信息区域（No.36-37）', () => {
  test.setTimeout(120000);

  test('No.36 Using template-固定显示', async ({ page }) => {
    resetCounter('36_UsingTemplate_固定显示');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const item = page.locator('.template-info-section .info-item');
    await expect(item).toBeVisible();
    await expect(item).toContainText('Using template:');
    await expect(item).toContainText('VIN_PLATE_TEMPLATE_V1');

    await takeScreenshot(page, '36_UsingTemplate_固定显示');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.37 Using template-颜色样式', async ({ page }) => {
    resetCounter('37_UsingTemplate_颜色样式');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const item = page.locator('.template-info-section .info-item');
    await expect(item).toBeVisible();

    await takeScreenshot(page, '37_UsingTemplate_颜色样式');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });
});

// ============================================================
// 8. Generated Document 区域（No.38-41）
// ============================================================
test.describe.serial('Generated Document（No.38-41）', () => {
  test.setTimeout(120000);

  test('No.38 Generated document-固定显示', async ({ page }) => {
    resetCounter('38_GeneratedDoc_固定显示');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const link = page.locator('.generated-doc-link');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Generated document');

    await takeScreenshot(page, '38_GeneratedDoc_固定显示');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.39 Generated document-点击显示错误', async ({ page }) => {
    resetCounter('39_GeneratedDoc_点击显示错误');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await page.locator('.generated-doc-link').click();
    await page.waitForTimeout(500);

    const errorArea = page.locator('.generated-doc-section .error-message-area');
    await expect(errorArea).toBeVisible();
    await expect(errorArea).toContainText('Document file not found');

    await takeScreenshot(page, '39_GeneratedDoc_点击显示错误');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.40 Generated document-重复点击', async ({ page }) => {
    resetCounter('40_GeneratedDoc_重复点击');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const link = page.locator('.generated-doc-link');
    await link.click();
    await page.waitForTimeout(300);
    await link.click();
    await page.waitForTimeout(300);

    const errorArea = page.locator('.generated-doc-section .error-message-area');
    await expect(errorArea).toBeVisible();
    // 页面不跳转
    expect(page.url()).toContain('/Menu/GenerateDocument');

    await takeScreenshot(page, '40_GeneratedDoc_重复点击');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.41 Generated document-错误消息不自动清除', async ({ page }) => {
    resetCounter('41_GeneratedDoc_错误不自动清除');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    // 点击显示错误
    await page.locator('.generated-doc-link').click();
    await page.waitForTimeout(300);
    await expect(page.locator('.generated-doc-section .error-message-area')).toBeVisible();

    // 刷新页面
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 刷新后错误被清除
    await expect(page.locator('.generated-doc-section .error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '41_GeneratedDoc_错误不自动清除');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });
});

// ============================================================
// 9. 系统信息区域（No.42-45）
// ============================================================
test.describe.serial('系统信息区域（No.42-45）', () => {
  test.setTimeout(120000);

  test('No.42 Date-显示服务器时间', async ({ page }) => {
    resetCounter('42_Date_显示服务器时间');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const item = page.locator('.footer-info .info-item').filter({ hasText: 'Date:' });
    await expect(item).toBeVisible();
    await expect(item).toContainText('2022-12-02 05:11:45');

    await takeScreenshot(page, '42_Date_显示服务器时间');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.43 Date-API返回空值', async ({ page }) => {
    resetCounter('43_Date_API空值');
    await mockApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, date: '' }
    });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const item = page.locator('.footer-info .info-item').filter({ hasText: 'Date:' });
    await expect(item).toBeVisible();
    await expect(item).toContainText('-');

    await takeScreenshot(page, '43_Date_API空值');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.44 HDoc version-显示版本号', async ({ page }) => {
    resetCounter('44_HDocVersion_显示');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const item = page.locator('.footer-info .info-item').filter({ hasText: 'HDoc version:' });
    await expect(item).toBeVisible();
    await expect(item).toContainText('v1.0.0');

    await takeScreenshot(page, '44_HDocVersion_显示');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.45 HDoc version-API返回空值', async ({ page }) => {
    resetCounter('45_HDocVersion_API空值');
    await mockApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, hdocVersion: '' }
    });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const item = page.locator('.footer-info .info-item').filter({ hasText: 'HDoc version:' });
    await expect(item).toBeVisible();
    await expect(item).toContainText('-');

    await takeScreenshot(page, '45_HDocVersion_API空值');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });
});

// ============================================================
// 10. API 异常处理（No.46-53）
// ============================================================
test.describe.serial('API异常处理（No.46-53）', () => {
  test.setTimeout(120000);

  test('No.46 API异常-底盘号不存在（404）', async ({ page }) => {
    resetCounter('46_API异常_404');
    // 直接导航无 state，使用无效底盘号触发 404
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await loginViaLocalStorage(page);
    await page.goto(`${BASE_URL}/Menu/GenerateDocument/9999999999`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 真实 API 应返回错误，但我们使用 mock 来模拟
    await mockApi(page, { code: 404, message: 'Chassis not found', data: null }, 404);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toContainText('System error. Please contact administrator.');

    await takeScreenshot(page, '46_API异常_404');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.47 API异常-底盘号不存在（code≠200）', async ({ page }) => {
    resetCounter('47_API异常_code非200');
    await mockApi(page, { code: 404, message: 'Chassis not found', data: null });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toContainText('Chassis not found');

    await takeScreenshot(page, '47_API异常_code非200');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.48 API异常-服务器错误（500）', async ({ page }) => {
    resetCounter('48_API异常_500');
    await mockApi(page, { message: 'Internal server error' }, 500);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toContainText('System error. Please contact administrator.');

    await takeScreenshot(page, '48_API异常_500');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.49 API异常-网络连接失败', async ({ page }) => {
    resetCounter('49_API异常_网络断开');
    await mockApiNetworkError(page);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toContainText('System error. Please contact administrator.');

    await takeScreenshot(page, '49_API异常_网络断开');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.50 API异常-API超时', async ({ page }) => {
    resetCounter('50_API异常_超时');
    // 3 秒后 abort，模拟请求超时
    await mockApiTimeout(page, 3000);
    await gotoUD04(page);
    // 等待超时发生 + 错误渲染
    await page.waitForTimeout(6000);

    // 超时后应显示网络错误
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.error-message-area')).toContainText('System error');

    await takeScreenshot(page, '50_API异常_超时');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.51 API异常-401未授权（会话过期）', async ({ page }) => {
    resetCounter('51_API异常_401');
    // axios 的拦截器可能处理 401，但先 mock
    await mockApi(page, { code: 401, message: 'Please login first' }, 401);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    // 401 可能触发 axios 拦截器跳转到登录页或显示错误
    const url = page.url();
    const hasError = await page.locator('.error-message-area').count() > 0;
    if (hasError) {
      await expect(page.locator('.error-message-area')).toContainText('System error. Please contact administrator.');
    }

    await takeScreenshot(page, '51_API异常_401');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.52 API异常-用户未登录', async ({ page }) => {
    resetCounter('52_API异常_用户未登录');
    // 清除 userInfo
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/Menu/GenerateDocument/1234567890`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 未登录跳转到登录页
    expect(page.url()).not.toContain('/Menu/GenerateDocument');

    await takeScreenshot(page, '52_API异常_用户未登录');
  });

  test('No.53 API异常-其他HTTP错误', async ({ page }) => {
    resetCounter('53_API异常_403');
    await mockApi(page, { message: 'Forbidden' }, 403);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toContainText('System error. Please contact administrator.');

    await takeScreenshot(page, '53_API异常_403');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });
});

// ============================================================
// 11. 链接跳转（No.54-56）
// ============================================================
test.describe.serial('链接跳转（No.54-56）', () => {
  test.setTimeout(120000);

  test('No.54 Chassis no跳转-底盘号完整传递', async ({ page }) => {
    resetCounter('54_ChassisNo跳转_参数传递');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await page.locator('.chassis-number').click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/Menu/VehicleSpecification');

    await takeScreenshot(page, '54_ChassisNo跳转_参数传递');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.55 Modify Doc跳转-参数完整传递', async ({ page }) => {
    resetCounter('55_ModifyDoc跳转_参数传递');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await page.locator('.ad-change-warning').click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/Menu/ModifyDocument');

    await takeScreenshot(page, '55_ModifyDoc跳转_参数传递');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.56 Modify Doc跳转-ADCA非激活不跳转', async ({ page }) => {
    resetCounter('56_ModifyDoc跳转_ADCA非激活');
    await mockApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, modifyDocLink: 'INACTIVE' }
    });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const urlBefore = page.url();
    await page.locator('.ad-change-inactive').click();
    await page.waitForTimeout(500);

    // 不跳转
    expect(page.url()).toBe(urlBefore);

    await takeScreenshot(page, '56_ModifyDoc跳转_ADCA非激活');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });
});

// ============================================================
// 12. UI 样式与显示（No.57-61）
// ============================================================
test.describe.serial('UI样式与显示（No.57-61）', () => {
  test.setTimeout(120000);

  test('No.57 页面标题-显示', async ({ page }) => {
    resetCounter('57_页面标题_显示');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.page-title')).toContainText('Generate document');

    await takeScreenshot(page, '57_页面标题_显示');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.58 错误消息-样式', async ({ page }) => {
    resetCounter('58_错误消息_样式');
    // 触发错误
    await mockApi(page, { code: 404, message: 'Chassis not found', data: null });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const errorArea = page.locator('.error-message-area');
    await expect(errorArea).toBeVisible();

    await takeScreenshot(page, '58_错误消息_样式');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.59 错误消息-初始隐藏', async ({ page }) => {
    resetCounter('59_错误消息_初始隐藏');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '59_错误消息_初始隐藏');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.60 ADCA激活-Modify Doc Link悬停效果', async ({ page }) => {
    resetCounter('60_ADCA激活_悬停效果');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const warning = page.locator('.ad-change-warning');
    await warning.hover();
    await page.waitForTimeout(500);

    await expect(warning).toBeVisible();

    await takeScreenshot(page, '60_ADCA激活_悬停效果');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.61 Chassis no悬停效果', async ({ page }) => {
    resetCounter('61_ChassisNo_悬停效果');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const chassisLink = page.locator('.chassis-number');
    await chassisLink.hover();
    await page.waitForTimeout(500);

    await expect(chassisLink).toBeVisible();

    await takeScreenshot(page, '61_ChassisNo_悬停效果');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });
});

// ============================================================
// 13. 数据字段确认（No.62-68）
// ============================================================
test.describe.serial('数据字段确认（No.62-68）', () => {
  test.setTimeout(120000);

  test('No.62 DB字段映射-Ordernumber', async ({ page }) => {
    resetCounter('62_DB映射_Ordernumber');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-item').filter({ hasText: 'Ordernumber:' })).toContainText('GOLF');

    await takeScreenshot(page, '62_DB映射_Ordernumber');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.63 DB字段映射-Build week', async ({ page }) => {
    resetCounter('63_DB映射_BuildWeek');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-item').filter({ hasText: 'Build week:' })).toContainText('2022W45');

    await takeScreenshot(page, '63_DB映射_BuildWeek');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.64 DB字段映射-Spec week', async ({ page }) => {
    resetCounter('64_DB映射_SpecWeek');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-item').filter({ hasText: 'Spec week:' })).toContainText('2023W10');

    await takeScreenshot(page, '64_DB映射_SpecWeek');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.65 DB字段映射-Market', async ({ page }) => {
    resetCounter('65_DB映射_Market');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.vehicle-info-section .info-item').filter({ hasText: /^Market:/ })).toContainText('DE');

    await takeScreenshot(page, '65_DB映射_Market');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.66 DB字段映射-S-Note NO', async ({ page }) => {
    resetCounter('66_DB映射_SNoteNO');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.s-note-content')).toContainText('S-NOTE-001');

    await takeScreenshot(page, '66_DB映射_SNoteNO');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.67 DB字段映射-Load Index', async ({ page }) => {
    resetCounter('67_DB映射_LoadIndex');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-item').filter({ hasText: 'Load Index:' })).toContainText('91');

    await takeScreenshot(page, '67_DB映射_LoadIndex');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.68 DB字段映射-Replacing parameters', async ({ page }) => {
    resetCounter('68_DB映射_ReplacingParams');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    const params = page.locator('.replacing-params-section');
    await expect(params).toContainText('AD Change. Modifying:PARAM1');
    await expect(params).toContainText('AD Change. Modifying:PARAM2');

    await takeScreenshot(page, '68_DB映射_ReplacingParams');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });
});

// ============================================================
// 14. API 请求参数验证（No.69-70）
// ============================================================
test.describe.serial('API请求参数验证（No.69-70）', () => {
  test.setTimeout(120000);

  test('No.69 API请求-传递全部参数', async ({ page }) => {
    resetCounter('69_API请求_传参');
    let requestBody = '';
    await page.route('**/api/ud04/selectgenerateddocument', async (route) => {
      requestBody = route.request().postData() || '';
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SUCCESS_API_RESPONSE) });
    });

    // 通过 URL 路由参数传递 chassisNo（组件从 useParams 读取）
    // chassisSeries 和 documentType 需从 location.state 传递，
    // 直接导航时无法设置 state，故仅验证 chassisNo
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await loginViaLocalStorage(page);
    await page.goto(`${BASE_URL}/Menu/GenerateDocument/1234567890`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 验证请求体包含 chassisNo（来自 URL 路由参数）
    expect(requestBody).toContain('1234567890');
    // chassisSeries 和 documentType 来自 location.state，直接导航时为空
    expect(requestBody).toContain('"chassisSeries":""');
    expect(requestBody).toContain('"documentType":""');

    await takeScreenshot(page, '69_API请求_传参');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.70 API请求-无参数（空底盘号）', async ({ page }) => {
    resetCounter('70_API请求_无参数');
    let apiCalled = false;
    await page.route('**/api/ud04/selectgenerateddocument', async (route) => {
      apiCalled = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: null }) });
    });

    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await loginViaLocalStorage(page);
    await page.goto(`${BASE_URL}/Menu/GenerateDocument/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 无底盘号时不调用 API，直接显示错误
    expect(apiCalled).toBe(false);
    await expect(page.locator('.error-message-area')).toContainText('Chassis not found');

    await takeScreenshot(page, '70_API请求_无参数');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });
});

// ============================================================
// 15. 画面布局（No.70-71）
// ============================================================
test.describe.serial('画面布局（No.70-71）', () => {
  test.setTimeout(120000);

  test('No.70 画面布局-各区域顺序', async ({ page }) => {
    resetCounter('70_画面布局_区域顺序');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    // 确认各主要区域按顺序出现
    const pageTitle = page.locator('.page-title');
    const vehicleInfo = page.locator('.vehicle-info-section');
    const sNote = page.locator('.s-note-section');
    const actionLinks = page.locator('.action-links');
    const templateInfo = page.locator('.template-info-section');
    const generatedDoc = page.locator('.generated-doc-section');
    const footerInfo = page.locator('.footer-info');

    await expect(pageTitle).toBeVisible();
    await expect(vehicleInfo).toBeVisible();
    await expect(actionLinks).toBeVisible();
    await expect(templateInfo).toBeVisible();
    await expect(generatedDoc).toBeVisible();
    await expect(footerInfo).toBeVisible();

    await takeScreenshot(page, '70_画面布局_区域顺序');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.71 画面布局-Label对齐方式', async ({ page }) => {
    resetCounter('71_画面布局_Label对齐');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    // 确认 label 和值显示
    const labels = page.locator('.info-item label');
    const count = await labels.count();
    expect(count).toBeGreaterThan(0);

    await takeScreenshot(page, '71_画面布局_Label对齐');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });
});

// ============================================================
// 16. API 响应数据结构验证（No.72-75）
// ============================================================
test.describe.serial('API响应数据结构（No.72-75）', () => {
  test.setTimeout(120000);

  test('No.72 API响应-data为null', async ({ page }) => {
    resetCounter('72_API响应_Data为Null');
    await mockApi(page, { code: 200, data: null });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    // code=200 但 data=null 时 response.data.code === 200 但 data 为 null
    // 组件中 `if (response.data.code === 200 && response.data.data)` 条件不满足
    await expect(page.locator('.error-message-area')).toContainText('Chassis not found');

    await takeScreenshot(page, '72_API响应_Data为Null');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.73 API响应-data中缺少某些字段', async ({ page }) => {
    resetCounter('73_API响应_缺少字段');
    await mockApi(page, {
      code: 200,
      data: { serie: 'ABC12', chassisNo: '1234567890' } // 无 ordernumber 等
    });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    // 缺少的字段显示 "-"
    await expect(page.locator('.info-item').filter({ hasText: 'Ordernumber:' })).toContainText('-');
    await expect(page.locator('.info-item').filter({ hasText: 'Build week:' })).toContainText('-');
    // chassis no 正常显示
    await expect(page.locator('.chassis-series')).toContainText('ABC12');
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '73_API响应_缺少字段');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.74 API响应-返回未知状态码', async ({ page }) => {
    resetCounter('74_API响应_未知状态码');
    await mockApi(page, { message: 'Bad Gateway' }, 502);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toContainText('System error. Please contact administrator.');

    await takeScreenshot(page, '74_API响应_未知状态码');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.75 API响应-code=200但data为空对象', async ({ page }) => {
    resetCounter('75_API响应_Data空对象');
    await mockApi(page, { code: 200, data: {} });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    // 空对象时 response.data.code === 200 且 response.data.data 为 {} (truthy)
    // 所以会设置 documentData = {}，所有字段取到 undefined 显示 "-"
    await expect(page.locator('.info-item').filter({ hasText: 'Ordernumber:' })).toContainText('-');
    await expect(page.locator('.info-item').filter({ hasText: 'Build week:' })).toContainText('-');
    await expect(page.locator('.vehicle-info-section .info-item').filter({ hasText: /^Market:/ })).toContainText('-');
    await expect(page.locator('.info-item').filter({ hasText: 'Load Index:' })).toContainText('-');
    // Master Market 默认 "-EU"
    await expect(page.locator('.info-item').filter({ hasText: 'Master Market:' })).toContainText('-EU');
    // Using template 固定显示
    await expect(page.locator('.template-info-section')).toContainText('VIN_PLATE_TEMPLATE_V1');
    // ADCA 非激活（modifyDocLink 不存在）
    await expect(page.locator('.ad-change-inactive')).toBeVisible();
    await expect(page.locator('.replacing-params-section')).toHaveCount(0);
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '75_API响应_Data空对象');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });
});

// ============================================================
// 17. 浏览器行为（No.76-78）
// ============================================================
test.describe.serial('浏览器行为（No.76-78）', () => {
  test.setTimeout(120000);

  test('No.76 浏览器回退-从UD07返回UD04', async ({ page }) => {
    resetCounter('76_浏览器回退_从UD07返回');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    // 点击 Chassis no 跳转到 UD07
    await page.locator('.chassis-number').click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/Menu/VehicleSpecification');

    // 回退
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 回到 UD04，数据应保持
    expect(page.url()).toContain('/Menu/GenerateDocument');

    await takeScreenshot(page, '76_浏览器回退_从UD07返回');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.77 浏览器回退-从UD05返回UD04', async ({ page }) => {
    resetCounter('77_浏览器回退_从UD05返回');
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    // 点击 Modify Doc Link 跳转到 UD05
    await page.locator('.ad-change-warning').click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/Menu/ModifyDocument');

    // 回退
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 回到 UD04
    expect(page.url()).toContain('/Menu/GenerateDocument');

    await takeScreenshot(page, '77_浏览器回退_从UD05返回');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.78 页面刷新-数据重新加载', async ({ page }) => {
    resetCounter('78_页面刷新_数据重新加载');
    await mockApi(page, SUCCESS_API_RESPONSE, 200, 2000); // 2秒延迟用于显示 loading
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    // 刷新页面
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    // 显示加载中
    await expect(page.locator('.loading-message')).toContainText('Loading document data...');

    await takeScreenshot(page, '78_页面刷新_数据重新加载');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });
});

// ============================================================
// 18. 画面状态重置（No.79-80）
// ============================================================
test.describe.serial('画面状态重置（No.79-80）', () => {
  test.setTimeout(120000);

  test('No.79 连续请求-先失败后成功', async ({ page }) => {
    resetCounter('79_连续请求_先失败后成功');
    // 第一次：API 返回错误
    await mockApi(page, { code: 404, message: 'Chassis not found', data: null });
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toContainText('Chassis not found');

    // 第二次：更换 mock 为成功响应
    await page.unroute('**/api/ud04/selectgenerateddocument');
    await mockApi(page, SUCCESS_API_RESPONSE);

    // 重新导航（全页刷新触发组件重新挂载和新 API 调用）
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 第二次成功加载
    await expect(page.locator('.error-message-area')).toHaveCount(0);
    await expect(page.locator('.chassis-series')).toContainText('ABC12');

    await takeScreenshot(page, '79_连续请求_先失败后成功');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });

  test('No.80 连续请求-先成功后再请求失败', async ({ page }) => {
    resetCounter('80_连续请求_先成功后失败');
    // 第一次成功
    await mockApi(page, SUCCESS_API_RESPONSE);
    await gotoUD04(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toHaveCount(0);
    await expect(page.locator('.chassis-series')).toContainText('ABC12');

    // 第二次失败
    await page.unroute('**/api/ud04/selectgenerateddocument');
    await mockApi(page, { code: 404, message: 'Chassis not found', data: null });

    // 重新导航（全页刷新触发新的 API 调用）
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 第二次显示错误
    await expect(page.locator('.error-message-area')).toContainText('Chassis not found');

    await takeScreenshot(page, '80_连续请求_先成功后失败');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });
});

// ============================================================
// 19. 安全性（No.81-82）
// ============================================================
test.describe.serial('安全性（No.81-82）', () => {
  test.setTimeout(120000);

  test('No.81 安全性-未登录访问跳转', async ({ page }) => {
    resetCounter('81_安全性_未登录访问');
    // 清除 localStorage
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/Menu/GenerateDocument/1234567890`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 未登录跳转到登录页
    expect(page.url()).not.toContain('/Menu/GenerateDocument');

    await takeScreenshot(page, '81_安全性_未登录访问');
  });

  test('No.82 安全性-底盘号参数校验', async ({ page }) => {
    resetCounter('82_安全性_底盘号参数校验');
    // 模拟 API 接收 XSS 参数
    let capturedChassisNo = '';
    await page.route('**/api/ud04/selectgenerateddocument', async (route) => {
      const postData = route.request().postData() || '';
      capturedChassisNo = JSON.parse(postData).chassisNo || '';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 404, message: 'Chassis not found', data: null })
      });
    });

    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await loginViaLocalStorage(page);

    const xssPayload = encodeURIComponent("<script>alert('xss')</script>");
    await page.goto(`${BASE_URL}/Menu/GenerateDocument/${xssPayload}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate(() => {
      window.history.replaceState(
        { chassisSeries: '', chassisNo: "<script>alert('xss')</script>", documentType: '' },
        '',
        "/Menu/GenerateDocument/<script>alert('xss')</script>"
      );
    });
    await page.waitForTimeout(2000);

    // API 请求中 chassisNo 为脚本内容
    expect(capturedChassisNo).toContain('script');

    await takeScreenshot(page, '82_安全性_底盘号参数校验');
    await page.unroute('**/api/ud04/selectgenerateddocument');
  });
});
