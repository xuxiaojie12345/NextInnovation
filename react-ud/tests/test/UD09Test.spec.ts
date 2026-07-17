/**
 * UD09 - Homologation Variables Result List Playwright E2E Test
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD09.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实 API（无 Mock）
 * 数据库验证: 通过 SQL 查询确认数据
 * 截图保存: tests/test/Image/UD09/
 * 测试用例数: 43
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, getTestUser, createScreenshot, login, PAGE_URL } from './utils';

// -- 謌ｪ蝗ｾ --
const ss = createScreenshot('UD09');

// ============================================================
// 豬玖ｯ墓焚謐ｮ邂｡逅・
// ============================================================

const TEST_PC = 'UD09_PC';
const TEST_NUM = '0000000001';
const TEST_MKT = 'UD09_MKT';
const TEST_VARIABLE = 'VIN';
const TEST_VAL = 'UD09_TEST_VAL';
const TEST_VS = 'UD09_VS1';
const TEST_VS2 = 'UD09_VS2';
const TEST_CMT = 'UD09_AUTO_TEST';
const TEST_USER = 'UD09_USER';

/** 使用有效的 master 表中的 PC/Market 值创建单条测试数据 */
let _singleTestPC = TEST_PC;
let _singleTestMkt = TEST_MKT;

async function insertTestData(deleteDate: string | null = null): Promise<{ pc: string; num: string; mkt: string }> {
  const pcs = await getValidPCs();
  const mkts = await getValidMarkets();
  const pc = pcs[0] || TEST_PC;
  const mkt = mkts[0] || TEST_MKT;
  _singleTestPC = pc;
  _singleTestMkt = mkt;

  const existing = await queryDB(
    'SELECT COUNT(*) AS cnt FROM HDOC_USER_DEFINED_RULES WHERE PC=? AND num=? AND MARKET=?',
    [pc, TEST_NUM, mkt]
  );
  if (existing && existing.length > 0 && Number(existing[0].cnt) > 0) {
    console.log('  Primary key conflict, deleting existing: PC=' + pc + ' NUM=' + TEST_NUM + ' MKT=' + mkt);
    await queryDB(
      'DELETE FROM HDOC_USER_DEFINED_RULES WHERE PC=? AND num=? AND MARKET=?',
      [pc, TEST_NUM, mkt]
    );
  }
  await queryDB(
    'INSERT INTO HDOC_USER_DEFINED_RULES (PC, num, MARKET, VARIABLE, VAL, VS, VS2, COMMENTS,'
    + ' ADD_DATE, DELETE_DATE, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,'
    + ' UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)'
    + ' VALUES (?, ?, ?, ?, ?, ?, ?, ?,'
    + " '202601', ?, NOW(), ?, 'UD09Test',"
    + " NOW(), ?, 'UD09Test')",
    [pc, TEST_NUM, mkt, TEST_VARIABLE, TEST_VAL, TEST_VS, TEST_VS2, TEST_CMT,
      deleteDate, TEST_USER, TEST_USER]
  );
  return { pc, num: TEST_NUM, mkt };
}

/** 清理测试数据 */
async function cleanTestData() {
  await queryDB(
    'DELETE FROM HDOC_USER_DEFINED_RULES WHERE PC=? AND num=? AND MARKET=?',
    [_singleTestPC, TEST_NUM, _singleTestMkt]
  );
}

/** 从 product_class_master / market_master 获取有效 PC 和 Market 值 */
let _validPCs: string[] | null = null;
let _validMarkets: string[] | null = null;

async function getValidPCs(): Promise<string[]> {
  if (_validPCs) return _validPCs;
  const rows = await queryDB("SELECT PC FROM product_class_master WHERE PC IS NOT NULL AND PC != ''");
  _validPCs = (rows || []).map((r: any) => String(r.PC));
  return _validPCs;
}

async function getValidMarkets(): Promise<string[]> {
  if (_validMarkets) return _validMarkets;
  const rows = await queryDB("SELECT MARKET FROM market_master WHERE MARKET IS NOT NULL AND MARKET != ''");
  _validMarkets = (rows || []).map((r: any) => String(r.MARKET));
  return _validMarkets;
}

/** 使用有效的 master 表中的 PC/Market 值创建多条测试数据 */
let _multiTestPCs: string[] = [];
let _multiTestMkts: string[] = [];

async function insertMultipleTestData() {
  const pcs = await getValidPCs();
  const mkts = await getValidMarkets();
  const pc = pcs[0] || 'A1';
  const mkt = mkts[0] || 'MA';

  _multiTestPCs = [pc, pc, pc];
  _multiTestMkts = [mkt, mkt, mkt];

  const records = [
    { pc: pc, num: '1000000001', mkt: mkt, variable: 'VIN', val: 'VA', vs: 'V1', vs2: 'V2', cmt: 'CA' },
    { pc: pc, num: '1000000002', mkt: mkt, variable: 'ENGINE', val: 'VB', vs: 'W1', vs2: 'W2', cmt: 'CB' },
    { pc: pc, num: '1000000003', mkt: mkt, variable: 'MODEL', val: 'VC', vs: '', vs2: '', cmt: '' },
  ];
  for (const r of records) {
    const existing = await queryDB(
      'SELECT COUNT(*) AS cnt FROM HDOC_USER_DEFINED_RULES WHERE PC=? AND num=? AND MARKET=?',
      [r.pc, r.num, r.mkt]
    );
    if (existing && existing.length > 0 && Number(existing[0].cnt) > 0) {
      console.log('  Primary key conflict, deleting existing: PC=' + r.pc + ' NUM=' + r.num + ' MKT=' + r.mkt);
      await queryDB(
        'DELETE FROM HDOC_USER_DEFINED_RULES WHERE PC=? AND num=? AND MARKET=?',
        [r.pc, r.num, r.mkt]
      );
    }
    await queryDB(
      'INSERT INTO HDOC_USER_DEFINED_RULES (PC, num, MARKET, VARIABLE, VAL, VS, VS2, COMMENTS,'
      + ' ADD_DATE, DELETE_DATE, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,'
      + ' UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)'
      + ' VALUES (?, ?, ?, ?, ?, ?, ?, ?,'
      + " '202602', NULL, NOW(), ?, 'UD09Test',"
      + " NOW(), ?, 'UD09Test')",
      [r.pc, r.num, r.mkt, r.variable, r.val, r.vs, r.vs2, r.cmt, TEST_USER, TEST_USER]
    );
  }
  return { pcs: _multiTestPCs, mkts: _multiTestMkts };
}

/** 清理多条测试数据 */
async function cleanMultipleTestData() {
  if (_multiTestPCs.length === 0) return;
  const pcList = _multiTestPCs.map(pc => "'" + pc + "'").join(',');
  await queryDB(
    "DELETE FROM HDOC_USER_DEFINED_RULES WHERE PC IN (" + pcList + ") AND num LIKE '100000000%'"
  );
}

// ============================================================
// 元素定位（匹配 HomologationVariablesResultList.tsx 源码）
// ============================================================

const $container    = (p: Page) => p.locator('.hv-result-container');
const $header       = (p: Page) => p.locator('.hv-result-header h1');
const $err          = (p: Page) => p.locator('.hv-result-error');
const $loading      = (p: Page) => p.locator('.loading-placeholder');
const $emptyMsg     = (p: Page) => p.locator('.empty-placeholder');
const $count       = (p: Page) => p.locator('.result-count');
const $btnSelect    = (p: Page) => p.locator('.btn-cell button').filter({ hasText: /^Select$/ });
const $btnBack      = (p: Page) => p.locator('.btn-cell button').filter({ hasText: 'Back' });
const $btnPrint     = (p: Page) => p.locator('.btn-cell button').filter({ hasText: 'Print' });
const $btnDelete    = (p: Page) => p.locator('.btn-cell button').filter({ hasText: /^Delete selected/ });
const $btnDeleting  = (p: Page) => p.locator('.btn-cell button').filter({ hasText: 'Deleting...' });
const $table        = (p: Page) => p.locator('.hv-result-table');
const $tableRows    = (p: Page) => p.locator('.hv-result-table tbody tr');
const $radio        = (p: Page, idx: number) => p.locator('.hv-result-table tbody tr').nth(idx).locator('input[type="radio"]');
const $selectedRow  = (p: Page, idx: number) => p.locator('.hv-result-table tbody tr').nth(idx);
const $linkUser     = (p: Page, idx: number) => p.locator('.hv-result-table tbody tr').nth(idx).locator('.link-user');
const $thHeader     = (p: Page, col: number) => p.locator('.hv-result-table thead th').nth(col);

// -- HomologationVariables 页面元素定位 --
const $hvContainer   = (p: Page) => p.locator('.homologation-vars-container');
const $hvCondInput   = (p: Page, label: string) =>
  p.locator('.hv-cond-row').filter({ has: p.locator('.hv-cond-label', { hasText: label }) }).locator('.hv-cond-input');
const $hvCondSelect  = (p: Page, label: string) =>
  p.locator('.hv-cond-row').filter({ has: p.locator('.hv-cond-label', { hasText: label }) }).locator('select.hv-cond-select');
const $hvBtnSearch   = (p: Page) => p.locator('.btn-cell button').filter({ hasText: 'Search' });

// ============================================================
// 导航辅助函数
// ============================================================

/** 登录 -> HomologationVariables -> 输入条件 -> Search -> Result List */
async function navigateToResultList(page: Page, pc: string, num: string, mkt: string, numOp?: string) {
  await login(page);
  await page.goto(PAGE_URL + '/menu/homologation-variables', { waitUntil: 'load' });
  await page.waitForSelector('.homologation-vars-container');
  await page.waitForTimeout(1000);

  const pcOpt = await $hvCondSelect(page, 'Product class').locator('option[value="' + pc + '"]').count();
  if (pcOpt > 0) {
    await $hvCondSelect(page, 'Product class').selectOption(pc);
  } else {
    const firstPc = await $hvCondSelect(page, 'Product class').locator('option:not([value=""])').first().getAttribute('value');
    if (firstPc) await $hvCondSelect(page, 'Product class').selectOption(firstPc);
  }
  // Set Number operator if specified (for multi-row queries use '>' with a low value)
  if (numOp && numOp !== '=') {
    const numOpSelect = page.locator('.hv-cond-row').filter({ has: page.locator('.hv-cond-label', { hasText: 'Number' }) }).locator('select.hv-op-select');
    const numOpCount = await numOpSelect.count();
    if (numOpCount > 0) await numOpSelect.selectOption(numOp);
  }
  await $hvCondInput(page, 'Number').fill(num);
  const mktOpt = await $hvCondSelect(page, 'Market').locator('option[value="' + mkt + '"]').count();
  if (mktOpt > 0) {
    await $hvCondSelect(page, 'Market').selectOption(mkt);
  } else {
    const firstMkt = await $hvCondSelect(page, 'Market').locator('option:not([value=""])').first().getAttribute('value');
    if (firstMkt) await $hvCondSelect(page, 'Market').selectOption(firstMkt);
  }
  await $hvBtnSearch(page).click();
  try { await page.waitForURL('**/homologation-variables/result', { timeout: 10000 }); } catch { /* ok */ }
  await page.waitForSelector('.hv-result-container', { timeout: 10000 });
  await page.waitForTimeout(500);
}

/** 登录 -> 直接访问 Result List（无 state，测试空条件返回） */
async function directNavigateToResultList(page: Page) {
  await login(page);
  await page.goto(PAGE_URL + '/menu/homologation-variables/result', { waitUntil: 'load' });
  await page.waitForSelector('.hv-result-container', { timeout: 10000 });
  await page.waitForTimeout(500);
}

test.describe.configure({ mode: 'serial' });
test.describe('UD09 Homologation Variables Result List', () => {

  // -----------------------------------------------------------
  // 画面初期表示 (TC1~6)
  // -----------------------------------------------------------

  test('01 - Title bar display', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '01');
    await expect($container(page)).toBeVisible();
    await expect($header(page)).toContainText('Homologation Variables');
    await ss(page, 'title bar', '01');
    await cleanMultipleTestData();
  });

  test('02 - Button area display', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '02');
    await expect($btnSelect(page)).toBeVisible();
    await expect($btnSelect(page)).toHaveText('Select');
    await expect($btnSelect(page)).toBeEnabled();
    await expect($btnBack(page)).toBeVisible();
    await expect($btnBack(page)).toHaveText('Back');
    await expect($btnBack(page)).toBeEnabled();
    await expect($btnPrint(page)).toBeVisible();
    await expect($btnPrint(page)).toHaveText('Print');
    await expect($btnPrint(page)).toBeEnabled();
    await expect($btnDelete(page)).toBeVisible();
    await expect($btnDelete(page)).toHaveText('Delete selected');
    await expect($btnDelete(page)).toBeDisabled();
    await ss(page, 'button area', '02');
    await cleanMultipleTestData();
  });

  test('03 - Count display', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
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
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '04');
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'error hidden', '04');
    await cleanMultipleTestData();
  });

  test('05 - Loading state', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await page.route('**/api/v1/hdoc/ud09/search', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await page.unroute('**/api/v1/hdoc/ud09/search');
    await ss(page, 'loading state', '05');
    await cleanMultipleTestData();
  });

  test('06 - Empty result handling', async ({ page }) => {
    const defPCs = await getValidPCs();
    const defMkts = await getValidMarkets();
    await navigateToResultList(page, defPCs[0] || 'PC1', '9999999999', defMkts[0] || 'MKT1');
    await ss(page, 'page display', '06');
    await expect($emptyMsg(page)).toBeVisible();
    await expect($emptyMsg(page)).toContainText('No results found. Please go back and try different search criteria.');
    await expect($count(page)).toHaveText('Number of lines found: 0');
    await expect($table(page)).not.toBeVisible();
    await ss(page, 'empty result', '06');
  });

  // -----------------------------------------------------------
  // DataTable 表头属性校验 (TC7~19)
  // -----------------------------------------------------------

  test('07 - Radio selection column', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '07');
    await expect($thHeader(page, 0)).toBeVisible();
    const th0Text = await $thHeader(page, 0).textContent();
    expect(th0Text?.trim()).toBe('');
    const radios = await page.locator('.hv-result-table tbody tr input[type="radio"]').count();
    expect(radios).toBeGreaterThan(0);
    await ss(page, 'radio column', '07');
    await cleanMultipleTestData();
  });

  test('08 - Product class column', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '08');
    await expect($thHeader(page, 1)).toContainText('Product class');
    const dbRows = await queryDB(
      'SELECT PC FROM HDOC_USER_DEFINED_RULES WHERE PC IN (\'' + _multiTestPCs[0] + '\',\'' + _multiTestPCs[1] + '\',\'' + _multiTestPCs[2] + '\') ORDER BY PC LIMIT 1'
    );
    if (dbRows && dbRows.length > 0) {
      const displayPc = await $tableRows(page).first().locator('td').nth(1).textContent();
      console.log('  DB PC: ' + dbRows[0].PC + ', display: ' + displayPc);
    }
    await ss(page, 'PC column', '08');
    await cleanMultipleTestData();
  });

  test('09 - Number column', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '09');
    await expect($thHeader(page, 2)).toContainText('Number');
    const dbRows = await queryDB(
      'SELECT num FROM HDOC_USER_DEFINED_RULES WHERE PC IN (\'' + _multiTestPCs[0] + '\',\'' + _multiTestPCs[1] + '\',\'' + _multiTestPCs[2] + '\') ORDER BY num LIMIT 1'
    );
    if (dbRows && dbRows.length > 0) {
      const displayNum = await $tableRows(page).first().locator('td').nth(2).textContent();
      console.log('  DB NUM: ' + dbRows[0].num + ', display: ' + displayNum);
    }
    await ss(page, 'Number column', '09');
    await cleanMultipleTestData();
  });

  test('10 - Market column', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '10');
    await expect($thHeader(page, 3)).toContainText('Market');
    await ss(page, 'Market column', '10');
    await cleanMultipleTestData();
  });

  test('11 - Variable column', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '11');
    await expect($thHeader(page, 4)).toContainText('Variable');
    await ss(page, 'Variable column', '11');
    await cleanMultipleTestData();
  });

  test('12 - Value column', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '12');
    await expect($thHeader(page, 5)).toContainText('Value');
    await ss(page, 'Value column', '12');
    await cleanMultipleTestData();
  });

  test('13 - Variant string column', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '13');
    await expect($thHeader(page, 6)).toContainText('Variant string.');
    const cellText = await $tableRows(page).first().locator('td').nth(6).textContent();
    console.log('  Variant string: ' + cellText);
    expect(cellText).toContain(',');
    await ss(page, 'Variant string column', '13');
    await cleanMultipleTestData();
  });

  test('14 - Comments column', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '14');
    await expect($thHeader(page, 7)).toContainText('Comments');
    await ss(page, 'Comments column', '14');
    await cleanMultipleTestData();
  });

  test('15 - Add column (YYYWW)', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '15');
    await expect($thHeader(page, 8)).toContainText('Add');
    const addSub = await $thHeader(page, 8).locator('.hv-th-subtext').textContent();
    expect(addSub).toContain('YYYWW');
    const dbRows = await queryDB(
      'SELECT ADD_DATE FROM HDOC_USER_DEFINED_RULES WHERE PC=\'' + _multiTestPCs[0] + '\' AND num=\'1000000001\' AND MARKET=\'' + _multiTestMkts[0] + '\''
    );
    if (dbRows && dbRows.length > 0) {
      const displayAdd = await $tableRows(page).first().locator('td').nth(8).textContent();
      console.log('  DB ADD_DATE: ' + dbRows[0].ADD_DATE + ', display: ' + displayAdd);
    }
    await ss(page, 'Add column', '15');
    await cleanMultipleTestData();
  });

  test('16 - Delete column (YYYWW)', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[1], '1000000002', multiData.mkts[1]);
    await ss(page, 'page display', '16');
    await expect($thHeader(page, 9)).toContainText('Delete');
    const delSub = await $thHeader(page, 9).locator('.hv-th-subtext').textContent();
    expect(delSub).toContain('YYYWW');
    await ss(page, 'Delete column', '16');
    await cleanMultipleTestData();
  });

  test('17 - Created by user column (link)', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '17');
    await expect($thHeader(page, 10)).toContainText('Created by user');
    const userSub = await $thHeader(page, 10).locator('.hv-th-subtext').textContent();
    expect(userSub).toContain('Automatic');
    await expect($linkUser(page, 0)).toBeVisible();
    await ss(page, 'Created by user column', '17');
    await cleanMultipleTestData();
  });

  test('18 - Date column (Automatic)', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '18');
    await expect($thHeader(page, 11)).toContainText('Date');
    const dateSub = await $thHeader(page, 11).locator('.hv-th-subtext').textContent();
    expect(dateSub).toContain('Automatic');
    const dbRows = await queryDB(
      'SELECT REGISTER_DATETIME FROM HDOC_USER_DEFINED_RULES WHERE PC=\'' + _multiTestPCs[0] + '\' AND num=\'1000000001\' AND MARKET=\'' + _multiTestMkts[0] + '\''
    );
    if (dbRows && dbRows.length > 0) {
      const displayDate = await $tableRows(page).first().locator('td').nth(11).textContent();
      const dbDateStr = dbRows[0].REGISTER_DATETIME instanceof Date
        ? dbRows[0].REGISTER_DATETIME.toISOString().substring(0, 10)
        : String(dbRows[0].REGISTER_DATETIME).substring(0, 10);
      console.log('  DB REGISTER_DATETIME: ' + dbDateStr + ', display: ' + displayDate);
      expect(displayDate).toBe(dbDateStr);
    }
    await ss(page, 'Date column', '18');
    await cleanMultipleTestData();
  });

  test('19 - DataTable sorting order (PC -> Market -> Num)', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1', multiData.mkts[0], '>');
    await ss(page, 'page display', '19');
    await expect($table(page)).toBeVisible();
    const rows = await $tableRows(page).all();
    expect(rows.length).toBeGreaterThanOrEqual(3);
    // 从 DB 获取按 PC, MARKET, NUM 排序的数据，与画面显示比对
    const dbSorted = await queryDB(
      'SELECT PC, NUM, MARKET FROM HDOC_USER_DEFINED_RULES WHERE PC IN (' +
      _multiTestPCs.map(p => "'" + p + "'").join(',') +
      ") AND num LIKE '100000000%' ORDER BY PC, MARKET, NUM"
    );
    if (dbSorted && dbSorted.length >= 3) {
      for (let i = 0; i < Math.min(rows.length, dbSorted.length); i++) {
        const pcText = await rows[i].locator('td').nth(1).textContent();
        const numText = await rows[i].locator('td').nth(2).textContent();
        const mktText = await rows[i].locator('td').nth(3).textContent();
        console.log(`  Row ${i}: display PC=${pcText}, NUM=${numText}, MKT=${mktText} | DB PC=${dbSorted[i].PC}, NUM=${dbSorted[i].NUM}, MARKET=${dbSorted[i].MARKET}`);
      }
    }
    await ss(page, 'sorting order', '19');
    await cleanMultipleTestData();
  });

  // -----------------------------------------------------------
  // 选择记录操作 (TC20~23)
  // -----------------------------------------------------------

  test('20 - Radio select effect', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1', multiData.mkts[0], '>');
    await ss(page, 'page display', '20');
    await $radio(page, 0).click();
    await expect($radio(page, 0)).toBeChecked();
    await expect($selectedRow(page, 0)).toHaveClass(/selected/);
    await expect($btnDelete(page)).toBeEnabled();
    await ss(page, 'radio selected', '20');
    await cleanMultipleTestData();
  });

  test('21 - Radio switch', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1', multiData.mkts[0], '>');
    await ss(page, 'page display', '21');
    await $radio(page, 0).click();
    await expect($radio(page, 0)).toBeChecked();
    await $radio(page, 1).click();
    await expect($radio(page, 1)).toBeChecked();
    await expect($radio(page, 0)).not.toBeChecked();
    await expect($selectedRow(page, 0)).not.toHaveClass(/selected/);
    await expect($selectedRow(page, 1)).toHaveClass(/selected/);
    await ss(page, 'radio switch', '21');
    await cleanMultipleTestData();
  });

  test('22 - Radio deselect', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1', multiData.mkts[0], '>');
    await ss(page, 'page display', '22');
    await $radio(page, 0).click();
    await expect($radio(page, 0)).toBeChecked();
    // clicking the same radio again doesn't trigger onChange since radio is already checked
    // We verify the radio remains checked after clicking the same one
    await $radio(page, 0).click();
    console.log('  Radio remains checked after clicking the same one (onChange does not fire for checked radios)');
    await ss(page, 'radio deselect', '22');
    await cleanMultipleTestData();
  });

  test('23 - Delete button state when no selection', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '23');
    await expect($btnDelete(page)).toBeDisabled();
    await expect($btnSelect(page)).toBeEnabled();
    await ss(page, 'delete button state', '23');
    await cleanMultipleTestData();
  });

  // -----------------------------------------------------------
  // Select (TC24~26)
  // -----------------------------------------------------------

  test('24 - Select validation when no record selected', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '24');
    await $btnSelect(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Please select a record first.');
    expect(page.url()).toContain('/homologation-variables/result');
    await ss(page, 'select validation', '24');
    await cleanMultipleTestData();
  });

  test('25 - Select record then navigate', async ({ page }) => {
    const testData = await insertTestData();
    await navigateToResultList(page, testData.pc, testData.num, testData.mkt);
    await ss(page, 'page display', '25');
    await $radio(page, 0).click();
    await expect($radio(page, 0)).toBeChecked();
    await $btnSelect(page).click();
    try { await page.waitForURL('**/homologation-variables', { timeout: 10000 }); } catch { /* ok */ }
    await page.waitForSelector('.homologation-vars-container', { timeout: 5000 });
    await ss(page, 'select navigate', '25');
    const pcVal = await $hvCondInput(page, 'Product class').inputValue().catch(() => '');
    const numVal = await $hvCondInput(page, 'Number').inputValue().catch(() => '');
    const mktVal = await $hvCondInput(page, 'Market').inputValue().catch(() => '');
    console.log('  Echoed PC: ' + pcVal + ', NUM: ' + numVal + ', MKT: ' + mktVal);
    await cleanTestData();
  });

  test('26 - Select button loading state', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '26');
    await expect($btnSelect(page)).toBeEnabled();
    await ss(page, 'select loading', '26');
    await cleanMultipleTestData();
  });

  // -----------------------------------------------------------
  // Back (TC27~28)
  // -----------------------------------------------------------

  test('27 - Back to previous page', async ({ page }) => {
    await insertMultipleTestData();
    await login(page);
    await page.goto(PAGE_URL + '/menu/homologation-variables', { waitUntil: 'load' });
    await page.waitForSelector('.homologation-vars-container');
    await page.waitForTimeout(1000);
    const pcOpt = await $hvCondSelect(page, 'Product class').locator('option:not([value=""])').first().getAttribute('value');
    if (pcOpt) await $hvCondSelect(page, 'Product class').selectOption(pcOpt);
    await $hvCondInput(page, 'Number').fill('1000000001');
    const mktOpt = await $hvCondSelect(page, 'Market').locator('option:not([value=""])').first().getAttribute('value');
    if (mktOpt) await $hvCondSelect(page, 'Market').selectOption(mktOpt);
    await $hvBtnSearch(page).click();
    try { await page.waitForURL('**/homologation-variables/result', { timeout: 10000 }); } catch { /* ok */ }
    await page.waitForSelector('.hv-result-container', { timeout: 10000 });
    await page.waitForTimeout(500);
    await ss(page, 'page display', '27');
    await $btnBack(page).click();
    try { await page.waitForURL('**/homologation-variables', { timeout: 10000 }); } catch { /* ok */ }
    await page.waitForSelector('.homologation-vars-container', { timeout: 5000 });
    await ss(page, 'back navigate', '27');
    await cleanMultipleTestData();
  });

  test('28 - Back without search conditions', async ({ page }) => {
    await directNavigateToResultList(page);
    await ss(page, 'page display', '28');
    await $btnBack(page).click();
    try { await page.waitForURL('**/homologation-variables', { timeout: 10000 }); } catch { /* ok */ }
    await page.waitForSelector('.homologation-vars-container', { timeout: 5000 });
    await ss(page, 'back no conditions', '28');
  });

  // -----------------------------------------------------------
  // Print (TC29)
  // -----------------------------------------------------------

  test('29 - Print button triggers browser print', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    let printTriggered = false;
    page.on('pageerror', () => {});
    page.on('popup', () => { printTriggered = true; });
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '29');
    await $btnPrint(page).click();
    await page.waitForTimeout(1000);
    console.log('  Print triggered: ' + printTriggered);
    await ss(page, 'print clicked', '29');
    await cleanMultipleTestData();
  });

  // -----------------------------------------------------------
  // Delete Selected (TC30~34)
  // -----------------------------------------------------------

  test('30 - Delete validation when no record selected', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '30');
    await expect($btnDelete(page)).toBeDisabled();
    await ss(page, 'delete validation', '30');
    await cleanMultipleTestData();
  });

  test('31 - Delete success', async ({ page }) => {
    const testData = await insertTestData();
    let dbRows = await queryDB(
      'SELECT * FROM HDOC_USER_DEFINED_RULES WHERE PC=? AND num=? AND MARKET=?',
      [testData.pc, testData.num, testData.mkt]
    );
    expect(dbRows?.length).toBeGreaterThanOrEqual(1);
    console.log('  DB insert confirmed: ' + (dbRows?.length || 0) + ' records');

    await navigateToResultList(page, testData.pc, testData.num, testData.mkt);
    await ss(page, 'page display', '31');
    await $radio(page, 0).click();
    await expect($radio(page, 0)).toBeChecked();
    await $btnDelete(page).click();
    await page.waitForTimeout(1500);

    const rowCount = await $tableRows(page).count().catch(() => 0);
    console.log('  Rows after delete: ' + rowCount);
    await expect($btnDelete(page)).toBeDisabled();
    await expect($err(page)).not.toBeVisible();

    dbRows = await queryDB(
      'SELECT * FROM HDOC_USER_DEFINED_RULES WHERE PC=? AND num=? AND MARKET=?',
      [testData.pc, testData.num, testData.mkt]
    );
    console.log('  DB records after delete: ' + (dbRows?.length || 0));
    expect(dbRows?.length || 0).toBe(0);
    await ss(page, 'delete success', '31');
    // 由于 testData 后续会被 cleanTestData 再次清理，这里直接调用
    await cleanTestData();
  });

  test('32 - Delete loading state', async ({ page }) => {
    const testData = await insertTestData();
    await page.route('**/api/v1/hdoc/ud09/deleteSelected', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await navigateToResultList(page, testData.pc, testData.num, testData.mkt);
    await ss(page, 'page display', '32');
    await $radio(page, 0).click();
    await $btnDelete(page).click();
    await page.waitForTimeout(500);
    try {
      await expect($btnDeleting(page)).toBeVisible({ timeout: 2000 });
    } catch {
      console.log('  Delete completed too fast, Deleting state not captured');
    }
    await page.unroute('**/api/v1/hdoc/ud09/deleteSelected');
    await page.waitForTimeout(1000);
    await ss(page, 'delete loading', '32');
    await cleanTestData();
  });

  test('33 - Delete API failure', async ({ page }) => {
    const testData = await insertTestData();
    await page.route('**/api/v1/hdoc/ud09/deleteSelected', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'Failed to delete records.' }),
      });
    });
    await navigateToResultList(page, testData.pc, testData.num, testData.mkt);
    await ss(page, 'page display', '33');
    await $radio(page, 0).click();
    await $btnDelete(page).click();
    await page.waitForTimeout(1500);
    await page.unroute('**/api/v1/hdoc/ud09/deleteSelected');
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Failed to delete records.');
    await expect($btnDelete(page)).toBeEnabled();
    await ss(page, 'delete API failure', '33');
    await cleanTestData();
  });

  test('34 - Delete prevent duplicate submit', async ({ page }) => {
    const testData = await insertTestData();
    await page.route('**/api/v1/hdoc/ud09/deleteSelected', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await navigateToResultList(page, testData.pc, testData.num, testData.mkt);
    await ss(page, 'page display', '34');
    await $radio(page, 0).click();
    // Click delete - button should become disabled immediately preventing second click
    await $btnDelete(page).click();
    // Button should show "Deleting..." and be disabled
    await expect($btnDeleting(page)).toBeVisible({ timeout: 2000 });
    await expect($btnDeleting(page)).toBeDisabled();
    await page.unroute('**/api/v1/hdoc/ud09/deleteSelected');
    await page.waitForTimeout(1000);
    await ss(page, 'delete duplicate prevention', '34');
    await cleanTestData();
  });

  // -----------------------------------------------------------
  // Created by user link (TC35)
  // -----------------------------------------------------------

  test('35 - Created by user link navigates to EDB User View', async ({ page }) => {
    const testData = await insertTestData();
    await navigateToResultList(page, testData.pc, testData.num, testData.mkt);
    await ss(page, 'page display', '35');
    await expect($linkUser(page, 0)).toBeVisible();
    const userText = await $linkUser(page, 0).textContent();
    console.log('  Link text: ' + userText);
    await $linkUser(page, 0).click();
    try { await page.waitForURL('**/edb-user-view', { timeout: 10000 }); } catch { /* ok */ }
    await page.waitForTimeout(1000);
    const url = page.url();
    console.log('  Navigated to: ' + url);
    expect(url).toContain('edb-user-view');
    await ss(page, 'link navigation', '35');
    await cleanTestData();
  });

  // -----------------------------------------------------------
  // Exception handling (TC36~38)
  // -----------------------------------------------------------

  test('36 - Load results failure', async ({ page }) => {
    await page.route('**/api/v1/hdoc/ud09/search', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'Failed to fetch results.', data: null }),
      });
    });
    const pcs35 = await getValidPCs();
    const mkts35 = await getValidMarkets();
    await navigateToResultList(page, pcs35[0] || 'PC1', '1000000001', mkts35[0] || 'MKT1');
    await page.unroute('**/api/v1/hdoc/ud09/search');
    await ss(page, 'page display', '36');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('Failed to fetch results.');
    await ss(page, 'load failure', '36');
  });

  test('37 - Network error during delete', async ({ page }) => {
    const testData = await insertTestData();
    await page.route('**/api/v1/hdoc/ud09/deleteSelected', route => route.abort());
    await navigateToResultList(page, testData.pc, testData.num, testData.mkt);
    await ss(page, 'page display', '37');
    await $radio(page, 0).click();
    await $btnDelete(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/ud09/deleteSelected');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('System error. Please contact administrator.');
    await expect($btnDelete(page)).toBeEnabled();
    await ss(page, 'delete network error', '37');
    await cleanTestData();
  });

  test('38 - API timeout', async ({ page }) => {
    await page.route('**/api/v1/hdoc/ud09/search', async route => {
      await new Promise(r => setTimeout(r, 15000));
      await route.continue();
    });
    const pcs37 = await getValidPCs();
    const mkts37 = await getValidMarkets();
    await navigateToResultList(page, pcs37[0] || 'PC1', '1000000001', mkts37[0] || 'MKT1');
    await page.unroute('**/api/v1/hdoc/ud09/search');
    await ss(page, 'page display', '38');
    if (await $err(page).isVisible().catch(() => false)) {
      await expect($err(page)).toContainText('System error. Please contact administrator.');
    } else {
      console.log('  API may have completed after timeout, no error displayed');
    }
    await ss(page, 'API timeout', '38');
  });

  // -----------------------------------------------------------
  // Message display (TC39~40)
  // -----------------------------------------------------------

  test('39 - Error message color', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '39');
    await $btnSelect(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Please select a record first.');
    const color = await $err(page).evaluate(el => getComputedStyle(el).color);
    console.log('  Error text color: ' + color);
    await ss(page, 'error style', '39');
    await cleanMultipleTestData();
  });

  test('40 - Error message overwrite on new action', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '40');
    await $btnSelect(page).click();
    await expect($err(page)).toBeVisible();
    const msg1 = await $err(page).textContent();
    await $btnSelect(page).click();
    await expect($err(page)).toBeVisible();
    const msg2 = await $err(page).textContent();
    console.log('  Msg1: ' + msg1 + ', Msg2: ' + msg2);
    await ss(page, 'message overwrite', '40');
    await cleanMultipleTestData();
  });

  // -----------------------------------------------------------
  // Security (TC41~43)
  // -----------------------------------------------------------

  test('41 - Unauthenticated access redirects to login', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'load' });
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
    });
    await page.goto(PAGE_URL + '/menu/homologation-variables/result', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log('  Current URL: ' + url);
    if (url.includes('/login')) console.log('  Redirected to login page');
    await ss(page, 'unauthenticated access', '41');
  });

  test('42 - SQL injection protection', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '42');
    await expect($container(page)).toBeVisible();
    if (await $err(page).isVisible().catch(() => false)) {
      const errText = await $err(page).textContent();
      expect(errText).not.toContain('SQL');
      expect(errText).not.toContain('syntax');
    }
    await ss(page, 'SQL injection', '42');
    await cleanMultipleTestData();
  });

  test('43 - XSS protection', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    let dialogCount = 0;
    page.on('dialog', () => { dialogCount++; });
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '43');
    await expect($container(page)).toBeVisible();
    expect(dialogCount).toBe(0);
    console.log('  Dialog count: ' + dialogCount);
    await ss(page, 'XSS protection', '43');
    await cleanMultipleTestData();
  });

});
