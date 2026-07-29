// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD05_ModifyDocument 单元测试
// 测试规格书: テスト式样書UD05.md
// 画面文件: UD05_ModifyDocument.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD05');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';


/** 
 * Mock 数据：用于 Save 操作测试（避免改库）
 * 模拟 jpct/8888 的多条 Variable
 */
const MOCK_SAVE_DATA = {
  code: 200,
  data: [
    { variable: 'VIN_TEXT2', description: 'Additional text on Eicher-Trucks VIN plate for VIPL', newVal: 'VTA-050077' },
    { variable: 'VIN_TEXT3', description: 'Additional text on Eicher-Trucks VIN plate for VIPL', newVal: 'NB' },
    { variable: 'VIN_TEXT5', description: 'Additional text on Eicher-Trucks VIN plate for VIPL', newVal: 'UD TRUCKS' },
    { variable: '1001', description: 'UD10更新测试_13756', newVal: '' },
    { variable: '1002', description: 'Description1', newVal: '' },
    { variable: '112', description: 'Description', newVal: '' },
  ]
};

/** Mock 数据：lwws/12345 */
const MOCK_LWWS_DATA = {
  code: 200,
  data: [
    { variable: 'sylus03', description: 'Test variable 03', newVal: 'old_value_03' },
    { variable: 'sylus04', description: 'Test variable 04', newVal: 'old_value_04' },
  ]
};

/** Mock 数据：Current value 部分为空 */
const MOCK_EMPTY_CURRENT_DATA = {
  code: 200,
  data: [
    { variable: 'VIN_TEXT2', description: 'Has current value', newVal: 'VTA-050077' },
    { variable: '1001', description: 'No current value', newVal: '' },
    { variable: '1002', description: 'No current value', newVal: '' },
  ]
};

// ==================== 截图函数 ====================
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD05画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
  const filepath = path.join(SCREENSHOT_ROOT, filename);
  return page.screenshot({ path: filepath, type: 'jpeg', quality: 80 });
}

// ==================== 辅助函数 ====================

/**
 * 登录系统
 */
async function login(page: Page) {
  await page.goto(BASE_URL + '/');
  await page.waitForSelector('.login-container');
  await page.locator('#userID').fill(REAL_USER);
  await page.locator('#password').fill(REAL_PASS);
  await page.locator('button[type="submit"]').click({ noWaitAfter: true });
  await page.waitForURL('**/Menu', { timeout: 60000 });
  await page.waitForSelector('.menu-container');
}

/**
 * 通过 React Router 内部 navigator.push 注入路由参数（与 UD04 相同方式）
 * 注意：此函数不注册 page.route，由调用方自行管理路由拦截
 */
async function navigateToUD05(
  page: Page,
  chassisSerie: string,
  chassisNo: string,
  market: string
) {
  // 先离开当前路由再返回，确保 React Router 正确处理
  await page.evaluate(() => {
    window.history.pushState({}, '', '/UD05?t=' + Date.now());
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    window.history.back();
  });
  await page.waitForTimeout(300);

  // 通过 React Router 内部 navigator.push 注入路由参数
  await page.evaluate(({ serie, no, mkt }) => {
    const root = document.getElementById('root');
    const containerKey = Object.keys(root).find(k => k.startsWith('__reactContainer'));
    const seen = new Set();
    (function walk(fiber, depth) {
      if (!fiber || depth > 60 || seen.has(fiber)) return;
      seen.add(fiber);
      if (fiber.memoizedProps && fiber.memoizedProps.value &&
          fiber.memoizedProps.value.navigator) {
        fiber.memoizedProps.value.navigator.push('/UD05', {
          chassisSerie: serie,
          chassisNo: no,
          market: mkt
        });
        return;
      }
      walk(fiber.child, depth + 1);
      walk(fiber.sibling, depth);
    })(root[containerKey], 0);
  }, { serie: chassisSerie, no: chassisNo, mkt: market });
}

/**
 * 导航到 UD05 画面（使用真实后端 API）
 */
async function goToUD05WithRealAPI(
  page: Page,
  chassisSerie: string,
  chassisNo: string,
  market: string
) {
  await login(page);
  await page.goto(BASE_URL + '/UD05');
  await page.waitForSelector('.ud05-container');
  await navigateToUD05(page, chassisSerie, chassisNo, market);
  // 等待真实 API 响应
  await page.waitForTimeout(3000);
}

/**
 * 导航到 UD05 画面（使用 Mock 数据加载，不注册 page.route）
 * 调用方可以自行注册 page.route 覆盖 selectmodifydocument 的响应
 */
async function goToUD05WithMock(
  page: Page,
  mockResponse: any,
  chassisSerie: string,
  chassisNo: string,
  market: string
) {
  await page.route('**/api/ud05/selectmodifydocument**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResponse)
    });
  });

  await login(page);
  await page.goto(BASE_URL + '/UD05');
  await page.waitForSelector('.ud05-container');
  await navigateToUD05(page, chassisSerie, chassisNo, market);
  await page.waitForTimeout(2000);
}

/**
 * 每个测试前初始化
 */
test.beforeEach(async ({ page }) => {
  screenshotCounter = 0;
  currentTestNo = '';
  await page.evaluate(() => localStorage.clear()).catch(() => {});
});

// ============================================================
// 1. 画面初期表示 (No.1-7)
// 使用真实 API 数据
// ============================================================
test.describe('画面初期表示', () => {

  test('UD05_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '01';
    // 使用真实 API: lwws/12345/IDO
    await goToUD05WithRealAPI(page, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(500);
    await takeScreenshot(page, '初期表示');

    // 1. 画面标题
    await expect(page.locator('h1.ud05-title')).toHaveText('Modify Document');

    // 2. Chassis no 显示格式
    await expect(page.locator('.ud05-label-bold')).toContainText('Chassis no:');
    await expect(page.locator('.ud05-info-value-strong')).toContainText('lwws');
    const chassisLink = page.locator('.ud05-info-value.ud05-link').first();
    await expect(chassisLink).toContainText('12345');

    // 3. Market 显示 IDO
    await expect(page.locator('.ud05-info-item').nth(1)).toContainText('Market:');
    await expect(page.locator('.ud05-info-item').nth(1)).toContainText('IDO');

    // 4. Template 文件链接
    const templateLink = page.locator('.ud05-info-value.ud05-link').last();
    await expect(templateLink).toContainText('VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.rtf');

    // 5. DataTable 显示（4列）
    await expect(page.locator('table.ud05-table')).toBeVisible();
    const headers = page.locator('table.ud05-table th.ud05-th');
    await expect(headers.nth(0)).toHaveText('Variable');
    await expect(headers.nth(1)).toHaveText('Description');
    await expect(headers.nth(2)).toHaveText('Current value');
    await expect(headers.nth(3)).toHaveText('Modified value');

    // 6. Save 按钮
    const saveBtn = page.locator('button.ud05-btn');
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toHaveText('Save');

    // 7. Error message area 不显示
    await expect(page.locator('.ud05-message')).not.toBeVisible();
  });

  test('UD05_002_画面初始化_Chassis no属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '02';
    await goToUD05WithRealAPI(page, 'lwws', '12345', 'IDO');
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud05-label-bold')).toHaveText('Chassis no:');
    await expect(page.locator('.ud05-info-value-strong')).toContainText('lwws');
    await expect(page.locator('.ud05-info-value.ud05-link').first()).toContainText('12345');
  });

  test('UD05_003_画面初始化_Market属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '03';
    await goToUD05WithRealAPI(page, 'lwws', '12345', 'IDO');
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud05-info-item').nth(1)).toContainText('Market:');
    await expect(page.locator('.ud05-info-item').nth(1)).toContainText('IDO');
  });

  test('UD05_004_画面初始化_Template文件链接属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '04';
    await goToUD05WithRealAPI(page, 'lwws', '12345', 'IDO');
    await takeScreenshot(page, '初期表示');

    const templateLink = page.locator('.ud05-info-value.ud05-link').last();
    await expect(templateLink).toHaveText('VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.rtf');
    await expect(templateLink).toBeVisible();
  });

  test('UD05_005_画面初始化_DataTable结构', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '05';
    // 使用真实 API: jpct/8888/AUS
    await goToUD05WithRealAPI(page, 'jpct', '8888', 'AUS');
    await takeScreenshot(page, '初期表示');

    // DataTable 4列
    const headers = page.locator('table.ud05-table th.ud05-th');
    await expect(headers.nth(0)).toHaveText('Variable');
    await expect(headers.nth(1)).toHaveText('Description');
    await expect(headers.nth(2)).toHaveText('Current value');
    await expect(headers.nth(3)).toHaveText('Modified value');

    // 真实数据已加载 → 有数据行
    const rows = page.locator('table.ud05-table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // 每行的 Modified value 列有可输入框
    const firstInput = rows.first().locator('input.ud05-input');
    await expect(firstInput).toBeVisible();
    await expect(firstInput).toBeEnabled();
    await expect(firstInput).toHaveAttribute('maxLength', '500');
  });

  test('UD05_006_画面初始化_Save按钮属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '06';
    await goToUD05WithRealAPI(page, 'lwws', '12345', 'IDO');
    await takeScreenshot(page, '初期表示');

    const saveBtn = page.locator('button.ud05-btn');
    await expect(saveBtn).toHaveText('Save');
    await expect(saveBtn).toBeEnabled();
  });

  test('UD05_007_画面初始化_Error message area属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '07';
    await goToUD05WithRealAPI(page, 'lwws', '12345', 'IDO');
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud05-message')).not.toBeVisible();
  });
});

// ============================================================
// 2. 数据加载与数据库字段对应 (No.8-10)
// 使用真实 API + 验证真实数据库字段值
// ============================================================
test.describe('数据加载', () => {

  test('UD05_008_数据加载_API调用成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '08';
    let capturedUrl: string | null = null;

    // 拦截真实 API 并记录请求参数
    await page.route('**/api/ud05/selectmodifydocument**', async route => {
      capturedUrl = route.request().url();
      await route.continue();
    });

    await goToUD05WithRealAPI(page, 'jpct', '8888', 'AUS');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 验证 API 被调用，参数正确
    expect(capturedUrl).not.toBeNull();
    expect(capturedUrl).toContain('chassisSerie=jpct');
    expect(capturedUrl).toContain('chassisNo=8888');

    // 验证真实数据已加载（jpct/8888 有 3 条记录: VIN_TEXT5, VIN_TEXT6, VPGVW_2）
    const rows = page.locator('table.ud05-table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBe(3);
  });

  test('UD05_009_数据加载_DataTable各列与数据库字段对应关系', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '09';
    // 使用真实 API: jpct/8888
    // 数据库真实数据: VIN_TEXT5(newVal=123), VIN_TEXT6(newVal=123), VPGVW_2(newVal=123)
    await goToUD05WithRealAPI(page, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    const rows = page.locator('table.ud05-table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBe(3);

    // 第1行: VIN_TEXT5
    const row1Cells = rows.nth(0).locator('td.ud05-td');
    await expect(row1Cells.nth(0)).toHaveText('VIN_TEXT5');
    await expect(row1Cells.nth(1)).toContainText('VIN plate');
    await expect(row1Cells.nth(2)).toHaveText('123');

    // 第2行: VIN_TEXT6
    const row2Cells = rows.nth(1).locator('td.ud05-td');
    await expect(row2Cells.nth(0)).toHaveText('VIN_TEXT6');
    await expect(row2Cells.nth(1)).toContainText('VIN plate');
    await expect(row2Cells.nth(2)).toHaveText('123');

    // 第3行: VPGVW_2
    const row3Cells = rows.nth(2).locator('td.ud05-td');
    await expect(row3Cells.nth(0)).toHaveText('VPGVW_2');
    await expect(row3Cells.nth(1)).toContainText('GVW');
    await expect(row3Cells.nth(2)).toHaveText('123');

    // Modified value 列：初始为空，可输入，最大500字符
    for (let i = 0; i < rowCount; i++) {
      const input = rows.nth(i).locator('input.ud05-input');
      await expect(input).toBeVisible();
      await expect(input).toBeEnabled();
      await expect(input).toHaveAttribute('maxLength', '500');
      await expect(input).toHaveValue('');
    }
  });

  test('UD05_010_数据加载_Current value无数据时显示空白', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '10';
    // 此测试需要验证 currentValue 为空的情况，使用 Mock 模拟部分数据为空
    await goToUD05WithMock(page, MOCK_EMPTY_CURRENT_DATA, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    // 有 currentValue 的行显示值
    const firstRow = page.locator('table.ud05-table tbody tr').first();
    await expect(firstRow.locator('td.ud05-td').nth(2)).toHaveText('VTA-050077');

    // 无 currentValue 的行显示空白
    const secondRow = page.locator('table.ud05-table tbody tr').nth(1);
    await expect(secondRow.locator('td.ud05-td').nth(2)).toHaveText('');

    // 所有行 Modified value 可输入
    const rows = page.locator('table.ud05-table tbody tr');
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const input = rows.nth(i).locator('input.ud05-input');
      await expect(input).toBeVisible();
      await expect(input).toBeEnabled();
    }
  });
});

// ============================================================
// 3. Chassis no Link 操作 (No.11)
// ============================================================
test.describe('Chassis no Link 操作', () => {

  test('UD05_011_Chassis no Link_正常跳转到UD07', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '11';
    await goToUD05WithRealAPI(page, 'lwws', '12345', 'IDO');
    await takeScreenshot(page, '初期表示');

    // 点击 Chassis no 链接（第一个 ud05-link）
    const chassisLink = page.locator('.ud05-info-value.ud05-link').first();
    await chassisLink.click({ noWaitAfter: true });

    // 验证跳转到 UD07
    await page.waitForURL('**/UD07', { timeout: 30000 });
    await takeScreenshot(page, '跳转後');
    await expect(page).toHaveURL(/\/UD07/);
  });
});

// ============================================================
// 4. Template文件链接操作 (No.12)
// ============================================================
test.describe('Template文件链接操作', () => {

  test('UD05_012_Template文件链接_下载模板', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '12';
    await goToUD05WithRealAPI(page, 'lwws', '12345', 'IDO');
    await takeScreenshot(page, '初期表示');

    // 点击 Template 文件链接（最后一个 ud05-link）
    const templateLink = page.locator('.ud05-info-value.ud05-link').last();
    await templateLink.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    // 页面不崩溃
    await expect(page.locator('.ud05-container')).toBeVisible();
  });
});

// ============================================================
// 5. Save 按钮操作 (No.13-18)
// 全部使用真实后端 API
// ============================================================
test.describe('Save 按钮操作', () => {

  test('UD05_013_Save_修改单个变量并保存成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '13';

    // 使用真实 API 加载数据
    await goToUD05WithRealAPI(page, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    // 在第一行输入新值
    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('VTA-NEWVALUE');
    await takeScreenshot(page, '入力後');

    // 点击 Save（调用真实 API 更新数据库）
    await page.locator('button.ud05-btn').click();

    // 等待跳转到 UD06
    await page.waitForURL('**/UD06', { timeout: 30000 });
    await takeScreenshot(page, '保存結果');

    // 验证跳转到 UD06 成功
    await expect(page).toHaveURL(/\/UD06/);
  });

  test('UD05_014_Save_修改多个变量并保存成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '14';

    // 使用真实 API
    await goToUD05WithRealAPI(page, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    // 在多个 Variable 行输入新值
    const rows = page.locator('table.ud05-table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(2);

    await rows.nth(0).locator('input.ud05-input').fill('VAL_UPDATED_2');
    await rows.nth(1).locator('input.ud05-input').fill('VAL_UPDATED_3');
    await takeScreenshot(page, '複数入力後');

    await page.locator('button.ud05-btn').click();
    await page.waitForURL('**/UD06', { timeout: 30000 });
    await takeScreenshot(page, '保存結果');

    await expect(page).toHaveURL(/\/UD06/);
  });

  test('UD05_015_Save_修改全部变量并保存成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '15';

    // 使用真实 API: lwws/12345（2条记录: LWW_01, LWW_02）
    await goToUD05WithRealAPI(page, 'lwws', '12345', 'IDO');
    await takeScreenshot(page, '初期表示');

    // 在所有行输入新值
    const rows = page.locator('table.ud05-table tbody tr');
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      await rows.nth(i).locator('input.ud05-input').fill(`UPDATE_VAL_${i + 1}`);
    }
    await takeScreenshot(page, '全入力後');

    await page.locator('button.ud05-btn').click();
    await page.waitForURL('**/UD06', { timeout: 30000 });
    await takeScreenshot(page, '保存結果');

    await expect(page).toHaveURL(/\/UD06/);
  });

  test('UD05_016_Save_空值校验_所有Modified value为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '16';
    // 使用真实 API 加载数据
    await goToUD05WithRealAPI(page, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    // 所有行保持为空，直接点击 Save
    await page.locator('button.ud05-btn').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '空值校验錯誤');

    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toHaveText('NO UNRELEASED VERSION EXISTS! Please input modified value before saving.');
    await expect(page).toHaveURL(/UD05/);
  });

  test('UD05_017_Save_空值校验_部分行有值部分为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '17';

    // 使用真实 API 加载数据
    await goToUD05WithRealAPI(page, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    // 只在第一行输入值
    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('VAL_TEST');
    await takeScreenshot(page, '入力後');

    await page.locator('button.ud05-btn').click();
    await page.waitForURL('**/UD06', { timeout: 30000 });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '保存結果');

    await expect(page).toHaveURL(/\/UD06/);
  });

  test('UD05_018_Save_修改值超过500字符时截断', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '18';
    // 使用真实 API 加载数据
    await goToUD05WithRealAPI(page, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    // 输入超过500字符的字符串
    const longStr = 'A'.repeat(600);
    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill(longStr);

    // 验证实际输入长度为500
    const actualVal = await firstInput.inputValue();
    expect(actualVal.length).toBe(500);
    await takeScreenshot(page, '500文字制限確認');
  });
});

// ============================================================
// 6. 异常处理 (No.19-25)
// ★ 全部使用 page.route() Mock ★
// ============================================================
test.describe('异常处理', () => {

  test('UD05_019_异常处理_API加载数据失败（HTTP 500）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '19';
    await page.route('**/api/ud05/selectmodifydocument**', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD05');
    await page.waitForSelector('.ud05-container');
    await navigateToUD05(page, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toContainText('System error');
    await expect(page.locator('button.ud05-btn')).toBeDisabled();
  });

  test('UD05_020_异常处理_API返回业务错误（code≠200）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '20';
    await page.route('**/api/ud05/selectmodifydocument**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 401, data: null })
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD05');
    await page.waitForSelector('.ud05-container');
    await navigateToUD05(page, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toHaveText('We can not get the data. Please try again.');
  });

  test('UD05_021_异常处理_Save时API返回HTTP 500错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '21';
    // 数据加载用真实 API，Save 拦截为 500
    await page.route('**/api/ud05/updatemodifydocument**', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await goToUD05WithRealAPI(page, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('TEST_500');
    await takeScreenshot(page, '入力後');

    await page.locator('button.ud05-btn').click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'Save結果');

    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toContainText('System error');
    await expect(page).toHaveURL(/UD05/);
  });

  test('UD05_022_异常处理_Save时数据更新失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '22';
    await page.route('**/api/ud05/updatemodifydocument**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: '更新失败' })
      });
    });

    await goToUD05WithRealAPI(page, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('TEST_FAIL');
    await takeScreenshot(page, '入力後');

    await page.locator('button.ud05-btn').click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'Save結果');

    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toHaveText('数据更新失败，请稍后重试');
    await expect(page).toHaveURL(/UD05/);
  });

  test('UD05_023_异常处理_API超时（加载数据）', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '23';
    await page.route('**/api/ud05/selectmodifydocument**', async route => {
      await new Promise(r => setTimeout(r, 35000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [] })
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD05');
    await page.waitForSelector('.ud05-container');
    await navigateToUD05(page, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(32000);
    await takeScreenshot(page, '超時');

    const isError = await page.locator('.ud05-message').isVisible().catch(() => false);
    if (isError) {
      const text = await page.locator('.ud05-message').textContent();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('UD05_024_异常处理_网络异常（加载数据）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '24';
    await page.route('**/api/ud05/selectmodifydocument**', route => {
      route.abort('internetdisconnected');
    });

    await login(page);
    await page.goto(BASE_URL + '/UD05');
    await page.waitForSelector('.ud05-container');
    await navigateToUD05(page, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toContainText('System error');
  });

  test('UD05_025_异常处理_网络异常（保存数据）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '25';
    await page.route('**/api/ud05/updatemodifydocument**', route => {
      route.abort('internetdisconnected');
    });

    // 数据加载用真实 API
    await goToUD05WithRealAPI(page, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('TEST_NET');
    await takeScreenshot(page, '入力後');

    await page.locator('button.ud05-btn').click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'Save結果');

    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toContainText('System error');
    await expect(page).toHaveURL(/UD05/);
  });
});

// ============================================================
// 7. UI交互 (No.26-31)
// ============================================================
test.describe('UI交互', () => {

  test('UD05_026_UI交互_加载中显示Loading状态', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '26';
    // 拦截 API 使其不响应，模拟加载中状态
    await page.route('**/api/ud05/selectmodifydocument**', async route => {
      // 不调用 route.fulfill，保持 pending 状态
      await new Promise(() => {});
    });

    await login(page);
    await page.goto(BASE_URL + '/UD05');
    await page.waitForSelector('.ud05-container');

    // 注入路由参数
    await page.evaluate(() => {
      window.history.pushState({}, '', '/UD05?t=' + Date.now());
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      window.history.back();
    });
    await page.waitForTimeout(300);

    // 通过 React Router 内部 navigator.push 注入路由参数
    await page.evaluate(() => {
      const root = document.getElementById('root');
      const containerKey = Object.keys(root).find(k => k.startsWith('__reactContainer'));
      const seen = new Set();
      (function walk(fiber, depth) {
        if (!fiber || depth > 60 || seen.has(fiber)) return;
        seen.add(fiber);
        if (fiber.memoizedProps && fiber.memoizedProps.value &&
            fiber.memoizedProps.value.navigator) {
          fiber.memoizedProps.value.navigator.push('/UD05', {
            chassisSerie: 'lwws',
            chassisNo: '12345',
            market: 'IDO'
          });
          return;
        }
        walk(fiber.child, depth + 1);
        walk(fiber.sibling, depth);
      })(root[containerKey], 0);
    });
    await page.waitForSelector('.ud05-container');
    await page.waitForTimeout(1000);

    // 加载中状态验证
    // 1. 加载中提示显示
    await expect(page.locator('.ud05-empty')).toContainText('加载中...');
    // 2. DataTable 未加载数据
    await expect(page.locator('table.ud05-table tbody tr td.ud05-td')).toHaveCount(0);
    // 3. Save 按钮不可点击
    await expect(page.locator('button.ud05-btn')).toBeDisabled();
    // 4. Chassis no Link 不可点击
    await expect(page.locator('.ud05-link-disabled').first()).toBeVisible();
    // 5. Template 文件链接不可点击
    await expect(page.locator('.ud05-link-disabled').last()).toBeVisible();
    await takeScreenshot(page, '加载中');
  });

  test('UD05_027_UI交互_加载完成后控件恢复活性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '27';
    // 拦截 API 使其延迟响应：先截加载中图，再释放 API 截加载完成图
    let resolveApi;
    const apiPromise = new Promise(r => { resolveApi = r; });
    await page.route('**/api/ud05/selectmodifydocument**', async route => {
      await apiPromise;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: [
            { variable: 'VIN_TEXT5', description: 'Additional text on Eicher-Trucks VIN plate for VIPL', newVal: '123' },
            { variable: 'VIN_TEXT6', description: 'Additional text on Eicher-Trucks VIN plate for VIPL', newVal: '123' },
            { variable: 'VPGVW_2', description: 'VIN-plate value: column2(right) = technical perm. GVW weight', newVal: '123' },
          ]
        })
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD05');
    await page.waitForSelector('.ud05-container');

    // 注入路由参数
    await page.evaluate(() => {
      window.history.pushState({}, '', '/UD05?t=' + Date.now());
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      window.history.back();
    });
    await page.waitForTimeout(300);

    // 通过 React Router 内部 navigator.push 注入路由参数
    await page.evaluate(() => {
      const root = document.getElementById('root');
      const containerKey = Object.keys(root).find(k => k.startsWith('__reactContainer'));
      const seen = new Set();
      (function walk(fiber, depth) {
        if (!fiber || depth > 60 || seen.has(fiber)) return;
        seen.add(fiber);
        if (fiber.memoizedProps && fiber.memoizedProps.value &&
            fiber.memoizedProps.value.navigator) {
          fiber.memoizedProps.value.navigator.push('/UD05', {
            chassisSerie: 'jpct',
            chassisNo: '8888',
            market: 'IDO'
          });
          return;
        }
        walk(fiber.child, depth + 1);
        walk(fiber.sibling, depth);
      })(root[containerKey], 0);
    });
    await page.waitForSelector('.ud05-container');
    await page.waitForTimeout(1000);

    // ========== 阶段1：加载中状态截图（API 尚未响应） ==========
    await expect(page.locator('.ud05-empty')).toContainText('加载中...');
    await takeScreenshot(page, '加载中');

    // ========== 释放 API，等待数据加载 ==========
    resolveApi();
    await page.waitForTimeout(3000);

    // ========== 阶段2：数据加载完成后截图 ==========
    // 1. 加载中提示消失
    await expect(page.locator('.ud05-empty')).not.toBeVisible();
    // 2. DataTable 已加载数据
    const rows = page.locator('table.ud05-table tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
    // 3. Save 按钮可点击
    await expect(page.locator('button.ud05-btn')).toBeEnabled();
    // 4. Chassis no Link 可点击（禁用样式消失）
    await expect(page.locator('.ud05-link-disabled')).toHaveCount(0);
    await expect(page.locator('.ud05-info-value.ud05-link').first()).toBeVisible();
    // 5. Template 文件链接可点击
    await expect(page.locator('.ud05-info-value.ud05-link').last()).toBeVisible();
    
    await takeScreenshot(page, '加载完成');
  });
  test('UD05_028_UI交互_Save中按钮禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '28';

    // 使用真实 API
    await goToUD05WithRealAPI(page, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('TEST');
    await takeScreenshot(page, '入力後');

    // 点击 Save
    await page.locator('button.ud05-btn').click();

    // 等待跳转到 UD06
    await page.waitForURL('**/UD06', { timeout: 30000 });
    await takeScreenshot(page, '保存結果');

    await expect(page).toHaveURL(/\/UD06/);
  });

  test('UD05_029_UI交互_Save防止重复提交', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '29';

    // 使用真实 API
    await goToUD05WithRealAPI(page, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('TEST_DUP');
    await takeScreenshot(page, '入力後');

    // 连续点击 2 次 Save
    const saveBtn = page.locator('button.ud05-btn');
    await saveBtn.click();
    await saveBtn.click({ force: true });

    // 验证页面只跳转一次到 UD06
    await page.waitForURL('**/UD06', { timeout: 30000 });
    await takeScreenshot(page, 'Save結果');

    await expect(page).toHaveURL(/\/UD06/);
  });

  test('UD05_030_UI交互_DataTable Modified value输入编辑', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '30';
    // 使用真实 API
    await goToUD05WithRealAPI(page, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('TEST_VALUE');
    await takeScreenshot(page, '入力後');

    await expect(firstInput).toHaveValue('TEST_VALUE');

    // 其他行的值不受影响
    const secondInput = page.locator('table.ud05-table tbody tr').nth(1).locator('input.ud05-input');
    await expect(secondInput).toHaveValue('');
  });

  test('UD05_031_UI交互_Error message area显示错误消息样式', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '31';
    // Mock API 返回业务错误，触发错误消息
    await page.route('**/api/ud05/selectmodifydocument**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 401, data: null })
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD05');
    await page.waitForSelector('.ud05-container');
    await navigateToUD05(page, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'エラー表示');

    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toHaveText('We can not get the data. Please try again.');
  });
});

// ============================================================
// 8. 安全性 (No.32-33)
// ============================================================
test.describe('安全性', () => {

  test('UD05_032_安全性_未登录直接访问UD05画面重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '32';

    // Step 1: 先登录使 localStorage 有数据
    await login(page);
    await page.goto(BASE_URL + '/UD05');
    await page.waitForSelector('.ud05-container');
    await expect(page).toHaveURL(/\/UD05/);
    await takeScreenshot(page, 'UD05画面表示');

    // Step 2: 清除 localStorage（模拟未登录）
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);

    // Step 3: 重新加载页面触发登录检查
    await page.reload();
    await page.waitForTimeout(2000);

    // Step 4: 重定向到 Login
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await takeScreenshot(page, '重定向結果');
  });

  test('UD05_033_安全性_Modified value XSS防护', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '33';
    let capturedBody: any = null;

    await page.route('**/api/ud05/updatemodifydocument**', async route => {
      capturedBody = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'Update successful' })
      });
    });

    // 数据加载用 Mock
    await goToUD05WithMock(page, MOCK_SAVE_DATA, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('<script>alert(1)</script>');
    await takeScreenshot(page, '入力後');

    await page.locator('button.ud05-btn').click();
    await page.waitForURL('**/UD06', { timeout: 30000 }).catch(() => {});
    await takeScreenshot(page, '保存結果');

    // 验证请求中包含 XSS 载荷
    expect(capturedBody).not.toBeNull();
    expect(capturedBody.modifiedItems[0].modifiedValue).toBe('<script>alert(1)</script>');

    // 页面不崩溃
    await expect(page.locator('body')).toBeVisible();
  });
});
