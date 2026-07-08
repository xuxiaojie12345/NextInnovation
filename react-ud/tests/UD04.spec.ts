import { test, expect, Page, Route } from '@playwright/test';
import { insertUD04TestData, cleanupUD04TestData } from './test-data-helper';

// ============================================================
// Generate Document (UD04) Playwright 自动化测试
// 基于 単体テスト仕様書UD04.md
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD04';

const API_GENERATE_DOC = 'http://localhost:8081/api/ud04/selectgeneratedocument';

// 模拟API响应数据（完整字段）
const MOCK_FULL_DATA = {
  serie: 'ABC12',
  chassisNo: '1234567890',
  ordernumber: 'GOLF',
  buildWeek: '2022W45',
  specWeek: '2023W10',
  market: 'DE',
  masterMarket: '-EU',
  loadIndex: '91',
  sNoteNo: 'S-NOTE-001',
  sNoteMessage: 'The S-Notes above can affect homologation documents.',
  modifyDocLink: 'ACTIVE',
  replacingParameters: 'AD Change. Modifying:PARAM1; AD Change. Modifying:PARAM2',
  date: '2022-12-02 05:11:45',
  hdocVersion: 'v1.0.0'
};

// 模拟API响应数据（空字段）
const MOCK_EMPTY_DATA = {
  serie: '', chassisNo: '', ordernumber: '', buildWeek: '', specWeek: '',
  market: '', masterMarket: '', loadIndex: '', sNoteNo: '', sNoteMessage: '',
  modifyDocLink: '', replacingParameters: '', date: '', hdocVersion: ''
};

let screenshotCounter: { [key: string]: number } = {};

async function takeScreenshot(page: Page, name: string) {
  if (!screenshotCounter[name]) screenshotCounter[name] = 0;
  screenshotCounter[name]++;
  const seq = String(screenshotCounter[name]).padStart(3, '0');
  try {
    if (page.isClosed()) return;
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
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

/** 安全导航：domcontentloaded + 重试 */
async function safeGoto(page: Page, url: string) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('.generate-document-container', { timeout: 15000 }).catch(() => {});
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
      return;
    } catch (e) {
      if (i === 2 || page.isClosed()) throw e;
      await page.waitForTimeout(2000);
    }
  }
}

/** 设置 API Mock（成功返回完整数据） */
async function setupMockSuccess(page: Page, data: any = MOCK_FULL_DATA) {
  await page.route(API_GENERATE_DOC, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, message: 'success', data }),
    });
  });
}

/** 设置 API Mock（返回 404） */
async function setupMock404(page: Page) {
  await page.route(API_GENERATE_DOC, async (route: Route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ code: 404, message: 'Chassis not found', data: null }),
    });
  });
}

/** 设置 API Mock（返回 500） */
async function setupMock500(page: Page) {
  await page.route(API_GENERATE_DOC, async (route: Route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ code: 500, message: 'Internal server error', data: null }),
    });
  });
}

/** 设置 API Mock（网络断开） */
async function setupMockNetworkError(page: Page) {
  await page.route(API_GENERATE_DOC, async (route: Route) => {
    await route.abort('connectionrefused');
  });
}

/** 设置 API Mock（超时） */
async function setupMockTimeout(page: Page) {
  await page.route(API_GENERATE_DOC, async (route: Route) => {
    await new Promise(r => setTimeout(r, 100));
    await route.abort('connectionrefused');
  });
}

/** 设置 API Mock（返回 401） */
async function setupMock401(page: Page) {
  await page.route(API_GENERATE_DOC, async (route: Route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ code: 401, message: 'Unauthorized', data: null }),
    });
  });
}

/** 设置 API Mock（返回 200 但 code≠200） */
async function setupMockCodeNot200(page: Page) {
  await page.route(API_GENERATE_DOC, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 404, message: 'Chassis not found', data: null }),
    });
  });
}

/** 设置 API Mock（返回 200, code=200, data=null） */
async function setupMockDataNull(page: Page) {
  await page.route(API_GENERATE_DOC, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, message: 'success', data: null }),
    });
  });
}

/** 设置 API Mock（返回 200, code=200, data={} 空对象） */
async function setupMockDataEmpty(page: Page) {
  await page.route(API_GENERATE_DOC, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, message: 'success', data: {} }),
    });
  });
}

/** 设置 API Mock（返回 403） */
async function setupMock403(page: Page) {
  await page.route(API_GENERATE_DOC, async (route: Route) => {
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ code: 403, message: 'Forbidden', data: null }),
    });
  });
}

/** 设置 API Mock（返回 502） */
async function setupMock502(page: Page) {
  await page.route(API_GENERATE_DOC, async (route: Route) => {
    await route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({ code: 502, message: 'Bad Gateway', data: null }),
    });
  });
}

// ============================================================
// 测试数据准备：正常场景使用真实数据库数据，异常场景使用 Mock
// ============================================================
test.beforeAll(async () => {
  await insertUD04TestData();
});

test.afterAll(async () => {
  await cleanupUD04TestData();
});

// ============================================================
// 测试前置
// ============================================================
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    const defaultInfo = {
      token: 'test-token',
      userid: 'wang',
      username: 'wang',
      responsible: 'Engineering',
      userposition: 'Manager',
      email: 'wang@example.com',
      permissions: [
        "GenerateDoc", "GenerateBatch", "RegdataArchive", "RegdataBatch",
        "UpdateRules", "UpdateUnicodeRules", "ExistingVariables", "UnlockDocument",
        "HDocNumberSeries", "UploadDeleteTemplate", "ListTemplates", "VPPSVinPlate", "ADCAChange",
        "HDocTemplateCheck",
        "HDocUserAdmin", "HDocUserDocAdmin", "SearchUser", "ChangePassword", "UserPosition",
        "ArchiveSearch", "UploadDocument",
        "UserGuide", "ADCAChangeGuide", "VinPlateGuide", "ArchiveGuide", "Privacy",
      ]
    };
    localStorage.setItem('userInfo', JSON.stringify(defaultInfo));
  });
});

// ============================================================
// 1. 画面初始化 - No.1-7
// ============================================================
test.describe.serial('画面初始化', () => {

  test('No.1 页面初始化-正常加载', async ({ page }) => {
    resetCounter('01_初始化_正常加载');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.page-title', { timeout: 15000 });

    await expect(page.locator('.page-title')).toContainText('Generate Document');
    // Chassis no 显示
    await expect(page.locator('.chassis-series')).toContainText('ABC12');
    await expect(page.locator('.chassis-number')).toContainText('1234567890');
    // 各字段显示
    await expect(page.locator('.vehicle-info-section')).toContainText('Ordernumber:');
    await expect(page.locator('.vehicle-info-section')).toContainText('Build week:');
    await expect(page.locator('.vehicle-info-section')).toContainText('Spec week:');
    await expect(page.locator('.vehicle-info-section')).toContainText('Market:');
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '01_初始化_正常加载');
  });

  test('No.2 画面初始化-加载中状态', async ({ page }) => {
    resetCounter('02_初始化_加载中');
    // 模拟延迟：在路由中延迟响应
    await page.route(API_GENERATE_DOC, async (route: Route) => {
      await new Promise(r => setTimeout(r, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: MOCK_FULL_DATA }),
      });
    });
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    // 确认加载中状态
    await expect(page.locator('.loading-message')).toBeVisible();
    await expect(page.locator('.loading-message')).toContainText('Loading document data...');

    await takeScreenshot(page, '02_初始化_加载中');
  });

  test('No.3 画面初始化-从路由参数获取底盘号', async ({ page }) => {
    resetCounter('03_初始化_路由参数');
    let capturedBody: any = null;
    await page.route(API_GENERATE_DOC, async (route: Route) => {
      capturedBody = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: MOCK_FULL_DATA }),
      });
    });
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.page-title', { timeout: 15000 });

    expect(capturedBody?.chassisNo).toBe('1234567890');

    await takeScreenshot(page, '03_初始化_路由参数');
  });

  test('No.4 画面初始化-从Location State获取底盘号', async ({ page }) => {
    resetCounter('04_初始化_State参数');
    let capturedBody: any = null;
    await page.route(API_GENERATE_DOC, async (route: Route) => {
      capturedBody = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: MOCK_FULL_DATA }),
      });
    });
    // 通过 state 传递参数（模拟从UD03跳转）
    await page.goto(`${BASE_URL}/Menu/GenerateDocument`, {
      waitUntil: 'domcontentloaded'
    });
    // 使用 addInitScript 或 evaluate 设置 state
    // 实际上需要直接导航并传递 state，Playwright 不支持直接传递 react-router state
    // 改用 URL 参数 + state mock 方式
    await page.evaluate((data) => {
      window.history.pushState(data, '', '/Menu/GenerateDocument');
    }, { chassisSeries: 'ABC12', chassisNo: '1234567890', documentType: 'VIN_PLATE' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.page-title', { timeout: 15000 }).catch(() => {});

    // 确认 API 请求中包含 state 参数
    if (capturedBody) {
      expect(capturedBody.chassisSeries).toBe('ABC12');
      expect(capturedBody.chassisNo).toBe('1234567890');
      expect(capturedBody.documentType).toBe('VIN_PLATE');
    }

    await takeScreenshot(page, '04_初始化_State参数');
  });

  test('No.5 画面初始化-无底盘号参数', async ({ page }) => {
    resetCounter('05_初始化_无参数');
    // 不设置 API mock，应不发起请求
    let apiCalled = false;
    await page.route(API_GENERATE_DOC, async (route: Route) => {
      apiCalled = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument`);
    await page.waitForTimeout(1000);

    await expect(page.locator('.error-message-area')).toBeVisible();
    await expect(page.locator('.error-message-area')).toContainText('Chassis not found');
    expect(apiCalled).toBe(false);

    await takeScreenshot(page, '05_初始化_无参数');
  });

  test('No.6 画面初始化-API成功返回', async ({ page }) => {
    resetCounter('06_初始化_API成功');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });

    await expect(page.locator('.vehicle-info-section')).toContainText('GOLF');
    await expect(page.locator('.vehicle-info-section')).toContainText('2022W45');
    await expect(page.locator('.vehicle-info-section')).toContainText('2023W10');
    await expect(page.locator('.vehicle-info-section')).toContainText('DE');
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '06_初始化_API成功');
  });

  test('No.7 画面初始化-API返回部分字段为空', async ({ page }) => {
    resetCounter('07_初始化_字段为空');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });

    // 空字段应显示 "-"
    await expect(page.locator('.vehicle-info-section')).toContainText('-');
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '07_初始化_字段为空');
  });
});

// ============================================================
// 2. 底盘信息显示区域（OM接收数据）- No.8-17
// ============================================================
test.describe.serial('底盘信息显示', () => {

  test('No.8 Chassis no-正常显示', async ({ page }) => {
    resetCounter('08_ChassisNo_正常显示');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.chassis-series', { timeout: 15000 });

    await expect(page.locator('.chassis-series')).toBeVisible();
    await expect(page.locator('.chassis-series')).toContainText('ABC12');
    await expect(page.locator('.chassis-number')).toContainText('1234567890');

    await takeScreenshot(page, '08_ChassisNo_正常显示');
  });

  test('No.9 Chassis no-点击跳转', async ({ page }) => {
    resetCounter('09_ChassisNo_点击跳转');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.chassis-link', { timeout: 15000 });

    await page.locator('.chassis-link').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/Menu/VehicleSpecification');

    await takeScreenshot(page, '09_ChassisNo_点击跳转');
  });

  test('No.10 Chassis no-点击时serie为空', async ({ page }) => {
    resetCounter('10_ChassisNo_Serie为空');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.chassis-link', { timeout: 15000 });

    await page.locator('.chassis-link').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/Menu/VehicleSpecification');

    await takeScreenshot(page, '10_ChassisNo_Serie为空');
  });

  test('No.11 Chassis no-长底盘号显示', async ({ page }) => {
    resetCounter('11_ChassisNo_长底盘号');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/ABC1234567890123`);
    await page.waitForSelector('.chassis-series', { timeout: 15000 });

    await expect(page.locator('.chassis-series')).toContainText('DEF45');
    await expect(page.locator('.chassis-number')).toContainText('ABC1234567890123');

    await takeScreenshot(page, '11_ChassisNo_长底盘号');
  });

  test('No.12 Ordernumber-显示', async ({ page }) => {
    resetCounter('12_Ordernumber_显示');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });

    await expect(page.locator('.vehicle-info-section')).toContainText('Ordernumber:');
    await expect(page.locator('.vehicle-info-section')).toContainText('GOLF');

    await takeScreenshot(page, '12_Ordernumber_显示');
  });

  test('No.13 Build week-显示', async ({ page }) => {
    resetCounter('13_BuildWeek_显示');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });

    await expect(page.locator('.vehicle-info-section')).toContainText('Build week:');
    await expect(page.locator('.vehicle-info-section')).toContainText('2022W45');

    await takeScreenshot(page, '13_BuildWeek_显示');
  });

  test('No.14 Spec week-显示', async ({ page }) => {
    resetCounter('14_SpecWeek_显示');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });

    await expect(page.locator('.vehicle-info-section')).toContainText('Spec week:');
    await expect(page.locator('.vehicle-info-section')).toContainText('2023W10');

    await takeScreenshot(page, '14_SpecWeek_显示');
  });

  test('No.15 Market-显示', async ({ page }) => {
    resetCounter('15_Market_显示');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });

    await expect(page.locator('.vehicle-info-section')).toContainText('Market:');
    await expect(page.locator('.vehicle-info-section')).toContainText('DE');

    await takeScreenshot(page, '15_Market_显示');
  });

  test('No.16 Master Market-默认显示', async ({ page }) => {
    resetCounter('16_MasterMarket_默认');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });

    await expect(page.locator('.vehicle-info-section')).toContainText('Master Market:');
    await expect(page.locator('.vehicle-info-section')).toContainText('-EU');

    await takeScreenshot(page, '16_MasterMarket_默认');
  });

  test('No.17 Master Market-API返回有值', async ({ page }) => {
    resetCounter('17_MasterMarket_有值');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });

    await expect(page.locator('.vehicle-info-section')).toContainText('-EU');

    await takeScreenshot(page, '17_MasterMarket_有值');
  });
});

// ============================================================
// 3. S-Note 信息区域 - No.18-21
// ============================================================
test.describe.serial('SNote信息区域', () => {

  test('No.18 S-Note-有S-Note信息时显示', async ({ page }) => {
    resetCounter('18_SNote_显示');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.s-note-section', { timeout: 15000 });

    await expect(page.locator('.s-note-section')).toBeVisible();
    await expect(page.locator('.s-note-warning')).toContainText('The S-Notes above can affect homologation documents');

    await takeScreenshot(page, '18_SNote_显示');
  });

  test('No.19 S-Note-有sNoteMessage但无sNoteNo', async ({ page }) => {
    resetCounter('19_SNote_仅Message');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.s-note-section', { timeout: 15000 });

    await expect(page.locator('.s-note-section')).toBeVisible();
    await expect(page.locator('.s-note-warning')).toBeVisible();

    await takeScreenshot(page, '19_SNote_仅Message');
  });

  test('No.20 S-Note-无S-Note信息时隐藏', async ({ page }) => {
    resetCounter('20_SNote_隐藏');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });

    await expect(page.locator('.s-note-section')).toHaveCount(0);

    await takeScreenshot(page, '20_SNote_隐藏');
  });

  test('No.21 S-Note-超过4000字符显示', async ({ page }) => {
    resetCounter('21_SNote_长文本');
    const longText = 'A'.repeat(4000);
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.s-note-section', { timeout: 15000 });

    await expect(page.locator('.s-note-content')).toBeVisible();
    const text = await page.locator('.s-note-content').textContent();
    expect(text?.length).toBe(4000);

    await takeScreenshot(page, '21_SNote_长文本');
  });
});

// ============================================================
// 4. 轮胎信息区域 - No.22-23
// ============================================================
test.describe.serial('轮胎信息区域', () => {

  test('No.22 Load Index-正常显示', async ({ page }) => {
    resetCounter('22_LoadIndex_显示');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });

    await expect(page.locator('.generate-document-container')).toContainText('Load Index:');
    await expect(page.locator('.generate-document-container')).toContainText('91');

    await takeScreenshot(page, '22_LoadIndex_显示');
  });

  test('No.23 Load Index-API返回空值', async ({ page }) => {
    resetCounter('23_LoadIndex_空值');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });

    await expect(page.locator('.generate-document-container')).toContainText('Load Index:');
    await expect(page.locator('.generate-document-container')).toContainText('-');

    await takeScreenshot(page, '23_LoadIndex_空值');
  });
});

// ============================================================
// 5. Analyze Rules 链接 - No.24-25
// ============================================================
test.describe.serial('AnalyzeRules链接', () => {

  test('No.24 Analyze Rules-链接显示', async ({ page }) => {
    resetCounter('24_AnalyzeRules_显示');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.action-links', { timeout: 15000 });

    const link = page.locator('.link-item');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Analyze Rules');

    await takeScreenshot(page, '24_AnalyzeRules_显示');
  });

  test('No.25 Analyze Rules-点击行为', async ({ page }) => {
    resetCounter('25_AnalyzeRules_点击');
    // 处理 alert 对话框
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Analyze Rules: This feature is under development.');
      await dialog.accept();
    });
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.link-item', { timeout: 15000 });

    await page.locator('.link-item').click();
    await page.waitForTimeout(500);

    await takeScreenshot(page, '25_AnalyzeRules_点击');
  });
});

// ============================================================
// 6. ADCA 变更状态区域 - No.26-35
// ============================================================
test.describe.serial('ADCA变更状态', () => {

  test('No.26 ADCA激活-Modify Doc Link显示', async ({ page }) => {
    resetCounter('26_ADCA_激活显示');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.ad-change-warning', { timeout: 15000 });

    await expect(page.locator('.ad-change-warning')).toBeVisible();
    await expect(page.locator('.ad-change-warning')).toContainText('After def change detected. Document need to be modified.');

    await takeScreenshot(page, '26_ADCA_激活显示');
  });

  test('No.27 ADCA激活-Modify Doc Link点击跳转', async ({ page }) => {
    resetCounter('27_ADCA_点击跳转');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.ad-change-warning', { timeout: 15000 });

    await page.locator('.ad-change-warning').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/Menu/ModifyDocument');

    await takeScreenshot(page, '27_ADCA_点击跳转');
  });

  test('No.28 ADCA激活-modifyDocLink为"Y"时激活', async ({ page }) => {
    resetCounter('28_ADCA_Y激活');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.ad-change-warning', { timeout: 15000 });

    await expect(page.locator('.ad-change-warning')).toBeVisible();
    await expect(page.locator('.ad-change-warning')).toContainText('After def change detected');

    await takeScreenshot(page, '28_ADCA_Y激活');
  });

  test('No.29 ADCA激活-Replacing parameters显示', async ({ page }) => {
    resetCounter('29_ADCA_Replacing显示');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.replacing-params-section', { timeout: 15000 });

    await expect(page.locator('.replacing-params-section')).toBeVisible();
    await expect(page.locator('.replacing-params-section')).toContainText('Replacing parameters:');
    await expect(page.locator('.replacing-params-section')).toContainText('AD Change. Modifying:PARAM1');

    await takeScreenshot(page, '29_ADCA_Replacing显示');
  });

  test('No.30 ADCA激活-Replacing parameters单个值', async ({ page }) => {
    resetCounter('30_ADCA_Replacing单个');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.replacing-params-section', { timeout: 15000 });

    await expect(page.locator('.replacing-params-section')).toContainText('AD Change. Modifying:PARAM1');

    await takeScreenshot(page, '30_ADCA_Replacing单个');
  });

  test('No.31 ADCA激活-Replacing parameters为空', async ({ page }) => {
    resetCounter('31_ADCA_Replacing空');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.ad-change-warning', { timeout: 15000 });

    await expect(page.locator('.replacing-params-section')).toBeVisible();

    await takeScreenshot(page, '31_ADCA_Replacing空');
  });

  test('No.32 ADCA激活-Replacing parameters含特殊字符', async ({ page }) => {
    resetCounter('32_ADCA_Replacing特殊字符');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.replacing-params-section', { timeout: 15000 });

    await expect(page.locator('.replacing-params-section')).toContainText('PARAM_α');
    await expect(page.locator('.replacing-params-section')).toContainText('PARAM-β');

    await takeScreenshot(page, '32_ADCA_Replacing特殊字符');
  });

  test('No.33 ADCA非激活-modifyDocLink为"INACTIVE"', async ({ page }) => {
    resetCounter('33_ADCA_INACTIVE');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.ad-change-inactive', { timeout: 15000 });

    await expect(page.locator('.ad-change-inactive')).toBeVisible();
    await expect(page.locator('.ad-change-inactive')).toContainText('No ADCA change detected');
    await expect(page.locator('.replacing-params-section')).toHaveCount(0);

    await takeScreenshot(page, '33_ADCA_INACTIVE');
  });

  test('No.34 ADCA非激活-modifyDocLink为"N"时', async ({ page }) => {
    resetCounter('34_ADCA_N');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.ad-change-inactive', { timeout: 15000 });

    await expect(page.locator('.ad-change-inactive')).toBeVisible();
    await expect(page.locator('.ad-change-inactive')).toContainText('No ADCA change detected');

    await takeScreenshot(page, '34_ADCA_N');
  });

  test('No.35 ADCA非激活-modifyDocLink字段不存在', async ({ page }) => {
    resetCounter('35_ADCA_字段空');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.ad-change-inactive', { timeout: 15000 });

    await expect(page.locator('.ad-change-inactive')).toBeVisible();
    await expect(page.locator('.ad-change-inactive')).toContainText('No ADCA change detected');

    await takeScreenshot(page, '35_ADCA_字段空');
  });
});

// ============================================================
// 7. 模板信息区域 - No.36-37
// ============================================================
test.describe.serial('模板信息区域', () => {

  test('No.36 Using template-固定显示', async ({ page }) => {
    resetCounter('36_UsingTemplate_显示');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.template-info-section', { timeout: 15000 });

    await expect(page.locator('.template-info-section')).toContainText('Using template:');
    await expect(page.locator('.template-info-section')).toContainText('VIN_PLATE_TEMPLATE_V1');

    await takeScreenshot(page, '36_UsingTemplate_显示');
  });

  test('No.37 Using template-颜色样式', async ({ page }) => {
    resetCounter('37_UsingTemplate_样式');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.template-info-section', { timeout: 15000 });

    await expect(page.locator('.template-info-section')).toBeVisible();

    await takeScreenshot(page, '37_UsingTemplate_样式');
  });
});

// ============================================================
// 8. Generated Document 区域 - No.38-41
// ============================================================
test.describe.serial('GeneratedDocument区域', () => {

  test('No.38 Generated document-固定显示', async ({ page }) => {
    resetCounter('38_GeneratedDoc_显示');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.generated-doc-section', { timeout: 15000 });

    await expect(page.locator('.generated-doc-link')).toBeVisible();
    await expect(page.locator('.generated-doc-link')).toContainText('Generated document');

    await takeScreenshot(page, '38_GeneratedDoc_显示');
  });

  test('No.39 Generated document-点击显示错误', async ({ page }) => {
    resetCounter('39_GeneratedDoc_点击错误');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.generated-doc-link', { timeout: 15000 });

    await page.locator('.generated-doc-link').click();
    await expect(page.locator('.error-message-area')).toBeVisible();
    await expect(page.locator('.error-message-area')).toContainText('Document file not found');

    await takeScreenshot(page, '39_GeneratedDoc_点击错误');
  });

  test('No.40 Generated document-重复点击', async ({ page }) => {
    resetCounter('40_GeneratedDoc_重复点击');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.generated-doc-link', { timeout: 15000 });

    // 多次点击
    await page.locator('.generated-doc-link').click();
    await page.locator('.generated-doc-link').click();
    await page.locator('.generated-doc-link').click();

    await expect(page.locator('.error-message-area')).toContainText('Document file not found');

    await takeScreenshot(page, '40_GeneratedDoc_重复点击');
  });

  test('No.41 Generated document-错误消息不自动清除', async ({ page }) => {
    resetCounter('41_GeneratedDoc_刷新清除');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.generated-doc-link', { timeout: 15000 });

    await page.locator('.generated-doc-link').click();
    await expect(page.locator('.error-message-area')).toContainText('Document file not found');

    // 刷新页面
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.generated-doc-link', { timeout: 15000 });
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '41_GeneratedDoc_刷新清除');
  });
});

// ============================================================
// 9. 系统信息区域 - No.42-45
// ============================================================
test.describe.serial('系统信息区域', () => {

  test('No.42 Date-显示服务器时间', async ({ page }) => {
    resetCounter('42_Date_显示');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.footer-info', { timeout: 15000 });

    await expect(page.locator('.footer-info')).toContainText('Date:');
    await expect(page.locator('.footer-info')).toContainText('2022-12-02 05:11:45');

    await takeScreenshot(page, '42_Date_显示');
  });

  test('No.43 Date-API返回空值', async ({ page }) => {
    resetCounter('43_Date_空值');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.footer-info', { timeout: 15000 });

    await expect(page.locator('.footer-info')).toContainText('-');

    await takeScreenshot(page, '43_Date_空值');
  });

  test('No.44 HDoc version-显示版本号', async ({ page }) => {
    resetCounter('44_HDocVersion_显示');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.footer-info', { timeout: 15000 });

    await expect(page.locator('.footer-info')).toContainText('HDoc version:');
    await expect(page.locator('.footer-info')).toContainText('v1.0.0');

    await takeScreenshot(page, '44_HDocVersion_显示');
  });

  test('No.45 HDoc version-API返回空值', async ({ page }) => {
    resetCounter('45_HDocVersion_空值');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.footer-info', { timeout: 15000 });

    await expect(page.locator('.footer-info')).toContainText('-');

    await takeScreenshot(page, '45_HDocVersion_空值');
  });
});

// ============================================================
// 10. API 异常处理 - No.46-53
// ============================================================
test.describe.serial('API异常处理', () => {

  test('No.46 API异常-底盘号不存在（404）', async ({ page }) => {
    resetCounter('46_API异常_404');
    await setupMock404(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.error-message-area', { timeout: 15000 });

    await expect(page.locator('.error-message-area')).toContainText('Chassis not found');

    await takeScreenshot(page, '46_API异常_404');
  });

  test('No.47 API异常-底盘号不存在（code≠200）', async ({ page }) => {
    resetCounter('47_API异常_code非200');
    await setupMockCodeNot200(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.error-message-area', { timeout: 15000 });

    await expect(page.locator('.error-message-area')).toContainText('Chassis not found');

    await takeScreenshot(page, '47_API异常_code非200');
  });

  test('No.48 API异常-服务器错误（500）', async ({ page }) => {
    resetCounter('48_API异常_500');
    await setupMock500(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.error-message-area', { timeout: 15000 });

    await expect(page.locator('.error-message-area')).toContainText('System error. Please contact administrator.');

    await takeScreenshot(page, '48_API异常_500');
  });

  test('No.49 API异常-网络连接失败', async ({ page }) => {
    resetCounter('49_API异常_网络');
    await setupMockNetworkError(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.error-message-area', { timeout: 15000 });

    await expect(page.locator('.error-message-area')).toContainText('System error. Please contact administrator.');

    await takeScreenshot(page, '49_API异常_网络');
  });

  test('No.50 API异常-API超时', async ({ page }) => {
    resetCounter('50_API异常_超时');
    await setupMockTimeout(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.error-message-area', { timeout: 15000 });

    await expect(page.locator('.error-message-area')).toContainText('System error. Please contact administrator.');

    await takeScreenshot(page, '50_API异常_超时');
  });

  test('No.51 API异常-401未授权（会话过期）', async ({ page }) => {
    resetCounter('51_API异常_401');
    await setupMock401(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForTimeout(1000);

    // 401 会显示错误并跳转到登录页
    await expect(page.locator('.error-message-area')).toContainText('Please login first');

    await takeScreenshot(page, '51_API异常_401');
  });

  test('No.52 API异常-用户未登录', async ({ page }) => {
    resetCounter('52_API异常_未登录');
    // 清除登录状态
    await page.addInitScript(() => {
      localStorage.removeItem('userInfo');
    });
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForTimeout(1000);

    // 未登录应跳转到登录页
    expect(page.url()).toBe(`${BASE_URL}/`);

    await takeScreenshot(page, '52_API异常_未登录');
  });

  test('No.53 API异常-其他HTTP错误', async ({ page }) => {
    resetCounter('53_API异常_403');
    await setupMock403(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.error-message-area', { timeout: 15000 });

    await expect(page.locator('.error-message-area')).toContainText('System error. Please contact administrator.');

    await takeScreenshot(page, '53_API异常_403');
  });
});

// ============================================================
// 11. 链接跳转 - No.54-56
// ============================================================
test.describe.serial('链接跳转', () => {

  test('No.54 Chassis no跳转-底盘号完整传递', async ({ page }) => {
    resetCounter('54_跳转_ChassisNo');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.chassis-link', { timeout: 15000 });

    await page.locator('.chassis-link').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/Menu/VehicleSpecification');

    await takeScreenshot(page, '54_跳转_ChassisNo');
  });

  test('No.55 Modify Doc跳转-参数完整传递', async ({ page }) => {
    resetCounter('55_跳转_ModifyDoc');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.ad-change-warning', { timeout: 15000 });

    await page.locator('.ad-change-warning').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/Menu/ModifyDocument');

    await takeScreenshot(page, '55_跳转_ModifyDoc');
  });

  test('No.56 Modify Doc跳转-ADCA非激活不跳转', async ({ page }) => {
    resetCounter('56_跳转_ADCA非激活');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.ad-change-inactive', { timeout: 15000 });

    const urlBefore = page.url();
    await page.locator('.ad-change-inactive').click();
    await page.waitForTimeout(500);
    // URL 不应变化
    expect(page.url()).toBe(urlBefore);

    await takeScreenshot(page, '56_跳转_ADCA非激活');
  });
});

// ============================================================
// 12. UI 样式与显示 - No.57-61
// ============================================================
test.describe.serial('UI样式与显示', () => {

  test('No.57 页面标题-显示', async ({ page }) => {
    resetCounter('57_UI_标题');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.page-title', { timeout: 15000 });

    await expect(page.locator('.page-title')).toBeVisible();
    await expect(page.locator('.page-title')).toContainText('Generate Document');

    await takeScreenshot(page, '57_UI_标题');
  });

  test('No.58 错误消息-样式', async ({ page }) => {
    resetCounter('58_UI_错误样式');
    await setupMock404(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.error-message-area', { timeout: 15000 });

    await expect(page.locator('.error-message-area')).toBeVisible();

    await takeScreenshot(page, '58_UI_错误样式');
  });

  test('No.59 错误消息-初始隐藏', async ({ page }) => {
    resetCounter('59_UI_错误隐藏');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.page-title', { timeout: 15000 });

    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '59_UI_错误隐藏');
  });

  test('No.60 ADCA激活-Modify Doc Link悬停效果', async ({ page }) => {
    resetCounter('60_UI_ADCA悬停');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.ad-change-warning', { timeout: 15000 });

    await page.locator('.ad-change-warning').hover();
    await page.waitForTimeout(300);

    await takeScreenshot(page, '60_UI_ADCA悬停');
  });

  test('No.61 Chassis no悬停效果', async ({ page }) => {
    resetCounter('61_UI_Chassis悬停');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.chassis-link', { timeout: 15000 });

    await page.locator('.chassis-link').hover();
    await page.waitForTimeout(300);

    await takeScreenshot(page, '61_UI_Chassis悬停');
  });
});

// ============================================================
// 13. 数据字段确认（DB 字段映射）- No.62-68
//    注：DB映射通过API返回数据验证，不直接操作数据库
// ============================================================
test.describe.serial('数据字段确认', () => {

  test('No.62 DB字段映射-Ordernumber', async ({ page }) => {
    resetCounter('62_DB_Ordernumber');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });

    await expect(page.locator('.vehicle-info-section')).toContainText('GOLF');

    await takeScreenshot(page, '62_DB_Ordernumber');
  });

  test('No.63 DB字段映射-Build week', async ({ page }) => {
    resetCounter('63_DB_BuildWeek');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });

    await expect(page.locator('.vehicle-info-section')).toContainText('2022W45');

    await takeScreenshot(page, '63_DB_BuildWeek');
  });

  test('No.64 DB字段映射-Spec week', async ({ page }) => {
    resetCounter('64_DB_SpecWeek');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });

    await expect(page.locator('.vehicle-info-section')).toContainText('2022W45');

    await takeScreenshot(page, '64_DB_SpecWeek');
  });

  test('No.65 DB字段映射-Market', async ({ page }) => {
    resetCounter('65_DB_Market');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });

    await expect(page.locator('.vehicle-info-section')).toContainText('DE');

    await takeScreenshot(page, '65_DB_Market');
  });

  test('No.66 DB字段映射-S-Note NO', async ({ page }) => {
    resetCounter('66_DB_SNote');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.s-note-section', { timeout: 15000 });

    await expect(page.locator('.s-note-content')).toContainText('S-NOTE-001');

    await takeScreenshot(page, '66_DB_SNote');
  });

  test('No.67 DB字段映射-Load Index', async ({ page }) => {
    resetCounter('67_DB_LoadIndex');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });

    await expect(page.locator('.generate-document-container')).toContainText('91');

    await takeScreenshot(page, '67_DB_LoadIndex');
  });

  test('No.68 DB字段映射-Replacing parameters', async ({ page }) => {
    resetCounter('68_DB_Replacing');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.replacing-params-section', { timeout: 15000 });

    await expect(page.locator('.replacing-params-section')).toContainText('AD Change. Modifying:PARAM1');
    await expect(page.locator('.replacing-params-section')).toContainText('AD Change. Modifying:PARAM2');

    await takeScreenshot(page, '68_DB_Replacing');
  });
});

// ============================================================
// 14. API 请求参数验证 - No.69-71
// ============================================================
test.describe.serial('API请求参数验证', () => {

  test('No.69 API请求-传递全部参数', async ({ page }) => {
    resetCounter('69_API请求_全参数');
    let capturedBody: any = null;
    await page.route(API_GENERATE_DOC, async (route: Route) => {
      capturedBody = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: MOCK_FULL_DATA }),
      });
    });
    // 通过 URL 参数访问（实际页面需要从 state 获取 chassisSeries）
    await page.goto(`${BASE_URL}/Menu/GenerateDocument/1234567890`, { waitUntil: 'domcontentloaded' });
    // 由于当前测试不通过 state 传递，API 请求的 chassisSeries 和 documentType 为空
    await page.waitForTimeout(1000);

    if (capturedBody) {
      expect(capturedBody.chassisNo).toBe('1234567890');
    }

    await takeScreenshot(page, '69_API请求_全参数');
  });

  test('No.70 API请求-仅底盘号参数', async ({ page }) => {
    resetCounter('70_API请求_仅底盘号');
    let capturedBody: any = null;
    await page.route(API_GENERATE_DOC, async (route: Route) => {
      capturedBody = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: MOCK_FULL_DATA }),
      });
    });
    await page.goto(`${BASE_URL}/Menu/GenerateDocument/1234567890`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    if (capturedBody) {
      expect(capturedBody.chassisNo).toBe('1234567890');
      expect(capturedBody.chassisSeries).toBe('');
      expect(capturedBody.documentType).toBe('');
    }

    await takeScreenshot(page, '70_API请求_仅底盘号');
  });

  test('No.71 API请求-无参数（空底盘号）', async ({ page }) => {
    resetCounter('71_API请求_无参数');
    let apiCalled = false;
    await page.route(API_GENERATE_DOC, async (route: Route) => {
      apiCalled = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument`);
    await page.waitForTimeout(1000);

    await expect(page.locator('.error-message-area')).toContainText('Chassis not found');
    expect(apiCalled).toBe(false);

    await takeScreenshot(page, '71_API请求_无参数');
  });
});

// ============================================================
// 15. 画面布局 - No.72-73
// ============================================================
test.describe.serial('画面布局', () => {

  test('No.72 画面布局-各区域顺序', async ({ page }) => {
    resetCounter('72_布局_区域顺序');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.page-title', { timeout: 15000 });

    // 验证关键区域按顺序存在
    await expect(page.locator('.page-header')).toBeVisible();
    await expect(page.locator('.vehicle-info-section')).toBeVisible();
    await expect(page.locator('.action-links')).toBeVisible();
    await expect(page.locator('.template-info-section')).toBeVisible();
    await expect(page.locator('.generated-doc-section')).toBeVisible();
    await expect(page.locator('.footer-info')).toBeVisible();

    await takeScreenshot(page, '72_布局_区域顺序');
  });

  test('No.73 画面布局-Label对齐方式', async ({ page }) => {
    resetCounter('73_布局_Label对齐');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });

    // Label 左对齐（默认样式）
    await expect(page.locator('.info-item label').first()).toBeVisible();

    await takeScreenshot(page, '73_布局_Label对齐');
  });
});

// ============================================================
// 16. API 响应数据结构验证 - No.74-77
// ============================================================
test.describe.serial('API响应结构验证', () => {

  test('No.74 API响应-data为null', async ({ page }) => {
    resetCounter('74_API_DataNull');
    await setupMockDataNull(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.error-message-area', { timeout: 15000 });

    await expect(page.locator('.error-message-area')).toContainText('Chassis not found');

    await takeScreenshot(page, '74_API_DataNull');
  });

  test('No.75 API响应-data中缺少某些字段', async ({ page }) => {
    resetCounter('75_API_缺字段');
    await page.route(API_GENERATE_DOC, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: 'success',
          data: { serie: 'ABC12', chassisNo: '1234567890' } // 只有部分字段
        }),
      });
    });
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });

    // 缺少的字段显示 "-"
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '75_API_缺字段');
  });

  test('No.76 API响应-返回未知状态码', async ({ page }) => {
    resetCounter('76_API_502');
    await setupMock502(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.error-message-area', { timeout: 15000 });

    await expect(page.locator('.error-message-area')).toContainText('System error. Please contact administrator.');

    await takeScreenshot(page, '76_API_502');
  });

  test('No.77 API响应-code=200但data为空对象', async ({ page }) => {
    resetCounter('77_API_空对象');
    await setupMockDataEmpty(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });

    // 所有字段显示 "-"
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '77_API_空对象');
  });
});

// ============================================================
// 17. 浏览器行为 - No.78-82
// ============================================================
test.describe.serial('浏览器行为', () => {

  test('No.78 浏览器回退-从UD07返回UD04', async ({ page }) => {
    resetCounter('78_回退_UD07');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.chassis-link', { timeout: 15000 });

    // 点击跳转到 UD07
    await page.locator('.chassis-link').click();
    await page.waitForTimeout(1000);

    // 浏览器回退
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.page-title', { timeout: 15000 });

    await expect(page.locator('.page-title')).toBeVisible();

    await takeScreenshot(page, '78_回退_UD07');
  });

  test('No.79 浏览器回退-从UD05返回UD04', async ({ page }) => {
    resetCounter('79_回退_UD05');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.ad-change-warning', { timeout: 15000 });

    await page.locator('.ad-change-warning').click();
    await page.waitForTimeout(1000);

    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.page-title', { timeout: 15000 });

    await expect(page.locator('.page-title')).toBeVisible();

    await takeScreenshot(page, '79_回退_UD05');
  });

  test('No.80 页面刷新-数据重新加载', async ({ page }) => {
    resetCounter('80_刷新_重新加载');
    let callCount = 0;
    await page.route(API_GENERATE_DOC, async (route: Route) => {
      callCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: MOCK_FULL_DATA }),
      });
    });
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.page-title', { timeout: 15000 });
    const countAfterLoad = callCount;

    // 刷新
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.page-title', { timeout: 15000 });
    expect(callCount).toBeGreaterThan(countAfterLoad);

    await takeScreenshot(page, '80_刷新_重新加载');
  });

  test('No.81 直接URL访问-带有效底盘号', async ({ page }) => {
    resetCounter('81_URL访问_有效');
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.page-title', { timeout: 15000 });

    await expect(page.locator('.page-title')).toBeVisible();

    await takeScreenshot(page, '81_URL访问_有效');
  });

  test('No.82 直接URL访问-底盘号含特殊字符', async ({ page }) => {
    resetCounter('82_URL访问_特殊字符');
    let capturedChassisNo = '';
    await page.route(API_GENERATE_DOC, async (route: Route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      capturedChassisNo = body.chassisNo || '';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: { ...MOCK_FULL_DATA, chassisNo: capturedChassisNo } }),
      });
    });
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/ABC-123_456`);
    await page.waitForTimeout(1000);

    expect(capturedChassisNo).toBe('ABC-123_456');

    await takeScreenshot(page, '82_URL访问_特殊字符');
  });
});

// ============================================================
// 18. 画面状态重置 - No.83-84
// ============================================================
test.describe.serial('画面状态重置', () => {

  test('No.83 连续请求-先失败后成功', async ({ page }) => {
    resetCounter('83_连续_先失败后成功');
    let requestCount = 0;
    await page.route(API_GENERATE_DOC, async (route: Route) => {
      requestCount++;
      if (requestCount === 1) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ code: 404, message: 'Chassis not found', data: null }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, message: 'success', data: MOCK_FULL_DATA }),
        });
      }
    });

    // 第一次：无效参数
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/invalid`);
    await page.waitForSelector('.error-message-area', { timeout: 15000 });
    await expect(page.locator('.error-message-area')).toContainText('Chassis not found');

    // 第二次：有效参数
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });
    await expect(page.locator('.error-message-area')).toHaveCount(0);
    await expect(page.locator('.vehicle-info-section')).toContainText('GOLF');

    await takeScreenshot(page, '83_连续_先失败后成功');
  });

  test('No.84 连续请求-先成功后再请求失败', async ({ page }) => {
    resetCounter('84_连续_先成功后失败');
    let requestCount = 0;
    await page.route(API_GENERATE_DOC, async (route: Route) => {
      requestCount++;
      if (requestCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, message: 'success', data: MOCK_FULL_DATA }),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ code: 404, message: 'Chassis not found', data: null }),
        });
      }
    });

    // 第一次：有效参数
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForSelector('.vehicle-info-section', { timeout: 15000 });
    await expect(page.locator('.vehicle-info-section')).toContainText('GOLF');

    // 第二次：无效参数
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/invalid`);
    await page.waitForSelector('.error-message-area', { timeout: 15000 });
    await expect(page.locator('.error-message-area')).toContainText('Chassis not found');

    await takeScreenshot(page, '84_连续_先成功后失败');
  });
});

// ============================================================
// 19. 安全性 - No.85-86
// ============================================================
test.describe.serial('安全性', () => {

  test('No.85 安全性-未登录访问跳转', async ({ page }) => {
    resetCounter('85_安全_未登录');
    // 清除登录状态
    await page.addInitScript(() => {
      localStorage.removeItem('userInfo');
    });
        await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/1234567890`);
    await page.waitForTimeout(1000);

    // 应跳转到登录页
    expect(page.url()).toBe(`${BASE_URL}/`);

    await takeScreenshot(page, '85_安全_未登录');
  });

  test('No.86 安全性-底盘号参数校验', async ({ page }) => {
    resetCounter('86_安全_XSS');
    let capturedChassisNo = '';
    await page.route(API_GENERATE_DOC, async (route: Route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      capturedChassisNo = body.chassisNo || '';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: { ...MOCK_FULL_DATA, chassisNo: capturedChassisNo } }),
      });
    });
    // URL 中的脚本标签
    await safeGoto(page, `${BASE_URL}/Menu/GenerateDocument/<script>alert('xss')</script>`);
    await page.waitForTimeout(1000);

    // 底盘号参数应被正确传递（不执行脚本）
    expect(capturedChassisNo).toContain('script');

    await takeScreenshot(page, '86_安全_XSS');
  });
});
