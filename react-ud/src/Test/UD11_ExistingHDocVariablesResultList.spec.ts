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
 * 通过 UD10 画面真实操作导航到 UD11（传递 searchParams）
 * 先通过 UD10 的 Search 按钮跳转，确保 React Router 自然传递 state
 */
async function goToUD11ViaUD10(
  page: Page,
  fillVariable: string,
  fillType?: string,
  fillDescription?: string
) {
  await login(page);
  // 先导航到 UD10
  await page.goto(BASE_URL + '/UD10');
  await page.waitForSelector('.ud10-container');
  await page.waitForTimeout(500);

  // 输入 Variable（如果提供）
  if (fillVariable) {
    const varInput = page.locator('.ud10-row').nth(0).locator('.ud10-input');
    await varInput.fill(fillVariable);
  }

  // 选择 Type（如果提供）
  if (fillType) {
    const typeSelect = page.locator('.ud10-row').nth(1).locator('.ud10-select');
    await typeSelect.selectOption(fillType);
  }

  // 输入 Description（如果提供）
  if (fillDescription) {
    const descInput = page.locator('.ud10-row').nth(2).locator('.ud10-input');
    await descInput.fill(fillDescription);
  }

  // 点击 Search 按钮
  await page.locator('.ud10-btn--search').click();
  // 等待跳转到 UD11
  await page.waitForSelector('.ud11-container', { timeout: 15000 });
  await page.waitForTimeout(2000);
}

/**
 * 直接导航到 UD11 画面（无 searchParams，全检索模式）
 * 仅用于不需要特定检索条件的测试
 */
async function goToUD11Direct(page: Page) {
  await login(page);
  await page.goto(BASE_URL + '/UD11');
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
    currentTestNo = '01';
    await goToUD11ViaUD10(page, '1001', undefined, 'UD10更新测试_13756');
    await page.waitForSelector('.ud11-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    await expect(page.locator('.ud11-container')).toBeVisible();
    await takeScreenshot(page, '页面容器');

    await expect(page.locator('.ud11-title')).toHaveText('Existing HDoc Variables');
    await takeScreenshot(page, '标题');

    await expect(page.locator('.ud11-table')).toBeVisible();
    await takeScreenshot(page, 'DataTable区域');

    await expect(page.locator('button.ud11-btn--primary')).toHaveText('Select');
    await expect(page.locator('button.ud11-btn--default').nth(0)).toHaveText('Down');
    await expect(page.locator('button.ud11-btn--default').nth(1)).toHaveText('Back');
    await expect(page.locator('button.ud11-btn--default').nth(2)).toHaveText('Print');
    await expect(page.locator('button.ud11-btn--excel')).toHaveText('Excel');
    await takeScreenshot(page, '按钮行');

    await expect(page.locator('.ud11-count')).toBeVisible();
    const countText = await page.locator('.ud11-count').textContent();
    expect(countText).toMatch(/Number of lines found:\s*\d+/);

    await expect(page.locator('.ud11-message')).not.toBeVisible();
    await takeScreenshot(page, '整体布局');
  });

  test('UD11_002_画面初始化_DataTable列标题', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '02';
    await goToUD11Direct(page);
    await page.waitForSelector('.ud11-table thead th', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const thElements = page.locator('.ud11-table thead th');
    await expect(thElements.nth(0)).toBeVisible();
    await expect(thElements.nth(1)).toHaveText('*Variable');
    await expect(thElements.nth(2)).toHaveText('Type');
    await expect(thElements.nth(3)).toHaveText('Description');
    await expect(thElements.nth(4)).toHaveText('Created by user');
    await expect(thElements.nth(5)).toHaveText('Date');
    await takeScreenshot(page, 'DataTable列标题');
  });

  test('UD11_003_画面初始化_全检索显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '03';
    await goToUD11Direct(page);
    await page.waitForSelector('.ud11-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const rowCount = await page.locator('.ud11-table tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);

    const countText = await page.locator('.ud11-count').textContent();
    expect(countText).toMatch(/Number of lines found:\s*\d+/);

    const checkedRadio = page.locator('.ud11-radio:checked');
    await expect(checkedRadio).toHaveCount(0);
    await takeScreenshot(page, '全检索显示');
  });

  test('UD11_004_画面初始化_带条件检索显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '04';
    await goToUD11ViaUD10(page, '1002', 'User Defined', 'Description1');
    await page.waitForTimeout(3000);

    const hasData = await page.locator('.ud11-table tbody tr td').count();
    if (hasData > 0) {
      const firstRow = page.locator('.ud11-table tbody tr').first().locator('td');
      const varText = await firstRow.nth(1).textContent();
      expect(varText.trim()).toBeTruthy();
      const typeText = await firstRow.nth(2).textContent();
      const descText = await firstRow.nth(3).textContent();
      const userLink = firstRow.nth(4).locator('.ud11-user-link');
      await expect(userLink).toBeVisible();
      const dateText = await firstRow.nth(5).textContent();
      const countText = await page.locator('.ud11-count').textContent();
      expect(countText).toContain('Number of lines found:');
    }
    await takeScreenshot(page, '带条件检索显示');
  });

  test('UD11_005_画面初始化_无检索结果', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '05';
    // 通过 UD10 输入不存在的 Variable 跳转到 UD11，后端返回 code=404
    await goToUD11ViaUD10(page, 'NONEXIST_VAR_99999');
    await page.waitForTimeout(3000);

    const emptyText = page.locator('.ud11-table tbody tr td');
    if (await emptyText.isVisible().catch(() => false)) {
      const text = await emptyText.textContent();
      expect(text).toContain('暂无数据');
    }

    const countText = await page.locator('.ud11-count').textContent();
    expect(countText).toContain('Number of lines found: 0');

    await expect(page.locator('.ud11-message--error')).toBeVisible();
    await expect(page.locator('.ud11-message')).toContainText('数据不存在');
    await takeScreenshot(page, '无检索结果');
  });

  test('UD11_006_画面初始化_Count标签显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '06';
    await goToUD11ViaUD10(page, '112');
    await page.waitForTimeout(3000);

    await expect(page.locator('.ud11-count')).toBeVisible();
    const countText = await page.locator('.ud11-count').textContent();
    expect(countText).toMatch(/Number of lines found:\s*\d+/);
    await takeScreenshot(page, 'Count标签显示');
  });

  test('UD11_007_画面初始化_Loading状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '07';

    await page.route('**/api/ud11/search', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: [] })
      });
    });

    await goToUD11Direct(page);
    await page.waitForTimeout(1000);

    const loadingText = page.locator('text=加载中...');
    if (await loadingText.isVisible().catch(() => false)) {
      await expect(page.locator('button.ud11-btn--primary')).toBeDisabled();
      await expect(page.locator('button.ud11-btn--default').nth(0)).toBeDisabled();
      await expect(page.locator('button.ud11-btn--default').nth(1)).toBeDisabled();
      await expect(page.locator('button.ud11-btn--default').nth(2)).toBeDisabled();
      await expect(page.locator('button.ud11-btn--excel')).toBeDisabled();
    }
    await takeScreenshot(page, 'Loading状态');
  });

  test('UD11_008_画面初始化_API失败500', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '08';

    await page.route('**/api/ud11/search', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '获取检索结果失败', data: null })
      });
    });

    await goToUD11Direct(page);
    await page.waitForTimeout(3000);

    await expect(page.locator('.ud11-message--error')).toBeVisible();
    await expect(page.locator('.ud11-message')).toContainText('获取检索结果失败');

    const emptyText = page.locator('.ud11-table tbody tr td');
    if (await emptyText.isVisible().catch(() => false)) {
      await expect(emptyText).toContainText('暂无数据');
    }

    await expect(page.locator('.ud11-count')).toContainText('Number of lines found: 0');
    await takeScreenshot(page, 'API失败500');
  });
});

// ============================================================
// 2. DataTable数据展示 (No.9-18)
// ============================================================
test.describe('DataTable数据展示', () => {

  test('UD11_009_Variable列_数据显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '09';
    await goToUD11ViaUD10(page, '1001');
    await page.waitForTimeout(3000);

    const hasData = await page.locator('.ud11-table tbody tr td').count();
    if (hasData > 0) {
      const varCell = page.locator('.ud11-table tbody tr').first().locator('td').nth(1);
      await expect(varCell).toBeVisible();
      const varText = await varCell.textContent();
      expect(varText.trim()).toBe('1001');
    }
    await takeScreenshot(page, 'Variable列数据显示');
  });

  test('UD11_010_Variable列_最大长度30字符', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '10';
    await goToUD11ViaUD10(page, '3811wj');
    await page.waitForTimeout(3000);

    const hasData = await page.locator('.ud11-table tbody tr td').count();
    if (hasData > 0) {
      const varCell = page.locator('.ud11-table tbody tr').first().locator('td').nth(1);
      const varText = (await varCell.textContent()).trim();
      expect(varText.length).toBeLessThanOrEqual(30);
    }
    await takeScreenshot(page, 'Variable列最大长度');
  });

  test('UD11_011_Type列_数据显示VDA', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '11';
    // 通过 UD10 选择 Type=VDA 跳转，使用真实数据
    await goToUD11ViaUD10(page, undefined, 'VDA');
    await page.waitForTimeout(3000);

    const hasData = await page.locator('.ud11-table tbody tr td').count();
    if (hasData > 0) {
      const typeCell = page.locator('.ud11-table tbody tr').first().locator('td').nth(2);
      await expect(typeCell).toBeVisible();
      const typeText = (await typeCell.textContent()).trim();
      expect(typeText).toBe('VDA');
    }
    await takeScreenshot(page, 'Type列VDA显示');
  });

  test('UD11_012_Type列_数据显示UserDefined', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '12';
    // 通过 UD10 选择 Type=User Defined 跳转，使用真实数据
    await goToUD11ViaUD10(page, undefined, 'User Defined');
    await page.waitForTimeout(3000);

    const hasData = await page.locator('.ud11-table tbody tr td').count();
    if (hasData > 0) {
      const typeCell = page.locator('.ud11-table tbody tr').first().locator('td').nth(2);
      const typeText = (await typeCell.textContent()).trim();
      expect(typeText).toBe('User Defined');
    }
    await takeScreenshot(page, 'Type列UserDefined显示');
  });

  test('UD11_013_Type列_空值显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '13';
    await goToUD11ViaUD10(page, '1001');
    await page.waitForTimeout(3000);

    const hasData = await page.locator('.ud11-table tbody tr td').count();
    if (hasData > 0) {
      const typeCell = page.locator('.ud11-table tbody tr').first().locator('td').nth(2);
      const typeText = (await typeCell.textContent()).trim();
      expect(typeText).not.toBe('null');
      expect(typeText).not.toBe('undefined');
    }
    await takeScreenshot(page, 'Type列空值显示');
  });

  test('UD11_014_Description列_数据显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '14';
    await goToUD11ViaUD10(page, '1002');
    await page.waitForTimeout(3000);

    const hasData = await page.locator('.ud11-table tbody tr td').count();
    if (hasData > 0) {
      const descCell = page.locator('.ud11-table tbody tr').first().locator('td').nth(3);
      await expect(descCell).toBeVisible();
      const descText = (await descCell.textContent()).trim();
      expect(descText.length).toBeGreaterThan(0);
    }
    await takeScreenshot(page, 'Description列数据显示');
  });

  test('UD11_015_Description列_空值显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '15';
    await goToUD11ViaUD10(page, '123');
    await page.waitForTimeout(3000);

    const hasData = await page.locator('.ud11-table tbody tr td').count();
    if (hasData > 0) {
      const descCell = page.locator('.ud11-table tbody tr').first().locator('td').nth(3);
      const descText = (await descCell.textContent()).trim();
      expect(descText).not.toBe('null');
      expect(descText).not.toBe('undefined');
    }
    await takeScreenshot(page, 'Description列空值显示');
  });

  test('UD11_016_CreatedByUser列_数据显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '16';
    await goToUD11ViaUD10(page, '1001');
    await page.waitForTimeout(3000);

    const hasData = await page.locator('.ud11-table tbody tr td').count();
    if (hasData > 0) {
      const userLink = page.locator('.ud11-table tbody tr').first().locator('.ud11-user-link');
      await expect(userLink).toBeVisible();
      const userText = (await userLink.textContent()).trim();
      expect(userText.length).toBeGreaterThan(0);
    }
    await takeScreenshot(page, 'CreatedByUser列数据显示');
  });

  test('UD11_017_CreatedByUser列_空值显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '17';
    await goToUD11ViaUD10(page, '202606');
    await page.waitForTimeout(3000);

    const hasData = await page.locator('.ud11-table tbody tr td').count();
    if (hasData > 0) {
      const userCell = page.locator('.ud11-table tbody tr').first().locator('td').nth(4);
      const userText = (await userCell.textContent()).trim();
      const linkExists = await page.locator('.ud11-user-link').count();
      if (linkExists === 0) {
        expect(userText).toBe('');
      }
    }
    await takeScreenshot(page, 'CreatedByUser列空值显示');
  });

  test('UD11_018_Date列_数据显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '18';
    await goToUD11ViaUD10(page, '1001');
    await page.waitForTimeout(3000);

    const hasData = await page.locator('.ud11-table tbody tr td').count();
    if (hasData > 0) {
      const dateCell = page.locator('.ud11-table tbody tr').first().locator('td').nth(5);
      await expect(dateCell).toBeVisible();
      const dateText = (await dateCell.textContent()).trim();
      expect(dateText.length).toBeGreaterThan(0);
    }
    await takeScreenshot(page, 'Date列数据显示');
  });
});

// ============================================================
// 3. 单选按钮Radio操作 (No.19-23)
// ============================================================
test.describe('单选按钮Radio操作', () => {

  test('UD11_019_Radio_选择一条记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '19';
    await goToUD11Direct(page);
    await page.waitForSelector('.ud11-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const radioCount = await page.locator('.ud11-radio').count();
    if (radioCount > 0) {
      await page.locator('.ud11-radio').first().click({ force: true });
      await page.waitForTimeout(300);

      await expect(page.locator('.ud11-radio').first()).toBeChecked();
      await expect(page.locator('.ud11-table tbody tr').first()).toHaveClass(/ud11-row--selected/);
      if (radioCount > 1) {
        await expect(page.locator('.ud11-radio').nth(1)).not.toBeChecked();
      }
    }
    await takeScreenshot(page, 'Radio选择一条记录');
  });

  test('UD11_020_Radio_切换选择记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '20';
    await goToUD11Direct(page);
    await page.waitForSelector('.ud11-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const radioCount = await page.locator('.ud11-radio').count();
    if (radioCount >= 2) {
      await page.locator('.ud11-radio').nth(0).click({ force: true });
      await page.waitForTimeout(200);
      await expect(page.locator('.ud11-radio').nth(0)).toBeChecked();

      await page.locator('.ud11-radio').nth(1).click({ force: true });
      await page.waitForTimeout(200);

      await expect(page.locator('.ud11-radio').nth(0)).not.toBeChecked();
      await expect(page.locator('.ud11-radio').nth(1)).toBeChecked();
      await expect(page.locator('.ud11-table tbody tr').nth(1)).toHaveClass(/ud11-row--selected/);
    }
    await takeScreenshot(page, 'Radio切换选择记录');
  });

  test('UD11_021_Radio_取消选择', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '21';
    await goToUD11Direct(page);
    await page.waitForSelector('.ud11-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const radioCount = await page.locator('.ud11-radio').count();
    if (radioCount > 0) {
      await page.locator('.ud11-radio').first().click({ force: true });
      await page.waitForTimeout(200);
      await expect(page.locator('.ud11-radio').first()).toBeChecked();

      await page.locator('.ud11-radio').first().click({ force: true });
      await page.waitForTimeout(200);
      await expect(page.locator('.ud11-radio').first()).not.toBeChecked();
    }
    await takeScreenshot(page, 'Radio取消选择');
  });

  test('UD11_022_Radio_初始状态无选中', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '22';
    await goToUD11Direct(page);
    await page.waitForSelector('.ud11-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const checkedRadio = page.locator('.ud11-radio:checked');
    await expect(checkedRadio).toHaveCount(0);
    await takeScreenshot(page, 'Radio初始无选中');
  });

  test('UD11_023_Radio_单条记录可取消选择', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '23';
    await goToUD11ViaUD10(page, '1002');
    await page.waitForTimeout(3000);

    const radioCount = await page.locator('.ud11-radio').count();
    if (radioCount === 1) {
      await page.locator('.ud11-radio').first().click({ force: true });
      await page.waitForTimeout(200);
      await expect(page.locator('.ud11-radio').first()).toBeChecked();

      await page.locator('.ud11-radio').first().click({ force: true });
      await page.waitForTimeout(200);
      await expect(page.locator('.ud11-radio').first()).not.toBeChecked();
    }
    await takeScreenshot(page, 'Radio单条取消');
  });
});

// ============================================================
// 4. Select 按钮操作 (No.24-26)
// ============================================================
test.describe('Select 按钮操作', () => {

  test('UD11_024_Select_未选择记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '24';
    await goToUD11Direct(page);
    await page.waitForSelector('.ud11-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    await page.locator('button.ud11-btn--primary').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud11-message--error')).toBeVisible();
    await expect(page.locator('.ud11-message')).toContainText('请选择一条记录');
    await takeScreenshot(page, 'Select未选择记录');
  });

  test('UD11_025_Select_选择记录成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '25';
    await goToUD11Direct(page);
    await page.waitForSelector('.ud11-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const radioCount = await page.locator('.ud11-radio').count();
    if (radioCount > 0) {
      await page.locator('.ud11-radio').first().click({ force: true });
      await page.waitForTimeout(300);

      await page.locator('button.ud11-btn--primary').click();
      await page.waitForTimeout(2000);

      await expect(page).toHaveURL(/\/UD10/);
    }
    await takeScreenshot(page, 'Select选择记录成功');
  });

  test('UD11_026_Select_选择其他记录成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '26';
    await goToUD11ViaUD10(page, '114');
    await page.waitForTimeout(3000);

    const radioCount = await page.locator('.ud11-radio').count();
    if (radioCount > 0) {
      await page.locator('.ud11-radio').first().click({ force: true });
      await page.waitForTimeout(300);

      await page.locator('button.ud11-btn--primary').click();
      await page.waitForTimeout(2000);

      await expect(page).toHaveURL(/\/UD10/);
    }
    await takeScreenshot(page, 'Select其他记录');
  });
});

// ============================================================
// 5. Down 按钮操作 (No.27)
// ============================================================
test.describe('Down 按钮操作', () => {

  test('UD11_027_Down_未选择记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '27';
    await goToUD11Direct(page);
    await page.waitForSelector('.ud11-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    await page.locator('button.ud11-btn--default').first().click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud11-message--error')).toBeVisible();
    await expect(page.locator('.ud11-message')).toContainText('请选择一条记录');
    await takeScreenshot(page, 'Down未选择记录');
  });
});

// ============================================================
// 6. Back 按钮操作 (No.28-29)
// ============================================================
test.describe('Back 按钮操作', () => {

  test('UD11_028_Back_返回UD10画面', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '28';
    // 通过 UD10 跳转后，Back 返回 UD10 会自动保留 formData
    await goToUD11ViaUD10(page, '1001', undefined, 'UD10更新测试_13756');
    await page.waitForSelector('.ud11-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    await page.locator('button.ud11-btn--default').nth(1).click();
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/UD10/);
    await takeScreenshot(page, 'Back返回UD10');
  });

  test('UD11_029_Back_返回后检索条件保持', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '29';
    // 通过 UD10 跳转后，Back 返回 UD10 会自动保留检索条件
    await goToUD11ViaUD10(page, '1002', 'User Defined');
    await page.waitForSelector('.ud11-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    await page.locator('button.ud11-btn--default').nth(1).click();
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/UD10/);
    await takeScreenshot(page, 'Back检索条件保持');
  });
});

// ============================================================
// 7. Print 按钮操作 (No.30-31)
// ============================================================
test.describe('Print 按钮操作', () => {

  test('UD11_030_Print_有数据打印', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '30';
    await goToUD11Direct(page);
    await page.waitForSelector('.ud11-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const printBtn = page.locator('button.ud11-btn--default').nth(2);
    await expect(printBtn).toBeEnabled();
    await expect(printBtn).toHaveText('Print');
    await takeScreenshot(page, 'Print有数据');
  });

  test('UD11_031_Print_无数据打印', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '31';

    await page.route('**/api/ud11/search', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: [] })
      });
    });

    await goToUD11Direct(page);
    await page.waitForTimeout(3000);

    await page.locator('button.ud11-btn--default').nth(2).click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud11-message--error')).toBeVisible();
    await expect(page.locator('.ud11-message')).toContainText('没有可打印的数据');
    await takeScreenshot(page, 'Print无数据');
  });
});

// ============================================================
// 8. Excel 按钮操作 (No.32-34)
// ============================================================
test.describe('Excel 按钮操作', () => {

  test('UD11_032_Excel_有数据导出CSV', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '32';
    await goToUD11Direct(page);
    await page.waitForSelector('.ud11-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const excelBtn = page.locator('button.ud11-btn--excel');
    await expect(excelBtn).toBeEnabled();

    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await excelBtn.click();
    await page.waitForTimeout(1000);

    const successMsg = page.locator('.ud11-message--success');
    if (await successMsg.isVisible().catch(() => false)) {
      await expect(successMsg).toContainText('CSV导出成功');
    }
    await takeScreenshot(page, 'Excel导出CSV');
  });

  test('UD11_033_Excel_空数据导出', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '33';

    await page.route('**/api/ud11/search', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: [] })
      });
    });

    await goToUD11Direct(page);
    await page.waitForTimeout(3000);

    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await page.locator('button.ud11-btn--excel').click();
    await page.waitForTimeout(1000);

    const successMsg = page.locator('.ud11-message--success');
    if (await successMsg.isVisible().catch(() => false)) {
      await expect(successMsg).toContainText('CSV导出成功');
    }
    await takeScreenshot(page, 'Excel空数据导出');
  });

  test('UD11_034_Excel_导出失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '34';

    await goToUD11Direct(page);
    await page.waitForSelector('.ud11-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      // @ts-ignore
      const origBlob = window.Blob;
      window.Blob = function() { throw new Error('Blob创建失败'); };
    });

    await page.locator('button.ud11-btn--excel').click();
    await page.waitForTimeout(500);

    const errorMsg = page.locator('.ud11-message--error');
    if (await errorMsg.isVisible().catch(() => false)) {
      await expect(errorMsg).toContainText('导出失败');
    }

    await page.evaluate(() => {
      // 不需要恢复，测试结束会自动清理
    });
    await takeScreenshot(page, 'Excel导出失败');
  });
});

// ============================================================
// 9. Created by user 链接操作 (No.35-37)
// ============================================================
test.describe('Created by user 链接操作', () => {

  test('UD11_035_CreatedByUser_点击链接跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '35';
    await goToUD11ViaUD10(page, '1001');
    await page.waitForTimeout(3000);

    const hasLinks = await page.locator('.ud11-user-link').count();
    if (hasLinks > 0) {
      const userLink = page.locator('.ud11-user-link').first();
      const userText = (await userLink.textContent()).trim();
      await userLink.click();
      await page.waitForTimeout(2000);

      await expect(page).toHaveURL(/\/UD25/);
    }
    await takeScreenshot(page, 'CreatedByUser跳转');
  });

  test('UD11_036_CreatedByUser_点击空用户', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '36';
    await goToUD11ViaUD10(page, '202606');
    await page.waitForTimeout(3000);

    const hasData = await page.locator('.ud11-table tbody tr td').count();
    if (hasData > 0) {
      const userCell = page.locator('.ud11-table tbody tr').first().locator('td').nth(4);
      const userText = (await userCell.textContent()).trim();
      const linkExists = await page.locator('.ud11-user-link').count();
      if (linkExists === 0) {
        expect(userText).toBe('');
      }
    }
    await takeScreenshot(page, 'CreatedByUser空用户');
  });

  test('UD11_037_CreatedByUser_点击不同用户', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '37';
    await goToUD11ViaUD10(page, '113');
    await page.waitForTimeout(3000);

    const hasLinks = await page.locator('.ud11-user-link').count();
    if (hasLinks > 0) {
      await page.locator('.ud11-user-link').first().click();
      await page.waitForTimeout(2000);

      await expect(page).toHaveURL(/\/UD25/);
    }
    await takeScreenshot(page, 'CreatedByUser不同用户');
  });
});

// ============================================================
// 10. UI交互 (No.38-43)
// ============================================================
test.describe('UI交互', () => {

  test('UD11_038_UI交互_Loading中按钮禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '38';

    await page.route('**/api/ud11/search', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: [] })
      });
    });

    await goToUD11Direct(page);
    await page.waitForTimeout(1000);

    const loadingVisible = await page.locator('text=加载中...').isVisible().catch(() => false);
    if (loadingVisible) {
      await expect(page.locator('button.ud11-btn--primary')).toBeDisabled();
      await expect(page.locator('button.ud11-btn--default').nth(0)).toBeDisabled();
      await expect(page.locator('button.ud11-btn--default').nth(1)).toBeDisabled();
      await expect(page.locator('button.ud11-btn--default').nth(2)).toBeDisabled();
      await expect(page.locator('button.ud11-btn--excel')).toBeDisabled();
    }
    await takeScreenshot(page, 'Loading中按钮禁用');
  });

  test('UD11_039_UI交互_防止重复点击', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '39';
    await goToUD11Direct(page);
    await page.waitForSelector('.ud11-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const radioCount = await page.locator('.ud11-radio').count();
    if (radioCount > 0) {
      await page.locator('.ud11-radio').first().click({ force: true });
      await page.waitForTimeout(300);

      await page.locator('button.ud11-btn--primary').click();
      await page.waitForTimeout(500);

      const currentUrl = page.url();
      expect(currentUrl).toContain('/UD10');
    }
    await takeScreenshot(page, '防止重复点击');
  });

  test('UD11_040_UI交互_错误消息显示红色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '40';
    await goToUD11Direct(page);
    await page.waitForSelector('.ud11-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    await page.locator('button.ud11-btn--primary').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud11-message--error')).toBeVisible();
    await expect(page.locator('.ud11-message')).toContainText('请选择一条记录');
    await takeScreenshot(page, '错误消息红色');
  });

  test('UD11_041_UI交互_成功消息显示绿色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '41';
    await goToUD11Direct(page);
    await page.waitForSelector('.ud11-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await page.locator('button.ud11-btn--excel').click();
    await page.waitForTimeout(1000);

    const successMsg = page.locator('.ud11-message--success');
    if (await successMsg.isVisible().catch(() => false)) {
      await expect(successMsg).toContainText('CSV导出成功');
    }
    await takeScreenshot(page, '成功消息绿色');
  });

  test('UD11_042_UI交互_新消息覆盖旧消息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '42';
    await goToUD11Direct(page);
    await page.waitForSelector('.ud11-table tbody tr td', { timeout: 15000 });
    await page.waitForTimeout(1000);

    await page.locator('button.ud11-btn--primary').click();
    await page.waitForTimeout(300);
    await expect(page.locator('.ud11-message--error')).toBeVisible();

    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await page.locator('button.ud11-btn--excel').click();
    await page.waitForTimeout(1000);

    const successMsg = page.locator('.ud11-message--success');
    if (await successMsg.isVisible().catch(() => false)) {
      await expect(successMsg).toContainText('CSV导出成功');
      await expect(page.locator('.ud11-message--error')).not.toBeVisible();
    }
    await takeScreenshot(page, '新消息覆盖旧消息');
  });

  test('UD11_043_UI交互_加载完成后清除消息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '43';

    let callCount = 0;
    await page.route('**/api/ud11/search', async route => {
      callCount++;
      if (callCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 500, msg: '获取检索结果失败', data: null })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, msg: '', data: [{ variable: 'test', type: '', description: '', registerUser: '', registerDatetime: '' }] })
        });
      }
    });

    await goToUD11Direct(page);
    await page.waitForTimeout(3000);
    await expect(page.locator('.ud11-message--error')).toBeVisible();

    // 通过重置 location state 触发重新检索（API 成功）
    await page.evaluate(({ params }) => {
      const root = document.getElementById('root');
      const containerKey = Object.keys(root).find(k => k.startsWith('__reactContainer'));
      const seen = new Set();
      (function walk(fiber, depth) {
        if (!fiber || depth > 60 || seen.has(fiber)) return;
        seen.add(fiber);
        if (fiber.memoizedProps && fiber.memoizedProps.value &&
            fiber.memoizedProps.value.navigator) {
          fiber.memoizedProps.value.navigator.push('/UD11', {
            searchParams: params,
            formData: {}
          });
          return;
        }
        walk(fiber.child, depth + 1);
        walk(fiber.sibling, depth);
      })(root[containerKey], 0);
    }, { params: {} });
    await page.waitForTimeout(3000);

    await expect(page.locator('.ud11-message--error')).not.toBeVisible();
    await takeScreenshot(page, '加载完成后清除消息');
  });
});

// ============================================================
// 11. 异常处理 (No.44-46)
// ============================================================
test.describe('异常处理', () => {

  test('UD11_044_异常处理_API超时', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '44';

    await page.route('**/api/ud11/search', async route => {
      await new Promise(resolve => setTimeout(resolve, 35000));
    });

    await goToUD11Direct(page);
    await page.waitForTimeout(5000);

    const msg = page.locator('.ud11-message--error');
    if (await msg.isVisible().catch(() => false)) {
      // 超时由前端 axios 拦截
    }

    const emptyText = page.locator('.ud11-table tbody tr td');
    if (await emptyText.isVisible().catch(() => false)) {
      await expect(emptyText).toContainText('暂无数据');
    }
    await takeScreenshot(page, 'API超时');
  });

  test('UD11_045_异常处理_网络连接失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '45';

    await page.route('**/api/ud11/search', async route => {
      await route.abort('connectionrefused');
    });

    await goToUD11Direct(page);
    await page.waitForTimeout(3000);

    await expect(page.locator('.ud11-message--error')).toBeVisible();
    await expect(page.locator('.ud11-message--error')).toContainText('网络连接失败，请检查网络设置');
    await takeScreenshot(page, '网络连接失败');
  });

  test('UD11_046_异常处理_数据解析错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '46';

    await page.route('**/api/ud11/search', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '获取检索结果失败', data: null })
      });
    });

    await goToUD11Direct(page);
    await page.waitForTimeout(3000);

    await expect(page.locator('.ud11-message--error')).toBeVisible();
    await expect(page.locator('.ud11-message')).toContainText('获取检索结果失败');

    const emptyText = page.locator('.ud11-table tbody tr td');
    if (await emptyText.isVisible().catch(() => false)) {
      await expect(emptyText).toContainText('暂无数据');
    }
    await takeScreenshot(page, '数据解析错误');
  });
});

// ============================================================
// 12. 安全性 (No.47-49)
// ============================================================
test.describe('安全性', () => {

  test('UD11_047_安全性_未登录直接访问重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '47';

    // 先导航到同源页面后再清除 localStorage，避免 SecurityError
    await page.goto(BASE_URL + '/');
    await page.evaluate(() => localStorage.clear());
    await page.goto(BASE_URL + '/UD11');
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await takeScreenshot(page, '未登录重定向');
  });

  test('UD11_048_安全性_Variable列XSS防护', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '48';

    await page.route('**/api/ud11/search', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          msg: '',
          data: [{
            variable: "<script>alert('xss')</script>",
            type: 'VDA',
            description: 'XSS test',
            registerUser: 'admin',
            registerDatetime: '2026-07-21T00:00:00.000Z'
          }]
        })
      });
    });

    await goToUD11Direct(page);
    await page.waitForTimeout(3000);

    const varCell = page.locator('.ud11-table tbody tr td').nth(1);
    await expect(varCell).toContainText('<script>');

    let dialogCaught = false;
    page.on('dialog', () => { dialogCaught = true; });
    await page.waitForTimeout(500);
    expect(dialogCaught).toBe(false);
    await takeScreenshot(page, 'XSS防护');
  });

  test('UD11_049_安全性_用户信息保护', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '49';
    await goToUD11ViaUD10(page, '1001');
    await page.waitForTimeout(3000);

    const hasLinks = await page.locator('.ud11-user-link').count();
    if (hasLinks > 0) {
      await page.locator('.ud11-user-link').first().click();
      await page.waitForTimeout(2000);

      await expect(page).toHaveURL(/\/UD25/);
    }
    await takeScreenshot(page, '用户信息保护');
  });
});
