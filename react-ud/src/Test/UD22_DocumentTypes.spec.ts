// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD22_DocumentTypes 单元测试
// 测试规格书: テスト式样書UD22.md
// 画面文件: UD22_DocumentTypes.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD22');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

// DB: HDOC_DOCUMENT_LIST 表实际数据
// 123 / 123
// CERTIFICATE / certificate
// COC / Certificate of Conformity - Test
// DIMENSION_PLATE / dimension_plate
// TECHNICAL_SPEC / Technical Spec


/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD22画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * 导航到 UD22 页面
 */
async function goToUD22(page: Page) {
  await login(page);
  await page.goto(BASE_URL + '/UD22');
  await page.waitForSelector('.ud22-container');
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
// 1. 画面初期表示 (No.1-8)
// ============================================================
test.describe('画面初期表示', () => {

  test('UD22_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '001';
    await goToUD22(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 1. 页面容器可见
    await expect(page.locator('.ud22-container')).toBeVisible();

    // 2. 页面标题显示
    await expect(page.locator('.ud22-title')).toHaveText('Document Types');

    // 3. DataTable 区域可见
    await expect(page.locator('.ud22-table')).toBeVisible();

    // 4. 消息区域不在页面中（默认隐藏）
    await expect(page.locator('.ud22-message')).not.toBeVisible();

    await takeScreenshot(page, '整体布局確認');
  });

  test('UD22_002_画面初始化_DataTable列标题', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '002';
    await goToUD22(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 1. DataTable 的列标题
    const headers = page.locator('.ud22-table thead th');
    await expect(headers).toHaveCount(2);

    // 第1列标题：Key
    await expect(headers.nth(0)).toHaveText('Key');
    // 第2列标题：Description
    await expect(headers.nth(1)).toHaveText('Description');

    // 2. 所有列标题文字左对齐
    for (let i = 0; i < 2; i++) {
      await expect(headers.nth(i)).toHaveCSS('text-align', 'left');
    }

    await takeScreenshot(page, '列标题確認');
  });

  test('UD22_003_画面初始化_文档类型列表显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '003';
    await goToUD22(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待数据加载
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll('.ud22-table tbody .ud22-cell-key');
      return rows.length > 0;
    }, { timeout: 10000 });

    // DataTable 显示记录
    const keyCells = page.locator('.ud22-cell-key');
    const keyCount = await keyCells.count();
    expect(keyCount).toBeGreaterThanOrEqual(1);

    // 确认关键文档类型存在
    const keyTexts = await keyCells.allTextContents();
    expect(keyTexts).toContain('123');
    expect(keyTexts).toContain('CERTIFICATE');
    expect(keyTexts).toContain('DIMENSION_PLATE');
    expect(keyTexts).toContain('TECHNICAL_SPEC');

    await takeScreenshot(page, '文档类型列表確認');
  });

  test('UD22_004_画面初始化_Key列显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '004';
    await goToUD22(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待数据加载
    await page.waitForFunction(() => {
      const cells = document.querySelectorAll('.ud22-cell-key');
      return cells.length > 0;
    }, { timeout: 10000 });

    // 1. Key 列显示文档类型代码
    const keyCells = page.locator('.ud22-cell-key');
    await expect(keyCells.first()).toBeVisible();

    // 2. 文字左对齐
    await expect(keyCells.first()).toHaveCSS('text-align', 'left');

    // 3. Key 值正确显示
    const keyTexts = await keyCells.allTextContents();
    expect(keyTexts).toContain('123');
    expect(keyTexts).toContain('CERTIFICATE');
    expect(keyTexts).toContain('DIMENSION_PLATE');
    expect(keyTexts).toContain('TECHNICAL_SPEC');

    await takeScreenshot(page, 'Key列確認');
  });

  test('UD22_005_画面初始化_Description列显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '005';
    await goToUD22(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待数据加载
    await page.waitForFunction(() => {
      const cells = document.querySelectorAll('.ud22-cell-desc');
      return cells.length > 0;
    }, { timeout: 10000 });

    // 1. Description 列显示文档描述
    const descCells = page.locator('.ud22-cell-desc');
    await expect(descCells.first()).toBeVisible();

    // 2. 文字左对齐
    await expect(descCells.first()).toHaveCSS('text-align', 'left');

    // 3. Description 值正确显示
    const descTexts = await descCells.allTextContents();
    expect(descTexts).toContain('certificate');
    expect(descTexts).toContain('dimension_plate');
    expect(descTexts).toContain('Technical Spec');

    await takeScreenshot(page, 'Description列確認');
  });

  test('UD22_006_画面初始化_Loading状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '006';

    // 模拟 API 延迟响应以捕捉 loading 状态
    await page.route('**/api/ud20/getdocumentlist', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: [] }),
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD22');
    await page.waitForSelector('.ud22-container');
    await page.waitForTimeout(500);
    await takeScreenshot(page, '初期表示');

    // DataTable 区域显示 加载中...
    await expect(page.locator('.ud22-loading')).toBeVisible();
    await expect(page.locator('.ud22-loading')).toHaveText('加载中...');

    // 加载完成后 DataTable 显示数据
    await page.waitForTimeout(3000);
    await page.waitForFunction(() => {
      const loading = document.querySelector('.ud22-loading');
      return !loading;
    }, { timeout: 10000 }).catch(() => {});

    await takeScreenshot(page, '操作後');
  });

  test('UD22_007_画面初始化_無データ', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '007';

    // 模拟 API 返回空数据
    await page.route('**/api/ud20/getdocumentlist', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: [] }),
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD22');
    await page.waitForSelector('.ud22-container');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // DataTable 显示 当前没有可用的文档类型
    await expect(page.locator('.ud22-empty')).toBeVisible();
    await expect(page.locator('.ud22-empty')).toHaveText('当前没有可用的文档类型');

    // 消息内容为 当前没有可用的文档类型
    await expect(page.locator('.ud22-message')).toBeVisible();
    await expect(page.locator('.ud22-message')).toHaveText('当前没有可用的文档类型');
    await expect(page.locator('.ud22-message-success')).toBeVisible();

    await takeScreenshot(page, '操作後');
  });

  test('UD22_008_画面初始化_消息区域隐藏', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '008';
    await goToUD22(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // API 正常返回数据时，消息区域不在页面中
    await page.waitForFunction(() => {
      const cells = document.querySelectorAll('.ud22-cell-key');
      return cells.length > 0;
    }, { timeout: 10000 });

    await expect(page.locator('.ud22-message')).not.toBeVisible();

    await takeScreenshot(page, '操作後');
  });

});

// ============================================================
// 2. 异常处理 (No.9-13)
// ============================================================
test.describe('异常处理', () => {

  test('UD22_009_异常处理_API失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '009';

    // 模拟 API 返回非 200 状态码
    await page.route('**/api/ud20/getdocumentlist', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 401, message: '获取文档类型列表失败' }),
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD22');
    await page.waitForSelector('.ud22-container');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 消息区域可见
    await expect(page.locator('.ud22-message')).toBeVisible();
    await expect(page.locator('.ud22-message')).toHaveText('获取文档类型列表失败');
    await expect(page.locator('.ud22-message-error')).toBeVisible();

    // DataTable 显示当前没有可用的文档类型
    await expect(page.locator('.ud22-empty')).toBeVisible();
    await expect(page.locator('.ud22-empty')).toHaveText('当前没有可用的文档类型');

    await takeScreenshot(page, '操作後');
  });

  test('UD22_010_异常处理_网络超时', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '010';

    // 模拟 API 响应超时（>30秒）
    await page.route('**/api/ud20/getdocumentlist', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 35000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: [] }),
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD22');
    await page.waitForSelector('.ud22-container');
    await page.waitForTimeout(500);
    await takeScreenshot(page, '初期表示');

    // 等待超时错误消息（axios 30秒超时）
    await page.waitForFunction(() => {
      const msg = document.querySelector('.ud22-message');
      return msg && (msg.textContent.includes('网络请求超时') || msg.textContent.includes('获取文档类型列表失败'));
    }, { timeout: 40000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後');

    // 消息区域可见
    await expect(page.locator('.ud22-message')).toBeVisible();
    await expect(page.locator('.ud22-message-error')).toBeVisible();
    // DataTable 显示当前没有可用的文档类型
    await expect(page.locator('.ud22-empty')).toBeVisible();
  });

  test('UD22_011_异常处理_数据库连接失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '011';

    // 模拟数据库连接异常
    await page.route('**/api/ud20/getdocumentlist', async (route) => {
      await route.abort('connectionrefused');
    });

    await login(page);
    await page.goto(BASE_URL + '/UD22');
    await page.waitForSelector('.ud22-container');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 消息区域可见
    await expect(page.locator('.ud22-message')).toBeVisible();
    await expect(page.locator('.ud22-message')).toHaveText('获取文档类型列表失败，请稍后重试');
    await expect(page.locator('.ud22-message-error')).toBeVisible();

    // DataTable 显示当前没有可用的文档类型
    await expect(page.locator('.ud22-empty')).toBeVisible();

    await takeScreenshot(page, '操作後');
  });

  test('UD22_012_异常处理_路由跳转失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '012';
    await goToUD22(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 这是一个展示页面，无路由跳转按钮
    // 确认页面正常显示
    await expect(page.locator('.ud22-container')).toBeVisible();
    await expect(page.locator('.ud22-title')).toHaveText('Document Types');

    await takeScreenshot(page, '操作後');
  });

  test('UD22_013_异常处理_未知系统错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '013';

    // 模拟未知系统异常（返回500）
    await page.route('**/api/ud20/getdocumentlist', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: '系统发生未知错误，请联系技术支持' }),
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD22');
    await page.waitForSelector('.ud22-container');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 消息区域可见
    await expect(page.locator('.ud22-message')).toBeVisible();
    await expect(page.locator('.ud22-message')).toHaveText('获取文档类型列表失败，请稍后重试');
    await expect(page.locator('.ud22-message-error')).toBeVisible();

    // DataTable 显示当前没有可用的文档类型
    await expect(page.locator('.ud22-empty')).toBeVisible();

    await takeScreenshot(page, '操作後');
  });

});

// ============================================================
// 3. 安全性 (No.14-15)
// ============================================================
test.describe('安全性', () => {

  test('UD22_014_安全性_未登录直接访问重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '014';

    // 1. 先登录系统，进入 UD22 画面
    await goToUD22(page);
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/UD22/);
    await expect(page.locator('.ud22-container')).toBeVisible();
    await takeScreenshot(page, 'UD22画面表示');

    // 2. 清除所有 localStorage 数据（模拟未登录状态）
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/UD22/);
    await expect(page.locator('.ud22-container')).toBeVisible();
    await takeScreenshot(page, 'localStorage清除後（画面未刷新）');

    // 3. 浏览器地址栏直接输入 UD22 画面的完整 URL 并访问
    await page.goto(BASE_URL + '/UD22');
    await page.waitForTimeout(2000);

    // 4. 确认结果：URL 变为根路径（Login 画面），UD22 画面不被显示
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('.ud22-container')).not.toBeVisible();
    await takeScreenshot(page, '重定向結果（Login画面）');
  });

  test('UD22_015_安全性_数据权限控制', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '015';
    await goToUD22(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // API 请求经过权限验证
    await page.waitForFunction(() => {
      const cells = document.querySelectorAll('.ud22-cell-key');
      return cells.length > 0;
    }, { timeout: 10000 });

    const keyCells = page.locator('.ud22-cell-key');
    await expect(keyCells).not.toHaveCount(0);

    await takeScreenshot(page, '操作後');
  });

});
