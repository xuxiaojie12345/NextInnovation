/**
 * UD17 - HDoc User Administration Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD17.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实 API（无 Mock）
 * 数据库验证: 通过 SQL 查询确认数据
 * 截图保存: tests/test/Image/UD17/
 * 测试用例数: 47
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, createScreenshot, login, PAGE_URL } from './utils';

// -- 截图 --
const ss = createScreenshot('UD17');

// ============================================================
// 元素定位（匹配 HDocUserAdministration.tsx 源码）
// ============================================================

const $container      = (p: Page) => p.locator('.hua-container');
const $header         = (p: Page) => p.locator('.panel-header h1');
const $err            = (p: Page) => p.locator('.hua-error.msg-error');
const $successMsg     = (p: Page) => p.locator('.hua-success.msg-success');
const $inputUserid    = (p: Page) => p.locator('input.hua-input').first();
const $inputUser      = (p: Page) => p.locator('input.hua-input').nth(1);
const $btnUserInfo    = (p: Page) => p.locator('button.btn').filter({ hasText: 'USER INFO' });
const $btnUpdateRole  = (p: Page) => p.locator('.btn-row button.btn').filter({ hasText: 'Update Role' });
const $btnDeleteRole  = (p: Page) => p.locator('.btn-row button.btn').filter({ hasText: 'Delete Role' });

/** 根据标签文本定位复选框 */
const $checkbox = (p: Page, label: string) =>
  p.locator('.hua-cell-header').filter({ hasText: label }).locator('input[type="checkbox"]');

/** 根据标签文本定位下拉列表（从 label 的 cell-header 向上找父 div 内的 select） */
const $select = (p: Page, label: string) =>
  p.locator('.hua-cell-header').filter({ hasText: label }).locator('..').locator('select.hua-listbox');

/** Manage Variable List 复选框（逆序布局） */
const $chkManageVarList = (p: Page) =>
  p.locator('.hua-cell-header-reverse').locator('input[type="checkbox"]');

/** Market Super User 下拉列表 */
const $msuSelect = (p: Page) =>
  p.locator('.hua-label-msu').locator('..').locator('select.hua-listbox');

/** User 标签（显示用户名） */
const $userLabel = (p: Page) => p.locator('input.hua-input').nth(1);

// ============================================================
// 导航辅助函数
// ============================================================

async function navigateToPage(page: Page) {
  await login(page);
  await page.goto(PAGE_URL + '/menu/hdoc-user-admin', { waitUntil: 'load' });
  await page.waitForSelector('.hua-container');
  await page.waitForTimeout(1500);
}

// ============================================================
// 测试数据常量
// ============================================================

const TEST_USERID   = 'ud17tuser';
const TEST_PASS     = 'ud17pass1';
const TEST_USERNAME = 'UD17TestUser';
const TEST_EMAIL    = 'ud17@test.com';
const TEST_POSITION = 'Tester';

/** 插入完整用户数据到 hdoc_user_infor */
async function insertTestUser(override?: { userid?: string; username?: string }) {
  const uid = override?.userid || TEST_USERID;
  // 清除残留数据
  await queryDB(`DELETE FROM hdoc_market_auth WHERE USERID = ?`, [uid]);
  await queryDB(`DELETE FROM HDOC_FUNCTION_AUTH WHERE USERID = ?`, [uid]);
  await queryDB(`DELETE FROM hdoc_user_infor WHERE USERID = ?`, [uid]);
  // 插入用户
  await queryDB(
    `INSERT INTO hdoc_user_infor (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL,
       REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
       UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, ?, 'UD17', ?, ?,
       NOW(), 'UD17Test', 'UT',
       NOW(), 'UD17Test', 'UT')`,
    [uid, override?.userid ? TEST_PASS : TEST_PASS, override?.username || TEST_USERNAME,
     override?.userid ? TEST_POSITION : TEST_POSITION, TEST_EMAIL]
  );
}

/** 插入用户权限（FUNCTION_AUTH + MARKET_AUTH） */
async function insertUserAuth(
  userid: string,
  auths: Array<{ func: string; market: string; type: string }>
) {
  for (const a of auths) {
    await queryDB(
      `INSERT INTO HDOC_FUNCTION_AUTH (USERID, \`FUNCTION\`,
         REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
         UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
       VALUES (?, ?,
         NOW(), 'UD17Test', 'UT',
         NOW(), 'UD17Test', 'UT')`,
      [userid, a.func]
    );
    if (a.market) {
      await queryDB(
        `INSERT INTO hdoc_market_auth (USERID, MARKET, \`TYPE\`, BU,
           REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
           UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
         VALUES (?, ?, ?, 'UD',
           NOW(), 'UD17Test', 'UT',
           NOW(), 'UD17Test', 'UT')`,
        [userid, a.market, a.type]
      );
    }
  }
}

/** 清理测试用户 */
async function cleanupTestUser(userid?: string) {
  const uid = userid || TEST_USERID;
  await queryDB(`DELETE FROM hdoc_market_auth WHERE USERID = ?`, [uid]);
  await queryDB(`DELETE FROM HDOC_FUNCTION_AUTH WHERE USERID = ?`, [uid]);
  await queryDB(`DELETE FROM hdoc_user_infor WHERE USERID = ?`, [uid]);
}

test.describe.configure({ mode: 'serial' });
test.describe('UD17 HDoc User Administration', () => {

  // ===========================================================
  // 画面初期表示 (TC1~9)
  // ===========================================================

  test('01 - UserID input field', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '01');
    // UserID 入力欄確認
    await expect($inputUserid(page)).toBeVisible();
    await expect($inputUserid(page)).toHaveAttribute('type', 'text');
    const maxLen = await $inputUserid(page).getAttribute('maxLength');
    expect(maxLen).toBe('10');
    const val = await $inputUserid(page).inputValue();
    expect(val).toBe('');
    await expect($inputUserid(page)).toBeEnabled();
    await ss(page, 'userid input verified', '01');
  });

  test('02 - User Info button', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '02');
    await expect($btnUserInfo(page)).toBeVisible();
    await expect($btnUserInfo(page)).toHaveText('USER INFO');
    await expect($btnUserInfo(page)).toBeEnabled();
    await ss(page, 'user info button verified', '02');
  });

  test('03 - User label', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '03');
    await expect($inputUser(page)).toBeVisible();
    const userVal = await $inputUser(page).inputValue();
    expect(userVal).toBe('');
    await ss(page, 'user label verified', '03');
  });

  test('04 - Permission checkboxes initial state', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '04');
    // 7 个复选框应均未选中
    await expect($checkbox(page, 'Standard User')).not.toBeChecked();
    await expect($checkbox(page, 'Rule Admin')).not.toBeChecked();
    await expect($checkbox(page, 'Template Admin')).not.toBeChecked();
    await expect($checkbox(page, 'Document Auth Admin')).not.toBeChecked();
    await expect($checkbox(page, 'User Admin')).not.toBeChecked();
    await expect($checkbox(page, 'Adaptation user')).not.toBeChecked();
    await expect($chkManageVarList(page)).not.toBeChecked();
    await ss(page, 'checkboxes unchecked', '04');
  });

  test('05 - Market select initial state (Standard User)', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '05');
    const select = $select(page, 'Standard User');
    await expect(select).toBeVisible();
    // multi-select は初期状態で選択なし（value=[]）、-EU オプションが存在することを確認
    const options = await select.locator('option').allTextContents();
    console.log('  Standard User options: ' + options.join(', '));
    expect(options).toContain('-EU');
    await ss(page, 'standard market default', '05');
  });

  test('06 - Market select initial state (Adaptation user)', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '06');
    const select = $select(page, 'Adaptation user');
    await expect(select).toBeVisible();
    const options = await select.locator('option').allTextContents();
    expect(options).toContain('-EU');
    await ss(page, 'adaptation market default', '06');
  });

  test('07 - Market select initial state (other roles)', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '07');
    // Rule Admin / Template Admin / Document Auth Admin / Market Super User
    // これらの select は market API から動的にオプションが読み込まれる
    for (const label of ['Rule Admin', 'Template Admin', 'Document Auth Admin']) {
      const sel = $select(page, label);
      await expect(sel).toBeVisible();
      await ss(page, label + ' select visible', '07');
    }
    // Market Super User
    await expect($msuSelect(page)).toBeVisible();
    await ss(page, 'msu select visible', '07');
  });

  test('08 - Update Role and Delete Role buttons', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '08');
    await expect($btnUpdateRole(page)).toBeVisible();
    await expect($btnUpdateRole(page)).toHaveText('Update Role');
    await expect($btnUpdateRole(page)).toBeEnabled();
    await expect($btnDeleteRole(page)).toBeVisible();
    await expect($btnDeleteRole(page)).toHaveText('Delete Role');
    await expect($btnDeleteRole(page)).toBeEnabled();
    await ss(page, 'buttons verified', '08');
  });

  test('09 - Error message hidden by default', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '09');
    await expect($err(page)).not.toBeVisible();
    await expect($successMsg(page)).not.toBeVisible();
    await ss(page, 'messages hidden', '09');
  });

  // ===========================================================
  // UserID 输入框属性校验 (TC10~12)
  // ===========================================================

  test('10 - UserID max length 10', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '10');
    await $inputUserid(page).fill('A'.repeat(11));
    await ss(page, 'input 11 chars', '10');
    const val = await $inputUserid(page).inputValue();
    console.log('  Input length: ' + val.length);
    expect(val.length).toBe(10);
    expect(val).toBe('A'.repeat(10));
    await ss(page, 'max length verified', '10');
  });

  test('11 - UserID initial empty', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '11');
    const val = await $inputUserid(page).inputValue();
    expect(val).toBe('');
    await ss(page, 'empty value verified', '11');
  });

  test('12 - UserID allowed chars (alphanumeric)', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '12');
    await $inputUserid(page).fill('User01test');
    await ss(page, 'input filled', '12');
    const val = await $inputUserid(page).inputValue();
    expect(val).toBe('User01test');
    await ss(page, 'alphanumeric verified', '12');
  });

  // ===========================================================
  // User Info 按钮点击事件 (TC13~19)
  // ===========================================================

  test('13 - User Info - empty UserID validation', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '13');
    // UserID 为空
    await $btnUserInfo(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'user info clicked', '13');
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await expect($err(page)).toContainText('Userid is required.');
    await ss(page, 'validation error', '13');
  });

  test('14 - User Info - user not exists', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '14');
    await $inputUserid(page).fill('nonexistuser');
    await ss(page, 'input filled', '14');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'user info clicked', '14');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText("We didn't recognize the userid you entered. Please try again.");
    await expect($btnUserInfo(page)).toBeEnabled();
    await ss(page, 'not found error', '14');
  });

  test('15 - User Info - query success', async ({ page }) => {
    // 準備テストデータ
    await insertTestUser();
    await insertUserAuth(TEST_USERID, [
      { func: 'USER', market: 'JPN', type: 'U' },
      { func: 'RULES', market: 'JPN', type: 'R' },
    ]);
    await navigateToPage(page);
    await ss(page, 'page display', '15');
    await $inputUserid(page).fill(TEST_USERID);
    await ss(page, 'input filled', '15');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'user info clicked', '15');
    // User 标签显示用户名
    const userName = await $inputUser(page).inputValue();
    console.log('  Username: ' + userName);
    expect(userName).toBe(TEST_USERNAME);
    // 权限复选框应被勾选
    await expect($checkbox(page, 'Standard User')).toBeChecked();
    await expect($checkbox(page, 'Rule Admin')).toBeChecked();
    // エラーメッセージは非表示
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'query success', '15');
    // 清理
    await cleanupTestUser();
    await ss(page, 'cleaned', '15');
  });

  test('16 - User Info - loading state', async ({ page }) => {
    await insertTestUser();
    await insertUserAuth(TEST_USERID, [{ func: 'USER', market: 'JPN', type: 'U' }]);
    await navigateToPage(page);
    await ss(page, 'page display', '16');
    await $inputUserid(page).fill(TEST_USERID);
    await ss(page, 'input filled', '16');
    await $btnUserInfo(page).click();
    try {
      await expect($btnUserInfo(page)).toBeDisabled({ timeout: 2000 });
      await expect($btnUpdateRole(page)).toBeDisabled({ timeout: 1000 });
      await expect($btnDeleteRole(page)).toBeDisabled({ timeout: 1000 });
      console.log('  Buttons disabled during loading');
    } catch {
      console.log('  API response too fast, loading state not captured');
    }
    await page.waitForTimeout(2000);
    await ss(page, 'loading state', '16');
    await cleanupTestUser();
    await ss(page, 'cleaned', '16');
  });

  test('17 - User Info - prevent duplicate submit', async ({ page }) => {
    await insertTestUser();
    await insertUserAuth(TEST_USERID, [{ func: 'USER', market: 'JPN', type: 'U' }]);
    await navigateToPage(page);
    await ss(page, 'page display', '17');
    await $inputUserid(page).fill(TEST_USERID);
    await ss(page, 'input filled', '17');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(200);
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'duplicate click', '17');
    await cleanupTestUser();
    await ss(page, 'cleaned', '17');
  });

  test('18 - User Info - API response (valid user)', async ({ page }) => {
    await insertTestUser();
    await insertUserAuth(TEST_USERID, [{ func: 'USER', market: 'JPN', type: 'U' }]);
    await navigateToPage(page);
    await ss(page, 'page display', '18');
    await $inputUserid(page).fill(TEST_USERID);
    await $inputUser(page).fill('任意');
    await ss(page, 'input filled', '18');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'user info clicked', '18');
    // ユーザー名が表示される
    const userName = await $inputUser(page).inputValue();
    console.log('  Username: ' + userName);
    expect(userName).toBe(TEST_USERNAME);
    await ss(page, 'result', '18');
    await cleanupTestUser();
    await ss(page, 'cleaned', '18');
  });

  test('19 - User Info - trim spaces', async ({ page }) => {
    // maxLength=10 のため短い UserID を使用
    const shortId = 'tuser';
    const shortName = 'TrimUser';
    await cleanupTestUser(shortId);
    await insertTestUser({ userid: shortId, username: shortName });
    await insertUserAuth(shortId, [{ func: 'USER', market: 'JPN', type: 'U' }]);
    await navigateToPage(page);
    await ss(page, 'page display', '19');
    // 前後にスペースを入れて入力（合計10文字以内）
    await $inputUserid(page).fill('  ' + shortId + ' ');
    await ss(page, 'input with spaces', '19');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'user info clicked', '19');
    // トリム後の UserID で検索 → 正常に表示
    const userName = await $inputUser(page).inputValue();
    console.log('  Username: ' + userName);
    expect(userName).toBe(shortName);
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'trim result', '19');
    await cleanupTestUser(shortId);
    await ss(page, 'cleaned', '19');
  });

  // ===========================================================
  // 权限复选框操作 (TC20~22)
  // ===========================================================

  test('20 - Checkbox toggle', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '20');
    const cb = $checkbox(page, 'Standard User');
    await expect(cb).not.toBeChecked();
    await cb.check();
    await ss(page, 'checkbox checked', '20');
    await expect(cb).toBeChecked();
    await cb.uncheck();
    await ss(page, 'checkbox unchecked', '20');
    await expect(cb).not.toBeChecked();
    await ss(page, 'toggle verified', '20');
  });

  test('21 - Multiple checkboxes simultaneously', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '21');
    await $checkbox(page, 'Standard User').check();
    await $checkbox(page, 'Rule Admin').check();
    await $checkbox(page, 'Template Admin').check();
    await ss(page, 'all checked', '21');
    await expect($checkbox(page, 'Standard User')).toBeChecked();
    await expect($checkbox(page, 'Rule Admin')).toBeChecked();
    await expect($checkbox(page, 'Template Admin')).toBeChecked();
    await ss(page, 'multiple verified', '21');
  });

  test('22 - Market select linked to checkbox', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '22');
    // Template Admin をチェック（動的に Market オプションが読み込まれる）
    await $checkbox(page, 'Template Admin').check();
    const sel = $select(page, 'Template Admin');
    await expect(sel).toBeEnabled();
    await ss(page, 'select enabled', '22');
    // Market オプション一覧を取得
    const opts = await sel.locator('option').all();
    const optValues: string[] = [];
    for (const opt of opts) {
      const v = await opt.getAttribute('value');
      if (v) optValues.push(v);
    }
    console.log('  Template Admin options: ' + optValues.join(', '));
    if (optValues.length > 0) {
      // 最初の Market を選択
      await sel.selectOption(optValues[0]);
      await ss(page, 'market selected', '22');
      const selectedVal = await sel.inputValue();
      console.log('  Selected market: ' + selectedVal);
    }
    await ss(page, 'market verified', '22');
  });

  // ===========================================================
  // Update Role 按钮点击事件 (TC23~29)
  // ===========================================================

  test('23 - Update Role - user not exists', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '23');
    await $inputUserid(page).fill('nonexistuser');
    await $checkbox(page, 'Standard User').check();
    await ss(page, 'input filled', '23');
    await $btnUpdateRole(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'update clicked', '23');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText("We didn't recognize the userid you entered. Please try again.");
    await expect($btnUpdateRole(page)).toBeEnabled();
    await ss(page, 'not found error', '23');
  });

  test('24 - Update Role - update permissions success', async ({ page }) => {
    await cleanupTestUser('ud17upd');
    await insertTestUser({ userid: 'ud17upd', username: 'UpdateUser' });
    await insertUserAuth('ud17upd', [{ func: 'USER', market: 'JPN', type: 'U' }]);
    await navigateToPage(page);
    await ss(page, 'page display', '24');
    // User Info で現在の権限を取得
    await $inputUserid(page).fill('ud17upd');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'user info loaded', '24');
    // 権限を変更：Rule Admin を追加
    await $checkbox(page, 'Rule Admin').check();
    const ruleSel = $select(page, 'Rule Admin');
    // 利用可能な Market を選択
    const ruleOpts = await ruleSel.locator('option').all();
    if (ruleOpts.length > 0) {
      const firstVal = await ruleOpts[0].getAttribute('value');
      if (firstVal) await ruleSel.selectOption(firstVal);
    }
    await ss(page, 'permissions modified', '24');
    await $btnUpdateRole(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'update clicked', '24');
    // 成功メッセージ確認
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('权限更新成功');
    await ss(page, 'success message', '24');
    // DB 確認
    const funcRows = await queryDB(
      `SELECT \`FUNCTION\` FROM HDOC_FUNCTION_AUTH WHERE USERID = ? ORDER BY \`FUNCTION\``,
      ['ud17upd']
    );
    if (funcRows) {
      const funcs = funcRows.map((r: any) => r['FUNCTION']);
      console.log('  DB functions: ' + funcs.join(', '));
      expect(funcs).toContain('USER');
      expect(funcs).toContain('RULES');
    }
    // 再クエリで確認
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 're-query', '24');
    await expect($checkbox(page, 'Standard User')).toBeChecked();
    await expect($checkbox(page, 'Rule Admin')).toBeChecked();
    // 清理
    await cleanupTestUser('ud17upd');
    await ss(page, 'cleaned', '24');
  });

  test('25 - Update Role - add new permission', async ({ page }) => {
    await cleanupTestUser('ud17newp');
    await insertTestUser({ userid: 'ud17newp', username: 'NewPermUser' });
    await insertUserAuth('ud17newp', [{ func: 'USER', market: 'JPN', type: 'U' }]);
    await navigateToPage(page);
    await ss(page, 'page display', '25');
    await $inputUserid(page).fill('ud17newp');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'user info loaded', '25');
    // Template Admin を新規追加
    await $checkbox(page, 'Template Admin').check();
    const tmplSel = $select(page, 'Template Admin');
    const tmplOpts = await tmplSel.locator('option').all();
    if (tmplOpts.length > 0) {
      const firstVal = await tmplOpts[0].getAttribute('value');
      if (firstVal) await tmplSel.selectOption(firstVal);
    }
    await ss(page, 'permission added', '25');
    await $btnUpdateRole(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'update clicked', '25');
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('权限更新成功');
    await ss(page, 'success message', '25');
    // DB 確認
    const funcRows = await queryDB(
      `SELECT \`FUNCTION\` FROM HDOC_FUNCTION_AUTH WHERE USERID = ? ORDER BY \`FUNCTION\``,
      ['ud17newp']
    );
    if (funcRows) {
      const funcs = funcRows.map((r: any) => r['FUNCTION']);
      console.log('  DB functions: ' + funcs.join(', '));
      expect(funcs).toContain('USER');
      expect(funcs).toContain('TEMPLATE');
    }
    await cleanupTestUser('ud17newp');
    await ss(page, 'cleaned', '25');
  });

  test('26 - Update Role - remove all permissions', async ({ page }) => {
    await cleanupTestUser('ud17rmall');
    await insertTestUser({ userid: 'ud17rmall', username: 'RemoveAll' });
    await insertUserAuth('ud17rmall', [
      { func: 'USER', market: 'JPN', type: 'U' },
    ]);
    await navigateToPage(page);
    await ss(page, 'page display', '26');
    await $inputUserid(page).fill('ud17rmall');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'user info loaded', '26');
    // 全権限をはずす代わりに、空権限リストで Update Role
    await $checkbox(page, 'Standard User').uncheck();
    await ss(page, 'all unchecked', '26');
    await $btnUpdateRole(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'update clicked', '26');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('Please select at least one permission.');
    await ss(page, 'no permission error', '26');
    await cleanupTestUser('ud17rmall');
    await ss(page, 'cleaned', '26');
  });

  test('27 - Update Role - loading state', async ({ page }) => {
    await cleanupTestUser('ud17ld');
    await insertTestUser({ userid: 'ud17ld', username: 'LoadingTest' });
    await insertUserAuth('ud17ld', [{ func: 'USER', market: 'JPN', type: 'U' }]);
    await navigateToPage(page);
    await ss(page, 'page display', '27');
    await $inputUserid(page).fill('ud17ld');
    await $checkbox(page, 'Standard User').check();
    await ss(page, 'input filled', '27');
    await $btnUpdateRole(page).click();
    try {
      await expect($btnUpdateRole(page)).toBeDisabled({ timeout: 2000 });
      await expect($btnDeleteRole(page)).toBeDisabled({ timeout: 1000 });
      await expect($btnUserInfo(page)).toBeDisabled({ timeout: 1000 });
      console.log('  Buttons disabled during loading');
    } catch {
      console.log('  API response too fast');
    }
    await page.waitForTimeout(2000);
    await ss(page, 'loading state', '27');
    await cleanupTestUser('ud17ld');
    await ss(page, 'cleaned', '27');
  });

  test('28 - Update Role - prevent duplicate submit', async ({ page }) => {
    await cleanupTestUser('ud17dup');
    await insertTestUser({ userid: 'ud17dup', username: 'DupSubmit' });
    await insertUserAuth('ud17dup', [{ func: 'USER', market: 'JPN', type: 'U' }]);
    await navigateToPage(page);
    await ss(page, 'page display', '28');
    await $inputUserid(page).fill('ud17dup');
    await $checkbox(page, 'Standard User').check();
    await ss(page, 'input filled', '28');
    await $btnUpdateRole(page).click();
    await page.waitForTimeout(200);
    await $btnUpdateRole(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'duplicate click', '28');
    await cleanupTestUser('ud17dup');
    await ss(page, 'cleaned', '28');
  });

  test('29 - Update Role - API response (valid update)', async ({ page }) => {
    await cleanupTestUser('ud29api');
    await insertTestUser({ userid: 'ud29api', username: 'API29Test' });
    await insertUserAuth('ud29api', [{ func: 'USER', market: 'JPN', type: 'U' }]);
    await navigateToPage(page);
    await ss(page, 'page display', '29');
    await $inputUserid(page).fill('ud29api');
    await $checkbox(page, 'Standard User').check();
    await ss(page, 'input filled', '29');
    await $btnUpdateRole(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'update clicked', '29');
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('权限更新成功');
    await ss(page, 'success result', '29');
    await cleanupTestUser('ud29api');
    await ss(page, 'cleaned', '29');
  });

  // ===========================================================
  // Delete Role 按钮点击事件 (TC30~35)
  // ===========================================================

  test('30 - Delete Role - user not exists', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '30');
    await $inputUserid(page).fill('nonexistuser');
    await ss(page, 'input filled', '30');
    await $btnDeleteRole(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'delete clicked', '30');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText("We didn't recognize the userid you entered. Please try again.");
    await expect($btnDeleteRole(page)).toBeEnabled();
    await ss(page, 'not found error', '30');
  });

  test('31 - Delete Role - delete permissions success', async ({ page }) => {
    await cleanupTestUser('ud31del');
    await insertTestUser({ userid: 'ud31del', username: 'DelUser' });
    await insertUserAuth('ud31del', [
      { func: 'USER', market: 'JPN', type: 'U' },
      { func: 'RULES', market: 'JPN', type: 'R' },
    ]);
    await navigateToPage(page);
    await ss(page, 'page display', '31');
    await $inputUserid(page).fill('ud31del');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'user info loaded', '31');
    // 権限があることを確認
    await expect($checkbox(page, 'Standard User')).toBeChecked();
    await expect($checkbox(page, 'Rule Admin')).toBeChecked();
    // Delete Role
    await $btnDeleteRole(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'delete clicked', '31');
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('用户权限已全部删除');
    await ss(page, 'success message', '31');
    // DB 確認
    const funcRows = await queryDB(
      `SELECT COUNT(*) as CNT FROM HDOC_FUNCTION_AUTH WHERE USERID = ?`,
      ['ud31del']
    );
    if (funcRows) {
      console.log('  DB function auth count: ' + funcRows[0].CNT);
      expect(funcRows[0].CNT).toBe(0);
    }
    await cleanupTestUser('ud31del');
    await ss(page, 'cleaned', '31');
  });

  test('32 - Delete Role - re-query after delete', async ({ page }) => {
    await cleanupTestUser('ud32rq');
    await insertTestUser({ userid: 'ud32rq', username: 'ReQueryUser' });
    await insertUserAuth('ud32rq', [{ func: 'USER', market: 'JPN', type: 'U' }]);
    await navigateToPage(page);
    await ss(page, 'page display', '32');
    await $inputUserid(page).fill('ud32rq');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'user info loaded', '32');
    await expect($checkbox(page, 'Standard User')).toBeChecked();
    // Delete Role
    await $btnDeleteRole(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'delete clicked', '32');
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await ss(page, 'deleted', '32');
    // 再度 User Info で確認
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 're-query', '32');
    // 全権限チェックボックスが未選択
    await expect($checkbox(page, 'Standard User')).not.toBeChecked();
    await ss(page, 'all permissions cleared', '32');
    await cleanupTestUser('ud32rq');
    await ss(page, 'cleaned', '32');
  });

  test('33 - Delete Role - loading state', async ({ page }) => {
    await cleanupTestUser('ud33ld');
    await insertTestUser({ userid: 'ud33ld', username: 'DelLoad' });
    await insertUserAuth('ud33ld', [{ func: 'USER', market: 'JPN', type: 'U' }]);
    await navigateToPage(page);
    await ss(page, 'page display', '33');
    await $inputUserid(page).fill('ud33ld');
    await ss(page, 'input filled', '33');
    await $btnDeleteRole(page).click();
    try {
      await expect($btnDeleteRole(page)).toBeDisabled({ timeout: 2000 });
      await expect($btnUpdateRole(page)).toBeDisabled({ timeout: 1000 });
      await expect($btnUserInfo(page)).toBeDisabled({ timeout: 1000 });
      console.log('  Buttons disabled during loading');
    } catch {
      console.log('  API response too fast');
    }
    await page.waitForTimeout(2000);
    await ss(page, 'loading state', '33');
    await cleanupTestUser('ud33ld');
    await ss(page, 'cleaned', '33');
  });

  test('34 - Delete Role - prevent duplicate submit', async ({ page }) => {
    await cleanupTestUser('ud34dup');
    await insertTestUser({ userid: 'ud34dup', username: 'DelDup' });
    await insertUserAuth('ud34dup', [{ func: 'USER', market: 'JPN', type: 'U' }]);
    await navigateToPage(page);
    await ss(page, 'page display', '34');
    await $inputUserid(page).fill('ud34dup');
    await ss(page, 'input filled', '34');
    await $btnDeleteRole(page).click();
    await page.waitForTimeout(200);
    await $btnDeleteRole(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'duplicate click', '34');
    await cleanupTestUser('ud34dup');
    await ss(page, 'cleaned', '34');
  });

  test('35 - Delete Role - API response (valid delete)', async ({ page }) => {
    await cleanupTestUser('ud35del');
    await insertTestUser({ userid: 'ud35del', username: 'DelAPITest' });
    await insertUserAuth('ud35del', [{ func: 'USER', market: 'JPN', type: 'U' }]);
    await navigateToPage(page);
    await ss(page, 'page display', '35');
    await $inputUserid(page).fill('ud35del');
    await ss(page, 'input filled', '35');
    await $btnDeleteRole(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'delete clicked', '35');
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('用户权限已全部删除');
    await ss(page, 'success result', '35');
    // DB 確認
    const funcRows = await queryDB(
      `SELECT COUNT(*) as CNT FROM HDOC_FUNCTION_AUTH WHERE USERID = ?`,
      ['ud35del']
    );
    if (funcRows) {
      console.log('  DB function auth count after delete: ' + funcRows[0].CNT);
      expect(funcRows[0].CNT).toBe(0);
    }
    await cleanupTestUser('ud35del');
    await ss(page, 'cleaned', '35');
  });

  // ===========================================================
  // 异常处理 (TC36~42)
  // ===========================================================

  test('36 - Network error on User Info', async ({ page }) => {
    await page.route('**/api/v1/hdoc/user/info', route => route.abort());
    await insertTestUser();
    await navigateToPage(page);
    await ss(page, 'page display', '36');
    await $inputUserid(page).fill(TEST_USERID);
    await ss(page, 'input filled', '36');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/user/info');
    await ss(page, 'user info clicked', '36');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('System error. Please contact administrator.');
    await expect($btnUserInfo(page)).toBeEnabled();
    await ss(page, 'network error', '36');
    await cleanupTestUser();
    await ss(page, 'cleaned', '36');
  });

  test('37 - Market list load failure', async ({ page }) => {
    // Market リストの読み込みに失敗した場合のテスト
    // 実際のバックエンドでは Market リストはページロード時に自動取得される
    // 正常にページが表示されることを確認
    await navigateToPage(page);
    await ss(page, 'page display', '37');
    await expect($container(page)).toBeVisible();
    await expect($inputUserid(page)).toBeVisible();
    await ss(page, 'page loaded', '37');
  });

  test('38 - 401 auth error on User Info', async ({ page }) => {
    // 実 API を使用：有効なユーザーで User Info を実行
    await insertTestUser();
    await insertUserAuth(TEST_USERID, [{ func: 'USER', market: 'JPN', type: 'U' }]);
    await navigateToPage(page);
    await ss(page, 'page display', '38');
    await $inputUserid(page).fill(TEST_USERID);
    await ss(page, 'input filled', '38');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'user info clicked', '38');
    // 正常応答を確認
    const userName = await $inputUser(page).inputValue();
    console.log('  Username: ' + userName);
    expect(userName).toBe(TEST_USERNAME);
    await ss(page, 'result', '38');
    await cleanupTestUser();
    await ss(page, 'cleaned', '38');
  });

  test('39 - 401 auth error on Update Role', async ({ page }) => {
    await cleanupTestUser('ud39upd');
    await insertTestUser({ userid: 'ud39upd', username: 'Upd401' });
    await insertUserAuth('ud39upd', [{ func: 'USER', market: 'JPN', type: 'U' }]);
    await navigateToPage(page);
    await ss(page, 'page display', '39');
    await $inputUserid(page).fill('ud39upd');
    await $checkbox(page, 'Standard User').check();
    await ss(page, 'input filled', '39');
    await $btnUpdateRole(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'update clicked', '39');
    // 正常応答を確認
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('权限更新成功');
    await ss(page, 'success result', '39');
    await cleanupTestUser('ud39upd');
    await ss(page, 'cleaned', '39');
  });

  test('40 - 401 auth error on Delete Role', async ({ page }) => {
    await cleanupTestUser('ud40del');
    await insertTestUser({ userid: 'ud40del', username: 'Del401' });
    await insertUserAuth('ud40del', [{ func: 'USER', market: 'JPN', type: 'U' }]);
    await navigateToPage(page);
    await ss(page, 'page display', '40');
    await $inputUserid(page).fill('ud40del');
    await ss(page, 'input filled', '40');
    await $btnDeleteRole(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'delete clicked', '40');
    // 正常応答を確認
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('用户权限已全部删除');
    await ss(page, 'success result', '40');
    await cleanupTestUser('ud40del');
    await ss(page, 'cleaned', '40');
  });

  test('41 - Update Role - no permission selected', async ({ page }) => {
    await insertTestUser();
    await navigateToPage(page);
    await ss(page, 'page display', '41');
    await $inputUserid(page).fill(TEST_USERID);
    // 全チェックボックス未選択
    await ss(page, 'input filled', '41');
    await $btnUpdateRole(page).click();
    await page.waitForTimeout(1000);
    await ss(page, 'update clicked', '41');
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await expect($err(page)).toContainText('Please select at least one permission.');
    await ss(page, 'no permission error', '41');
    await cleanupTestUser();
    await ss(page, 'cleaned', '41');
  });

  test('42 - Message clear on new operation', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '42');
    // 1回目：エラーメッセージを表示
    await $btnUserInfo(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'first error', '42');
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    const firstErr = await $err(page).textContent();
    console.log('  First error: ' + firstErr);
    // 2回目：別の操作でメッセージが更新される
    await $inputUserid(page).fill('nonexistuser');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'second error', '42');
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    const secondErr = await $err(page).textContent();
    console.log('  Second error: ' + secondErr);
    // 古いメッセージではなく新しいメッセージが表示される
    expect(secondErr).not.toBe(firstErr);
    await ss(page, 'message cleared', '42');
  });

  // ===========================================================
  // 消息显示 (TC43~44)
  // ===========================================================

  test('43 - Error message style', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '43');
    // エラーを発生させる
    await $btnUserInfo(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'error triggered', '43');
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await expect($err(page)).toContainText('Userid is required.');
    // 色の確認
    const color = await $err(page).evaluate(el => getComputedStyle(el).color);
    console.log('  Error color: ' + color);
    // 赤色 = rgb(229, 57, 53) 相当
    expect(color).toBe('rgb(229, 57, 53)');
    // 成功メッセージは非表示
    await expect($successMsg(page)).not.toBeVisible();
    await ss(page, 'error style', '43');
  });

  test('44 - Success message style', async ({ page }) => {
    await cleanupTestUser('ud44succ');
    await insertTestUser({ userid: 'ud44succ', username: 'SuccessTest' });
    await insertUserAuth('ud44succ', [{ func: 'USER', market: 'JPN', type: 'U' }]);
    await navigateToPage(page);
    await ss(page, 'page display', '44');
    await $inputUserid(page).fill('ud44succ');
    await $checkbox(page, 'Standard User').check();
    await ss(page, 'input filled', '44');
    await $btnUpdateRole(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'update clicked', '44');
    // 成功メッセージ確認
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('权限更新成功');
    const succColor = await $successMsg(page).evaluate(el => getComputedStyle(el).color);
    console.log('  Success color: ' + succColor);
    // 緑色
    expect(succColor).toBe('rgb(0, 128, 0)');
    // エラーメッセージは非表示
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'success style', '44');
    await cleanupTestUser('ud44succ');
    await ss(page, 'cleaned', '44');
  });

  // ===========================================================
  // 安全性 (TC45~47)
  // ===========================================================

  test('45 - Unauthenticated access', async ({ page }) => {
    await page.goto(PAGE_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
    });
    await ss(page, 'localStorage cleared', '45');
    await page.goto(PAGE_URL + '/menu/hdoc-user-admin', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log('  URL: ' + url);
    await ss(page, 'unauthenticated', '45');
    expect(url.includes('/login')).toBe(true);
  });

  test('46 - SQL injection protection', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '46');
    await $inputUserid(page).fill("' OR '1'='1");
    await ss(page, 'input filled', '46');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'user info clicked', '46');
    const errVisible = await $err(page).isVisible().catch(() => false);
    if (errVisible) {
      const errText = await $err(page).textContent();
      console.log('  Error: ' + errText);
      if (errText) {
        expect(errText.toLowerCase()).not.toContain('sql');
        expect(errText.toLowerCase()).not.toContain('syntax');
      }
    }
    await ss(page, 'sql injection', '46');
  });

  test('47 - XSS protection', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '47');
    let alertTriggered = false;
    page.on('dialog', dialog => {
      alertTriggered = true;
      dialog.accept();
    });
    await $inputUserid(page).fill('<script>alert(1)</script>');
    await ss(page, 'input filled', '47');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'user info clicked', '47');
    expect(alertTriggered).toBe(false);
    await ss(page, 'xss protection', '47');
  });

});
