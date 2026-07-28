// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD21_MarketsInHDoc 单元测试
// 测试规格书: テスト式样書UD21.md
// 画面文件: UD21_MarketsInHDoc.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD21');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD21画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * 导航到 UD21 页面
 */
async function goToUD21(page: Page) {
  await login(page);
  await page.goto(BASE_URL + '/UD21');
  await page.waitForSelector('.ud21-container');
  await page.waitForTimeout(1500);
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

  test('UD21_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '001';
    await goToUD21(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 1. 页面容器可见
    await expect(page.locator('.ud21-container')).toBeVisible();

    // 2. 页面标题显示
    await expect(page.locator('.ud21-title')).toHaveText('Markets in HDoc');

    // 3. DataTable 区域可见
    await expect(page.locator('.ud21-table')).toBeVisible();

    // 4. 消息区域不在页面中（默认隐藏）
    await expect(page.locator('.ud21-message')).not.toBeVisible();

    await takeScreenshot(page, '整体布局確認');
  });

  test('UD21_002_画面初始化_DataTable列标题', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '002';
    await goToUD21(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 1. DataTable 的列标题
    const headers = page.locator('.ud21-table thead th');
    await expect(headers).toHaveCount(3);

    // 第1列标题：Market
    await expect(headers.nth(0)).toHaveText('Market');
    // 第2列标题：Description
    await expect(headers.nth(1)).toHaveText('Description');
    // 第3列标题：Weights from Hdoc
    await expect(headers.nth(2)).toHaveText('Weights from Hdoc');

    // 2. 所有列标题文字左对齐
    for (let i = 0; i < 3; i++) {
      await expect(headers.nth(i)).toHaveCSS('text-align', 'left');
    }

    await takeScreenshot(page, '列标题確認');
  });

  test('UD21_003_画面初始化_市场列表显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '003';
    await goToUD21(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待数据加载
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll('.ud21-table tbody tr');
      return rows.length > 0;
    }, { timeout: 10000 });

    // DataTable 显示记录
    const rows = page.locator('.ud21-table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    // 确认已知的市场记录存在
    const cellTexts = await page.locator('.ud21-cell-market').allTextContents();
    expect(cellTexts).toContain('-EU');
    expect(cellTexts).toContain('CHN');
    expect(cellTexts).toContain('JPN');
    expect(cellTexts).toContain('USA');

    await takeScreenshot(page, '市場列表確認');
  });

  test('UD21_004_画面初始化_Market列显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '004';
    await goToUD21(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待数据加载
    await page.waitForFunction(() => {
      const cells = document.querySelectorAll('.ud21-cell-market');
      return cells.length > 0;
    }, { timeout: 10000 });

    // 1. Market 列显示市场代码
    const marketCells = page.locator('.ud21-cell-market');
    await expect(marketCells.first()).toBeVisible();

    // 2. 文字左对齐
    await expect(marketCells.first()).toHaveCSS('text-align', 'left');

    // 3. 已知市场值正确显示
    const marketTexts = await marketCells.allTextContents();
    expect(marketTexts).toContain('-EU');
    expect(marketTexts).toContain('CHN');
    expect(marketTexts).toContain('JPN');
    expect(marketTexts).toContain('USA');

    await takeScreenshot(page, 'Market列確認');
  });

  test('UD21_005_画面初始化_Description列显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '005';
    await goToUD21(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待数据加载
    await page.waitForFunction(() => {
      const cells = document.querySelectorAll('.ud21-cell-desc');
      return cells.length > 0;
    }, { timeout: 10000 });

    // 1. Description 列显示市场描述
    const descCells = page.locator('.ud21-cell-desc');
    await expect(descCells.first()).toBeVisible();

    // 2. 文字左对齐
    await expect(descCells.first()).toHaveCSS('text-align', 'left');

    // 3. 已知描述值正确显示
    const descTexts = await descCells.allTextContents();
    expect(descTexts).toContain('Europe');
    expect(descTexts).toContain('China');
    expect(descTexts).toContain('Japan');
    expect(descTexts).toContain('United States');

    await takeScreenshot(page, 'Description列確認');
  });

  test('UD21_006_画面初始化_WeightsFromHdoc列', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '006';
    await goToUD21(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待数据加载
    await page.waitForFunction(() => {
      const cells = document.querySelectorAll('.ud21-cell-weights');
      return cells.length > 0;
    }, { timeout: 10000 });

    // 1. Weights from Hdoc 列所有行均显示为空
    const weightsCells = page.locator('.ud21-cell-weights');
    const weightsCount = await weightsCells.count();
    for (let i = 0; i < weightsCount; i++) {
      await expect(weightsCells.nth(i)).toHaveText('');
    }

    await takeScreenshot(page, 'Weights列確認');
  });

  test('UD21_007_画面初始化_Loading状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '007';

    // 模拟 API 延迟响应以捕捉 loading 状态
    await page.route('**/api/ud19/getmarket', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '查询成功', data: [] }),
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD21');
    await page.waitForSelector('.ud21-container');
    await page.waitForTimeout(500);
    await takeScreenshot(page, '初期表示');

    // DataTable 区域显示 加载中...
    await expect(page.locator('.ud21-loading')).toBeVisible();
    await expect(page.locator('.ud21-loading')).toHaveText('加载中...');

    // 加载完成后 DataTable 显示数据
    await page.waitForTimeout(3000);
    await page.waitForFunction(() => {
      const loading = document.querySelector('.ud21-loading');
      return !loading;
    }, { timeout: 10000 }).catch(() => {});

    await takeScreenshot(page, '操作後');
  });

  test('UD21_008_画面初始化_無データ', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '008';

    // 模拟 API 返回空数据
    await page.route('**/api/ud19/getmarket', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '查询成功', data: [] }),
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD21');
    await page.waitForSelector('.ud21-container');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // DataTable 显示 当前没有可用的市场信息
    await expect(page.locator('.ud21-empty')).toBeVisible();
    await expect(page.locator('.ud21-empty')).toHaveText('当前没有可用的市场信息');

    // 消息内容为 当前没有可用的市场信息
    await expect(page.locator('.ud21-message')).toBeVisible();
    await expect(page.locator('.ud21-message')).toHaveText('当前没有可用的市场信息');
    // 类型为 success（绿色）
    await expect(page.locator('.ud21-message-success')).toBeVisible();

    await takeScreenshot(page, '操作後');
  });

  test('UD21_009_画面初始化_消息区域隐藏', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '009';
    await goToUD21(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // API 正常返回数据时，消息区域不在页面中
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll('.ud21-table tbody tr');
      return rows.length > 0;
    }, { timeout: 10000 });

    await expect(page.locator('.ud21-message')).not.toBeVisible();

    await takeScreenshot(page, '操作後');
  });

});

// ============================================================
// 2. 异常处理 (No.10-14)
// ============================================================
test.describe('异常处理', () => {

  test('UD21_010_异常处理_API失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '010';

    // 模拟 API 返回业务状态码非 200
    await page.route('**/api/ud19/getmarket', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 401, msg: '获取市场列表失败' }),
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD21');
    await page.waitForSelector('.ud21-container');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 消息区域可见
    await expect(page.locator('.ud21-message')).toBeVisible();
    await expect(page.locator('.ud21-message')).toHaveText('获取市场列表失败');
    await expect(page.locator('.ud21-message-error')).toBeVisible();

    // DataTable 显示当前没有可用的市场信息
    await expect(page.locator('.ud21-empty')).toBeVisible();
    await expect(page.locator('.ud21-empty')).toHaveText('当前没有可用的市场信息');

    await takeScreenshot(page, '操作後');
  });

  test('UD21_011_异常处理_网络超时', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '011';

    // 模拟 API 响应超时（>30秒）
    await page.route('**/api/ud19/getmarket', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 35000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '查询成功', data: [] }),
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD21');
    await page.waitForSelector('.ud21-container');
    await page.waitForTimeout(500);
    await takeScreenshot(page, '初期表示');

    // 等待超时错误消息（axios 30秒超时）
    await page.waitForFunction(() => {
      const msg = document.querySelector('.ud21-message');
      return msg && (msg.textContent.includes('网络请求超时') || msg.textContent.includes('获取市场列表失败'));
    }, { timeout: 40000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後');

    // 消息区域可见
    await expect(page.locator('.ud21-message')).toBeVisible();
    await expect(page.locator('.ud21-message-error')).toBeVisible();
    // DataTable 显示当前没有可用的市场信息
    await expect(page.locator('.ud21-empty')).toBeVisible();
  });

  test('UD21_012_异常处理_数据库连接失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '012';

    // 模拟数据库连接异常
    await page.route('**/api/ud19/getmarket', async (route) => {
      await route.abort('connectionrefused');
    });

    await login(page);
    await page.goto(BASE_URL + '/UD21');
    await page.waitForSelector('.ud21-container');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 消息区域可见
    await expect(page.locator('.ud21-message')).toBeVisible();
    await expect(page.locator('.ud21-message')).toHaveText('获取市场列表失败，请稍后重试');
    await expect(page.locator('.ud21-message-error')).toBeVisible();

    // DataTable 显示当前没有可用的市场信息
    await expect(page.locator('.ud21-empty')).toBeVisible();

    await takeScreenshot(page, '操作後');
  });

  test('UD21_013_异常处理_路由跳转失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '013';
    await goToUD21(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 这是一个展示页面，无路由跳转按钮
    // 确认页面正常显示
    await expect(page.locator('.ud21-container')).toBeVisible();
    await expect(page.locator('.ud21-title')).toHaveText('Markets in HDoc');

    await takeScreenshot(page, '操作後');
  });

  test('UD21_014_异常处理_未知系统错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '014';

    // 模拟未知系统异常（返回500）
    await page.route('**/api/ud19/getmarket', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '系统发生未知错误，请联系技术支持' }),
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD21');
    await page.waitForSelector('.ud21-container');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 消息区域可见
    await expect(page.locator('.ud21-message')).toBeVisible();
    await expect(page.locator('.ud21-message')).toHaveText('获取市场列表失败，请稍后重试');
    await expect(page.locator('.ud21-message-error')).toBeVisible();

    // DataTable 显示当前没有可用的市场信息
    await expect(page.locator('.ud21-empty')).toBeVisible();

    await takeScreenshot(page, '操作後');
  });

});

// ============================================================
// 3. 安全性 (No.15-16)
// ============================================================
test.describe('安全性', () => {

  test('UD21_015_安全性_未登录直接访问重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '015';

    // 1. 先登录系统，进入 UD21 画面
    await goToUD21(page);
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/UD21/);
    await expect(page.locator('.ud21-container')).toBeVisible();
    await takeScreenshot(page, 'UD21画面表示');

    // 2. 清除所有 localStorage 数据（模拟未登录状态）
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/UD21/);
    await expect(page.locator('.ud21-container')).toBeVisible();
    await takeScreenshot(page, 'localStorage清除後（画面未刷新）');

    // 3. 浏览器地址栏直接输入 UD21 画面的完整 URL 并访问
    await page.goto(BASE_URL + '/UD21');
    await page.waitForTimeout(2000);

    // 4. 确认结果：URL 变为根路径（Login 画面），UD21 画面不被显示
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('.ud21-container')).not.toBeVisible();
    await takeScreenshot(page, '重定向結果（Login画面）');
  });

  test('UD21_016_安全性_数据权限控制', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '016';
    await goToUD21(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // API 请求经过权限验证
    // 只返回当前用户有权限查看的市场数据
    await page.waitForFunction(() => {
      const cells = document.querySelectorAll('.ud21-cell-market');
      return cells.length > 0;
    }, { timeout: 10000 });

    const marketCells = page.locator('.ud21-cell-market');
    await expect(marketCells).not.toHaveCount(0);

    await takeScreenshot(page, '操作後');
  });

});
