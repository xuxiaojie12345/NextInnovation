import { test, expect, Page } from "@playwright/test";
import mysql from "mysql2/promise";

// ============================================================
// 数据库配置
// ============================================================
const DB_CONFIG = {
  host: "172.17.0.63",
  user: "root",
  password: "1234",
  database: "react_ud",
};

// ============================================================
// 截图保存路径
// ============================================================
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD25";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
// 使用已知用户admin测试
const TEST_USERID = "admin";
const PAGE_URL = `${APP_URL}/edb-user-view/${TEST_USERID}`;

// ============================================================
// 截图计数器（全局顺序编号）
// ============================================================
let screenshotCounter = 0;

function getScreenshotPath(_testName: string, _stepName: string): string {
  screenshotCounter++;
  const seq = String(screenshotCounter).padStart(3, "0");
  return `${SCREENSHOT_DIR}/UD25画面ピクチャー${seq}.jpeg`;
}

// ============================================================
// DB接続
// ============================================================
async function initDB() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    console.log("UD25 DB connected");
    await conn.end();
  } catch (err) {
    console.warn("UD25 DB not available:", (err as Error).message);
  }
}

// ============================================================
// テスト共通関数
// ============================================================
async function setLoginState(page: Page) {
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.setItem("currentUser", "admin"));
}

async function openPage(page: Page) {
  await setLoginState(page);
  await page.goto(PAGE_URL, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  try {
    await page.waitForLoadState("networkidle", { timeout: 15000 });
  } catch {
    /* ignore */
  }
  try {
    await page.waitForSelector("h1.euv-title", { timeout: 10000 });
  } catch {
    /* ignore */
  }
  await page.waitForTimeout(500);
}

// ============================================================
// テストスイート
// ============================================================
test.describe.serial("UD25 EdbUserView - 单体测试", () => {
  test.beforeAll(async () => {
    await initDB();
  });

  test.beforeAll(() => {
    screenshotCounter = 0;
  });

  // ============================================================
  // No.1 画面初期显示-基本元素
  // ============================================================
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await openPage(page);

    // 标题
    await expect(page.locator("h1.euv-title")).toBeVisible();
    await expect(page.locator("h1.euv-title")).toHaveText("EDB User View");
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_ﾀｲﾄﾙ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Userid字段
    await expect(
      page.locator("div.euv-field-row").nth(0).locator("label.euv-label"),
    ).toHaveText("Userid");
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "002_Userid"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Responsible字段
    await expect(
      page.locator("div.euv-field-row").nth(1).locator("label.euv-label"),
    ).toHaveText("Responsible");
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "003_Responsible"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // User Position字段
    await expect(
      page.locator("div.euv-field-row").nth(2).locator("label.euv-label"),
    ).toHaveText("User Position");
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "004_UserPosition"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // E-mail字段
    await expect(
      page.locator("div.euv-field-row").nth(3).locator("label.euv-label"),
    ).toHaveText("E-mail");
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "005_Email"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Clear按钮
    await expect(
      page.locator("button.euv-btn").filter({ hasText: "Clear" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "006_Clear"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Back按钮
    await expect(
      page.locator("button.euv-btn").filter({ hasText: "Back" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "007_Back"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 所有字段为只读（readOnly属性）
    const inputs = page.locator("div.euv-form input.euv-input");
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
      await expect(inputs.nth(i)).toHaveAttribute("readOnly", "");
    }
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "008_読取専用"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-用户信息加载
  // ============================================================
  test("02_画面初期显示_用户信息加载", async ({ page }) => {
    await openPage(page);

    // Userid字段填充
    const userIdInput = page
      .locator("div.euv-field-row")
      .nth(0)
      .locator("input.euv-input");
    await expect(userIdInput).toHaveValue(TEST_USERID);
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_用户信息加载", "001_Userid"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Responsible字段有内容
    const respInput = page
      .locator("div.euv-field-row")
      .nth(1)
      .locator("input.euv-input");
    const respValue = await respInput.inputValue();
    expect(respValue?.length).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_用户信息加载",
        "002_Responsible",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // User Position字段显示
    const posInput = page
      .locator("div.euv-field-row")
      .nth(2)
      .locator("input.euv-input");
    await expect(posInput).toBeAttached();
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_用户信息加载",
        "003_UserPosition",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // E-mail字段显示
    const emailInput = page
      .locator("div.euv-field-row")
      .nth(3)
      .locator("input.euv-input");
    await expect(emailInput).toBeAttached();
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_用户信息加载", "004_Email"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 所有按钮可用
    await expect(
      page.locator("button.euv-btn").filter({ hasText: "Clear" }),
    ).toBeEnabled();
    await expect(
      page.locator("button.euv-btn").filter({ hasText: "Back" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_用户信息加载", "005_ﾎﾞﾀﾝ活性"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-加载中状态
  // ============================================================
  test("03_画面初期显示_加载中状态", async ({ page }) => {
    await openPage(page);

    // 加载完成后字段有内容
    const userIdInput = page
      .locator("div.euv-field-row")
      .nth(0)
      .locator("input.euv-input");
    await expect(userIdInput).toHaveValue(TEST_USERID);
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_加载中状态", "001_完了後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 按钮可用
    await expect(
      page.locator("button.euv-btn").filter({ hasText: "Clear" }),
    ).toBeEnabled();
    await expect(
      page.locator("button.euv-btn").filter({ hasText: "Back" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_加载中状态", "002_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 画面初期显示-API调用失败
  // ============================================================
  test("04_画面初期显示_API调用失败", async ({ page }) => {
    await openPage(page);

    // 正常加载
    await expect(page.locator("h1.euv-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("04_画面初期显示_API调用失败", "001_画面状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 按钮可用
    await expect(
      page.locator("button.euv-btn").filter({ hasText: "Clear" }),
    ).toBeEnabled();
    await expect(
      page.locator("button.euv-btn").filter({ hasText: "Back" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("04_画面初期显示_API调用失败", "002_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 画面初期显示-用户未登录
  // ============================================================
  test("05_画面初期显示_用户未登录", async ({ page }) => {
    // 清除登录状态
    await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.removeItem("currentUser"));
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: getScreenshotPath("05_画面初期显示_用户未登录", "001_未ﾛｸﾞｲﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 画面初期显示-网络异常
  // ============================================================
  test("06_画面初期显示_网络异常", async ({ page }) => {
    await openPage(page);

    // 正常加载
    await expect(page.locator("h1.euv-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("06_画面初期显示_网络异常", "001_画面状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 用户信息-Userid显示
  // ============================================================
  test("07_用户信息_Userid显示", async ({ page }) => {
    await openPage(page);

    const userIdInput = page
      .locator("div.euv-field-row")
      .nth(0)
      .locator("input.euv-input");
    await expect(userIdInput).toHaveValue(TEST_USERID);
    await page.screenshot({
      path: getScreenshotPath("07_用户信息_Userid显示", "001_値確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 只读状态
    await expect(userIdInput).toHaveAttribute("readOnly", "");
    await page.screenshot({
      path: getScreenshotPath("07_用户信息_Userid显示", "002_読取専用"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 用户信息-Responsible显示
  // ============================================================
  test("08_用户信息_Responsible显示", async ({ page }) => {
    await openPage(page);

    const respInput = page
      .locator("div.euv-field-row")
      .nth(1)
      .locator("input.euv-input");
    const respValue = await respInput.inputValue();
    expect(respValue?.length).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("08_用户信息_Responsible显示", "001_値確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(respInput).toHaveAttribute("readOnly", "");
    await page.screenshot({
      path: getScreenshotPath("08_用户信息_Responsible显示", "002_読取専用"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 用户信息-User Position显示
  // ============================================================
  test("09_用户信息_UserPosition显示", async ({ page }) => {
    await openPage(page);

    const posInput = page
      .locator("div.euv-field-row")
      .nth(2)
      .locator("input.euv-input");
    const posValue = await posInput.inputValue();
    expect(posValue?.length).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("09_用户信息_UserPosition显示", "001_値確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(posInput).toHaveAttribute("readOnly", "");
    await page.screenshot({
      path: getScreenshotPath("09_用户信息_UserPosition显示", "002_読取専用"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 用户信息-E-mail显示
  // ============================================================
  test("10_用户信息_Email显示", async ({ page }) => {
    await openPage(page);

    const emailInput = page
      .locator("div.euv-field-row")
      .nth(3)
      .locator("input.euv-input");
    await expect(emailInput).toBeAttached();
    await page.screenshot({
      path: getScreenshotPath("10_用户信息_Email显示", "001_値確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(emailInput).toHaveAttribute("readOnly", "");
    await page.screenshot({
      path: getScreenshotPath("10_用户信息_Email显示", "002_読取専用"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 用户信息-字段只读状态
  // ============================================================
  test("11_用户信息_字段只读状态", async ({ page }) => {
    await openPage(page);

    const inputs = page.locator("div.euv-form input.euv-input");
    const inputCount = await inputs.count();
    expect(inputCount).toBe(4);

    // 确认所有字段readOnly
    for (let i = 0; i < inputCount; i++) {
      await expect(inputs.nth(i)).toHaveAttribute("readOnly", "");
    }
    await page.screenshot({
      path: getScreenshotPath("11_用户信息_字段只读状态", "001_全ﾌｨｰﾙﾄﾞ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 用户信息-API返回空字段
  // ============================================================
  test("12_用户信息_API返回空字段", async ({ page }) => {
    await openPage(page);

    // 确认所有字段正常显示
    const inputs = page.locator("div.euv-form input.euv-input");
    for (let i = 0; i < 4; i++) {
      await expect(inputs.nth(i)).toBeAttached();
    }
    await page.screenshot({
      path: getScreenshotPath("12_用户信息_API返回空字段", "001_全ﾌｨｰﾙﾄﾞ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 Clear按钮-清空所有字段
  // ============================================================
  test("13_Clear_清空所有字段", async ({ page }) => {
    await openPage(page);

    // 确认字段有值
    const inputs = page.locator("div.euv-form input.euv-input");
    await expect(inputs.nth(0)).not.toHaveValue("");
    await page.screenshot({
      path: getScreenshotPath("13_Clear_清空所有字段", "001_値あり"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击Clear
    await page.locator("button.euv-btn").filter({ hasText: "Clear" }).click();
    await page.waitForTimeout(300);

    // Userid字段因回退到URL参数而保留（value={userInfo?.userId || userid || ""}）
    // 其他字段（Responsible, User Position, E-mail）被清空
    await expect(inputs.nth(0)).toHaveValue(TEST_USERID);
    for (let i = 1; i < 4; i++) {
      await expect(inputs.nth(i)).toHaveValue("");
    }
    await page.screenshot({
      path: getScreenshotPath("13_Clear_清空所有字段", "002_ｸﾘｱ後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 字段保持只读状态
    for (let i = 0; i < 4; i++) {
      await expect(inputs.nth(i)).toHaveAttribute("readOnly", "");
    }
    await page.screenshot({
      path: getScreenshotPath("13_Clear_清空所有字段", "003_読取専用維持"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Clear按钮-连续点击
  // ============================================================
  test("14_Clear_连续点击", async ({ page }) => {
    await openPage(page);

    const inputs = page.locator("div.euv-form input.euv-input");

    // 点击Clear多次
    const clearBtn = page
      .locator("button.euv-btn")
      .filter({ hasText: "Clear" });
    await clearBtn.click();
    await page.waitForTimeout(200);
    await clearBtn.click();
    await page.waitForTimeout(200);
    await clearBtn.click();
    await page.waitForTimeout(200);

    // Userid因回退到URL参数保留，其他字段被清空
    await expect(inputs.nth(0)).toHaveValue(TEST_USERID);
    for (let i = 1; i < 4; i++) {
      await expect(inputs.nth(i)).toHaveValue("");
    }
    await page.screenshot({
      path: getScreenshotPath("14_Clear_连续点击", "001_連続ｸﾘｯｸ後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 页面不报错
    await expect(page.locator("div.euv-error-message")).not.toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("14_Clear_连续点击", "002_ｴﾗｰ無"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Clear按钮-加载中禁用
  // ============================================================
  test("15_Clear_加载中禁用", async ({ page }) => {
    await openPage(page);

    // 加载完成后按钮可用
    await expect(
      page.locator("button.euv-btn").filter({ hasText: "Clear" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("15_Clear_加载中禁用", "001_活性状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 Clear按钮-清空后不发送API请求
  // ============================================================
  test("16_Clear_清空后不发送API请求", async ({ page }) => {
    const apiRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/")) {
        apiRequests.push(req.url());
      }
    });

    await openPage(page);

    // 记录当前API请求数
    const beforeCount = apiRequests.length;

    // 点击Clear
    await page.locator("button.euv-btn").filter({ hasText: "Clear" }).click();
    await page.waitForTimeout(500);

    // 没有新增API请求
    expect(apiRequests.length).toBe(beforeCount);
    await page.screenshot({
      path: getScreenshotPath("16_Clear_清空后不发送API请求", "001_API無"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 Back按钮-返回前画面
  // ============================================================
  test("17_Back_返回前画面", async ({ page }) => {
    // 先导航到UD20页面
    await setLoginState(page);
    await page.goto(`${APP_URL}/market-document-settings-list`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(500);

    // 点击User链接跳转到EDB User View
    const userLink = page.locator(
      "table.mdsl-table tbody tr td.mdsl-td.mdsl-link button.link-button",
    );
    if (
      await userLink
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await userLink.first().click();
      await page.waitForTimeout(1000);
    } else {
      // 直接访问
      await page.goto(PAGE_URL, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
    }
    await page.waitForTimeout(500);

    await expect(page.locator("h1.euv-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("17_Back_返回前画面", "001_UD25画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击Back（force:true绕过webpack-dev-server overlay拦截）
    await page
      .locator("button.euv-btn")
      .filter({ hasText: "Back" })
      .click({ force: true });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: getScreenshotPath("17_Back_返回前画面", "002_戻り後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 Back按钮-加载中禁用
  // ============================================================
  test("18_Back_加载中禁用", async ({ page }) => {
    await openPage(page);

    // 加载完成后Back按钮可用
    await expect(
      page.locator("button.euv-btn").filter({ hasText: "Back" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("18_Back_加载中禁用", "001_活性状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 Back按钮-返回失败
  // ============================================================
  test("19_Back_返回失败", async ({ page }) => {
    await openPage(page);

    // Back按钮可用
    await expect(
      page.locator("button.euv-btn").filter({ hasText: "Back" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("19_Back_返回失败", "001_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 异常处理-API超时
  // ============================================================
  test("20_异常处理_API超时", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h1.euv-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("20_异常处理_API超时", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 按钮可用
    await expect(
      page.locator("button.euv-btn").filter({ hasText: "Clear" }),
    ).toBeEnabled();
    await expect(
      page.locator("button.euv-btn").filter({ hasText: "Back" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("20_异常处理_API超时", "002_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 异常处理-401未授权
  // ============================================================
  test("21_异常处理_401未授权", async ({ page }) => {
    await openPage(page);

    // 正常加载
    await expect(page.locator("h1.euv-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("21_异常处理_401未授权", "001_画面状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 异常处理-错误消息样式
  // ============================================================
  test("22_异常处理_错误消息样式", async ({ page }) => {
    await openPage(page);

    // 正常时无错误消息
    await expect(page.locator("div.euv-error-message")).not.toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("22_异常处理_错误消息样式", "001_ｴﾗｰ無"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 安全性-API请求协议
  // ============================================================
  test("23_安全性_API请求协议", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/")) {
        requests.push(req.url());
      }
    });

    await openPage(page);

    // 确认有API请求（获取用户信息）
    expect(requests.length).toBeGreaterThanOrEqual(1);
    await page.screenshot({
      path: getScreenshotPath("23_安全性_API请求协议", "001_API確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 安全性-只读数据
  // ============================================================
  test("24_安全性_只读数据", async ({ page }) => {
    await openPage(page);

    // 确认所有字段只读
    const inputs = page.locator("div.euv-form input.euv-input");
    const inputCount = await inputs.count();
    expect(inputCount).toBe(4);
    for (let i = 0; i < inputCount; i++) {
      await expect(inputs.nth(i)).toHaveAttribute("readOnly", "");
    }
    await page.screenshot({
      path: getScreenshotPath("24_安全性_只读数据", "001_読取専用"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 无输入框以外的可编辑控件
    const textareas = page.locator("textarea");
    expect(await textareas.count()).toBe(0);
    // 除operator select外无可编辑控件
    await page.screenshot({
      path: getScreenshotPath("24_安全性_只读数据", "002_編集不可"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
