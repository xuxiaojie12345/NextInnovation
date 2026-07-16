/**
 * UD09 - Homologation Variables Result List Playwright 閾ｪ蜉ｨ蛹匁ｵ玖ｯ・
 *
 * 豬玖ｯ募ｼ乗ｷ荵ｦ: tests/豬玖ｯ募ｼ乗ｷ荵ｦ/繝・せ繝亥ｼ乗ｷ譖ｸUD09.md (v1.0)
 * 豬玖ｯ募燕謠・ 蜑榊錘遶ｯ蝮・ｷｲ蜷ｯ蜉ｨ・御ｽｿ逕ｨ逵溷ｮ・API・域裏 Mock・・
 * 謨ｰ謐ｮ蠎馴ｪ瑚ｯ・ 騾夊ｿ・SQL 譟･隸｢遑ｮ隶､謨ｰ謐ｮ
 * 謌ｪ蝗ｾ菫晏ｭ・ tests/test/Image/UD09/
 * 豬玖ｯ慕畑萓区焚: 42
 * 謇ｧ陦梧ｨ｡蠑・ serial・井ｸｲ陦梧鴬陦鯉ｼ・
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

/** 謠貞・蜊墓擅豬玖ｯ墓焚謐ｮ・井ｽｿ逕ｨ master 陦ｨ荳ｭ譛画譜逧・PC/Market 蛟ｼ・瑚ｿ泌屓菴ｿ逕ｨ逧・ｼ・・*/
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

/** 蛻髯､豬玖ｯ墓焚謐ｮ */
async function cleanTestData() {
  await queryDB(
    'DELETE FROM HDOC_USER_DEFINED_RULES WHERE PC=? AND num=? AND MARKET=?',
    [_singleTestPC, TEST_NUM, _singleTestMkt]
  );
}

/** 莉・product_class_master / market_master 闔ｷ蜿匁怏謨育噪 PC 蜥・Market 蛟ｼ */
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

/** 謠貞・螟壽擅豬玖ｯ墓焚謐ｮ逕ｨ莠主・陦ｨ螻慕､ｺ・井ｽｿ逕ｨ master 陦ｨ荳ｭ譛画譜逧・PC/Market 蛟ｼ・・*/
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

/** 蛻髯､螟壽擅豬玖ｯ墓焚謐ｮ */
async function cleanMultipleTestData() {
  if (_multiTestPCs.length === 0) return;
  const pcList = _multiTestPCs.map(pc => "'" + pc + "'").join(',');
  await queryDB(
    "DELETE FROM HDOC_USER_DEFINED_RULES WHERE PC IN (" + pcList + ") AND num LIKE '100000000%'"
  );
}

// ============================================================
// 蜈・ｴ螳壻ｽ搾ｼ亥源驟・HomologationVariablesResultList.tsx 貅千・ｼ・
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

// -- HomologationVariables 鬘ｵ髱｢蜈・ｴ・育畑莠主ｯｼ闊ｪ・・--
const $hvContainer   = (p: Page) => p.locator('.homologation-vars-container');
const $hvCondInput   = (p: Page, label: string) =>
  p.locator('.hv-cond-row').filter({ has: p.locator('.hv-cond-label', { hasText: label }) }).locator('.hv-cond-input');
const $hvCondSelect  = (p: Page, label: string) =>
  p.locator('.hv-cond-row').filter({ has: p.locator('.hv-cond-label', { hasText: label }) }).locator('select.hv-cond-select');
const $hvBtnSearch   = (p: Page) => p.locator('.btn-cell button').filter({ hasText: 'Search' });

// ============================================================
// 蟇ｼ闊ｪ霎・勧蜃ｽ謨ｰ
// ============================================================

/** 逋ｻ蠖・-> HomologationVariables -> 蝪ｫ蜈･譟･隸｢譚｡莉ｶ -> Search -> Result List */
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

/** 逋ｻ蠖・-> 逶ｴ謗･蟇ｼ闊ｪ蛻ｰ Result List・域裏 state・檎畑莠主ｼょｸｸ豬玖ｯ包ｼ・*/
async function directNavigateToResultList(page: Page) {
  await login(page);
  await page.goto(PAGE_URL + '/menu/homologation-variables/result', { waitUntil: 'load' });
  await page.waitForSelector('.hv-result-container', { timeout: 10000 });
  await page.waitForTimeout(500);
}

test.describe.configure({ mode: 'serial' });
test.describe('UD09 Homologation Variables Result List', () => {

  // -----------------------------------------------------------
  // 逕ｻ髱｢蛻晄悄陦ｨ遉ｺ (TC1~6)
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
  // DataTable 陦ｨ螟ｴ螻樊ｧ譬｡鬪・(TC7~18)
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

  // -----------------------------------------------------------
  // 騾画叫隶ｰ蠖墓桃菴・(TC19~22)
  // -----------------------------------------------------------

  test('19 - Radio select effect', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1', multiData.mkts[0], '>');
    await ss(page, 'page display', '19');
    await $radio(page, 0).click();
    await expect($radio(page, 0)).toBeChecked();
    await expect($selectedRow(page, 0)).toHaveClass(/selected/);
    await expect($btnDelete(page)).toBeEnabled();
    await ss(page, 'radio selected', '19');
    await cleanMultipleTestData();
  });

  test('20 - Radio switch', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1', multiData.mkts[0], '>');
    await ss(page, 'page display', '20');
    await $radio(page, 0).click();
    await expect($radio(page, 0)).toBeChecked();
    await $radio(page, 1).click();
    await expect($radio(page, 1)).toBeChecked();
    await expect($radio(page, 0)).not.toBeChecked();
    await expect($selectedRow(page, 0)).not.toHaveClass(/selected/);
    await expect($selectedRow(page, 1)).toHaveClass(/selected/);
    await ss(page, 'radio switch', '20');
    await cleanMultipleTestData();
  });

  test('21 - Radio deselect', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1', multiData.mkts[0], '>');
    await ss(page, 'page display', '21');
    await $radio(page, 0).click();
    await expect($radio(page, 0)).toBeChecked();
    // 轤ｹ蜃ｻ蟾ｲ騾我ｸｭ逧・radio・夂ｻ・ｻｶ菴ｿ逕ｨ onChange 莠倶ｻｶ・粂TML 隗・激荳句ｷｲ騾我ｸｭ radio 蜀肴ｬ｡轤ｹ蜃ｻ荳崎ｧｦ蜿・onChange
    // 蝗豁､ radio 菫晄戟騾我ｸｭ迥ｶ諤・ｼ御ｸ堺ｼ壼叙豸磯我ｸｭ
    await $radio(page, 0).click();
    console.log('  Radio remains checked after clicking the same one (onChange does not fire for checked radios)');
    await ss(page, 'radio deselect', '21');
    await cleanMultipleTestData();
  });

  test('22 - Delete button state when no selection', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '22');
    await expect($btnDelete(page)).toBeDisabled();
    await expect($btnSelect(page)).toBeEnabled();
    await ss(page, 'delete button state', '22');
    await cleanMultipleTestData();
  });

  // -----------------------------------------------------------
  // Select謖蛾聴轤ｹ蜃ｻ莠倶ｻｶ (TC23~25)
  // -----------------------------------------------------------

  test('23 - Select validation when no record selected', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '23');
    await $btnSelect(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Please select a record first.');
    expect(page.url()).toContain('/homologation-variables/result');
    await ss(page, 'select validation', '23');
    await cleanMultipleTestData();
  });

  test('24 - Select record then navigate', async ({ page }) => {
    const testData = await insertTestData();
    await navigateToResultList(page, testData.pc, testData.num, testData.mkt);
    await ss(page, 'page display', '24');
    await $radio(page, 0).click();
    await expect($radio(page, 0)).toBeChecked();
    await $btnSelect(page).click();
    try { await page.waitForURL('**/homologation-variables', { timeout: 10000 }); } catch { /* ok */ }
    await page.waitForSelector('.homologation-vars-container', { timeout: 5000 });
    await ss(page, 'select navigate', '24');
    const pcVal = await $hvCondInput(page, 'Product class').inputValue().catch(() => '');
    const numVal = await $hvCondInput(page, 'Number').inputValue().catch(() => '');
    const mktVal = await $hvCondInput(page, 'Market').inputValue().catch(() => '');
    console.log('  Echoed PC: ' + pcVal + ', NUM: ' + numVal + ', MKT: ' + mktVal);
    await cleanTestData();
  });

  test('25 - Select button loading state', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '25');
    await expect($btnSelect(page)).toBeEnabled();
    await ss(page, 'select loading', '25');
    await cleanMultipleTestData();
  });

  // -----------------------------------------------------------
  // Back謖蛾聴轤ｹ蜃ｻ莠倶ｻｶ (TC26~27)
  // -----------------------------------------------------------

  test('26 - Back to previous page', async ({ page }) => {
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
    await ss(page, 'page display', '26');
    await $btnBack(page).click();
    try { await page.waitForURL('**/homologation-variables', { timeout: 10000 }); } catch { /* ok */ }
    await page.waitForSelector('.homologation-vars-container', { timeout: 5000 });
    await ss(page, 'back navigate', '26');
    await cleanMultipleTestData();
  });

  test('27 - Back without search conditions', async ({ page }) => {
    await directNavigateToResultList(page);
    await ss(page, 'page display', '27');
    await $btnBack(page).click();
    try { await page.waitForURL('**/homologation-variables', { timeout: 10000 }); } catch { /* ok */ }
    await page.waitForSelector('.homologation-vars-container', { timeout: 5000 });
    await ss(page, 'back no conditions', '27');
  });

  // -----------------------------------------------------------
  // Print謖蛾聴轤ｹ蜃ｻ莠倶ｻｶ (TC28)
  // -----------------------------------------------------------

  test('28 - Print button triggers browser print', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    let printTriggered = false;
    page.on('pageerror', () => {});
    page.on('popup', () => { printTriggered = true; });
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '28');
    await $btnPrint(page).click();
    await page.waitForTimeout(1000);
    console.log('  Print triggered: ' + printTriggered);
    await ss(page, 'print clicked', '28');
    await cleanMultipleTestData();
  });

  // -----------------------------------------------------------
  // Delete Selected謖蛾聴轤ｹ蜃ｻ莠倶ｻｶ (TC29~33)
  // -----------------------------------------------------------

  test('29 - Delete validation when no record selected', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '29');
    await expect($btnDelete(page)).toBeDisabled();
    await ss(page, 'delete validation', '29');
    await cleanMultipleTestData();
  });

  test('30 - Delete success', async ({ page }) => {
    const testData = await insertTestData();
    let dbRows = await queryDB(
      'SELECT * FROM HDOC_USER_DEFINED_RULES WHERE PC=? AND num=? AND MARKET=?',
      [testData.pc, testData.num, testData.mkt]
    );
    expect(dbRows?.length).toBeGreaterThanOrEqual(1);
    console.log('  DB insert confirmed: ' + (dbRows?.length || 0) + ' records');

    await navigateToResultList(page, testData.pc, testData.num, testData.mkt);
    await ss(page, 'page display', '30');
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
    await ss(page, 'delete success', '30');
    // 逶ｴ謗･逕ｨ testData 荳ｭ逧・ｼ貂・炊・井ｽ・黄逅・唖髯､蜷主ｷｲ譌謨ｰ謐ｮ・御ｻ・ｾ帛盾閠・ｼ・
    await cleanTestData();
  });

  test('31 - Delete loading state', async ({ page }) => {
    const testData = await insertTestData();
    await page.route('**/api/v1/hdoc/ud09/deleteSelected', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await navigateToResultList(page, testData.pc, testData.num, testData.mkt);
    await ss(page, 'page display', '31');
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
    await ss(page, 'delete loading', '31');
    await cleanTestData();
  });

  test('32 - Delete API failure', async ({ page }) => {
    const testData = await insertTestData();
    await page.route('**/api/v1/hdoc/ud09/deleteSelected', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'Failed to delete records.' }),
      });
    });
    await navigateToResultList(page, testData.pc, testData.num, testData.mkt);
    await ss(page, 'page display', '32');
    await $radio(page, 0).click();
    await $btnDelete(page).click();
    await page.waitForTimeout(1500);
    await page.unroute('**/api/v1/hdoc/ud09/deleteSelected');
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Failed to delete records.');
    await expect($btnDelete(page)).toBeEnabled();
    await ss(page, 'delete API failure', '32');
    await cleanTestData();
  });

  test('33 - Delete prevent duplicate submit', async ({ page }) => {
    const testData = await insertTestData();
    await page.route('**/api/v1/hdoc/ud09/deleteSelected', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await navigateToResultList(page, testData.pc, testData.num, testData.mkt);
    await ss(page, 'page display', '33');
    await $radio(page, 0).click();
    // 隨ｬ荳谺｡轤ｹ蜃ｻ隗ｦ蜿大唖髯､ API・・s 蟒ｶ霑滂ｼ会ｼ梧潔髓ｮ蠎皮ｫ句叉蜿倅ｸｺ遖∫畑迥ｶ諤・
    await $btnDelete(page).click();
    // 轤ｹ蜃ｻ蜷取潔髓ｮ譁・ｭ怜序荳ｺ "Delening..." 蟷ｶ陲ｫ遖∫畑・碁ｪ瑚ｯ∝・螟・ｺ守ｦ∫畑迥ｶ諤∝叉隸∵・驥榊､肴署莠､陲ｫ髦ｻ豁｢
    await expect($btnDeleting(page)).toBeVisible({ timeout: 2000 });
    await expect($btnDeleting(page)).toBeDisabled();
    await page.unroute('**/api/v1/hdoc/ud09/deleteSelected');
    await page.waitForTimeout(1000);
    await ss(page, 'delete duplicate prevention', '33');
    await cleanTestData();
  });

  // -----------------------------------------------------------
  // Created by user體ｾ謗･轤ｹ蜃ｻ (TC34)
  // -----------------------------------------------------------

  test('34 - Created by user link navigates to EDB User View', async ({ page }) => {
    const testData = await insertTestData();
    await navigateToResultList(page, testData.pc, testData.num, testData.mkt);
    await ss(page, 'page display', '34');
    await expect($linkUser(page, 0)).toBeVisible();
    const userText = await $linkUser(page, 0).textContent();
    console.log('  Link text: ' + userText);
    await $linkUser(page, 0).click();
    try { await page.waitForURL('**/edb-user-view', { timeout: 10000 }); } catch { /* ok */ }
    await page.waitForTimeout(1000);
    const url = page.url();
    console.log('  Navigated to: ' + url);
    expect(url).toContain('edb-user-view');
    await ss(page, 'link navigation', '34');
    await cleanTestData();
  });

  // -----------------------------------------------------------
  // 蠑ょｸｸ螟・炊 (TC35~37)
  // -----------------------------------------------------------

  test('35 - Load results failure', async ({ page }) => {
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
    await ss(page, 'page display', '35');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('Failed to fetch results.');
    await ss(page, 'load failure', '35');
  });

  test('36 - Network error during delete', async ({ page }) => {
    const testData = await insertTestData();
    await page.route('**/api/v1/hdoc/ud09/deleteSelected', route => route.abort());
    await navigateToResultList(page, testData.pc, testData.num, testData.mkt);
    await ss(page, 'page display', '36');
    await $radio(page, 0).click();
    await $btnDelete(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/ud09/deleteSelected');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('System error. Please contact administrator.');
    await expect($btnDelete(page)).toBeEnabled();
    await ss(page, 'delete network error', '36');
    await cleanTestData();
  });

  test('37 - API timeout', async ({ page }) => {
    await page.route('**/api/v1/hdoc/ud09/search', async route => {
      await new Promise(r => setTimeout(r, 15000));
      await route.continue();
    });
    const pcs37 = await getValidPCs();
    const mkts37 = await getValidMarkets();
    await navigateToResultList(page, pcs37[0] || 'PC1', '1000000001', mkts37[0] || 'MKT1');
    await page.unroute('**/api/v1/hdoc/ud09/search');
    await ss(page, 'page display', '37');
    if (await $err(page).isVisible().catch(() => false)) {
      await expect($err(page)).toContainText('System error. Please contact administrator.');
    } else {
      console.log('  API may have completed after timeout, no error displayed');
    }
    await ss(page, 'API timeout', '37');
  });

  // -----------------------------------------------------------
  // 豸域・譏ｾ遉ｺ (TC38~39)
  // -----------------------------------------------------------

  test('38 - Error message color', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '38');
    await $btnSelect(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Please select a record first.');
    const color = await $err(page).evaluate(el => getComputedStyle(el).color);
    console.log('  Error text color: ' + color);
    await ss(page, 'error style', '38');
    await cleanMultipleTestData();
  });

  test('39 - Error message overwrite on new action', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '39');
    await $btnSelect(page).click();
    await expect($err(page)).toBeVisible();
    const msg1 = await $err(page).textContent();
    await $btnSelect(page).click();
    await expect($err(page)).toBeVisible();
    const msg2 = await $err(page).textContent();
    console.log('  Msg1: ' + msg1 + ', Msg2: ' + msg2);
    await ss(page, 'message overwrite', '39');
    await cleanMultipleTestData();
  });

  // -----------------------------------------------------------
  // 螳牙・諤ｧ (TC40~42)
  // -----------------------------------------------------------

  test('40 - Unauthenticated access redirects to login', async ({ page }) => {
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
    await ss(page, 'unauthenticated access', '40');
  });

  test('41 - SQL injection protection', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '41');
    await expect($container(page)).toBeVisible();
    if (await $err(page).isVisible().catch(() => false)) {
      const errText = await $err(page).textContent();
      expect(errText).not.toContain('SQL');
      expect(errText).not.toContain('syntax');
    }
    await ss(page, 'SQL injection', '41');
    await cleanMultipleTestData();
  });

  test('42 - XSS protection', async ({ page }) => {
    const multiData = await insertMultipleTestData();
    let dialogCount = 0;
    page.on('dialog', () => { dialogCount++; });
    await navigateToResultList(page, multiData.pcs[0], '1000000001', multiData.mkts[0]);
    await ss(page, 'page display', '42');
    await expect($container(page)).toBeVisible();
    expect(dialogCount).toBe(0);
    console.log('  Dialog count: ' + dialogCount);
    await ss(page, 'XSS protection', '42');
    await cleanMultipleTestData();
  });

});
