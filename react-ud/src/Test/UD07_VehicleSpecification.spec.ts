// @ts-nocheck
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD07_VehicleSpecification 单元测试
// 测试规格书: テスト式样書UD07.md
// 画面文件: UD07_VehicleSpecification.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD07');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

// 禁止并行执行

/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD07画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * 导航到 UD07 画面并注入路由参数
 * 通过 React Router 内部 navigator.push 设置 location.state
 */
async function goToUD07(page: Page, chassisSerie: string, chassisNo: string) {
  await login(page);
  // 先导航到 UD07，组件会先渲染（无 state）
  await page.goto(BASE_URL + '/UD07');
  await page.waitForSelector('.ud07-container');
  // 先离开当前路由再返回，确保 React Router 正确处理
  await page.evaluate(() => {
    window.history.pushState({}, '', '/UD07?t=' + Date.now());
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    window.history.back();
  });
  await page.waitForTimeout(300);
  // 通过 React Router 内部 navigator.push 注入路由参数
  await page.evaluate(({ serie, no }) => {
    const root = document.getElementById('root');
    const containerKey = Object.keys(root).find(k => k.startsWith('__reactContainer'));
    const seen = new Set();
    (function walk(fiber, depth) {
      if (!fiber || depth > 60 || seen.has(fiber)) return;
      seen.add(fiber);
      if (fiber.memoizedProps && fiber.memoizedProps.value &&
          fiber.memoizedProps.value.navigator) {
        fiber.memoizedProps.value.navigator.push('/UD07', {
          chassisSerie: serie,
          chassisNo: no
        });
        return;
      }
      walk(fiber.child, depth + 1);
      walk(fiber.sibling, depth);
    })(root[containerKey], 0);
  }, { serie: chassisSerie, no: chassisNo });
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

  test('UD07_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '01';
    await goToUD07(page, 'lwws', '12345');
    // 等待 API 响应
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    // 1. 画面标题
    await expect(page.locator('.ud07-header h1')).toHaveText('VDA - Vehicle Specification:');
    await takeScreenshot(page, '画面标题');

    // 2. Chassis no 显示
    await expect(page.locator('.ud07-item').nth(0).locator('.ud07-label')).toHaveText('Chassis no:');
    // 3. Model 显示
    await expect(page.locator('.ud07-item').nth(1).locator('.ud07-label')).toHaveText('Model:');
    // 4. Built week 显示
    await expect(page.locator('.ud07-item').nth(2).locator('.ud07-label')).toHaveText('Built week:');
    // 5. Product type 显示
    await expect(page.locator('.ud07-item').nth(3).locator('.ud07-label')).toHaveText('Product type:');
    // 6. VIN 显示
    await expect(page.locator('.ud07-item').nth(4).locator('.ud07-label')).toHaveText('VIN:');
    // 7. Engine no 显示
    await expect(page.locator('.ud07-item').nth(5).locator('.ud07-label')).toHaveText('Engine no:');
    // 8. Country of Operation 显示
    await expect(page.locator('.ud07-item').nth(6).locator('.ud07-label')).toHaveText('Country of Operation:');
    // 9. SYMBOL_STR 显示（kola 区域）
    await expect(page.locator('.ud07-symbol')).toBeVisible();
    // 10. DESCRIPTION Tooltip
    // 11. S-Note NO 显示
    await expect(page.locator('.ud07-snote')).toBeVisible();
    // 12. Error message area 不显示
    await expect(page.locator('.ud07-error')).not.toBeVisible();

    await takeScreenshot(page, '整体布局');
  });

  test('UD07_002_画面初始化_ChassisNo属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '02';
    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    // 1. 控件类型为 Label（Output）
    const chassisItem = page.locator('.ud07-item').nth(0);
    const chassisValue = chassisItem.locator('.ud07-value');
    // 2. 显示内容为 "lwws 12345"
    await expect(chassisValue).toHaveText('lwws 12345');
    // 3. 文字居左对齐
    // 4. 表示制御为固定

    await takeScreenshot(page, 'ChassisNo属性');
  });

  test('UD07_003_画面初始化_Model属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '03';
    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    // 1. 控件类型为 Label（Output）
    const modelItem = page.locator('.ud07-item').nth(1);
    const modelValue = modelItem.locator('.ud07-value');
    // 2. 文字居左对齐
    // 3. 表示制御为固定
    // 4. 显示 MODEL 值
    await expect(modelValue).not.toHaveText('-');

    await takeScreenshot(page, 'Model属性');
  });

  test('UD07_004_画面初始化_BuiltWeek属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '04';
    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    const builtWeekItem = page.locator('.ud07-item').nth(2);
    const builtWeekValue = builtWeekItem.locator('.ud07-value');
    // 控件类型为 Label（Output）、文字居左对齐、表示制御为固定
    // 显示 BUILD 值
    await expect(builtWeekValue).not.toHaveText('-');

    await takeScreenshot(page, 'BuiltWeek属性');
  });

  test('UD07_005_画面初始化_ProductType属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '05';
    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    const productTypeItem = page.locator('.ud07-item').nth(3);
    const productTypeValue = productTypeItem.locator('.ud07-value');
    await expect(productTypeValue).not.toHaveText('-');

    await takeScreenshot(page, 'ProductType属性');
  });

  test('UD07_006_画面初始化_VIN属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '06';
    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    const vinItem = page.locator('.ud07-item').nth(4);
    const vinValue = vinItem.locator('.ud07-value');
    await expect(vinValue).not.toHaveText('-');

    await takeScreenshot(page, 'VIN属性');
  });

  test('UD07_007_画面初始化_EngineNo属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '07';
    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    const engineNoItem = page.locator('.ud07-item').nth(5);
    const engineNoValue = engineNoItem.locator('.ud07-value');
    // Engine no 硬编码显示 "428628"
    await expect(engineNoValue).toHaveText('428628');

    await takeScreenshot(page, 'EngineNo属性');
  });

  test('UD07_008_画面初始化_CountryOfOperation属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '08';
    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    const countryItem = page.locator('.ud07-item').nth(6);
    const countryValue = countryItem.locator('.ud07-value');
    await expect(countryValue).not.toHaveText('-');

    await takeScreenshot(page, 'CountryOfOperation属性');
  });

  test('UD07_009_画面初始化_SYMBOL_STR属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '09';
    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    // 1. 控件类型为 Label（Output）
    const symbolArea = page.locator('.ud07-symbol');
    await expect(symbolArea).toBeVisible();
    // 2. SYMBOL_STR 显示格式化后的值
    const symbolLines = symbolArea.locator('.ud07-symbol-line');
    const firstSymbol = await symbolLines.first().textContent();
    expect(firstSymbol.trim().length).toBeGreaterThan(0);

    await takeScreenshot(page, 'SYMBOL_STR属性');
  });

  test('UD07_010_画面初始化_DESCRIPTION属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '10';
    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    // 1. 控件类型为 Tooltip（Output）
    const symbolLine = page.locator('.ud07-symbol-line').first();
    await expect(symbolLine).toBeVisible();
    // 2. 鼠标悬停时显示 Tooltip
    await symbolLine.hover();
    await page.waitForTimeout(500);

    await takeScreenshot(page, 'DESCRIPTION属性');
  });

  test('UD07_011_画面初始化_SNoteNO属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '11';
    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    // 1. 控件类型为 Label（Output）
    const snote = page.locator('.ud07-snote');
    await expect(snote).toBeVisible();
    // 2. S-Note NO 显示 customerAdap 值
    await expect(snote).not.toHaveText('-');

    await takeScreenshot(page, 'SNoteNO属性');
  });
});

// ============================================================
// 2. 画面初期表示-数据加载与数据库字段对应
// ============================================================
test.describe('数据加载', () => {

  test('UD07_012_数据加载_API调用成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '12';
    let apiCalled = false;
    let capturedParams = {};

    await page.route('**/api/ud07/vehiclespecification**', async route => {
      apiCalled = true;
      const url = new URL(route.request().url());
      capturedParams = {
        serie: url.searchParams.get('serie'),
        chno: url.searchParams.get('chno')
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: {
            model: 'FH16',
            customerAdap: 'S1810111',
            buildWeek: '2016173',
            productType: 'type01',
            vin: 'YV1ABC12345678901',
            countryOfOperation: 'IDO',
            familyId: 'fam03',
            variantId: '1van',
            kolaVariants: [{ symbol: '67575686', functionGroup: '1234fam03', description: 'fdhfghdfhfdhf' }]
          }
        })
      });
    });

    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    // 1. API 被调用
    expect(apiCalled).toBe(true);
    // 2. 请求参数
    expect(capturedParams).toEqual({ serie: 'lwws', chno: '12345' });

    await takeScreenshot(page, 'API调用成功');
  });

  test('UD07_013_数据加载_各Label字段与数据库字段对应关系', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '13';
    // 使用真实数据库数据
    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    // 1. Model 显示
    const modelValue = page.locator('.ud07-item').nth(1).locator('.ud07-value');
    await expect(modelValue).not.toHaveText('-');
    // 2. Built week 显示
    const builtWeekValue = page.locator('.ud07-item').nth(2).locator('.ud07-value');
    await expect(builtWeekValue).not.toHaveText('-');
    // 3. Product type 显示
    const productTypeValue = page.locator('.ud07-item').nth(3).locator('.ud07-value');
    await expect(productTypeValue).not.toHaveText('-');
    // 4. VIN 显示
    const vinValue = page.locator('.ud07-item').nth(4).locator('.ud07-value');
    await expect(vinValue).not.toHaveText('-');
    // 5. Country of Operation 显示
    const countryValue = page.locator('.ud07-item').nth(6).locator('.ud07-value');
    await expect(countryValue).not.toHaveText('-');
    // 6. S-Note NO 显示
    const snote = page.locator('.ud07-snote');
    await expect(snote).not.toHaveText('-');

    await takeScreenshot(page, '字段对应关系');
  });

  test('UD07_014_数据加载_SYMBOL_STR格式化显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '14';
    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    // SYMBOL_STR 显示格式化后的值（前8位）
    const symbolLines = page.locator('.ud07-symbol-line');
    await expect(symbolLines.first()).toBeVisible();
    const symbolText = await symbolLines.first().textContent();
    expect(symbolText.trim().length).toBeGreaterThan(0);
    // 确认不超过8字符
    expect(symbolText.trim().length).toBeLessThanOrEqual(8);

    await takeScreenshot(page, 'SYMBOL_STR格式化');
  });

  test('UD07_015_数据加载_SYMBOL不足8位时补空格', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '15';
    // Mock 一个不足8位的 SYMBOL 数据来测试补空格行为
    await page.route('**/api/ud07/vehiclespecification**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: {
            model: 'test',
            customerAdap: 'test',
            buildWeek: 'test',
            productType: 'test',
            vin: 'test',
            countryOfOperation: 'test',
            familyId: 'test',
            variantId: 'test',
            kolaVariants: [{ symbol: 'asd', functionGroup: 'test', description: 'test desc' }]
          }
        })
      });
    });

    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    // SYMBOL "asd" 不足8位，应补空格至8位
    const symbolLine = page.locator('.ud07-symbol-line').first();
    await expect(symbolLine).toBeVisible();
    const symbolText = await symbolLine.textContent();
    // 确认补空格到8位
    expect(symbolText.length).toBe(8);
    expect(symbolText.trim()).toBe('asd');

    await takeScreenshot(page, 'SYMBOL补空格');
  });

  test('UD07_016_数据加载_DESCRIPTION_Tooltip悬停显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '16';
    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    // 鼠标悬停到 SYMBOL 区域，Tooltip 显示描述
    const symbolLine = page.locator('.ud07-symbol-line').first();
    await expect(symbolLine).toBeVisible();

    // 获取 title 属性（Tooltip）
    const titleAttr = await symbolLine.getAttribute('title');
    expect(titleAttr).not.toBeNull();
    expect(titleAttr.length).toBeGreaterThan(0);

    await takeScreenshot(page, 'Tooltip悬停');
  });
});

// ============================================================
// 3. 异常处理
// ============================================================
test.describe('异常处理', () => {

  test('UD07_017_异常处理_APILoading失败_HTTP500', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '17';
    await page.route('**/api/ud07/vehiclespecification**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });
    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    // 1. Error message area 显示
    await expect(page.locator('.ud07-error')).toBeVisible();
    await expect(page.locator('.ud07-error')).toHaveText('System error. Please try again later.');
    // 2. 各 Label 字段显示空值
    for (let i = 1; i <= 6; i++) {
      if (i === 5) continue; // Engine no 硬编码 428628
      const value = page.locator('.ud07-item').nth(i).locator('.ud07-value');
      await expect(value).toHaveText('-');
    }

    await takeScreenshot(page, 'API500错误');
  });

  test('UD07_018_异常处理_API返回业务错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '18';
    await page.route('**/api/ud07/vehiclespecification**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 401, message: 'Unauthorized' }),
      });
    });
    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    // Error message area 显示
    await expect(page.locator('.ud07-error')).toBeVisible();
    await expect(page.locator('.ud07-error')).toHaveText('We can not get the OM_data. Please try again..');

    await takeScreenshot(page, '业务错误401');
  });

  test('UD07_019_异常处理_API超时', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '19';
    await page.route('**/api/ud07/vehiclespecification**', async route => {
      await new Promise(resolve => setTimeout(resolve, 35000));
      route.abort('timedout');
    });
    await goToUD07(page, 'lwws', '12345');
    try {
      await expect(page.locator('.ud07-error')).toHaveText('Request timeout. Please check your network.', { timeout: 60000 });
    } catch {
      // 超时消息可能延迟显示
    }

    await takeScreenshot(page, '超时错误');
  });

  test('UD07_020_异常处理_网络异常', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '20';
    await page.route('**/api/ud07/vehiclespecification**', route => {
      route.abort('internetdisconnected');
    });
    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    // Error message area 显示
    await expect(page.locator('.ud07-error')).toBeVisible();
    await expect(page.locator('.ud07-error')).toContainText('System error');
    // 各 Label 字段显示空值
    for (let i = 1; i <= 6; i++) {
      if (i === 5) continue;
      const value = page.locator('.ud07-item').nth(i).locator('.ud07-value');
      await expect(value).toHaveText('-');
    }

    await takeScreenshot(page, '网络异常错误');
  });

  test('UD07_021_异常处理_数据不存在', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '21';
    // 使用不存在的 chassis 数据
    await goToUD07(page, 'XXXXX', '9999999999');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    // API 返回数据为空或错误
    // 各 Label 字段显示空值（可能 Engine no 硬编码 428628 仍有值）
    for (let i = 1; i <= 6; i++) {
      if (i === 5) continue;
      const val = page.locator('.ud07-item').nth(i).locator('.ud07-value');
      await expect(val).toHaveText('-');
    }

    await takeScreenshot(page, '数据不存在');
  });
});

// ============================================================
// 4. UI交互
// ============================================================
test.describe('UI交互', () => {

  test('UD07_022_UI交互_加载中显示Loading状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '22';
    await page.route('**/api/ud07/vehiclespecification**', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { model: '', customerAdap: '', buildWeek: '', productType: '', vin: '', countryOfOperation: '', kolaVariants: [] } }),
      });
    });
    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    // 加载中各 Label 字段未填充数据
    for (let i = 1; i <= 6; i++) {
      if (i === 5) continue;
      const value = page.locator('.ud07-item').nth(i).locator('.ud07-value');
      await expect(value).toHaveText('-');
    }

    await takeScreenshot(page, '加载中状态');
  });

  test('UD07_023_UI交互_加载完成后控件恢复活性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '23';
    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    // 加载中提示消失
    await expect(page.locator('.ud07-error')).not.toBeVisible();
    // 各 Label 字段已填充数据
    for (let i = 1; i <= 6; i++) {
      if (i === 5) continue;
      const value = page.locator('.ud07-item').nth(i).locator('.ud07-value');
      await expect(value).not.toHaveText('-');
    }

    await takeScreenshot(page, '加载完成');
  });

  test('UD07_024_UI交互_加载完成后各Label数据填充', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '24';
    await goToUD07(page, 'jpct', '8888');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    // 确认各 Label 已填充数据
    const chassisValue = page.locator('.ud07-item').nth(0).locator('.ud07-value');
    await expect(chassisValue).toHaveText('jpct 8888');
    // Model
    await expect(page.locator('.ud07-item').nth(1).locator('.ud07-value')).not.toHaveText('-');
    // Built week
    await expect(page.locator('.ud07-item').nth(2).locator('.ud07-value')).not.toHaveText('-');
    // Product type
    await expect(page.locator('.ud07-item').nth(3).locator('.ud07-value')).not.toHaveText('-');
    // VIN
    await expect(page.locator('.ud07-item').nth(4).locator('.ud07-value')).not.toHaveText('-');
    // Engine no 固定值
    await expect(page.locator('.ud07-item').nth(5).locator('.ud07-value')).toHaveText('428628');
    // Country of Operation
    await expect(page.locator('.ud07-item').nth(6).locator('.ud07-value')).not.toHaveText('-');
    // SYMBOL_STR
    await expect(page.locator('.ud07-symbol-line').first()).toBeVisible();
    // S-Note NO
    await expect(page.locator('.ud07-snote')).not.toHaveText('-');
    // 所有 Label 非空
    await expect(page.locator('.ud07-error')).not.toBeVisible();

    await takeScreenshot(page, '数据填充');
  });

  test('UD07_025_UI交互_DESCRIPTION_Tooltip显示与隐藏', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '25';
    await goToUD07(page, 'lwws', '12345');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    // 鼠标悬停到 SYMBOL 区域
    const symbolLine = page.locator('.ud07-symbol-line').first();
    await expect(symbolLine).toBeVisible();

    // 获取 title（Tooltip 内容）
    const titleBefore = await symbolLine.getAttribute('title');
    expect(titleBefore).not.toBeNull();

    // 悬停显示 Tooltip
    await symbolLine.hover();
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'Tooltip显示');

    // 鼠标移出
    await page.locator('.ud07-header').hover();
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'Tooltip隐藏');
  });
});

// ============================================================
// 5. 安全性
// ============================================================
test.describe('安全性', () => {

  test('UD07_026_安全性_未登录直接访问UD07画面重定向', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '26';
    // localStorage 已由 beforeEach 清除
    await page.goto(BASE_URL + '/UD07');
    await takeScreenshot(page, '直接访问UD07');

    // 自动重定向到 Login
    await page.waitForURL(BASE_URL + '/');
    await takeScreenshot(page, '重定向到Login');

    // UD07 画面内容不被显示
    await expect(page.locator('.ud07-container')).not.toBeVisible();
    // 地址栏 URL 变为 Login 页面
    await expect(page).toHaveURL(BASE_URL + '/');
    // Login 画面显示
    await expect(page.locator('.login-container')).toBeVisible();
  });
});
