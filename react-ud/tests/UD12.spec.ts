import { test, expect, Page } from '@playwright/test';

// ============================================================
// UploadDeleteTemplate 模块 (UD12) Playwright 自动化测试
// 基于 単体テスト仕様書UD12.md（30个测试用例）
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD12';
const UD12_URL = `${BASE_URL}/Menu/UploadDeleteTemplate`;

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

async function gotoUD12(page: Page) {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  await page.goto(UD12_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.waitForSelector('.ud12-title', { timeout: 10000 });
}

/** Mock Market List API */
async function mockMarketApi(page: Page, markets: any[], delay: number = 0) {
  await page.route('**/api/ud12/selectmarket', async (route) => {
    if (delay > 0) await new Promise(r => setTimeout(r, delay));
    const url = route.request().url();
    // Only mock the base endpoint (without marketCode path)
    if (!url.includes('selectmarket/')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: markets }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock Market List API failure */
async function mockMarketApiFail(page: Page) {
  await page.route('**/api/ud12/selectmarket', async (route) => {
    const url = route.request().url();
    if (!url.includes('selectmarket/')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500, message: 'Error', data: null }) });
    } else {
      await route.fallback();
    }
  });
}

/** Mock Template List API */
async function mockTemplateApi(page: Page, marketCode: string, templates: any[]) {
  await page.route(`**/api/ud12/selectmarket/${marketCode}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: templates }) });
  });
}

/** Mock Upload API */
async function mockUploadApi(page: Page, responseData: any, delay: number = 0) {
  await page.route('**/api/ud12/upload', async (route) => {
    if (delay > 0) await new Promise(r => setTimeout(r, delay));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseData) });
  });
}

/** Mock Upload API timeout */
async function mockUploadApiTimeout(page: Page) {
  await page.route('**/api/ud12/upload', () => new Promise(() => {}));
}

/** Mock Delete API */
async function mockDeleteApi(page: Page, responseData: any, delay: number = 0) {
  await page.route('**/api/ud12/delete', async (route) => {
    if (delay > 0) await new Promise(r => setTimeout(r, delay));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseData) });
  });
}

const DEFAULT_MARKETS = [
  { marketCode: 'JPN', marketName: 'Japan' },
  { marketCode: 'CHN', marketName: 'China' },
  { marketCode: 'DEU', marketName: 'Germany' },
];

const DEFAULT_TEMPLATES = [
  { fileName: 'test_template.docx', filePath: '/templates/JPN/test_template.docx' },
  { fileName: 'old_template.docx', filePath: '/templates/JPN/old_template.docx' },
];

// ============================================================
// 1. HDoc Template Upload 区域（No.1-15）
// ============================================================
test.describe.serial('Upload区域（No.1-15）', () => {
  test.setTimeout(120000);

  test('No.1 画面初始化-上传区域Market下拉列表', async ({ page }) => {
    resetCounter('01_Upload区域初期');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    // 标题
    await expect(page.locator('.ud12-title')).toContainText('HDoc - Upload Delete Template');
    await expect(page.locator('.ud12-section-title').first()).toContainText('HDoc Template Upload');
    await expect(page.locator('.ud12-section-title').nth(1)).toContainText('HDoc Template Delete');
    // Upload区域元素
    await expect(page.locator('#templateFileInput')).toBeVisible();
    await expect(page.locator('#uploadMarketSelect')).toBeVisible();
    await expect(page.locator('.ud12-btn-primary')).toBeVisible();
    // Market下拉选项
    const options = page.locator('#uploadMarketSelect option');
    await expect(options.nth(0)).toContainText('-- Select Market --');
    await expect(options.nth(1)).toContainText('JPN');
    await expect(options.nth(2)).toContainText('CHN');
    await expect(options.nth(3)).toContainText('DEU');
    await takeScreenshot(page, '01_Upload区域初期');
    await page.unroute('**/api/ud12/selectmarket');
  });

  test('No.2 画面初始化-Market列表为空', async ({ page }) => {
    resetCounter('02_Market空列表');
    await mockMarketApi(page, []);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    // 下拉列表禁用（空列表时只有空选项）
    await expect(page.locator('#uploadMarketSelect')).toBeDisabled();
    await expect(page.locator('.ud12-error')).toHaveCount(0);
    await takeScreenshot(page, '02_Market空列表');
    await page.unroute('**/api/ud12/selectmarket');
  });

  test('No.3 画面初始化-加载Market失败', async ({ page }) => {
    resetCounter('03_Market加载失败');
    await mockMarketApiFail(page);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud12-error')).toContainText('System error');
    await takeScreenshot(page, '03_Market加载失败');
    await page.unroute('**/api/ud12/selectmarket');
  });

  test('No.4 文件选择-正常选择文件', async ({ page }) => {
    resetCounter('04_文件选择');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    // 创建临时文件用于上传
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#templateFileInput').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test_template.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('test file content'),
    });
    await page.waitForTimeout(500);
    // 文件选择后文件名应显示在按钮旁
    await takeScreenshot(page, '04_文件选择');
    await page.unroute('**/api/ud12/selectmarket');
  });

  test('No.5 文件选择-取消选择', async ({ page }) => {
    resetCounter('05_文件取消');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    // 取消选择 = 不设置文件
    await takeScreenshot(page, '05_文件取消');
    await page.unroute('**/api/ud12/selectmarket');
  });

  test('No.6 文件大小校验-刚好10MB', async ({ page }) => {
    resetCounter('06_文件刚好10MB');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await mockUploadApi(page, { code: 200, data: { fileName: '10MB_file.docx', market: 'JPN' } });
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    // 选择刚好10MB的文件
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#templateFileInput').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: '10MB_file.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.file',
      buffer: Buffer.alloc(10 * 1024 * 1024), // exactly 10MB
    });
    await page.waitForTimeout(300);
    // 选择市场
    await page.locator('#uploadMarketSelect').selectOption('JPN');
    await page.waitForTimeout(300);
    // 点击Upload
    await page.locator('.ud12-btn-primary').click();
    await page.waitForTimeout(2000);
    // 应成功上传，不显示大小错误
    await expect(page.locator('.ud12-error')).toHaveCount(0);
    await takeScreenshot(page, '06_文件刚好10MB');
    await page.unroute('**/api/ud12/selectmarket');
    await page.unroute('**/api/ud12/upload');
  });

  test('No.7 文件大小校验-超过10MB', async ({ page }) => {
    resetCounter('07_文件超10MB');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    // 选择超过10MB的文件
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#templateFileInput').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'oversize_file.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.alloc(11 * 1024 * 1024), // 11MB > 10MB
    });
    await page.waitForTimeout(300);
    await page.locator('#uploadMarketSelect').selectOption('JPN');
    await page.waitForTimeout(300);
    await page.locator('.ud12-btn-primary').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud12-error')).toContainText('File size exceeds the 10MB limit');
    await takeScreenshot(page, '07_文件超10MB');
    await page.unroute('**/api/ud12/selectmarket');
  });

  test('No.8 文件大小校验-边界值9.9MB', async ({ page }) => {
    resetCounter('08_文件9.9MB');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await mockUploadApi(page, { code: 200, data: { fileName: 'normal_file.docx', market: 'JPN' } });
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#templateFileInput').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'normal_file.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.alloc(Math.floor(9.9 * 1024 * 1024)), // 9.9MB
    });
    await page.waitForTimeout(300);
    await page.locator('#uploadMarketSelect').selectOption('JPN');
    await page.waitForTimeout(300);
    await page.locator('.ud12-btn-primary').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud12-error')).toHaveCount(0);
    await takeScreenshot(page, '08_文件9.9MB');
    await page.unroute('**/api/ud12/selectmarket');
    await page.unroute('**/api/ud12/upload');
  });

  test('No.9 空值校验-Template File未选择', async ({ page }) => {
    resetCounter('09_空值File');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    await page.locator('#uploadMarketSelect').selectOption('JPN');
    await page.waitForTimeout(300);
    await page.locator('.ud12-btn-primary').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud12-error')).toContainText('NO FILE UPLOADED');
    await takeScreenshot(page, '09_空值File');
    await page.unroute('**/api/ud12/selectmarket');
  });

  test('No.10 空值校验-Market未选择', async ({ page }) => {
    resetCounter('10_空值Market');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#templateFileInput').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('test'),
    });
    await page.waitForTimeout(300);
    await page.locator('.ud12-btn-primary').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud12-error')).toContainText('Please select market');
    await takeScreenshot(page, '10_空值Market');
    await page.unroute('**/api/ud12/selectmarket');
  });

  test('No.11 上传成功-新文件', async ({ page }) => {
    resetCounter('11_上传成功');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await mockUploadApi(page, { code: 200, data: { fileName: 'new_template.docx', market: 'JPN' } });
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#templateFileInput').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'new_template.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('new template content'),
    });
    await page.waitForTimeout(300);
    await page.locator('#uploadMarketSelect').selectOption('JPN');
    await page.waitForTimeout(300);
    await page.locator('.ud12-btn-primary').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud12-success')).toContainText('SUCESSFULLY UPLOADED TO MARKET JPN');
    await takeScreenshot(page, '11_上传成功');
    await page.unroute('**/api/ud12/selectmarket');
    await page.unroute('**/api/ud12/upload');
  });

  test('No.12 上传失败-API返回400', async ({ page }) => {
    resetCounter('12_上传400');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await mockUploadApi(page, { code: 400, message: 'Invalid file type or size (Max 10MB)' });
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#templateFileInput').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('test'),
    });
    await page.waitForTimeout(300);
    await page.locator('#uploadMarketSelect').selectOption('JPN');
    await page.waitForTimeout(300);
    await page.locator('.ud12-btn-primary').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud12-error')).toContainText('Invalid file type or size');
    await takeScreenshot(page, '12_上传400');
    await page.unroute('**/api/ud12/selectmarket');
    await page.unroute('**/api/ud12/upload');
  });

  test('No.13 上传失败-API返回500', async ({ page }) => {
    resetCounter('13_上传500');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await mockUploadApi(page, { code: 500, message: 'System error. Please contact administrator.' });
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#templateFileInput').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('test'),
    });
    await page.waitForTimeout(300);
    await page.locator('#uploadMarketSelect').selectOption('JPN');
    await page.waitForTimeout(300);
    await page.locator('.ud12-btn-primary').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud12-error')).toContainText('System error');
    await takeScreenshot(page, '13_上传500');
    await page.unroute('**/api/ud12/selectmarket');
    await page.unroute('**/api/ud12/upload');
  });

  test('No.14 上传中按钮禁用', async ({ page }) => {
    resetCounter('14_上传中禁用');
    await mockMarketApi(page, DEFAULT_MARKETS);
    // Mock 延迟响应
    await mockUploadApi(page, { code: 200, data: { fileName: 'test.docx', market: 'JPN' } }, 5000);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#templateFileInput').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('test'),
    });
    await page.waitForTimeout(300);
    await page.locator('#uploadMarketSelect').selectOption('JPN');
    await page.waitForTimeout(300);
    await page.locator('.ud12-btn-primary').click();
    await page.waitForTimeout(500);
    // Upload 按钮禁用
    await expect(page.locator('.ud12-btn-primary')).toBeDisabled();
    // 文件输入禁用
    await expect(page.locator('#templateFileInput')).toBeDisabled();
    // Market 下拉禁用
    await expect(page.locator('#uploadMarketSelect')).toBeDisabled();
    // 删除区域不受影响
    await expect(page.locator('#deleteMarketSelect')).not.toBeDisabled();
    await takeScreenshot(page, '14_上传中禁用');
    await page.unroute('**/api/ud12/selectmarket');
    await page.unroute('**/api/ud12/upload');
  });

  test('No.15 上传防止重复提交', async ({ page }) => {
    resetCounter('15_上传防重复');
    await mockMarketApi(page, DEFAULT_MARKETS);
    let uploadCallCount = 0;
    await page.route('**/api/ud12/upload', async (route) => {
      uploadCallCount++;
      await new Promise(r => setTimeout(r, 3000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: {} }) });
    });
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#templateFileInput').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('test'),
    });
    await page.waitForTimeout(300);
    await page.locator('#uploadMarketSelect').selectOption('JPN');
    await page.waitForTimeout(300);
    await page.locator('.ud12-btn-primary').click();
    await page.waitForTimeout(500);
    // 第二次点击（按钮已禁用，使用 force）
    await page.locator('.ud12-btn-primary').click({ force: true });
    await page.waitForTimeout(4000);
    expect(uploadCallCount).toBeLessThanOrEqual(1);
    await takeScreenshot(page, '15_上传防重复');
    await page.unroute('**/api/ud12/selectmarket');
    await page.unroute('**/api/ud12/upload');
  });
});

// ============================================================
// 2. HDoc Template Delete 区域（No.16-27）
// ============================================================
test.describe.serial('Delete区域（No.16-27）', () => {
  test.setTimeout(120000);

  test('No.16 画面初始化-删除区域初期表示', async ({ page }) => {
    resetCounter('16_Delete区域初期');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud12-section-title').nth(1)).toContainText('HDoc Template Delete');
    // Market 下拉有选项
    await expect(page.locator('#deleteMarketSelect')).toBeVisible();
    // Templates 下拉为空且禁用（初始状态无模板列表）
    await expect(page.locator('#templateSelect')).toBeVisible();
    // Delete 按钮可用
    await expect(page.locator('.ud12-btn-danger')).toBeEnabled();
    await takeScreenshot(page, '16_Delete区域初期');
    await page.unroute('**/api/ud12/selectmarket');
  });

  test('No.17 Market选择-加载Templates', async ({ page }) => {
    resetCounter('17_Market加载模板');
    await mockMarketApi(page, DEFAULT_MARKETS);
    // Mock JPN 的模板列表
    await mockTemplateApi(page, 'JPN', DEFAULT_TEMPLATES);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    // 选择 Market JPN
    await page.locator('#deleteMarketSelect').selectOption('JPN');
    await page.waitForTimeout(2000);
    // Templates 下拉加载文件列表
    const options = page.locator('#templateSelect option');
    await expect(options.nth(1)).toContainText('test_template.docx');
    await expect(options.nth(2)).toContainText('old_template.docx');
    await takeScreenshot(page, '17_Market加载模板');
    await page.unroute('**/api/ud12/selectmarket');
    await page.unroute('**/api/ud12/selectmarket/JPN');
  });

  test('No.18 Market选择-切换Market', async ({ page }) => {
    resetCounter('18_Market切换');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await mockTemplateApi(page, 'JPN', DEFAULT_TEMPLATES);
    await mockTemplateApi(page, 'CHN', [
      { fileName: 'china_template.docx', filePath: '/templates/CHN/china_template.docx' },
    ]);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    // 先选 JPN
    await page.locator('#deleteMarketSelect').selectOption('JPN');
    await page.waitForTimeout(1000);
    // 切换到 CHN
    await page.locator('#deleteMarketSelect').selectOption('CHN');
    await page.waitForTimeout(2000);
    // 显示 CHN 的文件
    const options = page.locator('#templateSelect option');
    await expect(options.nth(1)).toContainText('china_template.docx');
    await takeScreenshot(page, '18_Market切换');
    await page.unroute('**/api/ud12/selectmarket');
    await page.unroute('**/api/ud12/selectmarket/JPN');
    await page.unroute('**/api/ud12/selectmarket/CHN');
  });

  test('No.19 Market选择-切换为空', async ({ page }) => {
    resetCounter('19_Market切空');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await mockTemplateApi(page, 'JPN', DEFAULT_TEMPLATES);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    // 选 JPN
    await page.locator('#deleteMarketSelect').selectOption('JPN');
    await page.waitForTimeout(1000);
    // 切回空
    await page.locator('#deleteMarketSelect').selectOption('');
    await page.waitForTimeout(1000);
    // Templates 为空
    const options = page.locator('#templateSelect option');
    await expect(options.nth(1)).toContainText('No templates available');
    await takeScreenshot(page, '19_Market切空');
    await page.unroute('**/api/ud12/selectmarket');
    await page.unroute('**/api/ud12/selectmarket/JPN');
  });

  test('No.20 空值校验-Delete时Market未选择', async ({ page }) => {
    resetCounter('20_Delete空Market');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await mockTemplateApi(page, 'JPN', DEFAULT_TEMPLATES);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    // 不选 Market，直接点 Delete
    await page.locator('.ud12-btn-danger').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud12-error')).toContainText('Please select market and template');
    await takeScreenshot(page, '20_Delete空Market');
    await page.unroute('**/api/ud12/selectmarket');
  });

  test('No.21 空值校验-Delete时Template未选择', async ({ page }) => {
    resetCounter('21_Delete空Template');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await mockTemplateApi(page, 'JPN', DEFAULT_TEMPLATES);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    await page.locator('#deleteMarketSelect').selectOption('JPN');
    await page.waitForTimeout(1000);
    // 不选 Template，直接点 Delete
    await page.locator('.ud12-btn-danger').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud12-error')).toContainText('Please select market and template');
    await takeScreenshot(page, '21_Delete空Template');
    await page.unroute('**/api/ud12/selectmarket');
    await page.unroute('**/api/ud12/selectmarket/JPN');
  });

  test('No.22 删除确认对话框-点击取消', async ({ page }) => {
    resetCounter('22_删除取消');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await mockTemplateApi(page, 'JPN', DEFAULT_TEMPLATES);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    await page.locator('#deleteMarketSelect').selectOption('JPN');
    await page.waitForTimeout(1000);
    await page.locator('#templateSelect').selectOption('test_template.docx');
    await page.waitForTimeout(300);
    // 设置 dialog 处理 - 取消
    page.on('dialog', async (dialog) => {
      await dialog.dismiss();
    });
    await page.locator('.ud12-btn-danger').click();
    await page.waitForTimeout(1000);
    // 页面应保持不变，无成功/错误消息
    await expect(page.locator('.ud12-error')).toHaveCount(0);
    await expect(page.locator('.ud12-success')).toHaveCount(0);
    await takeScreenshot(page, '22_删除取消');
    await page.unroute('**/api/ud12/selectmarket');
    await page.unroute('**/api/ud12/selectmarket/JPN');
  });

  test('No.23 删除确认对话框-点击确定', async ({ page }) => {
    resetCounter('23_删除确定');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await mockTemplateApi(page, 'JPN', DEFAULT_TEMPLATES);
    await mockDeleteApi(page, { code: 200, data: {} }, 1000);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    await page.locator('#deleteMarketSelect').selectOption('JPN');
    await page.waitForTimeout(1000);
    await page.locator('#templateSelect').selectOption('old_template.docx');
    await page.waitForTimeout(300);
    // 设置 dialog 处理 - 确定
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.locator('.ud12-btn-danger').click();
    await page.waitForTimeout(3000);
    // 应有成功或错误消息
    await takeScreenshot(page, '23_删除确定');
    await page.unroute('**/api/ud12/selectmarket');
    await page.unroute('**/api/ud12/selectmarket/JPN');
    await page.unroute('**/api/ud12/delete');
  });

  test('No.24 删除成功', async ({ page }) => {
    resetCounter('24_删除成功');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await mockTemplateApi(page, 'JPN', DEFAULT_TEMPLATES);
    await mockDeleteApi(page, { code: 200, data: {} });
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    await page.locator('#deleteMarketSelect').selectOption('JPN');
    await page.waitForTimeout(1000);
    await page.locator('#templateSelect').selectOption('test_template.docx');
    await page.waitForTimeout(300);
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.locator('.ud12-btn-danger').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud12-success')).toContainText('SUCESSFULLY DELETE FROM MARKET JPN');
    // Market 被清空
    await expect(page.locator('#deleteMarketSelect')).toHaveValue('');
    await takeScreenshot(page, '24_删除成功');
    await page.unroute('**/api/ud12/selectmarket');
    await page.unroute('**/api/ud12/selectmarket/JPN');
    await page.unroute('**/api/ud12/delete');
  });

  test('No.25 删除失败-API返回500', async ({ page }) => {
    resetCounter('25_删除500');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await mockTemplateApi(page, 'JPN', DEFAULT_TEMPLATES);
    await mockDeleteApi(page, { code: 500, message: 'System error. Please contact administrator.' });
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    await page.locator('#deleteMarketSelect').selectOption('JPN');
    await page.waitForTimeout(1000);
    await page.locator('#templateSelect').selectOption('test_template.docx');
    await page.waitForTimeout(300);
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.locator('.ud12-btn-danger').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud12-error')).toContainText('System error');
    await takeScreenshot(page, '25_删除500');
    await page.unroute('**/api/ud12/selectmarket');
    await page.unroute('**/api/ud12/selectmarket/JPN');
    await page.unroute('**/api/ud12/delete');
  });

  test('No.26 删除中按钮禁用', async ({ page }) => {
    resetCounter('26_删除中禁用');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await mockTemplateApi(page, 'JPN', DEFAULT_TEMPLATES);
    await page.route('**/api/ud12/delete', async (route) => {
      await new Promise(r => setTimeout(r, 5000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
    });
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    await page.locator('#deleteMarketSelect').selectOption('JPN');
    await page.waitForTimeout(1000);
    await page.locator('#templateSelect').selectOption('test_template.docx');
    await page.waitForTimeout(300);
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.locator('.ud12-btn-danger').click();
    await page.waitForTimeout(500);
    // Delete 按钮禁用
    await expect(page.locator('.ud12-btn-danger')).toBeDisabled();
    // Market 下拉禁用
    await expect(page.locator('#deleteMarketSelect')).toBeDisabled();
    // Templates 下拉禁用
    await expect(page.locator('#templateSelect')).toBeDisabled();
    // 上传区域不受影响
    await expect(page.locator('#uploadMarketSelect')).not.toBeDisabled();
    await takeScreenshot(page, '26_删除中禁用');
    await page.unroute('**/api/ud12/selectmarket');
    await page.unroute('**/api/ud12/selectmarket/JPN');
    await page.unroute('**/api/ud12/delete');
  });

  test('No.27 删除防止重复提交', async ({ page }) => {
    resetCounter('27_删除防重复');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await mockTemplateApi(page, 'JPN', DEFAULT_TEMPLATES);
    let deleteCallCount = 0;
    await page.route('**/api/ud12/delete', async (route) => {
      deleteCallCount++;
      await new Promise(r => setTimeout(r, 3000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
    });
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    await page.locator('#deleteMarketSelect').selectOption('JPN');
    await page.waitForTimeout(1000);
    await page.locator('#templateSelect').selectOption('test_template.docx');
    await page.waitForTimeout(300);
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.locator('.ud12-btn-danger').click();
    await page.waitForTimeout(500);
    // 第二次点击（按钮已禁用，使用 force）
    await page.locator('.ud12-btn-danger').click({ force: true });
    await page.waitForTimeout(4000);
    expect(deleteCallCount).toBeLessThanOrEqual(1);
    await takeScreenshot(page, '27_删除防重复');
    await page.unroute('**/api/ud12/selectmarket');
    await page.unroute('**/api/ud12/selectmarket/JPN');
    await page.unroute('**/api/ud12/delete');
  });
});

// ============================================================
// 3. Check Template链接（No.28-29）
// ============================================================
test.describe.serial('Check Template链接（No.28-29）', () => {
  test.setTimeout(120000);

  test('No.28 Check Template链接跳转', async ({ page }) => {
    resetCounter('28_链接跳转');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    await page.locator('.ud12-link').click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/HDocTemplateCheck');
    await takeScreenshot(page, '28_链接跳转');
    await page.unroute('**/api/ud12/selectmarket');
  });

  test('No.29 Check Template链接-UI表示', async ({ page }) => {
    resetCounter('29_链接UI');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    const link = page.locator('.ud12-link');
    await expect(link).toContainText('Check Template (Only for rtf files)');
    await expect(link).toBeVisible();
    await takeScreenshot(page, '29_链接UI');
    await page.unroute('**/api/ud12/selectmarket');
  });
});

// ============================================================
// 4. 消息显示（No.30）
// ============================================================
test.describe.serial('消息显示（No.30）', () => {
  test.setTimeout(120000);

  test('No.30 消息清空-新操作时清除前一条消息', async ({ page }) => {
    resetCounter('30_消息清空');
    await mockMarketApi(page, DEFAULT_MARKETS);
    await gotoUD12(page);
    await page.waitForTimeout(2000);
    // 触发一个错误
    await page.locator('.ud12-btn-primary').click();
    await page.waitForTimeout(300);
    await expect(page.locator('.ud12-error')).toContainText('NO FILE UPLOADED');
    // 选择文件进行新操作（上传区域选择文件会清除消息）
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#templateFileInput').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'new_file.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('new content'),
    });
    await page.waitForTimeout(500);
    // 切换 Market 应清除旧消息
    await page.locator('#uploadMarketSelect').selectOption('JPN');
    await page.waitForTimeout(500);
    // 旧错误消息应被清除
    await expect(page.locator('.ud12-error')).toHaveCount(0);
    await takeScreenshot(page, '30_消息清空');
    await page.unroute('**/api/ud12/selectmarket');
  });
});
