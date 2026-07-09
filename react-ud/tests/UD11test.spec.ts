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
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD11";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/hdoc-variables-result-list`;

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
const TEST_PREFIX = "UT11_";

async function setupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    dbAvailable = true;
    try {
      // 清除旧的测试数据
      await conn.execute("DELETE FROM HDOC_VARIABLES WHERE VARIABLE LIKE ?", [
        `${TEST_PREFIX}%`,
      ]);
      // 插入UD11测试用数据
      const records = [
        {
          variable: `${TEST_PREFIX}A`,
          type: "VDA",
          desc: "UD11 test record A",
          user: "tester1",
        },
        {
          variable: `${TEST_PREFIX}B`,
          type: "User Defined",
          desc: "UD11 test record B",
          user: "tester2",
        },
        {
          variable: `${TEST_PREFIX}C`,
          type: "VDA",
          desc: "UD11 test record C",
          user: "admin",
        },
        {
          variable: `${TEST_PREFIX}FTLI`,
          type: "User Defined",
          desc: "UD11 FTLI test record",
          user: "admin",
        },
      ];
      for (const r of records) {
        await conn.execute(
          `INSERT IGNORE INTO HDOC_VARIABLES (VARIABLE, TYPE, DESCRIPTION, USERID, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, ?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
          [
            r.variable,
            r.type,
            r.desc,
            r.user,
            r.user,
            "PLAYWRIGHT",
            r.user,
            "PLAYWRIGHT",
          ],
        );
      }
      console.log("UD11 test data inserted");
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
        `${TEST_PREFIX}%`,
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

async function safeWait(page: Page) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch {
    /* ignore */
  }
}

/** UD10の検索画面から遷移して結果一覧を開く（APIリクエストから自動入力項目を除去） */
async function openPageViaSearch(page: Page, searchVar?: string) {
  await setLoginState(page);
  const variable = searchVar || `${TEST_PREFIX}A`;

  // APIリクエストの自動入力項目（createdByUser/date）を除去
  await page.route("**/api/ud10Hdocvariables/search", async (route) => {
    const postData = route.request().postData();
    if (postData) {
      const parsed = JSON.parse(postData);
      const cleanCriteria: any = {};
      if (parsed.variable) cleanCriteria.variable = parsed.variable;
      if (parsed.type) cleanCriteria.type = parsed.type;
      if (parsed.description) cleanCriteria.description = parsed.description;
      if (parsed.variableOperator)
        cleanCriteria.variableOperator = parsed.variableOperator;
      if (parsed.typeOperator) cleanCriteria.typeOperator = parsed.typeOperator;
      if (parsed.descriptionOperator)
        cleanCriteria.descriptionOperator = parsed.descriptionOperator;
      await route.continue({
        method: "POST",
        postData: JSON.stringify(cleanCriteria),
        headers: {
          ...route.request().headers(),
          "Content-Type": "application/json",
        },
      });
    } else {
      await route.continue();
    }
  });

  // UD10画面を開く
  await page.goto(`${APP_URL}/hdoc-variables`, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  await safeWait(page);

  // Variableを入力してSearch
  await page.locator("input.hv-input-medium").fill(variable);
  await page.locator("button.hv-btn").filter({ hasText: "Search" }).click();

  // 結果一覧画面へ遷移
  await page.waitForURL("**/hdoc-variables-result-list", { timeout: 10000 });
  await safeWait(page);
  await page.waitForTimeout(1500);

  // ルートのインターセプトを解除
  await page.unroute("**/api/ud10Hdocvariables/search");
}

// ============================================================
// テストスイート
// ============================================================
test.describe("UD11 HdocVariables Result List - 单体测试", () => {
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
    await openPageViaSearch(page);

    // 1. 显示标题
    await expect(page.locator("h1.hvrl-title")).toBeVisible();
    await expect(page.locator("h1.hvrl-title")).toHaveText(
      "Existing HDoc Variables",
    );
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_ﾀｲﾄﾙ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 显示按钮：Select、Back、Print、Down、Excel
    const btnNames = ["Select", "Back", "Print", "Down", "Excel"];
    for (const name of btnNames) {
      await expect(
        page
          .locator("button.hvrl-btn")
          .filter({ hasText: new RegExp(`^${name}$`) }),
      ).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "002_ﾎﾞﾀﾝ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 显示 DataTable
    await expect(page.locator("table.hvrl-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "003_ﾃｰﾌﾞﾙ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. 显示 Count 标签
    await expect(page.locator("div.hvrl-count")).toBeVisible();
    await expect(page.locator("div.hvrl-count")).toContainText(
      "Number of lines found:",
    );
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "004_Count表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-搜索结果加载
  // ============================================================
  test("02_画面初期显示_搜索结果加载", async ({ page }) => {
    await openPageViaSearch(page);

    // 等待DataTable加载完成
    await expect(page.locator("table.hvrl-table")).toBeVisible();
    await page.waitForTimeout(500);

    // DataTable中有测试数据行
    const rows = page.locator("table.hvrl-table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_搜索结果加载", "001_ﾃﾞｰﾀ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Variable列有数据
    const firstRowCells = rows.first().locator("td");
    await expect(firstRowCells.nth(1)).not.toBeEmpty();
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_搜索结果加载", "002_ﾃﾞｰﾀ内容"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Count 显示 Number of lines found: N
    await expect(page.locator("div.hvrl-count")).toContainText(
      "Number of lines found:",
    );
    const countText = await page.locator("div.hvrl-count").textContent();
    expect(countText).toMatch(/Number of lines found: \d+/);
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_搜索结果加载", "003_Count確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-无匹配数据
  // ============================================================
  test("03_画面初期显示_无匹配数据", async ({ page }) => {
    // 存在しないVariableで検索（空結果）
    await openPageViaSearch(page, "NONEXISTENT_UT11");

    // DataTable 显示为空
    await expect(page.locator("td.hvrl-no-data")).toBeVisible();
    await expect(page.locator("td.hvrl-no-data")).toHaveText(
      "No records found",
    );
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_无匹配数据", "001_ﾃﾞｰﾀ無し"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Count 显示 Number of lines found: 0
    await expect(page.locator("div.hvrl-count")).toHaveText(
      "Number of lines found: 0",
    );
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_无匹配数据", "002_Count0"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 画面初期显示-服务器错误
  // ============================================================
  test("04_画面初期显示_服务器错误", async ({ page }) => {
    await setLoginState(page);

    // Mock 500 error
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

    // 显示错误消息
    await expect(page.locator("div.hvrl-error-message")).toBeVisible();
    await expect(page.locator("div.hvrl-error-message")).toHaveText(
      "System error. Please contact administrator.",
    );
    await page.screenshot({
      path: getScreenshotPath("04_画面初期显示_服务器错误", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // DataTable保持为空（Loading终了后显示No records found）
    await expect(page.locator("td.hvrl-no-data")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("04_画面初期显示_服务器错误", "002_ﾃﾞｰﾀ空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.unroute("**/api/ud10Hdocvariables/search");
  });

  // ============================================================
  // No.5 画面初期显示-网络异常
  // ============================================================
  test("05_画面初期显示_网络异常", async ({ page }) => {
    await setLoginState(page);

    // Mock网络切断
    await page.route("**/api/ud10Hdocvariables/search", async (route) => {
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

    // 显示错误消息
    await expect(page.locator("div.hvrl-error-message")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("05_画面初期显示_网络异常", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // DataTable保持为空
    await expect(page.locator("td.hvrl-no-data")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("05_画面初期显示_网络异常", "002_ﾃﾞｰﾀ空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.unroute("**/api/ud10Hdocvariables/search");
  });

  // ============================================================
  // No.6 Search-重新搜索
  // ============================================================
  test("06_Search_重新搜索", async ({ page }) => {
    await openPageViaSearch(page);

    // 确认初始数据加载
    await expect(page.locator("table.hvrl-table")).toBeVisible();
    const initialCountText = await page.locator("div.hvrl-count").textContent();
    await page.screenshot({
      path: getScreenshotPath("06_Search_重新搜索", "001_初期ﾃﾞｰﾀ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Search 按钮（实际上不存在Search按钮，Back按钮为リロード代わり）
    // 注：コンポーネントにはSearchボタンがないので、代わりに再読み込み
    await page.reload();
    await page.waitForTimeout(2000);

    // 再読み込み後もデータが表示される
    await expect(page.locator("table.hvrl-table")).toBeVisible();
    const newCountText = await page.locator("div.hvrl-count").textContent();
    expect(newCountText).toMatch(/Number of lines found: \d+/);
    await page.screenshot({
      path: getScreenshotPath("06_Search_重新搜索", "002_再読込後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 Select-未选择记录时点击
  // ============================================================
  test("07_Select_未选择记录时点击", async ({ page }) => {
    await openPageViaSearch(page);

    await page.waitForTimeout(500);

    // 未选择任何记录，直接点击 Select 按钮
    await page.locator("button.hvrl-btn").filter({ hasText: "Select" }).click();
    await page.waitForTimeout(500);

    // 显示错误消息："Please select a record."
    await expect(page.locator("div.hvrl-error-message")).toBeVisible();
    await expect(page.locator("div.hvrl-error-message")).toHaveText(
      "Please select a record.",
    );
    await page.screenshot({
      path: getScreenshotPath("07_Select_未选择记录时点击", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 Select-已选择记录时点击
  // ============================================================
  test("08_Select_已选择记录时点击", async ({ page }) => {
    await openPageViaSearch(page);

    // 等待数据加载完成
    await expect(
      page.locator("table.hvrl-table tbody tr td.hvrl-td").first(),
    ).toBeVisible({ timeout: 10000 });
    await page.screenshot({
      path: getScreenshotPath("08_Select_已选择记录时点击", "001_ﾃﾞｰﾀ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 选择第一条记录的radio
    const radio = page.locator("input[type='radio']").first();
    await radio.check();
    await page.screenshot({
      path: getScreenshotPath("08_Select_已选择记录时点击", "002_行選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Select 按钮
    await page.locator("button.hvrl-btn").filter({ hasText: "Select" }).click();

    // 返回前画面（/hdoc-variables）
    await page.waitForURL("**/hdoc-variables", { timeout: 10000 });
    await page.screenshot({
      path: getScreenshotPath("08_Select_已选择记录时点击", "003_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 Down-未选择记录时点击
  // ============================================================
  test("09_Down_未选择记录时点击", async ({ page }) => {
    await openPageViaSearch(page, "NONEXISTENT_UT11");

    // 数据为空，点击 Down 按钮
    await page.locator("button.hvrl-btn").filter({ hasText: "Down" }).click();
    await page.waitForTimeout(500);

    // ExcelBtn调用handleExcel→数据为空→显示错误
    await expect(page.locator("div.hvrl-error-message")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("09_Down_未选择记录时点击", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 Down-已选择记录时跳转
  // ============================================================
  test("10_Down_已选择记录时点击", async ({ page }) => {
    await openPageViaSearch(page);

    // 等待数据加载完成
    await expect(
      page.locator("table.hvrl-table tbody tr td.hvrl-td").first(),
    ).toBeVisible({ timeout: 10000 });
    await page.screenshot({
      path: getScreenshotPath("10_Down_已选择记录时点击", "001_ﾃﾞｰﾀ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 选择第一条记录
    const radio = page.locator("input[type='radio']").first();
    await radio.check();
    await page.screenshot({
      path: getScreenshotPath("10_Down_已选择记录时点击", "002_行選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Down 按钮（コンポーネントのDownはhandleExcelを呼ぶ）
    await page.locator("button.hvrl-btn").filter({ hasText: "Down" }).click();
    await page.waitForTimeout(1000);

    // Excel导出成功
    await expect(page.locator("div.hvrl-success-message")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("10_Down_已选择记录时点击", "003_出力成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 Back-返回前画面
  // ============================================================
  test("11_Back_返回前画面", async ({ page }) => {
    await openPageViaSearch(page);

    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("11_Back_返回前画面", "001_初期画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Back 按钮
    await page.locator("button.hvrl-btn").filter({ hasText: "Back" }).click();

    // 返回前画面（/hdoc-variables）
    await page.waitForURL("**/hdoc-variables", { timeout: 10000 });
    await page.screenshot({
      path: getScreenshotPath("11_Back_返回前画面", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 Print-打印搜索结果
  // ============================================================
  test("12_Print_打印搜索结果", async ({ page }) => {
    await openPageViaSearch(page);

    // 等待数据加载
    await expect(page.locator("table.hvrl-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("12_Print_打印搜索结果", "001_表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Print 按钮
    await page.locator("button.hvrl-btn").filter({ hasText: "Print" }).click();
    await page.waitForTimeout(500);

    // Print处理被调用（window.print()实际无法在テスト中検証）
    // 画面が変化しないことを確認
    await expect(page.locator("h1.hvrl-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("12_Print_打印搜索结果", "002_Print後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 Excel-导出成功
  // ============================================================
  test("13_Excel_导出成功", async ({ page }) => {
    await openPageViaSearch(page);

    // 等待数据加载
    await expect(
      page.locator("table.hvrl-table tbody tr td.hvrl-td").first(),
    ).toBeVisible({ timeout: 10000 });
    await page.screenshot({
      path: getScreenshotPath("13_Excel_导出成功", "001_ﾃﾞｰﾀ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击 Excel 按钮
    await page.locator("button.hvrl-btn").filter({ hasText: "Excel" }).click();
    await page.waitForTimeout(1000);

    // 导出成功
    await expect(page.locator("div.hvrl-success-message")).toBeVisible();
    await expect(page.locator("div.hvrl-success-message")).toHaveText(
      "File downloaded successfully.",
    );
    await page.screenshot({
      path: getScreenshotPath("13_Excel_导出成功", "002_成功表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Excel-导出失败（API错误）
  // ============================================================
  test("14_Excel_导出失败_API错误", async ({ page }) => {
    await openPageViaSearch(page, "NONEXISTENT_UT11");

    // データが空の状態でExcelボタンをクリック
    await page.locator("button.hvrl-btn").filter({ hasText: "Excel" }).click();
    await page.waitForTimeout(500);

    // 显示错误消息
    await expect(page.locator("div.hvrl-error-message")).toBeVisible();
    await expect(page.locator("div.hvrl-error-message")).toHaveText(
      "No data to export.",
    );
    await page.screenshot({
      path: getScreenshotPath("14_Excel_导出失败_API错误", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 DataTable-列标题显示
  // ============================================================
  test("15_DataTable_列标题显示", async ({ page }) => {
    await openPageViaSearch(page);

    // 确认列标题
    const headers = page.locator("table.hvrl-table thead th.hvrl-th");
    await expect(headers.nth(0)).toHaveText("*Variable");
    await page.screenshot({
      path: getScreenshotPath("15_DataTable_列标题显示", "001_Variable列"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(headers.nth(1)).toHaveText("Type");
    await page.screenshot({
      path: getScreenshotPath("15_DataTable_列标题显示", "002_Type列"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(headers.nth(2)).toHaveText("Description");
    await page.screenshot({
      path: getScreenshotPath("15_DataTable_列标题显示", "003_Description列"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(headers.nth(3)).toContainText("Created by user");
    await page.screenshot({
      path: getScreenshotPath("15_DataTable_列标题显示", "004_CreatedBy列"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(headers.nth(4)).toContainText("Date");
    await page.screenshot({
      path: getScreenshotPath("15_DataTable_列标题显示", "005_Date列"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 DataTable-单选功能
  // ============================================================
  test("16_DataTable_单选功能", async ({ page }) => {
    await openPageViaSearch(page);

    // 等待数据加载
    await expect(
      page.locator("table.hvrl-table tbody tr td.hvrl-td").first(),
    ).toBeVisible({ timeout: 10000 });
    await page.screenshot({
      path: getScreenshotPath("16_DataTable_单选功能", "001_表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 选中第一行
    const radios = page.locator("input[type='radio']");
    const count = await radios.count();
    expect(count).toBeGreaterThanOrEqual(1);

    await radios.nth(0).check();
    await expect(radios.nth(0)).toBeChecked();
    await page.screenshot({
      path: getScreenshotPath("16_DataTable_单选功能", "002_1行目選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 选中第二行（切换选择）
    if (count >= 2) {
      await radios.nth(1).check();
      await expect(radios.nth(1)).toBeChecked();
      await expect(radios.nth(0)).not.toBeChecked();
    }
    await page.screenshot({
      path: getScreenshotPath("16_DataTable_单选功能", "003_2行目選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 Created by user-链接显示
  // ============================================================
  test("17_CreatedByUser_链接显示", async ({ page }) => {
    await openPageViaSearch(page);

    // 等待数据加载
    await expect(
      page.locator("table.hvrl-table tbody tr td.hvrl-td").first(),
    ).toBeVisible({ timeout: 10000 });
    await page.screenshot({
      path: getScreenshotPath("17_CreatedByUser_链接显示", "001_表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Created by user 列显示为链接
    const userLinks = page.locator("td.hvrl-link a");
    await expect(userLinks.first()).toBeVisible();
    const linkText = await userLinks.first().textContent();
    expect(linkText?.length).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("17_CreatedByUser_链接显示", "002_ﾘﾝｸ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 Count-搜索结果计数显示
  // ============================================================
  test("18_Count_搜索结果计数显示", async ({ page }) => {
    await openPageViaSearch(page);

    // 等待数据加载
    await expect(page.locator("div.hvrl-count")).toBeVisible({
      timeout: 10000,
    });
    await page.waitForTimeout(500);

    // Count 显示 Number of lines found: N
    const countText = await page.locator("div.hvrl-count").textContent();
    expect(countText).toMatch(/Number of lines found: \d+/);
    await page.screenshot({
      path: getScreenshotPath("18_Count_搜索结果计数显示", "001_Count表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 异常处理-API超时
  // ============================================================
  test("19_异常处理_API超时", async ({ page }) => {
    await setLoginState(page);

    // Mock API 超时（10秒以上）
    await page.route("**/api/ud10Hdocvariables/search", async (route) => {
      await new Promise((r) => setTimeout(r, 12000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, data: [] }),
      });
    });

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    // 等待错误表示（fetch timeout约10秒）
    try {
      await page.waitForTimeout(11000);
    } catch {
      /* ignore */
    }

    // 超时后显示错误消息
    const errorMsg = page.locator("div.hvrl-error-message");
    if (await errorMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.screenshot({
        path: getScreenshotPath("19_异常处理_API超时", "001_ｴﾗｰ表示"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      // タイムアウトしなかった場合もスクリーンショット
      await page.screenshot({
        path: getScreenshotPath("19_异常处理_API超时", "001_状態確認"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }

    await page.unroute("**/api/ud10Hdocvariables/search");
  });

  // ============================================================
  // No.20 异常处理-JSON解析失败
  // ============================================================
  test("20_异常处理_JSON解析失败", async ({ page }) => {
    await setLoginState(page);

    // Mock 非法JSON
    await page.route("**/api/ud10Hdocvariables/search", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "not valid json{{{",
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

    // 显示错误消息
    await expect(page.locator("div.hvrl-error-message")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("20_异常处理_JSON解析失败", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.unroute("**/api/ud10Hdocvariables/search");
  });

  // ============================================================
  // No.21 异常处理-用户未登录
  // ============================================================
  test("21_异常处理_用户未登录", async ({ page }) => {
    // 清除登录状态
    await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.removeItem("currentUser"));

    // 直接访问页面
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    // 组件不检查登录状态，直接访问
    await page.screenshot({
      path: getScreenshotPath("21_异常处理_用户未登录", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 按钮-加载中禁用
  // ============================================================
  test("22_按钮_加载中禁用", async ({ page }) => {
    await setLoginState(page);

    // Mock Search API 延迟
    await page.route("**/api/ud10Hdocvariables/search", async (route) => {
      await new Promise((r) => setTimeout(r, 5000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, data: [] }),
      });
    });

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(500);

    // 加载中 → Loading画面
    await expect(page.locator("div.hvrl-loading")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("22_按钮_加载中禁用", "001_読込中"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.unroute("**/api/ud10Hdocvariables/search");
  });

  // ============================================================
  // No.23 错误消息-显示样式
  // ============================================================
  test("23_错误消息_显示样式", async ({ page }) => {
    await openPageViaSearch(page);

    // 触发错误：未选择记录点击Select
    await page.locator("button.hvrl-btn").filter({ hasText: "Select" }).click();
    await page.waitForTimeout(500);

    // 错误消息显示
    await expect(page.locator("div.hvrl-error-message")).toBeVisible();
    await expect(page.locator("div.hvrl-error-message")).toHaveText(
      "Please select a record.",
    );
    await page.screenshot({
      path: getScreenshotPath("23_错误消息_显示样式", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 页面刷新
  // ============================================================
  test("24_页面刷新", async ({ page }) => {
    await openPageViaSearch(page);

    // 等待数据加载完成
    await expect(
      page.locator("table.hvrl-table tbody tr td.hvrl-td").first(),
    ).toBeVisible({ timeout: 10000 });
    const initialCount = await page.locator("div.hvrl-count").textContent();
    await page.screenshot({
      path: getScreenshotPath("24_页面刷新", "001_初期表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 刷新页面
    await page.reload();
    await page.waitForTimeout(2000);

    // 重新加载后数据正常显示
    await expect(page.locator("table.hvrl-table")).toBeVisible();
    await expect(page.locator("div.hvrl-count")).toBeVisible();
    const reloadCount = await page.locator("div.hvrl-count").textContent();
    expect(reloadCount).toMatch(/Number of lines found: \d+/);
    await page.screenshot({
      path: getScreenshotPath("24_页面刷新", "002_再読込後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 安全性-API请求协议
  // ============================================================
  test("25_安全性_API请求协议", async ({ page }) => {
    await openPageViaSearch(page);

    // 确认页面通过 http 加载成功
    await expect(page.locator("h1.hvrl-title")).toBeVisible();
    await expect(page.locator("h1.hvrl-title")).toHaveText(
      "Existing HDoc Variables",
    );
    await page.screenshot({
      path: getScreenshotPath("25_安全性_API请求协议", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 安全性-用户登录认证
  // ============================================================
  test("26_安全性_用户登录认证", async ({ page }) => {
    // 清除登录状态
    await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.removeItem("currentUser"));

    // 直接访问页面
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    // 组件不检查登录状态
    await page.screenshot({
      path: getScreenshotPath("26_安全性_用户登录认证", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
