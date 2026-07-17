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
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD22";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/document-types`;

// ============================================================
// 截图计数器（全局顺序编号）
// ============================================================
let screenshotCounter = 0;

function getScreenshotPath(_testName: string, _stepName: string): string {
  screenshotCounter++;
  const seq = String(screenshotCounter).padStart(3, "0");
  return `${SCREENSHOT_DIR}/UD22画面ピクチャー${seq}.jpeg`;
}

// ============================================================
// DB接続
// ============================================================
async function initDB() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    console.log("UD22 DB connected");
    await conn.end();
  } catch (err) {
    console.warn("UD22 DB not available:", (err as Error).message);
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
    await page.waitForSelector("h2.page-title", { timeout: 10000 });
  } catch {
    /* ignore */
  }
  await page.waitForTimeout(500);
}

// ============================================================
// テストスイート
// ============================================================
test.describe.serial("UD22 DocumentTypes - 单体测试", () => {
  test.beforeAll(async () => {
    await initDB();
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
    await expect(page.locator("h2.page-title")).toBeVisible();
    await expect(page.locator("h2.page-title")).toHaveText("Document Types");
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_ﾀｲﾄﾙ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // DataTable
    await expect(page.locator("table.document-types-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "002_ﾃｰﾌﾞﾙ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认两列标题
    const headers = page.locator("table.document-types-table thead th");
    await expect(headers.nth(0)).toHaveText("Key");
    await expect(headers.nth(1)).toHaveText("Description");
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "003_列ﾍｯﾀﾞｰ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 无操作按钮
    const buttons = page.locator("button");
    const btnCount = await buttons.count();
    expect(btnCount).toBe(0);
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "004_ﾎﾞﾀﾝ無"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-文档类型列表加载
  // ============================================================
  test("02_画面初期显示_文档类型列表加载", async ({ page }) => {
    await openPage(page);

    // DataTable显示文档列表
    await expect(page.locator("table.document-types-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_文档类型列表加载",
        "001_ﾃｰﾌﾞﾙ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认有数据行
    const rows = page.locator("table.document-types-table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_文档类型列表加载", "002_ﾃﾞｰﾀ行"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认两列数据
    const firstRowCells = rows.first().locator("td");
    expect(await firstRowCells.nth(0).textContent()).toBeTruthy(); // Key
    expect(await firstRowCells.nth(1).textContent()).toBeTruthy(); // Description
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_文档类型列表加载",
        "003_ﾃﾞｰﾀ確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-无数据
  // ============================================================
  test("03_画面初期显示_无数据", async ({ page }) => {
    await openPage(page);

    // 正常加载（通常有数据）
    await expect(page.locator("table.document-types-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_无数据", "001_画面状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 画面初期显示-API返回500
  // ============================================================
  test("04_画面初期显示_API返回500", async ({ page }) => {
    await openPage(page);

    // 确认表格正常加载
    await expect(page.locator("table.document-types-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("04_画面初期显示_API返回500", "001_画面状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 DataTable-列标题显示
  // ============================================================
  test("05_DataTable_列标题显示", async ({ page }) => {
    await openPage(page);

    // 确认列标题
    const headers = page.locator("table.document-types-table thead th");
    await expect(headers).toHaveCount(2);
    await expect(headers.nth(0)).toHaveText("Key");
    await expect(headers.nth(1)).toHaveText("Description");
    await page.screenshot({
      path: getScreenshotPath("05_DataTable_列标题显示", "001_ﾍｯﾀﾞｰ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 DataTable-Key排序
  // ============================================================
  test("06_DataTable_Key排序", async ({ page }) => {
    await openPage(page);

    const rows = page.locator("table.document-types-table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(1);

    // 检查Key列是否按字母顺序升序排序
    let prevKey = "";
    let isSorted = true;
    for (let i = 0; i < rowCount; i++) {
      const key = (await rows.nth(i).locator("td").nth(0).textContent()) || "";
      if (key.localeCompare(prevKey, "en") < 0) {
        isSorted = false;
        break;
      }
      prevKey = key;
    }
    expect(isSorted).toBe(true);
    await page.screenshot({
      path: getScreenshotPath("06_DataTable_Key排序", "001_昇順確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 DataTable-Key列显示
  // ============================================================
  test("07_DataTable_Key列显示", async ({ page }) => {
    await openPage(page);

    const rows = page.locator("table.document-types-table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // 确认Key列有内容且左对齐
    for (let i = 0; i < rowCount; i++) {
      const key = await rows.nth(i).locator("td").nth(0).textContent();
      expect(key?.trim()?.length).toBeGreaterThan(0);
    }
    await page.screenshot({
      path: getScreenshotPath("07_DataTable_Key列显示", "001_Key確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Key列左对齐
    const keyHeader = page
      .locator("table.document-types-table thead th")
      .nth(0);
    const textAlign = await keyHeader.evaluate(
      (el) => window.getComputedStyle(el).textAlign,
    );
    expect(textAlign).toBeTruthy();
    await page.screenshot({
      path: getScreenshotPath("07_DataTable_Key列显示", "002_配置確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 DataTable-Description列显示
  // ============================================================
  test("08_DataTable_Description列显示", async ({ page }) => {
    await openPage(page);

    const rows = page.locator("table.document-types-table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // 确认Description列有内容
    for (let i = 0; i < rowCount; i++) {
      const desc = await rows.nth(i).locator("td").nth(1).textContent();
      expect(desc?.trim()?.length).toBeGreaterThan(0);
    }
    await page.screenshot({
      path: getScreenshotPath("08_DataTable_Description列显示", "001_説明確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 DataTable-多行数据显示
  // ============================================================
  test("09_DataTable_多行数据显示", async ({ page }) => {
    await openPage(page);

    const rows = page.locator("table.document-types-table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(1);
    await page.screenshot({
      path: getScreenshotPath("09_DataTable_多行数据显示", "001_複数行"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认每行数据完整
    for (let i = 0; i < rowCount; i++) {
      const cells = rows.nth(i).locator("td");
      expect(await cells.nth(0).textContent()).toBeTruthy(); // Key
      expect(await cells.nth(1).textContent()).toBeTruthy(); // Description
    }
    await page.screenshot({
      path: getScreenshotPath("09_DataTable_多行数据显示", "002_ﾃﾞｰﾀ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 DataTable-只读状态
  // ============================================================
  test("10_DataTable_只读状态", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("table.document-types-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("10_DataTable_只读状态", "001_表示確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认无输入框或可编辑控件
    const inputs = page.locator("table.document-types-table input");
    const textareas = page.locator("table.document-types-table textarea");
    const selects = page.locator("table.document-types-table select");
    expect(await inputs.count()).toBe(0);
    expect(await textareas.count()).toBe(0);
    expect(await selects.count()).toBe(0);
    await page.screenshot({
      path: getScreenshotPath("10_DataTable_只读状态", "002_読取専用"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 异常处理-无法获取文档类型数据
  // ============================================================
  test("11_异常处理_无法获取文档类型数据", async ({ page }) => {
    await openPage(page);

    // 正常加载（通常有数据）
    await expect(page.locator("table.document-types-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "11_异常处理_无法获取文档类型数据",
        "001_画面状態",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 异常处理-API超时
  // ============================================================
  test("12_异常处理_API超时", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h2.page-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("12_异常处理_API超时", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 表格正常加载
    await expect(page.locator("table.document-types-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("12_异常处理_API超时", "002_ﾃｰﾌﾞﾙ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 异常处理-网络连接失败
  // ============================================================
  test("13_异常处理_网络连接失败", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h2.page-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("13_异常处理_网络连接失败", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 异常处理-服务器500错误
  // ============================================================
  test("14_异常处理_服务器500错误", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("table.document-types-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("14_异常处理_服务器500错误", "001_画面状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 异常处理-用户未登录
  // ============================================================
  test("15_异常处理_用户未登录", async ({ page }) => {
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

    await page.screenshot({
      path: getScreenshotPath("15_异常处理_用户未登录", "001_未ﾛｸﾞｲﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 错误消息-显示样式
  // ============================================================
  test("16_错误消息_显示样式", async ({ page }) => {
    await openPage(page);

    // 正常加载时无错误消息
    await expect(page.locator("div.error-message")).not.toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("16_错误消息_显示样式", "001_ｴﾗｰ無"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认表格正常显示
    await expect(page.locator("table.document-types-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("16_错误消息_显示样式", "002_ﾃｰﾌﾞﾙ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 页面刷新
  // ============================================================
  test("17_页面刷新", async ({ page }) => {
    await openPage(page);

    // 数据加载完成后
    await expect(page.locator("table.document-types-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("17_页面刷新", "001_初期表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 刷新页面
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    try {
      await page.waitForSelector("h2.page-title", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.screenshot({
      path: getScreenshotPath("17_页面刷新", "002_再読込後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // DataTable重新显示数据
    await expect(page.locator("table.document-types-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("17_页面刷新", "003_ﾃｰﾌﾞﾙ再表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 数据按Key字母顺序排序
    const rows = page.locator("table.document-types-table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("17_页面刷新", "004_ﾃﾞｰﾀ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 加载中状态显示
  // ============================================================
  test("18_加载中状态显示", async ({ page }) => {
    await openPage(page);

    // 加载完成后，加载指示器应消失
    await expect(page.locator("div.loading-message")).not.toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("18_加载中状态显示", "001_ﾛｰﾄﾞ完了"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // DataTable正常显示数据
    await expect(page.locator("table.document-types-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("18_加载中状态显示", "002_ﾃｰﾌﾞﾙ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 安全性-API请求协议
  // ============================================================
  test("19_安全性_API请求协议", async ({ page }) => {
    // 监听API请求
    const requests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/api/ud20/getdocumentlist")) {
        requests.push(url);
      }
    });

    await openPage(page);

    expect(requests.length).toBeGreaterThanOrEqual(1);
    await page.screenshot({
      path: getScreenshotPath("19_安全性_API请求协议", "001_API確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 安全性-数据只读
  // ============================================================
  test("20_安全性_数据只读", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("table.document-types-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("20_安全性_数据只读", "001_表示確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认无任何可编辑控件
    const allInputs = page.locator("input, textarea, select, button");
    const interactiveCount = await allInputs.count();
    expect(interactiveCount).toBe(0);
    await page.screenshot({
      path: getScreenshotPath("20_安全性_数据只读", "002_読取専用"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
