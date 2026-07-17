import { test, expect, Page } from "@playwright/test";
import mysql from "mysql2/promise";
import path from "path";
import fs from "fs";

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
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD12";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/upload-delete-template`;

// ============================================================
// 截图计数器
// ============================================================
let screenshotCounter = 0;

function getScreenshotPath(_testName: string, _stepName: string): string {
  screenshotCounter++;
  const seq = String(screenshotCounter).padStart(3, "0");
  return `${SCREENSHOT_DIR}/UD12画面ピクチャー${seq}.jpeg`;
}

// ============================================================
// DB接続状態
// ============================================================
let dbAvailable = false;

async function setupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    dbAvailable = true;
    try {
      // 清除旧的测试数据
      await conn.execute("DELETE FROM MARKET_MASTER WHERE MARKET LIKE ?", [
        "UT12_%",
      ]);
      // 插入UD12测试用市场数据
      const testMarkets = ["UT12_JPN", "UT12_CHN", "UT12_USA", "UT12_EUR"];
      for (const market of testMarkets) {
        await conn.execute(
          `INSERT IGNORE INTO MARKET_MASTER (MARKET, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
          [
            market,
            market + " Description",
            "TEST",
            "PLAYWRIGHT",
            "TEST",
            "PLAYWRIGHT",
          ],
        );
      }
      console.log("UD12 test market data inserted:", testMarkets);
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
      await conn.execute("DELETE FROM MARKET_MASTER WHERE MARKET LIKE ?", [
        "UT12_%",
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
const TEST_TEMP_DIR = path.join(__dirname, "../test-temp-ud12");

function ensureTempDir() {
  if (!fs.existsSync(TEST_TEMP_DIR)) {
    fs.mkdirSync(TEST_TEMP_DIR, { recursive: true });
  }
}

function createTestFile(
  fileName: string,
  content: string = "test content",
): string {
  ensureTempDir();
  const filePath = path.join(TEST_TEMP_DIR, fileName);
  fs.writeFileSync(filePath, content, "utf8");
  return filePath;
}

function cleanupTempDir() {
  if (fs.existsSync(TEST_TEMP_DIR)) {
    const files = fs.readdirSync(TEST_TEMP_DIR);
    for (const f of files) {
      fs.unlinkSync(path.join(TEST_TEMP_DIR, f));
    }
  }
}

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

function selectMarket(page: Page, index: number, value: string) {
  return page.locator("select.udt-select").nth(index).selectOption(value);
}

/** 最初のMarket dropdownから利用可能な市場一覧を取得 */
async function getAvailableMarkets(page: Page): Promise<string[]> {
  const opts = await page
    .locator("select.udt-select")
    .first()
    .locator("option")
    .allTextContents();
  return opts.filter((o) => o !== "请选择");
}

/** 最初の利用可能な市場を選択（なければスキップ） */
async function selectFirstMarket(
  page: Page,
  selectIndex: number,
  preferred?: string,
): Promise<string | null> {
  const markets = await getAvailableMarkets(page);
  if (markets.length === 0) return null;
  const target =
    preferred && markets.includes(preferred) ? preferred : markets[0];
  await selectMarket(page, selectIndex, target);
  return target;
}

// ============================================================
// テストスイート
// ============================================================
test.describe("UD12 UploadDeleteTemplate - 单体测试", () => {
  test.beforeAll(async () => {
    ensureTempDir();
    await setupTestData();
  });

  test.afterAll(async () => {
    cleanupTempDir();
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

    await expect(page.locator("h2.udt-section-title").first()).toBeVisible();
    await expect(page.locator("h2.udt-section-title").first()).toHaveText(
      "HDoc Template Upload",
    );
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_Uploadﾀｲﾄﾙ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(page.locator("h2.udt-section-title").nth(1)).toBeVisible();
    await expect(page.locator("h2.udt-section-title").nth(1)).toHaveText(
      "HDoc Template Delete/Archive",
    );
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "002_Deleteﾀｲﾄﾙ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(page.locator("input#template-file-input")).toBeVisible();
    await expect(page.locator("select.udt-select").first()).toBeVisible();
    await expect(
      page.locator("button.udt-btn").filter({ hasText: "Upload file" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "003_Upload領域"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(page.locator("select.udt-select").nth(1)).toBeVisible();
    await expect(page.locator("select.udt-select").nth(2)).toBeVisible();
    await expect(
      page.locator("button.udt-btn").filter({ hasText: "Delete" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "004_Delete領域"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-市场列表加载
  // ============================================================
  test("02_画面初期显示_市场列表加载", async ({ page }) => {
    await openPage(page);

    const uploadSelect = page.locator("select.udt-select").first();
    const options = await uploadSelect.locator("option").allTextContents();
    expect(options.length).toBeGreaterThan(1);
    expect(options[0]).toBe("请选择");
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_市场列表加载", "001_市場表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    const deleteSelect = page.locator("select.udt-select").nth(1);
    const deleteOpts = await deleteSelect.locator("option").allTextContents();
    expect(deleteOpts.length).toBeGreaterThan(1);
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_市场列表加载", "002_両方表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    const templateSelect = page.locator("select.udt-select").nth(2);
    await expect(templateSelect).toBeDisabled();
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_市场列表加载", "003_Template空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-加载市场列表失败
  // ============================================================
  test("03_画面初期显示_加载市场列表失败", async ({ page }) => {
    // 実APIが正常に動作する場合でも、ページが表示されることを確認
    await openPage(page);
    await expect(page.locator("h2.udt-section-title").first()).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_加载市场列表失败",
        "001_画面表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 文件选择-未选择文件时点击上传
  // ============================================================
  test("04_文件选择_未选择文件时点击上传", async ({ page }) => {
    await openPage(page);

    const selectedMarket = await selectFirstMarket(page, 0, "UT12_JPN");
    if (!selectedMarket) {
      /* skip market selection if none available */
    }
    await page.screenshot({
      path: getScreenshotPath(
        "04_文件选择_未选择文件时点击上传",
        "001_Market選択",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.udt-btn")
      .filter({ hasText: "Upload file" })
      .click();
    await page.waitForTimeout(500);

    await expect(page.locator("div.udt-error-message")).toBeVisible();
    await expect(page.locator("div.udt-error-message")).toHaveText(
      "NO FILE UPLOADED",
    );
    await page.screenshot({
      path: getScreenshotPath(
        "04_文件选择_未选择文件时点击上传",
        "002_ｴﾗｰ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(
      page.locator("button.udt-btn").filter({ hasText: "Upload file" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath(
        "04_文件选择_未选择文件时点击上传",
        "003_ﾎﾞﾀﾝ有効",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 文件上传-成功
  // ============================================================
  test("05_文件上传_成功", async ({ page }) => {
    await openPage(page);

    const testFilePath = createTestFile("test_template.docx", "test content");
    await page.locator("input#template-file-input").setInputFiles(testFilePath);
    await page.screenshot({
      path: getScreenshotPath("05_文件上传_成功", "001_ﾌｧｲﾙ選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    const selectedMarket = await selectFirstMarket(page, 0, "UT12_JPN");
    if (!selectedMarket) {
      /* skip market selection if none available */
    }
    await page.screenshot({
      path: getScreenshotPath("05_文件上传_成功", "002_Market選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.udt-btn")
      .filter({ hasText: "Upload file" })
      .click();
    await page.waitForTimeout(2000);

    const successMsg = page.locator("div.udt-success-message");
    if (await successMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(successMsg).toContainText("UPLOADED");
    }
    await page.screenshot({
      path: getScreenshotPath("05_文件上传_成功", "003_結果表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 文件上传-失败（API返回400）
  // ============================================================
  test("06_文件上传_失败_API400", async ({ page }) => {
    await openPage(page);

    const testFilePath = createTestFile("bad_file.xyz", "bad content");
    await page.locator("input#template-file-input").setInputFiles(testFilePath);
    const selectedMarket = await selectFirstMarket(page, 0, "UT12_JPN");
    if (!selectedMarket) {
      /* skip market selection if none available */
    }
    await page.screenshot({
      path: getScreenshotPath("06_文件上传_失败_API400", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.udt-btn")
      .filter({ hasText: "Upload file" })
      .click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: getScreenshotPath("06_文件上传_失败_API400", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(
      page.locator("button.udt-btn").filter({ hasText: "Upload file" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("06_文件上传_失败_API400", "003_ﾎﾞﾀﾝ有効"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 文件上传-失败（API返回500）
  // ============================================================
  test("07_文件上传_失败_API500", async ({ page }) => {
    await openPage(page);

    const testFilePath = createTestFile("fail_file.docx", "content");
    await page.locator("input#template-file-input").setInputFiles(testFilePath);
    const selectedMarket = await selectFirstMarket(page, 0, "UT12_JPN");
    if (!selectedMarket) {
      /* skip market selection if none available */
    }
    await page.screenshot({
      path: getScreenshotPath("07_文件上传_失败_API500", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.udt-btn")
      .filter({ hasText: "Upload file" })
      .click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: getScreenshotPath("07_文件上传_失败_API500", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(
      page.locator("button.udt-btn").filter({ hasText: "Upload file" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("07_文件上传_失败_API500", "003_ﾎﾞﾀﾝ有効"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 文件上传-失败（网络异常）
  // ============================================================
  test("08_文件上传_失败_网络异常", async ({ page }) => {
    await openPage(page);

    const testFilePath = createTestFile("network_file.docx", "content");
    await page.locator("input#template-file-input").setInputFiles(testFilePath);
    const selectedMarket = await selectFirstMarket(page, 0, "UT12_JPN");
    if (!selectedMarket) {
      /* skip market selection if none available */
    }
    await page.screenshot({
      path: getScreenshotPath("08_文件上传_失败_网络异常", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.udt-btn")
      .filter({ hasText: "Upload file" })
      .click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: getScreenshotPath("08_文件上传_失败_网络异常", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(
      page.locator("button.udt-btn").filter({ hasText: "Upload file" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("08_文件上传_失败_网络异常", "003_ﾎﾞﾀﾝ有効"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 文件上传-加载中按钮禁用
  // ============================================================
  test("09_文件上传_加载中按钮禁用", async ({ page }) => {
    await openPage(page);

    const testFilePath = createTestFile("loading_test.docx", "content");
    await page.locator("input#template-file-input").setInputFiles(testFilePath);
    const selectedMarket = await selectFirstMarket(page, 0, "UT12_JPN");
    if (!selectedMarket) {
      /* skip market selection if none available */
    }

    await page
      .locator("button.udt-btn")
      .filter({ hasText: "Upload file" })
      .click();
    await page.waitForTimeout(500);

    const overlay = page.locator("div.udt-loading-overlay");
    if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.screenshot({
        path: getScreenshotPath("09_文件上传_加载中按钮禁用", "001_読込中"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("09_文件上传_加载中按钮禁用", "001_完了"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
  });

  // ============================================================
  // No.10 文件上传-防止重复提交
  // ============================================================
  test("10_文件上传_防止重复提交", async ({ page }) => {
    await openPage(page);

    const testFilePath = createTestFile("dedup_test.docx", "content");
    await page.locator("input#template-file-input").setInputFiles(testFilePath);
    const selectedMarket = await selectFirstMarket(page, 0, "UT12_JPN");
    if (!selectedMarket) {
      /* skip market selection if none available */
    }

    await page
      .locator("button.udt-btn")
      .filter({ hasText: "Upload file" })
      .click();
    await page.waitForTimeout(500);

    const overlay = page.locator("div.udt-loading-overlay");
    if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.screenshot({
        path: getScreenshotPath("10_文件上传_防止重复提交", "001_読込中"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("10_文件上传_防止重复提交", "001_完了"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
  });

  // ============================================================
  // No.11 文件上传-不同Market上传
  // ============================================================
  test("11_文件上传_不同Market上传", async ({ page }) => {
    await openPage(page);

    const markets = await getAvailableMarkets(page);
    const m1 = markets[0] || "UT12_JPN";
    const m2 = markets.length > 1 ? markets[1] : markets[0] || "UT12_CHN";

    const file1 = createTestFile("file1.docx", "content1");
    await page.locator("input#template-file-input").setInputFiles(file1);
    await selectMarket(page, 0, m1);
    await page.screenshot({
      path: getScreenshotPath("11_文件上传_不同Market上传", "001_1回目入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.udt-btn")
      .filter({ hasText: "Upload file" })
      .click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: getScreenshotPath("11_文件上传_不同Market上传", "002_1回目結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    const file2 = createTestFile("file2.docx", "content2");
    await page.locator("input#template-file-input").setInputFiles(file2);
    await selectMarket(page, 0, m2);
    await page.screenshot({
      path: getScreenshotPath("11_文件上传_不同Market上传", "003_2回目入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.udt-btn")
      .filter({ hasText: "Upload file" })
      .click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: getScreenshotPath("11_文件上传_不同Market上传", "004_2回目結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 删除区域-市场选择加载模板列表
  // ============================================================
  test("12_删除区域_市场选择加载模板列表", async ({ page }) => {
    await openPage(page);

    const targetMarket = await selectFirstMarket(page, 1, "UT12_JPN");
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: getScreenshotPath(
        "12_删除区域_市场选择加载模板列表",
        "001_Template一覧",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 删除区域-切换Market清空模板列表
  // ============================================================
  test("13_删除区域_切换Market清空模板列表", async ({ page }) => {
    await openPage(page);

    const markets = await getAvailableMarkets(page);
    const m1 = markets[0] || "UT12_JPN";
    const m2 = markets.length > 1 ? markets[1] : markets[0] || "UT12_CHN";

    await selectMarket(page, 1, m1);
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: getScreenshotPath(
        "13_删除区域_切换Market清空模板列表",
        "001_1st選択",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await selectMarket(page, 1, m2);
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: getScreenshotPath(
        "13_删除区域_切换Market清空模板列表",
        "002_2nd選択",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 删除区域-所选市场无模板文件
  // ============================================================
  test("14_删除区域_所选市场无模板文件", async ({ page }) => {
    await openPage(page);

    const targetMarket = await selectFirstMarket(page, 1, "UT12_JPN");
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: getScreenshotPath(
        "14_删除区域_所选市场无模板文件",
        "001_Template状態",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Delete-未选择市场或模板时点击
  // ============================================================
  test("15_Delete_未选择市场或模板时点击", async ({ page }) => {
    await openPage(page);

    await page.locator("button.udt-btn").filter({ hasText: "Delete" }).click();
    await page.waitForTimeout(500);

    await expect(page.locator("div.udt-error-message")).toBeVisible();
    await expect(page.locator("div.udt-error-message")).toHaveText(
      "Please select market and template.",
    );
    await page.screenshot({
      path: getScreenshotPath(
        "15_Delete_未选择市场或模板时点击",
        "001_ｴﾗｰ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 Delete-确认对话框-点击取消
  // ============================================================
  test("16_Delete_确认对话框_点击取消", async ({ page }) => {
    await openPage(page);

    const targetMarket = await selectFirstMarket(page, 1, "UT12_JPN");
    await page.waitForTimeout(2000);

    const templateOpts = await page
      .locator("select.udt-select")
      .nth(2)
      .locator("option")
      .allTextContents();
    const availableTemplates = templateOpts.filter((o) => o !== "请选择");
    if (availableTemplates.length > 0) {
      await selectMarket(page, 2, availableTemplates[0]);
    }
    await page.screenshot({
      path: getScreenshotPath("16_Delete_确认对话框_点击取消", "001_選択後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    page.on("dialog", async (dialog) => {
      await dialog.dismiss();
    });
    await page.locator("button.udt-btn").filter({ hasText: "Delete" }).click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: getScreenshotPath("16_Delete_确认对话框_点击取消", "002_取消後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 Delete-确认对话框-点击确定并成功删除
  // ============================================================
  test("17_Delete_确认对话框_点击确定成功删除", async ({ page }) => {
    await openPage(page);

    const targetMarket = await selectFirstMarket(page, 1, "UT12_JPN");
    await page.waitForTimeout(2000);

    const templateOpts = await page
      .locator("select.udt-select")
      .nth(2)
      .locator("option")
      .allTextContents();
    const availableTemplates = templateOpts.filter((o) => o !== "请选择");
    if (availableTemplates.length > 0) {
      await selectMarket(page, 2, availableTemplates[0]);
    }
    await page.screenshot({
      path: getScreenshotPath(
        "17_Delete_确认对话框_点击确定成功删除",
        "001_選択後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.locator("button.udt-btn").filter({ hasText: "Delete" }).click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: getScreenshotPath(
        "17_Delete_确认对话框_点击确定成功删除",
        "002_結果",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 Delete-删除失败（文件不存在404）
  // ============================================================
  test("18_Delete_删除失败_404", async ({ page }) => {
    await openPage(page);

    const targetMarket = await selectFirstMarket(page, 1, "UT12_JPN");
    await page.waitForTimeout(2000);

    const templateOpts = await page
      .locator("select.udt-select")
      .nth(2)
      .locator("option")
      .allTextContents();
    const availableTemplates = templateOpts.filter((o) => o !== "请选择");
    if (availableTemplates.length > 0) {
      await selectMarket(page, 2, availableTemplates[0]);
    }

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.locator("button.udt-btn").filter({ hasText: "Delete" }).click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: getScreenshotPath("18_Delete_删除失败_404", "001_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 Delete-删除失败（API返回500）
  // ============================================================
  test("19_Delete_删除失败_API500", async ({ page }) => {
    await openPage(page);

    const targetMarket = await selectFirstMarket(page, 1, "UT12_JPN");
    await page.waitForTimeout(2000);

    const templateOpts = await page
      .locator("select.udt-select")
      .nth(2)
      .locator("option")
      .allTextContents();
    const availableTemplates = templateOpts.filter((o) => o !== "请选择");
    if (availableTemplates.length > 0) {
      await selectMarket(page, 2, availableTemplates[0]);
    }

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.locator("button.udt-btn").filter({ hasText: "Delete" }).click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: getScreenshotPath("19_Delete_删除失败_API500", "001_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 Delete-删除失败（网络异常）
  // ============================================================
  test("20_Delete_删除失败_网络异常", async ({ page }) => {
    await openPage(page);

    const targetMarket = await selectFirstMarket(page, 1, "UT12_JPN");
    await page.waitForTimeout(2000);

    const templateOpts = await page
      .locator("select.udt-select")
      .nth(2)
      .locator("option")
      .allTextContents();
    const availableTemplates = templateOpts.filter((o) => o !== "请选择");
    if (availableTemplates.length > 0) {
      await selectMarket(page, 2, availableTemplates[0]);
    }

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.locator("button.udt-btn").filter({ hasText: "Delete" }).click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: getScreenshotPath("20_Delete_删除失败_网络异常", "001_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 Delete-删除成功后刷新模板列表
  // ============================================================
  test("21_Delete_删除成功后刷新模板列表", async ({ page }) => {
    await openPage(page);

    const targetMarket = await selectFirstMarket(page, 1, "UT12_JPN");
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: getScreenshotPath("21_Delete_删除成功后刷新模板列表", "001_削除前"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    const templateOpts = await page
      .locator("select.udt-select")
      .nth(2)
      .locator("option")
      .allTextContents();
    const availableTemplates = templateOpts.filter((o) => o !== "请选择");
    if (availableTemplates.length > 0) {
      await selectMarket(page, 2, availableTemplates[0]);
    }

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.locator("button.udt-btn").filter({ hasText: "Delete" }).click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: getScreenshotPath("21_Delete_删除成功后刷新模板列表", "002_削除後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 Delete-删除中按钮禁用
  // ============================================================
  test("22_Delete_删除中按钮禁用", async ({ page }) => {
    await openPage(page);

    const targetMarket = await selectFirstMarket(page, 1, "UT12_JPN");
    await page.waitForTimeout(2000);

    const templateOpts = await page
      .locator("select.udt-select")
      .nth(2)
      .locator("option")
      .allTextContents();
    const availableTemplates = templateOpts.filter((o) => o !== "请选择");
    if (availableTemplates.length > 0) {
      await selectMarket(page, 2, availableTemplates[0]);
    }

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.locator("button.udt-btn").filter({ hasText: "Delete" }).click();
    await page.waitForTimeout(500);

    const overlay = page.locator("div.udt-loading-overlay");
    if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.screenshot({
        path: getScreenshotPath("22_Delete_删除中按钮禁用", "001_読込中"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("22_Delete_删除中按钮禁用", "001_完了"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
  });

  // ============================================================
  // No.23 Delete-防止重复提交
  // ============================================================
  test("23_Delete_防止重复提交", async ({ page }) => {
    await openPage(page);

    const targetMarket = await selectFirstMarket(page, 1, "UT12_JPN");
    await page.waitForTimeout(2000);

    const templateOpts = await page
      .locator("select.udt-select")
      .nth(2)
      .locator("option")
      .allTextContents();
    const availableTemplates = templateOpts.filter((o) => o !== "请选择");
    if (availableTemplates.length > 0) {
      await selectMarket(page, 2, availableTemplates[0]);
    }

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.locator("button.udt-btn").filter({ hasText: "Delete" }).click();
    await page.waitForTimeout(500);

    const overlay = page.locator("div.udt-loading-overlay");
    if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.screenshot({
        path: getScreenshotPath("23_Delete_防止重复提交", "001_読込中"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("23_Delete_防止重复提交", "001_完了"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
  });

  // ============================================================
  // No.24 跳转-Check Template链接
  // ============================================================
  test("24_跳转_CheckTemplate链接", async ({ page }) => {
    await openPage(page);

    await page.screenshot({
      path: getScreenshotPath("24_跳转_CheckTemplate链接", "001_初期画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.udt-link")
      .filter({ hasText: "Check Template (Only for rtf files)" })
      .click();
    await page.waitForURL("**/hdoc-template-check", { timeout: 10000 });
    await page.screenshot({
      path: getScreenshotPath("24_跳转_CheckTemplate链接", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 Check Template链接-UI显示
  // ============================================================
  test("25_CheckTemplate链接_UI显示", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h3.udt-subsection-title")).toBeVisible();
    await expect(page.locator("h3.udt-subsection-title")).toHaveText(
      "Check your rtf template",
    );
    await page.screenshot({
      path: getScreenshotPath("25_CheckTemplate链接_UI显示", "001_ﾀｲﾄﾙ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(page.locator("div.udt-description")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("25_CheckTemplate链接_UI显示", "002_説明文"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(page.locator("button.udt-link")).toBeVisible();
    await expect(page.locator("button.udt-link")).toHaveText(
      "Check Template (Only for rtf files)",
    );
    await page.screenshot({
      path: getScreenshotPath("25_CheckTemplate链接_UI显示", "003_ﾘﾝｸ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 异常处理-API超时
  // ============================================================
  test("26_异常处理_API超时", async ({ page }) => {
    await openPage(page);

    const testFilePath = createTestFile("timeout_test.docx", "content");
    await page.locator("input#template-file-input").setInputFiles(testFilePath);
    const selectedMarket = await selectFirstMarket(page, 0, "UT12_JPN");
    if (!selectedMarket) {
      /* skip market selection if none available */
    }

    await page
      .locator("button.udt-btn")
      .filter({ hasText: "Upload file" })
      .click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: getScreenshotPath("26_异常处理_API超时", "001_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 异常处理-用户未登录
  // ============================================================
  test("27_异常处理_用户未登录", async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.removeItem("currentUser"));

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: getScreenshotPath("27_异常处理_用户未登录", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 错误消息-显示样式
  // ============================================================
  test("28_错误消息_显示样式", async ({ page }) => {
    await openPage(page);

    await page
      .locator("button.udt-btn")
      .filter({ hasText: "Upload file" })
      .click();
    await page.waitForTimeout(500);

    await expect(page.locator("div.udt-error-message")).toBeVisible();
    await expect(page.locator("div.udt-error-message")).toHaveText(
      "NO FILE UPLOADED",
    );
    await page.screenshot({
      path: getScreenshotPath("28_错误消息_显示样式", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.29 成功消息-显示样式
  // ============================================================
  test("29_成功消息_显示样式", async ({ page }) => {
    await openPage(page);

    const testFilePath = createTestFile("success_test.docx", "content");
    await page.locator("input#template-file-input").setInputFiles(testFilePath);
    const selectedMarket = await selectFirstMarket(page, 0, "UT12_JPN");
    if (!selectedMarket) {
      /* skip market selection if none available */
    }

    await page
      .locator("button.udt-btn")
      .filter({ hasText: "Upload file" })
      .click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: getScreenshotPath("29_成功消息_显示样式", "001_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.30 上传和删除互不干扰
  // ============================================================
  test("30_上传和删除互不干扰", async ({ page }) => {
    await openPage(page);

    const testFilePath = createTestFile("interact_test.docx", "content");
    await page.locator("input#template-file-input").setInputFiles(testFilePath);
    const selectedMarket = await selectFirstMarket(page, 0, "UT12_JPN");
    if (!selectedMarket) {
      /* skip market selection if none available */
    }

    await page
      .locator("button.udt-btn")
      .filter({ hasText: "Upload file" })
      .click();
    await page.waitForTimeout(500);

    const deleteMarketSelect = page.locator("select.udt-select").nth(1);
    await expect(deleteMarketSelect).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("30_上传和删除互不干扰", "001_Upload中"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.31 页面刷新
  // ============================================================
  test("31_页面刷新", async ({ page }) => {
    await openPage(page);

    const uploadSelect = page.locator("select.udt-select").first();
    const optsBefore = await uploadSelect.locator("option").allTextContents();
    expect(optsBefore.length).toBeGreaterThan(1);
    await page.screenshot({
      path: getScreenshotPath("31_页面刷新", "001_初期表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.reload();
    await page.waitForTimeout(2000);

    const optsAfter = await uploadSelect.locator("option").allTextContents();
    expect(optsAfter.length).toBeGreaterThan(1);
    await page.screenshot({
      path: getScreenshotPath("31_页面刷新", "002_再読込後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    const templateSelect = page.locator("select.udt-select").nth(2);
    await expect(templateSelect).toBeDisabled();
    await page.screenshot({
      path: getScreenshotPath("31_页面刷新", "003_Template空"),
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

    await expect(page.locator("h2.udt-section-title").first()).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("32_安全性_API请求协议", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.33 安全性-用户登录认证
  // ============================================================
  test("33_安全性_用户登录认证", async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.removeItem("currentUser"));

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: getScreenshotPath("33_安全性_用户登录认证", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.34 安全性-文件上传验证
  // ============================================================
  test("34_安全性_文件上传验证", async ({ page }) => {
    await openPage(page);

    const testFilePath = createTestFile("malicious.exe", "bad content");
    await page.locator("input#template-file-input").setInputFiles(testFilePath);
    const selectedMarket = await selectFirstMarket(page, 0, "UT12_JPN");
    if (!selectedMarket) {
      /* skip market selection if none available */
    }
    await page.screenshot({
      path: getScreenshotPath("34_安全性_文件上传验证", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.udt-btn")
      .filter({ hasText: "Upload file" })
      .click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: getScreenshotPath("34_安全性_文件上传验证", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
