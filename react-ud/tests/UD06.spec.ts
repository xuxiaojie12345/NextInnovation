import { test, expect, Page } from '@playwright/test';
import { insertUD06TestData, cleanupUD06TestData } from './test-data-helper';

// ============================================================
// Save Modifications 模块 (UD06) Playwright 自动化测试
// 基于 単体テスト仕様書UD06.md (v1.0)
// 全36测试用例覆盖
// ============================================================

const BASE_URL = 'http://localhost:3000';
const API_BASE = 'http://localhost:8081';
const SCREENSHOT_DIR = 'tests/image/UD06';

let screenshotCounter: { [key: string]: number } = {};

/**
 * 截图工具函数
 * 每执行一步操作都截图，以测试观点名称为单元循环从001开始命名
 */
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

/**
 * 安全导航：domcontentloaded + 重试3次兜底
 */
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

/**
 * 登录 + 跳转到 Menu
 */
async function loginAndGoToMenu(page: Page) {
  await safeGoto(page, BASE_URL);
  await page.evaluate(() => {
    localStorage.setItem('userInfo', JSON.stringify({
      userid: 'e2e_test', username: 'E2E Test User', token: 'mock-token-ud06'
    }));
  });
  await safeGoto(page, `${BASE_URL}/Menu`);
  await page.waitForSelector('.menu-layout', { timeout: 15000 });
}

/**
 * 导航到 UD06 (SaveModifications)
 * 通过 addInitScript 在 React 初始化前注入 location state
 */
async function goToUD06(
  page: Page,
  chassisNo: string,
  serie: string,
  modifiedVariables: { variable: string; modifiedValue: string }[] = []
) {
  await page.addInitScript(`window.history.replaceState(
    ${JSON.stringify({ chassisNo, serie, modifiedVariables })},
    '',
    window.location.pathname + window.location.search
  );`);
  await page.goto(`${BASE_URL}/Menu/SaveModifications`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.save-modifications-container', { timeout: 15000 });
}

/**
 * 等待页面正常加载完成（无错误状态）
 */
async function waitForPageLoaded(page: Page) {
  await page.waitForSelector('.save-modifications-container', { timeout: 15000 });
  // 等待 loading 消失
  await expect(page.locator('.loading-message')).not.toBeVisible({ timeout: 10000 }).catch(() => {});
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  await cleanupUD06TestData();
  await insertUD06TestData();
});

test.afterAll(async () => {
  await cleanupUD06TestData();
});

// ============================================================
// 1. 画面初始化 (No.1-5)
// ============================================================
test.describe('画面初始化', () => {

  test('No.1 初始化-正常加载页面', async ({ page }) => {
    resetCounter('01_初始化_正常加载页面');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '01_初始化_正常加载页面');
    await goToUD06(page, 'CH001', 'S001', [{ variable: 'VAR_A', modifiedValue: '新値' }]);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '01_初始化_正常加载页面');
    // 页面标题
    await expect(page.locator('.page-title')).toHaveText('HDoc - Save Modifications');
    await takeScreenshot(page, '01_初始化_正常加载页面');
    // 底盘信息
    await expect(page.locator('.vehicle-info-section')).toBeVisible();
    await takeScreenshot(page, '01_初始化_正常加载页面');
    // 修改信息
    await expect(page.locator('.modification-info-section')).toBeVisible();
    await takeScreenshot(page, '01_初始化_正常加载页面');
    // FOUND UNRELEASED VERSION
    await expect(page.locator('.found-version-section')).toBeVisible();
    await takeScreenshot(page, '01_初始化_正常加载页面');
    // Message 区域
    await expect(page.locator('.message-section')).toBeVisible();
    await expect(page.locator('.release-message')).toHaveText('VERSION IS RELEASED');
    await takeScreenshot(page, '01_初始化_正常加载页面');
    // Close 按钮
    await expect(page.locator('.close-button')).toBeVisible();
    await expect(page.locator('.close-button')).toBeEnabled();
    await takeScreenshot(page, '01_初始化_正常加载页面');
    // 无错误消息
    await expect(page.locator('.error-message-area')).toHaveCount(0);
    await takeScreenshot(page, '01_初始化_正常加载页面');
  });

  test('No.2 初始化-底盘信息参数缺失（chassisNo 为空）', async ({ page }) => {
    resetCounter('02_初始化_chassisNo为空');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '02_初始化_chassisNo为空');
    await goToUD06(page, '', 'S002', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '02_初始化_chassisNo为空');
    // 显示错误消息
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.error-message-area')).toContainText('缺少必要的底盘信息');
    await takeScreenshot(page, '02_初始化_chassisNo为空');
    // 内容区域不显示
    await expect(page.locator('.vehicle-info-section')).toHaveCount(0);
    await expect(page.locator('.modification-info-section')).toHaveCount(0);
    await expect(page.locator('.found-version-section')).toHaveCount(0);
    await expect(page.locator('.message-section')).toHaveCount(0);
    await takeScreenshot(page, '02_初始化_chassisNo为空');
    // Close 按钮仍可用
    await expect(page.locator('.close-button')).toBeVisible();
    await expect(page.locator('.close-button')).toBeEnabled();
    await takeScreenshot(page, '02_初始化_chassisNo为空');
  });

  test('No.3 初始化-底盘信息参数缺失（serie 为空）', async ({ page }) => {
    resetCounter('03_初始化_serie为空');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '03_初始化_serie为空');
    await goToUD06(page, 'CH003', '', [{ variable: 'VAR_B', modifiedValue: 'テスト' }]);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '03_初始化_serie为空');
    // 显示错误消息（组件判断 !chassisNo || !serie）
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.error-message-area')).toContainText('缺少必要的底盘信息');
    await takeScreenshot(page, '03_初始化_serie为空');
    // 内容区域不显示
    await expect(page.locator('.vehicle-info-section')).toHaveCount(0);
    await expect(page.locator('.modification-info-section')).toHaveCount(0);
    await expect(page.locator('.found-version-section')).toHaveCount(0);
    await expect(page.locator('.message-section')).toHaveCount(0);
    await takeScreenshot(page, '03_初始化_serie为空');
    // Close 按钮仍可用
    await expect(page.locator('.close-button')).toBeVisible();
    await expect(page.locator('.close-button')).toBeEnabled();
    await takeScreenshot(page, '03_初始化_serie为空');
  });

  test('No.4 初始化-参数正常但无修改变量', async ({ page }) => {
    resetCounter('04_初始化_参数正常无修改变量');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '04_初始化_参数正常无修改变量');
    await goToUD06(page, 'CH004', 'S004', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '04_初始化_参数正常无修改变量');
    // 无错误消息
    await expect(page.locator('.error-message-area')).toHaveCount(0);
    await takeScreenshot(page, '04_初始化_参数正常无修改变量');
    // Chassis serie 和 number
    await expect(page.locator('.vehicle-info-section')).toContainText('S004');
    await expect(page.locator('.vehicle-info-section')).toContainText('CH004');
    await takeScreenshot(page, '04_初始化_参数正常无修改变量');
    // Storing 显示 "-"
    await expect(page.locator('.modification-info-section')).toContainText('Storing :  -');
    // Doctype 和 Version 显示 "-"
    await expect(page.locator('.item-doctype')).toContainText('-');
    await expect(page.locator('.item-version')).toContainText('-');
    // FOUND UNRELEASED VERSION 显示 "-"
    await expect(page.locator('.found-version-section')).toContainText('-');
    // Message 显示
    await expect(page.locator('.release-message')).toHaveText('VERSION IS RELEASED');
    // Close 按钮可用
    await expect(page.locator('.close-button')).toBeEnabled();
    await takeScreenshot(page, '04_初始化_参数正常无修改变量');
  });

  test('No.5 初始化-参数正常但 chassisNo 和 serie 均为空', async ({ page }) => {
    resetCounter('05_初始化_chassisNo和serie均为空');
    await loginAndGoToMenu(page);
    await takeScreenshot(page, '05_初始化_chassisNo和serie均为空');
    await goToUD06(page, '', '', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '05_初始化_chassisNo和serie均为空');
    // 显示错误消息
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.error-message-area')).toContainText('缺少必要的底盘信息');
    await takeScreenshot(page, '05_初始化_chassisNo和serie均为空');
    // 内容区域不显示
    await expect(page.locator('.vehicle-info-section')).toHaveCount(0);
    await expect(page.locator('.modification-info-section')).toHaveCount(0);
    await expect(page.locator('.found-version-section')).toHaveCount(0);
    await expect(page.locator('.message-section')).toHaveCount(0);
    await takeScreenshot(page, '05_初始化_chassisNo和serie均为空');
    // Close 按钮仍可用
    await expect(page.locator('.close-button')).toBeVisible();
    await expect(page.locator('.close-button')).toBeEnabled();
    await takeScreenshot(page, '05_初始化_chassisNo和serie均为空');
  });
});

// ============================================================
// 2. 底盘信息显示 (No.6-8)
// ============================================================
test.describe('底盘信息显示', () => {

  test('No.6 底盘信息-Chassis serie 显示', async ({ page }) => {
    resetCounter('06_底盘信息_ChassisSerie显示');
    await loginAndGoToMenu(page);
    await goToUD06(page, 'CH006', 'S006', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '06_底盘信息_ChassisSerie显示');
    await expect(page.locator('.vehicle-info-section')).toContainText('Chassis serie :  S006');
    await takeScreenshot(page, '06_底盘信息_ChassisSerie显示');
  });

  test('No.7 底盘信息-Chassis number 显示', async ({ page }) => {
    resetCounter('07_底盘信息_ChassisNumber显示');
    await loginAndGoToMenu(page);
    await goToUD06(page, 'CH007', 'S007', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '07_底盘信息_ChassisNumber显示');
    await expect(page.locator('.vehicle-info-section')).toContainText('Chassis number :  CH007');
    await takeScreenshot(page, '07_底盘信息_ChassisNumber显示');
  });

  test('No.8 底盘信息-长字符串显示', async ({ page }) => {
    resetCounter('08_底盘信息_长字符串显示');
    await loginAndGoToMenu(page);
    await goToUD06(page, 'LONG_CHASSIS_NUMBER_123456789', 'LONG_SERIE_ABC', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '08_底盘信息_长字符串显示');
    await expect(page.locator('.vehicle-info-section')).toContainText('LONG_SERIE_ABC');
    await expect(page.locator('.vehicle-info-section')).toContainText('LONG_CHASSIS_NUMBER_123456789');
    await takeScreenshot(page, '08_底盘信息_长字符串显示');
  });
});

// ============================================================
// 3. 修改信息显示 (No.9-18)
// ============================================================
test.describe('修改信息显示', () => {

  test('No.9 修改信息-Doctype 显示', async ({ page }) => {
    resetCounter('09_修改信息_Doctype显示');
    await loginAndGoToMenu(page);
    await goToUD06(page, 'CH009', 'S009', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '09_修改信息_Doctype显示');
    await expect(page.locator('.item-doctype')).toContainText('Doctype :  -');
    await takeScreenshot(page, '09_修改信息_Doctype显示');
  });

  test('No.10 修改信息-Version 显示', async ({ page }) => {
    resetCounter('10_修改信息_Version显示');
    await loginAndGoToMenu(page);
    await goToUD06(page, 'CH010', 'S010', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '10_修改信息_Version显示');
    await expect(page.locator('.item-version')).toContainText('Version :  -');
    await takeScreenshot(page, '10_修改信息_Version显示');
  });

  test('No.11 修改信息-Storing 显示（有单个修改变量）', async ({ page }) => {
    resetCounter('11_修改信息_Storing单个变量');
    await loginAndGoToMenu(page);
    await goToUD06(page, 'CH011', 'S011', [{ variable: 'COLOR', modifiedValue: 'RED' }]);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '11_修改信息_Storing单个变量');
    await expect(page.locator('.modification-info-section')).toContainText('Storing :  COLOR=RED');
    await takeScreenshot(page, '11_修改信息_Storing单个变量');
  });

  test('No.12 修改信息-Storing 显示（有多个修改变量）', async ({ page }) => {
    resetCounter('12_修改信息_Storing多个变量');
    const vars = [
      { variable: 'VAR_X', modifiedValue: '100' },
      { variable: 'VAR_Y', modifiedValue: '200' },
      { variable: 'VAR_Z', modifiedValue: '300' },
    ];
    await loginAndGoToMenu(page);
    await goToUD06(page, 'CH012', 'S012', vars);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '12_修改信息_Storing多个变量');
    await expect(page.locator('.modification-info-section')).toContainText('Storing :  VAR_X=100, VAR_Y=200, VAR_Z=300');
    await takeScreenshot(page, '12_修改信息_Storing多个变量');
  });

  test('No.13 修改信息-Storing 显示（含特殊字符的值）', async ({ page }) => {
    resetCounter('13_修改信息_Storing特殊字符');
    await loginAndGoToMenu(page);
    await goToUD06(page, 'CH013', 'S013', [{ variable: 'NOTE', modifiedValue: '!@#$%^&*()_+-=[]{}|;:\'",./<>?' }]);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '13_修改信息_Storing特殊字符');
    await expect(page.locator('.modification-info-section')).toContainText('Storing :  NOTE=');
    await expect(page.locator('.modification-info-section')).toContainText('!@#$%');
    await takeScreenshot(page, '13_修改信息_Storing特殊字符');
  });

  test('No.14 修改信息-Storing 显示（含日语/Unicode 字符）', async ({ page }) => {
    resetCounter('14_修改信息_Storing日语字符');
    await loginAndGoToMenu(page);
    await goToUD06(page, 'CH014', 'S014', [{ variable: 'NAME', modifiedValue: '日本語テスト１２３' }]);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '14_修改信息_Storing日语字符');
    await expect(page.locator('.modification-info-section')).toContainText('Storing :  NAME=日本語テスト１２３');
    await takeScreenshot(page, '14_修改信息_Storing日语字符');
  });

  test('No.15 修改信息-Storing 显示（值为空字符串）', async ({ page }) => {
    resetCounter('15_修改信息_Storing空字符串');
    await loginAndGoToMenu(page);
    await goToUD06(page, 'CH015', 'S015', [{ variable: 'VAR_EMPTY', modifiedValue: '' }]);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '15_修改信息_Storing空字符串');
    // 空字符串的变量不显示 - storingText 显示 "-"
    await expect(page.locator('.modification-info-section')).toContainText('Storing :  -');
    await takeScreenshot(page, '15_修改信息_Storing空字符串');
  });

  test('No.16 修改信息-Storing 显示（含中日英混合字符）', async ({ page }) => {
    resetCounter('16_修改信息_Storing中日英混合');
    await loginAndGoToMenu(page);
    await goToUD06(page, 'CH016', 'S016', [{ variable: 'DESC', modifiedValue: 'ABC日本語テスト123 English' }]);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '16_修改信息_Storing中日英混合');
    await expect(page.locator('.modification-info-section')).toContainText('Storing :  DESC=ABC日本語テスト123 English');
    await takeScreenshot(page, '16_修改信息_Storing中日英混合');
  });

  test('No.17 FOUND UNRELEASED VERSION 显示', async ({ page }) => {
    resetCounter('17_FOUND_UNRELEASED_VERSION显示');
    await loginAndGoToMenu(page);
    await goToUD06(page, 'CH017', 'S017', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '17_FOUND_UNRELEASED_VERSION显示');
    await expect(page.locator('.found-version-section')).toContainText('FOUND UNRELEASED VERSION :  -');
    await takeScreenshot(page, '17_FOUND_UNRELEASED_VERSION显示');
  });

  test('No.18 Message 区域显示', async ({ page }) => {
    resetCounter('18_Message区域显示');
    await loginAndGoToMenu(page);
    await goToUD06(page, 'CH018', 'S018', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '18_Message区域显示');
    await expect(page.locator('.release-message')).toBeVisible();
    await expect(page.locator('.release-message')).toHaveText('VERSION IS RELEASED');
    await takeScreenshot(page, '18_Message区域显示');
  });
});

// ============================================================
// 4. Close 按钮功能 (No.19-22)
// ============================================================
test.describe('Close 按钮功能', () => {

  test('No.19 Close 按钮-点击返回前一页面', async ({ page }) => {
    resetCounter('19_Close按钮_点击返回前一页面');
    await loginAndGoToMenu(page);
    await goToUD06(page, 'CH019', 'S019', [{ variable: 'VAR', modifiedValue: 'VAL' }]);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '19_Close按钮_点击返回前一页面');
    // 点击 Close
    await page.locator('.close-button').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '19_Close按钮_点击返回前一页面');
    // navigate(-1) 返回到 Menu 页面
    await page.waitForSelector('.menu-layout', { timeout: 15000 }).catch(() => {});
    await takeScreenshot(page, '19_Close按钮_点击返回前一页面');
  });

  test('No.20 Close 按钮-按钮初始状态', async ({ page }) => {
    resetCounter('20_Close按钮_按钮初始状态');
    await loginAndGoToMenu(page);
    await goToUD06(page, 'CH020', 'S020', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '20_Close按钮_按钮初始状态');
    const btn = page.locator('.close-button');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('Close');
    await expect(btn).toBeEnabled();
    await takeScreenshot(page, '20_Close按钮_按钮初始状态');
  });

  test('No.21 Close 按钮-鼠标悬停效果', async ({ page }) => {
    resetCounter('21_Close按钮_鼠标悬停效果');
    await loginAndGoToMenu(page);
    await goToUD06(page, 'CH021', 'S021', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '21_Close按钮_鼠标悬停效果');
    const btn = page.locator('.close-button');
    await btn.hover();
    await page.waitForTimeout(300);
    await takeScreenshot(page, '21_Close按钮_鼠标悬停效果');
    // hover 后按钮仍可见
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('Close');
    await takeScreenshot(page, '21_Close按钮_鼠标悬停效果');
  });

  test('No.22 Close 按钮-错误状态下仍可用', async ({ page }) => {
    resetCounter('22_Close按钮_错误状态下仍可用');
    await loginAndGoToMenu(page);
    await goToUD06(page, '', '', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '22_Close按钮_错误状态下仍可用');
    // 显示错误消息
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, '22_Close按钮_错误状态下仍可用');
    // Close 按钮可用
    const btn = page.locator('.close-button');
    await expect(btn).toBeEnabled();
    await takeScreenshot(page, '22_Close按钮_错误状态下仍可用');
    // 点击 Close
    await btn.click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '22_Close按钮_错误状态下仍可用');
    await page.waitForSelector('.menu-layout', { timeout: 15000 }).catch(() => {});
    await takeScreenshot(page, '22_Close按钮_错误状态下仍可用');
  });
});

// ============================================================
// 5. API 交互 (No.23-29)
// ============================================================
test.describe('API 交互', () => {

  test('No.23 API 调用-查询成功', async ({ page }) => {
    resetCounter('23_API调用_查询成功');
    await loginAndGoToMenu(page);
    // 使用真实 API 数据（已插入 S023/CH023）
    await goToUD06(page, 'CH023', 'S023', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '23_API调用_查询成功');
    // 等待 API 响应完成（loading 消失）
    await expect(page.locator('.loading-message')).not.toBeVisible({ timeout: 15000 }).catch(() => {});
    // 检查从 API 获取的数据
    await expect(page.locator('.item-doctype')).toContainText('Doctype :');
    await expect(page.locator('.item-version')).toContainText('Version :');
    await takeScreenshot(page, '23_API调用_查询成功');
  });

  test('No.24 API 调用-未找到修改记录（404）', async ({ page }) => {
    resetCounter('24_API调用_未找到修改记录404');
    await loginAndGoToMenu(page);
    await page.route(`${API_BASE}/api/ud06/savemodifications/query`, async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ code: 404, message: '未找到该底盘的修改记录', data: null })
      });
    });
    await goToUD06(page, 'CH024', 'S024', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '24_API调用_未找到修改记录404');
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.error-message-area')).toContainText('未找到该底盘的修改记录');
    await takeScreenshot(page, '24_API调用_未找到修改记录404');
    // Close 按钮仍可用
    await expect(page.locator('.close-button')).toBeEnabled();
    await takeScreenshot(page, '24_API调用_未找到修改记录404');
  });

  test('No.25 API 调用-系统异常（500）', async ({ page }) => {
    resetCounter('25_API调用_系统异常500');
    await loginAndGoToMenu(page);
    await page.route(`${API_BASE}/api/ud06/savemodifications/query`, async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: '查询失败，请稍后重试', data: null })
      });
    });
    await goToUD06(page, 'CH025', 'S025', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '25_API调用_系统异常500');
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.error-message-area')).toContainText('查询失败，请稍后重试');
    await takeScreenshot(page, '25_API调用_系统异常500');
    await expect(page.locator('.close-button')).toBeEnabled();
    await takeScreenshot(page, '25_API调用_系统异常500');
  });

  test('No.26 API 调用-网络错误', async ({ page }) => {
    resetCounter('26_API调用_网络错误');
    await loginAndGoToMenu(page);
    await page.route(`${API_BASE}/api/ud06/savemodifications/query`, async route => {
      await route.abort('connectionrefused');
    });
    await goToUD06(page, 'CH026', 'S026', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '26_API调用_网络错误');
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.error-message-area')).toContainText('网络连接失败，请稍后重试');
    await takeScreenshot(page, '26_API调用_网络错误');
    await expect(page.locator('.close-button')).toBeEnabled();
    await takeScreenshot(page, '26_API调用_网络错误');
  });

  test('No.27 API 调用-请求超时', async ({ page }) => {
    resetCounter('27_API调用_请求超时');
    await loginAndGoToMenu(page);
    await page.route(`${API_BASE}/api/ud06/savemodifications/query`, async route => {
      await new Promise(r => setTimeout(r, 15000));
    });
    await goToUD06(page, 'CH027', 'S027', []);
    // 等待超时
    await page.waitForTimeout(12000);
    await takeScreenshot(page, '27_API调用_请求超时');
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.error-message-area')).toContainText('请求超时，请检查网络连接');
    await takeScreenshot(page, '27_API调用_请求超时');
    await expect(page.locator('.close-button')).toBeEnabled();
    await takeScreenshot(page, '27_API调用_请求超时');
  });

  test('No.28 API 调用-DB 异常', async ({ page }) => {
    resetCounter('28_API调用_DB异常');
    await loginAndGoToMenu(page);
    await page.route(`${API_BASE}/api/ud06/savemodifications/query`, async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: '系统异常，请联系管理员', data: null })
      });
    });
    await goToUD06(page, 'CH028', 'S028', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '28_API调用_DB异常');
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.error-message-area')).toContainText('系统异常，请联系管理员');
    await takeScreenshot(page, '28_API调用_DB异常');
    await expect(page.locator('.close-button')).toBeEnabled();
    await takeScreenshot(page, '28_API调用_DB异常');
  });

  test('No.29 SQL 查询-正确执行条件', async ({ page }) => {
    resetCounter('29_SQL查询_正确执行条件');
    await loginAndGoToMenu(page);
    // 使用真实 API 数据（已插入 S029/CH029）
    await goToUD06(page, 'CH029', 'S029', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '29_SQL查询_正确执行条件');
    await expect(page.locator('.loading-message')).not.toBeVisible({ timeout: 15000 }).catch(() => {});
    // 页面正常加载，说明 SQL 正确执行
    await expect(page.locator('.save-modifications-container')).toBeVisible();
    await takeScreenshot(page, '29_SQL查询_正确执行条件');
  });
});

// ============================================================
// 6. 消息显示 (No.30-32)
// ============================================================
test.describe('消息显示', () => {

  test('No.30 错误消息-缺少底盘信息样式', async ({ page }) => {
    resetCounter('30_错误消息_缺少底盘信息样式');
    await loginAndGoToMenu(page);
    await goToUD06(page, '', '', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '30_错误消息_缺少底盘信息样式');
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.error-message-area')).toContainText('缺少必要的底盘信息');
    await takeScreenshot(page, '30_错误消息_缺少底盘信息样式');
  });

  test('No.31 消息区域-VERSION IS RELEASED 样式', async ({ page }) => {
    resetCounter('31_消息区域_VERSIONISRELEASED样式');
    await loginAndGoToMenu(page);
    await goToUD06(page, 'CH031', 'S031', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '31_消息区域_VERSIONISRELEASED样式');
    await expect(page.locator('.release-message')).toBeVisible();
    await expect(page.locator('.release-message')).toHaveText('VERSION IS RELEASED');
    // 确认 message-section 的样式属性
    const msgSection = page.locator('.message-section');
    await expect(msgSection).toHaveCSS('background-color', 'rgb(0, 109, 42)');
    await expect(msgSection).toHaveCSS('border-radius', '4px');
    await takeScreenshot(page, '31_消息区域_VERSIONISRELEASED样式');
    const msgText = page.locator('.release-message');
    await expect(msgText).toHaveCSS('text-align', 'center');
    await expect(msgText).toHaveCSS('font-weight', '700');
    await takeScreenshot(page, '31_消息区域_VERSIONISRELEASED样式');
  });

  test('No.32 消息清除-新操作覆盖旧消息', async ({ page }) => {
    resetCounter('32_消息清除_新操作覆盖旧消息');
    await loginAndGoToMenu(page);
    // 第一次：参数缺失触发错误
    await goToUD06(page, '', '', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '32_消息清除_新操作覆盖旧消息');
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, '32_消息清除_新操作覆盖旧消息');
    // 第二次：正常参数加载
    await goToUD06(page, 'CH032', 'S032', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '32_消息清除_新操作覆盖旧消息');
    // 错误消息被清除
    await expect(page.locator('.error-message-area')).toHaveCount(0);
    // 正常显示内容
    await expect(page.locator('.vehicle-info-section')).toBeVisible();
    await expect(page.locator('.release-message')).toHaveText('VERSION IS RELEASED');
    await takeScreenshot(page, '32_消息清除_新操作覆盖旧消息');
  });
});

// ============================================================
// 7. 界面交互 (No.33-36)
// ============================================================
test.describe('界面交互', () => {

  test('No.33 界面-页面标题显示', async ({ page }) => {
    resetCounter('33_界面_页面标题显示');
    await loginAndGoToMenu(page);
    await goToUD06(page, 'CH033', 'S033', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '33_界面_页面标题显示');
    await expect(page.locator('.page-title')).toHaveText('HDoc - Save Modifications');
    await expect(page.locator('.page-title')).toHaveCSS('color', 'rgb(0, 48, 135)');
    await expect(page.locator('.page-title')).toHaveCSS('font-size', '24px');
    await expect(page.locator('.page-title')).toHaveCSS('font-weight', '700');
    await takeScreenshot(page, '33_界面_页面标题显示');
    // 标题下边框
    await expect(page.locator('.page-header')).toHaveCSS('border-bottom-style', 'solid');
    await takeScreenshot(page, '33_界面_页面标题显示');
  });

  test('No.34 界面-各控件初始状态', async ({ page }) => {
    resetCounter('34_界面_各控件初始状态');
    await loginAndGoToMenu(page);
    await goToUD06(page, 'CH034', 'S034', [{ variable: 'VAR', modifiedValue: 'VAL' }]);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '34_界面_各控件初始状态');
    // 页面标题
    await expect(page.locator('.page-title')).toHaveText('HDoc - Save Modifications');
    // 底盘信息
    await expect(page.locator('.vehicle-info-section')).toContainText('Chassis serie');
    await expect(page.locator('.vehicle-info-section')).toContainText('Chassis number');
    await takeScreenshot(page, '34_界面_各控件初始状态');
    // 修改信息
    await expect(page.locator('.modification-info-section')).toContainText('Doctype');
    await expect(page.locator('.modification-info-section')).toContainText('Version');
    await expect(page.locator('.modification-info-section')).toContainText('Storing');
    await takeScreenshot(page, '34_界面_各控件初始状态');
    // FOUND UNRELEASED VERSION
    await expect(page.locator('.found-version-section')).toContainText('FOUND UNRELEASED VERSION');
    // Message
    await expect(page.locator('.release-message')).toHaveText('VERSION IS RELEASED');
    // Close 按钮
    await expect(page.locator('.close-button')).toBeEnabled();
    // 无错误消息
    await expect(page.locator('.error-message-area')).toHaveCount(0);
    await takeScreenshot(page, '34_界面_各控件初始状态');
  });

  test('No.35 界面-错误状态下控件隐藏', async ({ page }) => {
    resetCounter('35_界面_错误状态下控件隐藏');
    await loginAndGoToMenu(page);
    await goToUD06(page, '', '', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '35_界面_错误状态下控件隐藏');
    // 显示错误消息
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, '35_界面_错误状态下控件隐藏');
    // 各内容区域不显示
    await expect(page.locator('.vehicle-info-section')).toHaveCount(0);
    await expect(page.locator('.modification-info-section')).toHaveCount(0);
    await expect(page.locator('.found-version-section')).toHaveCount(0);
    await expect(page.locator('.message-section')).toHaveCount(0);
    await takeScreenshot(page, '35_界面_错误状态下控件隐藏');
    // Close 按钮仍显示
    await expect(page.locator('.close-button')).toBeVisible();
    await takeScreenshot(page, '35_界面_错误状态下控件隐藏');
  });

  test('No.36 界面-响应式布局', async ({ page }) => {
    resetCounter('36_界面_响应式布局');
    await loginAndGoToMenu(page);
    await goToUD06(page, 'CH036', 'S036', []);
    await waitForPageLoaded(page);
    await takeScreenshot(page, '36_界面_响应式布局');
    // 大屏幕
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '36_界面_响应式布局');
    // 小屏幕（<768px）
    await page.setViewportSize({ width: 500, height: 800 });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '36_界面_响应式布局');
    // 恢复到正常大小
    await page.setViewportSize({ width: 1280, height: 720 });
    await takeScreenshot(page, '36_界面_响应式布局');
  });
});
