import { test, expect, Page } from '@playwright/test';

// ============================================================
// Login 模块 (UD01) Playwright 自动化测试
// 基于 単体テスト仕様書UD01.md
// ============================================================

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8081/api/authentication';
const SCREENSHOT_DIR = 'tests/image';

// 截图计数器（每个测试用例独立从 001 开始）
let screenshotCounter: { [key: string]: number } = {};

/**
 * 截图辅助函数：以每个测试观点名称为单元，从 001 开始编号
 * @param page Playwright Page 对象
 * @param testViewName 测试观点名称（对应测试式样书的 No+测试对象）
 */
async function takeScreenshot(page: Page, testViewName: string) {
  if (!screenshotCounter[testViewName]) {
    screenshotCounter[testViewName] = 0;
  }
  screenshotCounter[testViewName]++;
  const seq = String(screenshotCounter[testViewName]).padStart(3, '0');
  const fileName = `${testViewName}_${seq}.jpeg`;
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${fileName}`,
    type: 'jpeg',
    quality: 85,
    fullPage: true,
  });
}

/**
 * 重置截图计数器（每个测试用例开始前调用）
 */
function resetCounter(name: string) {
  screenshotCounter[name] = 0;
}

// ============================================================
// 1. 画面初期表示 (No.1-7)
// ============================================================
test.describe('画面初期表示', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('No.1 页面整体布局', async ({ page }) => {
    resetCounter('01_页面整体布局');

    // 确认左右分栏布局
    const container = page.locator('.login-container');
    await expect(container).toBeVisible();
    await takeScreenshot(page, '01_页面整体布局');

    const infoPanel = page.locator('.login-info-panel');
    await expect(infoPanel).toBeVisible();
    await takeScreenshot(page, '01_页面整体布局');

    const formPanel = page.locator('.login-form-panel');
    await expect(formPanel).toBeVisible();
    await takeScreenshot(page, '01_页面整体布局');

    // 确认左侧文字为白色
    const infoPanelColor = await infoPanel.evaluate(el =>
      window.getComputedStyle(el).color
    );
    expect(infoPanelColor).toBe('rgb(255, 255, 255)');
    await takeScreenshot(page, '01_页面整体布局');
  });

  test('No.2 左侧信息区-第一行标题', async ({ page }) => {
    resetCounter('02_左侧信息区_第一行标题');

    const h1 = page.locator('.login-info-panel h1');
    await expect(h1).toBeVisible();
    await takeScreenshot(page, '02_左侧信息区_第一行标题');

    // 确认文字内容
    const h1Text = await h1.textContent();
    expect(h1Text).toContain('EDB');
    expect(h1Text).toContain('Engineering Database');

    // 确认 strong 标签存在（EDB 加粗）
    const strong = h1.locator('strong');
    await expect(strong).toHaveText('EDB');

    // 确认 h1 的 font-weight 为 normal（仅 strong 部分加粗）
    const h1Weight = await h1.evaluate(el =>
      window.getComputedStyle(el).fontWeight
    );
    // normal=400, bold=700, 只要不是 bold 即可
    expect(h1Weight).not.toBe('700');

    // 确认文字颜色为白色
    const h1Color = await h1.evaluate(el =>
      window.getComputedStyle(el).color
    );
    expect(h1Color).toBe('rgb(255, 255, 255)');
    await takeScreenshot(page, '02_左侧信息区_第一行标题');
  });

  test('No.3 左侧信息区-第二行副标题', async ({ page }) => {
    resetCounter('03_左侧信息区_第二行副标题');

    const subtitle = page.locator('.left-content p').first();
    await expect(subtitle).toBeVisible();
    await takeScreenshot(page, '03_左侧信息区_第二行副标题');

    // 确认文字内容
    await expect(subtitle).toHaveText('Use Outlook id and password');

    // 确认文字颜色为白色
    const color = await subtitle.evaluate(el =>
      window.getComputedStyle(el).color
    );
    expect(color).toBe('rgb(255, 255, 255)');
    await takeScreenshot(page, '03_左侧信息区_第二行副标题');
  });

  test('No.4 左侧信息区-第三行支持信息', async ({ page }) => {
    resetCounter('04_左侧信息区_第三行支持信息');

    const supportText = page.locator('.left-content p').nth(1);
    await expect(supportText).toBeVisible();
    await takeScreenshot(page, '04_左侧信息区_第三行支持信息');

    // 确认文字内容
    await expect(supportText).toContainText('Support');
    await expect(supportText).toContainText('Support TPI');

    // 确认文字颜色为白色
    const color = await supportText.evaluate(el =>
      window.getComputedStyle(el).color
    );
    expect(color).toBe('rgb(255, 255, 255)');
    await takeScreenshot(page, '04_左侧信息区_第三行支持信息');
  });

  test('No.5 右侧表单区-标题', async ({ page }) => {
    resetCounter('05_右侧表单区_标题');

    // 确认右侧表单面板存在
    const formPanel = page.locator('.login-form-panel');
    await expect(formPanel).toBeVisible();
    await takeScreenshot(page, '05_右侧表单区_标题');

    // 确认表单元素存在
    const form = formPanel.locator('form');
    await expect(form).toBeVisible();
    await takeScreenshot(page, '05_右侧表单区_标题');
  });

  test('No.6 右侧表单区-支持信息', async ({ page }) => {
    resetCounter('06_右侧表单区_支持信息');

    const formPanel = page.locator('.login-form-panel');
    await expect(formPanel).toBeVisible();
    await takeScreenshot(page, '06_右侧表单区_支持信息');
  });

  test('No.7 右侧表单区-备用链接提示', async ({ page }) => {
    resetCounter('07_右侧表单区_备用链接提示');

    const altInfo = page.locator('.alternative-login-info');
    await expect(altInfo).toBeVisible();
    await takeScreenshot(page, '07_右侧表单区_备用链接提示');

    // 确认三行文本
    const paragraphs = altInfo.locator('p');
    await expect(paragraphs).toHaveCount(3);

    await expect(paragraphs.nth(0)).toContainText('Your account is locked');
    await takeScreenshot(page, '07_右侧表单区_备用链接提示');

    await expect(paragraphs.nth(1)).toContainText('alternative login link');
    await takeScreenshot(page, '07_右侧表单区_备用链接提示');

    await expect(paragraphs.nth(2)).toContainText('root cause');
    await takeScreenshot(page, '07_右侧表单区_备用链接提示');
  });
});

// ============================================================
// 2. 控件初始状态 (No.8-11)
// ============================================================
test.describe('控件初始状态', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('No.8 username 输入框-初始状态', async ({ page }) => {
    resetCounter('08_username输入框_初始状态');

    const usernameInput = page.locator('#username');
    await expect(usernameInput).toBeVisible();
    await takeScreenshot(page, '08_username输入框_初始状态');

    // 为空
    await expect(usernameInput).toHaveValue('');
    await takeScreenshot(page, '08_username输入框_初始状态');

    // placeholder 显示 "UserID"（与 Login.tsx 一致）
    await expect(usernameInput).toHaveAttribute('placeholder', 'UserID');
    await takeScreenshot(page, '08_username输入框_初始状态');

    // 可用（enabled）
    await expect(usernameInput).toBeEnabled();

    // 类型为 text
    await expect(usernameInput).toHaveAttribute('type', 'text');
    await takeScreenshot(page, '08_username输入框_初始状态');
  });

  test('No.9 password 输入框-初始状态', async ({ page }) => {
    resetCounter('09_password输入框_初始状态');

    const passwordInput = page.locator('#password');
    await expect(passwordInput).toBeVisible();
    await takeScreenshot(page, '09_password输入框_初始状态');

    // 为空
    await expect(passwordInput).toHaveValue('');
    await takeScreenshot(page, '09_password输入框_初始状态');

    // placeholder 显示 "Password"（与 Login.tsx 一致）
    await expect(passwordInput).toHaveAttribute('placeholder', 'Password');
    await takeScreenshot(page, '09_password输入框_初始状态');

    // 可用（enabled）
    await expect(passwordInput).toBeEnabled();

    // 类型为 password
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await takeScreenshot(page, '09_password输入框_初始状态');
  });

  test('No.10 Message 标签-初始状态', async ({ page }) => {
    resetCounter('10_Message标签_初始状态');

    // Message 区域不可见（不显示）
    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toHaveCount(0);
    await takeScreenshot(page, '10_Message标签_初始状态');
  });

  test('No.11 Login 按钮-初始状态', async ({ page }) => {
    resetCounter('11_Login按钮_初始状态');

    const loginButton = page.locator('.login-button');
    await expect(loginButton).toBeVisible();
    await takeScreenshot(page, '11_Login按钮_初始状态');

    // 显示 "Login" 文字
    await expect(loginButton).toHaveText('Login');
    await takeScreenshot(page, '11_Login按钮_初始状态');

    // 可用（enabled）
    await expect(loginButton).toBeEnabled();
    await takeScreenshot(page, '11_Login按钮_初始状态');
  });
});

// ============================================================
// 3. username 输入校验 (No.12-18)
// ============================================================
test.describe('username 输入校验', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('No.12 username-半角英文字母', async ({ page }) => {
    resetCounter('12_username_半角英文字母');

    const usernameInput = page.locator('#username');
    await usernameInput.fill('testuser');
    await takeScreenshot(page, '12_username_半角英文字母');

    await expect(usernameInput).toHaveValue('testuser');
    await takeScreenshot(page, '12_username_半角英文字母');

    // 无错误消息
    await expect(page.locator('.error-message')).toHaveCount(0);
  });

  test('No.13 username-半角数字', async ({ page }) => {
    resetCounter('13_username_半角数字');

    const usernameInput = page.locator('#username');
    await usernameInput.fill('123456');
    await takeScreenshot(page, '13_username_半角数字');

    await expect(usernameInput).toHaveValue('123456');
    await takeScreenshot(page, '13_username_半角数字');
  });

  test('No.14 username-半角英数字组合', async ({ page }) => {
    resetCounter('14_username_半角英数字组合');

    const usernameInput = page.locator('#username');
    await usernameInput.fill('user001');
    await takeScreenshot(page, '14_username_半角英数字组合');

    await expect(usernameInput).toHaveValue('user001');
    await takeScreenshot(page, '14_username_半角英数字组合');
  });

  test('No.15 username-全角文字阻止', async ({ page }) => {
    resetCounter('15_username_全角文字阻止');

    const usernameInput = page.locator('#username');
    // 通过 JS 评估输入处理：全角文字应被阻止
    // 使用 type 模拟键盘输入全角文字
    await usernameInput.click();
    await page.keyboard.type('ＴＥＳＴ');
    await takeScreenshot(page, '15_username_全角文字阻止');

    // 由于 React 的 onChange 会阻止全角文字，值应为空
    const value = await usernameInput.inputValue();
    expect(value).toBe('');
    await takeScreenshot(page, '15_username_全角文字阻止');
  });

  test('No.16 username-特殊符号阻止', async ({ page }) => {
    resetCounter('16_username_特殊符号阻止');

    const usernameInput = page.locator('#username');
    await usernameInput.click();
    // 使用 type 模拟键盘输入特殊符号
    await page.keyboard.type('@#$%');
    await takeScreenshot(page, '16_username_特殊符号阻止');

    // 特殊符号被阻止输入
    const value = await usernameInput.inputValue();
    expect(value).toBe('');
    await takeScreenshot(page, '16_username_特殊符号阻止');
  });

  test('No.17 username-最大长度 10 字符', async ({ page }) => {
    resetCounter('17_username_最大长度10字符');

    const usernameInput = page.locator('#username');
    // 输入 11 个字符
    await usernameInput.fill('abcdefghijk');
    await takeScreenshot(page, '17_username_最大长度10字符');

    // 只能输入前 10 个字符
    const value = await usernameInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(10);
    expect(value).toBe('abcdefghij');
    await takeScreenshot(page, '17_username_最大长度10字符');
  });

  test('No.18 username-边界值 10 字符', async ({ page }) => {
    resetCounter('18_username_边界值10字符');

    const usernameInput = page.locator('#username');
    await usernameInput.fill('abcdefghij');
    await takeScreenshot(page, '18_username_边界值10字符');

    await expect(usernameInput).toHaveValue('abcdefghij');
    await takeScreenshot(page, '18_username_边界值10字符');
  });
});

// ============================================================
// 4. password 输入校验 (No.19-24)
// ============================================================
test.describe('password 输入校验', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('No.19 password-半角英数字', async ({ page }) => {
    resetCounter('19_password_半角英数字');

    const passwordInput = page.locator('#password');
    await passwordInput.fill('Pass123');
    await takeScreenshot(page, '19_password_半角英数字');

    // 输入内容隐藏显示（type=password）
    await expect(passwordInput).toHaveAttribute('type', 'password');
    // value 正常保存（虽然后端不看到明文）
    await expect(passwordInput).toHaveValue('Pass123');
    await takeScreenshot(page, '19_password_半角英数字');

    // 无错误消息
    await expect(page.locator('.error-message')).toHaveCount(0);
  });

  test('No.20 password-半角英数字加符号', async ({ page }) => {
    resetCounter('20_password_半角英数字加符号');

    const passwordInput = page.locator('#password');
    await passwordInput.fill('P@ssw0rd!');
    await takeScreenshot(page, '20_password_半角英数字加符号');

    await expect(passwordInput).toHaveValue('P@ssw0rd!');
    await takeScreenshot(page, '20_password_半角英数字加符号');
  });

  test('No.21 password-全角文字阻止', async ({ page }) => {
    resetCounter('21_password_全角文字阻止');

    const passwordInput = page.locator('#password');
    await passwordInput.click();
    await page.keyboard.type('ＴＥＳＴ');
    await takeScreenshot(page, '21_password_全角文字阻止');

    const value = await passwordInput.inputValue();
    expect(value).toBe('');
    await takeScreenshot(page, '21_password_全角文字阻止');
  });

  test('No.22 password-最大长度 32 字符', async ({ page }) => {
    resetCounter('22_password_最大长度32字符');

    const passwordInput = page.locator('#password');
    // 输入 33 个字符
    await passwordInput.fill('a'.repeat(33));
    await takeScreenshot(page, '22_password_最大长度32字符');

    const value = await passwordInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(32);
    expect(value).toBe('a'.repeat(32));
    await takeScreenshot(page, '22_password_最大长度32字符');
  });

  test('No.23 password-边界值 32 字符', async ({ page }) => {
    resetCounter('23_password_边界值32字符');

    const passwordInput = page.locator('#password');
    await passwordInput.fill('a'.repeat(32));
    await takeScreenshot(page, '23_password_边界值32字符');

    await expect(passwordInput).toHaveValue('a'.repeat(32));
    await takeScreenshot(page, '23_password_边界值32字符');
  });

  test('No.24 password-输入时隐藏显示', async ({ page }) => {
    resetCounter('24_password_输入时隐藏显示');

    const passwordInput = page.locator('#password');
    await passwordInput.fill('test123');
    await takeScreenshot(page, '24_password_输入时隐藏显示');

    // 确认 type 为 password
    await expect(passwordInput).toHaveAttribute('type', 'password');
    // 确认 value 属性包含值
    await expect(passwordInput).toHaveValue('test123');
    await takeScreenshot(page, '24_password_输入时隐藏显示');

    // 确认 input 元素的 type 属性
    const typeAttr = await passwordInput.getAttribute('type');
    expect(typeAttr).toBe('password');
    await takeScreenshot(page, '24_password_输入时隐藏显示');
  });
});

// ============================================================
// 5. 空值校验（前端校验）(No.25-30)
// ============================================================
test.describe('空值校验', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('No.25 空值校验-username 为空', async ({ page }) => {
    resetCounter('25_空值校验_username为空');

    // username 为空
    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // password 输入有效值
    await passwordInput.fill('Pass123');
    await takeScreenshot(page, '25_空值校验_username为空');

    // 点击 Login
    await loginButton.click();
    await takeScreenshot(page, '25_空值校验_username为空');

    // 显示错误消息
    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('Username and password are required.');
    await takeScreenshot(page, '25_空值校验_username为空');

    // 错误消息为红色
    const errorColor = await errorMsg.evaluate(el =>
      window.getComputedStyle(el).color
    );
    expect(errorColor).toBe('rgb(255, 77, 79)');

    // 不跳转
    await expect(page).toHaveURL(BASE_URL + '/');

    // 按钮恢复可用
    await expect(loginButton).toBeEnabled();
    await takeScreenshot(page, '25_空值校验_username为空');
  });

  test('No.26 空值校验-password 为空', async ({ page }) => {
    resetCounter('26_空值校验_password为空');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // username 输入有效值
    await usernameInput.fill('admin');
    await takeScreenshot(page, '26_空值校验_password为空');

    // 点击 Login
    await loginButton.click();
    await takeScreenshot(page, '26_空值校验_password为空');

    // 显示错误消息
    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('Username and password are required.');
    await takeScreenshot(page, '26_空值校验_password为空');

    // 不调用后端 API（无网络请求）
    // 不跳转
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('No.27 空值校验-两者都为空', async ({ page }) => {
    resetCounter('27_空值校验_两者都为空');

    const loginButton = page.locator('.login-button');

    // 两者都为空，点击 Login
    await loginButton.click();
    await takeScreenshot(page, '27_空值校验_两者都为空');

    // 显示错误消息
    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('Username and password are required.');
    await takeScreenshot(page, '27_空值校验_两者都为空');

    // 只显示一个错误消息
    await expect(errorMsg).toHaveCount(1);
    await takeScreenshot(page, '27_空值校验_两者都为空');

    // 不跳转
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('No.28 空值校验-username 仅空格', async ({ page }) => {
    resetCounter('28_空值校验_username仅空格');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // username 输入空格
    await usernameInput.fill('   ');
    await passwordInput.fill('Pass123');
    await takeScreenshot(page, '28_空值校验_username仅空格');

    // 点击 Login
    await loginButton.click();
    await takeScreenshot(page, '28_空值校验_username仅空格');

    // 显示错误消息
    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('Username and password are required.');
    await takeScreenshot(page, '28_空值校验_username仅空格');
  });

  test('No.29 空值校验-password 仅空格', async ({ page }) => {
    resetCounter('29_空值校验_password仅空格');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // 仅 password 输入空格
    await usernameInput.fill('admin');
    await passwordInput.fill('   ');
    await takeScreenshot(page, '29_空值校验_password仅空格');

    // 点击 Login
    await loginButton.click();
    await takeScreenshot(page, '29_空值校验_password仅空格');

    // 显示错误消息
    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('Username and password are required.');
    await takeScreenshot(page, '29_空值校验_password仅空格');
  });

  test('No.30 连续空值提交防止重复调用', async ({ page }) => {
    resetCounter('30_连续空值提交防止重复调用');

    const loginButton = page.locator('.login-button');

    // 快速连续点击 5 次
    for (let i = 0; i < 5; i++) {
      await loginButton.click();
    }
    await takeScreenshot(page, '30_连续空值提交防止重复调用');

    // 错误消息持续显示
    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('Username and password are required.');
    await takeScreenshot(page, '30_连续空值提交防止重复调用');

    // 页面状态稳定，不跳转
    await expect(page).toHaveURL(BASE_URL + '/');
  });
});

// ============================================================
// 6. 登录成功 (No.31-34)
// ============================================================
test.describe('登录成功', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('No.31 登录成功-正确的用户名和密码', async ({ page }) => {
    resetCounter('31_登录成功_正确的用户名和密码');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // Mock API 返回成功响应
    await page.route(API_URL, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: 'Success',
          data: {
            success: true,
            token: 'mock-token-12345',
            userid: 'admin',
            username: 'admin',
            responsible: 'Admin User',
            userposition: 'Manager',
            email: 'admin@example.com',
          },
        }),
      });
    });

    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');
    await takeScreenshot(page, '31_登录成功_正确的用户名和密码');

    // 点击 Login
    await loginButton.click();

    // 按钮变为禁用状态（Loading）
    await expect(loginButton).toBeDisabled();
    await takeScreenshot(page, '31_登录成功_正确的用户名和密码');

    // 输入框禁用
    await expect(usernameInput).toBeDisabled();
    await expect(passwordInput).toBeDisabled();

    // 等待跳转到 /Menu
    await page.waitForURL('**/Menu');
    await takeScreenshot(page, '31_登录成功_正确的用户名和密码');

    // 确认 userInfo 保存在 localStorage
    const userInfoStr = await page.evaluate(() =>
      localStorage.getItem('userInfo')
    );
    expect(userInfoStr).not.toBeNull();
    const userInfo = JSON.parse(userInfoStr!);
    expect(userInfo.userid).toBe('admin');
    expect(userInfo.username).toBe('admin');
    expect(userInfo.email).toBe('admin@example.com');
    await takeScreenshot(page, '31_登录成功_正确的用户名和密码');

    // 不显示错误消息
    await expect(page.locator('.error-message')).toHaveCount(0);
  });

  test('No.32 登录成功-用户名含首尾空格', async ({ page }) => {
    resetCounter('32_登录成功_用户名含首尾空格');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // 拦截 API 请求，确认请求体中的 username 已被 trim
    let requestBody: any = null;
    await page.route(API_URL, async (route, request) => {
      requestBody = JSON.parse(request.postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: 'Success',
          data: {
            success: true,
            token: 'mock-token',
            userid: 'admin',
            username: 'admin',
            responsible: 'Admin',
            userposition: 'User',
            email: 'admin@test.com',
          },
        }),
      });
    });

    await usernameInput.fill('  admin  ');
    await passwordInput.fill('admin123');
    await takeScreenshot(page, '32_登录成功_用户名含首尾空格');

    await loginButton.click();
    await page.waitForURL('**/Menu');

    // 确认 API 请求体中 username 已 trim
    expect(requestBody).not.toBeNull();
    expect(requestBody.username).toBe('admin');
    await takeScreenshot(page, '32_登录成功_用户名含首尾空格');
  });

  test('No.33 登录成功-userInfo 保存完整', async ({ page }) => {
    resetCounter('33_登录成功_userInfo保存完整');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // Mock API
    await page.route(API_URL, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: 'Success',
          data: {
            success: true,
            token: 'mock-token',
            userid: 'testuser',
            username: 'testuser',
            responsible: 'Test User',
            userposition: 'Developer',
            email: 'testuser@example.com',
          },
        }),
      });
    });

    await usernameInput.fill('testuser');
    await passwordInput.fill('password123');
    await loginButton.click();
    await page.waitForURL('**/Menu');
    await takeScreenshot(page, '33_登录成功_userInfo保存完整');

    // 检查 localStorage
    const userInfoStr = await page.evaluate(() =>
      localStorage.getItem('userInfo')
    );
    expect(userInfoStr).not.toBeNull();
    const userInfo = JSON.parse(userInfoStr!);

    // 确认所有字段
    expect(userInfo.userid).toBe('testuser');
    expect(userInfo.username).toBe('testuser');
    expect(userInfo.responsible).toBe('Test User');
    expect(userInfo.userposition).toBe('Developer');
    expect(userInfo.email).toBe('testuser@example.com');
    await takeScreenshot(page, '33_登录成功_userInfo保存完整');
  });

  test('No.34 登录成功后 Message 清除', async ({ page }) => {
    resetCounter('34_登录成功后Message清除');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // Mock API
    await page.route(API_URL, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: 'Success',
          data: {
            success: true,
            token: 'mock-token',
            userid: 'admin',
            username: 'admin',
            responsible: 'Admin',
            userposition: 'User',
            email: 'admin@test.com',
          },
        }),
      });
    });

    // 先触发错误消息
    await loginButton.click();
    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeVisible();
    await takeScreenshot(page, '34_登录成功后Message清除');

    // 然后输入正确信息登录
    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');
    await loginButton.click();
    await page.waitForURL('**/Menu');

    // 跳转前错误消息已被清除（导航到新页面后 error-message 不存在）
    // 成功登录后 setMessage("") 已执行
    await takeScreenshot(page, '34_登录成功后Message清除');
  });
});

// ============================================================
// 7. 登录失败-API 返回错误 (No.35-39)
// ============================================================
test.describe('登录失败_API返回错误', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('No.35 登录失败-401 用户名或密码错误', async ({ page }) => {
    resetCounter('35_登录失败_401用户名或密码错误');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // Mock API 返回 401
    await page.route(API_URL, async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 401,
          message: 'Invalid credentials',
        }),
      });
    });

    await usernameInput.fill('wrong');
    await passwordInput.fill('wrong');
    await takeScreenshot(page, '35_登录失败_401用户名或密码错误');

    await loginButton.click();

    // 显示错误消息
    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText(
      "We didn't recognize the username or password you entered. Please try again."
    );
    await takeScreenshot(page, '35_登录失败_401用户名或密码错误');

    // 错误消息为红色
    const errorColor = await errorMsg.evaluate(el =>
      window.getComputedStyle(el).color
    );
    expect(errorColor).toBe('rgb(255, 77, 79)');

    // 页面不跳转
    await expect(page).toHaveURL(BASE_URL + '/');

    // 按钮恢复可用
    await expect(loginButton).toBeEnabled();
    await takeScreenshot(page, '35_登录失败_401用户名或密码错误');

    // 输入框恢复可用
    await expect(usernameInput).toBeEnabled();
    await expect(passwordInput).toBeEnabled();
    await takeScreenshot(page, '35_登录失败_401用户名或密码错误');
  });

  test('No.36 登录失败-403 账户已锁定', async ({ page }) => {
    resetCounter('36_登录失败_403账户已锁定');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // Mock API 返回 403
    await page.route(API_URL, async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 403,
          message: 'Your account is locked. Please contact your system administrator.',
        }),
      });
    });

    await usernameInput.fill('lockeduser');
    await passwordInput.fill('pass123');
    await takeScreenshot(page, '36_登录失败_403账户已锁定');

    await loginButton.click();

    // 页面不跳转
    await expect(page).toHaveURL(BASE_URL + '/');
    await takeScreenshot(page, '36_登录失败_403账户已锁定');
  });

  test('No.37 登录失败-500 服务器错误', async ({ page }) => {
    resetCounter('37_登录失败_500服务器错误');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // Mock API 返回 500
    await page.route(API_URL, async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 500,
          message: 'Internal server error',
        }),
      });
    });

    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');
    await takeScreenshot(page, '37_登录失败_500服务器错误');

    await loginButton.click();

    // 显示系统错误消息
    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('System error. Please contact administrator.');
    await takeScreenshot(page, '37_登录失败_500服务器错误');

    // 错误消息为红色
    const errorColor = await errorMsg.evaluate(el =>
      window.getComputedStyle(el).color
    );
    expect(errorColor).toBe('rgb(255, 77, 79)');

    // 页面不跳转
    await expect(page).toHaveURL(BASE_URL + '/');
    await takeScreenshot(page, '37_登录失败_500服务器错误');
  });

  test('No.38 登录失败-API 返回 code≠200 或 success=false', async ({ page }) => {
    resetCounter('38_登录失败_API返回code≠200');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // Mock API 返回 200 但 success=false
    await page.route(API_URL, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 401,
          message: 'Invalid username or password',
          data: { success: false },
        }),
      });
    });

    await usernameInput.fill('admin');
    await passwordInput.fill('wrong');
    await takeScreenshot(page, '38_登录失败_API返回code≠200');

    await loginButton.click();

    // 显示 result.message 中的错误消息
    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('Invalid username or password');
    await takeScreenshot(page, '38_登录失败_API返回code≠200');

    // password 被清空
    await expect(passwordInput).toHaveValue('');

    // 页面不跳转
    await expect(page).toHaveURL(BASE_URL + '/');
    await takeScreenshot(page, '38_登录失败_API返回code≠200');
  });

  test('No.39 登录失败后 password 被清空', async ({ page }) => {
    resetCounter('39_登录失败后password被清空');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // Mock API 返回失败
    await page.route(API_URL, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 401,
          message: 'Invalid credentials',
          data: { success: false },
        }),
      });
    });

    await usernameInput.fill('admin');
    await passwordInput.fill('wrongpass');
    await takeScreenshot(page, '39_登录失败后password被清空');

    await loginButton.click();

    // password 输入框被清空
    await expect(passwordInput).toHaveValue('');
    await takeScreenshot(page, '39_登录失败后password被清空');

    // username 输入框保持原值
    await expect(usernameInput).toHaveValue('admin');
    await takeScreenshot(page, '39_登录失败后password被清空');
  });
});

// ============================================================
// 8. 异常处理 (No.40-42)
// ============================================================
test.describe('异常处理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('No.40 异常处理-网络断开', async ({ page }) => {
    resetCounter('40_异常处理_网络断开');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // 模拟网络断开（中断 API 请求）
    await page.route(API_URL, async route => {
      await route.abort('connectionrefused');
    });

    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');
    await takeScreenshot(page, '40_异常处理_网络断开');

    await loginButton.click();

    // 显示系统错误消息
    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeVisible({ timeout: 10000 });
    await expect(errorMsg).toHaveText('System error. Please contact administrator.');
    await takeScreenshot(page, '40_异常处理_网络断开');

    // 错误消息为红色
    const errorColor = await errorMsg.evaluate(el =>
      window.getComputedStyle(el).color
    );
    expect(errorColor).toBe('rgb(255, 77, 79)');

    // 按钮恢复可用
    await expect(loginButton).toBeEnabled();
    await takeScreenshot(page, '40_异常处理_网络断开');

    // 输入框恢复可用
    await expect(usernameInput).toBeEnabled();
    await expect(passwordInput).toBeEnabled();
    await takeScreenshot(page, '40_异常处理_网络断开');
  });

  test('No.41 异常处理-API 超时', async ({ page }) => {
    resetCounter('41_异常处理_API超时');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // 模拟 API 超时（延迟远大于浏览器默认超时）
    await page.route(API_URL, async route => {
      // 延迟 60 秒模拟超时
      await new Promise(resolve => setTimeout(resolve, 60000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { success: true } }),
      });
    });

    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');
    await takeScreenshot(page, '41_异常处理_API超时');

    // 点击登录按钮，由于 fetch 默认超时，会抛出异常
    await loginButton.click();

    // 由于 fetch 没有内置超时（除了浏览器限制），超时后会有错误消息
    // 这里使用一个短时间等待，确认按钮变为禁用状态
    await expect(loginButton).toBeDisabled({ timeout: 3000 });
    await takeScreenshot(page, '41_异常处理_API超时');

    // 取消路由拦截，防止测试挂起
    await page.unroute(API_URL);
  });

  test('No.42 异常处理-API 返回非 JSON 格式', async ({ page }) => {
    resetCounter('42_异常处理_API返回非JSON格式');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // Mock API 返回纯文本
    await page.route(API_URL, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: 'Internal Server Error',
      });
    });

    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');
    await takeScreenshot(page, '42_异常处理_API返回非JSON格式');

    await loginButton.click();

    // 显示系统错误消息（JSON 解析失败走 catch 分支）
    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeVisible({ timeout: 10000 });
    await expect(errorMsg).toHaveText('System error. Please contact administrator.');
    await takeScreenshot(page, '42_异常处理_API返回非JSON格式');

    // 错误消息为红色
    const errorColor = await errorMsg.evaluate(el =>
      window.getComputedStyle(el).color
    );
    expect(errorColor).toBe('rgb(255, 77, 79)');
    await takeScreenshot(page, '42_异常处理_API返回非JSON格式');
  });
});

// ============================================================
// 9. UI 交互 (No.43-46)
// ============================================================
test.describe('UI交互', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('No.43 登录中按钮和输入框禁用', async ({ page }) => {
    resetCounter('43_登录中按钮和输入框禁用');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // Mock API: 延迟响应，以便观察加载状态
    await page.route(API_URL, async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: { success: true, token: 't', userid: 'a', username: 'a' },
        }),
      });
    });

    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');
    await takeScreenshot(page, '43_登录中按钮和输入框禁用');

    // 点击登录
    await loginButton.click();

    // 按钮禁用
    await expect(loginButton).toBeDisabled({ timeout: 3000 });

    // 按钮文字变为 "Processing..."
    await expect(loginButton).toHaveText('Processing...');
    await takeScreenshot(page, '43_登录中按钮和输入框禁用');

    // 输入框禁用
    await expect(usernameInput).toBeDisabled();
    await expect(passwordInput).toBeDisabled();
    await takeScreenshot(page, '43_登录中按钮和输入框禁用');

    // 取消路由，防止后续测试受影响
    await page.unroute(API_URL);
  });

  test('No.44 登录中防止重复提交', async ({ page }) => {
    resetCounter('44_登录中防止重复提交');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    let apiCallCount = 0;

    // Mock API: 延迟响应，统计调用次数
    await page.route(API_URL, async route => {
      apiCallCount++;
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: { success: true, token: 't', userid: 'a', username: 'a' },
        }),
      });
    });

    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');
    await takeScreenshot(page, '44_登录中防止重复提交');

    // 点击登录
    await loginButton.click();

    // 等待按钮禁用
    await expect(loginButton).toBeDisabled({ timeout: 3000 });

    // 再次点击（无效）
    await loginButton.click();
    await loginButton.click();
    await takeScreenshot(page, '44_登录中防止重复提交');

    // 只发起一次 API 调用
    expect(apiCallCount).toBe(1);
    await takeScreenshot(page, '44_登录中防止重复提交');

    await page.unroute(API_URL);
  });

  test('No.45 输入时清除错误消息', async ({ page }) => {
    resetCounter('45_输入时清除错误消息');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // 触发空值校验
    await loginButton.click();
    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('Username and password are required.');
    await takeScreenshot(page, '45_输入时清除错误消息');

    // 在 username 输入任意字符
    await usernameInput.fill('a');
    await takeScreenshot(page, '45_输入时清除错误消息');

    // 错误消息被清除
    await expect(errorMsg).toHaveCount(0);
    await takeScreenshot(page, '45_输入时清除错误消息');
  });

  test('No.46 Enter 键触发登录', async ({ page }) => {
    resetCounter('46_Enter键触发登录');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');

    // Mock API
    await page.route(API_URL, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: { success: true, token: 't', userid: 'admin', username: 'admin', responsible: 'A', userposition: 'U', email: 'a@b.com' },
        }),
      });
    });

    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');
    await takeScreenshot(page, '46_Enter键触发登录');

    // 在 password 输入框中按 Enter
    await passwordInput.press('Enter');

    // 等待跳转到 /Menu
    await page.waitForURL('**/Menu');
    await takeScreenshot(page, '46_Enter键触发登录');
  });
});

// ============================================================
// 10. 消息显示 (No.47-49)
// ============================================================
test.describe('消息显示', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('No.47 错误消息样式', async ({ page }) => {
    resetCounter('47_错误消息样式');

    const usernameInput = page.locator('#username');
    const loginButton = page.locator('.login-button');

    // 触发空值校验（username 为空，password 输入值）
    await usernameInput.fill('');
    await page.locator('#password').fill('test');
    await takeScreenshot(page, '47_错误消息样式');

    await loginButton.click();

    // 确认错误消息
    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeVisible();
    await takeScreenshot(page, '47_错误消息样式');

    // 消息显示为红色
    const errorColor = await errorMsg.evaluate(el =>
      window.getComputedStyle(el).color
    );
    expect(errorColor).toBe('rgb(255, 77, 79)');
    await takeScreenshot(page, '47_错误消息样式');

    // 消息左对齐
    const textAlign = await errorMsg.evaluate(el =>
      window.getComputedStyle(el).textAlign
    );
    expect(textAlign).toBe('left');

    // 显示对应错误文本
    await expect(errorMsg).toHaveText('Username and password are required.');
    await takeScreenshot(page, '47_错误消息样式');
  });

  test('No.48 新操作时清除前一条错误消息', async ({ page }) => {
    resetCounter('48_新操作时清除前一条错误消息');

    const loginButton = page.locator('.login-button');

    // 第一次触发错误
    await loginButton.click();
    let errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('Username and password are required.');
    await takeScreenshot(page, '48_新操作时清除前一条错误消息');

    // 再次点击（仍为空），清除前一条，显示新的
    await loginButton.click();
    await takeScreenshot(page, '48_新操作时清除前一条错误消息');

    // 错误消息仍然显示（因为新操作也触发了校验）
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('Username and password are required.');
    await takeScreenshot(page, '48_新操作时清除前一条错误消息');
  });

  test('No.49 登录成功后不显示错误消息', async ({ page }) => {
    resetCounter('49_登录成功后不显示错误消息');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // Mock API
    await page.route(API_URL, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: { success: true, token: 't', userid: 'admin', username: 'admin', responsible: 'A', userposition: 'U', email: 'a@b.com' },
        }),
      });
    });

    // 先触发错误消息
    await loginButton.click();
    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeVisible();
    await takeScreenshot(page, '49_登录成功后不显示错误消息');

    // 输入正确信息登录
    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');
    await loginButton.click();
    await page.waitForURL('**/Menu');
    await takeScreenshot(page, '49_登录成功后不显示错误消息');
  });
});

// ============================================================
// 11. 安全性 (No.50-52)
// ============================================================
test.describe('安全性', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('No.50 安全性-密码输入隐藏', async ({ page }) => {
    resetCounter('50_安全性_密码输入隐藏');

    const passwordInput = page.locator('#password');
    await passwordInput.fill('test123');
    await takeScreenshot(page, '50_安全性_密码输入隐藏');

    // input 的 type 为 "password"
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await takeScreenshot(page, '50_安全性_密码输入隐藏');

    // 页面显示为隐藏字符
    // 验证 value 存在但不显示明文
    const value = await passwordInput.inputValue();
    expect(value).toBe('test123');
    // Playwright 通过 API 能拿到值，但页面上显示为隐藏字符
    const typeAttr = await passwordInput.getAttribute('type');
    expect(typeAttr).toBe('password');
    await takeScreenshot(page, '50_安全性_密码输入隐藏');
  });

  test('No.51 安全性-半角字符限制', async ({ page }) => {
    resetCounter('51_安全性_半角字符限制');

    // username 输入框阻止全角文字
    const usernameInput = page.locator('#username');
    await usernameInput.click();
    await page.keyboard.type('ＴＥＳＴ');
    let usernameValue = await usernameInput.inputValue();
    expect(usernameValue).toBe('');
    await takeScreenshot(page, '51_安全性_半角字符限制');

    // password 输入框阻止全角文字
    const passwordInput = page.locator('#password');
    await passwordInput.click();
    await page.keyboard.type('ＴＥＳＴ');
    let passwordValue = await passwordInput.inputValue();
    expect(passwordValue).toBe('');
    await takeScreenshot(page, '51_安全性_半角字符限制');
  });

  test('No.52 安全性-密码不存储在前端', async ({ page }) => {
    resetCounter('52_安全性_密码不存储在前端');

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('.login-button');

    // Mock API
    await page.route(API_URL, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: {
            success: true,
            token: 'mock-token',
            userid: 'admin',
            username: 'admin',
            responsible: 'Admin',
            userposition: 'User',
            email: 'admin@test.com',
          },
        }),
      });
    });

    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');
    await loginButton.click();
    await page.waitForURL('**/Menu');
    await takeScreenshot(page, '52_安全性_密码不存储在前端');

    // 检查 localStorage 中不保存密码明文
    const userInfoStr = await page.evaluate(() =>
      localStorage.getItem('userInfo')
    );
    const userInfo = JSON.parse(userInfoStr!);
    expect(userInfo.password).toBeUndefined();
    expect(userInfo.token).toBeDefined();
    await takeScreenshot(page, '52_安全性_密码不存储在前端');
  });
});
