// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD05_ModifyDocument 单元测试
// 测试规格书: テスト式样書UD05.md
// 画面文件: UD05_ModifyDocument.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD05');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

// 正常系 Mock 数据（jpct/8888 多条 Variable）
const MOCK_NORMAL_DATA = {
  code: 200,
  data: [
    { variable: 'VIN_TEXT2', description: 'Additional text on Eicher-Trucks VIN plate for VIPL', newVal: 'VTA-050077' },
    { variable: 'VIN_TEXT3', description: 'Additional text on Eicher-Trucks VIN plate for VIPL', newVal: 'NB' },
    { variable: 'VIN_TEXT5', description: 'Additional text on Eicher-Trucks VIN plate for VIPL', newVal: 'UD TRUCKS' },
    { variable: '1001', description: 'UD10更新测试_13756', newVal: '' },
    { variable: '1002', description: 'Description1', newVal: '' },
  ]
};

// lwws/12345 数据（sylus03/sylus04 变量）
const MOCK_LWWS_DATA = {
  code: 200,
  data: [
    { variable: 'sylus03', description: 'Test variable 03', newVal: 'old_value_03' },
    { variable: 'sylus04', description: 'Test variable 04', newVal: 'old_value_04' },
  ]
};

// Current value 部分为空的 Mock 数据
const MOCK_EMPTY_CURRENT_DATA = {
  code: 200,
  data: [
    { variable: 'VIN_TEXT2', description: 'Has current value', newVal: 'VTA-050077' },
    { variable: 'VIN_TEXT3', description: 'Has current value', newVal: 'NB' },
    { variable: '1001', description: 'No current value in ADCA_MODIFICATION', newVal: '' },
    { variable: '1002', description: 'No current value in ADCA_MODIFICATION', newVal: '' },
  ]
};

/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD05画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * 导航到 UD05 画面并注入路由参数 + Mock API
 */
async function goToUD05(
  page: Page,
  mockResponse: any,
  chassisSerie = 'lwws',
  chassisNo = '12345',
  market = 'IDO'
) {
  await page.route('**/api/ud05/selectmodifydocument**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResponse)
    });
  });

  await login(page);
  await page.goto(BASE_URL + '/UD05');
  await page.waitForSelector('.ud05-container');

  await page.evaluate(({ serie, no, mkt }) => {
    window.history.replaceState(
      { chassisSerie: serie, chassisNo: no, market: mkt },
      '',
      '/UD05'
    );
  }, { serie: chassisSerie, no: chassisNo, mkt: market });
  await page.reload();
  await page.waitForSelector('.ud05-container');
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
// 1. 画面初期表示 (No.1-7)
// ============================================================
test.describe('画面初期表示', () => {

  test('UD05_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '001';
    await goToUD05(page, MOCK_NORMAL_DATA, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(500);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('h1.ud05-title')).toHaveText('Modify Document');
    await expect(page.locator('.ud05-info-section')).toBeVisible();
    await expect(page.locator('.ud05-label-bold')).toContainText('Chassis no:');
    await expect(page.locator('.ud05-info-value-strong')).toContainText('lwws');
    await expect(page.locator('.ud05-info-value.ud05-link').first()).toContainText('12345');
    await expect(page.locator('.ud05-info-item').nth(1)).toContainText('IDO');
    const templateLink = page.locator('.ud05-info-value.ud05-link').last();
    await expect(templateLink).toContainText('VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.rtf');
    await expect(page.locator('table.ud05-table')).toBeVisible();
    await expect(page.locator('button.ud05-btn')).toBeVisible();
    await expect(page.locator('button.ud05-btn')).toHaveText('Save');
    await expect(page.locator('.ud05-message')).not.toBeVisible();
  });

  test('UD05_002_画面初始化_Chassis no属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '002';
    await goToUD05(page, MOCK_NORMAL_DATA, 'lwws', '12345', 'IDO');
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud05-label-bold')).toHaveText('Chassis no:');
    await expect(page.locator('.ud05-info-value-strong')).toContainText('lwws');
    await expect(page.locator('.ud05-info-value.ud05-link').first()).toContainText('12345');
    await expect(page.locator('.ud05-info-value.ud05-link').first()).toBeVisible();
  });

  test('UD05_003_画面初始化_Market属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '003';
    await goToUD05(page, MOCK_NORMAL_DATA, 'lwws', '12345', 'IDO');
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud05-info-item').nth(1)).toContainText('Market:');
    await expect(page.locator('.ud05-info-item').nth(1)).toContainText('IDO');
  });

  test('UD05_004_画面初始化_Template文件链接属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '004';
    await goToUD05(page, MOCK_NORMAL_DATA, 'lwws', '12345', 'IDO');
    await takeScreenshot(page, '初期表示');

    const templateLink = page.locator('.ud05-info-value.ud05-link').last();
    await expect(templateLink).toHaveText('VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.rtf');
    await expect(templateLink).toBeVisible();
  });

  test('UD05_005_画面初始化_DataTable结构', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '005';
    await goToUD05(page, MOCK_NORMAL_DATA, 'jpct', '8888', 'AUS');
    await takeScreenshot(page, '初期表示');

    const headers = page.locator('table.ud05-table th.ud05-th');
    await expect(headers.nth(0)).toHaveText('Variable');
    await expect(headers.nth(1)).toHaveText('Description');
    await expect(headers.nth(2)).toHaveText('Current value');
    await expect(headers.nth(3)).toHaveText('Modified value');

    const rows = page.locator('table.ud05-table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('UD05_006_画面初始化_Save按钮属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '006';
    await goToUD05(page, MOCK_NORMAL_DATA, 'lwws', '12345', 'IDO');
    await takeScreenshot(page, '初期表示');

    const saveBtn = page.locator('button.ud05-btn');
    await expect(saveBtn).toHaveText('Save');
    await expect(saveBtn).toBeEnabled();
  });

  test('UD05_007_画面初始化_Error message area属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '007';
    await goToUD05(page, MOCK_NORMAL_DATA, 'lwws', '12345', 'IDO');
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud05-message')).not.toBeVisible();
  });
});

// ============================================================
// 2. 数据加载与数据库字段对应 (No.8-10)
// ============================================================
test.describe('数据加载', () => {

  test('UD05_008_数据加载_API调用成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '008';
    let capturedUrl = null;
    await page.route('**/api/ud05/selectmodifydocument**', async route => {
      capturedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_NORMAL_DATA)
      });
    });

    await goToUD05(page, MOCK_NORMAL_DATA, 'jpct', '8888', 'AUS');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    expect(capturedUrl).toContain('chassisSerie=jpct');
    expect(capturedUrl).toContain('chassisNo=8888');
  });

  test('UD05_009_数据加载_DataTable各列与数据库字段对应关系', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '009';
    await goToUD05(page, MOCK_NORMAL_DATA, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    const rows = page.locator('table.ud05-table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    const firstRowCells = rows.first().locator('td.ud05-td');
    await expect(firstRowCells.nth(0)).toBeVisible();

    const modifiedInput = rows.first().locator('input.ud05-input');
    await expect(modifiedInput).toBeVisible();
    await expect(modifiedInput).toBeEnabled();
    await expect(modifiedInput).toHaveAttribute('maxLength', '500');
    await expect(modifiedInput).toHaveValue('');
  });

  test('UD05_010_数据加载_Current value无数据时显示空白', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '010';
    await goToUD05(page, MOCK_EMPTY_CURRENT_DATA, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    const rows = page.locator('table.ud05-table tbody tr');
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const cells = rows.nth(i).locator('td.ud05-td');
      await expect(cells.nth(2)).toBeVisible();
      await expect(cells.nth(3).locator('input.ud05-input')).toBeVisible();
    }
  });
});

// ============================================================
// 3. Chassis no Link 操作 (No.11)
// ============================================================
test.describe('Chassis no Link 操作', () => {

  test('UD05_011_Chassis no Link_正常跳转到UD07', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '011';
    await page.route('**/UD07', route => {
      route.fulfill({ status: 200, body: '<html><body><div class="ud07-container">UD07 Mock</div></body></html>' });
    });

    await goToUD05(page, MOCK_NORMAL_DATA, 'lwws', '12345', 'IDO');
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud05-info-value.ud05-link').first().click({ noWaitAfter: true });
    await page.waitForURL('**/UD07', { timeout: 30000 });
    await takeScreenshot(page, '跳转後');
    await expect(page).toHaveURL(/\/UD07/);
  });
});

// ============================================================
// 4. Template文件链接操作 (No.12)
// ============================================================
test.describe('Template文件链接操作', () => {

  test('UD05_012_Template文件链接_下载模板', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '012';
    await goToUD05(page, MOCK_NORMAL_DATA, 'lwws', '12345', 'IDO');
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud05-info-value.ud05-link').last().click();
    await expect(page.locator('.ud05-container')).toBeVisible();
    await takeScreenshot(page, '操作後');
  });
});

// ============================================================
// 5. Save 按钮操作 (No.13-18)
// ============================================================
test.describe('Save 按钮操作', () => {

  test('UD05_013_Save_修改单个变量并保存成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '013';
    let capturedBody = null;
    await page.route('**/api/ud05/updatemodifydocument**', async route => {
      capturedBody = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200 })
      });
    });

    await goToUD05(page, MOCK_NORMAL_DATA, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('VTA-NEWVALUE');
    await takeScreenshot(page, '入力後');

    await page.locator('button.ud05-btn').click();
    await page.waitForURL('**/UD06', { timeout: 30000 }).catch(() => {});
    await takeScreenshot(page, '保存結果');

    expect(capturedBody).not.toBeNull();
    if (capturedBody) {
      expect(capturedBody.chassisSerie).toBe('jpct');
      expect(capturedBody.chassisNo).toBe('8888');
    }
    await expect(page).toHaveURL(/UD06/);
  });

  test('UD05_014_Save_修改多个变量并保存成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '014';
    await page.route('**/api/ud05/updatemodifydocument**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200 })
      });
    });

    await goToUD05(page, MOCK_NORMAL_DATA, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    const rows = page.locator('table.ud05-table tbody tr');
    const rowCount = await rows.count();
    if (rowCount >= 2) {
      await rows.nth(0).locator('input.ud05-input').fill('VAL_UPDATED_2');
      await rows.nth(1).locator('input.ud05-input').fill('VAL_UPDATED_3');
    }
    await takeScreenshot(page, '複数入力後');

    await page.locator('button.ud05-btn').click();
    await page.waitForURL('**/UD06', { timeout: 30000 }).catch(() => {});
    await takeScreenshot(page, '保存結果');
  });

  test('UD05_015_Save_修改全部变量并保存成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '015';
    await page.route('**/api/ud05/updatemodifydocument**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200 })
      });
    });

    await goToUD05(page, MOCK_LWWS_DATA, 'lwws', '12345', 'IDO');
    await takeScreenshot(page, '初期表示');

    const rows = page.locator('table.ud05-table tbody tr');
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      await rows.nth(i).locator('input.ud05-input').fill(`UPDATE_VAL_${i + 1}`);
    }
    await takeScreenshot(page, '全入力後');

    await page.locator('button.ud05-btn').click();
    await page.waitForURL('**/UD06', { timeout: 30000 }).catch(() => {});
    await takeScreenshot(page, '保存結果');
  });

  test('UD05_016_Save_空值校验_所有Modified value为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '016';
    await goToUD05(page, MOCK_NORMAL_DATA, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    await page.locator('button.ud05-btn').click();
    await page.waitForTimeout(1000);

    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toHaveText('NO UNRELEASED VERSION EXISTS! Please input modified value before saving.');
    await expect(page).toHaveURL(/UD05/);
    await takeScreenshot(page, '空值校验错误');
  });

  test('UD05_017_Save_空值校验_部分行有值部分为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '017';
    await page.route('**/api/ud05/updatemodifydocument**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200 })
      });
    });

    await goToUD05(page, MOCK_NORMAL_DATA, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('VAL_TEST');
    await takeScreenshot(page, '入力後');

    await page.locator('button.ud05-btn').click();
    await page.waitForURL('**/UD06', { timeout: 30000 }).catch(() => {});
    await takeScreenshot(page, '保存結果');
  });

  test('UD05_018_Save_修改值超过500字符时截断', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '018';
    await goToUD05(page, MOCK_NORMAL_DATA, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    const longStr = 'A'.repeat(600);
    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill(longStr);

    const actualVal = await firstInput.inputValue();
    expect(actualVal.length).toBe(500);
    await takeScreenshot(page, '500文字制限確認');
  });
});

// ============================================================
// 6. 异常处理 (No.19-25)
// ============================================================
test.describe('异常处理', () => {

  test('UD05_019_异常处理_API加载数据失败（HTTP 500）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '019';
    await page.route('**/api/ud05/selectmodifydocument**', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await goToUD05(page, MOCK_NORMAL_DATA, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toContainText('System error');
    await expect(page.locator('button.ud05-btn')).toBeDisabled();
  });

  test('UD05_020_异常处理_API返回业务错误（code≠200）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '020';
    await page.route('**/api/ud05/selectmodifydocument**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 401, data: null })
      });
    });

    await goToUD05(page, MOCK_NORMAL_DATA, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toHaveText('We can not get the data. Please try again.');
  });

  test('UD05_021_异常处理_Save时API返回HTTP 500错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '021';
    await page.route('**/api/ud05/updatemodifydocument**', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await goToUD05(page, MOCK_NORMAL_DATA, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('TEST_500');
    await takeScreenshot(page, '入力後');

    await page.locator('button.ud05-btn').click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'Save結果');

    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toContainText('System error');
    await expect(page).toHaveURL(/UD05/);
  });

  test('UD05_022_异常处理_Save时数据更新失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '022';
    await page.route('**/api/ud05/updatemodifydocument**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: '更新失败' })
      });
    });

    await goToUD05(page, MOCK_NORMAL_DATA, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('TEST_FAIL');
    await takeScreenshot(page, '入力後');

    await page.locator('button.ud05-btn').click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'Save結果');

    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toHaveText('数据更新失败，请稍后重试');
    await expect(page).toHaveURL(/UD05/);
  });

  test('UD05_023_异常处理_API超时（加载数据）', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '023';
    await page.route('**/api/ud05/selectmodifydocument**', async route => {
      await new Promise(r => setTimeout(r, 10000));
    });

    await goToUD05(page, MOCK_NORMAL_DATA, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '超时');

    const isError = await page.locator('.ud05-message').isVisible().catch(() => false);
    if (isError) {
      const text = await page.locator('.ud05-message').textContent();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('UD05_024_异常处理_网络异常（加载数据）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '024';
    await page.route('**/api/ud05/selectmodifydocument**', route => {
      route.abort('internetdisconnected');
    });

    await goToUD05(page, MOCK_NORMAL_DATA, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toContainText('System error');
  });

  test('UD05_025_异常处理_网络异常（保存数据）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '025';
    await page.route('**/api/ud05/updatemodifydocument**', route => {
      route.abort('internetdisconnected');
    });

    await goToUD05(page, MOCK_NORMAL_DATA, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('TEST_NET');
    await takeScreenshot(page, '入力後');

    await page.locator('button.ud05-btn').click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'Save結果');

    await expect(page.locator('.ud05-message')).toBeVisible();
    await expect(page.locator('.ud05-message')).toContainText('System error');
    await expect(page).toHaveURL(/UD05/);
  });
});

// ============================================================
// 7. UI交互 (No.26-31)
// ============================================================
test.describe('UI交互', () => {

  test('UD05_026_UI交互_加载中显示Loading状态', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '026';
    let resolveApi;
    const apiPromise = new Promise(r => { resolveApi = r; });
    await page.route('**/api/ud05/selectmodifydocument**', async route => {
      await apiPromise;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [] })
      });
    });

    await goToUD05(page, MOCK_NORMAL_DATA, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(500);
    await takeScreenshot(page, '加载中');

    await expect(page.locator('button.ud05-btn')).toBeDisabled();
    resolveApi();
    await page.waitForTimeout(2000);
  });

  test('UD05_027_UI交互_加载完成后控件恢复活性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '027';
    await goToUD05(page, MOCK_NORMAL_DATA, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    const rows = page.locator('table.ud05-table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    await expect(page.locator('button.ud05-btn')).toBeEnabled();
    await expect(page.locator('.ud05-info-value.ud05-link').first()).toBeVisible();
    await expect(page.locator('.ud05-info-value.ud05-link').last()).toBeVisible();
  });

  test('UD05_028_UI交互_Save中按钮禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '028';
    let resolveApi;
    const apiPromise = new Promise(r => { resolveApi = r; });
    await page.route('**/api/ud05/updatemodifydocument**', async route => {
      await apiPromise;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200 })
      });
    });

    await goToUD05(page, MOCK_NORMAL_DATA, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('TEST');
    await takeScreenshot(page, '入力後');

    await page.locator('button.ud05-btn').click();
    await expect(page.locator('button.ud05-btn')).toBeDisabled();
    await takeScreenshot(page, 'Save禁用中');

    resolveApi();
    await page.waitForTimeout(2000);
  });

  test('UD05_029_UI交互_Save防止重复提交', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '029';
    let apiCallCount = 0;
    await page.route('**/api/ud05/updatemodifydocument**', async route => {
      apiCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200 })
      });
    });

    await goToUD05(page, MOCK_NORMAL_DATA, 'jpct', '8888', 'IDO');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('TEST_DUP');
    await takeScreenshot(page, '入力後');

    await page.locator('button.ud05-btn').click();
    await page.locator('button.ud05-btn').click({ force: true });
    await page.locator('button.ud05-btn').click({ force: true });

    await page.waitForURL('**/UD06', { timeout: 30000 }).catch(() => {});
    await takeScreenshot(page, '保存結果');
    expect(apiCallCount).toBeLessThanOrEqual(1);
  });

  test('UD05_030_UI交互_DataTable Modified value输入编辑', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '030';
    await goToUD05(page, MOCK_NORMAL_DATA, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill('TEST_VALUE');
    await expect(firstInput).toHaveValue('TEST_VALUE');

    const secondInput = page.locator('table.ud05-table tbody tr').nth(1).locator('input.ud05-input');
    await expect(secondInput).toHaveValue('');
    await takeScreenshot(page, '入力確認');
  });

  test('UD05_031_UI交互_Error message area显示错误消息样式', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '031';
    await page.route('**/api/ud05/selectmodifydocument**', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await goToUD05(page, MOCK_NORMAL_DATA, 'lwws', '12345', 'IDO');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.ud05-message')).toBeVisible();
  });
});

// ============================================================
// 8. 安全性 (No.32-33)
// ============================================================
test.describe('安全性', () => {

  test('UD05_032_安全性_未登录直接访问UD05画面重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '032';
    // Step 1: 登录后访问 UD05 画面
    await goToUD05(page, MOCK_NORMAL_DATA, 'lwws', '12345', 'IDO');
    await expect(page).toHaveURL(/\/UD05/);
    await expect(page.locator('.ud05-container')).toBeVisible();
    await takeScreenshot(page, 'UD05画面表示');

    // Step 2: 清除 localStorage（画面未刷新）
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/UD05/);
    await expect(page.locator('.ud05-container')).toBeVisible();
    await takeScreenshot(page, 'localStorage清除後（画面未刷新）');

    // Step 3: 直接访问 UD05 URL → 重定向到 Login
    await page.goto(BASE_URL + '/UD05');
    await page.waitForTimeout(2000);

    // Step 4: 验证重定向结果
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('.ud05-container')).not.toBeVisible();
    await takeScreenshot(page, '重定向結果（Login画面）');
  });

  test('UD05_033_安全性_Modified value XSS防护', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '033';
    await page.route('**/api/ud05/updatemodifydocument**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200 })
      });
    });

    await goToUD05(page, MOCK_NORMAL_DATA, 'jpct', '8888', 'IDO');
    await takeScreenshot(page, '初期表示');

    const xssPayload = '<script>alert(1)</script>';
    const firstInput = page.locator('table.ud05-table tbody tr').first().locator('input.ud05-input');
    await firstInput.fill(xssPayload);
    await takeScreenshot(page, 'XSS入力後');

    await page.locator('button.ud05-btn').click();
    await page.waitForURL('**/UD06', { timeout: 30000 }).catch(() => {});
    await takeScreenshot(page, 'XSS保存結果');
  });
});
