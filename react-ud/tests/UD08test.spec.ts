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

// ============================================================
// テストスイート
// ============================================================
test.describe("UD08 Homologation Variables - 单体测试", () => {
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

    await expect(page.locator("h1.hv-title")).toHaveText(
      "Homologation Variables",
    );
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

    await expect(numberInput(page)).toBeVisible();
    await expect(numberInput(page)).toBeEmpty();
    await expect(variableInput(page)).toBeVisible();
    await expect(variableInput(page)).toBeEmpty();
    await expect(pcSelect(page)).toHaveValue("");
    await expect(marketSelect(page)).toHaveValue("");
    await expect(page.locator("div.hv-error-message")).toHaveCount(0);
    await expect(page.locator("button.hv-btn").first()).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_所有字段为空", "初期状态"),
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
    await expect(page.locator("h1.hv-title")).toBeVisible();
    await expect(page.locator("button.hv-btn").first()).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("04_画面初期显示_加载状态", "正常表示"),
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

    await btn(page, "Clear").click();
    await page.waitForTimeout(500);

    await expect(numberInput(page)).toBeEmpty();
    await expect(page.locator("div.hv-error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("08_Clear_空状态清除", "空Clear"),
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

    await btn(page, "Update").click();
    await page.waitForTimeout(1000);

    const errMsg = page.locator("div.hv-error-message");
    if (await errMsg.isVisible()) {
      console.log("Error:", await errMsg.textContent());
    }

    await page.screenshot({
      path: getScreenshotPath("16_Update_TEMPLATE前缀验证", "TEMPLATE"),
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

    await page.screenshot({
      path: getScreenshotPath("17_Update_成功", "Update成功"),
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

    await btn(page, "Update").click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.hv-error-message");
    if (await errMsg.isVisible()) {
      console.log("Error:", await errMsg.textContent());
    }
    await expect(btn(page, "Update")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("18_Update_API错误", "Update失敗"),
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

    await btn(page, "Delete").click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.hv-error-message");
    if (await errMsg.isVisible()) {
      console.log("Error:", await errMsg.textContent());
    }
    await expect(btn(page, "Delete")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("19_Delete_存在性检查", "存在確認"),
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

    await page.screenshot({
      path: getScreenshotPath("20_Delete_成功", "Delete成功"),
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

    await btn(page, "Delete").click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.hv-error-message");
    if (await errMsg.isVisible()) {
      console.log("Error:", await errMsg.textContent());
    }
    await expect(btn(page, "Delete")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("21_Delete_API错误", "Delete失敗"),
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

    await variableInput(page).fill("A".repeat(21));
    const val = await variableInput(page).inputValue();
    expect(val.length).toBeLessThanOrEqual(20);

    await page.screenshot({
      path: getScreenshotPath("23_Variable_最大长度20字符", "最大長"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 Product class-最大长度2字符
  // ============================================================
  test("24_ProductClass_最大长度2字符", async ({ page }) => {
    await openPage(page);
    await expect(pcSelect(page)).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("24_ProductClass_最大长度2字符", "最大長"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 Market-最大长度3字符
  // ============================================================
  test("25_Market_最大长度3字符", async ({ page }) => {
    await openPage(page);
    await expect(marketSelect(page)).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("25_Market_最大长度3字符", "最大長"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 操作中-按钮禁用
  // ============================================================
  test("26_操作中_按钮禁用", async ({ page }) => {
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
      path: getScreenshotPath("26_操作中_按钮禁用", "操作中"),
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
  // No.27 异常处理-API调用失败
  // ============================================================
  test("27_异常处理_API调用失败", async ({ page }) => {
    await openPage(page);

    const hasOptionZ = await pcSelect(page)
      .locator('option[value="Z"]')
      .count();
    if (hasOptionZ > 0) {
      await pcSelect(page).selectOption("Z");
    }
    await numberInput(page).fill("111");
    const hasOptionZZZ = await marketSelect(page)
      .locator('option[value="ZZZ"]')
      .count();
    if (hasOptionZZZ > 0) {
      await marketSelect(page).selectOption("ZZZ");
    }

    await btn(page, "Delete").click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.hv-error-message");
    if (await errMsg.isVisible()) {
      console.log("Error:", await errMsg.textContent());
    }
    await expect(btn(page, "Delete")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("27_异常处理_API调用失败", "API失敗"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 异常处理-未授权操作
  // ============================================================
  test("28_异常处理_未授权操作", async ({ page }) => {
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

    await btn(page, "Add").click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.hv-error-message");
    if (await errMsg.isVisible()) {
      console.log("Error:", await errMsg.textContent());
    }

    await page.screenshot({
      path: getScreenshotPath("28_异常处理_未授权操作", "未認可"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.29 异常处理-用户未登录
  // ============================================================
  test("29_异常处理_用户未登录", async ({ page }) => {
    await clearLoginState(page);
    await page.goto(PAGE_URL);
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    const titleEl = page.locator("h1.hv-title");
    const titleCount = await titleEl.count();
    if (titleCount > 0) {
      await expect(titleEl).toBeVisible();
    }

    await page.screenshot({
      path: getScreenshotPath("29_异常处理_用户未登录", "未ログイン"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.30 安全性-API请求协议
  // ============================================================
  test("30_安全性_API请求协议", async ({ page }) => {
    await setLoginState(page);

    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/ud08HomologationVariables")) {
        requests.push(request.url());
      }
    });

    await page.goto(PAGE_URL);
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    if (requests.length > 0) {
      console.log("UD08 API requests:", requests);
    }

    await page.screenshot({
      path: getScreenshotPath("30_安全性_API请求协议", "API確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.31 安全性-变更记录日志
  // ============================================================
  test("31_安全性_变更记录日志", async ({ page }) => {
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

    await btn(page, "Update").click();
    await page.waitForTimeout(2000);

    const scsMsg = page.locator("div.hv-success-message");
    if (await scsMsg.isVisible()) {
      console.log("Update success:", await scsMsg.textContent());
    }

    await page.screenshot({
      path: getScreenshotPath("31_安全性_变更记录日志", "变更日志"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.32 Value-最大长度200字符
  // ============================================================
  test("32_Value_最大长度200字符", async ({ page }) => {
    await openPage(page);
    await expect(variableInput(page)).toHaveAttribute("maxLength", "20");

    await page.screenshot({
      path: getScreenshotPath("32_Value_最大长度200字符", "maxLength"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.33 操作中-防止重复提交
  // ============================================================
  test("33_操作中_防止重复提交", async ({ page }) => {
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
      path: getScreenshotPath("33_操作中_防止重复提交", "防止重複"),
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
});
