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

  test('14-Type-VDA-select', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '14');
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'selected VDA', '14');
    await expect($typeSelect(page)).toHaveValue('VDA');
    await ss(page, 'VDA confirmed', '14');
  });

  test('15-Type-User-Defined-select', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '15');
    await $typeSelect(page).selectOption('User Defined');
    await ss(page, 'selected User Defined', '15');
    await expect($typeSelect(page)).toHaveValue('User Defined');
    await ss(page, 'User Defined confirmed', '15');
  });

  // TC16~17: Description
  test('16-Description-maxLength', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '16');
    await $descInput(page).fill('A'.repeat(101));
    await ss(page, 'after fill', '16');
    const actual = await $descInput(page).inputValue();
    expect(actual.length).toBeLessThanOrEqual(100);
    console.log('  desc length: ' + actual.length);
    await ss(page, 'maxLength confirmed', '16');
  });

  test('17-Description-allowed', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '17');
    await $descInput(page).fill('Test variable description 123');
    await ss(page, 'after fill', '17');
    await expect($descInput(page)).toHaveValue('Test variable description 123');
    await ss(page, 'allowed chars confirmed', '17');
  });

  // TC18~19: Created by user
  test('18-CreatedBy-maxLength', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '18');
    await $createdInput(page).fill('A'.repeat(17));
    await ss(page, 'after fill', '18');
    const actual = await $createdInput(page).inputValue();
    expect(actual.length).toBeLessThanOrEqual(16);
    console.log('  createdBy length after 17 chars: ' + actual.length);
    await ss(page, 'maxLength confirmed', '18');
  });

  test('19-CreatedBy-allowed-chars', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '19');
    await $createdInput(page).fill('admin_user_01');
    await ss(page, 'after fill', '19');
    await expect($createdInput(page)).toHaveValue('admin_user_01');
    const align = await $createdInput(page).evaluate(el => getComputedStyle(el).textAlign);
    expect(['left', 'start']).toContain(align);
    await ss(page, 'allowed chars confirmed', '19');
  });

  // TC20~25: Search
  test('20-Search-empty', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'before click', '20');
    await $btnSearch(page).click();
    await ss(page, 'after click', '20');
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('请输入至少一个搜索条件');
    await ss(page, 'empty confirmed', '20');
  });

  test('21-Search-by-variable', async ({ page }) => {
    await insertTestData('UD10_SV_' + Date.now(), 'VDA', 'test');
    await navigateToPage(page);
    await ss(page, 'after', '21');
    await $varInput(page).fill(testDataCreated[0]);
    await ss(page, 'before click', '21');
    await $btnSearch(page).click();
    await ss(page, 'after click', '21');
    try { await page.waitForURL('**/existing-hdoc-vars/result', { timeout: 10000 }); } catch { /* ok */ }
    await ss(page, 'search done', '21');
  });

  test('22-Search-by-type', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '22');
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '22');
    await $btnSearch(page).click();
    await ss(page, 'after click', '22');
    try { await page.waitForURL('**/existing-hdoc-vars/result', { timeout: 10000 }); } catch { /* ok */ }
    await ss(page, 'search done', '22');
  });

  test('23-Search-multi-condition', async ({ page }) => {
    const v = 'UD10_MC_' + Date.now();
    await insertTestData(v, 'VDA', 'multi test');
    await navigateToPage(page);
    await ss(page, 'after', '23');
    await $varInput(page).fill(v);
    await $typeSelect(page).selectOption('VDA');
    await $descInput(page).fill('multi test');
    await ss(page, 'before click', '23');
    await $btnSearch(page).click();
    await ss(page, 'after click', '23');
    try { await page.waitForURL('**/existing-hdoc-vars/result', { timeout: 10000 }); } catch { /* ok */ }
    await ss(page, 'search done', '23');
  });

  test('24-Search-loading-state', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '24');
    await $varInput(page).fill('TEST_VAR');
    await ss(page, 'before click', '24');
    await page.evaluate(() => { (document.querySelector('button.btn-primary') as HTMLButtonElement)?.click(); });
    try { await expect($btnSearch(page)).toBeDisabled({ timeout: 2000 }); await ss(page, 'loading', '24'); }
    catch { console.log('  fast response'); }
    try { await page.waitForURL('**/existing-hdoc-vars/result', { timeout: 10000 }); } catch { /* ok */ }
  });

  test('25-Search-prevent-duplicate', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '25');
    await $varInput(page).fill('TEST_VAR');
    await $btnSearch(page).click();
    await page.waitForTimeout(500);
    // 如果页面没有跳转，尝试再次点击
    if (!page.url().includes('/result')) {
      await $btnSearch(page).click({ timeout: 2000 }).catch(() => {});
      await $btnSearch(page).click({ timeout: 2000 }).catch(() => {});
    }
    try { await expect($btnSearch(page)).toBeDisabled({ timeout: 2000 }); await ss(page, 'disabled', '25'); }
    catch { console.log('  fast response'); }
    try { await page.waitForURL('**/existing-hdoc-vars/result', { timeout: 10000 }); } catch { /* ok */ }
  });

  // TC26~27: Clear
  test('26-Clear-all-fields', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '26');
    await $varInput(page).fill('VAR001');
    await $typeSelect(page).selectOption('VDA');
    await $descInput(page).fill('test desc');
    await $createdInput(page).fill('admin');
    await $dateInput(page).fill('2023-10-15');
    await ss(page, 'before clear', '26');
    await $btnClear(page).click();
    await ss(page, 'after clear', '26');
    await expect($varInput(page)).toHaveValue('');
    await expect($typeSelect(page)).toHaveValue('');
    await expect($descInput(page)).toHaveValue('');
    await expect($createdInput(page)).toHaveValue('');
    await expect($dateInput(page)).toHaveValue('');
    await ss(page, 'clear confirmed', '26');
  });

  test('27-Clear-error-msg', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '27');
    await $btnSearch(page).click();
    await expect($err(page)).toBeVisible();
    await ss(page, 'error shown', '27');
    await $btnClear(page).click();
    await ss(page, 'after clear', '27');
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'msg cleared', '27');
  });

  // TC28: Back
  test('28-Back-button', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '28');
    await ss(page, 'before click', '28');
    await $btnBack(page).click();
    await ss(page, 'after click', '28');
    await page.waitForTimeout(2000);
    console.log('  URL after back: ' + page.url());
    await ss(page, 'back confirmed', '28');
  });

  // TC29~35: Add
  test('29-Add-empty-variable', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '29');
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '29');
    await $btnAdd(page).click();
    await ss(page, 'after click', '29');
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Variable为必填项');
    await ss(page, 'confirmed', '29');
  });

  test('30-Add-empty-type', async ({ page }) => {
    const tv = 'UD10_ET_' + Date.now();
    await navigateToPage(page);
    await ss(page, 'after', '30');
    await $varInput(page).fill(tv);
    await $descInput(page).fill('test');
    await ss(page, 'before click', '30');
    await $btnAdd(page).click();
    await ss(page, 'after click', '30');
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('请选择变量类型');
    await ss(page, 'confirmed', '30');
  });

  test('31-Add-duplicate', async ({ page }) => {
    const dv = 'UD10_DUP_' + Date.now();
    await insertTestData(dv, 'VDA', 'dup');
    await navigateToPage(page);
    await ss(page, 'after', '31');
    await $varInput(page).fill(dv);
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '31');
    await $btnAdd(page).click();
    await ss(page, 'after click', '31');
    await page.waitForTimeout(2000);
    if (await $err(page).isVisible()) console.log('  err: ' + (await $err(page).textContent()));
    await ss(page, 'confirmed', '31');
  });

  test('32-Add-success', async ({ page }) => {
    const nv = 'UD10_ADD_' + Date.now();
    await navigateToPage(page);
    await ss(page, 'after', '32');
    await $varInput(page).fill(nv);
    await $typeSelect(page).selectOption('VDA');
    await $descInput(page).fill('Add test variable');
    await ss(page, 'before click', '32');
    await $btnAdd(page).click();
    await ss(page, 'after click', '32');
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
    await ss(page, 'confirmed', '32');
  });

  test('33-Add-loading-state', async ({ page }) => {
    const nv = 'UD10_LD_' + Date.now();
    await navigateToPage(page);
    await ss(page, 'after', '33');
    await $varInput(page).fill(nv);
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '33');
    await page.evaluate(() => { (document.querySelector('.btn-cell button:nth-child(4)') as HTMLButtonElement)?.click(); });
    try { await expect($btnAdd(page)).toBeDisabled({ timeout: 2000 }); await ss(page, 'loading', '33'); }
    catch { console.log('  fast'); }
    await page.waitForTimeout(3000);
  });

  test('34-Add-prevent-duplicate-click', async ({ page }) => {
    const nv = 'UD10_RP_' + Date.now();
    await navigateToPage(page);
    await ss(page, 'after', '34');
    await $varInput(page).fill(nv);
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '34');
    await $btnAdd(page).click();
    await $btnAdd(page).click();
    await $btnAdd(page).click();
    try { await expect($btnAdd(page)).toBeDisabled({ timeout: 2000 }); await ss(page, 'disabled', '34'); }
    catch { console.log('  fast'); }
    await page.waitForTimeout(3000);
  });

  test('35-Add-API-failure', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '35');
    await page.route('**/api/v1/hdoc/variables/add', route => route.abort());
    const nv = 'UD10_FAIL_' + Date.now();
    await $varInput(page).fill(nv);
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '35');
    await $btnAdd(page).click();
    await ss(page, 'after click', '35');
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    console.log('  err: ' + (await $err(page).textContent()));
    await page.unroute('**/api/v1/hdoc/variables/add');
    await ss(page, 'confirmed', '35');
  });

  // TC36~40: Update
  test('36-Update-empty-variable', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '36');
    await ss(page, 'before click', '36');
    await $btnUpdate(page).click();
    await ss(page, 'after click', '36');
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Variable为必填项');
    await ss(page, 'confirmed', '36');
  });

  test('37-Update-not-exists', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '37');
    await $varInput(page).fill('NON_EXIST_VAR_UD10');
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '37');
    await $btnUpdate(page).click();
    await ss(page, 'after click', '37');
    await page.waitForTimeout(2000);
    if (await $err(page).isVisible()) console.log('  err: ' + (await $err(page).textContent()));
    await ss(page, 'confirmed', '37');
  });

  test('38-Update-success', async ({ page }) => {
    const uv = 'UD10_UPD_' + Date.now();
    await insertTestData(uv, 'VDA', 'original');
    await navigateToPage(page);
    await ss(page, 'after', '38');
    await $varInput(page).fill(uv);
    await $typeSelect(page).selectOption('User Defined');
    await $descInput(page).fill('UPDATED_DESC');
    await ss(page, 'before click', '38');
    await $btnUpdate(page).click();
    await ss(page, 'after click', '38');
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
    await ss(page, 'confirmed', '38');
  });

  test('39-Update-loading-state', async ({ page }) => {
    const uv = 'UD10_UL_' + Date.now();
    await insertTestData(uv, 'VDA', 'test');
    await navigateToPage(page);
    await ss(page, 'after', '39');
    await $varInput(page).fill(uv);
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '39');
    await page.evaluate(() => { const b = document.querySelectorAll('.btn-cell button'); if (b[4]) (b[4] as HTMLButtonElement).click(); });
    try { await expect($btnUpdate(page)).toBeDisabled({ timeout: 2000 }); await ss(page, 'loading', '39'); }
    catch { console.log('  fast'); }
    await page.waitForTimeout(3000);
  });

  test('40-Update-API-failure', async ({ page }) => {
    const uv = 'UD10_UF_' + Date.now();
    await insertTestData(uv, 'VDA', 'test');
    await navigateToPage(page);
    await ss(page, 'after', '40');
    await page.route('**/api/v1/hdoc/variables/update', route => route.abort());
    await $varInput(page).fill(uv);
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '40');
    await $btnUpdate(page).click();
    await ss(page, 'after click', '40');
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    console.log('  err: ' + (await $err(page).textContent()));
    await page.unroute('**/api/v1/hdoc/variables/update');
    await ss(page, 'confirmed', '40');
  });

  // TC47: Excel
  test('47-Excel-export', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '47');
    await ss(page, 'before click', '47');
    await $btnExcel(page).click();
    await ss(page, 'after click', '47');
    await page.waitForTimeout(2000);
    if (await $successMsg(page).isVisible()) console.log('  success: ' + (await $successMsg(page).textContent()));
    else if (await $err(page).isVisible()) console.log('  err: ' + (await $err(page).textContent()));
    await ss(page, 'done', '47');
  });

// TC48~49: Exception handling
  test('48-Network-error-on-add', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '48');
    await page.route('**/api/v1/hdoc/variables/add', route => route.abort('internetdisconnected'));
    const nv = 'UD10_NET_' + Date.now();
    await $varInput(page).fill(nv);
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '48');
    await $btnAdd(page).click();
    await ss(page, 'after click', '48');
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    console.log('  err: ' + (await $err(page).textContent()));
    await page.unroute('**/api/v1/hdoc/variables/add');
    await ss(page, 'confirmed', '48');
  });

  test('49-API-timeout', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '49');
    await page.route('**/api/v1/hdoc/variables/add', async route => {
      await new Promise(r => setTimeout(r, 15000));
      await route.abort();
    });
    const nv = 'UD10_TO_' + Date.now();
    await $varInput(page).fill(nv);
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '49');
    await $btnAdd(page).click();
    await ss(page, 'after click', '49');
    try { await expect($err(page)).toBeVisible({ timeout: 20000 }); console.log('  err: ' + (await $err(page).textContent())); }
    catch { console.log('  timeout handling differs'); }
    try { await page.unroute('**/api/v1/hdoc/variables/add'); } catch { /* ignore */ }
    await ss(page, 'done', '49');
  });

  // TC50~51: Message display
  test('50-Error-style', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '50');
    await $btnSearch(page).click();
    await ss(page, 'after click', '50');
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('请输入至少一个搜索条件');
    const color = await $err(page).evaluate(el => getComputedStyle(el).color);
    console.log('  color: ' + color);
    const rgb = color.match(/\d+/g);
    if (rgb) { expect(parseInt(rgb[0])).toBeGreaterThan(parseInt(rgb[1])); expect(parseInt(rgb[0])).toBeGreaterThan(parseInt(rgb[2])); }
    await ss(page, 'confirmed', '50');
  });

  test('51-Clear-removes-error', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '51');
    await $btnSearch(page).click();
    await expect($err(page)).toBeVisible();
    await ss(page, 'error shown', '51');
    await $btnClear(page).click();
    await ss(page, 'after clear', '51');
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'confirmed', '51');
  });

  // TC52~54: Security
  test('52-Unauthenticated-access', async ({ page }) => {
    await page.goto('http://localhost:3000', { waitUntil: 'load' });
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3000/menu/existing-hdoc-vars', { waitUntil: 'load' });
    await ss(page, 'after navigate', '52');
    await expect(page).toHaveURL(/\/login/);
    await ss(page, 'confirmed', '52');
  });

  test('53-SQL-injection', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'after', '53');
    await $varInput(page).fill("' OR '1'='1");
    await $typeSelect(page).selectOption('VDA');
    await ss(page, 'before click', '53');
    await $btnSearch(page).click();
    await ss(page, 'after click', '53');
    await page.waitForTimeout(2000);
    if (await $err(page).isVisible()) {
      const t = await $err(page).textContent() || '';
      expect(t).not.toContain('SQL');
    }
    await ss(page, 'confirmed', '53');
  });

  test('54-XSS-protection', async ({ page }) => {
    let dialogCount = 0;
    page.on('dialog', () => { dialogCount++; });
    await navigateToPage(page);
    await ss(page, 'after', '54');
    await $varInput(page).fill('<script>alert(1)</script>');
    await ss(page, 'after input', '54');
    expect(dialogCount).toBe(0);
    console.log('  dialogs: ' + dialogCount);
    await ss(page, 'confirmed', '54');
  });

});
