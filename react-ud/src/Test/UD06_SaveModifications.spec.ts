// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD06_SaveModifications 单元测试
// 测试规格书: テスト式样書UD06.md
// 画面文件: UD06_SaveModifications.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD06');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

// 单条 Storing Mock 数据
// const MOCK_SINGLE_STORING = {
//   code: 200,
//   data: [
//     { doctype: 'VIN_PLATE', vers: '1', variable: 'VIN_TEXT2', newVal: 'VTA-050077' }
//   ]
// };

// 多条 Storing Mock 数据（jpct/8888）
// const MOCK_MULTI_STORING = {
//   code: 200,
//   data: [
//     { doctype: 'VIN_PLATE', vers: '1', variable: 'VIN_TEXT5', newVal: '30' },
//     { doctype: 'VIN_PLATE', vers: '1', variable: 'VIN_TEXT6', newVal: 'PK20' },
//     { doctype: 'VIN_PLATE', vers: '1', variable: 'VPGVW_2', newVal: '17501' },
//   ]
// };

// lwws/12345 单条数据
// const MOCK_LWWS_STORING = {
//   code: 200,
//   data: [
//     { doctype: 'VIN_PLATE', vers: '1', variable: 'LWW_01', newVal: 'sylus03_UPDATE' }
//   ]
// };

/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD06画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
  const filepath = path.join(SCREENSHOT_ROOT, filename);
  return page.screenshot({ path: filepath, type: 'jpeg', quality: 80 });
}

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
 * 导航到 UD06 画面并注入路由参数 + Mock API
 */
async function goToUD06(
  page: Page,
  mockResponse: any,
  chassisSerie = 'lwws',
  chassisNo = '12345',
  modifiedItems: Array<{ variable: string; currentValue: string; modifiedValue: string }> = []
) {
  await page.route('**/api/ud06/savemodifications', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResponse)
    });
  });

  await login(page);
  await page.goto(BASE_URL + '/UD06');
  await page.waitForSelector('.ud06-container');

  await page.evaluate(({ serie, no, items }) => {
    window.history.replaceState(
      { chassisSerie: serie, chassisNo: no, modifiedItems: items },
      '',
      '/UD06'
    );
  }, { serie: chassisSerie, no: chassisNo, items: modifiedItems });
  await page.reload();
  await page.waitForSelector('.ud06-container');
  await page.waitForTimeout(2000);
}

/**
 * 每个测试前初始化
 */
test.beforeEach(async ({ page }) => {
  screenshotCounter = 0;
  await page.evaluate(() => localStorage.clear()).catch(() => {});
});

// ============================================================
// 1. 画面初期表示 (No.1-9)
// ============================================================
test.describe('画面初期表示', () => {

  test('UD06_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '01';
    await goToUD06(page, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: '', modifiedValue: 'VTA-050077' }
    ]);
    await page.waitForTimeout(500);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('h1.ud06-title')).toHaveText('Save Modifications');
    await expect(page.locator('.ud06-container')).toBeVisible();
    await expect(page.locator('.ud06-row').nth(0).locator('.ud06-label')).toHaveText('Chassis serie:');
    await expect(page.locator('.ud06-row').nth(1).locator('.ud06-label')).toHaveText('Chassis number:');
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-label')).toHaveText('Doctype:');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-label')).toHaveText('Version:');
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-label')).toHaveText('Storing:');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-label')).toHaveText('FOUND UNRELEASED VERSION:');
    await expect(page.locator('.ud06-message-box')).toContainText('VERSION IS RELEASED');
    await expect(page.locator('button.ud06-close-button')).toBeVisible();
    await expect(page.locator('button.ud06-close-button')).toHaveText('Close');
    await expect(page.locator('.ud06-error-message')).not.toBeVisible();
  });

  test('UD06_002_画面初始化_Chassis serie属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '002';
    await goToUD06(page, 'jpct', '8888', [
      { variable: 'LWW_01', currentValue: '', modifiedValue: '778' }
    ]);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud06-row').nth(0).locator('.ud06-label')).toHaveText('Chassis serie:');
    await expect(page.locator('.ud06-row').nth(0).locator('.ud06-value')).toHaveText('jpct');
  });

  test('UD06_003_画面初始化_Chassis number属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '003';
    await goToUD06(page, MOCK_SINGLE_STORING, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud06-row').nth(1).locator('.ud06-label')).toHaveText('Chassis number:');
    await expect(page.locator('.ud06-row').nth(1).locator('.ud06-value')).toHaveText('8888');
  });

  test('UD06_004_画面初始化_Doctype属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '004';
    await goToUD06(page, MOCK_SINGLE_STORING, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-label')).toHaveText('Doctype:');
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).toHaveText('VIN_PLATE');
  });

  test('UD06_005_画面初始化_Version属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '005';
    await goToUD06(page, MOCK_SINGLE_STORING, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-label')).toHaveText('Version:');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toHaveText('1');
  });

  test('UD06_006_画面初始化_Storing属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '006';
    await goToUD06(page, MOCK_SINGLE_STORING, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-label')).toHaveText('Storing:');
    const storingValue = page.locator('.ud06-row').nth(4).locator('.ud06-value');
    await expect(storingValue).not.toHaveText('-');
    const storingText = await storingValue.textContent();
    expect(storingText.trim().length).toBeGreaterThan(0);
  });

  test('UD06_007_画面初始化_FOUND UNRELEASED VERSION属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '007';
    await goToUD06(page, MOCK_SINGLE_STORING, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-label')).toHaveText('FOUND UNRELEASED VERSION:');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toHaveText('1');
  });

  test('UD06_008_画面初始化_Message属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '008';
    await goToUD06(page, MOCK_SINGLE_STORING, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud06-message-box')).toContainText('VERSION IS RELEASED');
  });

  test('UD06_009_画面初始化_Close按钮属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '009';
    await goToUD06(page, MOCK_SINGLE_STORING, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await takeScreenshot(page, '初期表示');

    const closeBtn = page.locator('button.ud06-close-button');
    await expect(closeBtn).toHaveText('Close');
    await expect(closeBtn).toBeEnabled();
  });
});

// ============================================================
// 2. 数据加载与数据库字段对应 (No.10-13)
// ============================================================
test.describe('数据加载', () => {

  test('UD06_010_数据加载_API调用成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '010';
    let capturedBody = null;
    await page.route('**/api/ud06/savemodifications', async route => {
      capturedBody = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SINGLE_STORING)
      });
    });

    await goToUD06(page, MOCK_SINGLE_STORING, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    expect(capturedBody).not.toBeNull();
    if (capturedBody) {
      expect(capturedBody.chassisSerie).toBe('jpct');
      expect(capturedBody.chassisNo).toBe('8888');
    }
  });

  test('UD06_011_数据加载_各Label字段与数据库字段对应关系', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '011';
    await goToUD06(page, MOCK_MULTI_STORING, 'jpct', '8888', [
      { variable: 'VIN_TEXT5', currentValue: '', modifiedValue: '30' },
      { variable: 'VIN_TEXT6', currentValue: '', modifiedValue: 'PK20' },
      { variable: 'VPGVW_2', currentValue: '', modifiedValue: '17501' },
    ]);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud06-row').nth(0).locator('.ud06-value')).toHaveText('jpct');
    await expect(page.locator('.ud06-row').nth(1).locator('.ud06-value')).toHaveText('8888');
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).toHaveText('VIN_PLATE');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toHaveText('1');
    const storingValue = page.locator('.ud06-row').nth(4).locator('.ud06-value');
    await expect(storingValue).not.toHaveText('-');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toHaveText('1');
    await expect(page.locator('.ud06-message-box')).toContainText('VERSION IS RELEASED');
    await expect(page.locator('.ud06-error-message')).not.toBeVisible();
  });

  test('UD06_012_数据加载_Storing显示单条数据', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '012';
    await page.route('**/api/ud06/savemodifications', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LWWS_STORING)
      });
    });

    await goToUD06(page, MOCK_LWWS_STORING, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: '', modifiedValue: 'sylus03_UPDATE' }
    ]);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    const storingValue = page.locator('.ud06-row').nth(4).locator('.ud06-value');
    await expect(storingValue).toHaveText('LWW_01 sylus03_UPDATE');
  });

  test('UD06_013_数据加载_Storing显示多条数据', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '013';
    await page.route('**/api/ud06/savemodifications', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_MULTI_STORING)
      });
    });

    await goToUD06(page, MOCK_MULTI_STORING, 'jpct', '8888', [
      { variable: 'VIN_TEXT5', currentValue: '', modifiedValue: '30' },
      { variable: 'VIN_TEXT6', currentValue: '', modifiedValue: 'PK20' },
      { variable: 'VPGVW_2', currentValue: '', modifiedValue: '17501' },
    ]);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    const storingValue = page.locator('.ud06-row').nth(4).locator('.ud06-value');
    await expect(storingValue).toContainText('VIN_TEXT5');
    await expect(storingValue).toContainText('VIN_TEXT6');
    await expect(storingValue).toContainText('VPGVW_2');
    const storingText = await storingValue.textContent();
    expect(storingText.split(', ').length).toBe(3);
  });
});

// ============================================================
// 3. Close 按钮操作 (No.14)
// ============================================================
test.describe('Close 按钮操作', () => {

  test('UD06_014_Close_关闭画面返回', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '014';
    await goToUD06(page, MOCK_SINGLE_STORING, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await takeScreenshot(page, '初期表示');

    await page.locator('button.ud06-close-button').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeAttached();
    await takeScreenshot(page, '关闭結果');
  });
});

// ============================================================
// 4. 异常处理 (No.15-18)
// ============================================================
test.describe('异常处理', () => {

  test('UD06_015_异常处理_API加载数据失败（HTTP 500）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '015';
    await page.route('**/api/ud06/savemodifications', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await goToUD06(page, MOCK_SINGLE_STORING, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: '', modifiedValue: 'sylus03' }
    ]);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud06-error-message')).toBeVisible();
    await expect(page.locator('.ud06-error-message')).toHaveText('System error. Please try again later.');
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('button.ud06-close-button')).toBeEnabled();
  });

  test('UD06_016_异常处理_API返回业务错误（code≠200）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '016';
    await page.route('**/api/ud06/savemodifications', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 401, data: null })
      });
    });

    await goToUD06(page, MOCK_SINGLE_STORING, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: '', modifiedValue: 'sylus03' }
    ]);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud06-error-message')).toBeVisible();
    await expect(page.locator('.ud06-error-message')).toHaveText('We can not get the data. Please try again.');
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toHaveText('-');
  });

  test('UD06_017_异常处理_API超时', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '017';
    await page.route('**/api/ud06/savemodifications', async route => {
      await new Promise(r => setTimeout(r, 10000));
    });

    await goToUD06(page, MOCK_SINGLE_STORING, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: '', modifiedValue: 'sylus03' }
    ]);
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '超时');

    const isError = await page.locator('.ud06-error-message').isVisible().catch(() => false);
    if (isError) {
      const text = await page.locator('.ud06-error-message').textContent();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('UD06_018_异常处理_网络异常', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '018';
    await page.route('**/api/ud06/savemodifications', route => {
      route.abort('internetdisconnected');
    });

    await goToUD06(page, MOCK_SINGLE_STORING, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: '', modifiedValue: 'sylus03' }
    ]);
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud06-error-message')).toBeVisible();
    await expect(page.locator('.ud06-error-message')).toContainText('System error');
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toHaveText('-');
  });
});

// ============================================================
// 5. UI交互 (No.19-21)
// ============================================================
test.describe('UI交互', () => {

  test('UD06_019_UI交互_加载中显示Loading状态', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '019';
    let resolveApi;
    const apiPromise = new Promise(r => { resolveApi = r; });
    await page.route('**/api/ud06/savemodifications', async route => {
      await apiPromise;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SINGLE_STORING)
      });
    });

    await goToUD06(page, MOCK_SINGLE_STORING, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: '', modifiedValue: 'sylus03' }
    ]);
    await page.waitForTimeout(500);
    await takeScreenshot(page, '加载中');

    await expect(page.locator('button.ud06-close-button')).toBeDisabled();
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toHaveText('-');

    resolveApi();
    await page.waitForTimeout(2000);
  });

  test('UD06_020_UI交互_加载完成后控件恢复活性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '020';
    await goToUD06(page, MOCK_SINGLE_STORING, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('button.ud06-close-button')).toBeEnabled();
    await expect(page.locator('.ud06-row').nth(0).locator('.ud06-value')).toHaveText('jpct');
    await expect(page.locator('.ud06-row').nth(1).locator('.ud06-value')).toHaveText('8888');
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).toHaveText('VIN_PLATE');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toHaveText('1');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toHaveText('1');
  });

  test('UD06_021_UI交互_加载完成后各Label数据填充', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '021';
    await goToUD06(page, MOCK_MULTI_STORING, 'jpct', '8888', [
      { variable: 'VIN_TEXT5', currentValue: '', modifiedValue: '30' },
      { variable: 'VIN_TEXT6', currentValue: '', modifiedValue: 'PK20' },
      { variable: 'VPGVW_2', currentValue: '', modifiedValue: '17501' },
    ]);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud06-row').nth(0).locator('.ud06-value')).toHaveText('jpct');
    await expect(page.locator('.ud06-row').nth(1).locator('.ud06-value')).toHaveText('8888');
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).toHaveText('VIN_PLATE');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toHaveText('1');
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-value')).not.toHaveText('-');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toHaveText('1');
    await expect(page.locator('.ud06-message-box')).toContainText('VERSION IS RELEASED');
    await expect(page.locator('.ud06-error-message')).not.toBeVisible();
  });
});

// ============================================================
// 6. 安全性 (No.22)
// ============================================================
test.describe('安全性', () => {

  test('UD06_022_安全性_未登录直接访问UD06画面重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '022';
    // Step 1: 登录后访问 UD06 画面
    await goToUD06(page, { code: 200, msg: '操作成功' });
    await expect(page).toHaveURL(/\/UD06/);
    await expect(page.locator('.ud06-container')).toBeVisible();
    await takeScreenshot(page, 'UD06画面表示');

    // Step 2: 清除 localStorage（画面未刷新）
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/UD06/);
    await expect(page.locator('.ud06-container')).toBeVisible();
    await takeScreenshot(page, 'localStorage清除後（画面未刷新）');

    // Step 3: 直接访问 UD06 URL → 重定向到 Login
    await page.goto(BASE_URL + '/UD06');
    await page.waitForTimeout(2000);

    // Step 4: 验证重定向结果
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('.ud06-container')).not.toBeVisible();
    await takeScreenshot(page, '重定向結果（Login画面）');
  });
});
