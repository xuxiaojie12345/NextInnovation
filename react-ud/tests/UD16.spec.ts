import { test, expect, Page } from '@playwright/test';
import { insertUD16TestData, cleanupUD16TestData, execute } from './test-data-helper';

// ============================================================
// ADChange 模块 (UD16) Playwright 自动化测试
// 基于 単体テスト仕様書UD16.md（30个测试用例）
// 注意：测试预期值以组件实际代码为准（与式样书可能略有差异）
// API: POST /api/adchange/process（统一接口，operation 区分操作类型）
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD16';
const UD16_URL = `${BASE_URL}/Menu/ADCAChange`;

let screenshotCounter: { [key: string]: number } = {};

async function takeScreenshot(page: Page, name: string) {
  if (!screenshotCounter[name]) screenshotCounter[name] = 0;
  screenshotCounter[name]++;
  const seq = String(screenshotCounter[name]).padStart(3, '0');
  try {
    if (page.isClosed()) return;
    await page.waitForTimeout(300);
    if (page.isClosed()) return;
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}_${seq}.jpeg`, type: 'jpeg', quality: 85, fullPage: true, timeout: 10000 });
  } catch (e) { console.warn(`Screenshot failed for ${name}: ${e}`); }
}

function resetCounter(name: string) { screenshotCounter[name] = 0; }

async function safeGoto(page: Page, url: string = BASE_URL) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForTimeout(2000);
      return;
    } catch (e) { if (i === 2 || page.isClosed()) throw e; await page.waitForTimeout(2000); }
  }
}

async function loginViaLocalStorage(page: Page) {
  await page.evaluate((info) => { localStorage.setItem('userInfo', JSON.stringify(info)); }, {
    username: 'admin', role: 'Administrator',
    permissions: ["GenerateDucument", "GenerateDoc", "GenerateBatch", "RegdataArchive", "RegdataBatch",
      "UpdateRules", "UpdateUnicodeRules", "ExistingVariables", "UnlockDocument",
      "HDocNumberSeries", "UploadDeleteTemplate", "ListTemplates", "VPPSVinPlate", "ADCAChange",
      "HDocUserAdmin", "HDocUserDocAdmin", "SearchUser", "ChangePassword", "UserPosition",
      "ArchiveSearch", "UploadDocument",
      "UserGuide", "ADCAChangeGuide", "VinPlateGuide", "ArchiveGuide", "Privacy"],
  });
}

async function gotoUD16(page: Page) {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  await page.goto(UD16_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.waitForSelector('.ud16-title', { timeout: 30000 });
}

/** Mock API for error scenarios (500) */
async function mockApiFail(page: Page) {
  await page.route('**/api/adchange/process', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 500, message: '系统错误，请稍后重试', data: null }) });
  });
}

/** Mock API for 409 conflict */
async function mockApiConflict(page: Page) {
  await page.route('**/api/adchange/process', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 409, message: 'AFTER DEF CHANGE IS NOT ACTIVATED', data: null }) });
  });
}

/** Mock API for timeout */
async function mockApiTimeout(page: Page) {
  await page.route('**/api/adchange/process', (route) => route.abort('timedout'));
}

/** Mock API for DELETE not found (400) */
async function mockApiDeleteNotFound(page: Page) {
  await page.route('**/api/adchange/process', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 400, message: '记录不存在，无法删除', data: null }) });
  });
}

/** Mock API for CHECK - 未激活 */
async function mockApiCheckInactive(page: Page) {
  await page.route('**/api/adchange/process', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      code: 200, data: { serieChnr: 'JPCT-G28322', desc: 'Test inactive record', status: 'INACTIVE' }
    }) });
  });
}

/** Mock API for CHECK - 不存在 */
async function mockApiCheckNotFound(page: Page) {
  await page.route('**/api/adchange/process', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      code: 200, data: null
    }) });
  });
}

/** Mock API with delay for loading test */
async function mockApiWithDelay(page: Page, responseData: any, delay: number = 3000) {
  await page.route('**/api/adchange/process', async (route) => {
    await new Promise(r => setTimeout(r, delay));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseData) });
  });
}

const TEST_ADD_SERIE_CHNR = 'TEST-ADD001';
const TEST_ADD_DESC = 'Test ADD description for UD16';

// ============================================================
// 1. 画面初始化（No.1-2）
// ============================================================
test.describe.serial('画面初始化（No.1-2）', () => {
  test.setTimeout(120000);

  test('No.1 画面初期显示-基本元素', async ({ page }) => {
    resetCounter('01_基本元素');
    await gotoUD16(page);
    // 标题
    await expect(page.locator('.ud16-title')).toContainText('AD Change');
    // Serie-Chnr 输入框
    await expect(page.locator('.ud16-input')).toBeVisible();
    await expect(page.locator('.ud16-input')).toHaveAttribute('maxLength', '15');
    // Desc 输入框
    await expect(page.locator('.ud16-textarea')).toBeVisible();
    await expect(page.locator('.ud16-textarea')).toHaveAttribute('maxLength', '4000');
    // 3个按钮
    const buttons = ['ADD', 'DELETE', 'CHECK'];
    for (const btn of buttons) {
      await expect(page.locator('.ud16-btn').filter({ hasText: btn })).toBeEnabled();
    }
    await takeScreenshot(page, '01_基本元素');
  });

  test('No.2 画面初期显示-输入框初始状态', async ({ page }) => {
    resetCounter('02_输入框初始');
    await gotoUD16(page);
    await expect(page.locator('.ud16-input')).toHaveValue('');
    await expect(page.locator('.ud16-textarea')).toHaveValue('');
    await expect(page.locator('.ud16-message')).toHaveCount(0);
    await takeScreenshot(page, '02_输入框初始');
  });
});

// ============================================================
// 2. ADD 操作（No.3-7）
// ============================================================
test.describe.serial('ADD操作（No.3-7）', () => {
  test.setTimeout(120000);

  test('No.3 ADD-Serie-Chnr 为空', async ({ page }) => {
    resetCounter('03_ADD空值');
    await gotoUD16(page);
    // 直接点击 ADD（不输入任何内容）
    await page.locator('.ud16-btn').filter({ hasText: 'ADD' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud16-message.error')).toContainText('请输入Serie-Chnr');
    await takeScreenshot(page, '03_ADD空值');
  });

  test('No.4 ADD-成功', async ({ page }) => {
    resetCounter('04_ADD成功');
    // 确保测试数据不存在
    await execute(`DELETE FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?`, ['TEST', 'ADD001']);
    await gotoUD16(page);
    await page.waitForTimeout(500);
    const input = page.locator('.ud16-input');
    await input.click();
    await input.pressSequentially(TEST_ADD_SERIE_CHNR, { delay: 15 });
    const textarea = page.locator('.ud16-textarea');
    await textarea.click();
    await textarea.pressSequentially(TEST_ADD_DESC, { delay: 10 });
    await page.locator('.ud16-btn').filter({ hasText: 'ADD' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud16-message.success')).toContainText('添加成功');
    // 输入框被清空
    await expect(page.locator('.ud16-input')).toHaveValue('');
    await expect(page.locator('.ud16-textarea')).toHaveValue('');
    await takeScreenshot(page, '04_ADD成功');
  });

  test('No.5 ADD-记录已存在且未激活（409）', async ({ page }) => {
    resetCounter('05_ADD已存在');
    await insertUD16TestData();
    await mockApiConflict(page);
    await gotoUD16(page);
    await page.waitForTimeout(500);
    const input = page.locator('.ud16-input');
    await input.click();
    await input.pressSequentially('JPCT-G28322', { delay: 15 });
    await page.locator('.ud16-textarea').click();
    await page.locator('.ud16-textarea').pressSequentially('Duplicate record', { delay: 10 });
    await page.locator('.ud16-btn').filter({ hasText: 'ADD' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud16-message.error')).toContainText('AFTER DEF CHANGE IS NOT ACTIVATED');
    await takeScreenshot(page, '05_ADD已存在');
    await page.unroute('**/api/adchange/process');
  });

  test('No.6 ADD-失败（API 返回 500）', async ({ page }) => {
    resetCounter('06_ADD500');
    await mockApiFail(page);
    await gotoUD16(page);
    const input = page.locator('.ud16-input');
    await input.click();
    await input.pressSequentially('TEST-ERR001', { delay: 15 });
    await page.locator('.ud16-btn').filter({ hasText: 'ADD' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud16-message.error')).toContainText('系统错误，请稍后重试');
    await takeScreenshot(page, '06_ADD500');
    await page.unroute('**/api/adchange/process');
  });

  test('No.7 ADD-加载中按钮禁用', async ({ page }) => {
    resetCounter('07_ADD加载中');
    await mockApiWithDelay(page, { code: 200, data: null }, 3000);
    await gotoUD16(page);
    const input = page.locator('.ud16-input');
    await input.click();
    await input.pressSequentially('TEST-LOAD1', { delay: 15 });
    await page.locator('.ud16-btn').filter({ hasText: 'ADD' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud16-btn').filter({ hasText: 'ADD' })).toBeDisabled();
    await expect(page.locator('.ud16-btn').filter({ hasText: 'DELETE' })).toBeDisabled();
    await expect(page.locator('.ud16-btn').filter({ hasText: 'CHECK' })).toBeDisabled();
    await takeScreenshot(page, '07_ADD加载中');
    await page.unroute('**/api/adchange/process');
  });
});

// ============================================================
// 3. DELETE 操作（No.8-13）
// ============================================================
test.describe.serial('DELETE操作（No.8-13）', () => {
  test.setTimeout(120000);

  test('No.8 DELETE-Serie-Chnr 为空', async ({ page }) => {
    resetCounter('08_DELETE空值');
    await gotoUD16(page);
    await page.locator('.ud16-btn').filter({ hasText: 'DELETE' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud16-message.error')).toContainText('请输入要删除的Serie-Chnr');
    await takeScreenshot(page, '08_DELETE空值');
  });

  test('No.9 DELETE-成功', async ({ page }) => {
    resetCounter('09_DELETE成功');
    await insertUD16TestData();
    await gotoUD16(page);
    await page.waitForTimeout(500);
    const input = page.locator('.ud16-input');
    await input.click();
    await input.pressSequentially('JPCT-G28321', { delay: 15 });
    await page.locator('.ud16-btn').filter({ hasText: 'DELETE' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud16-message.success')).toContainText('删除成功');
    // 输入框被清空
    await expect(page.locator('.ud16-input')).toHaveValue('');
    await takeScreenshot(page, '09_DELETE成功');
  });

  test('No.10 DELETE-记录不存在', async ({ page }) => {
    resetCounter('10_DELETE不存在');
    await mockApiDeleteNotFound(page);
    await gotoUD16(page);
    const input = page.locator('.ud16-input');
    await input.click();
    await input.pressSequentially('NONEXIST-001', { delay: 15 });
    await page.locator('.ud16-btn').filter({ hasText: 'DELETE' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud16-message.error')).toContainText('记录不存在');
    await takeScreenshot(page, '10_DELETE不存在');
    await page.unroute('**/api/adchange/process');
  });

  test('No.11 DELETE-失败（API 返回 500）', async ({ page }) => {
    resetCounter('11_DELETE500');
    await mockApiFail(page);
    await gotoUD16(page);
    const input = page.locator('.ud16-input');
    await input.click();
    await input.pressSequentially('JPCT-G28322', { delay: 15 });
    await page.locator('.ud16-btn').filter({ hasText: 'DELETE' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud16-message.error')).toContainText('系统错误，请稍后重试');
    await takeScreenshot(page, '11_DELETE500');
    await page.unroute('**/api/adchange/process');
  });

  test('No.12 DELETE-加载中按钮禁用', async ({ page }) => {
    resetCounter('12_DELETE加载中');
    await mockApiWithDelay(page, { code: 200, data: null }, 3000);
    await gotoUD16(page);
    const input = page.locator('.ud16-input');
    await input.click();
    await input.pressSequentially('TEST-LOAD2', { delay: 15 });
    await page.locator('.ud16-btn').filter({ hasText: 'DELETE' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud16-btn').filter({ hasText: 'DELETE' })).toBeDisabled();
    await expect(page.locator('.ud16-btn').filter({ hasText: 'ADD' })).toBeDisabled();
    await expect(page.locator('.ud16-btn').filter({ hasText: 'CHECK' })).toBeDisabled();
    await takeScreenshot(page, '12_DELETE加载中');
    await page.unroute('**/api/adchange/process');
  });
});

// ============================================================
// 4. CHECK 操作（No.13-19）
// ============================================================
test.describe.serial('CHECK操作（No.13-19）', () => {
  test.setTimeout(120000);

  test('No.13 CHECK-Serie-Chnr 为空', async ({ page }) => {
    resetCounter('13_CHECK空值');
    await gotoUD16(page);
    await page.locator('.ud16-btn').filter({ hasText: 'CHECK' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud16-message.error')).toContainText('请输入要检查的Serie-Chnr');
    await takeScreenshot(page, '13_CHECK空值');
  });

  test('No.14 CHECK-记录存在且已激活', async ({ page }) => {
    resetCounter('14_CHECK已激活');
    await insertUD16TestData();
    await gotoUD16(page);
    await page.waitForTimeout(500);
    const input = page.locator('.ud16-input');
    await input.click();
    await input.pressSequentially('JPCT-G28321', { delay: 15 });
    await page.locator('.ud16-btn').filter({ hasText: 'CHECK' }).click();
    await page.waitForTimeout(2000);
    // 弹出 CHECK 结果弹窗
    await expect(page.locator('.ud16-modal')).toBeVisible();
    // 校验弹窗内容
    await expect(page.locator('.ud16-check-label').first()).toContainText('Serie-Chnr');
    await expect(page.locator('.ud16-check-value').first()).toContainText('JPCT-G28321');
    await expect(page.locator('.ud16-check-label').nth(1)).toContainText('Desc');
    await expect(page.locator('.ud16-check-label').nth(2)).toContainText('Status');
    // 关闭弹窗
    await page.locator('.ud16-modal-close').click();
    await page.waitForTimeout(300);
    await expect(page.locator('.ud16-modal')).toHaveCount(0);
    await takeScreenshot(page, '14_CHECK已激活');
  });

  test('No.15 CHECK-记录存在但未激活', async ({ page }) => {
    resetCounter('15_CHECK未激活');
    await mockApiCheckInactive(page);
    await gotoUD16(page);
    const input = page.locator('.ud16-input');
    await input.click();
    await input.pressSequentially('JPCT-G28322', { delay: 15 });
    await page.locator('.ud16-btn').filter({ hasText: 'CHECK' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud16-modal')).toBeVisible();
    await expect(page.locator('.ud16-check-value').nth(2)).toContainText('INACTIVE');
    await page.locator('.ud16-modal-overlay').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(300);
    await expect(page.locator('.ud16-modal')).toHaveCount(0);
    await takeScreenshot(page, '15_CHECK未激活');
    await page.unroute('**/api/adchange/process');
  });

  test('No.16 CHECK-记录不存在', async ({ page }) => {
    resetCounter('16_CHECK不存在');
    await mockApiCheckNotFound(page);
    await gotoUD16(page);
    const input = page.locator('.ud16-input');
    await input.click();
    await input.pressSequentially('NONEXIST-002', { delay: 15 });
    await page.locator('.ud16-btn').filter({ hasText: 'CHECK' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud16-modal')).toBeVisible();
    await expect(page.locator('.ud16-check-not-found')).toContainText('数据不存在');
    // 点 Close 按钮关闭
    await page.locator('.ud16-modal-footer .ud16-btn').click();
    await page.waitForTimeout(300);
    await expect(page.locator('.ud16-modal')).toHaveCount(0);
    await takeScreenshot(page, '16_CHECK不存在');
    await page.unroute('**/api/adchange/process');
  });

  test('No.17 CHECK-失败（API 返回 500）', async ({ page }) => {
    resetCounter('17_CHECK500');
    await mockApiFail(page);
    await gotoUD16(page);
    const input = page.locator('.ud16-input');
    await input.click();
    await input.pressSequentially('JPCT-G28321', { delay: 15 });
    await page.locator('.ud16-btn').filter({ hasText: 'CHECK' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud16-message.error')).toContainText('系统错误，请稍后重试');
    await takeScreenshot(page, '17_CHECK500');
    await page.unroute('**/api/adchange/process');
  });

  test('No.18 CHECK-加载中按钮禁用', async ({ page }) => {
    resetCounter('18_CHECK加载中');
    await mockApiWithDelay(page, { code: 200, data: { serieChnr: 'JPCT-G28321', desc: 'Test', status: 'ACTIVATED' } }, 3000);
    await gotoUD16(page);
    const input = page.locator('.ud16-input');
    await input.click();
    await input.pressSequentially('JPCT-G28321', { delay: 15 });
    await page.locator('.ud16-btn').filter({ hasText: 'CHECK' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud16-btn').filter({ hasText: 'CHECK' })).toBeDisabled();
    await expect(page.locator('.ud16-btn').filter({ hasText: 'ADD' })).toBeDisabled();
    await expect(page.locator('.ud16-btn').filter({ hasText: 'DELETE' })).toBeDisabled();
    await takeScreenshot(page, '18_CHECK加载中');
    await page.unroute('**/api/adchange/process');
  });
});

// ============================================================
// 5. 输入字符控制（No.19-24）
// ============================================================
test.describe.serial('输入字符控制（No.19-24）', () => {
  test.setTimeout(120000);

  test('No.19 Serie-Chnr-14字符（小于最大）', async ({ page }) => {
    resetCounter('19_SC14字符');
    await gotoUD16(page);
    const input = page.locator('.ud16-input');
    await input.click();
    const text14 = 'ABCD-123456789';
    await input.pressSequentially(text14, { delay: 5 });
    await page.waitForTimeout(300);
    const val = await input.inputValue();
    expect(val.length).toBe(14);
    expect(val).toBe(text14);
    await takeScreenshot(page, '19_SC14字符');
  });

  test('No.20 Serie-Chnr-15字符（等于最大）', async ({ page }) => {
    resetCounter('20_SC15字符');
    await gotoUD16(page);
    const input = page.locator('.ud16-input');
    await input.click();
    const text15 = 'ABCD-1234567890';
    await input.pressSequentially(text15, { delay: 5 });
    await page.waitForTimeout(300);
    const val = await input.inputValue();
    expect(val.length).toBe(15);
    expect(val).toBe(text15);
    await takeScreenshot(page, '20_SC15字符');
  });

  test('No.21 Serie-Chnr-16字符（超过最大）', async ({ page }) => {
    resetCounter('21_SC16字符');
    await gotoUD16(page);
    const input = page.locator('.ud16-input');
    await input.click();
    const text16 = 'ABCD-1234567890X';
    await input.pressSequentially(text16, { delay: 5 });
    await page.waitForTimeout(300);
    const val = await input.inputValue();
    // maxLength=15，只能输入15个字符
    expect(val.length).toBe(15);
    expect(val).toBe('ABCD-1234567890');
    await takeScreenshot(page, '21_SC16字符');
  });

  test('No.22 Desc-3999字符（小于最大）', async ({ page }) => {
    resetCounter('22_Desc3999');
    await gotoUD16(page);
    const textarea = page.locator('.ud16-textarea');
    await textarea.click();
    const text3999 = 'A'.repeat(3999);
    await textarea.pressSequentially(text3999, { delay: 1 });
    await page.waitForTimeout(500);
    const val = await textarea.inputValue();
    expect(val.length).toBe(3999);
    await takeScreenshot(page, '22_Desc3999');
  });

  test('No.23 Desc-4000字符（等于最大）', async ({ page }) => {
    resetCounter('23_Desc4000');
    await gotoUD16(page);
    const textarea = page.locator('.ud16-textarea');
    await textarea.click();
    const text4000 = 'A'.repeat(4000);
    await textarea.pressSequentially(text4000, { delay: 1 });
    await page.waitForTimeout(500);
    const val = await textarea.inputValue();
    expect(val.length).toBe(4000);
    await takeScreenshot(page, '23_Desc4000');
  });

  test('No.24 Desc-4001字符（超过最大）', async ({ page }) => {
    resetCounter('24_Desc4001');
    await gotoUD16(page);
    const textarea = page.locator('.ud16-textarea');
    await textarea.click();
    const text4001 = 'A'.repeat(4001);
    await textarea.pressSequentially(text4001, { delay: 1 });
    await page.waitForTimeout(500);
    const val = await textarea.inputValue();
    // maxLength=4000，只能输入4000个字符
    expect(val.length).toBe(4000);
    await takeScreenshot(page, '24_Desc4001');
  });
});

// ============================================================
// 6. 异常处理（No.25）
// ============================================================
test.describe.serial('异常处理（No.25）', () => {
  test.setTimeout(180000);

  test('No.25 异常处理-API 超时', async ({ page }) => {
    resetCounter('25_API超时');
    await mockApiTimeout(page);
    await gotoUD16(page);
    const input = page.locator('.ud16-input');
    await input.click();
    await input.pressSequentially('JPCT-G28321', { delay: 15 });
    await page.locator('.ud16-btn').filter({ hasText: 'ADD' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ud16-message.error')).toContainText('操作失败，请稍后重试');
    await takeScreenshot(page, '25_API超时');
    await page.unroute('**/api/adchange/process');
  });
});

// ============================================================
// 7. UI 交互（No.26-28）
// ============================================================
test.describe.serial('UI交互（No.26-28）', () => {
  test.setTimeout(120000);

  test('No.26 错误消息-显示样式', async ({ page }) => {
    resetCounter('26_错误样式');
    await gotoUD16(page);
    await page.locator('.ud16-btn').filter({ hasText: 'ADD' }).click();
    await page.waitForTimeout(500);
    const msg = page.locator('.ud16-message.error');
    await expect(msg).toContainText('请输入Serie-Chnr');
    // 消息为可见状态
    await expect(msg).toBeVisible();
    await takeScreenshot(page, '26_错误样式');
  });

  test('No.27 成功消息-显示样式', async ({ page }) => {
    resetCounter('27_成功样式');
    // 确保测试数据不存在
    await execute(`DELETE FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?`, ['TEST', 'SUC001']);
    await gotoUD16(page);
    const input = page.locator('.ud16-input');
    await input.click();
    await input.pressSequentially('TEST-SUC001', { delay: 15 });
    await page.locator('.ud16-textarea').click();
    await page.locator('.ud16-textarea').pressSequentially('Success test description', { delay: 10 });
    await page.locator('.ud16-btn').filter({ hasText: 'ADD' }).click();
    await page.waitForTimeout(2000);
    const msg = page.locator('.ud16-message.success');
    await expect(msg).toContainText('添加成功');
    await expect(msg).toBeVisible();
    await takeScreenshot(page, '27_成功样式');
  });

  test('No.28 页面刷新', async ({ page }) => {
    resetCounter('28_页面刷新');
    await gotoUD16(page);
    const input = page.locator('.ud16-input');
    await input.click();
    await input.pressSequentially('JPCT-G28321', { delay: 15 });
    await page.locator('.ud16-textarea').click();
    await page.locator('.ud16-textarea').pressSequentially('Some description', { delay: 10 });
    await page.waitForTimeout(300);
    // 刷新页面
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.waitForSelector('.ud16-title', { timeout: 10000 });
    await expect(page.locator('.ud16-input')).toHaveValue('');
    await expect(page.locator('.ud16-textarea')).toHaveValue('');
    await expect(page.locator('.ud16-message')).toHaveCount(0);
    await takeScreenshot(page, '28_页面刷新');
  });
});

// ============================================================
// 8. 安全性（No.29-30）
// ============================================================
test.describe.serial('安全性（No.29-30）', () => {
  test.setTimeout(120000);

  test('No.29 安全性-API 请求验证', async ({ page }) => {
    resetCounter('29_API请求验证');
    let requestBody = '';
    await page.route('**/api/adchange/process', async (route) => {
      requestBody = route.request().postData() || '';
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: null }) });
    });
    await gotoUD16(page);
    const input = page.locator('.ud16-input');
    await input.click();
    await input.pressSequentially('JPCT-G28321', { delay: 15 });
    await page.locator('.ud16-btn').filter({ hasText: 'ADD' }).click();
    await page.waitForTimeout(1000);
    expect(requestBody).toContain('operation');
    expect(requestBody).toContain('serieChnr');
    await takeScreenshot(page, '29_API请求验证');
    await page.unroute('**/api/adchange/process');
  });

  test('No.30 安全性-用户未登录', async ({ page }) => {
    resetCounter('30_未登录');
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await page.goto(UD16_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    // 未登录时应跳转到登录页（根路径 / 渲染 Login 组件）
    expect(page.url()).toBe(BASE_URL + '/');
    await takeScreenshot(page, '30_未登录');
  });
});
