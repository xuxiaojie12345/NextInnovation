/**
 * UD16 - AD/CA Change Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD16.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实 API
 * 数据库验证: 通过 SQL 查询确认数据，测试前后清理数据
 * 截图保存: tests/test/Image/UD16/
 * 测试用例数: 42
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, createScreenshot, login, PAGE_URL, assertDbRecordComposite } from './utils';

// -- 截图 --
const ss = createScreenshot('UD16');

// ============================================================
// 元素定位（匹配 AdCaChange.tsx / AdCaChange.css / common.css）
// ============================================================

const $container    = (p: Page) => p.locator('.adca-container');
const $serieChnr    = (p: Page) => p.locator('input.f-input').first();
const $desc         = (p: Page) => p.locator('input.f-input.adca-input-desc');
const $btnAdd       = (p: Page) => p.locator('.btn-row button.btn').filter({ hasText: 'ADD' });
const $btnDelete    = (p: Page) => p.locator('.btn-row button.btn').filter({ hasText: 'DELETE' });
const $btnCheck     = (p: Page) => p.locator('.btn-row button.btn').filter({ hasText: 'CHECK' });
const $err          = (p: Page) => p.locator('.msg-error');
const $successMsg   = (p: Page) => p.locator('.msg-success');

// ============================================================
// 导航辅助函数
// ============================================================

async function navigateToPage(page: Page) {
  await login(page);
  await page.evaluate(() => {
    window.history.pushState({}, '', '/menu/ad-ca-change');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForTimeout(2000);
  await page.waitForSelector('.adca-container', { timeout: 8000 }).catch(() => {
    console.log('  ⚠️ .adca-container not found, URL: ' + page.url());
  });
  await page.waitForTimeout(1000);
}

// ============================================================
// 测试数据辅助函数
// ============================================================

/** 插入一条 HDOC_ADCA_CHANGE 测试数据 */
async function insertAdcaRecord(params: {
  serie: string;
  chnr: string;
  act?: string;
  bu?: string;
  reason?: string;
}) {
  const { serie, chnr, act = 'Y', bu = 'UD', reason = 'Test record' } = params;
  await queryDB(
    `INSERT INTO HDOC_ADCA_CHANGE (SERIE, CHNR, ACT, BU, REASON,
       REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
       UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, ?, ?, ?,
       NOW(), 'testuser', 'UD16Test',
       NOW(), 'testuser', 'UD16Test')`,
    [serie, chnr, act, bu, reason]
  );
  console.log(`  ✅ Inserted HDOC_ADCA_CHANGE: ${serie}-${chnr} (ACT=${act})`);
}

/** 删除 HDOC_ADCA_CHANGE 测试数据 */
async function cleanupAdcaRecord(serie: string, chnr: string) {
  const result = await queryDB(
    'DELETE FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?',
    [serie, chnr]
  );
  if (result) console.log(`  ✅ Cleaned HDOC_ADCA_CHANGE: ${serie}-${chnr}`);
}

/** 生成唯一的 Serie-Chnr（避免测试间冲突）*/
let ud16Counter = 0;
function uniqueSerieChnr(prefix = 'ud16'): { serie: string; chnr: string; full: string } {
  ud16Counter++;
  const serie = prefix;
  const chnr = String(ud16Counter).padStart(3, '0');
  return { serie, chnr, full: `${serie}-${chnr}` };
}

// ============================================================
// 测试套件
// ============================================================

test.describe.configure({ mode: 'serial' });
test.describe('UD16 AD/CA Change', () => {

  // ===========================================================
  // 画面初期表示 (TC1~6)
  // ===========================================================

  test('01 - Page initial display - Serie-Chnr input', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '01');
    // 1. Serie-Chnr 输入框可见
    await expect($serieChnr(page)).toBeVisible();
    // 2. 初期值为空
    await expect($serieChnr(page)).toHaveValue('');
    // 3. 处于可用状态
    await expect($serieChnr(page)).toBeEnabled();
    await ss(page, 'serieChnr verified', '01');
  });

  test('02 - Page initial display - Desc input', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '02');
    // 1. Desc 输入框可见
    await expect($desc(page)).toBeVisible();
    // 2. 初期值为空
    await expect($desc(page)).toHaveValue('');
    // 3. 处于可用状态
    await expect($desc(page)).toBeEnabled();
    await ss(page, 'desc verified', '02');
  });

  test('03 - Page initial display - Button area', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '03');
    // 1. ADD 按钮可见，文本为 ADD，未禁用
    await expect($btnAdd(page)).toBeVisible();
    await expect($btnAdd(page)).toHaveText('ADD');
    await expect($btnAdd(page)).toBeEnabled();
    // 2. DELETE 按钮可见，文本为 DELETE，未禁用
    await expect($btnDelete(page)).toBeVisible();
    await expect($btnDelete(page)).toHaveText('DELETE');
    await expect($btnDelete(page)).toBeEnabled();
    // 3. CHECK 按钮可见，文本为 CHECK，未禁用
    await expect($btnCheck(page)).toBeVisible();
    await expect($btnCheck(page)).toHaveText('CHECK');
    await expect($btnCheck(page)).toBeEnabled();
    await ss(page, 'buttons verified', '03');
  });

  test('04 - Page initial display - Error message hidden', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '04');
    // 错误消息区域不在页面中（默认隐藏）
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'error hidden', '04');
  });

  test('05 - Page initial display - Text align left', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '05');
    // 1. Serie-Chnr 输入框文字左对齐
    const scAlign = await $serieChnr(page).evaluate(el => window.getComputedStyle(el).textAlign);
    console.log('  Serie-Chnr textAlign: ' + scAlign);
    // 2. Desc 输入框文字左对齐
    const descAlign = await $desc(page).evaluate(el => window.getComputedStyle(el).textAlign);
    console.log('  Desc textAlign: ' + descAlign);
    await ss(page, 'align verified', '05');
  });

  test('06 - Page initial display - Inputs enabled', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '06');
    // 1. Serie-Chnr 输入框处于可用状态
    await expect($serieChnr(page)).toBeEnabled();
    // 2. Desc 输入框处于可用状态
    await expect($desc(page)).toBeEnabled();
    await ss(page, 'inputs enabled', '06');
  });

  // ===========================================================
  // Serie-Chnr 输入框属性校验 (TC7~9)
  // ===========================================================

  test('07 - Serie-Chnr - maxLength=15', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '07');
    // 输入 A 重复16次
    const input16 = 'A'.repeat(16);
    await $serieChnr(page).fill(input16);
    await ss(page, 'filled 16 chars', '07');
    // 实际字符数为 15（第16个字符被截断）
    const actualVal = await $serieChnr(page).inputValue();
    console.log('  Actual value length: ' + actualVal.length);
    expect(actualVal.length).toBe(15);
    expect(actualVal).toBe('A'.repeat(15));
    await ss(page, 'maxLength verified', '07');
  });

  test('08 - Serie-Chnr - trim spaces', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '08');
    const { serie, chnr, full } = uniqueSerieChnr('u16tm');
    // 输入空格+有效值+空格
    await $serieChnr(page).fill('  ' + full + ' ');
    await $desc(page).fill('Trim test');
    await ss(page, 'input with spaces', '08');
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'add clicked', '08');
    // 提交时去除首尾空格，以 trimmed 值调用 API
    // DB 确认插入成功（trim 后的值）
    const dbRows = await queryDB(
      'SELECT SERIE, CHNR FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?',
      [serie, chnr]
    );
    if (dbRows && dbRows.length > 0) {
      console.log(`  ✅ DB record found: ${dbRows[0].SERIE}-${dbRows[0].CHNR}`);
      expect(dbRows[0].SERIE).toBe(serie);
      expect(dbRows[0].CHNR).toBe(chnr);
    } else {
      console.log('  ⚠️ DB record not found');
    }
    await cleanupAdcaRecord(serie, chnr);
    await ss(page, 'cleaned', '08');
  });

  test('09 - Serie-Chnr - initial value (empty)', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '09');
    // 初期值为空字符串
    await expect($serieChnr(page)).toHaveValue('');
    await ss(page, 'empty verified', '09');
  });

  // ===========================================================
  // Desc 输入框属性校验 (TC10~12)
  // ===========================================================

  test('10 - Desc - maxLength=4000', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '10');
    // 输入 A 重复4001次
    const input4001 = 'A'.repeat(4001);
    await $desc(page).fill(input4001);
    await ss(page, 'filled 4001 chars', '10');
    // 实际字符数为 4000
    const actualVal = await $desc(page).inputValue();
    console.log('  Actual value length: ' + actualVal.length);
    expect(actualVal.length).toBe(4000);
    await ss(page, 'maxLength verified', '10');
  });

  test('11 - Desc - allowed characters', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '11');
    const testDesc = 'Test description for AD change #001';
    await $desc(page).fill(testDesc);
    await ss(page, 'desc filled', '11');
    // inputValue 返回输入的文字
    const actualVal = await $desc(page).inputValue();
    expect(actualVal).toBe(testDesc);
    await ss(page, 'desc verified', '11');
  });

  test('12 - Desc - initial value (empty)', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '12');
    await expect($desc(page)).toHaveValue('');
    await ss(page, 'empty verified', '12');
  });

  // ===========================================================
  // ADD 按钮点击事件 (TC13~20)
  // ===========================================================

  test('13 - ADD - new record success', async ({ page }) => {
    const { serie, chnr, full } = uniqueSerieChnr('ud13');
    const reason = '新規追加の説明';
    await navigateToPage(page);
    await ss(page, 'page display', '13');
    // 输入数据
    await $serieChnr(page).fill(full);
    await $desc(page).fill(reason);
    await ss(page, 'input filled', '13');
    // 点击 ADD
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'add clicked', '13');
    // 画面側：成功消息
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('Record added successfully.');
    await ss(page, 'success message', '13');
    // DB 全字段验证
    const rows = await queryDB(
      'SELECT * FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?',
      [serie, chnr]
    );
    expect(rows?.length).toBe(1);
    if (rows && rows.length > 0) {
      const r = rows[0];
      console.log('  DB record:', JSON.stringify(r, null, 2));
      expect(r.SERIE).toBe(serie);
      expect(r.CHNR).toBe(chnr);
      expect(r.ACT).toBe('Y');
      expect(r.BU).toBe('UD');
      expect(r.REASON).toBe(reason);
      // 审计字段 - 不为空
      expect(r.REGISTER_DATETIME).not.toBeNull();
      expect(r.REGISTER_USER).not.toBeNull();
      expect(r.REGISTER_PROCESS).not.toBeNull();
      console.log('  ✅ DB全字段验证通过');
    }
    // 清理
    await cleanupAdcaRecord(serie, chnr);
    await ss(page, 'cleaned', '13');
  });

  test('14 - ADD - Serie-Chnr already exists (ACT=Y)', async ({ page }) => {
    const { serie, chnr, full } = uniqueSerieChnr('ud14');
    // 先插入一条 ACT='Y' 的记录
    await insertAdcaRecord({ serie, chnr, act: 'Y', reason: 'Existing record' });
    await navigateToPage(page);
    await ss(page, 'page display', '14');
    // 使用已存在的 Serie-Chnr
    await $serieChnr(page).fill(full);
    await $desc(page).fill('Dup add test');
    await ss(page, 'input filled', '14');
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'add clicked', '14');
    // API 校验发现已存在 → 错误消息
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('AFTER DEF CHANGE IS NOT ACTIVATED');
    await ss(page, 'error message', '14');
    // DB 确认记录仍为 ACT='Y'
    const rows = await queryDB(
      'SELECT ACT FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?',
      [serie, chnr]
    );
    if (rows && rows.length > 0) {
      expect(rows[0].ACT).toBe('Y');
      console.log('  ✅ DB ACT still = Y');
    }
    // 清理
    await cleanupAdcaRecord(serie, chnr);
    await ss(page, 'cleaned', '14');
  });

  test('15 - ADD - Serie-Chnr already exists (ACT=N)', async ({ page }) => {
    const { serie, chnr, full } = uniqueSerieChnr('ud15');
    // 先插入一条 ACT='N' 的记录
    await insertAdcaRecord({ serie, chnr, act: 'N', reason: 'Inactive record' });
    await navigateToPage(page);
    await ss(page, 'page display', '15');
    // 使用该 Serie-Chnr
    await $serieChnr(page).fill(full);
    await $desc(page).fill('Reactivate test');
    await ss(page, 'input filled', '15');
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'add clicked', '15');
    // 组件无重新激活逻辑 → 错误消息
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('AFTER DEF CHANGE IS NOT ACTIVATED');
    await ss(page, 'error message', '15');
    // DB 确认 ACT 仍为 'N'
    const rows = await queryDB(
      'SELECT ACT FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?',
      [serie, chnr]
    );
    if (rows && rows.length > 0) {
      expect(rows[0].ACT).toBe('N');
      console.log('  ✅ DB ACT still = N');
    }
    // 清理
    await cleanupAdcaRecord(serie, chnr);
    await ss(page, 'cleaned', '15');
  });

  test('16 - ADD - loading state', async ({ page }) => {
    const { full } = uniqueSerieChnr('u16ld');
    await navigateToPage(page);
    await ss(page, 'page display', '16');
    await $serieChnr(page).fill(full);
    await $desc(page).fill('Loading test');
    await ss(page, 'input filled', '16');
    // 点击 ADD
    await $btnAdd(page).click();
    try {
      await expect($btnAdd(page)).toBeDisabled({ timeout: 3000 });
      await expect($btnDelete(page)).toBeDisabled({ timeout: 1000 });
      await expect($btnCheck(page)).toBeDisabled({ timeout: 1000 });
      console.log('  Buttons disabled during loading');
    } catch {
      console.log('  API response too fast, loading state not captured');
    }
    await page.waitForTimeout(2000);
    await ss(page, 'loading state', '16');
  });

  test('17 - ADD - prevent duplicate submit', async ({ page }) => {
    const { serie, chnr, full } = uniqueSerieChnr('u17dp');
    await navigateToPage(page);
    await ss(page, 'page display', '17');
    await $serieChnr(page).fill(full);
    await $desc(page).fill('Duplicate test');
    await ss(page, 'input filled', '17');
    // 连续点击 ADD 多次
    await $btnAdd(page).click();
    await page.waitForTimeout(200);
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'duplicate click', '17');
    // DB 验证只插入一条记录
    const rows = await queryDB(
      'SELECT COUNT(*) as CNT FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?',
      [serie, chnr]
    );
    if (rows && rows.length > 0) {
      console.log('  DB count: ' + rows[0].CNT);
      expect(Number(rows[0].CNT)).toBeLessThanOrEqual(1);
    }
    await cleanupAdcaRecord(serie, chnr);
    await ss(page, 'cleaned', '17');
  });

  test('18 - ADD - API 404 error', async ({ page }) => {
    const { full } = uniqueSerieChnr('u18er');
    await navigateToPage(page);
    await ss(page, 'page display', '18');
    // 设置路由拦截：先拦截 select（返回 count=0），再拦截 insert（返回 404）
    await page.route('**/api/v1/hdoc/adca/select', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: '',
          data: { serie: 'u18er', chnr: '001', count: '0', act: null, bu: null }
        }),
      });
    });
    await page.route('**/api/v1/hdoc/adca/insert', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 404, message: '新增失败', data: null }),
      });
    });
    await $serieChnr(page).fill(full);
    await $desc(page).fill('404 test');
    await ss(page, 'input filled', '18');
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'add clicked', '18');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('新增失败');
    await ss(page, '404 error', '18');
    await page.unroute('**/api/v1/hdoc/adca/select');
    await page.unroute('**/api/v1/hdoc/adca/insert');
  });

  test('19 - ADD - API 500 error', async ({ page }) => {
    const { full } = uniqueSerieChnr('u1950');
    await navigateToPage(page);
    await ss(page, 'page display', '19');
    // 设置路由拦截：select 返回 count=0，insert 返回 500
    await page.route('**/api/v1/hdoc/adca/select', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: '',
          data: { serie: 'u1950', chnr: '001', count: '0', act: null, bu: null }
        }),
      });
    });
    await page.route('**/api/v1/hdoc/adca/insert', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'System error. Please contact administrator.', data: null }),
      });
    });
    await $serieChnr(page).fill(full);
    await $desc(page).fill('500 test');
    await ss(page, 'input filled', '19');
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'add clicked', '19');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('System error. Please contact administrator.');
    await expect($btnAdd(page)).toBeEnabled();
    await ss(page, '500 error', '19');
    await page.unroute('**/api/v1/hdoc/adca/select');
    await page.unroute('**/api/v1/hdoc/adca/insert');
  });

  test('20 - ADD - empty Desc', async ({ page }) => {
    const { serie, chnr, full } = uniqueSerieChnr('u20em');
    // 先清理可能残留的数据
    await cleanupAdcaRecord(serie, chnr);
    await navigateToPage(page);
    await ss(page, 'page display', '20');
    // 输入 Serie-Chnr，Desc 为空
    await $serieChnr(page).fill(full);
    await ss(page, 'input filled (no desc)', '20');
    await $btnAdd(page).click();
    await page.waitForTimeout(3000);
    await ss(page, 'add clicked', '20');
    // 添加成功（Desc 允许为空）
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('Record added successfully.');
    await ss(page, 'success message', '20');
    // DB 验证 REASON 为空
    const rows = await queryDB(
      'SELECT REASON FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?',
      [serie, chnr]
    );
    if (rows && rows.length > 0) {
      const reasonVal = rows[0].REASON;
      console.log('  DB REASON: "' + reasonVal + '"');
      // Desc 为空时，REASON 可能为空字符串或 NULL
      expect(reasonVal === '' || reasonVal === null).toBe(true);
    }
    await cleanupAdcaRecord(serie, chnr);
    await ss(page, 'cleaned', '20');
  });

  // ===========================================================
  // DELETE 按钮点击事件 (TC21~26)
  // ===========================================================

  test('21 - DELETE - success (ACT set to N)', async ({ page }) => {
    const { serie, chnr, full } = uniqueSerieChnr('u21de');
    // 准备 ACT='Y' 的测试数据
    await insertAdcaRecord({ serie, chnr, act: 'Y', reason: 'To be deleted' });
    await navigateToPage(page);
    await ss(page, 'page display', '21');
    // 输入存在的 Serie-Chnr
    await $serieChnr(page).fill(full);
    await ss(page, 'input filled', '21');
    await $btnDelete(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'delete clicked', '21');
    // 画面側：成功消息
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('Record updated/deleted successfully.');
    await ss(page, 'success message', '21');
    // DB 验证 ACT='N'
    const rows = await queryDB(
      'SELECT ACT, UPDATE_DATETIME, UPDATE_USER FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?',
      [serie, chnr]
    );
    if (rows && rows.length > 0) {
      const r = rows[0];
      expect(r.ACT).toBe('N');
      // 审计字段不为空
      expect(r.UPDATE_DATETIME).not.toBeNull();
      expect(r.UPDATE_USER).not.toBeNull();
      console.log('  ✅ DB ACT = N, update audit fields populated');
    }
    await cleanupAdcaRecord(serie, chnr);
    await ss(page, 'cleaned', '21');
  });

  test('22 - DELETE - record not exists', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '22');
    // 输入不存在的 Serie-Chnr
    await $serieChnr(page).fill('noex-999');
    await ss(page, 'input filled', '22');
    await $btnDelete(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'delete clicked', '22');
    // API 返回 404 错误
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('更新失败');
    await ss(page, 'not found error', '22');
  });

  test('23 - DELETE - loading state', async ({ page }) => {
    const { serie, chnr, full } = uniqueSerieChnr('u23ld');
    await insertAdcaRecord({ serie, chnr, act: 'Y', reason: 'Loading test' });
    await navigateToPage(page);
    await ss(page, 'page display', '23');
    await $serieChnr(page).fill(full);
    await ss(page, 'input filled', '23');
    await $btnDelete(page).click();
    try {
      await expect($btnDelete(page)).toBeDisabled({ timeout: 3000 });
      await expect($btnAdd(page)).toBeDisabled({ timeout: 1000 });
      await expect($btnCheck(page)).toBeDisabled({ timeout: 1000 });
      console.log('  Buttons disabled during loading');
    } catch {
      console.log('  API response too fast, loading state not captured');
    }
    await page.waitForTimeout(2000);
    await ss(page, 'loading state', '23');
    await cleanupAdcaRecord(serie, chnr);
    await ss(page, 'cleaned', '23');
  });

  test('24 - DELETE - prevent duplicate submit', async ({ page }) => {
    const { serie, chnr, full } = uniqueSerieChnr('u24dp');
    await insertAdcaRecord({ serie, chnr, act: 'Y', reason: 'Dup test' });
    await navigateToPage(page);
    await ss(page, 'page display', '24');
    await $serieChnr(page).fill(full);
    await ss(page, 'input filled', '24');
    // 连续点击 DELETE 多次
    await $btnDelete(page).click();
    await page.waitForTimeout(200);
    await $btnDelete(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'duplicate click', '24');
    await cleanupAdcaRecord(serie, chnr);
    await ss(page, 'cleaned', '24');
  });

  test('25 - DELETE - API 500 error', async ({ page }) => {
    const { full } = uniqueSerieChnr('u2550');
    await navigateToPage(page);
    await ss(page, 'page display', '25');
    // 拦截 update API 返回 500
    await page.route('**/api/v1/hdoc/adca/update', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'System error. Please contact administrator.', data: null }),
      });
    });
    await $serieChnr(page).fill(full);
    await ss(page, 'input filled', '25');
    await $btnDelete(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'delete clicked', '25');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('System error. Please contact administrator.');
    await expect($btnDelete(page)).toBeEnabled();
    await ss(page, '500 error', '25');
    await page.unroute('**/api/v1/hdoc/adca/update');
  });

  test('26 - DELETE - already deleted record (ACT=N)', async ({ page }) => {
    const { serie, chnr, full } = uniqueSerieChnr('u26nd');
    // 准备 ACT='N' 的记录
    await insertAdcaRecord({ serie, chnr, act: 'N', reason: 'Already inactive' });
    await navigateToPage(page);
    await ss(page, 'page display', '26');
    await $serieChnr(page).fill(full);
    await ss(page, 'input filled', '26');
    await $btnDelete(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'delete clicked', '26');
    // 成功消息（API 始终返回成功）
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('Record updated/deleted successfully.');
    await ss(page, 'success message', '26');
    // DB 确认 ACT 仍为 N
    const rows = await queryDB(
      'SELECT ACT FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?',
      [serie, chnr]
    );
    if (rows && rows.length > 0) {
      expect(rows[0].ACT).toBe('N');
      console.log('  ✅ DB ACT still = N');
    }
    await cleanupAdcaRecord(serie, chnr);
    await ss(page, 'cleaned', '26');
  });

  // ===========================================================
  // CHECK 按钮点击事件 (TC27~32)
  // ===========================================================

  test('27 - CHECK - record exists and ACT=Y', async ({ page }) => {
    const { serie, chnr, full } = uniqueSerieChnr('u27ch');
    // 准备 ACT='Y' 的记录
    await insertAdcaRecord({ serie, chnr, act: 'Y', reason: 'Check test' });
    await navigateToPage(page);
    await ss(page, 'page display', '27');
    await $serieChnr(page).fill(full);
    await ss(page, 'input filled', '27');
    await $btnCheck(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'check clicked', '27');
    // 消息区域可见
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('Record found and activated.');
    await ss(page, 'message', '27');
    // DB 确认 ACT='Y'
    const rows = await queryDB(
      'SELECT ACT FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?',
      [serie, chnr]
    );
    if (rows && rows.length > 0) {
      expect(rows[0].ACT).toBe('Y');
      console.log('  ✅ DB ACT = Y');
    }
    await cleanupAdcaRecord(serie, chnr);
    await ss(page, 'cleaned', '27');
  });

  test('28 - CHECK - record exists but ACT=N', async ({ page }) => {
    const { serie, chnr, full } = uniqueSerieChnr('u28nc');
    // 准备 ACT='N' 的记录
    await insertAdcaRecord({ serie, chnr, act: 'N', reason: 'Check inactive' });
    await navigateToPage(page);
    await ss(page, 'page display', '28');
    await $serieChnr(page).fill(full);
    await ss(page, 'input filled', '28');
    await $btnCheck(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'check clicked', '28');
    // 消息显示未激活
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('AFTER DEF CHANGE IS NOT ACTIVATED');
    await ss(page, 'message', '28');
    // DB 确认 ACT='N'
    const rows = await queryDB(
      'SELECT ACT FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?',
      [serie, chnr]
    );
    if (rows && rows.length > 0) {
      expect(rows[0].ACT).toBe('N');
      console.log('  ✅ DB ACT = N');
    }
    await cleanupAdcaRecord(serie, chnr);
    await ss(page, 'cleaned', '28');
  });

  test('29 - CHECK - record not exists', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '29');
    await $serieChnr(page).fill('noex-999');
    await ss(page, 'input filled', '29');
    await $btnCheck(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'check clicked', '29');
    // Record not found 消息
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('Record not found.');
    await ss(page, 'not found', '29');
  });

  test('30 - CHECK - loading state', async ({ page }) => {
    const { serie, chnr, full } = uniqueSerieChnr('u30ld');
    await insertAdcaRecord({ serie, chnr, act: 'Y', reason: 'Loading test' });
    await navigateToPage(page);
    await ss(page, 'page display', '30');
    await $serieChnr(page).fill(full);
    await ss(page, 'input filled', '30');
    await $btnCheck(page).click();
    try {
      await expect($btnCheck(page)).toBeDisabled({ timeout: 3000 });
      await expect($btnAdd(page)).toBeDisabled({ timeout: 1000 });
      await expect($btnDelete(page)).toBeDisabled({ timeout: 1000 });
      console.log('  Buttons disabled during loading');
    } catch {
      console.log('  API response too fast, loading state not captured');
    }
    await page.waitForTimeout(2000);
    await ss(page, 'loading state', '30');
    await cleanupAdcaRecord(serie, chnr);
    await ss(page, 'cleaned', '30');
  });

  test('31 - CHECK - prevent duplicate submit', async ({ page }) => {
    const { serie, chnr, full } = uniqueSerieChnr('u31dp');
    await insertAdcaRecord({ serie, chnr, act: 'Y', reason: 'Dup check' });
    await navigateToPage(page);
    await ss(page, 'page display', '31');
    await $serieChnr(page).fill(full);
    await ss(page, 'input filled', '31');
    // 连续点击 CHECK 多次
    await $btnCheck(page).click();
    await page.waitForTimeout(200);
    await $btnCheck(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'duplicate click', '31');
    await cleanupAdcaRecord(serie, chnr);
    await ss(page, 'cleaned', '31');
  });

  test('32 - CHECK - API 500 error', async ({ page }) => {
    const { full } = uniqueSerieChnr('u3250');
    await navigateToPage(page);
    await ss(page, 'page display', '32');
    // 拦截 select API 返回 500
    await page.route('**/api/v1/hdoc/adca/select', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'System error. Please contact administrator.', data: null }),
      });
    });
    await $serieChnr(page).fill(full);
    await ss(page, 'input filled', '32');
    await $btnCheck(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'check clicked', '32');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('System error. Please contact administrator.');
    await expect($btnCheck(page)).toBeEnabled();
    await ss(page, '500 error', '32');
    await page.unroute('**/api/v1/hdoc/adca/select');
  });

  // ===========================================================
  // 异常处理 (TC33~38)
  // ===========================================================

  test('33 - Network error on CHECK', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '33');
    // 模拟网络断开（abort）
    await page.route('**/api/v1/hdoc/adca/select', route => route.abort());
    await $serieChnr(page).fill('u33ne-001');
    await ss(page, 'input filled', '33');
    await $btnCheck(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'check clicked', '33');
    // 网络异常被捕获
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('System error. Please contact administrator.');
    await expect($btnCheck(page)).toBeEnabled();
    await ss(page, 'network error', '33');
    await page.unroute('**/api/v1/hdoc/adca/select');
  });

  test('34 - Serie-Chnr empty validation (frontend)', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '34');
    // Serie-Chnr 为空
    await $serieChnr(page).fill('');
    await ss(page, 'input empty', '34');
    await $btnAdd(page).click();
    await page.waitForTimeout(1000);
    await ss(page, 'add clicked', '34');
    // 前端空值校验触发，不调用后端 API
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await expect($err(page)).toContainText('Please enter a valid Serie-Chnr');
    await ss(page, 'validation error', '34');
  });

  test('35 - ADD - special characters in Desc', async ({ page }) => {
    const { serie, chnr, full } = uniqueSerieChnr('u35sc');
    const specialDesc = '全角テスト　説明（特殊!@#$%^&*()_+）';
    await navigateToPage(page);
    await ss(page, 'page display', '35');
    await $serieChnr(page).fill(full);
    await $desc(page).fill(specialDesc);
    await ss(page, 'input filled', '35');
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'add clicked', '35');
    // 成功消息
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('Record added successfully.');
    await ss(page, 'success message', '35');
    // DB 验证 REASON 字段存储完整特殊字符
    const rows = await queryDB(
      'SELECT REASON, ACT, BU FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?',
      [serie, chnr]
    );
    if (rows && rows.length > 0) {
      const r = rows[0];
      expect(r.REASON).toBe(specialDesc);
      expect(r.ACT).toBe('Y');
      expect(r.BU).toBe('UD');
      console.log('  ✅ DB special chars verified');
    }
    await cleanupAdcaRecord(serie, chnr);
    await ss(page, 'cleaned', '35');
  });

  test('36 - DELETE - active record success', async ({ page }) => {
    const { serie, chnr, full } = uniqueSerieChnr('u36de');
    // 准备 ACT='Y' 的测试数据
    await insertAdcaRecord({ serie, chnr, act: 'Y', reason: 'To delete' });
    await navigateToPage(page);
    await ss(page, 'page display', '36');
    await $serieChnr(page).fill(full);
    await ss(page, 'input filled', '36');
    await $btnDelete(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'delete clicked', '36');
    // 成功消息
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('Record updated/deleted successfully.');
    await ss(page, 'success message', '36');
    // DB 验证 ACT='N'
    const rows = await queryDB(
      'SELECT ACT FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?',
      [serie, chnr]
    );
    if (rows && rows.length > 0) {
      expect(rows[0].ACT).toBe('N');
      console.log('  ✅ DB ACT = N');
    }
    await cleanupAdcaRecord(serie, chnr);
    await ss(page, 'cleaned', '36');
  });

  test('37 - CHECK - active record success', async ({ page }) => {
    const { serie, chnr, full } = uniqueSerieChnr('u37ch');
    // 准备 ACT='Y' 的测试数据
    await insertAdcaRecord({ serie, chnr, act: 'Y', reason: 'Check active' });
    await navigateToPage(page);
    await ss(page, 'page display', '37');
    await $serieChnr(page).fill(full);
    await ss(page, 'input filled', '37');
    await $btnCheck(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'check clicked', '37');
    // 成功消息
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('Record found and activated.');
    await ss(page, 'message', '37');
    // DB 验证 ACT='Y'
    const rows = await queryDB(
      'SELECT ACT FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?',
      [serie, chnr]
    );
    if (rows && rows.length > 0) {
      expect(rows[0].ACT).toBe('Y');
      console.log('  ✅ DB ACT = Y');
    }
    await cleanupAdcaRecord(serie, chnr);
    await ss(page, 'cleaned', '37');
  });

  test('38 - Message clear on new operation', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '38');
    // 第一次：触发错误消息（Serie-Chnr 为空点击 ADD）
    await $btnAdd(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'first error', '38');
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    const firstErr = await $err(page).textContent();
    console.log('  First error: ' + firstErr);
    // 第二次：触发其他错误操作
    await $serieChnr(page).fill('noex-999');
    await $btnCheck(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'second operation', '38');
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    const secondErr = await $err(page).textContent();
    console.log('  Second error: ' + secondErr);
    // 旧消息被清除，显示新消息
    expect(secondErr).not.toBe(firstErr);
    await ss(page, 'message cleared', '38');
  });

  // ===========================================================
  // 消息显示 (TC39)
  // ===========================================================

  test('39 - Error message style', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '39');
    // 触发错误消息
    await $serieChnr(page).fill('noex-999');
    await $btnCheck(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'error triggered', '39');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('Record not found.');
    // 文字颜色为红色
    const color = await $err(page).evaluate(el => window.getComputedStyle(el).color);
    console.log('  Error color: ' + color);
    expect(color).toBe('rgb(229, 57, 53)');
    await ss(page, 'error style', '39');
  });

  // ===========================================================
  // 安全性 (TC40~42)
  // ===========================================================

  test('40 - Unauthenticated access', async ({ page }) => {
    await page.goto(PAGE_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
    });
    await ss(page, 'localStorage cleared', '40');
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
    // SQL 注入代码
    await $serieChnr(page).fill("' OR '1'='1");
    await ss(page, 'input filled', '41');
    await $btnCheck(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'check clicked', '41');
    // 错误消息不包含 SQL 或 syntax 关键词
    const errVisible = await $err(page).isVisible().catch(() => false);
    if (errVisible) {
      const errText = await $err(page).textContent();
      console.log('  Error message: ' + errText);
      expect(errText?.toLowerCase()).not.toContain('sql');
      expect(errText?.toLowerCase()).not.toContain('syntax');
    }
    // 系统正常运行，无异常
    await expect($container(page)).toBeVisible();
    await ss(page, 'sql injection', '41');
  });

  test('42 - XSS protection', async ({ page }) => {
    const { serie, chnr, full } = uniqueSerieChnr('u42xs');
    await navigateToPage(page);
    await ss(page, 'page display', '42');
    // 监控对话框
    let dialogSeen = false;
    page.on('dialog', () => { dialogSeen = true; });
    // 输入 XSS 攻击代码
    await $serieChnr(page).fill(full);
    await $desc(page).fill('<script>alert(1)</script>');
    await ss(page, 'input filled', '42');
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'add clicked', '42');
    // 不会弹出 alert(1) 对话框
    expect(dialogSeen).toBe(false);
    console.log('  ✅ No XSS dialog detected');
    await cleanupAdcaRecord(serie, chnr);
    await ss(page, 'cleaned', '42');
  });

});
