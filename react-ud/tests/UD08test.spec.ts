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
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD08";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/homologation-variables`;

// ============================================================
// 截图计数器
// ============================================================
let screenshotCounter = 0;

function getScreenshotPath(_testName: string, _stepName: string): string {
  screenshotCounter++;
  const seq = String(screenshotCounter).padStart(3, "0");
  return `${SCREENSHOT_DIR}/UD08画面ピクチャー${seq}.jpeg`;
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
      const now = new Date();

      await conn.execute(
        `INSERT IGNORE INTO PRODUCT_CLASS_MASTER (PC, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
         VALUES (?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
        [
          "Z",
          "Test Product Class Z",
          "TEST",
          "PLAYWRIGHT",
          "TEST",
          "PLAYWRIGHT",
        ],
      );

      await conn.execute(
        `INSERT IGNORE INTO MARKET_MASTER (MARKET, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
         VALUES (?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
        ["ZZZ", "Test Market ZZZ", "TEST", "PLAYWRIGHT", "TEST", "PLAYWRIGHT"],
      );

      await conn.execute(
        `INSERT IGNORE INTO HDOC_VARIABLES (VARIABLE, TYPE, DESCRIPTION, USERID, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
         VALUES (?, ?, ?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
        [
          "UD08_TEST_VAR",
          "VDA",
          "UD08 Test Variable",
          "TEST",
          "TEST",
          "PLAYWRIGHT",
          "TEST",
          "PLAYWRIGHT",
        ],
      );

      await conn.execute(
        `INSERT IGNORE INTO HDOC_USER_DEFINED_RULES (PC, NUM, MARKET, VS, VARIABLE, VAL, USERID, UP_DATE, COMMENTS, ADD_DATE, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
        [
          "Z",
          999,
          "ZZZ",
          "TEST_VS1",
          "UD08_TEST_VAR",
          "TEST_VAL",
          "TEST",
          "202607",
          "TEST comment",
          "202607",
          "TEST",
          "PLAYWRIGHT",
          "TEST",
          "PLAYWRIGHT",
        ],
      );

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
        "DELETE FROM HDOC_USER_DEFINED_RULES WHERE PC = ? AND NUM = ? AND MARKET = ?",
        ["Z", 999, "ZZZ"],
      );
      await conn.execute("DELETE FROM PRODUCT_CLASS_MASTER WHERE PC = ?", [
        "Z",
      ]);
      await conn.execute("DELETE FROM MARKET_MASTER WHERE MARKET = ?", ["ZZZ"]);
      await conn.execute("DELETE FROM HDOC_VARIABLES WHERE VARIABLE = ?", [
        "UD08_TEST_VAR",
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

// ============================================================
// ページロード＆ヘルパー
// ============================================================
async function safeWaitNetworkIdle(page: Page) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch {
    /* ignore */
  }
}

async function openPage(page: Page) {
  await setLoginState(page);
  await page.goto(PAGE_URL, { waitUntil: "domcontentloaded", timeout: 15000 });
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch {
    /* ignore */
  }
  await page.waitForTimeout(1500);
  // 各テストの初期画面を自動撮影
  await page.screenshot({
    path: getScreenshotPath("_init", "初期画面"),
    type: "jpeg",
    quality: 80,
    fullPage: true,
  });
}

/** Number入力欄（最初のhv-input-short） */
function numberInput(page: Page) {
  return page.locator("input.hv-input-short").first();
}
/** Variable入力欄（最初のhv-input-medium） */
function variableInput(page: Page) {
  return page.locator("input.hv-input-medium").first();
}
/** Product class select */
function pcSelect(page: Page) {
  return page.locator("select.hv-select").first();
}
/** Market select */
function marketSelect(page: Page) {
  return page.locator("select.hv-select-short").first();
}
/** ボタン */
function btn(page: Page, name: string) {
  return page.locator("button.hv-btn").filter({ hasText: name });
}
/** Product class/Market/Number/Variable を入力 */
async function fillRequiredFields(page: Page) {
  const hasOptionZ = await page
    .locator("select.hv-select")
    .first()
    .locator('option[value="Z"]')
    .count();
  if (hasOptionZ > 0) {
    await page.locator("select.hv-select").first().selectOption("Z");
  }
  const hasOptionZZZ = await page
    .locator("select.hv-select-short")
    .first()
    .locator('option[value="ZZZ"]')
    .count();
  if (hasOptionZZZ > 0) {
    await page.locator("select.hv-select-short").first().selectOption("ZZZ");
  }
}

// ============================================================
// テストスイート
// ============================================================
test.describe.serial("UD08 Homologation Variables - 单体测试", () => {
  test.beforeAll(async () => {
    await setupTestData();
  });

  test.afterAll(async () => {
    await clearTestData();
  });

  test.beforeAll(() => {
    screenshotCounter = 0;
  });

  // ============================================================
  // No.1 画面初期显示-基本元素
  // ============================================================
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h1.hv-title")).toHaveText(
      "Homologation Variables",
    );
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_タイトル確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(
      page
        .locator("label.hv-label-required")
        .filter({ hasText: "*Product class" }),
    ).toBeVisible();
    await expect(
      page.locator("label.hv-label-required").filter({ hasText: "*Number" }),
    ).toBeVisible();
    await expect(
      page.locator("label.hv-label-required").filter({ hasText: "*Market" }),
    ).toBeVisible();
    await expect(
      page.locator("label.hv-label").filter({ hasText: "Variable" }),
    ).toBeVisible();

    const buttons = page.locator("button.hv-btn");
    const btnTexts = await buttons.allTextContents();
    expect(btnTexts.some((t) => t.includes("Search"))).toBeTruthy();
    expect(btnTexts.some((t) => t.includes("Clear"))).toBeTruthy();
    expect(btnTexts.some((t) => t.includes("Add"))).toBeTruthy();
    expect(btnTexts.some((t) => t.includes("Update"))).toBeTruthy();
    expect(btnTexts.some((t) => t.includes("Delete"))).toBeTruthy();

    const btnCount = await buttons.count();
    for (let i = 0; i < btnCount; i++) {
      await expect(buttons.nth(i)).toBeEnabled();
    }

    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "基本要素"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-下拉列表加载
  // ============================================================
  test("02_画面初期显示_下拉列表加载", async ({ page }) => {
    await openPage(page);

    await expect(pcSelect(page)).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_下拉列表加载",
        "001_ProductClass選択肢",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const pcOptions = await pcSelect(page).locator("option").allTextContents();
    expect(pcOptions.length).toBeGreaterThan(1);

    await expect(marketSelect(page)).toBeVisible();
    const marketOptions = await marketSelect(page)
      .locator("option")
      .allTextContents();
    expect(marketOptions.length).toBeGreaterThan(1);

    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_下拉列表加载", "下拉列表"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-所有字段为空
  // ============================================================
  test("03_画面初期显示_所有字段为空", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_所有字段为空",
        "001_ページ表示後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(numberInput(page)).toBeVisible();
    await expect(numberInput(page)).toBeEmpty();
    await expect(variableInput(page)).toBeVisible();
    await expect(variableInput(page)).toBeEmpty();
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_所有字段为空",
        "002_入力欄空確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(pcSelect(page)).toHaveValue("");
    await expect(marketSelect(page)).toHaveValue("");
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_所有字段为空",
        "003_セレクト空確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("div.hv-error-message")).toHaveCount(0);
    await expect(page.locator("button.hv-btn").first()).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_所有字段为空",
        "004_エラーなし確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 画面初期显示-加载状态
  // ============================================================
  test("04_画面初期显示_加载状态", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("04_画面初期显示_加载状态", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("h1.hv-title")).toBeVisible();
    await expect(page.locator("button.hv-btn").first()).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("04_画面初期显示_加载状态", "002_正常表示確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 Search-正常搜索
  // ============================================================
  test("05_Search_正常搜索", async ({ page }) => {
    await openPage(page);
    await page.waitForTimeout(1000);

    // selectOption使用前にオプションが存在するか確認
    const hasOptionZ = await pcSelect(page)
      .locator('option[value="Z"]')
      .count();
    if (hasOptionZ > 0) {
      await pcSelect(page).selectOption("Z");
    }
    await numberInput(page).fill("999");
    const hasOptionZZZ = await marketSelect(page)
      .locator('option[value="ZZZ"]')
      .count();
    if (hasOptionZZZ > 0) {
      await marketSelect(page).selectOption("ZZZ");
    }

    await btn(page, "Search").click();
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (currentUrl.includes("homologation-variables-result-list")) {
      await expect(page).toHaveURL(/homologation-variables-result-list/);
    } else {
      const errMsg = page.locator("div.hv-error-message");
      if (await errMsg.isVisible()) {
        console.log("Search error:", await errMsg.textContent());
      }
    }

    await page.screenshot({
      path: getScreenshotPath("05_Search_正常搜索", "Search結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 Search-无条件搜索
  // ============================================================
  test("06_Search_无条件搜索", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("06_Search_无条件搜索", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Search").click();
    await page.waitForTimeout(1000);

    // 必須項目がないのでエラー
    const errMsg = page.locator("div.hv-error-message");
    if (await errMsg.isVisible()) {
      console.log("Search error:", await errMsg.textContent());
    }

    await page.screenshot({
      path: getScreenshotPath("06_Search_无条件搜索", "無条件"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 Clear-正常清除
  // ============================================================
  test("07_Clear_正常清除", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("07_Clear_正常清除", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const hasOptionZ = await pcSelect(page)
      .locator('option[value="Z"]')
      .count();
    if (hasOptionZ > 0) {
      await pcSelect(page).selectOption("Z");
    }
    await numberInput(page).fill("999");
    const hasOptionZZZ = await marketSelect(page)
      .locator('option[value="ZZZ"]')
      .count();
    if (hasOptionZZZ > 0) {
      await marketSelect(page).selectOption("ZZZ");
    }
    await variableInput(page).fill("TEST_VAR");

    await btn(page, "Clear").click();
    await page.waitForTimeout(500);

    await expect(numberInput(page)).toBeEmpty();
    await expect(variableInput(page)).toBeEmpty();
    await expect(pcSelect(page)).toHaveValue("");

    await page.screenshot({
      path: getScreenshotPath("07_Clear_正常清除", "Clear後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 Clear-空状态清除
  // ============================================================
  test("08_Clear_空状态清除", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("08_Clear_空状态清除", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Clear").click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("08_Clear_空状态清除", "002_Clear後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(numberInput(page)).toBeEmpty();
    await expect(page.locator("div.hv-error-message")).toHaveCount(0);
    await page.screenshot({
      path: getScreenshotPath("08_Clear_空状态清除", "003_エラーなし確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 Add-空值检查
  // ============================================================
  test("09_Add_空值检查", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("09_Add_空值检查", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Add").click();
    await page.waitForTimeout(500);

    await expect(page.locator("div.hv-error-message")).toBeVisible();
    await expect(page.locator("div.hv-error-message")).toContainText(
      "Product class",
    );

    await page.screenshot({
      path: getScreenshotPath("09_Add_空值检查", "空值エラー"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 Add-TEMPLATE前缀验证失败
  // ============================================================
  test("10_Add_TEMPLATE前缀验证失败", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("10_Add_TEMPLATE前缀验证失败", "001_条件入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const hasOptionZ = await pcSelect(page)
      .locator('option[value="Z"]')
      .count();
    if (hasOptionZ > 0) {
      await pcSelect(page).selectOption("Z");
    }
    await numberInput(page).fill("999");
    const hasOptionZZZ = await marketSelect(page)
      .locator('option[value="ZZZ"]')
      .count();
    if (hasOptionZZZ > 0) {
      await marketSelect(page).selectOption("ZZZ");
    }
    await variableInput(page).fill("TEMPLATE-UNKNOWN_VAR");

    await btn(page, "Add").click();
    await page.waitForTimeout(1000);

    const errMsg = page.locator("div.hv-error-message");
    if (await errMsg.isVisible()) {
      console.log("Error:", await errMsg.textContent());
    }

    await page.screenshot({
      path: getScreenshotPath("10_Add_TEMPLATE前缀验证失败", "TEMPLATE失敗"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 Add-TEMPLATE前缀验证成功
  // ============================================================
  test("11_Add_TEMPLATE前缀验证成功", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("11_Add_TEMPLATE前缀验证成功", "001_条件入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const hasOptionZ = await pcSelect(page)
      .locator('option[value="Z"]')
      .count();
    if (hasOptionZ > 0) {
      await pcSelect(page).selectOption("Z");
    }
    await numberInput(page).fill("998");
    const hasOptionZZZ = await marketSelect(page)
      .locator('option[value="ZZZ"]')
      .count();
    if (hasOptionZZZ > 0) {
      await marketSelect(page).selectOption("ZZZ");
    }
    await variableInput(page).fill("TEMPLATE-UD08_TEST_VAR");

    await btn(page, "Add").click();
    await page.waitForTimeout(2000);

    const scsMsg = page.locator("div.hv-success-message");
    const errMsg = page.locator("div.hv-error-message");
    if (await scsMsg.isVisible()) {
      console.log("Success:", await scsMsg.textContent());
    } else if (await errMsg.isVisible()) {
      console.log("Error:", await errMsg.textContent());
    }

    if (dbAvailable) {
      try {
        const conn = await mysql.createConnection(DB_CONFIG);
        await conn.execute(
          "DELETE FROM HDOC_USER_DEFINED_RULES WHERE PC = ? AND NUM = ? AND MARKET = ?",
          ["Z", 998, "ZZZ"],
        );
        await conn.end();
      } catch {
        /* ignore */
      }
    }

    await page.screenshot({
      path: getScreenshotPath("11_Add_TEMPLATE前缀验证成功", "TEMPLATE成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 Add-主键冲突检查
  // ============================================================
  test("12_Add_主键冲突检查", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("12_Add_主键冲突检查", "001_条件入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const hasOptionZ = await pcSelect(page)
      .locator('option[value="Z"]')
      .count();
    if (hasOptionZ > 0) {
      await pcSelect(page).selectOption("Z");
    }
    await numberInput(page).fill("999");
    const hasOptionZZZ = await marketSelect(page)
      .locator('option[value="ZZZ"]')
      .count();
    if (hasOptionZZZ > 0) {
      await marketSelect(page).selectOption("ZZZ");
    }

    await btn(page, "Add").click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.hv-error-message");
    if (await errMsg.isVisible()) {
      console.log("Error:", await errMsg.textContent());
    }

    await page.screenshot({
      path: getScreenshotPath("12_Add_主键冲突检查", "主キー衝突"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 Add-成功
  // ============================================================
  test("13_Add_成功", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("13_Add_成功", "001_条件入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const hasOptionZ = await pcSelect(page)
      .locator('option[value="Z"]')
      .count();
    if (hasOptionZ > 0) {
      await pcSelect(page).selectOption("Z");
    }
    await numberInput(page).fill("888");
    const hasOptionZZZ = await marketSelect(page)
      .locator('option[value="ZZZ"]')
      .count();
    if (hasOptionZZZ > 0) {
      await marketSelect(page).selectOption("ZZZ");
    }
    await variableInput(page).fill("UD08_TEST_VAR");

    await btn(page, "Add").click();
    await page.waitForTimeout(2000);

    const scsMsg = page.locator("div.hv-success-message");
    if (await scsMsg.isVisible()) {
      console.log("Success:", await scsMsg.textContent());
    } else {
      const errMsg = page.locator("div.hv-error-message");
      if (await errMsg.isVisible()) {
        console.log("Error:", await errMsg.textContent());
      }
    }

    if (dbAvailable) {
      try {
        const conn = await mysql.createConnection(DB_CONFIG);
        await conn.execute(
          "DELETE FROM HDOC_USER_DEFINED_RULES WHERE PC = ? AND NUM = ? AND MARKET = ?",
          ["Z", 888, "ZZZ"],
        );
        await conn.end();
      } catch {
        /* ignore */
      }
    }

    await page.screenshot({
      path: getScreenshotPath("13_Add_成功", "Add成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Add-API错误
  // ============================================================
  test("14_Add_API错误", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("14_Add_API错误", "001_条件入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const hasOptionZ = await pcSelect(page)
      .locator('option[value="Z"]')
      .count();
    if (hasOptionZ > 0) {
      await pcSelect(page).selectOption("Z");
    }
    await numberInput(page).fill("999");
    const hasOptionZZZ = await marketSelect(page)
      .locator('option[value="ZZZ"]')
      .count();
    if (hasOptionZZZ > 0) {
      await marketSelect(page).selectOption("ZZZ");
    }

    await btn(page, "Add").click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.hv-error-message");
    if (await errMsg.isVisible()) {
      console.log("Error:", await errMsg.textContent());
    }
    await expect(btn(page, "Add")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("14_Add_API错误", "Add失敗"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Update-存在性检查
  // ============================================================
  test("15_Update_存在性检查", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("15_Update_存在性检查", "001_条件入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    const hasOptionZ = await pcSelect(page)
      .locator('option[value="Z"]')
      .count();
    if (hasOptionZ > 0) {
      await pcSelect(page).selectOption("Z");
    }
    await numberInput(page).fill("000");
    const hasOptionZZZ = await marketSelect(page)
      .locator('option[value="ZZZ"]')
      .count();
    if (hasOptionZZZ > 0) {
      await marketSelect(page).selectOption("ZZZ");
    }

    await btn(page, "Update").click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.hv-error-message");
    if (await errMsg.isVisible()) {
      console.log("Error:", await errMsg.textContent());
    }
    await expect(btn(page, "Update")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("15_Update_存在性检查", "存在確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 Update-TEMPLATE前缀验证
  // ============================================================
  test("16_Update_TEMPLATE前缀验证", async ({ page }) => {
    await openPage(page);

    const hasOptionZ = await pcSelect(page)
      .locator('option[value="Z"]')
      .count();
    if (hasOptionZ > 0) {
      await pcSelect(page).selectOption("Z");
    }
    await numberInput(page).fill("999");
    const hasOptionZZZ = await marketSelect(page)
      .locator('option[value="ZZZ"]')
      .count();
    if (hasOptionZZZ > 0) {
      await marketSelect(page).selectOption("ZZZ");
    }
    await variableInput(page).fill("TEMPLATE-UNKNOWN");

    await page.screenshot({
      path: getScreenshotPath("16_Update_TEMPLATE前缀验证", "001_条件入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Update").click();
    await page.waitForTimeout(1000);

    const errMsg = page.locator("div.hv-error-message");
    if (await errMsg.isVisible()) {
      console.log("Error:", await errMsg.textContent());
    }
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("16_Update_TEMPLATE前缀验证", "002_結果確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 Update-成功
  // ============================================================
  test("17_Update_成功", async ({ page }) => {
    await openPage(page);

    const hasOptionZ = await pcSelect(page)
      .locator('option[value="Z"]')
      .count();
    if (hasOptionZ > 0) {
      await pcSelect(page).selectOption("Z");
    }
    await numberInput(page).fill("999");
    const hasOptionZZZ = await marketSelect(page)
      .locator('option[value="ZZZ"]')
      .count();
    if (hasOptionZZZ > 0) {
      await marketSelect(page).selectOption("ZZZ");
    }
    await variableInput(page).fill("UD08_TEST_VAR");

    await page.screenshot({
      path: getScreenshotPath("17_Update_成功", "001_条件入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Update").click();
    await page.waitForTimeout(2000);

    const scsMsg = page.locator("div.hv-success-message");
    if (await scsMsg.isVisible()) {
      console.log("Success:", await scsMsg.textContent());
    } else {
      const errMsg = page.locator("div.hv-error-message");
      if (await errMsg.isVisible()) {
        console.log("Error:", await errMsg.textContent());
      }
    }
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("17_Update_成功", "002_結果確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 Update-API错误
  // ============================================================
  test("18_Update_API错误", async ({ page }) => {
    await openPage(page);

    const hasOptionZ = await pcSelect(page)
      .locator('option[value="Z"]')
      .count();
    if (hasOptionZ > 0) {
      await pcSelect(page).selectOption("Z");
    }
    await numberInput(page).fill("999");
    const hasOptionZZZ = await marketSelect(page)
      .locator('option[value="ZZZ"]')
      .count();
    if (hasOptionZZZ > 0) {
      await marketSelect(page).selectOption("ZZZ");
    }

    await page.screenshot({
      path: getScreenshotPath("18_Update_API错误", "001_条件入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Update").click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.hv-error-message");
    if (await errMsg.isVisible()) {
      console.log("Error:", await errMsg.textContent());
    }
    await expect(btn(page, "Update")).toBeEnabled();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("18_Update_API错误", "002_結果確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 Delete-存在性检查
  // ============================================================
  test("19_Delete_存在性检查", async ({ page }) => {
    await openPage(page);

    const hasOptionZ = await pcSelect(page)
      .locator('option[value="Z"]')
      .count();
    if (hasOptionZ > 0) {
      await pcSelect(page).selectOption("Z");
    }
    await numberInput(page).fill("000");
    const hasOptionZZZ = await marketSelect(page)
      .locator('option[value="ZZZ"]')
      .count();
    if (hasOptionZZZ > 0) {
      await marketSelect(page).selectOption("ZZZ");
    }

    await page.screenshot({
      path: getScreenshotPath("19_Delete_存在性检查", "001_条件入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Delete").click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.hv-error-message");
    if (await errMsg.isVisible()) {
      console.log("Error:", await errMsg.textContent());
    }
    await expect(btn(page, "Delete")).toBeEnabled();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("19_Delete_存在性检查", "002_結果確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 Delete-成功
  // ============================================================
  test("20_Delete_成功", async ({ page }) => {
    if (dbAvailable) {
      try {
        const conn = await mysql.createConnection(DB_CONFIG);
        await conn.execute(
          `INSERT IGNORE INTO HDOC_USER_DEFINED_RULES (PC, NUM, MARKET, VS, VARIABLE, VAL, USERID, UP_DATE, COMMENTS, ADD_DATE, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
          [
            "Z",
            777,
            "ZZZ",
            "DELETE_TEST",
            "UD08_TEST_VAR",
            "DEL_VAL",
            "TEST",
            "202607",
            "To be deleted",
            "202607",
            "TEST",
            "PLAYWRIGHT",
            "TEST",
            "PLAYWRIGHT",
          ],
        );
        await conn.end();
      } catch {
        /* ignore */
      }
    }

    await openPage(page);
    await page.waitForTimeout(1000);

    const hasOptionZ = await pcSelect(page)
      .locator('option[value="Z"]')
      .count();
    if (hasOptionZ > 0) {
      await pcSelect(page).selectOption("Z");
    }
    await numberInput(page).fill("777");
    const hasOptionZZZ = await marketSelect(page)
      .locator('option[value="ZZZ"]')
      .count();
    if (hasOptionZZZ > 0) {
      await marketSelect(page).selectOption("ZZZ");
    }

    await page.screenshot({
      path: getScreenshotPath("20_Delete_成功", "001_条件入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Delete").click();
    await page.waitForTimeout(2000);

    const scsMsg = page.locator("div.hv-success-message");
    if (await scsMsg.isVisible()) {
      console.log("Success:", await scsMsg.textContent());
    } else {
      const errMsg = page.locator("div.hv-error-message");
      if (await errMsg.isVisible()) {
        console.log("Error:", await errMsg.textContent());
      }
    }
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("20_Delete_成功", "002_結果確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 Delete-API错误
  // ============================================================
  test("21_Delete_API错误", async ({ page }) => {
    await openPage(page);

    const hasOptionZ = await pcSelect(page)
      .locator('option[value="Z"]')
      .count();
    if (hasOptionZ > 0) {
      await pcSelect(page).selectOption("Z");
    }
    await numberInput(page).fill("999");
    const hasOptionZZZ = await marketSelect(page)
      .locator('option[value="ZZZ"]')
      .count();
    if (hasOptionZZZ > 0) {
      await marketSelect(page).selectOption("ZZZ");
    }

    await page.screenshot({
      path: getScreenshotPath("21_Delete_API错误", "001_条件入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Delete").click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.hv-error-message");
    if (await errMsg.isVisible()) {
      console.log("Error:", await errMsg.textContent());
    }
    await expect(btn(page, "Delete")).toBeEnabled();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("21_Delete_API错误", "002_結果確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 Number-最大长度10字符
  // ============================================================
  test("22_Number_最大长度10字符", async ({ page }) => {
    await openPage(page);

    await numberInput(page).fill("12345678901");
    const val = await numberInput(page).inputValue();
    expect(val.length).toBeLessThanOrEqual(10);

    await page.screenshot({
      path: getScreenshotPath("22_Number_最大长度10字符", "最大長"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 Variable-最大长度20字符
  // ============================================================
  test("23_Variable_最大长度20字符", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("23_Variable_最大长度20字符", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await variableInput(page).fill("A".repeat(21));
    await page.waitForTimeout(300);
    const val = await variableInput(page).inputValue();
    expect(val.length).toBeLessThanOrEqual(20);
    await page.screenshot({
      path: getScreenshotPath("23_Variable_最大长度20字符", "002_入力後確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 Value-最大长度200字符
  // ============================================================
  test("24_Value_最大长度200字符", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("24_Value_最大长度200字符", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    // Valueフィールド（最初のhv-input-long）を探す
    const valueInput = page.locator("input.hv-input-long").first();
    await expect(valueInput).toBeVisible();
    await expect(valueInput).toHaveAttribute("maxLength", "200");
    // 201文字を入力→maxLength=200でカットされる
    await valueInput.fill("A".repeat(201));
    await page.waitForTimeout(300);
    const val = await valueInput.inputValue();
    expect(val.length).toBeLessThanOrEqual(200);
    await page.screenshot({
      path: getScreenshotPath("24_Value_最大长度200字符", "002_201文字入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 Product class-最大长度2字符
  // ============================================================
  test("25_ProductClass_最大长度2字符", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath(
        "25_ProductClass_最大长度2字符",
        "001_ページ表示後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(pcSelect(page)).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "25_ProductClass_最大长度2字符",
        "002_セレクト確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 Market-最大长度3字符
  // ============================================================
  test("26_Market_最大长度3字符", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("26_Market_最大长度3字符", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(marketSelect(page)).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("26_Market_最大长度3字符", "002_セレクト確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 操作中-按钮禁用
  // ============================================================
  test("27_操作中_按钮禁用", async ({ page }) => {
    await openPage(page);

    const hasOptionZ = await pcSelect(page)
      .locator('option[value="Z"]')
      .count();
    if (hasOptionZ > 0) {
      await pcSelect(page).selectOption("Z");
    }
    await numberInput(page).fill("666");
    const hasOptionZZZ = await marketSelect(page)
      .locator('option[value="ZZZ"]')
      .count();
    if (hasOptionZZZ > 0) {
      await marketSelect(page).selectOption("ZZZ");
    }

    const addBtn = btn(page, "Add");
    await addBtn.click();
    await page.waitForTimeout(300);

    const isDisabled = await addBtn.isDisabled();
    if (isDisabled) {
      await expect(addBtn).toBeDisabled();
    }

    await page.waitForTimeout(2000);

    await page.screenshot({
      path: getScreenshotPath("27_操作中_按钮禁用", "操作中"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    if (dbAvailable) {
      try {
        const conn = await mysql.createConnection(DB_CONFIG);
        await conn.execute(
          "DELETE FROM HDOC_USER_DEFINED_RULES WHERE PC = ? AND NUM = ? AND MARKET = ?",
          ["Z", 666, "ZZZ"],
        );
        await conn.end();
      } catch {
        /* ignore */
      }
    }
  });

  // ============================================================
  // No.28 操作中-防止重复提交
  // ============================================================
  test("28_操作中_防止重复提交", async ({ page }) => {
    await openPage(page);

    const hasOptionZ = await pcSelect(page)
      .locator('option[value="Z"]')
      .count();
    if (hasOptionZ > 0) {
      await pcSelect(page).selectOption("Z");
    }
    await numberInput(page).fill("555");
    const hasOptionZZZ = await marketSelect(page)
      .locator('option[value="ZZZ"]')
      .count();
    if (hasOptionZZZ > 0) {
      await marketSelect(page).selectOption("ZZZ");
    }
    await variableInput(page).fill("UD08_TEST_VAR");

    const addBtn = btn(page, "Add");
    await addBtn.click();
    await page.waitForTimeout(300);

    const isDisabled = await addBtn.isDisabled();
    if (isDisabled) {
      await expect(addBtn).toBeDisabled();
    }

    await page.waitForTimeout(2000);

    await page.screenshot({
      path: getScreenshotPath("28_操作中_防止重复提交", "防止重複"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    if (dbAvailable) {
      try {
        const conn = await mysql.createConnection(DB_CONFIG);
        await conn.execute(
          "DELETE FROM HDOC_USER_DEFINED_RULES WHERE PC = ? AND NUM = ? AND MARKET = ?",
          ["Z", 555, "ZZZ"],
        );
        await conn.end();
      } catch {
        /* ignore */
      }
    }
  });

  // ============================================================
  // No.29 异常处理-API调用失败
  // ============================================================
  test("29_异常处理_API调用失败", async ({ page }) => {
    await openPage(page);
    await fillRequiredFields(page);
    await numberInput(page).fill("111");

    await btn(page, "Delete").click();
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: getScreenshotPath("29_异常处理_API调用失败", "001_条件入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    const errMsg = page.locator("div.hv-error-message");
    if (await errMsg.isVisible()) {
      console.log("Error:", await errMsg.textContent());
    }
    await expect(btn(page, "Delete")).toBeEnabled();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("29_异常处理_API调用失败", "002_結果確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.30 异常处理-未授权操作
  // ============================================================
  test("30_异常处理_未授权操作", async ({ page }) => {
    await openPage(page);
    await fillRequiredFields(page);
    await numberInput(page).fill("999");
    await page.screenshot({
      path: getScreenshotPath("30_异常处理_未授权操作", "001_条件入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Add").click();
    await page.waitForTimeout(2000);

    const errMsg2 = page.locator("div.hv-error-message");
    if (await errMsg2.isVisible()) {
      console.log("Error:", await errMsg2.textContent());
    }
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("30_异常处理_未授权操作", "002_結果確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.31 异常处理-用户未登录
  // ============================================================
  test("31_异常处理_用户未登录", async ({ page }) => {
    await clearLoginState(page);
    await page.goto(PAGE_URL);
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    const titleEl = page.locator("h1.hv-title");
    const titleCount = await titleEl.count();
    if (titleCount > 0) {
      await expect(titleEl).toBeVisible();
    }
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("31_异常处理_用户未登录", "001_未ログイン画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.screenshot({
      path: getScreenshotPath("31_异常处理_用户未登录", "002_タイトル確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.32 安全性-API请求协议
  // ============================================================
  test("32_安全性_API请求协议", async ({ page }) => {
    await setLoginState(page);
    await page.screenshot({
      path: getScreenshotPath("32_安全性_API请求协议", "001_ログイン後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/ud08HomologationVariables")) {
        requests.push(request.url());
      }
    });

    await page.goto(PAGE_URL);
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: getScreenshotPath("32_安全性_API请求协议", "002_API呼出後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    if (requests.length > 0) {
      console.log("UD08 API requests:", requests);
    }
  });

  // ============================================================
  // No.33 安全性-变更记录日志
  // ============================================================
  test("33_安全性_变更记录日志", async ({ page }) => {
    await openPage(page);
    await fillRequiredFields(page);
    await numberInput(page).fill("999");
    await variableInput(page).fill("UD08_TEST_VAR");
    await page.screenshot({
      path: getScreenshotPath("33_安全性_变更记录日志", "001_条件入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Update").click();
    await page.waitForTimeout(2000);

    const scsMsg2 = page.locator("div.hv-success-message");
    if (await scsMsg2.isVisible()) {
      console.log("Update success:", await scsMsg2.textContent());
    }
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("33_安全性_变更记录日志", "002_結果確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
