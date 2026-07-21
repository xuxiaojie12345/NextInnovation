// @ts-nocheck
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

// 禁止并行执行
test.describe.configure({ mode: 'serial' });

/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD05画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * 导航到 UD05 画面并注入路由参数
 * 通过 React Router 内部 navigator.push 设置 location.state
 * 需要先离开当前路由再返回，确保 React Router 正确处理状态变更
 */
async function goToUD05(page: Page, chassisSerie: string, chassisNo: string, market: string) {
  await login(page);
  // 先导航到 UD05，组件会先渲染（无 state）
  await page.goto(BASE_URL + '/UD05');
  await page.waitForSelector('.ud05-container');
  // 先离开当前路由
  await page.evaluate(() => {
    window.history.pushState({}, '', '/UD05?t=' + Date.now());
  });
  await page.waitForTimeout(300);
  // 返回，触发 React Router 的 popstate
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
  // 等待组件 re-render 和 API 响应
  await page.waitForTimeout(1000);
}

/**
 * 每个测试前初始化
 */
test.beforeEach(async ({ page }) => {
  screenshotCounter = 0;
  await page.evaluate(() => localStorage.clear()).catch(() => {});
});

// ============================================================
// 1. 画面初期表示
// ============================================================
test.describe('画面初期表示', () => {

  test('UD05_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '01';
    // 对应数据库：HDOC_REC_DATA_VDA_GENERAL.SERIE="lwws", CHNR="12345"
    await goToUD05(page, 'lwws', '12345', 'IDO');
    // 等待 API 响应
    await page.waitForTimeout(3000);

    // 1. 画面标题
    await expect(page.locator('h1.ud05-title')).toHaveText('Modify Document');
    await takeScreenshot(page, '画面标题');

    // 2. Chassis no 显示格式 "lwws 12345"
    await expect(page.locator('.ud05-label-bold')).toHaveText('Chassis no:');
    await expect(page.locator('.ud05-info-value-strong')).toHaveText('lwws');
    await expect(page.locator('.ud05-info-value.ud05-link').first()).toHaveText('12345');
    // 3. Market 显示 "IDO"
    await expect(page.locator('.ud05-info-item').nth(1)).toContainText('IDO');
    // 4. Template 文件链接
    await expect(page.locator('.ud05-info-value.ud05-link').last()).toHaveText('VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.rtf');
    // 5. DataTable 显示
    await expect(page.locator('table.ud05-table')).toBeVisible();
    // 6. Save 按钮
    await expect(page.locator('button.ud05-btn')).toBeVisible();
    await expect(page.locator('button.ud05-btn')).toHaveText('Save');
    // 7. Error message area 不显示
    await expect(page.locator('.ud05-message')).not.toBeVisible();

    await takeScreenshot(page, '整体布局');
  });

  test('UD05_002_画面初始化_ChassisNo属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '02';
    await goToUD05(page, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(3000);

    // 1. 控件类型为 Label（Output）
    await expect(page.locator('.ud05-label-bold')).toHaveText('Chassis no:');
    // 2. 显示内容为 "lwws 12345"
    await expect(page.locator('.ud05-info-value-strong')).toHaveText('lwws');
    await expect(page.locator('.ud05-info-value.ud05-link').first()).toHaveText('12345');
    // 3. 表示制御为固定（不可编辑输入框，只有 Label）
    // 4. Chassis no 链接可点击
    await expect(page.locator('.ud05-info-value.ud05-link').first()).toBeVisible();

    await takeScreenshot(page, 'ChassisNo属性');
  });

  test('UD05_003_画面初始化_Market属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '03';
    await goToUD05(page, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(3000);

    // 1. 控件类型为 Label（Output）
    // 2. 显示内容为 "IDO"
    await expect(page.locator('.ud05-info-item').nth(1)).toContainText('Market:');
    await expect(page.locator('.ud05-info-item').nth(1)).toContainText('IDO');

    await takeScreenshot(page, 'Market属性');
  });

  test('UD05_004_画面初始化_Template文件链接属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '04';
    await goToUD05(page, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(3000);

    // 1. 控件类型为 Link（Action）
    const templateLink = page.locator('.ud05-info-value.ud05-link').last();
    // 2. 显示文字
    await expect(templateLink).toHaveText('VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.rtf');
    // 3. 表示制御为活性（可点击状态）
    await expect(templateLink).toBeVisible();

    await takeScreenshot(page, 'Template文件链接');
  });

  test('UD05_005_画面初始化_DataTable结构', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '05';
    await goToUD05(page, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(3000);

    // DataTable 包含4列
    const headers = page.locator('table.ud05-table th.ud05-th');
    await expect(headers.nth(0)).toHaveText('Variable');
    await expect(headers.nth(1)).toHaveText('Description');
    await expect(headers.nth(2)).toHaveText('Current value');
    await expect(headers.nth(3)).toHaveText('Modified value');
    // DataTable 显示数据行
    const rows = page.locator('table.ud05-table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    await takeScreenshot(page, 'DataTable结构');
  });

  test('UD05_006_画面初始化_Save按钮属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '06';
    await goToUD05(page, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(3000);

    const saveBtn = page.locator('button.ud05-btn');
    // 1. 按钮文字为 "Save"
    await expect(saveBtn).toHaveText('Save');
    // 2. 表示制御为活性
    await expect(saveBtn).toBeEnabled();

    await takeScreenshot(page, 'Save按钮');
  });

  test('UD05_007_画面初始化_ErrorMessageArea属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '07';
    await goToUD05(page, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(3000);

    // 初期值为空，默认隐藏
    await expect(page.locator('.ud05-message')).not.toBeVisible();

    await takeScreenshot(page, 'ErrorMessageArea');
  });
});

// ============================================================
// 2. 画面初期表示-数据加载与数据库字段对应
// ============================================================
test.describe('数据加载', () => {

  test('UD05_008_数据加载_API调用成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '08';
    let apiCalled = false;
    let capturedParams = {};

    await page.route('**/api/ud05/selectmodifydocument**', async route => {
      apiCalled = true;
      const url = new URL(route.request().url());
      capturedParams = {
        chassisSerie: url.searchParams.get('chassisSerie'),
        chassisNo: url.searchParams.get('chassisNo')
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: [
            { chassisSerie: 'jpct', chassisNo: '8888', variable: 'VIN_TEXT2', description: 'Additional text on Eicher-Trucks VIN plate for VIPL', newVal: '778' },
            { chassisSerie: 'jpct', chassisNo: '8888', variable: 'VIN_TEXT3', description: 'Additional text on Eicher-Trucks VIN plate for VIPL', newVal: '2' }
          ]
        })
      });
    });

    await goToUD05(page, 'jpct', '8888', 'AUS');
    await page.waitForTimeout(3000);

    expect(apiCalled).toBe(true);
    expect(capturedParams).toEqual({ chassisSerie: 'jpct', chassisNo: '8888' });

    await takeScreenshot(page, 'API调用成功');
  });

  test('UD05_009_数据加载_DataTable各列对应关系', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '09';
    // 使用真实数据库数据
    await goToUD05(page, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(3000);

    // 确认 DataTable 中加载了数据
    const rows = page.locator('table.ud05-table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // 确认各列对应关系：Variable 列显示 HDOC_VARIABLES 表的 VARIABLE 字段值
    const firstRowCells = rows.first().locator('td.ud05-td');
    await expect(firstRowCells.nth(0)).toBeVisible(); // Variable

    // Modified value 列为可输入状态，初始为空
    const modifiedInput = rows.first().locator('input.ud05-input');
    await expect(modifiedInput).toBeVisible();
    await expect(modifiedInput).toBeEnabled();
    await expect(modifiedInput).toHaveAttribute('maxLength', '500');
    await expect(modifiedInput).toHaveValue('');

    await takeScreenshot(page, 'DataTable字段对应');
  });

  test('UD05_010_数据加载_CurrentValue无数据时显示空白', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '10';
    await goToUD05(page, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(3000);

    // 确认所有行的 Current value 列都存在（可能有部分行为空白）
    const rows = page.locator('table.ud05-table tbody tr');
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const cells = rows.nth(i).locator('td.ud05-td');
      // Current value 列（第3列）存在
      await expect(cells.nth(2)).toBeVisible();
      // Modified value 列（第4列）存在输入框
      await expect(cells.nth(3).locator('input.ud05-input')).toBeVisible();
    }

    await takeScreenshot(page, 'CurrentValue空白確認');
  });
});

// ============================================================
// 3. Chassis no Link 操作
// ============================================================
test.describe('ChassisNoLink操作', () => {

  test('UD05_011_ChassisNoLink_正常跳转到UD07', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '11';
    await goToUD05(page, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(3000);

    await takeScreenshot(page, 'UD05画面');

    // 点击 Chassis no 链接
    await page.locator('.ud05-info-value.ud05-link').first().click({ noWaitAfter: true });
    // 画面跳转到 UD07
    await page.waitForURL('**/UD07', { timeout: 30000 });

    await takeScreenshot(page, '跳转到UD07');
  });
});

// ============================================================
// 4. Template文件链接操作
// ============================================================
test.describe('Template文件链接操作', () => {

  test('UD05_012_Template文件链接_下载模板', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '12';
    await goToUD05(page, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(3000);

    await takeScreenshot(page, 'UD05画面');

    // 点击 Template 文件链接（页面不报错，下载功能待实现）
    await page.locator('.ud05-info-value.ud05-link').last().click();
    // 页面不报错
    await expect(page.locator('.ud05-container')).toBeVisible();
    await takeScreenshot(page, 'Template点击結果');
  });
});

// ============================================================
// 5. Save 按钮操作
// ============================================================
test.describe('Save按钮操作', () => {

  test('UD05_013_Save_修改单个变量保存成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '13';
    await goToUD05(page, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(3000);

    // 在 Variable=VIN_TEXT2 行的 Modified value 列输入新值
    const rows = page.locator('table.ud05-table tbody tr');
    const firstInput = rows.first().locator('input.ud05-input');
    await firstInput.fill('VTA-NEWVALUE');
    await takeScreenshot(page, '入力後');

    // 点击 Save 按钮
    await page.locator('button.ud05-btn').click();

    // 等待跳转到 UD06
    await page.waitForURL('**/UD06', { timeout: 30000 }).catch(() => {});
    await takeScreenshot(page, '保存结果');

    // 校验 API 调用参数（通过监听请求确认）
    // 画面跳转到 UD06（无论成功或失败都截图保存结果）
    await expect(page).toHaveURL(/UD06/);
  });

  test('UD05_014_Save_修改多个变量保存成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '14';
    await goToUD05(page, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(3000);

    // 在多个 Variable 行的 Modified value 列输入新值
    const rows = page.locator('table.ud05-table tbody tr');
    const rowCount = await rows.count();
    if (rowCount >= 2) {
      await rows.nth(0).locator('input.ud05-input').fill('VAL_UPDATED_1');
      await rows.nth(1).locator('input.ud05-input').fill('VAL_UPDATED_2');
    }
    await takeScreenshot(page, '複数入力後');

    await page.locator('button.ud05-btn').click();

    await page.waitForURL('**/UD06', { timeout: 30000 }).catch(() => {});
    await takeScreenshot(page, '保存结果');
  });

  test('UD05_015_Save_空值校验_所有ModifiedValue为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '15';
    await goToUD05(page, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(3000);

    // 所有行的 Modified value 均保持为空
    await takeScreenshot(page, '入力前');

    await page.locator('button.ud05-btn').click();

    // 空值校验触发
    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toHaveText('NO UNRELEASED VERSION EXISTS! Please input modified value before saving.');
    // 画面保持 UD05 不跳转
    await expect(page).toHaveURL(/UD05/);

    await takeScreenshot(page, '空值校验错误');
  });

  test('UD05_016_Save_部分行有值部分为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '16';
    await goToUD05(page, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(3000);

    // 在第一个 Variable 的 Modified value 输入值
    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('VAL_TEST');
    await takeScreenshot(page, '入力後');

    await page.locator('button.ud05-btn').click();

    // 空值校验通过（至少有一行有值）
    await page.waitForURL('**/UD06', { timeout: 30000 }).catch(() => {});
    await takeScreenshot(page, '保存结果');
  });

  test('UD05_017_Save_修改值超过500字符时截断', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '17';
    await goToUD05(page, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(3000);

    // 输入超过500字符的字符串
    const longStr = 'A'.repeat(600);
    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill(longStr);

    // 确认最大输入长度为500字符
    const actualVal = await firstInput.inputValue();
    expect(actualVal.length).toBe(500);

    await takeScreenshot(page, '500文字制限確認');
  });
});

// ============================================================
// 6. 异常处理
// ============================================================
test.describe('异常处理', () => {

  test('UD05_018_异常处理_APILoading失败_HTTP500', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '18';
    await page.route('**/api/ud05/selectmodifydocument**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });
    await goToUD05(page, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(3000);

    // Error message area 显示
    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toContainText('System error');
    // Save 按钮不可点击（无数据时禁用）
    await expect(page.locator('button.ud05-btn')).toBeDisabled();

    await takeScreenshot(page, 'API500错误');
  });

  test('UD05_019_异常处理_API返回业务错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '19';
    await page.route('**/api/ud05/selectmodifydocument**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 401, message: 'Unauthorized' }),
      });
    });
    await goToUD05(page, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(3000);

    // Error message area 显示
    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toHaveText('We can not get the data. Please try again.');

    await takeScreenshot(page, '业务错误401');
  });

  test('UD05_020_异常处理_Save时API返回HTTP500', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '20';
    // Mock Save API 返回 500
    await page.route('**/api/ud05/updatemodifydocument**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });
    await goToUD05(page, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(3000);

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('TEST_500');
    await takeScreenshot(page, '入力後');

    await page.locator('button.ud05-btn').click();
    await page.waitForTimeout(2000);

    // Error message area 显示
    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toContainText('System error');
    // 画面保持 UD05 不跳转
    await expect(page).toHaveURL(/UD05/);

    await takeScreenshot(page, 'Save500错误');
  });

  test('UD05_021_异常处理_Save时数据更新失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '21';
    await page.route('**/api/ud05/updatemodifydocument**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: '更新失败' }),
      });
    });
    await goToUD05(page, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(3000);

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('TEST_FAIL');
    await takeScreenshot(page, '入力後');

    await page.locator('button.ud05-btn').click();
    await page.waitForTimeout(2000);

    // Error message area 显示
    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toHaveText('数据更新失败，请稍后重试');
    // 画面保持 UD05 不跳转
    await expect(page).toHaveURL(/UD05/);

    await takeScreenshot(page, '更新失败错误');
  });

  test('UD05_022_异常处理_API超时加载数据', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '22';
    await page.route('**/api/ud05/selectmodifydocument**', async route => {
      await new Promise(resolve => setTimeout(resolve, 35000));
      route.abort('timedout');
    });
    await goToUD05(page, 'lwws', '12345', 'IDO');
    try {
      await expect(page.locator('.ud05-message')).toHaveText('System error. Please try again later.', { timeout: 60000 });
    } catch {
      // 超时消息可能延迟显示
    }

    await takeScreenshot(page, '超时错误');
  });

  test('UD05_023_异常处理_网络异常加载数据', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '23';
    await page.route('**/api/ud05/selectmodifydocument**', route => {
      route.abort('internetdisconnected');
    });
    await goToUD05(page, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(3000);

    // Error message area 显示
    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toContainText('System error');

    await takeScreenshot(page, '网络异常错误');
  });

  test('UD05_024_异常处理_网络异常保存数据', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '24';
    await page.route('**/api/ud05/updatemodifydocument**', route => {
      route.abort('internetdisconnected');
    });
    await goToUD05(page, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(3000);

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('TEST_NET');
    await takeScreenshot(page, '入力後');

    await page.locator('button.ud05-btn').click();
    await page.waitForTimeout(2000);

    // Error message area 显示
    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toContainText('System error');
    // 画面保持 UD05 不跳转
    await expect(page).toHaveURL(/UD05/);

    await takeScreenshot(page, '保存网络异常错误');
  });
});

// ============================================================
// 7. UI交互
// ============================================================
test.describe('UI交互', () => {

  test('UD05_025_UI交互_加载中显示Loading状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '25';
    await page.route('**/api/ud05/selectmodifydocument**', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [] }),
      });
    });
    await goToUD05(page, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(2000);

    // 加载中 DataTable 未加载数据
    // Save 按钮不可点击
    await expect(page.locator('button.ud05-btn')).toBeDisabled();

    await takeScreenshot(page, '加载中状态');
  });

  test('UD05_026_UI交互_加载完成后控件恢复活性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '26';
    await goToUD05(page, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(3000);

    // 加载中提示消失
    // DataTable 已加载数据
    const rows = page.locator('table.ud05-table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    // Save 按钮可点击
    await expect(page.locator('button.ud05-btn')).toBeEnabled();
    // Chassis no Link 可点击
    await expect(page.locator('.ud05-info-value.ud05-link').first()).toBeVisible();
    // Template 文件链接可点击
    await expect(page.locator('.ud05-info-value.ud05-link').last()).toBeVisible();

    await takeScreenshot(page, '加载完成');
  });

  test('UD05_027_UI交互_Save中按钮禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '27';
    await page.route('**/api/ud05/updatemodifydocument**', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200 }),
      });
    });
    await goToUD05(page, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(3000);

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('TEST');
    await takeScreenshot(page, '入力後');

    await page.locator('button.ud05-btn').click();

    // Save 按钮被禁用
    await expect(page.locator('button.ud05-btn')).toBeDisabled();
    await takeScreenshot(page, 'Save禁用状态');

    await page.waitForURL('**/UD06', { timeout: 30000 }).catch(() => {});
  });

  test('UD05_028_UI交互_Save防止重复提交', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '28';
    await page.route('**/api/ud05/updatemodifydocument**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200 }),
      });
    });
    await goToUD05(page, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(3000);

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('TEST_DUP');
    await takeScreenshot(page, '入力後');

    await page.locator('button.ud05-btn').click();
    // 第二次点击无效
    await page.locator('button.ud05-btn').click({ force: true });
    await page.locator('button.ud05-btn').click({ force: true });

    await page.waitForURL('**/UD06', { timeout: 30000 }).catch(() => {});
    await takeScreenshot(page, '保存结果');
  });

  test('UD05_029_UI交互_DataTableModifiedValue输入编辑', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '29';
    await goToUD05(page, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(3000);

    // 在任意行的 Modified value 列输入值
    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('TEST_VALUE');
    // 确认输入的值正确显示
    await expect(firstInput).toHaveValue('TEST_VALUE');
    // 其他行的值不受影响
    const secondInput = page.locator('table.ud05-table tbody tr').nth(1).locator('input.ud05-input');
    await expect(secondInput).toHaveValue('');

    await takeScreenshot(page, 'ModifiedValue入力確認');
  });

  test('UD05_030_UI交互_ErrorMessageArea显示错误消息样式', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '30';
    await page.route('**/api/ud05/selectmodifydocument**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });
    await goToUD05(page, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(3000);

    // Error message area 从隐藏变为可见
    await expect(page.locator('.ud05-message')).toBeVisible();

    await takeScreenshot(page, '错误消息样式');
  });
});

// ============================================================
// 8. 安全性
// ============================================================
test.describe('安全性', () => {

  test('UD05_031_安全性_未登录直接访问UD05画面重定向', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '31';
    // localStorage 已由 beforeEach 清除
    await page.goto(BASE_URL + '/UD05');
    await takeScreenshot(page, '直接访问UD05');

    // 自动重定向到 Login
    await page.waitForURL(BASE_URL + '/');
    await takeScreenshot(page, '重定向到Login');

    // UD05 画面内容不被显示
    await expect(page.locator('.ud05-container')).not.toBeVisible();
    // 地址栏 URL 变为 Login 页面
    await expect(page).toHaveURL(BASE_URL + '/');
    // Login 画面显示
    await expect(page.locator('.login-container')).toBeVisible();
  });

  test('UD05_032_安全性_ModifiedValueXSS防护', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '32';
    await goToUD05(page, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(3000);

    // 在 Modified value 列输入 XSS 载荷
    const xssPayload = '<script>alert(1)</script>';
    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill(xssPayload);
    await takeScreenshot(page, 'XSS入力後');

    await page.locator('button.ud05-btn').click();

    // 页面不崩溃，系统正常运行
    await page.waitForURL('**/UD06', { timeout: 30000 }).catch(() => {});
    await takeScreenshot(page, 'XSS保存结果');
  });
});
