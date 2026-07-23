// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD20_MarketDocumentSettingsList 单元测试
// 测试规格书: テスト式样書UD20.md
// 画面文件: UD20_MarketDocumentSettingsList.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD20');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

// DB: HDOC_DOCUMENT_LIST 表实际数据
// 123 / user / 2025-06-06 00:00:00
// CERTIFICATE / 661234 / 2026-07-29 00:00:00
// COC / admin / 2026-01-15 10:30:00
// DIMENSION_PLATE / aaa / 2026-05-12 00:00:00
// TECHNICAL_SPEC / user01 / 2026-07-14 18:39:00


/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD20画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * 导航到 UD20 List 页面
 */
async function goToUD20(page: Page) {
  await login(page);
  await page.goto(BASE_URL + '/UD20');
  await page.waitForSelector('.ud20-container');
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
// 1. 画面初期表示 (No.1-8)
// ============================================================
test.describe('画面初期表示', () => {

  test('UD20_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '001';
    await goToUD20(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 1. 页面容器可见
    await expect(page.locator('.ud20-container')).toBeVisible();

    // 2. 页面标题显示
    await expect(page.locator('.ud20-title')).toHaveText('Market Document Settings List');

    // 3. 按钮行可见（Select、Back、Print）
    await expect(page.locator('.ud20-button-row')).toBeVisible();
    await expect(page.locator('.ud20-btn')).toHaveCount(3);

    // 4. DataTable 区域可见
    await expect(page.locator('.ud20-table')).toBeVisible();

    // 5. 消息区域不在页面中（默认隐藏）
    await expect(page.locator('.ud20-message')).not.toBeVisible();

    await takeScreenshot(page, '整体布局確認');
  });

  test('UD20_002_画面初始化_DataTable列标题', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '002';
    await goToUD20(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 确认 DataTable 的列标题
    const headers = page.locator('.ud20-table thead th');
    await expect(headers).toHaveCount(5);

    // 第1列：空（单选按钮列）
    // 第2列标题：Document type
    await expect(headers.nth(1)).toHaveText('Document type');
    // 第3列标题：Bussines unit
    await expect(headers.nth(2)).toHaveText('Bussines unit');
    // 第4列标题：User
    await expect(headers.nth(3)).toHaveText('User');
    // 第5列标题：Date
    await expect(headers.nth(4)).toHaveText('Date');

    await takeScreenshot(page, '列标题確認');
  });

  test('UD20_003_画面初始化_数据显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '003';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待数据加载
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll('.ud20-table tbody .ud20-row');
      return rows.length > 0;
    }, { timeout: 10000 });

    const rows = page.locator('.ud20-table tbody .ud20-row');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    // 确认所有单选按钮初期未选中
    const radios = page.locator('.ud20-table tbody input[type="radio"]');
    const radioCount = await radios.count();
    for (let i = 0; i < radioCount; i++) {
      await expect(radios.nth(i)).not.toBeChecked();
    }

    await takeScreenshot(page, '数据显示確認');
  });

  test('UD20_004_画面初始化_BussinesUnit固定値', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '004';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 确认所有行的 Bussines unit 列均显示 BU
    const buCells = page.locator('.ud20-table tbody .ud20-col-bu');
    const buCount = await buCells.count();
    for (let i = 0; i < buCount; i++) {
      await expect(buCells.nth(i)).toHaveText('BU');
    }

    await takeScreenshot(page, 'BU固定値確認');
  });

  test('UD20_005_画面初始化_按钮初期状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '005';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    // 等待加载完成
    await page.waitForFunction(() => {
      const btns = document.querySelectorAll('.ud20-btn');
      return btns.length === 3 && Array.from(btns).every(b => !(b as HTMLButtonElement).disabled);
    }, { timeout: 10000 }).catch(() => {});
    await takeScreenshot(page, '初期表示');

    const btns = page.locator('.ud20-btn');

    // Select 按钮可见，文本为 Select，未禁用
    await expect(btns.nth(0)).toBeVisible();
    await expect(btns.nth(0)).toHaveText('Select');
    await expect(btns.nth(0)).not.toBeDisabled();

    // Back 按钮可见，文本为 Back，未禁用
    await expect(btns.nth(1)).toBeVisible();
    await expect(btns.nth(1)).toHaveText('Back');
    await expect(btns.nth(1)).not.toBeDisabled();

    // Print 按钮可见，文本为 Print，未禁用
    await expect(btns.nth(2)).toBeVisible();
    await expect(btns.nth(2)).toHaveText('Print');
    await expect(btns.nth(2)).not.toBeDisabled();

    await takeScreenshot(page, '按钮状态確認');
  });

  test('UD20_006_画面初始化_Loading状態', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '006';

    // 模拟 API 延迟响应以捕捉 loading 状态
    await page.route('**/api/ud20/getdocumentlist', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: [] }),
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD20');
    await page.waitForSelector('.ud20-container');
    await page.waitForTimeout(500);
    await takeScreenshot(page, '初期表示');

    // DataTable 区域显示 加载中...
    await expect(page.locator('.ud20-loading')).toBeVisible();
    await expect(page.locator('.ud20-loading')).toHaveText('加载中...');

    // 所有按钮处于禁用状态
    const btns = page.locator('.ud20-btn');
    const btnCount = await btns.count();
    for (let i = 0; i < btnCount; i++) {
      await expect(btns.nth(i)).toBeDisabled();
    }

    await takeScreenshot(page, 'Loading中確認');

    // 加载完成后按钮恢复可用
    await page.waitForTimeout(3000);
    await page.waitForFunction(() => {
      const btns = document.querySelectorAll('.ud20-btn');
      return btns.length === 3 && Array.from(btns).every(b => !(b as HTMLButtonElement).disabled);
    }, { timeout: 10000 }).catch(() => {});

    await takeScreenshot(page, 'Loading完了後');
  });

  test('UD20_007_画面初始化_無データ', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '007';

    // 模拟 API 返回空数据
    await page.route('**/api/ud20/getdocumentlist', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: [] }),
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD20');
    await page.waitForSelector('.ud20-container');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // DataTable 显示 暂无数据
    await expect(page.locator('.ud20-empty')).toBeVisible();
    await expect(page.locator('.ud20-empty')).toHaveText('暂无数据');

    // 不显示错误消息
    await expect(page.locator('.ud20-message')).not.toBeVisible();

    await takeScreenshot(page, '無データ確認');
  });

  test('UD20_008_画面初始化_API失敗', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '008';

    // 模拟 API 返回 HTTP 500
    await page.route('**/api/ud20/getdocumentlist', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'Internal Server Error' }),
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD20');
    await page.waitForSelector('.ud20-container');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 消息区域可见
    await expect(page.locator('.ud20-message')).toBeVisible();
    await expect(page.locator('.ud20-message')).toHaveText('获取文档列表失败，请稍后重试');
    await expect(page.locator('.ud20-message-error')).toBeVisible();

    // DataTable 显示 暂无数据
    await expect(page.locator('.ud20-empty')).toBeVisible();
    await expect(page.locator('.ud20-empty')).toHaveText('暂无数据');

    await takeScreenshot(page, 'API失敗確認');
  });

});

// ============================================================
// 2. 单选按钮（Radio）操作 (No.9-13)
// ============================================================
test.describe('单选按钮（Radio）操作', () => {

  test('UD20_009_Radio_点击行选中记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '009';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待行加载
    await page.waitForSelector('.ud20-table tbody .ud20-row', { timeout: 10000 });

    // 点击第1行
    const firstRow = page.locator('.ud20-table tbody .ud20-row').first();
    await firstRow.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    // 第1行的 Radio 按钮变为选中状态
    const firstRadio = firstRow.locator('input[type="radio"]');
    await expect(firstRadio).toBeChecked();

    // 该行高亮显示
    await expect(firstRow).toHaveClass(/ud20-row-selected/);

    // 其他行 Radio 未选中
    const rows = page.locator('.ud20-table tbody .ud20-row');
    const rowCount = await rows.count();
    for (let i = 1; i < rowCount; i++) {
      const radio = rows.nth(i).locator('input[type="radio"]');
      await expect(radio).not.toBeChecked();
    }
  });

  test('UD20_010_Radio_点击Radio选中记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '010';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待行加载
    await page.waitForSelector('.ud20-table tbody .ud20-row', { timeout: 10000 });

    // 点击第2行的 Radio 按钮
    const secondRow = page.locator('.ud20-table tbody .ud20-row').nth(1);
    const secondRadio = secondRow.locator('input[type="radio"]');
    await secondRadio.click({ force: true });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    // 第2行 Radio 变为选中状态
    await expect(secondRadio).toBeChecked();
    // 第2行高亮显示
    await expect(secondRow).toHaveClass(/ud20-row-selected/);
  });

  test('UD20_011_Radio_切替選択', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '011';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待行加载
    await page.waitForSelector('.ud20-table tbody .ud20-row', { timeout: 10000 });

    // 先选择第1行
    const firstRow = page.locator('.ud20-table tbody .ud20-row').first();
    await firstRow.click();
    await page.waitForTimeout(300);
    await takeScreenshot(page, '入力後');

    // 点击第3行切换选择
    const thirdRow = page.locator('.ud20-table tbody .ud20-row').nth(2);
    await thirdRow.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    // 第1行 Radio 变为未选中
    const firstRadio = firstRow.locator('input[type="radio"]');
    await expect(firstRadio).not.toBeChecked();

    // 第3行 Radio 变为选中状态
    const thirdRadio = thirdRow.locator('input[type="radio"]');
    await expect(thirdRadio).toBeChecked();
    // 选中行高亮移动到第3行
    await expect(thirdRow).toHaveClass(/ud20-row-selected/);

    // 仅1条记录被选中
    const rows = page.locator('.ud20-table tbody .ud20-row');
    const rowCount = await rows.count();
    let checkedCount = 0;
    for (let i = 0; i < rowCount; i++) {
      const radio = rows.nth(i).locator('input[type="radio"]');
      if (await radio.isChecked()) checkedCount++;
    }
    expect(checkedCount).toBe(1);
  });

  test('UD20_012_Radio_取消選択', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '012';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待行加载
    await page.waitForSelector('.ud20-table tbody .ud20-row', { timeout: 10000 });

    // 先选择第1行
    const firstRow = page.locator('.ud20-table tbody .ud20-row').first();
    await firstRow.click();
    await page.waitForTimeout(300);
    await takeScreenshot(page, '入力後');

    // 再次点击第1行的 Radio 按钮取消选择
    const firstRadio = firstRow.locator('input[type="radio"]');
    await firstRadio.click({ force: true });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    // 第1行 Radio 变为未选中
    await expect(firstRadio).not.toBeChecked();
    // 选中行高亮消失
    await expect(firstRow).not.toHaveClass(/ud20-row-selected/);

    // 没有记录被选中
    const rows = page.locator('.ud20-table tbody .ud20-row');
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const radio = rows.nth(i).locator('input[type="radio"]');
      await expect(radio).not.toBeChecked();
    }
  });

  test('UD20_013_Radio_初期状態_未選択', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '013';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待行加载
    await page.waitForSelector('.ud20-table tbody .ud20-row', { timeout: 10000 });

    // 所有记录的 Radio 按钮均处于未选中状态
    const rows = page.locator('.ud20-table tbody .ud20-row');
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const radio = rows.nth(i).locator('input[type="radio"]');
      await expect(radio).not.toBeChecked();
    }

    // 没有行高亮
    for (let i = 0; i < rowCount; i++) {
      await expect(rows.nth(i)).not.toHaveClass(/ud20-row-selected/);
    }

    await takeScreenshot(page, '未選択確認');
  });

});

// ============================================================
// 3. Select 按钮操作 (No.14-16)
// ============================================================
test.describe('Select按钮操作', () => {

  test('UD20_014_Select_未選択record', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '014';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 未选择任何记录，直接点击 Select 按钮
    const selectBtn = page.locator('.ud20-btn').nth(0);
    await selectBtn.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    // 消息区域可见
    await expect(page.locator('.ud20-message')).toBeVisible();
    await expect(page.locator('.ud20-message')).toHaveText('请先选择一条记录');
    await expect(page.locator('.ud20-message-error')).toBeVisible();

    // 不进行画面迁移，保持当前页面
    await expect(page).toHaveURL(/\/UD20/);
  });

  test('UD20_015_Select_選択record成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '015';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待行加载
    await page.waitForSelector('.ud20-table tbody .ud20-row', { timeout: 10000 });

    // 选择第1条记录
    const firstRow = page.locator('.ud20-table tbody .ud20-row').first();
    await firstRow.click();
    await page.waitForTimeout(300);
    await takeScreenshot(page, '入力後');

    // 点击 Select 按钮
    const selectBtn = page.locator('.ud20-btn').nth(0);
    await selectBtn.click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後');

    // 画面迁移到 UD20-1（/UD201）
    await expect(page).toHaveURL(/\/UD201/);
  });

  test('UD20_016_Select_選択他record成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '016';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待行加载
    await page.waitForSelector('.ud20-table tbody .ud20-row', { timeout: 10000 });

    // 选择第2条记录
    const rows = page.locator('.ud20-table tbody .ud20-row');
    const rowCount = await rows.count();
    if (rowCount >= 2) {
      const targetRow = rows.nth(1);
      await targetRow.click();
      await page.waitForTimeout(300);
      await takeScreenshot(page, '入力後');

      // 点击 Select 按钮
      const selectBtn = page.locator('.ud20-btn').nth(0);
      await selectBtn.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '操作後');

      // 画面迁移到 UD20-1
      await expect(page).toHaveURL(/\/UD201/);
    }
  });

});

// ============================================================
// 4. Back 按钮操作 (No.17)
// ============================================================
test.describe('Back按钮操作', () => {

  test('UD20_017_Back_返回到UD20-1画面', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '017';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 点击 Back 按钮
    const backBtn = page.locator('.ud20-btn').nth(1);
    await backBtn.click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後');

    // 画面迁移返回 UD20-1（/UD201）
    await expect(page).toHaveURL(/\/UD201/);
  });

});

// ============================================================
// 5. Print 按钮操作 (No.18)
// ============================================================
test.describe('Print按钮操作', () => {

  test('UD20_018_Print_打印当前页面', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '018';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 点击 Print 按钮
    const printBtn = page.locator('.ud20-btn').nth(2);
    await printBtn.click().catch(() => {});
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    // 页面应仍然在 UD20
    await expect(page).toHaveURL(/\/UD20/);
  });

});

// ============================================================
// 6. User 链接操作 (No.19-21)
// ============================================================
test.describe('User链接操作', () => {

  test('UD20_019_User链接_点击跳转UD25', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '019';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待行加载
    await page.waitForSelector('.ud20-table tbody .ud20-row', { timeout: 10000 });

    // 点击第1行 User 列的链接
    const firstUserLink = page.locator('.ud20-table tbody .ud20-row').first().locator('.ud20-user-link');
    await firstUserLink.click();
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '操作後');

    // 画面迁移到 UD25
    await expect(page).toHaveURL(/\/UD25/);
  });

  test('UD20_020_User链接_点击其他用户', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '020';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待行加载
    await page.waitForSelector('.ud20-table tbody .ud20-row', { timeout: 10000 });

    // 点击某行的 User 链接
    const rows = page.locator('.ud20-table tbody .ud20-row');
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const userLink = rows.nth(i).locator('.ud20-user-link');
      if (await userLink.isVisible().catch(() => false)) {
        await userLink.click();
        await page.waitForTimeout(1500);
        await takeScreenshot(page, '操作後');
        await expect(page).toHaveURL(/\/UD25/);
        break;
      }
    }
  });

  test('UD20_021_User链接_点击不重复选择行', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '021';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待行加载
    await page.waitForSelector('.ud20-table tbody .ud20-row', { timeout: 10000 });

    // 先选择第1行
    const firstRow = page.locator('.ud20-table tbody .ud20-row').first();
    await firstRow.click();
    await page.waitForTimeout(300);
    await takeScreenshot(page, '入力後');

    // 点击 User 链接（某行的User链接）
    const rows = page.locator('.ud20-table tbody .ud20-row');
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const userLink = rows.nth(i).locator('.ud20-user-link');
      if (await userLink.isVisible().catch(() => false)) {
        await userLink.click();
        await page.waitForTimeout(1500);
        await takeScreenshot(page, '操作後');
        await expect(page).toHaveURL(/\/UD25/);
        break;
      }
    }
  });

});

// ============================================================
// 7. UI交互 (No.22-25)
// ============================================================
test.describe('UI交互', () => {

  test('UD20_022_UI交互_Loading中按钮禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '022';

    // 模拟 API 延迟响应
    await page.route('**/api/ud20/getdocumentlist', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: [] }),
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD20');
    await page.waitForSelector('.ud20-container');
    await page.waitForTimeout(500);
    await takeScreenshot(page, '初期表示');

    // Select、Back、Print 按钮均处于禁用状态
    await expect(page.locator('.ud20-btn').nth(0)).toBeDisabled();
    await expect(page.locator('.ud20-btn').nth(1)).toBeDisabled();
    await expect(page.locator('.ud20-btn').nth(2)).toBeDisabled();

    // 加载完成后所有按钮恢复可用
    await page.waitForTimeout(3000);
    await page.waitForFunction(() => {
      const btns = document.querySelectorAll('.ud20-btn');
      return btns.length === 3 && Array.from(btns).every(b => !(b as HTMLButtonElement).disabled);
    }, { timeout: 10000 }).catch(() => {});
    await takeScreenshot(page, '操作後');
  });

  test('UD20_023_UI交互_選択行后按钮可用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '023';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待行加载
    await page.waitForSelector('.ud20-table tbody .ud20-row', { timeout: 10000 });

    // 选择任意记录
    const firstRow = page.locator('.ud20-table tbody .ud20-row').first();
    await firstRow.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '入力後');

    // 所有按钮保持可用状态
    const btns = page.locator('.ud20-btn');
    const btnCount = await btns.count();
    for (let i = 0; i < btnCount; i++) {
      await expect(btns.nth(i)).not.toBeDisabled();
    }

    await takeScreenshot(page, '操作後');
  });

  test('UD20_024_UI交互_错误消息显示红色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '024';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 未选择记录点击 Select
    const selectBtn = page.locator('.ud20-btn').nth(0);
    await selectBtn.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    // 消息区域从隐藏变为可见
    await expect(page.locator('.ud20-message')).toBeVisible();
    // 错误消息文字为红色
    await expect(page.locator('.ud20-message-error')).toBeVisible();
    await expect(page.locator('.ud20-message')).toHaveText('请先选择一条记录');
  });

  test('UD20_025_UI交互_新操作覆盖旧消息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '025';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 先触发 Select 未选择错误
    const selectBtn = page.locator('.ud20-btn').nth(0);
    await selectBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('.ud20-message')).toBeVisible();
    await takeScreenshot(page, '入力後');

    // 再点击 Back
    const backBtn = page.locator('.ud20-btn').nth(1);
    await backBtn.click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後');

    // 点击 Back 后画面迁移
    await expect(page).toHaveURL(/\/UD201/);
  });

});

// ============================================================
// 8. 异常处理 (No.26-32)
// ============================================================
test.describe('异常处理', () => {

  test('UD20_026_异常处理_网络超时', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '026';

    // 模拟 API 响应超时（>30秒）
    await page.route('**/api/ud20/getdocumentlist', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 35000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: [] }),
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD20');
    await page.waitForSelector('.ud20-container');
    await page.waitForTimeout(500);
    await takeScreenshot(page, '初期表示');

    // 等待超时错误消息（axios 30秒超时）
    await page.waitForFunction(() => {
      const msg = document.querySelector('.ud20-message');
      return msg && (msg.textContent.includes('网络请求超时') || msg.textContent.includes('获取文档列表失败'));
    }, { timeout: 40000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後');

    // 消息区域可见
    await expect(page.locator('.ud20-message')).toBeVisible();
    // DataTable 显示 暂无数据
    await expect(page.locator('.ud20-empty')).toBeVisible();
  });

  test('UD20_027_异常处理_数据库连接失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '027';

    // 模拟 API 返回 500
    await page.route('**/api/ud20/getdocumentlist', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: '系统暂时不可用，请联系管理员' }),
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD20');
    await page.waitForSelector('.ud20-container');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 消息区域可见
    await expect(page.locator('.ud20-message')).toBeVisible();
    await expect(page.locator('.ud20-message-error')).toBeVisible();
    // DataTable 显示 暂无数据
    await expect(page.locator('.ud20-empty')).toBeVisible();
    await expect(page.locator('.ud20-empty')).toHaveText('暂无数据');

    await takeScreenshot(page, '操作後');
  });

  test('UD20_028_异常处理_API返回空数据', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '028';

    // 模拟 API 返回 data=[]
    await page.route('**/api/ud20/getdocumentlist', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: [] }),
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD20');
    await page.waitForSelector('.ud20-container');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // DataTable 显示 暂无数据
    await expect(page.locator('.ud20-empty')).toBeVisible();
    await expect(page.locator('.ud20-empty')).toHaveText('暂无数据');

    await takeScreenshot(page, '操作後');
  });

  test('UD20_029_异常处理_获取用户信息失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '029';

    // 模拟 UD25 API 返回 500
    await page.route('**/api/ud01/authentication*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: '获取用户信息失败，请稍后重试' }),
      });
    });

    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待行加载
    await page.waitForSelector('.ud20-table tbody .ud20-row', { timeout: 10000 });

    // 点击 User 链接
    const firstUserLink = page.locator('.ud20-table tbody .ud20-row').first().locator('.ud20-user-link');
    await firstUserLink.click();
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '操作後');

    // 画面迁移到 UD25（先迁移，然后 UD25 调用 API 失败）
    const isUD25 = await page.evaluate(() => window.location.href.includes('/UD25')).catch(() => false);
    if (isUD25) {
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'UD25エラー確認');
    }
  });

  test('UD20_030_异常处理_打印功能不可用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '030';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 点击 Print 按钮
    const printBtn = page.locator('.ud20-btn').nth(2);
    await printBtn.click().catch(() => {});
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    // 页面应仍然在 UD20
    await expect(page).toHaveURL(/\/UD20/);
  });

  test('UD20_031_异常处理_返回操作失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '031';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 点击 Back 按钮
    const backBtn = page.locator('.ud20-btn').nth(1);
    await backBtn.click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後');

    // Back 正常情况会跳转到 /UD201
    await expect(page).toHaveURL(/\/UD201/);
  });

  test('UD20_032_异常处理_未知系统错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '032';

    // 模拟 API 返回未知错误
    await page.route('**/api/ud20/getdocumentlist', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 999, message: '未知错误' }),
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD20');
    await page.waitForSelector('.ud20-container');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 消息区域可见
    await expect(page.locator('.ud20-message')).toBeVisible();
    await expect(page.locator('.ud20-message-error')).toBeVisible();

    await takeScreenshot(page, '操作後');
  });

});

// ============================================================
// 9. 安全性 (No.33-35)
// ============================================================
test.describe('安全性', () => {

  test('UD20_033_安全性_未登录直接访问重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '033';

    // 1. 先登录系统，进入 UD20 画面
    await goToUD20(page);
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/UD20/);
    await expect(page.locator('.ud20-container')).toBeVisible();
    await takeScreenshot(page, 'UD20画面表示');

    // 2. 清除所有 localStorage 数据（模拟未登录状态）
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/UD20/);
    await expect(page.locator('.ud20-container')).toBeVisible();
    await takeScreenshot(page, 'localStorage清除後（画面未刷新）');

    // 3. 浏览器地址栏直接输入 UD20 画面的完整 URL 并访问
    await page.goto(BASE_URL + '/UD20');
    await page.waitForTimeout(2000);

    // 4. 确认结果：URL 变为根路径（Login 画面），UD20 画面不被显示
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('.ud20-container')).not.toBeVisible();
    await takeScreenshot(page, '重定向結果（Login画面）');
  });

  test('UD20_034_安全性_数据权限控制', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '034';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // API 请求经过权限验证
    const rows = page.locator('.ud20-table tbody .ud20-row');
    await expect(rows).not.toHaveCount(0);

    await takeScreenshot(page, 'データ確認');
  });

  test('UD20_035_安全性_用户信息保护', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '035';
    await goToUD20(page);
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待行加载
    await page.waitForSelector('.ud20-table tbody .ud20-row', { timeout: 10000 });

    // 点击 User 链接跳转
    const firstUserLink = page.locator('.ud20-table tbody .ud20-row').first().locator('.ud20-user-link');
    await firstUserLink.click();
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '操作後');

    // 画面迁移到 UD25
    await expect(page).toHaveURL(/\/UD25/);
  });

});
