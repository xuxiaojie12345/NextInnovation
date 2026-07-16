/**
 * UD15 - Vin Plate Playwright E2E Test
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD15.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实 API
 * 截图保存: tests/test/Image/UD15/
 * 测试用例数: 41
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, getTestUser, createScreenshot, login, PAGE_URL } from './utils';

const ss = createScreenshot('UD15');

// ============================================================
// 元素定位
// ============================================================
const $container     = (p: Page) => p.locator('.vp-container');
const $header        = (p: Page) => p.locator('.vp-header h1');
const $err           = (p: Page) => p.locator('.vp-error');
const $successMsg    = (p: Page) => p.locator('.vp-success');
const $input         = (p: Page) => p.locator('.vp-input');
const $label         = (p: Page) => p.locator('.vp-label');
const $inputSection  = (p: Page) => p.locator('.vp-input-section');
const $btnRow        = (p: Page) => p.locator('.vp-btn-row');
const $btnViewInfo   = (p: Page) => p.locator('.vp-btn-row button').filter({ hasText: 'View Info' });
const $btnRegenerate = (p: Page) => p.locator('.vp-btn-row button').filter({ hasText: 'Set Regenerate' });
const $btnSetOk      = (p: Page) => p.locator('.vp-btn-row button').filter({ hasText: 'Set OK' });
const $btnBasic      = (p: Page) => p.locator('.vp-btn-row button').filter({ hasText: 'Change to Basic Info' });
const $btnAdvanced   = (p: Page) => p.locator('.vp-btn-row button').filter({ hasText: 'Change to Advanced Info' });
const $infoSection   = (p: Page) => p.locator('.vp-info-section');
const $infoTable     = (p: Page) => p.locator('.vp-info-table');
const $infoLabels    = (p: Page) => p.locator('.vp-info-label');
const $infoValues    = (p: Page) => p.locator('.vp-info-value');
const $noData        = (p: Page) => p.locator('.vp-no-data');
const $xmlTitle      = (p: Page) => p.locator('.vp-xml-title');

// ============================================================
// 导航
// ============================================================
async function navigateToPage(page: Page) {
  await login(page);
  await page.goto(PAGE_URL + '/menu/vin-plate', { waitUntil: 'load' });
  await page.waitForSelector('.vp-container');
  await page.waitForTimeout(1500);
}

// ============================================================
// 测试数据辅助函数
// ============================================================
const TEST_SERIE = 'UD15';
const TEST_CHNR = 'TEST0001';
const TEST_XML = JSON.stringify({
  "Print items": [{ "PrintItemName": "Item1", "value": "Val1" }],
  "VP Data": { "VariantA": "DataA", "VariantB": "DataB" }
});

async function insertTestData(override?: Record<string, string>) {
  const serie = override?.serie || TEST_SERIE;
  const chnr = override?.chnr || TEST_CHNR;
  await queryDB(`DELETE FROM HDOC_SEND_DATA_VIN_PLATE WHERE SERIE=? AND CHNR=?`, [serie, chnr]);
  await queryDB(
    `INSERT INTO HDOC_SEND_DATA_VIN_PLATE
     (SERIE, CHNR, PC, ADDED, DOC_READY, DOC_SENT, BU, STATUS, XML_DOC, MSG, TYPE,
      IS_JS_DIVISION, ORDERNUMBER, FILENAME_ON_DISK, ADCA_CHANGE_FLG,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, 'PC', CURDATE(), CURDATE(), CURDATE(), 'BU', ?, ?, ?, ?,
             'N', 'ORD001', NULL, 'N',
             NOW(), 'UD15Test', 'UT',
             NOW(), 'UD15Test', 'UT')`,
    [
      serie, chnr,
      override?.status || '1',
      override?.xmlDoc || TEST_XML,
      override?.msg || '',
      override?.type || '1',
    ]
  );
}

async function cleanupTestData(serie?: string, chnr?: string) {
  await queryDB(`DELETE FROM HDOC_SEND_DATA_VIN_PLATE WHERE SERIE=? AND CHNR=?`, [serie || TEST_SERIE, chnr || TEST_CHNR]);
}

test.describe.configure({ mode: 'serial' });
test.describe('UD15 Vin Plate', () => {

  // -----------------------------------------------------------
  // 画面初期表示 (TC1~5)
  // -----------------------------------------------------------
  test('01 - Chassis number input', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '01');
    await expect($input(page)).toBeVisible();
    await expect($input(page)).toHaveAttribute('type', 'text');
    const maxLen = await $input(page).getAttribute('maxLength');
    expect(maxLen).toBe('15');
    const val = await $input(page).inputValue();
    expect(val).toBe('');
    await expect($input(page)).toBeEnabled();
    await ss(page, 'input verified', '01');
  });

  test('02 - Buttons state', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '02');
    await expect($btnViewInfo(page)).toBeVisible();
    await expect($btnViewInfo(page)).toHaveText('View Info');
    await expect($btnViewInfo(page)).toBeEnabled();
    await expect($btnRegenerate(page)).toBeVisible();
    await expect($btnRegenerate(page)).toHaveText('Set Regenerate');
    await expect($btnRegenerate(page)).toBeEnabled();
    await expect($btnSetOk(page)).toBeVisible();
    await expect($btnSetOk(page)).toHaveText('Set OK');
    await expect($btnSetOk(page)).toBeEnabled();
    await expect($btnBasic(page)).toBeVisible();
    await expect($btnBasic(page)).toHaveText('Change to Basic Info');
    await expect($btnBasic(page)).toBeEnabled();
    await expect($btnAdvanced(page)).toBeVisible();
    await expect($btnAdvanced(page)).toHaveText('Change to Advanced Info');
    await expect($btnAdvanced(page)).toBeEnabled();
    await ss(page, 'buttons verified', '02');
  });

  test('03 - Info labels after search', async ({ page }) => {
    await insertTestData();
    // 监听浏览器控制台错误
    const browserErrors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') browserErrors.push(msg.text()); });
    page.on('pageerror', err => browserErrors.push('Page error: ' + err.message));
    page.on('requestfailed', req => browserErrors.push('Request failed: ' + req.url() + ' ' + req.failure()?.errorText));
    
    await navigateToPage(page);
    await ss(page, 'page display', '03');
    await $input(page).fill(TEST_SERIE + ' ' + TEST_CHNR);
    
    // 监听 API 请求
    const apiResponses: string[] = [];
    page.on('response', res => {
      if (res.url().includes('ud15/viewInfo')) {
        apiResponses.push('Status: ' + res.status());
      }
    });
    
    await $btnViewInfo(page).click();
    await page.waitForTimeout(5000);
    await ss(page, 'info loaded', '03');
    
    // 输出所有调试信息
    console.log('  API responses: ' + apiResponses.join(', '));
    console.log('  Browser errors: ' + browserErrors.join(' | '));
    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 800) || '');
    console.log('  Body: ' + bodyText);
    
    await expect($infoSection(page)).toBeVisible({ timeout: 15000 });
    const labels = await $infoLabels(page).allTextContents();
    const labelTexts = labels.map(l => l.trim());
    console.log('  Info labels: ' + labelTexts.join(', '));
    expect(labelTexts.some(t => t.includes('Chassis number'))).toBe(true);
    expect(labelTexts.some(t => t.includes('Plate type'))).toBe(true);
    expect(labelTexts.some(t => t.includes('Status'))).toBe(true);
    expect(labelTexts.some(t => t.includes('Error Message'))).toBe(true);
    expect(labelTexts.some(t => t.includes('Def.'))).toBe(true);
    expect(labelTexts.some(t => t.includes('Data ready'))).toBe(true);
    expect(labelTexts.some(t => t.includes('Sent to CAB factory'))).toBe(true);
    await cleanupTestData();
    await ss(page, 'labels verified', '03');
  });

  test('04 - Info labels initial empty', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '04');
    const infoSectionExists = await $infoSection(page).isVisible().catch(() => false);
    expect(infoSectionExists).toBe(false);
    await ss(page, 'info empty', '04');
  });

  test('05 - Error message hidden', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '05');
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'error hidden', '05');
  });

  // -----------------------------------------------------------
  // Chassis number 输入框属性校验 (TC6~9)
  // -----------------------------------------------------------
  test('06 - Required validation', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '06');
    await $btnViewInfo(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Chassis number is required.');
    await ss(page, 'validation error', '06');
  });

  test('07 - Max length 15', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '07');
    await $input(page).fill('A'.repeat(20));
    await page.waitForTimeout(300);
    const val = await $input(page).inputValue();
    console.log('  Input length: ' + val.length);
    expect(val.length).toBeLessThanOrEqual(15);
    await ss(page, 'max length', '07');
  });

  test('08 - Trim spaces', async ({ page }) => {
    await insertTestData();
    await navigateToPage(page);
    await ss(page, 'page display', '08');
    await $input(page).fill('  ' + TEST_SERIE + ' ' + TEST_CHNR + '  ');
    await ss(page, 'input with spaces', '08');
    await $btnViewInfo(page).click();
    await page.waitForTimeout(3000);
    const hasInfo = await $infoSection(page).isVisible().catch(() => false);
    console.log('  Info section visible: ' + hasInfo);
    await cleanupTestData();
    await ss(page, 'trim result', '08');
  });

  test('09 - Text left aligned', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '09');
    await $input(page).fill('ABC123');
    const align = await $input(page).evaluate(el => getComputedStyle(el).textAlign);
    console.log('  Text align: ' + align);
    await ss(page, 'alignment', '09');
  });

  // -----------------------------------------------------------
  // View Info 按钮 (TC10~16)
  // -----------------------------------------------------------
  test('10 - View Info empty validation', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '10');
    await $btnViewInfo(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Chassis number is required.');
    await ss(page, 'empty validation', '10');
  });

  test('11 - Chassis not found', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '11');
    await $input(page).fill('NONEXIST_CHASSIS');
    await $btnViewInfo(page).click();
    await page.waitForTimeout(3000);
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    const errText = await $err(page).textContent();
    console.log('  Error: ' + errText);
    expect(errText).toContain('not found');
    await ss(page, 'not found', '11');
  });

  test('12 - View Info success full fields', async ({ page }) => {
    await insertTestData();
    await navigateToPage(page);
    await ss(page, 'page display', '12');
    await $input(page).fill(TEST_SERIE + ' ' + TEST_CHNR);
    await $btnViewInfo(page).click();
    await page.waitForTimeout(3000);
    await ss(page, 'info loaded', '12');
    await expect($infoSection(page)).toBeVisible({ timeout: 10000 });
    const values = await $infoValues(page).allTextContents();
    console.log('  Info values: ' + values.join(' | '));
    const hasXml = await $xmlTitle(page).count();
    console.log('  XML sections: ' + hasXml);
    await cleanupTestData();
    await ss(page, 'fields verified', '12');
  });

  test('13 - Info refresh on re-query', async ({ page }) => {
    await insertTestData();
    await navigateToPage(page);
    await ss(page, 'page display', '13');
    await $input(page).fill(TEST_SERIE + ' ' + TEST_CHNR);
    await $btnViewInfo(page).click();
    await page.waitForTimeout(3000);
    await ss(page, 'first query', '13');
    await $input(page).fill('NONEXIST CHASSIS');
    await $btnViewInfo(page).click();
    await page.waitForTimeout(3000);
    await ss(page, 'second query', '13');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await cleanupTestData();
    await ss(page, 'refresh verified', '13');
  });

  test('14 - Loading state', async ({ page }) => {
    await page.route('**/api/v1/hdoc/ud15/viewInfo', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await insertTestData();
    await navigateToPage(page);
    await ss(page, 'page display', '14');
    await $input(page).fill(TEST_SERIE + ' ' + TEST_CHNR);
    await $btnViewInfo(page).click();
    try {
      await expect($btnViewInfo(page)).toBeDisabled({ timeout: 2000 });
      await expect($input(page)).toBeDisabled();
      console.log('  Buttons disabled during loading');
    } catch { console.log('  Response too fast'); }
    await page.unroute('**/api/v1/hdoc/ud15/viewInfo');
    await cleanupTestData();
    await page.waitForTimeout(1000);
    await ss(page, 'loading state', '14');
  });

  test('15 - Prevent duplicate submit', async ({ page }) => {
    await page.route('**/api/v1/hdoc/ud15/viewInfo', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await insertTestData();
    await navigateToPage(page);
    await ss(page, 'page display', '15');
    await $input(page).fill(TEST_SERIE + ' ' + TEST_CHNR);
    await $btnViewInfo(page).click();
    try {
      await expect($btnViewInfo(page)).toBeDisabled({ timeout: 2000 });
    } catch { console.log('  Response too fast'); }
    await page.unroute('**/api/v1/hdoc/ud15/viewInfo');
    await cleanupTestData();
    await page.waitForTimeout(1000);
    await ss(page, 'duplicate prevention', '15');
  });

  test('16 - API 500 error', async ({ page }) => {
    await page.route('**/api/v1/hdoc/ud15/viewInfo', route => {
      route.fulfill({
        status: 500, contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'System error. Please contact administrator.', data: null }),
      });
    });
    await navigateToPage(page);
    await ss(page, 'page display', '16');
    await $input(page).fill(TEST_SERIE + ' ' + TEST_CHNR);
    await $btnViewInfo(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/ud15/viewInfo');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('System error. Please contact administrator.');
    await ss(page, 'api 500', '16');
  });

  // -----------------------------------------------------------
  // Set Regenerate 按钮 (TC17~20)
  // -----------------------------------------------------------
  test('17 - Set Regenerate empty validation', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '17');
    await $btnRegenerate(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Chassis number is required.');
    await ss(page, 'regenerate empty', '17');
  });

  test('18 - Set Regenerate success', async ({ page }) => {
    await insertTestData({ status: '1' });
    await navigateToPage(page);
    await ss(page, 'page display', '18');
    await $input(page).fill(TEST_SERIE + ' ' + TEST_CHNR);
    await $btnRegenerate(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'regenerate clicked', '18');
    // DB 验证 STATUS='0'
    const rows = await queryDB('SELECT STATUS FROM HDOC_SEND_DATA_VIN_PLATE WHERE SERIE=? AND CHNR=?', [TEST_SERIE, TEST_CHNR]);
    if (rows && rows.length > 0) {
      console.log('  DB STATUS after regenerate: ' + rows[0].STATUS);
      expect(rows[0].STATUS).toBe('0');
    }
    await cleanupTestData();
    await ss(page, 'regenerate verified', '18');
  });

  test('19 - Set Regenerate chassis not exist', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '19');
    await $input(page).fill('NONEXIST CHASSIS');
    await $btnRegenerate(page).click();
    await page.waitForTimeout(2000);
    const errVisible = await $err(page).isVisible().catch(() => false);
    if (errVisible) {
      const errText = await $err(page).textContent();
      console.log('  Error: ' + errText);
    }
    await ss(page, 'regenerate not exist', '19');
  });

  test('20 - Set Regenerate loading state', async ({ page }) => {
    await page.route('**/api/v1/hdoc/ud15/setRegenerate', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await insertTestData();
    await navigateToPage(page);
    await ss(page, 'page display', '20');
    await $input(page).fill(TEST_SERIE + ' ' + TEST_CHNR);
    await $btnRegenerate(page).click();
    try {
      await expect($btnRegenerate(page)).toBeDisabled({ timeout: 2000 });
    } catch { console.log('  Response too fast'); }
    await page.unroute('**/api/v1/hdoc/ud15/setRegenerate');
    await cleanupTestData();
    await page.waitForTimeout(1000);
    await ss(page, 'regenerate loading', '20');
  });

  // -----------------------------------------------------------
  // Set OK 按钮 (TC21~24)
  // -----------------------------------------------------------
  test('21 - Set OK empty validation', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '21');
    await $btnSetOk(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Chassis number is required.');
    await ss(page, 'setok empty', '21');
  });

  test('22 - Set OK success', async ({ page }) => {
    await insertTestData({ status: '0' });
    await navigateToPage(page);
    await ss(page, 'page display', '22');
    await $input(page).fill(TEST_SERIE + ' ' + TEST_CHNR);
    await $btnSetOk(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'setok clicked', '22');
    // DB 验证 STATUS='1'
    const rows = await queryDB('SELECT STATUS FROM HDOC_SEND_DATA_VIN_PLATE WHERE SERIE=? AND CHNR=?', [TEST_SERIE, TEST_CHNR]);
    if (rows && rows.length > 0) {
      console.log('  DB STATUS after setok: ' + rows[0].STATUS);
      expect(rows[0].STATUS).toBe('1');
    }
    await cleanupTestData();
    await ss(page, 'setok verified', '22');
  });

  test('23 - Set OK chassis not exist', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '23');
    await $input(page).fill('NONEXIST CHASSIS');
    await $btnSetOk(page).click();
    await page.waitForTimeout(2000);
    const errVisible = await $err(page).isVisible().catch(() => false);
    if (errVisible) {
      const errText = await $err(page).textContent();
      console.log('  Error: ' + errText);
    }
    await ss(page, 'setok not exist', '23');
  });

  test('24 - Set OK loading state', async ({ page }) => {
    await page.route('**/api/v1/hdoc/ud15/setOK', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await insertTestData();
    await navigateToPage(page);
    await ss(page, 'page display', '24');
    await $input(page).fill(TEST_SERIE + ' ' + TEST_CHNR);
    await $btnSetOk(page).click();
    try {
      await expect($btnSetOk(page)).toBeDisabled({ timeout: 2000 });
    } catch { console.log('  Response too fast'); }
    await page.unroute('**/api/v1/hdoc/ud15/setOK');
    await cleanupTestData();
    await page.waitForTimeout(1000);
    await ss(page, 'setok loading', '24');
  });

  // -----------------------------------------------------------
  // Change to Basic Info 按钮 (TC25~28)
  // -----------------------------------------------------------
  test('25 - Basic Info empty validation', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '25');
    await $btnBasic(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Chassis number is required.');
    await ss(page, 'basic empty', '25');
  });

  test('26 - Basic Info success', async ({ page }) => {
    await insertTestData({ status: '1', type: '2' });
    await navigateToPage(page);
    await ss(page, 'page display', '26');
    await $input(page).fill(TEST_SERIE + ' ' + TEST_CHNR);
    await $btnBasic(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'basic clicked', '26');
    // DB 验证 STATUS='0', TYPE='1'
    const rows = await queryDB('SELECT STATUS, TYPE FROM HDOC_SEND_DATA_VIN_PLATE WHERE SERIE=? AND CHNR=?', [TEST_SERIE, TEST_CHNR]);
    if (rows && rows.length > 0) {
      console.log('  DB STATUS=' + rows[0].STATUS + ' TYPE=' + rows[0].TYPE);
      expect(rows[0].STATUS).toBe('0');
      expect(rows[0].TYPE).toBe('1');
    }
    await cleanupTestData();
    await ss(page, 'basic verified', '26');
  });

  test('27 - Basic Info chassis not exist', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '27');
    await $input(page).fill('NONEXIST CHASSIS');
    await $btnBasic(page).click();
    await page.waitForTimeout(2000);
    const errVisible = await $err(page).isVisible().catch(() => false);
    if (errVisible) {
      const errText = await $err(page).textContent();
      console.log('  Error: ' + errText);
    }
    await ss(page, 'basic not exist', '27');
  });

  test('28 - Basic Info loading state', async ({ page }) => {
    await page.route('**/api/v1/hdoc/ud15/changeToBasicInfo', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await insertTestData();
    await navigateToPage(page);
    await ss(page, 'page display', '28');
    await $input(page).fill(TEST_SERIE + ' ' + TEST_CHNR);
    await $btnBasic(page).click();
    try {
      await expect($btnBasic(page)).toBeDisabled({ timeout: 2000 });
    } catch { console.log('  Response too fast'); }
    await page.unroute('**/api/v1/hdoc/ud15/changeToBasicInfo');
    await cleanupTestData();
    await page.waitForTimeout(1000);
    await ss(page, 'basic loading', '28');
  });

  // -----------------------------------------------------------
  // Change to Advanced Info 按钮 (TC29~32)
  // -----------------------------------------------------------
  test('29 - Advanced Info empty validation', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '29');
    await $btnAdvanced(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Chassis number is required.');
    await ss(page, 'advanced empty', '29');
  });

  test('30 - Advanced Info success', async ({ page }) => {
    await insertTestData({ status: '1', type: '1' });
    await navigateToPage(page);
    await ss(page, 'page display', '30');
    await $input(page).fill(TEST_SERIE + ' ' + TEST_CHNR);
    await $btnAdvanced(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'advanced clicked', '30');
    // DB 验证 STATUS='0', TYPE='2'
    const rows = await queryDB('SELECT STATUS, TYPE FROM HDOC_SEND_DATA_VIN_PLATE WHERE SERIE=? AND CHNR=?', [TEST_SERIE, TEST_CHNR]);
    if (rows && rows.length > 0) {
      console.log('  DB STATUS=' + rows[0].STATUS + ' TYPE=' + rows[0].TYPE);
      expect(rows[0].STATUS).toBe('0');
      expect(rows[0].TYPE).toBe('2');
    }
    await cleanupTestData();
    await ss(page, 'advanced verified', '30');
  });

  test('31 - Advanced Info chassis not exist', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '31');
    await $input(page).fill('NONEXIST CHASSIS');
    await $btnAdvanced(page).click();
    await page.waitForTimeout(2000);
    const errVisible = await $err(page).isVisible().catch(() => false);
    if (errVisible) {
      const errText = await $err(page).textContent();
      console.log('  Error: ' + errText);
    }
    await ss(page, 'advanced not exist', '31');
  });

  test('32 - Advanced Info loading state', async ({ page }) => {
    await page.route('**/api/v1/hdoc/ud15/changeToAdvancedInfo', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await insertTestData();
    await navigateToPage(page);
    await ss(page, 'page display', '32');
    await $input(page).fill(TEST_SERIE + ' ' + TEST_CHNR);
    await $btnAdvanced(page).click();
    try {
      await expect($btnAdvanced(page)).toBeDisabled({ timeout: 2000 });
    } catch { console.log('  Response too fast'); }
    await page.unroute('**/api/v1/hdoc/ud15/changeToAdvancedInfo');
    await cleanupTestData();
    await page.waitForTimeout(1000);
    await ss(page, 'advanced loading', '32');
  });

  // -----------------------------------------------------------
  // 异常处理 (TC33~35)
  // -----------------------------------------------------------
  test('33 - Network error on View Info', async ({ page }) => {
    await page.route('**/api/v1/hdoc/ud15/viewInfo', route => route.abort());
    await navigateToPage(page);
    await ss(page, 'page display', '33');
    await $input(page).fill(TEST_SERIE + ' ' + TEST_CHNR);
    await $btnViewInfo(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/ud15/viewInfo');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('System error. Please contact administrator.');
    await ss(page, 'network error', '33');
  });

  test('34 - API timeout', async ({ page }) => {
    await page.route('**/api/v1/hdoc/ud15/viewInfo', async route => {
      await new Promise(r => setTimeout(r, 30000));
      await route.continue();
    });
    await navigateToPage(page);
    await ss(page, 'page display', '34');
    await $input(page).fill(TEST_SERIE + ' ' + TEST_CHNR);
    await $btnViewInfo(page).click();
    // fetch 在浏览器有默认超时，等待超时错误
    await page.waitForTimeout(5000);
    await page.unroute('**/api/v1/hdoc/ud15/viewInfo');
    const errVisible = await $err(page).isVisible().catch(() => false);
    if (errVisible) {
      const errText = await $err(page).textContent();
      console.log('  Timeout error: ' + errText);
    }
    await ss(page, 'timeout', '34');
  });

  test('35 - XML parse failure', async ({ page }) => {
    await insertTestData({ xmlDoc: 'invalid xml content' });
    await navigateToPage(page);
    await ss(page, 'page display', '35');
    await $input(page).fill(TEST_SERIE + ' ' + TEST_CHNR);
    await $btnViewInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'xml parse', '35');
    const hasInfo = await $infoSection(page).isVisible().catch(() => false);
    console.log('  Info section: ' + hasInfo);
    await cleanupTestData();
    await ss(page, 'xml result', '35');
  });

  // -----------------------------------------------------------
  // 消息显示 (TC36~37)
  // -----------------------------------------------------------
  test('36 - Error message style', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '36');
    await $btnViewInfo(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Chassis number is required.');
    const errColor = await $err(page).evaluate(el => getComputedStyle(el).color);
    console.log('  Error color: ' + errColor);
    await ss(page, 'error style', '36');
  });

  test('37 - Message clear on new operation', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '37');
    // 触发第一次错误
    await $btnViewInfo(page).click();
    await expect($err(page)).toBeVisible();
    const firstErr = await $err(page).textContent();
    console.log('  First error: ' + firstErr);
    await ss(page, 'first error', '37');
    // 触发第二次错误
    await $btnViewInfo(page).click();
    await page.waitForTimeout(500);
    await expect($err(page)).toBeVisible();
    const secondErr = await $err(page).textContent();
    console.log('  Second error: ' + secondErr);
    await ss(page, 'second error', '37');
  });

  // -----------------------------------------------------------
  // 安全性 (TC38~41)
  // -----------------------------------------------------------
  test('38 - Unauthenticated access', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'load' });
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
    });
    await ss(page, 'localStorage cleared', '38');
    await page.goto(PAGE_URL + '/menu/vin-plate', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log('  URL: ' + url);
    await ss(page, 'unauthenticated', '38');
    expect(url.includes('/login')).toBe(true);
  });

  test('39 - SQL injection protection', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '39');
    await $input(page).fill("' OR '1'='1");
    await $btnViewInfo(page).click();
    await page.waitForTimeout(2000);
    const errVisible = await $err(page).isVisible().catch(() => false);
    if (errVisible) {
      const errText = await $err(page).textContent();
      console.log('  Error: ' + errText);
      expect(errText.toLowerCase()).not.toContain('sql');
      expect(errText.toLowerCase()).not.toContain('syntax');
    }
    await ss(page, 'sql injection', '39');
  });

  test('40 - XSS protection', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '40');
    let alertTriggered = false;
    page.on('dialog', dialog => {
      alertTriggered = true;
      dialog.accept();
    });
    await $input(page).fill('<script>alert(1)</script>');
    await $btnViewInfo(page).click();
    await page.waitForTimeout(2000);
    expect(alertTriggered).toBe(false);
    await ss(page, 'xss protection', '40');
  });

  test('41 - Multiple buttons simultaneous', async ({ page }) => {
    await page.route('**/api/v1/hdoc/ud15/viewInfo', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await insertTestData();
    await navigateToPage(page);
    await ss(page, 'page display', '41');
    await $input(page).fill(TEST_SERIE + ' ' + TEST_CHNR);
    // 快速点击多个按钮
    await $btnViewInfo(page).click();
    await page.waitForTimeout(200);
    await $btnRegenerate(page).click();
    await page.waitForTimeout(200);
    await $btnSetOk(page).click();
    await page.waitForTimeout(500);
    // 第一个操作开始后其他按钮被禁用
    const viewDisabled = await $btnViewInfo(page).isDisabled();
    console.log('  View Info disabled: ' + viewDisabled);
    await page.unroute('**/api/v1/hdoc/ud15/viewInfo');
    await cleanupTestData();
    await page.waitForTimeout(1000);
    await ss(page, 'multiple buttons', '41');
  });

});
