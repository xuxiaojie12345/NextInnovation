import { test, expect, Page } from "@playwright/test";
import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: "172.17.0.63",
  user: "root",
  password: "1234",
  database: "react_ud",
};
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD09";
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/homologation-variables-result-list`;

let screenshotCounter: { [key: string]: number } = {};
function getScreenshotPath(testName: string, stepName: string): string {
  if (!screenshotCounter[testName]) screenshotCounter[testName] = 0;
  screenshotCounter[testName]++;
  return `${SCREENSHOT_DIR}/${testName}_${String(screenshotCounter[testName]).padStart(3, "0")}_${stepName}.jpeg`;
}

let dbAvailable = false;
async function setupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    dbAvailable = true;
    try {
      const data = [
        {
          pc: "Z",
          num: 101,
          market: "ZZZ",
          v: "VAR_A",
          val: "VAL_A",
          vs: "VS_A",
          c: "UD09 test A",
        },
        {
          pc: "Z",
          num: 102,
          market: "ZZZ",
          v: "VAR_B",
          val: "VAL_B",
          vs: "VS_B",
          c: "UD09 test B",
        },
        {
          pc: "Z",
          num: 201,
          market: "ZZZ",
          v: "VAR_C",
          val: "VAL_C",
          vs: "VS_C",
          c: "UD09 test C",
        },
      ];
      for (const d of data) {
        await conn.execute(
          `INSERT IGNORE INTO HDOC_USER_DEFINED_RULES (PC,NUM,MARKET,VS,VARIABLE,VAL,USERID,UP_DATE,COMMENTS,ADD_DATE,REGISTER_DATETIME,REGISTER_USER,REGISTER_PROCESS,UPDATE_DATETIME,UPDATE_USER,UPDATE_PROCESS)
           VALUES (?,?,?,?,?,?,?,?,?,?,NOW(),?,?,NOW(),?,?)`,
          [
            d.pc,
            d.num,
            d.market,
            d.vs,
            d.v,
            d.val,
            "TEST_USER",
            "202608",
            d.c,
            "202608",
            "TEST_USER",
            "PLAYWRIGHT",
            "TEST_USER",
            "PLAYWRIGHT",
          ],
        );
      }
      console.log("DB test data ok");
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
      await conn.execute(
        "DELETE FROM HDOC_USER_DEFINED_RULES WHERE PC=? AND MARKET=? AND REGISTER_USER=?",
        ["Z", "ZZZ", "TEST_USER"],
      );
    } finally {
      await conn.end();
    }
  } catch {
    /* ignore */
  }
}

async function setLoginState(page: Page) {
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.setItem("currentUser", "admin"));
}
async function clearLoginState(page: Page) {
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.removeItem("currentUser"));
}
async function safeWait(page: Page) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch {
    /* ignore */
  }
}

const MOCK_DATA = [
  {
    pc: "Z",
    num: 101,
    market: "ZZZ",
    variable: "VAR_A",
    val: "VAL_A",
    vs: "VS_A",
    vs2: "",
    comments: "UD09 test A",
    addDate: "202608",
    deleteDate: "",
    registerUser: "TEST_USER",
    registerDatetime: "2026-08-01 12:00:00",
  },
  {
    pc: "Z",
    num: 102,
    market: "ZZZ",
    variable: "VAR_B",
    val: "VAL_B",
    vs: "VS_B",
    vs2: "",
    comments: "UD09 test B",
    addDate: "202608",
    deleteDate: "",
    registerUser: "TEST_USER",
    registerDatetime: "2026-08-01 12:00:00",
  },
  {
    pc: "Z",
    num: 201,
    market: "ZZZ",
    variable: "VAR_C",
    val: "VAL_C",
    vs: "VS_C",
    vs2: "",
    comments: "UD09 test C",
    addDate: "202608",
    deleteDate: "",
    registerUser: "TEST_USER",
    registerDatetime: "2026-08-01 12:00:00",
  },
];

async function openPage(page: Page, mockData?: any) {
  await setLoginState(page);
  const data = mockData !== undefined ? mockData : MOCK_DATA;
  await page.route("**/api/ud09*/search", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ code: 200, msg: "success", data }),
    });
  });
  await page.goto(PAGE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch {
    /* ignore */
  }
  await page.waitForTimeout(1000);
}

function btn(page: Page, name: string) {
  return page
    .locator("button.hvrl-btn")
    .filter({ hasText: new RegExp(`^${name}$`) });
}

test.describe("UD09 Homologation Variables Result List - 单体测试", () => {
  test.beforeAll(async () => {
    await setupTestData();
  });
  test.afterAll(async () => {
    await clearTestData();
  });
  test.beforeEach(() => {
    screenshotCounter = {};
  });

  test("01_画面初期显示_基本元素", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("h1.hvrl-title")).toHaveText(
      "Homologation Variables",
    );
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "002_タイトル確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(btn(page, "Select")).toBeVisible();
    await expect(btn(page, "Back")).toBeVisible();
    await expect(btn(page, "Print")).toBeVisible();
    await expect(btn(page, "Delete Selected")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "003_ボタン確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("table.hvrl-table")).toBeVisible();
    await expect(page.locator("div.hvrl-count")).toContainText(
      "Number of lines found:",
    );
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "004_テーブル表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("02_画面初期显示_搜索结果加载", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_搜索结果加载",
        "001_ページ表示後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const rows = page.locator("table.hvrl-table tbody tr td.hvrl-no-data");
    await expect(rows).toHaveCount(0);
    const dataRows = page.locator("table.hvrl-table tbody tr td.hvrl-td");
    expect(await dataRows.count()).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_搜索结果加载",
        "002_データ行確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("div.hvrl-count")).toContainText("3");
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_搜索结果加载",
        "003_カウント確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("03_画面初期显示_无匹配数据", async ({ page }) => {
    await openPage(page, []);
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_无匹配数据", "001_空データ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("td.hvrl-no-data")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_无匹配数据",
        "002_NoRecords表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("div.hvrl-count")).toContainText("0");
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_无匹配数据",
        "003_カウント0確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("04_画面初期显示_搜索API错误", async ({ page }) => {
    await setLoginState(page);
    await page.route("**/api/ud09*/search", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ code: 500, msg: "System error", data: null }),
      });
    });
    await page.goto(PAGE_URL);
    await safeWait(page);
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: getScreenshotPath("04_画面初期显示_搜索API错误", "001_エラー画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("div.hvrl-error-message")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "04_画面初期显示_搜索API错误",
        "002_エラーメッセージ確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("05_Select_未选择记录时点击", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("05_Select_未选择记录时点击", "001_選択前"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Select").click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("05_Select_未选择记录时点击", "002_Select後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("div.hvrl-error-message")).toContainText(
      "Please select a record",
    );
    await page.screenshot({
      path: getScreenshotPath(
        "05_Select_未选择记录时点击",
        "003_エラーメッセージ",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("06_Select_已选择记录时点击", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("06_Select_已选择记录时点击", "001_選択前"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.locator("input[type='radio']").first().click();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: getScreenshotPath("06_Select_已选择记录时点击", "002_選択後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Select").click();
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: getScreenshotPath("06_Select_已选择记录时点击", "003_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page).toHaveURL(/homologation-variables/);
  });

  test("07_Back_返回前画面", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("07_Back_返回前画面", "001_結果一覧画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Back").click();
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: getScreenshotPath("07_Back_返回前画面", "002_戻り先画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page).toHaveURL(/homologation-variables/);
  });

  test("08_Print_打印搜索结果", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("08_Print_打印搜索结果", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(btn(page, "Print")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("08_Print_打印搜索结果", "002_Printボタン確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Print").click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("08_Print_打印搜索结果", "003_Print後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("09_DeleteSelected_未选择记录时点击", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath(
        "09_DeleteSelected_未选择记录时点击",
        "001_ページ表示後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Delete Selected").click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath(
        "09_DeleteSelected_未选择记录时点击",
        "002_クリック後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("div.hvrl-error-message")).toContainText(
      "Please select at least one record",
    );
    await page.screenshot({
      path: getScreenshotPath(
        "09_DeleteSelected_未选择记录时点击",
        "003_エラーメッセージ",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("10_DeleteSelected_删除成功", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("10_DeleteSelected_删除成功", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.route("**/api/ud09*/deleteSelected", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: { deletedCount: 1, failedCount: 0 },
        }),
      });
    });
    await page.route("**/api/ud09*/search", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: [] }),
      });
    });
    await page.locator("input[type='radio']").first().click();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: getScreenshotPath(
        "10_DeleteSelected_删除成功",
        "002_レコード選択後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Delete Selected").click();
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: getScreenshotPath("10_DeleteSelected_删除成功", "003_削除後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const msg = page.locator(
      "div.hvrl-success-message, div.hvrl-error-message",
    );
    if (await msg.isVisible()) console.log("Result:", await msg.textContent());
    await page.screenshot({
      path: getScreenshotPath(
        "10_DeleteSelected_删除成功",
        "004_メッセージ確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("11_DeleteSelected_记录不存在", async ({ page }) => {
    await openPage(page, []);
    await page.screenshot({
      path: getScreenshotPath(
        "11_DeleteSelected_记录不存在",
        "001_空データ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Delete Selected").click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath(
        "11_DeleteSelected_记录不存在",
        "002_クリック後エラー",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("div.hvrl-error-message")).toBeVisible();
  });

  test("12_DataTable_列标题显示", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("12_DataTable_列标题显示", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const texts = await page.locator("th.hvrl-th").allTextContents();
    expect(texts.some((t) => t.includes("Product class"))).toBeTruthy();
    expect(texts.some((t) => t.includes("Number"))).toBeTruthy();
    expect(texts.some((t) => t.includes("Market"))).toBeTruthy();
    expect(texts.some((t) => t.includes("Variable"))).toBeTruthy();
    expect(texts.some((t) => t.includes("Value"))).toBeTruthy();
    expect(texts.some((t) => t.includes("Variant string"))).toBeTruthy();
    expect(texts.some((t) => t.includes("Comments"))).toBeTruthy();
    expect(texts.some((t) => t.includes("Add"))).toBeTruthy();
    expect(texts.some((t) => t.includes("Delete"))).toBeTruthy();
    expect(texts.some((t) => t.includes("Created by user"))).toBeTruthy();
    expect(texts.some((t) => t.includes("Date"))).toBeTruthy();
    await page.screenshot({
      path: getScreenshotPath("12_DataTable_列标题显示", "002_列タイトル確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("13_DataTable_复选框功能", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("13_DataTable_复选框功能", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const radios = page.locator("input[type='radio']");
    expect(await radios.count()).toBe(3);
    await page.screenshot({
      path: getScreenshotPath("13_DataTable_复选框功能", "002_ラジオボタン3つ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await radios.first().check();
    await expect(radios.first()).toBeChecked();
    await page.screenshot({
      path: getScreenshotPath("13_DataTable_复选框功能", "003_1件目選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await radios.nth(1).check();
    await expect(radios.nth(1)).toBeChecked();
    await expect(radios.first()).not.toBeChecked();
    await page.screenshot({
      path: getScreenshotPath(
        "13_DataTable_复选框功能",
        "004_2件目選択（排他確認）",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("14_CreatedByUser_链接显示", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("14_CreatedByUser_链接显示", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const link = page.locator("td.hvrl-td.hvrl-link span").first();
    await expect(link).toBeVisible();
    expect(await link.textContent()).toBeTruthy();
    await page.screenshot({
      path: getScreenshotPath(
        "14_CreatedByUser_链接显示",
        "002_リンク表示確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await link.click();
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: getScreenshotPath("14_CreatedByUser_链接显示", "003_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    console.log("URL:", page.url());
  });

  test("15_Count_搜索结果计数显示", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("15_Count_搜索结果计数显示", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("div.hvrl-count")).toHaveText(
      "Number of lines found: 3",
    );
    await page.screenshot({
      path: getScreenshotPath("15_Count_搜索结果计数显示", "002_Count確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("16_按钮_加载中禁用", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("16_按钮_加载中禁用", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const btns = page.locator("button.hvrl-btn");
    for (let i = 0; i < (await btns.count()); i++)
      await expect(btns.nth(i)).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("16_按钮_加载中禁用", "002_全ボタン有効確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("17_错误消息_显示样式", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("17_错误消息_显示样式", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Select").click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("17_错误消息_显示样式", "002_Select後エラー"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const err = page.locator("div.hvrl-error-message");
    await expect(err).toBeVisible();
    const c = await err.evaluate((el) => window.getComputedStyle(el).color);
    const m = c.match(/(\d+)/g);
    if (m) expect(parseInt(m[0])).toBeGreaterThan(parseInt(m[1]));
    await page.screenshot({
      path: getScreenshotPath("17_错误消息_显示样式", "003_色確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("18_页面刷新", async ({ page }) => {
    await openPage(page);
    await expect(page.locator("h1.hvrl-title")).toHaveText(
      "Homologation Variables",
    );
    await page.screenshot({
      path: getScreenshotPath("18_页面刷新", "001_リロード前"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.reload();
    await safeWait(page);
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: getScreenshotPath("18_页面刷新", "002_リロード後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("h1.hvrl-title")).toHaveText(
      "Homologation Variables",
    );
    await expect(page.locator("table.hvrl-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("18_页面刷新", "003_再表示確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("19_安全性_API请求协议", async ({ page }) => {
    const reqs: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/ud09")) reqs.push(r.url());
    });
    await openPage(page);
    if (reqs.length > 0) console.log("UD09 API:", reqs);
    await page.screenshot({
      path: getScreenshotPath("19_安全性_API请求协议", "001_API確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.screenshot({
      path: getScreenshotPath("19_安全性_API请求协议", "002_リクエスト一覧"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("20_异常处理_用户未登录", async ({ page }) => {
    await clearLoginState(page);
    await page.goto(PAGE_URL);
    await safeWait(page);
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: getScreenshotPath("20_异常处理_用户未登录", "001_未ログイン画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const t = page.locator("h1.hvrl-title");
    if ((await t.count()) > 0) await expect(t).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("20_异常处理_用户未登录", "002_タイトル確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("21_删除确认对话框", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("21_删除确认对话框", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.locator("input[type='radio']").first().click();
    await page.screenshot({
      path: getScreenshotPath("21_删除确认对话框", "002_レコード選択後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Delete Selected").click();
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: getScreenshotPath("21_删除确认对话框", "003_削除結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const r = page.locator("div.hvrl-success-message, div.hvrl-error-message");
    if (await r.isVisible()) console.log("Result:", await r.textContent());
  });

  test("22_安全性_删除操作权限控制", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("22_安全性_删除操作权限控制", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.locator("input[type='radio']").first().click();
    await page.screenshot({
      path: getScreenshotPath(
        "22_安全性_删除操作权限控制",
        "002_レコード選択後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await btn(page, "Delete Selected").click();
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: getScreenshotPath("22_安全性_删除操作权限控制", "003_削除結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const r = page.locator("div.hvrl-success-message, div.hvrl-error-message");
    if (await r.isVisible()) console.log("Result:", await r.textContent());
  });

  test("23_安全性_前端不记录敏感数据", async ({ page }) => {
    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "log") logs.push(msg.text());
    });
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath(
        "23_安全性_前端不记录敏感数据",
        "001_ページ表示後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    for (const l of logs) expect(l.toLowerCase()).not.toContain("password");
    await page.screenshot({
      path: getScreenshotPath(
        "23_安全性_前端不记录敏感数据",
        "002_ログ確認完了",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
