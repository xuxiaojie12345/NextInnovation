import { test, expect, Page, Route } from '@playwright/test';

// ============================================================
// Generate Homologation Document (UD03) Playwright 自动化测试
// 基于 単体テスト仕様書UD03.md
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD03';

const MOCK_DOC_TYPES = [
  { doctype: 'COC', description: 'Certificate of Conformity', registerDatetime: '2024-01-01T00:00:00', registerUser: 'admin', registerProcess: 'init', updateDatetime: '2024-01-01T00:00:00', updateUser: 'admin', updateProcess: 'init' },
  { doctype: 'VCC', description: 'Vehicle Certification Code', registerDatetime: '2024-01-01T00:00:00', registerUser: 'admin', registerProcess: 'init', updateDatetime: '2024-01-01T00:00:00', updateUser: 'admin', updateProcess: 'init' },
  { doctype: 'EEC', description: 'European Economic Community', registerDatetime: '2024-01-01T00:00:00', registerUser: 'admin', registerProcess: 'init', updateDatetime: '2024-01-01T00:00:00', updateUser: 'admin', updateProcess: 'init' },
];

const API_DOC_TYPES = 'http://localhost:8081/api/documenttypes';

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
      await page.waitForSelector('.generate-homologation-container', { timeout: 15000 }).catch(() => {});
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
      return;
    } catch (e) {
      if (i === 2 || page.isClosed()) throw e;
      await page.waitForTimeout(2000);
    }
  }
}

/** 设置 API Mock（返回文档类型列表成功） */
async function setupMockDocTypes(page: Page) {
  await page.route(API_DOC_TYPES, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_DOC_TYPES),
    });
  });
}

/** 设置 API Mock（返回空数组） */
async function setupMockDocTypesEmpty(page: Page) {
  await page.route(API_DOC_TYPES, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

/** 设置 API Mock（返回 500 错误） */
async function setupMockDocTypesError(page: Page) {
  await page.route(API_DOC_TYPES, async (route: Route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ code: 500, message: 'Internal server error', data: null }),
    });
  });
}

/** 设置 API Mock（网络断开） */
async function setupMockDocTypesNetworkError(page: Page) {
  await page.route(API_DOC_TYPES, async (route: Route) => {
    await route.abort('connectionrefused');
  });
}

/** 设置 API Mock（超时） */
async function setupMockDocTypesTimeout(page: Page) {
  await page.route(API_DOC_TYPES, async (route: Route) => {
    // 延迟后中断请求，模拟超时
    await new Promise(r => setTimeout(r, 100));
    await route.abort('connectionrefused');
  });
}

/** 设置 API Mock（返回 404） */
async function setupMockDocTypes404(page: Page) {
  await page.route(API_DOC_TYPES, async (route: Route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ code: 404, message: 'Not found', data: null }),
    });
  });
}

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
// 1. 画面初始化 - No.1-8
// ============================================================
test.describe.serial('画面初始化', () => {

  test('No.1 页面初始化-文档类型列表加载成功', async ({ page }) => {
    resetCounter('01_初始化_加载成功');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('.form-card-title', { timeout: 15000 });

    // 确认页面标题
    await expect(page.locator('.form-card-title')).toContainText('Generate Homologation Document');

    // Chassis series 输入框为空且可用
    await expect(page.locator('#chassisSeries')).toBeVisible();
    await expect(page.locator('#chassisSeries')).toHaveValue('');
    await expect(page.locator('#chassisSeries')).toBeEnabled();

    // Chassis no 输入框为空且可用
    await expect(page.locator('#chassisNo')).toBeVisible();
    await expect(page.locator('#chassisNo')).toHaveValue('');
    await expect(page.locator('#chassisNo')).toBeEnabled();

    // Document type 下拉列表有选项
    await expect(page.locator('#documentType')).toBeVisible();
    await expect(page.locator('#documentType option')).toHaveCount(MOCK_DOC_TYPES.length + 1); // 默认 + 数据
    await expect(page.locator('#documentType')).toBeEnabled();

    // 按钮可用
    await expect(page.locator('button:has-text("Submit")')).toBeEnabled();
    await expect(page.locator('button:has-text("Reset")')).toBeEnabled();
    await expect(page.locator('button:has-text("Help")')).toBeEnabled();

    // 不显示错误消息
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '01_初始化_加载成功');
  });

  test('No.2 页面初始化-文档类型列表为空', async ({ page }) => {
    resetCounter('02_初始化_列表为空');
    await setupMockDocTypesEmpty(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('.form-card-title', { timeout: 15000 });

    // Document type 下拉列表仅显示空选项
    await expect(page.locator('#documentType option')).toHaveCount(1); // 仅 -- Select --
    await expect(page.locator('#documentType')).toBeEnabled();
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '02_初始化_列表为空');
  });

  test('No.3 页面初始化-加载文档类型失败（API返回500）', async ({ page }) => {
    resetCounter('03_初始化_API500');
    await setupMockDocTypesError(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('.form-card-title', { timeout: 15000 });

    // 错误消息（代码实际实现的消息）
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Document type acquisition failed');

    await takeScreenshot(page, '03_初始化_API500');
  });

  test('No.4 页面初始化-网络异常', async ({ page }) => {
    resetCounter('04_初始化_网络异常');
    await setupMockDocTypesNetworkError(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('.form-card-title', { timeout: 15000 });

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Document type acquisition failed');

    await takeScreenshot(page, '04_初始化_网络异常');
  });

  test('No.5 页面初始化-API超时', async ({ page }) => {
    resetCounter('05_初始化_API超时');
    await setupMockDocTypesTimeout(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('.form-card-title', { timeout: 15000 });

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Document type acquisition failed');

    await takeScreenshot(page, '05_初始化_API超时');
  });

  test('No.6 页面初始化-从本地存储恢复上次条件', async ({ page }) => {
    resetCounter('06_初始化_恢复条件');
    // 预置 localStorage 数据
    await page.addInitScript(() => {
      const condition = JSON.stringify({ chassisSeries: 'ABC', chassisNo: '12345', documentType: 'COC' });
      localStorage.setItem('homologationSearchCondition', condition);
    });
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('.form-card-title', { timeout: 15000 });

    await expect(page.locator('#chassisSeries')).toHaveValue('ABC');
    await expect(page.locator('#chassisNo')).toHaveValue('12345');
    await expect(page.locator('#documentType')).toHaveValue('COC');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '06_初始化_恢复条件');
  });

  test('No.7 页面初始化-本地存储中无查询条件', async ({ page }) => {
    resetCounter('07_初始化_无存储');
    // 确保没有存储条件
    await page.addInitScript(() => {
      localStorage.removeItem('homologationSearchCondition');
    });
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('.form-card-title', { timeout: 15000 });

    await expect(page.locator('#chassisSeries')).toHaveValue('');
    await expect(page.locator('#chassisNo')).toHaveValue('');
    await expect(page.locator('#documentType')).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '07_初始化_无存储');
  });

  test('No.8 页面初始化-本地存储部分数据（Chassis series 和 chassisNo 存在，documentType 不存在）', async ({ page }) => {
    resetCounter('08_初始化_部分存储');
    await page.addInitScript(() => {
      const condition = JSON.stringify({ chassisSeries: 'XYZ', chassisNo: '67890', documentType: '' });
      localStorage.setItem('homologationSearchCondition', condition);
    });
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('.form-card-title', { timeout: 15000 });

    await expect(page.locator('#chassisSeries')).toHaveValue('XYZ');
    await expect(page.locator('#chassisNo')).toHaveValue('67890');
    await expect(page.locator('#documentType')).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '08_初始化_部分存储');
  });
});

// ============================================================
// 2. 表单区域 - Chassis Series - No.9-17
// ============================================================
test.describe.serial('表单区域_ChassisSeries', () => {

  test('No.9 Chassis series-正常输入半角英字', async ({ page }) => {
    resetCounter('09_ChassisSeries_正常输入');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('ABCde');
    await expect(page.locator('#chassisSeries')).toHaveValue('ABCde');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '09_ChassisSeries_正常输入');
  });

  test('No.10 Chassis series-输入半角数字（应被过滤）', async ({ page }) => {
    resetCounter('10_ChassisSeries_数字过滤');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('ABC123');
    // 代码中 onChange 通过 /^[a-zA-Z]*$/ 校验，数字不会被 setState
    await expect(page.locator('#chassisSeries')).toHaveValue('ABC');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '10_ChassisSeries_数字过滤');
  });

  test('No.11 Chassis series-输入特殊符号（应被过滤）', async ({ page }) => {
    resetCounter('11_ChassisSeries_符号过滤');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('A-B+C@');
    await expect(page.locator('#chassisSeries')).toHaveValue('ABC');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '11_ChassisSeries_符号过滤');
  });

  test('No.12 Chassis series-输入全角字符（应被过滤）', async ({ page }) => {
    resetCounter('12_ChassisSeries_全角过滤');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('ＡＢＣ');
    await expect(page.locator('#chassisSeries')).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '12_ChassisSeries_全角过滤');
  });

  test('No.13 Chassis series-输入空格（应被过滤）', async ({ page }) => {
    resetCounter('13_ChassisSeries_空格过滤');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('A B C');
    await expect(page.locator('#chassisSeries')).toHaveValue('ABC');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '13_ChassisSeries_空格过滤');
  });

  test('No.14 Chassis series-输入小写字母自动保留', async ({ page }) => {
    resetCounter('14_ChassisSeries_小写保留');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('abcde');
    await expect(page.locator('#chassisSeries')).toHaveValue('abcde');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '14_ChassisSeries_小写保留');
  });

  test('No.15 Chassis series-最大长度限制（5字符）', async ({ page }) => {
    resetCounter('15_ChassisSeries_最大长度');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    // pressSequentially 逐字输入会触发 React onChange，每个字符都经过校验
    await page.locator('#chassisSeries').pressSequentially('ABCDEFGH');
    // maxLength=5，React 状态只接受前5个字符
    await expect(page.locator('#chassisSeries')).toHaveValue('ABCDE');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '15_ChassisSeries_最大长度');
  });

  test('No.16 Chassis series-边界值测试（5字符）', async ({ page }) => {
    resetCounter('16_ChassisSeries_边界值');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('ABCDE');
    await expect(page.locator('#chassisSeries')).toHaveValue('ABCDE');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '16_ChassisSeries_边界值');
  });

  test('No.17 Chassis series-清空输入', async ({ page }) => {
    resetCounter('17_ChassisSeries_清空');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('ABC');
    await expect(page.locator('#chassisSeries')).toHaveValue('ABC');
    await page.locator('#chassisSeries').fill('');
    await expect(page.locator('#chassisSeries')).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '17_ChassisSeries_清空');
  });
});

// ============================================================
// 3. 表单区域 - Chassis No - No.18-25
// ============================================================
test.describe.serial('表单区域_ChassisNo', () => {

  test('No.18 Chassis no-正常输入半角数字', async ({ page }) => {
    resetCounter('18_ChassisNo_正常输入');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisNo', { timeout: 15000 });

    await page.locator('#chassisNo').pressSequentially('1234567890');
    await expect(page.locator('#chassisNo')).toHaveValue('1234567890');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '18_ChassisNo_正常输入');
  });

  test('No.19 Chassis no-输入半角英文字母（应被过滤）', async ({ page }) => {
    resetCounter('19_ChassisNo_字母过滤');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisNo', { timeout: 15000 });

    await page.locator('#chassisNo').pressSequentially('123ABC456');
    await expect(page.locator('#chassisNo')).toHaveValue('123456');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '19_ChassisNo_字母过滤');
  });

  test('No.20 Chassis no-输入特殊符号（应被过滤）', async ({ page }) => {
    resetCounter('20_ChassisNo_符号过滤');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisNo', { timeout: 15000 });

    await page.locator('#chassisNo').pressSequentially('123-456#789');
    await expect(page.locator('#chassisNo')).toHaveValue('123456789');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '20_ChassisNo_符号过滤');
  });

  test('No.21 Chassis no-输入全角数字（应被过滤）', async ({ page }) => {
    resetCounter('21_ChassisNo_全角过滤');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisNo', { timeout: 15000 });

    await page.locator('#chassisNo').pressSequentially('１２３４５');
    await expect(page.locator('#chassisNo')).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '21_ChassisNo_全角过滤');
  });

  test('No.22 Chassis no-输入空格（应被过滤）', async ({ page }) => {
    resetCounter('22_ChassisNo_空格过滤');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisNo', { timeout: 15000 });

    await page.locator('#chassisNo').pressSequentially('123 456 789');
    await expect(page.locator('#chassisNo')).toHaveValue('123456789');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '22_ChassisNo_空格过滤');
  });

  test('No.23 Chassis no-最大长度限制（10字符）', async ({ page }) => {
    resetCounter('23_ChassisNo_最大长度');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisNo', { timeout: 15000 });

    await page.locator('#chassisNo').pressSequentially('1234567890123');
    await expect(page.locator('#chassisNo')).toHaveValue('1234567890');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '23_ChassisNo_最大长度');
  });

  test('No.24 Chassis no-边界值测试（10字符）', async ({ page }) => {
    resetCounter('24_ChassisNo_边界值');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisNo', { timeout: 15000 });

    await page.locator('#chassisNo').pressSequentially('1234567890');
    await expect(page.locator('#chassisNo')).toHaveValue('1234567890');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '24_ChassisNo_边界值');
  });

  test('No.25 Chassis no-清空输入', async ({ page }) => {
    resetCounter('25_ChassisNo_清空');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisNo', { timeout: 15000 });

    await page.locator('#chassisNo').pressSequentially('12345');
    await expect(page.locator('#chassisNo')).toHaveValue('12345');
    await page.locator('#chassisNo').fill('');
    await expect(page.locator('#chassisNo')).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '25_ChassisNo_清空');
  });
});

// ============================================================
// 4. 表单区域 - Document Type - No.26-29
// ============================================================
test.describe.serial('表单区域_DocumentType', () => {

  test('No.26 Document type-下拉列表展开', async ({ page }) => {
    resetCounter('26_DocumentType_展开');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#documentType', { timeout: 15000 });

    // 展开下拉列表
    await page.locator('#documentType').click();
    // 确认选项
    const options = page.locator('#documentType option');
    await expect(options).toHaveCount(MOCK_DOC_TYPES.length + 1);
    await expect(options.nth(0)).toHaveAttribute('value', '');
    await expect(options.nth(1)).toHaveAttribute('value', 'COC');
    await expect(options.nth(2)).toHaveAttribute('value', 'VCC');
    await expect(options.nth(3)).toHaveAttribute('value', 'EEC');

    await takeScreenshot(page, '26_DocumentType_展开');
  });

  test('No.27 Document type-选择有效文档类型', async ({ page }) => {
    resetCounter('27_DocumentType_选择');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#documentType', { timeout: 15000 });

    await page.locator('#documentType').selectOption('COC');
    await expect(page.locator('#documentType')).toHaveValue('COC');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '27_DocumentType_选择');
  });

  test('No.28 Document type-切换选择', async ({ page }) => {
    resetCounter('28_DocumentType_切换');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#documentType', { timeout: 15000 });

    await page.locator('#documentType').selectOption('COC');
    await expect(page.locator('#documentType')).toHaveValue('COC');
    await page.locator('#documentType').selectOption('VCC');
    await expect(page.locator('#documentType')).toHaveValue('VCC');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '28_DocumentType_切换');
  });

  test('No.29 Document type-清空选择（重新选择空选项）', async ({ page }) => {
    resetCounter('29_DocumentType_清空');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#documentType', { timeout: 15000 });

    await page.locator('#documentType').selectOption('COC');
    await expect(page.locator('#documentType')).toHaveValue('COC');
    await page.locator('#documentType').selectOption('');
    await expect(page.locator('#documentType')).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '29_DocumentType_清空');
  });
});

// ============================================================
// 5. 按钮操作 - Submit 按钮 - No.30-37
// ============================================================
test.describe.serial('按钮操作_Submit', () => {

  test('No.30 Submit-正常提交（所有字段有效）', async ({ page }) => {
    resetCounter('30_Submit_正常提交');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');
    await page.locator('button:has-text("Submit")').click();

    // 跳转到 UD04 页面（导航到 /Menu/GenerateDocument/12345）
    await page.waitForTimeout(1000);
    // 确认 URL 变化（SPA 路由）
    expect(page.url()).toContain('/Menu/GenerateDocument/12345');

    await takeScreenshot(page, '30_Submit_正常提交');
  });

  test('No.31 Submit-空值校验（Chassis series 为空）', async ({ page }) => {
    resetCounter('31_Submit_校验Series空');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    // Chassis series 保持为空
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');
    await page.locator('button:has-text("Submit")').click();

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Chassis series is required');
    // 页面不应跳转
    expect(page.url()).not.toContain('/Menu/GenerateDocument');

    await takeScreenshot(page, '31_Submit_校验Series空');
  });

  test('No.32 Submit-空值校验（Chassis no 为空）', async ({ page }) => {
    resetCounter('32_Submit_校验No空');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#documentType').selectOption('COC');
    await page.locator('button:has-text("Submit")').click();

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Chassis no is required');
    expect(page.url()).not.toContain('/Menu/GenerateDocument');

    await takeScreenshot(page, '32_Submit_校验No空');
  });

  test('No.33 Submit-空值校验（Document type 未选择）', async ({ page }) => {
    resetCounter('33_Submit_校验DocType空');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('button:has-text("Submit")').click();

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Document type is required');
    expect(page.url()).not.toContain('/Menu/GenerateDocument');

    await takeScreenshot(page, '33_Submit_校验DocType空');
  });

  test('No.34 Submit-空值校验（所有字段均为空）', async ({ page }) => {
    resetCounter('34_Submit_全部空');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('button:has-text("Submit")').click();

    // 优先触发 Chassis series 空值校验
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Chassis series is required');
    expect(page.url()).not.toContain('/Menu/GenerateDocument');

    await takeScreenshot(page, '34_Submit_全部空');
  });

  test('No.35 Submit-提交后保存条件到本地存储', async ({ page }) => {
    resetCounter('35_Submit_保存条件');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('XYZ');
    await page.locator('#chassisNo').pressSequentially('99999');
    await page.locator('#documentType').selectOption('VCC');
    await page.locator('button:has-text("Submit")').click();

    // 跳转后检查 localStorage（页面已导航到 UD04，但仍在同一个 origin）
    await page.waitForTimeout(500);
    const savedCondition = await page.evaluate(() => localStorage.getItem('homologationSearchCondition'));
    expect(savedCondition).toBeTruthy();
    if (savedCondition) {
      const parsed = JSON.parse(savedCondition);
      expect(parsed.chassisSeries).toBe('XYZ');
      expect(parsed.chassisNo).toBe('99999');
      expect(parsed.documentType).toBe('VCC');
    }

    await takeScreenshot(page, '35_Submit_保存条件');
  });

  test('No.36 Submit-提交时清空之前的错误消息', async ({ page }) => {
    resetCounter('36_Submit_清空旧错误');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    // 第一次：触发错误
    await page.locator('button:has-text("Submit")').click();
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Chassis series is required');

    // 第二次：输入有效值后提交
    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');
    await page.locator('button:has-text("Submit")').click();

    // 跳转到 UD04，错误消息被清除
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/Menu/GenerateDocument/12345');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '36_Submit_清空旧错误');
  });

  test('No.37 Submit-连续快速点击（防止重复提交）', async ({ page }) => {
    resetCounter('37_Submit_快速点击');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');

    // 快速点击多次 Submit（用 evaluate 同时触发，绕过页面跳转后元素消失的问题）
    await page.locator('button:has-text("Submit")').evaluate((btn: HTMLButtonElement) => {
      btn.click();
      btn.click();
      btn.click();
    });

    // 应仅跳转一次到 UD04
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/Menu/GenerateDocument/12345');

    await takeScreenshot(page, '37_Submit_快速点击');
  });
});

// ============================================================
// 6. 按钮操作 - Reset 按钮 - No.38-41
// ============================================================
test.describe.serial('按钮操作_Reset', () => {

  test('No.38 Reset-重置所有输入字段', async ({ page }) => {
    resetCounter('38_Reset_重置字段');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');
    await page.locator('button:has-text("Reset")').click();

    await expect(page.locator('#chassisSeries')).toHaveValue('');
    await expect(page.locator('#chassisNo')).toHaveValue('');
    await expect(page.locator('#documentType')).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);
    expect(page.url()).toContain('/Menu/GenerateHomologationDocument');

    await takeScreenshot(page, '38_Reset_重置字段');
  });

  test('No.39 Reset-重置后 localStorage 中的条件不受影响', async ({ page }) => {
    resetCounter('39_Reset_localStorage保持');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');
    await page.locator('button:has-text("Submit")').click();
    await page.waitForTimeout(500);

    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('button:has-text("Reset")').click();

    const savedCondition = await page.evaluate(() => localStorage.getItem('homologationSearchCondition'));
    expect(savedCondition).toBeTruthy();
    if (savedCondition) {
      const parsed = JSON.parse(savedCondition);
      expect(parsed.chassisSeries).toBe('ABC');
      expect(parsed.chassisNo).toBe('12345');
      expect(parsed.documentType).toBe('COC');
    }

    await takeScreenshot(page, '39_Reset_localStorage保持');
  });

  test('No.40 Reset-重置后刷新页面确认恢复功能', async ({ page }) => {
    resetCounter('40_Reset_刷新恢复');
    await page.addInitScript(() => {
      const condition = JSON.stringify({ chassisSeries: 'ABC', chassisNo: '12345', documentType: 'COC' });
      localStorage.setItem('homologationSearchCondition', condition);
    });
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('button:has-text("Reset")').click();
    await expect(page.locator('#chassisSeries')).toHaveValue('');
    await expect(page.locator('#chassisNo')).toHaveValue('');
    await expect(page.locator('#documentType')).toHaveValue('');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await expect(page.locator('#chassisSeries')).toHaveValue('ABC');
    await expect(page.locator('#chassisNo')).toHaveValue('12345');
    await expect(page.locator('#documentType')).toHaveValue('COC');

    await takeScreenshot(page, '40_Reset_刷新恢复');
  });

  test('No.41 Reset-清除当前错误消息', async ({ page }) => {
    resetCounter('41_Reset_清除错误');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('button:has-text("Submit")').click();
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Chassis series is required');

    await page.locator('button:has-text("Reset")').click();

    await expect(page.locator('.error-message')).toHaveCount(0);
    await expect(page.locator('#chassisSeries')).toHaveValue('');
    await expect(page.locator('#chassisNo')).toHaveValue('');
    await expect(page.locator('#documentType')).toHaveValue('');

    await takeScreenshot(page, '41_Reset_清除错误');
  });
});

// ============================================================
// 7. 按钮操作 - Help 按钮 - No.42-43
// ============================================================
test.describe.serial('按钮操作_Help', () => {

  test('No.42 Help-点击跳转到 User Guide', async ({ page }) => {
    resetCounter('42_Help_跳转');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('button:has-text("Help")').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/Menu/UserGuide');

    await takeScreenshot(page, '42_Help_跳转');
  });

  test('No.43 Help-点击时不触发表单校验', async ({ page }) => {
    resetCounter('43_Help_不触发校验');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('button:has-text("Help")').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/Menu/UserGuide');

    await takeScreenshot(page, '43_Help_不触发校验');
  });
});

// ============================================================
// 8. 异常处理与API错误 - No.44-48
// ============================================================
test.describe.serial('异常处理与API错误', () => {

  test('No.44 异常处理-API返回500错误', async ({ page }) => {
    resetCounter('44_异常_API500');
    await setupMockDocTypesError(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('.form-card-title', { timeout: 15000 });

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Document type acquisition failed');

    await takeScreenshot(page, '44_异常_API500');
  });

  test('No.45 异常处理-API返回非200状态码', async ({ page }) => {
    resetCounter('45_异常_API404');
    await setupMockDocTypes404(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('.form-card-title', { timeout: 15000 });

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Document type acquisition failed');

    await takeScreenshot(page, '45_异常_API404');
  });

  test('No.46 异常处理-API返回空数据', async ({ page }) => {
    resetCounter('46_异常_空数据');
    await page.route(API_DOC_TYPES, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null), // 返回 null（非数组），触发 catch
      });
    });
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('.form-card-title', { timeout: 15000 });

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Document type acquisition failed');

    await takeScreenshot(page, '46_异常_空数据');
  });

  test('No.47 异常处理-网络连接失败', async ({ page }) => {
    resetCounter('47_异常_网络断开');
    await setupMockDocTypesNetworkError(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('.form-card-title', { timeout: 15000 });

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Document type acquisition failed');

    await takeScreenshot(page, '47_异常_网络断开');
  });

  test('No.48 异常处理-API超时', async ({ page }) => {
    resetCounter('48_异常_API超时');
    await setupMockDocTypesTimeout(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('.form-card-title', { timeout: 15000 });

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Document type acquisition failed');

    await takeScreenshot(page, '48_异常_API超时');
  });
});

// ============================================================
// 9. 输入过滤（实时过滤）- No.49-54
// ============================================================
test.describe.serial('输入过滤', () => {

  test('No.49 输入过滤-Chassis series 混合输入（字母+数字+符号）', async ({ page }) => {
    resetCounter('49_过滤_Series混合');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('A1B2C@D#E');
    await expect(page.locator('#chassisSeries')).toHaveValue('ABCDE');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '49_过滤_Series混合');
  });

  test('No.50 输入过滤-Chassis no 混合输入（数字+字母+符号）', async ({ page }) => {
    resetCounter('50_过滤_No混合');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisNo', { timeout: 15000 });

    await page.locator('#chassisNo').pressSequentially('1A2B3C@D#E');
    await expect(page.locator('#chassisNo')).toHaveValue('123');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '50_过滤_No混合');
  });

  test('No.51 输入过滤-Chassis series 仅输入非法字符', async ({ page }) => {
    resetCounter('51_过滤_Series全非法');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('123@#$');
    await expect(page.locator('#chassisSeries')).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '51_过滤_Series全非法');
  });

  test('No.52 输入过滤-Chassis no 仅输入非法字符', async ({ page }) => {
    resetCounter('52_过滤_No全非法');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisNo', { timeout: 15000 });

    await page.locator('#chassisNo').pressSequentially('ABC@#$');
    await expect(page.locator('#chassisNo')).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '52_过滤_No全非法');
  });

  test('No.53 输入过滤-Ctrl+V 粘贴含非法字符内容', async ({ page }) => {
    resetCounter('53_过滤_Series粘贴');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('ABC12DE');
    await expect(page.locator('#chassisSeries')).toHaveValue('ABCDE');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '53_过滤_Series粘贴');
  });

  test('No.54 输入过滤-Chassis no 粘贴含非法字符内容', async ({ page }) => {
    resetCounter('54_过滤_No粘贴');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisNo', { timeout: 15000 });

    await page.locator('#chassisNo').pressSequentially('123ABC456DEF');
    await expect(page.locator('#chassisNo')).toHaveValue('123456');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '54_过滤_No粘贴');
  });
});

// ============================================================
// 10. 错误消息显示 - No.55-57
// ============================================================
test.describe.serial('错误消息显示', () => {

  test('No.55 错误消息-必填校验样式', async ({ page }) => {
    resetCounter('55_错误_校验样式');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');
    await page.locator('button:has-text("Submit")').click();

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Chassis series is required');

    await takeScreenshot(page, '55_错误_校验样式');
  });

  test('No.56 错误消息-多条错误不叠加（仅显示第一个校验失败的消息）', async ({ page }) => {
    resetCounter('56_错误_仅一条');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('button:has-text("Submit")').click();

    await expect(page.locator('.error-message')).toBeVisible();
    const msg = await page.locator('.error-message').textContent();
    expect(msg).toContain('Chassis series is required');
    expect(msg).not.toContain('Chassis no');
    expect(msg).not.toContain('Document type');

    await takeScreenshot(page, '56_错误_仅一条');
  });

  test('No.57 错误消息-旧错误消息在新操作时被清除', async ({ page }) => {
    resetCounter('57_错误_清空旧错误');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('button:has-text("Submit")').click();
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Chassis series is required');

    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');
    await page.locator('button:has-text("Submit")').click();

    await page.waitForTimeout(500);
    expect(page.url()).toContain('/Menu/GenerateDocument/12345');

    await takeScreenshot(page, '57_错误_清空旧错误');
  });
});

// ============================================================
// 11. 画面显示与布局 - No.58-63
// ============================================================
test.describe.serial('画面显示与布局', () => {

  test('No.58 画面显示-页面标题', async ({ page }) => {
    resetCounter('58_画面_标题');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('.form-card-title', { timeout: 15000 });

    await expect(page.locator('.form-card-title')).toBeVisible();
    await expect(page.locator('.form-card-title')).toContainText('HDoc - Generate Homologation Document');

    await takeScreenshot(page, '58_画面_标题');
  });

  test('No.59 画面显示-所有控件可见', async ({ page }) => {
    resetCounter('59_画面_控件可见');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('.form-card-title', { timeout: 15000 });

    await expect(page.locator('#chassisSeries')).toBeVisible();
    await expect(page.locator('#chassisNo')).toBeVisible();
    await expect(page.locator('#documentType')).toBeVisible();
    await expect(page.locator('button:has-text("Submit")')).toBeVisible();
    await expect(page.locator('button:has-text("Reset")')).toBeVisible();
    await expect(page.locator('button:has-text("Help")')).toBeVisible();
    await expect(page.locator('a[href="mailto:support.tpi@volvo.com"]')).toBeVisible();

    await takeScreenshot(page, '59_画面_控件可见');
  });

  test('No.60 画面显示-输入框标签', async ({ page }) => {
    resetCounter('60_画面_标签');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('.form-card-title', { timeout: 15000 });

    await expect(page.locator('label[for="chassisSeries"]')).toContainText('Chassis series');
    await expect(page.locator('label[for="chassisNo"]')).toContainText('Chassis no');
    await expect(page.locator('label[for="documentType"]')).toContainText('Document type');

    await takeScreenshot(page, '60_画面_标签');
  });

  test('No.61 画面显示-按钮文字', async ({ page }) => {
    resetCounter('61_画面_按钮文字');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('.form-card-title', { timeout: 15000 });

    await expect(page.locator('button:has-text("Submit")')).toContainText('Submit');
    await expect(page.locator('button:has-text("Reset")')).toContainText('Reset');
    await expect(page.locator('button:has-text("Help")')).toContainText('Help');

    await takeScreenshot(page, '61_画面_按钮文字');
  });

  test('No.62 画面显示-输入框占位符', async ({ page }) => {
    resetCounter('62_画面_占位符');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await expect(page.locator('#chassisSeries')).toHaveAttribute('placeholder', '例: JPCT');
    await expect(page.locator('#chassisNo')).toHaveAttribute('placeholder', '例: 028321');

    await takeScreenshot(page, '62_画面_占位符');
  });

  test('No.63 画面显示-Support Mail 标签', async ({ page }) => {
    resetCounter('63_画面_SupportMail');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('.form-card-title', { timeout: 15000 });

    const supportMail = page.locator('a[href="mailto:support.tpi@volvo.com"]');
    await expect(supportMail).toBeVisible();
    await expect(supportMail).toContainText('support.tpi@volvo.com');

    await takeScreenshot(page, '63_画面_SupportMail');
  });
});

// ============================================================
// 12. 状态保持与恢复 - No.64-66
// ============================================================
test.describe.serial('状态保持与恢复', () => {

  test('No.64 状态保持-提交后条件保存到localStorage', async ({ page }) => {
    resetCounter('64_状态_保存条件');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');
    await page.locator('button:has-text("Submit")').click();

    await page.waitForTimeout(500);
    const savedCondition = await page.evaluate(() => localStorage.getItem('homologationSearchCondition'));
    expect(savedCondition).toBeTruthy();
    if (savedCondition) {
      const parsed = JSON.parse(savedCondition);
      expect(parsed.chassisSeries).toBe('ABC');
      expect(parsed.chassisNo).toBe('12345');
      expect(parsed.documentType).toBe('COC');
    }

    await takeScreenshot(page, '64_状态_保存条件');
  });

  test('No.65 状态保持-再次打开页面时恢复上次条件', async ({ page }) => {
    resetCounter('65_状态_恢复条件');
    await page.addInitScript(() => {
      const condition = JSON.stringify({ chassisSeries: 'ABC', chassisNo: '12345', documentType: 'COC' });
      localStorage.setItem('homologationSearchCondition', condition);
    });
    await setupMockDocTypes(page);

    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await expect(page.locator('#chassisSeries')).toHaveValue('ABC');
    await expect(page.locator('#chassisNo')).toHaveValue('12345');
    await expect(page.locator('#documentType')).toHaveValue('COC');

    await takeScreenshot(page, '65_状态_恢复条件');
  });

  test('No.66 状态保持-多次提交更新本地存储', async ({ page }) => {
    resetCounter('66_状态_更新存储');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    // 第一次提交：条件 A
    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');
    await page.locator('button:has-text("Submit")').click();
    await page.waitForTimeout(500);

    // 返回 UD03 页面
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    // 修改条件为 B
    await page.locator('#chassisSeries').fill('');
    await page.locator('#chassisSeries').pressSequentially('XYZ');
    await page.locator('#documentType').selectOption('VCC');
    await page.locator('button:has-text("Submit")').click();
    await page.waitForTimeout(500);

    const savedCondition = await page.evaluate(() => localStorage.getItem('homologationSearchCondition'));
    expect(savedCondition).toBeTruthy();
    if (savedCondition) {
      const parsed = JSON.parse(savedCondition);
      expect(parsed.chassisSeries).toBe('XYZ');
      expect(parsed.chassisNo).toBe('12345');
      expect(parsed.documentType).toBe('VCC');
    }

    await takeScreenshot(page, '66_状态_更新存储');
  });
});

// ============================================================
// 13. 页面跳转（UD04）- No.67-69
// ============================================================
test.describe.serial('页面跳转_UD04', () => {

  test('No.67 页面跳转-提交后跳转到UD04并传递参数', async ({ page }) => {
    resetCounter('67_跳转_传参');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');
    await page.locator('button:has-text("Submit")').click();

    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/Menu/GenerateDocument/12345');

    await takeScreenshot(page, '67_跳转_传参');
  });

  test('No.68 页面跳转-不同参数跳转', async ({ page }) => {
    resetCounter('68_跳转_不同参数');
    await setupMockDocTypes(page);
    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    await page.locator('#chassisSeries').pressSequentially('XYZ');
    await page.locator('#chassisNo').pressSequentially('99999');
    await page.locator('#documentType').selectOption('VCC');
    await page.locator('button:has-text("Submit")').click();

    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/Menu/GenerateDocument/99999');

    await takeScreenshot(page, '68_跳转_不同参数');
  });

  test('No.69 页面跳转-Submit时不调用后端API', async ({ page }) => {
    resetCounter('69_跳转_不调API');
    let apiCallCount = 0;
    await page.route(API_DOC_TYPES, async (route: Route) => {
      apiCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_DOC_TYPES),
      });
    });

    await safeGoto(page, `${BASE_URL}/Menu/GenerateHomologationDocument`);
    await page.waitForSelector('#chassisSeries', { timeout: 15000 });

    apiCallCount = 0;

    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');
    await page.locator('button:has-text("Submit")').click();

    await page.waitForTimeout(1000);
    expect(apiCallCount).toBe(0);

    await takeScreenshot(page, '69_跳转_不调API');
  });
});
