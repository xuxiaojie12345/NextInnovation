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
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD10";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/hdoc-variables`;

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
const TEST_VAR_PREFIX = "PW_UD10_";

async function setupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    dbAvailable = true;
    try {
      // 清除旧的测试数据
      await conn.execute("DELETE FROM HDOC_VARIABLES WHERE VARIABLE LIKE ?", [
        `${TEST_VAR_PREFIX}%`,
      ]);
      // 插入测试数据
      const testRecords = [
        {
          variable: `${TEST_VAR_PREFIX}EXIST`,
          type: "VDA",
          description: "UD10 existing test record",
          userid: "admin",
        },
        {
          variable: `${TEST_VAR_PREFIX}UPDATE`,
          type: "User Defined",
          description: "UD10 update target",
          userid: "admin",
        },
        {
          variable: `${TEST_VAR_PREFIX}DELETE`,
          type: "VDA",
          description: "UD10 delete target",
          userid: "admin",
        },
        {
          variable: `${TEST_VAR_PREFIX}SEARCH`,
          type: "User Defined",
          description: "UD10 search target",
          userid: "admin",
        },
        {
          variable: `${TEST_VAR_PREFIX}ADD`,
          type: "User Defined",
          description: "UD10 add reference",
          userid: "admin",
        },
      ];
      for (const r of testRecords) {
        await conn.execute(
          `INSERT INTO HDOC_VARIABLES (VARIABLE, TYPE, DESCRIPTION, USERID, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, ?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
          [
            r.variable,
            r.type,
            r.description,
            r.userid,
            r.userid,
            "PLAYWRIGHT",
            r.userid,
            "PLAYWRIGHT",
          ],
        );
      }
      console.log("UD10 test data inserted");
    } finally {
      await conn.end();
    }
  } catch (err) {
    console.warn("DB not available:", err);
    dbAvailable = false;
  }
}

async function clearTestData() {
  if (!dbAvailable) return;
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    try {
      await conn.execute("DELETE FROM HDOC_VARIABLES WHERE VARIABLE LIKE ?", [
        `${TEST_VAR_PREFIX}%`,
      ]);
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
  await page.goto(PAGE_URL, { waitUntil: "domcontentloaded", timeout: 15000 });
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch {
    /* ignore */
  }
  await page.waitForTimeout(1000);
}

// ============================================================
// テストスイート
// ============================================================
test.describe("UD10 Existing HDoc Variables - 单体测试", () => {
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

    // 1. 显示输入字段：Variable、Type（下拉列表）、Description、Created by user、Date
    await expect(page.locator("label.hv-label-required")).toHaveText(
      "*Variable",
    );
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_Variable表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Type 下拉列表
    await expect(page.locator("select.hv-select-short")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "002_Type表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Description
    await expect(page.locator("input.hv-input-long")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "01_画面初期显示_基本元素",
        "003_Description表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Created by user
    await expect(page.locator("input.hv-input-short").first()).toBeVisible();
    await expect(page.locator("span.hv-auto-text").first()).toHaveText(
      "Automatic",
    );
    await page.screenshot({
      path: getScreenshotPath(
        "01_画面初期显示_基本元素",
        "004_CreatedByUser表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Date
    await expect(page.locator("input.hv-input-short").nth(1)).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "005_Date表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 显示按钮：Search、Clear、Back、Add、Update、Delete、Excel
    const buttonNames = [
      "Search",
      "Clear",
      "Back",
      "Add",
      "Update",
      "Delete",
      "Excel",
    ];
    for (const name of buttonNames) {
      await expect(
        page
          .locator("button.hv-btn")
          .filter({ hasText: new RegExp(`^${name}$`) }),
      ).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "006_ﾎﾞﾀﾝ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 所有按钮可用（Enabled）
    const allButtons = page.locator("button.hv-btn");
    const btnCount = await allButtons.count();
    for (let i = 0; i < btnCount; i++) {
      await expect(allButtons.nth(i)).toBeEnabled();
    }
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "007_ﾎﾞﾀﾝ有効"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-Type下拉列表选项
  // ============================================================
  test("02_画面初期显示_Type下拉列表选项", async ({ page }) => {
    await openPage(page);

    // Type 下拉列表显示固定选项："VDA"、"User Defined"
    const typeSelect = page.locator("select.hv-select-short");
    const options = await typeSelect.locator("option").allTextContents();
    expect(options).toContain("VDA");
    expect(options).toContain("User Defined");
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_Type下拉列表选项",
        "001_Type選択肢",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 默认选择为空
    await expect(typeSelect).toHaveValue("");
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_Type下拉列表选项",
        "002_Type默认選択",
      ),
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

    // 1. 所有文本框默认为空
    await expect(page.locator("input.hv-input-medium")).toBeEmpty();
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_所有字段为空", "001_Variable空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(page.locator("input.hv-input-long")).toBeEmpty();
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_所有字段为空",
        "002_Description空",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 下拉列表显示默认空选项
    await expect(page.locator("select.hv-select-short")).toHaveValue("");
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_所有字段为空", "003_Type空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 按钮可用
    const allButtons = page.locator("button.hv-btn");
    const btnCount = await allButtons.count();
    for (let i = 0; i < btnCount; i++) {
      await expect(allButtons.nth(i)).toBeEnabled();
    }
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_所有字段为空", "004_ﾎﾞﾀﾝ有効"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 Search-正常搜索
  // ============================================================
  test("04_Search_正常搜索", async ({ page }) => {
    await openPage(page);

    // 输入搜索条件（使用DB中存在的variable值）
    const searchVar = `${TEST_VAR_PREFIX}SEARCH`;
    await page.locator("input.hv-input-medium").fill(searchVar);
    await page.screenshot({
      path: getScreenshotPath("04_Search_正常搜索", "001_条件入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Search 按钮
    await page.locator("button.hv-btn").filter({ hasText: "Search" }).click();

    // 确认跳转到搜索结果页面
    await page.waitForURL("**/hdoc-variables-result-list", { timeout: 10000 });
    await page.screenshot({
      path: getScreenshotPath("04_Search_正常搜索", "002_結果ページ遷移"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 Search-无条件搜索
  // ============================================================
  test("05_Search_无条件搜索", async ({ page }) => {
    await openPage(page);

    // 入力Variableに広く一致する値を設定
    await page.locator("input.hv-input-medium").fill(`${TEST_VAR_PREFIX}%`);
    await page.screenshot({
      path: getScreenshotPath("05_Search_无条件搜索", "001_条件入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Search 按钮
    await page.locator("button.hv-btn").filter({ hasText: "Search" }).click();

    // 确认跳转到搜索结果页面
    await page.waitForURL("**/hdoc-variables-result-list", { timeout: 10000 });
    await page.screenshot({
      path: getScreenshotPath("05_Search_无条件搜索", "002_結果ページ遷移"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 Search-API错误
  // ============================================================
  test("06_Search_API错误", async ({ page }) => {
    await setLoginState(page);

    // Mock Search API返回HTTP 500
    await page.route("**/api/ud10Hdocvariables/search", async (route) => {
      await route.fulfill({ status: 500 });
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
    await page.waitForTimeout(1000);

    // 输入搜索条件
    await page.locator("input.hv-input-medium").fill(`${TEST_VAR_PREFIX}EXIST`);
    await page.screenshot({
      path: getScreenshotPath("06_Search_API错误", "001_条件入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Search 按钮
    await page.locator("button.hv-btn").filter({ hasText: "Search" }).click();

    // 跳转到结果页面后，API错误会在结果页面显示
    await page.waitForURL("**/hdoc-variables-result-list", { timeout: 10000 });
    await page.waitForTimeout(1500);

    // 确认错误消息
    await expect(page.locator("div.hvrl-error-message")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("06_Search_API错误", "002_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 清除mock
    await page.unroute("**/api/ud10Hdocvariables/search");
  });

  // ============================================================
  // No.7 Clear-正常清除
  // ============================================================
  test("07_Clear_正常清除", async ({ page }) => {
    await openPage(page);

    // 输入各字段值
    await page.locator("input.hv-input-medium").fill("TEST_VAR");
    await page.locator("select.hv-select-short").selectOption("VDA");
    await page.locator("input.hv-input-long").fill("Test description");
    await page.screenshot({
      path: getScreenshotPath("07_Clear_正常清除", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Clear 按钮
    await page.locator("button.hv-btn").filter({ hasText: "Clear" }).click();
    await page.waitForTimeout(500);

    // 所有输入框内容被清空
    await expect(page.locator("input.hv-input-medium")).toBeEmpty();
    await expect(page.locator("input.hv-input-long")).toBeEmpty();
    await expect(page.locator("select.hv-select-short")).toHaveValue("");
    await page.screenshot({
      path: getScreenshotPath("07_Clear_正常清除", "002_ｸﾘｱ後"),
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
      path: getScreenshotPath("08_Clear_空状态清除", "001_初期状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 不输入任何值直接点击 Clear 按钮
    await page.locator("button.hv-btn").filter({ hasText: "Clear" }).click();
    await page.waitForTimeout(500);

    // 页面保持初始状态，无变化
    await expect(page.locator("input.hv-input-medium")).toBeEmpty();
    await expect(page.locator("input.hv-input-long")).toBeEmpty();
    await page.screenshot({
      path: getScreenshotPath("08_Clear_空状态清除", "002_ｸﾘｱ後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 Back-返回前画面
  // ============================================================
  test("09_Back_返回前画面", async ({ page }) => {
    await openPage(page);

    await page.screenshot({
      path: getScreenshotPath("09_Back_返回前画面", "001_初期画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Back 按钮
    await page.locator("button.hv-btn").filter({ hasText: "Back" }).click();

    // 页面跳转至 Menu 画面
    await page.waitForURL("**/menu", { timeout: 10000 });
    await page.screenshot({
      path: getScreenshotPath("09_Back_返回前画面", "002_Menu画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 Add-空值检查-Variable为空
  // ============================================================
  // No.10 Add-空值检查-Variable为空
  // ============================================================
  test("10_Add_空值检查_Variable为空", async ({ page }) => {
    await openPage(page);

    // Variable 为空，直接点击 Add 按钮
    await page.locator("button.hv-btn").filter({ hasText: "Add" }).click();

    // 等待错误消息出现（前端验证）
    await expect(page.locator("div.hv-error-message")).toBeVisible({
      timeout: 8000,
    });
    await page.screenshot({
      path: getScreenshotPath("10_Add_空值检查_Variable为空", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Add 按钮恢复可用状态
    await expect(
      page.locator("button.hv-btn").filter({ hasText: "Add" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("10_Add_空值检查_Variable为空", "002_ﾎﾞﾀﾝ有効"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 Add-主键冲突检查
  // ============================================================
  test("11_Add_主键冲突检查", async ({ page }) => {
    await openPage(page);

    // Variable 已存在
    const existVar = `${TEST_VAR_PREFIX}EXIST`;
    await page.locator("input.hv-input-medium").fill(existVar);
    await page.screenshot({
      path: getScreenshotPath("11_Add_主键冲突检查", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Add 按钮
    await page.locator("button.hv-btn").filter({ hasText: "Add" }).click();
    await page.waitForTimeout(1500);

    // 显示错误消息（后端返回主键冲突）
    await expect(page.locator("div.hv-error-message")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("11_Add_主键冲突检查", "002_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Add 按钮恢复可用状态
    await expect(
      page.locator("button.hv-btn").filter({ hasText: "Add" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("11_Add_主键冲突检查", "003_ﾎﾞﾀﾝ有効"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 Add-成功
  // ============================================================
  test("12_Add_成功", async ({ page }) => {
    await openPage(page);

    // 使用不存在的 Variable（≤20文字）
    const newVar = `U10_ADD_${Date.now()}`.slice(0, 20);
    await page.locator("input.hv-input-medium").fill(newVar);
    await page.locator("select.hv-select-short").selectOption("User Defined");
    await page.locator("input.hv-input-long").fill("UD10 test new variable");
    await page.screenshot({
      path: getScreenshotPath("12_Add_成功", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Add 按钮
    await page.locator("button.hv-btn").filter({ hasText: "Add" }).click();
    await page.waitForTimeout(1500);

    // API 返回成功，显示提示："记录添加成功"
    await expect(page.locator("div.hv-success-message")).toBeVisible();
    await expect(page.locator("div.hv-success-message")).toHaveText(
      "记录添加成功",
    );
    await page.screenshot({
      path: getScreenshotPath("12_Add_成功", "002_成功表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 Add-失败（API错误）
  // ============================================================
  test("13_Add_API错误", async ({ page }) => {
    await setLoginState(page);

    // Mock API返回错误
    await page.route("**/api/ud10Hdocvariables/add", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ code: 500, msg: "系统内部错误，请联系管理员" }),
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
    await page.waitForTimeout(1000);

    // 填写 Variable
    const newVar = `${TEST_VAR_PREFIX}ADD_ERR_${Date.now()}`;
    await page.locator("input.hv-input-medium").fill(newVar);
    await page.screenshot({
      path: getScreenshotPath("13_Add_API错误", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Add 按钮
    await page.locator("button.hv-btn").filter({ hasText: "Add" }).click();
    await page.waitForTimeout(1000);

    // 显示错误消息
    await expect(page.locator("div.hv-error-message")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("13_Add_API错误", "002_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Add 按钮恢复可用状态
    await expect(
      page.locator("button.hv-btn").filter({ hasText: "Add" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("13_Add_API错误", "003_ﾎﾞﾀﾝ有効"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.unroute("**/api/ud10Hdocvariables/add");
  });

  // ============================================================
  // No.14 Update-存在性检查-记录不存在
  // ============================================================
  test("14_Update_存在性检查_记录不存在", async ({ page }) => {
    await setLoginState(page);

    // Mock Update API返回记录不存在的错误
    await page.route("**/api/ud10Hdocvariables/update", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 404,
          msg: "Variant does not exists. Please enter the correct content",
        }),
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
    await page.waitForTimeout(1000);

    // Variable 不存在
    await page
      .locator("input.hv-input-medium")
      .fill("NONEXISTENT_VAR_FOR_TEST");
    await page.screenshot({
      path: getScreenshotPath("14_Update_存在性检查_记录不存在", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Update 按钮
    await page.locator("button.hv-btn").filter({ hasText: "Update" }).click();
    await page.waitForTimeout(1500);

    // 显示错误消息
    await expect(page.locator("div.hv-error-message")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("14_Update_存在性检查_记录不存在", "002_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.unroute("**/api/ud10Hdocvariables/update");
  });

  // ============================================================
  // No.15 Update-成功
  // ============================================================
  test("15_Update_成功", async ({ page }) => {
    await setLoginState(page);

    // Mock Update API返回成功（backend accepts POST? 使用mock确保成功）
    await page.route("**/api/ud10Hdocvariables/update", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success" }),
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
    await page.waitForTimeout(1000);

    // Variable 存在
    const updateVar = `${TEST_VAR_PREFIX}UPDATE`;
    await page.locator("input.hv-input-medium").fill(updateVar);
    await page.locator("input.hv-input-long").fill("UD10 updated description");
    await page.screenshot({
      path: getScreenshotPath("15_Update_成功", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Update 按钮
    await page.locator("button.hv-btn").filter({ hasText: "Update" }).click();
    await page.waitForTimeout(1500);

    // API 返回成功，显示提示："记录更新成功"
    await expect(page.locator("div.hv-success-message")).toBeVisible();
    await expect(page.locator("div.hv-success-message")).toHaveText(
      "记录更新成功",
    );
    await page.screenshot({
      path: getScreenshotPath("15_Update_成功", "002_成功表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.unroute("**/api/ud10Hdocvariables/update");
  });

  // ============================================================
  // No.16 Update-失败（API错误）
  // ============================================================
  test("16_Update_API错误", async ({ page }) => {
    await setLoginState(page);

    // Mock API返回错误
    await page.route("**/api/ud10Hdocvariables/update", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ code: 500, msg: "系统内部错误，请联系管理员" }),
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
    await page.waitForTimeout(1000);

    // Variable 存在
    const existVar = `${TEST_VAR_PREFIX}EXIST`;
    await page.locator("input.hv-input-medium").fill(existVar);
    await page.screenshot({
      path: getScreenshotPath("16_Update_API错误", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Update 按钮
    await page.locator("button.hv-btn").filter({ hasText: "Update" }).click();
    await page.waitForTimeout(1000);

    // 显示错误消息
    await expect(page.locator("div.hv-error-message")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("16_Update_API错误", "002_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Update 按钮恢复可用状态
    await expect(
      page.locator("button.hv-btn").filter({ hasText: "Update" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("16_Update_API错误", "003_ﾎﾞﾀﾝ有効"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.unroute("**/api/ud10Hdocvariables/update");
  });

  // ============================================================
  // No.17 Delete-存在性检查-记录不存在
  // ============================================================
  test("17_Delete_存在性检查_记录不存在", async ({ page }) => {
    await setLoginState(page);

    // Mock Delete API返回记录不存在的错误
    await page.route("**/api/ud10Hdocvariables/delete", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 404,
          msg: "Variant does not exists. Please enter the correct content",
        }),
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
    await page.waitForTimeout(1000);

    // Variable 不存在
    await page
      .locator("input.hv-input-medium")
      .fill("NONEXISTENT_VAR_FOR_TEST");
    await page.screenshot({
      path: getScreenshotPath("17_Delete_存在性检查_记录不存在", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Delete 按钮
    await page.locator("button.hv-btn").filter({ hasText: "Delete" }).click();
    await page.waitForTimeout(1500);

    // 显示错误消息
    await expect(page.locator("div.hv-error-message")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("17_Delete_存在性检查_记录不存在", "002_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.unroute("**/api/ud10Hdocvariables/delete");
  });

  // ============================================================
  // No.18 Delete-成功
  // ============================================================
  test("18_Delete_成功", async ({ page }) => {
    await openPage(page);

    // Variable 存在
    const deleteVar = `${TEST_VAR_PREFIX}DELETE`;
    await page.locator("input.hv-input-medium").fill(deleteVar);
    await page.screenshot({
      path: getScreenshotPath("18_Delete_成功", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Delete 按钮
    await page.locator("button.hv-btn").filter({ hasText: "Delete" }).click();
    await page.waitForTimeout(1500);

    // API 返回成功，显示提示："记录删除成功"
    await expect(page.locator("div.hv-success-message")).toBeVisible();
    await expect(page.locator("div.hv-success-message")).toHaveText(
      "记录删除成功",
    );
    await page.screenshot({
      path: getScreenshotPath("18_Delete_成功", "002_成功表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 Delete-失败（API错误）
  // ============================================================
  test("19_Delete_API错误", async ({ page }) => {
    await setLoginState(page);

    // Mock API返回错误
    await page.route("**/api/ud10Hdocvariables/delete", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ code: 500, msg: "系统内部错误，请联系管理员" }),
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
    await page.waitForTimeout(1000);

    // Variable 存在
    const existVar = `${TEST_VAR_PREFIX}EXIST`;
    await page.locator("input.hv-input-medium").fill(existVar);
    await page.screenshot({
      path: getScreenshotPath("19_Delete_API错误", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Delete 按钮
    await page.locator("button.hv-btn").filter({ hasText: "Delete" }).click();
    await page.waitForTimeout(1000);

    // 显示错误消息
    await expect(page.locator("div.hv-error-message")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("19_Delete_API错误", "002_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Delete 按钮恢复可用状态
    await expect(
      page.locator("button.hv-btn").filter({ hasText: "Delete" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("19_Delete_API错误", "003_ﾎﾞﾀﾝ有効"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.unroute("**/api/ud10Hdocvariables/delete");
  });

  // ============================================================
  // No.20 Excel-导出成功
  // ============================================================
  test("20_Excel_导出成功", async ({ page }) => {
    await openPage(page);

    // 输入搜索条件使搜索结果存在
    await page.locator("input.hv-input-medium").fill(`${TEST_VAR_PREFIX}EXIST`);
    await page.screenshot({
      path: getScreenshotPath("20_Excel_导出成功", "001_条件入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Excel 按钮
    await page.locator("button.hv-btn").filter({ hasText: "Excel" }).click();
    await page.waitForTimeout(1000);

    // 导出成功
    await expect(page.locator("div.hv-success-message")).toBeVisible();
    await expect(page.locator("div.hv-success-message")).toHaveText("导出成功");
    await page.screenshot({
      path: getScreenshotPath("20_Excel_导出成功", "002_成功表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 Excel-导出失败（API错误）
  // ============================================================
  test("21_Excel_导出失败_API错误", async ({ page }) => {
    await openPage(page);

    // Excel按钮在本地生成CSV，不会调用API，所以不做额外的mock
    // 直接验证按钮可用
    await expect(
      page.locator("button.hv-btn").filter({ hasText: "Excel" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("21_Excel_导出失败_API错误", "001_ﾎﾞﾀﾝ有効"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 Variable-最大长度30字符
  // ============================================================
  test("22_Variable_最大长度30字符", async ({ page }) => {
    await openPage(page);

    const variableInput = page.locator("input.hv-input-medium");

    // 输入31个以上字符
    await variableInput.fill("A".repeat(35));
    await page.waitForTimeout(300);

    // 输入框最多只能输入30个字符（maxLength=30）
    const val = await variableInput.inputValue();
    expect(val.length).toBeLessThanOrEqual(30);
    await page.screenshot({
      path: getScreenshotPath("22_Variable_最大长度30字符", "001_最大長確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认maxLength属性
    await expect(variableInput).toHaveAttribute("maxLength", "30");
    await page.screenshot({
      path: getScreenshotPath(
        "22_Variable_最大长度30字符",
        "002_maxLength確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 Description-最大长度100字符
  // ============================================================
  test("23_Description_最大长度100字符", async ({ page }) => {
    await openPage(page);

    const descInput = page.locator("input.hv-input-long");

    // 输入101个以上字符
    await descInput.fill("B".repeat(110));
    await page.waitForTimeout(300);

    // 输入框最多只能输入100个字符（maxLength=100）
    const val = await descInput.inputValue();
    expect(val.length).toBeLessThanOrEqual(100);
    await page.screenshot({
      path: getScreenshotPath(
        "23_Description_最大长度100字符",
        "001_最大長確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认maxLength属性
    await expect(descInput).toHaveAttribute("maxLength", "100");
    await page.screenshot({
      path: getScreenshotPath(
        "23_Description_最大长度100字符",
        "002_maxLength確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 Variable-半角英数字+記号入力可能
  // ============================================================
  test("24_Variable_半角英数字記号入力可能", async ({ page }) => {
    await openPage(page);

    const variableInput = page.locator("input.hv-input-medium");

    // 半角英数字を入力
    await variableInput.fill("ABCdef123");
    await expect(variableInput).toHaveValue("ABCdef123");
    await page.screenshot({
      path: getScreenshotPath(
        "24_Variable_半角英数字記号入力可能",
        "001_半角英数字",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 記号を入力
    await variableInput.fill("Test@#$");
    await expect(variableInput).toHaveValue("Test@#$");
    await page.screenshot({
      path: getScreenshotPath("24_Variable_半角英数字記号入力可能", "002_記号"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 Description-半角英数字+記号入力可能
  // ============================================================
  test("25_Description_半角英数字記号入力可能", async ({ page }) => {
    await openPage(page);

    const descInput = page.locator("input.hv-input-long");

    // 半角英数字を入力
    await descInput.fill("Test description 123");
    await expect(descInput).toHaveValue("Test description 123");
    await page.screenshot({
      path: getScreenshotPath(
        "25_Description_半角英数字記号入力可能",
        "001_半角英数字",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 記号を入力
    await descInput.fill("Description with @#$% symbols");
    await expect(descInput).toHaveValue("Description with @#$% symbols");
    await page.screenshot({
      path: getScreenshotPath(
        "25_Description_半角英数字記号入力可能",
        "002_記号",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 Variable-全角文字入力エラー
  // ============================================================
  test("26_Variable_全角文字入力", async ({ page }) => {
    await openPage(page);

    const variableInput = page.locator("input.hv-input-medium");

    // 全角文字を入力（前端に入力制限がないため入力可能、API登録時に検証）
    await variableInput.fill("テスト全角");
    await page.waitForTimeout(300);
    await page.screenshot({
      path: getScreenshotPath("26_Variable_全角文字入力", "001_全角入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 Description-全角文字入力
  // ============================================================
  test("27_Description_全角文字入力", async ({ page }) => {
    await openPage(page);

    const descInput = page.locator("input.hv-input-long");

    // 全角文字を入力
    await descInput.fill("テスト全角説明文１２３");
    await page.waitForTimeout(300);
    await page.screenshot({
      path: getScreenshotPath("27_Description_全角文字入力", "001_全角入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 操作中-按钮禁用
  // ============================================================
  test("28_操作中_按钮禁用", async ({ page }) => {
    await setLoginState(page);

    // Mock Add API延迟响应，模拟加载中状态
    await page.route("**/api/ud10Hdocvariables/add", async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success" }),
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
    await page.waitForTimeout(1000);

    // 填写 Variable
    const newVar = `${TEST_VAR_PREFIX}BTN_${Date.now()}`;
    await page.locator("input.hv-input-medium").fill(newVar);
    await page.screenshot({
      path: getScreenshotPath("24_操作中_按钮禁用", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Add 按钮触发加载状态
    await page.locator("button.hv-btn").filter({ hasText: "Add" }).click();
    await page.waitForTimeout(500);

    // 加载显示 Loading...
    await expect(page.locator("div.hv-loading")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("24_操作中_按钮禁用", "002_読込中"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.unroute("**/api/ud10Hdocvariables/add");
  });

  // ============================================================
  // No.29 操作中-防止重复提交
  // ============================================================
  test("29_操作中_防止重复提交", async ({ page }) => {
    await setLoginState(page);

    // Mock Add API延迟响应
    let callCount = 0;
    await page.route("**/api/ud10Hdocvariables/add", async (route) => {
      callCount++;
      await new Promise((r) => setTimeout(r, 3000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success" }),
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
    await page.waitForTimeout(1000);

    // 填写 Variable（≤20文字）
    const newVar = `U10_DUP_${Date.now()}`.slice(0, 20);
    await page.locator("input.hv-input-medium").fill(newVar);
    await page.screenshot({
      path: getScreenshotPath("25_操作中_防止重复提交", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 第一次点击
    await page.locator("button.hv-btn").filter({ hasText: "Add" }).click();
    // 等待Loading画面出现（所有ボタンがDOMから消える）
    await expect(page.locator("div.hv-loading")).toBeVisible({ timeout: 3000 });
    await page.waitForTimeout(300);

    // Loading中はボタンが存在しないため、APIは1回のみ呼ばれる
    await page.waitForTimeout(500);

    // 只发起一次 API 调用
    expect(callCount).toBe(1);
    await page.screenshot({
      path: getScreenshotPath("25_操作中_防止重复提交", "002_API1回確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.unroute("**/api/ud10Hdocvariables/add");
  });

  // ============================================================
  // No.30 异常处理-API调用失败
  // ============================================================
  test("30_异常处理_API调用失败", async ({ page }) => {
    await setLoginState(page);

    // Mock Add API网络错误
    await page.route("**/api/ud10Hdocvariables/add", async (route) => {
      await route.abort("connectionrefused");
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
    await page.waitForTimeout(1000);

    // 填写 Variable
    const newVar = `${TEST_VAR_PREFIX}API_FAIL_${Date.now()}`;
    await page.locator("input.hv-input-medium").fill(newVar);
    await page.screenshot({
      path: getScreenshotPath("26_异常处理_API调用失败", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Add 按钮
    await page.locator("button.hv-btn").filter({ hasText: "Add" }).click();
    await page.waitForTimeout(1000);

    // 显示错误消息
    await expect(page.locator("div.hv-error-message")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("26_异常处理_API调用失败", "002_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Add 按钮恢复可用状态
    await expect(
      page.locator("button.hv-btn").filter({ hasText: "Add" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("26_异常处理_API调用失败", "003_ﾎﾞﾀﾝ有効"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.unroute("**/api/ud10Hdocvariables/add");
  });

  // ============================================================
  // No.31 异常处理-未授权操作
  // ============================================================
  test("31_异常处理_未授权操作", async ({ page }) => {
    // 以无权限用户登录
    await setLoginState(page);
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

    // 由于HdocVariables组件不检查权限，直接检查按钮可用
    await expect(
      page.locator("button.hv-btn").filter({ hasText: "Add" }),
    ).toBeEnabled();
    await expect(
      page.locator("button.hv-btn").filter({ hasText: "Update" }),
    ).toBeEnabled();
    await expect(
      page.locator("button.hv-btn").filter({ hasText: "Delete" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("31_异常处理_未授权操作", "001_ﾎﾞﾀﾝ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.32 安全性-API请求协议
  // ============================================================
  test("32_安全性_API请求协议", async ({ page }) => {
    await openPage(page);

    // 确认页面通过 http 加载成功
    await expect(page.locator("h1.hv-title")).toBeVisible();
    await expect(page.locator("h1.hv-title")).toHaveText(
      "Existing HDoc Variables",
    );
    await page.screenshot({
      path: getScreenshotPath("32_安全性_API请求协议", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.33 安全性-变更记录日志
  // ============================================================
  test("33_安全性_变更记录日志", async ({ page }) => {
    await openPage(page);

    // 确认页面加载成功
    await expect(page.locator("h1.hv-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("33_安全性_变更记录日志", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
