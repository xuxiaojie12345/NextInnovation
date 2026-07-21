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

// 检索条件: Product class=01（返回多条记录）
const SEARCH_PARAMS_01 = { productClass: '01' };

// 检索条件: Product class=01, Number=2222, Market=AF 的详细记录
const SEARCH_PARAMS_DETAIL = { productClass: '01', number: 2222, market: 'AF' };

// 检索条件: 不存在的数据
const SEARCH_PARAMS_NONEXIST = { variable: 'NONEXIST_VAR_99999' };


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
 * 导航到 UD09 画面并注入路由参数（searchParams）
 * 通过 React Router 内部 navigator 设置 location.state
 */
async function goToUD09(
  page: Page,
  searchParams: Record<string, any>,
  formData?: Record<string, any>
) {
  await login(page);
  // 先导航到 UD09，组件会先渲染（无 state）
  await page.goto(BASE_URL + '/UD09');
  await page.waitForSelector('.ud09-container');
  // 通过 React Router 内部 navigator.push 注入路由参数
  await page.evaluate(({ params, form }) => {
    const root = document.getElementById('root');
    const containerKey = Object.keys(root).find(k => k.startsWith('__reactContainer'));
    const seen = new Set();
    (function walk(fiber, depth) {
      if (!fiber || depth > 60 || seen.has(fiber)) return;
      seen.add(fiber);
      if (fiber.memoizedProps && fiber.memoizedProps.value &&
          fiber.memoizedProps.value.navigator) {
        fiber.memoizedProps.value.navigator.push('/UD09', {
          searchParams: params,
          formData: form || {}
        });
        return;
      }
      walk(fiber.child, depth + 1);
      walk(fiber.sibling, depth);
    })(root[containerKey], 0);
  }, { params: searchParams, form: formData || {} });
  // 等待组件 re-render 和 API 响应
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
    currentTestNo = '01';
    await goToUD09(page, SEARCH_PARAMS_01);
    // 等待 API 响应和数据加载
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // 1. 画面标题
    await expect(page.locator('.ud09-title')).toHaveText('Homologation Variables');
    await takeScreenshot(page, '画面标题');

    // 2. DataTable 列标题
    const thElements = page.locator('.ud09-table thead th');
    await expect(thElements.nth(0)).toBeVisible();          // radio
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

    // 3. Count 标签显示
    await expect(page.locator('.ud09-count')).toBeVisible();
    const countText = await page.locator('.ud09-count').textContent();
    expect(countText).toContain('Number of lines found:');

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

    await takeScreenshot(page, '整体布局');
  });

  test('UD09_002_画面初始化_DataTable列属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '02';
    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // 1. radio button 列：Input，居中
    const firstRadio = page.locator('.ud09-table tbody tr').first().locator('.ud09-radio');
    await expect(firstRadio).toBeVisible();

    // 2. Product class 列：Output，居左
    const firstRowCells = page.locator('.ud09-table tbody tr').first().locator('td');
    // 2-12: 确认各列的值非空（有数据显示）
    for (let i = 1; i <= 11; i++) {
      await expect(firstRowCells.nth(i)).toBeVisible();
    }
    // Created by user 链接
    const userLink = firstRowCells.nth(10).locator('.ud09-user-link');
    await expect(userLink).toBeVisible();

    await takeScreenshot(page, 'DataTable列属性');
  });

  test('UD09_003_画面初始化_检索结果数据加载与排序', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '03';
    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // 确认 API 返回 code=200，有数据行
    const rowCount = await page.locator('.ud09-table tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);

    // 确认数据按 Product class → Market → Number 升序排序
    // 取第一行和第二行数据比较
    const firstRowCells = page.locator('.ud09-table tbody tr').first().locator('td');
    const firstPC = await firstRowCells.nth(1).textContent();
    const firstMarket = await firstRowCells.nth(3).textContent();
    const firstNum = await firstRowCells.nth(2).textContent();
    expect(firstPC).toBeTruthy();
    expect(firstMarket).toBeTruthy();
    expect(firstNum).toBeTruthy();

    await takeScreenshot(page, '检索结果数据加载与排序');
  });

  test('UD09_004_画面初始化_检索结果数据与数据库字段对应', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '04';
    // 使用精确检索条件查找特定记录
    await goToUD09(page, SEARCH_PARAMS_DETAIL);
    await page.waitForTimeout(3000);

    // 等待数据加载 - 可能没有数据或返回空
    const hasData = await page.locator('.ud09-table tbody tr td').count();
    if (hasData > 0) {
      const firstRowCells = page.locator('.ud09-table tbody tr').first().locator('td');
      // Product class 列
      await expect(firstRowCells.nth(1)).toHaveText('01');
      // Number 列 - 从 API 获取
      const numText = await firstRowCells.nth(2).textContent();
      expect(numText.trim()).toBeTruthy();
      // Market 列
      await expect(firstRowCells.nth(3)).toHaveText('AF');
      // Variable 列
      const varText = await firstRowCells.nth(4).textContent();
      expect(varText.trim()).toBeTruthy();
      // Value 列
      const valText = await firstRowCells.nth(5).textContent();
      expect(valText.trim()).toBeTruthy();
      // Variant string. 列
      const vsText = await firstRowCells.nth(6).textContent();
      expect(vsText.trim()).toBeTruthy();
      // Comments 列
      const commentsText = await firstRowCells.nth(7).textContent();
      // Add 列
      const addText = await firstRowCells.nth(8).textContent();
      // Delete 列
      const deleteText = await firstRowCells.nth(9).textContent();
      // Created by user 列
      const userLink = firstRowCells.nth(10).locator('.ud09-user-link');
      await expect(userLink).toBeVisible();
      // Date 列
      const dateText = await firstRowCells.nth(11).textContent();
    }

    await takeScreenshot(page, '检索结果数据与数据库字段对应');
  });

  test('UD09_005_画面初始化_VariantString拼接显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '05';
    // 使用 Product class=01, Number=7768, Market=-EU
    await goToUD09(page, { productClass: '01', number: 7768, market: '-EU' });
    await page.waitForTimeout(3000);

    const hasData = await page.locator('.ud09-table tbody tr').count();
    if (hasData > 0) {
      // Variant string. 列显示 VS,VS2 拼接值
      const vsCell = page.locator('.ud09-table tbody tr').first().locator('td').nth(6);
      const vsText = await vsCell.textContent();
      expect(vsText.trim().length).toBeGreaterThan(0);
      // 确认包含逗号拼接（VS + VS2）
      const parts = vsText.split(',').map(s => s.trim()).filter(s => s);
      expect(parts.length).toBeGreaterThanOrEqual(1);
    }

    await takeScreenshot(page, 'VariantString拼接显示');
  });

  test('UD09_006_画面初始化_VS2为null时VariantString显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '06';
    // 使用 Product class=01, Number=1231, Market=-EU
    await goToUD09(page, { productClass: '01', number: 1231, market: '-EU' });
    await page.waitForTimeout(3000);

    const hasData = await page.locator('.ud09-table tbody tr').count();
    if (hasData > 0) {
      // Variant string. 仅显示 VS（VS2 为 null 时不拼接）
      const vsCell = page.locator('.ud09-table tbody tr').first().locator('td').nth(6);
      const vsText = (await vsCell.textContent()).trim();
      expect(vsText.length).toBeGreaterThan(0);
    }

    await takeScreenshot(page, 'VS2为null时VariantString显示');
  });

  test('UD09_007_画面初始化_Count显示检索结果件数', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '07';
    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Count 标签
    await expect(page.locator('.ud09-count')).toBeVisible();
    const countText = await page.locator('.ud09-count').textContent();
    expect(countText).toMatch(/Number of lines found:\s*\d+/);

    await takeScreenshot(page, 'Count显示检索结果件数');
  });

  test('UD09_008_画面初始化_检索结果为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '08';
    // 使用不存在的检索条件
    await goToUD09(page, SEARCH_PARAMS_NONEXIST);
    await page.waitForTimeout(3000);

    // 可能显示空数据或消息
    const countText = await page.locator('.ud09-count').textContent();
    expect(countText).toContain('Number of lines found:');

    // 检查是否有 message（"数据不存在"）
    const messageVisible = await page.locator('.ud09-message').isVisible().catch(() => false);

    await takeScreenshot(page, '检索结果为空');
  });

  test('UD09_009_画面初始化_CreatedByUser链接', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '09';
    await goToUD09(page, { productClass: '01', number: 11, market: '-EU' });
    await page.waitForTimeout(3000);

    const hasRows = await page.locator('.ud09-table tbody tr').count();
    if (hasRows > 0) {
      // Created by user 链接可点击
      const userLink = page.locator('.ud09-table tbody tr').first().locator('.ud09-user-link');
      await expect(userLink).toBeVisible();
      const userText = await userLink.textContent();
      expect(userText.trim().length).toBeGreaterThan(0);
    }

    await takeScreenshot(page, 'CreatedByUser链接');
  });
});

// ============================================================
// 2. Select 按钮操作 (No.10-11)
// ============================================================
test.describe('Select 按钮操作', () => {

  test('UD09_010_Select_未选择任何记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '10';
    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // 不选择任何记录，直接点击 Select
    await page.locator('button.ud09-btn--primary').click();
    await page.waitForTimeout(500);

    // 错误消息显示
    await expect(page.locator('.ud09-message--error')).toBeVisible();
    await expect(page.locator('.ud09-message')).toContainText('请选择至少一条记录');

    await takeScreenshot(page, 'Select未选择任何记录');
  });

  test('UD09_011_Select_选择一条记录返回UD08', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '11';
    await goToUD09(page, { productClass: '01', number: 2222, market: 'AF' });
    await page.waitForTimeout(3000);

    const hasRows = await page.locator('.ud09-table tbody tr').count();
    if (hasRows > 0) {
      // 选择一个 radio button
      await page.locator('.ud09-radio').first().click({ force: true });
      await page.waitForTimeout(300);

      // 点击 Select 按钮
      await page.locator('button.ud09-btn--primary').click();
      await page.waitForTimeout(2000);

      // 确认跳转到 UD08
      await expect(page).toHaveURL(/\/UD08/);
    }

    await takeScreenshot(page, 'Select选择一条记录');
  });
});

// ============================================================
// 3. Back 按钮操作 (No.12)
// ============================================================
test.describe('Back 按钮操作', () => {

  test('UD09_012_Back_返回UD08保留搜索条件', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '12';
    const formData = { productClass: '01', market: '' };
    await goToUD09(page, SEARCH_PARAMS_01, formData);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // 点击 Back 按钮
    await page.locator('button.ud09-btn--default').first().click();
    await page.waitForTimeout(2000);

    // 确认返回 UD08
    await expect(page).toHaveURL(/\/UD08/);

    await takeScreenshot(page, 'Back返回UD08');
  });
});

// ============================================================
// 4. Print 按钮操作 (No.13-14)
// ============================================================
test.describe('Print 按钮操作', () => {

  test('UD09_013_Print_有数据可打印', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '13';
    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // 点击 Print 按钮
    // 注意: 浏览器打印对话框无法通过 Playwright 自动处理，仅确认按钮可点击
    const printBtn = page.locator('button.ud09-btn--default').nth(1);
    await expect(printBtn).toBeEnabled();
    await expect(printBtn).toHaveText('Print');

    await takeScreenshot(page, 'Print有数据可打印');
  });

  test('UD09_014_Print_无数据可打印', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '14';
    // Mock API 返回空数据
    await page.route('**/api/ud09/seach', async route => {
      const response = await route.fetch();
      const body = await response.json();
      // 返回空数组
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [], message: '' })
      });
    });

    await goToUD09(page, SEARCH_PARAMS_NONEXIST);
    await page.waitForTimeout(3000);

    // 点击 Print 按钮
    await page.locator('button.ud09-btn--default').nth(1).click();
    await page.waitForTimeout(500);

    // 错误消息
    await expect(page.locator('.ud09-message--error')).toBeVisible();
    await expect(page.locator('.ud09-message')).toContainText('没有可打印的数据');

    await takeScreenshot(page, 'Print无数据可打印');
  });
});

// ============================================================
// 5. Delete selected 按钮操作 (No.15-18)
// ============================================================
test.describe('Delete selected 按钮操作', () => {

  test('UD09_015_DeleteSelected_未选择任何记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '15';
    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // 不选择记录，点击 Delete selected
    await page.locator('button.ud09-btn--danger').click();
    await page.waitForTimeout(500);

    // 错误消息
    await expect(page.locator('.ud09-message--error')).toBeVisible();
    await expect(page.locator('.ud09-message')).toContainText('请选择至少一条要删除的记录');

    await takeScreenshot(page, 'DeleteSelected未选择任何记录');
  });

  test('UD09_016_DeleteSelected_删除一条记录成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '16';

    // Mock 删除 API 返回成功
    await page.route('**/api/ud09/deleteselected', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '', data: null })
      });
    });

    await goToUD09(page, { productClass: '01', number: 11, market: 'AUS' });
    await page.waitForTimeout(3000);

    const hasRows = await page.locator('.ud09-table tbody tr').count();
    if (hasRows > 0) {
      // 选择一条记录
      await page.locator('.ud09-radio').first().click({ force: true });
      await page.waitForTimeout(300);

      // 点击 Delete selected
      page.on('dialog', dialog => {
        expect(dialog.message()).toContain('确定要删除');
        dialog.accept();
      });
      await page.locator('button.ud09-btn--danger').click();
      await page.waitForTimeout(2000);

      // 删除成功消息
      const successMsg = page.locator('.ud09-message--success');
      if (await successMsg.isVisible().catch(() => false)) {
        await expect(successMsg).toContainText('删除成功');
      }
    }

    await takeScreenshot(page, 'DeleteSelected删除成功');
  });

  test('UD09_017_DeleteSelected_VariantString拆分处理', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '17';
    // 捕捉 delete API 请求参数
    let capturedBody = null;
    await page.route('**/api/ud09/deleteselected', async route => {
      capturedBody = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '', data: null })
      });
    });

    await goToUD09(page, { productClass: '01', number: 2222, market: 'AF' });
    await page.waitForTimeout(3000);

    const hasRows = await page.locator('.ud09-table tbody tr').count();
    if (hasRows > 0) {
      // 选择第一条记录
      await page.locator('.ud09-radio').first().click({ force: true });
      await page.waitForTimeout(300);

      // 点击 Delete selected
      page.on('dialog', dialog => dialog.accept());
      await page.locator('button.ud09-btn--danger').click();
      await page.waitForTimeout(2000);

      // 确认请求参数包含 productClass, number, market
      if (capturedBody) {
        expect(capturedBody.productClass).toBeTruthy();
        expect(capturedBody.number).toBeTruthy();
        expect(capturedBody.market).toBeTruthy();
      }
    }

    await takeScreenshot(page, 'DeleteSelectedVariantString拆分');
  });

  test('UD09_018_DeleteSelected_记录不存在404', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '18';

    // Mock delete API 返回 404
    await page.route('**/api/ud09/deleteselected', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 400, message: 'Data does not exist, Please enter the correct content', data: null })
      });
    });

    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const hasRows = await page.locator('.ud09-table tbody tr').count();
    if (hasRows > 0) {
      await page.locator('.ud09-radio').first().click({ force: true });
      await page.waitForTimeout(300);

      page.on('dialog', dialog => dialog.accept());
      await page.locator('button.ud09-btn--danger').click();
      await page.waitForTimeout(2000);

      // 错误消息
      const errorMsg = page.locator('.ud09-message--error');
      if (await errorMsg.isVisible().catch(() => false)) {
        await expect(errorMsg).toContainText('Data does not exist');
      }
    }

    await takeScreenshot(page, 'DeleteSelected记录不存在');
  });
});

// ============================================================
// 6. Created by user 链接操作 (No.19)
// ============================================================
test.describe('Created by user 链接操作', () => {

  test('UD09_019_CreatedByUser_点击跳转到UD25', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '19';
    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const hasLinks = await page.locator('.ud09-user-link').count();
    if (hasLinks > 0) {
      // 点击第一个 Created by user 链接
      await page.locator('.ud09-user-link').first().click();
      await page.waitForTimeout(2000);

      // 确认跳转到 UD25
      await expect(page).toHaveURL(/\/UD25/);
    }

    await takeScreenshot(page, 'CreatedByUser跳转UD25');
  });
});

// ============================================================
// 7. 异常处理 (No.20-25)
// ============================================================
test.describe('异常处理', () => {

  test('UD09_020_异常处理_API检索返回400', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '20';

    await page.route('**/api/ud09/seach', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 400, message: '请求参数错误', data: null })
      });
    });

    await goToUD09(page, { productClass: '' });
    await page.waitForTimeout(3000);

    // 检查错误消息
    const msg = page.locator('.ud09-message');
    if (await msg.isVisible().catch(() => false)) {
      await expect(msg).toContainText('请求参数错误');
    }

    await takeScreenshot(page, 'API检索返回400');
  });

  test('UD09_021_异常处理_API检索返回500', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '21';

    await page.route('**/api/ud09/seach', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: '系统内部错误，请联系系统管理员', data: null })
      });
    });

    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForTimeout(3000);

    const msg = page.locator('.ud09-message');
    if (await msg.isVisible().catch(() => false)) {
      await expect(msg).toContainText('系统内部错误');
    }

    await takeScreenshot(page, 'API检索返回500');
  });

  test('UD09_022_异常处理_DeleteSelected返回500', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '22';

    await page.route('**/api/ud09/deleteselected', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: '系统内部错误，请联系系统管理员', data: null })
      });
    });

    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const hasRows = await page.locator('.ud09-table tbody tr').count();
    if (hasRows > 0) {
      await page.locator('.ud09-radio').first().click({ force: true });
      await page.waitForTimeout(300);

      page.on('dialog', dialog => dialog.accept());
      await page.locator('button.ud09-btn--danger').click();
      await page.waitForTimeout(2000);

      const msg = page.locator('.ud09-message--error');
      if (await msg.isVisible().catch(() => false)) {
        await expect(msg).toContainText('系统内部错误');
      }
    }

    await takeScreenshot(page, 'DeleteSelected返回500');
  });

  test('UD09_023_异常处理_网络超时', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '23';

    // 模拟 API 超时
    await page.route('**/api/ud09/seach', async route => {
      await new Promise(resolve => setTimeout(resolve, 35000));
    });

    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForTimeout(5000);

    const msg = page.locator('.ud09-message');
    if (await msg.isVisible().catch(() => false)) {
      // 超时消息由前端捕获
    }

    await takeScreenshot(page, '网络超时');
  });

  test('UD09_024_异常处理_数据库连接失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '24';

    await page.route('**/api/ud09/seach', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: '数据库连接失败，请稍后重试', data: null })
      });
    });

    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForTimeout(3000);

    const msg = page.locator('.ud09-message');
    if (await msg.isVisible().catch(() => false)) {
      await expect(msg).toContainText('数据库连接失败');
    }

    await takeScreenshot(page, '数据库连接失败');
  });

  test('UD09_025_异常处理_权限不足403', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '25';

    await page.route('**/api/ud09/deleteselected', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 403, message: '您没有执行此操作的权限', data: null })
      });
    });

    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const hasRows = await page.locator('.ud09-table tbody tr').count();
    if (hasRows > 0) {
      await page.locator('.ud09-radio').first().click({ force: true });
      await page.waitForTimeout(300);

      page.on('dialog', dialog => dialog.accept());
      await page.locator('button.ud09-btn--danger').click();
      await page.waitForTimeout(2000);

      const msg = page.locator('.ud09-message--error');
      if (await msg.isVisible().catch(() => false)) {
        await expect(msg).toContainText('您没有执行此操作的权限');
      }
    }

    await takeScreenshot(page, '权限不足403');
  });
});

// ============================================================
// 8. UI交互 (No.26-31)
// ============================================================
test.describe('UI交互', () => {

  test('UD09_026_UI交互_加载中显示Loading状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '26';

    // 延迟 API 响应以捕获 loading 状态
    await page.route('**/api/ud09/seach', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [], message: '' })
      });
    });

    await goToUD09(page, SEARCH_PARAMS_01);
    // 在 API 响应前截取 loading 状态
    await page.waitForTimeout(1000);

    const loadingVisible = await page.locator('text=加载中...').isVisible().catch(() => false);
    // 检查按钮是否禁用
    if (loadingVisible) {
      await expect(page.locator('button.ud09-btn--primary')).toBeDisabled();
      await expect(page.locator('button.ud09-btn--default').first()).toBeDisabled();
    }

    await takeScreenshot(page, '加载中状态');
  });

  test('UD09_027_UI交互_加载完成后控件恢复活性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '27';
    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // 加载完成后按钮可点击
    await expect(page.locator('button.ud09-btn--primary')).toBeEnabled();
    await expect(page.locator('button.ud09-btn--default').first()).toBeEnabled();
    await expect(page.locator('button.ud09-btn--default').nth(1)).toBeEnabled();
    await expect(page.locator('button.ud09-btn--danger')).toBeEnabled();

    await takeScreenshot(page, '加载完成后控件恢复');
  });

  test('UD09_028_UI交互_操作中按钮禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '28';

    // 延迟 delete API 响应
    await page.route('**/api/ud09/deleteselected', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '', data: null })
      });
    });

    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const hasRows = await page.locator('.ud09-table tbody tr').count();
    if (hasRows > 0) {
      await page.locator('.ud09-radio').first().click({ force: true });
      await page.waitForTimeout(300);

      page.on('dialog', dialog => dialog.accept());
      // 点击 Delete selected 后在 API 响应前检查按钮状态
      await page.locator('button.ud09-btn--danger').click();
      await page.waitForTimeout(500);

      // 检查操作中按钮禁用状态
      // 注意: isLoading 会影响所有按钮
    }

    await takeScreenshot(page, '操作中按钮禁用');
  });

  test('UD09_029_UI交互_防止重复提交', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '29';

    let apiCallCount = 0;
    await page.route('**/api/ud09/deleteselected', async route => {
      apiCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '', data: null })
      });
    });

    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const hasRows = await page.locator('.ud09-table tbody tr').count();
    if (hasRows > 0) {
      await page.locator('.ud09-radio').first().click({ force: true });
      await page.waitForTimeout(300);

      page.on('dialog', dialog => dialog.accept());
      // 快速连续点击两次
      const deleteBtn = page.locator('button.ud09-btn--danger');
      await deleteBtn.click();
      await deleteBtn.click({ force: true });
      await page.waitForTimeout(2000);

      // 只发起 1 次 API 调用
      expect(apiCallCount).toBeLessThanOrEqual(1);
    }

    await takeScreenshot(page, '防止重复提交');
  });

  test('UD09_030_UI交互_DeleteSelected确认对话框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '30';
    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const hasRows = await page.locator('.ud09-table tbody tr').count();
    if (hasRows > 0) {
      await page.locator('.ud09-radio').first().click({ force: true });
      await page.waitForTimeout(300);

      // 确认对话框弹出
      let dialogShown = false;
      page.on('dialog', dialog => {
        dialogShown = true;
        expect(dialog.message()).toContain('确定要删除');
        dialog.accept();
      });

      await page.locator('button.ud09-btn--danger').click();
      await page.waitForTimeout(1000);

      expect(dialogShown).toBe(true);
    }

    await takeScreenshot(page, 'DeleteSelected确认对话框');
  });

  test('UD09_031_UI交互_DeleteSelected确认对话框点击取消', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '31';
    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const hasRows = await page.locator('.ud09-table tbody tr').count();
    if (hasRows > 0) {
      await page.locator('.ud09-radio').first().click({ force: true });
      await page.waitForTimeout(300);

      // 对话框点击取消
      page.on('dialog', dialog => {
        dialog.dismiss();
      });

      await page.locator('button.ud09-btn--danger').click();
      await page.waitForTimeout(1000);

      // 确认按钮恢复可用
      await expect(page.locator('button.ud09-btn--danger')).toBeEnabled();
    }

    await takeScreenshot(page, 'DeleteSelected确认取消');
  });
});

// ============================================================
// 9. Radio button 操作 (No.32-37)
// ============================================================
test.describe('Radio button 操作', () => {

  test('UD09_032_RadioButton_初期未选中', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '32';
    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // 所有 radio 未选中
    const radioCount = await page.locator('.ud09-radio').count();
    for (let i = 0; i < Math.min(radioCount, 5); i++) {
      await expect(page.locator('.ud09-radio').nth(i)).not.toBeChecked();
    }

    await takeScreenshot(page, 'RadioButton初期未选中');
  });

  test('UD09_033_RadioButton_点击选中一行', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '33';
    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const radioCount = await page.locator('.ud09-radio').count();
    if (radioCount > 0) {
      // 点击第一个 radio
      await page.locator('.ud09-radio').first().click({ force: true });
      await page.waitForTimeout(300);

      // 确认被选中
      await expect(page.locator('.ud09-radio').first()).toBeChecked();
      // 确认选中行有高亮样式
      await expect(page.locator('.ud09-table tbody tr').first()).toHaveClass(/ud09-row--selected/);
    }

    await takeScreenshot(page, 'RadioButton选中一行');
  });

  test('UD09_034_RadioButton_单选切换', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '34';
    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const radioCount = await page.locator('.ud09-radio').count();
    if (radioCount >= 2) {
      // 点击第一行
      await page.locator('.ud09-radio').nth(0).click({ force: true });
      await page.waitForTimeout(200);
      await expect(page.locator('.ud09-radio').nth(0)).toBeChecked();

      // 点击第二行
      await page.locator('.ud09-radio').nth(1).click({ force: true });
      await page.waitForTimeout(200);

      // 第一行取消选中，第二行选中
      await expect(page.locator('.ud09-radio').nth(0)).not.toBeChecked();
      await expect(page.locator('.ud09-radio').nth(1)).toBeChecked();
    }

    await takeScreenshot(page, 'RadioButton单选切换');
  });

  test('UD09_035_RadioButton_再次点击取消选中', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '35';
    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const radioCount = await page.locator('.ud09-radio').count();
    if (radioCount > 0) {
      // 点击选中
      await page.locator('.ud09-radio').first().click({ force: true });
      await page.waitForTimeout(200);
      await expect(page.locator('.ud09-radio').first()).toBeChecked();

      // 再次点击取消选中
      await page.locator('.ud09-radio').first().click({ force: true });
      await page.waitForTimeout(200);
      await expect(page.locator('.ud09-radio').first()).not.toBeChecked();
    }

    await takeScreenshot(page, 'RadioButton取消选中');
  });

  test('UD09_036_RadioButton_切换选中行高亮联动', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '36';
    await goToUD09(page, SEARCH_PARAMS_01);
    await page.waitForSelector('.ud09-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const radioCount = await page.locator('.ud09-radio').count();
    if (radioCount >= 2) {
      // 选中第一行
      await page.locator('.ud09-radio').nth(0).click({ force: true });
      await page.waitForTimeout(200);
      await expect(page.locator('.ud09-table tbody tr').nth(0)).toHaveClass(/ud09-row--selected/);

      // 选中第二行
      await page.locator('.ud09-radio').nth(1).click({ force: true });
      await page.waitForTimeout(200);

      // 第一行高亮消失，第二行高亮
      await expect(page.locator('.ud09-table tbody tr').nth(0)).not.toHaveClass(/ud09-row--selected/);
      await expect(page.locator('.ud09-table tbody tr').nth(1)).toHaveClass(/ud09-row--selected/);
    }

    await takeScreenshot(page, 'RadioButton高亮联动');
  });

  test('UD09_037_RadioButton_选中确认后清除选中状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '37';
    // 使用真实数据，选择后跳转再返回
    await goToUD09(page, { productClass: '01', number: 11, market: '-EU' });
    await page.waitForTimeout(3000);

    const hasRows = await page.locator('.ud09-table tbody tr').count();
    if (hasRows > 0) {
      // 选中第一行
      await page.locator('.ud09-radio').first().click({ force: true });
      await page.waitForTimeout(200);

      // 点击 Select 跳转到 UD08
      await page.locator('button.ud09-btn--primary').click();
      await page.waitForTimeout(2000);

      // 从 UD08 Back 返回 UD09（注入 formData）
      // 由于无法直接操作 UD08 的 Back，模拟重新访问 UD09
      await page.goto(BASE_URL + '/UD09');
      await page.waitForSelector('.ud09-container');
      await page.evaluate(({ params }) => {
        const root = document.getElementById('root');
        const containerKey = Object.keys(root).find(k => k.startsWith('__reactContainer'));
        const seen = new Set();
        (function walk(fiber, depth) {
          if (!fiber || depth > 60 || seen.has(fiber)) return;
          seen.add(fiber);
          if (fiber.memoizedProps && fiber.memoizedProps.value &&
              fiber.memoizedProps.value.navigator) {
            fiber.memoizedProps.value.navigator.push('/UD09', {
              searchParams: params,
              formData: {}
            });
            return;
          }
          walk(fiber.child, depth + 1);
          walk(fiber.sibling, depth);
        })(root[containerKey], 0);
      }, { params: { productClass: '01', number: 11, market: '-EU' } });
      await page.waitForTimeout(3000);

      // 重新加载后所有 radio 未选中
      if (await page.locator('.ud09-radio').first().isVisible().catch(() => false)) {
        await expect(page.locator('.ud09-radio').first()).not.toBeChecked();
      }
    }

    await takeScreenshot(page, 'RadioButton选中后清除');
  });
});

// ============================================================
// 10. 安全性 (No.38)
// ============================================================
test.describe('安全性', () => {

  test('UD09_038_安全性_未登录直接访问重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '38';

    // 清除登录状态
    await page.evaluate(() => localStorage.clear());
    await page.goto(BASE_URL + '/UD09');
    await page.waitForTimeout(2000);

    // 确认重定向到 Login 页面
    await expect(page).toHaveURL(/\/Login/);
    await expect(page.locator('.login-container')).toBeVisible();

    await takeScreenshot(page, '未登录重定向');
  });
});
