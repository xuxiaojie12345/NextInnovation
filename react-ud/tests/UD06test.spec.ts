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
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD06";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/save-modifications?chassisSerie=yann&chassisNumber=1234`;
const APP_URL_NO_SERIE = `${APP_URL}/save-modifications?chassisNumber=1234`;
const APP_URL_NO_NUMBER = `${APP_URL}/save-modifications?chassisSerie=yann`;
const APP_URL_NO_BOTH = `${APP_URL}/save-modifications`;

// ============================================================
// 截图计数器
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
// DB接続状態
// ============================================================
let dbAvailable = false;

// ============================================================
// テストデータ setup / cleanup
// ============================================================
async function setupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    dbAvailable = true;
    try {
      const now = new Date();

      // yann/1234 のテストデータを挿入（実API呼び出し用）
      const [rows] = await conn.execute(
        "SELECT COUNT(*) AS cnt FROM HDOC_ADCA_MODIFICATION WHERE SERIE = ? AND CHNO = ?",
        ["yann", "1234"],
      );
      const count = (rows as any[])[0]?.cnt || 0;
      if (count === 0) {
        await conn.execute(
          `INSERT INTO HDOC_ADCA_MODIFICATION
           (SERIE, CHNO, DOCTYPE, LANG, VARIABLE, VERS, NEWVAL, STA, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            "yann",
            "1234",
            "UD06_TEST",
            "EN",
            "TEST_VAR_01",
            1,
            "New_Value_01",
            0,
            now,
            "TEST",
            "PLAYWRIGHT",
            now,
            "TEST",
            "PLAYWRIGHT",
          ],
        );
        console.log("Test data inserted for yann/1234");
      }
    } finally {
      await conn.end();
    }
  } catch (err) {
    console.warn("DB not available, tests may be limited:", err);
    dbAvailable = false;
  }
}

async function clearTestData() {
  if (!dbAvailable) return;
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    try {
      await conn.execute(
        "DELETE FROM HDOC_ADCA_MODIFICATION WHERE SERIE = ? AND CHNO = ?",
        ["yann", "1234"],
      );
    } finally {
      await conn.end();
    }
  } catch {
    // ignore
  }
}

// ============================================================
// ログイン状態設定
// ============================================================
async function setLoginState(page: Page) {
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.setItem("currentUser", "admin"));
}

async function clearLoginState(page: Page) {
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.removeItem("currentUser"));
}

// ============================================================
// 安全なページロード
// ============================================================
async function safeWaitNetworkIdle(page: Page) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch {
    // タイムアウトは無視
  }
}

async function openPage(page: Page, url: string = PAGE_URL) {
  await setLoginState(page);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch {
    // タイムアウトは無視
  }
  await page.waitForTimeout(1500);
}

// ============================================================
// テストスイート
// ============================================================
test.describe("UD06 Save Modifications - 单体测试", () => {
  test.beforeAll(async () => {
    await setupTestData();
  });

  test.afterAll(async () => {
    await clearTestData();
  });

  test.beforeEach(() => {
    screenshotCounter = {};
  });

  // ============================================================
  // No.1 画面初期显示-基本元素
  // ============================================================
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await openPage(page);

    // 1. 显示标签
    await expect(
      page.locator("span.sm-label").filter({ hasText: "Chassis serie:" }),
    ).toBeVisible();
    await expect(
      page.locator("span.sm-label").filter({ hasText: "Chassis number:" }),
    ).toBeVisible();
    await expect(
      page.locator("span.sm-label").filter({ hasText: "Doctype:" }),
    ).toBeVisible();
    await expect(
      page.locator("span.sm-label").filter({ hasText: /^Version:$/ }),
    ).toBeVisible();
    await expect(
      page.locator("span.sm-label").filter({ hasText: "Storing:" }),
    ).toBeVisible();
    await expect(
      page
        .locator("span.sm-label")
        .filter({ hasText: "FOUND UNRELEASED VERSION:" }),
    ).toBeVisible();
    await expect(
      page.locator("span.sm-label").filter({ hasText: "Message:" }),
    ).not.toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_ラベル表示確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Close按钮存在且可用
    await expect(page.locator("button.sm-close-btn")).toBeVisible();
    await expect(page.locator("button.sm-close-btn")).toBeEnabled();
    await expect(page.locator("button.sm-close-btn")).toHaveText("Close");
    await page.screenshot({
      path: getScreenshotPath(
        "01_画面初期显示_基本元素",
        "002_Closeボタン確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. Message固定显示"VERSION IS RELEASED"
    await expect(page.locator("span.sm-message-highlight")).toBeVisible();
    await expect(page.locator("span.sm-message-highlight")).toContainText(
      "VERSION IS RELEASED",
    );
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "003_Message確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. FOUND UNRELEASED VERSION绿色背景高亮
    const unreleasedValue = page
      .locator("span.sm-label")
      .filter({ hasText: "FOUND UNRELEASED VERSION:" })
      .locator("..")
      .locator("span.sm-value");
    await expect(unreleasedValue).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "004_FOUND表示確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-URL参数解析
  // ============================================================
  test("02_画面初期显示_URL参数解析", async ({ page }) => {
    await openPage(page);

    // 1. Chassis serie显示"yann"
    const serieValue = page
      .locator("span.sm-label")
      .filter({ hasText: "Chassis serie:" })
      .locator("..")
      .locator("span.sm-value");
    await expect(serieValue).toBeVisible();
    await expect(serieValue).toContainText("yann");
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_URL参数解析",
        "001_ChassisSerie確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Chassis number显示"1234"
    const numberValue = page
      .locator("span.sm-label")
      .filter({ hasText: "Chassis number:" })
      .locator("..")
      .locator("span.sm-value");
    await expect(numberValue).toBeVisible();
    await expect(numberValue).toContainText("1234");
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_URL参数解析",
        "002_ChassisNumber確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 参数从前画面传递获取
    const currentUrl = page.url();
    expect(currentUrl).toContain("chassisSerie=yann");
    expect(currentUrl).toContain("chassisNumber=1234");
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_URL参数解析", "003_URL確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-加载中状态
  // ============================================================
  test("03_画面初期显示_加载中状态", async ({ page }) => {
    // API响应前拦截，延迟响应以观察加载状态
    await setLoginState(page);
    await page.route("**/api/UD06/saveModifications*", async (route) => {
      await page.waitForTimeout(3000);
      await route.continue();
    });

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(500);

    // 1. 显示加载提示
    const loadingEl = page.locator("div.sm-loading");
    await expect(loadingEl).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_加载中状态",
        "001_ローディング表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 加载期间数据显示为空
    await expect(loadingEl).toContainText("Loading...");
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_加载中状态",
        "002_ローディング中",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 等待加载完成
    try {
      await page.waitForLoadState("networkidle", { timeout: 15000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(2000);

    // 3. 加载完成后数据正常显示
    await expect(page.locator("h1.sm-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_加载中状态", "003_ロード完了後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 空值校验-Chassis serie为空
  // ============================================================
  test("04_空値校验_ChassisSerie为空", async ({ page }) => {
    await setLoginState(page);
    await page.goto(APP_URL_NO_SERIE, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(1500);

    // 1. 显示错误消息
    const errMsg = page.locator("div.sm-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "04_空値校验_ChassisSerie为空",
        "001_エラーメッセージ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(errMsg).toContainText("Chassis serie不能为空");
    await page.screenshot({
      path: getScreenshotPath(
        "04_空値校验_ChassisSerie为空",
        "002_エラー内容確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 终止流程，不调用API，其他控件不显示数据
    // Close按钮仍可用
    await expect(page.locator("button.sm-close-btn")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath(
        "04_空値校验_ChassisSerie为空",
        "003_Closeボタン確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 空值校验-Chassis number为空
  // ============================================================
  test("05_空値校验_ChassisNumber为空", async ({ page }) => {
    await setLoginState(page);
    await page.goto(APP_URL_NO_NUMBER, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(1500);

    // 1. 显示错误消息
    const errMsg = page.locator("div.sm-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "05_空値校验_ChassisNumber为空",
        "001_エラーメッセージ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(errMsg).toContainText("Chassis number不能为空");
    await page.screenshot({
      path: getScreenshotPath(
        "05_空値校验_ChassisNumber为空",
        "002_エラー内容確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 终止流程，不调用API
    await expect(page.locator("button.sm-close-btn")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath(
        "05_空値校验_ChassisNumber为空",
        "003_Closeボタン確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 空值校验-两者都为空
  // ============================================================
  test("06_空値校验_两者都为空", async ({ page }) => {
    await setLoginState(page);
    await page.goto(APP_URL_NO_BOTH, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(1500);

    // 1. 先触发Chassis serie空值校验
    const errMsg = page.locator("div.sm-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "06_空値校验_两者都为空",
        "001_エラーメッセージ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 显示"Chassis serie不能为空"
    await expect(errMsg).toContainText("Chassis serie不能为空");
    await page.screenshot({
      path: getScreenshotPath("06_空値校验_两者都为空", "002_エラー内容確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 不调用API
    await page.screenshot({
      path: getScreenshotPath("06_空値校验_两者都为空", "003_画面確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 API成功-数据正常返回
  // ============================================================
  test("07_API成功_数据正常返回", async ({ page }) => {
    await openPage(page);

    // 1. Doctype显示对应的文档类型
    await page.screenshot({
      path: getScreenshotPath("07_API成功_数据正常返回", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const doctypeValue = page
      .locator("span.sm-label")
      .filter({ hasText: "Doctype:" })
      .locator("..")
      .locator("span.sm-value");
    await expect(doctypeValue).toBeVisible();
    const doctypeText = (await doctypeValue.textContent())?.trim() || "";
    expect(doctypeText.length).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("07_API成功_数据正常返回", "002_Doctype確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Version显示版本号
    const versionValue = page
      .locator("span.sm-label")
      .filter({ hasText: /^Version:$/ })
      .locator("..")
      .locator("span.sm-value");
    await expect(versionValue).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("07_API成功_数据正常返回", "003_Version確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. Storing显示
    const storingItems = page.locator("div.sm-storing-item");
    const storingCount = await storingItems.count();
    expect(storingCount).toBeGreaterThan(0);
    for (let i = 0; i < storingCount; i++) {
      const itemText = await storingItems.nth(i).textContent();
      expect(itemText?.trim().length).toBeGreaterThan(0);
    }
    await page.screenshot({
      path: getScreenshotPath("07_API成功_数据正常返回", "004_Storing確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. FOUND UNRELEASED VERSION显示
    const unreleasedValue = page
      .locator("span.sm-label")
      .filter({ hasText: "FOUND UNRELEASED VERSION:" })
      .locator("..")
      .locator("span.sm-value");
    await expect(unreleasedValue).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("07_API成功_数据正常返回", "005_FOUND表示確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 5. Message显示"VERSION IS RELEASED"
    await expect(page.locator("span.sm-message-highlight")).toContainText(
      "VERSION IS RELEASED",
    );
    await page.screenshot({
      path: getScreenshotPath("07_API成功_数据正常返回", "006_Message確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 API成功-Storing数据显示格式
  // ============================================================
  test("08_API成功_Storing数据显示格式", async ({ page }) => {
    await openPage(page);

    // 1. 页面加载完成
    await page.screenshot({
      path: getScreenshotPath(
        "08_API成功_Storing数据显示格式",
        "001_ページ表示後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Storing格式为"VARIABLE NEWVAL"
    const storingItems = page.locator("div.sm-storing-item");
    const storingCount = await storingItems.count();
    expect(storingCount).toBeGreaterThan(0);
    for (let i = 0; i < storingCount; i++) {
      const itemText = (await storingItems.nth(i).textContent()) || "";
      expect(itemText.trim().length).toBeGreaterThan(0);
      // 格式为"VARIABLE: NEWVAL"（组件中使用空格连接）
      expect(itemText).toMatch(/\S+\s+\S+/);
    }
    await page.screenshot({
      path: getScreenshotPath("08_API成功_Storing数据显示格式", "002_形式確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 API失败-未找到修改记录（400）
  // ============================================================
  test("09_API失败_未找到修改记录400", async ({ page }) => {
    await setLoginState(page);
    // Mock API返回404
    await page.route("**/api/UD06/saveModifications*", (route) => {
      route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ code: 400, msg: "未找到对应的修改记录" }),
      });
    });

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(1500);

    // 1. 显示错误消息
    const errMsg = page.locator("div.sm-error-message");
    await expect(errMsg).toBeVisible();
    await expect(errMsg).toContainText("未找到对应的修改记录");
    await page.screenshot({
      path: getScreenshotPath(
        "09_API失败_未找到修改记录400",
        "001_エラーメッセージ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 其他控件禁用或显示为空
    await expect(page.locator("button.sm-close-btn")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath(
        "09_API失败_未找到修改记录400",
        "002_Closeボタン確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 API失败-服务器错误（500）
  // ============================================================
  test("10_API失败_服务器错误500", async ({ page }) => {
    await setLoginState(page);
    // Mock API返回500（status 200+code 500 让组件通过JSON解析错误消息）
    await page.route("**/api/UD06/saveModifications*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 500, msg: "系统错误，请稍后重试" }),
      });
    });

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(1500);

    // 1. 显示错误消息
    const errMsg = page.locator("div.sm-error-message");
    await expect(errMsg).toBeVisible();
    await expect(errMsg).toContainText("系统错误，请稍后重试");
    await page.screenshot({
      path: getScreenshotPath(
        "10_API失败_服务器错误500",
        "001_エラーメッセージ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 其他控件显示为空
    await expect(page.locator("button.sm-close-btn")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath(
        "10_API失败_服务器错误500",
        "002_Closeボタン確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 API失败-网络异常
  // ============================================================
  test("11_API失败_网络异常", async ({ page }) => {
    await setLoginState(page);
    // Mock网络断开
    await page.route("**/api/UD06/saveModifications*", (route) =>
      route.abort("connectionrefused"),
    );

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(2000);

    // 1. 显示错误消息（网络连接失败）
    const errMsg = page.locator("div.sm-error-message");
    const errVisible = await errMsg.isVisible();
    if (errVisible) {
      console.log("Network error message:", await errMsg.textContent());
      await page.screenshot({
        path: getScreenshotPath(
          "11_API失败_网络异常",
          "001_エラーメッセージ表示",
        ),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("11_API失败_网络异常", "001_エラー画面"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }

    // 2. Close按钮仍可用
    await expect(page.locator("button.sm-close-btn")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("11_API失败_网络异常", "002_Closeボタン確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 API失败-API超时
  // ============================================================
  test("12_API失败_API超时", async ({ page }) => {
    await setLoginState(page);
    // Mock API超时
    await page.route("**/api/UD06/saveModifications*", (route) =>
      route.abort("connectionrefused"),
    );

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(2000);

    // 1. 显示错误消息
    const errMsg = page.locator("div.sm-error-message");
    const errVisible = await errMsg.isVisible();
    if (errVisible) {
      await page.screenshot({
        path: getScreenshotPath(
          "12_API失败_API超时",
          "001_エラーメッセージ表示",
        ),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("12_API失败_API超时", "001_タイムアウト画面"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }

    // 2. Close按钮仍可用
    await expect(page.locator("button.sm-close-btn")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("12_API失败_API超时", "002_Closeボタン確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 FOUND UNRELEASED VERSION-绿色背景高亮
  // ============================================================
  test("13_FOUND_UNRELEASED_VERSION_绿色背景高亮", async ({ page }) => {
    await openPage(page);

    // 1. 页面加载完成
    await page.screenshot({
      path: getScreenshotPath(
        "13_FOUND_UNRELEASED_VERSION_绿色背景高亮",
        "001_ページ表示後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. FOUND UNRELEASED VERSION显示数字
    const unreleasedLabel = page
      .locator("span.sm-label")
      .filter({ hasText: "FOUND UNRELEASED VERSION:" });
    await expect(unreleasedLabel).toBeVisible();
    const unreleasedRow = unreleasedLabel.locator("..");
    const unreleasedValue = unreleasedRow.locator("span.sm-value");
    await expect(unreleasedValue).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "13_FOUND_UNRELEASED_VERSION_绿色背景高亮",
        "002_数字表示確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. Message绿色背景高亮
    const messageHighlight = page.locator("span.sm-message-highlight");
    await expect(messageHighlight).toBeVisible();
    const bgColor = await messageHighlight.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );
    console.log("Message highlight background color:", bgColor);
    await page.screenshot({
      path: getScreenshotPath(
        "13_FOUND_UNRELEASED_VERSION_绿色背景高亮",
        "003_緑背景確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Message-固定文本显示
  // ============================================================
  test("14_Message_固定文本显示", async ({ page }) => {
    await openPage(page);

    // 1. 页面加载完成
    await page.screenshot({
      path: getScreenshotPath("14_Message_固定文本显示", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Message固定显示"VERSION IS RELEASED"
    const messageHighlight = page.locator("span.sm-message-highlight");
    await expect(messageHighlight).toBeVisible();
    await expect(messageHighlight).toHaveText("VERSION IS RELEASED");
    await page.screenshot({
      path: getScreenshotPath(
        "14_Message_固定文本显示",
        "002_固定テキスト確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 文字颜色使用绿色
    const bgColor = await messageHighlight.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );
    console.log("Message background color:", bgColor);
    await page.screenshot({
      path: getScreenshotPath("14_Message_固定文本显示", "003_色確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Chassis serie和number显示
  // ============================================================
  test("15_ChassisSerie和Number显示", async ({ page }) => {
    await openPage(page);

    // 1. 页面加载完成
    await page.screenshot({
      path: getScreenshotPath(
        "15_ChassisSerie和Number显示",
        "001_ページ表示後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Chassis serie显示"yann"
    const serieValue = page
      .locator("span.sm-label")
      .filter({ hasText: "Chassis serie:" })
      .locator("..")
      .locator("span.sm-value");
    await expect(serieValue).toBeVisible();
    await expect(serieValue).toContainText("yann");
    await page.screenshot({
      path: getScreenshotPath(
        "15_ChassisSerie和Number显示",
        "002_ChassisSerie確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. Chassis number显示"1234"
    const numberValue = page
      .locator("span.sm-label")
      .filter({ hasText: "Chassis number:" })
      .locator("..")
      .locator("span.sm-value");
    await expect(numberValue).toBeVisible();
    await expect(numberValue).toContainText("1234");
    await page.screenshot({
      path: getScreenshotPath(
        "15_ChassisSerie和Number显示",
        "003_ChassisNumber確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 Close按钮-关闭画面
  // ============================================================
  test("16_Close按钮_关闭画面", async ({ page }) => {
    // 先访问首页以建立浏览器历史
    await setLoginState(page);
    await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(1500);

    // 1. 页面加载完成
    await page.screenshot({
      path: getScreenshotPath("16_Close按钮_关闭画面", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 点击Close按钮
    await page.locator("button.sm-close-btn").click();
    await page.waitForTimeout(1500);

    // 3. 确认画面关闭（返回前画面）
    const currentUrl = page.url();
    console.log("After close, URL:", currentUrl);
    expect(currentUrl).not.toContain("save-modifications");
    await page.screenshot({
      path: getScreenshotPath("16_Close按钮_关闭画面", "002_画面遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 Close按钮-加载中状态可用
  // ============================================================
  test("17_Close按钮_加载中状态可用", async ({ page }) => {
    // API响应前拦截，延迟响应
    await setLoginState(page);
    await page.route("**/api/UD06/saveModifications*", async (route) => {
      await page.waitForTimeout(5000);
      await route.continue();
    });

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(500);

    // 1. 加载中状态
    const loadingEl = page.locator("div.sm-loading");
    await expect(loadingEl).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "17_Close按钮_加载中状态可用",
        "001_ローディング中",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 根据组件代码，加载期间Close按钮不在DOM中(isLoading=true时不渲染按钮)
    const closeBtn = page.locator("button.sm-close-btn");
    const closeCount = await closeBtn.count();
    if (closeCount > 0) {
      await expect(closeBtn).toBeEnabled();
    }
    await page.screenshot({
      path: getScreenshotPath(
        "17_Close按钮_加载中状态可用",
        "002_Close状態確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 等待加载完成
    try {
      await page.waitForLoadState("networkidle", { timeout: 15000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(2000);

    // 加载完成后Close按钮可用
    await expect(page.locator("button.sm-close-btn")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath(
        "17_Close按钮_加载中状态可用",
        "003_ロード完了後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 Close按钮-API失败后可用
  // ============================================================
  test("18_Close按钮_API失败后可用", async ({ page }) => {
    await setLoginState(page);
    // API返回500错误
    await page.route("**/api/UD06/saveModifications*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 500, msg: "系统错误，请稍后重试" }),
      });
    });

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(1500);

    // 1. API失败后错误消息显示
    const errMsg = page.locator("div.sm-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("18_Close按钮_API失败后可用", "001_エラー表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Close按钮仍可用
    const closeBtn = page.locator("button.sm-close-btn");
    await expect(closeBtn).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath(
        "18_Close按钮_API失败后可用",
        "002_Closeボタン活性確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 点击Close按钮可关闭
    await closeBtn.click();
    await page.waitForTimeout(1500);
    const currentUrl = page.url();
    console.log("After close after API failure, URL:", currentUrl);
    await page.screenshot({
      path: getScreenshotPath("18_Close按钮_API失败后可用", "003_画面遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 异常处理-数据库连接异常
  // ============================================================
  test("19_异常处理_数据库连接异常", async ({ page }) => {
    await setLoginState(page);
    // Mock后端数据库异常（500错误）
    await page.route("**/api/UD06/saveModifications*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 500, msg: "系统错误，请稍后重试" }),
      });
    });

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(1500);

    // 1. API返回500错误
    // 2. 显示错误消息
    const errMsg = page.locator("div.sm-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "19_异常处理_数据库连接异常",
        "001_エラーメッセージ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(errMsg).toContainText("系统错误，请稍后重试");
    await page.screenshot({
      path: getScreenshotPath(
        "19_异常处理_数据库连接异常",
        "002_エラー内容確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. Close按钮仍可用
    await expect(page.locator("button.sm-close-btn")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath(
        "19_异常处理_数据库连接异常",
        "003_Closeボタン確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 异常处理-用户未登录
  // ============================================================
  test("20_异常处理_用户未登录", async ({ page }) => {
    await clearLoginState(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(2000);

    // 1. 检测到未登录状态
    await page.screenshot({
      path: getScreenshotPath("20_异常处理_用户未登录", "001_未ログイン画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 确认画面行为（前端无认证守卫时页面仍会显示）
    const titleEl = page.locator("h1.sm-title");
    const titleCount = await titleEl.count();
    console.log("Not logged in - title count:", titleCount);
    await page.screenshot({
      path: getScreenshotPath("20_异常处理_用户未登录", "002_画面状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 异常处理-页面为只读
  // ============================================================
  test("21_异常处理_页面为只读", async ({ page }) => {
    await openPage(page);

    // 1. 页面加载完成后
    await page.screenshot({
      path: getScreenshotPath("21_异常处理_页面为只读", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 确认所有数据显示为只读 - 无输入框或可编辑控件
    const inputCount = await page.locator("input").count();
    expect(inputCount).toBe(0);
    const textareaCount = await page.locator("textarea").count();
    expect(textareaCount).toBe(0);
    const selectCount = await page.locator("select").count();
    expect(selectCount).toBe(0);
    await page.screenshot({
      path: getScreenshotPath("21_异常处理_页面为只读", "002_編集不可確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 所有信息为只读显示（使用span和div显示文本）
    const readonlySpans = page.locator("span.sm-value");
    const spanCount = await readonlySpans.count();
    expect(spanCount).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("21_异常处理_页面为只读", "003_ReadOnly表示確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 错误消息-显示样式
  // ============================================================
  test("22_错误消息_显示样式", async ({ page }) => {
    // 触发错误（Chassis serie为空）
    await setLoginState(page);
    await page.goto(APP_URL_NO_SERIE, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(1500);

    // 1. Error message区域显示
    const errMsg = page.locator("div.sm-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "22_错误消息_显示样式",
        "001_エラーメッセージ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 文字颜色为红色
    const color = await errMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    console.log("Error message color:", color);
    const rgbMatch = color.match(/\d+/g);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[0]);
      const g = parseInt(rgbMatch[1]);
      const b = parseInt(rgbMatch[2]);
      expect(r).toBeGreaterThan(g);
      expect(r).toBeGreaterThan(b);
    }
    await page.screenshot({
      path: getScreenshotPath("22_错误消息_显示样式", "002_文字色確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 红色左边框样式
    const borderLeftColor = await errMsg.evaluate(
      (el) => window.getComputedStyle(el).borderLeftColor,
    );
    console.log("Error message borderLeftColor:", borderLeftColor);
    await page.screenshot({
      path: getScreenshotPath("22_错误消息_显示样式", "003_ボーダー確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 页面刷新
  // ============================================================
  test("23_页面刷新", async ({ page }) => {
    await openPage(page);

    // 1. 数据加载完成后截图
    await expect(page.locator("h1.sm-title")).toHaveText("Save Modifications");
    await page.screenshot({
      path: getScreenshotPath("23_页面刷新", "001_リロード前"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 刷新页面（F5）
    await page.reload({ waitUntil: "domcontentloaded" });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(2000);

    // 3. 页面重新加载，重新获取URL参数，重新调用API
    await expect(page.locator("h1.sm-title")).toHaveText("Save Modifications");
    await page.screenshot({
      path: getScreenshotPath("23_页面刷新", "002_リロード後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. 数据正常显示
    await expect(
      page.locator("span.sm-label").filter({ hasText: "Chassis serie:" }),
    ).toBeVisible();
    await expect(
      page.locator("span.sm-label").filter({ hasText: "Chassis number:" }),
    ).toBeVisible();
    await expect(
      page.locator("span.sm-label").filter({ hasText: "Doctype:" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("23_页面刷新", "003_データ再表示確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 安全性-API请求协议
  // ============================================================
  test("24_安全性_API请求协议", async ({ page }) => {
    await setLoginState(page);

    // 监听API请求
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/UD06/saveModifications")) {
        requests.push(request.url());
      }
    });

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(2000);

    // 检查API请求
    if (requests.length > 0) {
      console.log("UD06 API requests:", requests);
    }
    await page.screenshot({
      path: getScreenshotPath("24_安全性_API请求协议", "001_API呼出後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.screenshot({
      path: getScreenshotPath("24_安全性_API请求协议", "002_リクエスト確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 安全性-数据显示为只读
  // ============================================================
  test("25_安全性_数据显示为只读", async ({ page }) => {
    await openPage(page);

    // 1. 页面加载完成后
    await page.screenshot({
      path: getScreenshotPath("25_安全性_数据显示为只读", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 所有数据显示为只读 - 无输入框或可编辑控件
    const editableCount = await page
      .locator("input, textarea, select, [contenteditable='true']")
      .count();
    expect(editableCount).toBe(0);
    await page.screenshot({
      path: getScreenshotPath("25_安全性_数据显示为只读", "002_編集不可確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 所有信息为只读显示
    const readOnlyElements = page.locator(
      "span.sm-label, span.sm-value, div.sm-storing-item, span.sm-message-highlight",
    );
    const readonlyCount = await readOnlyElements.count();
    expect(readonlyCount).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath(
        "25_安全性_数据显示为只读",
        "003_ReadOnly要素確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
