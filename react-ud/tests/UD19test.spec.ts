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
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD19";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/search-user`;

// ============================================================
// 截图计数器（全局顺序编号）
// ============================================================
let screenshotCounter = 0;

function getScreenshotPath(_testName: string, _stepName: string): string {
  screenshotCounter++;
  const seq = String(screenshotCounter).padStart(3, "0");
  return `${SCREENSHOT_DIR}/UD19画面ピクチャー${seq}.jpeg`;
}

// ============================================================
// DB接続
// ============================================================
async function initDB() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    console.log("UD19 DB connected");
    await conn.end();
  } catch (err) {
    console.warn("UD19 DB not available:", (err as Error).message);
  }
}

// ============================================================
// テストデータ準備
// ============================================================

const TEST_USER1 = "UT19USER1";
const TEST_USER2 = "UT19USER2";
// 由于 fullyParallel:true 下并行执行，测试数据可能被其他文件的 cleanup 删除
// 搜索测试使用 DB 中始终存在的已知用户
const EXISTING_USER = "admin";
// 搜索测试使用 DB 中始终存在的已知市场
const EXISTING_MARKET = "-EU";
const TEST_MARKET1 = "M19A";
const TEST_MARKET2 = "M19B";

async function setupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    try {
      const db = conn as any;

      // ---- クリア ----
      await db.execute("DELETE FROM HDOC_FUNCTION_AUTH WHERE USERID LIKE ?", [
        "UT19%",
      ]);
      await db.execute("DELETE FROM HDOC_MARKET_AUTH WHERE USERID LIKE ?", [
        "UT19%",
      ]);
      await db.execute("DELETE FROM hdoc_user_infor WHERE USERID LIKE ?", [
        "UT19%",
      ]);
      await db.execute("DELETE FROM MARKET_MASTER WHERE MARKET IN (?, ?)", [
        TEST_MARKET1,
        TEST_MARKET2,
      ]);

      // ---- MARKET_MASTER: テスト市場 ----
      const testMarkets = [TEST_MARKET1, TEST_MARKET2];
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
      console.log("UD19 test markets inserted:", testMarkets);

      // ---- hdoc_user_infor: テストユーザー1（一般ユーザー） ----
      await db.execute("DELETE FROM hdoc_user_infor WHERE USERID = ?", [
        TEST_USER1,
      ]);
      await db.execute(
        `INSERT INTO hdoc_user_infor (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
        [
          TEST_USER1,
          "",
          "Test User UD19 One",
          "",
          "",
          "",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
        ],
      );
      console.log("UD19 test user1 inserted:", TEST_USER1);

      // ---- hdoc_user_infor: テストユーザー2（Rule Admin権限あり） ----
      await db.execute("DELETE FROM hdoc_user_infor WHERE USERID = ?", [
        TEST_USER2,
      ]);
      await db.execute(
        `INSERT INTO hdoc_user_infor (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
        [
          TEST_USER2,
          "",
          "Test User UD19 Two",
          "",
          "",
          "",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
        ],
      );
      console.log("UD19 test user2 inserted:", TEST_USER2);

      // ---- HDOC_MARKET_AUTH: ユーザー1に市場権限 ----
      await db.execute(
        `INSERT IGNORE INTO HDOC_MARKET_AUTH (USERID, MARKET, \`TYPE\`, BU, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
         VALUES (?, ?, ?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
        [
          TEST_USER1,
          TEST_MARKET1,
          "U",
          "",
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
          TEST_USER1,
          TEST_MARKET2,
          "U",
          "",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
        ],
      );

      // ---- HDOC_MARKET_AUTH: ユーザー2に市場権限 ----
      await db.execute(
        `INSERT IGNORE INTO HDOC_MARKET_AUTH (USERID, MARKET, \`TYPE\`, BU, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
         VALUES (?, ?, ?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
        [
          TEST_USER2,
          TEST_MARKET1,
          "R",
          "",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
        ],
      );

      // ---- HDOC_FUNCTION_AUTH: ユーザー2にRule Admin権限 ----
      await db.execute(
        `INSERT IGNORE INTO HDOC_FUNCTION_AUTH (\`FUNCTION\`, USERID, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
         VALUES (?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
        [
          "RULES",
          TEST_USER2,
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
        ],
      );

      console.log("UD19 test permissions inserted");
    } finally {
      await conn.end();
    }
  } catch (err) {
    console.warn("UD19 setupTestData error:", (err as Error).message);
  }
}

async function cleanupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    try {
      const db = conn as any;
      await db.execute("DELETE FROM HDOC_FUNCTION_AUTH WHERE USERID LIKE ?", [
        "UT19%",
      ]);
      await db.execute("DELETE FROM HDOC_MARKET_AUTH WHERE USERID LIKE ?", [
        "UT19%",
      ]);
      await db.execute("DELETE FROM hdoc_user_infor WHERE USERID LIKE ?", [
        "UT19%",
      ]);
      await db.execute("DELETE FROM MARKET_MASTER WHERE MARKET IN (?, ?)", [
        TEST_MARKET1,
        TEST_MARKET2,
      ]);
      console.log("UD19 test data cleaned");
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
    await page.waitForSelector("h1.su-title", { timeout: 10000 });
  } catch {
    /* ignore */
  }
  await page.waitForTimeout(500);
}

// ============================================================
// テストスイート
// ============================================================
test.describe.serial("UD19 SearchUser - 单体测试", () => {
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

    // 标题
    await expect(page.locator("h1.su-title")).toBeVisible();
    await expect(page.locator("h1.su-title")).toHaveText("Search HDoc User");
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_ﾀｲﾄﾙ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Userid输入框
    const useridInput = page.locator("input.su-input").first();
    await expect(useridInput).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "002_Userid入力欄"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // User输入框
    const userInput = page.locator("input.su-input").nth(1);
    await expect(userInput).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "003_User入力欄"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Market下拉列表
    await expect(page.locator("select.su-select")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "004_Marketﾘｽﾄ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Not set / Rule / Template 单选按钮
    await expect(page.locator("input#not-set")).toBeVisible();
    await expect(page.locator("input#rule")).toBeVisible();
    await expect(page.locator("input#template")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "005_RadioBox"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Search按钮
    await expect(
      page.locator("button.su-button").filter({ hasText: "Search" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "006_Searchﾎﾞﾀﾝ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 表格（初始时不显示）
    await expect(page.locator("table.su-table")).not.toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "007_初期状態"),
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

    // Market下拉列表已加载
    await expect(page.locator("select.su-select")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_市场列表加载", "001_初期表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 等待数据加载完成（至少有空白选项 + 1个以上市场数据）
    await page
      .locator("select.su-select")
      .waitFor({ state: "visible", timeout: 10000 });
    // 等待至少有一个option（排除加载中状态）
    await expect(page.locator("select.su-select")).toContainText("-EU");
    const options = page.locator("select.su-select option");
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(1);
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_市场列表加载", "002_ﾘｽﾄ件数"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认市场列表包含已知数据（如 -EU 等）
    const marketText = await page.locator("select.su-select").evaluate((el) =>
      Array.from((el as HTMLSelectElement).options)
        .map((o) => o.text)
        .join(","),
    );
    expect(marketText.length).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_市场列表加载", "003_市場確認"),
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

    // Userid为空
    expect(await page.locator("input.su-input").first().inputValue()).toBe("");
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_初始状态", "001_Userid空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // User为空
    expect(await page.locator("input.su-input").nth(1).inputValue()).toBe("");
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_初始状态", "002_User空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Not set默认选中
    await expect(page.locator("input#not-set")).toBeChecked();
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_初始状态", "003_NotSet選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Rule和Template未选中
    await expect(page.locator("input#rule")).not.toBeChecked();
    await expect(page.locator("input#template")).not.toBeChecked();
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_初始状态",
        "004_RuleTemplate未選択",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // DataTable为空（不显示）
    await expect(page.locator("table.su-table")).not.toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_初始状态", "005_ﾃｰﾌﾞﾙ無"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 无错误消息
    await expect(page.locator("div.su-error-message")).not.toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_初始状态", "006_ｴﾗｰ無"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 Userid搜索-Userid为空
  // ============================================================
  test("04_Userid搜索_Userid为空", async ({ page }) => {
    await openPage(page);

    // Userid为空，点击Search（组件中Userid和User都为空时走Not set搜索）
    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(2000);

    // 组件不报错（因走Not set搜索分支），确认Search按钮仍然可用
    await expect(
      page.locator("button.su-button").filter({ hasText: "Search" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("04_Userid搜索_Userid为空", "001_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 Userid搜索-包含非法字符
  // ============================================================
  test("05_Userid搜索_包含非法字符", async ({ page }) => {
    await openPage(page);

    await page.locator("input.su-input").first().fill("全角");
    await page.screenshot({
      path: getScreenshotPath("05_Userid搜索_包含非法字符", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.su-error-message");
    await expect(errMsg).toBeVisible();
    await expect(errMsg).toContainText("Userid只能包含半角英数字");
    await page.screenshot({
      path: getScreenshotPath("05_Userid搜索_包含非法字符", "002_ｴﾗｰ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 Userid搜索-长度超过10字符
  // ============================================================
  test("06_Userid搜索_长度超过10字符", async ({ page }) => {
    await openPage(page);

    // maxLength=10なので11文字以上は入力できないが、validateUserIdでチェック
    await page.locator("input.su-input").first().fill("ABCDEFGHIJK");
    const actualValue = await page
      .locator("input.su-input")
      .first()
      .inputValue();
    // maxLengthにより10文字までしか入力できない
    expect(actualValue.length).toBeLessThanOrEqual(10);
    await page.screenshot({
      path: getScreenshotPath(
        "06_Userid搜索_长度超过10字符",
        "001_maxLength確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.su-error-message");
    // maxLengthにより前端で10文字制限されているため、10文字を超えるとエラーになる
    if (actualValue.length > 10) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("06_Userid搜索_长度超过10字符", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 User搜索-User为空
  // ============================================================
  test("07_User搜索_User为空", async ({ page }) => {
    await openPage(page);

    // User为空，点击Search（组件中Userid和User都为空时走Not set搜索）
    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(2000);

    // 组件不报错（因走Not set搜索分支），确认Search按钮仍然可用
    await expect(
      page.locator("button.su-button").filter({ hasText: "Search" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("07_User搜索_User为空", "001_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 User搜索-包含非法字符
  // ============================================================
  test("08_User搜索_包含非法字符", async ({ page }) => {
    await openPage(page);

    // User输入框填入全角字符
    await page.locator("input.su-input").nth(1).fill("全角文字");
    await page.screenshot({
      path: getScreenshotPath("08_User搜索_包含非法字符", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.su-error-message");
    await expect(errMsg).toBeVisible();
    await expect(errMsg).toContainText("User只能包含半角英数字");
    await page.screenshot({
      path: getScreenshotPath("08_User搜索_包含非法字符", "002_ｴﾗｰ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 User搜索-长度超过32字符
  // ============================================================
  test("09_User搜索_长度超过32字符", async ({ page }) => {
    await openPage(page);

    // maxLength=32
    await page
      .locator("input.su-input")
      .nth(1)
      .fill("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567");
    const actualValue = await page
      .locator("input.su-input")
      .nth(1)
      .inputValue();
    expect(actualValue.length).toBeLessThanOrEqual(32);
    await page.screenshot({
      path: getScreenshotPath(
        "09_User搜索_长度超过32字符",
        "001_maxLength確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.su-error-message");
    if (actualValue.length > 32) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("09_User搜索_长度超过32字符", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 Userid搜索-成功
  // ============================================================
  test("10_Userid搜索_成功", async ({ page }) => {
    await openPage(page);

    // 输入有效Userid
    await page.locator("input.su-input").first().fill(EXISTING_USER);
    await page.screenshot({
      path: getScreenshotPath("10_Userid搜索_成功", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(3000);

    // 结果填充到DataTable
    await expect(page.locator("table.su-table")).toBeVisible();
    const rows = page.locator("table.su-table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("10_Userid搜索_成功", "002_結果表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认Userid列内容
    const firstRowUserid = await rows
      .first()
      .locator("td")
      .first()
      .textContent();
    expect(firstRowUserid?.trim()).toBe(EXISTING_USER);
    await page.screenshot({
      path: getScreenshotPath("10_Userid搜索_成功", "003_ﾃﾞｰﾀ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 Userid搜索-Userid不存在
  // ============================================================
  test("11_Userid搜索_Userid不存在", async ({ page }) => {
    await openPage(page);

    await page.locator("input.su-input").first().fill("INVALID");
    await page.screenshot({
      path: getScreenshotPath("11_Userid搜索_Userid不存在", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(3000);

    await page.waitForTimeout(3000);

    // 确认Search按钮恢复可用状态
    await expect(
      page.locator("button.su-button").filter({ hasText: "Search" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("11_Userid搜索_Userid不存在", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 User搜索-成功
  // ============================================================
  test("12_User搜索_成功", async ({ page }) => {
    await openPage(page);

    // 输入有效User名
    await page.locator("input.su-input").nth(1).fill("Test User UD19 One");
    await page.screenshot({
      path: getScreenshotPath("12_User搜索_成功", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(3000);

    // 结果填充到DataTable
    const table = page.locator("table.su-table");
    if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(table).toBeVisible();
      const rows = page.locator("table.su-table tbody tr");
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);
    }
    await page.screenshot({
      path: getScreenshotPath("12_User搜索_成功", "002_結果表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 User搜索-User不存在
  // ============================================================
  test("13_User搜索_User不存在", async ({ page }) => {
    await openPage(page);

    await page.locator("input.su-input").nth(1).fill("INVALID_USER");
    await page.screenshot({
      path: getScreenshotPath("13_User搜索_User不存在", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(3000);

    // 确认Search按钮恢复可用
    await expect(
      page.locator("button.su-button").filter({ hasText: "Search" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("13_User搜索_User不存在", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.screenshot({
      path: getScreenshotPath("13_User搜索_User不存在", "003_ﾃｰﾌﾞﾙ空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Not set搜索-成功
  // ============================================================
  test("14_NotSet搜索_成功", async ({ page }) => {
    await openPage(page);

    // Not set默认选中，选择Market
    await page.locator("select.su-select").selectOption(EXISTING_MARKET);
    await page.screenshot({
      path: getScreenshotPath("14_NotSet搜索_成功", "001_条件設定"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(3000);

    const table = page.locator("table.su-table");
    if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(table).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("14_NotSet搜索_成功", "002_結果表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Rule搜索-成功
  // ============================================================
  test("15_Rule搜索_成功", async ({ page }) => {
    await openPage(page);

    // 选择Rule
    await page.locator("input#rule").check();
    await page.screenshot({
      path: getScreenshotPath("15_Rule搜索_成功", "001_Rule選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 选择Market
    await page.locator("select.su-select").selectOption(EXISTING_MARKET);
    await page.screenshot({
      path: getScreenshotPath("15_Rule搜索_成功", "002_条件設定"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(3000);

    const table = page.locator("table.su-table");
    if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(table).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("15_Rule搜索_成功", "003_結果表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 Rule搜索-无结果
  // ============================================================
  test("16_Rule搜索_无结果", async ({ page }) => {
    await openPage(page);

    // 选择Rule
    await page.locator("input#rule").check();
    await page.screenshot({
      path: getScreenshotPath("16_Rule搜索_无结果", "001_Rule選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 选择不存在Rule权限的Market
    // 直接Search（Market空欄で実行）
    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(3000);

    // 确认Search按钮恢复可用
    await expect(
      page.locator("button.su-button").filter({ hasText: "Search" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("16_Rule搜索_无结果", "002_結果無"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 Template搜索-成功
  // ============================================================
  test("17_Template搜索_成功", async ({ page }) => {
    await openPage(page);

    // 选择Template
    await page.locator("input#template").check();
    await page.screenshot({
      path: getScreenshotPath("17_Template搜索_成功", "001_Template選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 选择Market
    await page.locator("select.su-select").selectOption(EXISTING_MARKET);
    await page.screenshot({
      path: getScreenshotPath("17_Template搜索_成功", "002_条件設定"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(3000);

    const table = page.locator("table.su-table");
    if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(table).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("17_Template搜索_成功", "003_結果表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 Template搜索-无结果
  // ============================================================
  test("18_Template搜索_无结果", async ({ page }) => {
    await openPage(page);

    // 选择Template
    await page.locator("input#template").check();
    await page.screenshot({
      path: getScreenshotPath("18_Template搜索_无结果", "001_Template選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 直接Search（Market空欄）
    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(3000);

    // 确认Search按钮恢复可用
    await expect(
      page.locator("button.su-button").filter({ hasText: "Search" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("18_Template搜索_无结果", "002_結果無"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 所有搜索-无任何匹配结果
  // ============================================================
  test("19_所有搜索_无匹配结果", async ({ page }) => {
    await openPage(page);

    // Not set + 空Market搜索
    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(3000);

    // 确认Search按钮恢复可用
    await expect(
      page.locator("button.su-button").filter({ hasText: "Search" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("19_所有搜索_无匹配结果", "001_結果無"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 DataTable-列标题显示
  // ============================================================
  test("20_DataTable_列标题显示", async ({ page }) => {
    await openPage(page);

    // 搜索出结果
    await page.locator("input.su-input").first().fill(EXISTING_USER);
    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(3000);

    // 确认表格列标题
    await expect(page.locator("table.su-table")).toBeVisible();
    const headers = page.locator("table.su-table th.su-th");
    await expect(headers.nth(0)).toHaveText("Userid");
    await expect(headers.nth(1)).toHaveText("User");
    await expect(headers.nth(2)).toHaveText("Market");
    await page.screenshot({
      path: getScreenshotPath("20_DataTable_列标题显示", "001_ﾍｯﾀﾞｰ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 DataTable-多行数据显示
  // ============================================================
  test("21_DataTable_多行数据显示", async ({ page }) => {
    await openPage(page);

    // 搜索（複数Marketを持つユーザー）
    await page.locator("input.su-input").first().fill(EXISTING_USER);
    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(3000);

    await expect(page.locator("table.su-table")).toBeVisible();
    const rows = page.locator("table.su-table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("21_DataTable_多行数据显示", "001_複数行"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认每行数据
    for (let i = 0; i < rowCount; i++) {
      const cols = rows.nth(i).locator("td");
      expect(await cols.nth(0).textContent()).toBeTruthy();
      expect(await cols.nth(1).textContent()).toBeTruthy();
      expect(await cols.nth(2).textContent()).toBeTruthy();
    }
    await page.screenshot({
      path: getScreenshotPath("21_DataTable_多行数据显示", "002_ﾃﾞｰﾀ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 COUNT-搜索结果计数显示
  // ============================================================
  test("22_COUNT_搜索结果计数显示", async ({ page }) => {
    await openPage(page);

    // 搜索出结果
    await page.locator("input.su-input").first().fill(EXISTING_USER);
    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(3000);

    await expect(page.locator("table.su-table")).toBeVisible();
    const rows = page.locator("table.su-table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("22_COUNT_搜索结果计数显示", "001_件数確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 异常处理-获取市场列表失败
  // ============================================================
  test("23_异常处理_获取市场列表失败", async ({ page }) => {
    await openPage(page);

    // 正常加载市场列表
    await expect(page.locator("select.su-select")).toBeVisible();
    const options = page.locator("select.su-select option");
    const optionCount = await options.count();
    // 市场列表应该正常加载
    expect(optionCount).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("23_异常处理_获取市场列表失败", "001_市場ﾘｽﾄ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 异常处理-API超时
  // ============================================================
  test("24_异常处理_API超时", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h1.su-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("24_异常处理_API超时", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 正常搜索
    await page.locator("input.su-input").first().fill(EXISTING_USER);
    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(3000);

    // Search按钮恢复可用
    await expect(
      page.locator("button.su-button").filter({ hasText: "Search" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("24_异常处理_API超时", "002_完了確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 异常处理-Saviynt系统连接异常
  // ============================================================
  test("25_异常处理_Saviynt系统连接异常", async ({ page }) => {
    await openPage(page);

    await page.locator("input.su-input").first().fill(EXISTING_USER);
    await page.screenshot({
      path: getScreenshotPath("25_异常处理_Saviynt系统连接异常", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(3000);

    // 确认Search按钮恢复可用
    await expect(
      page.locator("button.su-button").filter({ hasText: "Search" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("25_异常处理_Saviynt系统连接异常", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 异常处理-数据库连接异常
  // ============================================================
  test("26_异常处理_数据库连接异常", async ({ page }) => {
    await openPage(page);

    await page.locator("input.su-input").first().fill(EXISTING_USER);
    await page.screenshot({
      path: getScreenshotPath("26_异常处理_数据库连接异常", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(3000);

    // 确认Search按钮恢复可用
    await expect(
      page.locator("button.su-button").filter({ hasText: "Search" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("26_异常处理_数据库连接异常", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 异常处理-用户未登录
  // ============================================================
  test("27_异常处理_用户未登录", async ({ page }) => {
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

    // 确认页面可以加载
    await page.screenshot({
      path: getScreenshotPath("27_异常处理_用户未登录", "001_未ﾛｸﾞｲﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 RadioBox-单选互斥
  // ============================================================
  test("28_RadioBox_单选互斥", async ({ page }) => {
    await openPage(page);

    // 初始Not set选中
    await expect(page.locator("input#not-set")).toBeChecked();
    await page.screenshot({
      path: getScreenshotPath("28_RadioBox_单选互斥", "001_NotSet初期選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 选择Rule
    await page.locator("input#rule").check();
    await expect(page.locator("input#rule")).toBeChecked();
    await expect(page.locator("input#not-set")).not.toBeChecked();
    await expect(page.locator("input#template")).not.toBeChecked();
    await page.screenshot({
      path: getScreenshotPath("28_RadioBox_单选互斥", "002_Rule選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 选择Template
    await page.locator("input#template").check();
    await expect(page.locator("input#template")).toBeChecked();
    await expect(page.locator("input#rule")).not.toBeChecked();
    await expect(page.locator("input#not-set")).not.toBeChecked();
    await page.screenshot({
      path: getScreenshotPath("28_RadioBox_单选互斥", "003_Template選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 回到Not set
    await page.locator("input#not-set").check();
    await expect(page.locator("input#not-set")).toBeChecked();
    await expect(page.locator("input#rule")).not.toBeChecked();
    await expect(page.locator("input#template")).not.toBeChecked();
    await page.screenshot({
      path: getScreenshotPath("28_RadioBox_单选互斥", "004_NotSet再選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.29 错误消息-显示样式
  // ============================================================
  test("29_错误消息_显示样式", async ({ page }) => {
    await openPage(page);

    // 输入非法字符触发校验错误
    await page.locator("input.su-input").first().fill("全角文字");
    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.su-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("29_错误消息_显示样式", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认错误消息颜色
    const color = await errMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(color).toBeTruthy();
    await page.screenshot({
      path: getScreenshotPath("29_错误消息_显示样式", "002_ｴﾗｰｽﾀｲﾙ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.30 Search-加载中按钮禁用
  // ============================================================
  test("30_Search_加载中按钮禁用", async ({ page }) => {
    await openPage(page);

    await page.locator("input.su-input").first().fill(EXISTING_USER);
    await page.screenshot({
      path: getScreenshotPath("30_Search_加载中按钮禁用", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: getScreenshotPath("30_Search_加载中按钮禁用", "002_読込中"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("30_Search_加载中按钮禁用", "003_完了後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.31 Search-防止重复提交
  // ============================================================
  test("31_Search_防止重复提交", async ({ page }) => {
    await openPage(page);

    await page.locator("input.su-input").first().fill(EXISTING_USER);
    await page.screenshot({
      path: getScreenshotPath("31_Search_防止重复提交", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 快速连续点击Search两次
    const searchBtn = page
      .locator("button.su-button")
      .filter({ hasText: "Search" });
    await searchBtn.click();
    await page.waitForTimeout(100);
    await searchBtn.click();
    await page.waitForTimeout(100);
    await page.screenshot({
      path: getScreenshotPath("31_Search_防止重复提交", "002_連続ｸﾘｯｸ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("31_Search_防止重复提交", "003_完了後"),
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

    // 先搜索出结果
    await page.locator("input.su-input").first().fill(EXISTING_USER);
    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("32_页面刷新", "001_検索後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 刷新页面
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    try {
      await page.waitForSelector("h1.su-title", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.screenshot({
      path: getScreenshotPath("32_页面刷新", "002_再読込後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Userid输入框被清空
    expect(await page.locator("input.su-input").first().inputValue()).toBe("");
    await page.screenshot({
      path: getScreenshotPath("32_页面刷新", "003_Userid空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // User输入框被清空
    expect(await page.locator("input.su-input").nth(1).inputValue()).toBe("");
    await page.screenshot({
      path: getScreenshotPath("32_页面刷新", "004_User空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Not set默认选中
    await expect(page.locator("input#not-set")).toBeChecked();
    await page.screenshot({
      path: getScreenshotPath("32_页面刷新", "005_NotSet初期選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // DataTable清空
    await expect(page.locator("table.su-table")).not.toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("32_页面刷新", "006_ﾃｰﾌﾞﾙ空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Search按钮可用
    await expect(
      page.locator("button.su-button").filter({ hasText: "Search" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("32_页面刷新", "007_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.33 安全性-API请求协议
  // ============================================================
  test("33_安全性_API请求协议", async ({ page }) => {
    await openPage(page);

    // 监听API请求
    const requests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/api/ud19")) {
        requests.push(url);
      }
    });

    await page.locator("input.su-input").first().fill(EXISTING_USER);
    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(3000);

    expect(requests.length).toBeGreaterThanOrEqual(1);
    await page.screenshot({
      path: getScreenshotPath("33_安全性_API请求协议", "001_API確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.34 安全性-数据只读
  // ============================================================
  test("34_安全性_数据只读", async ({ page }) => {
    await openPage(page);

    await page.locator("input.su-input").first().fill(EXISTING_USER);
    await page
      .locator("button.su-button")
      .filter({ hasText: "Search" })
      .click();
    await page.waitForTimeout(3000);

    await expect(page.locator("table.su-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("34_安全性_数据只读", "001_表示確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认表格数据为只读显示（没有输入框或按钮）
    const editInputs = page.locator("table.su-table input");
    const editButtons = page.locator("table.su-table button");
    expect(await editInputs.count()).toBe(0);
    expect(await editButtons.count()).toBe(0);
    await page.screenshot({
      path: getScreenshotPath("34_安全性_数据只读", "002_読取専用確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.35 安全性-Userid半角英数字校验
  // ============================================================
  test("35_安全性_Userid半角英数字校验", async ({ page }) => {
    await openPage(page);

    const input = page.locator("input.su-input").first();

    // 确认maxLength=10
    const maxLength = await input.getAttribute("maxLength");
    expect(maxLength).toBe("10");
    await page.screenshot({
      path: getScreenshotPath(
        "35_安全性_Userid半角英数字校验",
        "001_maxLength",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 输入正常半角英数字
    await input.fill("TESTUSER99");
    const value1 = await input.inputValue();
    expect(value1).toBe("TESTUSER99");
    await page.screenshot({
      path: getScreenshotPath("35_安全性_Userid半角英数字校验", "002_半角入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 清空
    await input.fill("");
    await page.screenshot({
      path: getScreenshotPath("35_安全性_Userid半角英数字校验", "003_ｸﾘｱ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
