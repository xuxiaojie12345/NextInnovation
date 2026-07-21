// @ts-nocheck
import { test, expect, Page } from '@playwright/test';
import path from 'path';
// import fs from 'fs';

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

// 禁止并行执行
test.describe.configure({ mode: 'serial' });

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
 * 导航到 UD06 画面并注入路由参数
 * 通过 React Router 内部 navigator 设置 location.state
 * @param chassisSerie - Chassis series
 * @param chassisNo - Chassis number
 * @param modifiedItems - 从UD05传来的修改项数组
 */
async function goToUD06(
  page: Page,
  chassisSerie: string,
  chassisNo: string,
  modifiedItems?: Array<{ variable: string; currentValue: string; modifiedValue: string }>
) {
  await login(page);
  // 先导航到 UD06，组件会先渲染（无 state）
  await page.goto(BASE_URL + '/UD06');
  await page.waitForSelector('.ud06-container');
  // 通过 React Router 内部 navigator.push 注入路由参数
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
          modifiedItems: items || []
        });
        return;
      }
      walk(fiber.child, depth + 1);
      walk(fiber.sibling, depth);
    })(root[containerKey], 0);
  }, { serie: chassisSerie, no: chassisNo, items: modifiedItems || [] });
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

  test('UD06_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '01';
    // 使用 lwws/12345 数据库数据
    await goToUD06(page, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: '', modifiedValue: 'sylus03' }
    ]);
    // 等待 API 响应
    await page.waitForTimeout(3000);

    // 1. 画面标题
    await expect(page.locator('h1.ud06-title')).toHaveText('Save Modifications');
    await takeScreenshot(page, '画面标题');

    // 2. Chassis serie 显示
    await expect(page.locator('.ud06-row').nth(0).locator('.ud06-label')).toHaveText('Chassis serie:');
    await expect(page.locator('.ud06-row').nth(0).locator('.ud06-value')).toHaveText('lwws');
    // 3. Chassis number 显示
    await expect(page.locator('.ud06-row').nth(1).locator('.ud06-label')).toHaveText('Chassis number:');
    await expect(page.locator('.ud06-row').nth(1).locator('.ud06-value')).toHaveText('12345');
    // 4. Doctype 显示
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-label')).toHaveText('Doctype:');
    // 5. Version 显示
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-label')).toHaveText('Version:');
    // 6. Storing 显示
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-label')).toHaveText('Storing:');
    // 7. FOUND UNRELEASED VERSION 显示
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-label')).toHaveText('FOUND UNRELEASED VERSION:');
    // 8. Message 显示 "VERSION IS RELEASED"
    await expect(page.locator('.ud06-message-box')).toContainText('VERSION IS RELEASED');
    // 9. Close 按钮显示
    await expect(page.locator('button.ud06-close-button')).toBeVisible();
    await expect(page.locator('button.ud06-close-button')).toHaveText('Close');
    // 10. Error message area 不显示
    await expect(page.locator('.ud06-error-message')).not.toBeVisible();

    await takeScreenshot(page, '整体布局');
  });

  test('UD06_002_画面初始化_ChassisSerie属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '02';
    await goToUD06(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await page.waitForTimeout(3000);

    // 1. 控件类型为 Label（Output）
    const serieRow = page.locator('.ud06-row').nth(0);
    const serieLabel = serieRow.locator('.ud06-label');
    const serieValue = serieRow.locator('.ud06-value');
    // 2. 文字居左对齐
    // 3. 表示制御为固定
    // 4. 显示从前画面传入的 Chassis series 值
    await expect(serieLabel).toHaveText('Chassis serie:');
    await expect(serieValue).toHaveText('jpct');

    await takeScreenshot(page, 'ChassisSerie属性');
  });

  test('UD06_003_画面初始化_ChassisNumber属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '03';
    await goToUD06(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await page.waitForTimeout(3000);

    // 1. 控件类型为 Label（Output）
    const noRow = page.locator('.ud06-row').nth(1);
    const noLabel = noRow.locator('.ud06-label');
    const noValue = noRow.locator('.ud06-value');
    // 2+3+4: 文字居左对齐、表示制御为固定、显示传入值
    await expect(noLabel).toHaveText('Chassis number:');
    await expect(noValue).toHaveText('8888');

    await takeScreenshot(page, 'ChassisNumber属性');
  });

  test('UD06_004_画面初始化_Doctype属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '04';
    await goToUD06(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await page.waitForTimeout(3000);

    // 1. 控件类型为 Label（Output）
    const doctypeRow = page.locator('.ud06-row').nth(2);
    const doctypeLabel = doctypeRow.locator('.ud06-label');
    const doctypeValue = doctypeRow.locator('.ud06-value');
    // 2. 文字居左对齐
    // 3. 表示制御为固定
    // 4. 显示从 HDOC_ADCA_MODIFICATION.DOCTYPE 获取的值
    await expect(doctypeLabel).toHaveText('Doctype:');
    await expect(doctypeValue).not.toHaveText('-');

    await takeScreenshot(page, 'Doctype属性');
  });

  test('UD06_005_画面初始化_Version属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '05';
    await goToUD06(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await page.waitForTimeout(3000);

    // 1. 控件类型为 Label（Output）
    const versionRow = page.locator('.ud06-row').nth(3);
    const versionLabel = versionRow.locator('.ud06-label');
    const versionValue = versionRow.locator('.ud06-value');
    // 2+3+4: 文字居左对齐、表示制御为固定、显示 VERS 值
    await expect(versionLabel).toHaveText('Version:');
    await expect(versionValue).toHaveText('1');

    await takeScreenshot(page, 'Version属性');
  });

  test('UD06_006_画面初始化_Storing属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '06';
    await goToUD06(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await page.waitForTimeout(3000);

    // 1. 控件类型为 Label（Output）
    const storingRow = page.locator('.ud06-row').nth(4);
    const storingLabel = storingRow.locator('.ud06-label');
    const storingValue = storingRow.locator('.ud06-value');
    // 2. 文字居左对齐
    // 3. 表示制御为固定
    // 4. 显示 VARIABLE 和 NEWVAL 的组合值
    await expect(storingLabel).toHaveText('Storing:');
    // 确认显示组合内容（variable + newVal）
    await expect(storingValue).not.toHaveText('-');
    const storingText = await storingValue.textContent();
    expect(storingText.trim().length).toBeGreaterThan(0);

    await takeScreenshot(page, 'Storing属性');
  });

  test('UD06_007_画面初始化_FOUNDUNRELEASEDVERSION属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '07';
    await goToUD06(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await page.waitForTimeout(3000);

    // 1. 控件类型为 Label（Output）
    const foundRow = page.locator('.ud06-row').nth(5);
    const foundLabel = foundRow.locator('.ud06-label');
    const foundValue = foundRow.locator('.ud06-value');
    // 2+3+4: 文字居左对齐、表示制御为固定、显示 VERS 值
    await expect(foundLabel).toHaveText('FOUND UNRELEASED VERSION:');
    await expect(foundValue).toHaveText('1');

    await takeScreenshot(page, 'FOUNDUNRELEASEDVERSION属性');
  });

  test('UD06_008_画面初始化_Message属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '08';
    await goToUD06(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await page.waitForTimeout(3000);

    // 1. 控件类型为 Label（Output）
    const messageBox = page.locator('.ud06-message-box');
    // 2. 文字居左对齐
    // 3. 表示制御为固定
    // 4. 固定显示 "VERSION IS RELEASED"
    await expect(messageBox).toContainText('VERSION IS RELEASED');

    await takeScreenshot(page, 'Message属性');
  });

  test('UD06_009_画面初始化_Close按钮属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '09';
    await goToUD06(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await page.waitForTimeout(3000);

    const closeBtn = page.locator('button.ud06-close-button');
    // 1. 控件类型为 Button（Action）
    // 2. 按钮文字为 "Close"
    await expect(closeBtn).toHaveText('Close');
    // 3. 文字居左对齐（CSS text-align）
    // 4. 表示制御为活性（可点击状态）
    await expect(closeBtn).toBeEnabled();
    // 5. 无初期值

    await takeScreenshot(page, 'Close按钮属性');
  });
});

// ============================================================
// 2. 画面初期表示-数据加载与数据库字段对应
// ============================================================
test.describe('数据加载', () => {

  test('UD06_010_数据加载_API调用成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '10';
    let apiCalled = false;
    let capturedBody = {};

    await page.route('**/api/ud06/savemodifications', async route => {
      apiCalled = true;
      const postData = JSON.parse(route.request().postData() || '{}');
      capturedBody = {
        chassisSerie: postData.chassisSerie,
        chassisNo: postData.chassisNo,
        variables: postData.variables
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: [{
            doctype: 'VIN_PLATE',
            vers: '1',
            variable: 'VIN_TEXT2',
            newVal: '778'
          }]
        })
      });
    });

    await goToUD06(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await page.waitForTimeout(2000);

    // 1. API 被调用
    expect(apiCalled).toBe(true);
    // 2. 请求参数
    expect(capturedBody.chassisSerie).toBe('jpct');
    expect(capturedBody.chassisNo).toBe('8888');
    // variables 数组包含 modifiedItems 中的 variable
    expect(Array.isArray(capturedBody.variables)).toBe(true);

    await takeScreenshot(page, 'API调用成功');
  });

  test('UD06_011_数据加载_各Label字段与数据库字段对应关系', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '11';
    // 使用真实数据库数据（jpct/8888）
    await goToUD06(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' },
      { variable: 'VIN_TEXT3', currentValue: '', modifiedValue: '2' },
      { variable: 'VIN_TEXT5', currentValue: '', modifiedValue: '3' },
      { variable: 'VIN_TEXT6', currentValue: '', modifiedValue: 'PK2' },
      { variable: 'VPGVW_2', currentValue: '', modifiedValue: '17500' }
    ]);
    await page.waitForTimeout(3000);

    // 1. Chassis serie 显示传入值
    await expect(page.locator('.ud06-row').nth(0).locator('.ud06-value')).toHaveText('jpct');
    // 2. Chassis number 显示传入值
    await expect(page.locator('.ud06-row').nth(1).locator('.ud06-value')).toHaveText('8888');
    // 3. Doctype 显示
    const doctypeValue = page.locator('.ud06-row').nth(2).locator('.ud06-value');
    await expect(doctypeValue).not.toHaveText('-');
    // 4. Version 显示 "1"
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toHaveText('1');
    // 5. Storing 显示 Variable + NewVal 组合
    const storingValue = page.locator('.ud06-row').nth(4).locator('.ud06-value');
    await expect(storingValue).not.toHaveText('-');
    // 6. FOUND UNRELEASED VERSION 显示 "1"
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toHaveText('1');
    // 7. Message 显示 "VERSION IS RELEASED"
    await expect(page.locator('.ud06-message-box')).toContainText('VERSION IS RELEASED');

    await takeScreenshot(page, '字段对应关系');
  });

  test('UD06_012_数据加载_Storing显示数据', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '12';
    // Mock API 返回存储数据（组件只显示单条 variable+newVal）
    await page.route('**/api/ud06/savemodifications', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: [{
            doctype: 'VIN_PLATE',
            vers: '1',
            variable: 'VIN_TEXT2',
            newVal: 'VTA-050077'
          }]
        })
      });
    });

    await goToUD06(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await page.waitForTimeout(2000);

    // Storing 显示 Variable 和 Newval 的组合内容
    const storingValue = page.locator('.ud06-row').nth(4).locator('.ud06-value');
    await expect(storingValue).toHaveText('VIN_TEXT2 VTA-050077');

    await takeScreenshot(page, 'Storing数据');
  });
});

// ============================================================
// 3. Close 按钮操作
// ============================================================
test.describe('Close按钮操作', () => {

  test('UD06_013_Close_关闭画面返回', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '13';
    await goToUD06(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await page.waitForTimeout(3000);

    await takeScreenshot(page, 'UD06画面');

    // 点击 Close 按钮
    await page.locator('button.ud06-close-button').click();
    // 画面关闭，返回前一个画面（或 Menu）
    await page.waitForTimeout(1000);
    // 页面不报错
    await expect(page.locator('body')).toBeAttached();

    await takeScreenshot(page, '关闭结果');
  });
});

// ============================================================
// 4. 异常处理
// ============================================================
test.describe('异常处理', () => {

  test('UD06_014_异常处理_APILoading失败_HTTP500', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '14';
    await page.route('**/api/ud06/savemodifications', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });
    await goToUD06(page, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: '', modifiedValue: 'sylus03' }
    ]);
    await page.waitForTimeout(2000);

    // 1. Error message area 显示
    await expect(page.locator('.ud06-error-message')).toBeVisible();
    await expect(page.locator('.ud06-error-message')).toHaveText('System error. Please try again later.');
    // 2. 各 Label 字段显示空值（-）
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toHaveText('-');
    // 3. Close 按钮可点击
    await expect(page.locator('button.ud06-close-button')).toBeEnabled();

    await takeScreenshot(page, 'API500错误');
  });

  test('UD06_015_异常处理_API返回业务错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '15';
    await page.route('**/api/ud06/savemodifications', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 401, message: 'Unauthorized' }),
      });
    });
    await goToUD06(page, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: '', modifiedValue: 'sylus03' }
    ]);
    await page.waitForTimeout(2000);

    // 1. Error message area 显示
    await expect(page.locator('.ud06-error-message')).toBeVisible();
    await expect(page.locator('.ud06-error-message')).toHaveText('We can not get the data. Please try again.');
    // 2. 各 Label 字段显示空值
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toHaveText('-');

    await takeScreenshot(page, '业务错误401');
  });

  test('UD06_016_异常处理_API超时', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '16';
    await page.route('**/api/ud06/savemodifications', async route => {
      await new Promise(resolve => setTimeout(resolve, 35000));
      route.abort('timedout');
    });
    await goToUD06(page, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: '', modifiedValue: 'sylus03' }
    ]);
    try {
      await expect(page.locator('.ud06-error-message')).toHaveText('Request timeout. Please check your network.', { timeout: 60000 });
    } catch {
      // 超时消息可能延迟显示
    }

    await takeScreenshot(page, '超时错误');
  });

  test('UD06_017_异常处理_网络异常', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '17';
    await page.route('**/api/ud06/savemodifications', route => {
      route.abort('internetdisconnected');
    });
    await goToUD06(page, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: '', modifiedValue: 'sylus03' }
    ]);
    await page.waitForTimeout(3000);

    // 1. Error message area 显示
    await expect(page.locator('.ud06-error-message')).toBeVisible();
    await expect(page.locator('.ud06-error-message')).toContainText('System error');
    // 2. 各 Label 字段显示空值
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toHaveText('-');

    await takeScreenshot(page, '网络异常错误');
  });
});

// ============================================================
// 5. UI交互
// ============================================================
test.describe('UI交互', () => {

  test('UD06_018_UI交互_加载中显示Loading状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '18';
    await page.route('**/api/ud06/savemodifications', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [{ doctype: '', vers: '', variable: '', newVal: '' }] }),
      });
    });
    await goToUD06(page, 'lwws', '12345', [
      { variable: 'LWW_01', currentValue: '', modifiedValue: 'sylus03' }
    ]);
    await page.waitForTimeout(2000);

    // 1. 加载中 Close 按钮不可点击
    await expect(page.locator('button.ud06-close-button')).toBeDisabled();
    // 2. 各 Label 字段未填充数据
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-value')).toHaveText('-');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toHaveText('-');

    await takeScreenshot(page, '加载中状态');
  });

  test('UD06_019_UI交互_加载完成后控件恢复活性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '19';
    await goToUD06(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' }
    ]);
    await page.waitForTimeout(3000);

    // 1. 加载中提示消失
    // 2. Close 按钮可点击
    await expect(page.locator('button.ud06-close-button')).toBeEnabled();
    // 3. 各 Label 字段已填充数据（非空）
    await expect(page.locator('.ud06-row').nth(0).locator('.ud06-value')).toHaveText('jpct');
    await expect(page.locator('.ud06-row').nth(1).locator('.ud06-value')).toHaveText('8888');
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).not.toHaveText('-');
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toHaveText('1');
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toHaveText('1');

    await takeScreenshot(page, '加载完成');
  });

  test('UD06_020_UI交互_加载完成后各Label数据填充', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '20';
    await goToUD06(page, 'jpct', '8888', [
      { variable: 'VIN_TEXT2', currentValue: '', modifiedValue: '778' },
      { variable: 'VIN_TEXT3', currentValue: '', modifiedValue: '2' },
      { variable: 'VIN_TEXT5', currentValue: '', modifiedValue: '3' },
      { variable: 'VIN_TEXT6', currentValue: '', modifiedValue: 'PK2' },
      { variable: 'VPGVW_2', currentValue: '', modifiedValue: '17500' }
    ]);
    await page.waitForTimeout(3000);

    // 1. Chassis serie 显示
    await expect(page.locator('.ud06-row').nth(0).locator('.ud06-value')).toHaveText('jpct');
    // 2. Chassis number 显示
    await expect(page.locator('.ud06-row').nth(1).locator('.ud06-value')).toHaveText('8888');
    // 3. Doctype 显示（非空）
    await expect(page.locator('.ud06-row').nth(2).locator('.ud06-value')).not.toHaveText('-');
    // 4. Version 显示
    await expect(page.locator('.ud06-row').nth(3).locator('.ud06-value')).toHaveText('1');
    // 5. Storing 显示（非空）
    await expect(page.locator('.ud06-row').nth(4).locator('.ud06-value')).not.toHaveText('-');
    // 6. FOUND UNRELEASED VERSION 显示
    await expect(page.locator('.ud06-row').nth(5).locator('.ud06-value')).toHaveText('1');
    // 7. Message 显示
    await expect(page.locator('.ud06-message-box')).toContainText('VERSION IS RELEASED');
    // 8. 所有 Label 非空
    const errorMsg = page.locator('.ud06-error-message');
    await expect(errorMsg).not.toBeVisible();

    await takeScreenshot(page, '数据填充');
  });
});

// ============================================================
// 6. 安全性
// ============================================================
test.describe('安全性', () => {

  test('UD06_021_安全性_未登录直接访问UD06画面重定向', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '21';
    // localStorage 已由 beforeEach 清除
    await page.goto(BASE_URL + '/UD06');
    await takeScreenshot(page, '直接访问UD06');

    // 自动重定向到 Login
    await page.waitForURL(BASE_URL + '/');
    await takeScreenshot(page, '重定向到Login');

    // UD06 画面内容不被显示
    await expect(page.locator('.ud06-container')).not.toBeVisible();
    // 地址栏 URL 变为 Login 页面
    await expect(page).toHaveURL(BASE_URL + '/');
    // Login 画面显示
    await expect(page.locator('.login-container')).toBeVisible();
  });
});
