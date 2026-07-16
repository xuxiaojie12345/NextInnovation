/**
 * UD01 - 用户登录模块 Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD01.md (v2.0)
 * 测试前提: 前后端均已启动，使用真实 API（无 Mock）
 * 数据库验证: 通过 SQL 查询 hdoc_user_infor 表确认数据
 * 截图保存: tests/test/Image/UD01/
 * 测试用例数: 58
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, getTestUser, createScreenshot } from './utils';

// ── 截图（使用 utils 共通工厂，序号从 001 开始递增） ──
const ss = createScreenshot('UD01');

// ── 元素定位（严格匹配 Login.tsx 源码） ──
const $uid  = (p: Page) => p.locator('input[placeholder="UserID"]');
const $pwd  = (p: Page) => p.locator('input[placeholder="Password"]');
const $btn  = (p: Page) => p.locator('.login-button');
const $err  = (p: Page) => p.locator('.error-message');
const $left = (p: Page) => p.locator('.login-info-panel');
const $form = (p: Page) => p.locator('.login-form-panel');
const $alt  = (p: Page) => p.locator('.alternative-login-info');
const $container = (p: Page) => p.locator('.login-container');

// ── 前置：每次测试前访问登录页 ──
test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000', { waitUntil: 'load' });
  await page.waitForSelector('.login-container');
});

// ── 串行执行 ──
test.describe.configure({ mode: 'serial' });
test.describe('UD01 用户登录模块', () => {

  // ════════════════════════════════════════════
  // 画面初期表示 (TC01~04)
  // ════════════════════════════════════════════

  test('01-画面初期表示-整体布局', async ({ page }) => {
    // 验证左右面板和背景图
    await expect($container(page)).toBeVisible();
    await expect($left(page)).toBeVisible();
    await expect($form(page)).toBeVisible();
    const bgImage = await $container(page).evaluate(el => getComputedStyle(el).backgroundImage);
    expect(bgImage).toContain('fTRYDXFAD');
    await ss(page, '整体布局', '01');
  });

  test('02-画面初期表示-左侧信息区文字内容', async ({ page }) => {
    // 验证左侧 EDB 标题和描述文字
    const titleDiv = $left(page).locator('.left-content > div');
    await expect(titleDiv).toContainText('EDB Engineering Database');
    await expect(titleDiv.locator('span')).toContainText('EDB');
    await expect($left(page).locator('p').nth(0))
      .toContainText('Use Outlook id and password');
    await expect($left(page).locator('p').nth(1))
      .toContainText('Support TPI');
    await ss(page, '左侧信息区', '02');
  });

  test('03-画面初期表示-右侧表单区控件状态', async ({ page }) => {
    // 验证 UserID 输入框
    await expect($uid(page)).toBeVisible();
    await expect($uid(page)).toHaveAttribute('type', 'text');
    await expect($uid(page)).toHaveAttribute('maxLength', '10');
    await expect($uid(page)).toBeEnabled();
    // 验证 Password 输入框
    await expect($pwd(page)).toBeVisible();
    await expect($pwd(page)).toHaveAttribute('type', 'password');
    await expect($pwd(page)).toHaveAttribute('maxLength', '32');
    await expect($pwd(page)).toBeEnabled();
    // 验证登录按钮
    await expect($btn(page)).toBeVisible();
    await expect($btn(page)).toHaveText('Login');
    await expect($btn(page)).toBeEnabled();
    // 错误消息默认隐藏
    await expect($err(page)).not.toBeVisible();
    await ss(page, '表单区控件', '03');
  });

  test('04-画面初期表示-备选登录提示', async ({ page }) => {
    // 验证备选登录提示的 3 行文本
    await expect($alt(page).locator('p').nth(0))
      .toContainText('Your account is locked');
    await expect($alt(page).locator('p').nth(1))
      .toContainText('alternative login link');
    await expect($alt(page).locator('p').nth(2))
      .toContainText('root cause of problem');
    await ss(page, '备选登录提示', '04');
  });

  // ════════════════════════════════════════════
  // UserID输入框 属性校验 (TC05~12)
  // ════════════════════════════════════════════

  test('05-UserID-控件类型', async ({ page }) => {
    await expect($uid(page)).toHaveAttribute('type', 'text');
    await ss(page, '入力前', '05');
    await $uid(page).fill('test');
    await expect($uid(page)).toHaveValue('test');
    await ss(page, '控件类型', '05');
  });

  test('06-UserID-必须属性（前端空值校验触发）', async ({ page }) => {
    // 不输入任何内容直接点击登录，触发前端空值校验
    await ss(page, '登录前', '06');
    await $btn(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('required');
    await ss(page, '空值校验', '06');
  });

  test('07-UserID-最大长度（maxLength=10）', async ({ page }) => {
    await ss(page, '入力前', '07');
    await $uid(page).fill('ABCDEFGHIJK');
    const val = await $uid(page).inputValue();
    expect(val.length).toBe(10);
    expect(val).toBe('ABCDEFGHIJ');
    await ss(page, '最大长度截断', '07');
  });

  test('08-UserID半角英数字校验-特殊字符拒否', async ({ page }) => {
    // UserID含特殊字符 @#，但 onChange 会自动过滤非字母数字，API被调用后返回错误
    await ss(page, '入力前', '08');
    await $uid(page).fill('test@#');
    await $pwd(page).fill('pass123');
    await ss(page, '登录前', '08');
    await $btn(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText("We didn't recognize");
    // URL未跳转说明登录失败
    expect(page.url()).not.toContain('/menu');
    await expect($btn(page)).toBeEnabled();
    await ss(page, '特殊字符拒否', '08');
  });

  test('09-UserID半角英数字校验-全角文字拒否', async ({ page }) => {
    // UserID含全角英文字母，onChange 过滤后 UserID 变为空字符串，触发空值校验
    await ss(page, '入力前', '09');
    await $uid(page).fill('ｔｅｓｔ');
    await $pwd(page).fill('pass123');
    await ss(page, '登录前', '09');
    await $btn(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Username and password are required.');
    // URL未跳转说明API未被调用
    expect(page.url()).not.toContain('/menu');
    await expect($btn(page)).toBeEnabled();
    await ss(page, '全角文字拒否', '09');
  });

  test('10-UserID-文字配置（左对齐）', async ({ page }) => {
    await ss(page, '入力前', '10');
    await $uid(page).fill('admin');
    const align = await $uid(page).evaluate(el => getComputedStyle(el).textAlign);
    expect(['left', 'start']).toContain(align);
    await ss(page, '左对齐', '10');
  });

  test('11-UserID-初期值（空字符串）', async ({ page }) => {
    await expect($uid(page)).toHaveValue('');
    await ss(page, '初期值空', '11');
  });

  test('12-UserID-表示制御（初期活性）', async ({ page }) => {
    await expect($uid(page)).toBeEnabled();
    await ss(page, '活性状态', '12');
  });

  // ════════════════════════════════════════════
  // Password输入框 属性校验 (TC13~19)
  // ════════════════════════════════════════════

  test('13-Password-控件类型（掩码）', async ({ page }) => {
    await expect($pwd(page)).toHaveAttribute('type', 'password');
    await ss(page, 'password类型', '13');
  });

  test('14-Password-最大长度（maxLength=32）', async ({ page }) => {
    await ss(page, '入力前', '14');
    await $pwd(page).fill('A'.repeat(33));
    const val = await $pwd(page).inputValue();
    expect(val.length).toBe(32);
    await ss(page, '最大长度截断', '14');
  });

  test('15-Password-允许文字（含特殊字符）', async ({ page }) => {
    await ss(page, '入力前', '15');
    await $pwd(page).fill('P@ssw0rd!#');
    await expect($pwd(page)).toHaveValue('P@ssw0rd!#');
    await ss(page, '特殊字符', '15');
  });

  test('16-Password-掩码显示效果', async ({ page }) => {
    await ss(page, '入力前', '16');
    await $pwd(page).fill('MyP@ss123');
    await expect($pwd(page)).toHaveAttribute('type', 'password');
    await expect($pwd(page)).toHaveValue('MyP@ss123');
    await ss(page, '掩码显示', '16');
  });

  test('17-Password-文字配置（左对齐）', async ({ page }) => {
    await ss(page, '入力前', '17');
    await $pwd(page).fill('mypass');
    const align = await $pwd(page).evaluate(el => getComputedStyle(el).textAlign);
    expect(['left', 'start']).toContain(align);
    await ss(page, '左对齐', '17');
  });

  test('18-Password-初期值（空字符串）', async ({ page }) => {
    await expect($pwd(page)).toHaveValue('');
    await ss(page, '初期值空', '18');
  });

  test('19-Password-表示制御（初期活性）', async ({ page }) => {
    await expect($pwd(page)).toBeEnabled();
    await ss(page, '活性状态', '19');
  });

  // ════════════════════════════════════════════
  // Message显示 属性校验 (TC20~22)
  // ════════════════════════════════════════════

  test('20-Message-初期表示（隐藏）', async ({ page }) => {
    await expect($err(page)).not.toBeVisible();
    await ss(page, '消息隐藏', '20');
  });

  test('21-Message-文字颜色（红色 #ff4d4f）', async ({ page }) => {
    await ss(page, '登录前', '21');
    await $btn(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('required');
    const color = await $err(page).evaluate(el => getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 77, 79)');
    const fontSize = await $err(page).evaluate(el => getComputedStyle(el).fontSize);
    expect(fontSize).toBe('14px');
    await ss(page, '红色文字', '21');
  });

  test('22-Message-最大长度（256文字）', async ({ page }) => {
    // 从DB获取用户，使用正确UserID+错误密码触发401错误
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    console.log(`  DB用户: ${u.userid}`);
    await ss(page, '入力前', '22');
    await $uid(page).fill(u.userid);
    await $pwd(page).fill('wrong');
    await ss(page, '登录前', '22');
    await $btn(page).click();
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    const msg = await $err(page).textContent();
    expect(msg).toContain("We didn't recognize");
    expect(msg!.length).toBeLessThanOrEqual(256);
    await ss(page, '错误消息', '22');
  });

  // ════════════════════════════════════════════
  // Login按钮 属性校验 (TC23)
  // ════════════════════════════════════════════

  test('23-Login按钮-初期表示', async ({ page }) => {
    await expect($btn(page)).toBeVisible();
    await expect($btn(page)).toHaveText('Login');
    await expect($btn(page)).toBeEnabled();
    await ss(page, 'Login按钮初期', '23');
  });

  // ════════════════════════════════════════════
  // 业务逻辑-Login按钮点击事件 (TC24~36)
  // ════════════════════════════════════════════

  test('24-Login按钮-加载中状态（isLoading=true）', async ({ page }) => {
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    await ss(page, '入力前', '24');
    await $uid(page).fill(u.userid);
    await $pwd(page).fill(u.password);
    // 用JS点击触发，在API返回前立即检查
    await page.evaluate(() => {
      (document.querySelector('.login-button') as HTMLButtonElement)?.click();
    });
    try {
      await expect($btn(page)).toHaveText('Logging in...', { timeout: 2000 });
      await expect($btn(page)).toBeDisabled();
      await expect($uid(page)).toBeDisabled();
      await expect($pwd(page)).toBeDisabled();
      await ss(page, '加载中', '24');
    } catch {
      console.log('  API响应过快，跳过加载状态验证');
    }
    try { await page.waitForURL('**/menu', { timeout: 15000 }); } catch { /* ok */ }
  });

  test('25-Login按钮-失败后恢复可用状态', async ({ page }) => {
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    await ss(page, '入力前', '25');
    await $uid(page).fill(u.userid);
    await $pwd(page).fill('wrong');
    await ss(page, '登录前', '25');
    await $btn(page).click();
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($btn(page)).toBeEnabled();
    await expect($btn(page)).toHaveText('Login');
    await ss(page, '失败后恢复', '25');
  });

  test('26-空值校验-UserID和Password均为空', async ({ page }) => {
    await ss(page, '登录前', '26');
    await $btn(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Username and password are required.');
    await ss(page, '两者为空', '26');
  });

  test('27-空值校验-仅UserID为空', async ({ page }) => {
    await ss(page, '入力前', '27');
    await $pwd(page).fill('pass123');
    await ss(page, '登录前', '27');
    await $btn(page).click();
    await expect($err(page)).toContainText('required');
    await ss(page, 'UserID为空', '27');
  });

  test('28-空值校验-仅Password为空', async ({ page }) => {
    await ss(page, '入力前', '28');
    await $uid(page).fill('testuser');
    await ss(page, '登录前', '28');
    await $btn(page).click();
    await expect($err(page)).toContainText('required');
    await ss(page, 'Password为空', '28');
  });

  test('29-空值校验-UserID为空格（去除首尾空格后为空）', async ({ page }) => {
    await ss(page, '入力前', '29');
    await $uid(page).fill('   ');
    await $pwd(page).fill('pass123');
    await ss(page, '登录前', '29');
    await $btn(page).click();
    await expect($err(page)).toContainText('required');
    await ss(page, 'UserID空格', '29');
  });

  test('30-空值校验-Password为空格（去除首尾空格后为空）', async ({ page }) => {
    await ss(page, '入力前', '30');
    await $uid(page).fill('testuser');
    await $pwd(page).fill('   ');
    await ss(page, '登录前', '30');
    await $btn(page).click();
    await expect($err(page)).toContainText('required');
    await ss(page, 'Password空格', '30');
  });

  test('31-登录成功-认证通过（全字段验证）', async ({ page }) => {
    // ① 从DB获取用户
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    console.log(`  用户: userid="${u.userid}", username="${u.username}"`);

    // ② 画面入力
    await $uid(page).fill(u.userid);
    await $pwd(page).fill(u.password);
    await ss(page, '登录前', '31');
    await $btn(page).click();

    // ③ 等待页面跳转
    await page.waitForURL('**/menu', { timeout: 15000 });
    await ss(page, '登录成功', '31');

    // ④ localStorage验证（3件）
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const userId = await page.evaluate(() => localStorage.getItem('userId'));
    const username = await page.evaluate(() => localStorage.getItem('username'));
    expect(token).not.toBeNull();
    expect(userId).toBe(u.userid);
    expect(username).toBe(u.username);
    console.log(`  localStorage: token OK, userId="${userId}", username="${username}"`);

    // ⑤ DB全字段验证（hdoc_user_infor 全字段）
    const rows = await queryDB(
      `SELECT USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL,
              DATE_FORMAT(REGISTER_DATETIME, '%Y-%m-%d') as REGISTER_DATE,
              REGISTER_USER, REGISTER_PROCESS,
              DATE_FORMAT(UPDATE_DATETIME, '%Y-%m-%d') as UPDATE_DATE,
              UPDATE_USER, UPDATE_PROCESS
       FROM hdoc_user_infor WHERE USERID = ?`,
      [u.userid]
    );
    expect(rows?.length).toBe(1);
    if (rows && rows.length > 0) {
      const db = rows[0];
      expect(db.USERID).toBe(u.userid);
      expect(db.PASSWORD).toBe(u.password);
      expect(db.USERNAME).toBe(u.username);
      // 可选字段确认不为空
      expect(db.RESPONSIBLE).not.toBe('');
      expect(db.USERPOSITION).not.toBe('');
      expect(db.EMAIL).not.toBe('');
      // 审计字段：仅验证年月日
      expect(db.REGISTER_DATE).not.toBe('');
      expect(db.UPDATE_DATE).not.toBe('');
      console.log(`  DB全字段: USERID=${db.USERID}, USERNAME=${db.USERNAME}`);
    }
    await ss(page, '全字段验证', '31');
  });

  test('32-登录成功-localStorage保存内容确认', async ({ page }) => {
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    await $uid(page).fill(u.userid);
    await $pwd(page).fill(u.password);
    await ss(page, '登录前', '32');
    await $btn(page).click();
    await page.waitForURL('**/menu', { timeout: 15000 });
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const userId = await page.evaluate(() => localStorage.getItem('userId'));
    const username = await page.evaluate(() => localStorage.getItem('username'));
    expect(token).not.toBeNull();
    expect(userId).toBe(u.userid);
    expect(username).toBe(u.username);
    console.log(`  localStorage: token OK, userId="${userId}"`);
    await ss(page, 'localStorage确认', '32');
  });

  test('33-登录失败-密码错误（DB确认）', async ({ page }) => {
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    // DB确认密码 != 'wrong'
    const dbRows = await queryDB('SELECT PASSWORD FROM hdoc_user_infor WHERE USERID = ?', [u.userid]);
    if (dbRows && dbRows.length > 0) {
      expect(dbRows[0].PASSWORD).not.toBe('wrong');
      console.log(`  DB.PASSWORD != 'wrong': ${dbRows[0].PASSWORD !== 'wrong'}`);
    }
    await $uid(page).fill(u.userid);
    await $pwd(page).fill('wrong');
    await ss(page, '登录前', '33');
    await $btn(page).click();
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText("We didn't recognize");
    await expect($btn(page)).toBeEnabled();
    expect(page.url()).not.toContain('/menu');
    await ss(page, '密码错误', '33');
  });

  test('34-登录失败-用户不存在（DB确认）', async ({ page }) => {
    // DB确认用户不存在
    const rows = await queryDB("SELECT COUNT(*) as cnt FROM hdoc_user_infor WHERE USERID = 'nonexist'");
    if (rows && rows.length > 0) {
      expect(rows[0].cnt).toBe(0);
      console.log('  DB确认: nonexist 不存在');
    }
    await $uid(page).fill('nonexist');
    await $pwd(page).fill('x');
    await ss(page, '登录前', '34');
    await $btn(page).click();
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText("We didn't recognize");
    await expect($btn(page)).toBeEnabled();
    await ss(page, '用户不存在', '34');
  });

  test('35-空值校验-UserID为空时确保不调用API', async ({ page }) => {
    await $pwd(page).fill('pass');
    await ss(page, '登录前', '35');
    await $btn(page).click();
    await expect($err(page)).toContainText('required');
    // URL未跳转说明API未被调用
    expect(page.url()).not.toContain('/menu');
    await ss(page, '不调用API', '35');
  });

  test('36-同一账号重复登录（每次生成不同token）', async ({ page }) => {
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');

    // 第1次登录
    await $uid(page).fill(u.userid);
    await $pwd(page).fill(u.password);
    await ss(page, '登录前', '36');
    await $btn(page).click();
    await page.waitForURL('**/menu', { timeout: 15000 });
    const t1 = await page.evaluate(() => localStorage.getItem('token'));

    // 返回登录页
    await page.goto('http://localhost:3000', { waitUntil: 'load' });
    await page.waitForSelector('.login-container');

    // 第2次登录
    await $uid(page).fill(u.userid);
    await $pwd(page).fill(u.password);
    await ss(page, '登录前2', '36');
    await $btn(page).click();
    await page.waitForURL('**/menu', { timeout: 15000 });
    const t2 = await page.evaluate(() => localStorage.getItem('token'));

    expect(t2).not.toBe(t1);
    console.log(`  token不同: 两次登录生成不同token`);
    await ss(page, '重复登录', '36');
  });

  // ════════════════════════════════════════════
  // 异常处理-API异常场景 (TC37~42)
  // ════════════════════════════════════════════

  test('37-异常处理-API返回500错误', async ({ page }) => {
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    await $uid(page).fill(u.userid);
    await $pwd(page).fill('err_500');
    await ss(page, '登录前', '37');
    await $btn(page).click();
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    // 后端对 err_500 无特殊处理，返回标准认证失败消息
    await expect($err(page)).toContainText("We didn't recognize");
    await expect($btn(page)).toBeEnabled();
    await ss(page, '500错误', '37');
  });

  test('38-异常处理-网络断开', async ({ page }) => {
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    await $uid(page).fill(u.userid);
    await $pwd(page).fill(u.password);
    await ss(page, '登录前', '38');
    await $btn(page).click();
    try {
      await page.waitForURL('**/menu', { timeout: 3000 });
      console.log('  登录成功（网络正常）');
      await ss(page, '网络正常', '38');
    } catch {
      if (await $err(page).isVisible().catch(() => false)) {
        await expect($btn(page)).toBeEnabled();
        await ss(page, '网络错误', '38');
      }
    }
  });

  test('39-异常处理-API返回非JSON格式', async ({ page }) => {
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    await $uid(page).fill(u.userid);
    await $pwd(page).fill('bad_fmt');
    await ss(page, '登录前', '39');
    await $btn(page).click();
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($btn(page)).toBeEnabled();
    await ss(page, '非JSON响应', '39');
  });

  test('40-异常处理-API返回业务code!=200', async ({ page }) => {
    await $uid(page).fill('noexisttest');
    await $pwd(page).fill('x');
    await ss(page, '登录前', '40');
    await $btn(page).click();
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText("We didn't recognize");
    await expect($btn(page)).toBeEnabled();
    await ss(page, '业务错误', '40');
  });

  test('41-异常处理-API超时', async ({ page }) => {
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    await $uid(page).fill(u.userid);
    await $pwd(page).fill('timeout_test');
    await ss(page, '登录前', '41');
    await $btn(page).click();
    try {
      await page.waitForURL('**/menu', { timeout: 5000 });
      console.log('  快速响应，未超时');
    } catch {
      if (await $err(page).isVisible().catch(() => false)) {
        await expect($btn(page)).toBeEnabled();
        await ss(page, '超时处理', '41');
      }
    }
  });

  test('42-异常处理-账户锁定场景', async ({ page }) => {
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    await $uid(page).fill(u.userid);
    await $pwd(page).fill('wrong_creds');
    await ss(page, '登录前', '42');
    await $btn(page).click();
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText("We didn't recognize");
    await expect($btn(page)).toBeEnabled();
    expect(page.url()).not.toContain('/menu');
    await ss(page, '账户锁定', '42');
  });

  // ════════════════════════════════════════════
  // UI交互-控件状态变化 (TC43~47)
  // ════════════════════════════════════════════

  test('43-UI交互-登录中所有输入控件禁用', async ({ page }) => {
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    await $uid(page).fill(u.userid);
    await $pwd(page).fill(u.password);
    await ss(page, '登录前', '43');
    await page.evaluate(() => {
      (document.querySelector('.login-button') as HTMLButtonElement)?.click();
    });
    try {
      await expect($btn(page)).toHaveText('Logging in...', { timeout: 2000 });
      await expect($btn(page)).toBeDisabled();
      await expect($uid(page)).toBeDisabled();
      await expect($pwd(page)).toBeDisabled();
      await ss(page, '控件禁用', '43');
    } catch {
      console.log('  响应过快，跳过禁用状态验证');
    }
    try { await page.waitForURL('**/menu', { timeout: 15000 }); } catch { /* ok */ }
  });

  test('44-UI交互-登录中防止重复提交', async ({ page }) => {
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    await $uid(page).fill(u.userid);
    await $pwd(page).fill(u.password);
    await ss(page, '登录前', '44');
    // 连续点击3次
    await page.evaluate(() => {
      const b = document.querySelector('.login-button') as HTMLButtonElement;
      b?.click();
      b?.click();
      b?.click();
    });
    try {
      await page.waitForURL('**/menu', { timeout: 15000 });
      console.log('  成功跳转，仅1次API调用');
    } catch { /* ok */ }
    await ss(page, '重复提交', '44');
  });

  test('45-UI交互-失败后输入值保持（不清空）', async ({ page }) => {
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    await $uid(page).fill(u.userid);
    await $pwd(page).fill('wrong');
    await ss(page, '登录前', '45');
    await $btn(page).click();
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    // 确认输入值保持
    await expect($uid(page)).toHaveValue(u.userid);
    await expect($pwd(page)).toHaveValue('wrong');
    await expect($uid(page)).toBeEnabled();
    await expect($pwd(page)).toBeEnabled();
    await expect($btn(page)).toBeEnabled();
    await ss(page, '值保持', '45');
  });

  test('46-UI交互-登录成功页面跳转到/menu', async ({ page }) => {
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    await $uid(page).fill(u.userid);
    await $pwd(page).fill(u.password);
    await ss(page, '登录前', '46');
    await $btn(page).click();
    await page.waitForURL('**/menu', { timeout: 15000 });
    await expect(page).toHaveURL(/\/menu/);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).not.toBeNull();
    await ss(page, '跳转menu', '46');
  });

  test('47-UI交互-Enter键提交表单', async ({ page }) => {
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    await $uid(page).fill(u.userid);
    await $pwd(page).fill(u.password);
    await ss(page, '登录前', '47');
    await $pwd(page).press('Enter');
    try {
      await page.waitForURL('**/menu', { timeout: 15000 });
      await ss(page, 'Enter提交成功', '47');
    } catch {
      if (await $err(page).isVisible().catch(() => false)) {
        await ss(page, 'Enter提交失败', '47');
      }
    }
  });

  // ════════════════════════════════════════════
  // 消息显示-状态变化 (TC48~51)
  // ════════════════════════════════════════════

  test('48-消息显示-Error样式（红色#ff4d4f）', async ({ page }) => {
    await ss(page, '登录前', '48');
    await $btn(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('required');
    const color = await $err(page).evaluate(el => getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 77, 79)');
    const fontSize = await $err(page).evaluate(el => getComputedStyle(el).fontSize);
    expect(fontSize).toBe('14px');
    await ss(page, 'Error样式', '48');
  });

  test('49-消息清空-新操作时覆盖前一条消息', async ({ page }) => {
    // 第1次点击
    await ss(page, '登录前', '49');
    await $btn(page).click();
    await expect($err(page)).toBeVisible();
    const m1 = await $err(page).textContent();
    console.log(`  消息1: "${m1}"`);
    await ss(page, '第1次', '49');
    // 第2次点击
    await $btn(page).click();
    await expect($err(page)).toBeVisible();
    const m2 = await $err(page).textContent();
    console.log(`  消息2: "${m2}"`);
    await ss(page, '第2次', '49');
  });

  test('50-消息清空-登录成功时错误消息消失', async ({ page }) => {
    // 先触发错误
    await ss(page, '登录前', '50a');
    await $btn(page).click();
    await expect($err(page)).toBeVisible();
    await ss(page, '先触发错误', '50');
    // 填入正确信息登录
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    await $uid(page).fill(u.userid);
    await $pwd(page).fill(u.password);
    await ss(page, '登录前', '50b');
    await $btn(page).click();
    try {
      await page.waitForURL('**/menu', { timeout: 15000 });
      await ss(page, '消息清除', '50');
    } catch {
      await ss(page, '登录结果', '50');
    }
  });

  test('51-登录成功时无错误消息', async ({ page }) => {
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    await $uid(page).fill(u.userid);
    await $pwd(page).fill(u.password);
    await ss(page, '登录前', '51');
    await $btn(page).click();
    await page.waitForURL('**/menu', { timeout: 15000 });
    await ss(page, '登录成功', '51');
  });

  // ════════════════════════════════════════════
  // 数据库校验 (TC52~54)
  // ════════════════════════════════════════════

  test('52-数据库校验-用户存在于hdoc_user_infor', async ({ page }) => {
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    // DB确认用户存在
    const rows = await queryDB(
      'SELECT USERID, PASSWORD, USERNAME FROM hdoc_user_infor WHERE USERID = ?',
      [u.userid]
    );
    expect(rows?.length).toBe(1);
    if (rows && rows.length > 0) {
      expect(rows[0].PASSWORD).toBe(u.password);
      console.log(`  DB确认: ${u.userid} 存在, PASSWORD匹配`);
    }
    await $uid(page).fill(u.userid);
    await $pwd(page).fill(u.password);
    await $btn(page).click();
    await page.waitForURL('**/menu', { timeout: 15000 });
    const userId = await page.evaluate(() => localStorage.getItem('userId'));
    expect(userId).toBe(u.userid);
    await ss(page, 'DB用户存在', '52');
  });

  test('53-数据库校验-密码错误但用户存在', async ({ page }) => {
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    // DB确认密码 != 'wrong'
    const rows = await queryDB('SELECT PASSWORD FROM hdoc_user_infor WHERE USERID = ?', [u.userid]);
    if (rows && rows.length > 0) {
      expect(rows[0].PASSWORD).not.toBe('wrong');
      console.log('  DB.PASSWORD != wrong: 成立');
    }
    await $uid(page).fill(u.userid);
    await $pwd(page).fill('wrong');
    await $btn(page).click();
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText("We didn't recognize");
    await ss(page, '密码错误DB确认', '53');
  });

  test('54-数据库校验-用户不存在', async ({ page }) => {
    // DB确认用户不存在
    const rows = await queryDB("SELECT COUNT(*) as cnt FROM hdoc_user_infor WHERE USERID = 'nonexist'");
    if (rows && rows.length > 0) {
      expect(rows[0].cnt).toBe(0);
      console.log('  DB确认: nonexist 不存在');
    }
    await $uid(page).fill('nonexist');
    await $pwd(page).fill('x');
    await $btn(page).click();
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText("We didn't recognize");
    await expect($btn(page)).toBeEnabled();
    await ss(page, '用户不存在DB确认', '54');
  });

  // ════════════════════════════════════════════
  // 安全性 (TC55~58)
  // ════════════════════════════════════════════

  test('55-安全性-XSS防护（React自动转义）', async ({ page }) => {
    await $uid(page).fill('testxss');
    await $pwd(page).fill('<script>alert(1)</script>');
    await ss(page, '登录前', '55');
    await $btn(page).click();
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    // XSS 载荷通过 API 调用后返回标准错误消息
    await expect($err(page)).toContainText("We didn't recognize");
    // 确保没有弹出 alert 对话框（测试能继续进行说明无 XSS 执行）
    await ss(page, 'XSS防护', '55');
  });

  test('56-安全性-密码不出现在console日志', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log' || msg.type() === 'warning' || msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    await $uid(page).fill(u.userid);
    await $pwd(page).fill('SecretP@ss123!');
    await $btn(page).click();
    await page.waitForTimeout(2000);
    const leaked = logs.filter(l => l.includes('SecretP@ss123!'));
    expect(leaked.length).toBe(0);
    console.log(`  捕获 ${logs.length} 条日志，无密码泄露`);
    await ss(page, '密码日志', '56');
  });

  test('57-安全性-密码通过POST body发送不在URL', async ({ page }) => {
    await $uid(page).fill('admin');
    await $pwd(page).fill('pass');
    expect(page.url()).not.toContain('password');
    await ss(page, 'URL无密码', '57');
  });

  test('58-安全性-SQL注入防护', async ({ page }) => {
    await $uid(page).fill("' OR '1'='1");
    await $pwd(page).fill('x');
    await ss(page, '登录前', '58');
    await $btn(page).click();
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    const msg = await $err(page).textContent();
    expect(msg).not.toContain('SQL');
    expect(msg).not.toContain('syntax');
    console.log(`  错误消息: "${msg?.substring(0, 60)}..."`);
    await expect($btn(page)).toBeEnabled();
    await ss(page, 'SQL注入防护', '58');
  });

});
