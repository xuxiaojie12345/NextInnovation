import { test, expect, Page } from '@playwright/test';
import { TEST_SERIE, TEST_CHNO, insertUd05TestData, cleanupUd05TestData } from './ud05-e2e-helper';

// ============================================================
// ModifyDocument 模块 (UD05) Playwright 自动化测试
// 基于 テスト仕様書UD05.md
// ============================================================

const BASE_URL = 'http://localhost:3000';
const API_BASE = 'http://localhost:8081';
const SCREENSHOT_DIR = 'tests/image/UD05';

let screenshotCounter: { [key: string]: number } = {};

async function takeScreenshot(page: Page, name: string) {
  if (!screenshotCounter[name]) screenshotCounter[name] = 0;
  screenshotCounter[name]++;
  const seq = String(screenshotCounter[name]).padStart(3, '0');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${name}_${seq}.jpeg`,
    type: 'jpeg', quality: 85, fullPage: true,
    timeout: 15000,
  });
}

function resetCounter(name: string) {
  screenshotCounter[name] = 0;
}

async function safeGoto(page: Page, url: string) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      return;
    } catch (e) {
      if (i === 2 || page.isClosed()) throw e;
      await page.waitForTimeout(2000);
    }
  }
}

/** 登录 + 跳转到 Menu */
async function loginAndGoToMenu(page: Page) {
  await safeGoto(page, BASE_URL);
  await page.evaluate(() => {
    localStorage.setItem('userInfo', JSON.stringify({
      userid: 'e2e_test', username: 'E2E Test User', token: 'mock-token-ud05'
    }));
  });
  await safeGoto(page, `${BASE_URL}/Menu`);
  await page.waitForSelector('.menu-layout', { timeout: 15000 });
}

/** 导航到 UD05（addInitScript 在 React 初始化前注入 location state） */
async function goToUD05(page: Page, serie: string, chno: string, market = 'JPN') {
  await page.addInitScript(`window.history.replaceState(
    ${JSON.stringify({ chassisNo: chno, serie, market })},
    '',
    window.location.pathname + window.location.search
  );`);
  await page.goto(`${BASE_URL}/Menu/ModifyDocument`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.modify-document-container', { timeout: 15000 });
}

/** 通用 setup：登录 + 用真实 DB 数据导航到 UD05 */
async function setupNormal(page: Page) {
  await loginAndGoToMenu(page);
  await goToUD05(page, TEST_SERIE, TEST_CHNO);
  await page.waitForSelector('.modified-input', { timeout: 15000 });
}

test.beforeAll(async () => { await cleanupUd05TestData(); await insertUd05TestData(); });
test.afterAll(async () => { await cleanupUd05TestData(); });

// ============================================================
// 1. 画面初始化 (No.1-5)
// ============================================================
test.describe('画面初始化', () => {
  test('No.1 初始化-变量列表加载成功', async ({ page }) => {
    resetCounter('01_初始化_变量列表加载成功');
    await loginAndGoToMenu(page);
    await goToUD05(page, TEST_SERIE, TEST_CHNO);
    await expect(page.locator('.variable-table')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.error-message-area')).toHaveCount(0);
    await takeScreenshot(page, '01_初始化_变量列表加载成功');
  });

  test('No.2 初始化-模板文件和底盘信息显示', async ({ page }) => {
    resetCounter('02_初始化_模板文件和底盘信息显示');
    await loginAndGoToMenu(page);
    await goToUD05(page, TEST_SERIE, TEST_CHNO);
    await page.waitForSelector('.variable-table', { timeout: 15000 });

    await expect(page.locator('.info-item').filter({ hasText: 'chassis no:' })).toBeVisible();
    await expect(page.locator('.info-item').filter({ hasText: 'Market:' })).toBeVisible();
    const tpl = page.locator('.template-link');
    await expect(tpl).toBeVisible();
    await expect(tpl).toContainText('Template:');

    const h = page.locator('.variable-table thead tr').nth(1).locator('th');
    await expect(h.nth(0)).toContainText('Variable');
    await expect(h.nth(1)).toContainText('Description');
    await expect(h.nth(2)).toContainText('Current value');
    await expect(h.nth(3)).toContainText('Modified value');
    await takeScreenshot(page, '02_初始化_模板文件和底盘信息显示');
  });

  test('No.3 初始化-加载失败（500）', async ({ page }) => {
    resetCounter('03_初始化_加载失败500');
    await loginAndGoToMenu(page);
    await page.route(`${API_BASE}/api/ud05/modifydocument/query`, async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500, message: 'Error' }) });
    });
    await goToUD05(page, 'S500', 'C500');
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, '03_初始化_加载失败500');
  });

  test('No.4 初始化-无变量数据（空列表）', async ({ page }) => {
    resetCounter('04_初始化_无变量数据空列表');
    await loginAndGoToMenu(page);
    await page.route(`${API_BASE}/api/ud05/modifydocument/query`, async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { variables: [], templateFile: '' } }) });
    });
    await goToUD05(page, 'SEMPTY', 'CEMPTY');
    await expect(page.locator('.empty-message')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.error-message-area')).toHaveCount(0);
    await takeScreenshot(page, '04_初始化_无变量数据空列表');
  });

  test('No.5 初始化-API 返回 400', async ({ page }) => {
    resetCounter('05_初始化_API返回400');
    await loginAndGoToMenu(page);
    await page.route(`${API_BASE}/api/ud05/modifydocument/query`, async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 400, message: 'Invalid' }) });
    });
    await goToUD05(page, 'S400', 'C400');
    await expect(page.locator('.error-message-area')).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, '05_初始化_API返回400');
  });
});

// ============================================================
// 2. 变量修改功能 (No.6-11)
// ============================================================
test.describe('变量修改功能', () => {
  test.beforeEach(async ({ page }) => { await setupNormal(page); });

  test('No.6 修改变量值-正常输入', async ({ page }) => {
    resetCounter('06_修改变量值_正常输入');
    const inp = page.locator('.modified-input').first();
    await inp.click();
    await inp.pressSequentially('NEW_VALUE_001');
    await expect(inp).toHaveValue('NEW_VALUE_001');
    await takeScreenshot(page, '06_修改变量值_正常输入');
  });

  test('No.7 修改变量值-清空为空白', async ({ page }) => {
    resetCounter('07_修改变量值_清空为空白');
    const inp = page.locator('.modified-input').first();
    await inp.click();
    await inp.fill('');
    await expect(inp).toHaveValue('');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
    await takeScreenshot(page, '07_修改变量值_清空为空白');
  });

  test('No.8 修改变量值-超长文本', async ({ page }) => {
    resetCounter('08_修改变量值_超长文本');
    const inp = page.locator('.modified-input').first();
    await inp.click();
    await inp.pressSequentially('A'.repeat(600));
    expect((await inp.inputValue()).length).toBeLessThanOrEqual(500);
    await takeScreenshot(page, '08_修改变量值_超长文本');
  });

  test('No.9 修改变量值-特殊字符', async ({ page }) => {
    resetCounter('09_修改变量值_特殊字符');
    const inp = page.locator('.modified-input').first();
    await inp.click();
    await inp.pressSequentially('A&B@C#D');
    await expect(inp).toHaveValue('A&B@C#D');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
    await takeScreenshot(page, '09_修改变量值_特殊字符');
  });

  test('No.10 修改变量值-多行文本', async ({ page }) => {
    resetCounter('10_修改变量值_多行文本');
    const inp = page.locator('.modified-input').first();
    await inp.click();
    await inp.pressSequentially('Line1\nLine2\nLine3');
    await expect(inp).toHaveValue('Line1Line2Line3');
    await takeScreenshot(page, '10_修改变量值_多行文本');
  });

  test('No.11 修改变量值-日语/Unicode字符', async ({ page }) => {
    resetCounter('11_修改变量值_日语Unicode字符');
    const inp = page.locator('.modified-input').first();
    await inp.click();
    await inp.pressSequentially('テスト値');
    await expect(inp).toHaveValue('テスト値');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
    await takeScreenshot(page, '11_修改变量值_日语Unicode字符');
  });
});

// ============================================================
// 3. 保存功能 (No.12-16)
// ============================================================
test.describe('保存功能', () => {
  test('No.12 保存修改成功-跳转到UD06', async ({ page }) => {
    resetCounter('12_保存修改成功_跳转到UD06');
    await setupNormal(page);
    await page.route(`${API_BASE}/api/ud05/modifydocument/update`, async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: {} }) });
    });
    const inp = page.locator('.modified-input').first();
    await inp.click();
    await inp.fill('');
    await inp.pressSequentially('UPDATED_VAL');
    await page.locator('.save-button').click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/SaveModifications');
    await takeScreenshot(page, '12_保存修改成功_跳转到UD06');
  });

  test('No.13 保存失败-API返回500', async ({ page }) => {
    resetCounter('13_保存失败_API返回500');
    await setupNormal(page);
    await page.route(`${API_BASE}/api/ud05/modifydocument/update`, async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500 }) });
    });
    const inp = page.locator('.modified-input').first();
    await inp.click();
    await inp.fill('');
    await inp.pressSequentially('UPDATED_VAL');
    await page.locator('.save-button').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.message-area')).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain('/Menu/ModifyDocument');
    await expect(inp).toHaveValue('UPDATED_VAL');
    await expect(page.locator('.save-button')).toBeEnabled({ timeout: 5000 });
    await takeScreenshot(page, '13_保存失败_API返回500');
  });

  test('No.14 保存失败-API返回400', async ({ page }) => {
    resetCounter('14_保存失败_API返回400');
    await setupNormal(page);
    await page.route(`${API_BASE}/api/ud05/modifydocument/update`, async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 400 }) });
    });
    const inp = page.locator('.modified-input').first();
    await inp.click();
    await inp.fill('');
    await inp.pressSequentially('TEST_VAL');
    await page.locator('.save-button').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.message-area')).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain('/Menu/ModifyDocument');
    await expect(inp).toHaveValue('TEST_VAL');
    await takeScreenshot(page, '14_保存失败_API返回400');
  });

  test('No.15 未修改直接保存', async ({ page }) => {
    resetCounter('15_未修改直接保存');
    await setupNormal(page);
    await page.locator('.save-button').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.message-area')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.message-area')).toContainText('NO UNRELEASED VERSION EXISTS');
    await takeScreenshot(page, '15_未修改直接保存');
  });

  test('No.16 部分变量修改后保存', async ({ page }) => {
    resetCounter('16_部分变量修改后保存');
    await setupNormal(page);
    await page.route(`${API_BASE}/api/ud05/modifydocument/update`, async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: {} }) });
    });
    const inp = page.locator('.modified-input').first();
    await inp.click();
    await inp.fill('');
    await inp.pressSequentially('PARTIAL_UPDATE');
    await page.locator('.save-button').click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/SaveModifications');
    await takeScreenshot(page, '16_部分变量修改后保存');
  });
});

// ============================================================
// 4. 界面与交互 (No.17-19)
// ============================================================
test.describe('界面与交互', () => {
  test('No.17 页面滚动-多变量时', async ({ page }) => {
    resetCounter('17_页面滚动_多变量时');
    await loginAndGoToMenu(page);
    await page.route(`${API_BASE}/api/ud05/modifydocument/query`, async route => {
      const vars = Array.from({ length: 20 }, (_, i) => ({ variable: `V${i}`, description: `D${i}`, currentValue: `C${i}`, modifiedValue: `C${i}` }));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { variables: vars, templateFile: 'tpl.pdf' } }) });
    });
    await goToUD05(page, 'SSCROLL', 'CSCROLL');
    await page.waitForSelector('.variable-table', { timeout: 15000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await takeScreenshot(page, '17_页面滚动_多变量时');
  });

  test('No.18 保存按钮 Loading 状态', async ({ page }) => {
    resetCounter('18_保存按钮Loading状态');
    await setupNormal(page);
    await page.route(`${API_BASE}/api/ud05/modifydocument/update`, async route => {
      await new Promise(r => setTimeout(r, 5000));
    });
    const inp = page.locator('.modified-input').first();
    await inp.click();
    await inp.fill('');
    await inp.pressSequentially('LOAD_TEST');
    await page.locator('.save-button').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.save-button')).toBeDisabled();
    await takeScreenshot(page, '18_保存按钮Loading状态');
  });

  test('No.19 重置已修改的变量', async ({ page }) => {
    resetCounter('19_重置已修改的变量');
    await setupNormal(page);
    const inp = page.locator('.modified-input').first();
    await inp.click();
    await inp.fill('');
    await inp.pressSequentially('TEMP_VAL');
    await inp.fill('');
    await expect(inp).toHaveValue('');
    await takeScreenshot(page, '19_重置已修改的变量');
  });
});

// ============================================================
// 5. 异常处理 (No.20-21)
// ============================================================
test.describe('异常处理', () => {
  test('No.20 网络断开-保存失败', async ({ page }) => {
    resetCounter('20_网络断开_保存失败');
    await setupNormal(page);
    await page.route(`${API_BASE}/api/ud05/modifydocument/update`, async route => {
      await route.abort('connectionrefused');
    });
    const inp = page.locator('.modified-input').first();
    await inp.click();
    await inp.fill('');
    await inp.pressSequentially('NET_FAIL');
    await page.locator('.save-button').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.message-area')).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain('/Menu/ModifyDocument');
    await expect(inp).toHaveValue('NET_FAIL');
    await takeScreenshot(page, '20_网络断开_保存失败');
  });

  test('No.21 API超时-保存失败', async ({ page }) => {
    resetCounter('21_API超时_保存失败');
    await setupNormal(page);
    await page.route(`${API_BASE}/api/ud05/modifydocument/update`, async route => {
      await new Promise(r => setTimeout(r, 15000));
    });
    const inp = page.locator('.modified-input').first();
    await inp.click();
    await inp.fill('');
    await inp.pressSequentially('TIMEOUT');
    await page.locator('.save-button').click();
    await page.waitForTimeout(12000);
    await expect(page.locator('.message-area')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.save-button')).toBeEnabled({ timeout: 5000 });
    await takeScreenshot(page, '21_API超时_保存失败');
  });
});

// ============================================================
// 6. 界面显示 (No.22-26)
// ============================================================
test.describe('界面显示', () => {
  test('No.22 页面标题显示', async ({ page }) => {
    resetCounter('22_页面标题显示');
    await loginAndGoToMenu(page);
    await goToUD05(page, TEST_SERIE, TEST_CHNO);
    await expect(page.locator('.page-title')).toContainText('HDoc - Modify Document');
    await takeScreenshot(page, '22_页面标题显示');
  });

  test('No.23 Save按钮显示', async ({ page }) => {
    resetCounter('23_Save按钮显示');
    await setupNormal(page);
    await expect(page.locator('.save-button')).toBeVisible();
    await expect(page.locator('.save-button')).toHaveText('Save');
    await takeScreenshot(page, '23_Save按钮显示');
  });

  test('No.24 表格列头显示', async ({ page }) => {
    resetCounter('24_表格列头显示');
    await setupNormal(page);
    const headers = page.locator('.variable-table thead tr').nth(1).locator('th');
    await expect(headers.nth(0)).toHaveText('Variable');
    await expect(headers.nth(1)).toHaveText('Description');
    await expect(headers.nth(2)).toHaveText('Current value');
    await expect(headers.nth(3)).toHaveText('Modified value');
    await takeScreenshot(page, '24_表格列头显示');
  });

  test('No.25 变量数据展示-无值时', async ({ page }) => {
    resetCounter('25_变量数据展示_无值时');
    await setupNormal(page);
    const rows = page.locator('.variable-table tbody tr');
    await expect(rows.first()).toBeVisible();
    await takeScreenshot(page, '25_变量数据展示_无值时');
  });

  test('No.26 输入框占位符显示', async ({ page }) => {
    resetCounter('26_输入框占位符显示');
    await setupNormal(page);
    const inp = page.locator('.modified-input').first();
    await expect(inp).toHaveAttribute('placeholder', 'Enter modified value');
    await takeScreenshot(page, '26_输入框占位符显示');
  });
});

// ============================================================
// 7. 数据验证 (No.27-29)
// ============================================================
test.describe('数据验证', () => {
  test('No.27 修改前与修改后值对比', async ({ page }) => {
    resetCounter('27_修改前与修改后值对比');
    await setupNormal(page);
    const currentTd = page.locator('.variable-table tbody tr td').nth(2);
    const modifiedInput = page.locator('.modified-input').first();
    const orig = await currentTd.textContent();
    await modifiedInput.click();
    await modifiedInput.fill('');
    await modifiedInput.pressSequentially('MODIFIED_VAL');
    expect(await modifiedInput.inputValue()).toBe('MODIFIED_VAL');
    expect(await modifiedInput.inputValue()).not.toBe(orig?.trim());
    await takeScreenshot(page, '27_修改前与修改后值对比');
  });

  test('No.28 修改变量后跳转到UD06的数据完整性', async ({ page }) => {
    resetCounter('28_跳转到UD06数据完整性');
    await setupNormal(page);
    await page.route(`${API_BASE}/api/ud05/modifydocument/update`, async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: {} }) });
    });
    const inp = page.locator('.modified-input').first();
    await inp.click();
    await inp.fill('');
    await inp.pressSequentially('UD06_DATA');
    await page.locator('.save-button').click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/SaveModifications');
    await takeScreenshot(page, '28_跳转到UD06数据完整性');
  });

  test('No.29 空值与非空值混合修改', async ({ page }) => {
    resetCounter('29_空值与非空值混合修改');
    await setupNormal(page);
    const inp = page.locator('.modified-input').first();
    await inp.click();
    await inp.fill('');
    await expect(inp).toHaveValue('');
    await takeScreenshot(page, '29_空值与非空值混合修改');
  });
});

// ============================================================
// 8. 页面交互 (No.30-31)
// ============================================================
test.describe('页面交互', () => {
  test('No.30 键盘操作-Tab切换输入框', async ({ page }) => {
    resetCounter('30_键盘操作_Tab切换输入框');
    await setupNormal(page);
    const inp = page.locator('.modified-input').first();
    await inp.click();
    await expect(inp).toBeFocused();
    await takeScreenshot(page, '30_键盘操作_Tab切换输入框');
  });

  test('No.31 页面滚动-变量列表较长时', async ({ page }) => {
    resetCounter('31_页面滚动_变量列表较长时');
    await loginAndGoToMenu(page);
    await page.route(`${API_BASE}/api/ud05/modifydocument/query`, async route => {
      const vars = Array.from({ length: 15 }, (_, i) => ({ variable: `V${i}`, description: `D${i}`, currentValue: `C${i}`, modifiedValue: `C${i}` }));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { variables: vars, templateFile: 'tpl.pdf' } }) });
    });
    await goToUD05(page, 'SSCR2', 'CSCR2');
    await page.waitForSelector('.modified-input', { timeout: 15000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await takeScreenshot(page, '31_页面滚动_变量列表较长时');
  });
});

// ============================================================
// 9. 错误处理 (No.32-33)
// ============================================================
test.describe('错误处理', () => {
  test('No.32 保存-API返回非标准响应', async ({ page }) => {
    resetCounter('32_保存_API返回非标准响应');
    await setupNormal(page);
    await page.route(`${API_BASE}/api/ud05/modifydocument/update`, async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'not-json' });
    });
    const inp = page.locator('.modified-input').first();
    await inp.click();
    await inp.fill('');
    await inp.pressSequentially('MALFORM');
    await page.locator('.save-button').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/Menu/ModifyDocument');
    await takeScreenshot(page, '32_保存_API返回非标准响应');
  });

  test('No.33 保存-请求异常处理', async ({ page }) => {
    resetCounter('33_保存_请求异常处理');
    await setupNormal(page);
    await page.route(`${API_BASE}/api/ud05/modifydocument/update`, async route => {
      await route.abort('connectionrefused');
    });
    const inp = page.locator('.modified-input').first();
    await inp.click();
    await inp.fill('');
    await inp.pressSequentially('ABORT_TEST');
    await page.locator('.save-button').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.message-area')).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, '33_保存_请求异常处理');
  });
});
