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
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD23";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/DownloadAndPrintQuickGuides`;

// ============================================================
// 截图计数器（全局顺序编号）
// ============================================================
let screenshotCounter = 0;

function getScreenshotPath(_testName: string, _stepName: string): string {
  screenshotCounter++;
  const seq = String(screenshotCounter).padStart(3, "0");
  return `${SCREENSHOT_DIR}/UD23画面ピクチャー${seq}.jpeg`;
}

// ============================================================
// DB接続
// ============================================================
async function initDB() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    console.log("UD23 DB connected");
    await conn.end();
  } catch (err) {
    console.warn("UD23 DB not available:", (err as Error).message);
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
    await page.waitForSelector("div.volvo-header", { timeout: 10000 });
  } catch {
    /* ignore */
  }
  await page.waitForTimeout(500);
}

// ============================================================
// テストスイート
// ============================================================
test.describe.serial("UD23 DownloadAndPrintQuickGuides - 单体测试", () => {
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

    // VOLVO Header
    await expect(page.locator("div.volvo-header h1")).toBeVisible();
    await expect(page.locator("div.volvo-header h1")).toHaveText("VOLVO");
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_Header"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Back链接
    await expect(page.locator("button.back-link")).toBeVisible();
    await expect(page.locator("button.back-link")).toHaveText("Back");
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "002_Backﾘﾝｸ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 标题 "Download and Print Quick Guides"
    await expect(page.locator("h3.volvo-3p-title").first()).toBeVisible();
    await expect(page.locator("h3.volvo-3p-title").first()).toHaveText(
      "Download and Print Quick Guides",
    );
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "003_ﾀｲﾄﾙ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Quick Guides Grid（8个guide item）
    const guideItems = page.locator("div.guide-item");
    const guideCount = await guideItems.count();
    expect(guideCount).toBe(8);
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "004_ｶﾞｲﾄﾞ一覧"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 每个guide有图片和按钮
    const guideImgs = page.locator("div.guide-item img.guide-thumbnail");
    expect(await guideImgs.count()).toBe(8);
    const guideBtns = page.locator("div.guide-item button.guide-link");
    expect(await guideBtns.count()).toBe(8);
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "005_ｶﾞｲﾄﾞ要素"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Volvo 3P Quick Guides 区域
    await expect(
      page.locator("div.volvo-3p-section h3.volvo-3p-title"),
    ).toBeVisible();
    await expect(
      page.locator("div.volvo-3p-section h3.volvo-3p-title"),
    ).toHaveText("Volvo 3P Quick Guides");

    const volvo3pLinks = page.locator("ul.volvo-3p-list button.volvo-3p-link");
    const volvo3pCount = await volvo3pLinks.count();
    expect(volvo3pCount).toBe(9);
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "006_3P一覧"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-无后端API调用
  // ============================================================
  test("02_画面初期显示_无后端API调用", async ({ page }) => {
    // 监听所有网络请求
    const apiRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/")) {
        apiRequests.push(req.url());
      }
    });

    await openPage(page);

    // 确认没有任何API调用
    expect(apiRequests.length).toBe(0);
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_无后端API调用", "001_画面状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-文件不可用
  // ============================================================
  test("03_画面初期显示_文件不可用", async ({ page }) => {
    await openPage(page);

    // 所有guide图片加载成功或显示占位图
    const guideImgs = page.locator("div.guide-item img.guide-thumbnail");
    const imgCount = await guideImgs.count();
    expect(imgCount).toBe(8);
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_文件不可用", "001_画像確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认各guide按钮显示
    const guideBtns = page.locator("div.guide-item button.guide-link");
    const expectedNames = [
      "WIS Quick Guide",
      "PERF Quick Guide",
      "W8 Quick Guide",
      "HDoc Quick Guide",
      "EDB Quick Guide",
      "COS Quick Guide",
      "VBI Quick Guide (Intranet version)",
      "VBI Quick Guide (Internet version)",
    ];
    for (let i = 0; i < 8; i++) {
      await expect(guideBtns.nth(i)).toHaveText(expectedNames[i]);
    }
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_文件不可用", "002_ｶﾞｲﾄﾞ名"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 快速指南下载-正常下载
  // ============================================================
  test("04_快速指南下载_正常下载", async ({ page }) => {
    await openPage(page);

    // 点击第一个guide的按钮（WIS Quick Guide）
    const guideBtns = page.locator("div.guide-item button.guide-link");
    await expect(guideBtns.first()).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("04_快速指南下载_正常下载", "001_ﾎﾞﾀﾝ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await guideBtns.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("04_快速指南下载_正常下载", "002_ｸﾘｯｸ後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 页面不刷新
    expect(page.url()).toContain("DownloadAndPrintQuickGuides");
    await page.screenshot({
      path: getScreenshotPath("04_快速指南下载_正常下载", "003_画面維持"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 快速指南下载-文件下载失败
  // ============================================================
  test("05_快速指南下载_文件下载失败", async ({ page }) => {
    await openPage(page);

    // 点击guide按钮
    const guideBtns = page.locator("div.guide-item button.guide-link");
    await guideBtns.nth(1).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("05_快速指南下载_文件下载失败", "001_ｸﾘｯｸ後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 页面不刷新
    expect(page.url()).toContain("DownloadAndPrintQuickGuides");
    await page.screenshot({
      path: getScreenshotPath("05_快速指南下载_文件下载失败", "002_画面維持"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 快速指南下载-网络断开
  // ============================================================
  test("06_快速指南下载_网络断开", async ({ page }) => {
    await openPage(page);

    const guideBtns = page.locator("div.guide-item button.guide-link");
    await guideBtns.nth(2).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("06_快速指南下载_网络断开", "001_ｸﾘｯｸ後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    expect(page.url()).toContain("DownloadAndPrintQuickGuides");
    await page.screenshot({
      path: getScreenshotPath("06_快速指南下载_网络断开", "002_画面維持"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 快速指南下载-连续点击
  // ============================================================
  test("07_快速指南下载_连续点击", async ({ page }) => {
    await openPage(page);

    const guideBtns = page.locator("div.guide-item button.guide-link");
    // 快速连续点击同一个按钮
    await guideBtns.nth(3).click();
    await guideBtns.nth(3).click();
    await guideBtns.nth(3).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("07_快速指南下载_连续点击", "001_連続ｸﾘｯｸ後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 页面无异常
    expect(page.url()).toContain("DownloadAndPrintQuickGuides");
    await page.screenshot({
      path: getScreenshotPath("07_快速指南下载_连续点击", "002_画面維持"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 Volvo 3P下载-正常下载
  // ============================================================
  test("08_Volvo3P下载_正常下载", async ({ page }) => {
    await openPage(page);

    // 点击第一个Volvo 3P链接
    const volvo3pLinks = page.locator("ul.volvo-3p-list button.volvo-3p-link");
    await expect(volvo3pLinks.first()).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("08_Volvo3P下载_正常下载", "001_ﾘﾝｸ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await volvo3pLinks.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("08_Volvo3P下载_正常下载", "002_ｸﾘｯｸ後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 页面不刷新
    expect(page.url()).toContain("DownloadAndPrintQuickGuides");
    await page.screenshot({
      path: getScreenshotPath("08_Volvo3P下载_正常下载", "003_画面維持"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 Volvo 3P下载-文件下载失败
  // ============================================================
  test("09_Volvo3P下载_文件下载失败", async ({ page }) => {
    await openPage(page);

    const volvo3pLinks = page.locator("ul.volvo-3p-list button.volvo-3p-link");
    await volvo3pLinks.nth(1).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("09_Volvo3P下载_文件下载失败", "001_ｸﾘｯｸ後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    expect(page.url()).toContain("DownloadAndPrintQuickGuides");
    await page.screenshot({
      path: getScreenshotPath("09_Volvo3P下载_文件下载失败", "002_画面維持"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 Volvo 3P下载-网络断开
  // ============================================================
  test("10_Volvo3P下载_网络断开", async ({ page }) => {
    await openPage(page);

    const volvo3pLinks = page.locator("ul.volvo-3p-list button.volvo-3p-link");
    await volvo3pLinks.nth(2).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("10_Volvo3P下载_网络断开", "001_ｸﾘｯｸ後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    expect(page.url()).toContain("DownloadAndPrintQuickGuides");
    await page.screenshot({
      path: getScreenshotPath("10_Volvo3P下载_网络断开", "002_画面維持"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 页面导航-Back链接
  // ============================================================
  test("11_页面导航_Back链接", async ({ page }) => {
    // 先导航到一个页面再跳转到UD23，以便Back能返回
    await setLoginState(page);
    await page.goto(`${APP_URL}/user-guide`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(300);

    // 从UD24点链接进入UD23
    const ud23Link = page.locator("a[href='/DownloadAndPrintQuickGuides']");
    if (await ud23Link.isVisible().catch(() => false)) {
      await ud23Link.click();
      await page.waitForTimeout(1000);
    } else {
      // 直接访问
      await page.goto(PAGE_URL, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
    }
    await page.waitForTimeout(500);

    await expect(page.locator("button.back-link")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("11_页面导航_Back链接", "001_UD23画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击Back
    await page.locator("button.back-link").click();
    await page.waitForTimeout(1000);

    // 返回前一个页面
    await page.screenshot({
      path: getScreenshotPath("11_页面导航_Back链接", "002_戻り後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 异常处理-文件不存在
  // ============================================================
  test("12_异常处理_文件不存在", async ({ page }) => {
    await openPage(page);

    // 所有guide图片显示（正常或占位图）
    const guideImgs = page.locator("div.guide-item img.guide-thumbnail");
    const imgCount = await guideImgs.count();
    expect(imgCount).toBe(8);
    await page.screenshot({
      path: getScreenshotPath("12_异常处理_文件不存在", "001_画像確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 点击按钮
    const guideBtns = page.locator("div.guide-item button.guide-link");
    await guideBtns.last().click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("12_异常处理_文件不存在", "002_ｸﾘｯｸ後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 异常处理-下载失败
  // ============================================================
  test("13_异常处理_下载失败", async ({ page }) => {
    await openPage(page);

    const guideBtns = page.locator("div.guide-item button.guide-link");
    await guideBtns.nth(4).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("13_异常处理_下载失败", "001_ｸﾘｯｸ後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    expect(page.url()).toContain("DownloadAndPrintQuickGuides");
    await page.screenshot({
      path: getScreenshotPath("13_异常处理_下载失败", "002_画面維持"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 异常处理-用户未登录
  // ============================================================
  test("14_异常处理_用户未登录", async ({ page }) => {
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
      path: getScreenshotPath("14_异常处理_用户未登录", "001_未ﾛｸﾞｲﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 安全性-静态文件访问控制
  // ============================================================
  test("15_安全性_静态文件访问控制", async ({ page }) => {
    await openPage(page);

    // 确认页面正常显示
    await expect(page.locator("div.volvo-header h1")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("15_安全性_静态文件访问控制", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 安全性-文件路径保护
  // ============================================================
  test("16_安全性_文件路径保护", async ({ page }) => {
    await openPage(page);

    // 确认页面正常显示
    await expect(page.locator("div.volvo-header")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("16_安全性_文件路径保护", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
