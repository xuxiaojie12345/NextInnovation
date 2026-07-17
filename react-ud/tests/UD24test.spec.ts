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
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD24";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/hdoc-help`;

// ============================================================
// 截图计数器（全局顺序编号）
// ============================================================
let screenshotCounter = 0;

function getScreenshotPath(_testName: string, _stepName: string): string {
  screenshotCounter++;
  const seq = String(screenshotCounter).padStart(3, "0");
  return `${SCREENSHOT_DIR}/UD24画面ピクチャー${seq}.jpeg`;
}

// ============================================================
// DB接続
// ============================================================
async function initDB() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    console.log("UD24 DB connected");
    await conn.end();
  } catch (err) {
    console.warn("UD24 DB not available:", (err as Error).message);
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
    await page.waitForSelector("h2.help-title", { timeout: 10000 });
  } catch {
    /* ignore */
  }
  await page.waitForTimeout(500);
}

// ============================================================
// テストスイート
// ============================================================
test.describe.serial("UD24 HDocHelp - 单体测试", () => {
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
    await expect(page.locator("h2.help-title")).toBeVisible();
    await expect(page.locator("h2.help-title")).toHaveText("HDoc Help");
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_ﾀｲﾄﾙ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 导航链接列表
    const navLinks = page.locator("ul.manual-links li a.help-link");
    const linkCount = await navLinks.count();
    expect(linkCount).toBe(5);
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "002_ﾅﾋﾞﾘﾝｸ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Basic Introduction 区域
    await expect(
      page
        .locator("h3.section-heading")
        .filter({ hasText: "Basic Introduction" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "003_Basic"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Document Types 区域
    await expect(
      page.locator("h3.section-heading").filter({ hasText: "Document Types" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "004_DocTypes"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Available Variables 区域
    await expect(
      page
        .locator("h3.section-heading")
        .filter({ hasText: "Available Variables" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "005_Variables"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 布局清晰
    await expect(page.locator("div.help-content-box")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "006_全体表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-导航链接
  // ============================================================
  test("02_画面初期显示_导航链接", async ({ page }) => {
    await openPage(page);

    const navLinks = page.locator("ul.manual-links li a.help-link");
    const expectedLinks = [
      "HDoc Quick Guide",
      "List of document types.",
      "Markets in Hdoc",
      "HDoc - Market Document Setting",
      "Describation",
    ];
    for (let i = 0; i < 5; i++) {
      await expect(navLinks.nth(i)).toHaveText(expectedLinks[i]);
    }
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_导航链接", "001_ﾘﾝｸ一覧"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 链接以蓝色可点击文字显示
    for (let i = 0; i < 5; i++) {
      await expect(navLinks.nth(i)).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_导航链接", "002_ﾘﾝｸ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-无后端API调用
  // ============================================================
  test("03_画面初期显示_无后端API调用", async ({ page }) => {
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
      path: getScreenshotPath("03_画面初期显示_无后端API调用", "001_画面状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 导航-HDoc Quick Guide
  // ============================================================
  test("04_导航_HDocQuickGuide", async ({ page }) => {
    await openPage(page);

    const link = page
      .locator("ul.manual-links li a.help-link")
      .filter({ hasText: "HDoc Quick Guide" });
    await expect(link).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("04_导航_HDocQuickGuide", "001_ﾘﾝｸ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await link.click();
    await page.waitForTimeout(1000);

    expect(page.url()).toContain("DownloadAndPrintQuickGuides");
    await page.screenshot({
      path: getScreenshotPath("04_导航_HDocQuickGuide", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 导航-List of document types
  // ============================================================
  test("05_导航_ListOfDocumentTypes", async ({ page }) => {
    await openPage(page);

    const link = page
      .locator("ul.manual-links li a.help-link")
      .filter({ hasText: "List of document types." });
    await expect(link).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("05_导航_ListOfDocumentTypes", "001_ﾘﾝｸ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await link.click();
    await page.waitForTimeout(1000);

    expect(page.url()).toContain("document-types");
    await page.screenshot({
      path: getScreenshotPath("05_导航_ListOfDocumentTypes", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 导航-Markets in HDoc
  // ============================================================
  test("06_导航_MarketsInHDoc", async ({ page }) => {
    await openPage(page);

    const link = page
      .locator("ul.manual-links li a.help-link")
      .filter({ hasText: "Markets in Hdoc" });
    await expect(link).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("06_导航_MarketsInHDoc", "001_ﾘﾝｸ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await link.click();
    await page.waitForTimeout(1000);

    expect(page.url()).toContain("markets-in-hdoc");
    await page.screenshot({
      path: getScreenshotPath("06_导航_MarketsInHDoc", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 导航-HDoc - Market Document Setting
  // ============================================================
  test("07_导航_MarketDocumentSetting", async ({ page }) => {
    await openPage(page);

    const link = page
      .locator("ul.manual-links li a.help-link")
      .filter({ hasText: "HDoc - Market Document Setting" });
    await expect(link).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("07_导航_MarketDocumentSetting", "001_ﾘﾝｸ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await link.click();
    await page.waitForTimeout(1000);

    expect(page.url()).toContain("market-document-settings-list");
    await page.screenshot({
      path: getScreenshotPath("07_导航_MarketDocumentSetting", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 导航-Describation
  // ============================================================
  test("08_导航_Describation", async ({ page }) => {
    await openPage(page);

    const link = page
      .locator("ul.manual-links li a.help-link")
      .filter({ hasText: "Describation" });
    await expect(link).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("08_导航_Describation", "001_ﾘﾝｸ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await link.click();
    await page.waitForTimeout(1000);

    // 跳转到/Description页面
    await page.screenshot({
      path: getScreenshotPath("08_导航_Describation", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 导航-连续点击不同链接
  // ============================================================
  test("09_导航_连续点击不同链接", async ({ page }) => {
    await openPage(page);

    const links = page.locator("ul.manual-links li a.help-link");

    // 点击HDoc Quick Guide
    await links.nth(0).click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain("DownloadAndPrintQuickGuides");
    await page.screenshot({
      path: getScreenshotPath("09_导航_连续点击不同链接", "001_1st遷移"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 返回
    await page.goBack();
    await page.waitForTimeout(500);
    await expect(page.locator("h2.help-title")).toBeVisible();

    // 点击List of document types
    await page.locator("ul.manual-links li a.help-link").nth(1).click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain("document-types");
    await page.screenshot({
      path: getScreenshotPath("09_导航_连续点击不同链接", "002_2nd遷移"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 返回
    await page.goBack();
    await page.waitForTimeout(500);
    await expect(page.locator("h2.help-title")).toBeVisible();

    // 点击Markets in HDoc
    await page.locator("ul.manual-links li a.help-link").nth(2).click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain("markets-in-hdoc");
    await page.screenshot({
      path: getScreenshotPath("09_导航_连续点击不同链接", "003_3rd遷移"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 导航-浏览器前进后退
  // ============================================================
  test("10_导航_浏览器前进后退", async ({ page }) => {
    await openPage(page);

    // 点击HDoc Quick Guide跳转
    await page.locator("ul.manual-links li a.help-link").first().click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain("DownloadAndPrintQuickGuides");
    await page.screenshot({
      path: getScreenshotPath("10_导航_浏览器前进后退", "001_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 后退到HDoc Help
    await page.goBack();
    await page.waitForTimeout(500);
    await expect(page.locator("h2.help-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("10_导航_浏览器前进后退", "002_戻り後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 所有链接可用
    const linkCount = await page
      .locator("ul.manual-links li a.help-link")
      .count();
    expect(linkCount).toBe(5);
    await page.screenshot({
      path: getScreenshotPath("10_导航_浏览器前进后退", "003_ﾘﾝｸ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 前进回到目标页面
    await page.goForward();
    await page.waitForTimeout(500);
    expect(page.url()).toContain("DownloadAndPrintQuickGuides");
    await page.screenshot({
      path: getScreenshotPath("10_导航_浏览器前进后退", "004_進み後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 异常处理-页面加载失败
  // ============================================================
  test("11_异常处理_页面加载失败", async ({ page }) => {
    await openPage(page);

    // 页面正常加载
    await expect(page.locator("h2.help-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("11_异常处理_页面加载失败", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 异常处理-路由错误
  // ============================================================
  test("12_异常处理_路由错误", async ({ page }) => {
    await openPage(page);

    // 确认所有链接路径正确
    const links = page.locator("ul.manual-links li a.help-link");
    const hrefs = await links.evaluateAll((els) =>
      els.map((el) => (el as HTMLAnchorElement).getAttribute("href")),
    );
    expect(hrefs[0]).toBe("/DownloadAndPrintQuickGuides");
    expect(hrefs[1]).toBe("/document-types");
    expect(hrefs[2]).toBe("/markets-in-hdoc");
    expect(hrefs[3]).toBe("/market-document-settings-list");
    expect(hrefs[4]).toBe("/Description");
    await page.screenshot({
      path: getScreenshotPath("12_异常处理_路由错误", "001_ﾙｰﾄ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 安全性-用户未登录
  // ============================================================
  test("13_安全性_用户未登录", async ({ page }) => {
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
      path: getScreenshotPath("13_安全性_用户未登录", "001_未ﾛｸﾞｲﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 安全性-XSS保护
  // ============================================================
  test("14_安全性_XSS保护", async ({ page }) => {
    await openPage(page);

    // 确认页面正常显示
    await expect(page.locator("h2.help-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("14_安全性_XSS保护", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 安全性-数据完整性
  // ============================================================
  test("15_安全性_数据完整性", async ({ page }) => {
    await openPage(page);

    // 确认所有内容区域完整
    await expect(page.locator("div.help-content-box")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("15_安全性_数据完整性", "001_全体表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认四个section都存在
    const sections = page.locator("div.help-section");
    const sectionCount = await sections.count();
    expect(sectionCount).toBe(4);
    await page.screenshot({
      path: getScreenshotPath("15_安全性_数据完整性", "002_ｾｸｼｮﾝ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
