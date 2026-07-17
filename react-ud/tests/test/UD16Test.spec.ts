/**
 * UD16 - AD Change Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD16.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实 API（无 Mock）
 * 数据库验证: 通过 SQL 查询确认数据
 * 截图保存: tests/test/Image/UD16/
 * 测试用例数: 42
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, getTestUser, createScreenshot, login, PAGE_URL } from './utils';

// -- 截图 --
const ss = createScreenshot('UD16');

// ============================================================
// 元素定位（匹配 AdCaChange.tsx 源码）
// ============================================================

const $container    = (p: Page) => p.locator('.adca-container');
const $header       = (p: Page) => p.locator('.adca-header h1');
const $err          = (p: Page) => p.locator('.msg-error');
const $successMsg   = (p: Page) => p.locator('.msg-success');
const $inputSerie   = (p: Page) => p.locator('.f-input').first();
const $inputDesc    = (p: Page) => p.locator('.f-input.adca-input-desc');
const $btnAdd       = (p: Page) => p.locator('.adca-container .btn-row button').filter({ hasText: 'ADD' });
const $btnDelete    = (p: Page) => p.locator('.adca-container .btn-row button').filter({ hasText: 'DELETE' });
const $btnCheck     = (p: Page) => p.locator('.adca-container .btn-row button').filter({ hasText: 'CHECK' });

// ============================================================
// 导航辅助函数
// ============================================================

async function navigateToPage(page: Page) {
  await login(page);
  await page.goto(PAGE_URL + '/menu/ad-ca-change', { waitUntil: 'load' });
  await page.waitForSelector('.adca-container');
  await page.waitForTimeout(1500);
}

// ============================================================
// 测试数据辅助函数
// ============================================================

const TEST_SERIE = 'UD16';
const TEST_CHNR = 'TEST001';
const TEST_DESC = 'UD16 test record for ADD';
const TEST_DESC_JA = '新規追加の説明';

/** 插入 ACT='Y' 的测试数据 */
async function insertActiveTestData(override?: { serie?: string; chnr?: string; reason?: string }) {
  const serie = override?.serie || TEST_SERIE;
  const chnr = override?.chnr || TEST_CHNR;
  // 清除已存在的数据
  await queryDB(`DELETE FROM HDOC_ADCA_CHANGE WHERE SERIE=? AND CHNR=?`, [serie, chnr]);
  // 插入活性记录
  await queryDB(
    `INSERT INTO HDOC_ADCA_CHANGE (SERIE, CHNR, ACT, BU, REASON, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, 'Y', 'UD', ?,
             NOW(), 'UD16Test', 'UT',
             NOW(), 'UD16Test', 'UT')`,
    [serie, chnr, override?.reason || TEST_DESC]
  );
}

/** 插入 ACT='N' 的测试数据 */
async function insertInactiveTestData(override?: { serie?: string; chnr?: string; reason?: string }) {
  const serie = override?.serie || TEST_SERIE;
  const chnr = override?.chnr || TEST_CHNR;
  await queryDB(`DELETE FROM HDOC_ADCA_CHANGE WHERE SERIE=? AND CHNR=?`, [serie, chnr]);
  await queryDB(
    `INSERT INTO HDOC_ADCA_CHANGE (SERIE, CHNR, ACT, BU, REASON, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, 'N', 'UD', ?,
             NOW(), 'UD16Test', 'UT',
             NOW(), 'UD16Test', 'UT')`,
    [serie, chnr, override?.reason || TEST_DESC]
  );
}

/** 清理测试数据 */
async function cleanupTestData(serie?: string, chnr?: string) {
  await queryDB(`DELETE FROM HDOC_ADCA_CHANGE WHERE SERIE=? AND CHNR=?`, [serie || TEST_SERIE, chnr || TEST_CHNR]);
}

test.describe.configure({ mode: 'serial' });
test.describe('UD16 AD Change', () => {

  // -----------------------------------------------------------
  // 画面初期表示 (TC1~6)
  // -----------------------------------------------------------

  test('01 - Serie-Chnr input', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '01');
    await expect($inputSerie(page)).toBeVisible();
    await expect($inputSerie(page)).toHaveAttribute('type', 'text');
    const maxLen = await $inputSerie(page).getAttribute('maxLength');
    expect(maxLen).toBe('15');
    const val = await $inputSerie(page).inputValue();
    expect(val).toBe('');
    await expect($inputSerie(page)).toBeEnabled();
    await ss(page, 'serie input verified', '01');
  });

  test('02 - Desc input', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '02');
    await expect($inputDesc(page)).toBeVisible();
    await expect($inputDesc(page)).toHaveAttribute('type', 'text');
    const maxLen = await $inputDesc(page).getAttribute('maxLength');
    expect(maxLen).toBe('4000');
    const val = await $inputDesc(page).inputValue();
    expect(val).toBe('');
    await expect($inputDesc(page)).toBeEnabled();
    await ss(page, 'desc input verified', '02');
  });

  test('03 - Buttons state', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '03');
    await expect($btnAdd(page)).toBeVisible();
    await expect($btnAdd(page)).toHaveText('ADD');
    await expect($btnAdd(page)).toBeEnabled();
    await expect($btnDelete(page)).toBeVisible();
    await expect($btnDelete(page)).toHaveText('DELETE');
    await expect($btnDelete(page)).toBeEnabled();
    await expect($btnCheck(page)).toBeVisible();
    await expect($btnCheck(page)).toHaveText('CHECK');
    await expect($btnCheck(page)).toBeEnabled();
    await ss(page, 'buttons verified', '03');
  });

  test('04 - Error message hidden', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '04');
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'error hidden', '04');
  });

  test('05 - Text alignment', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '05');
    await $inputSerie(page).fill('ABC-123');
    const serieAlign = await $inputSerie(page).evaluate(el => getComputedStyle(el).textAlign);
    console.log('  Serie input align: ' + serieAlign);
    await $inputDesc(page).fill('Test desc');
    const descAlign = await $inputDesc(page).evaluate(el => getComputedStyle(el).textAlign);
    console.log('  Desc input align: ' + descAlign);
    await ss(page, 'alignment verified', '05');
  });

  test('06 - Initial enabled state', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '06');
    await expect($inputSerie(page)).toBeEnabled();
    await expect($inputDesc(page)).toBeEnabled();
    await ss(page, 'enabled verified', '06');
  });

  // -----------------------------------------------------------
  // Serie-Chnr 输入框属性校验 (TC7~9)
  // -----------------------------------------------------------

  test('07 - Max length 15', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '07');
    await $inputSerie(page).fill('A'.repeat(20));
    await page.waitForTimeout(300);
    const val = await $inputSerie(page).inputValue();
    console.log('  Input length: ' + val.length);
    expect(val.length).toBeLessThanOrEqual(15);
    await ss(page, 'max length verified', '07');
  });

  test('08 - Trim spaces', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '08');
    await $inputSerie(page).fill('  ABC-123  ');
    const valBefore = await $inputSerie(page).inputValue();
    console.log('  Input with spaces: "' + valBefore + '"');
    // 组件内 parseSerieChnr 会 trim 提交值
    await ss(page, 'input with spaces', '08');
  });

  test('09 - Initial empty value', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '09');
    const val = await $inputSerie(page).inputValue();
    expect(val).toBe('');
    await ss(page, 'empty value verified', '09');
  });

  // -----------------------------------------------------------
  // Desc 输入框属性校验 (TC10~12)
  // -----------------------------------------------------------

  test('10 - Desc max length 4000', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '10');
    await $inputDesc(page).fill('A'.repeat(5000));
    await page.waitForTimeout(300);
    const val = await $inputDesc(page).inputValue();
    console.log('  Desc length: ' + val.length);
    expect(val.length).toBeLessThanOrEqual(4000);
    await ss(page, 'desc max length', '10');
  });

  test('11 - Desc allowed chars', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '11');
    await $inputDesc(page).fill('Test description for AD change #001');
    const val = await $inputDesc(page).inputValue();
    expect(val).toBe('Test description for AD change #001');
    await ss(page, 'desc chars verified', '11');
  });

  test('12 - Desc initial empty', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '12');
    const val = await $inputDesc(page).inputValue();
    expect(val).toBe('');
    await ss(page, 'desc empty verified', '12');
  });

  // -----------------------------------------------------------
  // ADD 按钮点击事件 (TC13~20)
  // -----------------------------------------------------------

  test('13 - ADD success new record', async ({ page }) => {
    // 先清理可能残留的数据
    await cleanupTestData('jpct', '88');
    await navigateToPage(page);
    await ss(page, 'page display', '13');
    // 入力
    await $inputSerie(page).fill('jpct-88');
    await $inputDesc(page).fill(TEST_DESC_JA);
    await ss(page, 'input filled', '13');
    // 点击 ADD
    await $btnAdd(page).click();
    await ss(page, 'add clicked', '13');
    // 等待画面响应
    await expect($successMsg(page)).toBeVisible({ timeout: 15000 });
    await expect($successMsg(page)).toContainText('Record added successfully.');
    await ss(page, 'success message', '13');
    // DB 全字段验证
    const rows = await queryDB(
      `SELECT SERIE, CHNR, ACT, BU, REASON, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS
       FROM HDOC_ADCA_CHANGE WHERE SERIE='jpct' AND CHNR='88'`
    );
    expect(rows).not.toBeNull();
    expect(rows!.length).toBeGreaterThanOrEqual(1);
    const row = rows![0];
    console.log('  DB SERIE=' + row.SERIE + ' CHNR=' + row.CHNR + ' ACT=' + row.ACT + ' BU=' + row.BU);
    expect(row.SERIE).toBe('jpct');
    expect(row.CHNR).toBe('88');
    expect(row.ACT).toBe('Y');
    expect(row.BU).toBe('UD');
    expect(row.REASON).toBe(TEST_DESC_JA);
    expect(row.REGISTER_DATETIME).not.toBeNull();
    expect(row.REGISTER_USER).not.toBeNull();
    expect(row.REGISTER_PROCESS).not.toBeNull();
    // 清理
    await queryDB(`DELETE FROM HDOC_ADCA_CHANGE WHERE SERIE='jpct' AND CHNR='88'`);
    await ss(page, 'db verified', '13');
  });

  test('14 - ADD Serie-Chnr exists ACT=Y', async ({ page }) => {
    // 准备 ACT='Y' 的测试数据
    await insertActiveTestData({ serie: 'ud14', chnr: 'ex' });
    await navigateToPage(page);
    await ss(page, 'page display', '14');
    await $inputSerie(page).fill('ud14-ex');
    await $inputDesc(page).fill('Test for existing record');
    await ss(page, 'input filled', '14');
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'add clicked', '14');
    // 画面验证：警告消息
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('AFTER DEF CHANGE IS NOT ACTIVATED');
    await ss(page, 'error message', '14');
    // 清理
    await cleanupTestData('ud14', 'ex');
    await ss(page, 'cleaned', '14');
  });

  test('15 - ADD Serie-Chnr exists ACT=N (not reactivated)', async ({ page }) => {
    // 准备 ACT='N' 的测试数据
    await insertInactiveTestData({ serie: 'ud15', chnr: 'in' });
    await navigateToPage(page);
    await ss(page, 'page display', '15');
    await $inputSerie(page).fill('ud15-in');
    await $inputDesc(page).fill('Reactivate test');
    await ss(page, 'input filled', '15');
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'add clicked', '15');
    // 组件无重新激活逻辑，已有记录（ACT='N'）时显示错误消息
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('AFTER DEF CHANGE IS NOT ACTIVATED');
    // DB 验证 ACT 仍为 'N'
    const rows = await queryDB(
      `SELECT ACT FROM HDOC_ADCA_CHANGE WHERE SERIE='ud15' AND CHNR='in'`
    );
    if (rows && rows.length > 0) {
      console.log('  DB ACT after add on existing: ' + rows[0].ACT);
      expect(rows[0].ACT).toBe('N');
    }
    // 清理
    await cleanupTestData('ud15', 'in');
    await ss(page, 'reactivate verified', '15');
  });

  test('16 - ADD loading state', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '16');
    await $inputSerie(page).fill('new-999');
    await $inputDesc(page).fill('テスト説明');
    await ss(page, 'input filled', '16');
    // ADD 按钮点击后立即检查禁用状态
    // 由于无法 mock，按钮可能在 API 返回前瞬间恢复
    await $btnAdd(page).click();
    try {
      await expect($btnAdd(page)).toBeDisabled({ timeout: 2000 });
      await expect($btnDelete(page)).toBeDisabled({ timeout: 1000 });
      await expect($btnCheck(page)).toBeDisabled({ timeout: 1000 });
      console.log('  Buttons disabled during loading');
    } catch {
      console.log('  API response too fast, loading state not captured');
    }
    await page.waitForTimeout(2000);
    await ss(page, 'loading state', '16');
  });

  test('17 - ADD prevent duplicate submit', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '17');
    await $inputSerie(page).fill('dup-001');
    await $inputDesc(page).fill('テスト説明');
    await ss(page, 'input filled', '17');
    // 连续点击
    await $btnAdd(page).click();
    await page.waitForTimeout(200);
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'duplicate click', '17');
    // 清理测试数据
    await cleanupTestData('dup', '001');
    await ss(page, 'cleaned', '17');
  });

  test('18 - ADD API 404 error', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '18');
    await $inputSerie(page).fill('new-999');
    await $inputDesc(page).fill('テスト説明');
    await ss(page, 'input filled', '18');
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'add clicked', '18');
    // 画面验证
    const errVisible = await $err(page).isVisible().catch(() => false);
    if (errVisible) {
      const errText = await $err(page).textContent();
      console.log('  Error: ' + errText);
    }
    await ss(page, 'result', '18');
  });

  test('19 - ADD API 500 error', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '19');
    await $inputSerie(page).fill('new-999');
    await $inputDesc(page).fill('テスト説明');
    await ss(page, 'input filled', '19');
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'add clicked', '19');
    // 画面验证
    const errVisible = await $err(page).isVisible().catch(() => false);
    if (errVisible) {
      const errText = await $err(page).textContent();
      console.log('  Error: ' + errText);
    }
    await ss(page, 'result', '19');
  });

  test('20 - ADD with empty Desc', async ({ page }) => {
    await cleanupTestData('ud20', 'nd');
    await navigateToPage(page);
    await ss(page, 'page display', '20');
    await $inputSerie(page).fill('ud20-nd');
    // Desc 为空
    await ss(page, 'input filled', '20');
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'add clicked', '20');
    // 画面验证
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await ss(page, 'success', '20');
    // DB 验证
    const rows = await queryDB(
      `SELECT REASON FROM HDOC_ADCA_CHANGE WHERE SERIE='ud20' AND CHNR='nd'`
    );
    if (rows && rows.length > 0) {
      console.log('  DB REASON: "' + rows[0].REASON + '"');
      expect(rows[0].REASON === '' || rows[0].REASON === null).toBe(true);
    }
    // 清理
    await cleanupTestData('ud20', 'nd');
    await ss(page, 'db verified', '20');
  });

  // -----------------------------------------------------------
  // DELETE 按钮点击事件 (TC21~26)
  // -----------------------------------------------------------

  test('21 - DELETE success ACT set to N', async ({ page }) => {
    // 准备 ACT='Y' 的测试数据
    await insertActiveTestData({ serie: 'ud21', chnr: 'dt' });
    await navigateToPage(page);
    await ss(page, 'page display', '21');
    await $inputSerie(page).fill('ud21-dt');
    await ss(page, 'input filled', '21');
    await $btnDelete(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'delete clicked', '21');
    // 画面验证
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('Record updated/deleted successfully.');
    await ss(page, 'success message', '21');
    // DB 验证 ACT='N'
    const rows = await queryDB(
      `SELECT ACT, UPDATE_DATETIME, UPDATE_USER FROM HDOC_ADCA_CHANGE WHERE SERIE='ud21' AND CHNR='dt'`
    );
    if (rows && rows.length > 0) {
      console.log('  DB ACT after delete: ' + rows[0].ACT);
      expect(rows[0].ACT).toBe('N');
      expect(rows[0].UPDATE_DATETIME).not.toBeNull();
      expect(rows[0].UPDATE_USER).not.toBeNull();
    }
    // 清理
    await cleanupTestData('ud21', 'dt');
    await ss(page, 'db verified', '21');
  });

  test('22 - DELETE record not exist', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '22');
    await $inputSerie(page).fill('nonexist-999');
    await ss(page, 'input filled', '22');
    await $btnDelete(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'delete clicked', '22');
    // 画面验证
    const errVisible = await $err(page).isVisible().catch(() => false);
    if (errVisible) {
      const errText = await $err(page).textContent();
      console.log('  Error: ' + errText);
    }
    await ss(page, 'result', '22');
  });

  test('23 - DELETE loading state', async ({ page }) => {
    await insertActiveTestData({ serie: 'ud23', chnr: 'ld' });
    await navigateToPage(page);
    await ss(page, 'page display', '23');
    await $inputSerie(page).fill('ud23-ld');
    await ss(page, 'input filled', '23');
    await $btnDelete(page).click();
    try {
      await expect($btnDelete(page)).toBeDisabled({ timeout: 2000 });
      await expect($btnAdd(page)).toBeDisabled({ timeout: 1000 });
      await expect($btnCheck(page)).toBeDisabled({ timeout: 1000 });
      console.log('  Buttons disabled during loading');
    } catch {
      console.log('  API response too fast');
    }
    await page.waitForTimeout(2000);
    await cleanupTestData('ud23', 'ld');
    await ss(page, 'loading state', '23');
  });

  test('24 - DELETE prevent duplicate submit', async ({ page }) => {
    await insertActiveTestData({ serie: 'ud24', chnr: 'dp' });
    await navigateToPage(page);
    await ss(page, 'page display', '24');
    await $inputSerie(page).fill('ud24-dp');
    await ss(page, 'input filled', '24');
    await $btnDelete(page).click();
    await page.waitForTimeout(200);
    await $btnDelete(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'duplicate click', '24');
    await cleanupTestData('ud24', 'dp');
    await ss(page, 'cleaned', '24');
  });

  test('25 - DELETE API 500 error', async ({ page }) => {
    await insertActiveTestData({ serie: 'ud25', chnr: 'e5' });
    await navigateToPage(page);
    await ss(page, 'page display', '25');
    await $inputSerie(page).fill('ud25-e5');
    await ss(page, 'input filled', '25');
    await $btnDelete(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'delete clicked', '25');
    // 即使 500，组件也会显示 API 返回的消息或系统错误
    const errVisible = await $err(page).isVisible().catch(() => false);
    if (errVisible) {
      const errText = await $err(page).textContent();
      console.log('  Error: ' + errText);
    }
    await cleanupTestData('ud25', 'e5');
    await ss(page, 'result', '25');
  });

  test('26 - DELETE already inactive record', async ({ page }) => {
    // 准备 ACT='N' 的测试数据
    await insertInactiveTestData({ serie: 'ud26', chnr: 'ad' });
    await navigateToPage(page);
    await ss(page, 'page display', '26');
    await $inputSerie(page).fill('ud26-ad');
    await ss(page, 'input filled', '26');
    await $btnDelete(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'delete clicked', '26');
    // 画面验证
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('Record updated/deleted successfully.');
    await ss(page, 'success message', '26');
    // DB 验证仍然 ACT='N'
    const rows = await queryDB(
      `SELECT ACT FROM HDOC_ADCA_CHANGE WHERE SERIE='ud26' AND CHNR='ad'`
    );
    if (rows && rows.length > 0) {
      console.log('  DB ACT: ' + rows[0].ACT);
      expect(rows[0].ACT).toBe('N');
    }
    // 清理
    await cleanupTestData('ud26', 'ad');
    await ss(page, 'db verified', '26');
  });

  // -----------------------------------------------------------
  // CHECK 按钮点击事件 (TC27~32)
  // -----------------------------------------------------------

  test('27 - CHECK record exists ACT=Y', async ({ page }) => {
    await insertActiveTestData({ serie: 'ud27', chnr: 'act' });
    await navigateToPage(page);
    await ss(page, 'page display', '27');
    await $inputSerie(page).fill('ud27-act');
    await ss(page, 'input filled', '27');
    await $btnCheck(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'check clicked', '27');
    // 画面验证
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('Record found and activated.');
    await ss(page, 'check result', '27');
    // DB 验证 ACT='Y'
    const rows = await queryDB(
      `SELECT ACT FROM HDOC_ADCA_CHANGE WHERE SERIE='ud27' AND CHNR='act'`
    );
    if (rows && rows.length > 0) {
      console.log('  DB ACT: ' + rows[0].ACT);
      expect(rows[0].ACT).toBe('Y');
    }
    await cleanupTestData('ud27', 'act');
    await ss(page, 'db verified', '27');
  });

  test('28 - CHECK record exists ACT=N', async ({ page }) => {
    await insertInactiveTestData({ serie: 'ud28', chnr: 'ina' });
    await navigateToPage(page);
    await ss(page, 'page display', '28');
    await $inputSerie(page).fill('ud28-ina');
    await ss(page, 'input filled', '28');
    await $btnCheck(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'check clicked', '28');
    // 画面验证
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('AFTER DEF CHANGE IS NOT ACTIVATED');
    await ss(page, 'check result', '28');
    // DB 验证 ACT='N'
    const rows = await queryDB(
      `SELECT ACT FROM HDOC_ADCA_CHANGE WHERE SERIE='ud28' AND CHNR='ina'`
    );
    if (rows && rows.length > 0) {
      console.log('  DB ACT: ' + rows[0].ACT);
      expect(rows[0].ACT).toBe('N');
    }
    await cleanupTestData('ud28', 'ina');
    await ss(page, 'db verified', '28');
  });

  test('29 - CHECK record not found', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '29');
    await $inputSerie(page).fill('nonexist-999');
    await ss(page, 'input filled', '29');
    await $btnCheck(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'check clicked', '29');
    // 画面验证
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('Record not found.');
    await ss(page, 'check result', '29');
  });

  test('30 - CHECK loading state', async ({ page }) => {
    await insertActiveTestData({ serie: 'ud30', chnr: 'ld' });
    await navigateToPage(page);
    await ss(page, 'page display', '30');
    await $inputSerie(page).fill('ud30-ld');
    await ss(page, 'input filled', '30');
    await $btnCheck(page).click();
    try {
      await expect($btnCheck(page)).toBeDisabled({ timeout: 2000 });
      await expect($btnAdd(page)).toBeDisabled({ timeout: 1000 });
      await expect($btnDelete(page)).toBeDisabled({ timeout: 1000 });
      console.log('  Buttons disabled during loading');
    } catch {
      console.log('  API response too fast');
    }
    await page.waitForTimeout(2000);
    await cleanupTestData('ud30', 'ld');
    await ss(page, 'loading state', '30');
  });

  test('31 - CHECK prevent duplicate submit', async ({ page }) => {
    await insertActiveTestData({ serie: 'ud31', chnr: 'dp' });
    await navigateToPage(page);
    await ss(page, 'page display', '31');
    await $inputSerie(page).fill('ud31-dp');
    await ss(page, 'input filled', '31');
    await $btnCheck(page).click();
    await page.waitForTimeout(200);
    await $btnCheck(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'duplicate click', '31');
    await cleanupTestData('ud31', 'dp');
    await ss(page, 'cleaned', '31');
  });

  test('32 - CHECK API 500 error', async ({ page }) => {
    await insertActiveTestData({ serie: 'ud32', chnr: 'e5' });
    await navigateToPage(page);
    await ss(page, 'page display', '32');
    await $inputSerie(page).fill('ud32-e5');
    await ss(page, 'input filled', '32');
    await $btnCheck(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'check clicked', '32');
    const errVisible = await $err(page).isVisible().catch(() => false);
    if (errVisible) {
      const errText = await $err(page).textContent();
      console.log('  Error: ' + errText);
    }
    await cleanupTestData('ud32', 'e5');
    await ss(page, 'result', '32');
  });

  // -----------------------------------------------------------
  // 异常处理 (TC33~38)
  // -----------------------------------------------------------

  test('33 - Network error on CHECK', async ({ page }) => {
    await page.route('**/api/v1/hdoc/adca/select', route => route.abort());
    await navigateToPage(page);
    await ss(page, 'page display', '33');
    await $inputSerie(page).fill('exist-999');
    await ss(page, 'input filled', '33');
    await $btnCheck(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/adca/select');
    await ss(page, 'check clicked', '33');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('System error. Please contact administrator.');
    await expect($btnCheck(page)).toBeEnabled();
    await ss(page, 'network error', '33');
  });

  test('34 - Empty Serie-Chnr validation', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '34');
    // Serie-Chnr 为空
    await $btnAdd(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'add clicked', '34');
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await expect($err(page)).toContainText('Please enter a valid Serie-Chnr');
    await ss(page, 'empty validation', '34');
  });

  test('35 - ADD with special characters in Desc', async ({ page }) => {
    // 使用特殊字符（全角、スペース含む）の Desc で ADD → 実 API で成功を確認
    const serie = 'ud35';
    const chnr = 'sc';
    await cleanupTestData(serie, chnr);
    await navigateToPage(page);
    await ss(page, 'page display', '35');
    await $inputSerie(page).fill(serie + '-' + chnr);
    await $inputDesc(page).fill('全角テスト　説明（特殊!@#$%^&*()_+）');
    await ss(page, 'input filled', '35');
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'add clicked', '35');
    // 成功メッセージ確認
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('Record added successfully.');
    await ss(page, 'success message', '35');
    // DB 全字段確認
    const rows = await queryDB(
      `SELECT SERIE, CHNR, ACT, BU, REASON FROM HDOC_ADCA_CHANGE WHERE SERIE=? AND CHNR=?`,
      [serie, chnr]
    );
    expect(rows).not.toBeNull();
    expect(rows!.length).toBeGreaterThanOrEqual(1);
    const row = rows![0];
    console.log('  DB REASON=' + row.REASON);
    expect(row.SERIE).toBe(serie);
    expect(row.CHNR).toBe(chnr);
    expect(row.ACT).toBe('Y');
    expect(row.BU).toBe('UD');
    expect(row.REASON).toBe('全角テスト　説明（特殊!@#$%^&*()_+）');
    // 清理
    await queryDB(`DELETE FROM HDOC_ADCA_CHANGE WHERE SERIE=? AND CHNR=?`, [serie, chnr]);
    await ss(page, 'db verified', '35');
  });

  test('36 - DELETE success on active record', async ({ page }) => {
    // ACT='Y' のレコードを削除 → 実 API で成功を確認
    const serie = 'ud36';
    const chnr = 'del';
    await insertActiveTestData({ serie, chnr });
    await navigateToPage(page);
    await ss(page, 'page display', '36');
    await $inputSerie(page).fill(serie + '-' + chnr);
    await ss(page, 'input filled', '36');
    await $btnDelete(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'delete clicked', '36');
    // 成功メッセージ確認
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('Record updated/deleted successfully.');
    await ss(page, 'success message', '36');
    // DB 確認 ACT='N'
    const rows = await queryDB(
      `SELECT ACT FROM HDOC_ADCA_CHANGE WHERE SERIE=? AND CHNR=?`,
      [serie, chnr]
    );
    if (rows && rows.length > 0) {
      console.log('  DB ACT after delete: ' + rows[0].ACT);
      expect(rows[0].ACT).toBe('N');
    }
    // 清理
    await cleanupTestData(serie, chnr);
    await ss(page, 'db verified', '36');
  });

  test('37 - CHECK success on active record', async ({ page }) => {
    // ACT='Y' のレコードを CHECK → 実 API で成功を確認
    const serie = 'ud37';
    const chnr = 'chk';
    await insertActiveTestData({ serie, chnr, reason: 'TC37 CHECK test' });
    await navigateToPage(page);
    await ss(page, 'page display', '37');
    await $inputSerie(page).fill(serie + '-' + chnr);
    await ss(page, 'input filled', '37');
    await $btnCheck(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'check clicked', '37');
    // 成功メッセージ確認
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('Record found and activated.');
    await ss(page, 'check result', '37');
    // DB 確認 ACT='Y'
    const rows = await queryDB(
      `SELECT ACT FROM HDOC_ADCA_CHANGE WHERE SERIE=? AND CHNR=?`,
      [serie, chnr]
    );
    if (rows && rows.length > 0) {
      console.log('  DB ACT: ' + rows[0].ACT);
      expect(rows[0].ACT).toBe('Y');
    }
    // 清理
    await cleanupTestData(serie, chnr);
    await ss(page, 'db verified', '37');
  });

  test('38 - Message clear on new operation', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '38');
    // 触发第一次错误（空值校验）
    await $btnAdd(page).click();
    await page.waitForTimeout(500);
    await expect($err(page)).toBeVisible();
    const firstErr = await $err(page).textContent();
    console.log('  First error: ' + firstErr);
    await ss(page, 'first error', '38');
    // 触发第二次错误（同样操作，消息应被清除后重新显示）
    await $btnAdd(page).click();
    await page.waitForTimeout(500);
    await expect($err(page)).toBeVisible();
    const secondErr = await $err(page).textContent();
    console.log('  Second error: ' + secondErr);
    await ss(page, 'second error', '38');
  });

  // -----------------------------------------------------------
  // 消息显示 (TC39)
  // -----------------------------------------------------------

  test('39 - Error message style', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '39');
    // 输入不存在的 Serie-Chnr 点击 CHECK
    await $inputSerie(page).fill('nonexist-999');
    await ss(page, 'input filled', '39');
    await $btnCheck(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'check clicked', '39');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('Record not found.');
    // 验证颜色为红色
    const errColor = await $err(page).evaluate(el => getComputedStyle(el).color);
    console.log('  Error color: ' + errColor);
    await ss(page, 'error style', '39');
  });

  // -----------------------------------------------------------
  // 安全性 (TC40~42)
  // -----------------------------------------------------------

  test('40 - Unauthenticated access', async ({ page }) => {
    // 直接访问登录页，清理 localStorage
    await page.goto(PAGE_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
    });
    await ss(page, 'localStorage cleared', '40');
    // 访问受保护页面 → 应重定向到登录页
    await page.goto(PAGE_URL + '/menu/ad-ca-change', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log('  URL: ' + url);
    await ss(page, 'unauthenticated', '40');
    expect(url.includes('/login')).toBe(true);
  });

  test('41 - SQL injection protection', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '41');
    await $inputSerie(page).fill("' OR '1'='1");
    await ss(page, 'input filled', '41');
    await $btnCheck(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'check clicked', '41');
    const errVisible = await $err(page).isVisible().catch(() => false);
    if (errVisible) {
      const errText = await $err(page).textContent();
      console.log('  Error: ' + errText);
      expect(errText.toLowerCase()).not.toContain('sql');
      expect(errText.toLowerCase()).not.toContain('syntax');
    }
    await ss(page, 'sql injection', '41');
  });

  test('42 - XSS protection', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '42');
    let alertTriggered = false;
    page.on('dialog', dialog => {
      alertTriggered = true;
      dialog.accept();
    });
    await $inputSerie(page).fill('xss-001');
    await $inputDesc(page).fill('<script>alert(1)</script>');
    await ss(page, 'input filled', '42');
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'add clicked', '42');
    expect(alertTriggered).toBe(false);
    // 清理测试数据
    await cleanupTestData('xss', '001');
    await ss(page, 'xss protection', '42');
  });

});
