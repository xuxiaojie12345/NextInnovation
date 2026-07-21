// @ts-nocheck
import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// ============================================================
// UD01_Login 単体テスト
// テスト仕様書: 単体テスト仕様書_UD01.md
// 画面ファイル: Login.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD01');

// ==================== テストデータ ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';
const NON_EXIST_USER = 'nonexist999';
const WRONG_PASS = 'wrongpass';
const MAX_USER_ID_LENGTH = 10;
const MAX_PASSWORD_LENGTH = 32;

/**
 * スクリーンショット撮影（JPEG）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD01画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
  const filepath = path.join(SCREENSHOT_ROOT, filename);
  return page.screenshot({ path: filepath, type: 'jpeg', quality: 80 });
}

/**
 * 各テスト前に初期化
 */
test.beforeEach(async ({ page }) => {
  screenshotCounter = 0;
  await page.goto(BASE_URL + '/');
  await page.waitForSelector('.login-container');
  await page.evaluate(() => localStorage.clear()).catch(() => {});
});

// ============================================================
// 1. 画面初期表示
// ============================================================

test.describe('画面初期表示', () => {

  test('UD01_001_画面初期表示_全体布局', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '01';

    // 1. 全屏背景图片显示
    await expect(page.locator('.login-container')).toHaveCSS('background-image', /.*fTRYDXFAD.*/);
    await takeScreenshot(page, '背景画像確認');

    // 2. 画面左右分割
    await expect(page.locator('.login-left')).toBeVisible();
    await expect(page.locator('.login-right')).toBeVisible();
    await takeScreenshot(page, '左右分割確認');

    // 3. 左右之间存在间隔
    const leftBox = await page.locator('.login-left').boundingBox();
    const rightBox = await page.locator('.login-right').boundingBox();
    expect(leftBox).not.toBeNull();
    expect(rightBox).not.toBeNull();
    expect(leftBox!.x + leftBox!.width).toBeLessThan(rightBox!.x);
    await takeScreenshot(page, '間隔確認');
  });

  test('UD01_002_画面初期表示_左侧信息区', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '02';

    // 左侧信息区包含3行文字
    await expect(page.locator('.login-title')).toBeVisible();
    await expect(page.locator('.login-subtitle')).toBeVisible();
    await expect(page.locator('.login-support')).toBeVisible();

    // 第1行：EDB Engineering Database
    await expect(page.locator('.login-title-bold')).toHaveText('EDB');
    await expect(page.locator('.login-title-normal')).toHaveText(' Engineering Database');

    // 第2行：Use Outlook id and password
    await expect(page.locator('.login-subtitle')).toHaveText('Use Outlook id and password');

    // 第3行：Support, authorization request...
    await expect(page.locator('.login-title-support')).toBeVisible();
    await expect(page.locator('.login-title-stpi')).toHaveText('Support TPI');

    // 2. 3行文字均为白色
    await expect(page.locator('.login-title')).toHaveCSS('color', 'rgb(255, 255, 255)');

    await takeScreenshot(page, '左侧信息区全体');
  });

  test('UD01_003_画面初期表示_标题文字修饰', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '03';

    // EDB 部分为粗体（bold）
    await expect(page.locator('.login-title-bold')).toHaveCSS('font-weight', '700');

    // Engineering Database 部分为正常字重（normal）
    await expect(page.locator('.login-title-normal')).toHaveCSS('font-weight', '400');

    // EDB 和 Engineering Database 的字号相同
    const boldFontSize = await page.locator('.login-title-bold').evaluate(el => window.getComputedStyle(el).fontSize);
    const normalFontSize = await page.locator('.login-title-normal').evaluate(el => window.getComputedStyle(el).fontSize);
    expect(boldFontSize).toBe(normalFontSize);

    await takeScreenshot(page, '文字修饰確認');
  });

  test('UD01_004_画面初期表示_右侧表单区', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '04';

    // 1. UserID 输入框显示、空字符串、可输入状态
    const userIDInput = page.locator('#userID');
    await expect(userIDInput).toBeVisible();
    await expect(userIDInput).toBeEnabled();
    await expect(userIDInput).toHaveValue('');

    // 2. Password 输入框显示、空字符串、可输入状态、掩码显示
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toBeEnabled();
    await expect(passwordInput).toHaveValue('');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // 3. Login 按钮显示、可点击状态
    const loginBtn = page.locator('button.login-button');
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toBeEnabled();
    await expect(loginBtn).toHaveText('Login');

    // 4. 表单下方有3行红色文字（StaticMessage）显示
    await expect(page.locator('.static-message')).toBeVisible();

    await takeScreenshot(page, '右侧表单区全体');
  });

  test('UD01_005_画面初期表示_StaticMessage内容', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '05';

    const staticMsg = page.locator('.static-message');

    // 1. 以下3行红色文字
    await expect(staticMsg).toContainText('If you get error message: "Your account is locked. Please contact your system administrator."');
    await expect(staticMsg).toContainText('Please try this alternative login link before contacting support:');
    await expect(staticMsg).toContainText('We are working to find root cause of problem.');

    // 2. 文字颜色为红色
    await expect(staticMsg).toHaveCSS('color', 'rgb(255, 77, 79)');

    await takeScreenshot(page, 'StaticMessage内容確認');
  });

  test('UD01_006_画面初期表示_Message标签隐藏', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '06';

    // Message 标签不显示（内容为空时不可见）
    await expect(page.locator('.error-message')).not.toBeVisible();
    await takeScreenshot(page, 'Message标签隐藏確認');
  });

  test('UD01_007_画面初期表示_UserID输入框属性', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '07';

    const userIDInput = page.locator('#userID');

    // 1. placeholder 显示 "请输入用户ID"
    await expect(userIDInput).toHaveAttribute('placeholder', '请输入用户ID');

    // 2. 最大输入字符数为10字符
    await expect(userIDInput).toHaveAttribute('maxLength', String(MAX_USER_ID_LENGTH));

    // 3. 半角英数字以外的字符无法输入（全角字符输入无效）
    await userIDInput.fill('ＡＢＣ１２３');
    await expect(userIDInput).toHaveValue('');
    await takeScreenshot(page, 'UserID输入框属性確認');
  });

  test('UD01_008_画面初期表示_Password输入框属性', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '08';

    const passwordInput = page.locator('#password');

    // 1. placeholder 显示 "请输入密码"
    await expect(passwordInput).toHaveAttribute('placeholder', '请输入密码');

    // 2. type 属性为 "password"
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // 3. 最大输入字符数为32字符
    await expect(passwordInput).toHaveAttribute('maxLength', String(MAX_PASSWORD_LENGTH));

    // 4. 半角英数字以及符号可以输入
    await passwordInput.fill('Pass!@#123');
    await expect(passwordInput).toHaveValue('Pass!@#123');
    await takeScreenshot(page, 'Password输入框属性確認');
  });
});

// ============================================================
// 2. 空值校验
// ============================================================

test.describe('空值校验', () => {

  test('UD01_009_空值校验_UserID为空', async ({ page }) => {
    currentTestNo = '09';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    // 1. UserID 为空，Password 输入 admin123
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, 'Password入力後');

    // 2. Login 按钮点击
    await page.locator('button[type="submit"]').click();

    // 3. Message 标签显示错误信息
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toHaveText('Username and password are required.');
    await expect(page.locator('.error-message')).toHaveCSS('color', 'rgb(255, 77, 79)');

    // 4. API 未被调用（画面无跳转）
    await expect(page).toHaveURL(BASE_URL + '/');

    // 5. Password 输入框的值保持不变
    await expect(page.locator('#password')).toHaveValue(REAL_PASS);

    await takeScreenshot(page, 'UserID为空エラー確認');
  });

  test('UD01_010_空值校验_Password为空', async ({ page }) => {
    currentTestNo = '10';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    // 1. UserID 输入 admin，Password 为空
    await page.locator('#userID').fill(REAL_USER);
    await takeScreenshot(page, 'UserID入力後');

    // 2. Login 按钮点击
    await page.locator('button[type="submit"]').click();

    // 3. Message 标签显示错误信息
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toHaveText('Username and password are required.');
    await expect(page.locator('.error-message')).toHaveCSS('color', 'rgb(255, 77, 79)');

    // 4. API 未被调用（画面无跳转）
    await expect(page).toHaveURL(BASE_URL + '/');

    // 5. UserID 输入框的值保持不变
    await expect(page.locator('#userID')).toHaveValue(REAL_USER);

    await takeScreenshot(page, 'Password为空エラー確認');
  });

  test('UD01_011_空值校验_两者为空', async ({ page }) => {
    currentTestNo = '11';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    // 1. UserID 为空，Password 为空
    // 2. Login 按钮点击
    await page.locator('button[type="submit"]').click();

    // 3. Message 标签显示错误信息
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toHaveText('Username and password are required.');

    // 4. API 未被调用（画面无跳转）
    await expect(page).toHaveURL(BASE_URL + '/');

    await takeScreenshot(page, '两者为空エラー確認');
  });

  test('UD01_012_空值校验_仅空格', async ({ page }) => {
    currentTestNo = '12';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    // 1. UserID 输入半角空格3字符
    await page.locator('#userID').fill('   ');
    await page.locator('#password').fill('   ');
    await takeScreenshot(page, '空格入力後');

    // 2. Login 按钮点击
    await page.locator('button[type="submit"]').click();

    // 3. trim() 执行后两者均为空字符串 → 显示错误
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toHaveText('Username and password are required.');

    // 4. API 未被调用（画面无跳转）
    await expect(page).toHaveURL(BASE_URL + '/');

    await takeScreenshot(page, '空格エラー確認');
  });
});

// ============================================================
// 3. UserID 输入限制
// ============================================================

test.describe('UserID输入限制', () => {

  test('UD01_013_UserID_最大字符数10字符', async ({ page }) => {
    currentTestNo = '13';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    const userIDInput = page.locator('#userID');

    // 尝试输入11字符
    await userIDInput.fill('ABCDEFGHIJK');
    await takeScreenshot(page, '11文字入力試行');

    // 只能输入前10字符
    const val = await userIDInput.inputValue();
    expect(val.length).toBe(MAX_USER_ID_LENGTH);
    expect(val).toBe('ABCDEFGHIJ');

    // Message 标签不显示
    await expect(page.locator('.error-message')).not.toBeVisible();

    await takeScreenshot(page, '10文字制限確認');
  });

  test('UD01_014_UserID_仅允许半角英数字', async ({ page }) => {
    currentTestNo = '14';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    const userIDInput = page.locator('#userID');

    // 尝试输入全角字符
    await userIDInput.fill('ＡＢＣ１２３');
    await takeScreenshot(page, '全角文字入力試行');

    // 全角字符无法输入
    await expect(userIDInput).toHaveValue('');

    // Message 标签不显示
    await expect(page.locator('.error-message')).not.toBeVisible();

    await takeScreenshot(page, '全角文字拒否確認');
  });

  test('UD01_015_UserID_符号不可输入', async ({ page }) => {
    currentTestNo = '15';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    const userIDInput = page.locator('#userID');

    // 尝试输入符号
    await userIDInput.fill('@#$%');
    await takeScreenshot(page, '符号入力試行');

    // 符号无法输入
    await expect(userIDInput).toHaveValue('');

    // Message 标签不显示
    await expect(page.locator('.error-message')).not.toBeVisible();

    await takeScreenshot(page, '符号拒否確認');
  });
});

// ============================================================
// 4. Password 输入限制
// ============================================================

test.describe('Password输入限制', () => {

  test('UD01_016_Password_最大字符数32字符', async ({ page }) => {
    currentTestNo = '16';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    const passwordInput = page.locator('#password');

    // 尝试输入33字符
    await passwordInput.fill('ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567');
    await takeScreenshot(page, '33文字入力試行');

    // 只能输入前32字符
    const val = await passwordInput.inputValue();
    expect(val.length).toBe(MAX_PASSWORD_LENGTH);
    expect(val).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ123456');

    // 输入字符以掩码显示
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Message 标签不显示
    await expect(page.locator('.error-message')).not.toBeVisible();

    await takeScreenshot(page, '32文字制限確認');
  });

  test('UD01_017_Password_含符号字符可输入', async ({ page }) => {
    currentTestNo = '17';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    const passwordInput = page.locator('#password');

    // 输入含符号字符
    await passwordInput.fill('Pass!@#123');
    await takeScreenshot(page, '符号含み入力後');

    // 所有字符正常输入
    await expect(passwordInput).toHaveValue('Pass!@#123');

    // 输入字符以掩码显示
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Message 标签不显示
    await expect(page.locator('.error-message')).not.toBeVisible();

    await takeScreenshot(page, '符号入力確認');
  });
});

// ============================================================
// 5. 认证处理
// ============================================================

test.describe('认证处理', () => {

  test('UD01_018_认证成功_admin_admin123', async ({ page }) => {
    test.setTimeout(120000);
    currentTestNo = '18';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    // 1. 输入admin/admin123
    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, '入力後');

    // 2. Login 按钮点击
    await page.locator('button[type="submit"]').click();

    // 3. Login 中：按钮禁用、文字变为"处理中..."
    await expect(page.locator('button.login-button')).toBeDisabled();
    await expect(page.locator('button.login-button')).toHaveText('处理中...');
    await takeScreenshot(page, 'ログイン処理中');

    // 4. 等待跳转到 Menu
    await page.waitForURL('**/Menu', { timeout: 60000 });
    await takeScreenshot(page, 'Menu画面遷移後');

    // 5. localStorage 确认
    const storedUserID = await page.evaluate(() => localStorage.getItem('userID'));
    expect(storedUserID).toBe(REAL_USER);
  });

  test('UD01_019_认证成功_admin2_sylus001', async ({ page }) => {
    test.setTimeout(120000);
    currentTestNo = '19';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    await page.locator('#userID').fill('admin2');
    await page.locator('#password').fill('sylus001');
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click({ noWaitAfter: true });
    await page.waitForURL('**/Menu', { timeout: 60000 });
    await takeScreenshot(page, 'Menu画面遷移後');

    const storedUserID = await page.evaluate(() => localStorage.getItem('userID'));
    expect(storedUserID).toBe('admin2');
  });

  test('UD01_020_认证成功_hhtA451340_user123456', async ({ page }) => {
    test.setTimeout(120000);
    currentTestNo = '20';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    await page.locator('#userID').fill('hhtuser001');
    await page.locator('#password').fill('pass123');
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click({ noWaitAfter: true });
    await page.waitForURL('**/Menu', { timeout: 60000 });
    await takeScreenshot(page, 'Menu画面遷移後');

    const storedUserID = await page.evaluate(() => localStorage.getItem('userID'));
    expect(storedUserID).toBe('hhtuser001');
  });

  test('UD01_021_认证失败_不存在的UserID', async ({ page }) => {
    test.setTimeout(60000);
    currentTestNo = '21';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    await page.locator('#userID').fill(NON_EXIST_USER);
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click();

    // 等待 API 响应 → 错误消息
    await page.waitForSelector('.error-message', { timeout: 15000 });
    await takeScreenshot(page, '認証失敗メッセージ');

    await expect(page.locator('.error-message')).toHaveText('We didn\'t recognize the username or password you entered. Please try again.');

    // Password 输入框的值被清除
    await expect(page.locator('#password')).toHaveValue('');

    // 画面无跳转
    await expect(page).toHaveURL(BASE_URL + '/');

    await takeScreenshot(page, 'Password消去確認');
  });

  test('UD01_022_认证失败_错误的Password', async ({ page }) => {
    test.setTimeout(60000);
    currentTestNo = '22';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(WRONG_PASS);
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click();

    // 等待 API 响应 → 错误消息
    await page.waitForSelector('.error-message', { timeout: 15000 });
    await takeScreenshot(page, '認証失敗メッセージ');

    await expect(page.locator('.error-message')).toHaveText('We didn\'t recognize the username or password you entered. Please try again.');

    // Password 输入框的值被清除
    await expect(page.locator('#password')).toHaveValue('');

    // UserID 输入框的值保持不变
    await expect(page.locator('#userID')).toHaveValue(REAL_USER);

    // 画面无跳转
    await expect(page).toHaveURL(BASE_URL + '/');

    await takeScreenshot(page, 'Password消去確認');
  });
});

// ============================================================
// 6. 异常处理
// ============================================================

test.describe('异常处理', () => {

  test('UD01_023_异常处理_网络断开', async ({ page }) => {
    test.setTimeout(60000);
    currentTestNo = '23';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, '入力後');

    // 模拟网络断开（拦截API请求并使其失败）
    await page.route('**/api/ud01/authentication**', route => {
      route.abort('internetdisconnected');
    });

    await page.locator('button[type="submit"]').click();

    // 等待错误消息
    await page.waitForSelector('.error-message', { timeout: 15000 });
    await expect(page.locator('.error-message')).toHaveText('System error. Please try again later.');
    await takeScreenshot(page, 'ネットワーク切断エラー');

    // Login 按钮恢复可用状态
    await expect(page.locator('button.login-button')).toBeEnabled();
    await expect(page.locator('button.login-button')).toHaveText('Login');

    // 输入框恢复可用状态
    await expect(page.locator('#userID')).toBeEnabled();
    await expect(page.locator('#password')).toBeEnabled();

    // 画面无跳转
    await expect(page).toHaveURL(BASE_URL + '/');

    await takeScreenshot(page, 'ボタン復旧確認');
  });

  test('UD01_024_异常处理_服务器500错误', async ({ page }) => {
    test.setTimeout(60000);
    currentTestNo = '24';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, '入力後');

    // 模拟服务器500错误
    await page.route('**/api/ud01/authentication**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'Internal Server Error' }),
      });
    });

    await page.locator('button[type="submit"]').click();

    // 等待错误消息
    await page.waitForSelector('.error-message', { timeout: 15000 });
    await expect(page.locator('.error-message')).toHaveText('System error. Please try again later.');
    await takeScreenshot(page, '500エラーメッセージ');

    // Login 按钮恢复可用状态
    await expect(page.locator('button.login-button')).toBeEnabled();

    // 画面无跳转
    await expect(page).toHaveURL(BASE_URL + '/');

    await takeScreenshot(page, 'ボタン復旧確認');
  });

  test('UD01_025_异常处理_请求超时', async ({ page }) => {
    test.setTimeout(120000);
    currentTestNo = '25';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, '入力後');

    // 模拟请求超时（延迟超过30秒）
    await page.route('**/api/ud01/authentication**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 35000));
      route.abort('timedout');
    });

    await page.locator('button[type="submit"]').click();

    // 等待超时错误消息（超时设置为30秒）
    await page.waitForSelector('.error-message', { timeout: 60000 });
    await expect(page.locator('.error-message')).toHaveText('Request timeout. Please check your network connection.');
    await takeScreenshot(page, 'タイムアウトエラー');

    // Login 按钮恢复可用状态
    await expect(page.locator('button.login-button')).toBeEnabled();

    // 画面无跳转
    await expect(page).toHaveURL(BASE_URL + '/');

    await takeScreenshot(page, 'ボタン復旧確認');
  });
});

// ============================================================
// 7. UI状态
// ============================================================

test.describe('UI状态', () => {

  test('UD01_026_UI状态_Login中按钮禁用', async ({ page }) => {
    test.setTimeout(60000);
    currentTestNo = '26';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, '入力後');

    // 拦截API请求，延迟响应以观察中间状态
    await page.route('**/api/ud01/authentication**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { username: 'Administrator' } }),
      });
    });

    await page.locator('button[type="submit"]').click();

    // API 响应前确认各控件状态
    await expect(page.locator('button.login-button')).toBeDisabled();
    await expect(page.locator('button.login-button')).toHaveText('处理中...');
    await takeScreenshot(page, 'ボタン無効状態');

    await expect(page.locator('#userID')).toBeDisabled();
    await expect(page.locator('#password')).toBeDisabled();
    await takeScreenshot(page, '入力欄無効状態');

    // API 响应后恢复可用状态（按钮会触发navigate跳转）
    await page.waitForURL('**/Menu', { timeout: 30000 });
    await takeScreenshot(page, 'Menu画面遷移後');
  });

  test('UD01_027_UI状态_防止重复提交', async ({ page }) => {
    test.setTimeout(60000);
    currentTestNo = '27';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    let apiCallCount = 0;

    // 监听API调用次数
    await page.route('**/api/ud01/authentication**', async (route) => {
      apiCallCount++;
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { username: 'Administrator' } }),
      });
    });

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click();

    // API 响应前再次点击 Login 按钮（应该无效）
    await page.locator('button[type="submit"]').click({ force: true });
    await page.locator('button[type="submit"]').click({ force: true });
    await takeScreenshot(page, '重複クリック試行');

    // API 仅被调用1次
    expect(apiCallCount).toBe(1);

    // 成功时正常跳转到 Menu
    await page.waitForURL('**/Menu', { timeout: 30000 });
    await takeScreenshot(page, 'Menu画面遷移後');
  });

  test('UD01_028_UI状态_认证失败后Password清除', async ({ page }) => {
    test.setTimeout(60000);
    currentTestNo = '28';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(WRONG_PASS);
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click();

    // 等待认证失败
    await page.waitForSelector('.error-message', { timeout: 15000 });
    await takeScreenshot(page, '認証失敗');

    // Password 输入框的值被清除
    await expect(page.locator('#password')).toHaveValue('');

    // UserID 输入框的值保持不变
    await expect(page.locator('#userID')).toHaveValue(REAL_USER);

    // Message 标签显示错误信息
    await expect(page.locator('.error-message')).toBeVisible();

    await takeScreenshot(page, 'Password消去確認');
  });
});

// ============================================================
// 8. 画面跳转
// ============================================================

test.describe('画面跳转', () => {

  test('UD01_029_画面跳转_认证成功后跳转Menu_admin', async ({ page }) => {
    test.setTimeout(120000);
    currentTestNo = '29';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click({ noWaitAfter: true });

    // 画面跳转：Login 画面 → Menu 画面
    await page.waitForURL('**/Menu', { timeout: 60000 });
    await takeScreenshot(page, 'Menu画面遷移後');

    // localStorage 确认
    const storedUserID = await page.evaluate(() => localStorage.getItem('userID'));
    expect(storedUserID).toBe(REAL_USER);
  });

  test('UD01_030_画面跳转_认证成功后admin2跳转Menu', async ({ page }) => {
    test.setTimeout(120000);
    currentTestNo = '30';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    await page.locator('#userID').fill('admin2');
    await page.locator('#password').fill('sylus001');
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click();

    // 画面跳转：Login 画面 → Menu 画面
    await page.waitForURL('**/Menu', { timeout: 60000 });
    await takeScreenshot(page, 'Menu画面遷移後');

    // localStorage 确认
    const storedUserID = await page.evaluate(() => localStorage.getItem('userID'));
    expect(storedUserID).toBe('admin2');
  });

  test('UD01_031_画面跳转_未认证直接访问Menu', async ({ page }) => {
    currentTestNo = '31';
    // 清除 localStorage（已由 beforeEach 处理）
    await page.goto(BASE_URL + '/Menu');
    await takeScreenshot(page, 'Menu直接訪問');

    // 未认证状态被检测到，被重定向到 Login 画面
    await page.waitForURL(BASE_URL + '/');
    await takeScreenshot(page, 'Login画面にリダイレクト');

    // UserID 输入框、Password 输入框为空显示
    await expect(page.locator('#userID')).toHaveValue('');
    await expect(page.locator('#password')).toHaveValue('');

    // Message 标签不显示
    await expect(page.locator('.error-message')).not.toBeVisible();
    await takeScreenshot(page, '初期状態確認');
  });
});

// ============================================================
// 9. 安全性
// ============================================================

test.describe('安全性', () => {

  test('UD01_032_安全性_Password不显示在Console', async ({ page }) => {
    test.setTimeout(60000);
    currentTestNo = '32';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    const consoleMessages: string[] = [];

    // 监听 console 输出
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click({ noWaitAfter: true });

    // 等待 API 响应
    await page.waitForURL('**/Menu', { timeout: 60000 }).catch(() => {});
    await takeScreenshot(page, 'Login実行後');

    // Console 日志中不包含 Password 值
    const passwordLeaked = consoleMessages.some(msg => msg.includes(REAL_PASS));
    expect(passwordLeaked).toBe(false);
  });

  test('UD01_033_安全性_认证失败后Password清除', async ({ page }) => {
    test.setTimeout(60000);
    currentTestNo = '33';
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(WRONG_PASS);
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click();

    // 等待认证失败
    await page.waitForSelector('.error-message', { timeout: 15000 });
    await takeScreenshot(page, '認証失敗');

    // Password 输入框的值立即被清除
    await expect(page.locator('#password')).toHaveValue('');
    await takeScreenshot(page, 'Password消去確認');

    // 确认 DOM 中也不残留 Password 值
    const passwordValue = await page.locator('#password').inputValue();
    expect(passwordValue).toBe('');
  });
});
