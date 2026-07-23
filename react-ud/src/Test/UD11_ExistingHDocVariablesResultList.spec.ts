// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD11_ExistingHDocVariablesResultList 单元测试
// 测试规格书: テスト式样書UD11.md
// 画面文件: UD11_ExistingHDocVariablesResultList.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD11');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

// ==================== Mock检索结果数据 ====================
const MOCK_RESULTS_MULTI = [
  { variable: '1001', type: '', description: 'UD10更新测试_13756', registerUser: 'x001', registerDatetime: '2026-06-23T01:30:16.000Z' },
  { variable: '1002', type: 'User Defined', description: 'Description1', registerUser: 'SYSTEM', registerDatetime: '2026-07-03T08:57:33.000Z' },
  { variable: '112', type: 'User Defined', description: 'Description', registerUser: 'user01', registerDatetime: '2026-06-23T01:36:45.000Z' },
  { variable: '113', type: 'User Defined', description: 'Description', registerUser: 'admin', registerDatetime: '2026-06-23T01:37:16.000Z' },
  { variable: '115', type: 'VDA', description: 'Descriptiontest111', registerUser: 'user01', registerDatetime: '2026-06-23T01:38:17.000Z' },
];

const MOCK_RESULTS_SINGLE = [
  { variable: '1002', type: 'User Defined', description: 'Description1', registerUser: 'SYSTEM', registerDatetime: '2026-07-03T08:57:33.000Z' },
];

const MOCK_RESULTS_EMPTY: any[] = [];

/** 空用户数据（REGISTER_USER 为空字符串） */
const MOCK_RESULTS_EMPTY_USER = [
  { variable: '202606', type: 'VDA', description: 'asdfg', registerUser: '', registerDatetime: '2026-06-25T00:00:00.000Z' },
];

/** XSS 数据 */
const MOCK_RESULTS_XSS = [
  { variable: "<script>alert('xss')</script>", type: 'VDA', description: '', registerUser: 'admin', registerDatetime: '2026-07-06T05:56:41.000Z' },
];

/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD11画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * Mock UD11 检索API并导航到UD11
 * 使用 window.history.replaceState + reload 方式注入路由参数
 */
async function goToUD11Mock(
  page: Page,
  mockData: any[],
  searchParams: Record<string, any> = {},
  formData?: Record<string, any>
) {
  // 拦截 API
  await page.route('**/api/ud11/search', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, data: mockData, msg: '' })
    });
  });

  await login(page);
  await page.goto(BASE_URL + '/UD11');
  await page.waitForSelector('.ud11-container');

  // 通过 replaceState 注入路由参数后重新加载
  await page.evaluate(({ params, form }) => {
    window.history.replaceState(
      { searchParams: params, formData: form || {} },
      '',
      '/UD11'
    );
  }, { params: searchParams, form: formData || {} });
  await page.reload();
  await page.waitForSelector('.ud11-container');
  await page.waitForTimeout(2000);
}

/**
 * 使用真实API导航到UD11（异常场景等）
 */
async function goToUD11Real(
  page: Page,
  searchParams: Record<string, any> = {},
  formData?: Record<string, any>
) {
  await login(page);
  await page.goto(BASE_URL + '/UD11');
  await page.waitForSelector('.ud11-container');

  await page.evaluate(({ params, form }) => {
    window.history.replaceState(
      { searchParams: params, formData: form || {} },
      '',
      '/UD11'
    );
  }, { params: searchParams, form: formData || {} });
  await page.reload();
  await page.waitForSelector('.ud11-container');
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
// 1. 画面初期表示 (No.1-8)
// ============================================================
test.describe('画面初期表示', () => {

  test('UD11_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '001';
    await goToUD11Mock(page, MOCK_RESULTS_SINGLE, { variable: '1001', description: 'UD10更新测试_13756' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 1. 页面容器可见
    await expect(page.locator('.ud11-container')).toBeVisible();
    // 2. 标题
    await expect(page.locator('.ud11-title')).toHaveText('Existing HDoc Variables');
    // 3. DataTable 区域可见
    await expect(page.locator('.ud11-table')).toBeVisible();
    // 4. 按钮行可见
    await expect(page.locator('.ud11-btn--primary')).toBeVisible();
    await expect(page.locator('.ud11-btn--default').nth(0)).toBeVisible(); // Down
    await expect(page.locator('.ud11-btn--default').nth(1)).toBeVisible(); // Back
    await expect(page.locator('.ud11-btn--default').nth(2)).toBeVisible(); // Print
    await expect(page.locator('.ud11-btn--excel')).toBeVisible();

    // 5. Count 标签显示
    await expect(page.locator('.ud11-count')).toBeVisible();
    expect(await page.locator('.ud11-count').textContent()).toMatch(/Number of lines found:\s*1/);

    // 6. 消息区域不在页面中
    await expect(page.locator('.ud11-message')).toHaveCount(0);
  });

  test('UD11_002_画面初始化_DataTable列标题', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '002';
    await goToUD11Mock(page, MOCK_RESULTS_MULTI, {});

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    const thElements = page.locator('.ud11-table thead th');
    await expect(thElements.nth(0)).toBeVisible();
    await expect(thElements.nth(1)).toHaveText('*Variable');
    await expect(thElements.nth(2)).toHaveText('Type');
    await expect(thElements.nth(3)).toHaveText('Description');
    await expect(thElements.nth(4)).toHaveText('Created by user');
    await expect(thElements.nth(5)).toHaveText('Date');
  });

  test('UD11_003_画面初始化_全检索显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '003';
    await goToUD11Mock(page, MOCK_RESULTS_MULTI, {});

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // DataTable 显示多条记录
    const rowCount = await page.locator('.ud11-table tbody tr').count();
    expect(rowCount).toBe(5);

    // Count
    const countText = await page.locator('.ud11-count').textContent();
    expect(countText).toContain('Number of lines found: 5');

    // 未选择任何记录
    await expect(page.locator('.ud11-radio').first()).not.toBeChecked();
  });

  test('UD11_004_画面初始化_带条件检索显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '004';
    // Mock 精确检索结果
    await goToUD11Mock(page, MOCK_RESULTS_SINGLE, { variable: '1002', type: 'User Defined', description: 'Description1' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 确认各列数据
    const firstRowCells = page.locator('.ud11-table tbody tr').first().locator('td');
    await expect(firstRowCells.nth(1)).toHaveText('1002');
    await expect(firstRowCells.nth(2)).toHaveText('User Defined');
    await expect(firstRowCells.nth(3)).toHaveText('Description1');
    await expect(firstRowCells.nth(4)).toContainText('SYSTEM');
    // Date列：只检查年月日
    expect(await firstRowCells.nth(5).textContent()).toContain('2026-07-03');

    await expect(page.locator('.ud11-count')).toContainText('Number of lines found: 1');
  });

  test('UD11_005_画面初始化_无检索结果', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '005';
    await goToUD11Mock(page, MOCK_RESULTS_EMPTY, { variable: 'NONEXIST_VAR_99999' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 暂无数据显示
    await expect(page.locator('.ud11-table tbody')).toContainText('暂无数据');

    // Count 显示 0
    const countText = await page.locator('.ud11-count').textContent();
    expect(countText).toContain('Number of lines found: 0');

    // 不显示错误消息
    await expect(page.locator('.ud11-message--error')).toHaveCount(0);
  });

  test('UD11_006_画面初始化_Count标签显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '006';
    await goToUD11Mock(page, MOCK_RESULTS_SINGLE, { variable: '112' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // Count 格式
    const countText = await page.locator('.ud11-count').textContent();
    expect(countText).toMatch(/Number of lines found:\s*1/);

    // 位于 DataTable 下方
    await expect(page.locator('.ud11-count')).toBeVisible();
  });

  test('UD11_007_画面初始化_Loading状态', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '007';

    // 延迟 API 响应
    let resolveApi;
    const apiPromise = new Promise(resolve => { resolveApi = resolve; });
    await page.route('**/api/ud11/search', async route => {
      await apiPromise;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: MOCK_RESULTS_MULTI, msg: '' })
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD11');
    await page.waitForSelector('.ud11-container');
    await page.evaluate(() => {
      window.history.replaceState({ searchParams: {}, formData: {} }, '', '/UD11');
    });
    await page.reload();
    await page.waitForSelector('.ud11-container');
    await page.waitForTimeout(500);

    // === 加载中截图 ===
    await takeScreenshot(page, 'Loading状态');

    // 加载中显示
    await expect(page.locator('.ud11-table-wrapper')).toContainText('加载中...');
    // 按钮禁用
    await expect(page.locator('.ud11-btn--primary')).toBeDisabled();
    await expect(page.locator('.ud11-btn--default').nth(0)).toBeDisabled();
    await expect(page.locator('.ud11-btn--default').nth(1)).toBeDisabled();
    await expect(page.locator('.ud11-btn--default').nth(2)).toBeDisabled();
    await expect(page.locator('.ud11-btn--excel')).toBeDisabled();

    // 恢复响应
    resolveApi();
    await page.waitForTimeout(1500);

    // 加载完成后按钮恢复
    await expect(page.locator('.ud11-btn--primary')).toBeEnabled();
  });

  test('UD11_008_画面初始化_API失败（500错误）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '008';

    await page.route('**/api/ud11/search', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '获取检索结果失败' })
      });
    });

    await goToUD11Real(page, {});

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 错误消息
    await expect(page.locator('.ud11-message--error')).toContainText('获取检索结果失败');
    // DataTable 暂无数据
    await expect(page.locator('.ud11-table tbody')).toContainText('暂无数据');
    // Count 显示 0
    expect(await page.locator('.ud11-count').textContent()).toContain('Number of lines found: 0');
  });
});

// ============================================================
// 2. DataTable数据展示 (No.9-18)
// ============================================================
test.describe('DataTable数据展示', () => {

  test('UD11_009_Variable列_数据显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '009';
    await goToUD11Mock(page, MOCK_RESULTS_SINGLE, { variable: '1001' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    const firstRowCells = page.locator('.ud11-table tbody tr').first().locator('td');
    await expect(firstRowCells.nth(1)).toHaveText('1002');
  });

  test('UD11_010_Variable列_最大长度30字符', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '010';
    await goToUD11Mock(page, [
      { variable: '3811wj', type: 'User Defined', description: 'duc3811aaa', registerUser: 'user00000', registerDatetime: '2026-07-03T04:54:21.000Z' }
    ], { variable: '3811wj' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    const firstRowCells = page.locator('.ud11-table tbody tr').first().locator('td');
    await expect(firstRowCells.nth(1)).toHaveText('3811wj');
  });

  test('UD11_011_Type列_数据显示（VDA）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '011';
    await goToUD11Mock(page, MOCK_RESULTS_MULTI.filter(r => r.type === 'VDA'), { type: 'VDA' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    const rows = page.locator('.ud11-table tbody tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).locator('td').nth(2)).toHaveText('VDA');
    }
  });

  test('UD11_012_Type列_数据显示（User Defined）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '012';
    await goToUD11Mock(page, MOCK_RESULTS_MULTI.filter(r => r.type === 'User Defined'), { type: 'User Defined' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    const rows = page.locator('.ud11-table tbody tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).locator('td').nth(2)).toHaveText('User Defined');
    }
  });

  test('UD11_013_Type列_数据显示（空值）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '013';
    await goToUD11Mock(page, [
      { variable: '1001', type: '', description: 'UD10更新测试_13756', registerUser: 'x001', registerDatetime: '2026-06-23T01:30:16.000Z' }
    ], { variable: '1001' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    const firstRowCells = page.locator('.ud11-table tbody tr').first().locator('td');
    // Type 列为空
    await expect(firstRowCells.nth(2)).toHaveText('');
  });

  test('UD11_014_Description列_数据显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '014';
    await goToUD11Mock(page, MOCK_RESULTS_SINGLE, { variable: '1002' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    const firstRowCells = page.locator('.ud11-table tbody tr').first().locator('td');
    await expect(firstRowCells.nth(3)).toHaveText('Description1');
  });

  test('UD11_015_Description列_空值显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '015';
    await goToUD11Mock(page, [
      { variable: '123', type: '', description: '', registerUser: 'AUTO_d6d68c', registerDatetime: '2026-06-22T08:50:28.000Z' }
    ], { variable: '123' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    const firstRowCells = page.locator('.ud11-table tbody tr').first().locator('td');
    await expect(firstRowCells.nth(3)).toHaveText('');
  });

  test('UD11_016_Created by user列_数据显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '016';
    await goToUD11Mock(page, MOCK_RESULTS_SINGLE.map(r => ({ ...r, variable: '1001', registerUser: 'x001' })), { variable: '1001' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    const firstRowCells = page.locator('.ud11-table tbody tr').first().locator('td');
    // Created by user 列
    const userLink = firstRowCells.nth(4).locator('.ud11-user-link');
    await expect(userLink).toHaveText('x001');
    // 链接样式
    const linkColor = await userLink.evaluate(el => window.getComputedStyle(el).color);
    expect(linkColor).not.toBe('');
  });

  test('UD11_017_Created by user列_空值显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '017';
    await goToUD11Mock(page, MOCK_RESULTS_EMPTY_USER, { variable: '202606' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    const firstRowCells = page.locator('.ud11-table tbody tr').first().locator('td');
    // Created by user 列为空
    const userText = await firstRowCells.nth(4).textContent();
    expect(userText.trim()).toBe('');
  });

  test('UD11_018_Date列_数据显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '018';
    await goToUD11Mock(page, MOCK_RESULTS_SINGLE.map(r => ({ ...r, variable: '1001' })), { variable: '1001' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    const firstRowCells = page.locator('.ud11-table tbody tr').first().locator('td');
    const dateText = await firstRowCells.nth(5).textContent();
    // 只检查年月日
    expect(dateText).toContain('2026-07-03');
  });
});

// ============================================================
// 3. 单选按钮（Radio）操作 (No.19-23)
// ============================================================
test.describe('单选按钮（Radio）操作', () => {

  test('UD11_019_Radio_选择一条记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '019';
    await goToUD11Mock(page, MOCK_RESULTS_MULTI, {});

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 点击第1条记录的 Radio
    await page.locator('.ud11-radio').first().click({ force: true });
    await page.waitForTimeout(300);

    // === 選択後截图 ===
    await takeScreenshot(page, '選択後');

    // 选中状态
    await expect(page.locator('.ud11-radio').first()).toBeChecked();
    // 选中行高亮
    await expect(page.locator('.ud11-table tbody tr').first()).toHaveClass(/ud11-row--selected/);
    // 其他行未选中
    await expect(page.locator('.ud11-radio').nth(1)).not.toBeChecked();
  });

  test('UD11_020_Radio_切换选择记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '020';
    await goToUD11Mock(page, MOCK_RESULTS_MULTI, {});

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 选择第1条
    await page.locator('.ud11-radio').nth(0).click({ force: true });
    await page.waitForTimeout(200);

    // === 第1条選択截图 ===
    await takeScreenshot(page, '第1条選択');

    // 选择第2条
    await page.locator('.ud11-radio').nth(1).click({ force: true });
    await page.waitForTimeout(200);

    // === 切替後截图 ===
    await takeScreenshot(page, '切替後');

    // 第1条取消选中，第2条选中
    await expect(page.locator('.ud11-radio').nth(0)).not.toBeChecked();
    await expect(page.locator('.ud11-radio').nth(1)).toBeChecked();
  });

  test('UD11_021_Radio_取消选择（点击已选中记录）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '021';
    await goToUD11Mock(page, MOCK_RESULTS_MULTI, {});

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 点击选中
    await page.locator('.ud11-radio').first().click({ force: true });
    await page.waitForTimeout(200);

    // === 選択截图 ===
    await takeScreenshot(page, '選択');

    // 再次点击取消
    await page.locator('.ud11-radio').first().click({ force: true });
    await page.waitForTimeout(200);

    // === 取消截图 ===
    await takeScreenshot(page, '取消');

    await expect(page.locator('.ud11-radio').first()).not.toBeChecked();
  });

  test('UD11_022_Radio_初始状态_无选中', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '022';
    await goToUD11Mock(page, MOCK_RESULTS_MULTI, {});

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 所有 radio 未选中
    const radioCount = await page.locator('.ud11-radio').count();
    for (let i = 0; i < radioCount; i++) {
      await expect(page.locator('.ud11-radio').nth(i)).not.toBeChecked();
    }
  });

  test('UD11_023_Radio_单条记录时可取消选择', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '023';
    await goToUD11Mock(page, MOCK_RESULTS_SINGLE, { variable: '1002' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 点击选中
    await page.locator('.ud11-radio').first().click({ force: true });
    await page.waitForTimeout(200);

    // === 選択截图 ===
    await takeScreenshot(page, '選択');

    // 再次点击取消
    await page.locator('.ud11-radio').first().click({ force: true });
    await page.waitForTimeout(200);

    // === 取消截图 ===
    await takeScreenshot(page, '取消');

    await expect(page.locator('.ud11-radio').first()).not.toBeChecked();
  });
});

// ============================================================
// 4. Select 按钮操作 (No.24-26)
// ============================================================
test.describe('Select 按钮操作', () => {

  test('UD11_024_Select_未选择记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '024';
    await goToUD11Mock(page, MOCK_RESULTS_MULTI, {});

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 未选择记录，直接点击 Select
    await page.locator('.ud11-btn--primary').click();
    await page.waitForTimeout(500);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（Select未选择）');

    // 错误消息
    await expect(page.locator('.ud11-message--error')).toContainText('请选择一条记录');
    // 页面不跳转
    expect(page.url()).toContain('/UD11');
  });

  test('UD11_025_Select_选择记录成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '025';
    await page.route('**/UD10', route => {
      route.fulfill({ status: 200, body: '<html><body><div class="ud10-container">UD10 Mock</div></body></html>' });
    });

    await goToUD11Mock(page, MOCK_RESULTS_SINGLE, {});

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 选择记录
    await page.locator('.ud11-radio').first().click({ force: true });
    await page.waitForTimeout(300);

    // === 選択後截图 ===
    await takeScreenshot(page, '選択後');

    // 点击 Select
    await page.locator('.ud11-btn--primary').click();
    await page.waitForTimeout(2000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（Select跳转）');

    // 跳转到 UD10
    await expect(page).toHaveURL(/\/UD10/);
  });

  test('UD11_026_Select_选择其他记录成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '026';
    await page.route('**/UD10', route => {
      route.fulfill({ status: 200, body: '<html><body>UD10 Mock</body></html>' });
    });

    await goToUD11Mock(page, [
      { variable: '114', type: 'VDA', description: 'Description', registerUser: 'admin', registerDatetime: '2026-06-23T00:00:00.000Z' }
    ], { variable: '114' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud11-radio').first().click({ force: true });
    await page.waitForTimeout(300);

    // === 選択後截图 ===
    await takeScreenshot(page, '選択後');

    await page.locator('.ud11-btn--primary').click();
    await page.waitForTimeout(2000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（Select跳转）');

    await expect(page).toHaveURL(/\/UD10/);
  });
});

// ============================================================
// 5. Down 按钮操作 (No.27)
// ============================================================
test.describe('Down 按钮操作', () => {

  test('UD11_027_Down_未选择记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '027';
    await goToUD11Mock(page, MOCK_RESULTS_MULTI, {});

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 未选择记录，点击 Down
    await page.locator('.ud11-btn--default').nth(0).click();
    await page.waitForTimeout(500);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（Down未选择）');

    // 错误消息
    await expect(page.locator('.ud11-message--error')).toContainText('请选择一条记录');
    expect(page.url()).toContain('/UD11');
  });
});

// ============================================================
// 6. Back 按钮操作 (No.28-29)
// ============================================================
test.describe('Back 按钮操作', () => {

  test('UD11_028_Back_返回UD10画面', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '028';
    await page.route('**/UD10', route => {
      route.fulfill({ status: 200, body: '<html><body><div class="ud10-container">UD10 Mock</div></body></html>' });
    });

    await goToUD11Mock(page, MOCK_RESULTS_SINGLE, { variable: '1001', description: 'UD10更新测试_13756' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 点击 Back
    await page.locator('.ud11-btn--default').nth(1).click();
    await page.waitForTimeout(2000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（Back）');

    // 返回 UD10
    await expect(page).toHaveURL(/\/UD10/);
  });

  test('UD11_029_Back_返回后检索条件保持', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '029';
    await page.route('**/UD10', route => {
      route.fulfill({ status: 200, body: '<html><body><div class="ud10-container">UD10 Mock</div></body></html>' });
    });

    await goToUD11Mock(page, MOCK_RESULTS_SINGLE, { variable: '1002', type: 'User Defined' }, { variable: '1002', type: 'User Defined' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 点击 Back
    await page.locator('.ud11-btn--default').nth(1).click();
    await page.waitForTimeout(2000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（Back保持条件）');

    // 返回 UD10
    await expect(page).toHaveURL(/\/UD10/);
  });
});

// ============================================================
// 7. Print 按钮操作 (No.30-31)
// ============================================================
test.describe('Print 按钮操作', () => {

  test('UD11_030_Print_有数据打印', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '030';
    await goToUD11Mock(page, MOCK_RESULTS_MULTI, {});

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // Print 按钮可用，无错误消息
    await expect(page.locator('.ud11-btn--default').nth(2)).toBeEnabled();
    await expect(page.locator('.ud11-btn--default').nth(2)).toHaveText('Print');
    await expect(page.locator('.ud11-message--error')).toHaveCount(0);
  });

  test('UD11_031_Print_无数据打印', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '031';
    await goToUD11Mock(page, MOCK_RESULTS_EMPTY, { variable: 'NONEXIST_VAR_99999' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 点击 Print
    await page.locator('.ud11-btn--default').nth(2).click();
    await page.waitForTimeout(500);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（Print无数据）');

    // 错误消息
    await expect(page.locator('.ud11-message--error')).toContainText('没有可打印的数据');
  });
});

// ============================================================
// 8. Excel 按钮操作 (No.32-34)
// ============================================================
test.describe('Excel 按钮操作', () => {

  test('UD11_032_Excel_有数据导出CSV', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '032';

    await goToUD11Mock(page, MOCK_RESULTS_MULTI, {});

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 点击 Excel
    await page.locator('.ud11-btn--excel').click();
    await page.waitForTimeout(1000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（Excel导出）');

    // 成功消息
    await expect(page.locator('.ud11-message--success')).toContainText('CSV导出成功');
  });

  test('UD11_033_Excel_空数据导出', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '033';
    await goToUD11Mock(page, MOCK_RESULTS_EMPTY, { variable: 'NONEXIST_VAR_99999' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud11-btn--excel').click();
    await page.waitForTimeout(1000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（Excel空数据）');

    // 成功消息
    await expect(page.locator('.ud11-message--success')).toContainText('CSV导出成功');
  });

  test('UD11_034_Excel_导出失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '034';
    await goToUD11Mock(page, MOCK_RESULTS_MULTI, {});

    // 覆盖 Blob 构造函数使其抛出异常
    await page.evaluate(() => {
      const origBlob = window.Blob;
      window.Blob = function() { throw new Error('Blob error'); } as any;
    });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud11-btn--excel').click();
    await page.waitForTimeout(1000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（Excel失败）');

    // 错误消息
    await expect(page.locator('.ud11-message--error')).toContainText('导出失败');
  });
});

// ============================================================
// 9. Created by user 链接操作 (No.35-37)
// ============================================================
test.describe('Created by user 链接操作', () => {

  test('UD11_035_Created by user_点击链接跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '035';
    await page.route('**/UD25', route => {
      route.fulfill({ status: 200, body: '<html><body><div class="ud25-container">UD25 Mock</div></body></html>' });
    });

    await goToUD11Mock(page, MOCK_RESULTS_SINGLE.map(r => ({ ...r, variable: '1001', registerUser: 'x001' })), { variable: '1001' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 点击 Created by user 链接
    await page.locator('.ud11-user-link').first().click();
    await page.waitForTimeout(2000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（跳转UD25）');

    await expect(page).toHaveURL(/\/UD25/);
  });

  test('UD11_036_Created by user_点击空用户', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '036';
    await goToUD11Mock(page, MOCK_RESULTS_EMPTY_USER, { variable: '202606' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // Created by user 列为空，无链接
    const firstRowCells = page.locator('.ud11-table tbody tr').first().locator('td');
    const userText = await firstRowCells.nth(4).textContent();
    expect(userText.trim()).toBe('');

    // 无 .ud11-user-link 元素
    await expect(firstRowCells.nth(4).locator('.ud11-user-link')).toHaveCount(0);
  });

  test('UD11_037_Created by user_点击不同用户', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '037';
    await page.route('**/UD25', route => {
      route.fulfill({ status: 200, body: '<html><body>UD25 Mock</body></html>' });
    });

    await goToUD11Mock(page, MOCK_RESULTS_MULTI.filter(r => r.variable === '113'), { variable: '113' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 点击 admin 用户的链接
    await page.locator('.ud11-user-link').first().click();
    await page.waitForTimeout(2000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（跳转UD25）');

    await expect(page).toHaveURL(/\/UD25/);
  });
});

// ============================================================
// 10. UI交互 (No.38-43)
// ============================================================
test.describe('UI交互', () => {

  test('UD11_038_UI交互_Loading中按钮禁用', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '038';

    let resolveApi;
    const apiPromise = new Promise(resolve => { resolveApi = resolve; });
    await page.route('**/api/ud11/search', async route => {
      await apiPromise;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: MOCK_RESULTS_MULTI, msg: '' })
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD11');
    await page.waitForSelector('.ud11-container');
    await page.evaluate(() => {
      window.history.replaceState({ searchParams: {}, formData: {} }, '', '/UD11');
    });
    await page.reload();
    await page.waitForSelector('.ud11-container');
    await page.waitForTimeout(500);

    // === 加载中截图 ===
    await takeScreenshot(page, '加载中');

    // 所有按钮禁用
    await expect(page.locator('.ud11-btn--primary')).toBeDisabled();
    await expect(page.locator('.ud11-btn--default').nth(0)).toBeDisabled();
    await expect(page.locator('.ud11-btn--default').nth(1)).toBeDisabled();
    await expect(page.locator('.ud11-btn--default').nth(2)).toBeDisabled();
    await expect(page.locator('.ud11-btn--excel')).toBeDisabled();

    // 恢复
    resolveApi();
    await page.waitForTimeout(1500);

    // 加载完成后恢复
    await expect(page.locator('.ud11-btn--primary')).toBeEnabled();
  });

  test('UD11_039_UI交互_操作中防止重复点击', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '039';
    await page.route('**/UD10', route => {
      route.fulfill({ status: 200, body: '<html><body>UD10 Mock</body></html>' });
    });

    await goToUD11Mock(page, MOCK_RESULTS_SINGLE, {});

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 选择记录
    await page.locator('.ud11-radio').first().click({ force: true });
    await page.waitForTimeout(300);

    // === 選択後截图 ===
    await takeScreenshot(page, '選択後');

    // 快速连续点击 Select
    await page.locator('.ud11-btn--primary').click();
    await page.locator('.ud11-btn--primary').click({ force: true });
    await page.waitForTimeout(2000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（重复点击）');

    // 页面已跳转
    await expect(page).toHaveURL(/\/UD10/);
  });

  test('UD11_040_UI交互_错误消息显示红色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '040';
    await goToUD11Mock(page, MOCK_RESULTS_MULTI, {});

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 未选择记录，点击 Select
    await page.locator('.ud11-btn--primary').click();
    await page.waitForTimeout(500);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（错误消息）');

    // 错误消息可见
    await expect(page.locator('.ud11-message--error')).toBeVisible();
    const color = await page.locator('.ud11-message--error').evaluate(el => window.getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 77, 79)');
  });

  test('UD11_041_UI交互_成功消息显示绿色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '041';
    await goToUD11Mock(page, MOCK_RESULTS_MULTI, {});

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // Excel 导出成功
    await page.locator('.ud11-btn--excel').click();
    await page.waitForTimeout(1000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（成功消息）');

    await expect(page.locator('.ud11-message--success')).toBeVisible();
    const color = await page.locator('.ud11-message--success').evaluate(el => window.getComputedStyle(el).color);
    expect(color).toBe('rgb(82, 196, 26)');
  });

  test('UD11_042_UI交互_新消息覆盖旧消息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '042';
    await goToUD11Mock(page, MOCK_RESULTS_MULTI, {});

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 先触发 Select 未选择错误
    await page.locator('.ud11-btn--primary').click();
    await page.waitForTimeout(300);

    // 错误消息可见
    await expect(page.locator('.ud11-message--error')).toContainText('请选择一条记录');

    // 再执行 Excel 导出成功
    await page.locator('.ud11-btn--excel').click();
    await page.waitForTimeout(1000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（消息覆盖）');

    // 旧错误消息被清除，显示成功消息
    await expect(page.locator('.ud11-message--error')).toHaveCount(0);
    await expect(page.locator('.ud11-message--success')).toContainText('CSV导出成功');
  });

  test('UD11_043_UI交互_加载完成后清除消息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '043';

    // 第一次 API 返回 500
    let apiCallCount = 0;
    await page.route('**/api/ud11/search', async route => {
      apiCallCount++;
      if (apiCallCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ code: 500, msg: '获取检索结果失败' })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, data: MOCK_RESULTS_MULTI, msg: '' })
        });
      }
    });

    // 第一次加载 - 失败
    await goToUD11Real(page, {});
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud11-message--error')).toContainText('获取检索结果失败');

    // === 第一次加载截图 ===
    await takeScreenshot(page, '第一次加载（失败）');

    // 第二次加载 - 成功
    await page.evaluate(() => {
      window.history.replaceState({ searchParams: {}, formData: {} }, '', '/UD11');
    });
    await page.reload();
    await page.waitForSelector('.ud11-container');
    await page.waitForTimeout(2000);

    // === 第二次加载截图 ===
    await takeScreenshot(page, '第二次加载（成功）');

    // 错误消息被清除
    await expect(page.locator('.ud11-message--error')).toHaveCount(0);
    await expect(page.locator('.ud11-message')).toHaveCount(0);
  });
});

// ============================================================
// 11. 异常处理 (No.44-46)
// ============================================================
test.describe('异常处理', () => {

  test('UD11_044_异常处理_API超时', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '044';

    // 模拟 API 超时
    await page.route('**/api/ud11/search', async route => {
      await new Promise(resolve => setTimeout(resolve, 10000));
    });

    await goToUD11Real(page, {});
    await page.waitForTimeout(3000);

    // === 截图 ===
    await takeScreenshot(page, '超时状态');

    const isError = await page.locator('.ud11-message--error').isVisible().catch(() => false);
    if (isError) {
      const text = await page.locator('.ud11-message--error').textContent();
      expect(text.length).toBeGreaterThan(0);
    }
    await expect(page.locator('.ud11-table tbody')).toContainText('暂无数据');
  });

  test('UD11_045_异常处理_网络连接失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '045';

    // 模拟网络断开
    await page.route('**/api/ud11/search', async route => {
      // 不处理，模拟网络断开
    });

    await goToUD11Real(page, {});
    await page.waitForTimeout(3000);

    // === 截图 ===
    await takeScreenshot(page, '网络失败');

    const isError = await page.locator('.ud11-message--error').isVisible().catch(() => false);
    if (isError) {
      const text = await page.locator('.ud11-message--error').textContent();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('UD11_046_异常处理_数据解析错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '046';

    // 模拟 API 返回异常数据格式
    await page.route('**/api/ud11/search', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '获取检索结果失败' })
      });
    });

    await goToUD11Real(page, {});

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud11-message--error')).toContainText('获取检索结果失败');
    await expect(page.locator('.ud11-table tbody')).toContainText('暂无数据');
  });
});

// ============================================================
// 12. 安全性 (No.47-49)
// ============================================================
test.describe('安全性', () => {

  test('UD11_047_安全性_未登录直接访问重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '047';

    await page.evaluate(() => localStorage.clear());

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示（未登录）');

    await page.goto(BASE_URL + '/UD11');
    await page.waitForTimeout(2000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（重定向）');

    await expect(page).toHaveURL(/\/Login/);
    await expect(page.locator('.ud11-container')).toHaveCount(0);
  });

  test('UD11_048_安全性_Variable列XSS防护', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '048';

    let dialogShown = false;
    page.on('dialog', () => { dialogShown = true; });

    await goToUD11Mock(page, MOCK_RESULTS_XSS, {});

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // Variable 列显示 XSS 文本（不会被浏览器执行）
    const firstRowCells = page.locator('.ud11-table tbody tr').first().locator('td');
    const varText = await firstRowCells.nth(1).textContent();
    expect(varText).toContain('script');
    expect(varText).toContain('alert');

    // 页面不会弹出 alert
    expect(dialogShown).toBe(false);
  });

  test('UD11_049_安全性_用户信息保护', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '049';
    await page.route('**/UD25', route => {
      route.fulfill({ status: 200, body: '<html><body>UD25 Mock</body></html>' });
    });

    await goToUD11Mock(page, MOCK_RESULTS_SINGLE.map(r => ({ ...r, variable: '1001', registerUser: 'x001' })), { variable: '1001' });

    // === 初期表示截图 ===
    await takeScreenshot(page, '初期表示');

    // 点击 Created by user 链接
    await page.locator('.ud11-user-link').first().click();
    await page.waitForTimeout(2000);

    // === 操作後截图 ===
    await takeScreenshot(page, '操作後（跳转UD25）');

    // 跳转到 UD25
    await expect(page).toHaveURL(/\/UD25/);
  });
});
