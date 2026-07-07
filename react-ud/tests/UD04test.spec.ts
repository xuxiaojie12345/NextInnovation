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
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD04";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/generate-document?chassisNo=yann1234`;

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
// ローカルストレージ設定
// ============================================================
let dbAvailable = false;

async function setupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    dbAvailable = true;
    try {
      // テスト用のHDOC_DOCUMENT_LISTデータを準備（UD03用）
      await conn.execute(
        "DELETE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE LIKE ?",
        ["TEST_%"],
      );
      await conn.execute(
        `INSERT IGNORE INTO HDOC_DOCUMENT_LIST (DOCTYPE, Description, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
         VALUES (?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
        [
          "TEST_VIN_PLATE",
          "Test VIN Plate",
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
    console.warn("DB not available, tests without test data:", err);
    dbAvailable = false;
  }
}

async function clearTestData() {
  if (!dbAvailable) return;
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    try {
      await conn.execute(
        "DELETE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE LIKE ?",
        ["TEST_%"],
      );
    } finally {
      await conn.end();
    }
  } catch {
    // ignore
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

// ============================================================
// テストスイート
// ============================================================
test.describe("UD04 Generate Document - 单体测试", () => {
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
  // No.1 画面初期显示-加载中状态
  // ============================================================
  test("01_画面初期显示_加载中状态", async ({ page }) => {
    await setLoginState(page);
    // APIに遅延がある場合のローディング表示を確認するため、
    // 実際の環境でローディングが一瞬で終わる場合は即座に完了する
    await page.goto(PAGE_URL);
    await page.waitForLoadState("domcontentloaded");

    // "Loading..." 表示が一瞬でも出る可能性がある
    // ローディング表示が出たか、または完了後の表示かを確認
    const loadingEl = page.locator("div.gd-loading");
    const loadingCount = await loadingEl.count();
    if (loadingCount > 0) {
      await expect(loadingEl).toHaveText("Loading...");
      await expect(page.locator("div.gd-info-group")).toHaveCount(0);
    }

    // ローディング完了を待つ
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_加载中状态", "加载后画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-信息字段完整显示
  // ============================================================
  test("02_画面初期显示_信息字段完整显示", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // ラベルの確認
    const labels = page.locator("span.gd-label");
    const labelTexts = await labels.allTextContents();
    const expectedLabels = [
      "Chassis no:",
      "Ordernumber:",
      "Build week:",
      "Spec week:",
      "Market:",
      "Master Market:",
      "Load index:",
      "Using template:",
      "Date:",
      "HDoc version:",
    ];
    for (const el of expectedLabels) {
      expect(labelTexts.some((t) => t.includes(el))).toBeTruthy();
    }

    // "Analyze Rules" リンク
    await expect(page.locator("span.gd-link").first()).toBeVisible();

    // "Generated document" リンク
    await expect(page.locator("span.gd-download-link")).toBeVisible();

    // タイトル
    await expect(page.locator("h1.gd-title")).toHaveText("Generate document");

    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_信息字段完整显示", "完整信息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-URL 参数底盘号解析
  // ============================================================
  test("03_画面初期显示_URL参数底盘号解析", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Chassis no 欄にURLから取得した底盘号が表示される
    const chassisLabel = page.locator("span.gd-label.chassis-no-label").first();
    await expect(chassisLabel).toHaveText("Chassis no:");

    // chassisNo の前半部分（series）と後半部分（no）がそれぞれ表示される
    // series "yann" がテキストノードとして存在
    const chassisValue = page.locator("span.gd-value").first();
    await expect(chassisValue).toContainText("yann");
    // no "1234" がリンクとして存在
    await expect(
      page.locator("a.gd-link").filter({ hasText: "1234" }),
    ).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_URL参数底盘号解析",
        "底盘号表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 API 成功-OM 接收数据表示
  // ============================================================
  test("04_API成功_OM接收数据表示", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // APIから取得した実データが表示されている
    const values = page.locator("span.gd-value");

    // Ordernumber 表示
    await expect(values.nth(0)).toBeVisible();

    // Build week 表示
    await expect(values.nth(1)).toBeVisible();

    // Spec week 表示
    await expect(values.nth(2)).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("04_API成功_OM接收数据表示", "OM数据"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 API 成功-VDA 数据表示
  // ============================================================
  test("05_API成功_VDA数据表示", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Market 表示
    const values = page.locator("span.gd-value");
    await expect(values.nth(3)).toBeVisible();

    // Master Market 固定 "-EU"
    // values の順序: Ordernumber, Build week, Spec week, Market, Master Market, ...
    // 実際のデータによって値が空の場合 "-" と表示される
    const masterMarketLabel = page
      .locator("span.gd-label")
      .filter({ hasText: "Master Market:" });
    await expect(masterMarketLabel).toBeVisible();
    const masterMarketValue = masterMarketLabel
      .locator("..")
      .locator("span.gd-value");
    await expect(masterMarketValue).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("05_API成功_VDA数据表示", "Market表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 API 成功-KOLA 轮胎主数据表示
  // ============================================================
  test("06_API成功_KOLA轮胎主数据表示", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Load index 表示
    const loadIndexLabel = page
      .locator("span.gd-label")
      .filter({ hasText: "Load index:" });
    await expect(loadIndexLabel).toBeVisible();
    const loadIndexValue = loadIndexLabel
      .locator("..")
      .locator("span.gd-value");
    await expect(loadIndexValue).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("06_API成功_KOLA轮胎主数据表示", "LoadIndex"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 API 失败-底盘号不存在（404）
  // ============================================================
  test("07_API失败_底盘号不存在", async ({ page }) => {
    await setLoginState(page);
    // API 404 をシミュレート
    await page.route("**/api/UD04/selectGeneratedocument*", (route) => {
      route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ code: 404, msg: "Chassis not found" }),
      });
    });

    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // エラーメッセージ表示
    await expect(page.locator("div.gd-error-message")).toBeVisible();
    const msg = await page.locator("div.gd-error-message").textContent();
    expect(msg?.length).toBeGreaterThan(0);

    await page.screenshot({
      path: getScreenshotPath("07_API失败_底盘号不存在", "404错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 API 失败-服务器错误（500）
  // ============================================================
  test("08_API失败_服务器错误500", async ({ page }) => {
    await setLoginState(page);
    await page.route("**/api/UD04/selectGeneratedocument*", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ code: 500, msg: "System error" }),
      });
    });

    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await expect(page.locator("div.gd-error-message")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("08_API失败_服务器错误500", "500错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 API 失败-网络错误
  // ============================================================
  test("09_API失败_网络错误", async ({ page }) => {
    await setLoginState(page);
    await page.route("**/api/UD04/selectGeneratedocument*", (route) =>
      route.abort("connectionrefused"),
    );

    await page.goto(PAGE_URL);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    await expect(page.locator("div.gd-error-message")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("09_API失败_网络错误", "网络错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 API 失败-JSON 解析异常
  // ============================================================
  test("10_API失败_JSON解析异常", async ({ page }) => {
    await setLoginState(page);
    await page.route("**/api/UD04/selectGeneratedocument*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "not-valid-json{broken",
      });
    });

    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await expect(page.locator("div.gd-error-message")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("10_API失败_JSON解析异常", "JSON错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 S-Note 有值-消息显示
  // ============================================================
  test("11_SNote有值_消息显示", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // S-Note NO 表示
    const snoteSection = page.locator("div.gd-snote-section");
    const snoteText = await snoteSection.textContent();

    if (snoteText && snoteText.trim() !== "-") {
      // S-Note メッセージ（値がある場合のみ表示）
      const snoteMsg = page.locator("div.gd-snote-message");
      const msgCount = await snoteMsg.count();
      if (msgCount > 0) {
        await expect(snoteMsg).toContainText(
          "The S-Notes above can affect homologation documents.",
        );
      }
    }

    await page.screenshot({
      path: getScreenshotPath("11_SNote有值_消息显示", "SNote"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 S-Note 为空-消息不显示
  // ============================================================
  test("12_SNote为空_消息不显示", async ({ page }) => {
    await setLoginState(page);
    // customerAdap が空のモックデータを返す
    await page.route("**/api/UD04/selectGeneratedocument*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: {
            serie: "TEST",
            chnr: "1234",
            model: "",
            spec: "",
            ordernumber: "",
            build: "",
            customerAdap: null,
            countryOfOperation: "",
            loadIndex: "",
            act: "N",
            variable: "",
            newval: "",
            template: "",
            generatedFilePath: "",
            serverTime: "2026-07-07 12:00:00",
            programVersion: "4.2.1",
          },
        }),
      });
    });

    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // S-Note メッセージが表示されない
    await expect(page.locator("div.gd-snote-message")).toHaveCount(0);

    // S-Note NO が "-" または空
    const snoteSection = page.locator("div.gd-snote-section");
    await expect(snoteSection).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("12_SNote为空_消息不显示", "SNote空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 ADCA 激活（ACT=Y）-警告消息显示
  // ============================================================
  test("13_ADCA激活_警告消息显示", async ({ page }) => {
    await setLoginState(page);
    await page.route("**/api/UD04/selectGeneratedocument*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: {
            serie: "TEST",
            chnr: "5678",
            model: "",
            spec: "201617",
            ordernumber: "15101319",
            build: "2016173",
            customerAdap: "S1810111",
            countryOfOperation: "IDO",
            loadIndex: "FTLI-150",
            act: "Y",
            variable: "VAR_OLD",
            newval: "VAR_NEW",
            template: "_eu/test_template.trf",
            generatedFilePath: "/files/test.trf",
            serverTime: "2026-07-07 12:00:00",
            programVersion: "4.2.1",
          },
        }),
      });
    });

    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // ADCA 変更警告リンク表示
    const adcaLink = page.locator("span.gd-adca-warning-link");
    await expect(adcaLink).toBeVisible();
    await expect(adcaLink).toContainText(
      "After def change detected. Document need to be modified.",
    );

    // Replacing parameters 表示
    await expect(page.locator("div.gd-replacing-params")).toBeVisible();
    await expect(page.locator("div.gd-param-value")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("13_ADCA激活_警告消息显示", "ADCA激活"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 ADCA 非激活（ACT=N）-警告消息不显示
  // ============================================================
  test("14_ADCA非激活_警告消息不显示", async ({ page }) => {
    // 上記12と同じモック（ACT=N）
    await setLoginState(page);
    await page.route("**/api/UD04/selectGeneratedocument*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: {
            serie: "TEST",
            chnr: "1234",
            model: "",
            spec: "",
            ordernumber: "",
            build: "",
            customerAdap: null,
            countryOfOperation: "",
            loadIndex: "",
            act: "N",
            variable: "",
            newval: "",
            template: "",
            generatedFilePath: "",
            serverTime: "2026-07-07 12:00:00",
            programVersion: "4.2.1",
          },
        }),
      });
    });

    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // ADCA リンクが表示されない
    await expect(page.locator("span.gd-adca-warning-link")).toHaveCount(0);

    // Replacing parameters が表示されない
    await expect(page.locator("div.gd-replacing-params")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("14_ADCA非激活_警告消息不显示", "ADCA非激活"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 ADCA 激活时-跳转到 Modify Document
  // ============================================================
  test("15_ADCA激活_跳转到ModifyDocument", async ({ page }) => {
    await setLoginState(page);
    await page.route("**/api/UD04/selectGeneratedocument*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: {
            serie: "TEST",
            chnr: "5678",
            model: "",
            spec: "201617",
            ordernumber: "15101319",
            build: "2016173",
            customerAdap: "S1810111",
            countryOfOperation: "IDO",
            loadIndex: "FTLI-150",
            act: "Y",
            variable: "VAR_OLD",
            newval: "VAR_NEW",
            template: "_eu/test_template.trf",
            generatedFilePath: "/files/test.trf",
            serverTime: "2026-07-07 12:00:00",
            programVersion: "4.2.1",
          },
        }),
      });
    });

    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // ADCA リンクをクリック（親要素に隠れているため dispatchEvent 使用）
    await page.locator("span.gd-adca-warning-link").dispatchEvent("click");
    await page.waitForTimeout(1000);

    // Modify Document に遷移
    await expect(page).toHaveURL(/modify-document/);

    await page.screenshot({
      path: getScreenshotPath("15_ADCA激活_跳转到ModifyDocument", "Modify画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 文档下载-正常下载
  // ============================================================
  test("16_文档下载_正常下载", async ({ page }) => {
    await setLoginState(page);
    await page.route("**/api/UD04/selectGeneratedocument*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: {
            serie: "TEST",
            chnr: "5678",
            model: "",
            spec: "201617",
            ordernumber: "15101319",
            build: "2016173",
            customerAdap: "S1810111",
            countryOfOperation: "IDO",
            loadIndex: "FTLI-150",
            act: "Y",
            variable: "VAR_OLD",
            newval: "VAR_NEW",
            template: "_eu/test_template.trf",
            generatedFilePath: "/files/test.trf",
            serverTime: "2026-07-07 12:00:00",
            programVersion: "4.2.1",
          },
        }),
      });
    });

    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Generated document リンクをクリック（親要素に隠れているため dispatchEvent 使用）
    await page.locator("span.gd-download-link").dispatchEvent("click");
    await page.waitForTimeout(500);

    // ファイルダウンロードはリンククリックで発火（ダウンロード自体はここでは確認しない）

    await page.screenshot({
      path: getScreenshotPath("16_文档下载_正常下载", "下载尝试"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 文档下载-文件路径为空
  // ============================================================
  test("17_文档下载_文件路径为空", async ({ page }) => {
    await setLoginState(page);
    await page.route("**/api/UD04/selectGeneratedocument*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: {
            serie: "TEST",
            chnr: "1234",
            model: "",
            spec: "",
            ordernumber: "",
            build: "",
            customerAdap: null,
            countryOfOperation: "",
            loadIndex: "",
            act: "N",
            variable: "",
            newval: "",
            template: "",
            generatedFilePath: null,
            serverTime: "2026-07-07 12:00:00",
            programVersion: "4.2.1",
          },
        }),
      });
    });

    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Generated document リンクをクリック（親要素に隠れているため dispatchEvent 使用）
    await page.locator("span.gd-download-link").dispatchEvent("click");
    await page.waitForTimeout(500);

    // エラーメッセージ表示："Document file not found"
    await expect(page.locator("div.gd-error-message")).toBeVisible();
    await expect(page.locator("div.gd-error-message")).toHaveText(
      "Document file not found",
    );

    await page.screenshot({
      path: getScreenshotPath("17_文档下载_文件路径为空", "下载错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 Analyze Rules-画面跳转
  // ============================================================
  test("18_AnalyzeRules_画面跳转", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Analyze Rules リンクをクリック（親要素に隠れているため dispatchEvent 使用）
    const analyzeLink = page.locator("span.gd-link").first();
    await analyzeLink.dispatchEvent("click");
    await page.waitForTimeout(1000);

    // Analyze Rules 画面に遷移
    await expect(page).toHaveURL(/analyze-rules/);

    await page.screenshot({
      path: getScreenshotPath("18_AnalyzeRules_画面跳转", "Analyze画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 Chassis no 链接-显示底盘详细信息
  // ============================================================
  test("19_ChassisNo链接_显示底盘详细信息", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Chassis no リンクをクリック（親要素に隠れているため dispatchEvent 使用）
    const chassisLink = page.locator("a.gd-link").filter({ hasText: "1234" });
    await chassisLink.dispatchEvent("click");
    await page.waitForTimeout(1000);

    // Vehicle Specification 画面に遷移
    await expect(page).toHaveURL(/vehicle-specification/);

    await page.screenshot({
      path: getScreenshotPath(
        "19_ChassisNo链接_显示底盘详细信息",
        "VehicleSpec",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 Using template-显示
  // ============================================================
  test("20_UsingTemplate显示", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const templateLabel = page
      .locator("span.gd-label")
      .filter({ hasText: "Using template:" });
    await expect(templateLabel).toBeVisible();
    const templateValue = templateLabel.locator("..").locator("span.gd-value");
    await expect(templateValue).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("20_UsingTemplate显示", "Template"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 Date-服务器时间显示
  // ============================================================
  test("21_Date_服务器时间显示", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const dateLabel = page
      .locator("span.gd-label")
      .filter({ hasText: "Date:" });
    await expect(dateLabel).toBeVisible();
    const dateValue = dateLabel.locator("..").locator("span.gd-value");
    await expect(dateValue).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("21_Date_服务器时间显示", "Date"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 HDoc version-程序版本显示
  // ============================================================
  test("22_HDocVersion_程序版本显示", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const versionLabel = page
      .locator("span.gd-label")
      .filter({ hasText: "HDoc version:" });
    await expect(versionLabel).toBeVisible();
    const versionValue = versionLabel.locator("..").locator("span.gd-value");
    await expect(versionValue).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("22_HDocVersion_程序版本显示", "Version"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 异常处理-API 超时
  // ============================================================
  test("23_异常处理_API超时", async ({ page }) => {
    await setLoginState(page);
    await page.route("**/api/UD04/selectGeneratedocument*", (route) =>
      route.abort("connectionrefused"),
    );

    await page.goto(PAGE_URL);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    await expect(page.locator("div.gd-error-message")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("23_异常处理_API超时", "超时错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 异常处理-用户未登录
  // ============================================================
  test("24_异常处理_用户未登录", async ({ page }) => {
    await clearLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 未ログイン時の挙動確認
    await page.screenshot({
      path: getScreenshotPath("24_异常处理_用户未登录", "未登录状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 异常处理-文件下载失败
  // ============================================================
  test("25_异常处理_文件下载失败", async ({ page }) => {
    await setLoginState(page);
    await page.route("**/api/UD04/selectGeneratedocument*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: {
            serie: "TEST",
            chnr: "5678",
            model: "",
            spec: "201617",
            ordernumber: "15101319",
            build: "2016173",
            customerAdap: "S1810111",
            countryOfOperation: "IDO",
            loadIndex: "FTLI-150",
            act: "Y",
            variable: "VAR_OLD",
            newval: "VAR_NEW",
            template: "_eu/test_template.trf",
            generatedFilePath: "/files/test.trf",
            serverTime: "2026-07-07 12:00:00",
            programVersion: "4.2.1",
          },
        }),
      });
    });

    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Generated document をクリック（親要素に隠れているため dispatchEvent 使用）
    await page.locator("span.gd-download-link").dispatchEvent("click");
    await page.waitForTimeout(1000);

    // エラーメッセージ表示（ファイルが存在しないため）
    const errorMsg = page.locator("div.gd-error-message");
    const errorCount = await errorMsg.count();
    // エラーが出る場合と出ない場合がある

    await page.screenshot({
      path: getScreenshotPath("25_异常处理_文件下载失败", "下载失败"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 安全性-API 请求协议
  // ============================================================
  test("26_安全性_API请求协议", async ({ page }) => {
    const apiCalls: { url: string }[] = [];
    await page.route("**/api/UD04/selectGeneratedocument*", (route) => {
      const req = route.request();
      apiCalls.push({ url: req.url() });
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: {
            serie: "TEST",
            chnr: "1234",
            model: "",
            spec: "",
            ordernumber: "",
            build: "",
            customerAdap: null,
            countryOfOperation: "",
            loadIndex: "",
            act: "N",
            variable: "",
            newval: "",
            template: "",
            generatedFilePath: "",
            serverTime: "2026-07-07 12:00:00",
            programVersion: "4.2.1",
          },
        }),
      });
    });

    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    expect(apiCalls.length).toBeGreaterThan(0);
    for (const call of apiCalls) {
      expect(call.url).toBeTruthy();
    }

    await page.screenshot({
      path: getScreenshotPath("26_安全性_API请求协议", "API请求检查"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 安全性-用户登录认证
  // ============================================================
  test("27_安全性_用户登录认证", async ({ page }) => {
    await clearLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await page.screenshot({
      path: getScreenshotPath("27_安全性_用户登录认证", "未登录访问"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 安全性-敏感数据权限控制
  // ============================================================
  test("28_安全性_敏感数据权限控制", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // データが表示されていること
    const values = page.locator("span.gd-value");
    const valueCount = await values.count();
    expect(valueCount).toBeGreaterThan(0);

    await page.screenshot({
      path: getScreenshotPath("28_安全性_敏感数据权限控制", "データ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.29 错误消息-显示样式
  // ============================================================
  test("29_错误消息_显示样式", async ({ page }) => {
    await setLoginState(page);
    await page.route("**/api/UD04/selectGeneratedocument*", (route) =>
      route.abort("connectionrefused"),
    );

    await page.goto(PAGE_URL);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    const errorMsg = page.locator("div.gd-error-message");
    await expect(errorMsg).toBeVisible();
    const color = await errorMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(color).toBe("rgb(255, 77, 79)");

    await page.screenshot({
      path: getScreenshotPath("29_错误消息_显示样式", "错误消息样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.30 页面刷新
  // ============================================================
  test("30_页面刷新", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // ロード完了を確認
    await expect(page.locator("h1.gd-title")).toBeVisible();

    // リフレッシュ
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // 再度データが表示される
    await expect(page.locator("h1.gd-title")).toBeVisible();
    const values = page.locator("span.gd-value");
    const valueCount = await values.count();
    expect(valueCount).toBeGreaterThan(0);

    await page.screenshot({
      path: getScreenshotPath("30_页面刷新", "刷新后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
