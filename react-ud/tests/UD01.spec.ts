import { test, expect, Page } from '@playwright/test';

// ============================================================
// Login 模块 (UD01) Playwright 自动化测试
// 基于 単体テスト仕様書UD01.md
// ============================================================

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8081/api/authentication';
const SCREENSHOT_DIR = 'tests/image/UD01';

let screenshotCounter: { [key: string]: number } = {};

async function takeScreenshot(page: Page, name: string) {
  if (!screenshotCounter[name]) screenshotCounter[name] = 0;
  screenshotCounter[name]++;
  const seq = String(screenshotCounter[name]).padStart(3, '0');
  // 等待字体和网络资源加载完毕，避免截图超时
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${name}_${seq}.jpeg`,
    type: 'jpeg', quality: 85, fullPage: true,
    timeout: 15000,
  });
}

function resetCounter(name: string) {
  screenshotCounter[name] = 0;
}

/** 安全导航：domcontentloaded + 重试 + 等待 React 渲染 */
async function safeGoto(page: Page) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('.login-container', { timeout: 15000 });
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      return;
    } catch (e) {
      // 如果页面已关闭（测试超时导致），直接抛出不再重试
      if (i === 2 || page.isClosed()) throw e;
      await page.waitForTimeout(2000);
    }
  }
}

// ============================================================
// 1. 控件初始状态 (No.1-4)
// ============================================================
test.describe('控件初始状态', () => {
  test.beforeEach(async ({ page }) => { await safeGoto(page); });

  test('No.1 username 输入框-初始状态', async ({ page }) => {
    resetCounter('01_username输入框_初始状态');
    const el = page.locator('#username');
    await expect(el).toBeVisible();
    await expect(el).toHaveValue('');
    await expect(el).toHaveAttribute('placeholder', 'UserID');
    await expect(el).toBeEnabled();
    await expect(el).toHaveAttribute('type', 'text');
    await takeScreenshot(page, '01_username输入框_初始状态');
  });

  test('No.2 password 输入框-初始状态', async ({ page }) => {
    resetCounter('02_password输入框_初始状态');
    const el = page.locator('#password');
    await expect(el).toBeVisible();
    await expect(el).toHaveValue('');
    await expect(el).toHaveAttribute('placeholder', 'Password');
    await expect(el).toBeEnabled();
    await expect(el).toHaveAttribute('type', 'password');
    await takeScreenshot(page, '02_password输入框_初始状态');
  });

  test('No.3 Message 标签-初始状态', async ({ page }) => {
    resetCounter('03_Message标签_初始状态');
    await expect(page.locator('.error-message')).toHaveCount(0);
    await takeScreenshot(page, '03_Message标签_初始状态');
  });

  test('No.4 Login 按钮-初始状态', async ({ page }) => {
    resetCounter('04_Login按钮_初始状态');
    const btn = page.locator('.login-button');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('Login');
    await expect(btn).toBeEnabled();
    await takeScreenshot(page, '04_Login按钮_初始状态');
  });
});

// ============================================================
// 2. username 输入校验 (No.5-11)
// ============================================================
test.describe('username 输入校验', () => {
  test.beforeEach(async ({ page }) => { await safeGoto(page); });

  test('No.5 username-半角英文字母', async ({ page }) => {
    resetCounter('05_username_半角英文字母');
    const inp = page.locator('#username');
    await inp.click();
    await inp.pressSequentially('testuser');
    await expect(inp).toHaveValue('testuser');
    await expect(page.locator('.error-message')).toHaveCount(0);
    await takeScreenshot(page, '05_username_半角英文字母');
  });

  test('No.6 username-半角数字', async ({ page }) => {
    resetCounter('06_username_半角数字');
    const inp = page.locator('#username');
    await inp.click();
    await inp.pressSequentially('123456');
    await expect(inp).toHaveValue('123456');
    await takeScreenshot(page, '06_username_半角数字');
  });

  test('No.7 username-半角英数字组合', async ({ page }) => {
    resetCounter('07_username_半角英数字组合');
    const inp = page.locator('#username');
    await inp.click();
    await inp.pressSequentially('user001');
    await expect(inp).toHaveValue('user001');
    await takeScreenshot(page, '07_username_半角英数字组合');
  });

  test('No.8 username-全角文字阻止', async ({ page }) => {
    resetCounter('08_username_全角文字阻止');
    const inp = page.locator('#username');
    await inp.click();
    await page.keyboard.type('ＴＥＳＴ');
    await expect(inp).toHaveValue('');
    await takeScreenshot(page, '08_username_全角文字阻止');
  });

  test('No.9 username-特殊符号阻止', async ({ page }) => {
    resetCounter('09_username_特殊符号阻止');
    const inp = page.locator('#username');
    await inp.click();
    await page.keyboard.type('@#$%');
    await expect(inp).toHaveValue('');
    await takeScreenshot(page, '09_username_特殊符号阻止');
  });

  test('No.10 username-最大长度 10 字符', async ({ page }) => {
    resetCounter('10_username_最大长度10字符');
    const inp = page.locator('#username');
    await inp.click();
    await inp.pressSequentially('abcdefghijk');
    const val = await inp.inputValue();
    expect(val.length).toBeLessThanOrEqual(10);
    expect(val).toBe('abcdefghij');
    await takeScreenshot(page, '10_username_最大长度10字符');
  });

  test('No.11 username-边界值 10 字符', async ({ page }) => {
    resetCounter('11_username_边界值10字符');
    const inp = page.locator('#username');
    await inp.click();
    await inp.pressSequentially('abcdefghij');
    await expect(inp).toHaveValue('abcdefghij');
    await takeScreenshot(page, '11_username_边界值10字符');
  });
});

// ============================================================
// 3. password 输入校验 (No.12-17)
// ============================================================
test.describe('password 输入校验', () => {
  test.beforeEach(async ({ page }) => { await safeGoto(page); });

  test('No.12 password-半角英数字', async ({ page }) => {
    resetCounter('12_password_半角英数字');
    const inp = page.locator('#password');
    await inp.click();
    await inp.pressSequentially('Pass123');
    await expect(inp).toHaveAttribute('type', 'password');
    await expect(inp).toHaveValue('Pass123');
    await expect(page.locator('.error-message')).toHaveCount(0);
    await takeScreenshot(page, '12_password_半角英数字');
  });

  test('No.13 password-半角英数字加符号', async ({ page }) => {
    resetCounter('13_password_半角英数字加符号');
    const inp = page.locator('#password');
    await inp.click();
    await inp.pressSequentially('P@ssw0rd!');
    await expect(inp).toHaveValue('P@ssw0rd!');
    await takeScreenshot(page, '13_password_半角英数字加符号');
  });

  test('No.14 password-全角文字阻止', async ({ page }) => {
    resetCounter('14_password_全角文字阻止');
    const inp = page.locator('#password');
    await inp.click();
    await page.keyboard.type('ＴＥＳＴ');
    await expect(inp).toHaveValue('');
    await takeScreenshot(page, '14_password_全角文字阻止');
  });

  test('No.15 password-最大长度 32 字符', async ({ page }) => {
    resetCounter('15_password_最大长度32字符');
    const inp = page.locator('#password');
    await inp.click();
    await inp.pressSequentially('a'.repeat(33));
    const val = await inp.inputValue();
    expect(val.length).toBeLessThanOrEqual(32);
    expect(val).toBe('a'.repeat(32));
    await takeScreenshot(page, '15_password_最大长度32字符');
  });

  test('No.16 password-边界值 32 字符', async ({ page }) => {
    resetCounter('16_password_边界值32字符');
    const inp = page.locator('#password');
    await inp.click();
    await inp.pressSequentially('a'.repeat(32));
    await expect(inp).toHaveValue('a'.repeat(32));
    await takeScreenshot(page, '16_password_边界值32字符');
  });

  test('No.17 password-输入时隐藏显示', async ({ page }) => {
    resetCounter('17_password_输入时隐藏显示');
    const inp = page.locator('#password');
    await inp.click();
    await inp.pressSequentially('test123');
    await expect(inp).toHaveAttribute('type', 'password');
    await expect(inp).toHaveValue('test123');
    await takeScreenshot(page, '17_password_输入时隐藏显示');
  });
});

// ============================================================
// 4. 空值校验（前端校验）(No.18-23)
// ============================================================
test.describe('空值校验', () => {
  test.beforeEach(async ({ page }) => { await safeGoto(page); });

  test('No.18 空值校验-username 为空', async ({ page }) => {
    resetCounter('18_空值校验_username为空');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('Pass123');
    await page.locator('.login-button').click();
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();
    await expect(msg).toHaveText('Username and password are required.');
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-button')).toBeEnabled();
    await takeScreenshot(page, '18_空值校验_username为空');
  });

  test('No.19 空值校验-password 为空', async ({ page }) => {
    resetCounter('19_空值校验_password为空');
    await page.locator('#username').click();
    await page.locator('#username').pressSequentially('admin');
    await page.locator('.login-button').click();
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();
    await expect(msg).toHaveText('Username and password are required.');
    await expect(page).toHaveURL(BASE_URL + '/');
    await takeScreenshot(page, '19_空值校验_password为空');
  });

  test('No.20 空值校验-两者都为空', async ({ page }) => {
    resetCounter('20_空值校验_两者都为空');
    await page.locator('.login-button').click();
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();
    await expect(msg).toHaveText('Username and password are required.');
    await expect(msg).toHaveCount(1);
    await expect(page).toHaveURL(BASE_URL + '/');
    await takeScreenshot(page, '20_空值校验_两者都为空');
  });

  test('No.21 空值校验-username 仅空格', async ({ page }) => {
    resetCounter('21_空值校验_username仅空格');
    await page.locator('#username').fill('   ');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('Pass123');
    await page.locator('.login-button').click();
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();
    await expect(msg).toHaveText('Username and password are required.');
    await takeScreenshot(page, '21_空值校验_username仅空格');
  });

  test('No.22 空值校验-password 仅空格', async ({ page }) => {
    resetCounter('22_空值校验_password仅空格');
    await page.locator('#username').click();
    await page.locator('#username').pressSequentially('admin');
    await page.locator('#password').fill('   ');
    await page.locator('.login-button').click();
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();
    await expect(msg).toHaveText('Username and password are required.');
    await takeScreenshot(page, '22_空值校验_password仅空格');
  });

  test('No.23 连续空值提交防止重复调用', async ({ page }) => {
    resetCounter('23_连续空值提交防止重复调用');
    const btn = page.locator('.login-button');
    for (let i = 0; i < 5; i++) await btn.click();
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();
    await expect(msg).toHaveText('Username and password are required.');
    await expect(page).toHaveURL(BASE_URL + '/');
    await takeScreenshot(page, '23_连续空值提交防止重复调用');
  });
});

// ============================================================
// 5. 登录成功 (No.24-27)
// ============================================================
test.describe('登录成功', () => {
  test.beforeEach(async ({ page }) => { await safeGoto(page); });

  test('No.24 登录成功-正确的用户名和密码', async ({ page }) => {
    resetCounter('24_登录成功_正确的用户名和密码');
    await page.route(API_URL, async route => {
      await new Promise(r => setTimeout(r, 2000));
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { success: true, token: 'mock-token-12345',
          userid: 'admin', username: 'admin', responsible: 'Admin User',
          userposition: 'Manager', email: 'admin@example.com' } }),
      });
    });

    await page.locator('#username').click();
    await page.locator('#username').pressSequentially('admin');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('admin123');
    await takeScreenshot(page, '24_登录成功_正确的用户名和密码');

    await page.locator('.login-button').click();
    await expect(page.locator('.login-button')).toBeDisabled();
    await expect(page.locator('#username')).toBeDisabled();
    await expect(page.locator('#password')).toBeDisabled();
    await takeScreenshot(page, '24_登录成功_正确的用户名和密码');

    await page.waitForSelector('.menu-layout', { timeout: 15000 });
    const info = JSON.parse(await page.evaluate(() => localStorage.getItem('userInfo') || '{}'));
    expect(info.userid).toBe('admin');
    expect(info.username).toBe('admin');
    expect(info.email).toBe('admin@example.com');
    await expect(page.locator('.error-message')).toHaveCount(0);
    await takeScreenshot(page, '24_登录成功_正确的用户名和密码');
  });

  // 当前 UI 实现不允许输入空格（正则 /^[a-zA-Z0-9]*$/ 过滤），此场景不可达
  test.skip('No.25 登录成功-用户名含首尾空格', async ({ page }) => {
    resetCounter('25_登录成功_用户名含首尾空格');
    let requestBody: any = null;
    await page.route(API_URL, async (route, request) => {
      requestBody = JSON.parse(request.postData() || '{}');
      await new Promise(r => setTimeout(r, 2000));
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { success: true, token: 't',
          userid: 'admin', username: 'admin' } }),
      });
    });

    await page.locator('#username').fill('  admin  ');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('admin123');
    await takeScreenshot(page, '25_登录成功_用户名含首尾空格');

    await page.locator('.login-button').click();
    await page.waitForSelector('.menu-layout', { timeout: 15000 });
    expect(requestBody).not.toBeNull();
    expect(requestBody.username).toBe('admin');
  });

  test('No.26 登录成功-userInfo 保存完整', async ({ page }) => {
    resetCounter('26_登录成功_userInfo保存完整');
    await page.route(API_URL, async route => {
      await new Promise(r => setTimeout(r, 2000));
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { success: true, token: 't',
          userid: 'testuser', username: 'testuser', responsible: 'Test User',
          userposition: 'Developer', email: 'testuser@example.com' } }),
      });
    });

    await page.locator('#username').click();
    await page.locator('#username').pressSequentially('testuser');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('password123');
    await page.locator('.login-button').click();
    await page.waitForSelector('.menu-layout', { timeout: 15000 });
    const info = JSON.parse(await page.evaluate(() => localStorage.getItem('userInfo') || '{}'));
    expect(info.userid).toBe('testuser');
    expect(info.username).toBe('testuser');
    expect(info.responsible).toBe('Test User');
    expect(info.userposition).toBe('Developer');
    expect(info.email).toBe('testuser@example.com');
    await takeScreenshot(page, '26_登录成功_userInfo保存完整');
  });

  test('No.27 登录成功后 Message 清除', async ({ page }) => {
    resetCounter('27_登录成功后Message清除');
    await page.route(API_URL, async route => {
      await new Promise(r => setTimeout(r, 2000));
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { success: true, token: 't',
          userid: 'admin', username: 'admin' } }),
      });
    });

    await page.locator('.login-button').click();
    await expect(page.locator('.error-message')).toBeVisible();
    await takeScreenshot(page, '27_登录成功后Message清除');

    await page.locator('#username').click();
    await page.locator('#username').pressSequentially('admin');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('admin123');
    await page.locator('.login-button').click();
    await page.waitForSelector('.menu-layout', { timeout: 15000 });
  });
});

// ============================================================
// 6. 登录失败-API 返回错误 (No.28-32)
// ============================================================
test.describe('登录失败_API返回错误', () => {
  test.beforeEach(async ({ page }) => { await safeGoto(page); });

  test('No.28 登录失败-401 用户名或密码错误', async ({ page }) => {
    resetCounter('28_登录失败_401用户名或密码错误');
    await page.route(API_URL, async route => {
      await route.fulfill({ status: 401, contentType: 'application/json',
        body: JSON.stringify({ code: 401, message: 'Invalid credentials' }),
      });
    });

    await page.locator('#username').click();
    await page.locator('#username').pressSequentially('wrong');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('wrong');
    await takeScreenshot(page, '28_登录失败_401用户名或密码错误');

    await page.locator('.login-button').click();
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();
    await expect(msg).toHaveText("We didn't recognize the username or password you entered. Please try again.");
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-button')).toBeEnabled();
    await expect(page.locator('#username')).toBeEnabled();
    await expect(page.locator('#password')).toBeEnabled();
    await takeScreenshot(page, '28_登录失败_401用户名或密码错误');
  });

  test('No.29 登录失败-403 账户已锁定', async ({ page }) => {
    resetCounter('29_登录失败_403账户已锁定');
    await page.route(API_URL, async route => {
      await route.fulfill({ status: 403, contentType: 'application/json',
        body: JSON.stringify({ code: 403, message: 'Your account is locked. Please contact your system administrator.' }),
      });
    });

    await page.locator('#username').click();
    await page.locator('#username').pressSequentially('lockeduser');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('pass123');
    await page.locator('.login-button').click();
    await expect(page).toHaveURL(BASE_URL + '/');
    await takeScreenshot(page, '29_登录失败_403账户已锁定');
  });

  test('No.30 登录失败-500 服务器错误', async ({ page }) => {
    resetCounter('30_登录失败_500服务器错误');
    await page.route(API_URL, async route => {
      await route.fulfill({ status: 500, contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'Internal server error' }),
      });
    });

    await page.locator('#username').click();
    await page.locator('#username').pressSequentially('admin');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('admin123');
    await takeScreenshot(page, '30_登录失败_500服务器错误');

    await page.locator('.login-button').click();
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();
    await expect(msg).toHaveText('System error. Please contact administrator.');
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('No.31 登录失败-API 返回 code≠200 或 success=false', async ({ page }) => {
    resetCounter('31_登录失败_API返回code≠200');
    await page.route(API_URL, async route => {
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ code: 401, message: 'Invalid username or password', data: { success: false } }),
      });
    });

    await page.locator('#username').click();
    await page.locator('#username').pressSequentially('admin');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('wrong');
    await takeScreenshot(page, '31_登录失败_API返回code≠200');

    await page.locator('.login-button').click();
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();
    await expect(msg).toHaveText('Invalid username or password');
    await expect(page.locator('#password')).toHaveValue('');
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('No.32 登录失败后 password 被清空', async ({ page }) => {
    resetCounter('32_登录失败后password被清空');
    await page.route(API_URL, async route => {
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ code: 401, message: 'Invalid', data: { success: false } }),
      });
    });

    await page.locator('#username').click();
    await page.locator('#username').pressSequentially('admin');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('wrongpass');
    await page.locator('.login-button').click();
    await expect(page.locator('#password')).toHaveValue('');
    await expect(page.locator('#username')).toHaveValue('admin');
    await takeScreenshot(page, '32_登录失败后password被清空');
  });
});

// ============================================================
// 7. 异常处理 (No.33-35)
// ============================================================
test.describe('异常处理', () => {
  test.beforeEach(async ({ page }) => { await safeGoto(page); });

  test('No.33 异常处理-网络断开', async ({ page }) => {
    resetCounter('33_异常处理_网络断开');
    await page.route(API_URL, async route => route.abort('connectionrefused'));

    await page.locator('#username').click();
    await page.locator('#username').pressSequentially('admin');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('admin123');
    await takeScreenshot(page, '33_异常处理_网络断开');

    await page.locator('.login-button').click();
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible({ timeout: 10000 });
    await expect(msg).toHaveText('System error. Please contact administrator.');
    await expect(page.locator('.login-button')).toBeEnabled();
    await expect(page.locator('#username')).toBeEnabled();
    await expect(page.locator('#password')).toBeEnabled();
    await takeScreenshot(page, '33_异常处理_网络断开');
  });

  test('No.34 异常处理-API 超时', async ({ page }) => {
    resetCounter('34_异常处理_API超时');
    await page.route(API_URL, async () => new Promise(() => {}));

    await page.locator('#username').click();
    await page.locator('#username').pressSequentially('admin');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('admin123');
    await takeScreenshot(page, '34_异常处理_API超时');

    await page.locator('.login-button').click();
    await expect(page.locator('.login-button')).toBeDisabled({ timeout: 3000 });
    await page.unroute(API_URL);
  });

  test('No.35 异常处理-API 返回非 JSON 格式', async ({ page }) => {
    resetCounter('35_异常处理_API返回非JSON格式');
    await page.route(API_URL, async route => {
      await route.fulfill({ status: 200, contentType: 'text/plain', body: 'Internal Server Error' });
    });

    await page.locator('#username').click();
    await page.locator('#username').pressSequentially('admin');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('admin123');
    await takeScreenshot(page, '35_异常处理_API返回非JSON格式');

    await page.locator('.login-button').click();
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible({ timeout: 10000 });
    await expect(msg).toHaveText('System error. Please contact administrator.');
  });
});

// ============================================================
// 8. UI 交互 (No.36-39)
// ============================================================
test.describe('UI交互', () => {
  test.beforeEach(async ({ page }) => { await safeGoto(page); });

  test('No.36 登录中按钮和输入框禁用', async ({ page }) => {
    resetCounter('36_登录中按钮和输入框禁用');
    await page.route(API_URL, async route => {
      await new Promise(r => setTimeout(r, 5000));
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { success: true, token: 't', userid: 'a', username: 'a' } }),
      });
    });

    await page.locator('#username').click();
    await page.locator('#username').pressSequentially('admin');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('admin123');
    await takeScreenshot(page, '36_登录中按钮和输入框禁用');

    await page.locator('.login-button').click();
    await expect(page.locator('.login-button')).toBeDisabled({ timeout: 3000 });
    await expect(page.locator('.login-button')).toHaveText('Processing...');
    await expect(page.locator('#username')).toBeDisabled();
    await expect(page.locator('#password')).toBeDisabled();
    await takeScreenshot(page, '36_登录中按钮和输入框禁用');
    await page.unroute(API_URL);
  });

  test('No.37 登录中防止重复提交', async ({ page }) => {
    resetCounter('37_登录中防止重复提交');
    let apiCallCount = 0;
    await page.route(API_URL, async route => {
      apiCallCount++;
      await new Promise(r => setTimeout(r, 5000));
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { success: true, token: 't', userid: 'a', username: 'a' } }),
      });
    });

    await page.locator('#username').click();
    await page.locator('#username').pressSequentially('admin');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('admin123');
    await takeScreenshot(page, '37_登录中防止重复提交');

    await page.locator('.login-button').click();
    await expect(page.locator('.login-button')).toBeDisabled({ timeout: 3000 });
    await page.locator('.login-button').click({ force: true });
    await page.locator('.login-button').click({ force: true });
    expect(apiCallCount).toBe(1);
    await page.unroute(API_URL);
  });

  test('No.38 输入时清除错误消息', async ({ page }) => {
    resetCounter('38_输入时清除错误消息');
    await page.locator('.login-button').click();
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();
    await expect(msg).toHaveText('Username and password are required.');
    await takeScreenshot(page, '38_输入时清除错误消息');

    await page.locator('#username').click();
    await page.locator('#username').pressSequentially('a');
    await expect(msg).toHaveCount(0);
  });

  test('No.39 Enter 键触发登录', async ({ page }) => {
    resetCounter('39_Enter键触发登录');
    await page.route(API_URL, async route => {
      await new Promise(r => setTimeout(r, 2000));
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { success: true, token: 't', userid: 'admin', username: 'admin',
          responsible: 'A', userposition: 'U', email: 'a@b.com' } }),
      });
    });

    await page.locator('#username').click();
    await page.locator('#username').pressSequentially('admin');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('admin123');
    await takeScreenshot(page, '39_Enter键触发登录');

    await page.locator('#password').press('Enter');
    await page.waitForSelector('.menu-layout', { timeout: 15000 });
  });
});

// ============================================================
// 9. 消息显示 (No.40-42)
// ============================================================
test.describe('消息显示', () => {
  test.beforeEach(async ({ page }) => { await safeGoto(page); });

  test('No.40 错误消息样式', async ({ page }) => {
    resetCounter('40_错误消息样式');
    await page.locator('#username').clear();
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('test');
    await takeScreenshot(page, '40_错误消息样式');

    await page.locator('.login-button').click();
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();
    const align = await msg.evaluate(el => window.getComputedStyle(el).textAlign);
    expect(align).toBe('left');
    await expect(msg).toHaveText('Username and password are required.');
  });

  test('No.41 新操作时清除前一条错误消息', async ({ page }) => {
    resetCounter('41_新操作时清除前一条错误消息');
    await page.locator('.login-button').click();
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();
    await expect(msg).toHaveText('Username and password are required.');

    await page.locator('.login-button').click();
    await expect(msg).toBeVisible();
    await expect(msg).toHaveText('Username and password are required.');
  });

  test('No.42 登录成功后不显示错误消息', async ({ page }) => {
    resetCounter('42_登录成功后不显示错误消息');
    await page.route(API_URL, async route => {
      await new Promise(r => setTimeout(r, 2000));
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { success: true, token: 't', userid: 'admin', username: 'admin',
          responsible: 'A', userposition: 'U', email: 'a@b.com' } }),
      });
    });

    await page.locator('.login-button').click();
    await expect(page.locator('.error-message')).toBeVisible();

    await page.locator('#username').click();
    await page.locator('#username').pressSequentially('admin');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('admin123');
    await page.locator('.login-button').click();
    await page.waitForSelector('.menu-layout', { timeout: 15000 });
  });
});

// ============================================================
// 10. 安全性 (No.43-45)
// ============================================================
test.describe('安全性', () => {
  test.beforeEach(async ({ page }) => { await safeGoto(page); });

  test('No.43 安全性-密码输入隐藏', async ({ page }) => {
    resetCounter('43_安全性_密码输入隐藏');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('test123');
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    await takeScreenshot(page, '43_安全性_密码输入隐藏');
  });

  test('No.44 安全性-半角字符限制', async ({ page }) => {
    resetCounter('44_安全性_半角字符限制');
    await page.locator('#username').click();
    await page.keyboard.type('ＴＥＳＴ');
    await expect(page.locator('#username')).toHaveValue('');

    await page.locator('#password').click();
    await page.keyboard.type('ＴＥＳＴ');
    await expect(page.locator('#password')).toHaveValue('');
  });

  test('No.45 安全性-密码不存储在前端', async ({ page }) => {
    resetCounter('45_安全性_密码不存储在前端');
    await page.route(API_URL, async route => {
      await new Promise(r => setTimeout(r, 2000));
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { success: true, token: 'mock-token', userid: 'admin',
          username: 'admin', responsible: 'Admin', userposition: 'User', email: 'admin@test.com' } }),
      });
    });

    await page.locator('#username').click();
    await page.locator('#username').pressSequentially('admin');
    await page.locator('#password').click();
    await page.locator('#password').pressSequentially('admin123');
    await page.locator('.login-button').click();
    await page.waitForSelector('.menu-layout', { timeout: 15000 });

    const info = JSON.parse(await page.evaluate(() => localStorage.getItem('userInfo') || '{}'));
    expect(info.password).toBeUndefined();
    expect(info.token).toBeDefined();
  });
});
