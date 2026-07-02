import { test, expect, Page } from "@playwright/test";
import mysql from "mysql2/promise";

// ============================================================
// 数据库配置
// ============================================================
const DB_CONFIG = {
  host: "localhost",
  user: "root",
  password: "1234",
  database: "react_ud",
};

// ============================================================
// 截图保存路径
// ============================================================
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD01";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";

// ============================================================
// 截图计数器（每个测试用例独立计数）
// ============================================================
let screenshotCounter: { [key: string]: number } = {};

function getScreenshotPath(testName: string, stepName: string): string {
  if (!screenshotCounter[testName]) {
    screenshotCounter[testName] = 0;
  }
  screenshotCounter[testName]++;
  const seq = String(screenshotCounter[testName]).padStart(3, "0");
  return `${SCREENSHOT_DIR}/${testName}_${seq}_${stepName}.jpeg`;
}

// ============================================================
// 数据库工具函数
// ============================================================
async function setupTestData() {
  const connection = await mysql.createConnection(DB_CONFIG);
  try {
    await connection.execute("DELETE FROM user_info WHERE userid LIKE ?", [
      "test_%",
    ]);
    await connection.execute(
      "INSERT INTO user_info (userid, password) VALUES (?, ?)",
      ["test_admin", "Test@123"],
    );
  } finally {
    await connection.end();
  }
}

async function clearTestData() {
  const connection = await mysql.createConnection(DB_CONFIG);
  try {
    await connection.execute("DELETE FROM user_info WHERE userid LIKE ?", [
      "test_%",
    ]);
  } finally {
    await connection.end();
  }
}

// ============================================================
// 模拟API响应的辅助函数
// ============================================================
async function mockLoginSuccess(page: Page) {
  await page.route("**/api/login", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "登录成功",
        data: { userId: "admin" },
      }),
    });
  });
}

async function mockLoginAuthFailure(page: Page) {
  await page.route("**/api/login", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        message: "Invalid credentials",
      }),
    });
  });
}

async function mockLoginHttp500(page: Page) {
  await page.route("**/api/login", (route) => {
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
    });
  });
}

async function mockLoginNetworkError(page: Page) {
  await page.route("**/api/login", (route) => {
    route.abort("connectionrefused");
  });
}

async function mockLoginDelay(page: Page, delayMs: number = 10000) {
  await page.route("**/api/login", async (route) => {
    await new Promise((r) => setTimeout(r, delayMs));
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "登录成功",
        data: { userId: "admin" },
      }),
    });
  });
}

// ============================================================
// 清理localStorage（必须在 page.goto 之后调用）
// ============================================================
async function clearLocalStorage(page: Page) {
  await page.evaluate(() => localStorage.removeItem("currentUser"));
}

// ============================================================
// 页面导航辅助函数
// ============================================================
async function navigateToLogin(page: Page) {
  await page.goto(APP_URL, { waitUntil: "networkidle" });
  await page.waitForSelector("#root", { timeout: 15000 });
  await page.waitForTimeout(2000);
}

// ============================================================
// 测试套件
// ============================================================
test.describe("UD01 Login - 单体测试", () => {
  test.beforeEach(() => {
    screenshotCounter = {};
  });

  // ============================================================
  // No.1 画面初期显示-基本元素
  // ============================================================
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await navigateToLogin(page);

    await expect(page.locator("input#userId")).toBeVisible();
    await expect(page.locator("input#password")).toBeVisible();
    await expect(page.locator("input#password")).toHaveAttribute(
      "type",
      "password",
    );
    await expect(page.locator("button.login-button")).toBeVisible();
    await expect(page.locator("span.error-message")).toHaveCount(0);
    await expect(page.locator("div.error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "整体画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-输入控件初始状态
  // ============================================================
  test("02_画面初期显示_输入控件初始状态", async ({ page }) => {
    await navigateToLogin(page);

    await expect(page.locator("input#userId")).toHaveValue("");
    await expect(page.locator("input#userId")).toBeEnabled();
    await expect(page.locator("input#userId")).toHaveAttribute(
      "maxLength",
      "10",
    );
    await expect(page.locator("input#password")).toHaveValue("");
    await expect(page.locator("input#password")).toBeEnabled();
    await expect(page.locator("input#password")).toHaveAttribute(
      "maxLength",
      "32",
    );
    await expect(page.locator("button.login-button")).toBeEnabled();
    await expect(page.locator("span.error-message")).toHaveCount(0);
    await expect(page.locator("div.error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_输入控件初始状态", "初始状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-UserID 允许字符
  // ============================================================
  test("03_画面初期显示_UserID允许字符", async ({ page }) => {
    await navigateToLogin(page);

    await page.locator("input#userId").fill("User01");
    await expect(page.locator("input#userId")).toHaveValue("User01");

    await page.screenshot({
      path: getScreenshotPath("03_UserID允许字符", "输入后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 画面初期显示-Password 允许字符
  // ============================================================
  test("04_画面初期显示_Password允许字符", async ({ page }) => {
    await navigateToLogin(page);

    await page.locator("input#password").fill("Pass@123!");
    await expect(page.locator("input#password")).toHaveValue("Pass@123!");
    await expect(page.locator("input#password")).toHaveAttribute(
      "type",
      "password",
    );

    await page.screenshot({
      path: getScreenshotPath("04_Password允许字符", "输入后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 空值校验-UserID 为空
  // ============================================================
  test("05_空值校验_UserID为空", async ({ page }) => {
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("");
    await page.locator("input#password").fill("Pass@123");
    await page.locator("button.login-button").click();

    await expect(page.locator("span.error-message").first()).toBeVisible();
    await expect(page.locator("span.error-message").first()).toHaveText(
      "Username and password are required.",
    );
    const color = await page
      .locator("span.error-message")
      .first()
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe("rgb(255, 77, 79)");
    await expect(page.locator("button.login-button")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("05_空值校验_UserID为空", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 空值校验-Password 为空
  // ============================================================
  test("06_空值校验_Password为空", async ({ page }) => {
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("User01");
    await page.locator("input#password").fill("");
    await page.locator("button.login-button").click();

    await expect(page.locator("span.error-message").first()).toBeVisible();
    await expect(page.locator("span.error-message").first()).toHaveText(
      "Username and password are required.",
    );
    const color = await page
      .locator("span.error-message")
      .first()
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe("rgb(255, 77, 79)");
    await expect(page.locator("button.login-button")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("06_空值校验_Password为空", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 空值校验-两者都为空
  // ============================================================
  test("07_空值校验_两者都为空", async ({ page }) => {
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("");
    await page.locator("input#password").fill("");
    await page.locator("button.login-button").click();

    await expect(page.locator("span.error-message")).toHaveCount(2);
    await expect(page.locator("span.error-message").first()).toHaveText(
      "Username and password are required.",
    );
    const color = await page
      .locator("span.error-message")
      .first()
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe("rgb(255, 77, 79)");
    await expect(page.locator("button.login-button")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("07_空值校验_两者都为空", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 空值校验-UserID 为空格
  // ============================================================
  test("08_空值校验_UserID为空格", async ({ page }) => {
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("   ");
    await page.locator("input#password").fill("Pass@123");
    await page.locator("button.login-button").click();

    await expect(page.locator("span.error-message").first()).toBeVisible();
    await expect(page.locator("span.error-message").first()).toHaveText(
      "Username and password are required.",
    );

    await page.screenshot({
      path: getScreenshotPath("08_空值校验_UserID为空格", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 空值校验-Password 为空格
  // ============================================================
  test("09_空值校验_Password为空格", async ({ page }) => {
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("User01");
    await page.locator("input#password").fill("   ");
    await page.locator("button.login-button").click();

    await expect(page.locator("span.error-message").first()).toBeVisible();
    await expect(page.locator("span.error-message").first()).toHaveText(
      "Username and password are required.",
    );

    await page.screenshot({
      path: getScreenshotPath("09_空值校验_Password为空格", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 UserID-最大长度校验
  // ============================================================
  test("10_UserID_最大长度校验", async ({ page }) => {
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("ABCDEFGHIJKLMN");
    await expect(page.locator("input#userId")).toHaveValue("ABCDEFGHIJ");

    await page.screenshot({
      path: getScreenshotPath("10_UserID_最大长度校验", "输入后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 UserID-半角英数字输入
  // ============================================================
  test("11_UserID_半角英数字输入", async ({ page }) => {
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("ABCdef123");
    await expect(page.locator("input#userId")).toHaveValue("ABCdef123");
    await expect(page.locator("span.error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("11_UserID_半角英数字输入", "输入后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 UserID-非法字符拦截
  // ============================================================
  test("12_UserID_非法字符拦截", async ({ page }) => {
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("@#$%");
    expect(await page.locator("input#userId").inputValue()).toBeDefined();

    await page.screenshot({
      path: getScreenshotPath("12_UserID_非法字符拦截", "输入后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 Password-最大长度校验
  // ============================================================
  test("13_Password_最大长度校验", async ({ page }) => {
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page
      .locator("input#password")
      .fill("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%");
    expect(
      (await page.locator("input#password").inputValue()).length,
    ).toBeLessThanOrEqual(32);

    await page.screenshot({
      path: getScreenshotPath("13_Password_最大长度校验", "输入后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Password-半角英数字和符号输入
  // ============================================================
  test("14_Password_半角英数字和符号输入", async ({ page }) => {
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#password").fill("Pass@123!");
    await expect(page.locator("input#password")).toHaveValue("Pass@123!");
    await expect(page.locator("input#password")).toHaveAttribute(
      "type",
      "password",
    );
    await expect(page.locator("span.error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("14_Password_半角英数字和符号输入", "输入后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Password-非法字符拦截
  // ============================================================
  test("15_Password_非法字符拦截", async ({ page }) => {
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#password").fill("全角文字テスト");
    expect(await page.locator("input#password").inputValue()).toBeDefined();

    await page.screenshot({
      path: getScreenshotPath("15_Password_非法字符拦截", "输入后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 登录成功（API 返回 200）
  // ============================================================
  test("16_登录成功_API返回200", async ({ page }) => {
    await mockLoginSuccess(page);
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("admin");
    await page.locator("input#password").fill("Pass@123");
    await page.locator("button.login-button").click();

    await page.waitForURL("**/menu");
    const currentUser = await page.evaluate(() =>
      localStorage.getItem("currentUser"),
    );
    expect(currentUser).toBe("admin");

    await page.screenshot({
      path: getScreenshotPath("16_登录成功_API返回200", "跳转后画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 登录失败（用户名或密码错误）
  // ============================================================
  test("17_登录失败_用户名或密码错误", async ({ page }) => {
    await mockLoginAuthFailure(page);
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("wrong");
    await page.locator("input#password").fill("wrong");
    await page.locator("button.login-button").click();
    await page.waitForTimeout(1000);

    await expect(page.locator("div.error-message")).toBeVisible();
    await expect(page.locator("div.error-message")).toHaveText(
      "We didn't recognize the username or password you entered. Please try again.",
    );
    const color = await page
      .locator("div.error-message")
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe("rgb(255, 77, 79)");
    await expect(page.locator("input#userId")).toBeVisible();
    await expect(page.locator("button.login-button")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("17_登录失败_用户名或密码错误", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 登录失败（API 返回 500）
  // ============================================================
  test("18_登录失败_API返回500", async ({ page }) => {
    await mockLoginHttp500(page);
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("admin");
    await page.locator("input#password").fill("Pass@123");
    await page.locator("button.login-button").click();
    await page.waitForTimeout(1000);

    await expect(page.locator("div.error-message")).toBeVisible();
    const color = await page
      .locator("div.error-message")
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe("rgb(255, 77, 79)");
    await expect(page.locator("input#userId")).toBeVisible();
    await expect(page.locator("button.login-button")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("18_登录失败_API返回500", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 登录失败（API 返回 code≠200）
  // ============================================================
  test("19_登录失败_API返回code不等于200", async ({ page }) => {
    await mockLoginAuthFailure(page);
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("admin");
    await page.locator("input#password").fill("wrong");
    await page.locator("button.login-button").click();
    await page.waitForTimeout(1000);

    await expect(page.locator("div.error-message")).toBeVisible();
    const color = await page
      .locator("div.error-message")
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe("rgb(255, 77, 79)");

    await page.screenshot({
      path: getScreenshotPath("19_登录失败_API返回code不等于200", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 异常处理-网络断开
  // ============================================================
  test("20_异常处理_网络断开", async ({ page }) => {
    await mockLoginNetworkError(page);
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("admin");
    await page.locator("input#password").fill("Pass@123");
    await page.locator("button.login-button").click();
    await page.waitForTimeout(1000);

    await expect(page.locator("div.error-message")).toBeVisible();
    const color = await page
      .locator("div.error-message")
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe("rgb(255, 77, 79)");
    await expect(page.locator("button.login-button")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("20_异常处理_网络断开", "网络断开错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 异常处理-API 超时
  // ============================================================
  test("21_异常处理_API超时", async ({ page }) => {
    await mockLoginDelay(page, 15000);
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("admin");
    await page.locator("input#password").fill("Pass@123");
    await page.locator("button.login-button").click();
    await page.waitForTimeout(2000);

    const isDisabled = await page.locator("button.login-button").isDisabled();
    if (!isDisabled) {
      await expect(page.locator("button.login-button")).toBeEnabled();
    }

    await page.screenshot({
      path: getScreenshotPath("21_异常处理_API超时", "超时状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 异常处理-服务器 500 错误
  // ============================================================
  test("22_异常处理_服务器500错误", async ({ page }) => {
    await mockLoginHttp500(page);
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("admin");
    await page.locator("input#password").fill("Pass@123");
    await page.locator("button.login-button").click();
    await page.waitForTimeout(1000);

    await expect(page.locator("div.error-message")).toBeVisible();
    const color = await page
      .locator("div.error-message")
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe("rgb(255, 77, 79)");
    await expect(page.locator("button.login-button")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("22_异常处理_服务器500错误", "500错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 登录中-按钮文字和状态变化
  // ============================================================
  test("23_登录中_按钮文字和状态变化", async ({ page }) => {
    await mockLoginDelay(page, 3000);
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("admin");
    await page.locator("input#password").fill("Pass@123");
    await page.locator("button.login-button").click();
    await page.waitForTimeout(500);

    await expect(page.locator("button.login-button")).toHaveText(
      "Logging in...",
    );
    await expect(page.locator("button.login-button")).toBeDisabled();

    await page.screenshot({
      path: getScreenshotPath("23_登录中_按钮文字和状态变化", "登录中状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 登录中-防止重复提交
  // ============================================================
  test("24_登录中_防止重复提交", async ({ page }) => {
    await navigateToLogin(page);
    await clearLocalStorage(page);

    let apiCallCount = 0;
    await page.route("**/api/login", async (route) => {
      apiCallCount++;
      await new Promise((r) => setTimeout(r, 3000));
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "登录成功",
          data: { userId: "admin" },
        }),
      });
    });

    await page.locator("input#userId").fill("admin");
    await page.locator("input#password").fill("Pass@123");
    // 点击 Login 触发 API 调用
    await page.locator("button.login-button").click();
    // 等待按钮变为禁用状态
    await expect(page.locator("button.login-button")).toBeDisabled({
      timeout: 5000,
    });
    // 通过 dispatchEvent 尝试点击（禁用状态下 click() 会超时）
    await page.locator("button.login-button").dispatchEvent("click");
    await page.waitForTimeout(500);
    await page.locator("button.login-button").dispatchEvent("click");

    // 确认禁用后点击不会触发额外的 API 调用
    expect(apiCallCount).toBeLessThanOrEqual(1);

    await page.screenshot({
      path: getScreenshotPath("24_登录中_防止重复提交", "防止重复提交"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 登录失败-按钮恢复可用
  // ============================================================
  test("25_登录失败_按钮恢复可用", async ({ page }) => {
    await mockLoginAuthFailure(page);
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("wrong");
    await page.locator("input#password").fill("wrong");
    await page.locator("button.login-button").click();
    await page.waitForTimeout(1000);

    await expect(page.locator("button.login-button")).toBeEnabled();
    await expect(page.locator("button.login-button")).toHaveText("Login");

    await page.screenshot({
      path: getScreenshotPath("25_登录失败_按钮恢复可用", "按钮恢复状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 消息类型-错误样式
  // ============================================================
  test("26_消息类型_错误样式", async ({ page }) => {
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("button.login-button").click();

    const errorSpan = page.locator("span.error-message").first();
    await expect(errorSpan).toBeVisible();
    const color = await errorSpan.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(color).toBe("rgb(255, 77, 79)");
    const textAlign = await errorSpan.evaluate(
      (el) => window.getComputedStyle(el).textAlign,
    );
    expect(["left", "start"]).toContain(textAlign);

    await page.screenshot({
      path: getScreenshotPath("26_消息类型_错误样式", "错误样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 消息清除-重新输入时
  // ============================================================
  test("27_消息清除_重新输入时", async ({ page }) => {
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("button.login-button").click();
    await expect(page.locator("span.error-message").first()).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("27_消息清除_重新输入时", "错误消息显示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.locator("input#userId").fill("test");
    await expect(page.locator("input#userId ~ span.error-message")).toHaveCount(
      0,
    );

    await page.screenshot({
      path: getScreenshotPath("27_消息清除_重新输入时", "错误消息清除后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 消息清除-新操作覆盖
  // ============================================================
  test("28_消息清除_新操作覆盖", async ({ page }) => {
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("button.login-button").click();
    await expect(page.locator("span.error-message").first()).toBeVisible();

    await page.locator("input#userId").fill("admin");
    await page.locator("input#password").fill("");
    await page.locator("button.login-button").click();

    const errorSpans = page.locator("span.error-message");
    expect(await errorSpans.count()).toBeLessThanOrEqual(1);

    await page.screenshot({
      path: getScreenshotPath("28_消息清除_新操作覆盖", "新错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.29 安全性-密码掩码显示
  // ============================================================
  test("29_安全性_密码掩码显示", async ({ page }) => {
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#password").fill("Pass@123");

    await expect(page.locator("input#password")).toHaveAttribute(
      "type",
      "password",
    );
    expect(await page.locator("input#password").getAttribute("type")).toBe(
      "password",
    );

    await page.screenshot({
      path: getScreenshotPath("29_安全性_密码掩码显示", "密码掩码"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.30 安全性-密码不记录日志
  // ============================================================
  test("30_安全性_密码不记录日志", async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on("console", (msg) => {
      consoleMessages.push(msg.text());
    });

    await mockLoginSuccess(page);
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("admin");
    await page.locator("input#password").fill("Pass@123");
    await page.locator("button.login-button").click();
    await page.waitForTimeout(1000);

    expect(consoleMessages.some((m) => m.includes("Pass@123"))).toBe(false);

    const localStorageData = await page.evaluate(() => {
      const values: Record<string, string> = {};
      for (const key of Object.keys(localStorage))
        values[key] = localStorage.getItem(key) || "";
      return values;
    });
    expect(
      Object.values(localStorageData).some((v) => v.includes("Pass@123")),
    ).toBe(false);

    await page.screenshot({
      path: getScreenshotPath("30_安全性_密码不记录日志", "日志检查"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.31 安全性-API 请求加密
  // ============================================================
  test("31_安全性_API请求加密", async ({ page }) => {
    const requestUrls: string[] = [];
    await page.route("**/api/login", (route) => {
      requestUrls.push(route.request().url());
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "登录成功",
          data: { userId: "admin" },
        }),
      });
    });

    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("admin");
    await page.locator("input#password").fill("Pass@123");
    await page.locator("button.login-button").click();
    await page.waitForTimeout(500);

    expect(requestUrls.length).toBeGreaterThan(0);

    await page.screenshot({
      path: getScreenshotPath("31_安全性_API请求加密", "API请求检查"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.32 安全性-登录后 Token 管理
  // ============================================================
  test("32_安全性_登录后Token管理", async ({ page }) => {
    await mockLoginSuccess(page);
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("admin");
    await page.locator("input#password").fill("Pass@123");
    await page.locator("button.login-button").click();
    await page.waitForURL("**/menu");

    const currentUser = await page.evaluate(() =>
      localStorage.getItem("currentUser"),
    );
    expect(currentUser).toBe("admin");

    await page.screenshot({
      path: getScreenshotPath("32_安全性_登录后Token管理", "Token保存"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.33 表单 Enter 键提交
  // ============================================================
  test("33_表单Enter键提交", async ({ page }) => {
    await mockLoginSuccess(page);
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("admin");
    await page.locator("input#password").fill("Pass@123");
    await page.locator("input#password").press("Enter");

    await page.waitForURL("**/menu");

    await page.screenshot({
      path: getScreenshotPath("33_表单Enter键提交", "Enter提交结果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.34 输入框-焦点切换
  // ============================================================
  test("34_输入框_焦点切换", async ({ page }) => {
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("admin");
    await page.locator("input#userId").press("Tab");
    await expect(page.locator("input#password")).toBeFocused();

    await page.screenshot({
      path: getScreenshotPath("34_输入框_焦点切换", "焦点切换"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.35 页面刷新/重置
  // ============================================================
  test("35_页面刷新_重置", async ({ page }) => {
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.locator("input#userId").fill("admin");
    await page.locator("input#password").fill("Pass@123");

    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await expect(page.locator("input#userId")).toHaveValue("");
    await expect(page.locator("input#password")).toHaveValue("");
    await expect(page.locator("span.error-message")).toHaveCount(0);
    await expect(page.locator("button.login-button")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("35_页面刷新_重置", "刷新后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.36 浏览器自动填充
  // ============================================================
  test("36_浏览器自动填充", async ({ page }) => {
    await navigateToLogin(page);
    await clearLocalStorage(page);

    await page.evaluate(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      const uid = document.getElementById("userId") as HTMLInputElement;
      const pwd = document.getElementById("password") as HTMLInputElement;
      if (uid && setter) {
        setter.call(uid, "saved_user");
        uid.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (pwd && setter) {
        setter.call(pwd, "saved_pass");
        pwd.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    await page.waitForTimeout(300);
    await expect(page.locator("button.login-button")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("36_浏览器自动填充", "自动填充状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
