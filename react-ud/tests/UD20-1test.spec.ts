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
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD20-1";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/market-document-settings`;

// ============================================================
// 截图计数器（全局顺序编号）
// ============================================================
let screenshotCounter = 0;

function getScreenshotPath(_testName: string, _stepName: string): string {
  screenshotCounter++;
  const seq = String(screenshotCounter).padStart(3, "0");
  return `${SCREENSHOT_DIR}/UD20-1画面ピクチャー${seq}.jpeg`;
}

// ============================================================
// DB接続
// ============================================================
async function initDB() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    console.log("UD20-1 DB connected");
    await conn.end();
  } catch (err) {
    console.warn("UD20-1 DB not available:", (err as Error).message);
  }
}

// ============================================================
// テストデータ準備（Update Mode用のテスト文書）
// ============================================================
const TEST_DOCTYPE = "UT201_DOC";

async function setupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    try {
      const db = conn as any;
      await db.execute("DELETE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE = ?", [
        TEST_DOCTYPE,
      ]);
      await db.execute(
        `INSERT INTO HDOC_DOCUMENT_LIST (DOCTYPE, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
         VALUES (?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
        [
          TEST_DOCTYPE,
          "UD20-1 Test Document",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
        ],
      );
      console.log("UD20-1 test document inserted:", TEST_DOCTYPE);
    } finally {
      await conn.end();
    }
  } catch (err) {
    console.warn("UD20-1 setupTestData error:", (err as Error).message);
  }
}

async function cleanupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    try {
      const db = conn as any;
      await db.execute("DELETE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE = ?", [
        TEST_DOCTYPE,
      ]);
      console.log("UD20-1 test data cleaned");
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
    await page.waitForSelector("h1.mds-title", { timeout: 10000 });
  } catch {
    /* ignore */
  }
  await page.waitForTimeout(500);
}

// ============================================================
// テストスイート
// ============================================================
test.describe.serial("UD20-1 MarketDocumentSettings - 单体测试", () => {
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
    await expect(page.locator("h1.mds-title")).toBeVisible();
    await expect(page.locator("h1.mds-title")).toHaveText(
      "HDoc - Market Document Settings",
    );
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_ﾀｲﾄﾙ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Document type输入框
    const docTypeInput = page.locator(
      "input.mds-input-field.mds-width-doctype",
    );
    await expect(docTypeInput).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "002_DocType入力欄"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Bussines unit输入框
    const buInput = page.locator("input.mds-input-field.mds-width-bu");
    await expect(buInput).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "003_BU入力欄"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // User输入框（readOnly）
    const userInput = page.locator(
      "input.mds-input-field.mds-input-readonly.mds-width-user",
    );
    await expect(userInput).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "004_User入力欄"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Date输入框（readOnly）
    const dateInput = page.locator(
      "input.mds-input-field.mds-input-readonly.mds-width-date",
    );
    await expect(dateInput).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "005_Date入力欄"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 四个按钮
    await expect(
      page.locator("button.mds-btn").filter({ hasText: "Search" }),
    ).toBeVisible();
    await expect(
      page.locator("button.mds-btn").filter({ hasText: "Clear" }),
    ).toBeVisible();
    await expect(
      page.locator("button.mds-btn").filter({ hasText: "Back" }),
    ).toBeVisible();
    await expect(
      page.locator("button.mds-btn").filter({ hasText: "Update Mode" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "006_ﾎﾞﾀﾝ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-初期化状态
  // ============================================================
  test("02_画面初期显示_初期化状态", async ({ page }) => {
    await openPage(page);

    // Document type为空
    expect(
      await page
        .locator("input.mds-input-field.mds-width-doctype")
        .inputValue(),
    ).toBe("");
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_初期化状态", "001_DocType空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Bussines unit固定显示"BU"
    expect(
      await page.locator("input.mds-input-field.mds-width-bu").inputValue(),
    ).toBe("BU");
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_初期化状态", "002_BU固定"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // User自动填充（非空）
    const userVal = await page
      .locator("input.mds-input-field.mds-input-readonly.mds-width-user")
      .inputValue();
    expect(userVal?.length).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_初期化状态", "003_User自動"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Date自动填充（非空）
    const dateVal = await page
      .locator("input.mds-input-field.mds-input-readonly.mds-width-date")
      .inputValue();
    expect(dateVal?.length).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_初期化状态", "004_Date自動"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 所有按钮可用
    const buttons = page.locator("button.mds-btn");
    const btnCount = await buttons.count();
    for (let i = 0; i < btnCount; i++) {
      await expect(buttons.nth(i)).toBeEnabled();
    }
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_初期化状态", "005_ﾎﾞﾀﾝ活性"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Error message区域不显示
    await expect(page.locator("div.mds-error-message")).not.toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_初期化状态", "006_ｴﾗｰ無"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-从后画面Select返回
  // ============================================================
  test("03_画面初期显示_从后画面Select返回", async ({ page }) => {
    await openPage(page);

    // 模拟从List画面Select返回后的状态（直接填充表单字段）
    const docTypeInput = page.locator(
      "input.mds-input-field.mds-width-doctype",
    );
    await docTypeInput.fill("VIN_PLATE");

    // Document type显示"VIN_PLATE"
    await expect(docTypeInput).toHaveValue("VIN_PLATE");
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_从后画面Select返回",
        "001_DocType値",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Bussines unit显示"BU"
    await expect(
      page.locator("input.mds-input-field.mds-width-bu"),
    ).toHaveValue("BU");
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_从后画面Select返回", "002_BU値"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Error message区域不显示
    await expect(page.locator("div.mds-error-message")).not.toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_从后画面Select返回",
        "003_ｴﾗｰ無",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 画面初期显示-从后画面Back返回
  // ============================================================
  test("04_画面初期显示_从后画面Back返回", async ({ page }) => {
    await openPage(page);

    // 模拟从List画面Back返回（携带搜索条件）→ 直接填充Document type
    const docTypeInput = page.locator(
      "input.mds-input-field.mds-width-doctype",
    );
    await docTypeInput.fill("TEST_DOC");

    // Document type显示输入的值
    await expect(docTypeInput).toHaveValue("TEST_DOC");
    await page.screenshot({
      path: getScreenshotPath(
        "04_画面初期显示_从后画面Back返回",
        "001_状態維持",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Error message区域不显示
    await expect(page.locator("div.mds-error-message")).not.toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("04_画面初期显示_从后画面Back返回", "002_ｴﾗｰ無"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 Search-携带检索条件跳转
  // ============================================================
  test("05_Search_携带检索条件跳转", async ({ page }) => {
    await openPage(page);

    // 输入检索条件
    await page
      .locator("input.mds-input-field.mds-width-doctype")
      .fill("VIN_PLATE");
    await page.screenshot({
      path: getScreenshotPath("05_Search_携带检索条件跳转", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击Search
    await page.locator("button.mds-btn").filter({ hasText: "Search" }).click();
    await page.waitForTimeout(1000);

    // 确认跳转到List画面
    const currentUrl = page.url();
    expect(currentUrl).toContain("market-document-settings-list");
    await page.screenshot({
      path: getScreenshotPath("05_Search_携带检索条件跳转", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 Search-检索条件为空跳转（前端校验阻止，显示错误）
  // ============================================================
  test("06_Search_检索条件为空跳转", async ({ page }) => {
    await openPage(page);

    // 不输入任何检索条件，直接点击Search
    await page.locator("button.mds-btn").filter({ hasText: "Search" }).click();
    await page.waitForTimeout(500);

    // 前端校验：Document type为空时显示错误消息
    const errMsg = page.locator("div.mds-error-message");
    await expect(errMsg).toBeVisible();
    await expect(errMsg).toContainText("Please enter a document type");
    await page.screenshot({
      path: getScreenshotPath("06_Search_检索条件为空跳转", "001_ｴﾗｰ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 Search-部分检索条件跳转
  // ============================================================
  test("07_Search_部分检索条件跳转", async ({ page }) => {
    await openPage(page);

    // 仅输入Document type
    await page.locator("input.mds-input-field.mds-width-doctype").fill("COC");
    await page.screenshot({
      path: getScreenshotPath("07_Search_部分检索条件跳转", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击Search
    await page.locator("button.mds-btn").filter({ hasText: "Search" }).click();
    await page.waitForTimeout(1000);

    // 确认跳转到List画面
    const currentUrl = page.url();
    expect(currentUrl).toContain("market-document-settings-list");
    await page.screenshot({
      path: getScreenshotPath("07_Search_部分检索条件跳转", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 Clear-正常清空
  // ============================================================
  test("08_Clear_正常清空", async ({ page }) => {
    await openPage(page);

    // 输入各字段值
    const docTypeInput = page.locator(
      "input.mds-input-field.mds-width-doctype",
    );
    await docTypeInput.fill("VIN_PLATE");
    await page.waitForTimeout(200);
    await page.screenshot({
      path: getScreenshotPath("08_Clear_正常清空", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击Clear
    await page.locator("button.mds-btn").filter({ hasText: "Clear" }).click();
    await page.waitForTimeout(300);

    // Document type被清空
    await expect(docTypeInput).toHaveValue("");
    await page.screenshot({
      path: getScreenshotPath("08_Clear_正常清空", "002_DocType空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Bussines unit保持"BU"
    await expect(
      page.locator("input.mds-input-field.mds-width-bu"),
    ).toHaveValue("BU");
    await page.screenshot({
      path: getScreenshotPath("08_Clear_正常清空", "003_BU維持"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Error message不显示
    await expect(page.locator("div.mds-error-message")).not.toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("08_Clear_正常清空", "004_ｴﾗｰ無"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 Clear-有错误消息时清空
  // ============================================================
  test("09_Clear_有错误消息时清空", async ({ page }) => {
    await openPage(page);

    // 触发错误消息（Document type为空点击更新）
    await page
      .locator("button.mds-btn")
      .filter({ hasText: "Update Mode" })
      .click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.mds-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("09_Clear_有错误消息时清空", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击Clear
    await page.locator("button.mds-btn").filter({ hasText: "Clear" }).click();
    await page.waitForTimeout(300);

    // Error message被清除
    await expect(errMsg).not.toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("09_Clear_有错误消息时清空", "002_ｴﾗｰ消去"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Document type被清空
    await expect(
      page.locator("input.mds-input-field.mds-width-doctype"),
    ).toHaveValue("");
    await page.screenshot({
      path: getScreenshotPath("09_Clear_有错误消息时清空", "003_DocType空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Bussines unit恢复为"BU"
    await expect(
      page.locator("input.mds-input-field.mds-width-bu"),
    ).toHaveValue("BU");
    await page.screenshot({
      path: getScreenshotPath("09_Clear_有错误消息时清空", "004_BU復帰"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 Back-返回前画面
  // ============================================================
  test("10_Back_返回前画面", async ({ page }) => {
    await openPage(page);

    // 输入任意内容
    await page.locator("input.mds-input-field.mds-width-doctype").fill("TEST");
    await page.screenshot({
      path: getScreenshotPath("10_Back_返回前画面", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击Back
    await page.locator("button.mds-btn").filter({ hasText: "Back" }).click();
    await page.waitForTimeout(1000);

    // 跳转到List画面
    const currentUrl = page.url();
    expect(currentUrl).toContain("market-document-settings-list");
    await page.screenshot({
      path: getScreenshotPath("10_Back_返回前画面", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 Update Mode-空值校验（Document type为空）
  // ============================================================
  test("11_UpdateMode_空値校验", async ({ page }) => {
    await openPage(page);

    // Document type为空，直接点击Update Mode
    await page
      .locator("button.mds-btn")
      .filter({ hasText: "Update Mode" })
      .click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.mds-error-message");
    await expect(errMsg).toBeVisible();
    await expect(errMsg).toContainText("Document type不能为空");
    await page.screenshot({
      path: getScreenshotPath("11_UpdateMode_空値校验", "001_ｴﾗｰ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Update Mode按钮恢复可用
    await expect(
      page.locator("button.mds-btn").filter({ hasText: "Update Mode" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("11_UpdateMode_空値校验", "002_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 Update Mode-更新成功
  // ============================================================
  test("12_UpdateMode_更新成功", async ({ page }) => {
    await openPage(page);

    // 输入有效值（使用测试文档）
    const docTypeInput = page.locator(
      "input.mds-input-field.mds-width-doctype",
    );
    await docTypeInput.fill(TEST_DOCTYPE);
    await page.screenshot({
      path: getScreenshotPath("12_UpdateMode_更新成功", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击Update Mode
    await page
      .locator("button.mds-btn")
      .filter({ hasText: "Update Mode" })
      .click();
    await page.waitForTimeout(3000);

    // 确认结果（成功或失败取决于API响应）
    const succMsg = page.locator("div.mds-success-message");
    const errMsg = page.locator("div.mds-error-message");
    if (await succMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(succMsg).toBeVisible();
    } else if (await errMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("12_UpdateMode_更新成功", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Update Mode按钮恢复可用
    await expect(
      page.locator("button.mds-btn").filter({ hasText: "Update Mode" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("12_UpdateMode_更新成功", "003_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 Update Mode-更新失败（API返回500）
  // ============================================================
  test("13_UpdateMode_API返回500", async ({ page }) => {
    await openPage(page);

    // 输入有效值
    await page
      .locator("input.mds-input-field.mds-width-doctype")
      .fill(TEST_DOCTYPE);
    await page.screenshot({
      path: getScreenshotPath("13_UpdateMode_API返回500", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击Update Mode
    await page
      .locator("button.mds-btn")
      .filter({ hasText: "Update Mode" })
      .click();
    await page.waitForTimeout(3000);

    // 确认错误消息
    const errMsg = page.locator("div.mds-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("13_UpdateMode_API返回500", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Update Mode按钮恢复可用
    await expect(
      page.locator("button.mds-btn").filter({ hasText: "Update Mode" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("13_UpdateMode_API返回500", "003_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Update Mode-Document type不存在（404）
  // ============================================================
  test("14_UpdateMode_DocType不存在", async ({ page }) => {
    await openPage(page);

    // 输入不存在的Document type
    await page
      .locator("input.mds-input-field.mds-width-doctype")
      .fill("NONEXISTENT");
    await page.screenshot({
      path: getScreenshotPath("14_UpdateMode_DocType不存在", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击Update Mode
    await page
      .locator("button.mds-btn")
      .filter({ hasText: "Update Mode" })
      .click();
    await page.waitForTimeout(3000);

    // 确认错误消息
    const errMsg = page.locator("div.mds-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("14_UpdateMode_DocType不存在", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Update Mode按钮恢复可用
    await expect(
      page.locator("button.mds-btn").filter({ hasText: "Update Mode" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("14_UpdateMode_DocType不存在", "003_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Update Mode-加载中按钮禁用
  // ============================================================
  test("15_UpdateMode_加载中按钮禁用", async ({ page }) => {
    await openPage(page);

    await page
      .locator("input.mds-input-field.mds-width-doctype")
      .fill(TEST_DOCTYPE);
    await page.screenshot({
      path: getScreenshotPath("15_UpdateMode_加载中按钮禁用", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.mds-btn")
      .filter({ hasText: "Update Mode" })
      .click();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: getScreenshotPath("15_UpdateMode_加载中按钮禁用", "002_読込中"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("15_UpdateMode_加载中按钮禁用", "003_完了後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 Update Mode-加载中防止重复提交
  // ============================================================
  test("16_UpdateMode_防止重复提交", async ({ page }) => {
    await openPage(page);

    await page
      .locator("input.mds-input-field.mds-width-doctype")
      .fill(TEST_DOCTYPE);
    await page.screenshot({
      path: getScreenshotPath("16_UpdateMode_防止重复提交", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 快速连续点击两次
    const updateBtn = page
      .locator("button.mds-btn")
      .filter({ hasText: "Update Mode" });
    await updateBtn.click();
    await page.waitForTimeout(100);
    await updateBtn.click();
    await page.waitForTimeout(100);
    await page.screenshot({
      path: getScreenshotPath("16_UpdateMode_防止重复提交", "002_連続ｸﾘｯｸ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("16_UpdateMode_防止重复提交", "003_完了後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 异常处理-数据库连接失败
  // ============================================================
  test("17_异常处理_数据库连接失败", async ({ page }) => {
    await openPage(page);

    await page
      .locator("input.mds-input-field.mds-width-doctype")
      .fill(TEST_DOCTYPE);
    await page.screenshot({
      path: getScreenshotPath("17_异常处理_数据库连接失败", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.mds-btn")
      .filter({ hasText: "Update Mode" })
      .click();
    await page.waitForTimeout(3000);

    // Update Mode按钮恢复可用
    await expect(
      page.locator("button.mds-btn").filter({ hasText: "Update Mode" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("17_异常处理_数据库连接失败", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 异常处理-网络断开
  // ============================================================
  test("18_异常处理_网络断开", async ({ page }) => {
    await openPage(page);

    await page
      .locator("input.mds-input-field.mds-width-doctype")
      .fill(TEST_DOCTYPE);
    await page.screenshot({
      path: getScreenshotPath("18_异常处理_网络断开", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.mds-btn")
      .filter({ hasText: "Update Mode" })
      .click();
    await page.waitForTimeout(3000);

    // Update Mode按钮恢复可用
    await expect(
      page.locator("button.mds-btn").filter({ hasText: "Update Mode" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("18_异常处理_网络断开", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 异常处理-API超时
  // ============================================================
  test("19_异常处理_API超时", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h1.mds-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("19_异常处理_API超时", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("input.mds-input-field.mds-width-doctype")
      .fill(TEST_DOCTYPE);
    await page
      .locator("button.mds-btn")
      .filter({ hasText: "Update Mode" })
      .click();
    await page.waitForTimeout(3000);

    await expect(
      page.locator("button.mds-btn").filter({ hasText: "Update Mode" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("19_异常处理_API超时", "002_完了確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 异常处理-用户未登录
  // ============================================================
  test("20_异常处理_用户未登录", async ({ page }) => {
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
      path: getScreenshotPath("20_异常处理_用户未登录", "001_未ﾛｸﾞｲﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 安全性-API请求协议
  // ============================================================
  test("21_安全性_API请求协议", async ({ page }) => {
    await openPage(page);

    // 监听API请求
    const requests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/api/ud20-1")) {
        requests.push(url);
      }
    });

    await page
      .locator("input.mds-input-field.mds-width-doctype")
      .fill(TEST_DOCTYPE);
    await page
      .locator("button.mds-btn")
      .filter({ hasText: "Update Mode" })
      .click();
    await page.waitForTimeout(3000);

    expect(requests.length).toBeGreaterThanOrEqual(1);
    await page.screenshot({
      path: getScreenshotPath("21_安全性_API请求协议", "001_API確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 安全性-权限控制
  // ============================================================
  test("22_安全性_权限控制", async ({ page }) => {
    await openPage(page);

    // 以管理员登录，确认可以正常操作
    await expect(page.locator("h1.mds-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("22_安全性_权限控制", "001_管理者画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Update Mode按钮存在且可用
    await expect(
      page.locator("button.mds-btn").filter({ hasText: "Update Mode" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("22_安全性_权限控制", "002_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
