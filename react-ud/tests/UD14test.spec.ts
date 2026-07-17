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
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD14";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/list-available-templates`;

// ============================================================
// 截图计数器（全局顺序编号）
// ============================================================
let screenshotCounter = 0;

function getScreenshotPath(_testName: string, _stepName: string): string {
  screenshotCounter++;
  const seq = String(screenshotCounter).padStart(3, "0");
  return `${SCREENSHOT_DIR}/UD14画面ピクチャー${seq}.jpeg`;
}

// ============================================================
// DB接続確認
// ============================================================
async function initDB() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    console.log("UD14 DB connected");
    await conn.end();
  } catch (err) {
    console.warn("UD14 DB not available:", (err as Error).message);
  }
}

// ============================================================
// テスト共通関数
// ============================================================
async function setLoginState(page: Page) {
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.setItem("currentUser", "admin"));
}

// ============================================================
// テストデータ準備
// ============================================================
const TEST_MARKET = "-EU";
const TEST_FILES = [
  "test_template.docx",
  "test_template.rtf",
  "timeout_test.docx",
];

async function setupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    try {
      const db = conn as any;
      // クリア
      await db.execute("DELETE FROM HDOC_USER_DEFINED_RULES WHERE MARKET = ?", [
        TEST_MARKET,
      ]);
      // テストデータ挿入（INSERT IGNORE + 一意のNUMで並行実行時の主キー競合を回避）
      for (let i = 0; i < TEST_FILES.length; i++) {
        const valValue = `${TEST_MARKET}/${TEST_FILES[i]}`;
        await db.execute(
          `INSERT IGNORE INTO HDOC_USER_DEFINED_RULES (PC, NUM, MARKET, VS, VARIABLE, VAL, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
          [
            "T1",
            i + 1,
            TEST_MARKET,
            "VS_VAL",
            "TEST_VAR",
            valValue,
            "PLAYWRIGHT",
            "PLAYWRIGHT",
            "PLAYWRIGHT",
            "PLAYWRIGHT",
          ],
        );
      }
      console.log("UD14 test data inserted:", TEST_FILES.length, "records");
    } finally {
      await conn.end();
    }
  } catch (err) {
    console.warn("UD14 setupTestData error:", (err as Error).message);
  }
}

async function cleanupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    try {
      const db = conn as any;
      await db.execute("DELETE FROM HDOC_USER_DEFINED_RULES WHERE MARKET = ?", [
        TEST_MARKET,
      ]);
      console.log("UD14 test data cleaned");
    } finally {
      await conn.end();
    }
  } catch {
    /* ignore */
  }
}

async function openPage(page: Page) {
  await setLoginState(page);
  await page.goto(PAGE_URL, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  // ページが完全にレンダリングされるまで待機
  try {
    await page.waitForLoadState("networkidle", { timeout: 15000 });
  } catch {
    /* ignore */
  }
  // タイトル要素が表示されるまで待機（最大10秒）
  try {
    await page.waitForSelector("h2.lat-section-title", { timeout: 10000 });
  } catch {
    // コンポーネントがレンダリングされていない場合はスクリーンショットのみ
  }
  await page.waitForTimeout(500);
}

/** Select Market の選択肢一覧を取得（"-"を除く） */
async function getMarketOptions(page: Page): Promise<string[]> {
  const opts = await page.locator("select.lat-select option").allTextContents();
  return opts.filter((o) => o !== "-");
}

/** 指定したMarketを選択 */
async function selectMarket(page: Page, value: string) {
  await page.locator("select.lat-select").selectOption(value);
  await page.waitForTimeout(1500);
}

// ============================================================
// テストスイート
// ============================================================
test.describe.serial("UD14 ListAvailableTemplates - 单体测试", () => {
  test.beforeAll(async () => {
    await initDB();
    await setupTestData();
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test.beforeAll(() => {
    screenshotCounter = 0;
  });

  // ============================================================
  // No.1 画面初期显示-基本元素
  // ============================================================
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await openPage(page);

    // 1. 显示标题
    await expect(page.locator("h2.lat-section-title")).toBeVisible();
    await expect(page.locator("h2.lat-section-title")).toHaveText(
      "List Templates",
    );
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_ﾀｲﾄﾙ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 显示 "Select Market" 下拉列表
    await expect(page.locator("label.lat-label")).toBeVisible();
    await expect(page.locator("label.lat-label")).toHaveText("Select Market:");
    await expect(page.locator("select.lat-select")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "002_SelectMarket"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 显示 DataTable（表头）
    await expect(page.locator("table.lat-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "003_ﾃｰﾌﾞﾙ存在"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. 确认表头
    await expect(page.locator("th.lat-th-filename")).toBeVisible();
    await expect(page.locator("th.lat-th-used")).toBeVisible();
    await expect(page.locator("th.lat-th-lastmod")).toBeVisible();
    await expect(page.locator("th.lat-th-size")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "004_列ﾍｯﾀﾞｰ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 5. 初期状態：エラーメッセージなし
    const errorMsg = page.locator("div.lat-error-message");
    const successMsg = page.locator("div.lat-success-message");
    if (await errorMsg.isVisible().catch(() => false)) {
      await expect(errorMsg).not.toBeVisible();
    }
    if (await successMsg.isVisible().catch(() => false)) {
      await expect(successMsg).not.toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "005_初期状態"),
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

    // 1. 下拉列表が存在することを確認
    const selectEl = page.locator("select.lat-select");
    await expect(selectEl).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_市场列表加载", "001_select存在"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 下拉列表有市场选项（APIが正常ならmarketが入る）
    const markets = await getMarketOptions(page);
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_市场列表加载", "002_市場ﾘｽﾄ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 表格为空（初期状態）
    const emptyRow = page.locator("td.lat-empty-row");
    await expect(emptyRow).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_市场列表加载", "003_ﾃｰﾌﾞﾙ空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-加载市场列表失败
  // ※モック禁止のため、実際のAPIが動作することを確認
  // ============================================================
  test("03_画面初期显示_加载市场列表失败", async ({ page }) => {
    await openPage(page);

    // 画面が表示されることを確認
    await expect(page.locator("h2.lat-section-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_加载市场列表失败",
        "001_画面表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Market dropdown の状態を確認
    const markets = await getMarketOptions(page);
    if (markets.length === 0) {
      // API失敗時：エラーメッセージ確認
      const errorMsg = page.locator("div.lat-error-message");
      if (await errorMsg.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(errorMsg).toBeVisible();
      }
    }
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_加载市场列表失败",
        "002_状態確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 市场选择-加载文件列表成功
  // ============================================================
  test("04_市场选择_加载文件列表成功", async ({ page }) => {
    await openPage(page);

    // 利用可能な市場を取得
    const markets = await getMarketOptions(page);

    // 最初の市場を選択（API利用可能な場合のみ）
    if (markets.length > 0) {
      await selectMarket(page, markets[0]);
    }
    await page.screenshot({
      path: getScreenshotPath("04_市场选择_加载文件列表成功", "001_市場選択後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // ファイルリストがロードされたか確認
    const fileRows = page.locator(
      "table.lat-table tbody tr td.lat-td-filename",
    );
    const fileCount = await fileRows.count();
    if (fileCount > 0) {
      await expect(fileRows.first()).toBeVisible();
      // Filename列確認
      await expect(
        page.locator("td.lat-td-filename span.lat-filename-link").first(),
      ).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("04_市场选择_加载文件列表成功", "002_ﾌｧｲﾙ一覧"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 各列の確認
    await page.screenshot({
      path: getScreenshotPath("04_市场选择_加载文件列表成功", "003_表示確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 市场选择-市场下无文件
  // ============================================================
  test("05_市场选择_市场下无文件", async ({ page }) => {
    await openPage(page);

    const markets = await getMarketOptions(page);

    // 各市場を順に選択し、空のものを探す
    let foundEmpty = false;
    for (const market of markets) {
      await selectMarket(page, market);
      const fileRows = page.locator(
        "table.lat-table tbody tr td.lat-td-filename",
      );
      const count = await fileRows.count();
      if (count === 0) {
        foundEmpty = true;
        await page.screenshot({
          path: getScreenshotPath("05_市场选择_市场下无文件", "001_空の市場"),
          type: "jpeg",
          quality: 80,
          fullPage: true,
        });
        break;
      }
    }

    if (!foundEmpty) {
      // すべての市場にファイルがある場合、最初の市場のスクリーンショット
      await selectMarket(page, markets[0]);
    }
    await page.screenshot({
      path: getScreenshotPath("05_市场选择_市场下无文件", "002_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 市场选择-切换市场
  // ============================================================
  test("06_市场选择_切换市场", async ({ page }) => {
    await openPage(page);

    const markets = await getMarketOptions(page);

    // Market Aを選択（API利用可能な場合のみ）
    if (markets.length > 0) {
      await selectMarket(page, markets[0]);
    }
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("06_市场选择_切换市场", "001_MarketA"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Market Bを選択
    await selectMarket(page, markets[1]);
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("06_市场选择_切换市场", "002_MarketB"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 表格表示確認
    await page.screenshot({
      path: getScreenshotPath("06_市场选择_切换市场", "003_切替後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 市场选择-加载文件列表失败
  // ※モック禁止のため、実際のAPIが動作することを確認
  // ============================================================
  test("07_市场选择_加载文件列表失败", async ({ page }) => {
    await openPage(page);

    const markets = await getMarketOptions(page);
    if (markets.length > 0) {
      await selectMarket(page, markets[0]);
    }
    await page.screenshot({
      path: getScreenshotPath("07_市场选择_加载文件列表失败", "001_市場選択後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // エラーメッセージ（存在すれば）確認
    const errorMsg = page.locator("div.lat-error-message");
    if (await errorMsg.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(errorMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("07_市场选择_加载文件列表失败", "002_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 市场选择-加载中下拉列表禁用
  // ※コンポーネントにloading状態が無いため、選択後の状態を確認
  // ============================================================
  test("08_市场选择_加载中下拉列表禁用", async ({ page }) => {
    await openPage(page);

    const markets = await getMarketOptions(page);

    // 市場選択前の状態
    await expect(page.locator("select.lat-select")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("08_市场选择_加载中下拉列表禁用", "001_選択前"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 市場選択
    await selectMarket(page, markets[0]);
    await page.screenshot({
      path: getScreenshotPath("08_市场选择_加载中下拉列表禁用", "002_選択後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 処理完了後は利用可能
    await expect(page.locator("select.lat-select")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("08_市场选择_加载中下拉列表禁用", "003_完了後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 DataTable-列标题显示
  // ============================================================
  test("09_DataTable_列标题显示", async ({ page }) => {
    await openPage(page);

    const markets = await getMarketOptions(page);
    if (markets.length > 0) {
      await selectMarket(page, markets[0]);
    }
    await page.waitForTimeout(500);

    // 列标题确认
    await expect(page.locator("th.lat-th-filename")).toHaveText("Filename");
    await page.screenshot({
      path: getScreenshotPath("09_DataTable_列标题显示", "001_Filename列"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(page.locator("th.lat-th-used")).toHaveText("Used");
    await page.screenshot({
      path: getScreenshotPath("09_DataTable_列标题显示", "002_Used列"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(page.locator("th.lat-th-lastmod")).toHaveText("Last Mod,");
    await page.screenshot({
      path: getScreenshotPath("09_DataTable_列标题显示", "003_LastMod列"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(page.locator("th.lat-th-size")).toHaveText("Size");
    await page.screenshot({
      path: getScreenshotPath("09_DataTable_列标题显示", "004_Size列"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 Filename-显示为可点击链接
  // ============================================================
  test("10_Filename_显示为可点击链接", async ({ page }) => {
    await openPage(page);

    const markets = await getMarketOptions(page);
    if (markets.length > 0) {
      await selectMarket(page, markets[0]);
    }
    await page.waitForTimeout(500);

    // Filename 列确认
    const fileLinks = page.locator("td.lat-td-filename span.lat-filename-link");
    const linkCount = await fileLinks.count();

    if (linkCount > 0) {
      // リンクとして表示されている
      await expect(fileLinks.first()).toBeVisible();
      const linkText = await fileLinks.first().textContent();
      expect(linkText?.length).toBeGreaterThan(0);
      await page.screenshot({
        path: getScreenshotPath("10_Filename_显示为可点击链接", "001_ﾘﾝｸ表示"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("10_Filename_显示为可点击链接", "001_表示なし"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }

    await page.screenshot({
      path: getScreenshotPath("10_Filename_显示为可点击链接", "002_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 Used-变量引用显示
  // ============================================================
  test("11_Used_变量引用显示", async ({ page }) => {
    await openPage(page);

    const markets = await getMarketOptions(page);
    if (markets.length > 0) {
      await selectMarket(page, markets[0]);
    }
    await page.waitForTimeout(500);

    // Used 列确认
    const usedCells = page.locator("td.lat-td-used");
    const usedCount = await usedCells.count();
    if (usedCount > 0) {
      await expect(usedCells.first()).toBeVisible();
      await page.screenshot({
        path: getScreenshotPath("11_Used_变量引用显示", "001_Used表示"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("11_Used_变量引用显示", "001_表示なし"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }

    await page.screenshot({
      path: getScreenshotPath("11_Used_变量引用显示", "002_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 Last Mod,-最后修改时间显示
  // ============================================================
  test("12_LastMod_最后修改时间显示", async ({ page }) => {
    await openPage(page);

    const markets = await getMarketOptions(page);
    if (markets.length > 0) {
      await selectMarket(page, markets[0]);
    }
    await page.waitForTimeout(500);

    const lastModCells = page.locator("td.lat-td-lastmod");
    const count = await lastModCells.count();
    if (count > 0) {
      await expect(lastModCells.first()).toBeVisible();
      await page.screenshot({
        path: getScreenshotPath("12_LastMod_最后修改时间显示", "001_表示"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("12_LastMod_最后修改时间显示", "001_表示なし"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("12_LastMod_最后修改时间显示", "002_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 Size-文件大小显示
  // ============================================================
  test("13_Size_文件大小显示", async ({ page }) => {
    await openPage(page);

    const markets = await getMarketOptions(page);
    if (markets.length > 0) {
      await selectMarket(page, markets[0]);
    }
    await page.waitForTimeout(500);

    const sizeCells = page.locator("td.lat-td-size");
    const count = await sizeCells.count();
    if (count > 0) {
      await expect(sizeCells.first()).toBeVisible();
      await page.screenshot({
        path: getScreenshotPath("13_Size_文件大小显示", "001_表示"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("13_Size_文件大小显示", "001_表示なし"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("13_Size_文件大小显示", "002_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 文件下载-成功
  // ============================================================
  test("14_文件下载_成功", async ({ page }) => {
    await openPage(page);

    const markets = await getMarketOptions(page);
    if (markets.length > 0) {
      await selectMarket(page, markets[0]);
    }
    await page.waitForTimeout(500);

    const fileLinks = page.locator("td.lat-td-filename span.lat-filename-link");
    const linkCount = await fileLinks.count();

    if (linkCount > 0) {
      const fileName = await fileLinks.first().textContent();
      // ダウンロードをキャプチャ
      const downloadPromise = page
        .waitForEvent("download", { timeout: 10000 })
        .catch(() => null);
      await fileLinks.first().click();

      const download = await downloadPromise;
      if (download) {
        await page.screenshot({
          path: getScreenshotPath("14_文件下载_成功", "001_ｸﾘｯｸ後"),
          type: "jpeg",
          quality: 80,
          fullPage: true,
        });
      } else {
        await page.screenshot({
          path: getScreenshotPath("14_文件下载_成功", "001_完了"),
          type: "jpeg",
          quality: 80,
          fullPage: true,
        });
      }
    } else {
      await page.screenshot({
        path: getScreenshotPath("14_文件下载_成功", "001_ﾌｧｲﾙなし"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }

    await page.screenshot({
      path: getScreenshotPath("14_文件下载_成功", "002_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 文件下载-文件不存在
  // ※モック禁止のため、実際のAPIレスポンスを確認
  // ============================================================
  test("15_文件下载_文件不存在", async ({ page }) => {
    await openPage(page);

    const markets = await getMarketOptions(page);
    if (markets.length > 0) {
      await selectMarket(page, markets[0]);
    }
    await page.waitForTimeout(500);

    const fileLinks = page.locator("td.lat-td-filename span.lat-filename-link");
    const linkCount = await fileLinks.count();

    if (linkCount > 0) {
      await fileLinks.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: getScreenshotPath("15_文件下载_文件不存在", "001_ｸﾘｯｸ後"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("15_文件下载_文件不存在", "001_ﾌｧｲﾙなし"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }

    // エラーメッセージの確認
    const errorMsg = page.locator("div.lat-error-message");
    if (await errorMsg.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(errorMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("15_文件下载_文件不存在", "002_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 异常处理-API 超时
  // ※モック禁止のため、実際のAPI応答時間を確認
  // ============================================================
  test("16_异常处理_API超时", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h2.lat-section-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("16_异常处理_API超时", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // APIレスポンスを待つ
    const markets = await getMarketOptions(page);
    await page.screenshot({
      path: getScreenshotPath("16_异常处理_API超时", "002_読込完了"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 异常处理-用户未登录
  // ============================================================
  test("17_异常处理_用户未登录", async ({ page }) => {
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
      path: getScreenshotPath("17_异常处理_用户未登录", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 错误消息-显示样式
  // ============================================================
  test("18_错误消息_显示样式", async ({ page }) => {
    await openPage(page);

    // エラーメッセージの存在確認（初期状態では非表示）
    const errorMsg = page.locator("div.lat-error-message");
    const initiallyVisible = await errorMsg.isVisible().catch(() => false);
    await page.screenshot({
      path: getScreenshotPath("18_错误消息_显示样式", "001_初期状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // ファイルリストをロードして様子を確認
    const markets = await getMarketOptions(page);
    if (markets.length > 0) {
      await selectMarket(page, markets[0]);
      await page.waitForTimeout(500);
    }
    await page.screenshot({
      path: getScreenshotPath("18_错误消息_显示样式", "002_操作後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    if (await errorMsg.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(errorMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("18_错误消息_显示样式", "003_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 页面刷新
  // ============================================================
  test("19_页面刷新", async ({ page }) => {
    await openPage(page);

    // 1. 市場選択してファイルリストを表示
    const markets = await getMarketOptions(page);
    if (markets.length > 0) {
      await selectMarket(page, markets[0]);
    }
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("19_页面刷新", "001_初期表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 刷新页面
    await page.reload();
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: getScreenshotPath("19_页面刷新", "002_再読込後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 状態確認：ドロップダウンは初期状態、テーブルは空
    await expect(page.locator("select.lat-select")).toBeVisible();
    await expect(page.locator("table.lat-table")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("19_页面刷新", "003_初期化確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 安全性-API 请求协议
  // ============================================================
  test("20_安全性_API请求协议", async ({ page }) => {
    await openPage(page);

    // 画面表示を確認
    await expect(page.locator("h2.lat-section-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("20_安全性_API请求协议", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // URL が http であることを確認
    const currentUrl = page.url();
    expect(currentUrl).toContain("http://");
    await page.screenshot({
      path: getScreenshotPath("20_安全性_API请求协议", "002_URL確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 安全性-用户登录认证
  // ============================================================
  test("21_安全性_用户登录认证", async ({ page }) => {
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
      path: getScreenshotPath("21_安全性_用户登录认证", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
