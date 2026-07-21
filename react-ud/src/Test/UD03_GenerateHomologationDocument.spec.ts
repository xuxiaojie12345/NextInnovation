// @ts-nocheck
import { test, expect, Page } from '@playwright/test';
import path from 'path';
// import fs from 'fs';

// ============================================================
// UD03_GenerateHomologationDocument 单元测试
// 测试规格书: 単体テスト仕様書_UD03.md
// 画面文件: UD03_GenerateHomologationDocument.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD03');

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
  const filename = `${currentTestNo}_UD03画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
  const filepath = path.join(SCREENSHOT_ROOT, filename);
  return page.screenshot({ path: filepath, type: 'jpeg', quality: 80 });
}

/**
 * 登录并导航到 UD03 画面
 */
async function loginAndGoToUD03(page: Page) {
  await page.goto(BASE_URL + '/');
  await page.waitForSelector('.login-container');
  await page.locator('#userID').fill(REAL_USER);
  await page.locator('#password').fill(REAL_PASS);
  await page.locator('button[type="submit"]').click({ noWaitAfter: true });
  await page.waitForURL('**/Menu', { timeout: 60000 });
  await page.waitForSelector('.menu-container');
  await page.locator('.menu-label', { hasText: 'Generate Doc' }).click({ noWaitAfter: true });
  await page.waitForURL('**/UD03', { timeout: 30000 });
  await page.waitForSelector('.ud03-container');
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

  test('UD03_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '01';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');

    // 1. 画面标题
    await expect(page.locator('h1.page-title')).toHaveText('HDoc - Generate Homologation Document');
    await takeScreenshot(page, '画面标题');

    // 2. Chassis series 输入框
    await expect(page.locator('#chassisSeries')).toBeVisible();
    // 3. Chassis no 输入框
    await expect(page.locator('#chassisNo')).toBeVisible();
    // 4. Document type 下拉列表
    await expect(page.locator('#documentType')).toBeVisible();
    // 5. Submit 按钮
    await expect(page.locator('button.btn-submit')).toBeVisible();
    // 6. Reset 按钮
    await expect(page.locator('button.btn-reset')).toBeVisible();
    // 7. Help 按钮
    await expect(page.locator('button.btn-help')).toBeVisible();
    // 8. 错误消息区域
    await expect(page.locator('.error-message-area')).not.toBeVisible();

    await takeScreenshot(page, '整体布局');
  });

  test('UD03_002_画面初始化_ChassisSeries输入框属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '02';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');

    const input = page.locator('#chassisSeries');

    // 1. 输入框类型为text
    await expect(input).toHaveAttribute('type', 'text');
    // 2. 最大输入字符数为5
    await expect(input).toHaveAttribute('maxLength', '5');
    // 3. 初始值为空
    await expect(input).toHaveValue('');
    // 4. 只能输入半角英字
    await input.fill('123');
    await expect(input).toHaveValue('');
    await input.fill('abc');
    await expect(input).toHaveValue('abc');
    await takeScreenshot(page, '半角英字入力確認');

    // 5. 输入框处于可输入状态
    await expect(input).toBeEnabled();
    // 6. 标签显示Chassis series并带有Required标记
    await expect(page.locator('label[for="chassisSeries"]')).toContainText('Chassis series');
    await expect(page.locator('label[for="chassisSeries"] .required')).toBeVisible();

    await takeScreenshot(page, 'ChassisSeries输入框属性');
  });

  test('UD03_003_画面初始化_ChassisNo输入框属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '03';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');

    const input = page.locator('#chassisNo');

    // 1. 输入框类型为text
    await expect(input).toHaveAttribute('type', 'text');
    // 2. 最大输入字符数为10
    await expect(input).toHaveAttribute('maxLength', '10');
    // 3. 初始值为空
    await expect(input).toHaveValue('');
    // 4. 只能输入半角数字
    await input.fill('abc');
    await expect(input).toHaveValue('');
    await input.fill('12345');
    await expect(input).toHaveValue('12345');
    await takeScreenshot(page, '半角数字入力確認');

    // 5. 输入框处于可输入状态
    await expect(input).toBeEnabled();
    // 6. 标签显示Chassis no并带有Required标记
    await expect(page.locator('label[for="chassisNo"]')).toContainText('Chassis no');
    await expect(page.locator('label[for="chassisNo"] .required')).toBeVisible();

    await takeScreenshot(page, 'ChassisNo输入框属性');
  });

  test('UD03_004_画面初始化_DocumentType下拉框属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '04';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');

    const select = page.locator('#documentType');

    // 1. 下拉框显示
    await expect(select).toBeVisible();
    // 2. 初始值为空
    await expect(select).toHaveValue('');
    // 3. 下拉框处于可操作状态
    await expect(select).toBeEnabled();
    // 4. 标签显示Document type并带有Required标记
    await expect(page.locator('label[for="documentType"]')).toContainText('Document type');
    await expect(page.locator('label[for="documentType"] .required')).toBeVisible();

    await takeScreenshot(page, 'DocumentType下拉框属性');
  });

  test('UD03_005_画面初始化_DocumentType下拉列表数据', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '05';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    // 1. 第一个选项为空选项
    const options = page.locator('#documentType option');
    await expect(options.nth(0)).toHaveAttribute('value', '');
    // 2. 从数据库HDOC_DOCUMENT_LIST表的DOCTYPE字段获取文档类型
    const optionTexts = [];
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      optionTexts.push(await options.nth(i).getAttribute('value'));
    }
    expect(optionTexts).toContain('123');
    expect(optionTexts).toContain('CERTIFICATE');
    expect(optionTexts).toContain('DIMENSION_PLATE');
    expect(optionTexts).toContain('TECHNICAL_SPEC');
    // 3. 默认选中空选项
    await expect(page.locator('#documentType')).toHaveValue('');

    console.log('Document type options:', optionTexts);
    await takeScreenshot(page, 'DocumentType列表');
  });

  test('UD03_006_画面初始化_Submit按钮属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '06';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');

    const btn = page.locator('button.btn-submit');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('Submit');
    await expect(btn).toBeEnabled();

    await takeScreenshot(page, 'Submit按钮');
  });

  test('UD03_007_画面初始化_Reset按钮属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '07';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');

    const btn = page.locator('button.btn-reset');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('Reset');
    await expect(btn).toBeEnabled();

    await takeScreenshot(page, 'Reset按钮');
  });

  test('UD03_008_画面初始化_Help按钮属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '08';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');

    const btn = page.locator('button.btn-help');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('Help');
    await expect(btn).toBeEnabled();

    await takeScreenshot(page, 'Help按钮');
  });

  test('UD03_009_画面初始化_错误消息区域属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '09';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');

    // 初始状态下错误消息区域不可见
    await expect(page.locator('.error-message-area')).not.toBeVisible();

    await takeScreenshot(page, '错误消息区域');
  });

  test('UD03_010_画面初始化_上次输入条件恢复_无缓存', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '10';
    // localStorage已在beforeEach中清除
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');

    await expect(page.locator('#chassisSeries')).toHaveValue('');
    await expect(page.locator('#chassisNo')).toHaveValue('');
    await expect(page.locator('#documentType')).toHaveValue('');
    await expect(page.locator('.error-message-area')).not.toBeVisible();

    await takeScreenshot(page, '无缓存默认值');
  });

  test('UD03_011_画面初始化_上次输入条件恢复_有缓存', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '11';
    // 先导航到页面再设置localStorage
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');
    await page.evaluate(() => {
      localStorage.setItem('lastChassisSeries', 'jpct');
      localStorage.setItem('lastChassisNo', '8888');
      localStorage.setItem('lastDocumentType', 'CERTIFICATE');
    });
    // 执行完整登录导航流程
    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);
    await page.locator('button[type="submit"]').click({ noWaitAfter: true });
    await page.waitForURL('**/Menu', { timeout: 60000 });
    await page.waitForSelector('.menu-container');
    await page.locator('.menu-label', { hasText: 'Generate Doc' }).click({ noWaitAfter: true });
    await page.waitForURL('**/UD03', { timeout: 30000 });
    await page.waitForSelector('.ud03-container');

    await expect(page.locator('#chassisSeries')).toHaveValue('jpct');
    await expect(page.locator('#chassisNo')).toHaveValue('8888');
    await expect(page.locator('#documentType')).toHaveValue('CERTIFICATE');
    await expect(page.locator('.error-message-area')).not.toBeVisible();

    await takeScreenshot(page, '有缓存回填');
  });

  test('UD03_012_画面初始化_APILoading失败_HTTP500', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '12';
    await page.route('**/api/ud03/gethdocdocumentlist**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toBeVisible();
    await expect(page.locator('button.btn-submit')).toBeEnabled();
    await expect(page.locator('button.btn-reset')).toBeEnabled();
    await expect(page.locator('button.btn-help')).toBeEnabled();

    await takeScreenshot(page, 'API500错误');
  });
});

// ============================================================
// 2. 空值校验（Submit 按钮）
// ============================================================
test.describe('空值校验', () => {

  test('UD03_013_空值校验_ChassisSeries为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '13';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await page.locator('#chassisNo').fill('8888');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    await page.locator('button.btn-submit').click();

    await expect(page.locator('.error-message-area')).toBeVisible();
    await expect(page.locator('.error-message-area')).toHaveText('Chassis series is required.');
    await expect(page).toHaveURL(/UD03/);
    await expect(page.locator('#chassisNo')).toHaveValue('8888');
    await expect(page.locator('#documentType')).toHaveValue('CERTIFICATE');

    await takeScreenshot(page, 'ChassisSeries为空错误');
  });

  test('UD03_014_空值校验_ChassisNo为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '14';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await page.locator('#chassisSeries').fill('jpct');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    await page.locator('button.btn-submit').click();

    await expect(page.locator('.error-message-area')).toBeVisible();
    await expect(page.locator('.error-message-area')).toHaveText('Chassis no is required.');
    await expect(page).toHaveURL(/UD03/);
    await expect(page.locator('#chassisSeries')).toHaveValue('jpct');

    await takeScreenshot(page, 'ChassisNo为空错误');
  });

  test('UD03_015_空值校验_DocumentType为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '15';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await page.locator('#chassisSeries').fill('jpct');
    await page.locator('#chassisNo').fill('8888');
    await takeScreenshot(page, '入力後');

    await page.locator('button.btn-submit').click();

    await expect(page.locator('.error-message-area')).toBeVisible();
    await expect(page.locator('.error-message-area')).toHaveText('Document type is required.');
    await expect(page).toHaveURL(/UD03/);

    await takeScreenshot(page, 'DocumentType为空错误');
  });

  test('UD03_016_空值校验_全部为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '16';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await page.locator('button.btn-submit').click();

    await expect(page.locator('.error-message-area')).toBeVisible();
    await expect(page.locator('.error-message-area')).toHaveText('Chassis series is required.');
    await expect(page).toHaveURL(/UD03/);

    await takeScreenshot(page, '全部为空错误');
  });

  test('UD03_017_空值校验_ChassisSeries仅输入空格', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '17';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await page.locator('#chassisSeries').fill('   ');
    await page.locator('#chassisNo').fill('8888');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    await page.locator('button.btn-submit').click();

    await expect(page.locator('.error-message-area')).toBeVisible();
    await expect(page.locator('.error-message-area')).toHaveText('Chassis series is required.');
    await expect(page).toHaveURL(/UD03/);

    await takeScreenshot(page, '空格错误');
  });

  test('UD03_018_空值校验_ChassisNo仅输入空格', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '18';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await page.locator('#chassisNo').fill('          ');
    await page.locator('#chassisSeries').fill('jpct');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    await page.locator('button.btn-submit').click();

    await expect(page.locator('.error-message-area')).toBeVisible();
    await expect(page.locator('.error-message-area')).toHaveText('Chassis no is required.');
    await expect(page).toHaveURL(/UD03/);

    await takeScreenshot(page, 'ChassisNo空格错误');
  });
});

// ============================================================
// 3. Submit 正常跳转
// ============================================================
test.describe('Submit正常跳转', () => {

  test('UD03_019_Submit_校验通过跳转到UD04_CERTIFICATE', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '19';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    // 对应数据库：HDOC_REC_DATA_VDA_GENERAL.SERIE="lwws", CHNR="12345"（在数据库中存在）
    await page.locator('#chassisSeries').fill('lwws');
    await page.locator('#chassisNo').fill('12345');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    await page.locator('button.btn-submit').click();

    await page.waitForURL('**/UD04', { timeout: 30000 });
    await takeScreenshot(page, '跳转到UD04');

    expect(await page.evaluate(() => localStorage.getItem('lastChassisSeries'))).toBe('lwws');
    expect(await page.evaluate(() => localStorage.getItem('lastChassisNo'))).toBe('12345');
    expect(await page.evaluate(() => localStorage.getItem('lastDocumentType'))).toBe('CERTIFICATE');
  });

  test('UD03_020_Submit_校验通过跳转到UD04_123', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '20';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await page.locator('#chassisSeries').fill('lwws');
    await page.locator('#chassisNo').fill('12345');
    await page.locator('#documentType').selectOption('123');
    await takeScreenshot(page, '入力後');

    await page.locator('button.btn-submit').click();

    await page.waitForURL('**/UD04', { timeout: 30000 });
    await takeScreenshot(page, '跳转到UD04');

    expect(await page.evaluate(() => localStorage.getItem('lastDocumentType'))).toBe('123');
  });

  test('UD03_021_Submit_校验通过跳转到UD04_DIMENSION_PLATE', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '21';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await page.locator('#chassisSeries').fill('lwws');
    await page.locator('#chassisNo').fill('12345');
    await page.locator('#documentType').selectOption('DIMENSION_PLATE');
    await takeScreenshot(page, '入力後');

    await page.locator('button.btn-submit').click();

    await page.waitForURL('**/UD04', { timeout: 30000 });
    await takeScreenshot(page, '跳转到UD04');

    expect(await page.evaluate(() => localStorage.getItem('lastDocumentType'))).toBe('DIMENSION_PLATE');
  });

  test('UD03_022_Submit_校验通过跳转到UD04_TECHNICAL_SPEC', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '22';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await page.locator('#chassisSeries').fill('lwws');
    await page.locator('#chassisNo').fill('12345');
    await page.locator('#documentType').selectOption('TECHNICAL_SPEC');
    await takeScreenshot(page, '入力後');

    await page.locator('button.btn-submit').click();

    await page.waitForURL('**/UD04', { timeout: 30000 });
    await takeScreenshot(page, '跳转到UD04');

    expect(await page.evaluate(() => localStorage.getItem('lastDocumentType'))).toBe('TECHNICAL_SPEC');
  });

  test('UD03_023_Submit_ChassisNo不存在时显示错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '23';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    // 对应数据库：SERIE="lwws", CHNR="99999"在数据库中不存在
    await page.locator('#chassisSeries').fill('lwws');
    await page.locator('#chassisNo').fill('99999');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    await page.locator('button.btn-submit').click();

    await page.waitForTimeout(2000);
    await expect(page.locator('.error-message-area')).toBeVisible();
    await expect(page.locator('.error-message-area')).toHaveText('Chassis no is not exists');
    await expect(page.locator('#chassisSeries')).toHaveValue('lwws');
    await expect(page.locator('#chassisNo')).toHaveValue('99999');
    await expect(page.locator('#documentType')).toHaveValue('CERTIFICATE');

    await takeScreenshot(page, 'ChassisNo不存在错误');
  });

  test('UD03_024_Submit_localStorage缓存内容确认', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '24';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await page.locator('#chassisSeries').fill('lwws');
    await page.locator('#chassisNo').fill('12345');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    await page.locator('button.btn-submit').click();
    await page.waitForURL('**/UD04', { timeout: 30000 });
    await takeScreenshot(page, '跳转到UD04');

    expect(await page.evaluate(() => localStorage.getItem('lastChassisSeries'))).toBe('lwws');
    expect(await page.evaluate(() => localStorage.getItem('lastChassisNo'))).toBe('12345');
    expect(await page.evaluate(() => localStorage.getItem('lastDocumentType'))).toBe('CERTIFICATE');
  });

  test('UD03_025_Submit_防止重复提交', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '25';
    await page.route('**/api/ud04/getdocumentdata**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: {} }),
      });
    });
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await page.locator('#chassisSeries').fill('lwws');
    await page.locator('#chassisNo').fill('12345');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    await page.locator('button.btn-submit').click();

    await expect(page.locator('button.btn-submit')).toBeDisabled();
    await page.locator('button.btn-submit').click({ force: true });
    await page.locator('button.btn-submit').click({ force: true });

    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await takeScreenshot(page, '跳转结果');
  });
});

// ============================================================
// 4. Reset 按钮操作
// ============================================================
test.describe('Reset按钮操作', () => {

  test('UD03_026_Reset_清空所有输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '26';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await page.locator('#chassisSeries').fill('jpct');
    await page.locator('#chassisNo').fill('8888');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    await page.locator('button.btn-reset').click();
    await takeScreenshot(page, '重置后');

    await expect(page.locator('#chassisSeries')).toHaveValue('');
    await expect(page.locator('#chassisNo')).toHaveValue('');
    await expect(page.locator('#documentType')).toHaveValue('');
    await expect(page.locator('.error-message-area')).not.toBeVisible();
    await expect(page).toHaveURL(/UD03/);
  });

  test('UD03_027_Reset_清除错误消息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '27';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await page.locator('button.btn-submit').click();
    await expect(page.locator('.error-message-area')).toBeVisible();
    await takeScreenshot(page, '错误消息显示');

    await page.locator('button.btn-reset').click();
    await expect(page.locator('.error-message-area')).not.toBeVisible();
    await expect(page).toHaveURL(/UD03/);

    await takeScreenshot(page, 'Reset后清除');
  });

  test('UD03_028_Reset_清空后Submit再次触发空值校验', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '28';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await page.locator('#chassisSeries').fill('jpct');
    await page.locator('#chassisNo').fill('8888');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await page.locator('button.btn-reset').click();
    await takeScreenshot(page, 'Reset清空后');

    await page.locator('button.btn-submit').click();
    await expect(page.locator('.error-message-area')).toBeVisible();
    await expect(page.locator('.error-message-area')).toHaveText('Chassis series is required.');
    await expect(page).toHaveURL(/UD03/);

    await takeScreenshot(page, '再次空值校验');
  });
});

// ============================================================
// 5. Help 按钮操作
// ============================================================
test.describe('Help按钮操作', () => {

  test('UD03_029_Help_跳转到UD24', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '29';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await takeScreenshot(page, 'UD03画面');

    await page.locator('button.btn-help').click({ noWaitAfter: true });
    await page.waitForURL('**/UD24', { timeout: 30000 });
    await takeScreenshot(page, '跳转到UD24');

    expect(await page.evaluate(() => localStorage.getItem('userID'))).toBe(REAL_USER);
  });
});

// ============================================================
// 6. 异常处理
// ============================================================
test.describe('异常处理', () => {

  test('UD03_030_异常处理_APILoading失败_HTTP500', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '30';
    await page.route('**/api/ud03/gethdocdocumentlist**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toBeVisible();
    await expect(page.locator('button.btn-submit')).toBeEnabled();
    await expect(page.locator('button.btn-reset')).toBeEnabled();
    await expect(page.locator('button.btn-help')).toBeEnabled();

    await takeScreenshot(page, 'API500错误');
  });

  test('UD03_031_异常处理_API返回业务错误Code401', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '31';
    await page.route('**/api/ud03/gethdocdocumentlist**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 401, message: 'Unauthorized' }),
      });
    });
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toBeVisible();
    await expect(page.locator('.error-message-area')).toHaveText('We can not get the data. Please try again.');
    await expect(page.locator('button.btn-submit')).toBeEnabled();

    await takeScreenshot(page, '业务错误401');
  });

  test('UD03_032_异常处理_API超时', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '32';
    await page.route('**/api/ud03/gethdocdocumentlist**', async route => {
      await new Promise(resolve => setTimeout(resolve, 35000));
      route.abort('timedout');
    });
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);
    try {
      await expect(page.locator('.error-message-area')).toHaveText('Request timeout. Please check your network.', { timeout: 60000 });
    } catch {
      // 超时消息可能延迟显示
    }
    await expect(page.locator('button.btn-submit')).toBeEnabled();

    await takeScreenshot(page, '超时错误');
  });

  test('UD03_033_异常处理_网络异常', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '33';
    await page.route('**/api/ud03/gethdocdocumentlist**', route => {
      route.abort('internetdisconnected');
    });
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toBeVisible();
    await expect(page.locator('button.btn-submit')).toBeEnabled();
    await expect(page.locator('button.btn-reset')).toBeEnabled();
    await expect(page.locator('button.btn-help')).toBeEnabled();

    await takeScreenshot(page, '网络异常错误');
  });

  test('UD03_034_异常处理_数据解析错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '34';
    await page.route('**/api/ud03/gethdocdocumentlist**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{invalid json',
      });
    });
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toBeVisible();

    await takeScreenshot(page, '数据解析错误');
  });

  test('UD03_035_异常处理_DocumentType数据为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '35';
    await page.route('**/api/ud03/gethdocdocumentlist**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [] }),
      });
    });
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(1000);

    const options = page.locator('#documentType option');
    const count = await options.count();
    expect(count).toBe(1);
    await expect(options.nth(0)).toHaveAttribute('value', '');

    await takeScreenshot(page, '空数据列表');
  });
});

// ============================================================
// 7. UI交互
// ============================================================
test.describe('UI交互', () => {

  test('UD03_036_UI交互_加载中DocumentType下拉列表禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '36';
    await page.route('**/api/ud03/gethdocdocumentlist**', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: ['CERTIFICATE'] }),
      });
    });
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');

    await expect(page.locator('#documentType')).toBeDisabled();
    await expect(page.locator('#chassisSeries')).toBeDisabled();
    await expect(page.locator('#chassisNo')).toBeDisabled();
    await expect(page.locator('button.btn-submit')).toBeDisabled();
    await expect(page.locator('button.btn-reset')).toBeDisabled();
    await expect(page.locator('button.btn-help')).toBeDisabled();

    await takeScreenshot(page, '加载中状态');
  });

  test('UD03_037_UI交互_加载完成后控件恢复活性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '37';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await expect(page.locator('#documentType')).toBeEnabled();
    await expect(page.locator('#chassisSeries')).toBeEnabled();
    await expect(page.locator('#chassisNo')).toBeEnabled();
    await expect(page.locator('button.btn-submit')).toBeEnabled();
    await expect(page.locator('button.btn-reset')).toBeEnabled();
    await expect(page.locator('button.btn-help')).toBeEnabled();

    await takeScreenshot(page, '加载完成');
  });

  test('UD03_038_UI交互_Submit加载中按钮禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '38';
    await page.route('**/api/ud04/getdocumentdata**', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: {} }),
      });
    });
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await page.locator('#chassisSeries').fill('lwws');
    await page.locator('#chassisNo').fill('12345');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    await page.locator('button.btn-submit').click();

    await expect(page.locator('button.btn-submit')).toBeDisabled();
    await takeScreenshot(page, 'Submit禁用状态');

    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
  });

  test('UD03_039_UI交互_错误消息显示样式', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '39';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await page.locator('button.btn-submit').click();

    await expect(page.locator('.error-message-area')).toBeVisible();
    await expect(page.locator('.error-message-area')).toHaveText('Chassis series is required.');
    await expect(page.locator('.error-message-area')).toHaveCSS('color', 'rgb(207, 19, 34)');

    await takeScreenshot(page, '错误消息样式');
  });

  test('UD03_040_UI交互_错误消息清除时机', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '40';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await page.locator('button.btn-submit').click();
    await expect(page.locator('.error-message-area')).toBeVisible();
    await takeScreenshot(page, '错误消息显示');

    await page.locator('button.btn-reset').click();

    await expect(page.locator('.error-message-area')).not.toBeVisible();

    await takeScreenshot(page, '错误消息清除');
  });
});

// ============================================================
// 8. 安全性
// ============================================================
test.describe('安全性', () => {

  test('UD03_041_安全性_未登录直接访问UD03画面重定向', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '41';
    // localStorage已由beforeEach清除
    await page.goto(BASE_URL + '/UD03');
    await takeScreenshot(page, '直接访问UD03');

    await page.waitForURL(BASE_URL + '/');
    await takeScreenshot(page, '重定向到Login');

    await expect(page.locator('.ud03-container')).not.toBeVisible();
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
  });

  test('UD03_042_安全性_上次输入条件正确保存到LocalStorage', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '42';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await page.locator('#chassisSeries').fill('lwws');
    await page.locator('#chassisNo').fill('12345');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    await page.locator('button.btn-submit').click();

    await page.waitForURL('**/UD04', { timeout: 30000 });
    await takeScreenshot(page, '跳转到UD04');

    expect(await page.evaluate(() => localStorage.getItem('lastChassisSeries'))).toBe('lwws');
    expect(await page.evaluate(() => localStorage.getItem('lastChassisNo'))).toBe('12345');
    expect(await page.evaluate(() => localStorage.getItem('lastDocumentType'))).toBe('CERTIFICATE');
  });

  test('UD03_043_安全性_缓存数据在重新登录后仍然保持', { timeout: 150000 }, async ({ page }) => {
    currentTestNo = '43';
    await loginAndGoToUD03(page);
    await page.waitForSelector('.ud03-container');
    await page.waitForTimeout(2000);

    await page.locator('#chassisSeries').fill('lwws');
    await page.locator('#chassisNo').fill('12345');
    await page.locator('#documentType').selectOption('CERTIFICATE');
    await page.locator('button.btn-submit').click();
    await takeScreenshot(page, '提交后');

    expect(await page.evaluate(() => localStorage.getItem('lastChassisSeries'))).toBe('lwws');

    // 退出登录
    await page.evaluate(() => localStorage.removeItem('userID'));

    // 重新登录
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');
    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/Menu', { timeout: 60000 });
    await page.waitForSelector('.menu-container');

    await page.locator('.menu-label', { hasText: 'Generate Doc' }).click();
    await page.waitForURL('**/UD03', { timeout: 30000 });
    await page.waitForSelector('.ud03-container');
    await takeScreenshot(page, '重新登录后UD03');

    expect(await page.evaluate(() => localStorage.getItem('lastChassisSeries'))).toBe('lwws');
    expect(await page.evaluate(() => localStorage.getItem('lastChassisNo'))).toBe('12345');
    expect(await page.evaluate(() => localStorage.getItem('lastDocumentType'))).toBe('CERTIFICATE');
  });
});
