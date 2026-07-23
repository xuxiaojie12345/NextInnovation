import { test, expect, Page } from '@playwright/test';

// ============================================================
// ListTemplates 模块 (UD14) Playwright 自动化测试
// 基于 単体テスト仕様書UD14.md（20个测试用例）
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD14';
const UD14_URL = `${BASE_URL}/Menu/ListTemplates`;

let screenshotCounter: { [key: string]: number } = {};

async function takeScreenshot(page: Page, name: string) {
  if (!screenshotCounter[name]) screenshotCounter[name] = 0;
  screenshotCounter[name]++;
  const seq = String(screenshotCounter[name]).padStart(3, '0');
  try {
    if (page.isClosed()) return;
    await page.waitForTimeout(300);
    if (page.isClosed()) return;
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}_${seq}.jpeg`, type: 'jpeg', quality: 85, fullPage: true, timeout: 10000 });
  } catch (e) { console.warn(`Screenshot failed for ${name}: ${e}`); }
}

function resetCounter(name: string) { screenshotCounter[name] = 0; }

async function safeGoto(page: Page, url: string = BASE_URL) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForTimeout(2000);
      return;
    } catch (e) { if (i === 2 || page.isClosed()) throw e; await page.waitForTimeout(2000); }
  }
}

async function loginViaLocalStorage(page: Page) {
  await page.evaluate((info) => { localStorage.setItem('userInfo', JSON.stringify(info)); }, {
    username: 'admin', role: 'Administrator',
    permissions: ["GenerateDucument", "GenerateDoc", "GenerateBatch", "RegdataArchive", "RegdataBatch",
      "UpdateRules", "UpdateUnicodeRules", "ExistingVariables", "UnlockDocument",
      "HDocNumberSeries", "UploadDeleteTemplate", "ListTemplates", "VPPSVinPlate", "ADCAChange",
      "HDocUserAdmin", "HDocUserDocAdmin", "SearchUser", "ChangePassword", "UserPosition",
      "ArchiveSearch", "UploadDocument",
      "UserGuide", "ADCAChangeGuide", "VinPlateGuide", "ArchiveGuide", "Privacy"],
  });
}

async function gotoUD14(page: Page) {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  await page.goto(UD14_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.waitForSelector('.ud14-title', { timeout: 10000 });
}

/** Mock Market List API */
async function mockMarketApi(page: Page, markets: string[], delay: number = 0) {
  await page.route('**/api/ud14/UD14SelectMarketmaster', async (route) => {
    if (delay > 0) await new Promise(r => setTimeout(r, delay));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, data: { markets: markets.map(m => ({ market: m })), totalCount: markets.length } })
    });
  });
}

/** Mock Market List API failure */
async function mockMarketApiFail(page: Page) {
  await page.route('**/api/ud14/UD14SelectMarketmaster', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500, message: 'Error', data: null }) });
  });
}

/** Mock Market List API network error */
async function mockMarketApiNetError(page: Page) {
  await page.route('**/api/ud14/UD14SelectMarketmaster', (route) => route.abort('connectionrefused'));
}

/** Mock File List API */
async function mockFileListApi(page: Page, files: any[], market: string = 'JPN', delay: number = 0) {
  await page.route(/\/api\/ud14\/UD14SelectHdocuserdefinedrules/, async (route) => {
    const url = new URL(route.request().url());
    const mkt = url.searchParams.get('market');
    if (mkt === market) {
      if (delay > 0) await new Promise(r => setTimeout(r, delay));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { files, totalCount: files.length } })
      });
    } else {
      await route.fallback();
    }
  });
}

/** Mock File List API failure */
async function mockFileListApiFail(page: Page, market: string = 'JPN') {
  await page.route(/\/api\/ud14\/UD14SelectHdocuserdefinedrules/, async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('market') === market) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500, message: 'Error', data: null }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock Download API */
async function mockDownloadApi(page: Page, filename: string, status: number = 200) {
  await page.route(/\/api\/ud14\/download/, async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('filename') === filename) {
      if (status === 200) {
        await route.fulfill({ status: 200, body: Buffer.from('fake file content') });
      } else {
        await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ code: 404, message: 'File not found' }) });
      }
    } else {
      await route.fallback();
    }
  });
}

const DEFAULT_FILES = [
  { filename: 'coc_template.docx', used: 'TEMPLATE-VIN-PLATE', lastModified: '2022-01-10 18:29', size: '317 Kb', downloadUrl: '/api/ud14/download?market=JPN&filename=coc_template.docx' },
  { filename: 'vcc_template.docx', used: '', lastModified: '2022-02-15 10:15', size: '128 Kb', downloadUrl: '/api/ud14/download?market=JPN&filename=vcc_template.docx' },
  { filename: 'eec_template.docx', used: 'TEMPLATE-ENGINE', lastModified: '2022-03-20 14:00', size: '512 Kb', downloadUrl: '/api/ud14/download?market=JPN&filename=eec_template.docx' },
];

// ============================================================
// 1. Select Market 下拉列表（No.1-4）
// ============================================================
test.describe.serial('Market下拉（No.1-4）', () => {
  test.setTimeout(120000);

  test('No.1 画面初始化-Market下拉列表加载', async ({ page }) => {
    resetCounter('01_Market下拉加载');
    await mockMarketApi(page, ['JPN', 'CHN', 'DEU']);
    await gotoUD14(page);
    await page.waitForTimeout(2000);
    // 标题
    await expect(page.locator('.ud14-title')).toContainText('List Templates');
    // Market 下拉
    await expect(page.locator('.ud14-select')).toBeVisible();
    const options = page.locator('.ud14-select option');
    await expect(options.nth(0)).toContainText('-- Select Market --');
    await expect(options.nth(1)).toContainText('JPN');
    await expect(options.nth(2)).toContainText('CHN');
    await expect(options.nth(3)).toContainText('DEU');
    // 表格区域初始为空
    await expect(page.locator('.ud14-table')).toHaveCount(0);
    await takeScreenshot(page, '01_Market下拉加载');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
  });

  test('No.2 画面初始化-Market下拉列表为空', async ({ page }) => {
    resetCounter('02_Market空列表');
    await mockMarketApi(page, []);
    await gotoUD14(page);
    await page.waitForTimeout(2000);
    // 仅显示默认选项
    const options = page.locator('.ud14-select option');
    expect(await options.count()).toBe(1);
    await expect(options.nth(0)).toContainText('-- Select Market --');
    // 无错误消息
    await expect(page.locator('.ud14-error')).toHaveCount(0);
    await takeScreenshot(page, '02_Market空列表');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
  });

  test('No.3 画面初始化-加载Market API失败', async ({ page }) => {
    resetCounter('03_Market加载失败');
    await mockMarketApiFail(page);
    await gotoUD14(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud14-error')).toContainText('System error');
    await takeScreenshot(page, '03_Market加载失败');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
  });

  test('No.4 画面初始化-加载Market网络异常', async ({ page }) => {
    resetCounter('04_Market网络异常');
    await mockMarketApiNetError(page);
    await gotoUD14(page);
    await page.waitForTimeout(3000);
    await expect(page.locator('.ud14-error')).toContainText('System error');
    await takeScreenshot(page, '04_Market网络异常');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
  });
});

// ============================================================
// 2. Market选择与文件列表加载（No.5-9）
// ============================================================
test.describe.serial('Market选择与文件加载（No.5-9）', () => {
  test.setTimeout(120000);

  test('No.5 Market选择-加载文件列表成功', async ({ page }) => {
    resetCounter('05_加载文件列表');
    await mockMarketApi(page, ['JPN', 'CHN']);
    await mockFileListApi(page, DEFAULT_FILES, 'JPN');
    await gotoUD14(page);
    await page.waitForTimeout(2000);
    // 选择 Market JPN
    await page.locator('.ud14-select').selectOption('JPN');
    await page.waitForTimeout(2000);
    // 表格显示
    await expect(page.locator('.ud14-table')).toBeVisible();
    const rows = page.locator('.ud14-table tbody tr');
    expect(await rows.count()).toBe(3);
    // 列头
    const headers = page.locator('.ud14-table th');
    await expect(headers.nth(1)).toContainText('Filename');
    await expect(headers.nth(2)).toContainText('Used');
    await expect(headers.nth(3)).toContainText('Last Mod');
    await expect(headers.nth(4)).toContainText('Size');
    await takeScreenshot(page, '05_加载文件列表');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
    await page.unroute(/\/api\/ud14\/UD14SelectHdocuserdefinedrules/);
  });

  test('No.6 Market选择-切换Market重新加载', async ({ page }) => {
    resetCounter('06_Market切换');
    await mockMarketApi(page, ['JPN', 'CHN']);
    await mockFileListApi(page, DEFAULT_FILES, 'JPN');
    await mockFileListApi(page, [
      { filename: 'china_doc.docx', used: 'TEMPLATE-CHINA', lastModified: '2022-04-01 09:00', size: '256 Kb', downloadUrl: '' }
    ], 'CHN');
    await gotoUD14(page);
    await page.waitForTimeout(2000);
    // 选 JPN
    await page.locator('.ud14-select').selectOption('JPN');
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud14-table')).toBeVisible();
    // 切换 CHN
    await page.locator('.ud14-select').selectOption('CHN');
    await page.waitForTimeout(2000);
    const rows = page.locator('.ud14-table tbody tr');
    await expect(rows.first().locator('td').nth(1)).toContainText('china_doc.docx');
    await takeScreenshot(page, '06_Market切换');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
    await page.unroute(/\/api\/ud14\/UD14SelectHdocuserdefinedrules/);
  });

  test('No.7 Market选择-切换为空选项清空', async ({ page }) => {
    resetCounter('07_Market切空');
    await mockMarketApi(page, ['JPN']);
    await mockFileListApi(page, DEFAULT_FILES, 'JPN');
    await gotoUD14(page);
    await page.waitForTimeout(2000);
    // 选 JPN
    await page.locator('.ud14-select').selectOption('JPN');
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud14-table')).toBeVisible();
    // 切回空
    await page.locator('.ud14-select').selectOption('');
    await page.waitForTimeout(500);
    await expect(page.locator('.ud14-table')).toHaveCount(0);
    await takeScreenshot(page, '07_Market切空');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
    await page.unroute(/\/api\/ud14\/UD14SelectHdocuserdefinedrules/);
  });

  test('No.8 Market选择-加载空列表', async ({ page }) => {
    resetCounter('08_空文件列表');
    await mockMarketApi(page, ['XXX']);
    await mockFileListApi(page, [], 'XXX');
    await gotoUD14(page);
    await page.waitForTimeout(2000);
    await page.locator('.ud14-select').selectOption('XXX');
    await page.waitForTimeout(2000);
    // 表格表头保留
    await expect(page.locator('.ud14-table')).toBeVisible();
    // 显示 No templates available
    await expect(page.locator('.ud14-empty')).toContainText('No templates available');
    await takeScreenshot(page, '08_空文件列表');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
    await page.unroute(/\/api\/ud14\/UD14SelectHdocuserdefinedrules/);
  });

  test('No.9 Market选择-加载文件列表API失败', async ({ page }) => {
    resetCounter('09_文件列表加载失败');
    await mockMarketApi(page, ['JPN']);
    await mockFileListApiFail(page, 'JPN');
    await gotoUD14(page);
    await page.waitForTimeout(2000);
    await page.locator('.ud14-select').selectOption('JPN');
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud14-error')).toContainText('System error');
    await takeScreenshot(page, '09_文件列表加载失败');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
    await page.unroute(/\/api\/ud14\/UD14SelectHdocuserdefinedrules/);
  });
});

// ============================================================
// 3. 文件列表表格显示（No.10-16）
// ============================================================
test.describe.serial('表格显示（No.10-16）', () => {
  test.setTimeout(120000);

  test('No.10 表格列头显示', async ({ page }) => {
    resetCounter('10_表格列头');
    await mockMarketApi(page, ['JPN']);
    await mockFileListApi(page, DEFAULT_FILES, 'JPN');
    await gotoUD14(page);
    await page.waitForTimeout(2000);
    await page.locator('.ud14-select').selectOption('JPN');
    await page.waitForTimeout(2000);
    const headers = page.locator('.ud14-table th');
    await expect(headers.nth(0)).toBeVisible(); // icon col
    await expect(headers.nth(1)).toContainText('Filename');
    await expect(headers.nth(2)).toContainText('Used');
    await expect(headers.nth(3)).toContainText('Last Mod');
    await expect(headers.nth(4)).toContainText('Size');
    await takeScreenshot(page, '10_表格列头');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
    await page.unroute(/\/api\/ud14\/UD14SelectHdocuserdefinedrules/);
  });

  test('No.11 Filename列显示', async ({ page }) => {
    resetCounter('11_Filename列');
    await mockMarketApi(page, ['JPN']);
    await mockFileListApi(page, DEFAULT_FILES, 'JPN');
    await gotoUD14(page);
    await page.waitForTimeout(2000);
    await page.locator('.ud14-select').selectOption('JPN');
    await page.waitForTimeout(2000);
    const firstFileLink = page.locator('.ud14-file-link').first();
    await expect(firstFileLink).toContainText('coc_template.docx');
    await expect(firstFileLink).toBeVisible();
    await takeScreenshot(page, '11_Filename列');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
    await page.unroute(/\/api\/ud14\/UD14SelectHdocuserdefinedrules/);
  });

  test('No.12 Used列显示-已引用', async ({ page }) => {
    resetCounter('12_Used已引用');
    await mockMarketApi(page, ['JPN']);
    await mockFileListApi(page, DEFAULT_FILES, 'JPN');
    await gotoUD14(page);
    await page.waitForTimeout(2000);
    await page.locator('.ud14-select').selectOption('JPN');
    await page.waitForTimeout(2000);
    const firstRowCells = page.locator('.ud14-table tbody tr').first().locator('td');
    await expect(firstRowCells.nth(2)).toContainText('TEMPLATE-VIN-PLATE');
    await takeScreenshot(page, '12_Used已引用');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
    await page.unroute(/\/api\/ud14\/UD14SelectHdocuserdefinedrules/);
  });

  test('No.13 Used列显示-未引用', async ({ page }) => {
    resetCounter('13_Used未引用');
    await mockMarketApi(page, ['JPN']);
    await mockFileListApi(page, DEFAULT_FILES, 'JPN');
    await gotoUD14(page);
    await page.waitForTimeout(2000);
    await page.locator('.ud14-select').selectOption('JPN');
    await page.waitForTimeout(2000);
    const secondRowCells = page.locator('.ud14-table tbody tr').nth(1).locator('td');
    await expect(secondRowCells.nth(2)).toContainText('');
    await takeScreenshot(page, '13_Used未引用');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
    await page.unroute(/\/api\/ud14\/UD14SelectHdocuserdefinedrules/);
  });

  test('No.14 Last Mod,列显示', async ({ page }) => {
    resetCounter('14_LastMod列');
    await mockMarketApi(page, ['JPN']);
    await mockFileListApi(page, DEFAULT_FILES, 'JPN');
    await gotoUD14(page);
    await page.waitForTimeout(2000);
    await page.locator('.ud14-select').selectOption('JPN');
    await page.waitForTimeout(2000);
    const firstRowCells = page.locator('.ud14-table tbody tr').first().locator('td');
    await expect(firstRowCells.nth(3)).toContainText('2022-01-10 18:29');
    await takeScreenshot(page, '14_LastMod列');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
    await page.unroute(/\/api\/ud14\/UD14SelectHdocuserdefinedrules/);
  });

  test('No.15 Size列显示', async ({ page }) => {
    resetCounter('15_Size列');
    await mockMarketApi(page, ['JPN']);
    await mockFileListApi(page, DEFAULT_FILES, 'JPN');
    await gotoUD14(page);
    await page.waitForTimeout(2000);
    await page.locator('.ud14-select').selectOption('JPN');
    await page.waitForTimeout(2000);
    const firstRowCells = page.locator('.ud14-table tbody tr').first().locator('td');
    await expect(firstRowCells.nth(4)).toContainText('317 Kb');
    await takeScreenshot(page, '15_Size列');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
    await page.unroute(/\/api\/ud14\/UD14SelectHdocuserdefinedrules/);
  });

  test('No.16 文件列表默认排序', async ({ page }) => {
    resetCounter('16_默认排序');
    const unsortedFiles = [
      { filename: 'vcc_template.docx', used: '', lastModified: '2022-02-15 10:15', size: '128 Kb', downloadUrl: '' },
      { filename: 'coc_template.docx', used: 'TEMPLATE-VIN-PLATE', lastModified: '2022-01-10 18:29', size: '317 Kb', downloadUrl: '' },
      { filename: 'eec_template.docx', used: 'TEMPLATE-ENGINE', lastModified: '2022-03-20 14:00', size: '512 Kb', downloadUrl: '' },
    ];
    await mockMarketApi(page, ['JPN']);
    await mockFileListApi(page, unsortedFiles, 'JPN');
    await gotoUD14(page);
    await page.waitForTimeout(2000);
    await page.locator('.ud14-select').selectOption('JPN');
    await page.waitForTimeout(2000);
    const rows = page.locator('.ud14-table tbody tr');
    // 默认可按文件名升序
    await expect(rows.nth(0).locator('td').nth(1)).toContainText('coc_template.docx');
    await expect(rows.nth(1).locator('td').nth(1)).toContainText('eec_template.docx');
    await expect(rows.nth(2).locator('td').nth(1)).toContainText('vcc_template.docx');
    await takeScreenshot(page, '16_默认排序');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
    await page.unroute(/\/api\/ud14\/UD14SelectHdocuserdefinedrules/);
  });
});

// ============================================================
// 4. 文件下载（No.17-18）
// ============================================================
test.describe.serial('文件下载（No.17-18）', () => {
  test.setTimeout(120000);

  test('No.17 文件下载-点击文件名链接', async ({ page }) => {
    resetCounter('17_文件下载');
    await mockMarketApi(page, ['JPN']);
    await mockFileListApi(page, DEFAULT_FILES, 'JPN');
    await mockDownloadApi(page, 'coc_template.docx', 200);
    await gotoUD14(page);
    await page.waitForTimeout(2000);
    await page.locator('.ud14-select').selectOption('JPN');
    await page.waitForTimeout(2000);
    let downloadTriggered = false;
    page.on('download', () => { downloadTriggered = true; });
    await page.locator('.ud14-file-link').first().click();
    await page.waitForTimeout(2000);
    expect(downloadTriggered).toBe(true);
    await takeScreenshot(page, '17_文件下载');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
    await page.unroute(/\/api\/ud14\/UD14SelectHdocuserdefinedrules/);
    await page.unroute(/\/api\/ud14\/download/);
  });

  test('No.18 文件下载-文件不存在', async ({ page }) => {
    resetCounter('18_文件不存在');
    await mockMarketApi(page, ['JPN']);
    const notFoundFiles = [
      { filename: 'not_found.docx', used: '', lastModified: '2022-01-01 00:00', size: '0 Kb', downloadUrl: '' },
    ];
    await mockFileListApi(page, notFoundFiles, 'JPN');
    await mockDownloadApi(page, 'not_found.docx', 404);
    await gotoUD14(page);
    await page.waitForTimeout(2000);
    await page.locator('.ud14-select').selectOption('JPN');
    await page.waitForTimeout(2000);
    await page.locator('.ud14-file-link').first().click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud14-error')).toContainText('File not found');
    await takeScreenshot(page, '18_文件不存在');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
    await page.unroute(/\/api\/ud14\/UD14SelectHdocuserdefinedrules/);
    await page.unroute(/\/api\/ud14\/download/);
  });
});

// ============================================================
// 5. Loading状态（No.19-20）
// ============================================================
test.describe.serial('Loading状态（No.19-20）', () => {
  test.setTimeout(120000);

  test('No.19 Loading-页面初始化加载市场列表', async ({ page }) => {
    resetCounter('19_Loading初始化');
    await mockMarketApi(page, ['JPN', 'CHN'], 3000);
    await gotoUD14(page);
    await page.waitForTimeout(500);
    await expect(page.locator('.ud14-loading')).toContainText('Loading...');
    await takeScreenshot(page, '19_Loading初始化');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
  });

  test('No.20 Loading-选择Market后加载文件列表', async ({ page }) => {
    resetCounter('20_Loading文件列表');
    await mockMarketApi(page, ['JPN']);
    await mockFileListApi(page, DEFAULT_FILES, 'JPN', 3000);
    await gotoUD14(page);
    await page.waitForTimeout(2000);
    await page.locator('.ud14-select').selectOption('JPN');
    await page.waitForTimeout(500);
    await expect(page.locator('.ud14-loading')).toContainText('Loading...');
    await takeScreenshot(page, '20_Loading文件列表');
    await page.unroute('**/api/ud14/UD14SelectMarketmaster');
    await page.unroute(/\/api\/ud14\/UD14SelectHdocuserdefinedrules/);
  });
});
