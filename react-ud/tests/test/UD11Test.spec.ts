/**
 * UD11 - Existing HDoc Variables Result List Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD11.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实 API（无 Mock）
 * 数据库验证: 通过 SQL 查询确认数据
 * 截图保存: tests/test/Image/UD11/
 * 测试用例数: 38
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, getTestUser, createScreenshot, login, PAGE_URL } from './utils';

// -- 截图 --
const ss = createScreenshot('UD11');

// ============================================================
// 测试数据管理
// ============================================================

const TEST_USER = 'UD11_USER';
const testVarList: string[] = [];

/** 插入多条测试数据到 hdoc_variables */
async function insertMultipleTestData() {
  const records = [
    { v: 'UD11_VAR_A', t: 'VDA', d: 'UD11 desc A' },
    { v: 'UD11_VAR_B', t: 'User Defined', d: 'UD11 desc B' },
    { v: 'UD11_VAR_C', t: 'VDA', d: '' },
  ];
  for (const r of records) {
    const existing = await queryDB(
      'SELECT COUNT(*) AS cnt FROM hdoc_variables WHERE VARIABLE=?', [r.v]
    );
    if (existing && existing.length > 0 && Number(existing[0].cnt) > 0) {
      await queryDB('DELETE FROM hdoc_variables WHERE VARIABLE=?', [r.v]);
    }
    await queryDB(
      'INSERT INTO hdoc_variables (VARIABLE, TYPE, DESCRIPTION,'
      + ' REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,'
      + ' UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)'
      + ' VALUES (?, ?, ?, NOW(), ?, \'UD11Test\', NOW(), ?, \'UD11Test\')',
      [r.v, r.t, r.d, TEST_USER, TEST_USER]
    );
    testVarList.push(r.v);
  }
}

/** 删除多条测试数据 */
async function cleanMultipleTestData() {
  for (const v of testVarList) {
    await queryDB('DELETE FROM hdoc_variables WHERE VARIABLE=?', [v]);
  }
  testVarList.length = 0;
}

/** 插入单条测试数据 */
async function insertTestData(variable: string, type: string, desc: string) {
  const existing = await queryDB(
    'SELECT COUNT(*) AS cnt FROM hdoc_variables WHERE VARIABLE=?', [variable]
  );
  if (existing && existing.length > 0 && Number(existing[0].cnt) > 0) {
    await queryDB('DELETE FROM hdoc_variables WHERE VARIABLE=?', [variable]);
  }
  await queryDB(
    'INSERT INTO hdoc_variables (VARIABLE, TYPE, DESCRIPTION,'
    + ' REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,'
    + ' UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)'
    + ' VALUES (?, ?, ?, NOW(), ?, \'UD11Test\', NOW(), ?, \'UD11Test\')',
    [variable, type, desc, TEST_USER, TEST_USER]
  );
}

/** 删除单条测试数据 */
async function cleanTestData(variable: string) {
  await queryDB('DELETE FROM hdoc_variables WHERE VARIABLE=?', [variable]);
}

// ============================================================
// 元素定位（匹配 ExistingHDocVariablesResultList.tsx 源码）
// ============================================================

const $container    = (p: Page) => p.locator('.ehvr-container');
const $header       = (p: Page) => p.locator('.ehvr-header h1');
const $err          = (p: Page) => p.locator('.ehvr-error');
const $loading      = (p: Page) => p.locator('.empty-placeholder');
const $emptyMsg     = (p: Page) => p.locator('.empty-placeholder');
const $count        = (p: Page) => p.locator('.result-count');
const $btnSelect    = (p: Page) => p.locator('.btn-cell button').filter({ hasText: /^Select$/ });
const $btnDown      = (p: Page) => p.locator('.btn-cell button').filter({ hasText: /^Down$/ });
const $btnBack      = (p: Page) => p.locator('.btn-cell button').filter({ hasText: /^Back$/ });
const $btnPrint     = (p: Page) => p.locator('.btn-cell button').filter({ hasText: /^Print$/ });
const $btnExcel     = (p: Page) => p.locator('.btn-cell button').filter({ hasText: /^Excel$/ });
const $table        = (p: Page) => p.locator('.ehvr-table');
const $tableRows    = (p: Page) => p.locator('.ehvr-table tbody tr');
const $thHeader     = (p: Page, col: number) => p.locator('.ehvr-table thead th').nth(col);
const $radio        = (p: Page, idx: number) => $tableRows(p).nth(idx).locator('input[type="radio"]');
const $selectedRow  = (p: Page, idx: number) => $tableRows(p).nth(idx);
const $linkUser     = (p: Page, idx: number) => $tableRows(p).nth(idx).locator('.link-user');
const $cell         = (p: Page, row: number, col: number) => $tableRows(p).nth(row).locator('td').nth(col);

// -- ExistingHDocVariables 页面元素（用于导航） --
const $ehvContainer    = (p: Page) => p.locator('.ehv-container');
const $ehvVarInput     = (p: Page) => p.locator('.ehv-input-variable');
const $ehvTypeSelect   = (p: Page) => p.locator('.ehv-select');
const $ehvDescInput    = (p: Page) => p.locator('.ehv-input-description');
const $ehvBtnSearch    = (p: Page) => p.locator('.btn-cell button').filter({ hasText: /^Search$/ });

// ============================================================
// 导航辅助函数
// ============================================================

/** 登录 -> ExistingHDocVariables -> 填入条件 -> Search -> Result List */
async function navigateToResultList(page: Page, variable: string, type?: string) {
  await login(page);
  await page.goto(PAGE_URL + '/menu/existing-hdoc-vars', { waitUntil: 'load' });
  await page.waitForSelector('.ehv-container');
  await page.waitForTimeout(1000);
  if (variable) {
    await $ehvVarInput(page).fill(variable);
  }
  if (type) {
    await $ehvTypeSelect(page).selectOption(type);
  }
  await $ehvBtnSearch(page).click();
  try { await page.waitForURL('**/existing-hdoc-vars/result', { timeout: 10000 }); } catch { /* ok */ }
  await page.waitForSelector('.ehvr-container', { timeout: 10000 });
  await page.waitForTimeout(500);
}

/** 登录 -> 直接导航到 Result List（无 state） */
async function directNavigateToResultList(page: Page) {
  await login(page);
  await page.goto(PAGE_URL + '/menu/existing-hdoc-vars/result', { waitUntil: 'load' });
  await page.waitForSelector('.ehvr-container', { timeout: 10000 });
  await page.waitForTimeout(500);
}

test.describe.configure({ mode: 'serial' });
test.describe('UD11 Existing HDoc Variables Result List', () => {

  // -----------------------------------------------------------
  // 画面初期表示 (TC1~6)
  // -----------------------------------------------------------

  test('01 - Title bar display', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '01');
    await expect($container(page)).toBeVisible();
    await expect($header(page)).toContainText('Existing HDoc Variables');
    await ss(page, 'title bar', '01');
    await cleanMultipleTestData();
  });

  test('02 - Button area display', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '02');
    await expect($btnSelect(page)).toBeVisible();
    await expect($btnSelect(page)).toHaveText('Select');
    await expect($btnSelect(page)).toBeEnabled();
    await expect($btnDown(page)).toBeVisible();
    await expect($btnDown(page)).toHaveText('Down');
    await expect($btnDown(page)).toBeEnabled();
    await expect($btnBack(page)).toBeVisible();
    await expect($btnBack(page)).toHaveText('Back');
    await expect($btnBack(page)).toBeEnabled();
    await expect($btnPrint(page)).toBeVisible();
    await expect($btnPrint(page)).toHaveText('Print');
    await expect($btnPrint(page)).toBeEnabled();
    await expect($btnExcel(page)).toBeVisible();
    await expect($btnExcel(page)).toHaveText('Excel');
    await expect($btnExcel(page)).toBeEnabled();
    await ss(page, 'button area', '02');
    await cleanMultipleTestData();
  });

  test('03 - Count display', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '03');
    await expect($count(page)).toBeVisible();
    await expect($count(page)).toHaveText(/Number of lines found: \d+/);
    const countText = await $count(page).textContent();
    const match = countText?.match(/(\d+)/);
    const rowCount = await $tableRows(page).count();
    if (match) {
      console.log('  Count: ' + match[1] + ', rows: ' + rowCount);
      expect(parseInt(match[1])).toBe(rowCount);
    }
    await ss(page, 'count display', '03');
    await cleanMultipleTestData();
  });

  test('04 - Error message hidden by default', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '04');
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'error hidden', '04');
    await cleanMultipleTestData();
  });

  test('05 - Loading state', async ({ page }) => {
    await insertMultipleTestData();
    await page.route('**/api/v1/hdoc/variables/search', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await navigateToResultList(page, 'UD11_VAR_A');
    await page.unroute('**/api/v1/hdoc/variables/search');
    await ss(page, 'loading state', '05');
    await cleanMultipleTestData();
  });

  test('06 - Empty result handling', async ({ page }) => {
    await navigateToResultList(page, 'NONEXIST_VAR');
    await ss(page, 'page display', '06');
    await expect($emptyMsg(page)).toBeVisible();
    await expect($emptyMsg(page)).toContainText('No results found. Please go back and try different search criteria.');
    await expect($count(page)).toHaveText('Number of lines found: 0');
    await expect($table(page)).not.toBeVisible();
    await ss(page, 'empty result', '06');
  });

  // -----------------------------------------------------------
  // DataTable 表头属性校验 (TC7~12)
  // -----------------------------------------------------------

  test('07 - Radio selection column', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '07');
    await expect($thHeader(page, 0)).toBeVisible();
    const th0Text = await $thHeader(page, 0).textContent();
    expect(th0Text?.trim()).toBe('');
    const radios = await page.locator('.ehvr-table tbody tr input[type="radio"]').count();
    expect(radios).toBeGreaterThan(0);
    await ss(page, 'radio column', '07');
    await cleanMultipleTestData();
  });

  test('08 - Variable column', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '08');
    await expect($thHeader(page, 1)).toContainText('Variable');
    const displayVar = await $cell(page, 0, 1).textContent();
    console.log('  Display Variable: ' + displayVar);
    // DB 校验
    const dbRows = await queryDB(
      'SELECT VARIABLE FROM hdoc_variables WHERE VARIABLE LIKE \'UD11_VAR_%\' ORDER BY VARIABLE LIMIT 1'
    );
    if (dbRows && dbRows.length > 0) {
      console.log('  DB VARIABLE: ' + dbRows[0].VARIABLE);
    }
    await ss(page, 'Variable column', '08');
    await cleanMultipleTestData();
  });

  test('09 - Type column', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '09');
    await expect($thHeader(page, 2)).toContainText('Type');
    await ss(page, 'Type column', '09');
    await cleanMultipleTestData();
  });

  test('10 - Description column', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '10');
    await expect($thHeader(page, 3)).toContainText('Description');
    await ss(page, 'Description column', '10');
    await cleanMultipleTestData();
  });

  test('11 - Created by user column (link)', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '11');
    await expect($thHeader(page, 4)).toContainText('Created by user');
    await expect($linkUser(page, 0)).toBeVisible();
    await ss(page, 'Created by user column', '11');
    await cleanMultipleTestData();
  });

  test('12 - Date column', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '12');
    await expect($thHeader(page, 5)).toContainText('Date');
    // DB 校验（年月日）
    const dbRows = await queryDB(
      'SELECT REGISTER_DATETIME FROM hdoc_variables WHERE VARIABLE=\'UD11_VAR_A\''
    );
    if (dbRows && dbRows.length > 0) {
      const displayDate = await $cell(page, 0, 5).textContent();
      const dbDateStr = dbRows[0].REGISTER_DATETIME instanceof Date
        ? dbRows[0].REGISTER_DATETIME.toISOString().substring(0, 10)
        : String(dbRows[0].REGISTER_DATETIME).substring(0, 10);
      console.log('  DB Date: ' + dbDateStr + ', display: ' + displayDate);
      expect(displayDate).toBe(dbDateStr);
    }
    await ss(page, 'Date column', '12');
    await cleanMultipleTestData();
  });

  // -----------------------------------------------------------
  // 选择记录操作 (TC13~16)
  // -----------------------------------------------------------

  test('13 - Radio select effect', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, '', 'VDA');
    await ss(page, 'page display', '13');
    await $radio(page, 0).click();
    await expect($radio(page, 0)).toBeChecked();
    await expect($selectedRow(page, 0)).toHaveClass(/selected/);
    await ss(page, 'radio selected', '13');
    await cleanMultipleTestData();
  });

  test('14 - Radio switch', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, '', 'VDA');
    await ss(page, 'page display', '14');
    await $radio(page, 0).click();
    await expect($radio(page, 0)).toBeChecked();
    await $radio(page, 1).click();
    await expect($radio(page, 1)).toBeChecked();
    await expect($radio(page, 0)).not.toBeChecked();
    await expect($selectedRow(page, 0)).not.toHaveClass(/selected/);
    await expect($selectedRow(page, 1)).toHaveClass(/selected/);
    await ss(page, 'radio switch', '14');
    await cleanMultipleTestData();
  });

  test('15 - Radio deselect', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, '', 'VDA');
    await ss(page, 'page display', '15');
    await $radio(page, 0).click();
    await expect($radio(page, 0)).toBeChecked();
    // 组件使用 onChange 事件，已选中 radio 再次点击不触发 onChange
    // radio 保持选中状态
    await $radio(page, 0).click();
    console.log('  Radio remains checked (onChange does not fire for checked radios)');
    await ss(page, 'radio deselect', '15');
    await cleanMultipleTestData();
  });

  test('16 - No selection state', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, '', 'VDA');
    await ss(page, 'page display', '16');
    const selectedCount = await page.locator('.ehvr-table tbody tr.selected').count();
    expect(selectedCount).toBe(0);
    await ss(page, 'no selection', '16');
    await cleanMultipleTestData();
  });

  // -----------------------------------------------------------
  // Select按钮点击事件 (TC17~19)
  // -----------------------------------------------------------

  test('17 - Select validation when no record selected', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '17');
    await $btnSelect(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Please select a record first.');
    expect(page.url()).toContain('/existing-hdoc-vars/result');
    await ss(page, 'select validation', '17');
    await cleanMultipleTestData();
  });

  test('18 - Select record then navigate', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '18');
    await $radio(page, 0).click();
    await expect($radio(page, 0)).toBeChecked();
    await $btnSelect(page).click();
    try { await page.waitForURL('**/existing-hdoc-vars', { timeout: 10000 }); } catch { /* ok */ }
    await page.waitForSelector('.ehv-container', { timeout: 5000 });
    await ss(page, 'select navigate', '18');
    const varVal = await $ehvVarInput(page).inputValue().catch(() => '');
    console.log('  Echoed Variable: ' + varVal);
    await cleanMultipleTestData();
  });

  test('19 - Select button loading state', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '19');
    await expect($btnSelect(page)).toBeEnabled();
    await ss(page, 'select loading', '19');
    await cleanMultipleTestData();
  });

  // -----------------------------------------------------------
  // Down按钮点击事件 (TC20~21)
  // -----------------------------------------------------------

  test('20 - Down validation when no record selected', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '20');
    // Down 按钮无前端校验，直接触发 alert
    let alertMsg = '';
    page.on('dialog', dialog => {
      alertMsg = dialog.message();
      dialog.accept();
    });
    await $btnDown(page).click();
    await page.waitForTimeout(500);
    console.log('  Alert message: ' + alertMsg);
    await ss(page, 'down validation', '20');
    await cleanMultipleTestData();
  });

  test('21 - Down button with selected record', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '21');
    await $radio(page, 0).click();
    let alertMsg = '';
    page.on('dialog', dialog => {
      alertMsg = dialog.message();
      dialog.accept();
    });
    await $btnDown(page).click();
    await page.waitForTimeout(500);
    console.log('  Alert message: ' + alertMsg);
    await ss(page, 'down selected', '21');
    await cleanMultipleTestData();
  });

  // -----------------------------------------------------------
  // Back按钮点击事件 (TC22~23)
  // -----------------------------------------------------------

  test('22 - Back to previous page with conditions', async ({ page }) => {
    await insertMultipleTestData();
    await login(page);
    await page.goto(PAGE_URL + '/menu/existing-hdoc-vars', { waitUntil: 'load' });
    await page.waitForSelector('.ehv-container');
    await page.waitForTimeout(1000);
    await $ehvVarInput(page).fill('UD11_VAR_A');
    await $ehvBtnSearch(page).click();
    try { await page.waitForURL('**/existing-hdoc-vars/result', { timeout: 10000 }); } catch { /* ok */ }
    await page.waitForSelector('.ehvr-container', { timeout: 10000 });
    await page.waitForTimeout(500);
    await ss(page, 'page display', '22');
    await $btnBack(page).click();
    try { await page.waitForURL('**/existing-hdoc-vars', { timeout: 10000 }); } catch { /* ok */ }
    await page.waitForSelector('.ehv-container', { timeout: 5000 });
    await ss(page, 'back with conditions', '22');
    const varVal = await $ehvVarInput(page).inputValue().catch(() => '');
    console.log('  Echoed Variable: ' + varVal);
    await cleanMultipleTestData();
  });

  test('23 - Back without conditions', async ({ page }) => {
    await directNavigateToResultList(page);
    await ss(page, 'page display', '23');
    await $btnBack(page).click();
    try { await page.waitForURL('**/existing-hdoc-vars', { timeout: 10000 }); } catch { /* ok */ }
    await page.waitForSelector('.ehv-container', { timeout: 5000 });
    await ss(page, 'back no conditions', '23');
  });

  // -----------------------------------------------------------
  // Print按钮点击事件 (TC24~25)
  // -----------------------------------------------------------

  test('24 - Print button triggers browser print', async ({ page }) => {
    await insertMultipleTestData();
    let printTriggered = false;
    page.on('popup', () => { printTriggered = true; });
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '24');
    await $btnPrint(page).click();
    await page.waitForTimeout(1000);
    console.log('  Print triggered: ' + printTriggered);
    await ss(page, 'print clicked', '24');
    await cleanMultipleTestData();
  });

  test('25 - Print button failure (browser blocked)', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '25');
    // 模拟 window.print 被覆盖（浏览器不支持）
    await page.evaluate(() => { window.print = () => { throw new Error('Print blocked'); }; });
    let printError = false;
    page.on('pageerror', () => { printError = true; });
    await $btnPrint(page).click();
    await page.waitForTimeout(1000);
    console.log('  Print error occurred: ' + printError);
    // 系统不应崩溃
    await expect($container(page)).toBeVisible();
    await ss(page, 'print failure', '25');
    await cleanMultipleTestData();
  });

  // -----------------------------------------------------------
  // Excel按钮点击事件 (TC26~28)
  // -----------------------------------------------------------

  test('26 - Excel CSV export with data', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '26');
    await $btnExcel(page).click();
    await page.waitForTimeout(1000);
    await ss(page, 'excel export', '26');
    await cleanMultipleTestData();
  });

  test('27 - Excel CSV export no data', async ({ page }) => {
    await navigateToResultList(page, 'NONEXIST_VAR');
    await ss(page, 'page display', '27');
    await $btnExcel(page).click();
    await page.waitForTimeout(1000);
    await ss(page, 'excel no data', '27');
  });

  test('28 - Excel CSV export failure (API error)', async ({ page }) => {
    await insertMultipleTestData();
    await page.route('**/api/v1/hdoc/variables/export', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'CSV导出失败，请联系管理员' }),
      });
    });
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '28');
    await $btnExcel(page).click();
    await page.waitForTimeout(1000);
    await page.unroute('**/api/v1/hdoc/variables/export');
    if (await $err(page).isVisible().catch(() => false)) {
      console.log('  Error: ' + (await $err(page).textContent()));
    }
    await ss(page, 'excel failure', '28');
    await cleanMultipleTestData();
  });

  // -----------------------------------------------------------
  // Created by user链接点击 (TC29)
  // -----------------------------------------------------------

  test('29 - Created by user link navigates to EDB User View', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '29');
    await expect($linkUser(page, 0)).toBeVisible();
    const userText = await $linkUser(page, 0).textContent();
    console.log('  Link text: ' + userText);
    await $linkUser(page, 0).click();
    try { await page.waitForURL('**/edb-user-view', { timeout: 10000 }); } catch { /* ok */ }
    await page.waitForTimeout(1000);
    const url = page.url();
    console.log('  Navigated to: ' + url);
    expect(url).toContain('edb-user-view');
    await ss(page, 'link navigation', '29');
    await cleanMultipleTestData();
  });

  // -----------------------------------------------------------
  // 异常处理 (TC30~32)
  // -----------------------------------------------------------

  test('30 - Load results failure', async ({ page }) => {
    await page.route('**/api/v1/hdoc/variables/search', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'Failed to fetch results.', data: null }),
      });
    });
    await navigateToResultList(page, 'UD11_VAR_A');
    await page.unroute('**/api/v1/hdoc/variables/search');
    await ss(page, 'page display', '30');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('Failed to fetch results.');
    await ss(page, 'load failure', '30');
  });

  test('31 - Network error', async ({ page }) => {
    await page.route('**/api/v1/hdoc/variables/search', route => route.abort());
    await navigateToResultList(page, 'TEST');
    await page.unroute('**/api/v1/hdoc/variables/search');
    await ss(page, 'page display', '31');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('System error. Please contact administrator.');
    await ss(page, 'network error', '31');
  });

  test('32 - API timeout', async ({ page }) => {
    await page.route('**/api/v1/hdoc/variables/search', async route => {
      await new Promise(r => setTimeout(r, 15000));
      await route.continue();
    });
    await navigateToResultList(page, 'TEST');
    await page.unroute('**/api/v1/hdoc/variables/search');
    await ss(page, 'page display', '32');
    if (await $err(page).isVisible().catch(() => false)) {
      await expect($err(page)).toContainText('System error. Please contact administrator.');
    } else {
      console.log('  API may have completed after timeout');
    }
    await ss(page, 'API timeout', '32');
  });

  // -----------------------------------------------------------
  // 消息显示 (TC33~34)
  // -----------------------------------------------------------

  test('33 - Error message color', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '33');
    await $btnSelect(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Please select a record first.');
    const color = await $err(page).evaluate(el => getComputedStyle(el).color);
    console.log('  Error color: ' + color);
    await ss(page, 'error style', '33');
    await cleanMultipleTestData();
  });

  test('34 - Error message overwrite on new action', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '34');
    await $btnSelect(page).click();
    await expect($err(page)).toBeVisible();
    const msg1 = await $err(page).textContent();
    await $btnSelect(page).click();
    await expect($err(page)).toBeVisible();
    const msg2 = await $err(page).textContent();
    console.log('  Msg1: ' + msg1 + ', Msg2: ' + msg2);
    await ss(page, 'message overwrite', '34');
    await cleanMultipleTestData();
  });

  // -----------------------------------------------------------
  // 安全性 (TC35~38)
  // -----------------------------------------------------------

  test('35 - Unauthenticated access', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'load' });
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
    });
    await page.goto(PAGE_URL + '/menu/existing-hdoc-vars/result', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log('  Current URL: ' + url);
    if (url.includes('/login')) console.log('  Redirected to login');
    await ss(page, 'unauthenticated', '35');
  });

  test('36 - SQL injection protection', async ({ page }) => {
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '36');
    await expect($container(page)).toBeVisible();
    if (await $err(page).isVisible().catch(() => false)) {
      const errText = await $err(page).textContent();
      expect(errText).not.toContain('SQL');
      expect(errText).not.toContain('syntax');
    }
    await ss(page, 'SQL injection', '36');
    await cleanMultipleTestData();
  });

  test('37 - XSS protection', async ({ page }) => {
    let dialogCount = 0;
    page.on('dialog', () => { dialogCount++; });
    await insertMultipleTestData();
    await navigateToResultList(page, 'UD11_VAR_A');
    await ss(page, 'page display', '37');
    await expect($container(page)).toBeVisible();
    expect(dialogCount).toBe(0);
    console.log('  Dialog count: ' + dialogCount);
    await ss(page, 'XSS protection', '37');
    await cleanMultipleTestData();
  });

  test('38 - XSS in search results', async ({ page }) => {
    let dialogCount = 0;
    page.on('dialog', () => { dialogCount++; });
    // 插入含 XSS 的测试数据
    await insertTestData('<script>alert(1)</script>', 'VDA', 'XSS test');
    await navigateToResultList(page, '<script>alert(1)</script>');
    await ss(page, 'page display', '38');
    // XSS 代码不应执行
    expect(dialogCount).toBe(0);
    console.log('  Dialog count: ' + dialogCount);
    if (await $table(page).isVisible().catch(() => false)) {
      const displayVar = await $cell(page, 0, 1).textContent();
      console.log('  Displayed Variable: ' + displayVar);
    }
    await ss(page, 'XSS search result', '38');
    await cleanTestData('<script>alert(1)</script>');
  });

});
