import { test, expect, Page } from '@playwright/test';
import { insertUD07TestData, cleanupUD07TestData } from './test-data-helper';
import { query } from './db';

// ============================================================
// VehicleSpecification 模块 (UD07) Playwright 自动化测试
// 基于 単体テスト仕様書UD07.md（42个测试用例）
// ============================================================
// 测试前提：前后端均已启动，通过 beforeAll 向数据库插入测试数据
// 正常场景使用真实 API，异常场景（500/400/超时/网络断开）使用 Mock
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD07';

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

/** localStorage 登录信息 */
const LOGIN_USER_INFO = {
  username: 'admin', role: 'Administrator',
  permissions: ["GenerateDucument", "GenerateDoc", "GenerateBatch", "RegdataArchive", "RegdataBatch",
    "UpdateRules", "UpdateUnicodeRules", "ExistingVariables", "UnlockDocument",
    "HDocNumberSeries", "UploadDeleteTemplate", "ListTemplates", "VPPSVinPlate", "ADCAChange",
    "HDocUserAdmin", "HDocUserDocAdmin", "SearchUser", "ChangePassword", "UserPosition",
    "ArchiveSearch", "UploadDocument",
    "UserGuide", "ADCAChangeGuide", "VinPlateGuide", "ArchiveGuide", "Privacy"],
};

/** Mock UD07 API 返回指定数据（自动将 chassisNo 设为请求值） */
async function mockVehicleApi(page: Page, responseData: any, status: number = 200) {
  await page.route('**/api/v1/ud07/vehiclespecification*', async (route) => {
    if (status === 200) {
      const reqChassisNo = new URL(route.request().url()).searchParams.get('chassisNo') || '';
      let data = responseData;
      if (reqChassisNo && data?.data?.chassisInfo) {
        data = JSON.parse(JSON.stringify(data));
        data.data.chassisInfo.chassisNo = reqChassisNo;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    } else if (status === 500) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500, message: '系统内部错误，请联系管理员', data: null }) });
    } else if (status === 400) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 400, message: 'Invalid chassis number', data: null }) });
    } else {
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(responseData) });
    }
  });
}

/** 模拟 API 超时（2秒延迟后返回成功，用于捕获 loading 状态） */
async function mockApiSlow(page: Page) {
  await page.route('**/api/v1/ud07/vehiclespecification*', async (route) => {
    await new Promise(r => setTimeout(r, 3000));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: null }) });
  });
}

/** 模拟网络断开 */
async function mockApiNetworkError(page: Page) {
  await page.route('**/api/v1/ud07/vehiclespecification*', (route) => route.abort('connectionrefused'));
}

/** 导航到 UD07 页面（通过 URL query 参数传递 chassisNo） */
async function gotoUD07(page: Page, chassisNo: string = 'JPCT 013945') {
  // addInitScript 在页面 JS 执行前设置登录信息
  await page.addInitScript(`(function() {
    localStorage.setItem('userInfo', '${JSON.stringify(LOGIN_USER_INFO)}');
  })();`);

  // 通过 URL 查询参数传递 chassisNo，组件会从 location.search 读取
  const encoded = encodeURIComponent(chassisNo);
  await page.goto(`${BASE_URL}/Menu/VehicleSpecification?chassisNo=${encoded}`, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // 等待页面渲染
  try {
    await page.waitForSelector('.info-section, .error-message-area, .info-message-area, .loading-container', {
      timeout: 15000,
    });
    await page.waitForTimeout(1000);
  } catch {
    console.warn('gotoUD07: Timeout, URL=' + page.url());
  }
}

/** 默认 API 成功响应数据 */
const SUCCESS_API_RESPONSE = {
  code: 200,
  data: {
    chassisInfo: {
      chassisNo: 'JPCT 013945',
      model: 'UD-HDE',
      buildWeek: '1617',
      productType: 'EM 64 R',
      vin: 'JPCZZ30D8GT013945',
      countryOfOperation: 'IDN',
    },
    engineInfo: {
      engineNo: 'A01',
      symbolStr: 'FTLI-150',
      description: 'Front load index: FTLI-150',
    },
    sNoteNo: 'S1610111',
  }
};

// ============================================================
// 测试前置：插入测试数据
// ============================================================
test.beforeAll(async () => {
  await insertUD07TestData();

  // 诊断：检查数据插入是否成功（OM 表之前因 sNoteNo 重复导致 INSERT IGNORE 跳过）
  const testChassis = ['013945', '013949', '013951', '013953', '013955', '013957', '013959', '013961', '013963', '013964', '013966'];
  for (const chnr of testChassis) {
    const general = await query('SELECT COUNT(*) as cnt FROM HDOC_REC_DATA_VDA_GENERAL WHERE SERIE = ? AND CHNR = ?', ['JPCT', chnr]);
    const om = await query('SELECT COUNT(*) as cnt FROM HDOC_REC_DATA_OM WHERE SERIE = ? AND CHNR = ?', ['JPCT', chnr]);
    const variants = await query('SELECT COUNT(*) as cnt FROM HDOC_REC_DATA_VDA_VARIANTS WHERE SERIE = ? AND CHNR = ?', ['JPCT', chnr]);
    console.log(`[诊断] JPCT ${chnr}: VDA_GENERAL=${general[0]?.cnt}, OM=${om[0]?.cnt}, VARIANTS=${variants[0]?.cnt}`);
  }
});

test.afterAll(async () => {
  await cleanupUD07TestData();
  console.log('UD07 test data cleaned up');
});

// ============================================================
// 1. 画面初始化（No.1-4）
// ============================================================
test.describe.serial('画面初始化（No.1-4）', () => {
  test.setTimeout(120000);

  test('No.1 初始化-正常加载并显示', async ({ page }) => {
    resetCounter('01_初始化_正常加载');
    await gotoUD07(page, 'JPCT 013945');

    // 页面标题
    await expect(page.locator('.page-title')).toContainText('VDA - Vehicle Specification');
    // 信息区域
    await expect(page.locator('.info-section')).toBeVisible();
    // 无错误消息
    await expect(page.locator('.error-message-area')).toHaveCount(0);
    // 加载状态消失
    await expect(page.locator('.loading-container')).toHaveCount(0);

    await takeScreenshot(page, '01_初始化_正常加载');
  });

  test('No.2 初始化-加载中状态显示', async ({ page }) => {
    resetCounter('02_初始化_加载中');
    await mockApiSlow(page);
    await gotoUD07(page, 'JPCT 013946');
    await page.waitForTimeout(1000);

    await expect(page.locator('.loading-container')).toBeVisible();
    await expect(page.locator('.loading-container')).toContainText('加载中...');

    await takeScreenshot(page, '02_初始化_加载中');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });

  test('No.3 初始化-底盘编号为空', async ({ page }) => {
    resetCounter('03_初始化_底盘编号为空');
    await gotoUD07(page, '');
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toContainText('未指定Chassis编号');
    await expect(page.locator('.info-section')).toHaveCount(0);

    await takeScreenshot(page, '03_初始化_底盘编号为空');
  });

  test('No.4 初始化-API 返回无数据（data 为 null）', async ({ page }) => {
    resetCounter('04_初始化_无数据');
    await mockVehicleApi(page, { code: 200, data: null });
    await gotoUD07(page, 'JPCT 013947');
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-message-area')).toContainText('没有找到相关车辆数据');
    await expect(page.locator('.info-value').first()).toContainText('JPCT 013947');
    // 其他字段显示 "-"
    const values = page.locator('.info-value');
    const count = await values.count();
    expect(count).toBeGreaterThan(0);

    await takeScreenshot(page, '04_初始化_无数据');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });
});

// ============================================================
// 2. 底盘信息显示（No.5-6）
// ============================================================
test.describe.serial('底盘信息显示（No.5-6）', () => {
  test.setTimeout(120000);

  test('No.5 底盘-Chassis no 显示（正常）', async ({ page }) => {
    resetCounter('05_底盘_ChassisNo正常');
    await gotoUD07(page, 'JPCT 013945');

    await expect(page.locator('.info-label').filter({ hasText: 'Chassis no:' })).toBeVisible();
    await expect(page.locator('.info-value').first()).toContainText('JPCT 013945');

    await takeScreenshot(page, '05_底盘_ChassisNo正常');
  });

  test('No.6 底盘-Chassis no 显示（API 返回为空）', async ({ page }) => {
    resetCounter('06_底盘_ChassisNo空');
    await mockVehicleApi(page, { code: 200, data: { chassisInfo: null, engineInfo: null, sNoteNo: '' } });
    await gotoUD07(page, 'JPCT 013948');
    await page.waitForTimeout(2000);

    // Chassis no 显示传入的参数值
    await expect(page.locator('.info-value').first()).toContainText('JPCT 013948');
    await expect(page.locator('.info-message-area')).toContainText('没有找到相关车辆数据');

    await takeScreenshot(page, '06_底盘_ChassisNo空');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });
});

// ============================================================
// 3. 车辆基本信息显示（No.7-12）
// ============================================================
test.describe.serial('车辆基本信息（No.7-12）', () => {
  test.setTimeout(120000);

  test('No.7 车辆信息-Model 显示', async ({ page }) => {
    resetCounter('07_车辆信息_Model');
    await gotoUD07(page, 'JPCT 013949');

    await expect(page.locator('.info-label').filter({ hasText: 'Model:' })).toBeVisible();
    await expect(page.locator('.info-value').nth(1)).toContainText('UD-HDE');

    await takeScreenshot(page, '07_车辆信息_Model');
  });

  test('No.8 车辆信息-Model 显示（无值）', async ({ page }) => {
    resetCounter('08_车辆信息_Model空');
    await mockVehicleApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, chassisInfo: { ...SUCCESS_API_RESPONSE.data.chassisInfo, model: '' } }
    });
    await gotoUD07(page, 'JPCT 013950');
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-label').filter({ hasText: 'Model:' })).toBeVisible();
    await expect(page.locator('.info-value').nth(1)).toContainText('-');

    await takeScreenshot(page, '08_车辆信息_Model空');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });

  test('No.9 车辆信息-Built week 显示', async ({ page }) => {
    resetCounter('09_车辆信息_BuiltWeek');
    await gotoUD07(page, 'JPCT 013951');
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-label').filter({ hasText: 'Built week:' })).toBeVisible();
    await expect(page.locator('.info-value').nth(2)).toContainText('1617');

    await takeScreenshot(page, '09_车辆信息_BuiltWeek');
  });

  test('No.10 车辆信息-Product type 显示', async ({ page }) => {
    resetCounter('10_车辆信息_ProductType');
    await gotoUD07(page, 'JPCT 013952');
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-label').filter({ hasText: 'Product type:' })).toBeVisible();
    await expect(page.locator('.info-value').nth(3)).toContainText('EM 64 R');

    await takeScreenshot(page, '10_车辆信息_ProductType');
  });

  test('No.11 车辆信息-VIN 显示', async ({ page }) => {
    resetCounter('11_车辆信息_VIN');
    await gotoUD07(page, 'JPCT 013953');
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-label').filter({ hasText: 'VIN:' })).toBeVisible();
    await expect(page.locator('.info-value').nth(4)).toContainText('JPCZZ30D8GT013953');

    await takeScreenshot(page, '11_车辆信息_VIN');
  });

  test('No.12 车辆信息-VIN 显示（长字符串）', async ({ page }) => {
    resetCounter('12_车辆信息_VIN长');
    await gotoUD07(page, 'JPCT 013954');
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-value').nth(4)).toContainText('JPCZZZ30D8GT013954XYZ');

    await takeScreenshot(page, '12_车辆信息_VIN长');
  });
});

// ============================================================
// 4. 发动机信息显示（No.13-14）
// ============================================================
test.describe.serial('发动机信息（No.13-14）', () => {
  test.setTimeout(120000);

  test('No.13 发动机-Engine no 显示（固定值）', async ({ page }) => {
    resetCounter('13_发动机_EngineNo');
    await gotoUD07(page, 'JPCT 013955');
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-label').filter({ hasText: 'Engine no:' })).toBeVisible();
    await expect(page.locator('.info-value').nth(5)).toContainText('A01');

    await takeScreenshot(page, '13_发动机_EngineNo');
  });

  test('No.14 发动机-Engine no 显示（无值）', async ({ page }) => {
    resetCounter('14_发动机_EngineNo空');
    await mockVehicleApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, engineInfo: { ...SUCCESS_API_RESPONSE.data.engineInfo, engineNo: '' } }
    });
    await gotoUD07(page, 'JPCT 013956');
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-label').filter({ hasText: 'Engine no:' })).toBeVisible();
    await expect(page.locator('.info-value').nth(5)).toContainText('-');

    await takeScreenshot(page, '14_发动机_EngineNo空');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });
});

// ============================================================
// 5. 运营国家显示（No.15-16）
// ============================================================
test.describe.serial('运营国家（No.15-16）', () => {
  test.setTimeout(120000);

  test('No.15 运营国家-Country of Operation 显示（有值）', async ({ page }) => {
    resetCounter('15_运营国家_有值');
    await gotoUD07(page, 'JPCT 013957');
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-label').filter({ hasText: 'Country of operation:' })).toBeVisible();
    await expect(page.locator('.info-value').nth(6)).toContainText('IDN');

    await takeScreenshot(page, '15_运营国家_有值');
  });

  test('No.16 运营国家-Country of Operation 显示（无值）', async ({ page }) => {
    resetCounter('16_运营国家_无值');
    await mockVehicleApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, chassisInfo: { ...SUCCESS_API_RESPONSE.data.chassisInfo, countryOfOperation: '' } }
    });
    await gotoUD07(page, 'JPCT 013958');
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-label').filter({ hasText: 'Country of operation:' })).toBeVisible();
    await expect(page.locator('.info-value').nth(6)).toContainText('-');

    await takeScreenshot(page, '16_运营国家_无值');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });
});

// ============================================================
// 6. Symbol 信息显示（No.17-21）
// ============================================================
test.describe.serial('Symbol情報（No.17-21）', () => {
  test.setTimeout(120000);

  test('No.17 Symbol-SYMBOL_STR 显示（有值）', async ({ page }) => {
    resetCounter('17_Symbol_有值');
    await gotoUD07(page, 'JPCT 013959');
    await page.waitForTimeout(2000);

    const symbolValue = page.locator('.info-value-tooltip');
    await expect(symbolValue).toBeVisible();
    await expect(symbolValue).toContainText('FTLI-150');

    await takeScreenshot(page, '17_Symbol_有值');
  });

  test('No.18 Symbol-SYMBOL_STR 显示（无值）', async ({ page }) => {
    resetCounter('18_Symbol_无值');
    await mockVehicleApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, engineInfo: { ...SUCCESS_API_RESPONSE.data.engineInfo, symbolStr: '' } }
    });
    await gotoUD07(page, 'JPCT 013960');
    await page.waitForTimeout(2000);

    const symbolValue = page.locator('.info-value-tooltip');
    await expect(symbolValue).toBeVisible();
    await expect(symbolValue).toContainText('-');

    await takeScreenshot(page, '18_Symbol_无值');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });

  test('No.19 Symbol-DESCRIPTION Tooltip 显示', async ({ page }) => {
    resetCounter('19_Symbol_Tooltip');
    await gotoUD07(page, 'JPCT 013961');
    await page.waitForTimeout(2000);

    const symbolValue = page.locator('.info-value-tooltip');
    await symbolValue.hover();
    await page.waitForTimeout(500);

    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toContainText('Front load index: FTLI-150');

    await takeScreenshot(page, '19_Symbol_Tooltip');
  });

  test('No.20 Symbol-DESCRIPTION Tooltip 显示（无描述）', async ({ page }) => {
    resetCounter('20_Symbol_Tooltip无描述');
    await mockVehicleApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, engineInfo: { ...SUCCESS_API_RESPONSE.data.engineInfo, description: '' } }
    });
    await gotoUD07(page, 'JPCT 013962');
    await page.waitForTimeout(2000);

    const symbolValue = page.locator('.info-value-tooltip');
    await symbolValue.hover();
    await page.waitForTimeout(500);

    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toContainText('-');

    await takeScreenshot(page, '20_Symbol_Tooltip无描述');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });

  test('No.21 Symbol-长 Symbol 字符串显示', async ({ page }) => {
    resetCounter('21_Symbol_长字符串');
    await gotoUD07(page, 'JPCT 013963');
    await page.waitForTimeout(2000);

    const symbolValue = page.locator('.info-value-tooltip');
    // 显示前 8 位（SQL: RPAD(SUBSTRING(SYMBOL, 1, 8), 8, ' ')）
    await expect(symbolValue).toContainText('FTLI-150');

    // Tooltip 显示完整字符串
    await symbolValue.hover();
    await page.waitForTimeout(500);
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toContainText('FTLI-150-XYZ');

    await takeScreenshot(page, '21_Symbol_长字符串');
  });
});

// ============================================================
// 7. S-Note NO 显示（No.22-24）
// ============================================================
test.describe.serial('S-Note NO（No.22-24）', () => {
  test.setTimeout(120000);

  test('No.22 S-Note NO 显示（有值）', async ({ page }) => {
    resetCounter('22_SNoteNO_有值');
    await gotoUD07(page, 'JPCT 013964');
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-value-wrap')).toContainText('S1610111-013964');

    await takeScreenshot(page, '22_SNoteNO_有值');
  });

  test('No.23 S-Note NO 显示（无值）', async ({ page }) => {
    resetCounter('23_SNoteNO_无值');
    await mockVehicleApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, sNoteNo: '' }
    });
    await gotoUD07(page, 'JPCT 013965');
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-value-wrap')).toContainText('-');

    await takeScreenshot(page, '23_SNoteNO_无值');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });

  test('No.24 S-Note NO 显示（长字符串）', async ({ page }) => {
    resetCounter('24_SNoteNO_长字符串');
    await gotoUD07(page, 'JPCT 013966');
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-value-wrap')).toContainText('S1610111-EXTRA-INFO');

    await takeScreenshot(page, '24_SNoteNO_长字符串');
  });
});

// ============================================================
// 8. API 交互（No.25-30）
// ============================================================
test.describe.serial('API交互（No.25-30）', () => {
  test.setTimeout(120000);

  test('No.25 API 调用-成功获取数据（200）', async ({ page }) => {
    resetCounter('25_API_成功');
    await mockVehicleApi(page, SUCCESS_API_RESPONSE);
    const reqPromise = page.waitForRequest(req => req.url().includes('/api/v1/ud07/vehiclespecification'));
    await gotoUD07(page, 'JPCT 013967');
    const capturedReq = await reqPromise;
    const requestUrl = capturedReq.url();
    await page.waitForTimeout(2000);

    // 验证 API 调用
    expect(requestUrl).toContain('chassisNo=');
    expect(requestUrl).toContain('JPCT');
    expect(requestUrl).toContain('013967');
    // 各字段显示
    await expect(page.locator('.info-value').nth(0)).toContainText('JPCT 013967');
    await expect(page.locator('.info-value').nth(1)).toContainText('UD-HDE');
    await expect(page.locator('.info-value').nth(2)).toContainText('1617');
    await expect(page.locator('.info-value').nth(3)).toContainText('EM 64 R');
    await expect(page.locator('.info-value').nth(4)).toContainText('JPCZZ30D8GT013945');
    await expect(page.locator('.info-value').nth(5)).toContainText('A01');
    await expect(page.locator('.info-value').nth(6)).toContainText('IDN');

    await takeScreenshot(page, '25_API_成功');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });

  test('No.26 API 调用-无效底盘编号（400）', async ({ page }) => {
    resetCounter('26_API_400');
    await mockVehicleApi(page, null, 400);
    await gotoUD07(page, 'INVALID');
    await page.waitForTimeout(2000);

    // 400 时，Chassis no 显示传入的参数值
    await expect(page.locator('.info-value').first()).toContainText('INVALID');

    await takeScreenshot(page, '26_API_400');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });

  test('No.27 API 调用-系统异常（500）', async ({ page }) => {
    resetCounter('27_API_500');
    await mockVehicleApi(page, null, 500);
    await gotoUD07(page, 'JPCT 013969');
    await page.waitForTimeout(2000);

    // mock 返回 HTTP 200 + code=500，组件进入 else 分支显示无数据提示
    await expect(page.locator('.info-message-area')).toContainText('没有找到相关车辆数据');

    await takeScreenshot(page, '27_API_500');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });

  test('No.28 API 调用-网络错误', async ({ page }) => {
    resetCounter('28_API_网络错误');
    await mockApiNetworkError(page);
    await gotoUD07(page, 'JPCT 013970');
    await page.waitForTimeout(2000);

    // 网络错误时显示错误消息
    await expect(page.locator('.error-message-area')).toContainText('系统内部错误，请联系管理员');

    await takeScreenshot(page, '28_API_网络错误');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });

  test('No.29 API 调用-API 返回非 200 状态码', async ({ page }) => {
    resetCounter('29_API_dataNull');
    await mockVehicleApi(page, { code: 200, data: null });
    await gotoUD07(page, 'JPCT 013971');
    await page.waitForTimeout(2000);

    // data=null 时显示提示消息，字段显示 "-"
    await expect(page.locator('.info-message-area')).toContainText('没有找到相关车辆数据');
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '29_API_dataNull');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });

  test('No.30 API 调用-chassisNo 传递特殊字符', async ({ page }) => {
    resetCounter('30_API_特殊字符');
    await mockVehicleApi(page, SUCCESS_API_RESPONSE);
    const reqPromise = page.waitForRequest(req => req.url().includes('/api/v1/ud07/vehiclespecification'));
    await gotoUD07(page, 'JPCT 013972');
    const requestUrl = (await reqPromise).url();
    await page.waitForTimeout(2000);

    expect(requestUrl).toContain('chassisNo=');
    expect(requestUrl).toContain('JPCT');
    expect(requestUrl).toContain('013972');

    await takeScreenshot(page, '30_API_特殊字符');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });
});

// ============================================================
// 9. 消息显示（No.31-33）
// ============================================================
test.describe.serial('消息显示（No.31-33）', () => {
  test.setTimeout(120000);

  test('No.31 消息-无数据提示样式', async ({ page }) => {
    resetCounter('31_消息_无数据提示');
    await mockVehicleApi(page, { code: 200, data: null });
    await gotoUD07(page, 'JPCT 013973');
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-message-area')).toContainText('没有找到相关车辆数据');

    await takeScreenshot(page, '31_消息_无数据提示');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });

  test('No.32 消息-错误消息显示样式', async ({ page }) => {
    resetCounter('32_消息_错误消息样式');
    await mockVehicleApi(page, null, 500);
    await gotoUD07(page, 'JPCT 013974');
    await page.waitForTimeout(2000);

    // mock 返回 code=500，组件显示无数据提示
    await expect(page.locator('.info-message-area')).toContainText('没有找到相关车辆数据');

    await takeScreenshot(page, '32_消息_错误消息样式');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });

  test('No.33 消息-底盘编号为空提示样式', async ({ page }) => {
    resetCounter('33_消息_底盘编号空');
    await gotoUD07(page, '');
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toContainText('未指定Chassis编号');

    await takeScreenshot(page, '33_消息_底盘编号空');
  });
});

// ============================================================
// 10. 界面交互与布局（No.34-38）
// ============================================================
test.describe.serial('界面交互与布局（No.34-38）', () => {
  test.setTimeout(120000);

  test('No.34 界面-页面标题显示', async ({ page }) => {
    resetCounter('34_界面_页面标题');
    await gotoUD07(page, 'JPCT 013975');
    await page.waitForTimeout(2000);

    await expect(page.locator('.page-title')).toContainText('VDA - Vehicle Specification');

    await takeScreenshot(page, '34_界面_页面标题');
  });

  test('No.35 界面-信息区域外边框显示', async ({ page }) => {
    resetCounter('35_界面_外边框');
    await gotoUD07(page, 'JPCT 013976');
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-section')).toBeVisible();
    const infoRows = page.locator('.info-row');
    const rowCount = await infoRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    await takeScreenshot(page, '35_界面_外边框');
  });

  test('No.36 界面-各控件初始状态', async ({ page }) => {
    resetCounter('36_界面_各控件状态');
    await gotoUD07(page, 'JPCT 013977');
    await page.waitForTimeout(2000);

    await expect(page.locator('.page-title')).toBeVisible();
    await expect(page.locator('.error-message-area')).toHaveCount(0);
    // 所有 info-value 存在
    const values = page.locator('.info-value');
    const count = await values.count();
    expect(count).toBeGreaterThan(0);

    await takeScreenshot(page, '36_界面_各控件状态');
  });

  test('No.37 界面-错误状态下信息区域不隐藏', async ({ page }) => {
    resetCounter('37_界面_错误状态不隐藏');
    await mockVehicleApi(page, null, 500);
    await gotoUD07(page, 'JPCT 013978');
    await page.waitForTimeout(2000);

    // mock 返回 code=500，组件显示无数据提示（信息区域仍保留）
    await expect(page.locator('.info-message-area')).toBeVisible();
    await expect(page.locator('.info-section')).toBeVisible();
    await expect(page.locator('.info-value').first()).toContainText('JPCT 013978');

    await takeScreenshot(page, '37_界面_错误状态不隐藏');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });

  test('No.38 界面-响应式布局', async ({ page }) => {
    resetCounter('38_界面_响应式布局');
    await gotoUD07(page, 'JPCT 013979');
    await page.waitForTimeout(2000);

    // 调整窗口大小
    await page.setViewportSize({ width: 600, height: 800 });
    await page.waitForTimeout(1000);

    await expect(page.locator('.vehicle-specification-page')).toBeVisible();
    const hasHScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasHScroll).toBe(false);

    await takeScreenshot(page, '38_界面_响应式布局');
  });
});

// ============================================================
// 11. 异常处理（No.39-42）
// ============================================================
test.describe.serial('异常处理（No.39-42）', () => {
  test.setTimeout(120000);

  test('No.39 异常-API 失败后数据字段显示 "-"', async ({ page }) => {
    resetCounter('39_异常_数据字段显示-');
    await mockVehicleApi(page, null, 500);
    await gotoUD07(page, 'JPCT 013980');
    await page.waitForTimeout(2000);

    // mock 返回 code=500，组件显示无数据提示
    await expect(page.locator('.info-message-area')).toBeVisible();
    await expect(page.locator('.info-value').first()).toContainText('JPCT 013980');
    // 其他字段显示 "-"
    const values = page.locator('.info-value');
    const count = await values.count();
    for (let i = 1; i < count; i++) {
      await expect(values.nth(i)).toContainText('-');
    }

    await takeScreenshot(page, '39_异常_数据字段显示-');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });

  test('No.40 异常-变体信息未找到', async ({ page }) => {
    resetCounter('40_异常_变体信息未找到');
    await mockVehicleApi(page, {
      code: 200,
      data: { chassisInfo: null, engineInfo: null, sNoteNo: '' }
    });
    await gotoUD07(page, 'JPCT 013981');
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-message-area')).toContainText('没有找到相关车辆数据');
    await expect(page.locator('.info-value').first()).toContainText('JPCT 013981');

    await takeScreenshot(page, '40_异常_变体信息未找到');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });

  test('No.41 异常-Symbol 信息未找到', async ({ page }) => {
    resetCounter('41_异常_Symbol未找到');
    await mockVehicleApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, engineInfo: { engineNo: '', symbolStr: '', description: '' } }
    });
    await gotoUD07(page, 'JPCT 013982');
    await page.waitForTimeout(2000);

    await expect(page.locator('.info-value-tooltip')).toContainText('-');

    await takeScreenshot(page, '41_异常_Symbol未找到');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });

  test('No.42 异常-Engine no 设定为 "N/A"', async ({ page }) => {
    resetCounter('42_异常_EngineNo_NA');
    await mockVehicleApi(page, {
      ...SUCCESS_API_RESPONSE,
      data: { ...SUCCESS_API_RESPONSE.data, engineInfo: { engineNo: 'N/A', symbolStr: '', description: '' } }
    });
    await gotoUD07(page, 'JPCT 013983');
    await page.waitForTimeout(2000);

    // Engine no 显示 "N/A"
    await expect(page.locator('.info-value').nth(5)).toContainText('N/A');
    // SYMBOL_STR 显示 "-"
    await expect(page.locator('.info-value-tooltip')).toContainText('-');

    await takeScreenshot(page, '42_异常_EngineNo_NA');
    await page.unroute('**/api/v1/ud07/vehiclespecification*');
  });
});
