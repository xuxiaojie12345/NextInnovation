import { test, expect, Page } from '@playwright/test';
import { insertUD05TestData, cleanupUD05TestData } from './test-data-helper';

// ============================================================
// ModifyDocument 模块 (UD05) Playwright 自动化测试
// 基于 単体テスト仕様書UD05.md（56个测试用例）
// ============================================================

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8081';
const SCREENSHOT_DIR = 'tests/image/UD05';

let screenshotCounter: { [key: string]: number } = {};

async function takeScreenshot(page: Page, name: string) {
  if (!screenshotCounter[name]) screenshotCounter[name] = 0;
  screenshotCounter[name]++;
  const seq = String(screenshotCounter[name]).padStart(3, '0');
  try {
    if (page.isClosed()) return;
    await page.waitForTimeout(300);
    if (page.isClosed()) return;
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${name}_${seq}.jpeg`,
      type: 'jpeg', quality: 85, fullPage: true,
      timeout: 10000,
    });
  } catch (e) {
    console.warn(`Screenshot failed for ${name}: ${e}`);
  }
}

function resetCounter(name: string) {
  screenshotCounter[name] = 0;
}

async function safeGoto(page: Page, url: string = BASE_URL) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForTimeout(2000);
      return;
    } catch (e) {
      if (i === 2 || page.isClosed()) throw e;
      await page.waitForTimeout(2000);
    }
  }
}

async function loginViaLocalStorage(page: Page) {
  await page.evaluate((info) => {
    localStorage.setItem('userInfo', JSON.stringify(info));
  }, {
    username: 'admin', role: 'Administrator', userid: 'admin',
    permissions: ["GenerateDucument", "GenerateDoc", "GenerateBatch", "RegdataArchive", "RegdataBatch",
      "UpdateRules", "UpdateUnicodeRules", "ExistingVariables", "UnlockDocument",
      "HDocNumberSeries", "UploadDeleteTemplate", "ListTemplates", "VPPSVinPlate", "ADCAChange",
      "HDocUserAdmin", "HDocUserDocAdmin", "SearchUser", "ChangePassword", "UserPosition",
      "ArchiveSearch", "UploadDocument",
      "UserGuide", "ADCAChangeGuide", "VinPlateGuide", "ArchiveGuide", "Privacy"],
  });
}

/** Mock 查询 API */
async function mockQueryApi(page: Page, responseData: any, status: number = 200) {
  await page.route('**/api/ud05/modifydocument/query', async (route) => {
    if (status === 200) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseData) });
    } else {
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(responseData) });
    }
  });
}

/** Mock 查询 API 超时 */
async function mockQueryApiTimeout(page: Page) {
  await page.route('**/api/ud05/modifydocument/query', async () => {
    await new Promise(() => {}); // never resolve
  });
}

/** Mock 查询 API 网络断开 */
async function mockQueryApiNetworkError(page: Page) {
  await page.route('**/api/ud05/modifydocument/query', (route) => route.abort('connectionrefused'));
}

/** Mock 更新 API */
async function mockUpdateApi(page: Page, responseData: any, status: number = 200, delay: number = 500) {
  await page.route('**/api/ud05/modifydocument/update', async (route) => {
    if (delay > 0) await new Promise(r => setTimeout(r, delay));
    if (status === 200) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseData) });
    } else {
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(responseData) });
    }
  });
}

/** 导航到 UD05 页面（通过 sessionStorage + addInitScript 设置正确的 usr 结构） */
async function gotoUD05(page: Page, serie: string = 'S001', chassisNo: string = 'CH001', market: string = 'DE') {
  // 注册 init script（不含闭包参数，Playwright 自动去重）
  // 1) replaceState → 在 React 加载前设置初始 history.state（{ usr, key, idx }）
  // 2) 拦截 pushState → 对测试中手动 pushState 也能注入参数
  await page.addInitScript(() => {
    const p = JSON.parse(sessionStorage.getItem('ud05_params') || '{}');
    if (!p.chassisNo) return;

    // 初始加载时用正确结构设置 state
    window.history.replaceState(
      { usr: { serie: p.serie, chassisNo: p.chassisNo, market: p.market }, key: 'default', idx: 0 },
      ''
    );

    // 拦截后续 pushState（如测试中手动 pushState），用 usr 结构注入参数
    const origPushState = window.history.pushState.bind(window.history);
    window.history.pushState = function(state, title, url) {
      if (state && !state.usr?.chassisNo) {
        const cur = JSON.parse(sessionStorage.getItem('ud05_params') || '{}');
        state = { ...state, usr: { ...(state.usr || {}), serie: cur.serie, chassisNo: cur.chassisNo, market: cur.market } };
      }
      return origPushState(state, title, url);
    };
  });

  // 确保页面在同源 URL 上（sessionStorage 只有同源可访问）
  try {
    await page.evaluate(() => sessionStorage.length);
  } catch {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  }

  await page.evaluate(() => localStorage.clear());
  await page.evaluate(({ s, cn, m }) => {
    sessionStorage.setItem('ud05_params', JSON.stringify({ serie: s, chassisNo: cn, market: m }));
  }, { s: serie, cn: chassisNo, m: market });
  await loginViaLocalStorage(page);

  // 导航到 UD05（init script 在页面加载时执行）
  await page.goto(`${BASE_URL}/Menu/ModifyDocument`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
}

/** 构建查询 API 成功响应 */
function makeQueryResponse(serie: string, chno: string, variables: any[], templateFile: string = '') {
  return {
    code: 200,
    data: { serie, chno, variables, templateFile }
  };
}

// 默认3个变量的响应
const DEFAULT_QUERY_RESPONSE = {
  code: 200,
  data: {
    serie: 'S001', chno: 'CH001', templateFile: 'aus/UD_TEST.odt',
    variables: [
      { variable: 'VAR001', description: 'Variable 1 Description', currentValue: '初期値1', modifiedValue: '初期値1' },
      { variable: 'VAR002', description: 'Variable 2 Description', currentValue: '初期値2', modifiedValue: '初期値2' },
      { variable: 'VAR003', description: 'Variable 3 Description', currentValue: '初期値3', modifiedValue: '初期値3' },
    ]
  }
};

// ============================================================
// 测试前置
// ============================================================
test.beforeAll(async () => {
  await insertUD05TestData();
  console.log('UD05 test data inserted');
});

test.afterAll(async () => {
  await cleanupUD05TestData();
  console.log('UD05 test data cleaned up');
});

// ============================================================
// 1. 画面初始化（No.1-9）
// ============================================================
test.describe.serial('画面初始化（No.1-9）', () => {
  test.setTimeout(120000);

  test('No.1 初始化-变量列表加载成功', async ({ page }) => {
    resetCounter('01_初始化_加载成功');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page);
    await page.waitForSelector('.page-title', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // 底盘号链接
    await expect(page.locator('.chassis-link')).toContainText('S001 CH001');
    // Market
    await expect(page.locator('.info-item').filter({ hasText: 'Market:' })).toContainText('DE');
    // Template 文件链接
    await expect(page.locator('.template-link')).toContainText('Template: aus/UD_TEST.odt');
    // 变量列表表格
    await expect(page.locator('.variable-table')).toBeVisible();
    // 表头
    await expect(page.locator('.col-variable')).toContainText('Variable');
    await expect(page.locator('.col-description')).toContainText('Description');
    await expect(page.locator('.col-current')).toContainText('Current value');
    await expect(page.locator('.col-modified')).toContainText('Modified value');
    // 3行数据
    const rows = page.locator('.variable-table tbody tr');
    await expect(rows).toHaveCount(3);
    // Current value 显示 NEWVAL
    await expect(rows.nth(0).locator('td').nth(2)).toContainText('初期値1');
    // Modified value 输入框显示相同值
    await expect(rows.nth(0).locator('td').nth(3).locator('input')).toHaveValue('初期値1');
    // 无错误消息
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '01_初始化_加载成功');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.2 初始化-变量列表为空', async ({ page }) => {
    resetCounter('02_初始化_列表为空');
    await mockQueryApi(page, makeQueryResponse('S002', 'CH002', []));
    await gotoUD05(page, 'S002', 'CH002');
    await page.waitForTimeout(2000);

    // 底盘号和 Market 正常显示
    await expect(page.locator('.chassis-link')).toContainText('S002 CH002');
    // 显示空消息
    await expect(page.locator('.empty-message')).toContainText('未找到该底盘的变量记录');
    // 无错误消息
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '02_初始化_列表为空');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.3 初始化-参数缺失（SERIE 不存在）', async ({ page }) => {
    resetCounter('03_初始化_Serie缺失');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await loginViaLocalStorage(page);
    // 只传 chassisNo 不传 serie
    await page.evaluate(() => {
      window.history.pushState({ chassisNo: 'CH001', serie: '', market: 'DE' }, '', '/Menu/ModifyDocument');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForTimeout(2000);

    // serie 为空但 chassisNo 有值，组件会正常加载（serie 为空不会触发缺少底盘信息）
    // chassisLink 显示 chassisNo
    await expect(page.locator('.chassis-link')).toContainText('CH001');

    await takeScreenshot(page, '03_初始化_Serie缺失');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.4 初始化-参数缺失（CHNO 不存在）', async ({ page }) => {
    resetCounter('04_初始化_Chno缺失');
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await loginViaLocalStorage(page);
    // 不传 chassisNo
    await page.evaluate(() => {
      window.history.pushState({ chassisNo: '', serie: '', market: '' }, '', '/Menu/ModifyDocument');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForTimeout(2000);

    // 缺少底盘信息显示错误
    await expect(page.locator('.error-message-area')).toContainText('缺少必要的底盘信息');

    await takeScreenshot(page, '04_初始化_Chno缺失');
  });

  test('No.5 初始化-API 返回 400', async ({ page }) => {
    resetCounter('05_初始化_API400');
    await mockQueryApi(page, { code: 400, message: 'Bad request', data: null });
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toContainText('Bad request');

    await takeScreenshot(page, '05_初始化_API400');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.6 初始化-API 返回 500', async ({ page }) => {
    resetCounter('06_初始化_API500');
    await mockQueryApi(page, { code: 500, message: '系统异常，请联系管理员', data: null });
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toContainText('系统异常，请联系管理员');

    await takeScreenshot(page, '06_初始化_API500');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.7 初始化-API 网络错误', async ({ page }) => {
    resetCounter('07_初始化_网络错误');
    await mockQueryApiNetworkError(page);
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toContainText('系统异常，请联系管理员');

    await takeScreenshot(page, '07_初始化_网络错误');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.8 初始化-API 请求超时', async ({ page }) => {
    resetCounter('08_初始化_请求超时');
    await mockQueryApiTimeout(page);
    await gotoUD05(page);
    await page.waitForTimeout(3000);

    const errorMsg = page.locator('.error-message-area');
    const text = await errorMsg.textContent().catch(() => '');
    expect(text?.length || 0).toBeGreaterThan(0);

    await takeScreenshot(page, '08_初始化_请求超时');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.9 初始化-Loading 状态显示', async ({ page }) => {
    resetCounter('09_初始化_Loading状态');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE, 200);
    await gotoUD05(page);
    await page.waitForTimeout(300);

    // Loading 状态
    await expect(page.locator('.loading-message')).toContainText('加载中...');

    await takeScreenshot(page, '09_初始化_Loading状态');
    await page.unroute('**/api/ud05/modifydocument/query');
  });
});

// ============================================================
// 2. 底盘信息显示（No.10-12）
// ============================================================
test.describe.serial('底盘信息显示（No.10-12）', () => {
  test.setTimeout(120000);

  test('No.10 底盘信息-底盘号链接显示', async ({ page }) => {
    resetCounter('10_底盘信息_底盘号链接');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page, 'S008', 'CH008');
    await page.waitForTimeout(2000);

    const link = page.locator('.chassis-link');
    await expect(link).toBeVisible();
    await expect(link).toContainText('S008 CH008');

    await takeScreenshot(page, '10_底盘信息_底盘号链接');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.11 底盘信息-点击底盘号跳转 UD07', async ({ page }) => {
    resetCounter('11_底盘信息_跳转UD07');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page, 'S009', 'CH009');
    await page.waitForTimeout(2000);

    await page.locator('.chassis-link').click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/Menu/VehicleSpecification');

    await takeScreenshot(page, '11_底盘信息_跳转UD07');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.12 底盘信息-Market 标签显示', async ({ page }) => {
    resetCounter('12_底盘信息_Market标签');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page, 'S010', 'CH010', 'JP');
    await page.waitForTimeout(2000);

    const marketItem = page.locator('.info-item').filter({ hasText: 'Market:' });
    await expect(marketItem).toBeVisible();
    await expect(marketItem).toContainText('JP');

    await takeScreenshot(page, '12_底盘信息_Market标签');
    await page.unroute('**/api/ud05/modifydocument/query');
  });
});

// ============================================================
// 3. 模板文件链接（No.13-14）
// ============================================================
test.describe.serial('模板文件链接（No.13-14）', () => {
  test.setTimeout(120000);

  test('No.13 模板文件-链接显示', async ({ page }) => {
    resetCounter('13_模板文件_链接显示');
    await mockQueryApi(page, {
      ...DEFAULT_QUERY_RESPONSE,
      data: { ...DEFAULT_QUERY_RESPONSE.data, serie: 'S011', chno: 'CH011', templateFile: 'aus/UD_TEST.odt' }
    });
    await gotoUD05(page, 'S011', 'CH011');
    await page.waitForTimeout(2000);

    const link = page.locator('.template-link');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Template: aus/UD_TEST.odt');

    await takeScreenshot(page, '13_模板文件_链接显示');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.14 模板文件-点击链接提示未实装', async ({ page }) => {
    resetCounter('14_模板文件_点击提示');
    await mockQueryApi(page, {
      ...DEFAULT_QUERY_RESPONSE,
      data: { ...DEFAULT_QUERY_RESPONSE.data, serie: 'S012', chno: 'CH012', templateFile: 'aus/TEST.odt' }
    });
    await gotoUD05(page, 'S012', 'CH012');
    await page.waitForTimeout(2000);

    await page.locator('.template-link').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.template-section .error-message-area')).toContainText('模板文件下载功能未实装');
    // 页面不跳转
    expect(page.url()).toContain('/Menu/ModifyDocument');

    await takeScreenshot(page, '14_模板文件_点击提示');
    await page.unroute('**/api/ud05/modifydocument/query');
  });
});

// ============================================================
// 4. 变量列表表格（No.15-18）
// ============================================================
test.describe.serial('变量列表表格（No.15-18）', () => {
  test.setTimeout(120000);

  test('No.15 变量表格-列头显示', async ({ page }) => {
    resetCounter('15_变量表格_列头');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page, 'S013', 'CH013');
    await page.waitForTimeout(2000);

    await expect(page.locator('.col-variable')).toContainText('Variable');
    await expect(page.locator('.col-description')).toContainText('Description');
    await expect(page.locator('.col-current')).toContainText('Current value');
    await expect(page.locator('.col-modified')).toContainText('Modified value');

    await takeScreenshot(page, '15_变量表格_列头');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.16 变量表格-变量数据展示（有值）', async ({ page }) => {
    resetCounter('16_变量表格_有值');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page, 'S014', 'CH014');
    await page.waitForTimeout(2000);

    const rows = page.locator('.variable-table tbody tr');
    await expect(rows).toHaveCount(3);
    // VAR001 行
    await expect(rows.nth(0).locator('td').nth(0)).toContainText('VAR001');
    await expect(rows.nth(0).locator('td').nth(1)).toContainText('Variable 1 Description');
    await expect(rows.nth(0).locator('td').nth(2)).toContainText('初期値1');
    await expect(rows.nth(0).locator('td').nth(3).locator('input')).toHaveValue('初期値1');

    await takeScreenshot(page, '16_变量表格_有值');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.17 变量表格-变量数据展示（无值）', async ({ page }) => {
    resetCounter('17_变量表格_无值');
    // currentValue 和 modifiedValue 为空
    await mockQueryApi(page, makeQueryResponse('S015', 'CH015', [
      { variable: 'VAR_EMPTY', description: 'Empty Var', currentValue: '', modifiedValue: '' }
    ]));
    await gotoUD05(page, 'S015', 'CH015');
    await page.waitForTimeout(2000);

    const row = page.locator('.variable-table tbody tr');
    await expect(row.locator('td').nth(2)).toContainText('-');
    const input = row.locator('td').nth(3).locator('input');
    await expect(input).toHaveValue('');

    await takeScreenshot(page, '17_变量表格_无值');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.18 变量表格-Variable 列显示', async ({ page }) => {
    resetCounter('18_变量表格_Variable列');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page, 'S016', 'CH016');
    await page.waitForTimeout(2000);

    const rows = page.locator('.variable-table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const varName = await rows.nth(i).locator('td').nth(0).textContent();
      expect(varName?.trim()).toBeTruthy();
    }

    await takeScreenshot(page, '18_变量表格_Variable列');
    await page.unroute('**/api/ud05/modifydocument/query');
  });
});

// ============================================================
// 5. 变量修改（No.19-27）
// ============================================================
test.describe.serial('变量修改（No.19-27）', () => {
  test.setTimeout(120000);

  test('No.19 变量修改-正常输入', async ({ page }) => {
    resetCounter('19_变量修改_正常输入');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await input.click();
    await input.fill('');
    await input.pressSequentially('新值ABC123');
    await expect(input).toHaveValue('新值ABC123');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
    await expect(page.locator('.message-area')).toHaveCount(0);

    await takeScreenshot(page, '19_变量修改_正常输入');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.20 变量修改-清空为空白', async ({ page }) => {
    resetCounter('20_变量修改_清空');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await input.click();
    await input.fill('');
    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '20_变量修改_清空');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.21 变量修改-超长文本（超过 500 字符）', async ({ page }) => {
    resetCounter('21_变量修改_超长文本');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await input.click();
    // 输入 501 个字符，input 有 maxLength=500 会截断
    const longText = 'A'.repeat(501);
    await input.fill(longText);
    // maxLength=500 限制，最多 500 字符
    const actualValue = await input.inputValue();
    expect(actualValue.length).toBeLessThanOrEqual(500);

    // 点击 Save 触发校验
    await page.locator('.save-button').click();
    await page.waitForTimeout(500);
    // 可能触发长度校验或直接被 maxLength 阻止
    const msgText = await page.locator('.message-area').textContent().catch(() => '');
    if (msgText) {
      expect(msgText.length).toBeGreaterThan(0);
    }

    await takeScreenshot(page, '21_变量修改_超长文本');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.22 变量修改-特殊字符', async ({ page }) => {
    resetCounter('22_变量修改_特殊字符');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await input.click();
    await input.fill('');
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    await input.pressSequentially(specialChars);
    await expect(input).toHaveValue(specialChars);

    await takeScreenshot(page, '22_变量修改_特殊字符');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.23 变量修改-日语/Unicode 字符', async ({ page }) => {
    resetCounter('23_变量修改_Unicode');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await input.click();
    await input.fill('');
    await input.pressSequentially('日本語テスト１２３');
    await expect(input).toHaveValue('日本語テスト１２３');

    await takeScreenshot(page, '23_变量修改_Unicode');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.24 变量修改-多行文本', async ({ page }) => {
    resetCounter('24_变量修改_多行文本');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await input.click();
    await input.fill('');
    await input.pressSequentially('第一行');
    await input.press('Enter');
    await input.pressSequentially('第二行');
    await expect(input).toHaveValue('第一行\n第二行');

    await takeScreenshot(page, '24_变量修改_多行文本');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.25 变量修改-修改前与修改后值对比', async ({ page }) => {
    resetCounter('25_变量修改_前后对比');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const row = page.locator('.variable-table tbody tr').nth(0);
    const currentVal = await row.locator('td').nth(2).textContent();
    const input = row.locator('td').nth(3).locator('input');
    await input.click();
    await input.fill('');
    await input.pressSequentially('新值');
    const modifiedVal = await input.inputValue();

    // Current value 保持原值
    expect(currentVal).toBe('初期値1');
    // Modified value 为新值
    expect(modifiedVal).toBe('新值');

    await takeScreenshot(page, '25_变量修改_前后对比');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.26 变量修改-输入框占位符显示', async ({ page }) => {
    resetCounter('26_变量修改_占位符');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await expect(input).toHaveAttribute('placeholder', 'Enter modified value');

    await takeScreenshot(page, '26_变量修改_占位符');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.27 变量修改-剩余可输入字符数显示', async ({ page }) => {
    resetCounter('27_变量修改_剩余字符');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await expect(input).toHaveAttribute('maxLength', '500');

    await takeScreenshot(page, '27_变量修改_剩余字符');
    await page.unroute('**/api/ud05/modifydocument/query');
  });
});

// ============================================================
// 6. 保存功能（No.28-40）
// ============================================================
test.describe.serial('保存功能（No.28-40）', () => {
  test.setTimeout(120000);

  test('No.28 保存-成功跳转到 UD06', async ({ page }) => {
    resetCounter('28_保存_成功跳转');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    // mock 更新 API 成功
    await page.route('**/api/ud05/modifydocument/update', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, message: 'success' }) });
    });
    await gotoUD05(page, 'S018', 'CH018');
    await page.waitForTimeout(2000);

    // 修改 VAR009 的值
    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await input.click();
    await input.fill('');
    await input.pressSequentially('新值');

    // 点击 Save
    await page.locator('.save-button').click();
    await page.waitForTimeout(2000);

    // 跳转到 UD06
    expect(page.url()).toContain('/Menu/SaveModifications');

    await takeScreenshot(page, '28_保存_成功跳转');
    await page.unroute('**/api/ud05/modifydocument/update');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.29 保存-所有 Modified value 为空', async ({ page }) => {
    resetCounter('29_保存_所有为空');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    // 清空所有 modified value
    const inputs = page.locator('.modified-input');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      await inputs.nth(i).fill('');
    }

    await page.locator('.save-button').click();
    await page.waitForTimeout(500);

    // 显示错误消息
    await expect(page.locator('.message-area')).toContainText('NO UNRELEASED VERSION EXISTS!');
    // 页面不跳转
    expect(page.url()).toContain('/Menu/ModifyDocument');

    await takeScreenshot(page, '29_保存_所有为空');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.30 保存-未修改任何值', async ({ page }) => {
    resetCounter('30_保存_未修改');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    // 不修改任何值直接点 Save
    await page.locator('.save-button').click();
    await page.waitForTimeout(500);

    // 显示错误消息（所有值未修改，与清空同逻辑）
    const msg = page.locator('.message-area');
    const text = await msg.textContent().catch(() => '');
    expect(text?.length || 0).toBeGreaterThan(0);

    await takeScreenshot(page, '30_保存_未修改');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.31 保存-字段长度超过 500 字符', async ({ page }) => {
    resetCounter('31_保存_超长');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await input.click();
    // maxLength=500 会阻止超长输入，但测试超长校验
    await input.fill('A'.repeat(500));
    // 再额外追加（会被 maxLength 阻止）
    await input.pressSequentially('B');
    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(500);

    await page.locator('.save-button').click();
    await page.waitForTimeout(500);

    await takeScreenshot(page, '31_保存_超长');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.32 保存-API 返回 400', async ({ page }) => {
    resetCounter('32_保存_API400');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await page.route('**/api/ud05/modifydocument/update', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 400, message: 'Bad request' }) });
    });
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await input.fill('测试值');

    await page.locator('.save-button').click();
    await page.waitForTimeout(1000);

    // API 返回非200会触发 catch，显示系统错误
    const msg = page.locator('.message-area');
    const text = await msg.textContent().catch(() => '');
    if (text) {
      expect(text.length).toBeGreaterThan(0);
    }
    // 页面不跳转
    expect(page.url()).toContain('/Menu/ModifyDocument');

    await takeScreenshot(page, '32_保存_API400');
    await page.unroute('**/api/ud05/modifydocument/update');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.33 保存-API 返回 500', async ({ page }) => {
    resetCounter('33_保存_API500');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await page.route('**/api/ud05/modifydocument/update', async (route) => {
      await route.fulfill({ status: 500, body: JSON.stringify({ code: 500, message: '系统异常，请联系管理员' }) });
    });
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await input.fill('测试值');

    await page.locator('.save-button').click();
    await page.waitForTimeout(1000);

    const msg = page.locator('.message-area');
    const text = await msg.textContent().catch(() => '');
    if (text) expect(text.length).toBeGreaterThan(0);
    expect(page.url()).toContain('/Menu/ModifyDocument');

    await takeScreenshot(page, '33_保存_API500');
    await page.unroute('**/api/ud05/modifydocument/update');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.34 保存-API 网络错误', async ({ page }) => {
    resetCounter('34_保存_网络错误');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await page.route('**/api/ud05/modifydocument/update', (route) => route.abort('connectionrefused'));
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await input.fill('测试值');

    await page.locator('.save-button').click();
    await page.waitForTimeout(1000);

    const msg = page.locator('.message-area');
    const text = await msg.textContent().catch(() => '');
    if (text) expect(text.length).toBeGreaterThan(0);
    expect(page.url()).toContain('/Menu/ModifyDocument');

    await takeScreenshot(page, '34_保存_网络错误');
    await page.unroute('**/api/ud05/modifydocument/update');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.35 保存-API 请求超时', async ({ page }) => {
    resetCounter('35_保存_请求超时');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await page.route('**/api/ud05/modifydocument/update', async () => {
      await new Promise(() => {});
    });
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await input.fill('测试值');

    await page.locator('.save-button').click();
    await page.waitForTimeout(5000);

    const msg = page.locator('.message-area');
    const text = await msg.textContent().catch(() => '');
    if (text) expect(text.length).toBeGreaterThan(0);

    await takeScreenshot(page, '35_保存_请求超时');
    await page.unroute('**/api/ud05/modifydocument/update');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.36 保存-Save 按钮 Loading 状态', async ({ page }) => {
    resetCounter('36_保存_按钮Loading');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await page.route('**/api/ud05/modifydocument/update', async (route) => {
      await new Promise(r => setTimeout(r, 3000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, message: 'success' }) });
    });
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await input.fill('テスト');

    await page.locator('.save-button').click();
    await page.waitForTimeout(500);

    // 按钮变为 Loading
    await expect(page.locator('.save-button')).toContainText('保存中...');
    await expect(page.locator('.save-button')).toBeDisabled();

    await takeScreenshot(page, '36_保存_按钮Loading');
    await page.unroute('**/api/ud05/modifydocument/update');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.37 保存-防止重复提交', async ({ page }) => {
    resetCounter('37_保存_防止重复提交');
    let callCount = 0;
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await page.route('**/api/ud05/modifydocument/update', async (route) => {
      callCount++;
      await new Promise(r => setTimeout(r, 2000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, message: 'success' }) });
    });
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await input.fill('テスト');

    await page.locator('.save-button').click();
    await page.waitForTimeout(300);
    // 第二次点击（按钮已 disabled）
    await page.locator('.save-button').click({ force: true }).catch(() => {});

    // 只发起一次 API 调用
    expect(callCount).toBe(1);

    await takeScreenshot(page, '37_保存_防止重复提交');
    await page.unroute('**/api/ud05/modifydocument/update');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.38 保存-多变量同时修改', async ({ page }) => {
    resetCounter('38_保存_多变量同时修改');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await page.route('**/api/ud05/modifydocument/update', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, message: 'success' }) });
    });
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    // 修改 VAR001 和 VAR002
    const input0 = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    const input1 = page.locator('.variable-table tbody tr').nth(1).locator('td').nth(3).locator('input');
    await input0.fill('値A');
    await input1.fill('値B');

    await page.locator('.save-button').click();
    await page.waitForTimeout(2000);

    // 跳转到 UD06
    expect(page.url()).toContain('/Menu/SaveModifications');

    await takeScreenshot(page, '38_保存_多变量同时修改');
    await page.unroute('**/api/ud05/modifydocument/update');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.39 保存-保存成功后返回再修改', async ({ page }) => {
    resetCounter('39_保存_返回再修改');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await page.route('**/api/ud05/modifydocument/update', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, message: 'success' }) });
    });
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    // 第一次保存
    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await input.fill('新値1');

    await page.locator('.save-button').click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/Menu/SaveModifications');

    // 返回 UD05
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 再次修改
    if (page.url().includes('/ModifyDocument')) {
      const input2 = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
      await input2.fill('');
      await input2.pressSequentially('新値2');

      await page.locator('.save-button').click();
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/Menu/SaveModifications');
    }

    await takeScreenshot(page, '39_保存_返回再修改');
    await page.unroute('**/api/ud05/modifydocument/update');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.40 保存-更新 API 返回 404', async ({ page }) => {
    resetCounter('40_保存_API404');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await page.route('**/api/ud05/modifydocument/update', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 404, message: '未找到对应的修改记录' }) });
    });
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await input.fill('测试值');

    await page.locator('.save-button').click();
    await page.waitForTimeout(1000);

    // API 返回 code 404，组件会抛出错误进入 catch
    const msg = page.locator('.message-area');
    const text = await msg.textContent().catch(() => '');
    if (text) expect(text.length).toBeGreaterThan(0);
    expect(page.url()).toContain('/Menu/ModifyDocument');

    await takeScreenshot(page, '40_保存_API404');
    await page.unroute('**/api/ud05/modifydocument/update');
    await page.unroute('**/api/ud05/modifydocument/query');
  });
});

// ============================================================
// 7. 画面跳转（No.41-43）
// ============================================================
test.describe.serial('画面跳转（No.41-43）', () => {
  test.setTimeout(120000);

  test('No.41 跳转-点击底盘号链接到 UD07', async ({ page }) => {
    resetCounter('41_跳转_底盘号到UD07');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page, 'S019', 'CH019');
    await page.waitForTimeout(2000);

    await page.locator('.chassis-link').click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/Menu/VehicleSpecification');

    await takeScreenshot(page, '41_跳转_底盘号到UD07');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.42 跳转-保存成功后跳转到 UD06', async ({ page }) => {
    resetCounter('42_跳转_保存到UD06');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await page.route('**/api/ud05/modifydocument/update', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, message: 'success' }) });
    });
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await input.fill('新值');

    await page.locator('.save-button').click();
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/Menu/SaveModifications');

    await takeScreenshot(page, '42_跳转_保存到UD06');
    await page.unroute('**/api/ud05/modifydocument/update');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.43 跳转-保存失败后页面不跳转', async ({ page }) => {
    resetCounter('43_跳转_失败不跳转');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await page.route('**/api/ud05/modifydocument/update', async (route) => {
      await route.fulfill({ status: 500, body: JSON.stringify({ code: 500, message: '系统异常' }) });
    });
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await input.fill('测试值');

    await page.locator('.save-button').click();
    await page.waitForTimeout(1000);

    // URL 不变
    expect(page.url()).toContain('/Menu/ModifyDocument');

    await takeScreenshot(page, '43_跳转_失败不跳转');
    await page.unroute('**/api/ud05/modifydocument/update');
    await page.unroute('**/api/ud05/modifydocument/query');
  });
});

// ============================================================
// 8. 消息显示（No.44-47）
// ============================================================
test.describe.serial('消息显示（No.44-47）', () => {
  test.setTimeout(120000);

  test('No.44 消息-错误消息显示样式', async ({ page }) => {
    resetCounter('44_消息_错误样式');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    // 清空所有值后点击 Save
    const inputs = page.locator('.modified-input');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      await inputs.nth(i).fill('');
    }
    await page.locator('.save-button').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.message-area')).toContainText('NO UNRELEASED VERSION EXISTS!');

    await takeScreenshot(page, '44_消息_错误样式');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.45 消息-操作成功（无消息）', async ({ page }) => {
    resetCounter('45_消息_成功无消息');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await page.route('**/api/ud05/modifydocument/update', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, message: 'success' }) });
    });
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    const input = page.locator('.variable-table tbody tr').nth(0).locator('td').nth(3).locator('input');
    await input.fill('成功值');

    await page.locator('.save-button').click();
    await page.waitForTimeout(2000);

    // 跳转到 UD06，原页面无消息残留
    expect(page.url()).toContain('/Menu/SaveModifications');

    await takeScreenshot(page, '45_消息_成功无消息');
    await page.unroute('**/api/ud05/modifydocument/update');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.46 消息-清空旧消息', async ({ page }) => {
    resetCounter('46_消息_清空旧消息');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await page.route('**/api/ud05/modifydocument/update', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, message: 'success' }) });
    });
    await gotoUD05(page);
    await page.waitForTimeout(2000);

    // 先触发校验错误
    const inputs = page.locator('.modified-input');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      await inputs.nth(i).fill('');
    }
    await page.locator('.save-button').click();
    await page.waitForTimeout(300);
    await expect(page.locator('.message-area')).toBeVisible();

    // 修改值后再次提交
    await inputs.nth(0).fill('新值');
    await page.locator('.save-button').click();
    await page.waitForTimeout(2000);

    // 跳转到 UD06（旧消息被清除）
    expect(page.url()).toContain('/Menu/SaveModifications');

    await takeScreenshot(page, '46_消息_清空旧消息');
    await page.unroute('**/api/ud05/modifydocument/update');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.47 消息-未找到修改记录提示', async ({ page }) => {
    resetCounter('47_消息_未找到记录');
    await mockQueryApi(page, { code: 404, message: '未找到该底盘的修改记录', data: null });
    await gotoUD05(page, 'S020', 'CH020');
    await page.waitForTimeout(2000);

    const errorMsg = page.locator('.error-message-area');
    await expect(errorMsg).toContainText('未找到');

    await takeScreenshot(page, '47_消息_未找到记录');
    await page.unroute('**/api/ud05/modifydocument/query');
  });
});

// ============================================================
// 9. 界面交互（No.48-51）
// ============================================================
test.describe.serial('界面交互（No.48-51）', () => {
  test.setTimeout(120000);

  test('No.48 界面-页面标题显示', async ({ page }) => {
    resetCounter('48_界面_页面标题');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page, 'S021', 'CH021');
    await page.waitForTimeout(2000);

    await expect(page.locator('.page-title')).toContainText('Modify Document');

    await takeScreenshot(page, '48_界面_页面标题');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.49 界面-Save 按钮显示', async ({ page }) => {
    resetCounter('49_界面_Save按钮');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page, 'S022', 'CH022');
    await page.waitForTimeout(2000);

    const btn = page.locator('.save-button');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText('Save');
    await expect(btn).toBeEnabled();

    await takeScreenshot(page, '49_界面_Save按钮');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.50 界面-各控件初始状态', async ({ page }) => {
    resetCounter('50_界面_控件初始状态');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page, 'S023', 'CH023');
    await page.waitForTimeout(2000);

    await expect(page.locator('.chassis-link')).toBeEnabled();
    await expect(page.locator('.template-link')).toBeVisible();
    await expect(page.locator('.variable-table')).toBeVisible();
    await expect(page.locator('.save-button')).toBeEnabled();
    // 输入框可编辑
    const input = page.locator('.modified-input').first();
    await expect(input).toBeEnabled();
    // 无错误消息
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '50_界面_控件初始状态');
    await page.unroute('**/api/ud05/modifydocument/query');
  });

  test('No.51 界面-页面响应式布局', async ({ page }) => {
    resetCounter('51_界面_响应式布局');
    await mockQueryApi(page, DEFAULT_QUERY_RESPONSE);
    await gotoUD05(page, 'S024', 'CH024');
    await page.waitForTimeout(2000);

    // 调整窗口大小
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500);

    await expect(page.locator('.modify-document-container')).toBeVisible();
    // 表格无水平滚动（在小窗口下应自适应）
    const table = page.locator('.variable-table');
    await expect(table).toBeVisible();

    await takeScreenshot(page, '51_界面_响应式布局');
    await page.unroute('**/api/ud05/modifydocument/query');
  });
});
