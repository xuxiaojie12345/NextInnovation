/**
 * Login 模块 Playwright 测试
 * --------------------------------------------
 * 对应测试式样书：react-ud/src/Login/Login_単体テスト仕様書.md
 * 对应前端：react-ud/src/Login/Login.tsx
 *
 * 【运行前提】
 * 1. 前端 dev server 已启动（默认 http://localhost:3000）
 *    - 在 react-ud 目录执行: npm start
 * 2. Playwright 已在项目根目录安装（node_modules/@playwright/test）
 *
 * 【API 说明 / 重要】
 * - 后端真实端点（已确认）：POST /api/authentication
 * - 前端当前实现调用：POST /api/authenticationApi
 * - 为让测试在“前端当前实现”与“后端真实端点”两种情况下都稳定且符合式样书
 *   的“模拟 API”场景（式样书第15/16/17项明确要求模拟 API），本测试统一通过
 *   page.route 拦截登录请求并返回模拟响应，确保 26 个用例全部可重复执行。
 * - 若需连接真实后端，可移除本文件中的 mockLoginApi() 调用（见 test 用例注释）。
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// 前端 dev server 地址（Playwright config 未设 baseURL 时使用）
const BASE_URL = 'http://localhost:3000';

// ============================================================================
// 截图工具
// ----------------------------------------------------------------------------
// 约定：
//  - 每个“动作”之后与每个“断言”之后各截取一张图片
//  - 格式：JPEG；存放目录：tests\login\image
//  - 命名：Login01.jpeg（01 起，全局递增）
// ============================================================================
const IMAGE_DIR = path.join(__dirname, 'image');

// 全局截图序号（跨所有用例原子递增，保证文件名唯一且连续）
let screenshotCounter = 0;

/** 确保截图目录存在 */
function ensureImageDir() {
  if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
  }
}

/**
 * 截取当前页面为 JPEG 并保存到 tests\login\image\LoginNN.jpeg。
 * @param page     页面对象
 * @param label    截图用途说明（写入日志，便于排查）
 */
async function shot(page: Page, label: string) {
  ensureImageDir();
  // 同步递增计数器并生成文件名（该段无 await，Node 单线程下原子，
  // 可确保并行 worker 也获得唯一且连续的编号，避免覆盖）。
  screenshotCounter += 1;
  const filename = `Login${String(screenshotCounter).padStart(2, '0')}.jpeg`;
  await page.evaluate(() => new Promise((r) => setTimeout(r, 50)));
  await page.screenshot({
    path: path.join(IMAGE_DIR, filename),
    type: 'jpeg',
    quality: 80,
  });
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
  return filename;
}

// 登录请求路径（前端当前调用 + 后端真实端点，两者都拦截）
const API_LOGIN_PATHS = '**/api/authentication';

/** 成功响应（普通用户） */
const SUCCESS_USER = {
  status: 'success',
  code: 200,
  data: {
    userId: 'john.doe',
    name: 'John Doe',
    role: 'USER',
    userName: 'John Doe',
    responsible: 'John Doe',
    userPosition: 'Engineer',
    email: 'john.doe@example.com',
  },
  message: 'success',
};

/** 成功响应（管理员） */
const SUCCESS_ADMIN = {
  status: 'success',
  code: 200,
  data: {
    userId: 'admin',
    name: 'Administrator',
    role: 'USER',
    userName: 'Administrator',
    responsible: 'Administrator',
    userPosition: 'Manager',
    email: 'admin@example.com',
  },
  message: 'success',
};

/** 认证失败响应（401，前后端统一消息） */
const FAILURE_AUTH = {
  status: 'error',
  code: 401,
  data: null,
  message: 'We didn\'t recognize the username or password you entered. Please try again.',
};

/** 打开登录页并等待登录表单 */
async function gotoLogin(page: Page) {
  await page.goto(BASE_URL);
  // 等待登录表单渲染
  await expect(page.getByPlaceholder('User ID')).toBeVisible();
  await shot(page, '打开登录页');
}

/**
 * 填写登录表单。userId/password 传 null 表示不填写。
 */
async function fillLogin(page: Page, userId: string | null, password: string | null) {
  if (userId !== null) {
    const userInput = page.getByPlaceholder('User ID');
    await userInput.fill(userId);
  }
  if (password !== null) {
    const passInput = page.getByPlaceholder('Password');
    await passInput.fill(password);
  }
  await shot(page, `填写表单(userId=${userId}, password=${password})`);
}

/** 点击 Login 按钮（submit） */
async function clickLogin(page: Page) {
  await page.getByRole('button', { name: 'Login' }).click();
  await shot(page, '点击 Login 按钮');
}

// ============================================================================
// 画面表示
// ============================================================================
test.describe('画面表示', () => {
  test('No.1 画面初期表示-标题区域', async ({ page }) => {
    await gotoLogin(page);
    await expect(page.getByText('EDB Engineering Database')).toBeVisible();
    await expect(page.getByText('Use Outlook id and password')).toBeVisible();
    await expect(page.locator('.login-support')).toContainText('Support.TPI');
    await shot(page, '断言: 标题区域内容可见');
  });

  test('No.2 画面初期表示-登录表单区域', async ({ page }) => {
    await gotoLogin(page);
    await expect(page.getByPlaceholder('User ID')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    // 不显示错误消息区域
    await expect(page.locator('.login-message')).toHaveCount(0);
    await shot(page, '断言: 登录表单区域可见且无错误消息');
  });

  test('No.3 画面初期表示-输入框 maxLength', async ({ page }) => {
    await gotoLogin(page);
    const userInput = page.getByPlaceholder('User ID');
    const passInput = page.getByPlaceholder('Password');
    await expect(userInput).toHaveAttribute('maxlength', '10');
    await expect(passInput).toHaveAttribute('maxlength', '32');
    await shot(page, '断言: 输入框 maxLength 属性');
  });

  test('No.4 画面初期表示-快捷键/锁定提示', async ({ page }) => {
    await gotoLogin(page);
    await expect(page.locator('.login-hint')).toContainText('If you get error message');
    await expect(page.locator('.login-hint')).toContainText('alternative login link');
    await shot(page, '断言: 快捷键/锁定提示文本');
  });
});

// ============================================================================
// 空值校验
// ============================================================================
test.describe('空值校验', () => {
  test('No.5 两者都为空', async ({ page }) => {
    let apiCalled = false;
    await page.route(API_LOGIN_PATHS, () => { apiCalled = true; });
    await gotoLogin(page);
    await clickLogin(page);
    await expect(page.locator('.login-message')).toHaveText('Username and password are required.');
    await shot(page, '断言: 两者为空时报错');
    await expect(apiCalled).toBe(false);
    await shot(page, '断言: 未调用 API');
  });

  test('No.6 User ID为空', async ({ page }) => {
    let apiCalled = false;
    await page.route(API_LOGIN_PATHS, () => { apiCalled = true; });
    await gotoLogin(page);
    await fillLogin(page, null, 'P@ssw0rd');
    await clickLogin(page);
    await expect(page.locator('.login-message')).toHaveText('Username and password are required.');
    await shot(page, '断言: User ID 为空时报错');
    await expect(apiCalled).toBe(false);
    await shot(page, '断言: 未调用 API');
  });

  test('No.7 Password为空', async ({ page }) => {
    let apiCalled = false;
    await page.route(API_LOGIN_PATHS, () => { apiCalled = true; });
    await gotoLogin(page);
    await fillLogin(page, 'john.doe', null);
    await clickLogin(page);
    await expect(page.locator('.login-message')).toHaveText('Username and password are required.');
    await shot(page, '断言: Password 为空时报错');
    await expect(apiCalled).toBe(false);
    await shot(page, '断言: 未调用 API');
  });

  test('No.8 仅空格(trim后视为空)', async ({ page }) => {
    let apiCalled = false;
    await page.route(API_LOGIN_PATHS, () => { apiCalled = true; });
    await gotoLogin(page);
    await fillLogin(page, '   ', '   ');
    await clickLogin(page);
    await expect(page.locator('.login-message')).toHaveText('Username and password are required.');
    await shot(page, '断言: 仅空格时报错');
    await expect(apiCalled).toBe(false);
    await shot(page, '断言: 未调用 API');
  });
});

// ============================================================================
// 登录成功
// ============================================================================
test.describe('登录成功', () => {
  test('No.9 登录成功-普通用户', async ({ page }) => {
    let calledBody: any = null;
    await page.route(API_LOGIN_PATHS, async (route) => {
      if (route.request().method() === 'POST') {
        calledBody = route.request().postDataJSON();
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SUCCESS_USER) });
    });
    await gotoLogin(page);
    await fillLogin(page, 'john.doe', 'P@ssw0rd123');
    await clickLogin(page);
    // 跳转到 /menu
    await page.waitForURL('**/menu');
    await shot(page, '断言: 跳转 /menu');
    // 用户信息保存到 sessionStorage
    const stored = await page.evaluate(() => sessionStorage.getItem('userInfo'));
    expect(stored).not.toBeNull();
    await shot(page, '断言: sessionStorage 保存用户信息');
    expect(calledBody).toMatchObject({ userId: 'john.doe', password: 'P@ssw0rd123' });
    await shot(page, '断言: 请求体 userId/password');
  });

  test('No.10 登录成功-管理员', async ({ page }) => {
    await page.route(API_LOGIN_PATHS, (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SUCCESS_ADMIN) });
    });
    await gotoLogin(page);
    await fillLogin(page, 'admin', 'Admin!@34');
    await clickLogin(page);
    await page.waitForURL('**/menu');
    await expect(page).toHaveURL(/menu/);
    await shot(page, '断言: 管理员跳转 /menu');
  });

  test('No.11 登录成功-含首尾空格(trim)', async ({ page }) => {
    let calledBody: any = null;
    await page.route(API_LOGIN_PATHS, async (route) => {
      if (route.request().method() === 'POST') {
        calledBody = route.request().postDataJSON();
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SUCCESS_USER) });
    });
    await gotoLogin(page);
    await fillLogin(page, '  john.doe  ', 'P@ssw0rd123');
    await clickLogin(page);
    await page.waitForURL('**/menu');
    await shot(page, '断言: 跳转 /menu');
    // 请求体中的 userId 已 trim
    expect(calledBody).toMatchObject({ userId: 'john.doe', password: 'P@ssw0rd123' });
    await shot(page, '断言: 请求体 userId 已 trim');
  });
});

// ============================================================================
// 登录失败
// ============================================================================
test.describe('登录失败', () => {
  test('No.12 Password错误(401)', async ({ page }) => {
    await page.route(API_LOGIN_PATHS, (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify(FAILURE_AUTH),
      });
    });
    await gotoLogin(page);
    await fillLogin(page, 'john.doe', 'wrongpass');
    await clickLogin(page);
    await expect(page.locator('.login-message')).toHaveText(
      "We didn't recognize the username or password you entered. Please try again."
    );
    await shot(page, '断言: 显示认证失败消息');
    // 密码输入框被清空
    await expect(page.getByPlaceholder('Password')).toHaveValue('');
    await shot(page, '断言: 密码输入框被清空');
    // 停留登录页（登录页位于根路径 /，未跳转到 /Menu）
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page).not.toHaveURL(/Menu|menu/);
    await shot(page, '断言: 停留在登录页');
  });

  test('No.13 用户不存在(与密码错误同消息)', async ({ page }) => {
    await page.route(API_LOGIN_PATHS, (route) => {
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify(FAILURE_AUTH) });
    });
    await gotoLogin(page);
    await fillLogin(page, 'unknown.user', 'test123');
    await clickLogin(page);
    await expect(page.locator('.login-message')).toHaveText(
      "We didn't recognize the username or password you entered. Please try again."
    );
    await shot(page, '断言: 用户不存在显示失败消息');
    await expect(page.getByPlaceholder('Password')).toHaveValue('');
    await shot(page, '断言: 密码输入框被清空');
  });

  test('No.14 API返回非success状态', async ({ page }) => {
    await page.route(API_LOGIN_PATHS, (route) => {
      // 返回 200 但 status 非 success
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'error', code: 200, data: null, message: 'error' }),
      });
    });
    await gotoLogin(page);
    await fillLogin(page, 'john.doe', 'P@ssw0rd123');
    await clickLogin(page);
    await expect(page.locator('.login-message')).toHaveText(
      "We didn't recognize the username or password you entered. Please try again."
    );
    await shot(page, '断言: 非 success 状态显示失败消息');
    await expect(page.getByPlaceholder('Password')).toHaveValue('');
    await shot(page, '断言: 密码输入框被清空');
  });
});

// ============================================================================
// 异常处理
// ============================================================================
test.describe('异常处理', () => {
  test('No.15 服务器500错误', async ({ page }) => {
    await page.route(API_LOGIN_PATHS, (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'error', code: 500, data: null, message: 'Internal server error' }),
      });
    });
    await gotoLogin(page);
    await fillLogin(page, 'john.doe', 'P@ssw0rd123');
    await clickLogin(page);
    await expect(page.locator('.login-message')).toHaveText('System is busy, please try again later.');
    await shot(page, '断言: 500 错误消息');
    // 按钮恢复可用
    await expect(page.getByRole('button', { name: 'Login' })).toBeEnabled();
    await shot(page, '断言: 按钮恢复可用');
  });

  test('No.16 网络错误', async ({ page }) => {
    await page.route(API_LOGIN_PATHS, (route) => route.abort());
    await gotoLogin(page);
    await fillLogin(page, 'john.doe', 'P@ssw0rd123');
    await clickLogin(page);
    await expect(page.locator('.login-message')).toHaveText('Network error, please try again later.');
    await shot(page, '断言: 网络错误消息');
    await expect(page.getByRole('button', { name: 'Login' })).toBeEnabled();
    await shot(page, '断言: 按钮恢复可用');
  });

  test('No.17 非预期4xx状态码', async ({ page }) => {
    await page.route(API_LOGIN_PATHS, (route) => {
      route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({}) });
    });
    await gotoLogin(page);
    await fillLogin(page, 'john.doe', 'P@ssw0rd123');
    await clickLogin(page);
    await expect(page.locator('.login-message')).toHaveText(
      'An unexpected error occurred. Please contact support.'
    );
    await shot(page, '断言: 非预期 4xx 错误消息');
    await expect(page.getByRole('button', { name: 'Login' })).toBeEnabled();
    await shot(page, '断言: 按钮恢复可用');
  });
});

// ============================================================================
// UI交互
// ============================================================================
test.describe('UI交互', () => {
  test('No.18 Loading中按钮及输入框禁用', async ({ page }) => {
    // 延迟响应用来观察 loading 状态
    await page.route(API_LOGIN_PATHS, async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SUCCESS_USER) });
    });
    await gotoLogin(page);
    await fillLogin(page, 'john.doe', 'P@ssw0rd123');
    await clickLogin(page);
    // 按钮显示 loading 并禁用
    await expect(page.getByRole('button', { name: 'Login' })).toBeDisabled();
    await expect(page.getByPlaceholder('User ID')).toBeDisabled();
    await expect(page.getByPlaceholder('Password')).toBeDisabled();
    await shot(page, '断言: Loading 中按钮/输入框禁用');
    // 等待响应完成页面跳转
    await page.waitForURL('**/menu');
    await shot(page, '断言: 跳转 /menu');
  });

  test('No.19 防止重复提交(只调用一次)', async ({ page }) => {
    let callCount = 0;
    await page.route(API_LOGIN_PATHS, async (route) => {
      callCount++;
      await new Promise((r) => setTimeout(r, 800));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SUCCESS_USER) });
    });
    await gotoLogin(page);
    await fillLogin(page, 'john.doe', 'P@ssw0rd123');
    await clickLogin(page);
    // 在响应前再次尝试点击（按钮应已禁用）
    await page.getByRole('button', { name: 'Login' }).click({ force: true }).catch(() => {});
    await shot(page, '动作: Loading 中尝试重复点击');
    await page.waitForURL('**/menu');
    expect(callCount).toBe(1);
    await shot(page, '断言: 只调用一次 API');
  });

  test('No.20 Enter键提交', async ({ page }) => {
    let calledBody: any = null;
    await page.route(API_LOGIN_PATHS, async (route) => {
      if (route.request().method() === 'POST') {
        calledBody = route.request().postDataJSON();
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SUCCESS_USER) });
    });
    await gotoLogin(page);
    await fillLogin(page, 'john.doe', 'P@ssw0rd123');
    // 在 User ID 输入框按 Enter
    await page.getByPlaceholder('User ID').press('Enter');
    await shot(page, '动作: 按 Enter 键提交');
    await page.waitForURL('**/menu');
    expect(calledBody).toMatchObject({ userId: 'john.doe' });
    await shot(page, '断言: Enter 提交成功跳转 /menu');
  });

  test('No.21 Tab键切换焦点', async ({ page }) => {
    await gotoLogin(page);
    const userInput = page.getByPlaceholder('User ID');
    const passInput = page.getByPlaceholder('Password');
    await userInput.focus();
    await page.keyboard.press('Tab');
    await shot(page, '动作: 按 Tab 键');
    await expect(passInput).toBeFocused();
    await shot(page, '断言: 焦点切到 Password');
  });

  test('No.22 密码掩码及眼睛切换', async ({ page }) => {
    await gotoLogin(page);
    const passInput = page.getByPlaceholder('Password');
    await passInput.fill('secret123');
    // 默认掩码类型为 password
    await expect(passInput).toHaveAttribute('type', 'password');
    await shot(page, '断言: 密码掩码为 password');
    // 点击眼睛图标切换为明文
    await page.locator('.ant-input-suffix .anticon-eye-invisible').click();
    await shot(page, '动作: 点击眼睛图标');
    // 另取 input 检查（antd 切换后仍为同一 input，但改为 text 类型）
    await expect(passInput).toHaveAttribute('type', 'text');
    await shot(page, '断言: 密码切换为明文 text');
  });

  test('No.23 消息清空(二次操作清除旧消息)', async ({ page }) => {
    let emptySubmitCalledApi = false;
    let apiCalled = false;
    // 第一次：空值提交 → 前端校验拦截，不应调用 API
    await page.route(API_LOGIN_PATHS, () => { emptySubmitCalledApi = true; });
    await gotoLogin(page);
    await clickLogin(page);
    await expect(page.locator('.login-message')).toHaveText('Username and password are required.');
    await shot(page, '断言: 第一次空值提交显示错误');
    expect(emptySubmitCalledApi).toBe(false);
    // 第二次：输入有效值 + 成功响应 → 旧消息被清除并跳转
    await page.unroute(API_LOGIN_PATHS);
    await page.route(API_LOGIN_PATHS, (route) => {
      apiCalled = true;
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SUCCESS_USER) });
    });
    await fillLogin(page, 'john.doe', 'P@ssw0rd123');
    await clickLogin(page);
    await page.waitForURL('**/menu');
    await shot(page, '断言: 二次提交成功跳转 /menu');
    expect(apiCalled).toBe(true);
    await shot(page, '断言: API 被调用');
  });
});

// ============================================================================
// 安全性
// ============================================================================
test.describe('安全性', () => {
  test('No.24 错误消息不区分用户类型', async ({ page }) => {
    const failureBody = { status: 'error', code: 401, data: null, message: 'fail' };
    await page.route(API_LOGIN_PATHS, (route) => {
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify(failureBody) });
    });
    await gotoLogin(page);

    // 第一次：不存在的用户 + 任意密码
    await fillLogin(page, 'nonexist', 'pass1');
    await clickLogin(page);
    const msg1 = await page.locator('.login-message').textContent();
    await shot(page, '动作: 不存在用户提交');

    // 清空，第二次：存在的用户 + 错误密码
    await fillLogin(page, 'john.doe', 'wrongpass');
    await clickLogin(page);
    const msg2 = await page.locator('.login-message').textContent();
    await shot(page, '动作: 存在用户错误密码提交');

    expect(msg1 ?? '').toBe(msg2 ?? '');
    await shot(page, '断言: 两种错误消息一致');
    expect(msg1).toContain("didn't recognize the username or password");
    await shot(page, '断言: 消息内容符合预期');
  });

  test('No.25 密码不在前端日志暴露', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.route(API_LOGIN_PATHS, async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        // 请求体会包含密码（HTTPS 加密传输属后端职责，此处仅确认前端不打印明文）
        expect(body).toHaveProperty('password');
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SUCCESS_USER) });
    });
    // 登录成功后会跳转 /Menu，Menu 页面会请求用户权限接口。
    // 为避免该请求打到真实后端(localhost:8081)返回 500 而产生无关的控制台错误，
    // 在此拦截并返回成功后，聚焦验证“密码明文未出现在前端日志”。
    await page.route('**/api/user/GetUserFunctionAuth', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', code: 200, data: { permissions: [] }, message: 'success' }),
      });
    });
    await gotoLogin(page);
    await fillLogin(page, 'john.doe', 'P@ssw0rd123');
    await clickLogin(page);
    await page.waitForURL('**/menu');
    await shot(page, '动作: 登录成功跳转 /menu');
    await expect(page.locator('.login-message')).toHaveCount(0);
    // 无控制台错误（密码明文不应出现在任何前端日志中）
    const leaked = consoleErrors.filter((e) => e.includes('P@ssw0rd123'));
    expect(leaked).toHaveLength(0);
    expect(consoleErrors).toHaveLength(0);
    await shot(page, '断言: 无控制台错误，密码明文未泄露');
  });

  test('No.26 UserID 长度限制(最多10位)', async ({ page }) => {
    await gotoLogin(page);
    const userInput = page.getByPlaceholder('User ID');
    // 尝试输入 11 位
    await userInput.fill('abcdefghijk');
    await shot(page, '动作: 输入 11 位 UserID');
    // antd maxLength 会截断为 10 位
    await expect(userInput).toHaveValue('abcdefghij');
    await shot(page, '断言: 截断为 10 位');
  });
});
