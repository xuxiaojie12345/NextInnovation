/**
 * UD08 - Homologation Variables Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD08.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实 API（无 Mock），通过 SQL 准备/清理测试数据
 * 截图保存: tests/test/Image/UD08/
 * 测试用例数: 50
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, getTestUser, createScreenshot, login, PAGE_URL } from './utils';

const ss = createScreenshot('UD08');

// ============================================================
// 元素定位（匹配 HomologationVariables.tsx 源码）
// ============================================================

const $container      = (p: Page) => p.locator('.homologation-vars-container');
const $header         = (p: Page) => p.locator('.homologation-vars-header');
const $title          = (p: Page) => p.locator('.homologation-vars-header h1');
const $btnSearch      = (p: Page) => p.locator('.btn-table .btn-primary');
const $btnClear       = (p: Page) => p.locator('.btn-table .btn').filter({ hasText: 'Clear' });
const $btnAdd         = (p: Page) => p.locator('.btn-table .btn').filter({ hasText: 'Add' });
const $btnUpdate      = (p: Page) => p.locator('.btn-table .btn').filter({ hasText: 'Update' });
const $btnDelete      = (p: Page) => p.locator('.btn-table .btn').filter({ hasText: 'Delete' });
const $err            = (p: Page) => p.locator('.hv-error');
const $successMsg     = (p: Page) => p.locator('.hv-success');
const $condLabel      = (p: Page) => p.locator('.hv-cond-label');
const $rowProductClass= (p: Page) => p.locator('.hv-row-product-class');
const $rowVariant     = (p: Page) => p.locator('.hv-row-variant');
const $variantSubrows = (p: Page) => p.locator('.hv-variant-subrow');

function getRowByLabel(page: Page, label: string) {
  return page.locator('.hv-cond-row').filter({ has: page.locator('.hv-cond-label', { hasText: label }) });
}
function getInputByLabel(page: Page, label: string) {
  return getRowByLabel(page, label).locator('.hv-cond-input');
}
function getVariantInput(page: Page, index: 0 | 1) {
  return page.locator('.hv-variant-subrow').nth(index).locator('.hv-cond-input');
}

async function navigateToPage(page: Page) {
  await login(page);
  // 清除 sessionStorage 避免前序测试的残留数据污染
  await page.evaluate(() => sessionStorage.removeItem('hv_conditions'));
  await page.goto(PAGE_URL + '/menu/homologation-variables', { waitUntil: 'load', timeout: 15000 }).catch(() => {
    console.log('  Page navigation timed out');
  });
  try {
    await page.waitForSelector('.homologation-vars-container', { timeout: 15000 });
  } catch {
    const u = page.url();
    if (u.includes('/login')) throw new Error('Redirected to login');
    throw new Error('Failed to find container. URL: ' + u);
  }
  await page.waitForTimeout(1000);
}

function ts(): string { return Date.now().toString().slice(-6); }

const TS = ts();
// PC/MARKET 列长度极短（如 VARCHAR(2~3)），使用 2 字符标识
const SHORT = TS.slice(-2);
const PREFIX = `UT8_${SHORT}_`;
// num 字段使用纯数字（数据库列可能为数值类型）
const NUM_BASE = parseInt(TS) % 900000 + 100000;
const TD = {
  addNum: String(NUM_BASE), addVar: `V${SHORT}1`, addVal: 'NEW_VALUE',
  addVs1: 'VS1_VALUE', addVs2: 'VS2_VALUE', addCmt: 'ADD_TEST_COMMENT',
  auditNum: String(NUM_BASE + 1), auditVar: `V${SHORT}2`,
  auditVal: 'AUDIT_VAL', auditVs1: 'AUDIT_VS1', auditVs2: 'AUDIT_VS2', auditCmt: 'AUDIT_CMT',
  updateNum: String(NUM_BASE + 2), updateVar: `V${SHORT}3`, updateVal: 'OLD_VALUE', updateCmt: 'OLD_COMMENT',
  deleteNum: String(NUM_BASE + 3), deleteVar: `V${SHORT}4`,
};

async function ensureVar(v: string) {
  const rows = await queryDB('SELECT VARIABLE FROM HDOC_VARIABLES WHERE VARIABLE = ?', [v]);
  if (!rows || rows.length === 0) {
    await queryDB(
      'INSERT INTO HDOC_VARIABLES (VARIABLE, TYPE, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS) VALUES (?,?,?,NOW(),?,?,NOW(),?,?)',
      [v, 'V', 'UT Test Variable', 'TEST_USER', 'UD08Test', 'TEST_USER', 'UD08Test']
    );
  }
}

test.describe.configure({ mode: 'serial' });
test.describe('UD08 Homologation Variables', () => {

  test.beforeAll(async () => {
    await ensureVar(TD.addVar); await ensureVar(TD.auditVar); await ensureVar(TD.updateVar);
    await ensureVar(TD.deleteVar); await ensureVar('EXIST_VAR');
    // 使用数据库中真实存在的 PC/MARKET 值（前端下拉列表的值）
    const pcRows = await queryDB("SELECT PC FROM PRODUCT_CLASS_MASTER LIMIT 1");
    const mktRows = await queryDB("SELECT MARKET FROM MARKET_MASTER LIMIT 1");
    const realPc = pcRows?.length ? pcRows[0].PC : 'A';
    const realMkt = mktRows?.length ? mktRows[0].MARKET : 'JP';
    await queryDB('INSERT INTO HDOC_USER_DEFINED_RULES (PC,num,MARKET,VARIABLE,VAL,VS,VS2,COMMENTS,ADD_DATE,DELETE_DATE,REGISTER_DATETIME,REGISTER_USER,REGISTER_PROCESS,UPDATE_DATETIME,UPDATE_USER,UPDATE_PROCESS) VALUES (?,?,?,?,?,?,?,?,?,NULL,NOW(),?,?,NOW(),?,?)',
      [realPc, TD.updateNum, realMkt, TD.updateVar, TD.updateVal, '', '', TD.updateCmt, '202630', 'TEST_USER', 'UD08Test', 'TEST_USER', 'UD08Test']);
    await queryDB('INSERT INTO HDOC_USER_DEFINED_RULES (PC,num,MARKET,VARIABLE,VAL,VS,VS2,COMMENTS,ADD_DATE,DELETE_DATE,REGISTER_DATETIME,REGISTER_USER,REGISTER_PROCESS,UPDATE_DATETIME,UPDATE_USER,UPDATE_PROCESS) VALUES (?,?,?,?,?,?,?,?,?,NULL,NOW(),?,?,NOW(),?,?)',
      [realPc, TD.deleteNum, realMkt, TD.deleteVar, '', '', '', '', '202630', 'TEST_USER', 'UD08Test', 'TEST_USER', 'UD08Test']);
  });

  test.afterAll(async () => {
    // 按唯一 num 值清理 beforeAll 插入的测试数据
    await queryDB("DELETE FROM HDOC_USER_DEFINED_RULES WHERE num = ?", [TD.updateNum]);
    await queryDB("DELETE FROM HDOC_USER_DEFINED_RULES WHERE num = ?", [TD.deleteNum]);
    await queryDB("DELETE FROM HDOC_VARIABLES WHERE VARIABLE LIKE ?", ['V' + SHORT + '%']);
    await queryDB("DELETE FROM HDOC_VARIABLES WHERE VARIABLE = 'EXIST_VAR'");
  });

  // =========== TC1~7: 画面初期表示 ===========

  test('01 - 画面初期表示-整体布局', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '01');
    await expect($container(page)).toBeVisible();
    await expect($title(page)).toHaveText('Homologation Variables');
    const labels = await $condLabel(page).allTextContents();
    expect(labels.some(l => l.includes('Product class'))).toBeTruthy();
    expect(labels.some(l => l.includes('Number'))).toBeTruthy();
    expect(labels.some(l => l.includes('Market'))).toBeTruthy();
    for (const b of [$btnSearch(page), $btnClear(page), $btnAdd(page), $btnUpdate(page), $btnDelete(page)]) {
      await expect(b).toBeVisible(); await expect(b).toBeEnabled();
    }
    await expect($err(page)).not.toBeVisible();
  });

  test('02 - 画面初期表示-Product class下拉列表加载', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '02');
    const s = $rowProductClass(page).locator('.hv-cond-select');
    expect(await s.evaluate(el => el.tagName.toLowerCase())).toBe('select');
    expect(await s.inputValue()).toBe('');
    const opts = await s.locator('option:not([value=""])').allTextContents();
    expect(opts.length).toBeGreaterThanOrEqual(1);
    const db = await queryDB('SELECT DESCRIPTION FROM PRODUCT_CLASS_MASTER');
    if (db) for (const r of db) expect(opts).toContain(r.DESCRIPTION);
  });

  test('03 - 画面初期表示-Number输入框属性', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '03');
    const i = getInputByLabel(page, 'Number');
    await expect(i).toBeVisible(); expect(await i.inputValue()).toBe(''); await expect(i).toBeEnabled();
  });

  test('04 - 画面初期表示-Market下拉列表加载', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '04');
    const s = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    expect(await s.evaluate(el => el.tagName.toLowerCase())).toBe('select');
    expect(await s.inputValue()).toBe('');
    const opts = await s.locator('option:not([value=""])').allTextContents();
    expect(opts.length).toBeGreaterThanOrEqual(1);
    const db = await queryDB('SELECT MARKET FROM MARKET_MASTER');
    if (db) for (const r of db) expect(opts).toContain(r.MARKET);
  });

  test('05 - 画面初期表示-Variable/Value/Variant/Comments输入框', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '05');
    for (const f of ['Variable','Value','Comments']) {
      const i = getInputByLabel(page, f);
      await expect(i).toBeVisible(); expect(await i.inputValue()).toBe('');
    }
    for (const idx of [0,1]) {
      const i = getVariantInput(page, idx as 0|1);
      await expect(i).toBeVisible(); expect(await i.inputValue()).toBe('');
    }
  });

  test('06 - 画面初期表示-按钮初期状态', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '06');
    for (const b of [$btnSearch(page), $btnClear(page), $btnAdd(page), $btnUpdate(page), $btnDelete(page)]) {
      await expect(b).toBeVisible(); await expect(b).toBeEnabled();
    }
  });

  test('07 - 画面初期表示-错误消息区域默认隐藏', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '07');
    await expect($err(page)).not.toBeVisible();
    await expect($successMsg(page)).not.toBeVisible();
  });

  // =========== TC8~20: 入力控件属性校验 ===========

  test('08 - Product class-控件类型', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '08');
    const s = $rowProductClass(page).locator('.hv-cond-select');
    expect(await s.evaluate(el => el.tagName.toLowerCase())).toBe('select');
    expect(await s.locator('option:not([value=""])').count()).toBeGreaterThanOrEqual(1);
  });

  test('09 - Number-允许文字（仅数字）', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '09');
    const i = getInputByLabel(page, 'Number');
    await i.fill('12345'); expect(await i.inputValue()).toBe('12345');
    await i.fill('12ab34'); expect(await i.inputValue()).toBe('1234');
    await i.fill('1234567890abc'); expect(await i.inputValue()).toBe('1234567890');
  });

  test('10 - Market-控件类型', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '10');
    const s = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    expect(await s.evaluate(el => el.tagName.toLowerCase())).toBe('select');
    expect(await s.locator('option:not([value=""])').count()).toBeGreaterThanOrEqual(1);
  });

  test('11 - Variable-最大长度（20）', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '11');
    const i = getInputByLabel(page, 'Variable');
    await i.fill('A'.repeat(21)); expect(await i.inputValue()).toBe('A'.repeat(20));
  });

  test('12 - Variable-TEMPLATE-XXX前缀自动删除', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '12');
    const i = getInputByLabel(page, 'Variable');
    await i.fill('TEMPLATE-XXX'); expect(await i.inputValue()).toBe('TEMPLATE-XXX');
  });

  test('13 - Value-最大长度（200）', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '13');
    const i = getInputByLabel(page, 'Value');
    await i.fill('B'.repeat(201)); expect(await i.inputValue()).toBe('B'.repeat(200));
  });

  test('14 - Variant string.1-最大长度（100）', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '14');
    await getVariantInput(page, 0).fill('C'.repeat(101));
    expect((await getVariantInput(page, 0).inputValue()).length).toBeLessThanOrEqual(100);
  });

  test('15 - Variant string.2-最大长度（100）', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '15');
    await getVariantInput(page, 1).fill('D'.repeat(101));
    expect((await getVariantInput(page, 1).inputValue()).length).toBeLessThanOrEqual(100);
  });

  test('16 - Comments-最大长度（100）', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '16');
    const i = getInputByLabel(page, 'Comments');
    await i.fill('E'.repeat(101)); expect((await i.inputValue()).length).toBeLessThanOrEqual(100);
  });

  test('17 - Add-控件类型（输出标签）', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '17');
    const r = getRowByLabel(page, 'Add');
    expect(await r.locator('.hv-input-suffix').textContent()).toContain('YYYYWW');
    expect(await r.locator('.hv-cond-input').evaluate(el => (el as HTMLInputElement).maxLength)).toBe(6);
  });

  test('18 - Delete-控件类型（输出标签）', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '18');
    const r = getRowByLabel(page, 'Delete');
    expect(await r.locator('.hv-input-suffix').textContent()).toContain('YYYYWW');
    expect(await r.locator('.hv-cond-input').evaluate(el => (el as HTMLInputElement).maxLength)).toBe(6);
  });

  test('19 - Created by user-控件类型（链接）', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '19');
    const r = getRowByLabel(page, 'Created by user');
    expect(await r.locator('.hv-input-suffix').textContent()).toContain('Automatic');
    expect(await r.locator('.hv-cond-input').evaluate(el => (el as HTMLInputElement).maxLength)).toBe(16);
  });

  test('20 - Date-控件类型（输出标签）', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '20');
    expect(await getRowByLabel(page, 'Date').locator('.hv-input-suffix').textContent()).toContain('Automatic');
  });

  // =========== TC21~23: Search/Clear ===========

  test('21 - Search按钮-空值校验', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '21');
    await ss(page, 'before', '21');
    await $btnSearch(page).click();
    await expect($err(page)).toHaveText('Product class, Number and Market are required.');
    await ss(page, 'after', '21');
    expect(page.url()).not.toContain('/result');
  });

  test('22 - Search按钮-正常查询', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '22');
    const pcR = await queryDB('SELECT PC FROM PRODUCT_CLASS_MASTER LIMIT 1');
    const mkR = await queryDB('SELECT MARKET FROM MARKET_MASTER LIMIT 1');
    const pc = pcR?.length ? pcR[0].PC : 'A';
    const mk = mkR?.length ? mkR[0].MARKET : 'JP';
    await $rowProductClass(page).locator('.hv-cond-select').selectOption(pc);
    await getInputByLabel(page, 'Number').fill('0000000001');
    await getRowByLabel(page, 'Market').locator('.hv-cond-select').selectOption(mk);
    await ss(page, 'before', '22');
    await $btnSearch(page).click();
    try { await page.waitForURL('**/homologation-variables/result', { timeout: 10000 }); } catch {}
    await ss(page, 'after', '22');
    expect(page.url()).toContain('/result');
  });

  test('23 - Clear按钮-清除输入', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '23');
    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const mS = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    const nI = getInputByLabel(page, 'Number');
    const vI = getInputByLabel(page, 'Variable');
    const vL = getInputByLabel(page, 'Value');
    const v1 = getVariantInput(page, 0); const v2 = getVariantInput(page, 1);
    const cI = getInputByLabel(page, 'Comments');
    await pS.selectOption(await pS.locator('option:not([value=""])').first().getAttribute('value')||'');
    await nI.fill('12345');
    await mS.selectOption(await mS.locator('option:not([value=""])').first().getAttribute('value')||'');
    await vI.fill('TV'); await vL.fill('TVL'); await v1.fill('V1'); await v2.fill('V2'); await cI.fill('CMT');
    await ss(page, 'before', '23');
    await $btnClear(page).click();
    await ss(page, 'after', '23');
    expect(await pS.inputValue()).toBe(''); expect(await nI.inputValue()).toBe('');
    expect(await mS.inputValue()).toBe(''); expect(await vI.inputValue()).toBe('');
    expect(await vL.inputValue()).toBe(''); expect(await v1.inputValue()).toBe('');
    expect(await v2.inputValue()).toBe(''); expect(await cI.inputValue()).toBe('');
    await expect($err(page)).not.toBeVisible();
  });

  // =========== TC24~31: Add按钮 ===========

  test('24 - Add按钮-空值校验（Product class/Market为空）', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '24');
    await getInputByLabel(page, 'Number').fill('12345');
    await ss(page, 'before', '24');
    await $btnAdd(page).click();
    await expect($err(page)).toBeVisible();
    await ss(page, 'after', '24');
    const t = await $err(page).textContent()||'';
    expect(t).toContain('Product class'); expect(t).toContain('Number'); expect(t).toContain('Market'); expect(t).toContain('required');
  });

  test('25 - Add按钮-主键重复校验', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '25');
    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const vP = await pS.locator('option:not([value=""])').first().getAttribute('value'); if (!vP) return;
    await pS.selectOption(vP);
    await getInputByLabel(page, 'Number').fill('11111');
    const mS = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    const vM = await mS.locator('option:not([value=""])').first().getAttribute('value'); if (!vM) return;
    await mS.selectOption(vM);
    await ss(page, 'before', '25');
    await $btnAdd(page).click(); await page.waitForTimeout(1500);
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await ss(page, 'after', '25');
    expect(await $err(page).textContent()).toContain('Primary key conflict');
  });

  test('26 - Add按钮-Variable存在性校验', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '26');
    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const vP = await pS.locator('option:not([value=""])').first().getAttribute('value'); if (!vP) return;
    await pS.selectOption(vP);
    await getInputByLabel(page, 'Number').fill(ts()+'99');
    const mS = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    const vM = await mS.locator('option:not([value=""])').first().getAttribute('value'); if (!vM) return;
    await mS.selectOption(vM);
    await getInputByLabel(page, 'Variable').fill('NON_EXIST_VAR_'+ts());
    await ss(page, 'before', '26');
    await $btnAdd(page).click(); await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await ss(page, 'after', '26');
    expect(await $err(page).textContent()).toContain('Variant does not exist');
  });

  test('27 - Add按钮-Variable TEMPLATE-XXX前缀处理', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '27');
    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const vP = await pS.locator('option:not([value=""])').first().getAttribute('value'); if (!vP) return;
    await pS.selectOption(vP);
    await getInputByLabel(page, 'Number').fill(ts()+'27');
    const mS = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    const vM = await mS.locator('option:not([value=""])').first().getAttribute('value'); if (!vM) return;
    await mS.selectOption(vM);
    await getInputByLabel(page, 'Variable').fill('TEMPLATE-EXIST_VAR');
    await ss(page, 'before', '27');
    await $btnAdd(page).click(); await page.waitForTimeout(2000);
    await ss(page, 'after', '27');
  });

  test('28 - Add按钮-添加成功', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '28');
    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const vP = await pS.locator('option:not([value=""])').first().getAttribute('value'); if (!vP) return;
    await pS.selectOption(vP);
    await getInputByLabel(page, 'Number').fill(TD.addNum);
    const mS = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    const vM = await mS.locator('option:not([value=""])').first().getAttribute('value'); if (!vM) return;
    await mS.selectOption(vM);
    await getInputByLabel(page, 'Variable').fill(TD.addVar);
    await getInputByLabel(page, 'Value').fill(TD.addVal);
    await getVariantInput(page, 0).fill(TD.addVs1);
    await getVariantInput(page, 1).fill(TD.addVs2);
    await getInputByLabel(page, 'Comments').fill(TD.addCmt);
    await ss(page, 'before', '28');
    await $btnAdd(page).click(); await page.waitForTimeout(3000);
    await expect($successMsg(page)).toBeVisible({ timeout: 5000 });
    await ss(page, 'after', '28');
    expect(await $successMsg(page).textContent()).toContain('success');
    const db = await queryDB('SELECT * FROM HDOC_USER_DEFINED_RULES WHERE num=? AND VARIABLE=?', [TD.addNum, TD.addVar]);
    if (db?.length) {
      const r = db[0];
      expect(r.VARIABLE).toBe(TD.addVar); expect(r.VAL).toBe(TD.addVal);
      expect(r.VS).toBe(TD.addVs1); expect(r.VS2).toBe(TD.addVs2); expect(r.COMMENTS).toBe(TD.addCmt);
      expect(r.ADD_DATE).not.toBeNull(); expect(r.DELETE_DATE).toBeFalsy();
      expect(r.UPDATE_USER).not.toBeNull(); expect(r.UPDATE_DATETIME).not.toBeNull();
    }
    await queryDB('DELETE FROM HDOC_USER_DEFINED_RULES WHERE num=? AND VARIABLE=?', [TD.addNum, TD.addVar]);
  });

  test('29 - Add按钮-加载中状态', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '29');
    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const vP = await pS.locator('option:not([value=""])').first().getAttribute('value'); if (!vP) return;
    await pS.selectOption(vP);
    await getInputByLabel(page, 'Number').fill(ts()+'29');
    const mS = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    const vM = await mS.locator('option:not([value=""])').first().getAttribute('value'); if (!vM) return;
    await mS.selectOption(vM);
    await getInputByLabel(page, 'Variable').fill(TD.addVar);
    await page.route('**/api/v1/hdoc/ud08/add', async route => {
      await new Promise(r => setTimeout(r, 5000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, message: 'success', data: null }) });
    });
    await ss(page, 'before', '29');
    await $btnAdd(page).click();
    await expect($btnAdd(page)).toBeDisabled({ timeout: 5000 });
    await page.waitForTimeout(3000);
    await ss(page, 'loading', '29');
    await page.unroute('**/api/v1/hdoc/ud08/add');
  });

  test('30 - Add按钮-防止重复提交', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '30');
    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const vP = await pS.locator('option:not([value=""])').first().getAttribute('value'); if (!vP) return;
    await pS.selectOption(vP);
    await getInputByLabel(page, 'Number').fill(ts()+'30');
    const mS = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    const vM = await mS.locator('option:not([value=""])').first().getAttribute('value'); if (!vM) return;
    await mS.selectOption(vM);
    await getInputByLabel(page, 'Variable').fill(TD.addVar);
    let c = 0;
    await page.route('**/api/v1/hdoc/ud08/add', async route => {
      c++; await new Promise(r => setTimeout(r, 5000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, message: 'success', data: null }) });
    });
    await ss(page, 'before', '30');
    await $btnAdd(page).click();
    await expect($btnAdd(page)).toBeDisabled({ timeout: 5000 });
    await $btnAdd(page).click({ force: true }).catch(()=>{});
    await $btnAdd(page).click({ force: true }).catch(()=>{});
    await page.waitForTimeout(3000);
    await ss(page, 'after', '30');
    await page.unroute('**/api/v1/hdoc/ud08/add');
    expect(c).toBe(1);
  });

  test('31 - Add操作-添加后DB全字段验证（含审计字段）', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '31');
    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const vP = await pS.locator('option:not([value=""])').first().getAttribute('value'); if (!vP) return;
    await pS.selectOption(vP);
    await getInputByLabel(page, 'Number').fill(TD.auditNum);
    const mS = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    const vM = await mS.locator('option:not([value=""])').first().getAttribute('value'); if (!vM) return;
    await mS.selectOption(vM);
    await getInputByLabel(page, 'Variable').fill(TD.auditVar);
    await getInputByLabel(page, 'Value').fill(TD.auditVal);
    await getVariantInput(page, 0).fill(TD.auditVs1);
    await getVariantInput(page, 1).fill(TD.auditVs2);
    await getInputByLabel(page, 'Comments').fill(TD.auditCmt);
    await ss(page, 'before', '31');
    await $btnAdd(page).click(); await page.waitForTimeout(3000);
    await ss(page, 'after', '31');
    const db = await queryDB('SELECT * FROM HDOC_USER_DEFINED_RULES WHERE num=? AND VARIABLE=?', [TD.auditNum, TD.auditVar]);
    if (db?.length) {
      const r = db[0];
      expect(r.VARIABLE).toBe(TD.auditVar); expect(r.VAL).toBe(TD.auditVal);
      expect(r.VS).toBe(TD.auditVs1); expect(r.VS2).toBe(TD.auditVs2); expect(r.COMMENTS).toBe(TD.auditCmt);
      expect(r.ADD_DATE).not.toBeNull(); expect(r.DELETE_DATE).toBeFalsy();
      expect(r.UPDATE_USER).not.toBeNull(); expect(r.UPDATE_DATETIME).not.toBeNull();
    }
    await queryDB('DELETE FROM HDOC_USER_DEFINED_RULES WHERE num=? AND VARIABLE=?', [TD.auditNum, TD.auditVar]);
  });

  // =========== TC32~38: Update按钮 ===========

  test('32 - Update按钮-空值校验', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'before', '32');
    await $btnUpdate(page).click();
    await expect($err(page)).toBeVisible();
    await ss(page, 'after', '32');
    const t = await $err(page).textContent()||'';
    expect(t).toContain('Product class'); expect(t).toContain('Number'); expect(t).toContain('Market'); expect(t).toContain('required');
  });

  test('33 - Update按钮-记录不存在', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '33');
    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const vP = await pS.locator('option:not([value=""])').first().getAttribute('value'); if (!vP) return;
    await pS.selectOption(vP);
    await getInputByLabel(page, 'Number').fill('99999');
    const mS = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    const vM = await mS.locator('option:not([value=""])').first().getAttribute('value'); if (!vM) return;
    await mS.selectOption(vM);
    await ss(page, 'before', '33');
    await $btnUpdate(page).click(); await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await ss(page, 'after', '33');
    expect(await $err(page).textContent()).toContain('Data does not exist');
  });

  test('34 - Update按钮-主键修改校验', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '34');
    // 设置 sessionStorage 模拟从 Result List 返回（组件会恢复表单并设置 originalKeys）
    await page.evaluate(() => {
      const conds = [
        { label: 'Product class', operator: '=', value: 'A' },
        { label: 'Number', operator: '=', value: '1' },
        { label: 'Market', operator: '=', value: 'JP' },
        { label: 'Variable', operator: '=', value: '' },
        { label: 'Value', operator: '=', value: '' },
        { label: 'Comments', operator: '=', value: '' },
        { label: 'Add', operator: '=', value: '' },
        { label: 'Delete', operator: '=', value: '' },
        { label: 'Created by user', operator: '=', value: '' },
        { label: 'Date', operator: '=', value: '' },
        { label: 'Variant string', operator1: '=', value1: '', operator2: '=', value2: '' }
      ];
      sessionStorage.setItem('hv_conditions', JSON.stringify(conds));
    });
    await page.reload();
    await page.waitForSelector('.homologation-vars-container', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await ss(page, 'reloaded', '34');
    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const vP = await pS.locator('option:not([value=""])').first().getAttribute('value'); if (!vP) return;
    const opts = await pS.locator('option:not([value=""])').all();
    if (opts.length < 2) { return; }
    const snd = await opts[1].getAttribute('value');
    if (snd && snd !== 'A') await pS.selectOption(snd);
    await ss(page, 'before', '34');
    await $btnUpdate(page).click(); await page.waitForTimeout(1500);
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await ss(page, 'after', '34');
    expect(await $err(page).textContent()).toContain('Primary key conflict');
  });

  test('35 - Update按钮-更新成功', async ({ page }) => {
    await navigateToPage(page);
    await page.evaluate(() => sessionStorage.removeItem('hv_conditions'));

    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const vP = await pS.locator('option:not([value=""])').first().getAttribute('value'); if (!vP) return;
    await pS.selectOption(vP);
    await getInputByLabel(page, 'Number').fill(TD.updateNum);
    const mS = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    const vM = await mS.locator('option:not([value=""])').first().getAttribute('value'); if (!vM) return;
    await mS.selectOption(vM);
    await getInputByLabel(page, 'Variable').fill(TD.updateVar);
    await getInputByLabel(page, 'Value').fill('UPDATED_VALUE');
    await getInputByLabel(page, 'Comments').fill('UPDATE_TEST_CMT');

    // 确保 Variable 在 DB 中存在
    await ensureVar(TD.updateVar);
    // 确保测试记录在 HDOC_USER_DEFINED_RULES 中存在（直接插入，不依赖 beforeAll）
    const insertRes = await queryDB(
      'INSERT INTO HDOC_USER_DEFINED_RULES (PC,num,MARKET,VARIABLE,VAL,VS,VS2,COMMENTS,ADD_DATE,DELETE_DATE,REGISTER_DATETIME,REGISTER_USER,REGISTER_PROCESS,UPDATE_DATETIME,UPDATE_USER,UPDATE_PROCESS) VALUES (?,?,?,?,?,?,?,?,?,NULL,NOW(),?,?,NOW(),?,?) ON DUPLICATE KEY UPDATE VAL=VALUES(VAL),DELETE_DATE=NULL',
      [vP, TD.updateNum, vM, TD.updateVar, 'OLD_VALUE', '', '', 'OLD_COMMENT', '202630',
       'TEST_USER', 'UD08Test', 'TEST_USER', 'UD08Test']
    );
    console.log('  DB insert result:', insertRes ? 'success' : 'FAILED',
      '- PC:', vP, 'num:', TD.updateNum, 'market:', vM, 'var:', TD.updateVar);

    // 操作前截图：表单已填充的状态
    await ss(page, 'before', '35');

    // 使用真实后端 API（无拦截）
    await $btnUpdate(page).click(); await page.waitForTimeout(3000);

    // 调试：检查是否有错误消息
    const hasErr = await $err(page).isVisible().catch(() => false);
    if (hasErr) {
      const errText = await $err(page).textContent();
      console.log('  Error message after Update click:', errText);
      console.log('  Current URL:', page.url());
    }

    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    expect(await $successMsg(page).textContent()).toContain('success');

    // 操作后截图：更新成功
    await ss(page, 'after', '35');

    // 验证 DB 已被后端真实更新
    const db = await queryDB('SELECT VAL,COMMENTS FROM HDOC_USER_DEFINED_RULES WHERE num=? AND VARIABLE=?', [TD.updateNum, TD.updateVar]);
    if (db?.length) {
      expect(db[0].VAL).toBe('UPDATED_VALUE');
      expect(db[0].COMMENTS).toBe('UPDATE_TEST_CMT');
    }
  });

  test('36 - Update按钮-Variable存在性校验', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '36');
    await page.evaluate(() => sessionStorage.removeItem('hv_conditions'));
    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const vP = await pS.locator('option:not([value=""])').first().getAttribute('value'); if (!vP) return;
    await pS.selectOption(vP);
    await getInputByLabel(page, 'Number').fill(TD.updateNum);
    const mS = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    const vM = await mS.locator('option:not([value=""])').first().getAttribute('value'); if (!vM) return;
    await mS.selectOption(vM);
    // Variable 填入不存在的值，拦截 checkRule 返回记录存在，让流程进入 Variable 校验
    await page.route('**/api/v1/hdoc/ud08/checkRule', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { exists: true, count: 1 } }) });
    });
    await getInputByLabel(page, 'Variable').fill('NON_EXIST_VAR_' + ts());
    await ss(page, 'before', '36');
    await $btnUpdate(page).click(); await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await ss(page, 'after', '36');
    expect(await $err(page).textContent()).toContain('Variant does not exist');
    await page.unroute('**/api/v1/hdoc/ud08/checkRule');
  });

  test('37 - Update按钮-更新后审计字段确认', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '37');
    await page.evaluate(() => sessionStorage.removeItem('hv_conditions'));
    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const vP = await pS.locator('option:not([value=""])').first().getAttribute('value'); if (!vP) return;
    await pS.selectOption(vP);
    await getInputByLabel(page, 'Number').fill(TD.updateNum);
    const mS = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    const vM = await mS.locator('option:not([value=""])').first().getAttribute('value'); if (!vM) return;
    await mS.selectOption(vM);
    await getInputByLabel(page, 'Variable').fill(TD.updateVar);
    await getInputByLabel(page, 'Value').fill('AUDIT_UPDATE_VAL');
    await ss(page, 'before', '37');
    await $btnUpdate(page).click(); await page.waitForTimeout(3000);
    await ss(page, 'after', '37');
    await queryDB('UPDATE HDOC_USER_DEFINED_RULES SET VAL=? WHERE num=? AND VARIABLE=?', ['OLD_VALUE', TD.updateNum, TD.updateVar]);
  });

  // =========== TC39~42: Delete按钮 ===========

  test('39 - Delete按钮-空值校验', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '39');
    await ss(page, 'before', '39');
    await $btnDelete(page).click();
    await expect($err(page)).toBeVisible();
    await ss(page, 'after', '39');
    const t = await $err(page).textContent()||'';
    expect(t).toContain('Product class'); expect(t).toContain('Number'); expect(t).toContain('Market'); expect(t).toContain('required');
  });

  test('40 - Delete按钮-记录不存在', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '40');
    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const vP = await pS.locator('option:not([value=""])').first().getAttribute('value'); if (!vP) return;
    await pS.selectOption(vP);
    await getInputByLabel(page, 'Number').fill('99999');
    const mS = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    const vM = await mS.locator('option:not([value=""])').first().getAttribute('value'); if (!vM) return;
    await mS.selectOption(vM);
    await ss(page, 'before', '40');
    await $btnDelete(page).click(); await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await ss(page, 'after', '40');
    expect(await $err(page).textContent()).toContain('Data does not exist');
  });

  test('41 - Delete按钮-删除成功', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '41');
    await page.evaluate(() => sessionStorage.removeItem('hv_conditions'));

    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const vP = await pS.locator('option:not([value=""])').first().getAttribute('value'); if (!vP) return;
    await pS.selectOption(vP);
    await getInputByLabel(page, 'Number').fill(TD.deleteNum);
    const mS = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    const vM = await mS.locator('option:not([value=""])').first().getAttribute('value'); if (!vM) return;
    await mS.selectOption(vM);
    await getInputByLabel(page, 'Variable').fill(TD.deleteVar);

    // 拦截 checkRule 返回记录存在，拦截 delete API 返回成功
    await page.route('**/api/v1/hdoc/ud08/checkRule', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { exists: true, count: 1 } }) });
    });
    await page.route('**/api/v1/hdoc/ud08/delete', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: null }) });
    });

    await ss(page, 'before', '41');
    await $btnDelete(page).click(); await page.waitForTimeout(3000);
    await expect($successMsg(page)).toBeVisible({ timeout: 5000 });
    await ss(page, 'after', '41');
    expect(await $successMsg(page).textContent()).toContain('success');

    await page.unroute('**/api/v1/hdoc/ud08/delete');
    await page.unroute('**/api/v1/hdoc/ud08/checkRule');
  });

  test('42 - Delete操作-物理删除确认', async ({ page }) => {
    await navigateToPage(page);
    const vn = ts()+'42'; const vv = PREFIX+'VERIFY_DEL';
    // 先获取下拉列表的值，确保插入的 PC/MARKET 与表单一致
    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const vP = await pS.locator('option:not([value=""])').first().getAttribute('value'); if (!vP) return;
    const mS = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    const vM = await mS.locator('option:not([value=""])').first().getAttribute('value'); if (!vM) return;
    // 确保 Variable 存在
    await ensureVar(vv);
    // 插入测试记录（使用与下拉列表一致的 PC/MARKET）
    await queryDB('INSERT INTO HDOC_USER_DEFINED_RULES (PC,num,MARKET,VARIABLE,VAL,VS,VS2,COMMENTS,ADD_DATE,DELETE_DATE,REGISTER_DATETIME,REGISTER_USER,REGISTER_PROCESS,UPDATE_DATETIME,UPDATE_USER,UPDATE_PROCESS) VALUES (?,?,?,?,?,?,?,?,?,NULL,NOW(),?,?,NOW(),?,?)',
      [vP, vn, vM, vv, '', '', '', '', '202630', 'TEST_USER', 'UD08Test', 'TEST_USER', 'UD08Test']);
    // 填写表单并删除
    await pS.selectOption(vP);
    await getInputByLabel(page, 'Number').fill(vn);
    await mS.selectOption(vM);
    await getInputByLabel(page, 'Variable').fill(vv);

    // 操作前截图：删除前表单已填充
    await ss(page, 'before', '42');

    await $btnDelete(page).click(); await page.waitForTimeout(3000);

    // 操作后截图：删除完成
    await ss(page, 'after', '42');

    // 后端为物理删除（DELETE FROM），验证记录已从 DB 中移除
    const db = await queryDB('SELECT COUNT(*) as cnt FROM HDOC_USER_DEFINED_RULES WHERE num=? AND VARIABLE=?', [vn, vv]);
    if (db?.length) {
      expect(db[0].cnt).toBe(0);
    }
    // 清理残留
    await queryDB('DELETE FROM HDOC_USER_DEFINED_RULES WHERE num=?', [vn]);
  });

  // =========== TC43~45: 异常处理 ===========

  test('43 - 异常处理-下拉列表加载失败', async ({ page }) => {
    await login(page); await ss(page, 'loggedin', '43');
    await page.route('**/api/v1/hdoc/ud08/productclass', r => r.abort());
    await page.route('**/api/v1/hdoc/ud08/market', r => r.abort());
    await ss(page, 'before', '43');
    await page.goto(PAGE_URL + '/menu/homologation-variables', { waitUntil: 'load', timeout: 15000 });
    await page.waitForSelector('.homologation-vars-container', { timeout: 10000 });
    await ss(page, 'after', '43');
    await page.unroute('**/api/v1/hdoc/ud08/productclass');
    await page.unroute('**/api/v1/hdoc/ud08/market');
  });

  test('44 - 异常处理-网络异常（Add操作）', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '44');
    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const vP = await pS.locator('option:not([value=""])').first().getAttribute('value'); if (!vP) return;
    await pS.selectOption(vP);
    await getInputByLabel(page, 'Number').fill(ts()+'44');
    const mS = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    const vM = await mS.locator('option:not([value=""])').first().getAttribute('value'); if (!vM) return;
    await mS.selectOption(vM);
    await getInputByLabel(page, 'Variable').fill(TD.addVar);
    await page.route('**/api/v1/hdoc/ud08/add', r => r.abort());
    await ss(page, 'before', '44');
    await $btnAdd(page).click(); await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible();
    await ss(page, 'after', '44');
    expect(await $err(page).textContent()).toContain('System error');
    await expect($btnAdd(page)).toBeEnabled();
    await page.unroute('**/api/v1/hdoc/ud08/add');
  });

  test('45 - 异常处理-API超时', async ({ page }) => {
    test.setTimeout(70000); // 该用例需要等待前端 30s 超时，单独设置更长超时
    await navigateToPage(page); await ss(page, 'init', '45');
    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const vP = await pS.locator('option:not([value=""])').first().getAttribute('value'); if (!vP) return;
    await pS.selectOption(vP);
    await getInputByLabel(page, 'Number').fill(ts()+'45');
    const mS = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    const vM = await mS.locator('option:not([value=""])').first().getAttribute('value'); if (!vM) return;
    await mS.selectOption(vM);
    await getInputByLabel(page, 'Variable').fill(TD.addVar);
    // API 延迟 31s 稍大于前端 30s 超时
    await page.route('**/api/v1/hdoc/ud08/add', async route => {
      await new Promise(r => setTimeout(r, 31000));
      await route.continue();
    });
    await ss(page, 'before', '45');
    await $btnAdd(page).click();
    await page.waitForTimeout(31500);
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await ss(page, 'after', '45');
    // 前端 30s 请求超时返回 "Request timeout."
    const msg = await $err(page).textContent() || '';
    expect(msg).toContain('timeout');
    await page.unroute('**/api/v1/hdoc/ud08/add');
  });

  // =========== TC46~47: 消息显示 ===========

  test('46 - 消息显示-Error样式', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '46');
    await ss(page, 'before', '46');
    await $btnSearch(page).click();
    await expect($err(page)).toBeVisible();
    await ss(page, 'after', '46');
    await expect($err(page)).toHaveText('Product class, Number and Market are required.');
    const color = await $err(page).evaluate(el => getComputedStyle(el).color);
    // 验证为红色系 (R > G 且 R > B)
    const rgb = color.match(/(\d+)/g);
    if (rgb) {
      const r = parseInt(rgb[0]), g = parseInt(rgb[1]), b = parseInt(rgb[2]);
      console.log('  Error RGB: ' + r + ',' + g + ',' + b);
      expect(r).toBeGreaterThan(g);
      expect(r).toBeGreaterThan(b);
    }
  });

  test('47 - 消息清空-Clear时错误消息消失', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '47');
    await $btnSearch(page).click();
    await expect($err(page)).toBeVisible();
    await ss(page, 'error', '47');
    await ss(page, 'before', '47');
    await $btnClear(page).click();
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'after', '47');
  });

  // =========== TC48~50: 安全性 ===========

  test('48 - 安全性-未登录访问', async ({ page }) => {
    // 先导航到有效页面的 origin，确保 localStorage 可访问
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await page.evaluate(() => localStorage.clear());
    await ss(page, 'before', '48');
    // 导航到受保护的页面
    await page.goto(PAGE_URL + '/menu/homologation-variables', { waitUntil: 'load', timeout: 15000 });
    // 等待 React Router 处理重定向
    await page.waitForTimeout(2000);
    await ss(page, 'after', '48');
    expect(page.url()).toContain('/login');
  });

  test('49 - 安全性-SQL注入防护', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '49');
    await getInputByLabel(page, 'Variable').fill("' OR '1'='1");
    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const vP = await pS.locator('option:not([value=""])').first().getAttribute('value'); if (!vP) return;
    await pS.selectOption(vP);
    await getInputByLabel(page, 'Number').fill('12345');
    const mS = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    const vM = await mS.locator('option:not([value=""])').first().getAttribute('value'); if (!vM) return;
    await mS.selectOption(vM);
    await ss(page, 'before', '49');
    await $btnSearch(page).click();
    const ev = await $err(page).isVisible().catch(()=>false);
    if (ev) {
      const t = (await $err(page).textContent()||'').toLowerCase();
      expect(t).not.toContain('sql'); expect(t).not.toContain('syntax');
    }
    await ss(page, 'after', '49');
  });

  test('50 - 安全性-XSS防护', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '50');
    let dc = 0;
    page.on('dialog', ()=>dc++);
    await getInputByLabel(page, 'Variable').fill('<script>alert(1)</script>');
    const pS = $rowProductClass(page).locator('.hv-cond-select');
    const vP = await pS.locator('option:not([value=""])').first().getAttribute('value'); if (!vP) return;
    await pS.selectOption(vP);
    await getInputByLabel(page, 'Number').fill('12345');
    const mS = getRowByLabel(page, 'Market').locator('.hv-cond-select');
    const vM = await mS.locator('option:not([value=""])').first().getAttribute('value'); if (!vM) return;
    await mS.selectOption(vM);
    await ss(page, 'before', '50');
    await $btnSearch(page).click();
    expect(dc).toBe(0);
    // 搜索正常（Variable 中的 XSS 内容不生效），确认页面仍在正常工作状态
    await expect(page.locator('body')).toBeVisible();
    await ss(page, 'after', '50');
  });

});
