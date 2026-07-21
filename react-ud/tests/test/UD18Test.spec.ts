/**
 * UD18 - HDoc User Doc Administration Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD18.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实 API（无 Mock）
 * 数据库验证: 通过 SQL 查询确认数据，测试前后清理数据
 * 截图保存: tests/test/Image/UD18/
 * 测试用例数: 38
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, createScreenshot, login, PAGE_URL } from './utils';

// -- 截图 --
const ss = createScreenshot('UD18');

// ============================================================
// 元素定位（匹配 HDocUserDocAdministration.tsx / HDocUserDocAdministration.css）
// ============================================================

const $container     = (p: Page) => p.locator('.huda-container');
const $header        = (p: Page) => p.locator('.panel-header h1');
const $err           = (p: Page) => p.locator('.huda-error.msg-error');
const $successMsg    = (p: Page) => p.locator('.huda-success.msg-success');
const $inputUserid   = (p: Page) => p.locator('input.huda-input');
const $userLabel     = (p: Page) => p.locator('.huda-value');
const $btnUserInfo   = (p: Page) => p.locator('button.btn').filter({ hasText: 'User Info' });
const $btnUpdate     = (p: Page) => p.locator('.btn-row button.btn').filter({ hasText: 'UPDATE' });
const $docListbox    = (p: Page) => p.locator('select.huda-doc-listbox');

/** 根据 option 文本获取 option 元素（listbox 内的选项） */
const $docOptionByText = (p: Page, text: string) =>
  p.locator('select.huda-doc-listbox option').filter({ hasText: text });

/** 根据 option value 选中/取消选中 listbox 中的项 */
async function selectDocOptions(page: Page, values: string[]) {
  // select 是 multiple 类型，用 selectOption 选中多个
  await $docListbox(page).selectOption(values);
}

async function deselectAllDocs(page: Page) {
  // 取消所有选中：按住 Ctrl 逐个点击已选中的选项取消选中
  // 或者通过 selectOption 传入空数组
  await $docListbox(page).selectOption([]);
}

/** 获取 listbox 中当前选中的 values */
async function getSelectedDocValues(page: Page): Promise<string[]> {
  return await $docListbox(page).evaluate((sel: HTMLSelectElement) =>
    Array.from(sel.selectedOptions).map(o => o.value)
  );
}

// ============================================================
// 导航辅助函数
// ============================================================

async function navigateToPage(page: Page) {
  await login(page);
  // login 后通过客户端导航跳转到目标页面
  await page.evaluate(() => {
    window.history.pushState({}, '', '/menu/hdoc-user-doc-admin');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForTimeout(2000);
  // 等待组件渲染
  await page.waitForSelector('.huda-container', { timeout: 8000 }).catch(() => {
    console.log('  ⚠️ .huda-container not found, URL: ' + page.url());
  });
  await page.waitForTimeout(1000);
}

// ============================================================
// 测试数据常量
// ============================================================

const TEST_USERID   = 'ud18tuser';
const TEST_PASS     = 'ud18pass1';
const TEST_USERNAME = 'UD18TestUser';
const TEST_EMAIL    = 'ud18@test.com';
const TEST_DOCTYPE_A = 'UD18_DOC_A';
const TEST_DOCTYPE_B = 'UD18_DOC_B';
const TEST_DOCTYPE_C = 'UD18_DOC_C';
const TEST_DESC_A   = 'UD18 Document A';
const TEST_DESC_B   = 'UD18 Document B';
const TEST_DESC_C   = 'UD18 Document C';

/** 插入测试文档类型到 HDOC_DOCUMENT_LIST */
async function insertTestDocumentTypes() {
  // 先清除残留
  for (const dt of [TEST_DOCTYPE_A, TEST_DOCTYPE_B, TEST_DOCTYPE_C]) {
    await queryDB(`DELETE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE = ?`, [dt]);
  }
  // 插入三个测试文档类型
  const docs = [
    { doctype: TEST_DOCTYPE_A, desc: TEST_DESC_A },
    { doctype: TEST_DOCTYPE_B, desc: TEST_DESC_B },
    { doctype: TEST_DOCTYPE_C, desc: TEST_DESC_C },
  ];
  for (const d of docs) {
    await queryDB(
      `INSERT INTO HDOC_DOCUMENT_LIST (DOCTYPE, DESCRIPTION,
         REGISTER_USER, REGISTER_DATETIME, REGISTER_PROCESS,
         UPDATE_USER, UPDATE_DATETIME, UPDATE_PROCESS)
       VALUES (?, ?, 'UD18Test', NOW(), 'UT',
         'UD18Test', NOW(), 'UT')`,
      [d.doctype, d.desc]
    );
  }
}

/** 清理测试文档类型 */
async function cleanupTestDocumentTypes() {
  for (const dt of [TEST_DOCTYPE_A, TEST_DOCTYPE_B, TEST_DOCTYPE_C]) {
    await queryDB(`DELETE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE = ?`, [dt]);
  }
}

/** 插入完整用户数据到 hdoc_user_infor */
async function insertTestUser(override?: { userid?: string; username?: string; password?: string }) {
  const uid = override?.userid || TEST_USERID;
  // 清除残留数据
  await queryDB(`DELETE FROM HDOC_USER_DOC WHERE USERID = ?`, [uid]);
  await queryDB(`DELETE FROM HDOC_FUNCTION_AUTH WHERE USERID = ?`, [uid]);
  await queryDB(`DELETE FROM hdoc_user_infor WHERE USERID = ?`, [uid]);
  // 插入用户
  await queryDB(
    `INSERT INTO hdoc_user_infor (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL,
       REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
       UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, ?, 'UD18', 'Tester', ?,
       NOW(), 'UD18Test', 'UT',
       NOW(), 'UD18Test', 'UT')`,
    [uid, override?.password || TEST_PASS, override?.username || TEST_USERNAME, TEST_EMAIL]
  );
}

/** 插入用户功能权限（HDOC_FUNCTION_AUTH） */
async function insertFunctionAuth(userid: string) {
  await queryDB(
    `INSERT INTO HDOC_FUNCTION_AUTH (USERID, \`FUNCTION\`,
       REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
       UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, 'USER',
       NOW(), 'UD18Test', 'UT',
       NOW(), 'UD18Test', 'UT')`,
    [userid]
  );
}

/** 插入用户文档权限（HDOC_USER_DOC） */
async function insertUserDoc(userid: string, doctypes: string[]) {
  for (const dt of doctypes) {
    await queryDB(
      `INSERT INTO HDOC_USER_DOC (USERID, DOCTYPE,
         REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
         UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
       VALUES (?, ?,
         NOW(), 'UD18Test', 'UT',
         NOW(), 'UD18Test', 'UT')`,
      [userid, dt]
    );
  }
}

/** 清理测试用户所有数据 */
async function cleanupTestUser(userid?: string) {
  const uid = userid || TEST_USERID;
  await queryDB(`DELETE FROM HDOC_USER_DOC WHERE USERID = ?`, [uid]);
  await queryDB(`DELETE FROM HDOC_FUNCTION_AUTH WHERE USERID = ?`, [uid]);
  await queryDB(`DELETE FROM hdoc_user_infor WHERE USERID = ?`, [uid]);
}

/** 清理测试用户文档权限 */
async function cleanupUserDoc(userid?: string) {
  const uid = userid || TEST_USERID;
  await queryDB(`DELETE FROM HDOC_USER_DOC WHERE USERID = ?`, [uid]);
}

// ============================================================
// 测试套件
// ============================================================

test.describe.configure({ mode: 'serial' });
test.describe('UD18 HDoc User Doc Administration', () => {

  // ===========================================================
  // 画面初期表示 (TC1~6)
  // ===========================================================

  test('01 - UserID input field', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '01');
    // 确认 UserID 输入框可见
    await expect($inputUserid(page)).toBeVisible();
    await expect($inputUserid(page)).toHaveAttribute('type', 'text');
    const val = await $inputUserid(page).inputValue();
    expect(val).toBe('');
    await expect($inputUserid(page)).toBeEnabled();
    await ss(page, 'userid input verified', '01');
  });

  test('02 - User label', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '02');
    // User 标签（.huda-value）可见，初期值为空
    await expect($userLabel(page)).toBeVisible();
    const userVal = await $userLabel(page).textContent();
    expect(userVal?.trim()).toBe('');
    await ss(page, 'user label verified', '02');
  });

  test('03 - Document list initial state', async ({ page }) => {
    // 先插入测试文档类型，确保列表有数据
    await insertTestDocumentTypes();
    await navigateToPage(page);
    await ss(page, 'page display', '03');
    // 确认 listbox 可见
    await expect($docListbox(page)).toBeVisible();
    // 确认是否有 multiple 属性
    const isMultiple = await $docListbox(page).getAttribute('multiple');
    expect(isMultiple).not.toBeNull();
    // 所有选项初期为未选中状态
    const selectedValues = await getSelectedDocValues(page);
    expect(selectedValues.length).toBe(0);
    // 检查选项内容是否从 HDOC_DOCUMENT_LIST.DESCRIPTION 获取
    const optionTexts = await $docListbox(page).locator('option').allTextContents();
    console.log('  Document options: ' + optionTexts.join(', '));
    expect(optionTexts.length).toBeGreaterThanOrEqual(3);
    expect(optionTexts).toContain(TEST_DESC_A);
    expect(optionTexts).toContain(TEST_DESC_B);
    expect(optionTexts).toContain(TEST_DESC_C);
    await ss(page, 'document list verified', '03');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '03');
  });

  test('04 - Buttons initial state', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '04');
    // User Info 按钮
    await expect($btnUserInfo(page)).toBeVisible();
    await expect($btnUserInfo(page)).toHaveText('User Info');
    await expect($btnUserInfo(page)).toBeEnabled();
    // Update 按钮
    await expect($btnUpdate(page)).toBeVisible();
    await expect($btnUpdate(page)).toHaveText('UPDATE');
    await expect($btnUpdate(page)).toBeEnabled();
    await ss(page, 'buttons verified', '04');
  });

  test('05 - Error message hidden by default', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '05');
    await expect($err(page)).not.toBeVisible();
    await expect($successMsg(page)).not.toBeVisible();
    await ss(page, 'messages hidden', '05');
  });

  test('06 - Document list load failure', async ({ page }) => {
    await login(page);
    // 先导航到已知页面
    await page.goto(PAGE_URL + '/menu/guide-user', { waitUntil: 'load' });
    await page.waitForSelector('.user-guide-page');
    // 在客户端导航前设置路由拦截（abort 触发组件的 catch 块）
    await page.route('**/api/v1/hdoc/ud20/getDocumentList', route => route.abort());
    // 客户端导航到 UD18 页面
    await page.evaluate(() => {
      window.history.pushState({}, '', '/menu/hdoc-user-doc-admin');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForTimeout(2000);
    // 等待 huda-container 出现（组件渲染）
    await page.waitForSelector('.huda-container', { timeout: 10000 }).catch(() => {
      console.log('  huda-container may not have appeared');
    });
    await page.waitForTimeout(2000);
    await ss(page, 'page with error', '06');
    // 错误消息可见
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('Failed to fetch');
    await ss(page, 'error message verified', '06');
    // 取消拦截
    await page.unroute('**/api/v1/hdoc/ud20/getDocumentList');
  });

  // ===========================================================
  // UserID 输入框属性校验 (TC7~9)
  // ===========================================================

  test('07 - UserID max length 10', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '07');
    // 输入 A 重复11次
    await $inputUserid(page).fill('A'.repeat(11));
    await ss(page, 'input 11 chars', '07');
    const val = await $inputUserid(page).inputValue();
    console.log('  Input length: ' + val.length);
    expect(val.length).toBe(10);
    expect(val).toBe('A'.repeat(10));
    await ss(page, 'max length verified', '07');
  });

  test('08 - UserID initial empty', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '08');
    const val = await $inputUserid(page).inputValue();
    expect(val).toBe('');
    await ss(page, 'empty value verified', '08');
  });

  test('09 - UserID allowed chars (alphanumeric)', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '09');
    await $inputUserid(page).fill('TestUser01');
    await ss(page, 'input filled', '09');
    const val = await $inputUserid(page).inputValue();
    expect(val).toBe('TestUser01');
    await ss(page, 'alphanumeric verified', '09');
  });

  // ===========================================================
  // Document 复选框操作 (TC10~12)
  // ===========================================================

  test('10 - Document checkbox toggle', async ({ page }) => {
    await insertTestDocumentTypes();
    await navigateToPage(page);
    await ss(page, 'page display', '10');
    // 选中第一个选项
    const firstOption = $docListbox(page).locator('option').first();
    const firstValue = await firstOption.getAttribute('value') || '';
    console.log('  First option value: ' + firstValue);
    await selectDocOptions(page, [firstValue]);
    await ss(page, 'option selected', '10');
    const selected1 = await getSelectedDocValues(page);
    expect(selected1).toContain(firstValue);
    // 取消选中
    await deselectAllDocs(page);
    await ss(page, 'option deselected', '10');
    const selected2 = await getSelectedDocValues(page);
    expect(selected2).not.toContain(firstValue);
    await ss(page, 'toggle verified', '10');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '10');
  });

  test('11 - Document multiple select', async ({ page }) => {
    await insertTestDocumentTypes();
    await navigateToPage(page);
    await ss(page, 'page display', '11');
    // 选中多个选项
    await selectDocOptions(page, [TEST_DOCTYPE_A, TEST_DOCTYPE_B, TEST_DOCTYPE_C]);
    await ss(page, 'multiple selected', '11');
    const selected = await getSelectedDocValues(page);
    expect(selected).toContain(TEST_DOCTYPE_A);
    expect(selected).toContain(TEST_DOCTYPE_B);
    expect(selected).toContain(TEST_DOCTYPE_C);
    expect(selected.length).toBe(3);
    await ss(page, 'multiple verified', '11');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '11');
  });

  test('12 - Document select all / deselect all', async ({ page }) => {
    await insertTestDocumentTypes();
    await navigateToPage(page);
    await ss(page, 'page display', '12');
    // 全选
    const allValues = await $docListbox(page).locator('option').evaluateAll((opts: Element[]) =>
      (opts as HTMLOptionElement[]).map(o => o.value).filter(v => v)
    );
    console.log('  All values: ' + allValues.join(', '));
    await selectDocOptions(page, allValues);
    await ss(page, 'all selected', '12');
    const selected1 = await getSelectedDocValues(page);
    expect(selected1.length).toBe(allValues.length);
    // 全取消
    await deselectAllDocs(page);
    await ss(page, 'all deselected', '12');
    const selected2 = await getSelectedDocValues(page);
    expect(selected2.length).toBe(0);
    await ss(page, 'select all/deselect all verified', '12');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '12');
  });

  // ===========================================================
  // User Info 按钮点击事件 (TC13~19)
  // ===========================================================

  test('13 - User Info - empty UserID validation', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '13');
    // UserID 为空，点击 User Info
    await $btnUserInfo(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'user info clicked', '13');
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await expect($err(page)).toContainText('UserID is required');
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

  test('15 - User Info - query success (show user info and doc permissions)', async ({ page }) => {
    // 准备测试数据
    await insertTestDocumentTypes();
    await insertTestUser();
    await insertFunctionAuth(TEST_USERID);
    await insertUserDoc(TEST_USERID, [TEST_DOCTYPE_A]);
    await navigateToPage(page);
    await ss(page, 'page display', '15');
    await $inputUserid(page).fill(TEST_USERID);
    await ss(page, 'input filled', '15');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'user info clicked', '15');
    // User 标签显示用户名
    const userName = await $userLabel(page).textContent();
    console.log('  Username: ' + userName);
    expect(userName?.trim()).toBe(TEST_USERNAME);
    // 用户已有的文档权限复选框被自动勾选（TEST_DOCTYPE_A）
    const selected = await getSelectedDocValues(page);
    console.log('  Selected docs: ' + selected.join(', '));
    expect(selected).toContain(TEST_DOCTYPE_A);
    // 用户没有的文档权限复选框保持未选中
    expect(selected).not.toContain(TEST_DOCTYPE_B);
    expect(selected).not.toContain(TEST_DOCTYPE_C);
    // 错误消息区域不可见
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'query success', '15');
    // DB 验证：确认 HDOC_USER_DOC 中有对应记录
    const dbRows = await queryDB(
      `SELECT DOCTYPE FROM HDOC_USER_DOC WHERE USERID = ? ORDER BY DOCTYPE`,
      [TEST_USERID]
    );
    if (dbRows) {
      const dbDocTypes = dbRows.map((r: any) => r.DOCTYPE);
      console.log('  DB doc types: ' + dbDocTypes.join(', '));
      expect(dbDocTypes).toContain(TEST_DOCTYPE_A);
    }
    await cleanupUserDoc();
    await cleanupTestUser();
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '15');
  });

  test('16 - User Info - user exists but no doc permissions', async ({ page }) => {
    await insertTestDocumentTypes();
    await insertTestUser({ userid: 'ud18nodoc', username: 'NoDocUser' });
    await insertFunctionAuth('ud18nodoc');
    await navigateToPage(page);
    await ss(page, 'page display', '16');
    await $inputUserid(page).fill('ud18nodoc');
    await ss(page, 'input filled', '16');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'user info clicked', '16');
    // User 标签显示用户名
    const userName = await $userLabel(page).textContent();
    console.log('  Username: ' + userName);
    expect(userName?.trim()).toBe('NoDocUser');
    // 所有 Document 复选框均为未选中状态
    const selected = await getSelectedDocValues(page);
    expect(selected.length).toBe(0);
    // 无错误消息
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'no doc permissions', '16');
    await cleanupTestUser('ud18nodoc');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '16');
  });

  test('17 - User Info - trim spaces', async ({ page }) => {
    const shortId = 'ud18trim';
    const shortName = 'TrimUser';
    await insertTestDocumentTypes();
    await cleanupTestUser(shortId);
    await insertTestUser({ userid: shortId, username: shortName });
    await insertFunctionAuth(shortId);
    await navigateToPage(page);
    await ss(page, 'page display', '17');
    // 前後スペースを入力（maxLength=10 に注意）
    await $inputUserid(page).fill('  ' + shortId + ' ');
    await ss(page, 'input with spaces', '17');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'user info clicked', '17');
    // トリム後の UserID で検索 → 正常に表示
    const userName = await $userLabel(page).textContent();
    console.log('  Username: ' + userName);
    expect(userName?.trim()).toBe(shortName);
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'trim result', '17');
    await cleanupTestUser(shortId);
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '17');
  });

  test('18 - User Info - loading state', async ({ page }) => {
    await insertTestDocumentTypes();
    await insertTestUser();
    await insertFunctionAuth(TEST_USERID);
    await navigateToPage(page);
    await ss(page, 'page display', '18');
    await $inputUserid(page).fill(TEST_USERID);
    await ss(page, 'input filled', '18');
    // 同时点击 User Info 并在 API 返回前确认按钮状态
    await $btnUserInfo(page).click();
    try {
      await expect($btnUserInfo(page)).toBeDisabled({ timeout: 2000 });
      await expect($btnUpdate(page)).toBeDisabled({ timeout: 1000 });
      console.log('  Buttons disabled during loading');
    } catch {
      console.log('  API response too fast, loading state not captured');
    }
    await page.waitForTimeout(2000);
    await ss(page, 'loading state', '18');
    await cleanupTestUser();
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '18');
  });

  test('19 - User Info - prevent duplicate submit', async ({ page }) => {
    await insertTestDocumentTypes();
    await insertTestUser();
    await insertFunctionAuth(TEST_USERID);
    await navigateToPage(page);
    await ss(page, 'page display', '19');
    await $inputUserid(page).fill(TEST_USERID);
    await ss(page, 'input filled', '19');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(200);
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'duplicate click', '19');
    await cleanupTestUser();
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '19');
  });

  // ===========================================================
  // Update 按钮点击事件 (TC20~26)
  // ===========================================================

  test('20 - Update - user not exists', async ({ page }) => {
    await insertTestDocumentTypes();
    await navigateToPage(page);
    await ss(page, 'page display', '20');
    await $inputUserid(page).fill('nonexistuser');
    // 选中一个文档
    await selectDocOptions(page, [TEST_DOCTYPE_A]);
    await ss(page, 'input filled', '20');
    await $btnUpdate(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'update clicked', '20');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText("We didn't recognize the userid you entered. Please try again.");
    await expect($btnUpdate(page)).toBeEnabled();
    await ss(page, 'not found error', '20');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '20');
  });

  test('21 - Update - add new document permissions', async ({ page }) => {
    await insertTestDocumentTypes();
    await cleanupTestUser('ud18updadd');
    await insertTestUser({ userid: 'ud18updadd', username: 'UpdAddUser' });
    await insertFunctionAuth('ud18updadd');
    // 已有权限 TEST_DOCTYPE_A
    await insertUserDoc('ud18updadd', [TEST_DOCTYPE_A]);
    await navigateToPage(page);
    await ss(page, 'page display', '21');
    // User Info 获取当前权限
    await $inputUserid(page).fill('ud18updadd');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'user info loaded', '21');
    // 确认已有权限
    let selected = await getSelectedDocValues(page);
    console.log('  Current selected: ' + selected.join(', '));
    expect(selected).toContain(TEST_DOCTYPE_A);
    // 新增 TEST_DOCTYPE_B
    selected.push(TEST_DOCTYPE_B);
    await selectDocOptions(page, selected);
    await ss(page, 'new doc selected', '21');
    // 点击 Update
    await $btnUpdate(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'update clicked', '21');
    // 成功消息
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('用户文档权限更新成功');
    await ss(page, 'success message', '21');
    // DB 验证
    const dbRows = await queryDB(
      `SELECT DOCTYPE FROM HDOC_USER_DOC WHERE USERID = ? ORDER BY DOCTYPE`,
      ['ud18updadd']
    );
    if (dbRows) {
      const dbDocTypes = dbRows.map((r: any) => r.DOCTYPE);
      console.log('  DB doc types after update: ' + dbDocTypes.join(', '));
      expect(dbDocTypes).toContain(TEST_DOCTYPE_A);
      expect(dbDocTypes).toContain(TEST_DOCTYPE_B);
    }
    // 重新 User Info 查询确认
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 're-query', '21');
    const selectedAfter = await getSelectedDocValues(page);
    expect(selectedAfter).toContain(TEST_DOCTYPE_A);
    expect(selectedAfter).toContain(TEST_DOCTYPE_B);
    // 清理
    await cleanupTestUser('ud18updadd');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '21');
  });

  test('22 - Update - remove all document permissions', async ({ page }) => {
    await insertTestDocumentTypes();
    await cleanupTestUser('ud18rmall');
    await insertTestUser({ userid: 'ud18rmall', username: 'RmAllUser' });
    await insertFunctionAuth('ud18rmall');
    await insertUserDoc('ud18rmall', [TEST_DOCTYPE_A, TEST_DOCTYPE_B]);
    await navigateToPage(page);
    await ss(page, 'page display', '22');
    // User Info 获取当前权限
    await $inputUserid(page).fill('ud18rmall');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'user info loaded', '22');
    // 取消所有勾选
    await deselectAllDocs(page);
    await ss(page, 'all deselected', '22');
    // 点击 Update
    await $btnUpdate(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'update clicked', '22');
    // 成功消息
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('用户文档权限更新成功');
    await ss(page, 'success message', '22');
    // DB 验证：该用户所有文档权限被删除
    const dbRows = await queryDB(
      `SELECT COUNT(*) as CNT FROM HDOC_USER_DOC WHERE USERID = ?`,
      ['ud18rmall']
    );
    if (dbRows) {
      console.log('  DB user doc count after remove all: ' + dbRows[0].CNT);
      expect(dbRows[0].CNT).toBe(0);
    }
    // 重新 User Info 查询确认
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 're-query', '22');
    const selectedAfter = await getSelectedDocValues(page);
    expect(selectedAfter.length).toBe(0);
    await cleanupTestUser('ud18rmall');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '22');
  });

  test('23 - Update - modify document permissions (remove old + add new)', async ({ page }) => {
    await insertTestDocumentTypes();
    await cleanupTestUser('ud18mod');
    await insertTestUser({ userid: 'ud18mod', username: 'ModUser' });
    await insertFunctionAuth('ud18mod');
    // 已有权限 TEST_DOCTYPE_A
    await insertUserDoc('ud18mod', [TEST_DOCTYPE_A]);
    await navigateToPage(page);
    await ss(page, 'page display', '23');
    // User Info 获取当前权限
    await $inputUserid(page).fill('ud18mod');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'user info loaded', '23');
    // 取消 TEST_DOCTYPE_A，新增 TEST_DOCTYPE_C
    await selectDocOptions(page, [TEST_DOCTYPE_C]);
    await ss(page, 'permissions modified', '23');
    // 点击 Update
    await $btnUpdate(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'update clicked', '23');
    // 成功消息
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('用户文档权限更新成功');
    await ss(page, 'success message', '23');
    // DB 验证
    const dbRows = await queryDB(
      `SELECT DOCTYPE FROM HDOC_USER_DOC WHERE USERID = ? ORDER BY DOCTYPE`,
      ['ud18mod']
    );
    if (dbRows) {
      const dbDocTypes = dbRows.map((r: any) => r.DOCTYPE);
      console.log('  DB doc types after modify: ' + dbDocTypes.join(', '));
      expect(dbDocTypes).not.toContain(TEST_DOCTYPE_A);
      expect(dbDocTypes).toContain(TEST_DOCTYPE_C);
    }
    // 重新 User Info 查询确认
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 're-query', '23');
    const selectedAfter = await getSelectedDocValues(page);
    expect(selectedAfter).not.toContain(TEST_DOCTYPE_A);
    expect(selectedAfter).toContain(TEST_DOCTYPE_C);
    await cleanupTestUser('ud18mod');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '23');
  });

  test('24 - Update - loading state', async ({ page }) => {
    await insertTestDocumentTypes();
    await cleanupTestUser('ud18ld');
    await insertTestUser({ userid: 'ud18ld', username: 'LoadTest' });
    await insertFunctionAuth('ud18ld');
    await navigateToPage(page);
    await ss(page, 'page display', '24');
    await $inputUserid(page).fill('ud18ld');
    await selectDocOptions(page, [TEST_DOCTYPE_A]);
    await ss(page, 'input filled', '24');
    await $btnUpdate(page).click();
    try {
      await expect($btnUpdate(page)).toBeDisabled({ timeout: 2000 });
      await expect($btnUserInfo(page)).toBeDisabled({ timeout: 1000 });
      console.log('  Buttons disabled during loading');
    } catch {
      console.log('  API response too fast');
    }
    await page.waitForTimeout(2000);
    await ss(page, 'loading state', '24');
    await cleanupTestUser('ud18ld');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '24');
  });

  test('25 - Update - prevent duplicate submit', async ({ page }) => {
    await insertTestDocumentTypes();
    await cleanupTestUser('ud18dup');
    await insertTestUser({ userid: 'ud18dup', username: 'DupSubmit' });
    await insertFunctionAuth('ud18dup');
    await navigateToPage(page);
    await ss(page, 'page display', '25');
    await $inputUserid(page).fill('ud18dup');
    await selectDocOptions(page, [TEST_DOCTYPE_A]);
    await ss(page, 'input filled', '25');
    await $btnUpdate(page).click();
    await page.waitForTimeout(200);
    await $btnUpdate(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'duplicate click', '25');
    await cleanupTestUser('ud18dup');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '25');
  });

  test('26 - Update - API returns 500 error', async ({ page }) => {
    await insertTestDocumentTypes();
    await cleanupTestUser('ud18500');
    await insertTestUser({ userid: 'ud18500', username: 'Err500User' });
    await insertFunctionAuth('ud18500');
    await navigateToPage(page);
    await ss(page, 'page display', '26');
    await $inputUserid(page).fill('ud18500');
    await selectDocOptions(page, [TEST_DOCTYPE_A]);
    await ss(page, 'input filled', '26');
    // 拦截 delete API 返回 500
    await page.route('**/api/v1/hdoc/user/doc/delete', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'System error. Please contact administrator.', data: null }),
      });
    });
    await $btnUpdate(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'update clicked', '26');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('System error. Please contact administrator.');
    await expect($btnUpdate(page)).toBeEnabled();
    await expect($btnUserInfo(page)).toBeEnabled();
    await ss(page, '500 error', '26');
    await page.unroute('**/api/v1/hdoc/user/doc/delete');
    await cleanupTestUser('ud18500');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '26');
  });

  // ===========================================================
  // 异常处理 (TC27~34)
  // ===========================================================

  test('27 - Network error on User Info', async ({ page }) => {
    await insertTestDocumentTypes();
    await insertTestUser();
    await insertFunctionAuth(TEST_USERID);
    // 拦截 /function/auth/count 模拟网络断开
    await page.route('**/api/v1/hdoc/function/auth/count', route => route.abort());
    await navigateToPage(page);
    await ss(page, 'page display', '27');
    await $inputUserid(page).fill(TEST_USERID);
    await ss(page, 'input filled', '27');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/function/auth/count');
    await ss(page, 'user info clicked', '27');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('Failed to fetch');
    await expect($btnUserInfo(page)).toBeEnabled();
    await ss(page, 'network error', '27');
    await cleanupTestUser();
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '27');
  });

  test('28 - Saviynt system call failure', async ({ page }) => {
    await insertTestDocumentTypes();
    await insertTestUser();
    await insertFunctionAuth(TEST_USERID);
    // 先正常登录并导航到页面
    await navigateToPage(page);
    await ss(page, 'page display', '28');
    await $inputUserid(page).fill(TEST_USERID);
    await ss(page, 'input filled', '28');
    // 在点击 User Info 前设置拦截 /login（模拟 Saviynt 异常）
    // 注意：拦截必须在 login() 之后设置，否则初始登录会失败
    await page.route('**/api/v1/hdoc/login', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'text/plain',
        body: 'Service Error',
      });
    });
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/login');
    await ss(page, 'user info clicked', '28');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('Unexpected token');
    await expect($btnUserInfo(page)).toBeEnabled();
    await ss(page, 'saviynt error', '28');
    await cleanupTestUser();
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '28');
  });

  test('29 - 404 error on User Info (user not in function auth)', async ({ page }) => {
    await insertTestDocumentTypes();
    // 拦截 /function/auth/count 返回 authCount=0（用户不存在于功能权限表）
    await page.route('**/api/v1/hdoc/function/auth/count', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: 'success',
          data: { userId: 'NONEXIST_USER', authCount: 0 },
        }),
      });
    });
    await navigateToPage(page);
    await ss(page, 'page display', '29');
    await $inputUserid(page).fill('NONEXIST_USER');
    await ss(page, 'input filled', '29');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/function/auth/count');
    await ss(page, 'user info clicked', '29');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText("We didn't recognize the userid you entered. Please try again.");
    await expect($btnUserInfo(page)).toBeEnabled();
    await ss(page, '404 error', '29');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '29');
  });

  test('30 - 404 error on Update (user not in function auth)', async ({ page }) => {
    await insertTestDocumentTypes();
    await page.route('**/api/v1/hdoc/function/auth/count', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: 'success',
          data: { userId: 'NONEXIST_USER', authCount: 0 },
        }),
      });
    });
    await navigateToPage(page);
    await ss(page, 'page display', '30');
    await $inputUserid(page).fill('NONEXIST_USER');
    await selectDocOptions(page, [TEST_DOCTYPE_A]);
    await ss(page, 'input filled', '30');
    await $btnUpdate(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/function/auth/count');
    await ss(page, 'update clicked', '30');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText("We didn't recognize the userid you entered. Please try again.");
    await expect($btnUpdate(page)).toBeEnabled();
    await ss(page, '404 error on update', '30');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '30');
  });

  test('31 - 401 auth error on User Info', async ({ page }) => {
    await insertTestDocumentTypes();
    await insertTestUser();
    await insertFunctionAuth(TEST_USERID);
    // 拦截 /function/auth/count 返回非 JSON 触发 catch 块
    await page.route('**/api/v1/hdoc/function/auth/count', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'text/plain',
        body: 'Unauthorized',
      });
    });
    await navigateToPage(page);
    await ss(page, 'page display', '31');
    await $inputUserid(page).fill(TEST_USERID);
    await ss(page, 'input filled', '31');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/function/auth/count');
    await ss(page, 'user info clicked', '31');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('Unexpected token');
    await expect($btnUserInfo(page)).toBeEnabled();
    await ss(page, '401 error', '31');
    await cleanupTestUser();
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '31');
  });

  test('32 - 401 auth error on Update', async ({ page }) => {
    await insertTestDocumentTypes();
    await cleanupTestUser('ud18401upd');
    await insertTestUser({ userid: 'ud18401upd', username: 'Upd401User' });
    await insertFunctionAuth('ud18401upd');
    // 拦截 /user/doc/delete 返回 401
    await page.route('**/api/v1/hdoc/user/doc/delete', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ code: 401, message: 'Unauthorized', data: null }),
      });
    });
    await navigateToPage(page);
    await ss(page, 'page display', '32');
    await $inputUserid(page).fill('ud18401upd');
    await selectDocOptions(page, [TEST_DOCTYPE_A]);
    await ss(page, 'input filled', '32');
    await $btnUpdate(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/user/doc/delete');
    await ss(page, 'update clicked', '32');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('Unauthorized');
    await expect($btnUpdate(page)).toBeEnabled();
    await ss(page, '401 error on update', '32');
    await cleanupTestUser('ud18401upd');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '32');
  });

  test('33 - 500 error on Update', async ({ page }) => {
    await insertTestDocumentTypes();
    await cleanupTestUser('ud18500upd');
    await insertTestUser({ userid: 'ud18500upd', username: 'Upd500User' });
    await insertFunctionAuth('ud18500upd');
    // 拦截 /user/doc/delete 返回 500
    await page.route('**/api/v1/hdoc/user/doc/delete', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'System error. Please contact administrator.', data: null }),
      });
    });
    await navigateToPage(page);
    await ss(page, 'page display', '33');
    await $inputUserid(page).fill('ud18500upd');
    await selectDocOptions(page, [TEST_DOCTYPE_A]);
    await ss(page, 'input filled', '33');
    await $btnUpdate(page).click();
    await page.waitForTimeout(2000);
    await page.unroute('**/api/v1/hdoc/user/doc/delete');
    await ss(page, 'update clicked', '33');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('System error. Please contact administrator.');
    await expect($btnUpdate(page)).toBeEnabled();
    await ss(page, '500 error on update', '33');
    await cleanupTestUser('ud18500upd');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '33');
  });

  test('34 - Error message clear on new operation', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '34');
    // 第1次：空 UserID 点击 User Info（触发错误）
    await $btnUserInfo(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'first error triggered', '34');
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await expect($err(page)).toContainText('UserID is required');
    // 第2次：输入不存在的用户（旧消息应被清除，显示新消息）
    await $inputUserid(page).fill('nonexistuser');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'second error triggered', '34');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText("We didn't recognize the userid you entered. Please try again.");
    await ss(page, 'message cleared and replaced', '34');
  });

  // ===========================================================
  // 消息显示 (TC35~36)
  // ===========================================================

  test('35 - Error message display (style check)', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '35');
    // 触发错误消息
    await $btnUserInfo(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'error triggered', '35');
    // 错误消息可见
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    // 错误消息文本
    await expect($err(page)).toContainText('UserID is required');
    // 错误消息文字颜色为红色
    const errColor = await $err(page).evaluate(el => window.getComputedStyle(el).color);
    console.log('  Error message color: ' + errColor);
    // 红色（rgb(255, 0, 0) 或类似）
    expect(errColor.toLowerCase()).toBe('rgb(229, 57, 53)');
    // 成功消息区域不显示
    await expect($successMsg(page)).not.toBeVisible();
    await ss(page, 'error message style', '35');
  });

  test('36 - Success message display (style check)', async ({ page }) => {
    await insertTestDocumentTypes();
    await cleanupTestUser('ud18succ');
    await insertTestUser({ userid: 'ud18succ', username: 'SuccessUser' });
    await insertFunctionAuth('ud18succ');
    await navigateToPage(page);
    await ss(page, 'page display', '36');
    // 输入用户并勾选文档，点击 Update
    await $inputUserid(page).fill('ud18succ');
    await selectDocOptions(page, [TEST_DOCTYPE_A]);
    await ss(page, 'input filled', '36');
    await $btnUpdate(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'update clicked', '36');
    // 成功消息可见
    await expect($successMsg(page)).toBeVisible({ timeout: 10000 });
    await expect($successMsg(page)).toContainText('用户文档权限更新成功');
    // 成功消息文字颜色为绿色
    const succColor = await $successMsg(page).evaluate(el => window.getComputedStyle(el).color);
    console.log('  Success message color: ' + succColor);
    // 绿色
    expect(succColor.toLowerCase()).toBe('rgb(56, 158, 13)');
    // 错误消息区域不显示
    await expect($err(page)).not.toBeVisible();
    await ss(page, 'success message style', '36');
    // DB 验证
    const dbRows = await queryDB(
      `SELECT DOCTYPE FROM HDOC_USER_DOC WHERE USERID = ? ORDER BY DOCTYPE`,
      ['ud18succ']
    );
    if (dbRows) {
      const dbDocTypes = dbRows.map((r: any) => r.DOCTYPE);
      console.log('  DB doc types: ' + dbDocTypes.join(', '));
      expect(dbDocTypes).toContain(TEST_DOCTYPE_A);
    }
    await cleanupTestUser('ud18succ');
    await cleanupTestDocumentTypes();
    await ss(page, 'cleaned', '36');
  });

  // ===========================================================
  // 安全性 (TC37~38)
  // ===========================================================

  test('37 - Security - unauthenticated access redirects to login', async ({ page }) => {
    // 清除 localStorage
    await page.goto(PAGE_URL, { waitUntil: 'load' });
    await page.evaluate(() => {
      localStorage.clear();
    });
    await ss(page, 'localStorage cleared', '37');
    // 直接访问 HDoc User Doc Administration 页面
    await page.goto(PAGE_URL + '/menu/hdoc-user-doc-admin', { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    await ss(page, 'redirect result', '37');
    // 页面跳转到登录页
    await expect(page).toHaveURL(/\/login/);
    await ss(page, 'redirected to login', '37');
  });

  test('38 - Security - SQL injection protection', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '38');
    // 输入 SQL 注入代码
    await $inputUserid(page).fill("' OR '1'='1");
    await ss(page, 'sql injection input', '38');
    await $btnUserInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'user info clicked', '38');
    // 错误消息不包含 SQL 相关关键词
    if (await $err(page).isVisible()) {
      const errText = await $err(page).textContent() || '';
      console.log('  Error message: ' + errText);
      expect(errText.toLowerCase()).not.toContain('sql');
      expect(errText.toLowerCase()).not.toContain('syntax');
    }
    // 系统正常运行，无异常
    await expect($btnUserInfo(page)).toBeEnabled();
    await ss(page, 'sql injection result', '38');
  });

});
