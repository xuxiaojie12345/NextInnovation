// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD01_Login 单元测试
// 测试规格书: テスト式样書UD01.md
// 画面文件: Login.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD01');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';
const ADMIN2_USER = 'admin2';
const ADMIN2_PASS = 'sylus001';
const HHT_USER = 'hhtuser001';
const HHT_PASS = 'pass123';
const NON_EXIST_USER = 'nonexist999';
const WRONG_PASS = 'wrongpass';
const MAX_USER_ID_LENGTH = 10;
const MAX_PASSWORD_LENGTH = 32;

/**
 * 截图（JPEG，从001开始编号）
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
 * 每个测试前初始化
 */
test.beforeEach(async ({ page }) => {
  screenshotCounter = 0;
  await page.goto(BASE_URL + '/');
  await page.waitForSelector('.login-container');
  await page.evaluate(() => localStorage.clear()).catch(() => {});
});

// ============================================================
// 1. 画面初期表示 (No.1-8)
// ============================================================
test.describe('画面初期表示', () => {

  test('UD01_001_画面初期表示_全体布局', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '001';
    await takeScreenshot(page, '初期表示');

    // 1. 全屏背景图片显示
    await expect(page.locator('.login-container')).toBeVisible();
    // 2. 画面左右分割
    await expect(page.locator('.login-left')).toBeVisible();
    await expect(page.locator('.login-right')).toBeVisible();
    // 3. 左右之间存在间隔
    const leftBox = await page.locator('.login-left').boundingBox();
    const rightBox = await page.locator('.login-right').boundingBox();
    expect(leftBox).not.toBeNull();
    expect(rightBox).not.toBeNull();
    expect(leftBox.x + leftBox.width).toBeLessThan(rightBox.x);
  });

  test('UD01_002_画面初期表示_左侧信息区', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '002';
    await takeScreenshot(page, '初期表示');

    // 第1行：EDB Engineering Database
    await expect(page.locator('.login-title-bold')).toHaveText('EDB');
    await expect(page.locator('.login-title-normal')).toHaveText(' Engineering Database');
    // 第2行：Use Outlook id and password
    await expect(page.locator('.login-subtitle')).toHaveText('Use Outlook id and password');
    // 第3行：Support文字
    await expect(page.locator('.login-title-support')).toBeVisible();
    await expect(page.locator('.login-title-stpi')).toHaveText('Support TPI');
    // 3行文字均为白色
    await expect(page.locator('.login-title')).toHaveCSS('color', 'rgb(255, 255, 255)');
  });

  test('UD01_003_画面初期表示_标题文字修饰', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '003';
    await takeScreenshot(page, '初期表示');

    // EDB 粗体
    await expect(page.locator('.login-title-bold')).toHaveCSS('font-weight', '700');
    // Engineering Database 正常字重
    await expect(page.locator('.login-title-normal')).toHaveCSS('font-weight', '400');
    // 字号相同
    const boldSize = await page.locator('.login-title-bold').evaluate(el => getComputedStyle(el).fontSize);
    const normalSize = await page.locator('.login-title-normal').evaluate(el => getComputedStyle(el).fontSize);
    expect(boldSize).toBe(normalSize);
  });

  test('UD01_004_画面初期表示_右侧表单区', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '004';
    await takeScreenshot(page, '初期表示');

    // UserID 输入框
    const uidInput = page.locator('#userID');
    await expect(uidInput).toBeVisible();
    await expect(uidInput).toBeEnabled();
    await expect(uidInput).toHaveValue('');
    // Password 输入框
    const pwdInput = page.locator('#password');
    await expect(pwdInput).toBeVisible();
    await expect(pwdInput).toBeEnabled();
    await expect(pwdInput).toHaveValue('');
    await expect(pwdInput).toHaveAttribute('type', 'password');
    // Login 按钮
    const loginBtn = page.locator('button[type="submit"]');
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toBeEnabled();
    await expect(loginBtn).toHaveText('Login');
    // StaticMessage 显示
    await expect(page.locator('.static-message')).toBeVisible();
  });

  test('UD01_005_画面初期表示_StaticMessage内容', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '005';
    await takeScreenshot(page, '初期表示');

    const staticMsg = page.locator('.static-message');
    await expect(staticMsg).toContainText('If you get error message: "Your account is locked.');
    await expect(staticMsg).toContainText('Please try this alternative login link before contacting support');
    await expect(staticMsg).toContainText('We are working to find root cause of problem.');
    // 文字颜色为红色
    await expect(staticMsg).toHaveCSS('color', 'rgb(255, 77, 79)');
  });

  test('UD01_006_画面初期表示_Message标签隐藏', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '006';
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.error-message')).not.toBeVisible();
  });

  test('UD01_007_画面初期表示_UserID输入框属性', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '007';
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#userID');
    // placeholder
    await expect(input).toHaveAttribute('placeholder', '请输入用户ID');
    // maxLength=10
    await expect(input).toHaveAttribute('maxLength', String(MAX_USER_ID_LENGTH));
    // 全角字符无法输入
    await input.fill('\uFF21\uFF22\uFF23\uFF11\uFF12\uFF13');
    await expect(input).toHaveValue('');
  });

  test('UD01_008_画面初期表示_Password输入框属性', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '008';
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#password');
    // placeholder
    await expect(input).toHaveAttribute('placeholder', '请输入密码');
    // type=password
    await expect(input).toHaveAttribute('type', 'password');
    // maxLength=32
    await expect(input).toHaveAttribute('maxLength', String(MAX_PASSWORD_LENGTH));
    // 符号可输入
    await input.fill('Pass!@#123');
    await expect(input).toHaveValue('Pass!@#123');
  });
});

// ============================================================
// 2. 空值校验 (No.9-12)
// ============================================================
test.describe('空值校验', () => {

  test('UD01_009_空值校验_UserID为空', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '009';
    // 初期表示（已在beforeEach中加载）
    await takeScreenshot(page, '初期表示');

    // Password 输入 admin123
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, 'Password入力後');

    // 点击 Login
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    await takeScreenshot(page, '操作後');

    // Message 显示
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toHaveText('Username and password are required.');
    await expect(page.locator('.error-message')).toHaveCSS('color', 'rgb(255, 77, 79)');
    // 画面无跳转
    await expect(page).toHaveURL(BASE_URL + '/');
    // Password 值保持不变
    await expect(page.locator('#password')).toHaveValue(REAL_PASS);
    // 焦点移到 UserID
    await expect(page.locator('#userID')).toBeFocused();
  });

  test('UD01_010_空值校验_Password为空', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '010';
    await takeScreenshot(page, '初期表示');

    await page.locator('#userID').fill(REAL_USER);
    await takeScreenshot(page, 'UserID入力後');

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    await takeScreenshot(page, '操作後');

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toHaveText('Username and password are required.');
    await expect(page.locator('.error-message')).toHaveCSS('color', 'rgb(255, 77, 79)');
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('#userID')).toHaveValue(REAL_USER);
    // 焦点移到 Password
    await expect(page.locator('#password')).toBeFocused();
  });

  test('UD01_011_空值校验_两者为空', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '011';
    await takeScreenshot(page, '初期表示');

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    await takeScreenshot(page, '操作後');

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toHaveText('Username and password are required.');
    await expect(page.locator('.error-message')).toHaveCSS('color', 'rgb(255, 77, 79)');
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('UD01_012_空值校验_仅空格', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '012';
    await takeScreenshot(page, '初期表示');

    // 输入空格（组件正则过滤空格，但验证trim逻辑）
    await page.locator('#userID').fill('   ');
    await page.locator('#password').fill('   ');
    await takeScreenshot(page, '空格入力後');

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    await takeScreenshot(page, '操作後');

    // 组件中 userID=''（空格被正则拒绝），password=''（空格被正则拒绝）
    // 前端校验 userID 为空
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toHaveText('Username and password are required.');
    await expect(page.locator('.error-message')).toHaveCSS('color', 'rgb(255, 77, 79)');
    await expect(page).toHaveURL(BASE_URL + '/');
  });
});

// ============================================================
// 3. UserID 输入限制 (No.13-17)
// ============================================================
test.describe('UserID输入限制', () => {

  test('UD01_013_UserID_最大字符数10字符', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '013';
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#userID');
    await input.fill('ABCDEFGHIJ');
    await takeScreenshot(page, '10字符入力後');

    await expect(input).toHaveValue('ABCDEFGHIJ');
    await expect(page.locator('.error-message')).not.toBeVisible();
  });

  test('UD01_014_UserID_超过最大字符数10字符（11字符）', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '014';
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#userID');
    await input.fill('ABCDEFGHIJK');
    await takeScreenshot(page, '11字符入力後');

    const val = await input.inputValue();
    expect(val.length).toBe(MAX_USER_ID_LENGTH);
    expect(val).toBe('ABCDEFGHIJ');
    await expect(page.locator('.error-message')).not.toBeVisible();
  });

  test('UD01_015_UserID_仅允许半角英数字', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '015';
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#userID');
    await input.fill('\uFF21\uFF22\uFF23\uFF11\uFF12\uFF13');
    await takeScreenshot(page, '全角入力後');

    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message')).not.toBeVisible();
  });

  test('UD01_016_UserID_符号不可输入', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '016';
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#userID');
    await input.fill('@#$%');
    await takeScreenshot(page, '符号入力後');

    await expect(input).toHaveValue('');
    await expect(page.locator('.error-message')).not.toBeVisible();
  });

  test('UD01_017_UserID_正常输入（半角英数字）', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '017';
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#userID');
    await input.fill('admin123');
    await takeScreenshot(page, 'admin123入力後');

    await expect(input).toHaveValue('admin123');
    // 文字左对齐
    const textAlign = await input.evaluate(el => getComputedStyle(el).textAlign);
    expect(textAlign).toBe('left');
    await expect(page.locator('.error-message')).not.toBeVisible();
  });
});

// ============================================================
// 4. Password 输入限制 (No.18-20)
// ============================================================
test.describe('Password输入限制', () => {

  test('UD01_018_Password_最大字符数32字符', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '018';
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#password');
    await input.fill('ABCDEFGHIJKLMNOPQRSTUVWXYZ123456');
    await takeScreenshot(page, '32字符入力後');

    await expect(input).toHaveValue('ABCDEFGHIJKLMNOPQRSTUVWXYZ123456');
    await expect(input).toHaveAttribute('type', 'password');
    await expect(page.locator('.error-message')).not.toBeVisible();
  });

  test('UD01_019_Password_超过最大字符数32字符（33字符）', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '019';
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#password');
    await input.fill('ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567');
    await takeScreenshot(page, '33字符入力後');

    const val = await input.inputValue();
    expect(val.length).toBe(MAX_PASSWORD_LENGTH);
    expect(val).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ123456');
    await expect(input).toHaveAttribute('type', 'password');
    await expect(page.locator('.error-message')).not.toBeVisible();
  });

  test('UD01_020_Password_含符号字符可输入', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '020';
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#password');
    await input.fill('Pass!@#123');
    await takeScreenshot(page, '符号含み入力後');

    await expect(input).toHaveValue('Pass!@#123');
    await expect(input).toHaveAttribute('type', 'password');
    await expect(page.locator('.error-message')).not.toBeVisible();
  });
});

// ============================================================
// 5. 认证处理 (No.21-25)
// ============================================================
test.describe('认证处理', () => {

  test('UD01_021_认证成功_admin_admin123', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '021';
    await takeScreenshot(page, '初期表示');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click();

    // Login中按钮状态
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    await expect(page.locator('button[type="submit"]')).toHaveText('处理中...');
    await takeScreenshot(page, 'Login処理中');

    // 跳转Menu
    await page.waitForURL('**/Menu', { timeout: 60000 });
    await takeScreenshot(page, 'Menu画面遷移後');

    const storedUserID = await page.evaluate(() => localStorage.getItem('userID'));
    expect(storedUserID).toBe(REAL_USER);
  });

  test('UD01_022_认证成功_admin2_sylus001', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '022';
    await takeScreenshot(page, '初期表示');

    await page.locator('#userID').fill(ADMIN2_USER);
    await page.locator('#password').fill(ADMIN2_PASS);
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/Menu', { timeout: 60000 });
    await takeScreenshot(page, 'Menu画面遷移後');

    const storedUserID = await page.evaluate(() => localStorage.getItem('userID'));
    expect(storedUserID).toBe(ADMIN2_USER);
  });

  test('UD01_023_认证成功_hhtuser001_pass123', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '023';
    await takeScreenshot(page, '初期表示');

    await page.locator('#userID').fill(HHT_USER);
    await page.locator('#password').fill(HHT_PASS);
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/Menu', { timeout: 60000 });
    await takeScreenshot(page, 'Menu画面遷移後');

    const storedUserID = await page.evaluate(() => localStorage.getItem('userID'));
    expect(storedUserID).toBe(HHT_USER);
  });

  test('UD01_024_认证失败_不存在的UserID', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '024';
    await takeScreenshot(page, '初期表示');

    await page.locator('#userID').fill(NON_EXIST_USER);
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click();
    await page.waitForSelector('.error-message', { timeout: 15000 });
    await takeScreenshot(page, '操作後');

    await expect(page.locator('.error-message')).toHaveText("We didn't recognize the username or password you entered. Please try again.");
    await expect(page.locator('.error-message')).toHaveCSS('color', 'rgb(255, 77, 79)');
    // Password 被清除
    await expect(page.locator('#password')).toHaveValue('');
    // 画面无跳转
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('UD01_025_认证失败_错误的Password', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '025';
    await takeScreenshot(page, '初期表示');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(WRONG_PASS);
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click();
    await page.waitForSelector('.error-message', { timeout: 15000 });
    await takeScreenshot(page, '操作後');

    await expect(page.locator('.error-message')).toHaveText("We didn't recognize the username or password you entered. Please try again.");
    await expect(page.locator('.error-message')).toHaveCSS('color', 'rgb(255, 77, 79)');
    // Password 被清除
    await expect(page.locator('#password')).toHaveValue('');
    // UserID 保持不变
    await expect(page.locator('#userID')).toHaveValue(REAL_USER);
    // 画面无跳转
    await expect(page).toHaveURL(BASE_URL + '/');
  });
});

// ============================================================
// 6. 异常处理 (No.26-28)
// ============================================================
test.describe('异常处理', () => {

  test('UD01_026_异常处理_网络断开', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '026';
    await takeScreenshot(page, '初期表示');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, '入力後');

    // 模拟网络断开
    await page.route('**/api/ud01/authentication**', route => {
      route.abort('internetdisconnected');
    });

    await page.locator('button[type="submit"]').click();
    await page.waitForSelector('.error-message', { timeout: 15000 });
    await takeScreenshot(page, '操作後');

    await expect(page.locator('.error-message')).toHaveText('System error. Please try again later.');
    await expect(page.locator('.error-message')).toHaveCSS('color', 'rgb(255, 77, 79)');
    // 按钮恢复可用
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
    await expect(page.locator('button[type="submit"]')).toHaveText('Login');
    // 输入框恢复
    await expect(page.locator('#userID')).toBeEnabled();
    await expect(page.locator('#password')).toBeEnabled();
    // 画面无跳转
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('UD01_027_异常处理_服务器500错误', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '027';
    await takeScreenshot(page, '初期表示');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, '入力後');

    await page.route('**/api/ud01/authentication**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'Internal Server Error' }),
      });
    });

    await page.locator('button[type="submit"]').click();
    await page.waitForSelector('.error-message', { timeout: 15000 });
    await takeScreenshot(page, '操作後');

    await expect(page.locator('.error-message')).toHaveText('System error. Please try again later.');
    await expect(page.locator('.error-message')).toHaveCSS('color', 'rgb(255, 77, 79)');
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('UD01_028_异常处理_请求超时', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '028';
    await takeScreenshot(page, '初期表示');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, '入力後');

    await page.route('**/api/ud01/authentication**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 35000));
      route.abort('timedout');
    });

    await page.locator('button[type="submit"]').click();
    await page.waitForSelector('.error-message', { timeout: 60000 });
    await takeScreenshot(page, '操作後');

    await expect(page.locator('.error-message')).toHaveText('Request timeout. Please check your network connection.');
    await expect(page.locator('.error-message')).toHaveCSS('color', 'rgb(255, 77, 79)');
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
    await expect(page).toHaveURL(BASE_URL + '/');
  });
});

// ============================================================
// 7. UI状态 (No.29-31)
// ============================================================
test.describe('UI状态', () => {

  test('UD01_029_UI状态_Login中按钮禁用', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '029';
    await page.route('**/api/ud01/authentication**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { username: 'Administrator' } }),
      });
    });

    await takeScreenshot(page, '初期表示');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click();
    // API响应前确认控件禁用
    await page.waitForTimeout(500);

    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    await expect(page.locator('button[type="submit"]')).toHaveText('处理中...');
    await expect(page.locator('#userID')).toBeDisabled();
    await expect(page.locator('#password')).toBeDisabled();
    await takeScreenshot(page, 'Login中禁用');
  });

  test('UD01_030_UI状态_防止重复提交', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '030';
    let apiCallCount = 0;

    await page.route('**/api/ud01/authentication**', async (route) => {
      apiCallCount++;
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { username: 'Administrator' } }),
      });
    });

    await takeScreenshot(page, '初期表示');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, '入力後');

    const btn = page.locator('button[type="submit"]');
    await btn.click();
    await page.waitForTimeout(300);
    await btn.click({ force: true });
    await btn.click({ force: true });
    await takeScreenshot(page, '重复提交試行');

    expect(apiCallCount).toBe(1);
    await page.waitForURL('**/Menu', { timeout: 30000 }).catch(() => {});
  });

  test('UD01_031_UI状态_认证失败后Password清除', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '031';
    await takeScreenshot(page, '初期表示');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(WRONG_PASS);
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click();
    await page.waitForSelector('.error-message', { timeout: 15000 });
    await takeScreenshot(page, '操作後');

    // Password 被清除
    await expect(page.locator('#password')).toHaveValue('');
    // UserID 保持不变
    await expect(page.locator('#userID')).toHaveValue(REAL_USER);
    // Message 显示错误
    await expect(page.locator('.error-message')).toBeVisible();
  });
});

// ============================================================
// 8. 画面跳转 (No.32-34)
// ============================================================
test.describe('画面跳转', () => {

  test('UD01_032_画面跳转_认证成功后跳转Menu', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '032';
    await takeScreenshot(page, '初期表示');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/Menu', { timeout: 60000 });
    await takeScreenshot(page, 'Menu画面遷移後');

    const storedUserID = await page.evaluate(() => localStorage.getItem('userID'));
    expect(storedUserID).toBe(REAL_USER);
  });

  test('UD01_033_画面跳转_认证成功后admin2跳转Menu', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '033';
    await takeScreenshot(page, '初期表示');

    await page.locator('#userID').fill(ADMIN2_USER);
    await page.locator('#password').fill(ADMIN2_PASS);
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/Menu', { timeout: 60000 });
    await takeScreenshot(page, 'Menu画面遷移後');

    const storedUserID = await page.evaluate(() => localStorage.getItem('userID'));
    expect(storedUserID).toBe(ADMIN2_USER);
  });

  test('UD01_034_画面跳转_未认证直接访问Menu', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '034';
    // 清除 localStorage（已在 beforeEach 中处理）
    await page.goto(BASE_URL + '/Menu');
    await page.waitForTimeout(1000);

    await takeScreenshot(page, 'Menu直接訪問');

    // 重定向到 Login
    await expect(page).toHaveURL(BASE_URL + '/');
    // 输入框为空
    await expect(page.locator('#userID')).toHaveValue('');
    await expect(page.locator('#password')).toHaveValue('');
    // Message 不显示
    await expect(page.locator('.error-message')).not.toBeVisible();
    await takeScreenshot(page, 'Login画面確認');
  });
});

// ============================================================
// 9. 安全性 (No.35-36)
// ============================================================
test.describe('安全性', () => {

  test('UD01_035_安全性_Password不显示在Console', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '035';
    const consoleMessages: string[] = [];

    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    await takeScreenshot(page, '初期表示');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/Menu', { timeout: 60000 }).catch(() => {});
    await takeScreenshot(page, 'Login実行後');

    // Console 中不包含 Password 值
    const passwordLeaked = consoleMessages.some(msg => msg.includes(REAL_PASS));
    expect(passwordLeaked).toBe(false);
  });

  test('UD01_036_安全性_认证失败后Password清除', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '036';
    await takeScreenshot(page, '初期表示');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(WRONG_PASS);
    await takeScreenshot(page, '入力後');

    await page.locator('button[type="submit"]').click();
    await page.waitForSelector('.error-message', { timeout: 15000 });
    await takeScreenshot(page, '操作後');

    // Password 立即被清除
    await expect(page.locator('#password')).toHaveValue('');
    const pwdVal = await page.locator('#password').inputValue();
    expect(pwdVal).toBe('');
  });
});
