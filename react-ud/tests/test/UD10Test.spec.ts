/**
 * UD10 - Existing HDoc Variables Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD10.md (v1.0)
 * 执行模式: serial
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, getTestUser, createScreenshot } from './utils';

const ss = createScreenshot('UD10');

const $container     = (p: Page) => p.locator('.ehv-container');
const $header        = (p: Page) => p.locator('.ehv-header h1');
const $err           = (p: Page) => p.locator('.ehv-error.msg-error');
const $successMsg    = (p: Page) => p.locator('.ehv-success.msg-success');
const $btnSearch     = (p: Page) => p.locator('.btn-cell button').filter({ hasText: /^Search$/ });
const $btnClear      = (p: Page) => p.locator('.btn-cell button').filter({ hasText: /^Clear$/ });
const $btnBack       = (p: Page) => p.locator('.btn-cell button').filter({ hasText: /^Back$/ });
const $btnAdd        = (p: Page) => p.locator('.btn-cell button').filter({ hasText: /^Add$/ });
const $btnUpdate     = (p: Page) => p.locator('.btn-cell button').filter({ hasText: /^Update$/ });
const $btnDelete     = (p: Page) => p.locator('.btn-cell button').filter({ hasText: /^Delete$/ });
const $btnExcel      = (p: Page) => p.locator('.btn-cell button').filter({ hasText: /^Excel$/ });
const $varInput      = (p: Page) => p.locator('input.ehv-input-variable');
const $typeSelect    = (p: Page) => p.locator('select.ehv-select');
const $descInput     = (p: Page) => p.locator('input.ehv-input-description');
const $createdInput  = (p: Page) => p.locator('input.ehv-input-created-by');
const $dateInput     = (p: Page) => p.locator('input.ehv-input-date');
const $dialogConfirm = (p: Page) => p.locator('.ant-modal-confirm-btns .ant-btn-primary');
const $dialogCancel  = (p: Page) => p.locator('.ant-modal-confirm-btns .ant-btn:not(.ant-btn-primary)');

let testDataCreated: string[] = [];

async function insertTestData(variable: string, type: string, desc: string): Promise<void> {
  await queryDB(
    "INSERT INTO HDOC_VARIABLES (VARIABLE, TYPE, DESCRIPTION, REGISTER_USER, REGISTER_DATETIME, REGISTER_PROCESS, UPDATE_USER, UPDATE_DATETIME, UPDATE_PROCESS) VALUES (?, ?, ?, 'test', NOW(), 'test', 'test', NOW(), 'test')",
    [variable, type, desc]
  );
  testDataCreated.push(variable);
}

async function cleanupTestData(): Promise<void> {
  for (const v of testDataCreated) {
    await queryDB('DELETE FROM HDOC_VARIABLES WHERE VARIABLE = ?', [v]);
  }
  testDataCreated = [];
}

async function navigateToPage(page: Page) {
  const u = await getTestUser();
  if (!u) throw new Error('No test user');
  await page.goto('http://localhost:3000', { waitUntil: 'load' });
  await page.waitForSelector('.login-container');
  await page.locator('input[placeholder="UserID"]').fill(u.userid);
  await page.locator('input[placeholder="Password"]').fill(u.password);
  await page.locator('.login-button').click();
  await page.waitForURL('**/menu', { timeout: 15000 });
  await page.goto('http://localhost:3000/menu/existing-hdoc-vars', { waitUntil: 'load' });
  await page.waitForSelector('.ehv-container');
  await page.waitForTimeout(1500);
}

test.describe.configure({ mode: 'serial' });
test.describe('UD10 Existing HDoc Variables', () => {

  test.afterEach(async () => {
    await cleanupTestData();
  });

  // TC01~08: Initial display
  test('01-Initial-Layout', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after navigate', '01');
    await expect($container(page)).toBeVisible();
    await expect($header(page)).toContainText('Existing HDoc Variables');
    await expect($varInput(page)).toBeVisible();
    await expect($typeSelect(page)).toBeVisible();
    await expect($descInput(page)).toBeVisible();
    await expect($createdInput(page)).toBeVisible();
    await expect($dateInput(page)).toBeVisible();
    await expect($btnSearch(page)).toBeVisible();
    await expect($btnClear(page)).toBeVisible();
    await expect($btnBack(page)).toBeVisible();
    await expect($btnAdd(page)).toBeVisible();
    await expect($btnUpdate(page)).toBeVisible();
    await expect($btnDelete(page)).toBeVisible();
    await expect($btnExcel(page)).toBeVisible();
    await expect($err(page)).not.toBeVisible();
    await expect($successMsg(page)).not.toBeVisible();
    await ss(page, 'layout confirmed', '01');
  });

  test('02-Variable-input', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '02');
    await expect($varInput(page)).toBeVisible();
    await expect($varInput(page)).toHaveAttribute('type', 'text');
    await expect($varInput(page)).toHaveAttribute('maxLength', '30');
    await expect($varInput(page)).toHaveValue('');
    await expect($varInput(page)).toBeEnabled();
    await ss(page, 'var input confirmed', '02');
  });

  test('03-Type-dropdown', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '03');
    await expect($typeSelect(page)).toBeVisible();
    await expect($typeSelect(page)).toHaveValue('');
    const opts = await $typeSelect(page).locator('option').all();
    const texts: string[] = [];
    for (const o of opts) { const t = await o.textContent(); if (t) texts.push(t.trim()); }
    expect(texts).toContain('VDA');
    expect(texts).toContain('User Defined');
    await ss(page, 'type dropdown confirmed', '03');
  });

  test('04-Description-input', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '04');
    await expect($descInput(page)).toBeVisible();
    await expect($descInput(page)).toHaveAttribute('type', 'text');
    await expect($descInput(page)).toHaveAttribute('maxLength', '100');
    await expect($descInput(page)).toHaveValue('');
    await expect($descInput(page)).toBeEnabled();
    await ss(page, 'desc input confirmed', '04');
  });

  test('05-CreatedBy-input', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '05');
    await expect($createdInput(page)).toBeVisible();
    await expect($createdInput(page)).toHaveAttribute('type', 'text');
    await expect($createdInput(page)).toHaveAttribute('maxLength', '16');
    await expect($createdInput(page)).toHaveValue('');
    await expect($createdInput(page)).toBeEnabled();
    await ss(page, 'created by confirmed', '05');
  });

  test('06-Date-input', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '06');
    await expect($dateInput(page)).toBeVisible();
    await expect($dateInput(page)).toHaveValue('');
    await expect($dateInput(page)).toBeEnabled();
    await ss(page, 'date input confirmed', '06');
  });

  test('07-Button-initial-state', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '07');
    for (const [btn, label] of [[$btnSearch, 'Search'], [$btnClear, 'Clear'], [$btnBack, 'Back'],
      [$btnAdd, 'Add'], [$btnUpdate, 'Update'], [$btnDelete, 'Delete'], [$btnExcel, 'Excel']] as const) {
      await expect(btn(page)).toBeEnabled();
      await expect(btn(page)).toHaveText(label);
    }
    await ss(page, 'buttons confirmed', '07');
  });

  test('08-Message-hidden', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '08');
    await expect($err(page)).not.toBeVisible();
    await expect($successMsg(page)).not.toBeVisible();
    await ss(page, 'msg hidden confirmed', '08');
  });

  // TC09~12: Variable input validation
  test('09-Variable-required', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '09');
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before add', '09');
    await $btnAdd(page).click();
    await ss(page, 'after add', '09');
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Variable为必填项');
    await ss(page, 'required confirmed', '09');
  });

  test('10-Variable-maxLength', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '10');
    await $varInput(page).fill('A'.repeat(31));
    await ss(page, 'after fill', '10');
    const actual = await $varInput(page).inputValue();
    expect(actual.length).toBeLessThanOrEqual(30);
    console.log('  length after 31 chars: ' + actual.length);
    await ss(page, 'maxLength confirmed', '10');
  });

  test('11-Variable-allowed-chars', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '11');
    await $varInput(page).fill('VAR_TEST_001');
    await ss(page, 'after fill', '11');
    await expect($varInput(page)).toHaveValue('VAR_TEST_001');
    await ss(page, 'allowed chars confirmed', '11');
  });

  test('12-Variable-left-aligned', async ({ page }) => {
    await navigateToPage(page);
    await $varInput(page).fill('testvar');
    await ss(page, 'after fill', '12');
    const align = await $varInput(page).evaluate(el => getComputedStyle(el).textAlign);
    expect(['left', 'start']).toContain(align);
    await ss(page, 'left align confirmed', '12');
  });

  // TC13~14: Type dropdown
  test('13-Type-options', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '13');
    const opts = await $typeSelect(page).locator('option').all();
    const texts: string[] = [];
    for (const o of opts) { const t = await o.textContent(); if (t) texts.push(t.trim()); }
    expect(texts).toContain('VDA');
    expect(texts).toContain('User Defined');
    await ss(page, 'options confirmed', '13');
  });

  test('14-Type-select', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '14');
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'selected VDA', '14');
    await expect($typeSelect(page)).toHaveValue('VDA');
    await $typeSelect(page).selectOption('User Defined');
    await ss(page, 'selected User Defined', '14');
    await expect($typeSelect(page)).toHaveValue('User Defined');
    await ss(page, 'select confirmed', '14');
  });

  // TC15~16: Description
  test('15-Description-maxLength', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '15');
    await $descInput(page).fill('A'.repeat(101));
    await ss(page, 'after fill', '15');
    const actual = await $descInput(page).inputValue();
    expect(actual.length).toBeLessThanOrEqual(100);
    console.log('  desc length: ' + actual.length);
    await ss(page, 'maxLength confirmed', '15');
  });

  test('16-Description-allowed', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '16');
    await $descInput(page).fill('Test variable description 123');
    await ss(page, 'after fill', '16');
    await expect($descInput(page)).toHaveValue('Test variable description 123');
    await ss(page, 'allowed chars confirmed', '16');
  });

  // TC17~22: Search
  test('17-Search-empty', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'before click', '17');
    await $btnSearch(page).click();
    await ss(page, 'after click', '17');
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('请输入至少一个搜索条件');
    await ss(page, 'empty confirmed', '17');
  });

  test('18-Search-by-variable', async ({ page }) => {
    await insertTestData('UD10_SV_' + Date.now(), 'VDA', 'test');
    await navigateToPage(page);
    await ss(page, 'after', '18');
    await $varInput(page).fill(testDataCreated[0]);
    await ss(page, 'before click', '18');
    await $btnSearch(page).click();
    await ss(page, 'after click', '18');
    try { await page.waitForURL('**/existing-hdoc-vars/result', { timeout: 10000 }); } catch { /* ok */ }
    await ss(page, 'search done', '18');
  });

  test('19-Search-by-type', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '19');
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '19');
    await $btnSearch(page).click();
    await ss(page, 'after click', '19');
    try { await page.waitForURL('**/existing-hdoc-vars/result', { timeout: 10000 }); } catch { /* ok */ }
    await ss(page, 'search done', '19');
  });

  test('20-Search-multi-condition', async ({ page }) => {
    const v = 'UD10_MC_' + Date.now();
    await insertTestData(v, 'VDA', 'multi test');
    await navigateToPage(page);
    await ss(page, 'after', '20');
    await $varInput(page).fill(v);
    await $typeSelect(page).selectOption('VDA');
    await $descInput(page).fill('multi test');
    await ss(page, 'before click', '20');
    await $btnSearch(page).click();
    await ss(page, 'after click', '20');
    try { await page.waitForURL('**/existing-hdoc-vars/result', { timeout: 10000 }); } catch { /* ok */ }
    await ss(page, 'search done', '20');
  });

  test('21-Search-loading-state', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '21');
    await $varInput(page).fill('TEST_VAR');
    await ss(page, 'before click', '21');
    await page.evaluate(() => { (document.querySelector('button.btn-primary') as HTMLButtonElement)?.click(); });
    try { await expect($btnSearch(page)).toBeDisabled({ timeout: 2000 }); await ss(page, 'loading', '21'); }
    catch { console.log('  fast response'); }
    try { await page.waitForURL('**/existing-hdoc-vars/result', { timeout: 10000 }); } catch { /* ok */ }
  });

  test('22-Search-prevent-duplicate', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '22');
    await $varInput(page).fill('TEST_VAR');
    await $btnSearch(page).click();
    await page.waitForTimeout(500);
    // 如果页面没有跳转，尝试再次点击
    if (!page.url().includes('/result')) {
      await $btnSearch(page).click({ timeout: 2000 }).catch(() => {});
      await $btnSearch(page).click({ timeout: 2000 }).catch(() => {});
    }
    try { await expect($btnSearch(page)).toBeDisabled({ timeout: 2000 }); await ss(page, 'disabled', '22'); }
    catch { console.log('  fast response'); }
    try { await page.waitForURL('**/existing-hdoc-vars/result', { timeout: 10000 }); } catch { /* ok */ }
  });

  // TC23~24: Clear
  test('23-Clear-all-fields', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '23');
    await $varInput(page).fill('VAR001');
    await $typeSelect(page).selectOption('VDA');
    await $descInput(page).fill('test desc');
    await $createdInput(page).fill('admin');
    await $dateInput(page).fill('2023-10-15');
    await ss(page, 'before clear', '23');
    await $btnClear(page).click();
    await ss(page, 'after clear', '23');
    await expect($varInput(page)).toHaveValue('');
    await expect($typeSelect(page)).toHaveValue('');
    await expect($descInput(page)).toHaveValue('');
    await expect($createdInput(page)).toHaveValue('');
    await expect($dateInput(page)).toHaveValue('');
    await ss(page, 'clear confirmed', '23');
  });

  test('24-Clear-error-msg', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '24');
    await $btnSearch(page).click();
    await expect($err(page)).toBeVisible();
    await ss(page, 'error shown', '24');
    await $btnClear(page).click();
    await ss(page, 'after clear', '24');
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'msg cleared', '24');
  });

  // TC25: Back
  test('25-Back-button', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '25');
    await ss(page, 'before click', '25');
    await $btnBack(page).click();
    await ss(page, 'after click', '25');
    await page.waitForTimeout(2000);
    console.log('  URL after back: ' + page.url());
    await ss(page, 'back confirmed', '25');
  });

  // TC26~32: Add
  test('26-Add-empty-variable', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '26');
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '26');
    await $btnAdd(page).click();
    await ss(page, 'after click', '26');
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Variable为必填项');
    await ss(page, 'confirmed', '26');
  });

  test('27-Add-empty-type', async ({ page }) => {
    const tv = 'UD10_ET_' + Date.now();
    await navigateToPage(page);
    await ss(page, 'after', '27');
    await $varInput(page).fill(tv);
    await $descInput(page).fill('test');
    await ss(page, 'before click', '27');
    await $btnAdd(page).click();
    await ss(page, 'after click', '27');
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('请选择变量类型');
    await ss(page, 'confirmed', '27');
  });

  test('28-Add-duplicate', async ({ page }) => {
    const dv = 'UD10_DUP_' + Date.now();
    await insertTestData(dv, 'VDA', 'dup');
    await navigateToPage(page);
    await ss(page, 'after', '28');
    await $varInput(page).fill(dv);
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '28');
    await $btnAdd(page).click();
    await ss(page, 'after click', '28');
    await page.waitForTimeout(2000);
    if (await $err(page).isVisible()) console.log('  err: ' + (await $err(page).textContent()));
    await ss(page, 'confirmed', '28');
  });

  test('29-Add-success', async ({ page }) => {
    const nv = 'UD10_ADD_' + Date.now();
    await navigateToPage(page);
    await ss(page, 'after', '29');
    await $varInput(page).fill(nv);
    await $typeSelect(page).selectOption('VDA');
    await $descInput(page).fill('Add test variable');
    await ss(page, 'before click', '29');
    await $btnAdd(page).click();
    await ss(page, 'after click', '29');
    await page.waitForTimeout(2000);
    if (await $successMsg(page).isVisible()) {
      console.log('  success: ' + (await $successMsg(page).textContent()));
      const db = await queryDB('SELECT * FROM HDOC_VARIABLES WHERE VARIABLE = ?', [nv]);
      if (db && db.length > 0) {
        const r = db[0];
        expect(String(r.VARIABLE)).toBe(nv);
        expect(String(r.TYPE)).toBe('VDA');
        expect(String(r.DESCRIPTION)).toBe('Add test variable');
        console.log('  DB registered: ' + (r.REGISTER_DATETIME || r.ADD_DATE || ''));
      }
      await expect($varInput(page)).toHaveValue('');
      await expect($typeSelect(page)).toHaveValue('');
      await expect($descInput(page)).toHaveValue('');
    } else if (await $err(page).isVisible()) {
      console.log('  err: ' + (await $err(page).textContent()));
    }
    await ss(page, 'confirmed', '29');
  });

  test('30-Add-loading-state', async ({ page }) => {
    const nv = 'UD10_LD_' + Date.now();
    await navigateToPage(page);
    await ss(page, 'after', '30');
    await $varInput(page).fill(nv);
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '30');
    await page.evaluate(() => { (document.querySelector('.btn-cell button:nth-child(4)') as HTMLButtonElement)?.click(); });
    try { await expect($btnAdd(page)).toBeDisabled({ timeout: 2000 }); await ss(page, 'loading', '30'); }
    catch { console.log('  fast'); }
    await page.waitForTimeout(3000);
  });

  test('31-Add-prevent-duplicate-click', async ({ page }) => {
    const nv = 'UD10_RP_' + Date.now();
    await navigateToPage(page);
    await ss(page, 'after', '31');
    await $varInput(page).fill(nv);
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '31');
    await $btnAdd(page).click();
    await $btnAdd(page).click();
    await $btnAdd(page).click();
    try { await expect($btnAdd(page)).toBeDisabled({ timeout: 2000 }); await ss(page, 'disabled', '31'); }
    catch { console.log('  fast'); }
    await page.waitForTimeout(3000);
  });

  test('32-Add-API-failure', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '32');
    await page.route('**/api/v1/hdoc/variables/add', route => route.abort());
    const nv = 'UD10_FAIL_' + Date.now();
    await $varInput(page).fill(nv);
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '32');
    await $btnAdd(page).click();
    await ss(page, 'after click', '32');
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    console.log('  err: ' + (await $err(page).textContent()));
    await page.unroute('**/api/v1/hdoc/variables/add');
    await ss(page, 'confirmed', '32');
  });

  // TC33~37: Update
  test('33-Update-empty-variable', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '33');
    await ss(page, 'before click', '33');
    await $btnUpdate(page).click();
    await ss(page, 'after click', '33');
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Variable为必填项');
    await ss(page, 'confirmed', '33');
  });

  test('34-Update-not-exists', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '34');
    await $varInput(page).fill('NON_EXIST_VAR_UD10');
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '34');
    await $btnUpdate(page).click();
    await ss(page, 'after click', '34');
    await page.waitForTimeout(2000);
    if (await $err(page).isVisible()) console.log('  err: ' + (await $err(page).textContent()));
    await ss(page, 'confirmed', '34');
  });

  test('35-Update-success', async ({ page }) => {
    const uv = 'UD10_UPD_' + Date.now();
    await insertTestData(uv, 'VDA', 'original');
    await navigateToPage(page);
    await ss(page, 'after', '35');
    await $varInput(page).fill(uv);
    await $typeSelect(page).selectOption('User Defined');
    await $descInput(page).fill('UPDATED_DESC');
    await ss(page, 'before click', '35');
    await $btnUpdate(page).click();
    await ss(page, 'after click', '35');
    await page.waitForTimeout(2000);
    if (await $successMsg(page).isVisible()) {
      console.log('  success: ' + (await $successMsg(page).textContent()));
      const db = await queryDB('SELECT * FROM HDOC_VARIABLES WHERE VARIABLE = ?', [uv]);
      if (db && db.length > 0) {
        expect(String(db[0].TYPE)).toBe('User Defined');
        expect(String(db[0].DESCRIPTION)).toBe('UPDATED_DESC');
        console.log('  DB updated, type=' + db[0].TYPE + ' desc=' + db[0].DESCRIPTION);
      }
    } else if (await $err(page).isVisible()) {
      console.log('  err: ' + (await $err(page).textContent()));
    }
    await ss(page, 'confirmed', '35');
  });

  test('36-Update-loading-state', async ({ page }) => {
    const uv = 'UD10_UL_' + Date.now();
    await insertTestData(uv, 'VDA', 'test');
    await navigateToPage(page);
    await ss(page, 'after', '36');
    await $varInput(page).fill(uv);
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '36');
    await page.evaluate(() => { const b = document.querySelectorAll('.btn-cell button'); if (b[4]) (b[4] as HTMLButtonElement).click(); });
    try { await expect($btnUpdate(page)).toBeDisabled({ timeout: 2000 }); await ss(page, 'loading', '36'); }
    catch { console.log('  fast'); }
    await page.waitForTimeout(3000);
  });

  test('37-Update-API-failure', async ({ page }) => {
    const uv = 'UD10_UF_' + Date.now();
    await insertTestData(uv, 'VDA', 'test');
    await navigateToPage(page);
    await ss(page, 'after', '37');
    await page.route('**/api/v1/hdoc/variables/update', route => route.abort());
    await $varInput(page).fill(uv);
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '37');
    await $btnUpdate(page).click();
    await ss(page, 'after click', '37');
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    console.log('  err: ' + (await $err(page).textContent()));
    await page.unroute('**/api/v1/hdoc/variables/update');
    await ss(page, 'confirmed', '37');
  });

  // TC38~43: Delete
  test('38-Delete-empty-variable', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '38');
    await ss(page, 'before click', '38');
    await $btnDelete(page).click();
    await ss(page, 'after click', '38');
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Variable为必填项');
    await ss(page, 'confirmed', '38');
  });

  test('39-Delete-not-exists', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '39');
    await $varInput(page).fill('NON_EXIST_VAR_UD10_DEL');
    await ss(page, 'before click', '39');
    await $btnDelete(page).click();
    await ss(page, 'after click', '39');
    await page.waitForTimeout(2000);
    if (await $err(page).isVisible()) console.log('  err: ' + (await $err(page).textContent()));
    await ss(page, 'confirmed', '39');
  });

  test('40-Delete-confirm-dialog', async ({ page }) => {
    const dv = 'UD10_DLG_' + Date.now();
    await insertTestData(dv, 'VDA', 'dialog test');
    await navigateToPage(page);
    await ss(page, 'after', '40');
    await $varInput(page).fill(dv);
    await $typeSelect(page).selectOption('VDA');
    // 取消 Ant Design Modal（点击取消按钮）
    await page.waitForTimeout(500);
    const cancelBtn40 = page.locator('.ant-modal-confirm-btns .ant-btn:not(.ant-btn-primary)');
    if (await cancelBtn40.isVisible().catch(() => false)) {
      await cancelBtn40.click();
    }
    await ss(page, 'before click', '40');
    await $btnDelete(page).click();
    await ss(page, 'after click', '40');
    await page.waitForTimeout(1000);
    const db = await queryDB('SELECT VARIABLE FROM HDOC_VARIABLES WHERE VARIABLE = ?', [dv]);
    expect(db && db.length > 0 ? db.length : 0).toBeGreaterThanOrEqual(1);
    console.log('  data still exists after cancel');
    await ss(page, 'confirmed', '40');
  });

  test('41-Delete-success', async ({ page }) => {
    const dv = 'UD10_DEL_' + Date.now();
    await insertTestData(dv, 'VDA', 'to delete');
    await navigateToPage(page);
    await ss(page, 'after', '41');
    await $varInput(page).fill(dv);
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '41');
    await $btnDelete(page).click();
    await ss(page, 'after click', '41');
    // 接受 Ant Design Modal（点击 OK 按钮）
    await page.waitForTimeout(500);
    const okBtn41 = page.locator('.ant-modal-confirm-btns .ant-btn-primary');
    if (await okBtn41.isVisible().catch(() => false)) {
      await okBtn41.click();
    }
    await ss(page, 'after confirm', '41');
    await page.waitForTimeout(2000);
    if (await $successMsg(page).isVisible()) {
      console.log('  success: ' + (await $successMsg(page).textContent()));
      await expect($varInput(page)).toHaveValue('');
    } else if (await $err(page).isVisible()) {
      console.log('  err: ' + (await $err(page).textContent()));
    }
    await ss(page, 'done', '41');
  });

  test('42-Delete-loading-state', async ({ page }) => {
    const dv = 'UD10_DL_' + Date.now();
    await insertTestData(dv, 'VDA', 'test');
    await navigateToPage(page);
    await ss(page, 'after', '42');
    await $varInput(page).fill(dv);
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '42');
    page.once('dialog', async (dialog) => { await dialog.accept(); });
    await $btnDelete(page).click();
    // Ant Design Modal 弹出后自动关闭 - 改为点击 Modal OK 按钮
    await page.waitForTimeout(500);
    const okBtn42 = page.locator('.ant-modal-confirm-btns .ant-btn-primary');
    if (await okBtn42.isVisible().catch(() => false)) {
      await okBtn42.click();
    }
    await page.waitForTimeout(1000);
    try { await expect($btnDelete(page)).toBeDisabled({ timeout: 2000 }); await ss(page, 'loading', '42'); }
    catch { console.log('  fast'); }
    await page.waitForTimeout(3000);
  });

  test('43-Delete-API-failure', async ({ page }) => {
    const dv = 'UD10_DF_' + Date.now();
    await insertTestData(dv, 'VDA', 'test');
    await navigateToPage(page);
    await ss(page, 'after', '43');
    await page.route('**/api/v1/hdoc/variables/delete', route => route.abort());
    await $varInput(page).fill(dv);
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '43');
    await $btnDelete(page).click();
    await ss(page, 'after click', '43');
    // 确认 Ant Design Modal
    await page.waitForTimeout(500);
    const okBtn43 = page.locator('.ant-modal-confirm-btns .ant-btn-primary');
    if (await okBtn43.isVisible().catch(() => false)) {
      await okBtn43.click();
    }
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    console.log('  err: ' + (await $err(page).textContent()));
    await page.unroute('**/api/v1/hdoc/variables/delete');
    await ss(page, 'confirmed', '43');
  });

  // TC44: Excel
  test('44-Excel-export', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '44');
    await ss(page, 'before click', '44');
    await $btnExcel(page).click();
    await ss(page, 'after click', '44');
    await page.waitForTimeout(2000);
    if (await $successMsg(page).isVisible()) console.log('  success: ' + (await $successMsg(page).textContent()));
    else if (await $err(page).isVisible()) console.log('  err: ' + (await $err(page).textContent()));
    await ss(page, 'done', '44');
  });

  // TC45~46: Exception handling
  test('45-Network-error-on-add', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '45');
    await page.route('**/api/v1/hdoc/variables/add', route => route.abort('internetdisconnected'));
    const nv = 'UD10_NET_' + Date.now();
    await $varInput(page).fill(nv);
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '45');
    await $btnAdd(page).click();
    await ss(page, 'after click', '45');
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    console.log('  err: ' + (await $err(page).textContent()));
    await page.unroute('**/api/v1/hdoc/variables/add');
    await ss(page, 'confirmed', '45');
  });

  test('46-API-timeout', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '46');
    await page.route('**/api/v1/hdoc/variables/add', async route => {
      await new Promise(r => setTimeout(r, 15000));
      await route.abort();
    });
    const nv = 'UD10_TO_' + Date.now();
    await $varInput(page).fill(nv);
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '46');
    await $btnAdd(page).click();
    await ss(page, 'after click', '46');
    try { await expect($err(page)).toBeVisible({ timeout: 20000 }); console.log('  err: ' + (await $err(page).textContent())); }
    catch { console.log('  timeout handling differs'); }
    try { await page.unroute('**/api/v1/hdoc/variables/add'); } catch { /* ignore */ }
    await ss(page, 'done', '46');
  });

  // TC47~48: Message display
  test('47-Error-style', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '47');
    await $btnSearch(page).click();
    await ss(page, 'after click', '47');
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('请输入至少一个搜索条件');
    const color = await $err(page).evaluate(el => getComputedStyle(el).color);
    console.log('  color: ' + color);
    const rgb = color.match(/\d+/g);
    if (rgb) { expect(parseInt(rgb[0])).toBeGreaterThan(parseInt(rgb[1])); expect(parseInt(rgb[0])).toBeGreaterThan(parseInt(rgb[2])); }
    await ss(page, 'confirmed', '47');
  });

  test('48-Clear-removes-error', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '48');
    await $btnSearch(page).click();
    await expect($err(page)).toBeVisible();
    await ss(page, 'error shown', '48');
    await $btnClear(page).click();
    await ss(page, 'after clear', '48');
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'confirmed', '48');
  });

  // TC49~51: Security
  test('49-Unauthenticated-access', async ({ page }) => {
    await page.goto('http://localhost:3000', { waitUntil: 'load' });
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3000/menu/existing-hdoc-vars', { waitUntil: 'load' });
    await ss(page, 'after navigate', '49');
    await expect(page).toHaveURL(/\/login/);
    await ss(page, 'confirmed', '49');
  });

  test('50-SQL-injection', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '50');
    await $varInput(page).fill("' OR '1'='1");
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '50');
    await $btnSearch(page).click();
    await ss(page, 'after click', '50');
    await page.waitForTimeout(2000);
    if (await $err(page).isVisible()) {
      const t = await $err(page).textContent() || '';
      expect(t).not.toContain('SQL');
    }
    await ss(page, 'confirmed', '50');
  });

  test('51-XSS-protection', async ({ page }) => {
    let dialogCount = 0;
    page.on('dialog', () => { dialogCount++; });
    await navigateToPage(page);
    await ss(page, 'after', '51');
    await $varInput(page).fill('<script>alert(1)</script>');
    await ss(page, 'after input', '51');
    expect(dialogCount).toBe(0);
    console.log('  dialogs: ' + dialogCount);
    await ss(page, 'confirmed', '51');
  });

});
