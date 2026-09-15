/**
 * UD01_playwright.spec.ts
 * ---------------------------------------------------------------
 * Login 模块（UD01）Playwright 自动化测试
 *
 * 测试式样书：プロンプトUD01_単体テスト仕様書.md
 * 参照画面　：src/Login/Login.tsx
 *
 * 说明：
 * - 每个测试对象（测试观点）对应一个 test 用例；
 * - 每执行一步（操作 / 确认）都会以 JPEG 截图保存；
 * - 截图以「测试观点名称为单元」从 001 开始循环命名；
 *   保存位置：src/Test/UD01/screenshots/<观点名称>/<观点名称>_001.jpeg ...
 * - 元素定位与 Login.tsx 保持一致（#userID / #password / .error-message / button.login-button）；
 * - API 场景通过 page.route 拦截 /api/Login/Authentication 模拟，保证不依赖真实后端、结果确定。
 *
 * 运行前提：
 *   1. 启动前端：npm start（默认 http://localhost:3000）
 *   2. 安装并运行：
 *      npx playwright test UD01/UD01_playwright.spec.ts
 *   可用环境变量 BASE_URL 覆盖被测地址（默认 http://localhost:3000）。
 */
import { test, expect, Page, TestInfo } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/** 被测应用地址（默认本地前端 3000，可用 BASE_URL 覆盖） */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/** 与 Login.tsx 保持一致的元素定位器 */
const SEL = {
  /** UserID 输入框（id=userID） */
  userID: '#userID',
  /** Password 输入框（id=password，type=password） */
  password: '#password',
  /** Login 按钮（type=submit） */
  loginButton: 'button.login-button',
  /** 错误消息区域（仅 message 非空时渲染） */
  message: '.error-message',
};

/** API 端点（Login.tsx authenticationApi 调用） */
const AUTH_API = '**/api/Login/Authentication';
/** Menu 加载时 DocumentType 下拉 API（避免成功跳转后产生噪音错误） */
const DOC_TYPE_API = '**/api/GenerateDocument/UD03SelectHdocdocumentlist';

/** 去除文件名非法字符，得到安全目录/文件名 */
function sanitize(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').trim();
}

/**
 * 创建截图器：以「测试观点名称」为单位，从 001 开始循环命名并保存 JPEG。
 * @param testInfo Playwright TestInfo（用于取观点名称）
 */
function createScreenshotter(testInfo: TestInfo) {
  const unit = sanitize(testInfo.title);
  const dir = path.join(__dirname, 'screenshots', unit);
  fs.mkdirSync(dir, { recursive: true });
  let counter = 0;
  return async function shot(page: Page) {
    counter += 1;
    const file = path.join(
      dir,
      `${unit}_${String(counter).padStart(3, '0')}.jpeg`,
    );
    await page.screenshot({ path: file, type: 'jpeg', quality: 80 });
  };
}

/** 断言错误消息为红色系（Login.css：.error-message color #d63333 → rgb(214,51,51)） */
async function expectErrorMessageRed(page: Page) {
  const color = await page.locator(SEL.message).evaluate((el) => {
    return window.getComputedStyle(el as Element).color;
  });
  const m = color.match(/\d+/g);
  expect(m, `错误消息颜色应可解析，实际: ${color}`).not.toBeNull();
  const [r, g, b] = (m as string[]).map(Number);
  expect(r).toBeGreaterThan(150); // 红通道强
  expect(g).toBeLessThan(100); // 绿通道弱
  expect(b).toBeLessThan(100); // 蓝通道弱
}

/** 打开 Login 页面 */
async function openLogin(page: Page) {
  await page.goto(`${BASE_URL}/`);
}

/* =========================================================================
 * 一、画面初期表示
 * ========================================================================= */

test('01_画面初始化-控件初期状态', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await shot(page); // 步骤1：正常输出画面

  // 步骤2：确认各控件初期表示状态
  await expect(page.locator(SEL.userID)).toBeVisible();
  await expect(page.locator(SEL.userID)).toHaveValue(''); // UserID 为空
  await expect(page.locator(SEL.password)).toBeVisible();
  await expect(page.locator(SEL.password)).toHaveValue(''); // Password 为空
  // Password 为掩码类型（不显示明文）
  await expect(page.locator(SEL.password)).toHaveAttribute('type', 'password');
  // Message 区域不显示
  await expect(page.locator(SEL.message)).toHaveCount(0);
  // Login 按钮处于可用状态（活性）
  await expect(page.locator(SEL.loginButton)).toBeEnabled();
  await expect(page.locator(SEL.loginButton)).toHaveText('Login');
  await shot(page); // 步骤3：确认后的画面
});

test('02_画面初始化-Message不显示', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await shot(page);

  // 步骤2：确认 Message 区域
  await expect(page.locator(SEL.message)).toHaveCount(0); // 无任何错误消息
  // Message 区域不占位（未渲染，高度为 0）
  const count = await page.locator(SEL.message).count();
  expect(count).toBe(0);
  await shot(page);
});

/* =========================================================================
 * 二、UserID 入力
 * ========================================================================= */

test('03_UserID正常入力（半角英数字）', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await shot(page);

  // 步骤1：输入半角英数字
  await page.locator(SEL.userID).pressSequentially('userid01');
  await shot(page);
  // 步骤2：确认输入框内容
  await expect(page.locator(SEL.userID)).toHaveValue('userid01');
  // 无错误消息显示
  await expect(page.locator(SEL.message)).toHaveCount(0);
  await shot(page);
});

test('04_UserID边界长度（MaxLength=10）', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await shot(page);

  // 步骤1：输入 10 个半角字符 abcdefghij
  await page.locator(SEL.userID).pressSequentially('abcdefghij');
  await shot(page);
  await expect(page.locator(SEL.userID)).toHaveValue('abcdefghij');

  // 步骤2：继续尝试输入第 11 个字符 k（应被阻止）
  await page.locator(SEL.userID).pressSequentially('k');
  await shot(page);
  // 步骤3：确认仍保持 10 个字符
  await expect(page.locator(SEL.userID)).toHaveValue('abcdefghij');
  await shot(page);
});

test('05_UserID非法字符阻止（非半角英数字）', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await shot(page);

  // 步骤1：依次输入全角/中文/符号等非法字符
  await page.locator(SEL.userID).pressSequentially('ａｂ'); // 全角
  await shot(page);
  await page.locator(SEL.userID).pressSequentially('用户'); // 中文
  await shot(page);
  await page.locator(SEL.userID).pressSequentially('!@'); // 符号
  await shot(page);

  // 步骤2：非法字符全部被拦截，输入框保持为空
  await expect(page.locator(SEL.userID)).toHaveValue('');
  // 无错误消息（输入层拦截）
  await expect(page.locator(SEL.message)).toHaveCount(0);
  await shot(page);
});

test('06_UserID首尾空格去除（trim）', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await shot(page);

  // 拦截认证 API 并记录请求体（用于确认提交值）
  let requestBody: Record<string, unknown> | null = null;
  await page.route(AUTH_API, async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 200,
        data: { token: 'tok', userId: 'userid01', username: 'username01' },
        message: 'OK',
      }),
    });
  });
  await page.route(DOC_TYPE_API, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 200,
        data: { documentTypeList: [] },
        message: '',
      }),
    });
  });

  // 步骤1：输入 UserID（注：输入层已过滤空格，无法键入首尾空格；
  //        以合法值提交，提交前仍执行 trim 处理）
  await page.locator(SEL.userID).pressSequentially('userid01');
  // 步骤2：输入 Password 后点击 Login
  await page.locator(SEL.password).pressSequentially('pw123456');
  await shot(page);
  await page.locator(SEL.loginButton).click();

  // 步骤3：等待 API 调用并确认提交值（trim 后）
  await expect
    .poll(async () => requestBody, { timeout: 5000 })
    .not.toBeNull();
  expect(requestBody).toEqual({
    userid: 'userid01',
    password: 'pw123456',
  });
  await shot(page);
});

/* =========================================================================
 * 三、Password 入力
 * ========================================================================= */

test('07_Password正常入力（半角英数字+記号）', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await shot(page);

  // 步骤1：输入半角英数字与 ASCII 符号
  await page.locator(SEL.password).pressSequentially('P@ssw0rd!');
  await shot(page);
  // 步骤2：内容被接受，且为掩码类型（type=password）
  await expect(page.locator(SEL.password)).toHaveValue('P@ssw0rd!');
  await expect(page.locator(SEL.password)).toHaveAttribute('type', 'password');
  await shot(page);
});

test('08_Password边界长度（MaxLength=32）', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await shot(page);

  // 步骤1：输入 32 个字符
  const thirtyTwo = 'a'.repeat(32);
  await page.locator(SEL.password).pressSequentially(thirtyTwo);
  await shot(page);
  await expect(page.locator(SEL.password)).toHaveValue(thirtyTwo);

  // 步骤2：尝试输入第 33 个字符（应被阻止）
  await page.locator(SEL.password).pressSequentially('b');
  await shot(page);
  // 步骤3：仍保持 32 个字符
  await expect(page.locator(SEL.password)).toHaveValue(thirtyTwo);
  await shot(page);
});

test('09_Password非法字符阻止（全角）', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await shot(page);

  // 步骤1：输入全角非法字符
  await page.locator(SEL.password).pressSequentially('パスワード');
  await shot(page);
  // 步骤2：全角字符被阻止，输入框保持为空
  await expect(page.locator(SEL.password)).toHaveValue('');
  await shot(page);
});

test('10_Password掩码显示', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await shot(page);

  // 步骤1：输入 Password
  await page.locator(SEL.password).pressSequentially('pw123456');
  await shot(page);
  // 步骤2：确认以掩码显示（type=password，页面不显示明文）
  await expect(page.locator(SEL.password)).toHaveAttribute('type', 'password');
  const isMasked = await page
    .locator(SEL.password)
    .evaluate((el) => (el as HTMLInputElement).type === 'password');
  expect(isMasked).toBe(true);
  await shot(page);
});

/* =========================================================================
 * 四、空值校验
 * ========================================================================= */

async function submitLogin(page: Page) {
  await page.locator(SEL.loginButton).click();
}

test('11_空值校验-UserID为空', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  // 防止空值校验通过误发请求（本应终止流程，此路由为兜底）
  await page.route(AUTH_API, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, data: null, message: 'OK' }),
    });
  });

  // 步骤1：UserID 保持为空；步骤2：Password 输入任意值
  await page.locator(SEL.password).pressSequentially('pw123456');
  await shot(page);
  // 步骤3：点击 Login
  await submitLogin(page);
  // 步骤4：确认结果
  await expect(page.locator(SEL.message)).toHaveText(
    'Username and password are required.',
  );
  await expectErrorMessageRed(page);
  // 不迁移画面
  expect(new URL(page.url()).pathname).toBe('/');
  await shot(page);
});

test('12_空值校验-Password为空', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await page.route(AUTH_API, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, data: null, message: 'OK' }),
    });
  });

  // 步骤1：UserID 输入任意值；步骤2：Password 保持为空
  await page.locator(SEL.userID).pressSequentially('userid01');
  await shot(page);
  // 步骤3：点击 Login
  await submitLogin(page);
  // 步骤4：确认结果
  await expect(page.locator(SEL.message)).toHaveText(
    'Username and password are required.',
  );
  await expectErrorMessageRed(page);
  expect(new URL(page.url()).pathname).toBe('/');
  await shot(page);
});

test('13_空值校验-两者都为空', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await page.route(AUTH_API, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, data: null, message: 'OK' }),
    });
  });

  // 步骤1/2：UserID、Password 均保持为空；步骤3：点击 Login
  await shot(page);
  await submitLogin(page);
  // 步骤4：确认结果
  await expect(page.locator(SEL.message)).toHaveText(
    'Username and password are required.',
  );
  await expectErrorMessageRed(page);
  expect(new URL(page.url()).pathname).toBe('/');
  await shot(page);
});

/* =========================================================================
 * 五、Login 按钮 / UI 交互
 * ========================================================================= */

/** 设置一个延迟 1.5s 后返回 401 的认证路由，用于观察认证中状态 */
async function routeAuthWithDelay(page: Page) {
  await page.route(AUTH_API, async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 401,
        data: {},
        message:
          "We didn't recognize the username or password you entered. Please try again.",
      }),
    });
  });
}

test('14_UI交互-认证中按钮禁用', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await routeAuthWithDelay(page);

  // 步骤1：输入有效 UserID / Password
  await page.locator(SEL.userID).pressSequentially('userid01');
  await page.locator(SEL.password).pressSequentially('pw123456');
  await shot(page);
  // 步骤2：点击 Login（响应延迟 1.5s）
  await page.locator(SEL.loginButton).click();
  // 步骤3：在 API 响应前检查按钮与入力控件状态
  await expect(page.locator(SEL.loginButton)).toHaveText('Processing...'); // 文字变化
  await expect(page.locator(SEL.loginButton)).toBeDisabled(); // 按钮禁用
  await expect(page.locator(SEL.userID)).toBeDisabled(); // UserID 禁用
  await expect(page.locator(SEL.password)).toBeDisabled(); // Password 禁用
  await shot(page);
});

test('15_UI交互-防止重复提交', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  let requestCount = 0;
  await page.route(AUTH_API, async (route) => {
    requestCount += 1;
    await new Promise((r) => setTimeout(r, 1500));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 401, data: {}, message: 'NG' }),
    });
  });

  // 步骤1：输入有效 UserID / Password
  await page.locator(SEL.userID).pressSequentially('userid01');
  await page.locator(SEL.password).pressSequentially('pw123456');
  await shot(page);
  // 步骤2：点击 Login
  await page.locator(SEL.loginButton).click();
  await expect(page.locator(SEL.loginButton)).toBeDisabled(); // 确认已禁用
  // 步骤3：在 API 响应前再次点击 Login（force 尝试点击禁用按钮）
  await page
    .locator(SEL.loginButton)
    .click({ force: true, timeout: 2000 })
    .catch(() => undefined);
  await shot(page);
  // 步骤4：等待响应完成并检查 API 调用次数
  await expect(page.locator(SEL.loginButton)).toBeEnabled({ timeout: 5000 });
  expect(requestCount).toBe(1); // 只发起一次 API 调用
  await shot(page);
});

test('16_UI交互-认证完成后按钮恢复', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await routeAuthWithDelay(page); // 返回 401（不迁移画面）

  // 步骤1/2：输入有效值并点击 Login
  await page.locator(SEL.userID).pressSequentially('userid01');
  await page.locator(SEL.password).pressSequentially('pw123456');
  await shot(page);
  await page.locator(SEL.loginButton).click();
  await expect(page.locator(SEL.loginButton)).toHaveText('Processing...');
  // 步骤3：等待 API 响应完成后确认按钮状态
  await expect(page.locator(SEL.loginButton)).toHaveText('Login', {
    timeout: 5000,
  });
  await expect(page.locator(SEL.loginButton)).toBeEnabled();
  // 认证失败（401）时画面不迁移
  expect(new URL(page.url()).pathname).toBe('/');
  await shot(page);
});

/* =========================================================================
 * 六、认证处理（API）
 * ========================================================================= */

test('17_认证成功-code=200', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await page.route(AUTH_API, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 200,
        data: { token: 'userid01username01', userId: 'userid01', username: 'username01' },
        message: 'OK',
      }),
    });
  });
  // Menu 加载时的 DocumentType 下拉接口（返回空列表，避免噪音）
  await page.route(DOC_TYPE_API, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, data: { documentTypeList: [] }, message: '' }),
    });
  });

  // 步骤1/2：输入已注册的 UserID / Password 并点击 Login
  await page.locator(SEL.userID).pressSequentially('userid01');
  await page.locator(SEL.password).pressSequentially('pw123456');
  await shot(page);
  await page.locator(SEL.loginButton).click();

  // 步骤3：等待 code=200 返回后确认
  await page.waitForURL('**/Menu', { timeout: 8000 });
  // token / userId / username 已保存
  const stored = await page.evaluate(() => ({
    token: localStorage.getItem('token'),
    userId: localStorage.getItem('userId'),
    username: localStorage.getItem('username'),
  }));
  expect(stored.token).toBe('userid01username01');
  expect(stored.userId).toBe('userid01');
  expect(stored.username).toBe('username01');
  await shot(page);
});

test('18_认证失败-code=401（用户不存在）', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await page.route(AUTH_API, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 401,
        data: {},
        message:
          "We didn't recognize the username or password you entered. Please try again.",
      }),
    });
  });

  // 步骤1/2：输入未注册用户并点击 Login
  await page.locator(SEL.userID).pressSequentially('nouser01');
  await page.locator(SEL.password).pressSequentially('wrong123');
  await shot(page);
  await page.locator(SEL.loginButton).click();

  // 步骤3/4：确认结果
  await expect(page.locator(SEL.message)).toHaveText(
    "We didn't recognize the username or password you entered. Please try again.",
  );
  await expectErrorMessageRed(page);
  // 画面不迁移、不保存 token
  expect(new URL(page.url()).pathname).toBe('/');
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeNull();
  await shot(page);
});

test('19_认证失败-账户锁定', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await page.route(AUTH_API, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 401,
        data: {},
        message: 'Your account is locked. Please contact your system administrator.',
      }),
    });
  });

  // 步骤1/2：输入触发锁定的用户并点击 Login
  await page.locator(SEL.userID).pressSequentially('lockuser01');
  await page.locator(SEL.password).pressSequentially('pw123456');
  await shot(page);
  await page.locator(SEL.loginButton).click();

  // 步骤3：确认结果（账户锁定提示）
  await expect(page.locator(SEL.message)).toHaveText(
    'Your account is locked. Please contact your system administrator.',
  );
  await expectErrorMessageRed(page);
  expect(new URL(page.url()).pathname).toBe('/');
  await shot(page);
});

/* =========================================================================
 * 七、异常处理
 * ========================================================================= */

test('20_异常处理-网络异常', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  // 模拟网络断开：中断请求（无响应）
  await page.route(AUTH_API, async (route) => route.abort('failed'));

  // 步骤2/3：输入有效值并点击 Login
  await page.locator(SEL.userID).pressSequentially('userid01');
  await page.locator(SEL.password).pressSequentially('pw123456');
  await shot(page);
  await page.locator(SEL.loginButton).click();

  // 步骤4：确认结果
  await expect(page.locator(SEL.message)).toHaveText(
    'Network error. Please check your connection and try again.',
  );
  await expectErrorMessageRed(page);
  await expect(page.locator(SEL.loginButton)).toBeEnabled(); // 按钮恢复
  expect(new URL(page.url()).pathname).toBe('/'); // 画面不迁移
  await shot(page);
});

test('21_异常处理-API超时', async ({ page }, testInfo) => {
  test.setTimeout(60000);
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  // 模拟 API 响应超过 axios 超时时间（10s），使请求被客户端取消（ECONNABORTED）
  await page.route(AUTH_API, async (route) => {
    await new Promise((r) => setTimeout(r, 12000));
    try {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: null, message: 'OK' }),
      });
    } catch {
      // 客户端已超时取消，忽略
    }
  });

  // 步骤2/3：输入有效值并点击 Login
  await page.locator(SEL.userID).pressSequentially('userid01');
  await page.locator(SEL.password).pressSequentially('pw123456');
  await shot(page);
  await page.locator(SEL.loginButton).click();

  // 步骤4：等待超时后确认错误消息
  await expect(page.locator(SEL.message)).toHaveText(
    'Request timeout. Please try again.',
    { timeout: 20000 },
  );
  await expectErrorMessageRed(page);
  await expect(page.locator(SEL.loginButton)).toBeEnabled(); // 按钮恢复
  await shot(page);
});

test('22_异常处理-系统错误500', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await page.route(AUTH_API, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ code: 500, data: null, message: 'System error.' }),
    });
  });

  // 步骤2/3：输入有效值并点击 Login
  await page.locator(SEL.userID).pressSequentially('userid01');
  await page.locator(SEL.password).pressSequentially('pw123456');
  await shot(page);
  await page.locator(SEL.loginButton).click();

  // 步骤4：确认结果
  await expect(page.locator(SEL.message)).toHaveText(
    'System error. Please contact support.',
  );
  await expectErrorMessageRed(page);
  await expect(page.locator(SEL.loginButton)).toBeEnabled(); // 按钮恢复
  expect(new URL(page.url()).pathname).toBe('/'); // 画面不迁移
  await shot(page);
});

/* =========================================================================
 * 八、消息显示
 * ========================================================================= */

test('23_消息显示-错误消息样式', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await page.route(AUTH_API, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, data: null, message: 'OK' }),
    });
  });

  // 步骤1：触发空值校验（UserID 为空，直接点击 Login）
  await page.locator(SEL.password).pressSequentially('pw123456');
  await shot(page);
  await page.locator(SEL.loginButton).click();
  await expect(page.locator(SEL.message)).toHaveText(
    'Username and password are required.',
  );

  // 步骤2：确认 Message 样式（Login 按钮上方、红色、左对齐）
  const buttonBox = await page.locator(SEL.loginButton).boundingBox();
  const messageBox = await page.locator(SEL.message).boundingBox();
  expect(messageBox).not.toBeNull();
  expect(buttonBox).not.toBeNull();
  expect((messageBox as { y: number }).y).toBeLessThan(
    (buttonBox as { y: number }).y,
  ); // 位于 Login 按钮上方
  await expectErrorMessageRed(page);
  const align = await page
    .locator(SEL.message)
    .evaluate((el) => window.getComputedStyle(el as Element).textAlign);
  expect(align).toBe('left'); // 左对齐
  await shot(page);
});

test('24_消息清空-再次输入时清除', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openLogin(page);
  await page.route(AUTH_API, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, data: null, message: 'OK' }),
    });
  });

  // 步骤1：触发空值校验显示错误
  await page.locator(SEL.loginButton).click();
  await expect(page.locator(SEL.message)).toHaveText(
    'Username and password are required.',
  );
  await shot(page);

  // 步骤2：重新输入 UserID（触发清空逻辑）
  await page.locator(SEL.userID).pressSequentially('userid01');
  await shot(page);
  // 步骤3：旧错误消息被清除
  await expect(page.locator(SEL.message)).toHaveCount(0);
  await shot(page);
});
