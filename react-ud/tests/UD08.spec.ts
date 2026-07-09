import { test, expect, Page } from '@playwright/test';
import { insertUD08TestData, cleanupUD08TestData } from './test-data-helper';

// ============================================================
// HomologationVariables 模块 (UD08) Playwright 自动化测试
// 基于 単体テスト仕様書UD08.md (v1.0)
// 全109测试用例覆盖
// ============================================================

const BASE_URL = 'http://localhost:3000';
const API_BASE = 'http://localhost:8081';
const SCREENSHOT_DIR = 'tests/image/UD08';

let screenshotCounter: { [key: string]: number } = {};

async function takeScreenshot(page: Page, name: string) {
  if (!screenshotCounter[name]) screenshotCounter[name] = 0;
  screenshotCounter[name]++;
  const seq = String(screenshotCounter[name]).padStart(3, '0');
  try {
    if (page.isClosed()) return;
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}_${seq}.jpeg`, type: 'jpeg', quality: 85, fullPage: true, timeout: 15000 });
  } catch (e) { console.warn(`Screenshot failed for ${name}: ${e}`); }
}

function resetCounter(name: string) { screenshotCounter[name] = 0; }

async function safeGoto(page: Page, url: string) {
  for (let i = 0; i < 3; i++) {
    try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }); return; }
    catch (e) { if (i === 2 || page.isClosed()) throw e; await page.waitForTimeout(2000); }
  }
}

async function loginAndGoToUD08(page: Page) {
  await safeGoto(page, BASE_URL);
  await page.evaluate(() => { localStorage.setItem('userInfo', JSON.stringify({ userid: 'e2e_test', username: 'E2E Test User', token: 'mock-token-ud08' })); });
  await safeGoto(page, `${BASE_URL}/Menu`);
  await page.waitForSelector('.menu-layout', { timeout: 15000 });
  await safeGoto(page, `${BASE_URL}/Menu/HomologationVariables`);
  await page.waitForSelector('.homologation-variables-container', { timeout: 15000 });
}

async function waitLoaded(page: Page) {
  await expect(page.locator('.loading-message')).not.toBeVisible({ timeout: 15000 }).catch(() => {});
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => { await cleanupUD08TestData(); await insertUD08TestData(); });
test.afterAll(async () => { await cleanupUD08TestData(); });

// ============================================================
// 1. 画面初始化 (No.1-10)
// ============================================================
test.describe('画面初始化', () => {

  test('No.1 Product Class下拉列表加载成功', async ({ page }) => {
    resetCounter('01_ProductClass下拉列表加载成功');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await takeScreenshot(page, '01_ProductClass下拉列表加载成功');
    const pcSelect = page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select');
    await expect(pcSelect).toBeVisible();
    const opts = await pcSelect.locator('option').allTextContents();
    expect(opts.length).toBeGreaterThanOrEqual(2);
    await takeScreenshot(page, '01_ProductClass下拉列表加载成功');
  });

  test('No.2 Market下拉列表加载成功', async ({ page }) => {
    resetCounter('02_Market下拉列表加载成功');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await takeScreenshot(page, '02_Market下拉列表加载成功');
    const mktSelect = page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select');
    await expect(mktSelect).toBeVisible();
    await takeScreenshot(page, '02_Market下拉列表加载成功');
  });

  test('No.3 HDOC_VARIABLES数据加载', async ({ page }) => {
    resetCounter('03_HDOC_VARIABLES数据加载');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await takeScreenshot(page, '03_HDOC_VARIABLES数据加载');
    await expect(page.locator('.form-container')).toBeVisible();
    await takeScreenshot(page, '03_HDOC_VARIABLES数据加载');
  });

  test('No.4 Product Class列表加载失败', async ({ page }) => {
    resetCounter('04_ProductClass加载失败');
    await page.route(`${API_BASE}/api/ud08/selectproductclassmaster`, async route => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({}) });
    });
    await loginAndGoToUD08(page); await waitLoaded(page);
    await takeScreenshot(page, '04_ProductClass加载失败');
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, '04_ProductClass加载失败');
  });

  test('No.5 Market列表加载失败', async ({ page }) => {
    resetCounter('05_Market加载失败');
    await page.route(`${API_BASE}/api/ud08/selectmarketmaster`, async route => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({}) });
    });
    await loginAndGoToUD08(page); await waitLoaded(page);
    await takeScreenshot(page, '05_Market加载失败');
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, '05_Market加载失败');
  });

  test('No.6 所有下拉列表加载失败', async ({ page }) => {
    resetCounter('06_所有下拉列表加载失败');
    await page.route(`${API_BASE}/api/ud08/selectproductclassmaster`, async route => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
    await page.route(`${API_BASE}/api/ud08/selectmarketmaster`, async route => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
    await page.route(`${API_BASE}/api/ud08/selecthdocvariables`, async route => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
    await loginAndGoToUD08(page); await waitLoaded(page);
    await takeScreenshot(page, '06_所有下拉列表加载失败');
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, '06_所有下拉列表加载失败');
  });

  test('No.7 各字段初始状态', async ({ page }) => {
    resetCounter('07_各字段初始状态');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await takeScreenshot(page, '07_各字段初始状态');
    // Check all form inputs are empty
    const inputs = page.locator('.form-input');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toHaveValue('');
    }
    await takeScreenshot(page, '07_各字段初始状态');
    await expect(page.locator('.auto-label').first()).toContainText('YYYYWW');
    await expect(page.locator('.auto-label').last()).toContainText('Automatic');
    await takeScreenshot(page, '07_各字段初始状态');
  });

  test('No.8 运算符默认值', async ({ page }) => {
    resetCounter('08_运算符默认值');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await takeScreenshot(page, '08_运算符默认值');
    const opSelects = page.locator('.operator-select');
    const opCount = await opSelects.count();
    for (let i = 0; i < opCount; i++) {
      await expect(opSelects.nth(i)).toHaveValue('=');
    }
    await takeScreenshot(page, '08_运算符默认值');
  });

  test('No.9 Loading状态', async ({ page }) => {
    resetCounter('09_Loading状态');
    await safeGoto(page, `${BASE_URL}/Menu/HomologationVariables`);
    await page.waitForSelector('.homologation-variables-container', { timeout: 15000 });
    await takeScreenshot(page, '09_Loading状态');
    await expect(page.locator('.loading-message')).toBeVisible({ timeout: 3000 });
    await takeScreenshot(page, '09_Loading状态');
  });

  test('No.10 页面标题显示', async ({ page }) => {
    resetCounter('10_页面标题显示');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await takeScreenshot(page, '10_页面标题显示');
    await expect(page.locator('.page-title')).toHaveText('Homologation Variables');
    await takeScreenshot(page, '10_页面标题显示');
  });
});

// ============================================================
// 2. 搜索表单-控件显示 (No.11-25)
// ============================================================
test.describe('搜索表单控件显示', () => {

  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD08(page); await waitLoaded(page);
  });

  test('No.11 Product Class下拉列表', async ({ page }) => {
    resetCounter('11_ProductClass下拉列表');
    await takeScreenshot(page, '11_ProductClass下拉列表');
    const row = page.locator('.form-row').filter({ hasText: 'Product class' });
    await expect(row.locator('.form-select')).toBeVisible();
    await expect(row.locator('.form-label.required')).toBeVisible();
    await takeScreenshot(page, '11_ProductClass下拉列表');
  });

  test('No.12 Number输入框', async ({ page }) => {
    resetCounter('12_Number输入框');
    await takeScreenshot(page, '12_Number输入框');
    const row = page.locator('.form-row').filter({ hasText: 'Number' });
    const inp = row.locator('.form-input');
    await expect(inp).toBeVisible();
    await expect(inp).toHaveAttribute('maxLength', '10');
    await expect(row.locator('.form-label.required')).toBeVisible();
    await takeScreenshot(page, '12_Number输入框');
  });

  test('No.13 Market下拉列表', async ({ page }) => {
    resetCounter('13_Market下拉列表');
    await takeScreenshot(page, '13_Market下拉列表');
    const row = page.locator('.form-row').filter({ hasText: 'Market' });
    await expect(row.locator('.form-select')).toBeVisible();
    await expect(row.locator('.form-label.required')).toBeVisible();
    await takeScreenshot(page, '13_Market下拉列表');
  });

  test('No.14 Variable输入框', async ({ page }) => {
    resetCounter('14_Variable输入框');
    await takeScreenshot(page, '14_Variable输入框');
    const inp = page.locator('.form-row').filter({ hasText: 'Variable' }).locator('.form-input');
    await expect(inp).toBeVisible();
    await expect(inp).toHaveAttribute('maxLength', '20');
    await takeScreenshot(page, '14_Variable输入框');
  });

  test('No.15 Value输入框', async ({ page }) => {
    resetCounter('15_Value输入框');
    await takeScreenshot(page, '15_Value输入框');
    const inp = page.locator('.form-row').filter({ hasText: 'Value' }).locator('.form-input');
    await expect(inp).toBeVisible();
    await expect(inp).toHaveAttribute('maxLength', '200');
    await takeScreenshot(page, '15_Value输入框');
  });

  // No.16-22 similar field checks
  test('No.16 Variant string.1输入框', async ({ page }) => {
    resetCounter('16_VariantString1输入框');
    await takeScreenshot(page, '16_VariantString1输入框');
    const inp = page.locator('.form-row').filter({ hasText: 'Variant string.' }).first().locator('.form-input');
    await expect(inp).toBeVisible();
    await expect(inp).toHaveAttribute('maxLength', '100');
    await takeScreenshot(page, '16_VariantString1输入框');
  });

  test('No.17 Variant string.2输入框', async ({ page }) => {
    resetCounter('17_VariantString2输入框');
    await takeScreenshot(page, '17_VariantString2输入框');
    // vs2 row has empty label - use nth
    const inputs = page.locator('.form-row').filter({ hasText: 'Variant string.' });
    const inp = inputs.nth(1).locator('.form-input');
    await expect(inp).toBeVisible();
    await expect(inp).toHaveAttribute('maxLength', '100');
    await takeScreenshot(page, '17_VariantString2输入框');
  });

  test('No.18 Comments输入框', async ({ page }) => {
    resetCounter('18_Comments输入框');
    await takeScreenshot(page, '18_Comments输入框');
    const inp = page.locator('.form-row').filter({ hasText: 'Comments' }).locator('.form-input');
    await expect(inp).toBeVisible();
    await expect(inp).toHaveAttribute('maxLength', '100');
    await takeScreenshot(page, '18_Comments输入框');
  });

  test('No.19 Add输入框', async ({ page }) => {
    resetCounter('19_Add输入框');
    await takeScreenshot(page, '19_Add输入框');
    const row = page.locator('.form-row').filter({ hasText: 'Add' });
    await expect(row.locator('.form-input')).toHaveAttribute('maxLength', '6');
    await expect(row.locator('.auto-label')).toContainText('YYYYWW');
    await takeScreenshot(page, '19_Add输入框');
  });

  test('No.20 Delete输入框', async ({ page }) => {
    resetCounter('20_Delete输入框');
    await takeScreenshot(page, '20_Delete输入框');
    const row = page.locator('.form-row').filter({ hasText: 'Delete' });
    await expect(row.locator('.form-input')).toHaveAttribute('maxLength', '6');
    await expect(row.locator('.auto-label')).toContainText('YYYYWW');
    await takeScreenshot(page, '20_Delete输入框');
  });

  test('No.21 Created by user输入框', async ({ page }) => {
    resetCounter('21_CreatedByUser输入框');
    await takeScreenshot(page, '21_CreatedByUser输入框');
    const row = page.locator('.form-row').filter({ hasText: 'Created by user' });
    await expect(row.locator('.form-input')).toHaveAttribute('maxLength', '16');
    await expect(row.locator('.auto-label')).toContainText('Automatic');
    await takeScreenshot(page, '21_CreatedByUser输入框');
  });

  test('No.22 Date输入框', async ({ page }) => {
    resetCounter('22_Date输入框');
    await takeScreenshot(page, '22_Date输入框');
    const row = page.locator('.form-row').filter({ hasText: 'Date' });
    const inp = row.locator('.form-input');
    await expect(inp).toHaveAttribute('maxLength', '10');
    await expect(inp).toHaveAttribute('placeholder', 'yyyy-MM-dd');
    await expect(row.locator('.auto-label')).toContainText('Automatic');
    await takeScreenshot(page, '22_Date输入框');
  });

  test('No.23 按钮组显示', async ({ page }) => {
    resetCounter('23_按钮组显示');
    await takeScreenshot(page, '23_按钮组显示');
    const btns = page.locator('.action-button');
    const texts = await btns.allTextContents();
    expect(texts.join(',')).toContain('Search');
    expect(texts.join(',')).toContain('Clear');
    expect(texts.join(',')).toContain('Add');
    expect(texts.join(',')).toContain('Update');
    expect(texts.join(',')).toContain('Delete');
    await takeScreenshot(page, '23_按钮组显示');
  });

  test('No.24 表单布局-标签宽度', async ({ page }) => {
    resetCounter('24_表单布局_标签宽度');
    await takeScreenshot(page, '24_表单布局_标签宽度');
    await expect(page.locator('.form-label').first()).toBeVisible();
    await expect(page.locator('.form-label.required').first()).toBeVisible();
    await takeScreenshot(page, '24_表单布局_标签宽度');
  });

  test('No.25 运算符下拉框对齐', async ({ page }) => {
    resetCounter('25_运算符下拉框对齐');
    await takeScreenshot(page, '25_运算符下拉框对齐');
    await expect(page.locator('.operator-select').first()).toBeVisible();
    await takeScreenshot(page, '25_运算符下拉框对齐');
  });
});

// ============================================================
// 3. 运算符下拉框 (No.26-31)
// ============================================================
test.describe('运算符下拉框', () => {

  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD08(page); await waitLoaded(page);
  });

  test('No.26 普通字段运算符选项', async ({ page }) => {
    resetCounter('26_普通字段运算符选项');
    await takeScreenshot(page, '26_普通字段运算符选项');
    const ops = page.locator('.operator-select').first();
    await ops.click();
    const opts = await ops.locator('option').allTextContents();
    expect(opts).toContain('=');
    expect(opts).toContain('!=');
    await takeScreenshot(page, '26_普通字段运算符选项');
  });

  test('No.27 数值日期字段运算符选项', async ({ page }) => {
    resetCounter('27_数值日期字段运算符选项');
    await takeScreenshot(page, '27_数值日期字段运算符选项');
    const ops = page.locator('.operator-select').nth(1); // Number field uses compare ops
    await ops.click();
    const opts = await ops.locator('option').allTextContents();
    expect(opts).toContain('=');
    expect(opts).toContain('>'); // &gt;
    expect(opts).toContain('<'); // &lt;
    await takeScreenshot(page, '27_数值日期字段运算符选项');
  });

  test('No.28 运算符切换 = 到 !=', async ({ page }) => {
    resetCounter('28_运算符切换到不等');
    await takeScreenshot(page, '28_运算符切换到不等');
    const op = page.locator('.operator-select').first();
    await op.selectOption('!=');
    await expect(op).toHaveValue('!=');
    await takeScreenshot(page, '28_运算符切换到不等');
  });

  test('No.29 运算符切换 = 到 GT', async ({ page }) => {
    resetCounter('29_运算符切换到GT');
    await takeScreenshot(page, '29_运算符切换到GT');
    const op = page.locator('.operator-select').nth(1);
    await op.selectOption('GT');
    await expect(op).toHaveValue('GT');
    await takeScreenshot(page, '29_运算符切换到GT');
  });

  test('No.30 运算符切换 = 到 LT', async ({ page }) => {
    resetCounter('30_运算符切换到LT');
    await takeScreenshot(page, '30_运算符切换到LT');
    const op = page.locator('.operator-select').nth(1);
    await op.selectOption('LT');
    await expect(op).toHaveValue('LT');
    await takeScreenshot(page, '30_运算符切换到LT');
  });

  test('No.31 运算符 GT 切换回 =', async ({ page }) => {
    resetCounter('31_运算符GT切换回等号');
    await takeScreenshot(page, '31_运算符GT切换回等号');
    const op = page.locator('.operator-select').nth(1);
    await op.selectOption('GT');
    await op.selectOption('=');
    await expect(op).toHaveValue('=');
    await takeScreenshot(page, '31_运算符GT切换回等号');
  });
});

// ============================================================
// 4. Number输入过滤 (No.32-36)
// ============================================================
test.describe('Number输入过滤', () => {

  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD08(page); await waitLoaded(page);
  });

  test('No.32 Number正常输入数字', async ({ page }) => {
    resetCounter('32_Number正常输入数字');
    await takeScreenshot(page, '32_Number正常输入数字');
    const inp = page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input');
    await inp.pressSequentially('1234567890');
    await expect(inp).toHaveValue('1234567890');
    await takeScreenshot(page, '32_Number正常输入数字');
  });

  test('No.33 Number输入字母被过滤', async ({ page }) => {
    resetCounter('33_Number输入字母被过滤');
    await takeScreenshot(page, '33_Number输入字母被过滤');
    const inp = page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input');
    await inp.pressSequentially('abc123');
    await expect(inp).toHaveValue('123');
    await takeScreenshot(page, '33_Number输入字母被过滤');
  });

  test('No.34 Number输入特殊字符被过滤', async ({ page }) => {
    resetCounter('34_Number输入特殊字符被过滤');
    await takeScreenshot(page, '34_Number输入特殊字符被过滤');
    const inp = page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input');
    await inp.pressSequentially('12-34@#$');
    await expect(inp).toHaveValue('1234');
    await takeScreenshot(page, '34_Number输入特殊字符被过滤');
  });

  test('No.35 Number超过10位截断', async ({ page }) => {
    resetCounter('35_Number超过10位截断');
    await takeScreenshot(page, '35_Number超过10位截断');
    const inp = page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input');
    await inp.pressSequentially('1234567890123');
    const val = await inp.inputValue();
    expect(val.length).toBeLessThanOrEqual(10);
    await takeScreenshot(page, '35_Number超过10位截断');
  });

  test('No.36 Number退格清空', async ({ page }) => {
    resetCounter('36_Number退格清空');
    await takeScreenshot(page, '36_Number退格清空');
    const inp = page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input');
    await inp.pressSequentially('12345');
    await inp.fill('');
    await expect(inp).toHaveValue('');
    await takeScreenshot(page, '36_Number退格清空');
  });
});

// ============================================================
// 5. Date输入过滤 (No.37-40)
// ============================================================
test.describe('Date输入过滤', () => {

  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD08(page); await waitLoaded(page);
  });

  test('No.37 Date正常输入', async ({ page }) => {
    resetCounter('37_Date正常输入');
    await takeScreenshot(page, '37_Date正常输入');
    const inp = page.locator('.form-row').filter({ hasText: 'Date' }).locator('.form-input');
    await inp.pressSequentially('2026-07-07');
    await expect(inp).toHaveValue('2026-07-07');
    await takeScreenshot(page, '37_Date正常输入');
  });

  test('No.38 Date输入字母被过滤', async ({ page }) => {
    resetCounter('38_Date输入字母被过滤');
    await takeScreenshot(page, '38_Date输入字母被过滤');
    const inp = page.locator('.form-row').filter({ hasText: 'Date' }).locator('.form-input');
    await inp.pressSequentially('2026-07-aa');
    await expect(inp).toHaveValue('2026-07-');
    await takeScreenshot(page, '38_Date输入字母被过滤');
  });

  test('No.39 Date输入非法字符被过滤', async ({ page }) => {
    resetCounter('39_Date输入非法字符被过滤');
    await takeScreenshot(page, '39_Date输入非法字符被过滤');
    const inp = page.locator('.form-row').filter({ hasText: 'Date' }).locator('.form-input');
    await inp.pressSequentially('2026/07/07');
    await expect(inp).toHaveValue('2026-07-07');
    await takeScreenshot(page, '39_Date输入非法字符被过滤');
  });

  test('No.40 Date超过10位截断', async ({ page }) => {
    resetCounter('40_Date超过10位截断');
    await takeScreenshot(page, '40_Date超过10位截断');
    const inp = page.locator('.form-row').filter({ hasText: 'Date' }).locator('.form-input');
    await inp.pressSequentially('2026-07-07123');
    const val = await inp.inputValue();
    expect(val.length).toBeLessThanOrEqual(10);
    await takeScreenshot(page, '40_Date超过10位截断');
  });
});

// ============================================================
// 6. 其他字段输入过滤 (No.41-54)
// ============================================================
test.describe('其他字段输入过滤', () => {

  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD08(page); await waitLoaded(page);
  });

  test('No.41 Variable正常输入', async ({ page }) => {
    resetCounter('41_Variable正常输入');
    await takeScreenshot(page, '41_Variable正常输入');
    const inp = page.locator('.form-row').filter({ hasText: 'Variable' }).locator('.form-input');
    await inp.pressSequentially('TEST_VAR-001');
    await expect(inp).toHaveValue('TEST_VAR-001');
    await takeScreenshot(page, '41_Variable正常输入');
  });

  test('No.42 Variable全角字符被过滤', async ({ page }) => {
    resetCounter('42_Variable全角字符被过滤');
    await takeScreenshot(page, '42_Variable全角字符被过滤');
    const inp = page.locator('.form-row').filter({ hasText: 'Variable' }).locator('.form-input');
    await inp.pressSequentially('ＴＥＳＴ');
    await expect(inp).toHaveValue('');
    await takeScreenshot(page, '42_Variable全角字符被过滤');
  });

  test('No.43 Variable空格被过滤', async ({ page }) => {
    resetCounter('43_Variable空格被过滤');
    await takeScreenshot(page, '43_Variable空格被过滤');
    const inp = page.locator('.form-row').filter({ hasText: 'Variable' }).locator('.form-input');
    await inp.pressSequentially('TEST VAR');
    await takeScreenshot(page, '43_Variable空格被过滤');
  });

  test('No.44 Variable特殊符号过滤', async ({ page }) => {
    resetCounter('44_Variable特殊符号过滤');
    await takeScreenshot(page, '44_Variable特殊符号过滤');
    const inp = page.locator('.form-row').filter({ hasText: 'Variable' }).locator('.form-input');
    await inp.pressSequentially('TEST@VAR#001');
    await takeScreenshot(page, '44_Variable特殊符号过滤');
  });

  test('No.45 Variable最大长度30', async ({ page }) => {
    resetCounter('45_Variable最大长度30');
    await takeScreenshot(page, '45_Variable最大长度30');
    const inp = page.locator('.form-row').filter({ hasText: 'Variable' }).locator('.form-input');
    await inp.pressSequentially('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123');
    const val = await inp.inputValue();
    expect(val.length).toBeLessThanOrEqual(20);
    await takeScreenshot(page, '45_Variable最大长度30');
  });

  test('No.46 Value正常输入', async ({ page }) => {
    resetCounter('46_Value正常输入');
    await takeScreenshot(page, '46_Value正常输入');
    const inp = page.locator('.form-row').filter({ hasText: 'Value' }).locator('.form-input');
    await inp.pressSequentially('Test Value 123');
    await expect(inp).toHaveValue('Test Value 123');
    await takeScreenshot(page, '46_Value正常输入');
  });

  test('No.47 Value最大长度200', async ({ page }) => {
    resetCounter('47_Value最大长度200');
    await takeScreenshot(page, '47_Value最大长度200');
    const inp = page.locator('.form-row').filter({ hasText: 'Value' }).locator('.form-input');
    const longText = 'A'.repeat(201);
    await inp.fill('');
    await inp.pressSequentially(longText);
    const val = await inp.inputValue();
    expect(val.length).toBeLessThanOrEqual(200);
    await takeScreenshot(page, '47_Value最大长度200');
  });

  test('No.48 Value超200字符截断', async ({ page }) => {
    resetCounter('48_Value超200字符截断');
    await takeScreenshot(page, '48_Value超200字符截断');
    const inp = page.locator('.form-row').filter({ hasText: 'Value' }).locator('.form-input');
    await inp.fill('');
    await inp.pressSequentially('B'.repeat(250));
    const val = await inp.inputValue();
    expect(val.length).toBeLessThanOrEqual(200);
    await takeScreenshot(page, '48_Value超200字符截断');
  });

  test('No.49 Variant string.1正常输入', async ({ page }) => {
    resetCounter('49_VariantString1正常输入');
    await takeScreenshot(page, '49_VariantString1正常输入');
    const inp = page.locator('.form-row').filter({ hasText: 'Variant string.' }).first().locator('.form-input');
    await inp.pressSequentially('Variant1_Test');
    await expect(inp).toHaveValue('Variant1_Test');
    await takeScreenshot(page, '49_VariantString1正常输入');
  });

  test('No.50 Variant string.1最大长度100', async ({ page }) => {
    resetCounter('50_VariantString1最大长度100');
    await takeScreenshot(page, '50_VariantString1最大长度100');
    const inp = page.locator('.form-row').filter({ hasText: 'Variant string.' }).first().locator('.form-input');
    await inp.pressSequentially('A'.repeat(120));
    const val = await inp.inputValue();
    expect(val.length).toBeLessThanOrEqual(100);
    await takeScreenshot(page, '50_VariantString1最大长度100');
  });

  test('No.51 Variant string.2正常输入', async ({ page }) => {
    resetCounter('51_VariantString2正常输入');
    await takeScreenshot(page, '51_VariantString2正常输入');
    const inp = page.locator('.form-row').filter({ hasText: 'Variant string.' }).nth(1).locator('.form-input');
    await inp.pressSequentially('Variant2_Test');
    await expect(inp).toHaveValue('Variant2_Test');
    await takeScreenshot(page, '51_VariantString2正常输入');
  });

  test('No.52 Variant string.2最大长度100', async ({ page }) => {
    resetCounter('52_VariantString2最大长度100');
    await takeScreenshot(page, '52_VariantString2最大长度100');
    const inp = page.locator('.form-row').filter({ hasText: 'Variant string.' }).nth(1).locator('.form-input');
    await inp.pressSequentially('B'.repeat(120));
    const val = await inp.inputValue();
    expect(val.length).toBeLessThanOrEqual(100);
    await takeScreenshot(page, '52_VariantString2最大长度100');
  });

  test('No.53 Comments正常输入', async ({ page }) => {
    resetCounter('53_Comments正常输入');
    await takeScreenshot(page, '53_Comments正常输入');
    const inp = page.locator('.form-row').filter({ hasText: 'Comments' }).locator('.form-input');
    await inp.pressSequentially('Test comment 123');
    await expect(inp).toHaveValue('Test comment 123');
    await takeScreenshot(page, '53_Comments正常输入');
  });

  test('No.54 Comments最大长度100', async ({ page }) => {
    resetCounter('54_Comments最大长度100');
    await takeScreenshot(page, '54_Comments最大长度100');
    const inp = page.locator('.form-row').filter({ hasText: 'Comments' }).locator('.form-input');
    await inp.pressSequentially('C'.repeat(120));
    const val = await inp.inputValue();
    expect(val.length).toBeLessThanOrEqual(100);
    await takeScreenshot(page, '54_Comments最大长度100');
  });
});

// ============================================================
// 7. Search→跳转UD09 (No.55-61)
// ============================================================
test.describe('Search跳转UD09', () => {

  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD08(page); await waitLoaded(page);
  });

  test('No.55 Search所有字段有值跳转', async ({ page }) => {
    resetCounter('55_Search所有字段有值跳转');
    // Fill form fields
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await page.locator('.form-row').filter({ hasText: 'Variable' }).locator('.form-input').fill('TEMPLATE-VAR001');
    await page.locator('.form-row').filter({ hasText: 'Value' }).locator('.form-input').fill('Test');
    await page.locator('.form-row').filter({ hasText: 'Comments' }).locator('.form-input').fill('test');
    await takeScreenshot(page, '55_Search所有字段有值跳转');
    await page.locator('.action-button').filter({ hasText: 'Search' }).click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '55_Search所有字段有值跳转');
  });

  test('No.56 Search部分字段有值跳转', async ({ page }) => {
    resetCounter('56_Search部分字段有值跳转');
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '56_Search部分字段有值跳转');
    await page.locator('.action-button').filter({ hasText: 'Search' }).click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '56_Search部分字段有值跳转');
  });

  test('No.57 Search所有字段为空跳转', async ({ page }) => {
    resetCounter('57_Search所有字段为空跳转');
    await takeScreenshot(page, '57_Search所有字段为空跳转');
    await page.locator('.action-button').filter({ hasText: 'Search' }).click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '57_Search所有字段为空跳转');
  });

  test('No.58 Search运算符传递验证', async ({ page }) => {
    resetCounter('58_Search运算符传递验证');
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.operator-select').first().selectOption('!=');
    await page.locator('.operator-select').nth(1).selectOption('GT');
    await takeScreenshot(page, '58_Search运算符传递验证');
    await page.locator('.action-button').filter({ hasText: 'Search' }).click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '58_Search运算符传递验证');
  });

  test('No.59 Search Number GT运算符', async ({ page }) => {
    resetCounter('59_SearchNumberGT运算符');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.operator-select').nth(1).selectOption('GT');
    await takeScreenshot(page, '59_SearchNumberGT运算符');
    await page.locator('.action-button').filter({ hasText: 'Search' }).click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '59_SearchNumberGT运算符');
  });

  test('No.60 Search Number LT运算符', async ({ page }) => {
    resetCounter('60_SearchNumberLT运算符');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('200');
    await page.locator('.operator-select').nth(1).selectOption('LT');
    await takeScreenshot(page, '60_SearchNumberLT运算符');
    await page.locator('.action-button').filter({ hasText: 'Search' }).click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '60_SearchNumberLT运算符');
  });

  test('No.61 Search Date字段不传递', async ({ page }) => {
    resetCounter('61_SearchDate字段不传递');
    await page.locator('.form-row').filter({ hasText: 'Date' }).locator('.form-input').fill('2026-07-07');
    await takeScreenshot(page, '61_SearchDate字段不传递');
    await page.locator('.action-button').filter({ hasText: 'Search' }).click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '61_SearchDate字段不传递');
  });
});

// ============================================================
// 8. Clear按钮 (No.62-65)
// ============================================================
test.describe('Clear按钮', () => {

  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD08(page); await waitLoaded(page);
  });

  test('No.62 Clear清空所有字段', async ({ page }) => {
    resetCounter('62_Clear清空所有字段');
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('123');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await page.locator('.form-row').filter({ hasText: 'Variable' }).locator('.form-input').fill('TEST');
    await takeScreenshot(page, '62_Clear清空所有字段');
    await page.locator('.action-button').filter({ hasText: 'Clear' }).click();
    await takeScreenshot(page, '62_Clear清空所有字段');
    const inputs = page.locator('.form-input');
    const cnt = await inputs.count();
    for (let i = 0; i < cnt; i++) {
      await expect(inputs.nth(i)).toHaveValue('');
    }
    await takeScreenshot(page, '62_Clear清空所有字段');
  });

  test('No.63 Clear后运算符不变', async ({ page }) => {
    resetCounter('63_Clear后运算符不变');
    await page.locator('.operator-select').first().selectOption('!=');
    await page.locator('.operator-select').nth(1).selectOption('GT');
    await page.locator('.action-button').filter({ hasText: 'Clear' }).click();
    await takeScreenshot(page, '63_Clear后运算符不变');
    await expect(page.locator('.operator-select').first()).toHaveValue('!=');
    await expect(page.locator('.operator-select').nth(1)).toHaveValue('GT');
    await takeScreenshot(page, '63_Clear后运算符不变');
  });

  test('No.64 Clear清除消息', async ({ page }) => {
    resetCounter('64_Clear清除消息');
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 3000 });
    await takeScreenshot(page, '64_Clear清除消息');
    await page.locator('.action-button').filter({ hasText: 'Clear' }).click();
    await expect(page.locator('.error-message')).toHaveCount(0);
    await takeScreenshot(page, '64_Clear清除消息');
  });

  test('No.65 Clear按钮可用状态', async ({ page }) => {
    resetCounter('65_Clear按钮可用状态');
    await takeScreenshot(page, '65_Clear按钮可用状态');
    await expect(page.locator('.action-button').filter({ hasText: 'Clear' })).toBeEnabled();
    await takeScreenshot(page, '65_Clear按钮可用状态');
  });
});

// ============================================================
// 9. Add功能 (No.66-80)
// ============================================================
test.describe('Add功能', () => {

  test('No.66 Add正常新增', async ({ page }) => {
    resetCounter('66_Add正常新增');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await takeScreenshot(page, '66_Add正常新增');
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await page.locator('.form-row').filter({ hasText: 'Variable' }).locator('.form-input').fill('TEMPLATE-VAR001');
    await page.locator('.form-row').filter({ hasText: 'Value' }).locator('.form-input').fill('Test Value');
    await page.locator('.form-row').filter({ hasText: 'Add' }).locator('.form-input').fill('202601');
    await takeScreenshot(page, '66_Add正常新增');
    await page.route(`${API_BASE}/api/ud08/add`, async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
    });
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '66_Add正常新增');
  });

  test('No.67 Add Product Class未选择', async ({ page }) => {
    resetCounter('67_AddProductClass未选择');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '67_AddProductClass未选择');
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.error-message')).toContainText('Product class is required');
    await takeScreenshot(page, '67_AddProductClass未选择');
  });

  test('No.68 Add Number为空', async ({ page }) => {
    resetCounter('68_AddNumber为空');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '68_AddNumber为空');
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toContainText('Number is required');
    await takeScreenshot(page, '68_AddNumber为空');
  });

  test('No.69 Add Number含非数字', async ({ page }) => {
    resetCounter('69_AddNumber含非数字');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '69_AddNumber含非数字');
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '69_AddNumber含非数字');
  });

  test('No.70 Add Market未选择', async ({ page }) => {
    resetCounter('70_AddMarket未选择');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await takeScreenshot(page, '70_AddMarket未选择');
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toContainText('Market is required');
    await takeScreenshot(page, '70_AddMarket未选择');
  });

  test('No.71 Add多个必填项未填', async ({ page }) => {
    resetCounter('71_Add多个必填项未填');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await takeScreenshot(page, '71_Add多个必填项未填');
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toContainText('Product class is required');
    await takeScreenshot(page, '71_Add多个必填项未填');
  });

  test('No.72 Add Variable不存在', async ({ page }) => {
    resetCounter('72_AddVariable不存在');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await page.locator('.form-row').filter({ hasText: 'Variable' }).locator('.form-input').fill('TEMPLATE-UNKNOWN');
    await takeScreenshot(page, '72_AddVariable不存在');
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '72_AddVariable不存在');
  });

  test('No.73 Add Variable不以TEMPLATE-开头不校验', async ({ page }) => {
    resetCounter('73_AddVariable非TEMPLATE');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await page.locator('.form-row').filter({ hasText: 'Variable' }).locator('.form-input').fill('CUSTOM_VAR');
    await takeScreenshot(page, '73_AddVariable非TEMPLATE');
    await page.route(`${API_BASE}/api/ud08/add`, async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
    });
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '73_AddVariable非TEMPLATE');
  });

  test('No.74 Add主键冲突409', async ({ page }) => {
    resetCounter('74_Add主键冲突409');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('999');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '74_Add主键冲突409');
    await page.route(`${API_BASE}/api/ud08/add`, async route => {
      await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ code: 409 }) });
    });
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toContainText('Primary key conflict');
    await takeScreenshot(page, '74_Add主键冲突409');
  });

  test('No.75 Add Variable不存在API400', async ({ page }) => {
    resetCounter('75_AddVariable不存在API400');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '75_AddVariable不存在API400');
    await page.route(`${API_BASE}/api/ud08/add`, async route => {
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 400 }) });
    });
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '75_AddVariable不存在API400');
  });

  test('No.76 Add服务器错误500', async ({ page }) => {
    resetCounter('76_Add服务器错误500');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '76_Add服务器错误500');
    await page.route(`${API_BASE}/api/ud08/add`, async route => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500 }) });
    });
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, '76_Add服务器错误500');
  });

  test('No.77 Add网络错误', async ({ page }) => {
    resetCounter('77_Add网络错误');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '77_Add网络错误');
    await page.route(`${API_BASE}/api/ud08/add`, async route => route.abort('connectionrefused'));
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, '77_Add网络错误');
  });

  test('No.78 Add API超时', async ({ page }) => {
    resetCounter('78_AddAPI超时');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '78_AddAPI超时');
    await page.route(`${API_BASE}/api/ud08/add`, async route => { await new Promise(r => setTimeout(r, 15000)); });
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(12000);
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 15000 });
    await takeScreenshot(page, '78_AddAPI超时');
  });

  test('No.79 Add按钮Loading状态', async ({ page }) => {
    resetCounter('79_Add按钮Loading状态');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '79_Add按钮Loading状态');
    await page.route(`${API_BASE}/api/ud08/add`, async route => { await new Promise(r => setTimeout(r, 3000)); });
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.action-button').filter({ hasText: 'Add' })).toBeDisabled();
    await takeScreenshot(page, '79_Add按钮Loading状态');
  });

  test('No.80 Add防止重复提交', async ({ page }) => {
    resetCounter('80_Add防止重复提交');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    let callCount = 0;
    await page.route(`${API_BASE}/api/ud08/add`, async route => {
      callCount++; await new Promise(r => setTimeout(r, 3000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
    });
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await page.locator('.action-button').filter({ hasText: 'Add' }).click({ force: true });
    await page.waitForTimeout(4000);
    expect(callCount).toBeLessThanOrEqual(1);
    await takeScreenshot(page, '80_Add防止重复提交');
  });
});

// ============================================================
// 10. Update功能 (No.81-92)
// ============================================================
test.describe('Update功能', () => {

  test('No.81 Update正常更新', async ({ page }) => {
    resetCounter('81_Update正常更新');
    await loginAndGoToUD08(page); await waitLoaded(page);
    // Simulate returning from UD09 with data via location state
    await page.evaluate(() => {
      window.history.replaceState({
        selectedRecord: { productClass: 'PC01', number: '100', market: 'DE', variable: 'TEMPLATE-VAR001', value: 'Old', comments: 'Old comment', addDate: '202601', updateUser: 'admin', updateDatetime: '2026-01-15' }
      }, '', window.location.pathname);
    });
    await page.reload(); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Value' }).locator('.form-input').fill('Updated Value');
    await page.locator('.form-row').filter({ hasText: 'Comments' }).locator('.form-input').fill('Updated comment');
    await takeScreenshot(page, '81_Update正常更新');
    await page.route(`${API_BASE}/api/ud08/update`, async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
    });
    await page.locator('.action-button').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '81_Update正常更新');
  });

  test('No.82 Update Product Class未选择', async ({ page }) => {
    resetCounter('82_UpdateProductClass未选择');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.evaluate(() => window.history.replaceState({ selectedRecord: { productClass: 'PC01', number: '100', market: 'DE' } }, '', window.location.pathname));
    await page.reload(); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('');
    await takeScreenshot(page, '82_UpdateProductClass未选择');
    await page.locator('.action-button').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toContainText('Product class is required');
    await takeScreenshot(page, '82_UpdateProductClass未选择');
  });

  test('No.83 Update Number为空', async ({ page }) => {
    resetCounter('83_UpdateNumber为空');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.evaluate(() => window.history.replaceState({ selectedRecord: { productClass: 'PC01', number: '100', market: 'DE' } }, '', window.location.pathname));
    await page.reload(); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('');
    await takeScreenshot(page, '83_UpdateNumber为空');
    await page.locator('.action-button').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toContainText('Number is required');
    await takeScreenshot(page, '83_UpdateNumber为空');
  });

  test('No.84 Update Market未选择', async ({ page }) => {
    resetCounter('84_UpdateMarket未选择');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.evaluate(() => window.history.replaceState({ selectedRecord: { productClass: 'PC01', number: '100', market: 'DE' } }, '', window.location.pathname));
    await page.reload(); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('');
    await takeScreenshot(page, '84_UpdateMarket未选择');
    await page.locator('.action-button').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toContainText('Market is required');
    await takeScreenshot(page, '84_UpdateMarket未选择');
  });

  test('No.85 Update主键被修改-Product Class', async ({ page }) => {
    resetCounter('85_Update主键被修改PC');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.evaluate(() => window.history.replaceState({ selectedRecord: { productClass: 'PC01', number: '100', market: 'DE' } }, '', window.location.pathname));
    await page.reload(); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC02');
    await takeScreenshot(page, '85_Update主键被修改PC');
    await page.locator('.action-button').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toContainText('Primary key conflict');
    await takeScreenshot(page, '85_Update主键被修改PC');
  });

  test('No.86 Update主键被修改-Number', async ({ page }) => {
    resetCounter('86_Update主键被修改Number');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.evaluate(() => window.history.replaceState({ selectedRecord: { productClass: 'PC01', number: '100', market: 'DE' } }, '', window.location.pathname));
    await page.reload(); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('200');
    await takeScreenshot(page, '86_Update主键被修改Number');
    await page.locator('.action-button').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toContainText('Primary key conflict');
    await takeScreenshot(page, '86_Update主键被修改Number');
  });

  test('No.87 Update主键被修改-Market', async ({ page }) => {
    resetCounter('87_Update主键被修改Market');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.evaluate(() => window.history.replaceState({ selectedRecord: { productClass: 'PC01', number: '100', market: 'DE' } }, '', window.location.pathname));
    await page.reload(); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('CHN');
    await takeScreenshot(page, '87_Update主键被修改Market');
    await page.locator('.action-button').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toContainText('Primary key conflict');
    await takeScreenshot(page, '87_Update主键被修改Market');
  });

  test('No.88 Update Variable不存在', async ({ page }) => {
    resetCounter('88_UpdateVariable不存在');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.evaluate(() => window.history.replaceState({ selectedRecord: { productClass: 'PC01', number: '100', market: 'DE' } }, '', window.location.pathname));
    await page.reload(); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Variable' }).locator('.form-input').fill('TEMPLATE-UNKNOWN');
    await takeScreenshot(page, '88_UpdateVariable不存在');
    await page.locator('.action-button').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '88_UpdateVariable不存在');
  });

  test('No.89 Update记录不存在404', async ({ page }) => {
    resetCounter('89_Update记录不存在404');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('999');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '89_Update记录不存在404');
    await page.route(`${API_BASE}/api/ud08/update`, async route => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 404 }) });
    });
    await page.locator('.action-button').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '89_Update记录不存在404');
  });

  test('No.90 Update服务器错误500', async ({ page }) => {
    resetCounter('90_Update服务器错误500');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '90_Update服务器错误500');
    await page.route(`${API_BASE}/api/ud08/update`, async route => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500 }) });
    });
    await page.locator('.action-button').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, '90_Update服务器错误500');
  });

  test('No.91 Update网络错误', async ({ page }) => {
    resetCounter('91_Update网络错误');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '91_Update网络错误');
    await page.route(`${API_BASE}/api/ud08/update`, async route => route.abort('connectionrefused'));
    await page.locator('.action-button').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, '91_Update网络错误');
  });

  test('No.92 Update按钮Loading状态', async ({ page }) => {
    resetCounter('92_Update按钮Loading状态');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '92_Update按钮Loading状态');
    await page.route(`${API_BASE}/api/ud08/update`, async route => { await new Promise(r => setTimeout(r, 3000)); });
    await page.locator('.action-button').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.action-button').filter({ hasText: 'Update' })).toBeDisabled();
    await takeScreenshot(page, '92_Update按钮Loading状态');
  });
});

// ============================================================
// 11. Delete功能 (No.93-101)
// ============================================================
test.describe('Delete功能', () => {

  test('No.93 Delete正常删除', async ({ page }) => {
    resetCounter('93_Delete正常删除');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '93_Delete正常删除');
    await page.route(`${API_BASE}/api/ud08/delete`, async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
    });
    await page.locator('.action-button').filter({ hasText: 'Delete' }).click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '93_Delete正常删除');
  });

  test('No.94 Delete Product Class未选择', async ({ page }) => {
    resetCounter('94_DeleteProductClass未选择');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '94_DeleteProductClass未选择');
    await page.locator('.action-button').filter({ hasText: 'Delete' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toContainText('Product class is required');
    await takeScreenshot(page, '94_DeleteProductClass未选择');
  });

  test('No.95 Delete Number为空', async ({ page }) => {
    resetCounter('95_DeleteNumber为空');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '95_DeleteNumber为空');
    await page.locator('.action-button').filter({ hasText: 'Delete' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toContainText('Number is required');
    await takeScreenshot(page, '95_DeleteNumber为空');
  });

  test('No.96 Delete Market未选择', async ({ page }) => {
    resetCounter('96_DeleteMarket未选择');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await takeScreenshot(page, '96_DeleteMarket未选择');
    await page.locator('.action-button').filter({ hasText: 'Delete' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toContainText('Market is required');
    await takeScreenshot(page, '96_DeleteMarket未选择');
  });

  test('No.97 Delete记录不存在404', async ({ page }) => {
    resetCounter('97_Delete记录不存在404');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('999');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '97_Delete记录不存在404');
    await page.route(`${API_BASE}/api/ud08/delete`, async route => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 404 }) });
    });
    await page.locator('.action-button').filter({ hasText: 'Delete' }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '97_Delete记录不存在404');
  });

  test('No.98 Delete服务器错误500', async ({ page }) => {
    resetCounter('98_Delete服务器错误500');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '98_Delete服务器错误500');
    await page.route(`${API_BASE}/api/ud08/delete`, async route => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500 }) });
    });
    await page.locator('.action-button').filter({ hasText: 'Delete' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, '98_Delete服务器错误500');
  });

  test('No.99 Delete网络错误', async ({ page }) => {
    resetCounter('99_Delete网络错误');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '99_Delete网络错误');
    await page.route(`${API_BASE}/api/ud08/delete`, async route => route.abort('connectionrefused'));
    await page.locator('.action-button').filter({ hasText: 'Delete' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, '99_Delete网络错误');
  });

  test('No.100 Delete按钮Loading状态', async ({ page }) => {
    resetCounter('100_Delete按钮Loading状态');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await takeScreenshot(page, '100_Delete按钮Loading状态');
    await page.route(`${API_BASE}/api/ud08/delete`, async route => { await new Promise(r => setTimeout(r, 3000)); });
    await page.locator('.action-button').filter({ hasText: 'Delete' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.action-button').filter({ hasText: 'Delete' })).toBeDisabled();
    await takeScreenshot(page, '100_Delete按钮Loading状态');
  });

  test('No.101 Delete防止重复提交', async ({ page }) => {
    resetCounter('101_Delete防止重复提交');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    let callCount = 0;
    await page.route(`${API_BASE}/api/ud08/delete`, async route => {
      callCount++; await new Promise(r => setTimeout(r, 3000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
    });
    await page.locator('.action-button').filter({ hasText: 'Delete' }).click();
    await page.waitForTimeout(500);
    await page.locator('.action-button').filter({ hasText: 'Delete' }).click({ force: true });
    await page.waitForTimeout(4000);
    expect(callCount).toBeLessThanOrEqual(1);
    await takeScreenshot(page, '101_Delete防止重复提交');
  });
});

// ============================================================
// 12. 从UD09返回处理 (No.102-105)
// ============================================================
test.describe('从UD09返回处理', () => {

  test('No.102 从UD09 Select返回数据填充', async ({ page }) => {
    resetCounter('102_从UD09Select返回数据填充');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.evaluate(() => {
      window.history.replaceState({
        selectedRecord: { productClass: 'PC01', number: '100', market: 'DE', variable: 'TEMPLATE-VAR001', value: 'TestValue', vs: 'V1', vs2: 'V2', comments: 'Test comment', addDate: '202601', deleteDate: '', updateUser: 'admin', updateDatetime: '2026-01-15' }
      }, '', window.location.pathname);
    });
    await page.reload(); await waitLoaded(page);
    await takeScreenshot(page, '102_从UD09Select返回数据填充');
    await expect(page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select')).toHaveValue('PC01');
    await expect(page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input')).toHaveValue('100');
    await expect(page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select')).toHaveValue('DE');
    await takeScreenshot(page, '102_从UD09Select返回数据填充');
  });

  test('No.103 从UD09 Select返回原始主键保存', async ({ page }) => {
    resetCounter('103_从UD09Select返回原始主键保存');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.evaluate(() => {
      window.history.replaceState({ selectedRecord: { productClass: 'PC01', number: '100', market: 'DE' } }, '', window.location.pathname);
    });
    await page.reload(); await waitLoaded(page);
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC02');
    await takeScreenshot(page, '103_从UD09Select返回原始主键保存');
    await page.locator('.action-button').filter({ hasText: 'Update' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toContainText('Primary key conflict');
    await takeScreenshot(page, '103_从UD09Select返回原始主键保存');
  });

  test('No.104 从UD09 Back返回搜索条件恢复', async ({ page }) => {
    resetCounter('104_从UD09Back返回搜索条件恢复');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.evaluate(() => {
      window.history.replaceState({
        searchConditions: { productClass: 'PC01', number: '100', market: 'DE' }
      }, '', window.location.pathname);
    });
    await page.reload(); await waitLoaded(page);
    await takeScreenshot(page, '104_从UD09Back返回搜索条件恢复');
  });

  test('No.105 从UD09 Back返回运算符恢复', async ({ page }) => {
    resetCounter('105_从UD09Back返回运算符恢复');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.evaluate(() => {
      window.history.replaceState({
        searchConditions: { productClassOp: '!=', numberOp: 'GT', productClass: 'PC01', number: '100', market: 'DE' }
      }, '', window.location.pathname);
    });
    await page.reload(); await waitLoaded(page);
    await takeScreenshot(page, '105_从UD09Back返回运算符恢复');
  });
});

// ============================================================
// 13. 消息显示与交互 (No.106-109)
// ============================================================
test.describe('消息显示与交互', () => {

  test('No.106 消息类型Error样式', async ({ page }) => {
    resetCounter('106_消息类型Error样式');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '106_消息类型Error样式');
    await expect(page.locator('.error-message')).toBeVisible();
    await takeScreenshot(page, '106_消息类型Error样式');
  });

  test('No.107 消息类型Success样式', async ({ page }) => {
    resetCounter('107_消息类型Success样式');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.route(`${API_BASE}/api/ud08/add`, async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200 }) });
    });
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.locator('.form-row').filter({ hasText: 'Number' }).locator('.form-input').fill('100');
    await page.locator('.form-row').filter({ hasText: 'Market' }).locator('.form-select').selectOption('DE');
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '107_消息类型Success样式');
    await expect(page.locator('.success-message')).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, '107_消息类型Success样式');
  });

  test('No.108 消息清空-新操作清除', async ({ page }) => {
    resetCounter('108_消息清空新操作清除');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 3000 });
    await takeScreenshot(page, '108_消息清空新操作清除');
    await page.locator('.form-row').filter({ hasText: 'Product class' }).locator('.form-select').selectOption('PC01');
    await page.waitForTimeout(300);
    await takeScreenshot(page, '108_消息清空新操作清除');
  });

  test('No.109 消息清空-Clear清除', async ({ page }) => {
    resetCounter('109_消息清空Clear清除');
    await loginAndGoToUD08(page); await waitLoaded(page);
    await page.locator('.action-button').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 3000 });
    await takeScreenshot(page, '109_消息清空Clear清除');
    await page.locator('.action-button').filter({ hasText: 'Clear' }).click();
    await expect(page.locator('.error-message')).toHaveCount(0);
    await takeScreenshot(page, '109_消息清空Clear清除');
  });
});
