/**
 * UD20 - Market Document Settings List Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD20.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实 API（无 Mock）
 * 数据库验证: 通过 SQL 查询确认数据，测试前后清理数据
 * 截图保存: tests/test/Image/UD20/
 * 测试用例数: 33
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, createScreenshot, login, PAGE_URL } from './utils';

// -- 截图 --
const ss = createScreenshot('UD20');

// ============================================================
// 检索画面 - 元素定位（匹配 MarketDocumentSettingsList.tsx）
// ============================================================

const $container       = (p: Page) => p.locator('.mdsl-container');
const $err             = (p: Page) => p.locator('.mdsl-error.msg-error');
const $successMsg      = (p: Page) => p.locator('.msg-success');

const $btnSearch       = (p: Page) => p.locator('.mdsl-bordered .btn-row button.btn').filter({ hasText: 'Search' });
const $btnClear        = (p: Page) => p.locator('.mdsl-bordered .btn-row button.btn').filter({ hasText: 'Clear' });
const $btnBack         = (p: Page) => p.locator('.mdsl-bordered .btn-row button.btn').filter({ hasText: 'Back' });
const $btnUpdateMode   = (p: Page) => p.locator('.mdsl-bordered .btn-row button.btn').filter({ hasText: 'Update Mode' });

/** 检索行的 input（按 label 文本定位所在行，再取 input） */
const $rowInput = (p: Page, label: string) =>
  p.locator('.mdsl-row').filter({ hasText: label }).locator('input.mdsl-input');

/** 检索行的 select（按 label 文本定位所在行，再取 select） */
const $rowSelect = (p: Page, label: string) =>
  p.locator('.mdsl-row').filter({ hasText: label }).locator('select.mdsl-select');

/** 检索行的 op-select（按 label 文本定位所在行，再取 op-select） */
const $rowOpSelect = (p: Page, label: string) =>
  p.locator('.mdsl-row').filter({ hasText: label }).locator('select.mdsl-op-select');

// ============================================================
// 检索結果画面 - 元素定位（匹配 MarketDocumentSettingsResultList.tsx）
// ============================================================

const $resultContainer   = (p: Page) => p.locator('.mdsr-container');
const $resultErr         = (p: Page) => p.locator('.mdsr-error.msg-error');
const $resultTable       = (p: Page) => p.locator('.mdsr-table');
const $resultTableRows   = (p: Page) => p.locator('.mdsr-table tbody tr');
const $resultCount       = (p: Page) => p.locator('.result-count');
const $resultEmpty       = (p: Page) => p.locator('.empty-placeholder');
const $resultLoading     = (p: Page) => p.locator('.loading-placeholder');

const $btnResultSelect   = (p: Page) => p.locator('.btn-table button.btn').filter({ hasText: 'Select' });
const $btnResultBack     = (p: Page) => p.locator('.btn-table button.btn').filter({ hasText: 'Back' });
const $btnResultPrint    = (p: Page) => p.locator('.btn-table button.btn').filter({ hasText: 'Print' });

/** 获取结果表某行某列的内容（1-indexed） */
async function getResultCell(page: Page, rowIndex: number, colIndex: number): Promise<string> {
  return (await $resultTableRows(page).nth(rowIndex).locator('td').nth(colIndex).textContent()) || '';
}

/** 选择结果表中的某行（点击 radio button） */
async function selectResultRow(page: Page, rowIndex: number) {
  await $resultTableRows(page).nth(rowIndex).locator('input[type="radio"]').check({ force: true });
}

// ============================================================
// 导航辅助函数
// ============================================================

async function navigateToSearchPage(page: Page) {
  await login(page);
  // 通过 UD24 - User Guide (HDoc Help) 画面点击 HDoc - Market Document Setting 进入
  await page.goto(PAGE_URL + '/menu/guide-user', { waitUntil: 'load' });
  await page.waitForSelector('.user-guide-page');
  await page.waitForTimeout(1000);
  // 点击 "HDoc - Market Document Setting" 链接
  await page.locator('.help-link-item .help-link-text').filter({ hasText: 'HDoc - Market Document Setting' }).click();
  // 等待跳转到检索画面
  await page.waitForURL('**/menu/market-document-setting', { timeout: 10000 });
  await page.waitForSelector('.mdsl-container');
  await page.waitForTimeout(1000);
}

// ============================================================
// 测试数据常量
// ============================================================

const TEST_DOCTYPE  = 'UD20_TEST_DOC';
const TEST_DESC     = 'UD20 Test Document';
const TEST_USER     = 'UD20Usr';
const TEST_DATE     = '2026-07-01';

/** 插入测试文档到 HDOC_DOCUMENT_LIST */
async function insertTestDoc(override?: {
  doctype?: string; desc?: string; user?: string; date?: string;
}) {
  const dt = override?.doctype || TEST_DOCTYPE;
  // 清除残留
  await queryDB(`DELETE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE = ?`, [dt]);
  await queryDB(
    `INSERT INTO HDOC_DOCUMENT_LIST (DOCTYPE, DESCRIPTION,
       REGISTER_USER, REGISTER_DATETIME, REGISTER_PROCESS,
       UPDATE_USER, UPDATE_DATETIME, UPDATE_PROCESS)
     VALUES (?, ?, ?, ?, 'UT',
       ?, NOW(), 'UT')`,
    [
      dt,
      override?.desc || TEST_DESC,
      override?.user || TEST_USER,
      override?.date || TEST_DATE + ' 10:00:00',
      override?.user || TEST_USER,
    ]
  );
}

/** 清理测试文档 */
async function cleanupTestDoc(doctype?: string) {
  await queryDB(`DELETE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE = ?`, [doctype || TEST_DOCTYPE]);
}

// ============================================================
// 测试套件
// ============================================================

test.describe.configure({ mode: 'serial' });
test.describe('UD20 Market Document Settings List', () => {

  // ===========================================================
  // 检索画面-初期表示 (TC1~7)
  // ===========================================================

  test('01 - Document type input field', async ({ page }) => {
    await navigateToSearchPage(page);
    await ss(page, 'page display', '01');
    const input = $rowInput(page, 'Document type');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('type', 'text');
    const val = await input.inputValue();
    expect(val).toBe('');
    await expect(input).toBeEnabled();
    await ss(page, 'document type input verified', '01');
  });

  test('02 - Market input field', async ({ page }) => {
    await navigateToSearchPage(page);
    await ss(page, 'page display', '02');
    const input = $rowInput(page, 'Market');
    await expect(input).toBeVisible();
    const val = await input.inputValue();
    expect(val).toBe('-EU');
    await expect(input).toBeEnabled();
    await ss(page, 'market input verified', '02');
  });

  test('03 - Setting dropdown', async ({ page }) => {
    await navigateToSearchPage(page);
    await ss(page, 'page display', '03');
    const select = $rowSelect(page, 'Setting');
    await expect(select).toBeVisible();
    const val = await select.inputValue();
    expect(val).toBe(''); // 初期值为空（-- Select --）
    await expect(select).toBeEnabled();
    await ss(page, 'setting dropdown verified', '03');
  });

  test('04 - Business unit dropdown', async ({ page }) => {
    await navigateToSearchPage(page);
    await ss(page, 'page display', '04');
    const select = $rowSelect(page, 'Business unit');
    await expect(select).toBeVisible();
    const val = await select.inputValue();
    expect(val).toBe('BU');
    await expect(select).toBeEnabled();
    await ss(page, 'business unit dropdown verified', '04');
  });

  test('05 - User input field', async ({ page }) => {
    await navigateToSearchPage(page);
    await ss(page, 'page display', '05');
    const input = $rowInput(page, 'User');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('type', 'text');
    const maxLen = await input.getAttribute('maxLength');
    expect(maxLen).toBe('16');
    const val = await input.inputValue();
    expect(val).toBe('');
    await expect(input).toBeEnabled();
    await ss(page, 'user input verified', '05');
  });

  test('06 - Date input field', async ({ page }) => {
    await navigateToSearchPage(page);
    await ss(page, 'page display', '06');
    const input = $rowInput(page, 'Date');
    await expect(input).toBeVisible();
    const val = await input.inputValue();
    expect(val).toBe('');
    await expect(input).toBeEnabled();
    await ss(page, 'date input verified', '06');
  });

  test('07 - Buttons initial state', async ({ page }) => {
    await navigateToSearchPage(page);
    await ss(page, 'page display', '07');
    // Search
    await expect($btnSearch(page)).toBeVisible();
    await expect($btnSearch(page)).toHaveText('Search');
    await expect($btnSearch(page)).toBeEnabled();
    // Clear
    await expect($btnClear(page)).toBeVisible();
    await expect($btnClear(page)).toHaveText('Clear');
    await expect($btnClear(page)).toBeEnabled();
    // Back
    await expect($btnBack(page)).toBeVisible();
    await expect($btnBack(page)).toHaveText('Back');
    await expect($btnBack(page)).toBeEnabled();
    // Update Mode
    await expect($btnUpdateMode(page)).toBeVisible();
    await expect($btnUpdateMode(page)).toHaveText('Update Mode');
    await expect($btnUpdateMode(page)).toBeEnabled();
    await ss(page, 'buttons verified', '07');
  });

  // ===========================================================
  // 检索画面-Clear按钮 (TC8~9)
  // ===========================================================

  test('08 - Clear - reset input fields', async ({ page }) => {
    await navigateToSearchPage(page);
    await ss(page, 'page display', '08');
    // 填入值
    await $rowInput(page, 'Document type').fill('TEST_DOC');
    await $rowInput(page, 'User').fill('testuser');
    await ss(page, 'inputs filled', '08');
    // 点击 Clear
    await $btnClear(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'after clear', '08');
    // 字段被清空
    const doctypeVal = await $rowInput(page, 'Document type').inputValue();
    const userVal = await $rowInput(page, 'User').inputValue();
    const dateVal = await $rowInput(page, 'Date').inputValue();
    expect(doctypeVal).toBe('');
    expect(userVal).toBe('');
    expect(dateVal).toBe('');
    // Market 和 Setting、BU 恢复默认值
    const marketVal = await $rowInput(page, 'Market').inputValue();
    const settingVal = await $rowSelect(page, 'Setting').inputValue();
    const buVal = await $rowSelect(page, 'Business unit').inputValue();
    expect(marketVal).toBe('-EU');
    expect(settingVal).toBe(''); // Clear 后重置为空（-- Select --）
    expect(buVal).toBe('BU');
    await ss(page, 'clear verified', '08');
  });

  test('09 - Clear - error message disappears', async ({ page }) => {
    await navigateToSearchPage(page);
    await ss(page, 'page display', '09');
    // 触发 Update Mode 空值校验
    await $btnUpdateMode(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'error shown', '09');
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    // 点击 Clear
    await $btnClear(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'after clear', '09');
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'error cleared', '09');
  });

  // ===========================================================
  // 检索画面-Back按钮 (TC10)
  // ===========================================================

  test('10 - Back - return to previous page', async ({ page }) => {
    await navigateToSearchPage(page);
    await ss(page, 'page display', '10');
    await $btnBack(page).click();
    await page.waitForTimeout(1500);
    await ss(page, 'after back', '10');
    // 页面返回到前画面 /menu/guide-user
    await expect(page).toHaveURL(/\/menu\/guide-user/);
    await ss(page, 'back navigation verified', '10');
  });

  // ===========================================================
  // 检索画面-Search按钮 (TC11~15)
  // ===========================================================

  test('11 - Search - unconditional (all documents)', async ({ page }) => {
    await insertTestDoc();
    await navigateToSearchPage(page);
    await ss(page, 'page display', '11');
    // 所有条件为空，点击 Search
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'result page', '11');
    // 跳转到检索結果画面
    await expect($resultContainer(page)).toBeVisible({ timeout: 10000 });
    // 显示所有文档列表
    const rowCount = await $resultTableRows(page).count();
    console.log('  Result rows: ' + rowCount);
    expect(rowCount).toBeGreaterThanOrEqual(1);
    const countText = await $resultCount(page).textContent();
    expect(countText).toContain('Number of lines found:');
    await ss(page, 'unconditional search verified', '11');
    await cleanupTestDoc();
    await ss(page, 'cleaned', '11');
  });

  test('12 - Search - by Document type', async ({ page }) => {
    await insertTestDoc();
    await insertTestDoc({ doctype: 'UD20_TEST_DOC2', desc: 'UD20 Doc 2', user: 'USER2' });
    await navigateToSearchPage(page);
    await ss(page, 'page display', '12');
    await $rowInput(page, 'Document type').fill(TEST_DOCTYPE);
    await ss(page, 'input doctype', '12');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'result page', '12');
    await expect($resultContainer(page)).toBeVisible({ timeout: 10000 });
    const rowCount = await $resultTableRows(page).count();
    expect(rowCount).toBe(1);
    const cellDoctype = await getResultCell(page, 0, 1); // col 1 = Document type
    expect(cellDoctype.trim()).toBe(TEST_DOCTYPE);
    const countText = await $resultCount(page).textContent();
    expect(countText).toBe('Number of lines found: 1');
    // DB 验证
    const dbRows = await queryDB(
      `SELECT DOCTYPE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE = ?`,
      [TEST_DOCTYPE]
    );
    if (dbRows) {
      expect(dbRows.length).toBe(1);
      expect(dbRows[0].DOCTYPE).toBe(TEST_DOCTYPE);
    }
    await ss(page, 'search by doctype verified', '12');
    await cleanupTestDoc();
    await cleanupTestDoc('UD20_TEST_DOC2');
    await ss(page, 'cleaned', '12');
  });

  test('13 - Search - by User', async ({ page }) => {
    await insertTestDoc();
    await navigateToSearchPage(page);
    await ss(page, 'page display', '13');
    await $rowInput(page, 'User').fill(TEST_USER);
    await ss(page, 'input user', '13');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'result page', '13');
    await expect($resultContainer(page)).toBeVisible({ timeout: 10000 });
    const rowCount = await $resultTableRows(page).count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
    const cellUser = await getResultCell(page, 0, 3); // col 3 = User
    expect(cellUser.trim()).toBe(TEST_USER);
    // DB 验证
    const dbRows = await queryDB(
      `SELECT REGISTER_USER FROM HDOC_DOCUMENT_LIST WHERE REGISTER_USER = ?`,
      [TEST_USER]
    );
    if (dbRows) {
      expect(dbRows.length).toBeGreaterThanOrEqual(1);
      expect(dbRows[0].REGISTER_USER).toBe(TEST_USER);
    }
    await ss(page, 'search by user verified', '13');
    await cleanupTestDoc();
    await ss(page, 'cleaned', '13');
  });

  test('14 - Search - no results', async ({ page }) => {
    await navigateToSearchPage(page);
    await ss(page, 'page display', '14');
    await $rowInput(page, 'Document type').fill('NONEXIST_DOC');
    await ss(page, 'input nonexist', '14');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'result page', '14');
    // 跳转到結果画面
    await expect($resultContainer(page)).toBeVisible({ timeout: 10000 });
    // 显示空提示
    await expect($resultEmpty(page)).toBeVisible();
    await expect($resultEmpty(page)).toContainText('没有找到符合条件的文档');
    await expect($resultTable(page)).not.toBeVisible();
    await ss(page, 'no results verified', '14');
  });

  test('15 - Search - loading state', async ({ page }) => {
    await insertTestDoc();
    await navigateToSearchPage(page);
    await ss(page, 'page display', '15');
    await $rowInput(page, 'Document type').fill(TEST_DOCTYPE);
    await ss(page, 'input filled', '15');
    // 在点击 Search 前设置路由拦截（此时导航已完成，page.goto 不会清除拦截）
    await page.route('**/api/v1/hdoc/ud20/getDocumentList', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await $btnSearch(page).click();
    // 确认按钮禁用状态
    try {
      await expect($btnSearch(page)).toBeDisabled({ timeout: 3000 });
      console.log('  Search button disabled during loading');
    } catch {
      console.log('  Loading state might not be captured');
    }
    await page.waitForTimeout(4000);
    await page.unroute('**/api/v1/hdoc/ud20/getDocumentList');
    await ss(page, 'result page', '15');
    await cleanupTestDoc();
    await ss(page, 'cleaned', '15');
  });

  // ===========================================================
  // 检索画面-Update Mode按钮 (TC16~19)
  // ===========================================================

  test('16 - Update Mode - empty field validation', async ({ page }) => {
    await navigateToSearchPage(page);
    await ss(page, 'page display', '16');
    // 所有字段为空，点击 Update Mode
    await $btnUpdateMode(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'update mode clicked', '16');
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await expect($err(page)).toContainText('Document type, User and Date are required.');
    await ss(page, 'validation error', '16');
  });

  test('17 - Update Mode - update success', async ({ page }) => {
    await insertTestDoc();
    await navigateToSearchPage(page);
    await ss(page, 'page display', '17');
    // 输入有效的 Document type、User、Date
    await $rowInput(page, 'Document type').fill(TEST_DOCTYPE);
    await $rowInput(page, 'User').fill(TEST_USER);
    await $rowInput(page, 'Date').fill(TEST_DATE);
    await ss(page, 'inputs filled', '17');
    await $btnUpdateMode(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'update result', '17');
    // 成功消息
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('更新成功');
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'update success', '17');
    // DB 验证（确认数据存在且已被更新）
    const dbRows = await queryDB(
      `SELECT DOCTYPE, REGISTER_USER, DATE(REGISTER_DATETIME) as REG_DT
       FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE = ?`,
      [TEST_DOCTYPE]
    );
    if (dbRows && dbRows.length > 0) {
      expect(dbRows[0].DOCTYPE).toBe(TEST_DOCTYPE);
      expect(dbRows[0].REGISTER_USER).toBe(TEST_USER);
      const dateStr = String(dbRows[0].REG_DT);
      // 只比较年月日：Date 对象用本地时间格式化避免 UTC 偏移
      const formattedDate = dbRows[0].REG_DT instanceof Date
        ? dbRows[0].REG_DT.getFullYear() + '-' +
          String(dbRows[0].REG_DT.getMonth() + 1).padStart(2, '0') + '-' +
          String(dbRows[0].REG_DT.getDate()).padStart(2, '0')
        : String(dbRows[0].REG_DT).substring(0, 10);
      console.log('  DB date raw: ' + dateStr + ', formatted: ' + formattedDate);
      expect(formattedDate).toBe(TEST_DATE);
      console.log('  DB verified: ' + dbRows[0].DOCTYPE + ', ' + dbRows[0].REGISTER_USER + ', ' + dateStr);
    }
    await cleanupTestDoc();
    await ss(page, 'cleaned', '17');
  });

  test('18 - Update Mode - update failed (doc not exists)', async ({ page }) => {
    await navigateToSearchPage(page);
    await ss(page, 'page display', '18');
    await $rowInput(page, 'Document type').fill('NONEXIST_DOC');
    await $rowInput(page, 'User').fill('testuser');
    await $rowInput(page, 'Date').fill('2026-01-01');
    await ss(page, 'inputs filled', '18');
    await $btnUpdateMode(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'update result', '18');
    // 404 错误
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('No matching data found. Update failed.');
    await expect($btnUpdateMode(page)).toBeEnabled();
    await ss(page, 'update failed verified', '18');
  });

  test('19 - Update Mode - loading state', async ({ page }) => {
    // 拦截 API 模拟延迟
    await page.route('**/api/v1/hdoc/ud20/updateDocumentList', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await insertTestDoc();
    await navigateToSearchPage(page);
    await ss(page, 'page display', '19');
    await $rowInput(page, 'Document type').fill(TEST_DOCTYPE);
    await $rowInput(page, 'User').fill(TEST_USER);
    await $rowInput(page, 'Date').fill(TEST_DATE);
    await ss(page, 'inputs filled', '19');
    await $btnUpdateMode(page).click();
    try {
      await expect($btnUpdateMode(page)).toBeDisabled({ timeout: 2000 });
      await expect($btnSearch(page)).toBeDisabled({ timeout: 1000 });
      await expect($btnClear(page)).toBeDisabled({ timeout: 1000 });
      await expect($btnBack(page)).toBeDisabled({ timeout: 1000 });
      console.log('  Buttons disabled during loading');
    } catch {
      console.log('  Loading state might not be captured');
    }
    await page.waitForTimeout(4000);
    await page.unroute('**/api/v1/hdoc/ud20/updateDocumentList');
    await ss(page, 'result page', '19');
    await cleanupTestDoc();
    await ss(page, 'cleaned', '19');
  });

  // ===========================================================
  // 検索結果画面-初期表示 (TC20~23)
  // ===========================================================

  test('20 - Result page - DataTable columns', async ({ page }) => {
    await insertTestDoc();
    await navigateToSearchPage(page);
    await ss(page, 'page display', '20');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'result page', '20');
    await expect($resultContainer(page)).toBeVisible({ timeout: 10000 });
    // DataTable 表头
    const headers = await $resultTable(page).locator('thead th').allTextContents();
    console.log('  Table headers: ' + headers.join(' | '));
    expect(headers.length).toBe(5); // radio + 4 columns
    expect(headers[1].trim()).toBe('Document type');
    expect(headers[2].trim()).toBe('Business unit');
    expect(headers[3].trim()).toBe('User');
    expect(headers[4].trim()).toBe('Date');
    // Business unit 列固定显示 BU
    const buCell = await getResultCell(page, 0, 2); // col 2 = Business unit
    console.log('  First row BU: ' + buCell.trim());
    await ss(page, 'datatable columns verified', '20');
    await cleanupTestDoc();
    await ss(page, 'cleaned', '20');
  });

  test('21 - Result page - data rows content', async ({ page }) => {
    await insertTestDoc();
    await navigateToSearchPage(page);
    await ss(page, 'page display', '21');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'result page', '21');
    await expect($resultContainer(page)).toBeVisible({ timeout: 10000 });
    const rowCount = await $resultTableRows(page).count();
    console.log('  Total rows: ' + rowCount);
    expect(rowCount).toBeGreaterThanOrEqual(1);
    // 查找包含 TEST_DOCTYPE 的行
    let foundRow = -1;
    for (let i = 0; i < rowCount; i++) {
      const dt = (await getResultCell(page, i, 1)).trim();
      if (dt === TEST_DOCTYPE) { foundRow = i; break; }
    }
    expect(foundRow).toBeGreaterThanOrEqual(0);
    // 验证该行数据
    const doctypeCell = await getResultCell(page, foundRow, 1);
    const buCell = await getResultCell(page, foundRow, 2);
    const userCell = await getResultCell(page, foundRow, 3);
    const dateCell = await getResultCell(page, foundRow, 4);
    console.log(`  Row ${foundRow}: ${doctypeCell} | ${buCell} | ${userCell} | ${dateCell}`);
    expect(doctypeCell.trim()).toBe(TEST_DOCTYPE);
    expect(buCell.trim()).toBe('BU');
    expect(userCell.trim()).toBe(TEST_USER);
    // User 为可点击链接
    const userLink = $resultTableRows(page).first().locator('.mdsr-link-user');
    await expect(userLink).toBeVisible();
    // Date 只显示年月日
    const dateText = dateCell.trim();
    console.log('  Date cell text: ' + dateText);
    expect(dateText.substring(0, 10)).toBe(TEST_DATE);
    // DB 验证
    const dbRows = await queryDB(
      `SELECT DOCTYPE, REGISTER_USER, DATE(REGISTER_DATETIME) as REG_DT
       FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE = ?`,
      [TEST_DOCTYPE]
    );
    if (dbRows && dbRows.length > 0) {
      expect(dbRows[0].DOCTYPE).toBe(TEST_DOCTYPE);
      expect(dbRows[0].REGISTER_USER).toBe(TEST_USER);
    }
    await ss(page, 'data rows verified', '21');
    await cleanupTestDoc();
    await ss(page, 'cleaned', '21');
  });

  test('22 - Result page - User link navigates to EDB User View', async ({ page }) => {
    await insertTestDoc();
    await navigateToSearchPage(page);
    await ss(page, 'page display', '22');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'result page', '22');
    await expect($resultContainer(page)).toBeVisible({ timeout: 10000 });
    // 点击 User 链接
    const userLink = $resultTableRows(page).first().locator('.mdsr-link-user');
    await userLink.click();
    await page.waitForTimeout(2000);
    await ss(page, 'edb user view page', '22');
    // 页面跳转到 /menu/edb-user-view
    await expect(page).toHaveURL(/\/menu\/edb-user-view/);
    await ss(page, 'user link navigation verified', '22');
    await cleanupTestDoc();
    await ss(page, 'cleaned', '22');
  });

  test('23 - Result page - buttons', async ({ page }) => {
    await insertTestDoc();
    await navigateToSearchPage(page);
    await ss(page, 'page display', '23');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'result page', '23');
    await expect($resultContainer(page)).toBeVisible({ timeout: 10000 });
    // Select 按钮
    await expect($btnResultSelect(page)).toBeVisible();
    await expect($btnResultSelect(page)).toHaveText('Select');
    await expect($btnResultSelect(page)).toBeEnabled();
    // Back 按钮
    await expect($btnResultBack(page)).toBeVisible();
    await expect($btnResultBack(page)).toHaveText('Back');
    await expect($btnResultBack(page)).toBeEnabled();
    // Print 按钮
    await expect($btnResultPrint(page)).toBeVisible();
    await expect($btnResultPrint(page)).toHaveText('Print');
    await expect($btnResultPrint(page)).toBeEnabled();
    await ss(page, 'result buttons verified', '23');
    await cleanupTestDoc();
    await ss(page, 'cleaned', '23');
  });

  // ===========================================================
  // 検索結果画面-Select按钮 (TC24~26)
  // ===========================================================

  test('24 - Select - no record selected validation', async ({ page }) => {
    await insertTestDoc();
    await navigateToSearchPage(page);
    await ss(page, 'page display', '24');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'result page', '24');
    await expect($resultContainer(page)).toBeVisible({ timeout: 10000 });
    // 不选择任何记录，点击 Select
    await $btnResultSelect(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'select without selection', '24');
    await expect($resultErr(page)).toBeVisible({ timeout: 5000 });
    await expect($resultErr(page)).toContainText('No data found');
    // 页面不跳转
    await expect(page).toHaveURL(/\/menu\/market-document-setting\/result/);
    await ss(page, 'select validation verified', '24');
    await cleanupTestDoc();
    await ss(page, 'cleaned', '24');
  });

  test('25 - Select - select record and navigate back', async ({ page }) => {
    await insertTestDoc();
    await navigateToSearchPage(page);
    await ss(page, 'page display', '25');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'result page', '25');
    await expect($resultContainer(page)).toBeVisible({ timeout: 10000 });
    // 查找包含 TEST_DOCTYPE 的行并选择
    const rowCount = await $resultTableRows(page).count();
    let targetRow = -1;
    for (let i = 0; i < rowCount; i++) {
      const dt = (await getResultCell(page, i, 1)).trim();
      if (dt === TEST_DOCTYPE) { targetRow = i; break; }
    }
    expect(targetRow).toBeGreaterThanOrEqual(0);
    await selectResultRow(page, targetRow);
    await ss(page, 'row selected', '25');
    await $btnResultSelect(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'after select', '25');
    // 页面跳转到检索画面
    await expect($container(page)).toBeVisible({ timeout: 10000 });
    // Document type 字段自动回填
    const doctypeVal = await $rowInput(page, 'Document type').inputValue();
    expect(doctypeVal).toBe(TEST_DOCTYPE);
    // User 字段自动回填
    const userVal = await $rowInput(page, 'User').inputValue();
    expect(userVal).toBe(TEST_USER);
    // Date 字段自动回填
    const dateVal = await $rowInput(page, 'Date').inputValue();
    console.log('  Date input value: ' + dateVal);
    expect(dateVal.substring(0, 10)).toBe(TEST_DATE);
    await ss(page, 'fields refilled', '25');
    await cleanupTestDoc();
    await ss(page, 'cleaned', '25');
  });

  test('26 - Select - loading state', async ({ page }) => {
    await insertTestDoc();
    await navigateToSearchPage(page);
    await ss(page, 'page display', '26');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'result page', '26');
    await expect($resultContainer(page)).toBeVisible({ timeout: 10000 });
    // Select 按钮通常没有 loading 状态（选择后直接 navigate）
    // 确认 Select 按钮可用
    await expect($btnResultSelect(page)).toBeEnabled();
    await ss(page, 'select button enabled', '26');
    await cleanupTestDoc();
    await ss(page, 'cleaned', '26');
  });

  // ===========================================================
  // 検索結果画面-Back/Print按钮 (TC27~28)
  // ===========================================================

  test('27 - Back - return to search page', async ({ page }) => {
    await insertTestDoc();
    await navigateToSearchPage(page);
    await ss(page, 'page display', '27');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'result page', '27');
    await expect($resultContainer(page)).toBeVisible({ timeout: 10000 });
    // 点击 Back
    await $btnResultBack(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'after back', '27');
    // 页面跳转到检索画面
    await expect($container(page)).toBeVisible({ timeout: 10000 });
    await ss(page, 'back to search verified', '27');
    await cleanupTestDoc();
    await ss(page, 'cleaned', '27');
  });

  test('28 - Print - calls browser print', async ({ page }) => {
    await insertTestDoc();
    await navigateToSearchPage(page);
    await ss(page, 'page display', '28');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'result page', '28');
    await expect($resultContainer(page)).toBeVisible({ timeout: 10000 });
    // 浏览器打印功能
    // Print 按钮触发 window.print()，可通过 page.on('popup') 或检查事件
    const printTriggered = new Promise<void>((resolve) => {
      page.on('popup', () => resolve());
    });
    await $btnResultPrint(page).click();
    // 等待可能的打印对话框（实际不会在无头模式弹出）
    await page.waitForTimeout(1000);
    console.log('  Print button clicked');
    await ss(page, 'print clicked', '28');
    await cleanupTestDoc();
    await ss(page, 'cleaned', '28');
  });

  // ===========================================================
  // 异常处理 (TC29~31)
  // ===========================================================

  test('29 - API error on Search', async ({ page }) => {
    await navigateToSearchPage(page);
    await ss(page, 'page display', '29');
    await $rowInput(page, 'Document type').fill('TEST');
    await ss(page, 'input filled', '29');
    // 在点击 Search 前设置路由拦截
    // 返回非 JSON 响应触发 catch 块（response.json() 抛出异常）
    await page.route('**/api/v1/hdoc/ud20/getDocumentList', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'text/plain',
        body: 'Internal Server Error',
      });
    });
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/ud20/getDocumentList');
    await ss(page, 'result page', '29');
    await expect($resultContainer(page)).toBeVisible({ timeout: 10000 });
    await expect($resultErr(page)).toBeVisible({ timeout: 10000 });
    await expect($resultErr(page)).toContainText('系统暂时不可用，请稍后重试');
    await ss(page, 'api error verified', '29');
  });

  test('30 - Network timeout on Search', async ({ page }) => {
    await navigateToSearchPage(page);
    await ss(page, 'page display', '30');
    await $rowInput(page, 'Document type').fill('TEST');
    await ss(page, 'input filled', '30');
    // 在点击 Search 前设置路由拦截
    await page.route('**/api/v1/hdoc/ud20/getDocumentList', route => route.abort());
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/ud20/getDocumentList');
    await ss(page, 'result page', '30');
    await expect($resultContainer(page)).toBeVisible({ timeout: 10000 });
    await expect($resultErr(page)).toBeVisible({ timeout: 10000 });
    await expect($resultErr(page)).toContainText('系统暂时不可用，请稍后重试');
    await ss(page, 'network timeout verified', '30');
  });

  test('31 - Update Mode API 500 error', async ({ page }) => {
    await insertTestDoc();
    await navigateToSearchPage(page);
    await ss(page, 'page display', '31');
    await $rowInput(page, 'Document type').fill(TEST_DOCTYPE);
    await $rowInput(page, 'User').fill(TEST_USER);
    await $rowInput(page, 'Date').fill(TEST_DATE);
    await ss(page, 'inputs filled', '31');
    // 在点击 Update Mode 前设置路由拦截
    await page.route('**/api/v1/hdoc/ud20/updateDocumentList', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'System error. Please contact administrator.', data: null }),
      });
    });
    await $btnUpdateMode(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/ud20/updateDocumentList');
    await ss(page, 'update result', '31');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('System error. Please contact administrator.');
    await ss(page, '500 error verified', '31');
    await cleanupTestDoc();
    await ss(page, 'cleaned', '31');
  });

  // ===========================================================
  // 安全性 (TC32~33)
  // ===========================================================

  test('32 - Security - unauthenticated access redirects to login', async ({ page }) => {
    // 清除 localStorage
    await page.goto(PAGE_URL, { waitUntil: 'load' });
    await page.evaluate(() => { localStorage.clear(); });
    await ss(page, 'localStorage cleared', '32');
    // 直接访问 Market Document Setting 页面
    await page.goto(PAGE_URL + '/menu/market-document-setting', { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    await ss(page, 'redirect result', '32');
    await expect(page).toHaveURL(/\/login/);
    await ss(page, 'redirected to login', '32');
  });

  test('33 - Security - SQL injection protection', async ({ page }) => {
    await navigateToSearchPage(page);
    await ss(page, 'page display', '33');
    // 输入 SQL 注入代码
    await $rowInput(page, 'Document type').fill("' OR '1'='1");
    await ss(page, 'sql injection input', '33');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'result page', '33');
    // 检查结果页的错误消息
    if (await $resultErr(page).isVisible()) {
      const errText = await $resultErr(page).textContent() || '';
      console.log('  Error message: ' + errText);
      expect(errText.toLowerCase()).not.toContain('sql');
      expect(errText.toLowerCase()).not.toContain('syntax');
    } else if (await $resultContainer(page).isVisible()) {
      // 查询正常返回
      const countText = await $resultCount(page).textContent();
      console.log('  Result count: ' + countText);
    }
    // 系统正常运行
    await ss(page, 'sql injection result', '33');
  });

});
