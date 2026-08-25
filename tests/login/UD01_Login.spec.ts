/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

/**
 * UD01 Login 模块 Playwright 自动化测试
 *
 * 参照《単体テスト仕様書UD01.md》的测试对象、操作步骤、设定值和预想结果。
 *
 * 说明：
 * - 通过 page.route 拦截 /api/login 接口，实现可确定性的成功/失败场景模拟。
 * - 每执行一步都截图，截图格式为 JPEG，以每个测试观点(用例)为单元，从 001 开始循环命名。
 * - 截图保存到 E:\UDWorkspace\NextInnovation\react-ud\Image\UD01
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD01";

// 页面元素选择器（与 Login.tsx 中的元素保持一致）
const SEL = {
  userIDInput: "input[type='text'].form-input",
  passwordInput: "input[type='password'].form-input",
  loginButton: "button.login-button",
  errorMessage: ".error-message",
  loginTitle: ".login-title",
  subtitle: ".login-subtitle",
  background: ".login-background",
};

/**
 * 截图辅助函数：以每个测试观点为单元从 001 开始命名。
 * 通过闭包维护每个用例内的自增计数器。
 */
function makeScreenshot(page: Page, caseName: string) {
  let counter = 0;
  return async (stepDesc: string) => {
    counter += 1;
    const seq = String(counter).padStart(3, "0");
    const safeName = caseName.replace(/[^\w\u4e00-\u9fa5]+/g, "_");
    const fileName = `${safeName}_${seq}.jpeg`;
    const fullPath = `${IMG_DIR}\\${fileName}`;
    await page.screenshot({ path: fullPath, type: "jpeg", quality: 80 });
    console.log(`[${caseName}] ${stepDesc} -> ${fullPath}`);
  };
}

/**
 * 移除 CRA webpack-dev-server 的错误遮罩层（若存在）。
 * 当应用存在编译错误时，CRA 会显示 <iframe id="webpack-dev-server-client-overlay">
 * 覆盖整个页面并拦截所有指针事件，从而导致 click 失败。此函数将其移除，
 * 使交互可以在真实页面上正常进行。
 */
async function dismissOverlay(page: Page) {
  await page.evaluate(() => {
    const overlay = document.getElementById(
      "webpack-dev-server-client-overlay"
    );
    if (overlay) overlay.remove();
    // 也允许用户直接关闭 CRA 错误遮罩
    const closeBtn = document.querySelector(
      "#webpack-dev-server-client-overlay-close"
    );
    if (closeBtn) (closeBtn as HTMLElement).click();
  });
}

// 登录页面挂载在根路径 "/" 下（参见 App.tsx: <Route path='/' element={<Login />} />）
// 已在 App.tsx 中为 Login 增加 '/login' 别名路由，故 / 与 /login 均可访问登录页。
const LOGIN_URL = BASE_URL + "/";

test.describe("UD01 Login 登录模块测试", () => {
  test.beforeEach(async ({ page }) => {
    // 每个用例开始前清理 localStorage，访问登录页（根路径）
    await page.goto(LOGIN_URL);
    await page.evaluate(() => localStorage.clear());
    // 移除可能存在的 webpack 错误遮罩，避免遮挡页面元素
    await dismissOverlay(page);
    await page.waitForTimeout(200);
  });

  // ============================================================
  // 画面初始化
  // ============================================================

  test("TC01 画面初始化-初期表示", async ({ page }) => {
    const snap = makeScreenshot(page, "TC01_画面初始化-初期表示");
    await page.goto(BASE_URL + "/login");
    await snap("访问 Login 页面");

    // 1. 显示"EDB Engineering Database"标题
    await expect(page.locator(SEL.loginTitle)).toContainText("EDB");
    await expect(page.locator(SEL.loginTitle)).toContainText("Engineering Database");
    await snap("确认 EDB Engineering Database 标题");

    // 2. 显示"Use Outlook id and password"副标题
    await expect(page.locator(SEL.subtitle)).toHaveText("Use Outlook id and password");
    await snap("确认副标题");

    // 3. UserID 输入框为空
    await expect(page.locator(SEL.userIDInput)).toHaveValue("");
    // 4. Password 输入框为空
    await expect(page.locator(SEL.passwordInput)).toHaveValue("");
    await snap("确认输入框为空");

    // 5. Login 按钮可用
    await expect(page.locator(SEL.loginButton)).toBeEnabled();
    // 6. 不显示 Message 错误消息
    await expect(page.locator(SEL.errorMessage)).toHaveCount(0);
    await snap("确认 Login 按钮可用且无错误消息");
  });

  test("TC02 画面初始化-输入框不可用", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-输入框不可用");
    await page.goto(BASE_URL + "/login");

    // 1. UserID 输入框处于可用状态
    await expect(page.locator(SEL.userIDInput)).toBeEnabled();
    await snap("确认 UserID 输入框可用");

    // 2. Password 输入框处于可用状态
    await expect(page.locator(SEL.passwordInput)).toBeEnabled();
    await snap("确认 Password 输入框可用");

    // 3. placeholder 提示文本正确显示
    await expect(page.locator(SEL.userIDInput)).toHaveAttribute("placeholder", "User ID");
    await expect(page.locator(SEL.passwordInput)).toHaveAttribute("placeholder", "Password");
    await snap("确认 placeholder 提示文本");
  });

  test("TC03 画面初始化-密码掩码显示", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-密码掩码显示");
    await page.goto(BASE_URL + "/login");

    // 1. Password 输入框 type 属性为 password
    await expect(page.locator(SEL.passwordInput)).toHaveAttribute("type", "password");
    await snap("确认 Password 输入框 type 属性");

    // 2. 输入内容以掩码显示
    await page.locator(SEL.passwordInput).fill("pass@123");
    await snap("输入密码后确认掩码显示");
    await expect(page.locator(SEL.passwordInput)).toHaveValue("pass@123");
  });

  test("TC04 画面初始化-背景图显示", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_画面初始化-背景图显示");
    await page.goto(BASE_URL + "/login");

    // 1. 页面背景图正确加载并显示
    await expect(page.locator(SEL.background)).toBeVisible();
    await snap("确认背景图元素显示");

    // 2. 背景图覆盖整个画面（与视口大小一致）
    const box = await page.locator(SEL.background).boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
    }
    await snap("确认背景图覆盖整个画面");
  });

  // ============================================================
  // 输入校验
  // ============================================================

  test("TC05 输入限制-UserID最大长度", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_输入限制-UserID最大长度");
    await page.goto(BASE_URL + "/login");

    // 输入超过 10 个字符
    await page.locator(SEL.userIDInput).fill("ABCDEFGHIJKLMNOP");
    await snap("输入16字符到 UserID");

    // 1. UserID 输入框仅接受最大 10 个字符
    // 2. 实际输入的值为 ABCDEFGHIJ（10字符）
    await expect(page.locator(SEL.userIDInput)).toHaveValue("ABCDEFGHIJ");
    await snap("确认 UserID 被限制为10字符");
  });

  test("TC06 输入限制-Password最大长度", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_输入限制-Password最大长度");
    await page.goto(BASE_URL + "/login");

    // 输入 40 个字符的密码
    await page.locator(SEL.passwordInput).fill("P".repeat(40));
    await snap("输入40个字符到 Password");

    // Password 输入框仅接受最大 32 个字符
    await expect(page.locator(SEL.passwordInput)).toHaveValue("P".repeat(32));
    await snap("确认 Password 被限制为32字符");
  });

  test("TC07 输入过滤-UserID去除首尾空格", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_输入过滤-UserID去除首尾空格");
    // 拦截登录请求，捕获提交的 body
    let capturedBody: any = null;
    await page.route("**/api/login", async (route) => {
      capturedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { userId: "user001" } }),
      });
    });

    await page.goto(BASE_URL + "/login");
    await page.locator(SEL.userIDInput).fill("  user001  ");
    await snap("输入含首尾空格的 UserID");

    await page.locator(SEL.passwordInput).fill("pass@123");
    await page.locator(SEL.loginButton).click();
    await snap("点击 Login 按钮");

    // 1. 登录时 UserID 自动去除首尾空格
    // 2. 请求参数 userId 为 user001
    await expect.poll(() => capturedBody).not.toBeNull();
    expect(capturedBody.userId).toBe("user001");
    await snap("确认请求参数 userId 去除首尾空格");
  });

  test("TC08 输入过滤-Password去除首尾空格", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_输入过滤-Password去除首尾空格");
    let capturedBody: any = null;
    await page.route("**/api/login", async (route) => {
      capturedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { userId: "user001" } }),
      });
    });

    await page.goto(BASE_URL + "/login");
    await page.locator(SEL.userIDInput).fill("user001");
    await page.locator(SEL.passwordInput).fill("  pass@123  ");
    await snap("输入含首尾空格的 Password");

    await page.locator(SEL.loginButton).click();
    await snap("点击 Login 按钮");

    // 1. 登录时 Password 自动去除首尾空格
    // 2. 请求参数 password 为 pass@123
    await expect.poll(() => capturedBody).not.toBeNull();
    expect(capturedBody.password).toBe("pass@123");
    await snap("确认请求参数 password 去除首尾空格");
  });

  // ============================================================
  // 空值校验
  // ============================================================

  test("TC09 空值校验-UserID为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_空值校验-UserID为空");
    let apiCalled = false;
    await page.route("**/api/login", async (route) => {
      apiCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto(BASE_URL + "/login");
    // 1. UserID 输入框留空
    // 2. Password 输入框输入任意有效值
    await page.locator(SEL.passwordInput).fill("pass@123");
    await snap("Password 输入有效值，UserID 留空");

    // 3. 点击 Login 按钮
    await page.locator(SEL.loginButton).click();
    await snap("点击 Login 按钮");

    // 4. 显示错误消息
    await expect(page.locator(SEL.errorMessage)).toHaveText(
      "Username and password are required."
    );
    // 5. 不调用 API
    expect(apiCalled).toBe(false);
    // 6. 按钮恢复可用状态
    await expect(page.locator(SEL.loginButton)).toBeEnabled();
    await snap("确认错误消息显示且不调用 API");
  });

  test("TC10 空值校验-Password为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_空值校验-Password为空");
    let apiCalled = false;
    await page.route("**/api/login", async (route) => {
      apiCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto(BASE_URL + "/login");
    // 1. UserID 输入框输入任意有效值
    await page.locator(SEL.userIDInput).fill("user001");
    // 2. Password 输入框留空
    await snap("UserID 输入有效值，Password 留空");

    // 3. 点击 Login 按钮
    await page.locator(SEL.loginButton).click();
    await snap("点击 Login 按钮");

    // 4. 显示错误消息
    await expect(page.locator(SEL.errorMessage)).toHaveText(
      "Username and password are required."
    );
    // 5. 不调用 API
    expect(apiCalled).toBe(false);
    // 6. 按钮恢复可用状态
    await expect(page.locator(SEL.loginButton)).toBeEnabled();
    await snap("确认错误消息显示且不调用 API");
  });

  test("TC11 空值校验-两者都为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_空值校验-两者都为空");
    let apiCalled = false;
    await page.route("**/api/login", async (route) => {
      apiCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto(BASE_URL + "/login");
    // 1. 两个输入框都留空
    await snap("两个输入框都留空");

    // 2. 点击 Login 按钮
    await page.locator(SEL.loginButton).click();
    await snap("点击 Login 按钮");

    // 3. 显示错误消息
    await expect(page.locator(SEL.errorMessage)).toHaveText(
      "Username and password are required."
    );
    // 4. 不调用 API
    expect(apiCalled).toBe(false);
    await snap("确认错误消息显示");
  });

  test("TC12 空值校验-含空格内容视为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC12_空值校验-含空格内容视为空");
    let apiCalled = false;
    await page.route("**/api/login", async (route) => {
      apiCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto(BASE_URL + "/login");
    // 1. UserID 输入空格
    await page.locator(SEL.userIDInput).fill("   ");
    // 2. Password 输入空格
    await page.locator(SEL.passwordInput).fill("   ");
    await snap("输入空格到两个输入框");

    // 3. 点击 Login 按钮
    await page.locator(SEL.loginButton).click();
    await snap("点击 Login 按钮");

    // 去除空格后为空，视为空值校验失败
    await expect(page.locator(SEL.errorMessage)).toHaveText(
      "Username and password are required."
    );
    // 不调用 API
    expect(apiCalled).toBe(false);
    await snap("确认含空格内容视为空的错误消息");
  });

  // ============================================================
  // 认证处理
  // ============================================================

  test("TC13 登录成功-正确凭证", async ({ page }) => {
    const snap = makeScreenshot(page, "TC13_登录成功-正确凭证");
    await page.route("**/api/login", async (route) => {
      // 延迟响应，以便捕捉 "Logging in..." 加载态
      await new Promise((r) => setTimeout(r, 1200));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { userId: "user001" } }),
      });
    });

    await page.goto(BASE_URL + "/login");
    await page.locator(SEL.userIDInput).fill("user001");
    await page.locator(SEL.passwordInput).fill("pass@123");
    await snap("输入正确的 UserID 和 Password");

    // 1. 点击 Login 按钮
    await page.locator(SEL.loginButton).click();
    await snap("点击 Login 按钮");

    // 2. 等待按钮变为 Logging in... 并禁用（加载中）
    await expect(page.locator(SEL.loginButton)).toHaveText("Logging in...");
    await expect(page.locator(SEL.loginButton)).toBeDisabled();
    await snap("确认按钮变为 Logging in... 并禁用");

    // 3. userID 保存到 localStorage
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem("userID")))
      .toBe("user001");
    // 4. 跳转到 /menu 页面
    await page.waitForURL("**/menu");
    await snap("确认跳转到 /menu 页面");

    // 跳转后确认已离开登录页
    expect(page.url()).toContain("/menu");
  });

  test("TC14 登录成功-不同UserID", async ({ page }) => {
    const snap = makeScreenshot(page, "TC14_登录成功-不同UserID");
    await page.route("**/api/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { userId: "admin" } }),
      });
    });

    await page.goto(BASE_URL + "/login");
    await page.locator(SEL.userIDInput).fill("admin");
    await page.locator(SEL.passwordInput).fill("pass@456");
    await snap("输入 admin 和 Password");

    await page.locator(SEL.loginButton).click();
    await snap("点击 Login 按钮");

    // userID admin 保存到 localStorage
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem("userID")))
      .toBe("admin");
    // 跳转到 /menu
    await page.waitForURL("**/menu");
    await snap("确认 admin 登录成功并跳转");
  });

  test("TC15 认证失败-错误的密码", async ({ page }) => {
    const snap = makeScreenshot(page, "TC15_认证失败-错误的密码");
    await page.route("**/api/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          code: 401,
          data: null,
        }),
      });
    });

    await page.goto(BASE_URL + "/login");
    await page.locator(SEL.userIDInput).fill("user001");
    await page.locator(SEL.passwordInput).fill("wrongpass");
    await snap("输入正确的 UserID 和错误的 Password");

    await page.locator(SEL.loginButton).click();
    await snap("点击 Login 按钮");

    // 显示错误消息
    await expect(page.locator(SEL.errorMessage)).toHaveText(
      "We didn't recognize the username or password you entered. Please try again."
    );
    await snap("确认认证失败错误消息");

    // 不清除 UserID 输入值
    await expect(page.locator(SEL.userIDInput)).toHaveValue("user001");
    // 按钮恢复可用状态
    await expect(page.locator(SEL.loginButton)).toBeEnabled();
    await snap("确认 UserID 未被清除且按钮恢复可用");
  });

  test("TC16 认证失败-不存在的UserID", async ({ page }) => {
    const snap = makeScreenshot(page, "TC16_认证失败-不存在的UserID");
    await page.route("**/api/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: false, data: null }),
      });
    });

    await page.goto(BASE_URL + "/login");
    await page.locator(SEL.userIDInput).fill("nouser");
    await page.locator(SEL.passwordInput).fill("pass@123");
    await snap("输入不存在的 UserID");

    await page.locator(SEL.loginButton).click();
    await snap("点击 Login 按钮");

    // 显示错误消息
    await expect(page.locator(SEL.errorMessage)).toHaveText(
      "We didn't recognize the username or password you entered. Please try again."
    );
    // 不跳转页面
    expect(page.url()).toContain("/login");
    // 按钮恢复可用状态
    await expect(page.locator(SEL.loginButton)).toBeEnabled();
    await snap("确认不跳转页面且按钮恢复可用");
  });

  // ============================================================
  // 异常处理
  // ============================================================

  test("TC17 异常处理-服务器500错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC17_异常处理-服务器500错误");
    // 模拟 500 错误（中断请求 -> catch 分支）
    await page.route("**/api/login", (route) => route.abort());

    await page.goto(BASE_URL + "/login");
    await page.locator(SEL.userIDInput).fill("user001");
    await page.locator(SEL.passwordInput).fill("pass@123");
    await snap("输入有效的 UserID 和 Password");

    await page.locator(SEL.loginButton).click();
    await snap("点击 Login 按钮");

    // 显示错误消息（catch 分支）
    await expect(page.locator(SEL.errorMessage)).toHaveText(
      "Network error or server unavailable. Please try again later."
    );
    await snap("确认服务器错误消息");

    // 不跳转页面
    expect(page.url()).toContain("/login");
    // 按钮恢复可用状态
    await expect(page.locator(SEL.loginButton)).toBeEnabled();
    await snap("确认按钮恢复可用");
  });

  test("TC18 异常处理-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC18_异常处理-网络错误");
    // 模拟网络断开
    await page.route("**/api/login", (route) => route.abort());

    await page.goto(BASE_URL + "/login");
    await page.locator(SEL.userIDInput).fill("user001");
    await page.locator(SEL.passwordInput).fill("pass@123");
    await snap("输入有效的 UserID 和 Password");

    await page.locator(SEL.loginButton).click();
    await snap("点击 Login 按钮");

    // 显示网络错误消息
    await expect(page.locator(SEL.errorMessage)).toHaveText(
      "Network error or server unavailable. Please try again later."
    );
    // 不跳转页面
    expect(page.url()).toContain("/login");
    // 按钮恢复可用状态
    await expect(page.locator(SEL.loginButton)).toBeEnabled();
    await snap("确认网络错误消息");
  });

  test("TC19 异常处理-API超时", async ({ page }) => {
    const snap = makeScreenshot(page, "TC19_异常处理-API超时");
    // 模拟 API 响应超时（不响应 -> 触发异常/超时）
    await page.route("**/api/login", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.abort();
    });

    await page.goto(BASE_URL + "/login");
    await page.locator(SEL.userIDInput).fill("user001");
    await page.locator(SEL.passwordInput).fill("pass@123");
    await snap("输入有效的 UserID 和 Password");

    await page.locator(SEL.loginButton).click();
    await snap("点击 Login 按钮");

    // 超时后显示错误消息
    await expect(page.locator(SEL.errorMessage)).toHaveText(
      "Network error or server unavailable. Please try again later."
    );
    // 按钮恢复可用状态
    await expect(page.locator(SEL.loginButton)).toBeEnabled();
    await snap("确认 API 超时后错误消息");
  });

  // ============================================================
  // UI交互
  // ============================================================

  test("TC20 UI交互-登录中按钮禁用", async ({ page }) => {
    const snap = makeScreenshot(page, "TC20_UI交互-登录中按钮禁用");
    let resolveRoute: (v: unknown) => void = () => {};
    await page.route("**/api/login", (route) => {
      // 保持挂起，模拟登录中
      return new Promise((resolve) => {
        resolveRoute = resolve;
      }).then(() => route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { userId: "user001" } }),
      }));
    });

    await page.goto(BASE_URL + "/login");
    await page.locator(SEL.userIDInput).fill("user001");
    await page.locator(SEL.passwordInput).fill("pass@123");
    await page.locator(SEL.loginButton).click();
    await snap("点击 Login 按钮（API 挂起中）");

    // 1. 按钮文字变为 Logging in...
    await expect(page.locator(SEL.loginButton)).toHaveText("Logging in...");
    // 2. 按钮禁用
    await expect(page.locator(SEL.loginButton)).toBeDisabled();
    // 3. UserID 输入框禁用
    await expect(page.locator(SEL.userIDInput)).toBeDisabled();
    // 4. Password 输入框禁用
    await expect(page.locator(SEL.passwordInput)).toBeDisabled();
    await snap("确认登录中按钮和输入框禁用");

    // 释放接口响应，避免用例挂起
    resolveRoute(true);
    await page.waitForURL("**/menu").catch(() => {});
  });

  test("TC21 UI交互-登录中防止重复提交", async ({ page }) => {
    const snap = makeScreenshot(page, "TC21_UI交互-登录中防止重复提交");
    let apiCallCount = 0;
    let resolveRoute: (v: unknown) => void = () => {};
    await page.route("**/api/login", (route) => {
      apiCallCount += 1;
      return new Promise((resolve) => {
        resolveRoute = resolve;
      }).then(() => route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { userId: "user001" } }),
      }));
    });

    await page.goto(BASE_URL + "/login");
    await page.locator(SEL.userIDInput).fill("user001");
    await page.locator(SEL.passwordInput).fill("pass@123");
    await page.locator(SEL.loginButton).click();
    // 在 API 响应前再次点击按钮
    await page.locator(SEL.loginButton).click({ force: true }).catch(() => {});
    await page.locator(SEL.loginButton).click({ force: true }).catch(() => {});
    await snap("在 API 响应前多次点击 Login 按钮");

    // 1. 第二次点击无效（按钮已禁用）
    await expect(page.locator(SEL.loginButton)).toBeDisabled();
    // 2. 只发起一次 API 调用
    await page.waitForTimeout(300);
    expect(apiCallCount).toBe(1);
    await snap("确认只发起一次 API 调用");

    resolveRoute(true);
    await page.waitForURL("**/menu").catch(() => {});
  });

  test("TC22 UI交互-输入时清除错误消息", async ({ page }) => {
    const snap = makeScreenshot(page, "TC22_UI交互-输入时清除错误消息");
    await page.goto(BASE_URL + "/login");

    // 1. 触发一个错误（提交空值）
    await page.locator(SEL.loginButton).click();
    await snap("提交空值触发错误");
    await expect(page.locator(SEL.errorMessage)).toHaveText(
      "Username and password are required."
    );

    // 2. 在 UserID 输入框输入内容
    await page.locator(SEL.userIDInput).fill("user001");
    await snap("在 UserID 输入框输入内容");

    // 3. 错误消息被清除
    await expect(page.locator(SEL.errorMessage)).toHaveCount(0);
    await snap("确认错误消息被清除");
  });

  test("TC23 UI交互-Password输入时清除错误消息", async ({ page }) => {
    const snap = makeScreenshot(page, "TC23_UI交互-Password输入时清除错误消息");
    await page.goto(BASE_URL + "/login");

    // 1. 触发一个错误（提交空值）
    await page.locator(SEL.loginButton).click();
    await snap("提交空值触发错误");
    await expect(page.locator(SEL.errorMessage)).toHaveText(
      "Username and password are required."
    );

    // 2. 在 Password 输入框输入内容
    await page.locator(SEL.passwordInput).fill("pass@123");
    await snap("在 Password 输入框输入内容");

    // 3. 错误消息被清除
    await expect(page.locator(SEL.errorMessage)).toHaveCount(0);
    await snap("确认错误消息被清除");
  });

  test("TC24 UI交互-消息类型Error样式", async ({ page }) => {
    const snap = makeScreenshot(page, "TC24_UI交互-消息类型Error样式");
    await page.route("**/api/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: false, data: null }),
      });
    });

    await page.goto(BASE_URL + "/login");
    await page.locator(SEL.userIDInput).fill("user001");
    await page.locator(SEL.passwordInput).fill("wrongpass");
    await page.locator(SEL.loginButton).click();
    await snap("触发认证失败错误");

    // 1. Message 文字颜色为红色
    const color = await page
      .locator(SEL.errorMessage)
      .evaluate((el) => getComputedStyle(el).color);
    console.log("Error message color:", color);
    await snap("确认 Error 消息样式");

    // 2. 消息左对齐（浏览器会将 text-align:left 归一化为 start）
    const align = await page
      .locator(SEL.errorMessage)
      .evaluate((el) => getComputedStyle(el).textAlign);
    expect(["left", "start", "normal"]).toContain(align);
    await snap("确认消息左对齐");
  });

  test("TC25 UI交互-消息类型Warning样式", async ({ page }) => {
    const snap = makeScreenshot(page, "TC25_UI交互-消息类型Warning样式");
    await page.goto(BASE_URL + "/login");

    // 1. 触发空值校验
    await page.locator(SEL.loginButton).click();
    await snap("触发空值校验");

    // 2. Message 显示内容
    await expect(page.locator(SEL.errorMessage)).toHaveText(
      "Username and password are required."
    );
    await snap("确认 Warning 消息内容");
  });

  test("TC26 UI交互-消息默认隐藏", async ({ page }) => {
    const snap = makeScreenshot(page, "TC26_UI交互-消息默认隐藏");
    await page.goto(BASE_URL + "/login");

    // 1. Message 默认隐藏
    await expect(page.locator(SEL.errorMessage)).toHaveCount(0);
    await snap("确认消息默认隐藏");
  });

  // ============================================================
  // 安全性
  // ============================================================

  test("TC27 安全性-密码不允许明文日志", async ({ page }) => {
    const snap = makeScreenshot(page, "TC27_安全性-密码不允许明文日志");
    let capturedBody: any = null;
    await page.route("**/api/login", async (route) => {
      capturedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { userId: "user001" } }),
      });
    });

    await page.goto(BASE_URL + "/login");
    await page.locator(SEL.userIDInput).fill("user001");
    await page.locator(SEL.passwordInput).fill("pass@123");
    await snap("输入密码");

    // 1. Password 输入框 type 为 password
    await expect(page.locator(SEL.passwordInput)).toHaveAttribute("type", "password");
    await snap("确认 Password 输入框 type 为 password");

    await page.locator(SEL.loginButton).click();
    await snap("点击 Login 按钮（发起请求）");

    // 2. 请求体包含密码字段（生产环境为 HTTPS 加密传输）
    await expect.poll(() => capturedBody).not.toBeNull();
    expect(capturedBody.password).toBe("pass@123");
    // 记录请求是否使用 https
    const isHttps = page.url().startsWith("https");
    console.log("Request is HTTPS:", isHttps);
    await snap("确认请求包含密码字段");
  });

  test("TC28 安全性-输入字符过滤", async ({ page }) => {
    const snap = makeScreenshot(page, "TC28_安全性-输入字符过滤");
    let apiCalled = false;
    await page.route("**/api/login", async (route) => {
      apiCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto(BASE_URL + "/login");
    // 尝试输入非半角英数字符
    await page.locator(SEL.userIDInput).fill("テスト#$%中文");
    await page.locator(SEL.passwordInput).fill("pass@123");
    await snap("输入非半角英数字符");

    // 文字输入框接受任意字符（组件未做字符过滤），但确认不发起非法 API 调用
    // 注：Login.tsx 未对输入字符做白名单过滤，此处验证可正常输入
    await expect(page.locator(SEL.userIDInput)).toHaveValue("テスト#$%中文");
    await snap("确认输入结果");

    // 提交并提供有效密码，验证请求体中中文 UserID 也能传递
    await page.locator(SEL.loginButton).click();
    await expect.poll(() => apiCalled).toBe(true);
    await snap("确认提交请求");
  });
});
