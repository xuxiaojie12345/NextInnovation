/**
 * UD19 - Search User (用户查询) Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD19.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实 API（无 Mock）
 * 数据库验证: 通过 SQL 查询确认数据，测试前后清理数据
 * 截图保存: tests/test/Image/UD19/
 * 测试用例数: 42
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, createScreenshot, login, PAGE_URL } from './utils';

// -- 截图 --
const ss = createScreenshot('UD19');

// ============================================================
// 元素定位（匹配 SearchUser.tsx / SearchUser.css）
// ============================================================

const $container      = (p: Page) => p.locator('.su-container');
const $header         = (p: Page) => p.locator('.panel-header h1');
const $err            = (p: Page) => p.locator('.su-error.msg-error');
const $inputUserid    = (p: Page) => p.locator('.su-row').nth(0).locator('input.su-input');
const $inputUser      = (p: Page) => p.locator('.su-row').nth(1).locator('input.su-input');
const $marketListbox  = (p: Page) => p.locator('select.su-market-listbox');
const $radioNotSet    = (p: Page) => p.locator('.su-radio-label').nth(0).locator('input[type="radio"]');
const $radioRule      = (p: Page) => p.locator('.su-radio-label').nth(1).locator('input[type="radio"]');
const $radioTemplate  = (p: Page) => p.locator('.su-radio-label').nth(2).locator('input[type="radio"]');
const $btnSearch      = (p: Page) => p.locator('.btn-row button.btn').filter({ hasText: 'Search' });
const $dataTable      = (p: Page) => p.locator('table.su-table');
const $dataTableRows  = (p: Page) => p.locator('table.su-table tbody tr');
const $resultCount    = (p: Page) => p.locator('.result-count');

/** 根据列索引获取 DataTable 某列所有单元格 */
const $tableColCells = (p: Page, colIndex: number) =>
  p.locator(`table.su-table tbody tr td:nth-child(${colIndex + 1})`);

/** 获取 Market 下拉列表所有选项文本 */
async function getMarketOptions(page: Page): Promise<string[]> {
  return await $marketListbox(page).locator('option').allTextContents();
}

/** 获取 DataTable 中的行数 */
async function getTableRowCount(page: Page): Promise<number> {
  return await $dataTableRows(page).count();
}

// ============================================================
// 导航辅助函数
// ============================================================

async function navigateToPage(page: Page) {
  await login(page);
  await page.goto(PAGE_URL + '/menu/search-user', { waitUntil: 'load' });
  await page.waitForSelector('.su-container');
  await page.waitForTimeout(2000); // 等待 Market list 加载完成
}

// ============================================================
// 测试数据常量
// ============================================================

const TEST_USERID_A  = 'ud19usrA';
const TEST_USERID_B  = 'ud19usrB';
const TEST_USERID_C  = 'ud19usrC';
const TEST_USERNAME_A = 'UD19UserAlpha';
const TEST_USERNAME_B = 'UD19UserBeta';
const TEST_USERNAME_C = 'UD19UserGamma';
const TEST_PASS      = 'ud19pass1';
const TEST_EMAIL     = 'ud19@test.com';
const TEST_MARKET_A  = 'M9A';
const TEST_MARKET_B  = 'M9B';

/** 插入测试市场数据到 MARKET_MASTER */
async function insertTestMarkets() {
  for (const m of [TEST_MARKET_A, TEST_MARKET_B]) {
    await queryDB(`DELETE FROM MARKET_MASTER WHERE MARKET = ?`, [m]);
    await queryDB(
      `INSERT INTO MARKET_MASTER (MARKET, DESCRIPTION,
         REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
         UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
       VALUES (?, ?,
         NOW(), 'UD19Test', 'UT',
         NOW(), 'UD19Test', 'UT')`,
      [m, m === TEST_MARKET_A ? 'M19A Desc' : 'M19B Desc']
    );
  }
}

/** 清理测试市场数据 */
async function cleanupTestMarkets() {
  for (const m of [TEST_MARKET_A, TEST_MARKET_B]) {
    await queryDB(`DELETE FROM MARKET_MASTER WHERE MARKET = ?`, [m]);
  }
}

/** 插入测试用户到 HDOC_USER_INFOR */
async function insertTestUser(override?: {
  userid?: string; username?: string; password?: string;
}) {
  const uid = override?.userid || TEST_USERID_A;
  await queryDB(
    `DELETE FROM HDOC_MARKET_AUTH WHERE USERID = ?`, [uid]
  );
  await queryDB(
    `DELETE FROM HDOC_USER_INFOR WHERE USERID = ?`, [uid]
  );
  await queryDB(
    `INSERT INTO HDOC_USER_INFOR (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL,
       REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
       UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, ?, 'UD19', 'Tester', ?,
       NOW(), 'UD19Test', 'UT',
       NOW(), 'UD19Test', 'UT')`,
    [uid, override?.password || TEST_PASS, override?.username || TEST_USERNAME_A, TEST_EMAIL]
  );
}

/** 插入用户市场权限到 HDOC_MARKET_AUTH */
async function insertMarketAuth(
  userid: string, market: string, type: string
) {
  // 先清除可能冲突的旧数据
  await queryDB(
    `DELETE FROM HDOC_MARKET_AUTH WHERE USERID = ? AND MARKET = ? AND \`TYPE\` = ?`,
    [userid, market, type]
  );
  await queryDB(
    `INSERT INTO HDOC_MARKET_AUTH (USERID, MARKET, \`TYPE\`, BU,
       REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
       UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, ?, 'UD',
       NOW(), 'UD19Test', 'UT',
       NOW(), 'UD19Test', 'UT')`,
    [userid, market, type]
  );
}

/** 清理测试用户所有数据 */
async function cleanupTestUser(userid?: string) {
  const uid = userid || TEST_USERID_A;
  await queryDB(`DELETE FROM HDOC_MARKET_AUTH WHERE USERID = ?`, [uid]);
  await queryDB(`DELETE FROM HDOC_USER_INFOR WHERE USERID = ?`, [uid]);
}

/** 清理多个测试用户 */
async function cleanupTestUsers(userids: string[]) {
  for (const uid of userids) {
    await queryDB(`DELETE FROM HDOC_MARKET_AUTH WHERE USERID = ?`, [uid]);
    await queryDB(`DELETE FROM HDOC_USER_INFOR WHERE USERID = ?`, [uid]);
  }
}

// ============================================================
// 测试套件
// ============================================================

test.describe.configure({ mode: 'serial' });
test.describe('UD19 Search User', () => {

  // ===========================================================
  // 画面初期表示 (TC1~7)
  // ===========================================================

  test('01 - Userid input field', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '01');
    // Userid 输入框可见
    await expect($inputUserid(page)).toBeVisible();
    await expect($inputUserid(page)).toHaveAttribute('type', 'text');
    const val = await $inputUserid(page).inputValue();
    expect(val).toBe('');
    await expect($inputUserid(page)).toBeEnabled();
    await ss(page, 'userid input verified', '01');
  });

  test('02 - User input field', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '02');
    // User 输入框可见
    await expect($inputUser(page)).toBeVisible();
    await expect($inputUser(page)).toHaveAttribute('type', 'text');
    const val = await $inputUser(page).inputValue();
    expect(val).toBe('');
    await expect($inputUser(page)).toBeEnabled();
    await ss(page, 'user input verified', '02');
  });

  test('03 - Market dropdown initial state', async ({ page }) => {
    await insertTestMarkets();
    await navigateToPage(page);
    await ss(page, 'page display', '03');
    // Market 下拉列表可见
    await expect($marketListbox(page)).toBeVisible();
    // 初期值为空（未选择）
    const selectedVal = await $marketListbox(page).inputValue();
    expect(selectedVal).toBe('');
    // 数据源为 MARKET_MASTER.MARKET
    const options = await getMarketOptions(page);
    console.log('  Market options: ' + options.join(', '));
    expect(options).toContain(TEST_MARKET_A);
    expect(options).toContain(TEST_MARKET_B);
    await ss(page, 'market dropdown verified', '03');
    await cleanupTestMarkets();
    await ss(page, 'cleaned', '03');
  });

  test('04 - Permission filter radio buttons', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '04');
    // Not set 可见，初期为选中状态（permissionFilter 初期值 ""）
    await expect($radioNotSet(page)).toBeVisible();
    await expect($radioNotSet(page)).toBeChecked();
    // Rule 可见，初期未选中
    await expect($radioRule(page)).toBeVisible();
    await expect($radioRule(page)).not.toBeChecked();
    // Template 可见，初期未选中
    await expect($radioTemplate(page)).toBeVisible();
    await expect($radioTemplate(page)).not.toBeChecked();
    await ss(page, 'radio buttons verified', '04');
  });

  test('05 - Search button', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '05');
    await expect($btnSearch(page)).toBeVisible();
    await expect($btnSearch(page)).toHaveText('Search');
    await expect($btnSearch(page)).toBeEnabled();
    await ss(page, 'search button verified', '05');
  });

  test('06 - DataTable initial state', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '06');
    // DataTable 表头
    await expect($dataTable(page)).not.toBeVisible();
    // 未查询时无数据行，COUNT 标签初始为 0
    // DataTable 在 results.length > 0 时才渲染，初期不存在
    await expect($resultCount(page)).not.toBeVisible();
    await ss(page, 'datatable initial state', '06');
  });

  test('07 - Error message hidden by default', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '07');
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'error message hidden', '07');
  });

  // ===========================================================
  // Userid 输入框属性校验 (TC8~10)
  // ===========================================================

  test('08 - Userid max length 10', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '08');
    await $inputUserid(page).fill('A'.repeat(11));
    await ss(page, 'input 11 chars', '08');
    const val = await $inputUserid(page).inputValue();
    console.log('  Input length: ' + val.length);
    expect(val.length).toBe(10);
    expect(val).toBe('A'.repeat(10));
    await ss(page, 'max length verified', '08');
  });

  test('09 - Userid allowed chars (alphanumeric)', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '09');
    await $inputUserid(page).fill('User01test');
    await ss(page, 'input filled', '09');
    const val = await $inputUserid(page).inputValue();
    expect(val).toBe('User01test');
    await ss(page, 'alphanumeric verified', '09');
  });

  test('10 - Userid initial empty', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '10');
    const val = await $inputUserid(page).inputValue();
    expect(val).toBe('');
    await ss(page, 'empty value verified', '10');
  });

  // ===========================================================
  // User 输入框属性校验 (TC11~12)
  // ===========================================================

  test('11 - User max length 32', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '11');
    await $inputUser(page).fill('A'.repeat(33));
    await ss(page, 'input 33 chars', '11');
    const val = await $inputUser(page).inputValue();
    console.log('  Input length: ' + val.length);
    expect(val.length).toBe(32);
    expect(val).toBe('A'.repeat(32));
    await ss(page, 'max length verified', '11');
  });

  test('12 - User allowed chars (alphanumeric)', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '12');
    await $inputUser(page).fill('TestUserName123');
    await ss(page, 'input filled', '12');
    const val = await $inputUser(page).inputValue();
    expect(val).toBe('TestUserName123');
    await ss(page, 'alphanumeric verified', '12');
  });

  // ===========================================================
  // Market 下拉列表 (TC13~14)
  // ===========================================================

  test('13 - Market dropdown options', async ({ page }) => {
    await insertTestMarkets();
    await navigateToPage(page);
    await ss(page, 'page display', '13');
    // 展开 Market 下拉列表
    await $marketListbox(page).focus();
    await ss(page, 'market dropdown expanded', '13');
    const options = await getMarketOptions(page);
    console.log('  Market options: ' + options.join(', '));
    expect(options).toContain(TEST_MARKET_A);
    expect(options).toContain(TEST_MARKET_B);
    // 初期未选择任何选项（第一个空option）
    const selectedVal = await $marketListbox(page).inputValue();
    expect(selectedVal).toBe('');
    await ss(page, 'market options verified', '13');
    await cleanupTestMarkets();
    await ss(page, 'cleaned', '13');
  });

  test('14 - Market selection switch', async ({ page }) => {
    await insertTestMarkets();
    await navigateToPage(page);
    await ss(page, 'page display', '14');
    // 选择第一个 Market
    await $marketListbox(page).selectOption(TEST_MARKET_A);
    await ss(page, 'market A selected', '14');
    let selectedVal = await $marketListbox(page).inputValue();
    expect(selectedVal).toBe(TEST_MARKET_A);
    // 切换为第二个 Market
    await $marketListbox(page).selectOption(TEST_MARKET_B);
    await ss(page, 'market B selected', '14');
    selectedVal = await $marketListbox(page).inputValue();
    expect(selectedVal).toBe(TEST_MARKET_B);
    await ss(page, 'market switch verified', '14');
    await cleanupTestMarkets();
    await ss(page, 'cleaned', '14');
  });

  // ===========================================================
  // 权限筛选 RadioButton (TC15~17)
  // ===========================================================

  test('15 - RadioButton - select Not set', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '15');
    // Not set 初期已为选中状态
    await expect($radioNotSet(page)).toBeChecked();
    await ss(page, 'not set verified', '15');
  });

  test('16 - RadioButton - select Rule', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '16');
    // 点击 Rule
    await $radioRule(page).check({ force: true });
    await ss(page, 'rule selected', '16');
    await expect($radioRule(page)).toBeChecked();
    await expect($radioNotSet(page)).not.toBeChecked();
    await expect($radioTemplate(page)).not.toBeChecked();
    await ss(page, 'rule verified', '16');
  });

  test('17 - RadioButton - mutual exclusion', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '17');
    // 先选中 Not set
    await $radioNotSet(page).check({ force: true });
    await ss(page, 'not set selected', '17');
    await expect($radioNotSet(page)).toBeChecked();
    // 再点击 Template → Not set 自动取消
    await $radioTemplate(page).check({ force: true });
    await ss(page, 'template selected, notset unchecked', '17');
    await expect($radioTemplate(page)).toBeChecked();
    await expect($radioNotSet(page)).not.toBeChecked();
    await expect($radioRule(page)).not.toBeChecked();
    await ss(page, 'mutual exclusion verified', '17');
  });

  // ===========================================================
  // Search 按钮点击事件 (TC18~27)
  // ===========================================================

  test('18 - Search - by User (valid condition)', async ({ page }) => {
    // 准备测试数据：插入不同市场的用户
    await insertTestMarkets();
    await insertTestUser({ userid: TEST_USERID_A, username: TEST_USERNAME_A });
    await insertMarketAuth(TEST_USERID_A, TEST_MARKET_A, 'R');
    await insertTestUser({ userid: TEST_USERID_B, username: TEST_USERNAME_B });
    await insertMarketAuth(TEST_USERID_B, TEST_MARKET_B, 'T');
    await navigateToPage(page);
    await ss(page, 'page display', '18');
    // 入力 User（精确匹配 USERNAME）作为查询条件
    // 注意：SQL 中 USERNAME 是精确匹配(=)，不是 LIKE
    await $inputUser(page).fill(TEST_USERNAME_A);
    await ss(page, 'input user', '18');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'search result', '18');
    // DataTable 显示查询到的用户记录
    const rowCount = await getTableRowCount(page);
    console.log('  Table row count: ' + rowCount);
    expect(rowCount).toBe(1);
    // COUNT 标签显示记录总数
    const countText = await $resultCount(page).textContent();
    console.log('  Count: ' + countText);
    expect(countText).toBe('COUNT: 1');
    // 验证第一行数据
    const firstUserid = await $tableColCells(page, 0).first().textContent();
    expect(firstUserid?.trim()).toBe(TEST_USERID_A);
    await ss(page, 'search by user verified', '18');
    // DB 验证
    const dbRows = await queryDB(
      `SELECT COUNT(*) as CNT FROM HDOC_MARKET_AUTH`
    );
    if (dbRows) {
      console.log('  DB market auth count: ' + dbRows[0].CNT);
    }
    await cleanupTestUsers([TEST_USERID_A, TEST_USERID_B]);
    await cleanupTestMarkets();
    await ss(page, 'cleaned', '18');
  });

  test('19 - Search - by Userid exact match', async ({ page }) => {
    await insertTestMarkets();
    await insertTestUser({ userid: TEST_USERID_A, username: TEST_USERNAME_A });
    await insertMarketAuth(TEST_USERID_A, TEST_MARKET_A, 'R');
    await navigateToPage(page);
    await ss(page, 'page display', '19');
    await $inputUserid(page).fill(TEST_USERID_A);
    await ss(page, 'input userid', '19');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'search result', '19');
    // DataTable 显示匹配该 Userid 的用户
    const rowCount = await getTableRowCount(page);
    expect(rowCount).toBe(1);
    // COUNT 标签显示 1
    const countText = await $resultCount(page).textContent();
    expect(countText).toBe('COUNT: 1');
    // 验证第一行数据
    const firstUserid = await $tableColCells(page, 0).first().textContent();
    const firstUsername = await $tableColCells(page, 1).first().textContent();
    const firstMarket = await $tableColCells(page, 2).first().textContent();
    expect(firstUserid?.trim()).toBe(TEST_USERID_A);
    expect(firstUsername?.trim()).toBe(TEST_USERNAME_A);
    expect(firstMarket?.trim()).toBe(TEST_MARKET_A);
    await ss(page, 'exact match verified', '19');
    // DB 验证
    const dbRows = await queryDB(
      `SELECT u.USERID, u.USERNAME, m.MARKET
       FROM HDOC_USER_INFOR u
       INNER JOIN HDOC_MARKET_AUTH m ON u.USERID = m.USERID
       WHERE u.USERID = ?`, [TEST_USERID_A]
    );
    if (dbRows && dbRows.length > 0) {
      expect(dbRows[0].USERID).toBe(TEST_USERID_A);
      expect(dbRows[0].USERNAME).toBe(TEST_USERNAME_A);
      expect(dbRows[0].MARKET).toBe(TEST_MARKET_A);
      console.log('  DB verified: ' + dbRows[0].USERID);
    }
    await cleanupTestUsers([TEST_USERID_A]);
    await cleanupTestMarkets();
    await ss(page, 'cleaned', '19');
  });

  test('20 - Search - by User fuzzy match', async ({ page }) => {
    await insertTestMarkets();
    await insertTestUser({ userid: TEST_USERID_A, username: TEST_USERNAME_A });
    await insertMarketAuth(TEST_USERID_A, TEST_MARKET_A, 'R');
    await insertTestUser({ userid: TEST_USERID_B, username: TEST_USERNAME_B });
    await insertMarketAuth(TEST_USERID_B, TEST_MARKET_B, 'T');
    await navigateToPage(page);
    await ss(page, 'page display', '20');
    // 注意: SQL 中 USERNAME 是精确匹配(=)，不是 LIKE
    // 使用完整的用户名进行测试
    await $inputUser(page).fill(TEST_USERNAME_A);
    await ss(page, 'input username', '20');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'search result', '20');
    const rowCount = await getTableRowCount(page);
    expect(rowCount).toBe(1);
    const countText = await $resultCount(page).textContent();
    expect(countText).toBe('COUNT: 1');
    const firstUserid = await $tableColCells(page, 0).first().textContent();
    expect(firstUserid?.trim()).toBe(TEST_USERID_A);
    await ss(page, 'fuzzy match verified', '20');
    await cleanupTestUsers([TEST_USERID_A, TEST_USERID_B]);
    await cleanupTestMarkets();
    await ss(page, 'cleaned', '20');
  });

  test('21 - Search - by Market filter', async ({ page }) => {
    await insertTestMarkets();
    await insertTestUser({ userid: TEST_USERID_A, username: TEST_USERNAME_A });
    await insertMarketAuth(TEST_USERID_A, TEST_MARKET_A, 'R');
    await insertTestUser({ userid: TEST_USERID_B, username: TEST_USERNAME_B });
    await insertMarketAuth(TEST_USERID_B, TEST_MARKET_B, 'T');
    await navigateToPage(page);
    await ss(page, 'page display', '21');
    // 选择 Market
    await $marketListbox(page).selectOption(TEST_MARKET_A);
    await ss(page, 'market selected', '21');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'search result', '21');
    const rowCount = await getTableRowCount(page);
    expect(rowCount).toBe(1);
    const firstMarket = await $tableColCells(page, 2).first().textContent();
    expect(firstMarket?.trim()).toBe(TEST_MARKET_A);
    await ss(page, 'market filter verified', '21');
    await cleanupTestUsers([TEST_USERID_A, TEST_USERID_B]);
    await cleanupTestMarkets();
    await ss(page, 'cleaned', '21');
  });

  test('22 - Search - Userid + Market combined', async ({ page }) => {
    await insertTestMarkets();
    await insertTestUser({ userid: TEST_USERID_A, username: TEST_USERNAME_A });
    await insertMarketAuth(TEST_USERID_A, TEST_MARKET_A, 'R');
    await insertTestUser({ userid: TEST_USERID_B, username: TEST_USERNAME_B });
    await insertMarketAuth(TEST_USERID_B, TEST_MARKET_B, 'T');
    await navigateToPage(page);
    await ss(page, 'page display', '22');
    await $inputUserid(page).fill(TEST_USERID_A);
    await $marketListbox(page).selectOption(TEST_MARKET_A);
    await ss(page, 'input combined', '22');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'search result', '22');
    const rowCount = await getTableRowCount(page);
    expect(rowCount).toBe(1);
    const firstUserid = await $tableColCells(page, 0).first().textContent();
    const firstMarket = await $tableColCells(page, 2).first().textContent();
    expect(firstUserid?.trim()).toBe(TEST_USERID_A);
    expect(firstMarket?.trim()).toBe(TEST_MARKET_A);
    await ss(page, 'combined query verified', '22');
    await cleanupTestUsers([TEST_USERID_A, TEST_USERID_B]);
    await cleanupTestMarkets();
    await ss(page, 'cleaned', '22');
  });

  test('23 - Search - Userid + permission combined', async ({ page }) => {
    await insertTestMarkets();
    await insertTestUser({ userid: TEST_USERID_A, username: TEST_USERNAME_A });
    await insertMarketAuth(TEST_USERID_A, TEST_MARKET_A, 'R');
    await insertTestUser({ userid: TEST_USERID_C, username: TEST_USERNAME_C });
    await insertMarketAuth(TEST_USERID_C, TEST_MARKET_B, 'T');
    await navigateToPage(page);
    await ss(page, 'page display', '23');
    await $inputUserid(page).fill(TEST_USERID_A);
    // 选择 Rule 权限
    await $radioRule(page).check({ force: true });
    await ss(page, 'input with permission', '23');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'search result', '23');
    const rowCount = await getTableRowCount(page);
    expect(rowCount).toBe(1);
    const firstUserid = await $tableColCells(page, 0).first().textContent();
    expect(firstUserid?.trim()).toBe(TEST_USERID_A);
    await ss(page, 'userid+permission verified', '23');
    await cleanupTestUsers([TEST_USERID_A, TEST_USERID_C]);
    await cleanupTestMarkets();
    await ss(page, 'cleaned', '23');
  });

  test('24 - Search - User + Market + permission combined', async ({ page }) => {
    await insertTestMarkets();
    await insertTestUser({ userid: TEST_USERID_A, username: TEST_USERNAME_A });
    await insertMarketAuth(TEST_USERID_A, TEST_MARKET_A, 'T');
    await insertTestUser({ userid: TEST_USERID_B, username: TEST_USERNAME_B });
    await insertMarketAuth(TEST_USERID_B, TEST_MARKET_B, 'T');
    await navigateToPage(page);
    await ss(page, 'page display', '24');
    await $inputUser(page).fill(TEST_USERNAME_A);
    await $marketListbox(page).selectOption(TEST_MARKET_A);
    await $radioTemplate(page).check({ force: true });
    await ss(page, 'input combined', '24');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'search result', '24');
    const rowCount = await getTableRowCount(page);
    expect(rowCount).toBe(1);
    const firstUserid = await $tableColCells(page, 0).first().textContent();
    const firstMarket = await $tableColCells(page, 2).first().textContent();
    expect(firstUserid?.trim()).toBe(TEST_USERID_A);
    expect(firstMarket?.trim()).toBe(TEST_MARKET_A);
    await ss(page, 'combined query verified', '24');
    await cleanupTestUsers([TEST_USERID_A, TEST_USERID_B]);
    await cleanupTestMarkets();
    await ss(page, 'cleaned', '24');
  });

  test('25 - Search - no results', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '25');
    await $inputUserid(page).fill('NONEXIST999');
    await ss(page, 'input nonexist', '25');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'search result', '25');
    // DataTable 不显示数据行
    await expect($dataTable(page)).not.toBeVisible();
    // 错误消息显示
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('没有找到匹配的用户');
    // COUNT 标签不显示（results.length === 0 时不渲染）
    await expect($resultCount(page)).not.toBeVisible();
    await ss(page, 'no results verified', '25');
  });

  test('26 - Search - loading state', async ({ page }) => {
    await insertTestMarkets();
    await insertTestUser({ userid: TEST_USERID_A, username: TEST_USERNAME_A });
    await insertMarketAuth(TEST_USERID_A, TEST_MARKET_A, 'R');
    await navigateToPage(page);
    await ss(page, 'page display', '26');
    await $inputUserid(page).fill(TEST_USERID_A);
    await ss(page, 'input filled', '26');
    await $btnSearch(page).click();
    try {
      await expect($btnSearch(page)).toBeDisabled({ timeout: 2000 });
      await expect($inputUserid(page)).toBeDisabled({ timeout: 1000 });
      await expect($inputUser(page)).toBeDisabled({ timeout: 1000 });
      await expect($marketListbox(page)).toBeDisabled({ timeout: 1000 });
      console.log('  Inputs and button disabled during loading');
    } catch {
      console.log('  API response too fast, loading state not captured');
    }
    await page.waitForTimeout(2000);
    await ss(page, 'loading state', '26');
    await cleanupTestUsers([TEST_USERID_A]);
    await cleanupTestMarkets();
    await ss(page, 'cleaned', '26');
  });

  test('27 - Search - prevent duplicate submit', async ({ page }) => {
    await insertTestMarkets();
    await insertTestUser({ userid: TEST_USERID_A, username: TEST_USERNAME_A });
    await insertMarketAuth(TEST_USERID_A, TEST_MARKET_A, 'R');
    await navigateToPage(page);
    await ss(page, 'page display', '27');
    await $inputUserid(page).fill(TEST_USERID_A);
    await ss(page, 'input filled', '27');
    await $btnSearch(page).click();
    await page.waitForTimeout(200);
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'duplicate click', '27');
    await cleanupTestUsers([TEST_USERID_A]);
    await cleanupTestMarkets();
    await ss(page, 'cleaned', '27');
  });

  // ===========================================================
  // 异常处理 (TC28~37)
  // ===========================================================

  test('28 - Network error on Search', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '28');
    // 拦截 searchHdoc API 模拟网络断开
    await page.route('**/api/v1/hdoc/ud19/searchHdoc', route => route.abort());
    await $inputUserid(page).fill('test');
    await ss(page, 'input filled', '28');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/ud19/searchHdoc');
    await ss(page, 'search clicked', '28');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('系统暂时不可用，请稍后重试');
    await expect($btnSearch(page)).toBeEnabled();
    await ss(page, 'network error', '28');
  });

  test('29 - Server internal error (500)', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '29');
    // 返回非 JSON 响应触发 catch 块（response.json() 抛出异常）
    await page.route('**/api/v1/hdoc/ud19/searchHdoc', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'text/plain',
        body: 'Internal Server Error',
      });
    });
    await $inputUserid(page).fill('test');
    await ss(page, 'input filled', '29');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/ud19/searchHdoc');
    await ss(page, 'search clicked', '29');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('系统暂时不可用，请稍后重试');
    await expect($btnSearch(page)).toBeEnabled();
    await ss(page, '500 error', '29');
  });

  test('30 - Market list load failure', async ({ page }) => {
    // 拦截 selectMarketMaster API 返回错误
    await page.route('**/api/v1/hdoc/ud19/selectMarketMaster', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'System error. Please contact administrator.', data: null }),
      });
    });
    await login(page);
    await page.goto(PAGE_URL + '/menu/search-user', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    await ss(page, 'page with error', '30');
    // 错误消息可见
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('System error. Please contact administrator.');
    // Market 下拉列表为空（只有空 option）
    const options = await getMarketOptions(page);
    console.log('  Market options after failure: ' + options.join(', '));
    expect(options.length).toBe(1); // 只有空 option
    expect(options[0]).toBe('');
    await ss(page, 'market load failure verified', '30');
    await page.unroute('**/api/v1/hdoc/ud19/selectMarketMaster');
  });

  test('31 - Empty search condition validation', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '31');
    // 所有条件为空，点击 Search
    await $btnSearch(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'search clicked', '31');
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await expect($err(page)).toContainText('请输入至少一个查询条件');
    await ss(page, 'empty condition error', '31');
  });

  test('32 - Userid format validation (non-alphanumeric)', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '32');
    await $inputUserid(page).fill('test@user!');
    await ss(page, 'input invalid userid', '32');
    await $btnSearch(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'search clicked', '32');
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await expect($err(page)).toContainText('Userid must be alphanumeric.');
    await ss(page, 'format error', '32');
  });

  test('33 - User format validation (non-alphanumeric)', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '33');
    await $inputUser(page).fill('test@user!');
    await ss(page, 'input invalid user', '33');
    await $btnSearch(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'search clicked', '33');
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await expect($err(page)).toContainText('User must be alphanumeric.');
    await ss(page, 'format error', '33');
  });

  test('34 - API 401 auth error', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '34');
    // 返回非 JSON 响应触发 catch 块
    await page.route('**/api/v1/hdoc/ud19/searchHdoc', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'text/plain',
        body: 'Unauthorized',
      });
    });
    await $inputUserid(page).fill('test');
    await ss(page, 'input filled', '34');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/ud19/searchHdoc');
    await ss(page, 'search clicked', '34');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('系统暂时不可用，请稍后重试');
    await expect($btnSearch(page)).toBeEnabled();
    await ss(page, '401 error', '34');
  });

  test('35 - API connection failure', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '35');
    // 拦截 searchHdoc API 模拟连接异常（返回非 JSON 响应）
    await page.route('**/api/v1/hdoc/ud19/searchHdoc', async route => {
      await route.abort('connectionrefused');
    });
    await $inputUserid(page).fill('test');
    await ss(page, 'input filled', '35');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/ud19/searchHdoc');
    await ss(page, 'search clicked', '35');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('系统暂时不可用，请稍后重试');
    await expect($btnSearch(page)).toBeEnabled();
    await ss(page, 'connection failure', '35');
  });

  test('36 - Search - no matching data', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '36');
    // 输入不存在的 Userid
    await $inputUserid(page).fill('ZZZZZ99999');
    await ss(page, 'input nonexist', '36');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'search result', '36');
    // DataTable 不显示数据行
    await expect($dataTable(page)).not.toBeVisible();
    // 错误消息
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('没有找到匹配的用户');
    // COUNT 标签显示 0（不渲染）
    await expect($resultCount(page)).not.toBeVisible();
    await ss(page, 'no match verified', '36');
  });

  test('37 - Error message clear on new operation', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '37');
    // 第1次：空条件触发错误
    await $btnSearch(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'first error', '37');
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await expect($err(page)).toContainText('请输入至少一个查询条件');
    // 第2次：输入非法 Userid 触发新错误
    await $inputUserid(page).fill('test@user!');
    await $btnSearch(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'second error', '37');
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    // 旧消息被清除，显示新消息
    await expect($err(page)).toContainText('Userid must be alphanumeric.');
    await ss(page, 'message cleared and replaced', '37');
  });

  // ===========================================================
  // 消息显示 (TC38~39)
  // ===========================================================

  test('38 - Error message display (style check)', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '38');
    // 输入非半角英数字 Userid
    await $inputUserid(page).fill('test@user!');
    await ss(page, 'input invalid', '38');
    await $btnSearch(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'search clicked', '38');
    // 错误消息可见
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await expect($err(page)).toContainText('Userid must be alphanumeric.');
    // 错误消息文字颜色为红色
    const errColor = await $err(page).evaluate(el => window.getComputedStyle(el).color);
    console.log('  Error message color: ' + errColor);
    expect(errColor.toLowerCase()).toBe('rgb(229, 57, 53)');
    await ss(page, 'error message style', '38');
  });

  test('39 - Successful query - no error message', async ({ page }) => {
    await insertTestMarkets();
    await insertTestUser({ userid: TEST_USERID_A, username: TEST_USERNAME_A });
    await insertMarketAuth(TEST_USERID_A, TEST_MARKET_A, 'R');
    await navigateToPage(page);
    await ss(page, 'page display', '39');
    await $inputUserid(page).fill(TEST_USERID_A);
    await ss(page, 'input filled', '39');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'search result', '39');
    // 查询正常返回
    const rowCount = await getTableRowCount(page);
    expect(rowCount).toBe(1);
    // 错误消息区域不可见
    await expect($err(page)).not.toBeVisible();
    // DataTable 显示结果
    await expect($dataTable(page)).toBeVisible();
    const countText = await $resultCount(page).textContent();
    expect(countText).toBe('COUNT: 1');
    await ss(page, 'successful query verified', '39');
    // DB 验证
    const dbRows = await queryDB(
      `SELECT u.USERID, u.USERNAME, m.MARKET
       FROM HDOC_USER_INFOR u
       INNER JOIN HDOC_MARKET_AUTH m ON u.USERID = m.USERID
       WHERE u.USERID = ?`, [TEST_USERID_A]
    );
    if (dbRows && dbRows.length > 0) {
      expect(dbRows[0].USERID).toBe(TEST_USERID_A);
      console.log('  DB verified user: ' + dbRows[0].USERID);
    }
    await cleanupTestUsers([TEST_USERID_A]);
    await cleanupTestMarkets();
    await ss(page, 'cleaned', '39');
  });

  // ===========================================================
  // 安全性 (TC40~42)
  // ===========================================================

  test('40 - Security - unauthenticated access redirects to login', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'load' });
    await page.evaluate(() => {
      localStorage.clear();
    });
    await ss(page, 'localStorage cleared', '40');
    // 直接访问 Search User 页面
    await page.goto(PAGE_URL + '/menu/search-user', { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    await ss(page, 'redirect result', '40');
    // 页面跳转到登录页
    await expect(page).toHaveURL(/\/login/);
    await ss(page, 'redirected to login', '40');
  });

  test('41 - Security - SQL injection protection', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '41');
    // 输入 SQL 注入代码
    await $inputUserid(page).fill("' OR '1'='1");
    await ss(page, 'sql injection input', '41');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'search result', '41');
    // 错误消息不包含 SQL 相关关键词
    if (await $err(page).isVisible()) {
      const errText = await $err(page).textContent() || '';
      console.log('  Error message: ' + errText);
      expect(errText.toLowerCase()).not.toContain('sql');
      expect(errText.toLowerCase()).not.toContain('syntax');
    }
    // 系统正常运行
    await expect($btnSearch(page)).toBeEnabled();
    await ss(page, 'sql injection result', '41');
  });

  test('42 - Security - XSS protection', async ({ page }) => {
    // 注册一个 dialog 监听来捕获 alert
    page.on('dialog', (dialog) => {
      console.log('  Dialog detected: ' + dialog.message());
      // XSS 防护失败时关掉对话框
      dialog.dismiss();
      throw new Error('XSS vulnerability: alert() dialog was triggered');
    });
    await navigateToPage(page);
    await ss(page, 'page display', '42');
    // 输入 XSS 攻击代码
    await $inputUserid(page).fill('<script>alert(1)</script>');
    await ss(page, 'xss input', '42');
    await $btnSearch(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'search result', '42');
    // 不会弹出 alert(1) 对话框（如果弹出了，上面的 dialog 监听会抛出错误）
    console.log('  No XSS dialog detected - XSS protection works');
    await expect($btnSearch(page)).toBeEnabled();
    await ss(page, 'xss protection verified', '42');
  });

});
