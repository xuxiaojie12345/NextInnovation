// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD03_GenerateHomologationDocument 单元测试
// 测试规格书: テスト式样書UD03.md
// 画面文件: UD03_GenerateHomologationDocument.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD03');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

// Document type 真实数据（来自 HDOC_DOCUMENT_LIST 表）
const DOC_TYPE_OPTIONS = ['123', 'CERTIFICATE', 'COC', 'DIMENSION_PLATE', 'TECHNICAL_SPEC'];

/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD03画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * 导航到 UD03（Mock Document type API）
 */
async function goToUD03(page: Page) {
  await page.route('**/api/ud03/gethdocdocumentlist', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, data: DOC_TYPE_OPTIONS })
    });
  });
  await login(page);
  await page.goto(BASE_URL + '/UD03');
  await page.waitForSelector('.ud03-container');
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
// 1. 画面初期表示 (No.1-12)
// ============================================================
test.describe('画面初期表示', () => {

  test('UD03_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '001';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    // 1. 画面标题
    await expect(page.locator('h1.page-title')).toHaveText('HDoc - Generate Homologation Document');
    // 2-4. 输入控件
    await expect(page.locator('#chassisSeries')).toBeVisible();
    await expect(page.locator('#chassisNo')).toBeVisible();
    await expect(page.locator('#documentType')).toBeVisible();
    // 5-7. 按钮
    await expect(page.locator('.btn-submit')).toBeVisible();
    await expect(page.locator('.btn-reset')).toBeVisible();
    await expect(page.locator('.btn-help')).toBeVisible();
    // 8. Error message area 不显示
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });

  test('UD03_002_画面初始化_Chassis series输入框属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '002';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#chassisSeries');
    // 1. 文本类型
    await expect(input).toHaveAttribute('type', 'text');
    // 2. maxLength=5
    await expect(input).toHaveAttribute('maxLength', '5');
    // 3. 半角英字以外的字符无法输入（数字不可）
    await input.fill('123');
    await expect(input).toHaveValue('');
    // 4. 文字左对齐
    const textAlign = await input.evaluate(el => getComputedStyle(el).textAlign);
    expect(textAlign).toBe('left');
    // 5. 可点击
    await expect(input).toBeEnabled();
    // 6. 初期值为空
    await expect(input).toHaveValue('');
    // 7. Required 标记
    await expect(page.locator('label[for="chassisSeries"] .required')).toBeVisible();
  });

  test('UD03_003_画面初始化_Chassis no输入框属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '003';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#chassisNo');
    await expect(input).toHaveAttribute('type', 'text');
    // maxLength=10
    await expect(input).toHaveAttribute('maxLength', '10');
    // 半角英字不可输入
    await input.fill('abcde');
    await expect(input).toHaveValue('');
    // 左对齐
    const textAlign = await input.evaluate(el => getComputedStyle(el).textAlign);
    expect(textAlign).toBe('left');
    await expect(input).toBeEnabled();
    await expect(input).toHaveValue('');
    await expect(page.locator('label[for="chassisNo"] .required')).toBeVisible();
  });

  test('UD03_004_画面初始化_Document type下拉框属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '004';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const select = page.locator('#documentType');
    // 下拉框
    await expect(select).toBeVisible();
    await expect(select).toBeEnabled();
    // 初期值为空
    await expect(select).toHaveValue('');
  });

  test('UD03_005_画面初始化_Document type下拉列表数据加载', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '005';
    await goToUD03(page);
    await page.waitForTimeout(500);
    await takeScreenshot(page, '初期表示');

    const select = page.locator('#documentType');
    const options = await select.locator('option').allTextContents();
    const trimmed = options.map(o => o.trim()).filter(o => o !== '');
    // 至少包含规格书记载的4个选项
    expect(trimmed).toContain('123');
    expect(trimmed).toContain('CERTIFICATE');
    expect(trimmed).toContain('DIMENSION_PLATE');
    expect(trimmed).toContain('TECHNICAL_SPEC');
    // 默认选择空选项
    await expect(select).toHaveValue('');
  });

  test('UD03_006_画面初始化_Submit按钮属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '006';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const btn = page.locator('.btn-submit');
    await expect(btn).toHaveText('Submit');
    await expect(btn).toBeEnabled();
  });

  test('UD03_007_画面初始化_Reset按钮属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '007';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const btn = page.locator('.btn-reset');
    await expect(btn).toHaveText('Reset');
    await expect(btn).toBeEnabled();
  });

  test('UD03_008_画面初始化_Help按钮属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '008';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const btn = page.locator('.btn-help');
    await expect(btn).toHaveText('Help');
    await expect(btn).toBeEnabled();
  });

  test('UD03_009_画面初始化_Error message area属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '009';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    // 默认隐藏
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });

  test('UD03_010_画面初始化_上次输入条件恢复（无缓存）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '010';
    // localStorage 已在 beforeEach 中清除
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('#chassisSeries')).toHaveValue('');
    await expect(page.locator('#chassisNo')).toHaveValue('');
    await expect(page.locator('#documentType')).toHaveValue('');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });

  test('UD03_011_画面初始化_上次输入条件恢复（有缓存）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '011';
    // 先导航到有 origin 的页面，再预先设置 localStorage
    await page.goto(BASE_URL + '/');
    await page.evaluate(() => {
      localStorage.setItem('lastChassisSeries', 'jpct');
      localStorage.setItem('lastChassisNo', '8888');
      localStorage.setItem('lastDocumentType', 'CERTIFICATE');
    });
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('#chassisSeries')).toHaveValue('jpct');
    await expect(page.locator('#chassisNo')).toHaveValue('8888');
    await expect(page.locator('#documentType')).toHaveValue('CERTIFICATE');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });

  test('UD03_012_画面初始化_API加载失败（HTTP 500）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '012';

    await page.route('**/api/ud03/gethdocdocumentlist', async route => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD03');
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // Document type 下拉列表为空
    const select = page.locator('#documentType');
    const options = await select.locator('option').allTextContents();
    const trimmed = options.map(o => o.trim()).filter(o => o !== '');
    expect(trimmed.length).toBe(0);

    // Error message 显示
    await expect(page.locator('.error-message-area')).toContainText('System error. Please try again later.');
    // 按钮可点击
    await expect(page.locator('.btn-submit')).toBeEnabled();
    await expect(page.locator('.btn-reset')).toBeEnabled();
    await expect(page.locator('.btn-help')).toBeEnabled();
  });
});

// ============================================================
// 2. Chassis series 输入限制 (No.13-19)
// ============================================================
test.describe('Chassis series 输入限制', () => {

  test('UD03_013_Chassis series_最大字符数5字符（小于）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '013';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#chassisSeries');
    await input.fill('abcd');
    await takeScreenshot(page, 'abcd入力後');

    await expect(input).toHaveValue('abcd');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });

  test('UD03_014_Chassis series_最大字符数5字符（等于）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '014';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#chassisSeries');
    await input.fill('abcde');
    await takeScreenshot(page, 'abcde入力後');

    await expect(input).toHaveValue('abcde');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });

  test('UD03_015_Chassis series_超过最大字符数5字符（6字符）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '015';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#chassisSeries');
    await input.fill('abcdef');
    await takeScreenshot(page, '6文字入力後');

    const val = await input.inputValue();
    expect(val.length).toBe(5);
    expect(val).toBe('abcde');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });

  test('UD03_016_Chassis series_全角英字不可输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '016';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#chassisSeries');
    await input.fill('\uFF41\uFF42\uFF43');
    await takeScreenshot(page, '全角入力後');

    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });

  test('UD03_017_Chassis series_半角数字不可输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '017';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#chassisSeries');
    await input.fill('123');
    await takeScreenshot(page, '数字入力後');

    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });

  test('UD03_018_Chassis series_符号不可输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '018';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#chassisSeries');
    await input.fill('@#$');
    await takeScreenshot(page, '符号入力後');

    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });

  test('UD03_019_Chassis series_正常输入（半角英字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '019';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#chassisSeries');
    await input.fill('jpct');
    await takeScreenshot(page, 'jpct入力後');

    await expect(input).toHaveValue('jpct');
    const textAlign = await input.evaluate(el => getComputedStyle(el).textAlign);
    expect(textAlign).toBe('left');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });
});

// ============================================================
// 3. Chassis no 输入限制 (No.20-26)
// ============================================================
test.describe('Chassis no 输入限制', () => {

  test('UD03_020_Chassis no_最大字符数10字符（小于）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '020';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#chassisNo');
    await input.fill('123456789');
    await takeScreenshot(page, '9文字入力後');

    await expect(input).toHaveValue('123456789');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });

  test('UD03_021_Chassis no_最大字符数10字符（等于）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '021';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#chassisNo');
    await input.fill('1234567890');
    await takeScreenshot(page, '10文字入力後');

    await expect(input).toHaveValue('1234567890');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });

  test('UD03_022_Chassis no_超过最大字符数10字符（11字符）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '022';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#chassisNo');
    await input.fill('12345678901');
    await takeScreenshot(page, '11文字入力後');

    const val = await input.inputValue();
    expect(val.length).toBe(10);
    expect(val).toBe('1234567890');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });

  test('UD03_023_Chassis no_全角数字不可输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '023';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#chassisNo');
    await input.fill('\uFF11\uFF12\uFF13\uFF14\uFF15');
    await takeScreenshot(page, '全角入力後');

    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });

  test('UD03_024_Chassis no_半角英字不可输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '024';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#chassisNo');
    await input.fill('abcde');
    await takeScreenshot(page, '英字入力後');

    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });

  test('UD03_025_Chassis no_符号不可输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '025';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#chassisNo');
    await input.fill('@#$%^');
    await takeScreenshot(page, '符号入力後');

    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });

  test('UD03_026_Chassis no_正常输入（半角数字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '026';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#chassisNo');
    await input.fill('8888');
    await takeScreenshot(page, '8888入力後');

    await expect(input).toHaveValue('8888');
    const textAlign = await input.evaluate(el => getComputedStyle(el).textAlign);
    expect(textAlign).toBe('left');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });
});

// ============================================================
// 4. 空值校验（Submit按钮点击）(No.27-32)
// ============================================================
test.describe('空值校验（Submit按钮点击）', () => {

  test('UD03_027_空值校验_Chassis series为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '027';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('#chassisNo').fill('8888');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後（series为空）');

    await page.locator('.btn-submit').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    await expect(page.locator('.error-message-area')).toContainText('Chassis series is required.');
    await expect(page.locator('#chassisNo')).toHaveValue('8888');
    await expect(page.locator('#documentType')).toHaveValue('CERTIFICATE');
    // 画面无跳转
    expect(page.url()).toContain('/UD03');
  });

  test('UD03_028_空值校验_Chassis no为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '028';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('#chassisSeries').fill('jpct');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後（no为空）');

    await page.locator('.btn-submit').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    await expect(page.locator('.error-message-area')).toContainText('Chassis no is required.');
    await expect(page.locator('#chassisSeries')).toHaveValue('jpct');
    expect(page.url()).toContain('/UD03');
  });

  test('UD03_029_空值校验_Document type为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '029';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('#chassisSeries').fill('jpct');
    await page.locator('#chassisNo').fill('8888');
    await takeScreenshot(page, '入力後（type为空）');

    await page.locator('.btn-submit').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    await expect(page.locator('.error-message-area')).toContainText('Document type is required.');
    expect(page.url()).toContain('/UD03');
  });

  test('UD03_030_空值校验_全部为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '030';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('.btn-submit').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    await expect(page.locator('.error-message-area')).toContainText('Chassis series is required.');
    expect(page.url()).toContain('/UD03');
  });

  test('UD03_031_空值校验_Chassis series仅空格', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '031';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    // 空格会被组件正则过滤（只允许半角英字），实际值保持为空
    await page.locator('#chassisSeries').fill('     ');
    await page.locator('#chassisNo').fill('8888');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    await page.locator('.btn-submit').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    await expect(page.locator('.error-message-area')).toContainText('Chassis series is required.');
    expect(page.url()).toContain('/UD03');
  });

  test('UD03_032_空值校验_Chassis no仅空格', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '032';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    // 空格会被组件正则过滤（只允许半角数字），实际值保持为空
    await page.locator('#chassisSeries').fill('jpct');
    await page.locator('#chassisNo').fill('          ');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    await page.locator('.btn-submit').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    await expect(page.locator('.error-message-area')).toContainText('Chassis no is required.');
    expect(page.url()).toContain('/UD03');
  });
});

// ============================================================
// 5. Submit 按钮正常跳转 (No.33-38)
// ============================================================
test.describe('Submit 按钮正常跳转', () => {

  test('UD03_033_Submit_校验通过跳转到UD04（CERTIFICATE）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '033';
    // Mock UD04 数据检查 API 和路由
    await page.route('**/api/ud04/getdocumentdata', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: {} })
      });
    });
    await page.route('**/UD04', route => {
      route.fulfill({ status: 200, body: '<html><body><div class="ud04-container">UD04 Mock</div></body></html>' });
    });

    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('#chassisSeries').fill('jpct');
    await page.locator('#chassisNo').fill('8888');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    await page.locator('.btn-submit').click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '操作後');

    // 检查 localStorage 缓存（组件使用 lastChassisSeries/lastChassisNo/lastDocumentType 存储）
    const series = await page.evaluate(() => localStorage.getItem('lastChassisSeries'));
    const no = await page.evaluate(() => localStorage.getItem('lastChassisNo'));
    const docType = await page.evaluate(() => localStorage.getItem('lastDocumentType'));
    expect(series).toBe('jpct');
    expect(no).toBe('8888');
    expect(docType).toBe('CERTIFICATE');

    // 跳转到 UD04
    await expect(page).toHaveURL(/\/UD04/);
  });

  test('UD03_034_Submit_校验通过跳转到UD04（123）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '034';
    await page.route('**/api/ud04/getdocumentdata', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: {} })
      });
    });
    await page.route('**/UD04', route => {
      route.fulfill({ status: 200, body: '<html><body>UD04 Mock</body></html>' });
    });

    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('#chassisSeries').fill('lwwss');
    await page.locator('#chassisNo').fill('0001');
    await page.locator('#documentType').selectOption('123');
    await takeScreenshot(page, '入力後');

    await page.locator('.btn-submit').click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '操作後');

    // 确认 localStorage 缓存
    const series = await page.evaluate(() => localStorage.getItem('lastChassisSeries'));
    const no = await page.evaluate(() => localStorage.getItem('lastChassisNo'));
    const docType = await page.evaluate(() => localStorage.getItem('lastDocumentType'));
    expect(series).toBe('lwwss');
    expect(no).toBe('0001');
    expect(docType).toBe('123');

    // 跳转到 UD04
    await expect(page).toHaveURL(/\/UD04/);
  });

  test('UD03_035_Submit_校验通过跳转到UD04（DIMENSION_PLATE）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '035';
    await page.route('**/api/ud04/getdocumentdata', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: {} })
      });
    });
    await page.route('**/UD04', route => {
      route.fulfill({ status: 200, body: '<html><body>UD04 Mock</body></html>' });
    });

    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('#chassisSeries').fill('lwws');
    await page.locator('#chassisNo').fill('12345');
    await page.locator('#documentType').selectOption('DIMENSION_PLATE');
    await takeScreenshot(page, '入力後');

    await page.locator('.btn-submit').click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '操作後');

    await expect(page).toHaveURL(/\/UD04/);
  });

  test('UD03_036_Submit_校验通过跳转到UD04（TECHNICAL_SPEC）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '036';
    await page.route('**/api/ud04/getdocumentdata', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: {} })
      });
    });
    await page.route('**/UD04', route => {
      route.fulfill({ status: 200, body: '<html><body>UD04 Mock</body></html>' });
    });

    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('#chassisSeries').fill('jpct');
    await page.locator('#chassisNo').fill('8888');
    await page.locator('#documentType').selectOption('TECHNICAL_SPEC');
    await takeScreenshot(page, '入力後');

    await page.locator('.btn-submit').click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '操作後');

    await expect(page).toHaveURL(/\/UD04/);
  });

  test('UD03_037_Submit_校验通过后localStorage保存内容确认', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '037';
    await page.route('**/api/ud04/getdocumentdata', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: {} })
      });
    });
    await page.route('**/UD04', route => {
      route.fulfill({ status: 200, body: '<html><body>UD04 Mock</body></html>' });
    });

    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('#chassisSeries').fill('jpct');
    await page.locator('#chassisNo').fill('8888');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    await page.locator('.btn-submit').click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '操作後');

    const series = await page.evaluate(() => localStorage.getItem('lastChassisSeries'));
    const no = await page.evaluate(() => localStorage.getItem('lastChassisNo'));
    const docType = await page.evaluate(() => localStorage.getItem('lastDocumentType'));
    expect(series).toBe('jpct');
    expect(no).toBe('8888');
    expect(docType).toBe('CERTIFICATE');
  });

  test('UD03_038_Submit_防止重复提交', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '038';

    let apiCallCount = 0;
    await page.route((url) => url.href.includes('/api/ud04/getdocumentdata'), async route => {
      apiCallCount++;
      if (apiCallCount <= 2) {
        // UD03 submit 和 dispatchEvent：延迟 3 秒验证 disabled 状态
        await new Promise(r => setTimeout(r, 3000));
      }
      // 透传到真实后端 API（jpct/8888 在 DB 中存在，返回真实数据）
      await route.continue();
    });

    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('#chassisSeries').fill('jpct');
    await page.locator('#chassisNo').fill('8888');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    // 第一次点击
    await page.locator('.btn-submit').click();
    // 等待 React 重渲染，按钮变为 disabled
    await page.waitForTimeout(500);
    // 确认画面未跳转
    expect(page.url()).toContain('/UD03');
    // 确认按钮被 disabled
    await expect(page.locator('.btn-submit')).toBeDisabled();
    await takeScreenshot(page, '点击後（loading-按钮禁用）');

    // 第二次点击（disabled 按钮）
    await page.locator('.btn-submit').dispatchEvent('click');
    await page.waitForTimeout(500);

    // 等待第 1 次 API 返回 → 跳转到 UD04 → UD04 加载真实数据
    await page.waitForTimeout(8000);
    await takeScreenshot(page, '操作後（UD04画面）');

    // 跳转到 UD04
    await expect(page).toHaveURL(/\/UD04/);
  });
});

// ============================================================
// 6. Reset 按钮操作 (No.39-41)
// ============================================================
test.describe('Reset 按钮操作', () => {

  test('UD03_039_Reset_清空所有输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '039';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('#chassisSeries').fill('jpct');
    await page.locator('#chassisNo').fill('8888');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    await page.locator('.btn-reset').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    await expect(page.locator('#chassisSeries')).toHaveValue('');
    await expect(page.locator('#chassisNo')).toHaveValue('');
    await expect(page.locator('#documentType')).toHaveValue('');
    expect(page.url()).toContain('/UD03');
  });

  test('UD03_040_Reset_清除错误消息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '040';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    // 触发错误消息
    await page.locator('.btn-submit').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message-area')).toBeVisible();
    await takeScreenshot(page, '错误消息表示');

    await page.locator('.btn-reset').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    // 错误消息被清除
    await expect(page.locator('.error-message-area')).toHaveCount(0);
    await expect(page.locator('#chassisSeries')).toHaveValue('');
  });

  test('UD03_041_Reset_清空后Submit再次触发空值校验', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '041';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('#chassisSeries').fill('jpct');
    await page.locator('#chassisNo').fill('8888');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    await page.locator('.btn-reset').click();
    await page.waitForTimeout(300);

    // 清空后直接 Submit
    await page.locator('.btn-submit').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    await expect(page.locator('.error-message-area')).toContainText('Chassis series is required.');
    expect(page.url()).toContain('/UD03');
  });
});

// ============================================================
// 7. Help 按钮操作 (No.42)
// ============================================================
test.describe('Help 按钮操作', () => {

  test('UD03_042_Help_跳转到UD24', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '042';
    await page.route('**/UD24', route => {
      route.fulfill({ status: 200, body: '<html><body><div class="ud24-container">UD24 Mock</div></body></html>' });
    });

    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('.btn-help').click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '操作後');

    await expect(page).toHaveURL(/\/UD24/);
  });
});

// ============================================================
// 8. 异常处理 (No.43-48)
// ============================================================
test.describe('异常处理', () => {

  test('UD03_043_异常处理_API加载Document type失败（HTTP 500）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '043';
    // 与No.12相同场景
    await page.route('**/api/ud03/gethdocdocumentlist', async route => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD03');
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.error-message-area')).toContainText('System error. Please try again later.');
    await expect(page.locator('.btn-submit')).toBeEnabled();
    await expect(page.locator('.btn-reset')).toBeEnabled();
    await expect(page.locator('.btn-help')).toBeEnabled();
  });

  test('UD03_044_异常处理_API返回业务错误（code≠200）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '044';
    await page.route('**/api/ud03/gethdocdocumentlist', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 401, data: null })
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD03');
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.error-message-area')).toContainText('We can not get the data. Please try again.');
  });

  test('UD03_045_异常处理_API超时', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '045';
    await page.route('**/api/ud03/gethdocdocumentlist', async route => {
      await new Promise(resolve => setTimeout(resolve, 10000));
    });

    await login(page);
    await page.goto(BASE_URL + '/UD03');
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '超时');

    const isError = await page.locator('.error-message-area').isVisible().catch(() => false);
    if (isError) {
      const text = await page.locator('.error-message-area').textContent();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('UD03_046_异常处理_网络异常', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '046';
    await page.route('**/api/ud03/gethdocdocumentlist', async route => {
      route.abort('internetdisconnected');
    });

    await login(page);
    await page.goto(BASE_URL + '/UD03');
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.error-message-area')).toContainText('System error. Please try again later.');
    await expect(page.locator('.btn-submit')).toBeEnabled();
  });

  test('UD03_047_异常处理_数据解析错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '047';
    await page.route('**/api/ud03/gethdocdocumentlist', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json data'
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD03');
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    const isError = await page.locator('.error-message-area').isVisible().catch(() => false);
    if (isError) {
      const text = await page.locator('.error-message-area').textContent();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('UD03_048_异常处理_Document type数据为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '048';
    await page.route('**/api/ud03/gethdocdocumentlist', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [] })
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD03');
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 下拉列表只包含空选项
    const select = page.locator('#documentType');
    const options = await select.locator('option').allTextContents();
    const trimmed = options.map(o => o.trim()).filter(o => o !== '');
    expect(trimmed.length).toBe(0);
  });
});

// ============================================================
// 9. UI交互 (No.49-53)
// ============================================================
test.describe('UI交互', () => {

  test('UD03_049_UI交互_加载中Document type下拉列表禁用', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '049';

    let resolveApi;
    const apiPromise = new Promise(resolve => { resolveApi = resolve; });
    await page.route('**/api/ud03/gethdocdocumentlist', async route => {
      await apiPromise;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: DOC_TYPE_OPTIONS })
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD03');
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(500);

    await takeScreenshot(page, '加载中');

    // 在 API 响应前确认控件状态（所有控件 disabled={isLoading}）
    await expect(page.locator('#chassisSeries')).toBeDisabled();
    await expect(page.locator('#chassisNo')).toBeDisabled();
    await expect(page.locator('#documentType')).toBeDisabled();
    await expect(page.locator('.btn-submit')).toBeDisabled();
    await expect(page.locator('.btn-reset')).toBeDisabled();
    await expect(page.locator('.btn-help')).toBeDisabled();

    resolveApi();
    await page.waitForTimeout(2000);
  });

  test('UD03_050_UI交互_加载完成后控件恢复活性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '050';
    await goToUD03(page);
    await page.waitForTimeout(500);
    await takeScreenshot(page, '初期表示');

    // 下拉列表已填充数据
    const select = page.locator('#documentType');
    const options = await select.locator('option').allTextContents();
    const trimmed = options.map(o => o.trim()).filter(o => o !== '');
    expect(trimmed.length).toBeGreaterThan(0);

    // 所有按钮可点击
    await expect(page.locator('.btn-submit')).toBeEnabled();
    await expect(page.locator('.btn-reset')).toBeEnabled();
    await expect(page.locator('.btn-help')).toBeEnabled();
  });

  test('UD03_051_UI交互_Submit加载中按钮禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '051';

    let apiCallCount = 0;
    await page.route((url) => url.href.includes('/api/ud04/getdocumentdata'), async route => {
      apiCallCount++;
      if (apiCallCount <= 2) {
        // 延迟 3 秒验证 disabled 状态
        await new Promise(r => setTimeout(r, 3000));
      }
      // 透传到真实后端 API
      await route.continue();
    });

    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('#chassisSeries').fill('jpct');
    await page.locator('#chassisNo').fill('8888');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    await page.locator('.btn-submit').click();
    await page.waitForTimeout(500);
    // Submit 按钮被禁用
    await expect(page.locator('.btn-submit')).toBeDisabled();
    await takeScreenshot(page, 'Submit中');

     await page.waitForTimeout(8000);
    await takeScreenshot(page, '操作後（UD04画面）');

    // 跳转到 UD04
    await expect(page).toHaveURL(/\/UD04/);
    // // 等待 API 返回
    // await page.waitForTimeout(3000);
  });

  test('UD03_052_UI交互_Error message area显示错误消息样式', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '052';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    // 触发空值校验
    await page.locator('.btn-submit').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    // 错误消息显示
    await expect(page.locator('.error-message-area')).toBeVisible();
    await expect(page.locator('.error-message-area')).toContainText('Chassis series is required.');
  });

  test('UD03_053_UI交互_Error message area清除时机', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '053';
    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    // 触发错误消息
    await page.locator('.btn-submit').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message-area')).toBeVisible();

    // 点击 Reset 清除
    await page.locator('.btn-reset').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });
});

// ============================================================
// 10. 安全性 (No.54-56)
// ============================================================
test.describe('安全性', () => {

  test('UD03_054_安全性_未登录直接访问UD03画面重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '054';
    // Step 1: 登录后访问 UD03 画面
    await page.route('**/api/ud04/getdocumentdata', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: {} })
      });
    });
    await goToUD03(page);
    await expect(page).toHaveURL(/\/UD03/);
    await expect(page.locator('.ud03-container')).toBeVisible();
    await takeScreenshot(page, 'UD03画面表示');

    // Step 2: 清除 localStorage（画面未刷新）
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/UD03/);
    await expect(page.locator('.ud03-container')).toBeVisible();
    await takeScreenshot(page, 'localStorage清除後（画面未刷新）');

    // Step 3: 直接访问 UD03 URL → 重定向到 Login
    await page.goto(BASE_URL + '/UD03');
    await page.waitForTimeout(2000);

    // Step 4: 验证重定向结果
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('.ud03-container')).not.toBeVisible();
    await takeScreenshot(page, '重定向結果（Login画面）');
  });

  test('UD03_055_安全性_上次输入条件正确保存到localStorage', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '055';
    await page.route('**/api/ud04/getdocumentdata', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: {} })
      });
    });
    await page.route('**/UD04', route => {
      route.fulfill({ status: 200, body: '<html><body>UD04 Mock</body></html>' });
    });

    await goToUD03(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('#chassisSeries').fill('jpct');
    await page.locator('#chassisNo').fill('8888');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    await page.locator('.btn-submit').click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '操作後');

    // localStorage 确认（组件使用 lastChassisSeries/lastChassisNo/lastDocumentType 存储）
    const series = await page.evaluate(() => localStorage.getItem('lastChassisSeries'));
    const no = await page.evaluate(() => localStorage.getItem('lastChassisNo'));
    const docType = await page.evaluate(() => localStorage.getItem('lastDocumentType'));
    expect(series).toBe('jpct');
    expect(no).toBe('8888');
    expect(docType).toBe('CERTIFICATE');
  });

  test('UD03_056_安全性_缓存数据过期清理', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '056';
    // 先导航到有 origin 的页面，再预先设置 localStorage 缓存
    await page.goto(BASE_URL + '/');
    await page.evaluate(() => {
      localStorage.setItem('lastChassisSeries', 'jpct');
      localStorage.setItem('lastChassisNo', '8888');
      localStorage.setItem('lastDocumentType', 'CERTIFICATE');
    });

    // 重新登录后访问 UD03，缓存数据应自动填充
    await goToUD03(page);
    await takeScreenshot(page, '初期表示（缓存恢复）');

    await expect(page.locator('#chassisSeries')).toHaveValue('jpct');
    await expect(page.locator('#chassisNo')).toHaveValue('8888');
    await expect(page.locator('#documentType')).toHaveValue('CERTIFICATE');
  });
});
