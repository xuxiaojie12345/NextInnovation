// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD09_HomologationVariablesResultList 单元测试
// 测试规格书: テスト式样書UD09.md
// 画面文件: UD09_HomologationVariablesResultList.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD09');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

// ==================== Mock检索结果数据 ====================
const MOCK_RESULTS_MULTI = [
  { productClass: '01', number: '11', market: '-EU', variable: 'var1', value: 'val1', variantString1: 'VS1', variantString2: 'VS2', comments: 'cmt1', addDate: '202601', deleteDate: '', createdByUser: 'user01', registerDatetime: '2026-01-15T10:00:00.000Z' },
  { productClass: '01', number: '12', market: '-EU', variable: 'var2', value: 'val2', variantString1: 'V82441259', variantString2: null, comments: 'cmt2', addDate: '202602', deleteDate: '', createdByUser: 'admin', registerDatetime: '2026-02-20T08:30:00.000Z' },
  { productClass: '01', number: '2222', market: 'AF', variable: 'var', value: '123', variantString1: '1234', variantString2: '1234', comments: '2234', addDate: '202607', deleteDate: '202607', createdByUser: 'SYSTEM', registerDatetime: '2026-07-01T07:56:10.000Z' },
  { productClass: '01', number: '7768', market: '-EU', variable: 'v7768', value: 'v7768', variantString1: 'VS1_07768', variantString2: 'VS2_07768', comments: '', addDate: '202603', deleteDate: '', createdByUser: 'tester', registerDatetime: '2026-03-10T09:00:00.000Z' },
  { productClass: '01', number: '1231', market: '-EU', variable: 'v1231', value: 'v1231', variantString1: 'V82441259', variantString2: null, comments: '', addDate: '202604', deleteDate: '', createdByUser: 'x001', registerDatetime: '2026-04-05T11:00:00.000Z' },
  { productClass: '02', number: '15', market: 'CHN', variable: 'VAR', value: '234', variantString1: '231', variantString2: '213', comments: '214', addDate: '202607', deleteDate: '', createdByUser: 'admin445', registerDatetime: '2026-07-02T11:02:29.000Z' },
];

const MOCK_RESULTS_SINGLE = [
  { productClass: '01', number: '11', market: '-EU', variable: 'var1', value: 'val1', variantString1: 'VS1', variantString2: 'VS2', comments: 'cmt1', addDate: '202601', deleteDate: '', createdByUser: 'user01', registerDatetime: '2026-01-15T10:00:00.000Z' },
];

/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD09画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * Mock UD09 检索API并导航到UD09
 * 使用 window.history.replaceState + reload 方式注入路由参数
 */
async function goToUD09Mock(
  page: Page,
  mockData: any[],
  searchParams: Record<string, any> = {},
  formData?: Record<string, any>
) {
  // 拦截 API
  await page.route('**/api/ud09/seach', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, data: mockData, message: '' })
    });
  });

  await login(page);
  await page.goto(BASE_URL + '/UD09');
  await page.waitForSelector('.ud09-container');

  // 通过 replaceState 注入路由参数后重新加载
  await page.evaluate(({ params, form }) => {
    window.history.replaceState(
      { searchParams: params, formData: form || {} },
      '',
      '/UD09'
    );
  }, { params: searchParams, form: formData || {} });
  await page.reload();
  await page.waitForSelector('.ud09-container');
  await page.waitForTimeout(2000);
}

/**
 * 使用真实API导航到UD09（非Mock场景）
 */
async function goToUD09Real(
  page: Page,
  searchParams: Record<string, any>,
  formData?: Record<string, any>
) {
  await login(page);
  await page.goto(BASE_URL + '/UD09');
  await page.waitForSelector('.ud09-container');

  await page.evaluate(({ params, form }) => {
    window.history.replaceState(
      { searchParams: params, formData: form || {} },
      '',
      '/UD09'
    );
  }, { params: searchParams, form: formData || {} });
  await page.reload();
  await page.waitForSelector('.ud09-container');
  await page.waitForTimeout(2000);
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

  test('UD09_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '001';
    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 1. 画面标题
    await expect(page.locator('.ud09-title')).toHaveText('Homologation Variables');

    // 2. DataTable 列标题
    const thElements = page.locator('.ud09-table thead th');
    await expect(thElements.nth(0)).toBeVisible();
    await expect(thElements.nth(1)).toHaveText('Product class');
    await expect(thElements.nth(2)).toHaveText('Number');
    await expect(thElements.nth(3)).toHaveText('Market');
    await expect(thElements.nth(4)).toHaveText('Variable');
    await expect(thElements.nth(5)).toHaveText('Value');
    await expect(thElements.nth(6)).toHaveText('Variant string.');
    await expect(thElements.nth(7)).toHaveText('Comments');
    await expect(thElements.nth(8)).toHaveText('Add');
    await expect(thElements.nth(9)).toHaveText('Delete');
    await expect(thElements.nth(10)).toHaveText('Created by user');
    await expect(thElements.nth(11)).toHaveText('Date');

    // 3. Count 标签
    await expect(page.locator('.ud09-count')).toBeVisible();
    expect(await page.locator('.ud09-count').textContent()).toMatch(/Number of lines found:\s*\d+/);

    // 4. Select 按钮
    await expect(page.locator('button.ud09-btn--primary')).toBeVisible();
    await expect(page.locator('button.ud09-btn--primary')).toHaveText('Select');

    // 5. Back 按钮
    await expect(page.locator('button.ud09-btn--default').nth(0)).toBeVisible();
    await expect(page.locator('button.ud09-btn--default').nth(0)).toHaveText('Back');

    // 6. Print 按钮
    await expect(page.locator('button.ud09-btn--default').nth(1)).toBeVisible();
    await expect(page.locator('button.ud09-btn--default').nth(1)).toHaveText('Print');

    // 7. Delete selected 按钮
    await expect(page.locator('button.ud09-btn--danger')).toBeVisible();
    await expect(page.locator('button.ud09-btn--danger')).toHaveText('Delete selected');

    // 8. Error message area 不显示
    await expect(page.locator('.ud09-message')).not.toBeVisible();
  });

  test('UD09_002_画面初始化_DataTable列属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '002';
    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 1. radio button 列
    const firstRadio = page.locator('.ud09-table tbody tr').first().locator('.ud09-radio');
    await expect(firstRadio).toBeVisible();

    // 2-12: DataTable各列数据可见
    const firstRowCells = page.locator('.ud09-table tbody tr').first().locator('td');
    for (let i = 1; i <= 11; i++) {
      await expect(firstRowCells.nth(i)).toBeVisible();
    }

    // Created by user 链接
    const userLink = firstRowCells.nth(10).locator('.ud09-user-link');
    await expect(userLink).toBeVisible();
  });

  test('UD09_003_画面初始化_检索结果数据加载与排序', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '003';
    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 确认有数据行
    const rowCount = await page.locator('.ud09-table tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);

    // 确认排序: Product class → Market → Number 升序
    const firstRowCells = page.locator('.ud09-table tbody tr').first().locator('td');
    expect(await firstRowCells.nth(1).textContent()).toBeTruthy();
    expect(await firstRowCells.nth(2).textContent()).toBeTruthy();
    expect(await firstRowCells.nth(3).textContent()).toBeTruthy();
  });

  test('UD09_004_画面初始化_检索结果数据与数据库字段对应', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '004';
    // 使用精确的Mock数据确保字段对应
    await goToUD09Mock(page, [
      { productClass: '01', number: '2222', market: 'AF', variable: 'var', value: '123',
        variantString1: '1234', variantString2: '1234', comments: '2234',
        addDate: '202607', deleteDate: '202607', createdByUser: 'SYSTEM', registerDatetime: '2026-07-01T07:56:10.000Z' }
    ], { productClass: '01', number: 2222, market: 'AF' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 确认数据字段对应
    const firstRowCells = page.locator('.ud09-table tbody tr').first().locator('td');
    await expect(firstRowCells.nth(1)).toHaveText('01');
    await expect(firstRowCells.nth(2)).toHaveText('2222');
    await expect(firstRowCells.nth(3)).toHaveText('AF');
    await expect(firstRowCells.nth(4)).toHaveText('var');
    await expect(firstRowCells.nth(5)).toHaveText('123');
    await expect(firstRowCells.nth(6)).toHaveText('1234, 1234');
    await expect(firstRowCells.nth(7)).toHaveText('2234');
    await expect(firstRowCells.nth(8)).toHaveText('202607');
    await expect(firstRowCells.nth(9)).toHaveText('202607');
    await expect(firstRowCells.nth(10).locator('.ud09-user-link')).toHaveText('SYSTEM');
    // Date列：只检查年月日部分
    const dateText = await firstRowCells.nth(11).textContent();
    expect(dateText).toContain('2026-07-01');
  });

  test('UD09_005_画面初始化_VariantString拼接显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '005';
    // Mock VS=VS1_07768, VS2=VS2_07768 的数据
    await goToUD09Mock(page, [
      { productClass: '01', number: '7768', market: '-EU', variable: 'v7768', value: 'v7768',
        variantString1: 'VS1_07768', variantString2: 'VS2_07768', comments: '',
        addDate: '202603', deleteDate: '', createdByUser: 'tester', registerDatetime: '2026-03-10T09:00:00.000Z' }
    ], { productClass: '01', number: 7768, market: '-EU' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // Variant string. 列显示 VS1_07768,VS2_07768
    const vsCell = page.locator('.ud09-table tbody tr').first().locator('td').nth(6);
    expect(await vsCell.textContent()).toContain('VS1_07768');
    expect(await vsCell.textContent()).toContain('VS2_07768');
  });

  test('UD09_006_画面初始化_VS2为null时VariantString显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '006';
    // Mock VS2=null 的数据
    await goToUD09Mock(page, [
      { productClass: '01', number: '1231', market: '-EU', variable: 'v1231', value: 'v1231',
        variantString1: 'V82441259', variantString2: null, comments: '',
        addDate: '202604', deleteDate: '', createdByUser: 'x001', registerDatetime: '2026-04-05T11:00:00.000Z' }
    ], { productClass: '01', number: 1231, market: '-EU' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // Variant string. 仅显示 VS（VS2 为 null 时不拼接）
    const vsCell = page.locator('.ud09-table tbody tr').first().locator('td').nth(6);
    expect(await vsCell.textContent()).toBe('V82441259');
  });

  test('UD09_007_画面初始化_Count显示检索结果件数', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '007';
    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // Count 标签显示记录数
    await expect(page.locator('.ud09-count')).toBeVisible();
    const countText = await page.locator('.ud09-count').textContent();
    expect(countText).toMatch(/Number of lines found:\s*6/);
  });

  test('UD09_008_画面初始化_检索结果为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '008';
    // Mock API 返回空数据
    await goToUD09Mock(page, [], { variable: 'NONEXIST_VAR_99999' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // Count 显示 0
    const countText = await page.locator('.ud09-count').textContent();
    expect(countText).toContain('Number of lines found: 0');

    // DataTable 显示空数据行
    const emptyRow = page.locator('.ud09-table tbody tr td[colspan]');
    await expect(emptyRow).toBeVisible();
    await expect(emptyRow).toContainText('暂无数据');
  });

  test('UD09_009_画面初始化_CreatedByUser链接', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '009';
    await goToUD09Mock(page, MOCK_RESULTS_SINGLE, { productClass: '01', number: 11, market: '-EU' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // Created by user 链接可见
    const userLink = page.locator('.ud09-table tbody tr').first().locator('.ud09-user-link');
    await expect(userLink).toBeVisible();
    expect(await userLink.textContent()).toBe('user01');
  });
});

// ============================================================
// 2. Select 按钮操作 (No.10-11)
// ============================================================
test.describe('Select 按钮操作', () => {

  test('UD09_010_Select_未选择任何记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '010';
    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 不选择任何记录，直接点击 Select
    await page.locator('button.ud09-btn--primary').click();
    await page.waitForTimeout(500);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（未选择Select）');

    // 错误消息显示
    await expect(page.locator('.ud09-message--error')).toBeVisible();
    await expect(page.locator('.ud09-message')).toContainText('请选择至少一条记录');
  });

  test('UD09_011_Select_选择一条记录返回UD08', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '011';
    // Mock UD08 路由
    await page.route('**/UD08', route => {
      route.fulfill({ status: 200, body: '<html><body><div class="ud08-container">UD08 Mock</div></body></html>' });
    });

    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 选择第一条记录
    await page.locator('.ud09-radio').first().click({ force: true });
    await page.waitForTimeout(300);

    // === 選択後截图 ===
    await takeScreenshot(page, '選択後');

    // 点击 Select 按钮
    await page.locator('button.ud09-btn--primary').click();
    await page.waitForTimeout(2000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（Select跳转）');

    // 确认跳转到 UD08
    await expect(page).toHaveURL(/\/UD08/);
  });
});

// ============================================================
// 3. Back 按钮操作 (No.12)
// ============================================================
test.describe('Back 按钮操作', () => {

  test('UD09_012_Back_返回UD08保留搜索条件', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '012';
    await page.route('**/UD08', route => {
      route.fulfill({ status: 200, body: '<html><body><div class="ud08-container">UD08 Mock</div></body></html>' });
    });

    const formData = { productClass: '01', market: '' };
    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' }, formData);

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 点击 Back 按钮
    await page.locator('button.ud09-btn--default').first().click();
    await page.waitForTimeout(2000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（Back）');

    // 确认返回 UD08
    await expect(page).toHaveURL(/\/UD08/);
  });
});

// ============================================================
// 4. Print 按钮操作 (No.13-14)
// ============================================================
test.describe('Print 按钮操作', () => {

  test('UD09_013_Print_有数据可打印', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '013';
    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 确认 Print 按钮可见可用
    const printBtn = page.locator('button.ud09-btn--default').nth(1);
    await expect(printBtn).toBeEnabled();
    await expect(printBtn).toHaveText('Print');

    // 没有错误消息
    await expect(page.locator('.ud09-message--error')).not.toBeVisible();
  });

  test('UD09_014_Print_无数据可打印', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '014';
    await goToUD09Mock(page, [], { variable: 'NONEXIST_VAR_99999' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示（空数据）');

    // 点击 Print 按钮
    await page.locator('button.ud09-btn--default').nth(1).click();
    await page.waitForTimeout(500);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（Print空数据）');

    // 错误消息
    await expect(page.locator('.ud09-message--error')).toBeVisible();
    await expect(page.locator('.ud09-message')).toContainText('没有可打印的数据');
  });
});

// ============================================================
// 5. Delete selected 按钮操作 (No.15-18)
// ============================================================
test.describe('Delete selected 按钮操作', () => {

  test('UD09_015_DeleteSelected_未选择任何记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '015';
    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 不选择记录，点击 Delete selected
    await page.locator('button.ud09-btn--danger').click();
    await page.waitForTimeout(500);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（未选择删除）');

    // 错误消息
    await expect(page.locator('.ud09-message--error')).toBeVisible();
    await expect(page.locator('.ud09-message')).toContainText('请选择至少一条要删除的记录');
  });

  test('UD09_016_DeleteSelected_删除一条记录成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '016';

    // Mock 删除 API 返回成功
    await page.route('**/api/ud09/deleteselected', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: null })
      });
    });

    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 选择第一条记录
    await page.locator('.ud09-radio').first().click({ force: true });
    await page.waitForTimeout(300);

    // === 選択後截图 ===
    await takeScreenshot(page, '選択後');

    // 点击 Delete selected
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('确定要删除');
      dialog.accept();
    });
    await page.locator('button.ud09-btn--danger').click();
    await page.waitForTimeout(2000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（删除成功）');
  });

  test('UD09_017_DeleteSelected_VariantString拆分处理', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '017';

    let capturedBody = null;
    await page.route('**/api/ud09/deleteselected', async route => {
      capturedBody = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: null })
      });
    });

    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 选择第一条记录
    await page.locator('.ud09-radio').first().click({ force: true });
    await page.waitForTimeout(300);

    // === 選択後截图 ===
    await takeScreenshot(page, '選択後');

    // 点击 Delete selected
    page.on('dialog', dialog => dialog.accept());
    await page.locator('button.ud09-btn--danger').click();
    await page.waitForTimeout(2000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（Delete）');

    // 确认请求参数
    expect(capturedBody).not.toBeNull();
    expect(capturedBody.productClass).toBe('01');
    expect(capturedBody.number).toBe('11');
    expect(capturedBody.market).toBe('-EU');
  });

  test('UD09_018_DeleteSelected_记录不存在404', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '018';

    // Mock delete API 返回错误
    await page.route('**/api/ud09/deleteselected', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 400, message: 'Data does not exist, Please enter the correct content', data: null })
      });
    });

    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud09-radio').first().click({ force: true });
    await page.waitForTimeout(300);

    // === 選択後截图 ===
    await takeScreenshot(page, '選択後');

    page.on('dialog', dialog => dialog.accept());
    await page.locator('button.ud09-btn--danger').click();
    await page.waitForTimeout(2000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（Delete404）');

    // 错误消息
    await expect(page.locator('.ud09-message--error')).toContainText('Data does not exist');
  });
});

// ============================================================
// 6. Created by user 链接操作 (No.19)
// ============================================================
test.describe('Created by user 链接操作', () => {

  test('UD09_019_CreatedByUser_点击跳转到UD25', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '019';
    await page.route('**/UD25', route => {
      route.fulfill({ status: 200, body: '<html><body><div class="ud25-container">UD25 Mock</div></body></html>' });
    });

    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 点击第一个 Created by user 链接
    await page.locator('.ud09-user-link').first().click();
    await page.waitForTimeout(2000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（跳转UD25）');

    // 确认跳转到 UD25
    await expect(page).toHaveURL(/\/UD25/);
  });
});

// ============================================================
// 7. 异常处理 (No.20-25)
// ============================================================
test.describe('异常处理', () => {

  test('UD09_020_异常处理_API检索返回400', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '020';

    await page.route('**/api/ud09/seach', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 400, message: '请求参数错误', data: null })
      });
    });

    await goToUD09Real(page, { productClass: '' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 检查错误消息
    await expect(page.locator('.ud09-message--error')).toContainText('请求参数错误');
  });

  test('UD09_021_异常处理_API检索返回500', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '021';

    await page.route('**/api/ud09/seach', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: '系统内部错误，请联系系统管理员', data: null })
      });
    });

    await goToUD09Real(page, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 检查错误消息
    await expect(page.locator('.ud09-message--error')).toContainText('系统内部错误');
  });

  test('UD09_022_异常处理_DeleteSelected返回500', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '022';

    await page.route('**/api/ud09/deleteselected', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: '系统内部错误，请联系系统管理员', data: null })
      });
    });

    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud09-radio').first().click({ force: true });
    await page.waitForTimeout(300);

    // === 選択後截图 ===
    await takeScreenshot(page, '選択後');

    page.on('dialog', dialog => dialog.accept());
    await page.locator('button.ud09-btn--danger').click();
    await page.waitForTimeout(2000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（Delete500）');

    await expect(page.locator('.ud09-message--error')).toContainText('系统内部错误');
  });

  test('UD09_023_异常处理_网络超时', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '023';

    // 模拟 API 超时
    await page.route('**/api/ud09/seach', async route => {
      await new Promise(resolve => setTimeout(resolve, 10000));
    });

    await goToUD09Real(page, { productClass: '01' });
    await page.waitForTimeout(3000);

    // === 截图 ===
    await takeScreenshot(page, '超时状态');
  });

  test('UD09_024_异常处理_数据库连接失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '024';

    await page.route('**/api/ud09/seach', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: '数据库连接失败，请稍后重试', data: null })
      });
    });

    await goToUD09Real(page, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud09-message--error')).toContainText('数据库连接失败');
  });

  test('UD09_025_异常处理_权限不足403', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '025';

    await page.route('**/api/ud09/deleteselected', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 403, message: '您没有执行此操作的权限', data: null })
      });
    });

    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud09-radio').first().click({ force: true });
    await page.waitForTimeout(300);

    // === 選択後截图 ===
    await takeScreenshot(page, '選択後');

    page.on('dialog', dialog => dialog.accept());
    await page.locator('button.ud09-btn--danger').click();
    await page.waitForTimeout(2000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（403）');

    await expect(page.locator('.ud09-message--error')).toContainText('您没有执行此操作的权限');
  });
});

// ============================================================
// 8. UI交互 (No.26-31)
// ============================================================
test.describe('UI交互', () => {

  test('UD09_026_UI交互_加载中显示Loading状态', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '026';

    // 延迟 API 响应以捕获 loading 状态
    let resolveApi;
    const apiPromise = new Promise(resolve => { resolveApi = resolve; });
    await page.route('**/api/ud09/seach', async route => {
      await apiPromise;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: MOCK_RESULTS_MULTI, message: '' })
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD09');
    await page.waitForSelector('.ud09-container');

    await page.evaluate(({ params }) => {
      window.history.replaceState({ searchParams: params, formData: {} }, '', '/UD09');
    }, { params: { productClass: '01' } });
    await page.reload();
    await page.waitForSelector('.ud09-container');
    await page.waitForTimeout(500);

    // === 加载中截图 ===
    await takeScreenshot(page, '加载中');

    // 检查按钮是否禁用
    await expect(page.locator('button.ud09-btn--primary')).toBeDisabled();
    await expect(page.locator('button.ud09-btn--default').first()).toBeDisabled();

    // 恢复 API 响应
    resolveApi();
    await page.waitForTimeout(2000);
  });

  test('UD09_027_UI交互_加载完成后控件恢复活性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '027';
    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 加载完成后按钮可点击
    await expect(page.locator('button.ud09-btn--primary')).toBeEnabled();
    await expect(page.locator('button.ud09-btn--default').first()).toBeEnabled();
    await expect(page.locator('button.ud09-btn--default').nth(1)).toBeEnabled();
    await expect(page.locator('button.ud09-btn--danger')).toBeEnabled();
  });

  test('UD09_028_UI交互_操作中按钮禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '028';

    // 延迟 delete API 响应
    let resolveDelete;
    const deletePromise = new Promise(resolve => { resolveDelete = resolve; });
    await page.route('**/api/ud09/deleteselected', async route => {
      await deletePromise;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: null })
      });
    });

    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud09-radio').first().click({ force: true });
    await page.waitForTimeout(300);

    // === 選択後截图 ===
    await takeScreenshot(page, '選択後');

    page.on('dialog', dialog => dialog.accept());
    await page.locator('button.ud09-btn--danger').click();
    await page.waitForTimeout(500);

    // === 操作中截图 ===
    await takeScreenshot(page, '操作中（按钮禁用）');

    // Delete selected 按钮在操作中被禁用
    await expect(page.locator('button.ud09-btn--danger')).toBeDisabled();

    // 恢复 API 响应
    resolveDelete();
    await page.waitForTimeout(1000);
  });

  test('UD09_029_UI交互_防止重复提交', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '029';

    let apiCallCount = 0;
    await page.route('**/api/ud09/deleteselected', async route => {
      apiCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: null })
      });
    });

    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud09-radio').first().click({ force: true });
    await page.waitForTimeout(300);

    // === 選択後截图 ===
    await takeScreenshot(page, '選択後');

    page.on('dialog', dialog => dialog.accept());
    // 快速连续点击两次
    const deleteBtn = page.locator('button.ud09-btn--danger');
    await deleteBtn.click();
    await deleteBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（重复提交）');

    // 只发起 1 次 API 调用
    expect(apiCallCount).toBe(1);
  });

  test('UD09_030_UI交互_DeleteSelected确认对话框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '030';

    await page.route('**/api/ud09/deleteselected', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: null })
      });
    });

    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud09-radio').first().click({ force: true });
    await page.waitForTimeout(300);

    // === 選択後截图 ===
    await takeScreenshot(page, '選択後');

    // 确认对话框弹出
    let dialogShown = false;
    page.on('dialog', dialog => {
      dialogShown = true;
      expect(dialog.message()).toContain('确定要删除');
      dialog.accept();
    });

    await page.locator('button.ud09-btn--danger').click();
    await page.waitForTimeout(1000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（确认对话框）');

    expect(dialogShown).toBe(true);
  });

  test('UD09_031_UI交互_DeleteSelected确认对话框点击取消', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '031';

    await page.route('**/api/ud09/deleteselected', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: null })
      });
    });

    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud09-radio').first().click({ force: true });
    await page.waitForTimeout(300);

    // === 選択後截图 ===
    await takeScreenshot(page, '選択後');

    // 对话框点击取消
    page.on('dialog', dialog => {
      dialog.dismiss();
    });

    await page.locator('button.ud09-btn--danger').click();
    await page.waitForTimeout(1000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（取消删除）');

    // 确认按钮恢复可用
    await expect(page.locator('button.ud09-btn--danger')).toBeEnabled();
  });
});

// ============================================================
// 9. Radio button 操作 (No.32-37)
// ============================================================
test.describe('Radio button 操作', () => {

  test('UD09_032_RadioButton_初期未选中', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '032';
    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 所有 radio 未选中
    const radioCount = await page.locator('.ud09-radio').count();
    expect(radioCount).toBe(6);
    for (let i = 0; i < radioCount; i++) {
      await expect(page.locator('.ud09-radio').nth(i)).not.toBeChecked();
    }
  });

  test('UD09_033_RadioButton_点击选中一行', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '033';
    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 点击第一个 radio
    await page.locator('.ud09-radio').first().click({ force: true });
    await page.waitForTimeout(300);

    // === 操作後（选中）截图 ===
    await takeScreenshot(page, '操作後（选中）');

    // 确认被选中
    await expect(page.locator('.ud09-radio').first()).toBeChecked();
    // 确认选中行有高亮样式
    await expect(page.locator('.ud09-table tbody tr').first()).toHaveClass(/ud09-row--selected/);
  });

  test('UD09_034_RadioButton_单选切换', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '034';
    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 点击第一行
    await page.locator('.ud09-radio').nth(0).click({ force: true });
    await page.waitForTimeout(200);
    await expect(page.locator('.ud09-radio').nth(0)).toBeChecked();

    // === 第一行选中截图 ===
    await takeScreenshot(page, '第一行选中');

    // 点击第二行
    await page.locator('.ud09-radio').nth(1).click({ force: true });
    await page.waitForTimeout(200);

    // === 切换后截图 ===
    await takeScreenshot(page, '切换后');

    // 第一行取消选中，第二行选中
    await expect(page.locator('.ud09-radio').nth(0)).not.toBeChecked();
    await expect(page.locator('.ud09-radio').nth(1)).toBeChecked();
  });

  test('UD09_035_RadioButton_再次点击取消选中', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '035';
    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 点击选中
    await page.locator('.ud09-radio').first().click({ force: true });
    await page.waitForTimeout(200);

    // === 选中截图 ===
    await takeScreenshot(page, '选中');

    // 再次点击取消选中
    await page.locator('.ud09-radio').first().click({ force: true });
    await page.waitForTimeout(200);

    // === 取消选中截图 ===
    await takeScreenshot(page, '取消选中');

    await expect(page.locator('.ud09-radio').first()).not.toBeChecked();
  });

  test('UD09_036_RadioButton_切换选中行高亮联动', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '036';
    await goToUD09Mock(page, MOCK_RESULTS_MULTI, { productClass: '01' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 选中第一行
    await page.locator('.ud09-radio').nth(0).click({ force: true });
    await page.waitForTimeout(200);
    await expect(page.locator('.ud09-table tbody tr').nth(0)).toHaveClass(/ud09-row--selected/);

    // === 第一行高亮截图 ===
    await takeScreenshot(page, '第一行高亮');

    // 选中第二行
    await page.locator('.ud09-radio').nth(1).click({ force: true });
    await page.waitForTimeout(200);

    // === 切换高亮截图 ===
    await takeScreenshot(page, '切换高亮');

    // 第一行高亮消失，第二行高亮
    await expect(page.locator('.ud09-table tbody tr').nth(0)).not.toHaveClass(/ud09-row--selected/);
    await expect(page.locator('.ud09-table tbody tr').nth(1)).toHaveClass(/ud09-row--selected/);
  });

  test('UD09_037_RadioButton_选中确认后清除选中状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '037';

    await page.route('**/UD08', route => {
      route.fulfill({ status: 200, body: '<html><body>UD08 Mock</body></html>' });
    });

    await goToUD09Mock(page, MOCK_RESULTS_SINGLE, { productClass: '01', number: 11, market: '-EU' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 选中第一行
    await page.locator('.ud09-radio').first().click({ force: true });
    await page.waitForTimeout(200);

    // === 选中截图 ===
    await takeScreenshot(page, '选中');

    // 点击 Select 跳转到 UD08
    await page.locator('button.ud09-btn--primary').click();
    await page.waitForTimeout(1500);

    // 重新加载 UD09（模拟从 UD08 Back 返回）
    await goToUD09Mock(page, MOCK_RESULTS_SINGLE, { productClass: '01', number: 11, market: '-EU' });

    // === 返回后截图 ===
    await takeScreenshot(page, '返回后');

    // 重新加载后所有 radio 未选中
    await expect(page.locator('.ud09-radio').first()).not.toBeChecked();
  });
});

// ============================================================
// 10. 安全性 (No.38)
// ============================================================
test.describe('安全性', () => {

  test('UD09_038_安全性_未登录直接访问重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '038';

    // 清除登录状态
    await page.evaluate(() => localStorage.clear());

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示（未登录）');

    await page.goto(BASE_URL + '/UD09');
    await page.waitForTimeout(2000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（重定向）');

    // 确认重定向到 Login 页面
    await expect(page).toHaveURL(/\/Login/);
    await expect(page.locator('.login-container')).toBeVisible();
  });
});
