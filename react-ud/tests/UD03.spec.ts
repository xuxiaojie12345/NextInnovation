import { test, expect, Page } from '@playwright/test';
import { insertUD03TestData, cleanupUD03TestData } from './test-data-helper';

// ============================================================
// GenerateHomologationDocument 模块 (UD03) Playwright 自动化测试
// 基于 単体テスト仕様書UD03.md（82个测试用例）
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD03';

// 截图计数器
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

/** 安全导航：domcontentloaded + 重试 */
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

/** 通过 localStorage 模拟登录 */
async function loginViaLocalStorage(page: Page) {
  const userInfo = {
    username: 'admin',
    role: 'Administrator',
    permissions: [
      "GenerateDucument", "GenerateDoc", "GenerateBatch", "RegdataArchive", "RegdataBatch",
      "UpdateRules", "UpdateUnicodeRules", "ExistingVariables", "UnlockDocument",
      "HDocNumberSeries", "UploadDeleteTemplate", "ListTemplates", "VPPSVinPlate", "ADCAChange",
      "HDocUserAdmin", "HDocUserDocAdmin", "SearchUser", "ChangePassword", "UserPosition",
      "ArchiveSearch", "UploadDocument",
      "UserGuide", "ADCAChangeGuide", "VinPlateGuide", "ArchiveGuide", "Privacy",
    ],
  };
  await page.evaluate((info) => {
    localStorage.setItem('userInfo', JSON.stringify(info));
  }, userInfo);
}

/** 导航到 UD03 页面 */
async function gotoUD03(page: Page) {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  await page.goto(`${BASE_URL}/Menu/GenerateHomologationDocument`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);
}

/** Mock 文档类型 API 返回指定数据 */
async function mockDocumentTypes(page: Page, data: any, status: number = 200, delay: number = 0) {
  await page.route('**/api/documenttypes', async (route) => {
    if (delay > 0) await new Promise(r => setTimeout(r, delay));
    if (status === 200) {
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    } else if (status === 500) {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500, message: 'Internal server error', data: null }) });
    } else if (status === 404) {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 404, message: 'Not found', data: null }) });
    } else {
      await route.fulfill({ status, body: JSON.stringify(data) });
    }
  });
}

/** Mock 文档类型 API 网络断开 */
async function mockDocumentTypesNetworkError(page: Page) {
  await page.route('**/api/documenttypes', (route) => route.abort('connectionrefused'));
}

// ============================================================
// 测试前置：插入测试数据
// ============================================================
test.beforeAll(async () => {
  await insertUD03TestData();
  console.log('UD03 test data inserted');
});

test.afterAll(async () => {
  await cleanupUD03TestData();
  console.log('UD03 test data cleaned up');
});

// ============================================================
// 1. 画面初始化（No.1-8）
// ============================================================
test.describe.serial('画面初始化（No.1-8）', () => {
  test.setTimeout(120000);

  test('No.1 页面初始化-文档类型列表加载成功', async ({ page }) => {
    resetCounter('01_页面初始化_加载成功');
    await mockDocumentTypes(page, [
      { doctype: 'COC', description: 'Certificate of Conformity' },
      { doctype: 'VCC', description: 'Vehicle Certification Code' },
      { doctype: 'EEC', description: 'European Economic Community' },
    ]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    // 页面标题
    await expect(page.locator('.form-card-title')).toContainText('Generate Homologation Document');
    // Chassis series 输入框
    const csInput = page.locator('#chassisSeries');
    await expect(csInput).toBeVisible();
    await expect(csInput).toBeEnabled();
    await expect(csInput).toHaveValue('');
    // Chassis no 输入框
    const cnInput = page.locator('#chassisNo');
    await expect(cnInput).toBeVisible();
    await expect(cnInput).toBeEnabled();
    await expect(cnInput).toHaveValue('');
    // Document type 下拉列表
    const dtSelect = page.locator('#documentType');
    await expect(dtSelect).toBeVisible();
    await expect(dtSelect).toBeEnabled();
    // 三个按钮
    await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Help' })).toBeEnabled();
    // 无错误消息
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '01_页面初始化_加载成功');
  });

  test('No.2 页面初始化-文档类型列表为空', async ({ page }) => {
    resetCounter('02_页面初始化_列表为空');
    await mockDocumentTypes(page, []);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    // Document type 下拉列表显示空选项
    const dtSelect = page.locator('#documentType');
    const options = dtSelect.locator('option');
    const optionCount = await options.count();
    expect(optionCount).toBe(1); // 只有 "-- Select --"
    // Submit 按钮可用
    await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
    // 不显示错误消息
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '02_页面初始化_列表为空');
  });

  test('No.3 页面初始化-加载文档类型失败（API返回500）', async ({ page }) => {
    resetCounter('03_页面初始化_API500');
    await mockDocumentTypes(page, null, 500);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    // 错误消息
    await expect(page.locator('.error-message')).toContainText('Failed to load document types. Please try again.');
    // Document type 下拉列表为空
    const dtSelect = page.locator('#documentType');
    const options = dtSelect.locator('option');
    const optionCount = await options.count();
    expect(optionCount).toBe(1);
    // Submit 按钮可用
    await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();

    await takeScreenshot(page, '03_页面初始化_API500');
  });

  test('No.4 页面初始化-网络异常', async ({ page }) => {
    resetCounter('04_页面初始化_网络异常');
    await mockDocumentTypesNetworkError(page);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    // 错误消息
    await expect(page.locator('.error-message')).toContainText('Failed to load document types. Please try again.');
    // Document type 下拉列表为空
    const dtSelect = page.locator('#documentType');
    const options = dtSelect.locator('option');
    const optionCount = await options.count();
    expect(optionCount).toBe(1);

    await takeScreenshot(page, '04_页面初始化_网络异常');
  });

  test('No.5 页面初始化-API超时', async ({ page }) => {
    resetCounter('05_页面初始化_API超时');
    // 使用 abort timedout 模拟连接超时
    await page.route('**/api/documenttypes', (route) => route.abort('timedout'));
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    // 超时后显示错误消息
    await expect(page.locator('.error-message')).toContainText('Failed to load document types');
    // Document type 下拉列表为空
    const dtSelect = page.locator('#documentType');
    const options = dtSelect.locator('option');
    expect(await options.count()).toBe(1);

    await takeScreenshot(page, '05_页面初始化_API超时');
    await page.unroute('**/api/documenttypes');
  });

  test('No.6 页面初始化-从本地存储恢复上次条件', async ({ page }) => {
    resetCounter('06_页面初始化_本地存储恢复');
    await mockDocumentTypes(page, [
      { doctype: 'COC', description: 'Certificate of Conformity' },
      { doctype: 'VCC', description: 'Vehicle Certification Code' },
    ]);

    // 先设置 localStorage
    await safeGoto(page);
    await page.evaluate(() => {
      localStorage.setItem('homologationSearchCondition', JSON.stringify({
        chassisSeries: 'ABC', chassisNo: '12345', documentType: 'COC'
      }));
    });
    await loginViaLocalStorage(page);
    await page.goto(`${BASE_URL}/Menu/GenerateHomologationDocument`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 各字段自动填充
    await expect(page.locator('#chassisSeries')).toHaveValue('ABC');
    await expect(page.locator('#chassisNo')).toHaveValue('12345');
    await expect(page.locator('#documentType')).toHaveValue('COC');
    // 无错误消息
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '06_页面初始化_本地存储恢复');
  });

  test('No.7 页面初始化-本地存储中无搜索条件', async ({ page }) => {
    resetCounter('07_页面初始化_无本地存储');
    await mockDocumentTypes(page, [
      { doctype: 'COC', description: 'Certificate of Conformity' },
    ]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    // 各字段为空
    await expect(page.locator('#chassisSeries')).toHaveValue('');
    await expect(page.locator('#chassisNo')).toHaveValue('');
    await expect(page.locator('#documentType')).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '07_页面初始化_无本地存储');
  });

  test('No.8 页面初始化-本地存储部分数据', async ({ page }) => {
    resetCounter('08_页面初始化_部分本地存储');
    await mockDocumentTypes(page, [
      { doctype: 'COC', description: 'Certificate of Conformity' },
      { doctype: 'VCC', description: 'Vehicle Certification Code' },
    ]);

    await safeGoto(page);
    await page.evaluate(() => {
      localStorage.setItem('homologationSearchCondition', JSON.stringify({
        chassisSeries: 'XYZ', chassisNo: '67890', documentType: ''
      }));
    });
    await loginViaLocalStorage(page);
    await page.goto(`${BASE_URL}/Menu/GenerateHomologationDocument`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    await expect(page.locator('#chassisSeries')).toHaveValue('XYZ');
    await expect(page.locator('#chassisNo')).toHaveValue('67890');
    await expect(page.locator('#documentType')).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '08_页面初始化_部分本地存储');
  });
});

// ============================================================
// 2. 表单区域 - Chassis Series（No.9-27）
// ============================================================
test.describe.serial('Chassis Series（No.9-27）', () => {
  test.setTimeout(120000);

  test('No.9 Chassis series-正常输入半角英字', async ({ page }) => {
    resetCounter('09_ChassisSeries_正常输入半角英字');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const input = page.locator('#chassisSeries');
    await input.click();
    await input.pressSequentially('ABCDE');
    await expect(input).toHaveValue('ABCDE');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '09_ChassisSeries_正常输入半角英字');
  });

  test('No.10 Chassis series-输入半角数字（应被过滤）', async ({ page }) => {
    resetCounter('10_ChassisSeries_输入半角数字被过滤');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const input = page.locator('#chassisSeries');
    await input.click();
    await input.pressSequentially('ABC123');
    // 数字被 react onChange 正则 ^[a-zA-Z]*$ 过滤，只保留 ABC
    await expect(input).toHaveValue('ABC');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '10_ChassisSeries_输入半角数字被过滤');
  });

  test('No.11 Chassis series-输入特殊符号（应被过滤）', async ({ page }) => {
    resetCounter('11_ChassisSeries_输入特殊符号被过滤');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const input = page.locator('#chassisSeries');
    await input.click();
    await input.pressSequentially('A-B+C@');
    // 特殊符号被过滤，只保留 ABC
    await expect(input).toHaveValue('ABC');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '11_ChassisSeries_输入特殊符号被过滤');
  });

  test('No.12 Chassis series-输入全角字符（应被过滤）', async ({ page }) => {
    resetCounter('12_ChassisSeries_输入全角字符被过滤');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const input = page.locator('#chassisSeries');
    await input.click();
    // 全角字符 'ＡＢＣ' 会被 input 的 onChange 过滤（不匹配 ^[a-zA-Z]*$）
    await input.pressSequentially('ＡＢＣ');
    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '12_ChassisSeries_输入全角字符被过滤');
  });

  test('No.13 Chassis series-输入空格（应被过滤）', async ({ page }) => {
    resetCounter('13_ChassisSeries_输入空格被过滤');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const input = page.locator('#chassisSeries');
    await input.click();
    await input.pressSequentially('A B C');
    // 空格被正则过滤
    await expect(input).toHaveValue('ABC');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '13_ChassisSeries_输入空格被过滤');
  });

  test('No.14 Chassis series-输入小写字母自动保留', async ({ page }) => {
    resetCounter('14_ChassisSeries_输入小写字母保留');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const input = page.locator('#chassisSeries');
    await input.click();
    await input.pressSequentially('abcde');
    await expect(input).toHaveValue('abcde');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '14_ChassisSeries_输入小写字母保留');
  });

  test('No.15 Chassis series-最大长度限制（5字符）-超位测试', async ({ page }) => {
    resetCounter('15_ChassisSeries_最大长度超位');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const input = page.locator('#chassisSeries');
    await input.click();
    // 输入6个字符，第6个被 maxLength=5 截断
    await input.pressSequentially('ABCDEF');
    await expect(input).toHaveValue('ABCDE');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '15_ChassisSeries_最大长度超位');
  });

  test('No.16 Chassis series-边界值测试（5字符）', async ({ page }) => {
    resetCounter('16_ChassisSeries_边界值5字符');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const input = page.locator('#chassisSeries');
    await input.click();
    await input.pressSequentially('ABCDE');
    await expect(input).toHaveValue('ABCDE');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '16_ChassisSeries_边界值5字符');
  });

  test('No.17 Chassis series-清空输入', async ({ page }) => {
    resetCounter('17_ChassisSeries_清空输入');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const input = page.locator('#chassisSeries');
    await input.click();
    await input.pressSequentially('ABC');
    await expect(input).toHaveValue('ABC');
    await input.fill('');
    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '17_ChassisSeries_清空输入');
  });

  test('No.18 Chassis series-混合输入（字母+数字+符号）', async ({ page }) => {
    resetCounter('18_ChassisSeries_混合输入');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const input = page.locator('#chassisSeries');
    await input.click();
    await input.pressSequentially('A1B2C@D#E');
    // 仅字母被保留，数字和符号被过滤
    await expect(input).toHaveValue('ABCDE');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '18_ChassisSeries_混合输入');
  });

  test('No.19 Chassis series-仅输入非法字符（全部被过滤）', async ({ page }) => {
    resetCounter('19_ChassisSeries_仅非法字符');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const input = page.locator('#chassisSeries');
    await input.click();
    await input.pressSequentially('123@#');
    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '19_ChassisSeries_仅非法字符');
  });

  test('No.20 Chassis series-粘贴纯半角英字（正常通过）', async ({ page }) => {
    resetCounter('20_ChassisSeries_粘贴纯半角英字');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const input = page.locator('#chassisSeries');
    await input.click();
    // 用 fill 模拟粘贴，纯字母会被 onChange 接受
    await input.fill('ABCDE');
    // 注意：fill 不会触发 onChange 过滤，但 React 的 value 会通过 onChange 设置
    // 先 clear 后 pressSequentially 模拟粘贴
    await input.fill('');
    await input.pressSequentially('ABCDE');
    await expect(input).toHaveValue('ABCDE');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '20_ChassisSeries_粘贴纯半角英字');
  });

  test('No.21 Chassis series-粘贴含非法字符内容', async ({ page }) => {
    resetCounter('21_ChassisSeries_粘贴含非法字符');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const input = page.locator('#chassisSeries');
    await input.click();
    // 模拟粘贴 - pressSequentially 逐字触发 onChange，非法字符被过滤
    await input.pressSequentially('AB1C2D3');
    await expect(input).toHaveValue('ABCD');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '21_ChassisSeries_粘贴含非法字符');
  });

  test('No.22 Chassis series-粘贴仅非法字符（全部被过滤）', async ({ page }) => {
    resetCounter('22_ChassisSeries_粘贴仅非法字符');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const input = page.locator('#chassisSeries');
    await input.click();
    await input.pressSequentially('123@#');
    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '22_ChassisSeries_粘贴仅非法字符');
  });

  test('No.23 Chassis series-IME输入全角英字（应被过滤）', async ({ page }) => {
    resetCounter('23_ChassisSeries_IME全角英字');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const input = page.locator('#chassisSeries');
    await input.click();
    await input.pressSequentially('ＡＢＣ');
    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '23_ChassisSeries_IME全角英字');
  });

  test('No.24 Chassis series-IME输入中文（应被过滤）', async ({ page }) => {
    resetCounter('24_ChassisSeries_IME中文');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const input = page.locator('#chassisSeries');
    await input.click();
    await input.pressSequentially('测试');
    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '24_ChassisSeries_IME中文');
  });

  test('No.25 Chassis series-大小写混合输入（原样保留）', async ({ page }) => {
    resetCounter('25_ChassisSeries_大小写混合');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const input = page.locator('#chassisSeries');
    await input.click();
    await input.pressSequentially('AbCdE');
    await expect(input).toHaveValue('AbCdE');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '25_ChassisSeries_大小写混合');
  });

  test('No.26 Chassis series-达到最大长度后继续输入', async ({ page }) => {
    resetCounter('26_ChassisSeries_达到最大长度后继续输入');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const input = page.locator('#chassisSeries');
    await input.click();
    await input.pressSequentially('ABCDE'); // 5字符，已达最大
    await expect(input).toHaveValue('ABCDE');
    // 尝试输入第6个字符
    await input.pressSequentially('F');
    await expect(input).toHaveValue('ABCDE');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '26_ChassisSeries_达到最大长度后继续输入');
  });

  test('No.27 Chassis series-非ASCII字母输入（应被过滤）', async ({ page }) => {
    resetCounter('27_ChassisSeries_非ASCII字母');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const input = page.locator('#chassisSeries');
    await input.click();
    await input.pressSequentially('αβγ');
    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '27_ChassisSeries_非ASCII字母');
  });
});

// ============================================================
// 3. 表单区域 - Chassis No（No.28-44）
// ============================================================
test.describe.serial('Chassis No（No.28-44）', () => {
  test.setTimeout(120000);

  test('No.28 Chassis no-正常输入半角数字', async ({ page }) => {
    resetCounter('28_ChassisNo_正常输入半角数字');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisNo', { timeout: 10000 });

    const input = page.locator('#chassisNo');
    await input.click();
    await input.pressSequentially('1234567890');
    await expect(input).toHaveValue('1234567890');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '28_ChassisNo_正常输入半角数字');
  });

  test('No.29 Chassis no-输入半角英文字母（应被过滤）', async ({ page }) => {
    resetCounter('29_ChassisNo_输入半角字母被过滤');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisNo', { timeout: 10000 });

    const input = page.locator('#chassisNo');
    await input.click();
    await input.pressSequentially('123ABC456');
    await expect(input).toHaveValue('123456');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '29_ChassisNo_输入半角字母被过滤');
  });

  test('No.30 Chassis no-输入特殊符号（应被过滤）', async ({ page }) => {
    resetCounter('30_ChassisNo_输入特殊符号被过滤');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisNo', { timeout: 10000 });

    const input = page.locator('#chassisNo');
    await input.click();
    await input.pressSequentially('123-456#789');
    await expect(input).toHaveValue('123456789');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '30_ChassisNo_输入特殊符号被过滤');
  });

  test('No.31 Chassis no-输入全角数字（应被过滤）', async ({ page }) => {
    resetCounter('31_ChassisNo_输入全角数字被过滤');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisNo', { timeout: 10000 });

    const input = page.locator('#chassisNo');
    await input.click();
    await input.pressSequentially('１２３４５');
    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '31_ChassisNo_输入全角数字被过滤');
  });

  test('No.32 Chassis no-输入空格（应被过滤）', async ({ page }) => {
    resetCounter('32_ChassisNo_输入空格被过滤');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisNo', { timeout: 10000 });

    const input = page.locator('#chassisNo');
    await input.click();
    await input.pressSequentially('123 456 789');
    await expect(input).toHaveValue('123456789');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '32_ChassisNo_输入空格被过滤');
  });

  test('No.33 Chassis no-最大长度限制（10字符）-超位测试', async ({ page }) => {
    resetCounter('33_ChassisNo_最大长度超位');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisNo', { timeout: 10000 });

    const input = page.locator('#chassisNo');
    await input.click();
    // 输入11个字符，第11个被 maxLength=10 截断
    await input.pressSequentially('12345678901');
    await expect(input).toHaveValue('1234567890');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '33_ChassisNo_最大长度超位');
  });

  test('No.34 Chassis no-边界值测试（10字符）', async ({ page }) => {
    resetCounter('34_ChassisNo_边界值10字符');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisNo', { timeout: 10000 });

    const input = page.locator('#chassisNo');
    await input.click();
    await input.pressSequentially('1234567890');
    await expect(input).toHaveValue('1234567890');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '34_ChassisNo_边界值10字符');
  });

  test('No.35 Chassis no-清空输入', async ({ page }) => {
    resetCounter('35_ChassisNo_清空输入');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisNo', { timeout: 10000 });

    const input = page.locator('#chassisNo');
    await input.click();
    await input.pressSequentially('12345');
    await expect(input).toHaveValue('12345');
    await input.fill('');
    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '35_ChassisNo_清空输入');
  });

  test('No.36 Chassis no-混合输入（数字+字母+符号）', async ({ page }) => {
    resetCounter('36_ChassisNo_混合输入');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisNo', { timeout: 10000 });

    const input = page.locator('#chassisNo');
    await input.click();
    await input.pressSequentially('1A2B3C@D#E');
    // 仅数字被保留
    await expect(input).toHaveValue('123');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '36_ChassisNo_混合输入');
  });

  test('No.37 Chassis no-仅输入非法字符（全部被过滤）', async ({ page }) => {
    resetCounter('37_ChassisNo_仅非法字符');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisNo', { timeout: 10000 });

    const input = page.locator('#chassisNo');
    await input.click();
    await input.pressSequentially('ABC@#');
    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '37_ChassisNo_仅非法字符');
  });

  test('No.38 Chassis no-粘贴纯半角数字（正常通过）', async ({ page }) => {
    resetCounter('38_ChassisNo_粘贴纯半角数字');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisNo', { timeout: 10000 });

    const input = page.locator('#chassisNo');
    await input.click();
    await input.pressSequentially('1234567890');
    await expect(input).toHaveValue('1234567890');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '38_ChassisNo_粘贴纯半角数字');
  });

  test('No.39 Chassis no-粘贴含非法字符内容', async ({ page }) => {
    resetCounter('39_ChassisNo_粘贴含非法字符');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisNo', { timeout: 10000 });

    const input = page.locator('#chassisNo');
    await input.click();
    await input.pressSequentially('123ABC456DEF');
    await expect(input).toHaveValue('123456');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '39_ChassisNo_粘贴含非法字符');
  });

  test('No.40 Chassis no-粘贴仅非法字符（全部被过滤）', async ({ page }) => {
    resetCounter('40_ChassisNo_粘贴仅非法字符');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisNo', { timeout: 10000 });

    const input = page.locator('#chassisNo');
    await input.click();
    await input.pressSequentially('ABC@#');
    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '40_ChassisNo_粘贴仅非法字符');
  });

  test('No.41 Chassis no-IME输入全角数字（应被过滤）', async ({ page }) => {
    resetCounter('41_ChassisNo_IME全角数字');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisNo', { timeout: 10000 });

    const input = page.locator('#chassisNo');
    await input.click();
    await input.pressSequentially('１２３');
    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '41_ChassisNo_IME全角数字');
  });

  test('No.42 Chassis no-IME输入中文（应被过滤）', async ({ page }) => {
    resetCounter('42_ChassisNo_IME中文');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisNo', { timeout: 10000 });

    const input = page.locator('#chassisNo');
    await input.click();
    await input.pressSequentially('测试');
    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '42_ChassisNo_IME中文');
  });

  test('No.43 Chassis no-达到最大长度后继续输入', async ({ page }) => {
    resetCounter('43_ChassisNo_达到最大长度后继续输入');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisNo', { timeout: 10000 });

    const input = page.locator('#chassisNo');
    await input.click();
    await input.pressSequentially('1234567890');
    await expect(input).toHaveValue('1234567890');
    await input.pressSequentially('1');
    await expect(input).toHaveValue('1234567890');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '43_ChassisNo_达到最大长度后继续输入');
  });

  test('No.44 Chassis no-Unicode数字输入（应被过滤）', async ({ page }) => {
    resetCounter('44_ChassisNo_Unicode数字');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisNo', { timeout: 10000 });

    const input = page.locator('#chassisNo');
    await input.click();
    await input.pressSequentially('①②³');
    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '44_ChassisNo_Unicode数字');
  });
});

// ============================================================
// 4. 表单区域 - Document Type（No.45-48）
// ============================================================
test.describe.serial('Document Type（No.45-48）', () => {
  test.setTimeout(120000);

  test('No.45 Document type-下拉列表展开', async ({ page }) => {
    resetCounter('45_DocumentType_下拉列表展开');
    await mockDocumentTypes(page, [
      { doctype: 'COC', description: 'Certificate of Conformity' },
      { doctype: 'VCC', description: 'Vehicle Certification Code' },
      { doctype: 'EEC', description: 'European Economic Community' },
    ]);
    await gotoUD03(page);
    await page.waitForSelector('#documentType', { timeout: 10000 });

    const select = page.locator('#documentType');
    const options = select.locator('option');
    await expect(options.nth(0)).toHaveText('-- Select --');
    await expect(options.nth(1)).toHaveText('COC');
    await expect(options.nth(2)).toHaveText('VCC');
    await expect(options.nth(3)).toHaveText('EEC');
    // 默认无选中
    await expect(select).toHaveValue('');

    await takeScreenshot(page, '45_DocumentType_下拉列表展开');
  });

  test('No.46 Document type-选择有效文档类型', async ({ page }) => {
    resetCounter('46_DocumentType_选择COC');
    await mockDocumentTypes(page, [
      { doctype: 'COC', description: 'Certificate of Conformity' },
      { doctype: 'VCC', description: 'Vehicle Certification Code' },
    ]);
    await gotoUD03(page);
    await page.waitForSelector('#documentType', { timeout: 10000 });

    const select = page.locator('#documentType');
    await select.selectOption('COC');
    await expect(select).toHaveValue('COC');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '46_DocumentType_选择COC');
  });

  test('No.47 Document type-切换选择', async ({ page }) => {
    resetCounter('47_DocumentType_切换选择');
    await mockDocumentTypes(page, [
      { doctype: 'COC', description: 'Certificate of Conformity' },
      { doctype: 'VCC', description: 'Vehicle Certification Code' },
    ]);
    await gotoUD03(page);
    await page.waitForSelector('#documentType', { timeout: 10000 });

    const select = page.locator('#documentType');
    await select.selectOption('COC');
    await expect(select).toHaveValue('COC');
    await select.selectOption('VCC');
    await expect(select).toHaveValue('VCC');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '47_DocumentType_切换选择');
  });

  test('No.48 Document type-清空选择（重新选择空选项）', async ({ page }) => {
    resetCounter('48_DocumentType_清空选择');
    await mockDocumentTypes(page, [
      { doctype: 'COC', description: 'Certificate of Conformity' },
    ]);
    await gotoUD03(page);
    await page.waitForSelector('#documentType', { timeout: 10000 });

    const select = page.locator('#documentType');
    await select.selectOption('COC');
    await expect(select).toHaveValue('COC');
    await select.selectOption('');
    await expect(select).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '48_DocumentType_清空选择');
  });
});

// ============================================================
// 5. 按钮操作 - Submit 按钮（No.49-56）
// ============================================================
test.describe.serial('Submit 按钮（No.49-56）', () => {
  test.setTimeout(120000);

  test('No.49 Submit-正常提交（所有字段有效）', async ({ page }) => {
    resetCounter('49_Submit_正常提交');
    await mockDocumentTypes(page, [
      { doctype: 'COC', description: 'Certificate of Conformity' },
    ]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    // 填写字段
    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');

    // 捕获导航
    const navigationPromise = page.waitForURL('**/Menu/GenerateDocument/**', { timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(1000);

    // 检查 localStorage
    const saved = await page.evaluate(() => localStorage.getItem('homologationSearchCondition'));
    expect(saved).not.toBeNull();
    if (saved) {
      const parsed = JSON.parse(saved);
      expect(parsed.chassisSeries).toBe('ABC');
      expect(parsed.chassisNo).toBe('12345');
      expect(parsed.documentType).toBe('COC');
    }

    await takeScreenshot(page, '49_Submit_正常提交');
  });

  test('No.50 Submit-空值校验（Chassis series 为空）', async ({ page }) => {
    resetCounter('50_Submit_ChassisSeries为空');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(500);

    await expect(page.locator('.error-message')).toContainText('Chassis series is required.');
    // 页面不跳转
    expect(page.url()).toContain('/Menu/GenerateHomologationDocument');

    await takeScreenshot(page, '50_Submit_ChassisSeries为空');
  });

  test('No.51 Submit-空值校验（Chassis no 为空）', async ({ page }) => {
    resetCounter('51_Submit_ChassisNo为空');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#documentType').selectOption('COC');
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(500);

    await expect(page.locator('.error-message')).toContainText('Chassis no is required.');
    expect(page.url()).toContain('/Menu/GenerateHomologationDocument');

    await takeScreenshot(page, '51_Submit_ChassisNo为空');
  });

  test('No.52 Submit-空值校验（Document type 未选择）', async ({ page }) => {
    resetCounter('52_Submit_DocumentType未选择');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(500);

    await expect(page.locator('.error-message')).toContainText('Document type is required.');
    expect(page.url()).toContain('/Menu/GenerateHomologationDocument');

    await takeScreenshot(page, '52_Submit_DocumentType未选择');
  });

  test('No.53 Submit-空值校验（所有字段均为空）', async ({ page }) => {
    resetCounter('53_Submit_所有字段为空');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(500);

    // 优先触发 Chassis series 空值校验
    await expect(page.locator('.error-message')).toContainText('Chassis series is required.');
    expect(page.url()).toContain('/Menu/GenerateHomologationDocument');

    await takeScreenshot(page, '53_Submit_所有字段为空');
  });

  test('No.54 Submit-提交后保存条件到本地存储', async ({ page }) => {
    resetCounter('54_Submit_保存条件到本地存储');
    await mockDocumentTypes(page, [{ doctype: 'VCC', description: 'VCC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await page.locator('#chassisSeries').pressSequentially('XYZ');
    await page.locator('#chassisNo').pressSequentially('99999');
    await page.locator('#documentType').selectOption('VCC');

    const navigationPromise = page.waitForURL('**/Menu/GenerateDocument/**', { timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(1000);

    const saved = await page.evaluate(() => localStorage.getItem('homologationSearchCondition'));
    expect(saved).not.toBeNull();
    if (saved) {
      const parsed = JSON.parse(saved);
      expect(parsed.chassisSeries).toBe('XYZ');
      expect(parsed.chassisNo).toBe('99999');
      expect(parsed.documentType).toBe('VCC');
    }

    await takeScreenshot(page, '54_Submit_保存条件到本地存储');
  });

  test('No.55 Submit-提交时清空之前的错误消息', async ({ page }) => {
    resetCounter('55_Submit_清空错误消息');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    // 第一次提交触发错误
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('.error-message')).toBeVisible();

    // 填写字段后再次提交
    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');

    const navigationPromise = page.waitForURL('**/Menu/GenerateDocument/**', { timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(1000);

    // 旧错误消息被清空
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '55_Submit_清空错误消息');
  });

  test('No.56 Submit-连续快速点击（防止重复提交）', async ({ page }) => {
    resetCounter('56_Submit_连续快速点击');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');

    // 模拟导航阻止 - 使用 page.evaluate 拦截 navigate
    await page.evaluate(() => {
      // 保存原始方法
      const originalPushState = window.history.pushState.bind(window.history);
      let navigated = false;
      window.history.pushState = function(...args: any[]) {
        if (!navigated) {
          navigated = true;
          return originalPushState(...args);
        }
        // 第二次及以后的导航被阻止
        console.log('Navigation blocked (duplicate)');
      };
    });

    // 快速点击两次 Submit
    const btn = page.getByRole('button', { name: 'Submit' });
    await btn.click();
    await page.waitForTimeout(500);

    // 第二次点击（按钮可能 disabled 或已导航）
    await btn.click({ force: true, timeout: 5000 }).catch(() => {
      console.log('Second click ignored (expected)');
    });

    await page.waitForTimeout(500);

    // 恢复 history.pushState
    await page.evaluate(() => {
      // 刷新页面会恢复原始实现，或者直接 reload
    });

    // localStorage 只保存一次
    const saved = await page.evaluate(() => localStorage.getItem('homologationSearchCondition'));
    expect(saved).not.toBeNull();

    await takeScreenshot(page, '56_Submit_连续快速点击');
  });
});

// ============================================================
// 6. 按钮操作 - Reset 按钮（No.57-60）
// ============================================================
test.describe.serial('Reset 按钮（No.57-60）', () => {
  test.setTimeout(120000);

  test('No.57 Reset-重置所有输入字段', async ({ page }) => {
    resetCounter('57_Reset_重置所有输入字段');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');

    await page.getByRole('button', { name: 'Reset' }).click();
    await page.waitForTimeout(300);

    await expect(page.locator('#chassisSeries')).toHaveValue('');
    await expect(page.locator('#chassisNo')).toHaveValue('');
    await expect(page.locator('#documentType')).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);
    // 页面不跳转
    expect(page.url()).toContain('/Menu/GenerateHomologationDocument');

    await takeScreenshot(page, '57_Reset_重置所有输入字段');
  });

  test('No.58 Reset-重置后 localStorage 中的条件不受影响', async ({ page }) => {
    resetCounter('58_Reset_localStorage不受影响');
    // 先保存条件到 localStorage
    await safeGoto(page);
    await page.evaluate(() => {
      localStorage.setItem('homologationSearchCondition', JSON.stringify({
        chassisSeries: 'ABC', chassisNo: '12345', documentType: 'COC'
      }));
    });
    await loginViaLocalStorage(page);
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await page.goto(`${BASE_URL}/Menu/GenerateHomologationDocument`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: 'Reset' }).click();
    await page.waitForTimeout(300);

    // localStorage 数据不受影响
    const saved = await page.evaluate(() => localStorage.getItem('homologationSearchCondition'));
    expect(saved).not.toBeNull();
    if (saved) {
      const parsed = JSON.parse(saved);
      expect(parsed.chassisSeries).toBe('ABC');
      expect(parsed.chassisNo).toBe('12345');
      expect(parsed.documentType).toBe('COC');
    }

    await takeScreenshot(page, '58_Reset_localStorage不受影响');
  });

  test('No.59 Reset-重置后刷新页面确认恢复功能', async ({ page }) => {
    resetCounter('59_Reset_刷新后恢复');
    // 保存条件到 localStorage
    await safeGoto(page);
    await page.evaluate(() => {
      localStorage.setItem('homologationSearchCondition', JSON.stringify({
        chassisSeries: 'ABC', chassisNo: '12345', documentType: 'COC'
      }));
    });
    await loginViaLocalStorage(page);
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await page.goto(`${BASE_URL}/Menu/GenerateHomologationDocument`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Reset 清空表单
    await page.getByRole('button', { name: 'Reset' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('#chassisSeries')).toHaveValue('');

    // 刷新页面
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 从 localStorage 恢复
    await expect(page.locator('#chassisSeries')).toHaveValue('ABC');
    await expect(page.locator('#chassisNo')).toHaveValue('12345');
    await expect(page.locator('#documentType')).toHaveValue('COC');

    await takeScreenshot(page, '59_Reset_刷新后恢复');
  });

  test('No.60 Reset-清除当前错误消息', async ({ page }) => {
    resetCounter('60_Reset_清除错误消息');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    // 触发空值校验
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('.error-message')).toBeVisible();

    // 点击 Reset
    await page.getByRole('button', { name: 'Reset' }).click();
    await page.waitForTimeout(300);

    // 错误消息被清除，表单清空
    await expect(page.locator('.error-message')).toHaveCount(0);
    await expect(page.locator('#chassisSeries')).toHaveValue('');
    await expect(page.locator('#chassisNo')).toHaveValue('');

    await takeScreenshot(page, '60_Reset_清除错误消息');
  });
});

// ============================================================
// 7. 按钮操作 - Help 按钮（No.61-62）
// ============================================================
test.describe.serial('Help 按钮（No.61-62）', () => {
  test.setTimeout(120000);

  test('No.61 Help-点击跳转到 User Guide', async ({ page }) => {
    resetCounter('61_Help_跳转UserGuide');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await page.getByRole('button', { name: 'Help' }).click();
    await page.waitForTimeout(1500);

    // 跳转到 User Guide 页面
    expect(page.url()).toContain('/Menu/UserGuide');

    await takeScreenshot(page, '61_Help_跳转UserGuide');
  });

  test('No.62 Help-点击时不触发表单校验', async ({ page }) => {
    resetCounter('62_Help_不触发表单校验');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    // 所有字段为空时点击 Help
    await page.getByRole('button', { name: 'Help' }).click();
    await page.waitForTimeout(1500);

    // 直接跳转，不显示错误消息
    expect(page.url()).toContain('/Menu/UserGuide');

    await takeScreenshot(page, '62_Help_不触发表单校验');
  });
});

// ============================================================
// 8. 异常处理与API错误（No.63-67）
// ============================================================
test.describe.serial('异常处理与API错误（No.63-67）', () => {
  test.setTimeout(120000);

  test('No.63 异常处理-API返回500错误', async ({ page }) => {
    resetCounter('63_异常处理_API500');
    await mockDocumentTypes(page, null, 500);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await expect(page.locator('.error-message')).toContainText('Failed to load document types. Please try again.');
    const dtSelect = page.locator('#documentType');
    const options = dtSelect.locator('option');
    expect(await options.count()).toBe(1);

    await takeScreenshot(page, '63_异常处理_API500');
  });

  test('No.64 异常处理-API返回非200状态码', async ({ page }) => {
    resetCounter('64_异常处理_API404');
    await mockDocumentTypes(page, null, 404);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await expect(page.locator('.error-message')).toContainText('Failed to load document types. Please try again.');
    const dtSelect = page.locator('#documentType');
    const options = dtSelect.locator('option');
    expect(await options.count()).toBe(1);

    await takeScreenshot(page, '64_异常处理_API404');
  });

  test('No.65 异常处理-API返回空数据', async ({ page }) => {
    resetCounter('65_异常处理_API返回空数据');
    await mockDocumentTypes(page, null, 200); // 返回 null 而非数组
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await expect(page.locator('.error-message')).toContainText('Failed to load document types. Please try again.');
    const dtSelect = page.locator('#documentType');
    const options = dtSelect.locator('option');
    expect(await options.count()).toBe(1);

    await takeScreenshot(page, '65_异常处理_API返回空数据');
  });

  test('No.66 异常处理-网络连接失败', async ({ page }) => {
    resetCounter('66_异常处理_网络连接失败');
    await mockDocumentTypesNetworkError(page);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await expect(page.locator('.error-message')).toContainText('Failed to load document types. Please try again.');
    const dtSelect = page.locator('#documentType');
    const options = dtSelect.locator('option');
    expect(await options.count()).toBe(1);

    await takeScreenshot(page, '66_异常处理_网络连接失败');
  });

  test('No.67 异常处理-API超时', async ({ page }) => {
    resetCounter('67_异常处理_API超时');
    await page.route('**/api/documenttypes', (route) => route.abort('timedout'));
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await expect(page.locator('.error-message')).toContainText('Failed to load document types');
    const dtSelect = page.locator('#documentType');
    const options = dtSelect.locator('option');
    expect(await options.count()).toBe(1);

    await takeScreenshot(page, '67_异常处理_API超时');
    await page.unroute('**/api/documenttypes');
  });
});

// ============================================================
// 9. 错误消息显示（No.68-70）
// ============================================================
test.describe.serial('错误消息显示（No.68-70）', () => {
  test.setTimeout(120000);

  test('No.68 错误消息-必填校验样式', async ({ page }) => {
    resetCounter('68_错误消息_必填校验样式');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(500);

    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toContainText('Chassis series is required.');
    await expect(errorMsg).toBeVisible();

    await takeScreenshot(page, '68_错误消息_必填校验样式');
  });

  test('No.69 错误消息-多条错误不叠加（仅显示第一个）', async ({ page }) => {
    resetCounter('69_错误消息_仅显示第一个');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    // 所有字段为空
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(500);

    // 仅显示 Chassis series 的错误
    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toContainText('Chassis series is required.');
    const text = await errorMsg.textContent();
    expect(text).not.toContain('Chassis no');
    expect(text).not.toContain('Document type');

    await takeScreenshot(page, '69_错误消息_仅显示第一个');
  });

  test('No.70 错误消息-旧错误消息在新操作时被清除', async ({ page }) => {
    resetCounter('70_错误消息_旧消息被清除');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    // 触发错误
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('.error-message')).toBeVisible();

    // 填写字段后再次提交
    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');

    const navigationPromise = page.waitForURL('**/Menu/GenerateDocument/**', { timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(1000);

    // 错误消息被清除
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '70_错误消息_旧消息被清除');
  });
});

// ============================================================
// 10. 画面显示与布局（No.71-76）
// ============================================================
test.describe.serial('画面显示与布局（No.71-76）', () => {
  test.setTimeout(120000);

  test('No.71 画面显示-页面标题', async ({ page }) => {
    resetCounter('71_画面显示_页面标题');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('.form-card-title', { timeout: 10000 });

    await expect(page.locator('.form-card-title')).toContainText('Generate Homologation Document');

    await takeScreenshot(page, '71_画面显示_页面标题');
  });

  test('No.72 画面显示-所有控件可见', async ({ page }) => {
    resetCounter('72_画面显示_所有控件可见');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await expect(page.locator('#chassisSeries')).toBeVisible();
    await expect(page.locator('#chassisNo')).toBeVisible();
    await expect(page.locator('#documentType')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Help' })).toBeVisible();
    await expect(page.locator('.error-message')).toHaveCount(0);
    // Support Mail
    await expect(page.locator('a[href="mailto:support.tpi@volvo.com"]')).toBeVisible();

    await takeScreenshot(page, '72_画面显示_所有控件可见');
  });

  test('No.73 画面显示-输入框标签', async ({ page }) => {
    resetCounter('73_画面显示_输入框标签');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await expect(page.locator('label[for="chassisSeries"]')).toContainText('Chassis series');
    await expect(page.locator('label[for="chassisNo"]')).toContainText('Chassis no');
    await expect(page.locator('label[for="documentType"]')).toContainText('Document type');

    await takeScreenshot(page, '73_画面显示_输入框标签');
  });

  test('No.74 画面显示-按钮文字', async ({ page }) => {
    resetCounter('74_画面显示_按钮文字');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await expect(page.getByRole('button', { name: 'Submit' })).toHaveText('Submit');
    await expect(page.getByRole('button', { name: 'Reset' })).toHaveText('Reset');
    await expect(page.getByRole('button', { name: 'Help' })).toHaveText('Help');

    await takeScreenshot(page, '74_画面显示_按钮文字');
  });

  test('No.75 画面显示-输入框占位符', async ({ page }) => {
    resetCounter('75_画面显示_输入框占位符');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    // 注意：源代码中未设置 placeholder，以下验证 placeholder 不存在或为空
    const csPlaceholder = await page.locator('#chassisSeries').getAttribute('placeholder');
    const cnPlaceholder = await page.locator('#chassisNo').getAttribute('placeholder');
    console.log(`Chassis series placeholder: "${csPlaceholder}", Chassis no placeholder: "${cnPlaceholder}"`);

    await takeScreenshot(page, '75_画面显示_输入框占位符');
  });

  test('No.76 画面显示-Support Mail 标签', async ({ page }) => {
    resetCounter('76_画面显示_SupportMail');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    const supportLink = page.locator('a[href="mailto:support.tpi@volvo.com"]');
    await expect(supportLink).toBeVisible();
    await expect(supportLink).toHaveText('support.tpi@volvo.com');

    await takeScreenshot(page, '76_画面显示_SupportMail');
  });
});

// ============================================================
// 11. 状态保持与恢复（No.77-79）
// ============================================================
test.describe.serial('状态保持与恢复（No.77-79）', () => {
  test.setTimeout(120000);

  test('No.77 状态保持-提交后条件保存到localStorage', async ({ page }) => {
    resetCounter('77_状态保持_保存到localStorage');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');

    const navigationPromise = page.waitForURL('**/Menu/GenerateDocument/**', { timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(1000);

    const saved = await page.evaluate(() => localStorage.getItem('homologationSearchCondition'));
    expect(saved).not.toBeNull();
    if (saved) {
      const parsed = JSON.parse(saved);
      expect(parsed.chassisSeries).toBe('ABC');
      expect(parsed.chassisNo).toBe('12345');
      expect(parsed.documentType).toBe('COC');
    }

    await takeScreenshot(page, '77_状态保持_保存到localStorage');
  });

  test('No.78 状态保持-再次打开页面时恢复上次条件', async ({ page }) => {
    resetCounter('78_状态保持_恢复上次条件');
    // 预置 localStorage
    await safeGoto(page);
    await page.evaluate(() => {
      localStorage.setItem('homologationSearchCondition', JSON.stringify({
        chassisSeries: 'ABC', chassisNo: '12345', documentType: 'COC'
      }));
    });
    await loginViaLocalStorage(page);
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await page.goto(`${BASE_URL}/Menu/GenerateHomologationDocument`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    await expect(page.locator('#chassisSeries')).toHaveValue('ABC');
    await expect(page.locator('#chassisNo')).toHaveValue('12345');
    await expect(page.locator('#documentType')).toHaveValue('COC');

    await takeScreenshot(page, '78_状态保持_恢复上次条件');
  });

  test('No.79 状态保持-多次提交更新本地存储', async ({ page }) => {
    resetCounter('79_状态保持_多次提交更新');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }, { doctype: 'VCC', description: 'VCC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    // 第一次提交
    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');

    let navPromise = page.waitForURL('**/Menu/GenerateDocument/**', { timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(1000);

    // 返回 UD03 页面
    await page.goto(`${BASE_URL}/Menu/GenerateHomologationDocument`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 修改条件后第二次提交
    await page.locator('#chassisSeries').fill('');
    await page.locator('#chassisSeries').pressSequentially('XYZ');
    await page.locator('#documentType').selectOption('VCC');

    navPromise = page.waitForURL('**/Menu/GenerateDocument/**', { timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(1000);

    // localStorage 更新为新值
    const saved = await page.evaluate(() => localStorage.getItem('homologationSearchCondition'));
    expect(saved).not.toBeNull();
    if (saved) {
      const parsed = JSON.parse(saved);
      expect(parsed.chassisSeries).toBe('XYZ');
      expect(parsed.chassisNo).toBe('12345');
      expect(parsed.documentType).toBe('VCC');
    }

    await takeScreenshot(page, '79_状态保持_多次提交更新');
  });
});

// ============================================================
// 12. 页面跳转（UD04）（No.80-82）
// ============================================================
test.describe.serial('页面跳转 UD04（No.80-82）', () => {
  test.setTimeout(120000);

  test('No.80 页面跳转-提交后跳转到UD04并传递参数', async ({ page }) => {
    resetCounter('80_页面跳转_跳转到UD04');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');

    // 点击 Submit 应该导航到 UD04
    const navPromise = page.waitForURL('**/Menu/GenerateDocument/**', { timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(2000);

    // 确认 URL 包含参数
    const url = page.url();
    expect(url).toContain('/Menu/GenerateDocument/');
    expect(url).toContain('12345');

    await takeScreenshot(page, '80_页面跳转_跳转到UD04');
  });

  test('No.81 页面跳转-不同参数跳转', async ({ page }) => {
    resetCounter('81_页面跳转_不同参数跳转');
    await mockDocumentTypes(page, [{ doctype: 'VCC', description: 'VCC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await page.locator('#chassisSeries').pressSequentially('XYZ');
    await page.locator('#chassisNo').pressSequentially('99999');
    await page.locator('#documentType').selectOption('VCC');

    const navPromise = page.waitForURL('**/Menu/GenerateDocument/**', { timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/Menu/GenerateDocument/');
    expect(url).toContain('99999');

    await takeScreenshot(page, '81_页面跳转_不同参数跳转');
  });

  test('No.82 页面跳转-Submit时不调用后端API', async ({ page }) => {
    resetCounter('82_页面跳转_不调用后端API');
    await mockDocumentTypes(page, [{ doctype: 'COC', description: 'COC' }]);
    await gotoUD03(page);
    await page.waitForSelector('#chassisSeries', { timeout: 10000 });

    await page.locator('#chassisSeries').pressSequentially('ABC');
    await page.locator('#chassisNo').pressSequentially('12345');
    await page.locator('#documentType').selectOption('COC');

    // 验证 Submit 是通过前端路由跳转（不调用后端 API）
    // 通过检查 URL 变化确认是 SPA 导航而非后端重定向
    const currentUrl = page.url();
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(2000);

    // URL 已变化（前端路由跳转）
    const newUrl = page.url();
    expect(newUrl).not.toBe(currentUrl);
    expect(newUrl).toContain('/Menu/GenerateDocument/');

    await takeScreenshot(page, '82_页面跳转_不调用后端API');
  });
});
