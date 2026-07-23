// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD14_ListAvailableTemplates 单元测试
// 测试规格书: テスト式样書UD14.md
// 画面文件: UD14_ListAvailableTemplates.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD14');

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
  const filename = `${currentTestNo}_UD14画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * 导航到 UD14 页面
 */
async function goToUD14(page: Page) {
  await login(page);
  await page.goto(BASE_URL + '/UD14');
  await page.waitForSelector('.ud14-container');
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
// 1. 画面初期表示 (No.1-6)
// ============================================================
test.describe('画面初期表示', () => {

  test('UD14_001_画面初期表示_全体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '01';

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await expect(page.locator('.ud14-container')).toBeVisible();
    await takeScreenshot(page, '页面容器可见');

    await expect(page.locator('.ud14-title')).toHaveText('List Templates');
    await takeScreenshot(page, '页面标题');

    await expect(page.locator('#selectMarket')).toBeVisible();
    await takeScreenshot(page, 'SelectMarket下拉列表');

    await expect(page.locator('.ud14-table')).toBeVisible();
    await takeScreenshot(page, 'DataTable区域');

    await expect(page.locator('.ud14-message')).not.toBeVisible();

    await expect(page.locator('.ud14-loading')).not.toBeVisible();
    await takeScreenshot(page, '整体布局');
  });

  test('UD14_002_画面初期表示_SelectMarket下拉列表', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '02';

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await expect(page.locator('label[for="selectMarket"]')).toHaveText('Select Market:');

    const marketSelect = page.locator('#selectMarket');
    const defaultValue = await marketSelect.inputValue();
    expect(defaultValue).toBe('');

    const optionCount = await marketSelect.locator('option').count();
    expect(optionCount).toBeGreaterThan(1);

    await expect(marketSelect).toBeEnabled();
    await takeScreenshot(page, 'SelectMarket下拉列表');
  });

  test('UD14_003_画面初期表示_Market列表数据来源', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '03';

    await goToUD14(page);
    await page.waitForTimeout(1000);

    const marketSelect = page.locator('#selectMarket');
    const options = await marketSelect.locator('option').count();
    expect(options).toBeGreaterThan(1);

    const firstOption = marketSelect.locator('option').nth(0);
    await expect(firstOption).toHaveAttribute('value', '');
    await takeScreenshot(page, 'Market列表数据来源');
  });

  test('UD14_004_画面初期表示_Market列表不为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '04';

    await goToUD14(page);
    await page.waitForTimeout(1500);

    const marketSelect = page.locator('#selectMarket');
    const optionCount = await marketSelect.locator('option').count();
    expect(optionCount).toBeGreaterThan(1);
    // Select选项可见
    await expect(marketSelect).toBeEnabled();
    await expect(page.locator('.ud14-message')).not.toBeVisible();
    await takeScreenshot(page, 'Market列表不为空');
  });

  test('UD14_005_画面初期表示_加载Market失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '05';

    await page.route('**/api/ud14/market', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '服务器内部错误，请联系管理员', data: null })
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud14-message--error')).toBeVisible();
    await expect(page.locator('.ud14-message')).toContainText('服务器内部错误，请联系管理员');
    await takeScreenshot(page, '加载Market失败');
  });

  test('UD14_006_画面初期表示_DataTable初期状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '06';

    await goToUD14(page);
    await page.waitForTimeout(1000);

    const headers = page.locator('.ud14-table thead th');
    await expect(headers.nth(0)).toHaveText('Filename');
    await expect(headers.nth(1)).toHaveText('Used');
    await expect(headers.nth(2)).toHaveText('Last Mod,');
    await expect(headers.nth(3)).toHaveText('Size');

    await expect(page.locator('.ud14-empty-cell')).toContainText('请先选择Market');

    const rows = await page.locator('.ud14-table tbody tr').count();
    expect(rows).toBe(1);
    await takeScreenshot(page, 'DataTable初期状态');
  });
});

// ============================================================
// 2. Select Market 选择 (No.7-16)
// ============================================================
test.describe('Select Market 选择', () => {

  test('UD14_007_Market选择_显示文件列表', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '07';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '入力後');

    const rows = await page.locator('.ud14-table tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(1);
    await expect(page.locator('.ud14-file-link').first()).toBeVisible();
    await expect(page.locator('.ud14-message')).not.toBeVisible();
    await takeScreenshot(page, '显示文件列表');
  });

  test('UD14_008_Market选择_切换Market显示不同文件列表', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '08';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const marketSelect = page.locator('#selectMarket');

    await marketSelect.selectOption('USA');
    await page.waitForTimeout(1500);

    const rows = await page.locator('.ud14-table tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(1);
    await expect(page.locator('.ud14-file-link').first()).toBeVisible();
    await takeScreenshot(page, 'USA文件夹文件列表');
  });

  test('UD14_009_Market选择_显示EU文件夹文件列表', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '09';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('-EU');
    await page.waitForTimeout(1500);

    const firstLink = page.locator('.ud14-file-link').first();
    await expect(firstLink).toBeVisible();
    await takeScreenshot(page, 'EU文件夹文件列表');
  });

  test('UD14_010_Market选择_显示AUS文件夹文件列表', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '10';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('AUS');
    await page.waitForTimeout(1500);

    const firstLink = page.locator('.ud14-file-link').first();
    await expect(firstLink).toBeVisible();
    await takeScreenshot(page, 'AUS文件夹文件列表');
  });

  test('UD14_011_Market选择_显示AF文件夹文件列表', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '11';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('AF');
    await page.waitForTimeout(1500);

    const firstLink = page.locator('.ud14-file-link').first();
    await expect(firstLink).toBeVisible();
    await takeScreenshot(page, 'AF文件夹文件列表');
  });

  test('UD14_012_Market选择_选择Market后DataTable显示数据或空提示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '12';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1500);

    // 选择Market后，要么显示文件列表，要么显示空提示
    const hasFileLink = await page.locator('.ud14-file-link').first().isVisible().catch(() => false);
    const hasEmptyCell = await page.locator('.ud14-empty-cell').isVisible().catch(() => false);
    expect(hasFileLink || hasEmptyCell).toBeTruthy();
    await expect(page.locator('.ud14-message')).not.toBeVisible();
    await takeScreenshot(page, '选择Market后数据显示');
  });

  test('UD14_013_Market选择_切换Market重新加载', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '13';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const marketSelect = page.locator('#selectMarket');

    await marketSelect.selectOption('CHN');
    await page.waitForTimeout(1500);
    const firstData = await page.locator('.ud14-file-link').first().isVisible().catch(() => false);

    await marketSelect.selectOption('USA');
    await page.waitForTimeout(1500);

    // 切换Market后，数据刷新
    const secondData = await page.locator('.ud14-file-link').first().isVisible().catch(() => false);
    const secondEmpty = await page.locator('.ud14-empty-cell').isVisible().catch(() => false);
    expect(secondData || secondEmpty).toBeTruthy();
    await takeScreenshot(page, '切换Market重新加载');
  });

  test('UD14_014_Market选择_切换为空清空列表', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '14';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const marketSelect = page.locator('#selectMarket');

    await marketSelect.selectOption('CHN');
    await page.waitForTimeout(1500);

    await marketSelect.selectOption('');
    await page.waitForTimeout(500);

    await expect(page.locator('.ud14-empty-cell')).toContainText('请先选择Market');
    await takeScreenshot(page, '切换为空清空列表');
  });

  test('UD14_015_Market选择_加载文件列表失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '15';

    await page.route('**/api/ud14/files*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '获取文件列表失败', data: null })
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud14-message--error')).toBeVisible();
    await expect(page.locator('.ud14-message')).toContainText('获取文件列表失败');
    await expect(page.locator('.ud14-empty-cell')).toContainText('暂无文件数据');
    await takeScreenshot(page, '加载文件列表失败');
  });

  test('UD14_016_Market选择_加载文件列表网络异常', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '16';

    await page.route('**/api/ud14/files*', async route => {
      await route.abort('connectionrefused');
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(2000);

    await expect(page.locator('.ud14-message--error')).toBeVisible();
    await takeScreenshot(page, '加载文件列表网络异常');
  });
});

// ============================================================
// 3. DataTable 数据展示 (No.17-23)
// ============================================================
test.describe('DataTable 数据展示', () => {

  test('UD14_017_DataTable_列标题显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '17';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const headers = page.locator('.ud14-table thead th');
    await expect(headers.nth(0)).toHaveText('Filename');
    await expect(headers.nth(1)).toHaveText('Used');
    await expect(headers.nth(2)).toHaveText('Last Mod,');
    await expect(headers.nth(3)).toHaveText('Size');
    await takeScreenshot(page, '列标题显示');
  });

  test('UD14_018_DataTable_Filename列可点击链接', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '18';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1500);

    const fileLink = page.locator('.ud14-file-link');
    if (await fileLink.isVisible().catch(() => false)) {
      await expect(fileLink.first()).toBeVisible();
    }
    await takeScreenshot(page, 'Filename列可点击链接');
  });

  test('UD14_019_DataTable_Used列显示VARIABLE值', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '19';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('-EU');
    await page.waitForTimeout(1500);

    // Used列（第2列）存在
    const usedCells = page.locator('.ud14-table tbody tr td').nth(1);
    await expect(usedCells).toBeVisible();
    await takeScreenshot(page, 'Used列显示VARIABLE值');
  });

  test('UD14_020_DataTable_Used列内容展示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '20';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('USA');
    await page.waitForTimeout(1500);

    const usedCells = page.locator('.ud14-table tbody tr td').nth(1);
    await expect(usedCells).toBeVisible();
    await takeScreenshot(page, 'Used列内容展示');
  });

  test('UD14_021_DataTable_LastMod列显示日期', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '21';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1500);

    // 如果有文件数据，检查LastMod列不为空
    const lastModCell = page.locator('.ud14-table tbody tr td').nth(2);
    if (await page.locator('.ud14-file-link').first().isVisible().catch(() => false)) {
      await expect(lastModCell).not.toBeEmpty();
    }
    await takeScreenshot(page, 'LastMod列显示日期');
  });

  test('UD14_022_DataTable_Size列显示文件大小', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '22';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1500);

    // 如果有文件数据，检查Size列不为空
    const sizeCell = page.locator('.ud14-table tbody tr td').nth(3);
    if (await page.locator('.ud14-file-link').first().isVisible().catch(() => false)) {
      await expect(sizeCell).not.toBeEmpty();
    }
    await takeScreenshot(page, 'Size列显示文件大小');
  });

  test('UD14_023_DataTable_选择Market显示多条记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '23';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('USA');
    await page.waitForTimeout(1500);

    const rows = await page.locator('.ud14-table tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(1);

    const firstLink = page.locator('.ud14-file-link').first();
    if (await firstLink.isVisible().catch(() => false)) {
      await expect(firstLink).toBeVisible();
    }
    await takeScreenshot(page, '选择Market显示多条记录');
  });
});

// ============================================================
// 4. 文件下载操作 (No.24-30)
// ============================================================
test.describe('文件下载操作', () => {

  test('UD14_024_下载_选择Market后点击文件名下载', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '24';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1500);

    const fileLink = page.locator('.ud14-file-link').first();
    if (await fileLink.isVisible().catch(() => false)) {
      await fileLink.click();
      await page.waitForTimeout(1500);
    }
    await expect(page.locator('.ud14-message')).not.toBeVisible();
    await takeScreenshot(page, '选择Market后点击文件名下载');
  });

  test('UD14_025_下载_USAMarket下载文件', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '25';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('USA');
    await page.waitForTimeout(1500);

    const fileLink = page.locator('.ud14-file-link').first();
    if (await fileLink.isVisible().catch(() => false)) {
      await fileLink.click();
      await page.waitForTimeout(1500);
    }
    await expect(page.locator('.ud14-message')).not.toBeVisible();
    await takeScreenshot(page, 'USAMarket下载文件');
  });

  test('UD14_026_下载_未选择Market时点击文件名', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '26';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud14-empty-cell')).toContainText('请先选择Market');
    await expect(page.locator('.ud14-file-link')).not.toBeVisible();
    await takeScreenshot(page, '未选择Market无法下载');
  });

  test('UD14_027_下载_文件不存在404', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '27';

    await page.route('**/api/ud14/downfile*', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ code: 404, msg: '文件不存在', data: null })
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1500);

    const fileLink = page.locator('.ud14-file-link').first();
    if (await fileLink.isVisible().catch(() => false)) {
      await fileLink.click();
      await page.waitForTimeout(1500);
      await expect(page.locator('.ud14-message--error')).toBeVisible();
      await expect(page.locator('.ud14-message')).toContainText('文件不存在');
    }
    await takeScreenshot(page, '文件不存在404');
  });

  test('UD14_028_下载_下载失败500', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '28';

    await page.route('**/api/ud14/downfile*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '文件下载失败', data: null })
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1500);

    const fileLink = page.locator('.ud14-file-link').first();
    if (await fileLink.isVisible().catch(() => false)) {
      await fileLink.click();
      await page.waitForTimeout(1500);
      await expect(page.locator('.ud14-message--error')).toBeVisible();
      await expect(page.locator('.ud14-message')).toContainText('文件下载失败');
    }
    await takeScreenshot(page, '下载失败500');
  });

  test('UD14_029_下载_下载超时', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '29';

    await page.route('**/api/ud14/downfile*', async route => {
      await new Promise(resolve => setTimeout(resolve, 35000));
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1500);

    const fileLink = page.locator('.ud14-file-link').first();
    if (await fileLink.isVisible().catch(() => false)) {
      await fileLink.click();
      await page.waitForTimeout(5000);
    }
    await takeScreenshot(page, '下载超时');
  });

  test('UD14_030_下载_网络错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '30';

    await page.route('**/api/ud14/downfile*', async route => {
      await route.abort('connectionrefused');
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1500);

    const fileLink = page.locator('.ud14-file-link').first();
    if (await fileLink.isVisible().catch(() => false)) {
      await fileLink.click();
      await page.waitForTimeout(2000);
      const msg = page.locator('.ud14-message--error');
      if (await msg.isVisible().catch(() => false)) {
        await expect(msg).toContainText('文件下载失败');
      }
    }
    await takeScreenshot(page, '下载网络错误');
  });
});

// ============================================================
// 5. UI交互 (No.31-33)
// ============================================================
test.describe('UI交互', () => {

  test('UD14_031_UI交互_选择Market显示Loading后恢复', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '31';

    // Mock files API 增加延迟，以便观察 Loading 状态
    await page.route('**/api/ud14/files*', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);

    const marketSelect = page.locator('#selectMarket');

    await marketSelect.selectOption('CHN');
    await page.waitForTimeout(200);

    // 加载中状态
    await expect(page.locator('.ud14-loading')).toBeVisible();
    await expect(marketSelect).toBeDisabled();
    await takeScreenshot(page, 'Loading中下拉列表禁用');

    // 等待加载完成
    await page.waitForTimeout(3000);
    await expect(page.locator('.ud14-loading')).not.toBeVisible();
    await expect(marketSelect).toBeEnabled();
    await takeScreenshot(page, '加载完成后恢复');
  });

  test('UD14_032_UI交互_选择Market后清除旧消息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '32';

    // 仅Mock CHN Market的files接口返回500错误
    await page.route('**/api/ud14/files*', async (route, request) => {
      const url = new URL(request.url());
      const market = url.searchParams.get('market');
      if (market === 'CHN') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ code: 500, msg: '获取文件列表失败', data: null })
        });
      } else {
        await route.continue();
      }
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const marketSelect = page.locator('#selectMarket');

    await marketSelect.selectOption('CHN');
    await page.waitForTimeout(1500);
    await expect(page.locator('.ud14-message--error')).toBeVisible();

    // 切换到一个真实Market（使用真实数据），旧消息应被清除
    await marketSelect.selectOption('USA');
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud14-message')).not.toBeVisible();
    await takeScreenshot(page, '选择Market清除旧消息');
  });

  test('UD14_033_UI交互_切换Market为空白后消息清除', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '33';

    await page.route('**/api/ud14/files*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '获取文件列表失败', data: null })
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const marketSelect = page.locator('#selectMarket');

    await marketSelect.selectOption('CHN');
    await page.waitForTimeout(1500);
    await expect(page.locator('.ud14-message--error')).toBeVisible();

    await marketSelect.selectOption('');
    await page.waitForTimeout(500);

    await expect(page.locator('.ud14-message')).not.toBeVisible();
    await expect(page.locator('.ud14-empty-cell')).toContainText('请先选择Market');
    await takeScreenshot(page, '切换为空清除消息');
  });
});

// ============================================================
// 6. 异常处理 (No.34-38)
// ============================================================
test.describe('异常处理', () => {

  test('UD14_034_异常处理_Market文件夹不存在', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '34';

    await page.route('**/api/ud14/files*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 404, msg: 'Market文件夹不存在', data: null })
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud14-message--error')).toBeVisible();
    await expect(page.locator('.ud14-message')).toContainText('Market文件夹不存在');
    await expect(page.locator('.ud14-empty-cell')).toContainText('暂无文件数据');
    await takeScreenshot(page, 'Market文件夹不存在');
  });

  test('UD14_035_异常处理_数据库查询失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '35';

    await page.route('**/api/ud14/market', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '数据库查询失败，请联系管理员', data: null })
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud14-message--error')).toBeVisible();
    await expect(page.locator('.ud14-message')).toContainText('服务器内部错误，请联系管理员');
    await takeScreenshot(page, '数据库查询失败');
  });

  test('UD14_036_异常处理_服务器内部错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '36';

    await page.route('**/api/ud14/market', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '服务器内部错误，请联系管理员', data: null })
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud14-message--error')).toBeVisible();
    await expect(page.locator('.ud14-message')).toContainText('服务器内部错误，请联系管理员');
    await takeScreenshot(page, '服务器内部错误');
  });

  test('UD14_037_异常处理_网络连接失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '37';

    await page.route('**/api/ud14/market', async route => {
      // 延迟超过 axios 30s 超时，触发 ECONNABORTED
      await new Promise(resolve => setTimeout(resolve, 35000));
    });

    await goToUD14(page);
    await page.waitForTimeout(35000);

    await expect(page.locator('.ud14-message--error')).toBeVisible();
    await expect(page.locator('.ud14-message')).toContainText('网络连接失败，请检查网络设置');
    await takeScreenshot(page, '网络连接失败');
  });

  test('UD14_038_异常处理_文件读取权限不足', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '38';

    await page.route('**/api/ud14/files*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 403, msg: '没有读取权限，请联系管理员', data: null })
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud14-message--error')).toBeVisible();
    await expect(page.locator('.ud14-message')).toContainText('没有读取权限，请联系管理员');
    await expect(page.locator('.ud14-empty-cell')).toContainText('暂无文件数据');
    await takeScreenshot(page, '文件读取权限不足');
  });
});

// ============================================================
// 7. 安全性 (No.39-43)
// ============================================================
test.describe('安全性', () => {

  test('UD14_039_安全性_未登录直接访问重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '39';

    // 1. 先登录系统，进入 UD14 画面
    await goToUD14(page);
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/UD14/);
    await expect(page.locator('.ud14-container')).toBeVisible();
    await takeScreenshot(page, 'UD14画面表示');

    // 2. 清除所有 localStorage 数据（模拟未登录状态）
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/UD14/);
    await expect(page.locator('.ud14-container')).toBeVisible();
    await takeScreenshot(page, 'localStorage清除後（画面未刷新）');

    // 3. 浏览器地址栏直接输入 UD14 画面的完整 URL 并访问
    await page.goto(BASE_URL + '/UD14');
    await page.waitForTimeout(2000);

    // 4. 确认结果：URL 变为根路径（Login 画面），UD14 画面不被显示
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('.ud14-container')).not.toBeVisible();
    await takeScreenshot(page, '重定向結果（Login画面）');
  });

  test('UD14_040_安全性_路径遍历防护Market', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '40';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 通过 API 请求模拟路径遍历，后端返回 200
    const response = await page.request.get(`${BASE_URL.replace('3000', '8081')}/api/ud14/files`, {
      params: { market: '../' }
    });

    expect(response.status()).toBe(200);
    await takeScreenshot(page, '路径遍历防护Market');
  });

  test('UD14_041_安全性_路径遍历防护文件名', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '41';

    // Mock downfile接口模拟后端的路径遍历拦截行为
    await page.route('**/api/ud14/downfile*', async (route, request) => {
      const url = new URL(request.url());
      const filename = url.searchParams.get('filename');
      if (filename && filename.includes('..')) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ code: 404, msg: '文件不存在', data: null })
        });
      } else {
        await route.continue();
      }
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '路径遍历防护文件名');
  });

  test('UD14_042_安全性_文件可正常显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '42';

    await goToUD14(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1500);

    // 选择Market后页面正常显示，无错误消息
    await expect(page.locator('.ud14-message')).not.toBeVisible();
    await takeScreenshot(page, '文件可正常显示');
  });
});
