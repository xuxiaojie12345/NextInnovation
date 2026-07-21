import { test, expect, Page } from '@playwright/test';
import { insertUD06TestData, cleanupUD06TestData } from './test-data-helper';

// ============================================================
// SaveModifications 模块 (UD06) Playwright 自动化测试
// 基于 単体テスト仕様書UD06.md（36个测试用例）
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD06';

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

/** Mock UD06 API 返回指定数据 */
async function mockQueryApi(page: Page, responseData: any, status: number = 200) {
  await page.route('**/api/ud06/savemodifications/query', async (route) => {
    if (status === 200) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseData) });
    } else if (status === 500) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500, message: '查询失败，请稍后重试', data: null }) });
    } else if (status === 404) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 404, message: '未找到该底盘的修改记录', data: null }) });
    } else {
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(responseData) });
    }
  });
}

/** 模拟 API 超时 */
async function mockApiTimeout(page: Page) {
  await page.route('**/api/ud06/savemodifications/query', (route) => {
    // 延迟超过 10000ms 触发 axios timeout
    return new Promise(() => {});
  });
}

/** 模拟网络断开 */
async function mockApiNetworkError(page: Page) {
  await page.route('**/api/ud06/savemodifications/query', (route) => route.abort('connectionrefused'));
}

/** 导航到 UD06 页面（addInitScript 闭包传参，在 React 前设置 usr 结构） */
async function gotoUD06(page: Page, chassisNo: string = 'CH001', serie: string = 'S001', modifiedVariables: any[] = []) {
  // 闭包传参，在页面脚本执行前用 { usr, key, idx } 设置 history.state
  // React Router v6.4+ 初始化时从 window.history.state.usr 读取 location.state
  await page.addInitScript(({ cn, s, mv }) => {
    window.history.replaceState(
      { usr: { chassisNo: cn, serie: s, modifiedVariables: mv }, key: 'init', idx: 0 },
      ''
    );
  }, { cn: chassisNo, s: serie, mv: modifiedVariables });

  // 导航到同源页面设置 localStorage，然后跳转到 UD06
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  await page.goto(`${BASE_URL}/Menu/SaveModifications`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
}

/** 获取默认 API 成功响应 */
const SUCCESS_API_RESPONSE = {
  code: 200,
  data: {
    doctype: 'VIN_PLATE',
    version: 'v1',
    foundUnreleasedVersion: 'NONE',
  }
};

// ============================================================
// 测试前置：插入测试数据
// ============================================================
test.beforeAll(async () => {
  await insertUD06TestData();
  console.log('UD06 test data inserted');
});

test.afterAll(async () => {
  await cleanupUD06TestData();
  console.log('UD06 test data cleaned up');
});

// ============================================================
// 1. 画面初始化（No.1-5）
// ============================================================
test.describe.serial('画面初始化（No.1-5）', () => {
  test.setTimeout(120000);

  test('No.1 初始化-正常加载页面', async ({ page }) => {
    resetCounter('01_初始化_正常加载');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'CH001', 'S001', [{ variable: 'VAR_A', modifiedValue: '新値' }]);
    await page.waitForTimeout(2000);

    // 页面标题
    await expect(page.locator('.page-title')).toContainText('Save Modifications');
    // 底盘信息
    await expect(page.locator('.vehicle-info-section')).toContainText('Chassis serie');
    await expect(page.locator('.vehicle-info-section')).toContainText('Chassis number');
    // 修改信息
    await expect(page.locator('.modification-info-section')).toBeVisible();
    // FOUND UNRELEASED VERSION
    await expect(page.locator('.found-version-section')).toBeVisible();
    // Message 区域
    await expect(page.locator('.release-message')).toContainText('VERSION IS RELEASED');
    // Close 按钮
    await expect(page.locator('.close-button')).toBeVisible();
    await expect(page.locator('.close-button')).toBeEnabled();
    // 无错误消息
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '01_初始化_正常加载');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.2 初始化-底盘信息参数缺失（chassisNo 为空）', async ({ page }) => {
    resetCounter('02_初始化_chassisNo为空');
    await gotoUD06(page, '', 'S002', [{ variable: 'VAR_B', modifiedValue: 'テスト' }]);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toContainText('缺少必要的底盘信息');
    // 内容区域不显示
    await expect(page.locator('.vehicle-info-section')).toHaveCount(0);
    await expect(page.locator('.modification-info-section')).toHaveCount(0);
    await expect(page.locator('.found-version-section')).toHaveCount(0);
    await expect(page.locator('.message-section')).toHaveCount(0);
    // Close 按钮可用
    await expect(page.locator('.close-button')).toBeEnabled();

    await takeScreenshot(page, '02_初始化_chassisNo为空');
  });

  test('No.3 初始化-底盘信息参数缺失（serie 为空）', async ({ page }) => {
    resetCounter('03_初始化_serie为空');
    await gotoUD06(page, 'CH003', '', [{ variable: 'VAR_B', modifiedValue: 'テスト' }]);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toContainText('缺少必要的底盘信息');
    await expect(page.locator('.vehicle-info-section')).toHaveCount(0);
    await expect(page.locator('.modification-info-section')).toHaveCount(0);
    await expect(page.locator('.close-button')).toBeEnabled();

    await takeScreenshot(page, '03_初始化_serie为空');
  });

  test('No.4 初始化-参数正常但无修改变量', async ({ page }) => {
    resetCounter('04_初始化_无修改变量');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'CH004', 'S004', []);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toHaveCount(0);
    await expect(page.locator('.vehicle-info-section')).toContainText('S004');
    await expect(page.locator('.vehicle-info-section')).toContainText('CH004');
    // Storing 显示 "-"
    await expect(page.locator('.modification-info-section')).toContainText('-');
    await expect(page.locator('.release-message')).toContainText('VERSION IS RELEASED');
    await expect(page.locator('.close-button')).toBeEnabled();

    await takeScreenshot(page, '04_初始化_无修改变量');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.5 初始化-参数正常但 chassisNo 和 serie 均为空', async ({ page }) => {
    resetCounter('05_初始化_都为空');
    await gotoUD06(page, '', '', []);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toContainText('缺少必要的底盘信息');
    await expect(page.locator('.vehicle-info-section')).toHaveCount(0);

    await takeScreenshot(page, '05_初始化_都为空');
  });
});

// ============================================================
// 2. 底盘信息显示（No.6-8）
// ============================================================
test.describe.serial('底盘信息显示（No.6-8）', () => {
  test.setTimeout(120000);

  test('No.6 底盘信息-Chassis serie 显示', async ({ page }) => {
    resetCounter('06_底盘信息_ChassisSerie');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'CH006', 'S006', []);
    await page.waitForTimeout(2000);

    const infoSection = page.locator('.vehicle-info-section');
    await expect(infoSection).toContainText('Chassis serie');
    await expect(infoSection).toContainText('S006');

    await takeScreenshot(page, '06_底盘信息_ChassisSerie');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.7 底盘信息-Chassis number 显示', async ({ page }) => {
    resetCounter('07_底盘信息_ChassisNumber');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'CH007', 'S007', []);
    await page.waitForTimeout(2000);

    const infoSection = page.locator('.vehicle-info-section');
    await expect(infoSection).toContainText('Chassis number');
    await expect(infoSection).toContainText('CH007');

    await takeScreenshot(page, '07_底盘信息_ChassisNumber');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.8 底盘信息-长字符串显示', async ({ page }) => {
    resetCounter('08_底盘信息_长字符串');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'LONG_CHASSIS_NUMBER_123456789', 'LONG_SERIE_ABC', []);
    await page.waitForTimeout(2000);

    const infoSection = page.locator('.vehicle-info-section');
    await expect(infoSection).toContainText('LONG_SERIE_ABC');
    await expect(infoSection).toContainText('LONG_CHASSIS_NUMBER_123456789');

    await takeScreenshot(page, '08_底盘信息_长字符串');
    await page.unroute('**/api/ud06/savemodifications/query');
  });
});

// ============================================================
// 3. 修改信息显示（No.9-18）
// ============================================================
test.describe.serial('修改信息显示（No.9-18）', () => {
  test.setTimeout(120000);

  test('No.9 修改信息-Doctype 显示', async ({ page }) => {
    resetCounter('09_修改信息_Doctype');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'CH009', 'S009', []);
    await page.waitForTimeout(2000);

    await expect(page.locator('.item-doctype')).toContainText('Doctype');
    await expect(page.locator('.item-doctype')).toContainText('VIN_PLATE');

    await takeScreenshot(page, '09_修改信息_Doctype');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.10 修改信息-Version 显示', async ({ page }) => {
    resetCounter('10_修改信息_Version');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'CH010', 'S010', []);
    await page.waitForTimeout(2000);

    await expect(page.locator('.item-version')).toContainText('Version');
    await expect(page.locator('.item-version')).toContainText('v1');

    await takeScreenshot(page, '10_修改信息_Version');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.11 修改信息-Storing 显示（有单个修改变量）', async ({ page }) => {
    resetCounter('11_修改信息_Storing单个');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'CH011', 'S011', [{ variable: 'COLOR', modifiedValue: 'RED' }]);
    await page.waitForTimeout(2000);

    await expect(page.locator('.modification-info-section')).toContainText('COLOR=RED');

    await takeScreenshot(page, '11_修改信息_Storing单个');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.12 修改信息-Storing 显示（有多个修改变量）', async ({ page }) => {
    resetCounter('12_修改信息_Storing多个');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'CH012', 'S012', [
      { variable: 'VAR_X', modifiedValue: '100' },
      { variable: 'VAR_Y', modifiedValue: '200' },
      { variable: 'VAR_Z', modifiedValue: '300' }
    ]);
    await page.waitForTimeout(2000);

    const storingSection = page.locator('.modification-info-section');
    await expect(storingSection).toContainText('VAR_X=100');
    await expect(storingSection).toContainText('VAR_Y=200');
    await expect(storingSection).toContainText('VAR_Z=300');

    await takeScreenshot(page, '12_修改信息_Storing多个');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.13 修改信息-Storing 显示（含特殊字符的值）', async ({ page }) => {
    resetCounter('13_修改信息_Storing特殊字符');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    const specialVal = '!@#$%^&*()_+-=[]{}|;\':",./<>?';
    await gotoUD06(page, 'CH013', 'S013', [{ variable: 'NOTE', modifiedValue: specialVal }]);
    await page.waitForTimeout(2000);

    await expect(page.locator('.modification-info-section')).toContainText('NOTE=');

    await takeScreenshot(page, '13_修改信息_Storing特殊字符');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.14 修改信息-Storing 显示（含日语/Unicode 字符）', async ({ page }) => {
    resetCounter('14_修改信息_Storing日文');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'CH014', 'S014', [{ variable: 'NAME', modifiedValue: '日本語テスト１２３' }]);
    await page.waitForTimeout(2000);

    await expect(page.locator('.modification-info-section')).toContainText('NAME=日本語テスト１２３');

    await takeScreenshot(page, '14_修改信息_Storing日文');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.15 修改信息-Storing 显示（值为空字符串）', async ({ page }) => {
    resetCounter('15_修改信息_Storing空值');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'CH015', 'S015', [{ variable: 'VAR_EMPTY', modifiedValue: '' }]);
    await page.waitForTimeout(2000);

    // 组件显示 "VAR_EMPTY="（变量名=空值，不会过滤空字符串）
    await expect(page.locator('.modification-info-section')).toContainText('VAR_EMPTY=');

    await takeScreenshot(page, '15_修改信息_Storing空值');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.16 修改信息-Storing 显示（含中日英混合字符）', async ({ page }) => {
    resetCounter('16_修改信息_Storing混合');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'CH016', 'S016', [{ variable: 'DESC', modifiedValue: 'ABC日本語テスト123 English' }]);
    await page.waitForTimeout(2000);

    await expect(page.locator('.modification-info-section')).toContainText('DESC=ABC日本語テスト123 English');

    await takeScreenshot(page, '16_修改信息_Storing混合');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.17 FOUND UNRELEASED VERSION 显示', async ({ page }) => {
    resetCounter('17_FOUND_UNRELEASED_VERSION');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'CH017', 'S017', []);
    await page.waitForTimeout(2000);

    await expect(page.locator('.found-version-section')).toContainText('FOUND UNRELEASED VERSION');
    await expect(page.locator('.found-version-section')).toContainText('NONE');

    await takeScreenshot(page, '17_FOUND_UNRELEASED_VERSION');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.18 Message 区域显示', async ({ page }) => {
    resetCounter('18_Message区域');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'CH018', 'S018', []);
    await page.waitForTimeout(2000);

    await expect(page.locator('.release-message')).toContainText('VERSION IS RELEASED');

    await takeScreenshot(page, '18_Message区域');
    await page.unroute('**/api/ud06/savemodifications/query');
  });
});

// ============================================================
// 4. Close 按钮功能（No.19-22）
// ============================================================
test.describe.serial('Close按钮功能（No.19-22）', () => {
  test.setTimeout(120000);

  test('No.19 Close 按钮-点击返回前一页面', async ({ page }) => {
    resetCounter('19_Close_返回前一页');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    // 先导航到 Menu，再导航到 UD06
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await loginViaLocalStorage(page);
    await page.goto(`${BASE_URL}/Menu`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    // 从 Menu 导航到 UD06
    await page.goto(`${BASE_URL}/Menu/SaveModifications`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      window.history.replaceState(
        { usr: { chassisNo: 'CH019', serie: 'S019', modifiedVariables: [{ variable: 'VAR', modifiedValue: 'VAL' }] }, key: 'custom', idx: 0 },
        '', '/Menu/SaveModifications'
      );
      window.dispatchEvent(new PopStateEvent('popstate', {
        state: { usr: { chassisNo: 'CH019', serie: 'S019', modifiedVariables: [{ variable: 'VAR', modifiedValue: 'VAL' }] }, key: 'custom', idx: 0 }
      }));
    });
    await page.waitForTimeout(2000);

    await expect(page.locator('.close-button')).toBeVisible();
    await page.locator('.close-button').click();
    await page.waitForTimeout(1500);

    // 返回前一页面（Menu）
    expect(page.url()).toContain('/Menu');

    await takeScreenshot(page, '19_Close_返回前一页');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.20 Close 按钮-按钮初始状态', async ({ page }) => {
    resetCounter('20_Close_初始状态');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'CH020', 'S020', []);
    await page.waitForTimeout(2000);

    const btn = page.locator('.close-button');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText('Close');
    await expect(btn).toBeEnabled();

    await takeScreenshot(page, '20_Close_初始状态');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.21 Close 按钮-鼠标悬停效果', async ({ page }) => {
    resetCounter('21_Close_悬停效果');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'CH021', 'S021', []);
    await page.waitForTimeout(2000);

    const btn = page.locator('.close-button');
    await btn.hover();
    await page.waitForTimeout(500);

    await expect(btn).toBeVisible();
    await expect(btn).toContainText('Close');

    await takeScreenshot(page, '21_Close_悬停效果');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.22 Close 按钮-错误状态下仍可用', async ({ page }) => {
    resetCounter('22_Close_错误状态可用');
    // 先导航到 Menu，再导航到 UD06（无参数触发错误）
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await loginViaLocalStorage(page);
    await page.goto(`${BASE_URL}/Menu/SaveModifications`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      window.history.replaceState(
        { usr: { chassisNo: '', serie: '', modifiedVariables: [] }, key: 'empty', idx: 0 },
        '', '/Menu/SaveModifications'
      );
      window.dispatchEvent(new PopStateEvent('popstate', {
        state: { usr: { chassisNo: '', serie: '', modifiedVariables: [] }, key: 'empty', idx: 0 }
      }));
    });
    await page.waitForTimeout(2000);

    // 错误消息显示
    await expect(page.locator('.error-message-area')).toContainText('缺少必要的底盘信息');
    // Close 按钮可用
    const btn = page.locator('.close-button');
    await expect(btn).toBeEnabled();
    // 点击 Close
    await btn.click();
    await page.waitForTimeout(1500);

    // 返回前一页面
    expect(page.url()).not.toContain('/Menu/SaveModifications');

    await takeScreenshot(page, '22_Close_错误状态可用');
  });
});

// ============================================================
// 5. API 交互（No.23-29）
// ============================================================
test.describe.serial('API交互（No.23-29）', () => {
  test.setTimeout(120000);

  test('No.23 API 调用-查询成功', async ({ page }) => {
    resetCounter('23_API_查询成功');
    let requestBody = '';
    await page.route('**/api/ud06/savemodifications/query', async (route) => {
      requestBody = route.request().postData() || '';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { doctype: 'VIN_PLATE', version: 'v1', foundUnreleasedVersion: 'NONE' } })
      });
    });

    await gotoUD06(page, 'CH023', 'S023', []);
    await page.waitForTimeout(2000);

    // 验证请求体
    expect(requestBody).toContain('"serie":"S023"');
    expect(requestBody).toContain('"chno":"CH023"');
    // 画面显示数据
    await expect(page.locator('.item-doctype')).toContainText('VIN_PLATE');
    await expect(page.locator('.item-version')).toContainText('v1');

    await takeScreenshot(page, '23_API_查询成功');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.24 API 调用-未找到修改记录（404）', async ({ page }) => {
    resetCounter('24_API_404');
    await mockQueryApi(page, null, 404);
    await gotoUD06(page, 'CH024', 'S024', []);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toContainText('未找到该底盘的修改记录');
    await expect(page.locator('.close-button')).toBeEnabled();

    await takeScreenshot(page, '24_API_404');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.25 API 调用-系统异常（500）', async ({ page }) => {
    resetCounter('25_API_500');
    await mockQueryApi(page, null, 500);
    await gotoUD06(page, 'CH025', 'S025', []);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toContainText('查询失败，请稍后重试');
    await expect(page.locator('.close-button')).toBeEnabled();

    await takeScreenshot(page, '25_API_500');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.26 API 调用-网络错误', async ({ page }) => {
    resetCounter('26_API_网络错误');
    await mockApiNetworkError(page);
    await gotoUD06(page, 'CH026', 'S026', []);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toContainText('系统异常，请联系管理员');
    await expect(page.locator('.close-button')).toBeEnabled();

    await takeScreenshot(page, '26_API_网络错误');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.27 API 调用-请求超时', async ({ page }) => {
    resetCounter('27_API_超时');
    await mockApiTimeout(page);
    await gotoUD06(page, 'CH027', 'S027', []);
    await page.waitForTimeout(15000); // 等待 axios 10s 超时

    const errorMsg = page.locator('.error-message-area');
    const errorText = await errorMsg.textContent().catch(() => '');
    expect(errorText?.length || 0).toBeGreaterThan(0);
    await expect(page.locator('.close-button')).toBeEnabled();

    await takeScreenshot(page, '27_API_超时');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.28 API 调用-DB 异常', async ({ page }) => {
    resetCounter('28_API_DB异常');
    await page.route('**/api/ud06/savemodifications/query', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: '系统异常，请联系管理员', data: null })
      });
    });

    await gotoUD06(page, 'CH028', 'S028', []);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toContainText('系统异常，请联系管理员');
    await expect(page.locator('.close-button')).toBeEnabled();

    await takeScreenshot(page, '28_API_DB异常');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.29 SQL 查询-正确执行条件', async ({ page }) => {
    resetCounter('29_SQL_查询条件');
    let requestBody = '';
    await page.route('**/api/ud06/savemodifications/query', async (route) => {
      requestBody = route.request().postData() || '';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { doctype: 'VIN_PLATE', version: 'v1', foundUnreleasedVersion: 'NONE' } })
      });
    });

    await gotoUD06(page, 'CH029', 'S029', []);
    await page.waitForTimeout(2000);

    // 验证请求参数正确
    expect(requestBody).toContain('"serie":"S029"');
    expect(requestBody).toContain('"chno":"CH029"');

    await takeScreenshot(page, '29_SQL_查询条件');
    await page.unroute('**/api/ud06/savemodifications/query');
  });
});

// ============================================================
// 6. 消息显示（No.30-32）
// ============================================================
test.describe.serial('消息显示（No.30-32）', () => {
  test.setTimeout(120000);

  test('No.30 错误消息-缺少底盘信息样式', async ({ page }) => {
    resetCounter('30_错误消息_样式');
    await gotoUD06(page, '', '', []);
    await page.waitForTimeout(2000);

    const errorArea = page.locator('.error-message-area');
    await expect(errorArea).toBeVisible();
    await expect(errorArea).toContainText('缺少必要的底盘信息');

    await takeScreenshot(page, '30_错误消息_样式');
  });

  test('No.31 消息区域-VERSION IS RELEASED 样式', async ({ page }) => {
    resetCounter('31_消息区域_样式');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'CH031', 'S031', []);
    await page.waitForTimeout(2000);

    const msg = page.locator('.release-message');
    await expect(msg).toBeVisible();
    await expect(msg).toContainText('VERSION IS RELEASED');

    await takeScreenshot(page, '31_消息区域_样式');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.32 消息清除-新操作覆盖旧消息', async ({ page }) => {
    resetCounter('32_消息清除_覆盖');
    // 第一次加载（参数缺失）
    await gotoUD06(page, '', '', []);
    await page.waitForTimeout(1500);

    await expect(page.locator('.error-message-area')).toContainText('缺少必要的底盘信息');

    // 第二次正常加载（需刷新页面并使用新参数重新导航）
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await page.goto(`${BASE_URL}/Menu/SaveModifications`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      window.history.replaceState(
        { usr: { chassisNo: 'CH032', serie: 'S032', modifiedVariables: [] }, key: 'custom', idx: 0 },
        '', '/Menu/SaveModifications'
      );
      window.dispatchEvent(new PopStateEvent('popstate', {
        state: { usr: { chassisNo: 'CH032', serie: 'S032', modifiedVariables: [] }, key: 'custom', idx: 0 }
      }));
    });
    await page.waitForTimeout(2000);

    // 旧错误消息被清除
    await expect(page.locator('.error-message-area')).toHaveCount(0);
    await expect(page.locator('.vehicle-info-section')).toContainText('S032');

    await takeScreenshot(page, '32_消息清除_覆盖');
    await page.unroute('**/api/ud06/savemodifications/query');
  });
});

// ============================================================
// 7. 界面交互（No.33-36）
// ============================================================
test.describe.serial('界面交互（No.33-36）', () => {
  test.setTimeout(120000);

  test('No.33 界面-页面标题显示', async ({ page }) => {
    resetCounter('33_界面_页面标题');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'CH033', 'S033', []);
    await page.waitForTimeout(2000);

    await expect(page.locator('.page-title')).toContainText('Save Modifications');
    await expect(page.locator('.page-header')).toBeVisible();

    await takeScreenshot(page, '33_界面_页面标题');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.34 界面-各控件初始状态', async ({ page }) => {
    resetCounter('34_界面_各控件初始状态');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'CH034', 'S034', [{ variable: 'VAR', modifiedValue: 'VAL' }]);
    await page.waitForTimeout(2000);

    await expect(page.locator('.page-title')).toBeVisible();
    await expect(page.locator('.vehicle-info-section')).toBeVisible();
    await expect(page.locator('.modification-info-section')).toBeVisible();
    await expect(page.locator('.found-version-section')).toBeVisible();
    await expect(page.locator('.release-message')).toBeVisible();
    await expect(page.locator('.close-button')).toBeEnabled();
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '34_界面_各控件初始状态');
    await page.unroute('**/api/ud06/savemodifications/query');
  });

  test('No.35 界面-错误状态下控件隐藏', async ({ page }) => {
    resetCounter('35_界面_错误状态隐藏');
    await gotoUD06(page, '', '', []);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toBeVisible();
    await expect(page.locator('.vehicle-info-section')).toHaveCount(0);
    await expect(page.locator('.modification-info-section')).toHaveCount(0);
    await expect(page.locator('.found-version-section')).toHaveCount(0);
    await expect(page.locator('.message-section')).toHaveCount(0);
    // Close 按钮显示
    await expect(page.locator('.close-button')).toBeVisible();

    await takeScreenshot(page, '35_界面_错误状态隐藏');
  });

  test('No.36 界面-响应式布局', async ({ page }) => {
    resetCounter('36_界面_响应式布局');
    await mockQueryApi(page, SUCCESS_API_RESPONSE);
    await gotoUD06(page, 'CH036', 'S036', []);
    await page.waitForTimeout(2000);

    // 调整窗口大小至小屏
    await page.setViewportSize({ width: 600, height: 800 });
    await page.waitForTimeout(1000);

    await expect(page.locator('.save-modifications-container')).toBeVisible();
    await expect(page.locator('.vehicle-info-section')).toBeVisible();
    await expect(page.locator('.modification-info-section')).toBeVisible();
    // 无水平滚动条
    const hasHScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasHScroll).toBe(false);

    await takeScreenshot(page, '36_界面_响应式布局');
    await page.unroute('**/api/ud06/savemodifications/query');
  });
});
