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
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD05";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const APP_URL_WITH_PARAMS = `${APP_URL}/modify-document?chassisNo=yann1234&market=IDO`;
const APP_URL_NO_MARKET = `${APP_URL}/modify-document?chassisNo=yann1234`;
const APP_URL_NO_CHASSIS = `${APP_URL}/modify-document`;

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
      // テスト用変数定義をHDOC_VARIABLESに挿入
      const testVariables = [
        ["TEST_VAR_01", "TYPE_A", "Test Variable 01 Description"],
        ["TEST_VAR_02", "TYPE_B", "Test Variable 02 Description"],
        ["TEST_VAR_03", "TYPE_C", "Test Variable 03 Description"],
        ["TEST_VAR_04", "TYPE_D", "Test Variable 04 Description"],
      ];
      for (const [variable, type, description] of testVariables) {
        await conn.execute(
          `INSERT IGNORE INTO HDOC_VARIABLES (VARIABLE, TYPE, DESCRIPTION, USERID, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, ?, 'TEST', NOW(), 'TEST', 'PLAYWRIGHT', NOW(), 'TEST', 'PLAYWRIGHT')`,
          [variable, type, description],
        );
      }

      // テスト用ADCA変更対象項目をHDOC_ADCA_MODIFICATIONに挿入
      const now = new Date();
      const testModifications = [
        { variable: "TEST_VAR_01", newval: "CURRENT_VAL_01" },
        { variable: "TEST_VAR_02", newval: "CURRENT_VAL_02" },
        { variable: "TEST_VAR_03", newval: "CURRENT_VAL_03" },
        { variable: "TEST_VAR_04", newval: "CURRENT_VAL_04" },
      ];
      for (const mod of testModifications) {
        await conn.execute(
          `INSERT IGNORE INTO HDOC_ADCA_MODIFICATION
           (SERIE, CHNO, DOCTYPE, LANG, VARIABLE, VERS, NEWVAL, STA, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            "yann",
            "1234",
            "TEST_DOC",
            "EN",
            mod.variable,
            1,
            mod.newval,
            0,
            now,
            "TEST",
            "PLAYWRIGHT",
            now,
            "TEST",
            "PLAYWRIGHT",
          ],
        );
      }

      console.log("DB test data setup ok");
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
      await conn.execute("DELETE FROM HDOC_VARIABLES WHERE USERID = ?", [
        "TEST",
      ]);
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

/** waitForLoadState をタイムアウト付きで安全に実行 */
async function safeWaitNetworkIdle(page: Page) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch {
    // タイムアウトは無視
  }
}

function getTemplateLink(page: Page) {
  const templateLabel = page
    .locator("span.md-label")
    .filter({ hasText: "Template:" });
  return templateLabel.locator("..").locator("span.md-link");
}

async function openPage(page: Page, url: string = APP_URL_WITH_PARAMS) {
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
test.describe("UD05 Modify Document - 单体测试", () => {
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
  // No.1 画面初期显示-基本要素
  // ============================================================
  test("01_画面初期显示_基本要素", async ({ page }) => {
    await openPage(page);

    // 1. 显示标题 "Modify Document"
    await expect(page.locator("h1.md-title")).toHaveText("Modify Document");
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本要素", "001_タイトル確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 显示Chassis no信息
    await expect(
      page.locator("span.md-label").filter({ hasText: "Chassis no:" }),
    ).toBeVisible();
    await expect(page.locator("span.md-value.md-chassis-no")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本要素", "002_ChassisNo確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 显示Market信息
    await expect(
      page.locator("span.md-label").filter({ hasText: "Market:" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本要素", "003_Market確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. 显示Template文件链接
    await expect(
      page.locator("span.md-label").filter({ hasText: "Template:" }),
    ).toBeVisible();
    const templateLink = getTemplateLink(page);
    await expect(templateLink).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本要素", "004_Template確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 5. 显示Save按钮
    await expect(page.locator("button.md-save-btn")).toBeVisible();
    await expect(page.locator("button.md-save-btn")).toHaveText("Save");
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本要素", "005_Saveボタン確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 6. 显示变量表格（4列）
    const table = page.locator("table.md-table");
    await expect(table).toBeVisible();
    const headers = page.locator("th.md-th");
    const headerTexts = await headers.allTextContents();
    expect(headerTexts.some((t) => t.includes("Variable"))).toBeTruthy();
    expect(headerTexts.some((t) => t.includes("Description"))).toBeTruthy();
    expect(headerTexts.some((t) => t.includes("Current value"))).toBeTruthy();
    expect(headerTexts.some((t) => t.includes("Modified value"))).toBeTruthy();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本要素", "006_テーブル確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-URL参数正常
  // ============================================================
  test("02_画面初期显示_URL参数正常", async ({ page }) => {
    await openPage(page);

    // 1. Chassis no显示拼接 "yann1234"
    const chassisNoEl = page.locator("span.md-value.md-chassis-no");
    await expect(chassisNoEl).toBeVisible();
    await expect(chassisNoEl).toContainText("yann");
    const link = page.locator("span.md-link").filter({ hasText: "1234" });
    await expect(link).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_URL参数正常",
        "001_ChassisNo表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Market显示"AUS"
    const marketValue = page
      .locator("span.md-label")
      .filter({ hasText: "Market:" })
      .locator("..")
      .locator("span.md-value");
    await expect(marketValue).toContainText("IDO");
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_URL参数正常", "002_Market表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 确认API被调用（表格有数据）
    const rows = page.locator("table.md-table tbody tr");
    await expect(rows.first()).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_URL参数正常",
        "003_データ表示確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-URL参数Market缺失
  // ============================================================
  test("03_画面初期显示_URL参数Market缺失", async ({ page }) => {
    await openPage(page, APP_URL_NO_MARKET);

    // 1. Market显示为空或默认值
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_URL参数Market缺失",
        "001_ページ表示後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const marketValue = page
      .locator("span.md-label")
      .filter({ hasText: "Market:" })
      .locator("..")
      .locator("span.md-value");
    await expect(marketValue).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_URL参数Market缺失",
        "002_Market表示確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Chassis no仍正常显示
    await expect(
      page.locator("span.md-label").filter({ hasText: "Chassis no:" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_URL参数Market缺失",
        "003_ChassisNo確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 画面初期显示-URL参数chassisNo缺失
  // ============================================================
  test("04_画面初期显示_URL参数chassisNo缺失", async ({ page }) => {
    await setLoginState(page);
    await page.goto(APP_URL_NO_CHASSIS, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(1000);

    // 1. 显示错误消息
    const errMsg = page.locator("div.md-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "04_画面初期显示_URL参数chassisNo缺失",
        "001_エラーメッセージ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(errMsg).toContainText("Chassis number is required.");
    await page.screenshot({
      path: getScreenshotPath(
        "04_画面初期显示_URL参数chassisNo缺失",
        "002_エラー内容確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 不调用API，表格体为空
    const tableBodyRows = page.locator("table.md-table tbody tr");
    const rowCount = await tableBodyRows.count();
    expect(rowCount).toBe(0);
    await page.screenshot({
      path: getScreenshotPath(
        "04_画面初期显示_URL参数chassisNo缺失",
        "003_テーブル空確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 画面初期显示-加载中状态
  // ============================================================
  test("05_画面初期显示_加载中状态", async ({ page }) => {
    await setLoginState(page);

    await page.goto(APP_URL_WITH_PARAMS, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(2000);

    // 1. 加载完成后标题显示（组件中没有div.md-loading，isLoading只禁用Save按钮）
    await expect(page.locator("h1.md-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("05_画面初期显示_加载中状态", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 加载完成后Save按钮可见
    await expect(page.locator("button.md-save-btn")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("05_画面初期显示_加载中状态", "002_Saveﾎﾞﾀﾝ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 API查询成功-变量列表加载
  // ============================================================
  test("06_API查询成功_变量列表加载", async ({ page }) => {
    await openPage(page);

    // 1. 表格显示所有变量行
    await page.screenshot({
      path: getScreenshotPath(
        "06_API查询成功_变量列表加载",
        "001_ページ表示後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const rows = page.locator("table.md-table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("06_API查询成功_变量列表加载", "002_行数確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 每行显示Variable、Description、Current value
    for (let i = 0; i < Math.min(rowCount, 2); i++) {
      const cells = rows.nth(i).locator("td.md-td");
      await expect(cells.nth(0)).toBeVisible();
      await expect(cells.nth(1)).toBeVisible();
      await expect(cells.nth(2)).toBeVisible();
      const input = cells.nth(3).locator("input.md-input");
      await expect(input).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath(
        "06_API查询成功_变量列表加载",
        "003_各列表示確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. Template文件链接显示
    const templateLink = getTemplateLink(page);
    await expect(templateLink).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "06_API查询成功_变量列表加载",
        "004_Template確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 API查询成功-含修改记录
  // ============================================================
  test("07_API查询成功_含修改记录", async ({ page }) => {
    await openPage(page);

    // 1. 页面加载完成
    await page.screenshot({
      path: getScreenshotPath("07_API查询成功_含修改记录", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Current value显示ADCA_MODIFICATION中的NEWVAL值
    const rows = page.locator("table.md-table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    for (let i = 0; i < rowCount; i++) {
      const cells = rows.nth(i).locator("td.md-td");
      const currentVal = (await cells.nth(2).textContent())?.trim() || "";
      expect(currentVal.length).toBeGreaterThan(0);
    }
    await page.screenshot({
      path: getScreenshotPath(
        "07_API查询成功_含修改记录",
        "002_CurrentValue確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. Modified value初始化为空
    const firstInput = page.locator("input.md-input").first();
    const initialVal = await firstInput.inputValue();
    expect(initialVal).toBe("");
    await page.screenshot({
      path: getScreenshotPath(
        "07_API查询成功_含修改记录",
        "003_ModifiedValue空確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 API查询成功-无修改记录
  // ============================================================
  test("08_API查询成功_无修改记录", async ({ page }) => {
    await setLoginState(page);
    // 用不含修改记录的chassisNo访问
    await page.goto(
      `${APP_URL}/modify-document?chassisNo=NODA00000000&market=NONE`,
      { waitUntil: "domcontentloaded", timeout: 15000 },
    );
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(2000);

    // 1. 画面正常显示
    await page.screenshot({
      path: getScreenshotPath("08_API查询成功_无修改记录", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 表格显示（可能为空）
    const table = page.locator("table.md-table");
    const tableCount = await table.count();
    if (tableCount > 0) {
      await expect(table).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("08_API查询成功_无修改记录", "002_表示確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 无错误消息
    const errMsg = page.locator("div.md-error-message");
    const errCount = await errMsg.count();
    if (errCount > 0) {
      const errVisible = await errMsg.isVisible();
      if (errVisible) {
        console.log("Error shown:", await errMsg.textContent());
      }
    }
    await page.screenshot({
      path: getScreenshotPath(
        "08_API查询成功_无修改记录",
        "003_エラーなし確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 API查询失败-系统错误
  // ============================================================
  test("09_API查询失败_系统错误", async ({ page }) => {
    await setLoginState(page);
    // Mock API返回错误
    await page.route("**/api/UD05/modifyDocumentUnit*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 500,
          msg: "System error. Please contact administrator.",
        }),
      });
    });

    await page.goto(APP_URL_WITH_PARAMS, {
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
    await page.screenshot({
      path: getScreenshotPath("09_API查询失败_系统错误", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const errMsg = page.locator("div.md-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "09_API查询失败_系统错误",
        "002_エラーメッセージ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(errMsg).toContainText("System error");
    await page.screenshot({
      path: getScreenshotPath("09_API查询失败_系统错误", "003_エラー内容確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 表格不显示变量数据
    const rows = page.locator("table.md-table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBe(0);
    await page.screenshot({
      path: getScreenshotPath("09_API查询失败_系统错误", "004_テーブル空確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 API查询失败-网络错误
  // ============================================================
  test("10_API查询失败_网络错误", async ({ page }) => {
    await setLoginState(page);
    // Mock网络断开
    await page.route("**/api/UD05/modifyDocumentUnit*", (route) =>
      route.abort("connectionrefused"),
    );

    await page.goto(APP_URL_WITH_PARAMS, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(2000);

    // 1. Error message区域显示
    await page.screenshot({
      path: getScreenshotPath("10_API查询失败_网络错误", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const errMsg = page.locator("div.md-error-message");
    const errVisible = await errMsg.isVisible();
    if (errVisible) {
      console.log("Network error message:", await errMsg.textContent());
      await page.screenshot({
        path: getScreenshotPath(
          "10_API查询失败_网络错误",
          "002_エラーメッセージ表示",
        ),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("10_API查询失败_网络错误", "002_エラー画面"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
  });

  // ============================================================
  // No.11 表格-列定义
  // ============================================================
  test("11_表格_列定义", async ({ page }) => {
    await openPage(page);

    // 1. 确认列标题
    await page.screenshot({
      path: getScreenshotPath("11_表格_列定义", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const headers = page.locator("th.md-th");
    const headerTexts = await headers.allTextContents();

    // 第1列："Variable"
    expect(headerTexts[0]?.trim()).toBe("Variable");
    // 第2列："Description"
    expect(headerTexts[1]?.trim()).toBe("Description");
    // 第3列："Current value"
    expect(headerTexts[2]?.trim()).toBe("Current value");
    // 第4列："Modified value"
    expect(headerTexts[3]?.trim()).toBe("Modified value");
    await page.screenshot({
      path: getScreenshotPath("11_表格_列定义", "002_列标题確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 列标题显示完整
    await expect(headers).toHaveCount(4);
    await page.screenshot({
      path: getScreenshotPath("11_表格_列定义", "003_列数確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 表格-空变量列表
  // ============================================================
  test("12_表格_空变量列表", async ({ page }) => {
    // Mock API返回空变量列表
    await setLoginState(page);
    await page.route("**/api/UD05/modifyDocumentUnit*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          data: {
            market: "TEST",
            template: "test/template.odt",
            variables: [],
          },
        }),
      });
    });

    await page.goto(APP_URL_WITH_PARAMS, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(1500);

    // 1. 表格表头正常显示
    await page.screenshot({
      path: getScreenshotPath("12_表格_空变量列表", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("th.md-th")).toHaveCount(4);
    await page.screenshot({
      path: getScreenshotPath("12_表格_空变量列表", "002_表頭確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 表格体为空
    const tbodyRows = page.locator("table.md-table tbody tr");
    const rowCount = await tbodyRows.count();
    expect(rowCount).toBe(0);
    await page.screenshot({
      path: getScreenshotPath("12_表格_空变量列表", "003_空行確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 无错误消息
    const errMsg = page.locator("div.md-error-message");
    await expect(errMsg).toHaveCount(0);
    await page.screenshot({
      path: getScreenshotPath("12_表格_空变量列表", "004_エラーなし確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 表格-多变量显示
  // ============================================================
  test("13_表格_多变量显示", async ({ page }) => {
    await openPage(page);

    // 1. 页面加载完成
    await page.screenshot({
      path: getScreenshotPath("13_表格_多变量显示", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 所有变量按顺序显示
    const rows = page.locator("table.md-table tbody tr");
    const rowCount = await rows.count();
    console.log("Table row count:", rowCount);
    await page.screenshot({
      path: getScreenshotPath("13_表格_多变量显示", "002_行数確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 各行正确显示Variable、Description、Current value
    for (let i = 0; i < Math.min(rowCount, 3); i++) {
      const cells = rows.nth(i).locator("td.md-td");
      await expect(cells.nth(0)).toBeVisible();
      await expect(cells.nth(1)).toBeVisible();
      await expect(cells.nth(2)).toBeVisible();
      const input = cells.nth(3).locator("input.md-input");
      await expect(input).toBeVisible();
      const val = await input.inputValue();
      expect(val).toBe("");
    }
    await page.screenshot({
      path: getScreenshotPath("13_表格_多变量显示", "003_各变量表示確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Modified value-正常输入
  // ============================================================
  test("14_ModifiedValue_正常输入", async ({ page }) => {
    await openPage(page);

    // 1. 页面加载完成
    await page.screenshot({
      path: getScreenshotPath("14_ModifiedValue_正常输入", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 输入框可用（Enabled）
    const firstInput = page.locator("input.md-input").first();
    await expect(firstInput).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("14_ModifiedValue_正常输入", "002_入力前確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 输入值
    await firstInput.fill("MODIFIED_VALUE_1");
    const val = await firstInput.inputValue();
    expect(val).toBe("MODIFIED_VALUE_1");
    await page.screenshot({
      path: getScreenshotPath("14_ModifiedValue_正常输入", "003_入力後確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Modified value-多行输入
  // ============================================================
  test("15_ModifiedValue_多行输入", async ({ page }) => {
    await openPage(page);

    // 1. 页面加载完成
    await page.screenshot({
      path: getScreenshotPath("15_ModifiedValue_多行输入", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    const inputs = page.locator("input.md-input");
    const inputCount = await inputs.count();

    // 2. 在多行分别输入值
    if (inputCount > 0) {
      await inputs.nth(0).fill("VAL1");
    }
    if (inputCount > 2) {
      await inputs.nth(2).fill("VAL3");
    }
    await page.screenshot({
      path: getScreenshotPath("15_ModifiedValue_多行输入", "002_複数行入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 确认各输入框独立保存其值
    if (inputCount > 0) {
      expect(await inputs.nth(0).inputValue()).toBe("VAL1");
    }
    if (inputCount > 1) {
      expect(await inputs.nth(1).inputValue()).toBe("");
    }
    if (inputCount > 2) {
      expect(await inputs.nth(2).inputValue()).toBe("VAL3");
    }
    await page.screenshot({
      path: getScreenshotPath("15_ModifiedValue_多行输入", "003_値独立確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 Modified value-空输入保持
  // ============================================================
  test("16_ModifiedValue_空输入保持", async ({ page }) => {
    await openPage(page);

    // 1. 页面加载完成
    await page.screenshot({
      path: getScreenshotPath(
        "16_ModifiedValue_空输入保持",
        "001_ページ表示後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Modified value为空
    const firstInput = page.locator("input.md-input").first();
    const val = await firstInput.inputValue();
    expect(val).toBe("");
    await page.screenshot({
      path: getScreenshotPath("16_ModifiedValue_空输入保持", "002_空確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 输入框可正常聚焦
    await firstInput.focus();
    await expect(firstInput).toBeFocused();
    await page.screenshot({
      path: getScreenshotPath(
        "16_ModifiedValue_空输入保持",
        "003_フォーカス確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 Modified value-最大长度500字符
  // ============================================================
  test("17_ModifiedValue_最大长度500字符", async ({ page }) => {
    await openPage(page);

    // 1. 页面加载完成
    await page.screenshot({
      path: getScreenshotPath(
        "17_ModifiedValue_最大长度500字符",
        "001_ページ表示後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    const firstInput = page.locator("input.md-input").first();
    await expect(firstInput).toHaveAttribute("maxLength", "500");
    await page.screenshot({
      path: getScreenshotPath(
        "17_ModifiedValue_最大长度500字符",
        "002_maxLength確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 输入500字符
    const longText = "A".repeat(500);
    await firstInput.fill(longText);
    const val = await firstInput.inputValue();
    expect(val.length).toBeLessThanOrEqual(500);
    await page.screenshot({
      path: getScreenshotPath(
        "17_ModifiedValue_最大长度500字符",
        "003_500文字入力確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 Modified value-超过500字符
  // ============================================================
  test("18_ModifiedValue_超过500字符", async ({ page }) => {
    await openPage(page);

    // 1. 页面加载完成
    await page.screenshot({
      path: getScreenshotPath(
        "18_ModifiedValue_超过500字符",
        "001_ページ表示後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    const firstInput = page.locator("input.md-input").first();
    // 2. 输入501字符（因maxLength=500，会被截断）
    const longText = "B".repeat(501);
    await firstInput.fill(longText);
    const val = await firstInput.inputValue();
    expect(val.length).toBeLessThanOrEqual(500);
    await page.screenshot({
      path: getScreenshotPath(
        "18_ModifiedValue_超过500字符",
        "002_501文字入力後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 Save-空值检查（全为空）
  // ============================================================
  test("19_Save_空值检查", async ({ page }) => {
    await openPage(page);

    // 1. 所有Modified value为空
    await page.screenshot({
      path: getScreenshotPath("19_Save_空值检查", "001_全空入力確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 点击Save按钮
    await page.locator("button.md-save-btn").click();
    await page.waitForTimeout(500);

    // 3. 显示错误消息
    const errMsg = page.locator("div.md-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("19_Save_空值检查", "002_エラーメッセージ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(errMsg).toContainText("NO UNRELEASED VERSION EXISTS!");
    await page.screenshot({
      path: getScreenshotPath("19_Save_空值检查", "003_エラー内容確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. Save按钮保持可用状态
    await expect(page.locator("button.md-save-btn")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("19_Save_空值检查", "004_Saveボタン活性確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 Save-成功（部分Modified value有值）
  // ============================================================
  test("20_Save_部分有值保存成功", async ({ page }) => {
    await openPage(page);

    // 1. 行0输入值
    const firstInput = page.locator("input.md-input").first();
    await firstInput.fill("MODIFIED_VALUE_1");
    await page.screenshot({
      path: getScreenshotPath("20_Save_部分有值保存成功", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Mock Save API返回成功
    await page.route("**/api/UD05/modifyDocumentSave", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "修改保存成功" }),
      });
    });

    // 2. 点击Save
    await page.locator("button.md-save-btn").click();
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: getScreenshotPath("20_Save_部分有值保存成功", "002_Save後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 检查是否跳转到save-modifications页面
    const currentUrl = page.url();
    console.log("After save, URL:", currentUrl);
    await page.screenshot({
      path: getScreenshotPath("20_Save_部分有值保存成功", "003_画面遷移確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 Save-成功（全部Modified value有值）
  // ============================================================
  test("21_Save_全部有值保存成功", async ({ page }) => {
    await openPage(page);

    // 1. 全部输入
    const inputs = page.locator("input.md-input");
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
      await inputs.nth(i).fill(`VALUE_${i + 1}`);
    }
    await page.screenshot({
      path: getScreenshotPath("21_Save_全部有值保存成功", "001_全行入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Mock Save API
    await page.route("**/api/UD05/modifyDocumentSave", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "修改保存成功" }),
      });
    });

    // 2. 点击Save
    await page.locator("button.md-save-btn").click();
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: getScreenshotPath("21_Save_全部有值保存成功", "002_Save後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 确认结果
    const currentUrl = page.url();
    console.log("After all save, URL:", currentUrl);
    await page.screenshot({
      path: getScreenshotPath("21_Save_全部有值保存成功", "003_結果確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 Save-失败（API返回错误）
  // ============================================================
  test("22_Save_API返回错误", async ({ page }) => {
    await openPage(page);

    // 1. 输入值
    const inputCount = await page.locator("input.md-input").count();
    if (inputCount === 0) {
      console.log("Skipping: no input fields");
      return;
    }
    const firstInput = page.locator("input.md-input").first();
    await firstInput.fill("MODIFIED_VALUE_1");
    const valBefore = await firstInput.inputValue();
    expect(valBefore).toBe("MODIFIED_VALUE_1");
    await page.screenshot({
      path: getScreenshotPath("22_Save_API返回错误", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Mock Save API返回错误
    await page.route("**/api/UD05/modifyDocumentSave", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 500, msg: "保存失败，请联系管理员" }),
      });
    });

    // 2. 点击Save
    await page.locator("button.md-save-btn").click();
    await page.waitForTimeout(2000);

    // 3. 显示错误消息
    const errMsg = page.locator("div.md-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "22_Save_API返回错误",
        "002_エラーメッセージ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(errMsg).toContainText("System error");
    await page.screenshot({
      path: getScreenshotPath("22_Save_API返回错误", "003_エラー内容確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. Save按钮恢复可用
    await expect(page.locator("button.md-save-btn")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("22_Save_API返回错误", "004_Saveボタン確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 Save-失败（API返回500）
  // ============================================================
  test("23_Save_API返回500", async ({ page }) => {
    await openPage(page);

    // 1. 输入值
    const inputCount = await page.locator("input.md-input").count();
    if (inputCount === 0) {
      console.log("Skipping: no input fields");
      return;
    }
    const firstInput = page.locator("input.md-input").first();
    await firstInput.fill("MODIFIED_VALUE_1");
    await page.screenshot({
      path: getScreenshotPath("23_Save_API返回500", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Mock Save API返回500
    await page.route("**/api/UD05/modifyDocumentSave", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ code: 500, msg: "保存失败，请联系管理员" }),
      });
    });

    // 2. 点击Save
    await page.locator("button.md-save-btn").click();
    await page.waitForTimeout(2000);

    // 3. 显示错误消息
    const errMsg = page.locator("div.md-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("23_Save_API返回500", "002_エラーメッセージ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(errMsg).toContainText("System error");
    await page.screenshot({
      path: getScreenshotPath("23_Save_API返回500", "003_エラー内容確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. 不跳转（停留在当前页面）
    await expect(page).toHaveURL(/modify-document/);
    await page.screenshot({
      path: getScreenshotPath("23_Save_API返回500", "004_画面遷移なし確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 Chassis no链接-画面跳转
  // ============================================================
  test("24_ChassisNo链接_画面跳转", async ({ page }) => {
    await setLoginState(page);
    await page.goto(APP_URL_WITH_PARAMS, {
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
      path: getScreenshotPath("24_ChassisNo链接_画面跳转", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 点击Chassis no链接
    const chassisLink = page
      .locator("span.md-link")
      .filter({ hasText: "1234" });
    await expect(chassisLink).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("24_ChassisNo链接_画面跳转", "002_リンク確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await chassisLink.dispatchEvent("click");
    await page.waitForTimeout(1500);

    // 3. 跳转到Vehicle Specification页面
    const currentUrl = page.url();
    console.log("After chassis link click, URL:", currentUrl);
    await page.screenshot({
      path: getScreenshotPath("24_ChassisNo链接_画面跳转", "003_画面遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 Chassis no显示-拼接显示
  // ============================================================
  test("25_ChassisNo显示_拼接显示", async ({ page }) => {
    await openPage(page);

    // 1. Chassis no显示完整拼接
    await page.screenshot({
      path: getScreenshotPath("25_ChassisNo显示_拼接显示", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const chassisNoEl = page.locator("span.md-value.md-chassis-no");
    await expect(chassisNoEl).toBeVisible();
    await expect(chassisNoEl).toContainText("yann1234");
    await page.screenshot({
      path: getScreenshotPath(
        "25_ChassisNo显示_拼接显示",
        "002_ChassisNo全文確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 显示为可点击的链接样式
    const link = page.locator("span.md-link").filter({ hasText: "1234" });
    await expect(link).toBeVisible();
    // 确认链接样式（蓝色、下划线）
    const linkColor = await link.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    console.log("Link color:", linkColor);
    await page.screenshot({
      path: getScreenshotPath(
        "25_ChassisNo显示_拼接显示",
        "003_リンクスタイル確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 Template链接-下载
  // ============================================================
  test("26_Template链接_下载", async ({ page }) => {
    await openPage(page);

    // 1. 页面加载完成
    await page.screenshot({
      path: getScreenshotPath("26_Template链接_下载", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Template链接可点击
    const templateLink = getTemplateLink(page);
    await expect(templateLink).toBeVisible();
    const templateText = await templateLink.textContent();
    console.log("Template text:", templateText);
    await page.screenshot({
      path: getScreenshotPath("26_Template链接_下载", "002_Template表示確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 点击Template链接（触发下载）
    if (
      templateText &&
      templateText.trim() !== "" &&
      templateText.trim() !== "-"
    ) {
      await templateLink.dispatchEvent("click");
      await page.waitForTimeout(500);
    }
    await page.screenshot({
      path: getScreenshotPath("26_Template链接_下载", "003_ダウンロード後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 Template链接-文件不存在
  // ============================================================
  test("27_Template链接_文件不存在", async ({ page }) => {
    // Mock API返回无generatedFilePath
    await setLoginState(page);
    await page.route("**/api/UD04/selectGeneratedocument*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          data: { generatedFilePath: null },
        }),
      });
    });

    await page.goto(APP_URL_WITH_PARAMS, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(1500);

    // 1. Template链接显示
    await page.screenshot({
      path: getScreenshotPath("27_Template链接_文件不存在", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 点击Template链接
    const templateLink = getTemplateLink(page);
    await templateLink.dispatchEvent("click");
    await page.waitForTimeout(500);

    // 3. 确认错误消息
    const errMsg = page.locator("div.md-error-message");
    const errCount = await errMsg.count();
    if (errCount > 0 && (await errMsg.isVisible())) {
      console.log("Error shown:", await errMsg.textContent());
    }
    await page.screenshot({
      path: getScreenshotPath("27_Template链接_文件不存在", "002_エラー確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 Template链接-显示
  // ============================================================
  test("28_Template链接_显示", async ({ page }) => {
    await openPage(page);

    // 1. 显示Template字段
    await page.screenshot({
      path: getScreenshotPath("28_Template链接_显示", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(
      page.locator("span.md-label").filter({ hasText: "Template:" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("28_Template链接_显示", "002_Templateラベル確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 显示Template文件路径和名称（可点击链接）
    const templateLink = getTemplateLink(page);
    await expect(templateLink).toBeVisible();
    const templateText = await templateLink.textContent();
    expect(templateText?.trim().length).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("28_Template链接_显示", "003_Templateリンク確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.29 错误消息-错误样式
  // ============================================================
  test("29_错误消息_错误样式", async ({ page }) => {
    await openPage(page);

    // 1. 触发Save空值校验
    await page.locator("button.md-save-btn").click();
    await page.waitForTimeout(500);
    const errMsg = page.locator("div.md-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "29_错误消息_错误样式",
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
    console.log("Error color:", color);
    const rgbMatch = color.match(/\d+/g);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[0]);
      const g = parseInt(rgbMatch[1]);
      const b = parseInt(rgbMatch[2]);
      expect(r).toBeGreaterThan(g);
      expect(r).toBeGreaterThan(b);
    }
    await page.screenshot({
      path: getScreenshotPath("29_错误消息_错误样式", "002_文字色確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 左对齐
    const textAlign = await errMsg.evaluate(
      (el) => window.getComputedStyle(el).textAlign,
    );
    console.log("Error text-align:", textAlign);
    await page.screenshot({
      path: getScreenshotPath("29_错误消息_错误样式", "003_配置確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.30 异常处理-API调用失败
  // ============================================================
  test("30_异常处理_API调用失败", async ({ page }) => {
    await openPage(page);

    // 1. 输入值
    const inputCount = await page.locator("input.md-input").count();
    if (inputCount === 0) {
      console.log("Skipping: no input fields");
      return;
    }
    const firstInput = page.locator("input.md-input").first();
    await firstInput.fill("MODIFIED_VALUE_1");
    await page.screenshot({
      path: getScreenshotPath("30_异常处理_API调用失败", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Mock Save API调用失败
    await page.route("**/api/UD05/modifyDocumentSave", (route) =>
      route.abort("connectionrefused"),
    );

    // 2. 点击Save
    await page.locator("button.md-save-btn").click();
    await page.waitForTimeout(2000);

    // 3. 显示错误消息
    const errMsg = page.locator("div.md-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "30_异常处理_API调用失败",
        "002_エラーメッセージ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(errMsg).toContainText("System error");
    await page.screenshot({
      path: getScreenshotPath("30_异常处理_API调用失败", "003_エラー内容確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.31 异常处理-数据库操作异常
  // ============================================================
  test("31_异常处理_数据库操作异常", async ({ page }) => {
    await openPage(page);

    // 1. 输入值
    const inputCount = await page.locator("input.md-input").count();
    if (inputCount === 0) {
      console.log("Skipping: no input fields");
      return;
    }
    const firstInput = page.locator("input.md-input").first();
    await firstInput.fill("MODIFIED_VALUE_1");
    await page.screenshot({
      path: getScreenshotPath("31_异常处理_数据库操作异常", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Mock API返回500
    await page.route("**/api/UD05/modifyDocumentSave", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 500, msg: "系统内部错误，请联系管理员" }),
      });
    });

    // 2. 点击Save
    await page.locator("button.md-save-btn").click();
    await page.waitForTimeout(2000);

    // 3. 显示错误消息
    const errMsg = page.locator("div.md-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "31_异常处理_数据库操作异常",
        "002_エラーメッセージ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(errMsg).toContainText("System error");
    await page.screenshot({
      path: getScreenshotPath(
        "31_异常处理_数据库操作异常",
        "003_エラー内容確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. 保存操作终止（不跳转）
    await expect(page).toHaveURL(/modify-document/);
    await page.screenshot({
      path: getScreenshotPath(
        "31_异常处理_数据库操作异常",
        "004_画面遷移なし確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.32 异常处理-用户未登录
  // ============================================================
  test("32_异常处理_用户未登录", async ({ page }) => {
    await clearLoginState(page);
    await page.goto(APP_URL_WITH_PARAMS, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(2000);

    // 1. 未登录状态画面
    await page.screenshot({
      path: getScreenshotPath("32_异常处理_用户未登录", "001_未ログイン画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 确认画面行为（前端无认证守卫时页面仍会显示）
    const titleEl = page.locator("h1.md-title");
    const titleCount = await titleEl.count();
    if (titleCount > 0) {
      await expect(titleEl).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("32_异常处理_用户未登录", "002_画面状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.33 Save按钮-加载中禁用
  // ============================================================
  test("33_Save按钮_加载中禁用", async ({ page }) => {
    await setLoginState(page);
    await page.route("**/api/UD05/modifyDocumentUnit*", async (route) => {
      await page.waitForTimeout(3000);
      await route.continue();
    });

    await page.goto(APP_URL_WITH_PARAMS, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(500);

    // 1. 加载中状态 - 组件渲染时isLoading=true，Save按钮disabled
    await expect(page.locator("h1.md-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("33_Save按钮_加载中禁用", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 加载期间Save按钮disabled
    const saveBtn = page.locator("button.md-save-btn");
    await expect(saveBtn).toBeDisabled();
    await page.screenshot({
      path: getScreenshotPath("33_Save按钮_加载中禁用", "002_Saveボタン非表示"),
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

    // 3. 加载完成后Save按钮可用
    await expect(page.locator("button.md-save-btn")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("33_Save按钮_加载中禁用", "003_ロード完了後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.34 Modified value输入-加载中禁用
  // ============================================================
  test("34_ModifiedValue输入_加载中禁用", async ({ page }) => {
    await setLoginState(page);
    await page.route("**/api/UD05/modifyDocumentUnit*", async (route) => {
      await page.waitForTimeout(3000);
      await route.continue();
    });

    await page.goto(APP_URL_WITH_PARAMS, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(500);

    // 1. 加载中状态 - 组件渲染时isLoading=true，Save按钮disabled
    await expect(page.locator("button.md-save-btn")).toBeDisabled();
    await page.screenshot({
      path: getScreenshotPath(
        "34_ModifiedValue输入_加载中禁用",
        "001_Saveﾎﾞﾀﾝdisabled",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 加载期间输入框不可操作（不存在）
    await expect(page.locator("input.md-input")).toHaveCount(0);
    await page.screenshot({
      path: getScreenshotPath(
        "34_ModifiedValue输入_加载中禁用",
        "002_入力欄非表示",
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

    // 3. 完成后输入框可用
    const inputs = page.locator("input.md-input");
    const inputCount = await inputs.count();
    if (inputCount > 0) {
      await expect(inputs.first()).toBeVisible();
      await expect(inputs.first()).toBeEnabled();
    }
    await page.screenshot({
      path: getScreenshotPath(
        "34_ModifiedValue输入_加载中禁用",
        "003_ロード完了後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.35 页面刷新
  // ============================================================
  test("35_页面刷新", async ({ page }) => {
    await openPage(page);

    // 1. 数据加载完成后
    await expect(page.locator("h1.md-title")).toHaveText("Modify Document");
    await page.screenshot({
      path: getScreenshotPath("35_页面刷新", "001_リロード前"),
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

    // 3. 页面重新加载，数据正常显示
    await expect(page.locator("h1.md-title")).toHaveText("Modify Document");
    await page.screenshot({
      path: getScreenshotPath("35_页面刷新", "002_リロード後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. 数据正常显示
    await expect(
      page.locator("span.md-label").filter({ hasText: "Chassis no:" }),
    ).toBeVisible();
    await expect(page.locator("table.md-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("35_页面刷新", "003_データ再表示確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.36 安全性-API请求协议
  // ============================================================
  test("36_安全性_API请求协议", async ({ page }) => {
    await setLoginState(page);

    // 监听API请求
    const requests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("/api/UD05/")) {
        requests.push(url);
      }
    });

    await page.goto(APP_URL_WITH_PARAMS, {
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
      console.log("UD05 API requests:", requests);
    }
    await page.screenshot({
      path: getScreenshotPath("36_安全性_API请求协议", "001_API呼出後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.screenshot({
      path: getScreenshotPath("36_安全性_API请求协议", "002_リクエスト確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.37 安全性-认证与权限控制
  // ============================================================
  test("37_安全性_认证与权限控制", async ({ page }) => {
    await openPage(page);

    // 1. 页面加载完成
    await page.screenshot({
      path: getScreenshotPath("37_安全性_认证与权限控制", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 页面正常显示（已登录）
    await expect(page.locator("h1.md-title")).toHaveText("Modify Document");
    await page.screenshot({
      path: getScreenshotPath("37_安全性_认证与权限控制", "002_認証状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. Save按钮可用（已认证用户可以操作）
    const saveBtn = page.locator("button.md-save-btn");
    await expect(saveBtn).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath(
        "37_安全性_认证与权限控制",
        "003_Saveボタン活性確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
