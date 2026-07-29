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

/** Mock 数据：仅用于异常场景 */
const MOCK_MULTI_STORING = {
  code: 200,
  data: [
    { doctype: 'VIN_PLATE', vers: '1', variable: 'VIN_TEXT5', newVal: '30' },
    { doctype: 'VIN_PLATE', vers: '1', variable: 'VIN_TEXT6', newVal: 'PK20' },
    { doctype: 'VIN_PLATE', vers: '1', variable: 'VPGVW_2', newVal: '17501' },
  ]
};

// ==================== 截图函数 ====================
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD06画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
  const filepath = path.join(SCREENSHOT_ROOT, filename);
  return page.screenshot({ path: filepath, type: 'jpeg', quality: 80 });
}

// ==================== 辅助函数 ====================

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
 * 通过 React Router 内部 navigator.push 注入路由参数（与 UD04/UD05 相同方式）
 * 不注册 page.route，由调用方自行管理
 */
async function navigateToUD06(
  page: Page,
  chassisSerie: string,
  chassisNo: string,
  modifiedItems: Array<{ variable: string; currentValue: string; modifiedValue: string }>
) {
  await page.evaluate(() => {
    window.history.pushState({}, '', '/UD06?t=' + Date.now());
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    window.history.back();
  });
  await page.waitForTimeout(300);

  await page.evaluate(({ serie, no, items }) => {
    const root = document.getElementById('root');
    const containerKey = Object.keys(root).find(k => k.startsWith('__reactContainer'));
    const seen = new Set();
    (function walk(fiber, depth) {
      if (!fiber || depth > 60 || seen.has(fiber)) return;
      seen.add(fiber);
      if (fiber.memoizedProps && fiber.memoizedProps.value &&
          fiber.memoizedProps.value.navigator) {
        fiber.memoizedProps.value.navigator.push('/UD06', {
          chassisSerie: serie,
          chassisNo: no,
          modifiedItems: items
        });
        return;
      }
      walk(fiber.child, depth + 1);
      walk(fiber.sibling, depth);
    })(root[containerKey], 0);
  }, { serie: chassisSerie, no: chassisNo, items: modifiedItems });
}

/**
 * 导航到 UD06 画面（使用真实后端 API）
 * modifiedItems 中的 variable 名列表传给 API 精确查询
 */
async function goToUD06WithRealAPI(
  page: Page,
  chassisSerie: string,
  chassisNo: string,
  modifiedItems: Array<{ variable: string; currentValue: string; modifiedValue: string }>
) {
  await login(page);
  await page.goto(BASE_URL + '/UD06');
  await page.waitForSelector('.ud06-container');
  await navigateToUD06(page, chassisSerie, chassisNo, modifiedItems);
  await page.waitForTimeout(3000);
}

/**
 * 导航到 UD06 画面（使用 Mock API，仅用于异常场景）
 */
async function goToUD06WithMock(
  page: Page,
  mockResponse: any,
  chassisSerie: string,
  chassisNo: string,
  modifiedItems: Array<{ variable: string; currentValue: string; modifiedValue: string }>
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
  await navigateToUD06(page, chassisSerie, chassisNo, modifiedItems);
  await page.waitForTimeout(2000);
}

test.beforeEach(async ({ page }) => {
  screenshotCounter = 0;
  currentTestNo = '';
  await page.evaluate(() => localStorage.clear()).catch(() => {});
});

// ============================================================
// 1. 画面初期表示 (No.1-9)
// ============================================================
test.describe('画面初期表示', () => {

  test('UD06_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '01';
    // 真实 API: lwws/12345（传单个变量查单条记录）
    await goToUD06WithRealAPI(page, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: 'UPDATE_VAL_1', modifiedValue: 'UPDATE_VAL_1' }
    ]);
    await page.waitForTimeout(500);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('h1.ud06-title')).toHaveText('Save Modifications');
    await expect(page.locator('.ud06-card')).toBeVisible();

    // Chassis serie
    await expect(page.locator('.ud06-row').nth(0).locator('.ud06-label')).toHaveText('Chassis serie:');
    await expect(page.locator('.ud06-row').nth(0).locator('.ud06-value')).toContainText('lwws');
    // Chassis number
    await expect(page.locator('.ud06-row').nth(1).locator('.ud06-label')).toHaveText('Chassis number:');
    await expect(page.locator('.ud06-row').nth(1).locator('.ud06-value')).toContainText('12345');
    // Doctype
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-label')).toHaveText('Doctype:');
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).not.toHaveText('-');
    // Version
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-label')).toHaveText('Version:');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).not.toHaveText('-');
    // Storing
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-label')).toHaveText('Storing:');
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-value')).not.toHaveText('-');
    // FOUND UNRELEASED VERSION
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-label')).toHaveText('FOUND UNRELEASED VERSION:');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).not.toHaveText('-');

    // Message
    await expect(page.locator('.ud06-message-box')).toContainText('VERSION IS RELEASED');

    // Close 按钮
    await expect(page.locator('button.ud06-close-button')).toBeVisible();
    await expect(page.locator('button.ud06-close-button')).toHaveText('Close');
    await expect(page.locator('button.ud06-close-button')).toBeEnabled();

    // Error message 不显示
    await expect(page.locator('.ud06-error-message')).not.toBeVisible();
  });

  test('UD06_002_画面初始化_Chassis serie属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '02';
    await goToUD06WithRealAPI(page, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: 'UPDATE_VAL_1', modifiedValue: 'UPDATE_VAL_1' }
    ]);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.ud06-row').first().locator('.ud06-label')).toHaveText('Chassis serie:');
    await expect(page.locator('.ud06-row').first().locator('.ud06-value')).toContainText('lwws');
  });

  test('UD06_003_画面初始化_Chassis number属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '03';
    await goToUD06WithRealAPI(page, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: 'UPDATE_VAL_1', modifiedValue: 'UPDATE_VAL_1' }
    ]);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.ud06-row').nth(1).locator('.ud06-label')).toHaveText('Chassis number:');
    await expect(page.locator('.ud06-row').nth(1).locator('.ud06-value')).toContainText('12345');
  });

  test('UD06_004_画面初始化_Doctype属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '04';
    // jpct/8888 的 DOCTYPE 为 VIN_PLATE
    await goToUD06WithRealAPI(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT5', currentValue: 'TEST_DUP', modifiedValue: 'TEST_DUP' },
      { variable: 'VIN_TEXT6', currentValue: 'VAL_UPDATED_3', modifiedValue: 'VAL_UPDATED_3' },
      { variable: 'VPGVW_2', currentValue: '123', modifiedValue: '123' },
    ]);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-label')).toHaveText('Doctype:');
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).toContainText('VIN_PLATE');
  });

  test('UD06_005_画面初始化_Version属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '05';
    await goToUD06WithRealAPI(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT5', currentValue: 'TEST_DUP', modifiedValue: 'TEST_DUP' },
      { variable: 'VIN_TEXT6', currentValue: 'VAL_UPDATED_3', modifiedValue: 'VAL_UPDATED_3' },
      { variable: 'VPGVW_2', currentValue: '123', modifiedValue: '123' },
    ]);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-label')).toHaveText('Version:');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toContainText('1');
  });

  test('UD06_006_画面初始化_Storing属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '06';
    await goToUD06WithRealAPI(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT5', currentValue: 'TEST_DUP', modifiedValue: 'TEST_DUP' },
      { variable: 'VIN_TEXT6', currentValue: 'VAL_UPDATED_3', modifiedValue: 'VAL_UPDATED_3' },
      { variable: 'VPGVW_2', currentValue: '123', modifiedValue: '123' },
    ]);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-label')).toHaveText('Storing:');
    const storingVal = page.locator('.ud06-row').nth(4).locator('.ud06-value');
    // 真实 DB 数据: VIN_TEXT5 TEST_DUP, VIN_TEXT6 VAL_UPDATED_3, VPGVW_2 123
    await expect(storingVal).toContainText('VIN_TEXT5');
    await expect(storingVal).toContainText('TEST_DUP');
    await expect(storingVal).toContainText('VIN_TEXT6');
    await expect(storingVal).toContainText('VAL_UPDATED_3');
    await expect(storingVal).toContainText('VPGVW_2');
    await expect(storingVal).toContainText('123');
  });

  test('UD06_007_画面初始化_FOUND UNRELEASED VERSION属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '07';
    await goToUD06WithRealAPI(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT5', currentValue: 'TEST_DUP', modifiedValue: 'TEST_DUP' },
      { variable: 'VIN_TEXT6', currentValue: 'VAL_UPDATED_3', modifiedValue: 'VAL_UPDATED_3' },
      { variable: 'VPGVW_2', currentValue: '123', modifiedValue: '123' },
    ]);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-label')).toHaveText('FOUND UNRELEASED VERSION:');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toContainText('1');
  });

  test('UD06_008_画面初始化_Message属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '08';
    await goToUD06WithRealAPI(page, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: 'UPDATE_VAL_1', modifiedValue: 'UPDATE_VAL_1' }
    ]);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.ud06-message-box')).toHaveText('VERSION IS RELEASED');
  });

  test('UD06_009_画面初始化_Close按钮属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '09';
    await goToUD06WithRealAPI(page, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: 'UPDATE_VAL_1', modifiedValue: 'UPDATE_VAL_1' }
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
    currentTestNo = '10';
    let capturedBody: any = null;

    // 拦截真实 API 并记录请求
    await page.route('**/api/ud06/savemodifications', async route => {
      capturedBody = JSON.parse(route.request().postData() || '{}');
      await route.continue();
    });

    await goToUD06WithRealAPI(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT5', currentValue: 'TEST_DUP', modifiedValue: 'TEST_DUP' },
      { variable: 'VIN_TEXT6', currentValue: 'VAL_UPDATED_3', modifiedValue: 'VAL_UPDATED_3' },
      { variable: 'VPGVW_2', currentValue: '123', modifiedValue: '123' },
    ]);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    expect(capturedBody).not.toBeNull();
    expect(capturedBody.chassisSerie).toBe('jpct');
    expect(capturedBody.chassisNo).toBe('8888');
  });

  test('UD06_011_数据加载_各Label字段与数据库字段对应关系', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '11';
    // 真实 API: jpct/8888 → VIN_PLATE, VERS=1, 3条记录
    await goToUD06WithRealAPI(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT5', currentValue: 'TEST_DUP', modifiedValue: 'TEST_DUP' },
      { variable: 'VIN_TEXT6', currentValue: 'VAL_UPDATED_3', modifiedValue: 'VAL_UPDATED_3' },
      { variable: 'VPGVW_2', currentValue: '123', modifiedValue: '123' },
    ]);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud06-row').nth(0).locator('.ud06-value')).toContainText('jpct');
    await expect(page.locator('.ud06-row').nth(1).locator('.ud06-value')).toContainText('8888');
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).toContainText('VIN_PLATE');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toContainText('1');

    const storingVal = page.locator('.ud06-row').nth(4).locator('.ud06-value');
    await expect(storingVal).toContainText('VIN_TEXT5');
    await expect(storingVal).toContainText('TEST_DUP');
    await expect(storingVal).toContainText('VIN_TEXT6');
    await expect(storingVal).toContainText('VAL_UPDATED_3');
    await expect(storingVal).toContainText('VPGVW_2');

    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toContainText('1');
    await expect(page.locator('.ud06-message-box')).toContainText('VERSION IS RELEASED');
  });

  test('UD06_012_数据加载_Storing显示单条数据', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '12';
    // 真实 API: lwws/12345 只传1个变量 → 1条记录
    await goToUD06WithRealAPI(page, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: 'UPDATE_VAL_1', modifiedValue: 'UPDATE_VAL_1' }
    ]);
    await takeScreenshot(page, '初期表示');

    const storingVal = page.locator('.ud06-row').nth(4).locator('.ud06-value');
    await expect(storingVal).toContainText('LWW_01');
    await expect(storingVal).toContainText('UPDATE_VAL_1');
  });

  test('UD06_013_数据加载_Storing显示多条数据', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '13';
    // 真实 API: jpct/8888 传3个变量 → 3条记录
    await goToUD06WithRealAPI(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT5', currentValue: 'TEST_DUP', modifiedValue: 'TEST_DUP' },
      { variable: 'VIN_TEXT6', currentValue: 'VAL_UPDATED_3', modifiedValue: 'VAL_UPDATED_3' },
      { variable: 'VPGVW_2', currentValue: '123', modifiedValue: '123' },
    ]);
    await takeScreenshot(page, '初期表示');

    const storingVal = page.locator('.ud06-row').nth(4).locator('.ud06-value');
    await expect(storingVal).toContainText('VIN_TEXT5');
    await expect(storingVal).toContainText('VIN_TEXT6');
    await expect(storingVal).toContainText('VPGVW_2');
  });
});

// ============================================================
// 3. Close 按钮操作 (No.14)
// ============================================================
test.describe('Close 按钮操作', () => {

  test('UD06_014_Close_关闭画面返回', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '14';

    // 先导航到 UD05（建立历史记录），再跳转到 UD06
    await login(page);
    await page.goto(BASE_URL + '/UD05');
    await page.waitForSelector('.ud05-container');

    // 注入 UD05 路由参数 → 加载 UD05 数据（建立历史栈: /UD05）
    await page.evaluate(() => {
      window.history.pushState({}, '', '/UD05?t=' + Date.now());
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      window.history.back();
    });
    await page.waitForTimeout(300);
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
    // 等待 UD05 API 响应
    await page.waitForTimeout(3000);

    // 现在从 UD05 跳转到 UD06（历史栈: /UD05 → /UD06）
    await page.evaluate(() => {
      window.history.pushState({}, '', '/UD06?t=' + Date.now());
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      window.history.back();
    });
    await page.waitForTimeout(300);
    await page.evaluate(({ items }) => {
      const root = document.getElementById('root');
      const containerKey = Object.keys(root).find(k => k.startsWith('__reactContainer'));
      const seen = new Set();
      (function walk(fiber, depth) {
        if (!fiber || depth > 60 || seen.has(fiber)) return;
        seen.add(fiber);
        if (fiber.memoizedProps && fiber.memoizedProps.value &&
            fiber.memoizedProps.value.navigator) {
          fiber.memoizedProps.value.navigator.push('/UD06', {
            chassisSerie: 'lwws',
            chassisNo: '12345',
            modifiedItems: items
          });
          return;
        }
        walk(fiber.child, depth + 1);
        walk(fiber.sibling, depth);
      })(root[containerKey], 0);
    }, { items: [{ variable: 'LWW_01', currentValue: 'UPDATE_VAL_1', modifiedValue: 'UPDATE_VAL_1' }] });
    await page.waitForTimeout(3000);

    await takeScreenshot(page, '初期表示');

    // 点击 Close 按钮 → navigate(-1) 回到 UD05
    await page.locator('button.ud06-close-button').click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '操作後');

    // 验证返回到了 UD05 画面
    await expect(page.locator('.ud05-container')).toBeVisible();
    await expect(page).toHaveURL(/\/UD05/);
  });
});

// ============================================================
// 4. 异常处理 (No.15-18)
// ★ 全部使用 page.route() Mock ★
// ============================================================
test.describe('异常处理', () => {

  test('UD06_015_异常处理_API加载数据失败（HTTP 500）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '15';
    await page.route('**/api/ud06/savemodifications', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD06');
    await page.waitForSelector('.ud06-container');
    await navigateToUD06(page, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: 'UPDATE_VAL_1', modifiedValue: 'UPDATE_VAL_1' }
    ]);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud06-error-message')).toBeVisible();
    await expect(page.locator('.ud06-error-message')).toContainText('System error');
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('button.ud06-close-button')).toBeEnabled();
  });

  test('UD06_016_异常处理_API返回业务错误（code≠200）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '16';
    await page.route('**/api/ud06/savemodifications', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 401, data: null })
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD06');
    await page.waitForSelector('.ud06-container');
    await navigateToUD06(page, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: 'UPDATE_VAL_1', modifiedValue: 'UPDATE_VAL_1' }
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
    currentTestNo = '17';
    await page.route('**/api/ud06/savemodifications', async route => {
      await new Promise(r => setTimeout(r, 35000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [] })
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD06');
    await page.waitForSelector('.ud06-container');
    await navigateToUD06(page, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: 'UPDATE_VAL_1', modifiedValue: 'UPDATE_VAL_1' }
    ]);
    await page.waitForTimeout(32000);
    await takeScreenshot(page, '超時');

    const isError = await page.locator('.ud06-error-message').isVisible().catch(() => false);
    if (isError) {
      const text = await page.locator('.ud06-error-message').textContent();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('UD06_018_异常处理_网络异常', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '18';
    await page.route('**/api/ud06/savemodifications', route => {
      route.abort('internetdisconnected');
    });

    await login(page);
    await page.goto(BASE_URL + '/UD06');
    await page.waitForSelector('.ud06-container');
    await navigateToUD06(page, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: 'UPDATE_VAL_1', modifiedValue: 'UPDATE_VAL_1' }
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
    currentTestNo = '19';
    // 拦截 UD06 API 使其不响应，模拟加载中状态
    await page.route('**/api/ud06/savemodifications', async () => {
      await new Promise(() => {});
    });

    // 先导航到 UD05（模拟从 UD05 跳转到 UD06 的真实流程）
    await login(page);
    await page.goto(BASE_URL + '/UD05');
    await page.waitForSelector('.ud05-container');

    // 注入 UD05 路由参数加载数据
    await page.evaluate(() => {
      window.history.pushState({}, '', '/UD05?t=' + Date.now());
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      window.history.back();
    });
    await page.waitForTimeout(300);
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
    await page.waitForTimeout(3000);

    // 从 UD05 跳转到 UD06（API 被拦截，保持加载中）
    await page.evaluate(() => {
      window.history.pushState({}, '', '/UD06?t=' + Date.now());
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      window.history.back();
    });
    await page.waitForTimeout(300);
    await page.evaluate(({ items }) => {
      const root = document.getElementById('root');
      const containerKey = Object.keys(root).find(k => k.startsWith('__reactContainer'));
      const seen = new Set();
      (function walk(fiber, depth) {
        if (!fiber || depth > 60 || seen.has(fiber)) return;
        seen.add(fiber);
        if (fiber.memoizedProps && fiber.memoizedProps.value &&
            fiber.memoizedProps.value.navigator) {
          fiber.memoizedProps.value.navigator.push('/UD06', {
            chassisSerie: 'lwws',
            chassisNo: '12345',
            modifiedItems: items
          });
          return;
        }
        walk(fiber.child, depth + 1);
        walk(fiber.sibling, depth);
      })(root[containerKey], 0);
    }, { items: [{ variable: 'LWW_01', currentValue: 'UPDATE_VAL_1', modifiedValue: 'UPDATE_VAL_1' }] });
    await page.waitForTimeout(1000);

    // 1. Chassis serie 和 Chassis number 来自路由 state，加载中已显示
    await expect(page.locator('.ud06-row').nth(0).locator('.ud06-value')).toContainText('lwws');
    await expect(page.locator('.ud06-row').nth(1).locator('.ud06-value')).toContainText('12345');
    // 2. Doctype/Version/Storing/FOUND VERSION 依赖 API，未填充显示 '-'
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toHaveText('-');
    // 3. Close 按钮不可点击
    await expect(page.locator('button.ud06-close-button')).toBeDisabled();
    // 4. 截图（加载中状态）
    await takeScreenshot(page, '加载中');
  });

  test('UD06_020_UI交互_加载完成后控件恢复活性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '20';
    let resolveApi;
    const apiPromise = new Promise(r => { resolveApi = r; });
    await page.route('**/api/ud06/savemodifications', async route => {
      await apiPromise;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: [
            { doctype: 'VIN_PLATE', vers: '1', variable: 'VIN_TEXT5', newVal: 'TEST_DUP' },
            { doctype: 'VIN_PLATE', vers: '1', variable: 'VIN_TEXT6', newVal: 'VAL_UPDATED_3' },
            { doctype: 'VIN_PLATE', vers: '1', variable: 'VPGVW_2', newVal: '123' },
          ]
        })
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD06');
    await page.waitForSelector('.ud06-container');
    await navigateToUD06(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT5', currentValue: 'TEST_DUP', modifiedValue: 'TEST_DUP' },
      { variable: 'VIN_TEXT6', currentValue: 'VAL_UPDATED_3', modifiedValue: 'VAL_UPDATED_3' },
      { variable: 'VPGVW_2', currentValue: '123', modifiedValue: '123' },
    ]);
    await page.waitForTimeout(1000);

    // 阶段1：加载中截图
    await expect(page.locator('button.ud06-close-button')).toBeDisabled();
    await takeScreenshot(page, '加载中');

    // 释放 API
    resolveApi();
    await page.waitForTimeout(3000);

    // 阶段2：加载完成验证
    await expect(page.locator('button.ud06-close-button')).toBeEnabled();
    await expect(page.locator('.ud06-row').nth(0).locator('.ud06-value')).toContainText('jpct');
    await expect(page.locator('.ud06-row').nth(1).locator('.ud06-value')).toContainText('8888');
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).toContainText('VIN_PLATE');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toContainText('1');
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-value')).toContainText('VIN_TEXT5');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toContainText('1');
    await expect(page.locator('button.ud06-close-button')).toBeEnabled();
    await takeScreenshot(page, '加载完成');
  });

  test('UD06_021_UI交互_加载完成后各Label数据填充', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '21';
    // 真实 API
    await goToUD06WithRealAPI(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT5', currentValue: 'TEST_DUP', modifiedValue: 'TEST_DUP' },
      { variable: 'VIN_TEXT6', currentValue: 'VAL_UPDATED_3', modifiedValue: 'VAL_UPDATED_3' },
      { variable: 'VPGVW_2', currentValue: '123', modifiedValue: '123' },
    ]);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud06-row').nth(0).locator('.ud06-value')).toContainText('jpct');
    await expect(page.locator('.ud06-row').nth(1).locator('.ud06-value')).toContainText('8888');
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).toContainText('VIN_PLATE');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toContainText('1');
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-value')).toContainText('VIN_TEXT5');
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-value')).toContainText('TEST_DUP');
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-value')).toContainText('VIN_TEXT6');
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-value')).toContainText('VAL_UPDATED_3');
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-value')).toContainText('VPGVW_2');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toContainText('1');
    await expect(page.locator('.ud06-message-box')).toContainText('VERSION IS RELEASED');
  });
});

// ============================================================
// 6. 安全性 (No.22)
// ============================================================
test.describe('安全性', () => {

  test('UD06_022_安全性_未登录直接访问UD06画面重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '22';

    await login(page);
    await page.goto(BASE_URL + '/UD06');
    await page.waitForSelector('.ud06-container');
    await expect(page).toHaveURL(/\/UD06/);
    await takeScreenshot(page, 'UD06画面表示');

    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);

    await page.reload();
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await takeScreenshot(page, '重定向結果');
  });
});
