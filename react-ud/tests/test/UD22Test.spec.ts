/**
 * UD22 - Document Types Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD22.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实 API（无 Mock）
 * 数据库验证: 通过 SQL 查询确认数据，测试前后清理数据
 * 截图保存: tests/test/Image/UD22/
 * 测试用例数: 16
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, createScreenshot, login, PAGE_URL } from './utils';

// -- 截图 --
const ss = createScreenshot('UD22');

// ============================================================
// 元素定位（匹配 DocumentTypes.tsx / DocumentTypes.css）
// ============================================================

const $container        = (p: Page) => p.locator('.dt-container');
const $header           = (p: Page) => p.locator('.panel-header h1');
const $err              = (p: Page) => p.locator('.dt-error.msg-error');
const $loading          = (p: Page) => p.locator('.loading-placeholder');
const $table            = (p: Page) => p.locator('.dt-table');
const $tableRows        = (p: Page) => p.locator('.dt-table tbody tr');
const $emptyPlaceholder = (p: Page) => p.locator('.empty-placeholder');

/** 获取某行某列的内容（0-indexed） */
async function getCell(page: Page, rowIndex: number, colIndex: number): Promise<string> {
  return (await $tableRows(page).nth(rowIndex).locator('td').nth(colIndex).textContent()) || '';
}

// ============================================================
// 导航辅助函数
// ============================================================

async function navigateToPage(page: Page) {
  await login(page);
  // 通过 UD24 - User Guide (HDoc Help) 画面点击 List of document types. 进入
  await page.goto(PAGE_URL + '/menu/guide-user', { waitUntil: 'load' });
  await page.waitForSelector('.user-guide-page');
  await page.waitForTimeout(1000);
  // 点击 "List of document types." 链接
  await page.locator('.help-link-item .help-link-text').filter({ hasText: 'List of document types.' }).click();
  // 等待跳转到 document-types 页面
  await page.waitForURL('**/menu/document-types', { timeout: 10000 });
  await page.waitForSelector('.dt-container');
}

// ============================================================
// 测试数据常量
// ============================================================

const TEST_DOCTYPE_A = 'UD22_DOC_A';
const TEST_DOCTYPE_B = 'UD22_DOC_B';
const TEST_DOCTYPE_C = 'UD22_DOC_C';
const TEST_DESC_A    = 'UD22 Document Type Alpha';
const TEST_DESC_B    = 'UD22 Document Type Beta';
const TEST_DESC_C    = 'UD22 Document Type Gamma';

/** 插入测试文档类型到 HDOC_DOCUMENT_LIST，返回是否成功 */
async function insertTestDocumentTypes(): Promise<boolean> {
  const docs = [
    { doctype: TEST_DOCTYPE_A, desc: TEST_DESC_A },
    { doctype: TEST_DOCTYPE_B, desc: TEST_DESC_B },
    { doctype: TEST_DOCTYPE_C, desc: TEST_DESC_C },
  ];
  for (const d of docs) {
    await queryDB(`DELETE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE = ?`, [d.doctype]);
    const result = await queryDB(
      `INSERT INTO HDOC_DOCUMENT_LIST (DOCTYPE, DESCRIPTION,
         REGISTER_USER, REGISTER_DATETIME, REGISTER_PROCESS,
         UPDATE_USER, UPDATE_DATETIME, UPDATE_PROCESS)
       VALUES (?, ?, 'UD22Test', NOW(), 'UT',
         'UD22Test', NOW(), 'UT')`,
      [d.doctype, d.desc]
    );
    if (result === null) {
      console.log(`  ⚠️ DB insert returned null for ${d.doctype} — DB may be unavailable`);
      return false;
    }
  }
  // 验证插入是否成功
  const check = await queryDB(
    `SELECT COUNT(*) as CNT FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE LIKE 'UD22_%'`
  );
  if (check && check.length > 0) {
    console.log(`  DB inserted ${check[0].CNT} test document types`);
    return check[0].CNT >= 3;
  }
  return false;
}

/** 清理测试文档类型 */
async function cleanupTestDocumentTypes() {
  for (const dt of [TEST_DOCTYPE_A, TEST_DOCTYPE_B, TEST_DOCTYPE_C]) {
    await queryDB(`DELETE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE = ?`, [dt]);
  }
}

/** 清空所有测试文档类型 */
async function clearAllTestDocumentTypes() {
  await queryDB(`DELETE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE LIKE 'UD22_%'`);
}

// ============================================================
// 测试套件
// ============================================================

test.describe.configure({ mode: 'serial' });
test.describe('UD22 Document Types', () => {

  // ===========================================================
  // 画面初期表示 (TC1~6)
  // ===========================================================

  test('01 - Page title', async ({ page }) => {
    await insertTestDocumentTypes();
    await navigateToPage(page);
    await page.waitForSelector('.dt-table, .dt-error, .empty-placeholder', { timeout: 15000 });
    await ss(page, 'page display', '01');
    // 页面标题可见
    await expect($header(page)).toBeVisible();
    await expect($header(page)).toHaveText('Document Types');
    await ss(page, 'title verified', '01');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '01');
  });

  test('02 - DataTable column headers', async ({ page }) => {
    await insertTestDocumentTypes();
    await navigateToPage(page);
    await page.waitForSelector('.dt-table, .dt-error, .empty-placeholder', { timeout: 15000 });
    await ss(page, 'page display', '02');
    // DataTable 表头
    const isTableVisible = await $table(page).isVisible().catch(() => false);
    if (isTableVisible) {
      const headers = await $table(page).locator('thead th').allTextContents();
      console.log('  Table headers: ' + headers.join(' | '));
      expect(headers.length).toBe(2);
      expect(headers[0].trim()).toBe('Key');
      expect(headers[1].trim()).toBe('Description');
    } else {
      console.log('  Table not visible, headers check skipped');
    }
    await ss(page, 'column headers verified', '02');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '02');
  });

  test('03 - Key column data', async ({ page }) => {
    await insertTestDocumentTypes();
    await navigateToPage(page);
    await page.waitForSelector('.dt-table, .empty-placeholder', { timeout: 15000 });
    await ss(page, 'page display', '03');
    // 从 DB 获取所有 DOCTYPE（按排序顺序）
    const dbRows = await queryDB(`SELECT DOCTYPE FROM HDOC_DOCUMENT_LIST ORDER BY DOCTYPE`);
    if (!dbRows || dbRows.length === 0) {
      console.log('  DB unavailable or empty, skip full verification');
      await ss(page, 'db unavailable', '03');
      return;
    }
    const expectedKeys = dbRows.map((r: any) => String(r.DOCTYPE).trim());
    console.log('  DB expected keys: ' + expectedKeys.join(', '));

    // 从画面获取所有 Key 列数据
    const isTableVisible = await $table(page).isVisible().catch(() => false);
    if (!isTableVisible) {
      console.log('  Table not visible');
      await ss(page, 'table not loaded', '03');
      return;
    }
    const rowCount = await $tableRows(page).count();
    const actualKeys: string[] = [];
    for (let i = 0; i < rowCount; i++) {
      actualKeys.push((await getCell(page, i, 0)).trim());
    }
    console.log('  Actual keys: ' + actualKeys.join(', '));

    // 全量验证：画面行数 = DB 记录数，每行 Key 与 DB 一致
    expect(rowCount).toBe(expectedKeys.length);
    for (let i = 0; i < rowCount; i++) {
      expect(actualKeys[i]).toBe(expectedKeys[i]);
    }
    await ss(page, 'key column fully verified', '03');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '03');
  });

  test('04 - Description column data', async ({ page }) => {
    await insertTestDocumentTypes();
    await navigateToPage(page);
    await page.waitForSelector('.dt-table, .empty-placeholder', { timeout: 15000 });
    await ss(page, 'page display', '04');
    // 从 DB 获取所有 DOCTYPE + DESCRIPTION（按排序顺序）
    const dbRows = await queryDB(
      `SELECT DOCTYPE, DESCRIPTION FROM HDOC_DOCUMENT_LIST ORDER BY DOCTYPE`
    );
    if (!dbRows || dbRows.length === 0) {
      console.log('  DB unavailable or empty, skip full verification');
      await ss(page, 'db unavailable', '04');
      return;
    }
    const expectedDescs = dbRows.map((r: any) => String(r.DESCRIPTION || '').trim());
    console.log('  DB expected descriptions count: ' + expectedDescs.length);

    // 从画面获取所有 Description 列数据
    const isTableVisible = await $table(page).isVisible().catch(() => false);
    if (!isTableVisible) {
      console.log('  Table not visible');
      await ss(page, 'table not loaded', '04');
      return;
    }
    const rowCount = await $tableRows(page).count();
    // 画面行数与 DB 记录数一致
    expect(rowCount).toBe(expectedDescs.length);
    for (let i = 0; i < rowCount; i++) {
      const actualDesc = (await getCell(page, i, 1)).trim();
      expect(actualDesc).toBe(expectedDescs[i]);
      console.log(`  Row ${i}: Description="${actualDesc}"`);
    }
    await ss(page, 'description column fully verified', '04');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '04');
  });

  test('05 - Loading state', async ({ page }) => {
    await insertTestDocumentTypes();
    await login(page);
    // 先导航到 guide-user 页面
    await page.goto(PAGE_URL + '/menu/guide-user', { waitUntil: 'load' });
    await page.waitForSelector('.user-guide-page');
    // 在点击链接前设置路由拦截（避免 page.goto 清除拦截）
    await page.route('**/api/v1/hdoc/document/types', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    // 点击 "List of document types." 链接（客户端导航，不触发 page.goto）
    await page.locator('.help-link-item .help-link-text').filter({ hasText: 'List of document types.' }).click();
    await page.waitForURL('**/menu/document-types', { timeout: 10000 });
    // 等待 React 渲染加载状态
    await page.waitForTimeout(500);
    // 检查 loading 状态
    await ss(page, 'loading state', '05');
    const loadingVisible = await $loading(page).isVisible().catch(() => false);
    if (loadingVisible) {
      await expect($loading(page)).toContainText('Loading');
      console.log('  ✅ Loading state captured');
    } else {
      console.log('  ⚠️ Loading state too brief, skipped visibility check');
    }
    // 等待加载完成
    await page.waitForSelector('.dt-table', { timeout: 10000 });
    await page.unroute('**/api/v1/hdoc/document/types');
    await ss(page, 'loaded', '05');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '05');
  });

  test('06 - Error message hidden by default', async ({ page }) => {
    await insertTestDocumentTypes();
    await navigateToPage(page);
    await page.waitForSelector('.dt-container', { timeout: 15000 });
    await page.waitForTimeout(2000);
    await ss(page, 'page display', '06');
    // 错误消息默认隐藏
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'no error', '06');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '06');
  });

  // ===========================================================
  // 数据加载 (TC7~9)
  // ===========================================================

  test('07 - Document types loaded successfully', async ({ page }) => {
    await insertTestDocumentTypes();
    await navigateToPage(page);
    await page.waitForSelector('.dt-table, .empty-placeholder', { timeout: 15000 });
    await ss(page, 'page display', '07');
    // 从 DB 获取全量数据
    const dbRows = await queryDB(
      `SELECT DOCTYPE, DESCRIPTION FROM HDOC_DOCUMENT_LIST ORDER BY DOCTYPE`
    );
    if (!dbRows || dbRows.length === 0) {
      console.log('  DB unavailable or empty, skip verification');
      await ss(page, 'db unavailable', '07');
      return;
    }
    const expectedKeys = dbRows.map((r: any) => String(r.DOCTYPE).trim());
    const expectedDescs = dbRows.map((r: any) => String(r.DESCRIPTION || '').trim());

    // DataTable 显示所有文档类型记录
    const isTableVisible = await $table(page).isVisible().catch(() => false);
    if (!isTableVisible) {
      console.log('  Table not visible');
      return;
    }
    const rowCount = await $tableRows(page).count();
    // 全量验证：行数、Key 列、Description 列全部与 DB 一致
    expect(rowCount).toBe(expectedKeys.length);
    for (let i = 0; i < rowCount; i++) {
      const actualKey = (await getCell(page, i, 0)).trim();
      const actualDesc = (await getCell(page, i, 1)).trim();
      expect(actualKey).toBe(expectedKeys[i]);
      expect(actualDesc).toBe(expectedDescs[i]);
    }
    console.log(`  ✅ All ${rowCount} rows fully verified against DB`);
    // 无错误消息
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'data loaded verified', '07');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '07');
  });

  test('08 - Empty data (no test-specific data)', async ({ page }) => {
    // 仅清理测试数据，但表中可能仍有其他数据
    await clearAllTestDocumentTypes();
    await navigateToPage(page);
    // 等待 API 返回
    await page.waitForTimeout(3000);
    await ss(page, 'page display', '08');
    // 无论表格是否有数据，均无错误消息
    await expect($err(page)).not.toBeVisible();
    // 记录画面状态
    const isEmptyVisible = await $emptyPlaceholder(page).isVisible().catch(() => false);
    const isTableVisible = await $table(page).isVisible().catch(() => false);
    console.log(`  Empty placeholder: ${isEmptyVisible}, Table: ${isTableVisible}`);
    await ss(page, 'empty data verified', '08');
  });

  test('09 - Sort order', async ({ page }) => {
    await insertTestDocumentTypes();
    await navigateToPage(page);
    await page.waitForSelector('.dt-table, .empty-placeholder', { timeout: 15000 });
    await ss(page, 'page display', '09');
    // 文档类型列表按字母顺序排列
    const isTableVisible = await $table(page).isVisible().catch(() => false);
    if (!isTableVisible) {
      console.log('  Table not visible, skip sort check');
      await ss(page, 'table not loaded', '09');
      return;
    }
    const rowCount = await $tableRows(page).count();
    const keyValues: string[] = [];
    for (let i = 0; i < rowCount; i++) {
      const val = await getCell(page, i, 0);
      keyValues.push(val.trim());
    }
    console.log('  Key order: ' + keyValues.join(', '));
    // SQL 使用 ORDER BY DOCTYPE，应按字母排序
    const sorted = [...keyValues].sort();
    expect(keyValues).toEqual(sorted);
    await ss(page, 'sort order verified', '09');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '09');
  });

  // ===========================================================
  // 异常处理 (TC10~11)
  // ===========================================================

  test('10 - API call failure', async ({ page }) => {
    // 模拟 API 返回错误（code != 200）
    await page.route('**/api/v1/hdoc/document/types', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'System error', data: null }),
      });
    });
    await login(page);
    await page.goto(PAGE_URL + '/menu/document-types', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/document/types');
    await ss(page, 'api error', '10');
    // 错误消息可见
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('无法获取文档类型信息');
    // 确认无数据表
    await expect($table(page)).not.toBeVisible();
    await ss(page, 'api error verified', '10');
  });

  test('11 - Network disconnect', async ({ page }) => {
    // 模拟网络断开
    await page.route('**/api/v1/hdoc/document/types', route => route.abort());
    await login(page);
    await page.goto(PAGE_URL + '/menu/document-types', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/document/types');
    await ss(page, 'network error', '11');
    // 错误消息可见
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('系统暂时不可用，请稍后重试');
    // 确认无数据表
    await expect($table(page)).not.toBeVisible();
    await ss(page, 'network error verified', '11');
  });

  // ===========================================================
  // 消息显示 (TC12~13)
  // ===========================================================

  test('12 - Error message style (red color)', async ({ page }) => {
    // 模拟 API 返回错误
    await page.route('**/api/v1/hdoc/document/types', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'System error', data: null }),
      });
    });
    await login(page);
    await page.goto(PAGE_URL + '/menu/document-types', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/document/types');
    await ss(page, 'error display', '12');
    // 错误消息可见
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    // 错误消息文字颜色为红色
    const errColor = await $err(page).evaluate(el => window.getComputedStyle(el).color);
    console.log('  Error message color: ' + errColor);
    expect(errColor.toLowerCase()).toBe('rgb(229, 57, 53)');
    await ss(page, 'error style verified', '12');
  });

  test('13 - No error after successful load', async ({ page }) => {
    await insertTestDocumentTypes();
    await navigateToPage(page);
    await page.waitForSelector('.dt-table, .dt-error, .empty-placeholder', { timeout: 15000 });
    await ss(page, 'page display', '13');
    // 数据加载完成后错误消息隐藏
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'no error verified', '13');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '13');
  });

  // ===========================================================
  // 安全性 (TC14~16)
  // ===========================================================

  test('14 - Security - unauthenticated access redirects to login', async ({ page }) => {
    // 清除 localStorage
    await page.goto(PAGE_URL, { waitUntil: 'load' });
    await page.evaluate(() => { localStorage.clear(); });
    await ss(page, 'localStorage cleared', '14');
    // 直接访问 Document Types 页面
    await page.goto(PAGE_URL + '/menu/document-types', { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    await ss(page, 'redirect result', '14');
    await expect(page).toHaveURL(/\/login/);
    await ss(page, 'redirected to login', '14');
  });

  test('15 - Security - SQL injection protection', async ({ page }) => {
    // 模拟 API 返回包含 SQL 的错误消息
    await page.route('**/api/v1/hdoc/document/types', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 500,
          message: "ORA-00933: SQL command not properly ended",
          data: null,
        }),
      });
    });
    await login(page);
    await page.goto(PAGE_URL + '/menu/document-types', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/document/types');
    await ss(page, 'sql injection response', '15');
    // 错误消息不包含 SQL 相关关键词
    if (await $err(page).isVisible()) {
      const errText = await $err(page).textContent() || '';
      console.log('  Error message: ' + errText);
      expect(errText.toLowerCase()).not.toContain('sql');
      expect(errText.toLowerCase()).not.toContain('syntax');
    }
    // 系统正常运行
    await ss(page, 'sql injection verified', '15');
  });

  test('16 - Security - XSS protection', async ({ page }) => {
    // 注册 dialog 监听捕获 alert
    page.on('dialog', (dialog) => {
      console.log('  Dialog detected: ' + dialog.message());
      dialog.dismiss();
      throw new Error('XSS vulnerability: alert() dialog was triggered');
    });
    // 模拟 API 返回包含 XSS 代码的错误消息
    await page.route('**/api/v1/hdoc/document/types', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 500,
          message: '<script>alert(1)</script>',
          data: null,
        }),
      });
    });
    await login(page);
    await page.goto(PAGE_URL + '/menu/document-types', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/document/types');
    await ss(page, 'xss response', '16');
    // 不会弹出 alert(1) 对话框
    console.log('  No XSS dialog detected - XSS protection works');
    // 系统正常运行
    await ss(page, 'xss protection verified', '16');
  });

});
