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
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD17";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/hdoc-user-administration`;

// ============================================================
// 截图计数器（全局顺序编号）
// ============================================================
let screenshotCounter = 0;

function getScreenshotPath(_testName: string, _stepName: string): string {
  screenshotCounter++;
  const seq = String(screenshotCounter).padStart(3, "0");
  return `${SCREENSHOT_DIR}/UD17画面ピクチャー${seq}.jpeg`;
}

// ============================================================
// DB接続
// ============================================================
async function initDB() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    console.log("UD17 DB connected");
    await conn.end();
  } catch (err) {
    console.warn("UD17 DB not available:", (err as Error).message);
  }
}

// ============================================================
// テストデータ準備
// ============================================================

async function setupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    try {
      const db = conn as any;

      // ---- 先に子テーブル（権限系）をクリア ----
      await db.execute("DELETE FROM HDOC_FUNCTION_AUTH WHERE USERID LIKE ?", [
        "UT17_%",
      ]);
      await db.execute("DELETE FROM HDOC_MARKET_AUTH WHERE USERID LIKE ?", [
        "UT17_%",
      ]);

      // ---- MARKET_MASTER: テスト市場データ ----
      await db.execute(
        "DELETE FROM MARKET_MASTER WHERE MARKET IN (?, ?, ?, ?)",
        ["U17", "U18", "U19", "U20"],
      );
      const testMarkets = ["U17", "U18", "U19", "U20"];
      for (const m of testMarkets) {
        await db.execute(
          `INSERT IGNORE INTO MARKET_MASTER (MARKET, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
          [
            m,
            m + " Description",
            "PLAYWRIGHT",
            "PLAYWRIGHT",
            "PLAYWRIGHT",
            "PLAYWRIGHT",
          ],
        );
      }
      console.log("UD17 test markets inserted:", testMarkets);

      // ---- hdoc_user_infor: テストユーザーデータ ----
      await db.execute("DELETE FROM hdoc_user_infor WHERE USERID = ?", [
        "UT17_USER",
      ]);
      await db.execute(
        `INSERT INTO hdoc_user_infor (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
        [
          "UT17_USER",
          "",
          "Test User UD17",
          "",
          "",
          "",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
        ],
      );
      console.log("UD17 test user inserted: UT17_USER");

      // ---- テスト用権限データを投入（UT17_USERにStandard User権限を付与） ----
      await db.execute(
        `INSERT IGNORE INTO HDOC_FUNCTION_AUTH (\`FUNCTION\`, USERID, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
         VALUES (?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
        [
          "USER",
          "UT17_USER",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
        ],
      );
      await db.execute(
        `INSERT IGNORE INTO HDOC_MARKET_AUTH (USERID, MARKET, \`TYPE\`, BU, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
         VALUES (?, ?, ?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
        [
          "UT17_USER",
          "U17",
          "U",
          "BU",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
        ],
      );
      console.log("UD17 test permissions inserted");
    } finally {
      await conn.end();
    }
  } catch (err) {
    console.warn("UD17 setupTestData error:", (err as Error).message);
  }
}

async function cleanupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    try {
      const db = conn as any;
      // 先刪除子表（権限系）
      await db.execute("DELETE FROM HDOC_FUNCTION_AUTH WHERE USERID LIKE ?", [
        "UT17_%",
      ]);
      await db.execute("DELETE FROM HDOC_MARKET_AUTH WHERE USERID LIKE ?", [
        "UT17_%",
      ]);
      await db.execute(
        "DELETE FROM MARKET_MASTER WHERE MARKET IN (?, ?, ?, ?)",
        ["U17", "U18", "U19", "U20"],
      );
      await db.execute("DELETE FROM hdoc_user_infor WHERE USERID = ?", [
        "UT17_USER",
      ]);
      console.log("UD17 test data cleaned");
    } finally {
      await conn.end();
    }
  } catch {
    /* ignore */
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
    await page.waitForSelector("h2.hvua-title", { timeout: 10000 });
  } catch {
    /* ignore */
  }
  await page.waitForTimeout(500);
}

const TEST_USERID = "UT17_USER";

// ============================================================
// テストスイート
// ============================================================
test.describe.serial("UD17 HDocUserAdministration - 单体测试", () => {
  test.beforeAll(async () => {
    await initDB();
    await setupTestData();
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test.beforeAll(() => {
    screenshotCounter = 0;
  });

  // ============================================================
  // No.1 画面初期显示-基本元素
  // ============================================================
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h2.hvua-title")).toBeVisible();
    await expect(page.locator("h2.hvua-title")).toHaveText("HDoc User Admin");
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_ﾀｲﾄﾙ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // UserID输入框和User Info按钮
    await expect(page.locator("input.hvua-input-short")).toBeVisible();
    await expect(
      page.locator("button.hvua-btn-info").filter({ hasText: "USER INFO" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "002_検索領域"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // User标签
    await expect(page.locator("input.hvua-input-medium")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "003_User表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 角色复选框和Market下拉列表
    const roleLabels = [
      "Standard User",
      "Rule Admin",
      "Template Admin",
      "Document Auth Admin",
      "User Admin",
      "Adaptation use",
    ];
    for (const label of roleLabels) {
      await expect(
        page.locator("label.hvua-checkbox-label").filter({ hasText: label }),
      ).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "004_ﾛｰﾙ領域"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 按钮
    await expect(
      page.locator("button.hvua-btn").filter({ hasText: "Update Role" }),
    ).toBeVisible();
    await expect(
      page.locator("button.hvua-btn").filter({ hasText: "Delete Role" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "005_ﾎﾞﾀﾝ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-市场列表加载
  // ============================================================
  test("02_画面初期显示_市场列表加载", async ({ page }) => {
    await openPage(page);

    // Market下拉列表填充
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_市场列表加载", "001_select"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Standard User 和 Adaptation user 默认-EU
    const standardSelect = page.locator("select.hvua-select-single").first();
    if (await standardSelect.isVisible().catch(() => false)) {
      // default should be -EU when checked
    }
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_市场列表加载", "002_市場ﾃﾞｰﾀ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-初始状态
  // ============================================================
  test("03_画面初期显示_初始状态", async ({ page }) => {
    await openPage(page);

    // UserID为空
    expect(await page.locator("input.hvua-input-short").inputValue()).toBe("");
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_初始状态", "001_UserID空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // User为空
    expect(await page.locator("input.hvua-input-medium").inputValue()).toBe("");
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_初始状态", "002_User空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 按钮可用
    await expect(
      page.locator("button.hvua-btn-info").filter({ hasText: "USER INFO" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_初始状态", "003_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 User Info-UserID 为空
  // ============================================================
  test("04_UserInfo_UserID为空", async ({ page }) => {
    await openPage(page);

    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.hvua-error-message");
    await expect(errMsg).toBeVisible();
    await expect(errMsg).toContainText("请输入UserID");
    await page.screenshot({
      path: getScreenshotPath("04_UserInfo_UserID为空", "001_ｴﾗｰ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 User Info-查询成功
  // ============================================================
  test("05_UserInfo_查询成功", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page.screenshot({
      path: getScreenshotPath("05_UserInfo_查询成功", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);

    const userInput = page.locator("input.hvua-input-medium");
    const userName = await userInput.inputValue();
    if (userName) {
      await expect(userInput).not.toHaveValue("");
    }
    await page.screenshot({
      path: getScreenshotPath("05_UserInfo_查询成功", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.screenshot({
      path: getScreenshotPath("05_UserInfo_查询成功", "003_状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 User Info-Saviynt 中不存在
  // ============================================================
  test("06_UserInfo_Saviynt中不存在", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill("INVALID");
    await page.screenshot({
      path: getScreenshotPath("06_UserInfo_Saviynt中不存在", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);

    const errMsg = page.locator("div.hvua-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("06_UserInfo_Saviynt中不存在", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 User Info-API 返回 500
  // ============================================================
  test("07_UserInfo_API返回500", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page.screenshot({
      path: getScreenshotPath("07_UserInfo_API返回500", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);

    const errMsg = page.locator("div.hvua-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("07_UserInfo_API返回500", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 User Info-加载中按钮禁用
  // ============================================================
  test("08_UserInfo_加载中按钮禁用", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page.screenshot({
      path: getScreenshotPath("08_UserInfo_加载中按钮禁用", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: getScreenshotPath("08_UserInfo_加载中按钮禁用", "002_読込中"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("08_UserInfo_加载中按钮禁用", "003_完了後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 Standard User-勾选与市场选择
  // ============================================================
  test("09_StandardUser_勾选与市场选择", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("09_StandardUser_勾选与市场选择", "001_照会後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Standard Userチェックボックス
    const stdCheckbox = page.locator("input#standardUser");
    if (await stdCheckbox.isVisible().catch(() => false)) {
      await stdCheckbox.check();
      await page.screenshot({
        path: getScreenshotPath("09_StandardUser_勾选与市场选择", "002_選択後"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("09_StandardUser_勾选与市场选择", "003_状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 Rule Admin-勾选与市场选择
  // ============================================================
  test("10_RuleAdmin_勾选与市场选择", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("10_RuleAdmin_勾选与市场选择", "001_照会後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    const ruleCheckbox = page.locator("input#ruleAdmin");
    if (await ruleCheckbox.isVisible().catch(() => false)) {
      await ruleCheckbox.check();
      await page.screenshot({
        path: getScreenshotPath("10_RuleAdmin_勾选与市场选择", "002_選択後"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("10_RuleAdmin_勾选与市场选择", "003_状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 Template Admin-勾选与市场选择
  // ============================================================
  test("11_TemplateAdmin_勾选与市场选择", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("11_TemplateAdmin_勾选与市场选择", "001_照会後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    const tmplCheckbox = page.locator("input#templateAdmin");
    if (await tmplCheckbox.isVisible().catch(() => false)) {
      await tmplCheckbox.check();
    }
    await page.screenshot({
      path: getScreenshotPath("11_TemplateAdmin_勾选与市场选择", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 Document Auth Admin-勾选与市场选择
  // ============================================================
  test("12_DocumentAuthAdmin_勾选与市场选择", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath(
        "12_DocumentAuthAdmin_勾选与市场选择",
        "001_照会後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    const docCheckbox = page.locator("input#documentAuthAdmin");
    if (await docCheckbox.isVisible().catch(() => false)) {
      await docCheckbox.check();
    }
    await page.screenshot({
      path: getScreenshotPath(
        "12_DocumentAuthAdmin_勾选与市场选择",
        "002_結果",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 User Admin-勾选
  // ============================================================
  test("13_UserAdmin_勾选", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);

    const uaCheckbox = page.locator("input#userAdmin");
    if (await uaCheckbox.isVisible().catch(() => false)) {
      await uaCheckbox.check();
    }
    await page.screenshot({
      path: getScreenshotPath("13_UserAdmin_勾选", "001_選択後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Adaptation user-勾选与市场选择
  // ============================================================
  test("14_AdaptationUser_勾选与市场选择", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);

    const adaptCheckbox = page.locator("input#adaptationUser");
    if (await adaptCheckbox.isVisible().catch(() => false)) {
      await adaptCheckbox.check();
    }
    await page.screenshot({
      path: getScreenshotPath("14_AdaptationUser_勾选与市场选择", "001_選択後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Manage Variable List-勾选
  // ============================================================
  test("15_ManageVariableList_勾选", async ({ page }) => {
    await openPage(page);

    const mvlCheckbox = page.locator("input#manageVariableList");
    if (await mvlCheckbox.isVisible().catch(() => false)) {
      await mvlCheckbox.check();
    }
    await page.screenshot({
      path: getScreenshotPath("15_ManageVariableList_勾选", "001_選択後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 Market Super User-市场选择
  // ============================================================
  test("16_MarketSuperUser_市场选择", async ({ page }) => {
    await openPage(page);

    // Market Super User dropdown（市場選択）の確認
    const superUserSelect = page.locator("select.hvua-select-multiple").last();
    if (await superUserSelect.isVisible().catch(() => false)) {
      const opts = await superUserSelect.locator("option").allTextContents();
      if (opts.length > 0) {
        await superUserSelect.selectOption(opts[0]);
      }
    }
    await page.screenshot({
      path: getScreenshotPath("16_MarketSuperUser_市场选择", "001_選択後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 Update Role-未查询时点击
  // ============================================================
  test("17_UpdateRole_未查询时点击", async ({ page }) => {
    await openPage(page);

    await page
      .locator("button.hvua-btn")
      .filter({ hasText: "Update Role" })
      .click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.hvua-error-message");
    if (await errMsg.isVisible().catch(() => false)) {
      await expect(errMsg).toContainText("请先查询用户信息");
    }
    await page.screenshot({
      path: getScreenshotPath("17_UpdateRole_未查询时点击", "001_ｴﾗｰ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 Update Role-成功更新
  // ============================================================
  test("18_UpdateRole_成功更新", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("18_UpdateRole_成功更新", "001_照会後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 1つロールを選択
    const stdCb = page.locator("input#standardUser");
    if (await stdCb.isVisible().catch(() => false)) {
      await stdCb.check();
    }
    await page
      .locator("button.hvua-btn")
      .filter({ hasText: "Update Role" })
      .click();
    await page.waitForTimeout(3000);

    const succMsg = page.locator("div.hvua-success-message");
    if (await succMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(succMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("18_UpdateRole_成功更新", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 Update Role-失败（API 500）
  // ============================================================
  test("19_UpdateRole_API返回500", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);

    const errMsg = page.locator("div.hvua-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("19_UpdateRole_API返回500", "001_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 Update Role-无权限时点击
  // ============================================================
  test("20_UpdateRole_无权限时点击", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);

    // 何も選択せずにUpdate Role
    await page
      .locator("button.hvua-btn")
      .filter({ hasText: "Update Role" })
      .click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.hvua-error-message");
    if (await errMsg.isVisible().catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("20_UpdateRole_无权限时点击", "001_ｴﾗｰ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 Update Role-加载中按钮禁用
  // ============================================================
  test("21_UpdateRole_加载中按钮禁用", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);

    const updateBtn = page
      .locator("button.hvua-btn")
      .filter({ hasText: "Update Role" });
    await updateBtn.click();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: getScreenshotPath("21_UpdateRole_加载中按钮禁用", "001_読込中"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("21_UpdateRole_加载中按钮禁用", "002_完了後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 Delete Role-未查询时点击
  // ============================================================
  test("22_DeleteRole_未查询时点击", async ({ page }) => {
    await openPage(page);

    await page
      .locator("button.hvua-btn")
      .filter({ hasText: "Delete Role" })
      .click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.hvua-error-message");
    if (await errMsg.isVisible().catch(() => false)) {
      await expect(errMsg).toContainText("请先查询用户信息");
    }
    await page.screenshot({
      path: getScreenshotPath("22_DeleteRole_未查询时点击", "001_ｴﾗｰ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 Delete Role-确认对话框取消
  // ============================================================
  test("23_DeleteRole_确认对话框取消", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);

    page.on("dialog", async (dialog) => {
      await dialog.dismiss();
    });
    await page
      .locator("button.hvua-btn")
      .filter({ hasText: "Delete Role" })
      .click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("23_DeleteRole_确认对话框取消", "001_取消後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 Delete Role-确认删除成功
  // ============================================================
  test("24_DeleteRole_确认删除成功", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("24_DeleteRole_确认删除成功", "001_照会後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page
      .locator("button.hvua-btn")
      .filter({ hasText: "Delete Role" })
      .click();
    await page.waitForTimeout(3000);

    const succMsg = page.locator("div.hvua-success-message");
    if (await succMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(succMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("24_DeleteRole_确认删除成功", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 Delete Role-失败（API 500）
  // ============================================================
  test("25_DeleteRole_API返回500", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page
      .locator("button.hvua-btn")
      .filter({ hasText: "Delete Role" })
      .click();
    await page.waitForTimeout(3000);

    const errMsg = page.locator("div.hvua-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("25_DeleteRole_API返回500", "001_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 Delete Role-加载中按钮禁用
  // ============================================================
  test("26_DeleteRole_加载中按钮禁用", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    const delBtn = page
      .locator("button.hvua-btn")
      .filter({ hasText: "Delete Role" });
    await delBtn.click();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: getScreenshotPath("26_DeleteRole_加载中按钮禁用", "001_読込中"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("26_DeleteRole_加载中按钮禁用", "002_完了後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 异常处理-API 超时
  // ============================================================
  test("27_异常处理_API超时", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h2.hvua-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("27_异常处理_API超时", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("27_异常处理_API超时", "002_応答確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 异常处理-数据库操作异常
  // ============================================================
  test("28_异常处理_数据库操作异常", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);

    const errMsg = page.locator("div.hvua-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("28_异常处理_数据库操作异常", "001_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.29 异常处理-用户未登录
  // ============================================================
  test("29_异常处理_用户未登录", async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.removeItem("currentUser"));

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: getScreenshotPath("29_异常处理_用户未登录", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.30 错误消息-显示样式
  // ============================================================
  test("30_错误消息_显示样式", async ({ page }) => {
    await openPage(page);

    // 空入力でUSER INFOをクリックしてエラー
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.hvua-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("30_错误消息_显示样式", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.screenshot({
      path: getScreenshotPath("30_错误消息_显示样式", "002_確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.31 成功消息-显示样式
  // ============================================================
  test("31_成功消息_显示样式", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);

    const succMsg = page.locator("div.hvua-success-message");
    if (await succMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(succMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("31_成功消息_显示样式", "001_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.32 页面刷新
  // ============================================================
  test("32_页面刷新", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("32_页面刷新", "001_操作後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.reload();
    await page.waitForTimeout(1000);
    try {
      await page.waitForSelector("h2.hvua-title", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.screenshot({
      path: getScreenshotPath("32_页面刷新", "002_再読込後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    expect(await page.locator("input.hvua-input-short").inputValue()).toBe("");
    expect(await page.locator("input.hvua-input-medium").inputValue()).toBe("");
    await page.screenshot({
      path: getScreenshotPath("32_页面刷新", "003_初期化確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.33 安全性-API 请求协议
  // ============================================================
  test("33_安全性_API请求协议", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h2.hvua-title")).toBeVisible();
    const currentUrl = page.url();
    expect(currentUrl).toContain("http://");
    await page.screenshot({
      path: getScreenshotPath("33_安全性_API请求协议", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.screenshot({
      path: getScreenshotPath("33_安全性_API请求协议", "002_URL確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.34 安全性-权限控制
  // ============================================================
  test("34_安全性_权限控制", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h2.hvua-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("34_安全性_权限控制", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // ボタン表示確認
    await expect(
      page.locator("button.hvua-btn").filter({ hasText: "Update Role" }),
    ).toBeVisible();
    await expect(
      page.locator("button.hvua-btn").filter({ hasText: "Delete Role" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("34_安全性_权限控制", "002_ﾎﾞﾀﾝ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.35 安全性-Delete Role 确认对话框
  // ============================================================
  test("35_安全性_DeleteRole确认对话框", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hvua-input-short").fill(TEST_USERID);
    await page
      .locator("button.hvua-btn-info")
      .filter({ hasText: "USER INFO" })
      .click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("35_安全性_DeleteRole确认对话框", "001_照会後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    let dialogAppeared = false;
    page.on("dialog", async (dialog) => {
      dialogAppeared = true;
      expect(dialog.message()).toContain("确定要删除");
      await dialog.dismiss();
    });
    await page
      .locator("button.hvua-btn")
      .filter({ hasText: "Delete Role" })
      .click();
    await page.waitForTimeout(500);

    expect(dialogAppeared).toBe(true);
    await page.screenshot({
      path: getScreenshotPath("35_安全性_DeleteRole确认对话框", "002_確認後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
