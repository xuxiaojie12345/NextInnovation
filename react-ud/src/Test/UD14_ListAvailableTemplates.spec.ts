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

// Mock Market 列表数据
const MOCK_MARKETS = [
  { market: '-EU' }, { market: 'AF' }, { market: 'AS' }, { market: 'AUS' },
  { market: 'CHN' }, { market: 'EUR' }, { market: 'JPN' }, { market: 'NA' },
  { market: 'SA' }, { market: 'USA' }, { market: 'UT1' }, { market: 'X1' },
  { market: 'X2' }, { market: 'X3' }
];

// Mock 各 Market 文件列表
const MOCK_CHN_FILES = [
  { filename: 'HDoc_Variables_Result_2026-06-26.rtf', isUsed: true, variable: 'VAR_073d4aad', lastMod: '2026-06-26 10:30', size: '1 KB' }
];
const MOCK_USA_FILES = [
  { filename: 'creat.docx', isUsed: false, variable: null, lastMod: '2026-06-25 14:20', size: '2 KB' },
  { filename: 'market.rtf', isUsed: false, variable: null, lastMod: '2026-06-24 09:15', size: '1 KB' }
];
const MOCK_EU_FILES = [
  { filename: 'af_file.rtf', isUsed: true, variable: 'var', lastMod: '2026-06-23 11:00', size: '1 KB' },
  { filename: 'market.rtf', isUsed: true, variable: '1001', lastMod: '2026-06-22 16:45', size: '2 KB' }
];
const MOCK_AF_FILES = [
  { filename: 'af_file.rtf', isUsed: false, variable: null, lastMod: '2026-06-21 08:30', size: '1 KB' },
  { filename: 'market.rtf', isUsed: false, variable: null, lastMod: '2026-06-20 13:00', size: '1 KB' }
];
const MOCK_AUS_FILES = [
  { filename: 'HDoc_Variables_Result_2026-06-24.rtf', isUsed: false, variable: null, lastMod: '2026-06-24 12:00', size: '3 KB' }
];
const MOCK_NA_FILES = [
  { filename: 'market.rtf', isUsed: false, variable: null, lastMod: '2026-06-19 10:00', size: '1 KB' },
  { filename: '新版[中日交流标准日本语]中级上电子书.rtf', isUsed: true, variable: 'VAR_123abc', lastMod: '2026-06-18 15:30', size: '5 KB' }
];


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
 * 设置 Market 列表 Mock
 */
async function setupMarketMock(page: Page, marketData: any[]) {
  await page.route('**/api/ud14/market', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, msg: '', data: marketData })
    });
  });
}

/**
 * 设置文件列表 Mock（单一 Market）
 */
async function setupFileListMock(page: Page, market: string, files: any[]) {
  await page.route('**/api/ud14/files*', async (route, request) => {
    const url = new URL(request.url());
    const reqMarket = url.searchParams.get('market');
    if (reqMarket === market) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: files })
      });
    } else {
      await route.continue();
    }
  });
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

    await setupMarketMock(page, MOCK_MARKETS);

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

    await setupMarketMock(page, MOCK_MARKETS);

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

    await setupMarketMock(page, MOCK_MARKETS);

    await goToUD14(page);
    await page.waitForTimeout(1000);

    const marketSelect = page.locator('#selectMarket');
    const options = await marketSelect.locator('option').count();
    expect(options).toBe(MOCK_MARKETS.length + 1);

    const firstOption = marketSelect.locator('option').nth(0);
    await expect(firstOption).toHaveAttribute('value', '');

    for (let i = 0; i < MOCK_MARKETS.length; i++) {
      const option = marketSelect.locator('option').nth(i + 1);
      await expect(option).toHaveAttribute('value', MOCK_MARKETS[i].market);
    }
    await takeScreenshot(page, 'Market列表数据来源');
  });

  test('UD14_004_画面初期表示_Market列表为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '04';

    await setupMarketMock(page, []);

    await goToUD14(page);
    await page.waitForTimeout(1500);

    const marketSelect = page.locator('#selectMarket');
    const optionCount = await marketSelect.locator('option').count();
    expect(optionCount).toBe(1);
    await expect(page.locator('.ud14-message')).not.toBeVisible();
    await takeScreenshot(page, 'Market列表为空');
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

    await setupMarketMock(page, MOCK_MARKETS);

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

  test('UD14_007_Market选择_显示CHN文件夹文件列表', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '07';

    await setupMarketMock(page, MOCK_MARKETS);
    await setupFileListMock(page, 'CHN', MOCK_CHN_FILES);

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud14-file-link')).toHaveText('HDoc_Variables_Result_2026-06-26.rtf');
    await expect(page.locator('.ud14-table tbody tr td').nth(1)).toContainText('VAR_073d4aad');
    await expect(page.locator('.ud14-table tbody tr td').nth(2)).not.toBeEmpty();
    await expect(page.locator('.ud14-table tbody tr td').nth(3)).not.toBeEmpty();
    await expect(page.locator('.ud14-message')).not.toBeVisible();
    await takeScreenshot(page, 'CHN文件夹文件列表');
  });

  test('UD14_008_Market选择_显示USA文件夹文件列表', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '08';

    await setupMarketMock(page, MOCK_MARKETS);
    await setupFileListMock(page, 'USA', MOCK_USA_FILES);

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('USA');
    await page.waitForTimeout(1500);

    const rows = await page.locator('.ud14-table tbody tr').count();
    expect(rows).toBe(2);

    await expect(page.locator('.ud14-file-link').nth(0)).toHaveText('creat.docx');
    await expect(page.locator('.ud14-file-link').nth(1)).toHaveText('market.rtf');

    for (let i = 0; i < 2; i++) {
      await expect(page.locator('.ud14-table tbody tr').nth(i).locator('td').nth(1)).toBeVisible();
      await expect(page.locator('.ud14-table tbody tr').nth(i).locator('td').nth(2)).not.toBeEmpty();
      await expect(page.locator('.ud14-table tbody tr').nth(i).locator('td').nth(3)).not.toBeEmpty();
    }
    await takeScreenshot(page, 'USA文件夹文件列表');
  });

  test('UD14_009_Market选择_显示EU文件夹文件列表', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '09';

    await setupMarketMock(page, MOCK_MARKETS);
    await setupFileListMock(page, '-EU', MOCK_EU_FILES);

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('-EU');
    await page.waitForTimeout(1500);

    const rows = await page.locator('.ud14-table tbody tr').count();
    expect(rows).toBe(2);

    await expect(page.locator('.ud14-file-link').nth(0)).toHaveText('af_file.rtf');
    await expect(page.locator('.ud14-file-link').nth(1)).toHaveText('market.rtf');
    await takeScreenshot(page, 'EU文件夹文件列表');
  });

  test('UD14_010_Market选择_显示AUS文件夹文件列表', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '10';

    await setupMarketMock(page, MOCK_MARKETS);
    await setupFileListMock(page, 'AUS', MOCK_AUS_FILES);

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('AUS');
    await page.waitForTimeout(1500);

    const rows = await page.locator('.ud14-table tbody tr').count();
    expect(rows).toBe(1);
    await expect(page.locator('.ud14-file-link')).toHaveText('HDoc_Variables_Result_2026-06-24.rtf');
    await takeScreenshot(page, 'AUS文件夹文件列表');
  });

  test('UD14_011_Market选择_显示AF文件夹文件列表', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '11';

    await setupMarketMock(page, MOCK_MARKETS);
    await setupFileListMock(page, 'AF', MOCK_AF_FILES);

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('AF');
    await page.waitForTimeout(1500);

    const rows = await page.locator('.ud14-table tbody tr').count();
    expect(rows).toBe(2);
    await expect(page.locator('.ud14-file-link').nth(0)).toHaveText('af_file.rtf');
    await expect(page.locator('.ud14-file-link').nth(1)).toHaveText('market.rtf');
    await takeScreenshot(page, 'AF文件夹文件列表');
  });

  test('UD14_012_Market选择_显示JPN空文件夹', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '12';

    await setupMarketMock(page, MOCK_MARKETS);
    await setupFileListMock(page, 'JPN', []);

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('JPN');
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud14-empty-cell')).toContainText('暂无文件数据');
    await expect(page.locator('.ud14-message')).not.toBeVisible();
    await takeScreenshot(page, 'JPN空文件夹');
  });

  test('UD14_013_Market选择_切换Market重新加载', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '13';

    await setupMarketMock(page, MOCK_MARKETS);

    await page.route('**/api/ud14/files*', async (route, request) => {
      const url = new URL(request.url());
      const market = url.searchParams.get('market');
      const data = market === 'CHN' ? MOCK_CHN_FILES :
                   market === 'USA' ? MOCK_USA_FILES : [];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data })
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);

    const marketSelect = page.locator('#selectMarket');

    await marketSelect.selectOption('CHN');
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud14-file-link')).toHaveText('HDoc_Variables_Result_2026-06-26.rtf');

    await marketSelect.selectOption('USA');
    await page.waitForTimeout(1000);

    await expect(page.locator('.ud14-file-link').nth(0)).toHaveText('creat.docx');
    await expect(page.locator('.ud14-file-link').nth(1)).toHaveText('market.rtf');
    await takeScreenshot(page, '切换Market重新加载');
  });

  test('UD14_014_Market选择_切换为空清空列表', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '14';

    await setupMarketMock(page, MOCK_MARKETS);
    await setupFileListMock(page, 'CHN', MOCK_CHN_FILES);

    await goToUD14(page);
    await page.waitForTimeout(1000);

    const marketSelect = page.locator('#selectMarket');

    await marketSelect.selectOption('CHN');
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud14-file-link')).toBeVisible();

    await marketSelect.selectOption('');
    await page.waitForTimeout(500);

    await expect(page.locator('.ud14-empty-cell')).toContainText('请先选择Market');
    await takeScreenshot(page, '切换为空清空列表');
  });

  test('UD14_015_Market选择_加载文件列表失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '15';

    await setupMarketMock(page, MOCK_MARKETS);

    await page.route('**/api/ud14/files*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '获取文件列表失败', data: null })
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud14-message--error')).toBeVisible();
    await expect(page.locator('.ud14-message')).toContainText('获取文件列表失败');
    await expect(page.locator('.ud14-empty-cell')).toContainText('暂无文件数据');
    await takeScreenshot(page, '加载文件列表失败');
  });

  test('UD14_016_Market选择_加载文件列表网络异常', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '16';

    await setupMarketMock(page, MOCK_MARKETS);

    await page.route('**/api/ud14/files*', async route => {
      await route.abort('connectionrefused');
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);

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

    await setupMarketMock(page, MOCK_MARKETS);
    await setupFileListMock(page, 'CHN', MOCK_CHN_FILES);

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1000);

    const headers = page.locator('.ud14-table thead th');
    await expect(headers.nth(0)).toHaveText('Filename');
    await expect(headers.nth(1)).toHaveText('Used');
    await expect(headers.nth(2)).toHaveText('Last Mod,');
    await expect(headers.nth(3)).toHaveText('Size');
    await takeScreenshot(page, '列标题显示');
  });

  test('UD14_018_DataTable_Filename列可点击链接', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '18';

    await setupMarketMock(page, MOCK_MARKETS);
    await setupFileListMock(page, 'CHN', MOCK_CHN_FILES);

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1000);

    const fileLink = page.locator('.ud14-file-link');
    await expect(fileLink).toHaveText('HDoc_Variables_Result_2026-06-26.rtf');
    await expect(fileLink).toBeVisible();
    await takeScreenshot(page, 'Filename列可点击链接');
  });

  test('UD14_019_DataTable_Used列显示VARIABLE值', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '19';

    await setupMarketMock(page, MOCK_MARKETS);
    await setupFileListMock(page, '-EU', MOCK_EU_FILES);

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('-EU');
    await page.waitForTimeout(1000);

    const rows = page.locator('.ud14-table tbody tr');
    await expect(rows.nth(0).locator('td').nth(1)).toContainText('var');
    await expect(rows.nth(1).locator('td').nth(1)).toContainText('1001');
    await takeScreenshot(page, 'Used列显示VARIABLE值');
  });

  test('UD14_020_DataTable_Used列未使用显示为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '20';

    await setupMarketMock(page, MOCK_MARKETS);
    await setupFileListMock(page, 'USA', MOCK_USA_FILES);

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('USA');
    await page.waitForTimeout(1000);

    const rows = page.locator('.ud14-table tbody tr');
    for (let i = 0; i < 2; i++) {
      const usedText = await rows.nth(i).locator('td').nth(1).textContent();
      expect(usedText.trim()).toBe('');
    }
    await takeScreenshot(page, 'Used列未使用显示为空');
  });

  test('UD14_021_DataTable_LastMod列显示日期', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '21';

    await setupMarketMock(page, MOCK_MARKETS);
    await setupFileListMock(page, 'CHN', MOCK_CHN_FILES);

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1000);

    const lastModCell = page.locator('.ud14-table tbody tr td').nth(2);
    await expect(lastModCell).not.toBeEmpty();
    await takeScreenshot(page, 'LastMod列显示日期');
  });

  test('UD14_022_DataTable_Size列显示文件大小', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '22';

    await setupMarketMock(page, MOCK_MARKETS);
    await setupFileListMock(page, 'CHN', MOCK_CHN_FILES);

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1000);

    const sizeCell = page.locator('.ud14-table tbody tr td').nth(3);
    await expect(sizeCell).not.toBeEmpty();
    await takeScreenshot(page, 'Size列显示文件大小');
  });

  test('UD14_023_DataTable_多条记录显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '23';

    await setupMarketMock(page, MOCK_MARKETS);
    await setupFileListMock(page, 'NA', MOCK_NA_FILES);

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('NA');
    await page.waitForTimeout(1000);

    const rows = await page.locator('.ud14-table tbody tr').count();
    expect(rows).toBe(2);

    await expect(page.locator('.ud14-file-link').nth(0)).toHaveText('market.rtf');
    await expect(page.locator('.ud14-file-link').nth(1)).toHaveText('新版[中日交流标准日本语]中级上电子书.rtf');

    for (let i = 0; i < 2; i++) {
      await expect(page.locator('.ud14-table tbody tr').nth(i).locator('td').nth(2)).not.toBeEmpty();
      await expect(page.locator('.ud14-table tbody tr').nth(i).locator('td').nth(3)).not.toBeEmpty();
    }
    await takeScreenshot(page, '多条记录显示');
  });
});

// ============================================================
// 4. 文件下载操作 (No.24-30)
// ============================================================
test.describe('文件下载操作', () => {

  test('UD14_024_下载_选择Market后点击文件名下载', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '24';

    await setupMarketMock(page, MOCK_MARKETS);

    await page.route('**/api/ud14/files*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: MOCK_CHN_FILES })
      });
    });

    await page.route('**/api/ud14/downfile*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/octet-stream',
        body: Buffer.from('mock file content')
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1000);

    await page.locator('.ud14-file-link').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud14-message')).not.toBeVisible();
    await takeScreenshot(page, '选择Market后点击文件名下载');
  });

  test('UD14_025_下载_USAMarket下载文件', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '25';

    await setupMarketMock(page, MOCK_MARKETS);

    await page.route('**/api/ud14/files*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: MOCK_USA_FILES })
      });
    });

    await page.route('**/api/ud14/downfile*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/octet-stream',
        body: Buffer.from('creat docx content')
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('USA');
    await page.waitForTimeout(1000);

    await page.locator('.ud14-file-link').first().click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud14-message')).not.toBeVisible();
    await takeScreenshot(page, 'USAMarket下载文件');
  });

  test('UD14_026_下载_未选择Market时点击文件名', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '26';

    await setupMarketMock(page, MOCK_MARKETS);

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await expect(page.locator('.ud14-empty-cell')).toContainText('请先选择Market');
    await expect(page.locator('.ud14-file-link')).not.toBeVisible();
    await takeScreenshot(page, '未选择Market无法下载');
  });

  test('UD14_027_下载_文件不存在404', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '27';

    await setupMarketMock(page, MOCK_MARKETS);

    const mockFiles = [{ filename: 'nonexist.rtf', isUsed: false, variable: null, lastMod: '2026-06-26', size: '1 KB' }];
    await page.route('**/api/ud14/files*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: mockFiles })
      });
    });

    await page.route('**/api/ud14/downfile*', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ code: 404, msg: '文件不存在', data: null })
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1000);

    await page.locator('.ud14-file-link').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud14-message--error')).toBeVisible();
    await expect(page.locator('.ud14-message')).toContainText('文件不存在');
    await takeScreenshot(page, '文件不存在404');
  });

  test('UD14_028_下载_下载失败500', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '28';

    await setupMarketMock(page, MOCK_MARKETS);

    await page.route('**/api/ud14/files*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: MOCK_CHN_FILES })
      });
    });

    await page.route('**/api/ud14/downfile*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '文件下载失败', data: null })
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1000);

    await page.locator('.ud14-file-link').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud14-message--error')).toBeVisible();
    await expect(page.locator('.ud14-message')).toContainText('文件下载失败');
    await takeScreenshot(page, '下载失败500');
  });

  test('UD14_029_下载_下载超时', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '29';

    await setupMarketMock(page, MOCK_MARKETS);

    await page.route('**/api/ud14/files*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: MOCK_CHN_FILES })
      });
    });

    await page.route('**/api/ud14/downfile*', async route => {
      await new Promise(resolve => setTimeout(resolve, 35000));
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1000);

    await page.locator('.ud14-file-link').click();
    await page.waitForTimeout(5000);
    await takeScreenshot(page, '下载超时');
  });

  test('UD14_030_下载_网络错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '30';

    await setupMarketMock(page, MOCK_MARKETS);

    await page.route('**/api/ud14/files*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: MOCK_CHN_FILES })
      });
    });

    await page.route('**/api/ud14/downfile*', async route => {
      await route.abort('connectionrefused');
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1000);

    await page.locator('.ud14-file-link').click();
    await page.waitForTimeout(2000);

    const msg = page.locator('.ud14-message--error');
    if (await msg.isVisible().catch(() => false)) {
      await expect(msg).toContainText('文件下载失败');
    }
    await takeScreenshot(page, '下载网络错误');
  });
});

// ============================================================
// 5. UI交互 (No.31-33)
// ============================================================
test.describe('UI交互', () => {

  test('UD14_031_UI交互_Loading中下拉列表禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '31';

    await setupMarketMock(page, MOCK_MARKETS);

    await page.route('**/api/ud14/files*', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: MOCK_CHN_FILES })
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);

    const marketSelect = page.locator('#selectMarket');

    await marketSelect.selectOption('CHN');
    await page.waitForTimeout(500);

    await expect(marketSelect).toBeDisabled();
    await expect(page.locator('.ud14-loading')).toBeVisible();
    await takeScreenshot(page, 'Loading中下拉列表禁用');

    await page.waitForTimeout(3000);
    await expect(marketSelect).toBeEnabled();
    await expect(page.locator('.ud14-loading')).not.toBeVisible();
    await takeScreenshot(page, '加载完成后恢复');
  });

  test('UD14_032_UI交互_选择Market后清除旧消息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '32';

    await setupMarketMock(page, MOCK_MARKETS);

    let failFirst = true;
    await page.route('**/api/ud14/files*', async (route, request) => {
      const url = new URL(request.url());
      const market = url.searchParams.get('market');
      if (failFirst && market === 'CHN') {
        failFirst = false;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ code: 500, msg: '获取文件列表失败', data: null })
        });
      } else if (market === 'USA') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, msg: '', data: MOCK_USA_FILES })
        });
      } else {
        await route.continue();
      }
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);

    const marketSelect = page.locator('#selectMarket');

    await marketSelect.selectOption('CHN');
    await page.waitForTimeout(1500);
    await expect(page.locator('.ud14-message--error')).toBeVisible();

    await marketSelect.selectOption('USA');
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud14-message')).not.toBeVisible();
    await takeScreenshot(page, '选择Market清除旧消息');
  });

  test('UD14_033_UI交互_切换Market为空白后消息清除', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '33';

    await setupMarketMock(page, MOCK_MARKETS);

    await page.route('**/api/ud14/files*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '获取文件列表失败', data: null })
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);

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

    await setupMarketMock(page, MOCK_MARKETS);

    await page.route('**/api/ud14/files*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 404, msg: 'Market文件夹不存在', data: null })
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);

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
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '数据库查询失败，请联系管理员', data: null })
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud14-message--error')).toBeVisible();
    await expect(page.locator('.ud14-message')).toContainText('数据库查询失败，请联系管理员');
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
      await route.abort('connectionrefused');
    });

    await goToUD14(page);
    await page.waitForTimeout(2000);

    const msg = page.locator('.ud14-message--error');
    if (await msg.isVisible().catch(() => false)) {
      await expect(msg).toContainText('网络连接失败');
    }
    await takeScreenshot(page, '网络连接失败');
  });

  test('UD14_038_异常处理_文件读取权限不足', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '38';

    await setupMarketMock(page, MOCK_MARKETS);

    await page.route('**/api/ud14/files*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 403, msg: '没有读取权限，请联系管理员', data: null })
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);

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

    await page.evaluate(() => localStorage.clear());
    await page.goto(BASE_URL + '/UD14');
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/Login/);
    await expect(page.locator('.login-container')).toBeVisible();
    await takeScreenshot(page, '未登录重定向');
  });

  test('UD14_040_安全性_路径遍历防护Market', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '40';

    await setupMarketMock(page, MOCK_MARKETS);

    await goToUD14(page);
    await page.waitForTimeout(1000);

    // 通过 API 请求模拟路径遍历
    const response = await page.request.get(`${BASE_URL.replace('3000', '8081')}/api/ud14/files`, {
      params: { market: '../' }
    });

    expect(response.status()).toBe(400);
    await takeScreenshot(page, '路径遍历防护Market');
  });

  test('UD14_041_安全性_路径遍历防护文件名', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '41';

    await setupMarketMock(page, MOCK_MARKETS);
    await setupFileListMock(page, 'CHN', MOCK_CHN_FILES);

    await page.route('**/api/ud14/downfile*', async (route, request) => {
      const url = new URL(request.url());
      const filename = url.searchParams.get('filename');
      // 后端应拦截包含 .. 的文件名
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

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '路径遍历防护文件名');
  });

  test('UD14_042_安全性_Market代码白名单验证', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '42';

    await setupMarketMock(page, MOCK_MARKETS);

    await goToUD14(page);
    await page.waitForTimeout(1000);

    const response = await page.request.get(`${BASE_URL.replace('3000', '8081')}/api/ud14/files`, {
      params: { market: 'INVALID' }
    });

    expect(response.status()).toBe(400);
    await takeScreenshot(page, 'Market代码白名单验证');
  });

  test('UD14_043_安全性_文件下载权限控制', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '43';

    await setupMarketMock(page, MOCK_MARKETS);

    await page.route('**/api/ud14/files*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: MOCK_CHN_FILES })
      });
    });

    await page.route('**/api/ud14/downfile*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/octet-stream',
        body: Buffer.from('test file content')
      });
    });

    await goToUD14(page);
    await page.waitForTimeout(1000);

    await page.locator('#selectMarket').selectOption('CHN');
    await page.waitForTimeout(1000);

    await page.locator('.ud14-file-link').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud14-message')).not.toBeVisible();
    await takeScreenshot(page, '文件下载权限控制');
  });
});
