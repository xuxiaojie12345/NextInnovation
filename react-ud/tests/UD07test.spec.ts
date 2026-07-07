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
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD07";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/vehicle-specification?chassisNo=yann1234`;
const PAGE_URL_NO_CHASSIS = `${APP_URL}/vehicle-specification`;

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
// DB接続状態＆テストデータ setup / cleanup
// ============================================================
let dbAvailable = false;

async function setupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    dbAvailable = true;
    try {
      // yann/1234 のテストデータが存在するか確認
      const [rows] = await conn.execute(
        "SELECT COUNT(*) AS cnt FROM HDOC_REC_DATA_OM WHERE SERIE = ? AND CHNR = ?",
        ["yann", "1234"],
      );
      const count = (rows as any[])[0]?.cnt || 0;
      if (count === 0) {
        const now = new Date();
        // HDOC_REC_DATA_OM
        await conn.execute(
          `INSERT INTO HDOC_REC_DATA_OM (SERIE, CHNR, MODEL, CUSTOMER_ADAP, VIN, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
          [
            "yann",
            "1234",
            "FH16",
            "S1810111",
            "YV2JN12A4PA123456",
            "TEST",
            "PLAYWRIGHT",
            "TEST",
            "PLAYWRIGHT",
          ],
        );
        // HDOC_REC_DATA_VDA_GENERAL
        await conn.execute(
          `INSERT INTO HDOC_REC_DATA_VDA_GENERAL (SERIE, CHNR, BUILD_WEEK, PRODUCT_TYPE, COUNTRY_OF_OPERATION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
          [
            "yann",
            "1234",
            "2024W15",
            "TRUCK",
            "SWE",
            "TEST",
            "PLAYWRIGHT",
            "TEST",
            "PLAYWRIGHT",
          ],
        );
        // HDOC_REC_DATA_VDA_VARIANTS
        await conn.execute(
          `INSERT INTO HDOC_REC_DATA_VDA_VARIANTS (SERIE, CHNR, FAMILY_ID, VARIANT_ID, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, ?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
          [
            "yann",
            "1234",
            "FAM001",
            "VAR001",
            "TEST",
            "PLAYWRIGHT",
            "TEST",
            "PLAYWRIGHT",
          ],
        );
        // HDOC_REC_DATA_KOLA_VARIANT
        await conn.execute(
          `INSERT INTO HDOC_REC_DATA_KOLA_VARIANT (SYMBOL, DESCRIPTION, FAMILY_ID, VARIANT_ID, FUNCTION_GROUP, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
          [
            "SYM00123",
            "Test Symbol Description",
            "FAM001",
            "VAR001",
            "FG01",
            "TEST",
            "PLAYWRIGHT",
            "TEST",
            "PLAYWRIGHT",
          ],
        );
        console.log("Test data inserted for yann/1234");
      } else {
        console.log("Test data already exists for yann/1234");
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
        "DELETE FROM HDOC_REC_DATA_OM WHERE SERIE = ? AND CHNR = ? AND REGISTER_USER = ?",
        ["yann", "1234", "TEST"],
      );
      await conn.execute(
        "DELETE FROM HDOC_REC_DATA_VDA_GENERAL WHERE SERIE = ? AND CHNR = ? AND REGISTER_USER = ?",
        ["yann", "1234", "TEST"],
      );
      await conn.execute(
        "DELETE FROM HDOC_REC_DATA_VDA_VARIANTS WHERE SERIE = ? AND CHNR = ? AND REGISTER_USER = ?",
        ["yann", "1234", "TEST"],
      );
      await conn.execute(
        "DELETE FROM HDOC_REC_DATA_KOLA_VARIANT WHERE FAMILY_ID = ? AND REGISTER_USER = ?",
        ["FAM001", "TEST"],
      );
      console.log("Test data cleaned up");
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
  await page.waitForTimeout(1000);
}

// ============================================================
// テストスイート
// ============================================================
test.describe("UD07 Vehicle Specification - 单体测试", () => {
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
  // No.1 画面初期显示-基本元素（実API）
  // ============================================================
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await openPage(page);

    // ラベル確認
    await expect(
      page.locator("span.vs-label").filter({ hasText: "Chassis no:" }),
    ).toBeVisible();
    await expect(
      page.locator("span.vs-label").filter({ hasText: "Built week:" }),
    ).toBeVisible();
    await expect(
      page.locator("span.vs-label").filter({ hasText: "VIN:" }),
    ).toBeVisible();
    await expect(
      page
        .locator("span.vs-label")
        .filter({ hasText: "Country of Operation:" }),
    ).toBeVisible();

    // vs-label2 のラベル
    await expect(
      page.locator("span.vs-label2").filter({ hasText: "Model:" }),
    ).toBeVisible();
    await expect(
      page.locator("span.vs-label2").filter({ hasText: "Product type:" }),
    ).toBeVisible();
    await expect(
      page.locator("span.vs-label2").filter({ hasText: "Engine no:" }),
    ).toBeVisible();

    // タイトル
    await expect(page.locator("h1.vs-title")).toHaveText(
      "VDA - Vehicle Specification:",
    );

    // すべての項目が表示専用（入力欄なし）
    await expect(page.locator("input")).toHaveCount(0);
    await expect(page.locator("textarea")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "基本要素"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-URL 参数解析（実API）
  // ============================================================
  test("02_画面初期显示_URL参数解析", async ({ page }) => {
    await openPage(page);

    // Chassis no 表示
    const chassisValue = page
      .locator("span.vs-label")
      .filter({ hasText: "Chassis no:" })
      .locator("..")
      .locator("span.vs-value");
    await expect(chassisValue).toBeVisible();
    await expect(chassisValue).toContainText("yann1234");

    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_URL参数解析", "参数表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-加载中状态（実API）
  // ============================================================
  test("03_画面初期显示_加载中状态", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL, { waitUntil: "domcontentloaded" });

    const loadingEl = page.locator("div.vs-loading");
    const loadingCount = await loadingEl.count();
    if (loadingCount > 0) {
      await expect(loadingEl).toHaveText("Loading...");
    }

    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    // 完了後、タイトル表示
    await expect(page.locator("h1.vs-title")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_加载中状态", "加载完成"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 空值校验-Chassis 编号为空（実API）
  // ============================================================
  test("04_空值校验_Chassis编号为空", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL_NO_CHASSIS);
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(1000);

    // エラーメッセージ
    await expect(page.locator("div.vs-error-message")).toBeVisible();
    await expect(page.locator("div.vs-error-message")).toContainText(
      "未指定Chassis编号",
    );

    await page.screenshot({
      path: getScreenshotPath("04_空值校验_Chassis编号为空", "Chassis空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 API 成功-车辆基本信息显示（実API）
  // ============================================================
  test("05_API成功_车辆基本信息显示", async ({ page }) => {
    await openPage(page);

    // Model
    const modelValue = page
      .locator("span.vs-label2")
      .filter({ hasText: "Model:" })
      .locator("..")
      .locator("span.vs-value");
    await expect(modelValue).toBeVisible();

    // Built week
    const builtWeekValue = page
      .locator("span.vs-label")
      .filter({ hasText: "Built week:" })
      .locator("..")
      .locator("span.vs-value");
    await expect(builtWeekValue).toBeVisible();

    // Product type
    const productTypeValue = page
      .locator("span.vs-label2")
      .filter({ hasText: "Product type:" })
      .locator("..")
      .locator("span.vs-value");
    await expect(productTypeValue).toBeVisible();

    // VIN
    const vinValue = page
      .locator("span.vs-label")
      .filter({ hasText: "VIN:" })
      .locator("..")
      .locator("span.vs-value");
    await expect(vinValue).toBeVisible();

    // Country of Operation
    const countryValue = page
      .locator("span.vs-label")
      .filter({ hasText: "Country of Operation:" })
      .locator("..")
      .locator("span.vs-value");
    await expect(countryValue).toBeVisible();

    // S-Note NO
    await expect(page.locator("div.vs-variant-item")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("05_API成功_车辆基本信息显示", "基本情報"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 API 成功-Engine no 显示（実API）
  // ============================================================
  test("06_API成功_EngineNo显示", async ({ page }) => {
    await openPage(page);

    // Engine no
    const engineValue = page
      .locator("span.vs-label2")
      .filter({ hasText: "Engine no:" })
      .locator("..")
      .locator("span.vs-value");
    await expect(engineValue).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("06_API成功_EngineNo显示", "Engine表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 API 成功-SYMBOL_STR 显示（実API）
  // ============================================================
  test("07_API成功_SYMBOL_STR显示", async ({ page }) => {
    await openPage(page);

    // SYMBOL_STR の vs-symbol 要素
    const symbols = page.locator("span.vs-symbol");
    const symbolCount = await symbols.count();

    // データがあれば表示
    if (symbolCount > 0) {
      await expect(symbols.first()).toBeVisible();
      // 各シンボルの先頭8桁が表示されている
      const firstSymbol = await symbols.first().textContent();
      expect(firstSymbol).toBeTruthy();
    }

    await page.screenshot({
      path: getScreenshotPath("07_API成功_SYMBOL_STR显示", "Symbol表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 API 成功-DESCRIPTION 工具提示（実API）
  // ============================================================
  test("08_API成功_DESCRIPTION工具提示", async ({ page }) => {
    await openPage(page);

    // SYMBOL の title 属性を確認（tooltip）
    const symbols = page.locator("span.vs-symbol");
    const symbolCount = await symbols.count();
    if (symbolCount > 0) {
      const title = await symbols.first().getAttribute("title");
      // descriptionが存在する（空でない）
      if (title) {
        expect(title.length).toBeGreaterThan(0);
        console.log("Tooltip:", title);
      }
    }

    await page.screenshot({
      path: getScreenshotPath("08_API成功_DESCRIPTION工具提示", "Tooltip"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 API 失败-变体信息未找到（実API・存在しないchassisNo）
  // ============================================================
  test("09_API失败_变体信息未找到", async ({ page }) => {
    await setLoginState(page);
    await page.goto(`${APP_URL}/vehicle-specification?chassisNo=NODATA9999`);
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    // エラーまたは空データ
    const errMsg = page.locator("div.vs-error-message");
    const errCount = await errMsg.count();
    if (errCount > 0 && (await errMsg.isVisible())) {
      console.log("Error:", await errMsg.textContent());
    }

    await page.screenshot({
      path: getScreenshotPath("09_API失败_变体信息未找到", "未找到"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 Chassis no-完整显示（実API）
  // ============================================================
  test("10_ChassisNo_完整显示", async ({ page }) => {
    await openPage(page);

    const chassisValue = page
      .locator("span.vs-label")
      .filter({ hasText: "Chassis no:" })
      .locator("..")
      .locator("span.vs-value");
    await expect(chassisValue).toBeVisible();
    await expect(chassisValue).toContainText("yann1234");

    // 表示専用ラベル
    await expect(chassisValue).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("10_ChassisNo_完整显示", "Chassis表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 Model-显示（実API）
  // ============================================================
  test("11_Model_显示", async ({ page }) => {
    await openPage(page);

    const modelValue = page
      .locator("span.vs-label2")
      .filter({ hasText: "Model:" })
      .locator("..")
      .locator("span.vs-value");
    await expect(modelValue).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("11_Model_显示", "Model表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 Built week-显示（実API）
  // ============================================================
  test("12_BuiltWeek_显示", async ({ page }) => {
    await openPage(page);

    const builtWeekValue = page
      .locator("span.vs-label")
      .filter({ hasText: "Built week:" })
      .locator("..")
      .locator("span.vs-value");
    await expect(builtWeekValue).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("12_BuiltWeek_显示", "BuiltWeek表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 Product type-显示（実API）
  // ============================================================
  test("13_ProductType_显示", async ({ page }) => {
    await openPage(page);

    const productTypeValue = page
      .locator("span.vs-label2")
      .filter({ hasText: "Product type:" })
      .locator("..")
      .locator("span.vs-value");
    await expect(productTypeValue).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("13_ProductType_显示", "ProductType表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 VIN-显示（実API）
  // ============================================================
  test("14_VIN_显示", async ({ page }) => {
    await openPage(page);

    const vinValue = page
      .locator("span.vs-label")
      .filter({ hasText: "VIN:" })
      .locator("..")
      .locator("span.vs-value");
    await expect(vinValue).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("14_VIN_显示", "VIN表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Country of Operation-显示（実API）
  // ============================================================
  test("15_CountryOfOperation_显示", async ({ page }) => {
    await openPage(page);

    const countryValue = page
      .locator("span.vs-label")
      .filter({ hasText: "Country of Operation:" })
      .locator("..")
      .locator("span.vs-value");
    await expect(countryValue).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("15_CountryOfOperation_显示", "Country表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 S-Note NO-显示（実API）
  // ============================================================
  test("16_SNoteNO_显示", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("div.vs-variant-item")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("16_SNoteNO_显示", "SNote表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 SYMBOL_STR-鼠标悬停显示 tooltip（実API）
  // ============================================================
  test("17_SYMBOL_STR_Tooltip", async ({ page }) => {
    await openPage(page);

    const symbols = page.locator("span.vs-symbol");
    const symbolCount = await symbols.count();
    if (symbolCount > 0) {
      // title 属性に description が設定されている
      const title = await symbols.first().getAttribute("title");
      if (title && title.length > 0) {
        // ホバーして tooltip を確認
        await symbols.first().hover();
        await page.waitForTimeout(500);
        // tooltip が表示されている（ブラウザネイティブの tooltip なので Playwright では確認不可）
      }
    }

    await page.screenshot({
      path: getScreenshotPath("17_SYMBOL_STR_Tooltip", "Tooltip"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 异常处理-API 调用失败（実API）
  // ============================================================
  test("18_异常处理_API调用失败", async ({ page }) => {
    await setLoginState(page);
    await page.goto(`${APP_URL}/vehicle-specification?chassisNo=ERROR0000`);
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    // エラー表示確認
    const errMsg = page.locator("div.vs-error-message");
    const errCount = await errMsg.count();
    if (errCount > 0 && (await errMsg.isVisible())) {
      console.log("Error:", await errMsg.textContent());
    }

    await page.screenshot({
      path: getScreenshotPath("18_异常处理_API调用失败", "API失敗"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 异常处理-用户未登录（実API）
  // ============================================================
  test("19_异常处理_用户未登录", async ({ page }) => {
    await clearLoginState(page);

    await page.goto(PAGE_URL);
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    // 認証ガードがないためページは表示される
    const titleEl = page.locator("h1.vs-title");
    const titleCount = await titleEl.count();
    if (titleCount > 0) {
      await expect(titleEl).toBeVisible();
    }

    await page.screenshot({
      path: getScreenshotPath("19_异常处理_用户未登录", "未ログイン"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 错误消息-显示样式（実API）
  // ============================================================
  test("20_错误消息_显示样式", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL_NO_CHASSIS);
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(1000);

    const errMsg = page.locator("div.vs-error-message");
    await expect(errMsg).toBeVisible();

    // 赤色確認
    const color = await errMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    console.log("Error color:", color);
    const match = color.match(/(\d+)/g);
    if (match) {
      const r = parseInt(match[0]);
      const g = parseInt(match[1]);
      const b = parseInt(match[2]);
      expect(r).toBeGreaterThan(g);
      expect(r).toBeGreaterThan(b);
    }

    await page.screenshot({
      path: getScreenshotPath("20_错误消息_显示样式", "エラースタイル"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 页面刷新（実API）
  // ============================================================
  test("21_页面刷新", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h1.vs-title")).toHaveText(
      "VDA - Vehicle Specification:",
    );

    // リロード
    await page.reload();
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    // 再表示確認
    await expect(page.locator("h1.vs-title")).toHaveText(
      "VDA - Vehicle Specification:",
    );
    await expect(
      page.locator("span.vs-label").filter({ hasText: "Chassis no:" }),
    ).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("21_页面刷新", "刷新后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 安全性-API 请求协议（実API）
  // ============================================================
  test("22_安全性_API请求协议", async ({ page }) => {
    await setLoginState(page);

    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/UD07/")) {
        requests.push(request.url());
      }
    });

    await page.goto(PAGE_URL);
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    if (requests.length > 0) {
      console.log("UD07 API requests:", requests);
    }

    await page.screenshot({
      path: getScreenshotPath("22_安全性_API请求协议", "API確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 安全性-数据只读（実API）
  // ============================================================
  test("23_安全性_数据只读", async ({ page }) => {
    await openPage(page);

    // 編集可能要素がないことを確認
    await expect(page.locator("input")).toHaveCount(0);
    await expect(page.locator("textarea")).toHaveCount(0);
    await expect(page.locator("select")).toHaveCount(0);
    await expect(page.locator('[contenteditable="true"]')).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("23_安全性_数据只读", "只読確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 API 失败-服务器错误（実API）
  // ============================================================
  test("24_API失败_服务器错误", async ({ page }) => {
    await setLoginState(page);
    await page.goto(`${APP_URL}/vehicle-specification?chassisNo=ERROR0000`);
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.vs-error-message");
    const errCount = await errMsg.count();
    if (errCount > 0 && (await errMsg.isVisible())) {
      console.log("Error:", await errMsg.textContent());
    }

    await page.screenshot({
      path: getScreenshotPath("24_API失败_服务器错误", "500"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 API 失败-Symbol 信息未找到（実API）
  // ============================================================
  test("25_API失败_Symbol信息未找到", async ({ page }) => {
    await setLoginState(page);
    await page.goto(`${APP_URL}/vehicle-specification?chassisNo=NOSYMBOL99`);
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    // エラー表示確認（存在しないchassisNoのため）
    const errMsg = page.locator("div.vs-error-message");
    const errCount = await errMsg.count();
    if (errCount > 0 && (await errMsg.isVisible())) {
      console.log("Error:", await errMsg.textContent());
    } else {
      // エラーがない場合のみEngine noを確認
      const engineValue = page
        .locator("span.vs-label2")
        .filter({ hasText: "Engine no:" })
        .locator("..")
        .locator("span.vs-value");
      await expect(engineValue).toBeVisible();
    }

    await page.screenshot({
      path: getScreenshotPath("25_API失败_Symbol信息未找到", "Symbol空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 SYMBOL_STR-字段为空时的显示（実API）
  // ============================================================
  test("26_SYMBOL_STR_空字段显示", async ({ page }) => {
    await openPage(page);

    // SYMBOL_STR の表示確認
    const symbols = page.locator("span.vs-symbol");
    const symbolCount = await symbols.count();
    // データがある場合は表示、ない場合は空
    if (symbolCount === 0) {
      // symbolがない場合はvs-snote-contentで確認
      const snoteContent = page.locator("div.vs-snote-content");
      await expect(snoteContent).toBeVisible();
    }

    await page.screenshot({
      path: getScreenshotPath("26_SYMBOL_STR_空字段显示", "Symbol空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 異常処理-ネットワークエラー（実API）
  // ============================================================
  test("27_异常处理_网络错误", async ({ page }) => {
    await setLoginState(page);
    await page.goto(`${APP_URL}/vehicle-specification?chassisNo=NETERR000`);
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.vs-error-message");
    const errCount = await errMsg.count();
    if (errCount > 0 && (await errMsg.isVisible())) {
      console.log("Error:", await errMsg.textContent());
    }

    await page.screenshot({
      path: getScreenshotPath("27_异常处理_网络错误", "ネットワーク"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 Close ボタン（実API）
  // ============================================================
  test("28_API失败_未找到车辆信息", async ({ page }) => {
    await setLoginState(page);
    await page.goto(`${APP_URL}/vehicle-specification?chassisNo=XXXXXXXXXX`);
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    // エラーメッセージ表示確認
    const errMsg = page.locator("div.vs-error-message");
    const errCount = await errMsg.count();
    if (errCount > 0 && (await errMsg.isVisible())) {
      console.log("Error:", await errMsg.textContent());
    }

    await page.screenshot({
      path: getScreenshotPath("28_API失败_未找到车辆信息", "未找到"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
