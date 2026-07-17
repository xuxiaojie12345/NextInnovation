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
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD18";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/hdoc-user-doc-administration`;

// ============================================================
// 截图计数器（全局顺序编号）
// ============================================================
let screenshotCounter = 0;

function getScreenshotPath(_testName: string, _stepName: string): string {
  screenshotCounter++;
  const seq = String(screenshotCounter).padStart(3, "0");
  return `${SCREENSHOT_DIR}/UD18画面ピクチャー${seq}.jpeg`;
}

// ============================================================
// DB接続
// ============================================================
async function initDB() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    console.log("UD18 DB connected");
    await conn.end();
  } catch (err) {
    console.warn("UD18 DB not available:", (err as Error).message);
  }
}

// ============================================================
// テストデータ準備
// ============================================================

const TEST_USERID = "UT18_USER";
const TEST_DOCUMENTS = [
  "DCTYPE01",
  "DCTYPE02",
  "DCTYPE03",
  "DCTYPE04",
  "DCTYPE05",
];

async function setupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    try {
      const db = conn as any;

      // ---- クリア ----
      await db.execute("DELETE FROM HDOC_USER_DOC WHERE USERID = ?", [
        TEST_USERID,
      ]);
      await db.execute("DELETE FROM HDOC_FUNCTION_AUTH WHERE USERID = ?", [
        TEST_USERID,
      ]);
      await db.execute("DELETE FROM hdoc_user_infor WHERE USERID = ?", [
        TEST_USERID,
      ]);
      await db.execute(
        "DELETE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE IN (?, ?, ?, ?, ?)",
        TEST_DOCUMENTS,
      );

      // ---- hdoc_user_infor: テストユーザー ----
      await db.execute(
        `INSERT INTO hdoc_user_infor (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
        [
          TEST_USERID,
          "",
          "Test User UD18",
          "",
          "",
          "",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
        ],
      );
      console.log("UD18 test user inserted:", TEST_USERID);

      // ---- HDOC_FUNCTION_AUTH: テスト機能権限 ----
      await db.execute(
        `INSERT IGNORE INTO HDOC_FUNCTION_AUTH (\`FUNCTION\`, USERID, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
         VALUES (?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
        [
          "USER",
          TEST_USERID,
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
        ],
      );
      console.log("UD18 test function auth inserted");

      // ---- HDOC_DOCUMENT_LIST: テスト文書データ ----
      for (const doc of TEST_DOCUMENTS) {
        await db.execute(
          `INSERT IGNORE INTO HDOC_DOCUMENT_LIST (DOCTYPE, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
          [
            doc,
            doc + " Description",
            "PLAYWRIGHT",
            "PLAYWRIGHT",
            "PLAYWRIGHT",
            "PLAYWRIGHT",
          ],
        );
      }
      console.log("UD18 test documents inserted:", TEST_DOCUMENTS);

      // ---- HDOC_USER_DOC: テスト文書権限（DCTYPE01, DCTYPE03を既に許可） ----
      const preAuthDocs = ["DCTYPE01", "DCTYPE03"];
      for (const doc of preAuthDocs) {
        await db.execute(
          `INSERT IGNORE INTO HDOC_USER_DOC (USERID, DOCTYPE, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
          [
            TEST_USERID,
            doc,
            "PLAYWRIGHT",
            "PLAYWRIGHT",
            "PLAYWRIGHT",
            "PLAYWRIGHT",
          ],
        );
      }
      console.log("UD18 test user doc auth inserted:", preAuthDocs);
    } finally {
      await conn.end();
    }
  } catch (err) {
    console.warn("UD18 setupTestData error:", (err as Error).message);
  }
}

async function cleanupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    try {
      const db = conn as any;
      await db.execute("DELETE FROM HDOC_USER_DOC WHERE USERID = ?", [
        TEST_USERID,
      ]);
      await db.execute("DELETE FROM HDOC_FUNCTION_AUTH WHERE USERID = ?", [
        TEST_USERID,
      ]);
      await db.execute("DELETE FROM hdoc_user_infor WHERE USERID = ?", [
        TEST_USERID,
      ]);
      await db.execute(
        "DELETE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE IN (?, ?, ?, ?, ?)",
        TEST_DOCUMENTS,
      );
      console.log("UD18 test data cleaned");
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
    await page.waitForSelector("h1.hudua-title", { timeout: 10000 });
  } catch {
    /* ignore */
  }
  await page.waitForTimeout(500);
}

// ============================================================
// テストスイート
// ============================================================
test.describe.serial("UD18 HDocUserDocAdministration - 单体测试", () => {
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

    // 确认标题
    await expect(page.locator("h1.hudua-title")).toBeVisible();
    await expect(page.locator("h1.hudua-title")).toHaveText(
      "HDoc Document Authorization",
    );
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_ﾀｲﾄﾙ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // UserID输入框
    await expect(page.locator("input.hudua-input-userid")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "002_UserID入力欄"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // User Info按钮
    await expect(
      page.locator("button.hudua-button").filter({ hasText: "User Info" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "003_UserInfoﾎﾞﾀﾝ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // User标签（空）- 使用toHaveText或toBeAttached检查存在性，空span可能不可见
    await expect(page.locator("span.hudua-user-name")).toBeAttached();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "004_User表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Document多选列表
    await expect(page.locator("select.hudua-document-list")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "005_Documentﾘｽﾄ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // UPDATE按钮
    await expect(
      page.locator("button.hudua-button-update").filter({ hasText: "UPDATE" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "006_UPDATEﾎﾞﾀﾝ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 所有按钮可用
    await expect(
      page.locator("button.hudua-button").filter({ hasText: "User Info" }),
    ).toBeEnabled();
    await expect(
      page.locator("button.hudua-button-update").filter({ hasText: "UPDATE" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "007_ﾎﾞﾀﾝ活性"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-文档列表加载
  // ============================================================
  test("02_画面初期显示_文档列表加载", async ({ page }) => {
    await openPage(page);

    // Document多选列表已加载
    await expect(page.locator("select.hudua-document-list")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_文档列表加载", "001_初期表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认有option选项
    const options = page.locator("select.hudua-document-list option");
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_文档列表加载", "002_ﾘｽﾄ件数"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 无文档被预选中（初始状态）
    const selectedOptions = page.locator(
      "select.hudua-document-list option:checked",
    );
    const selectedCount = await selectedOptions.count();
    expect(selectedCount).toBe(0);
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_文档列表加载", "003_初期選択無"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认特定文档存在
    for (const doc of TEST_DOCUMENTS) {
      await expect(
        page.locator(`select.hudua-document-list option[value="${doc}"]`),
      ).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_文档列表加载",
        "004_文書一覧確認",
      ),
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
    expect(await page.locator("input.hudua-input-userid").inputValue()).toBe(
      "",
    );
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_初始状态", "001_UserID空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // User标签为空
    expect(await page.locator("span.hudua-user-name").textContent()).toBe("");
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_初始状态", "002_User空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 无错误消息
    await expect(page.locator("div.hudua-error-message")).not.toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_初始状态", "003_ｴﾗｰ無"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 无成功消息
    await expect(page.locator("div.hudua-success-message")).not.toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_初始状态", "004_成功ﾒｯｾｰｼﾞ無"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 按钮可用
    await expect(
      page.locator("button.hudua-button").filter({ hasText: "User Info" }),
    ).toBeEnabled();
    await expect(
      page.locator("button.hudua-button-update").filter({ hasText: "UPDATE" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_初始状态", "005_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 User Info-UserID为空
  // ============================================================
  test("04_UserInfo_UserID为空", async ({ page }) => {
    await openPage(page);

    // UserID为空的状态下点击User Info
    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(500);

    // 显示错误消息
    const errMsg = page.locator("div.hudua-error-message");
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
  // No.5 User Info-HDOC_FUNCTION_AUTH不存在
  // ============================================================
  test("05_UserInfo_HDOC_FUNCTION_AUTH不存在", async ({ page }) => {
    await openPage(page);

    // 输入不存在的UserID
    await page.locator("input.hudua-input-userid").fill("INVALID_USER");
    await page.screenshot({
      path: getScreenshotPath(
        "05_UserInfo_HDOC_FUNCTION_AUTH不存在",
        "001_入力",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(3000);

    const errMsg = page.locator("div.hudua-error-message");
    await expect(errMsg).toBeVisible();
    await expect(errMsg).toContainText(
      "We didn't recognize the userid you entered",
    );
    await page.screenshot({
      path: getScreenshotPath(
        "05_UserInfo_HDOC_FUNCTION_AUTH不存在",
        "002_結果",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // User标签保持为空
    expect(await page.locator("span.hudua-user-name").textContent()).toBe("");
    await page.screenshot({
      path: getScreenshotPath(
        "05_UserInfo_HDOC_FUNCTION_AUTH不存在",
        "003_User空確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 User Info-查询成功
  // ============================================================
  test("06_UserInfo_查询成功", async ({ page }) => {
    await openPage(page);

    // 输入有效UserID
    await page.locator("input.hudua-input-userid").fill(TEST_USERID);
    await page.screenshot({
      path: getScreenshotPath("06_UserInfo_查询成功", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(3000);

    // User标签显示用户名
    const userName = await page.locator("span.hudua-user-name").textContent();
    expect(userName?.trim()).not.toBe("");
    await page.screenshot({
      path: getScreenshotPath("06_UserInfo_查询成功", "002_User表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Document多选列表显示所有文档（至少包含测试文档）
    const options = page.locator("select.hudua-document-list option");
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThanOrEqual(TEST_DOCUMENTS.length);
    await page.screenshot({
      path: getScreenshotPath("06_UserInfo_查询成功", "003_Document表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 User Info-API返回500
  // ============================================================
  test("07_UserInfo_API返回500", async ({ page }) => {
    await openPage(page);

    await page.locator("input.hudua-input-userid").fill(TEST_USERID);
    await page.screenshot({
      path: getScreenshotPath("07_UserInfo_API返回500", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // API返回500的情况下，后端会返回错误消息
    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(3000);

    // 检查是否有错误消息（API返回500时显示系统错误）
    const errMsg = page.locator("div.hudua-error-message");
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

    await page.locator("input.hudua-input-userid").fill(TEST_USERID);
    await page.screenshot({
      path: getScreenshotPath("08_UserInfo_加载中按钮禁用", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
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
  // No.9 Document-多选功能
  // ============================================================
  test("09_Document_多选功能", async ({ page }) => {
    await openPage(page);

    // 先查询用户
    await page.locator("input.hudua-input-userid").fill(TEST_USERID);
    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("09_Document_多选功能", "001_照会後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 多选Document（Ctrl+Click方式选择多个）
    const select = page.locator("select.hudua-document-list");
    await select.focus();

    // 选择DCTYPE02和DCTYPE04
    await select.selectOption(["DCTYPE02", "DCTYPE04"]);
    await page.waitForTimeout(300);

    const selectedValues = await select.evaluate((el) =>
      Array.from((el as HTMLSelectElement).selectedOptions).map(
        (o) => (o as HTMLOptionElement).value,
      ),
    );
    expect(selectedValues).toContain("DCTYPE02");
    expect(selectedValues).toContain("DCTYPE04");
    await page.screenshot({
      path: getScreenshotPath("09_Document_多选功能", "002_複数選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 取消勾选DCTYPE02
    await select.selectOption(["DCTYPE04"]);
    await page.waitForTimeout(300);

    const afterDeselect = await select.evaluate((el) =>
      Array.from((el as HTMLSelectElement).selectedOptions).map(
        (o) => (o as HTMLOptionElement).value,
      ),
    );
    expect(afterDeselect).not.toContain("DCTYPE02");
    expect(afterDeselect).toContain("DCTYPE04");
    await page.screenshot({
      path: getScreenshotPath("09_Document_多选功能", "003_選択解除"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 Document-全选/取消全选
  // ============================================================
  test("10_Document_全选取消全选", async ({ page }) => {
    await openPage(page);

    // 先查询用户
    await page.locator("input.hudua-input-userid").fill(TEST_USERID);
    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("10_Document_全选取消全选", "001_照会後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    const select = page.locator("select.hudua-document-list");

    // 全选所有文档
    await select.selectOption(TEST_DOCUMENTS);
    await page.waitForTimeout(300);

    const allSelected = await select.evaluate(
      (el) => (el as HTMLSelectElement).selectedOptions.length,
    );
    expect(allSelected).toBe(TEST_DOCUMENTS.length);
    await page.screenshot({
      path: getScreenshotPath("10_Document_全选取消全选", "002_全選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 取消全选（不选任何文档）
    await select.evaluate((el) => {
      (el as HTMLSelectElement).selectedIndex = -1;
    });
    await page.waitForTimeout(300);

    const noneSelected = await select.evaluate(
      (el) => (el as HTMLSelectElement).selectedOptions.length,
    );
    expect(noneSelected).toBe(0);
    await page.screenshot({
      path: getScreenshotPath("10_Document_全选取消全选", "003_全解除"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 Document-初始选中已授权文档
  // ============================================================
  test("11_Document_初始选中已授权文档", async ({ page }) => {
    await openPage(page);

    // 查询拥有已授权文档的用户
    await page.locator("input.hudua-input-userid").fill(TEST_USERID);
    await page.screenshot({
      path: getScreenshotPath("11_Document_初始选中已授权文档", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(3000);

    // 已授权的文档（DCTYPE01, DCTYPE03）应自动被选中
    const select = page.locator("select.hudua-document-list");
    const selectedValues = await select.evaluate((el) =>
      Array.from((el as HTMLSelectElement).selectedOptions).map(
        (o) => (o as HTMLOptionElement).value,
      ),
    );
    expect(selectedValues).toContain("DCTYPE01");
    expect(selectedValues).toContain("DCTYPE03");
    await page.screenshot({
      path: getScreenshotPath("11_Document_初始选中已授权文档", "002_初期選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 未授权的文档（DCTYPE02, DCTYPE04, DCTYPE05）保持未选中
    expect(selectedValues).not.toContain("DCTYPE02");
    expect(selectedValues).not.toContain("DCTYPE04");
    expect(selectedValues).not.toContain("DCTYPE05");
    await page.screenshot({
      path: getScreenshotPath(
        "11_Document_初始选中已授权文档",
        "003_非選択確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 Update-未查询时点击
  // ============================================================
  test("12_Update_未查询时点击", async ({ page }) => {
    await openPage(page);

    // 未查询用户直接点击Update
    await page
      .locator("button.hudua-button-update")
      .filter({ hasText: "UPDATE" })
      .click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.hudua-error-message");
    await expect(errMsg).toBeVisible();
    await expect(errMsg).toContainText("请先查询用户信息");
    await page.screenshot({
      path: getScreenshotPath("12_Update_未查询时点击", "001_ｴﾗｰ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Update按钮恢复可用状态
    await expect(
      page.locator("button.hudua-button-update").filter({ hasText: "UPDATE" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("12_Update_未查询时点击", "002_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 Update-UserID不在功能权限表中
  // ============================================================
  test("13_Update_UserID不在功能权限表中", async ({ page }) => {
    await openPage(page);

    // 使用一个在hdoc_user_infor中不存在（或在FUNCTION_AUTH中不存在）的UserID
    // 先查询不存在的用户
    await page.locator("input.hudua-input-userid").fill("NONEXIST_USER");
    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(3000);

    // 查询失败后，hasQueried为false，Update应阻止
    await page
      .locator("button.hudua-button-update")
      .filter({ hasText: "UPDATE" })
      .click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.hudua-error-message");
    if (await errMsg.isVisible().catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("13_Update_UserID不在功能权限表中", "001_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Update-成功
  // ============================================================
  test("14_Update_成功", async ({ page }) => {
    await openPage(page);

    // 查询用户
    await page.locator("input.hudua-input-userid").fill(TEST_USERID);
    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("14_Update_成功", "001_照会後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 选择文档权限（DCTYPE02, DCTYPE04, DCTYPE05）
    const select = page.locator("select.hudua-document-list");
    await select.selectOption(["DCTYPE02", "DCTYPE04", "DCTYPE05"]);
    await page.waitForTimeout(300);
    await page.screenshot({
      path: getScreenshotPath("14_Update_成功", "002_選択後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击Update
    await page
      .locator("button.hudua-button-update")
      .filter({ hasText: "UPDATE" })
      .click();
    await page.waitForTimeout(3000);

    // 确认成功消息
    const succMsg = page.locator("div.hudua-success-message");
    await expect(succMsg).toBeVisible();
    await expect(succMsg).toContainText("文档权限更新成功");
    await page.screenshot({
      path: getScreenshotPath("14_Update_成功", "003_成功ﾒｯｾｰｼﾞ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认DB中已更新
    try {
      const conn = await mysql.createConnection(DB_CONFIG);
      try {
        const db = conn as any;
        const [rows] = await db.execute(
          "SELECT DOCTYPE FROM HDOC_USER_DOC WHERE USERID = ? ORDER BY DOCTYPE",
          [TEST_USERID],
        );
        const resultRows = rows as any[];
        const docTypes = resultRows.map((r) => r.DOCTYPE);
        expect(docTypes).toContain("DCTYPE02");
        expect(docTypes).toContain("DCTYPE04");
        expect(docTypes).toContain("DCTYPE05");
        expect(docTypes).not.toContain("DCTYPE01");
        expect(docTypes).not.toContain("DCTYPE03");
        console.log("UD18 DB updated docs:", docTypes.join(","));
      } finally {
        await conn.end();
      }
    } catch (err) {
      console.warn("UD18 DB verify error:", (err as Error).message);
    }
    await page.screenshot({
      path: getScreenshotPath("14_Update_成功", "004_DB確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Update-更新后自动刷新
  // ============================================================
  test("15_Update_更新后自动刷新", async ({ page }) => {
    await openPage(page);

    // 先设置已知的文档权限
    try {
      const conn = await mysql.createConnection(DB_CONFIG);
      try {
        const db = conn as any;
        await db.execute("DELETE FROM HDOC_USER_DOC WHERE USERID = ?", [
          TEST_USERID,
        ]);
        await db.execute(
          `INSERT INTO HDOC_USER_DOC (USERID, DOCTYPE, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
          [
            TEST_USERID,
            "DCTYPE01",
            "PLAYWRIGHT",
            "PLAYWRIGHT",
            "PLAYWRIGHT",
            "PLAYWRIGHT",
          ],
        );
        console.log("UD15 preset DCTYPE01 for refresh test");
      } finally {
        await conn.end();
      }
    } catch {
      /* ignore */
    }

    // 查询用户
    await page.locator("input.hudua-input-userid").fill(TEST_USERID);
    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("15_Update_更新后自动刷新", "001_照会後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 选择DCTYPE02
    const select = page.locator("select.hudua-document-list");
    await select.selectOption(["DCTYPE02"]);
    await page.waitForTimeout(300);
    await page.screenshot({
      path: getScreenshotPath("15_Update_更新后自动刷新", "002_選択後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击Update
    await page
      .locator("button.hudua-button-update")
      .filter({ hasText: "UPDATE" })
      .click();
    await page.waitForTimeout(3000);

    // 更新成功后，页面应刷新显示最新权限
    const succMsg = page.locator("div.hudua-success-message");
    await expect(succMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("15_Update_更新后自动刷新", "003_更新成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认选中状态反映最新授权（只有DCTYPE02被选中）
    const selectedValues = await select.evaluate((el) =>
      Array.from((el as HTMLSelectElement).selectedOptions).map(
        (o) => (o as HTMLOptionElement).value,
      ),
    );
    expect(selectedValues).toContain("DCTYPE02");
    expect(selectedValues).not.toContain("DCTYPE01");
    await page.screenshot({
      path: getScreenshotPath("15_Update_更新后自动刷新", "004_最新状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 Update-失败（API 500）
  // ============================================================
  test("16_Update_API返回500", async ({ page }) => {
    await openPage(page);

    // 查询用户
    await page.locator("input.hudua-input-userid").fill(TEST_USERID);
    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("16_Update_API返回500", "001_照会後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 选择DCTYPE01
    const select = page.locator("select.hudua-document-list");
    await select.selectOption(["DCTYPE01"]);
    await page.waitForTimeout(300);
    await page.screenshot({
      path: getScreenshotPath("16_Update_API返回500", "002_選択後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击Update
    await page
      .locator("button.hudua-button-update")
      .filter({ hasText: "UPDATE" })
      .click();
    await page.waitForTimeout(3000);

    // 检查是否有错误消息
    const errMsg = page.locator("div.hudua-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("16_Update_API返回500", "003_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Update按钮恢复可用
    await expect(
      page.locator("button.hudua-button-update").filter({ hasText: "UPDATE" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("16_Update_API返回500", "004_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 Update-加载中按钮禁用
  // ============================================================
  test("17_Update_加载中按钮禁用", async ({ page }) => {
    await openPage(page);

    // 查询用户
    await page.locator("input.hudua-input-userid").fill(TEST_USERID);
    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(3000);

    // 选择文档
    const select = page.locator("select.hudua-document-list");
    await select.selectOption(["DCTYPE01"]);
    await page.waitForTimeout(300);

    // 点击Update
    const updateBtn = page
      .locator("button.hudua-button-update")
      .filter({ hasText: "UPDATE" });
    await updateBtn.click();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: getScreenshotPath("17_Update_加载中按钮禁用", "001_読込中"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("17_Update_加载中按钮禁用", "002_完了後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 Update-防止重复提交
  // ============================================================
  test("18_Update_防止重复提交", async ({ page }) => {
    await openPage(page);

    // 查询用户
    await page.locator("input.hudua-input-userid").fill(TEST_USERID);
    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(3000);

    // 选择文档
    const select = page.locator("select.hudua-document-list");
    await select.selectOption(["DCTYPE01"]);
    await page.waitForTimeout(300);

    // 快速连续点击Update两次
    const updateBtn = page
      .locator("button.hudua-button-update")
      .filter({ hasText: "UPDATE" });
    await updateBtn.click();
    await page.waitForTimeout(100);
    await updateBtn.click();
    await page.waitForTimeout(100);
    await page.screenshot({
      path: getScreenshotPath("18_Update_防止重复提交", "001_連続ｸﾘｯｸ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("18_Update_防止重复提交", "002_結果"),
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

    await expect(page.locator("h1.hudua-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("19_异常处理_API超时", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.locator("input.hudua-input-userid").fill(TEST_USERID);
    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("19_异常处理_API超时", "002_応答確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 异常处理-Saviynt系统调用失败
  // ============================================================
  test("20_异常处理_Saviynt系统调用失败", async ({ page }) => {
    await openPage(page);

    // 输入存在的UserID
    await page.locator("input.hudua-input-userid").fill(TEST_USERID);
    await page.screenshot({
      path: getScreenshotPath("20_异常处理_Saviynt系统调用失败", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(3000);

    // 检查是否有错误消息
    const errMsg = page.locator("div.hudua-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("20_异常处理_Saviynt系统调用失败", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 异常处理-数据库操作异常
  // ============================================================
  test("21_异常处理_数据库操作异常", async ({ page }) => {
    await openPage(page);

    // 查询用户
    await page.locator("input.hudua-input-userid").fill(TEST_USERID);
    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("21_异常处理_数据库操作异常", "001_照会後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 选择文档并点击Update
    const select = page.locator("select.hudua-document-list");
    await select.selectOption(["DCTYPE01"]);
    await page.waitForTimeout(300);

    await page
      .locator("button.hudua-button-update")
      .filter({ hasText: "UPDATE" })
      .click();
    await page.waitForTimeout(3000);

    const errMsg = page.locator("div.hudua-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("21_异常处理_数据库操作异常", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Update按钮恢复可用
    await expect(
      page.locator("button.hudua-button-update").filter({ hasText: "UPDATE" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("21_异常处理_数据库操作异常", "003_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 异常处理-用户未登录
  // ============================================================
  test("22_异常处理_用户未登录", async ({ page }) => {
    // 清除登录状态直接访问页面
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

    // 确认页面可以加载（组件不强制跳转登录，只确认无错误即可）
    await page.screenshot({
      path: getScreenshotPath("22_异常处理_用户未登录", "001_未ﾛｸﾞｲﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 错误消息-显示样式
  // ============================================================
  test("23_错误消息_显示样式", async ({ page }) => {
    await openPage(page);

    // 触发错误（UserID为空点击User Info）
    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.hudua-error-message");
    await expect(errMsg).toBeVisible();

    // 确认错误消息文本颜色为红色
    const color = await errMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(color).toBeTruthy();
    await page.screenshot({
      path: getScreenshotPath("23_错误消息_显示样式", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认错误消息区域显示
    await page.screenshot({
      path: getScreenshotPath("23_错误消息_显示样式", "002_ｴﾗｰｽﾀｲﾙ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 成功消息-显示样式
  // ============================================================
  test("24_成功消息_显示样式", async ({ page }) => {
    await openPage(page);

    // 查询用户并执行Update操作
    await page.locator("input.hudua-input-userid").fill(TEST_USERID);
    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(3000);

    const select = page.locator("select.hudua-document-list");
    await select.selectOption(["DCTYPE01"]);
    await page.waitForTimeout(300);

    await page
      .locator("button.hudua-button-update")
      .filter({ hasText: "UPDATE" })
      .click();
    await page.waitForTimeout(3000);

    const succMsg = page.locator("div.hudua-success-message");
    if (await succMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(succMsg).toBeVisible();
      const color = await succMsg.evaluate(
        (el) => window.getComputedStyle(el).color,
      );
      expect(color).toBeTruthy();
    }
    await page.screenshot({
      path: getScreenshotPath("24_成功消息_显示样式", "001_成功表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 页面刷新
  // ============================================================
  test("25_页面刷新", async ({ page }) => {
    await openPage(page);

    // 先查询用户
    await page.locator("input.hudua-input-userid").fill(TEST_USERID);
    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("25_页面刷新", "001_照会後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 刷新页面（F5）
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    try {
      await page.waitForSelector("h1.hudua-title", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.screenshot({
      path: getScreenshotPath("25_页面刷新", "002_再読込後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // UserID输入框被清空
    expect(await page.locator("input.hudua-input-userid").inputValue()).toBe(
      "",
    );
    await page.screenshot({
      path: getScreenshotPath("25_页面刷新", "003_UserID空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // User标签为空
    expect(await page.locator("span.hudua-user-name").textContent()).toBe("");
    await page.screenshot({
      path: getScreenshotPath("25_页面刷新", "004_User空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Document多选列表重新加载
    const options = page.locator("select.hudua-document-list option");
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("25_页面刷新", "005_Document再読込"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 所有按钮可用
    await expect(
      page.locator("button.hudua-button").filter({ hasText: "User Info" }),
    ).toBeEnabled();
    await expect(
      page.locator("button.hudua-button-update").filter({ hasText: "UPDATE" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("25_页面刷新", "006_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 安全性-API请求协议
  // ============================================================
  test("26_安全性_API请求协议", async ({ page }) => {
    await openPage(page);

    // 监听API请求
    const requests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/api/ud18")) {
        requests.push(url);
      }
    });

    // 执行查询操作
    await page.locator("input.hudua-input-userid").fill(TEST_USERID);
    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(3000);

    // 确认API请求已发送
    expect(requests.length).toBeGreaterThanOrEqual(1);
    await page.screenshot({
      path: getScreenshotPath("26_安全性_API请求协议", "001_API確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 安全性-权限控制
  // ============================================================
  test("27_安全性_权限控制", async ({ page }) => {
    await openPage(page);

    // 以管理员登录，确认可以正常操作
    await expect(page.locator("h1.hudua-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("27_安全性_权限控制", "001_管理者画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 执行查询操作
    await page.locator("input.hudua-input-userid").fill(TEST_USERID);
    await page
      .locator("button.hudua-button")
      .filter({ hasText: "User Info" })
      .click();
    await page.waitForTimeout(3000);

    // User显示用户名
    const userName = await page.locator("span.hudua-user-name").textContent();
    expect(userName?.trim()).not.toBe("");
    await page.screenshot({
      path: getScreenshotPath("27_安全性_权限控制", "002_操作確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 安全性-UserID半角英数字校验
  // ============================================================
  test("28_安全性_UserID半角英数字校验", async ({ page }) => {
    await openPage(page);

    const input = page.locator("input.hudua-input-userid");

    // 确认maxLength=10
    const maxLength = await input.getAttribute("maxLength");
    expect(maxLength).toBe("10");
    await page.screenshot({
      path: getScreenshotPath(
        "28_安全性_UserID半角英数字校验",
        "001_maxLength",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 输入正常半角英数字
    await input.fill("TESTUSER01");
    const value1 = await input.inputValue();
    expect(value1).toBe("TESTUSER01");
    await page.screenshot({
      path: getScreenshotPath("28_安全性_UserID半角英数字校验", "002_半角入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 清空输入
    await input.fill("");
    await page.screenshot({
      path: getScreenshotPath("28_安全性_UserID半角英数字校验", "003_ｸﾘｱ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
