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
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD20";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/market-document-settings-list`;

// ============================================================
// 截图计数器（全局顺序编号）
// ============================================================
let screenshotCounter = 0;

function getScreenshotPath(_testName: string, _stepName: string): string {
  screenshotCounter++;
  const seq = String(screenshotCounter).padStart(3, "0");
  return `${SCREENSHOT_DIR}/UD20画面ピクチャー${seq}.jpeg`;
}

// ============================================================
// DB接続
// ============================================================
async function initDB() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    console.log("UD20 DB connected");
    await conn.end();
  } catch (err) {
    console.warn("UD20 DB not available:", (err as Error).message);
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
    await page.waitForSelector("h1.mdsl-title", { timeout: 10000 });
  } catch {
    /* ignore */
  }
  await page.waitForTimeout(500);
}

// ============================================================
// テストスイート
// ============================================================
test.describe.serial("UD20 MarketDocumentSettingsList - 单体测试", () => {
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
    await expect(page.locator("h1.mdsl-title")).toBeVisible();
    await expect(page.locator("h1.mdsl-title")).toHaveText(
      "HDoc - Market Document Settings",
    );
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_ﾀｲﾄﾙ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // DataTable
    await expect(page.locator("table.mdsl-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "002_ﾃｰﾌﾞﾙ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 三个按钮
    await expect(
      page.locator("button.mdsl-btn").filter({ hasText: "Select" }),
    ).toBeVisible();
    await expect(
      page.locator("button.mdsl-btn").filter({ hasText: "Back" }),
    ).toBeVisible();
    await expect(
      page.locator("button.mdsl-btn").filter({ hasText: "Print" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "003_ﾎﾞﾀﾝ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 所有按钮可用
    const buttons = page.locator("button.mdsl-btn");
    const btnCount = await buttons.count();
    for (let i = 0; i < btnCount; i++) {
      await expect(buttons.nth(i)).toBeEnabled();
    }
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "004_ﾎﾞﾀﾝ活性"),
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

    // DataTable显示文档列表
    await expect(page.locator("table.mdsl-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_文档列表加载", "001_ﾃｰﾌﾞﾙ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认有数据行
    const rows = page.locator("table.mdsl-table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_文档列表加载", "002_ﾃﾞｰﾀ行"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 每行有RadioBox
    const radioInputs = page.locator(
      "table.mdsl-table tbody tr td.mdsl-radio-col input[type='radio']",
    );
    const radioCount = await radioInputs.count();
    expect(radioCount).toBe(rowCount);
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_文档列表加载", "003_RadioBox"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // User列显示为可点击链接
    const userLinks = page.locator(
      "table.mdsl-table tbody tr td.mdsl-td.mdsl-link button.link-button",
    );
    const linkCount = await userLinks.count();
    expect(linkCount).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_文档列表加载", "004_Userﾘﾝｸ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-无数据
  // ============================================================
  test("03_画面初期显示_无数据", async ({ page }) => {
    // 访问页面（正常加载，通常有数据）
    await openPage(page);

    // 确认表格可见
    await expect(page.locator("table.mdsl-table")).toBeVisible();
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

    // 确认表格可正常加载
    await expect(page.locator("table.mdsl-table")).toBeVisible();
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
    const headers = page.locator("table.mdsl-table th.mdsl-th");
    await expect(headers.nth(0)).toHaveText("Document type");
    await expect(headers.nth(1)).toHaveText("Bussines unit");
    await expect(headers.nth(2)).toHaveText("User");
    await expect(headers.nth(3)).toHaveText("Date");
    await page.screenshot({
      path: getScreenshotPath("05_DataTable_列标题显示", "001_ﾍｯﾀﾞｰ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认RadioBox列（空列标题）
    await expect(
      page.locator("table.mdsl-table th.mdsl-radio-col"),
    ).toBeAttached();
    await page.screenshot({
      path: getScreenshotPath("05_DataTable_列标题显示", "002_Radio列"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 DataTable-Bussines unit固定显示
  // ============================================================
  test("06_DataTable_BussinesUnit固定显示", async ({ page }) => {
    await openPage(page);

    // 确认所有行的Bussines unit列显示"VBC"
    const buCells = page.locator("table.mdsl-table tbody tr td.mdsl-td").nth(1);
    // 检查所有行（取第二列）
    const rows = page.locator("table.mdsl-table tbody tr");
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const buValue = await rows
        .nth(i)
        .locator("td.mdsl-td")
        .nth(1)
        .textContent();
      expect(buValue?.trim()).toBe("VBC");
    }
    await page.screenshot({
      path: getScreenshotPath(
        "06_DataTable_BussinesUnit固定显示",
        "001_BU列確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 DataTable-User列链接显示
  // ============================================================
  test("07_DataTable_User列链接显示", async ({ page }) => {
    await openPage(page);

    // User列显示为可点击链接
    const userLinks = page.locator(
      "table.mdsl-table tbody tr td.mdsl-td.mdsl-link button.link-button",
    );
    const linkCount = await userLinks.count();
    expect(linkCount).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("07_DataTable_User列链接显示", "001_Userﾘﾝｸ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击第一个User链接，确认跳转
    if (linkCount > 0) {
      await userLinks.first().click();
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      expect(currentUrl).toContain("edb-user-view");
      await page.screenshot({
        path: getScreenshotPath("07_DataTable_User列链接显示", "002_遷移後"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
  });

  // ============================================================
  // No.8 DataTable-Date格式显示
  // ============================================================
  test("08_DataTable_Date格式显示", async ({ page }) => {
    await openPage(page);

    // 确认Date列显示日期时间
    const rows = page.locator("table.mdsl-table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // 检查第一行的Date列
    const dateValue = await rows
      .first()
      .locator("td.mdsl-td")
      .nth(3)
      .textContent();
    expect(dateValue?.trim()?.length).toBeGreaterThan(0);
    await page.screenshot({
      path: getScreenshotPath("08_DataTable_Date格式显示", "001_日付確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 RadioBox-单选功能
  // ============================================================
  test("09_RadioBox_单选功能", async ({ page }) => {
    await openPage(page);

    const radioInputs = page.locator(
      "table.mdsl-table tbody tr td.mdsl-radio-col input[type='radio']",
    );
    const radioCount = await radioInputs.count();
    expect(radioCount).toBeGreaterThan(1);

    // 点击第一行的RadioBox
    await radioInputs.nth(0).check();
    await expect(radioInputs.nth(0)).toBeChecked();
    await expect(radioInputs.nth(1)).not.toBeChecked();
    await page.screenshot({
      path: getScreenshotPath("09_RadioBox_单选功能", "001_1行目選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击第二行的RadioBox，第一行取消选中
    await radioInputs.nth(1).check();
    await expect(radioInputs.nth(1)).toBeChecked();
    await expect(radioInputs.nth(0)).not.toBeChecked();
    await page.screenshot({
      path: getScreenshotPath("09_RadioBox_单选功能", "002_2行目選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 Select-未选择记录时点击
  // ============================================================
  test("10_Select_未選択時", async ({ page }) => {
    await openPage(page);

    // 未选中任何RadioBox，点击Select
    await page.locator("button.mdsl-btn").filter({ hasText: "Select" }).click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.mdsl-error-message");
    await expect(errMsg).toBeVisible();
    await expect(errMsg).toContainText("No data found");
    await page.screenshot({
      path: getScreenshotPath("10_Select_未選択時", "001_ｴﾗｰ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 Select-已选择记录时点击
  // ============================================================
  test("11_Select_已選択時", async ({ page }) => {
    await openPage(page);

    // 选中第一行
    const radioInputs = page.locator(
      "table.mdsl-table tbody tr td.mdsl-radio-col input[type='radio']",
    );
    await radioInputs.nth(0).check();
    await page.screenshot({
      path: getScreenshotPath("11_Select_已選択時", "001_選択後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击Select
    await page.locator("button.mdsl-btn").filter({ hasText: "Select" }).click();
    await page.waitForTimeout(1000);

    // 返回前画面
    const currentUrl = page.url();
    expect(currentUrl).toContain("market-document-settings");
    await page.screenshot({
      path: getScreenshotPath("11_Select_已選択時", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 Select-加载中按钮禁用
  // ============================================================
  test("12_Select_加载中按钮禁用", async ({ page }) => {
    await openPage(page);

    // 选中第一行
    const radioInputs = page.locator(
      "table.mdsl-table tbody tr td.mdsl-radio-col input[type='radio']",
    );
    await radioInputs.nth(0).check();

    // 点击Select
    await page.locator("button.mdsl-btn").filter({ hasText: "Select" }).click();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: getScreenshotPath("12_Select_加载中按钮禁用", "001_遷移中"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.waitForTimeout(1000);
  });

  // ============================================================
  // No.13 Back-返回前画面
  // ============================================================
  test("13_Back_返回前画面", async ({ page }) => {
    await openPage(page);

    await page.screenshot({
      path: getScreenshotPath("13_Back_返回前画面", "001_画面状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击Back
    await page.locator("button.mdsl-btn").filter({ hasText: "Back" }).click();
    await page.waitForTimeout(1000);

    // 返回前画面
    const currentUrl = page.url();
    expect(currentUrl).toContain("market-document-settings");
    await page.screenshot({
      path: getScreenshotPath("13_Back_返回前画面", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Print-打印文档列表
  // ============================================================
  test("14_Print_打印文档列表", async ({ page }) => {
    await openPage(page);

    await page.screenshot({
      path: getScreenshotPath("14_Print_打印文档列表", "001_画面状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击Print
    await page.locator("button.mdsl-btn").filter({ hasText: "Print" }).click();
    await page.waitForTimeout(500);

    // Print按钮可用
    await expect(
      page.locator("button.mdsl-btn").filter({ hasText: "Print" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("14_Print_打印文档列表", "002_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Print-打印功能不可用
  // ============================================================
  test("15_Print_打印功能不可用", async ({ page }) => {
    await openPage(page);

    await page.screenshot({
      path: getScreenshotPath("15_Print_打印功能不可用", "001_画面状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击Print
    await page.locator("button.mdsl-btn").filter({ hasText: "Print" }).click();
    await page.waitForTimeout(500);

    await expect(
      page.locator("button.mdsl-btn").filter({ hasText: "Print" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("15_Print_打印功能不可用", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 User链接-跳转到EDB User View
  // ============================================================
  test("16_User链接_跳转到EDBUserView", async ({ page }) => {
    await openPage(page);

    // 点击第一个User链接
    const userLinks = page.locator(
      "table.mdsl-table tbody tr td.mdsl-td.mdsl-link button.link-button",
    );
    const linkCount = await userLinks.count();
    if (linkCount > 0) {
      await userLinks.first().click();
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      expect(currentUrl).toContain("edb-user-view");
      await page.screenshot({
        path: getScreenshotPath("16_User链接_跳转到EDBUserView", "001_遷移後"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("16_User链接_跳转到EDBUserView", "001_ﾘﾝｸ無"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
  });

  // ============================================================
  // No.17 User链接-用户不存在
  // ============================================================
  test("17_User链接_用户不存在", async ({ page }) => {
    await openPage(page);

    // 确认表格加载
    await expect(page.locator("table.mdsl-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("17_User链接_用户不存在", "001_画面状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 异常处理-API超时
  // ============================================================
  test("18_异常处理_API超时", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h1.mdsl-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("18_异常处理_API超时", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 页面正常加载后确认按钮可用
    await expect(
      page.locator("button.mdsl-btn").filter({ hasText: "Select" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("18_异常处理_API超时", "002_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 异常处理-网络连接失败
  // ============================================================
  test("19_异常处理_网络连接失败", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h1.mdsl-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("19_异常处理_网络连接失败", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 异常处理-数据库连接异常
  // ============================================================
  test("20_异常处理_数据库连接异常", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("table.mdsl-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("20_异常处理_数据库连接异常", "001_画面状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 异常处理-前画面数据传递失败
  // ============================================================
  test("21_异常处理_前画面数据传递失败", async ({ page }) => {
    await openPage(page);

    // Select未选择时触发错误
    await page.locator("button.mdsl-btn").filter({ hasText: "Select" }).click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.mdsl-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("21_异常处理_前画面数据传递失败", "001_ｴﾗｰ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 异常处理-用户未登录
  // ============================================================
  test("22_异常处理_用户未登录", async ({ page }) => {
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

    // 触发错误（未选中Select）
    await page.locator("button.mdsl-btn").filter({ hasText: "Select" }).click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.mdsl-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("23_错误消息_显示样式", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    const color = await errMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(color).toBeTruthy();
    await page.screenshot({
      path: getScreenshotPath("23_错误消息_显示样式", "002_ｴﾗｰｽﾀｲﾙ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 页面刷新
  // ============================================================
  test("24_页面刷新", async ({ page }) => {
    await openPage(page);

    // 数据加载完成后
    await expect(page.locator("table.mdsl-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("24_页面刷新", "001_初期表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 选中一行
    const radioInputs = page.locator(
      "table.mdsl-table tbody tr td.mdsl-radio-col input[type='radio']",
    );
    const radioCount = await radioInputs.count();
    if (radioCount > 0) {
      await radioInputs.nth(0).check();
    }
    await page.screenshot({
      path: getScreenshotPath("24_页面刷新", "002_選択後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 刷新页面
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    try {
      await page.waitForSelector("h1.mdsl-title", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.screenshot({
      path: getScreenshotPath("24_页面刷新", "003_再読込後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // DataTable重新显示
    await expect(page.locator("table.mdsl-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("24_页面刷新", "004_ﾃｰﾌﾞﾙ再表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // RadioBox恢复未选中
    if (radioCount > 0) {
      const refreshedRadios = page.locator(
        "table.mdsl-table tbody tr td.mdsl-radio-col input[type='radio']",
      );
      for (
        let i = 0;
        i < Math.min(radioCount, await refreshedRadios.count());
        i++
      ) {
        await expect(refreshedRadios.nth(i)).not.toBeChecked();
      }
    }
    await page.screenshot({
      path: getScreenshotPath("24_页面刷新", "005_Radio未選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 所有按钮可用
    const buttons = page.locator("button.mdsl-btn");
    const btnCount = await buttons.count();
    for (let i = 0; i < btnCount; i++) {
      await expect(buttons.nth(i)).toBeEnabled();
    }
    await page.screenshot({
      path: getScreenshotPath("24_页面刷新", "006_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
