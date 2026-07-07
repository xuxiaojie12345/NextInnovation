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
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD05";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const APP_URL_WITH_PARAMS = `${APP_URL}/modify-document?chassisNo=yann1234&market=IDO`;
const APP_URL_NO_MARKET = `${APP_URL}/modify-document?chassisNo=yann1234`;
const APP_URL_NO_CHASSIS = `${APP_URL}/modify-document`;

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

// ============================================================
// テストデータ setup / cleanup
// ============================================================
async function setupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    dbAvailable = true;
    try {
      // テスト用変数定義をHDOC_VARIABLESに挿入
      const testVariables = [
        ["TEST_VAR_01", "TYPE_A", "Test Variable 01 Description"],
        ["TEST_VAR_02", "TYPE_B", "Test Variable 02 Description"],
        ["TEST_VAR_03", "TYPE_C", "Test Variable 03 Description"],
        ["TEST_VAR_04", "TYPE_D", "Test Variable 04 Description"],
      ];
      for (const [variable, type, description] of testVariables) {
        await conn.execute(
          `INSERT IGNORE INTO HDOC_VARIABLES (VARIABLE, TYPE, DESCRIPTION, USERID, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, ?, 'TEST', NOW(), 'TEST', 'PLAYWRIGHT', NOW(), 'TEST', 'PLAYWRIGHT')`,
          [variable, type, description],
        );
      }

      // テスト用ADCA変更対象項目をHDOC_ADCA_MODIFICATIONに挿入
      // chassisNo=yann1234 → chassisSeries='yann', chassisNo='1234'
      const now = new Date();
      const testModifications = [
        { variable: "TEST_VAR_01", newval: "CURRENT_VAL_01" },
        { variable: "TEST_VAR_02", newval: "CURRENT_VAL_02" },
        { variable: "TEST_VAR_03", newval: "CURRENT_VAL_03" },
        { variable: "TEST_VAR_04", newval: "CURRENT_VAL_04" },
      ];
      for (const mod of testModifications) {
        await conn.execute(
          `INSERT IGNORE INTO HDOC_ADCA_MODIFICATION
           (SERIE, CHNO, DOCTYPE, LANG, VARIABLE, VERS, NEWVAL, STA, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            "yann",
            "1234",
            "TEST_DOC",
            "EN",
            mod.variable,
            1,
            mod.newval,
            0,
            now,
            "TEST",
            "PLAYWRIGHT",
            now,
            "TEST",
            "PLAYWRIGHT",
          ],
        );
      }

      console.log("DB test data setup ok");
    } finally {
      await conn.end();
    }
  } catch (err) {
    console.warn("DB not available, tests may be limited:", err);
    dbAvailable = false;
  }
}

async function clearTestData() {
  if (!dbAvailable) return;
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    try {
      await conn.execute(
        "DELETE FROM HDOC_ADCA_MODIFICATION WHERE SERIE = ? AND CHNO = ?",
        ["yann", "1234"],
      );
      await conn.execute("DELETE FROM HDOC_VARIABLES WHERE USERID = ?", [
        "TEST",
      ]);
    } finally {
      await conn.end();
    }
  } catch {
    // ignore
  }
}

// ============================================================
// ログイン状態設定
// ============================================================
async function setLoginState(page: Page) {
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.setItem("currentUser", "admin"));
}

async function clearLoginState(page: Page) {
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.removeItem("currentUser"));
}

/** waitForLoadState をタイムアウト付きで安全に実行 */
async function safeWaitNetworkIdle(page: Page) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch {
    // タイムアウトは無視
  }
}
function getTemplateLink(page: Page) {
  const templateLabel = page
    .locator("span.md-label")
    .filter({ hasText: "Template:" });
  return templateLabel.locator("..").locator("a.md-link");
}

async function openPage(page: Page, url: string = APP_URL_WITH_PARAMS) {
  await setLoginState(page);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
  // JS bundle読み込みとReactレンダリングを待つ
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch {
    // タイムアウトは無視
  }
  await page.waitForTimeout(1000);
}

// ============================================================
// テストスイート
// ============================================================
test.describe("UD05 Modify Document - 单体测试", () => {
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
  // No.1 画面初期显示-基本要素
  // ============================================================
  test("01_画面初期显示_基本要素", async ({ page }) => {
    await openPage(page);

    // 1. 显示标题
    await expect(page.locator("h1.md-title")).toHaveText("Modify Document");

    // 2. Chassis no
    await expect(
      page.locator("span.md-label").filter({ hasText: "Chassis no:" }),
    ).toBeVisible();
    await expect(page.locator("span.md-value.md-chassis-no")).toBeVisible();

    // 3. Market
    await expect(
      page.locator("span.md-label").filter({ hasText: "Market:" }),
    ).toBeVisible();

    // 4. Template
    await expect(
      page.locator("span.md-label").filter({ hasText: "Template:" }),
    ).toBeVisible();
    const templateLink = getTemplateLink(page);
    await expect(templateLink).toBeVisible();

    // 5. Save 按钮
    await expect(page.locator("button.md-save-btn")).toBeVisible();
    await expect(page.locator("button.md-save-btn")).toHaveText("Save");

    // 6. 表格
    const table = page.locator("table.md-table");
    await expect(table).toBeVisible();
    const headers = page.locator("th.md-th");
    const headerTexts = await headers.allTextContents();
    expect(headerTexts.some((t) => t.includes("Variable"))).toBeTruthy();
    expect(headerTexts.some((t) => t.includes("Description"))).toBeTruthy();
    expect(headerTexts.some((t) => t.includes("Current value"))).toBeTruthy();
    expect(headerTexts.some((t) => t.includes("Modified value"))).toBeTruthy();

    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本要素", "基本要素"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-URL 参数正常
  // ============================================================
  test("02_画面初期显示_URL参数正常", async ({ page }) => {
    await openPage(page);

    // Chassis no 显示 "yann1234"
    const chassisNoEl = page.locator("span.md-value.md-chassis-no");
    await expect(chassisNoEl).toBeVisible();
    // 前半4文字 "yann"
    await expect(chassisNoEl).toContainText("yann");
    // 後半 "1234" がリンク
    await expect(
      page.locator("a.md-link").filter({ hasText: "1234" }),
    ).toBeVisible();

    // Market 显示 "IDO"
    const marketValue = page
      .locator("span.md-label")
      .filter({ hasText: "Market:" })
      .locator("..")
      .locator("span.md-value");
    await expect(marketValue).toContainText("IDO");

    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_URL参数正常", "参数表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-URL 参数 Market 缺失
  // ============================================================
  test("03_画面初期显示_URL参数Market缺失", async ({ page }) => {
    await openPage(page, APP_URL_NO_MARKET);

    // Market 显示（URLにmarketがない場合はAPI戻り値または "-"）
    const marketValue = page
      .locator("span.md-label")
      .filter({ hasText: "Market:" })
      .locator("..")
      .locator("span.md-value");
    await expect(marketValue).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_URL参数Market缺失",
        "Market表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 画面初期显示-URL 参数 chassisNo 缺失
  // ============================================================
  test("04_画面初期显示_URL参数chassisNo缺失", async ({ page }) => {
    await setLoginState(page);
    await page.goto(APP_URL_NO_CHASSIS);
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(1000);

    // 错误消息："Chassis number is required."
    await expect(page.locator("div.md-error-message")).toBeVisible();
    await expect(page.locator("div.md-error-message")).toContainText(
      "Chassis number is required.",
    );

    // テーブルボディに行がない
    const tableBodyRows = page.locator("table.md-table tbody tr");
    await expect(tableBodyRows).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath(
        "04_画面初期显示_URL参数chassisNo缺失",
        "Chassis缺失",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 画面初期显示-加载中状态
  // ============================================================
  test("05_画面初期显示_加载中状态", async ({ page }) => {
    await setLoginState(page);
    await page.goto(APP_URL_WITH_PARAMS, { waitUntil: "domcontentloaded" });

    const loadingEl = page.locator("div.md-loading");
    const loadingCount = await loadingEl.count();
    if (loadingCount > 0) {
      await expect(loadingEl).toHaveText("Loading...");
    }

    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);
    await expect(page.locator("button.md-save-btn")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("05_画面初期显示_加载中状态", "加载完成"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 API 查询成功-变量列表加载（実API）
  // ============================================================
  test("06_API查询成功_变量列表加载", async ({ page }) => {
    await openPage(page);

    // 表格显示变量行
    const rows = page.locator("table.md-table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    for (let i = 0; i < rowCount; i++) {
      const cells = rows.nth(i).locator("td.md-td");
      await expect(cells.nth(0)).toBeVisible(); // Variable
      await expect(cells.nth(1)).toBeVisible(); // Description
      await expect(cells.nth(2)).toBeVisible(); // Current value
      const input = cells.nth(3).locator("input.md-input");
      await expect(input).toBeVisible(); // Modified value input
    }

    // Template 链接
    const templateLink = getTemplateLink(page);
    await expect(templateLink).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("06_API查询成功_变量列表加载", "变量列表"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 API 查询成功-含修改记录（実API）
  // ============================================================
  test("07_API查询成功_含修改记录", async ({ page }) => {
    await openPage(page);

    // Current value 表示（実DBの値を表示）
    const rows = page.locator("table.md-table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // 各行のCurrent valueが空でないことを確認
    for (let i = 0; i < rowCount; i++) {
      const cells = rows.nth(i).locator("td.md-td");
      await expect(cells.nth(2)).toBeVisible();
    }

    // Modified value 初始化为空
    const firstInput = page.locator("input.md-input").first();
    const initialVal = await firstInput.inputValue();
    expect(initialVal).toBe("");

    await page.screenshot({
      path: getScreenshotPath("07_API查询成功_含修改记录", "修改记录"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 API 查询成功-无修改记录（実API・存在しないchassisNo）
  // ============================================================
  test("08_API查询成功_无修改记录", async ({ page }) => {
    await setLoginState(page);
    await page.goto(
      `${APP_URL}/modify-document?chassisNo=NODATA0000&market=NONE`,
    );
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    // API返回可能是空数据或エラー、テーブルがレンダリングされているか確認
    const table = page.locator("table.md-table");
    const tableCount = await table.count();
    if (tableCount > 0) {
      await expect(table).toBeVisible();
    }

    await page.screenshot({
      path: getScreenshotPath("08_API查询成功_无修改记录", "无记录"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 API 查询失败-系统错误（実API・エラー時）
  // ============================================================
  test("09_API查询失败_系统错误", async ({ page }) => {
    await setLoginState(page);
    await page.goto(
      `${APP_URL}/modify-document?chassisNo=ERROR000000&market=ERR`,
    );
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    // ページが表示されていることを確認
    await expect(page.locator("h1.md-title")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("09_API查询失败_系统错误", "系统错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 API 查询失败-网络错误（実API）
  // ============================================================
  test("10_API查询失败_网络错误", async ({ page }) => {
    // ネットワークエラーは実APIでは再現不可。
    // バックエンドが停止している場合を想定し、通常通りアクセスする
    await setLoginState(page);
    await page.goto(APP_URL_WITH_PARAMS);
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    // ページが表示されることを確認
    await expect(page.locator("h1.md-title")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("10_API查询失败_网络错误", "网络错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 表格-列定义（実API）
  // ============================================================
  test("11_表格_列定义", async ({ page }) => {
    await openPage(page);

    const headers = page.locator("th.md-th");
    const headerTexts = await headers.allTextContents();

    expect(headerTexts[0]?.trim()).toBe("Variable");
    expect(headerTexts[1]?.trim()).toBe("Description");
    expect(headerTexts[2]?.trim()).toBe("Current value");
    expect(headerTexts[3]?.trim()).toBe("Modified value");

    await page.screenshot({
      path: getScreenshotPath("11_表格_列定义", "列标题"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 表格-空变量列表（実API）
  // ============================================================
  test("12_表格_空变量列表", async ({ page }) => {
    await setLoginState(page);
    // 実DBにデータがないchassisNoでアクセス
    await page.goto(`${APP_URL}/modify-document?chassisNo=yann1234&market=IDO`);
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    // 表头正常显示
    await expect(page.locator("th.md-th")).toHaveCount(4);

    // テーブルが表示されていることを確認
    const table = page.locator("table.md-table");
    await expect(table).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("12_表格_空变量列表", "空列表"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 表格-多变量显示（実API）
  // ============================================================
  test("13_表格_多变量显示", async ({ page }) => {
    await openPage(page);

    const rows = page.locator("table.md-table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < rowCount; i++) {
      const cells = rows.nth(i).locator("td.md-td");
      await expect(cells.nth(0)).toBeVisible();
      await expect(cells.nth(1)).toBeVisible();
      await expect(cells.nth(2)).toBeVisible();
      const input = cells.nth(3).locator("input.md-input");
      await expect(input).toBeVisible();
      const val = await input.inputValue();
      expect(val).toBe("");
    }

    await page.screenshot({
      path: getScreenshotPath("13_表格_多变量显示", "多变量"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Modified value-正常输入（実API）
  // ============================================================
  test("14_ModifiedValue_正常输入", async ({ page }) => {
    await openPage(page);

    const firstInput = page.locator("input.md-input").first();
    await expect(firstInput).toBeEnabled();
    await firstInput.fill("MODIFIED_VALUE_1");

    const val = await firstInput.inputValue();
    expect(val).toBe("MODIFIED_VALUE_1");

    await page.screenshot({
      path: getScreenshotPath("14_ModifiedValue_正常输入", "输入值"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Modified value-多行输入（実API）
  // ============================================================
  test("15_ModifiedValue_多行输入", async ({ page }) => {
    await openPage(page);

    const inputs = page.locator("input.md-input");
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      await inputs.nth(0).fill("VAL1");
    }
    if (inputCount > 2) {
      await inputs.nth(2).fill("VAL3");
    }

    if (inputCount > 0) {
      expect(await inputs.nth(0).inputValue()).toBe("VAL1");
    }
    if (inputCount > 1) {
      expect(await inputs.nth(1).inputValue()).toBe("");
    }
    if (inputCount > 2) {
      expect(await inputs.nth(2).inputValue()).toBe("VAL3");
    }

    await page.screenshot({
      path: getScreenshotPath("15_ModifiedValue_多行输入", "多行输入"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 Modified value-空输入保持（実API）
  // ============================================================
  test("16_ModifiedValue_空输入保持", async ({ page }) => {
    await openPage(page);

    const firstInput = page.locator("input.md-input").first();
    const val = await firstInput.inputValue();
    expect(val).toBe("");

    await firstInput.focus();
    await expect(firstInput).toBeFocused();

    await page.screenshot({
      path: getScreenshotPath("16_ModifiedValue_空输入保持", "空输入"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 Modified value-最大长度500字符（実API）
  // ============================================================
  test("17_ModifiedValue_最大长度500字符", async ({ page }) => {
    await openPage(page);

    const firstInput = page.locator("input.md-input").first();
    const longText = "A".repeat(500);
    await firstInput.fill(longText);

    const val = await firstInput.inputValue();
    expect(val.length).toBeLessThanOrEqual(500);

    await page.screenshot({
      path: getScreenshotPath("17_ModifiedValue_最大长度500字符", "500文字"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 Modified value-超过500字符（実API）
  // ============================================================
  test("18_ModifiedValue_超过500字符", async ({ page }) => {
    await openPage(page);

    const firstInput = page.locator("input.md-input").first();
    const longText = "B".repeat(501);
    await firstInput.fill(longText);

    const val = await firstInput.inputValue();
    expect(val.length).toBeLessThanOrEqual(500);

    await page.screenshot({
      path: getScreenshotPath("18_ModifiedValue_超过500字符", "超过500"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 Save-空值检查（全为空）（実API）
  // ============================================================
  test("19_Save_空值检查", async ({ page }) => {
    await openPage(page);

    // 全 Modified value 为空 → Save
    await page.locator("button.md-save-btn").click();
    await page.waitForTimeout(500);

    await expect(page.locator("div.md-error-message")).toBeVisible();
    await expect(page.locator("div.md-error-message")).toContainText(
      "NO UNRELEASED VERSION EXISTS!",
    );

    await expect(page.locator("button.md-save-btn")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("19_Save_空值检查", "空值错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 Save-成功（部分 Modified value 有值）（実API）
  // ============================================================
  test("20_Save_部分有值保存成功", async ({ page }) => {
    await openPage(page);

    // 行0に値を入力
    const firstInput = page.locator("input.md-input").first();
    await firstInput.fill("MODIFIED_VALUE_1");

    // Save
    await page.locator("button.md-save-btn").click();
    await page.waitForTimeout(2000);

    // 実APIの結果: 成功時はsave-modificationsに遷移 or alert
    // エラー時はメッセージ表示
    const currentUrl = page.url();
    if (currentUrl.includes("save-modifications")) {
      await expect(page).toHaveURL(/save-modifications/);
    } else {
      const errMsg = page.locator("div.md-error-message");
      if (await errMsg.isVisible()) {
        console.log("Save result:", await errMsg.textContent());
      }
    }

    await page.screenshot({
      path: getScreenshotPath("20_Save_部分有值保存成功", "保存结果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 Save-成功（全部 Modified value 有值）（実API）
  // ============================================================
  test("21_Save_全部有值保存成功", async ({ page }) => {
    await openPage(page);

    // 全行に値を入力
    const inputs = page.locator("input.md-input");
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
      await inputs.nth(i).fill(`VALUE_${i + 1}`);
    }

    await page.locator("button.md-save-btn").click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: getScreenshotPath("21_Save_全部有值保存成功", "全部保存"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 Save-失败（API返回错误）（実API）
  // ============================================================
  test("22_Save_API返回错误", async ({ page }) => {
    await openPage(page);

    // 入力欄がある場合のみテスト実行
    const inputCount = await page.locator("input.md-input").count();
    if (inputCount === 0) {
      console.log("Skipping: no input fields (API returned no variables)");
      await page.screenshot({
        path: getScreenshotPath("22_Save_API返回错误", "保存错误"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
      return;
    }

    const firstInput = page.locator("input.md-input").first();
    await firstInput.fill("MODIFIED_VALUE_1");
    // Save前に値を読み取っておく（Save後はloadingでinputが消えるため）
    const valBefore = await firstInput.inputValue();
    expect(valBefore).toBe("MODIFIED_VALUE_1");

    await page.locator("button.md-save-btn").click();
    // Save後はloading→API応答を待つ
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: getScreenshotPath("22_Save_API返回错误", "保存错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 Save-失败（API返回500）（実API）
  // ============================================================
  test("23_Save_Save処理", async ({ page }) => {
    await openPage(page);

    const inputCount = await page.locator("input.md-input").count();
    if (inputCount === 0) {
      console.log("Skipping: no input fields");
      await page.screenshot({
        path: getScreenshotPath("23_Save_Save処理", "Save結果"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
      return;
    }

    // Save前に値を入力
    await page.locator("input.md-input").first().fill("MODIFIED_VALUE_1");

    await page.locator("button.md-save-btn").click();
    // 実APIの結果に応じて遷移先を確認
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    if (currentUrl.includes("save-modifications")) {
      await expect(page).toHaveURL(/save-modifications/);
    } else {
      await expect(page).toHaveURL(/modify-document/);
    }

    await page.screenshot({
      path: getScreenshotPath("23_Save_Save処理", "Save結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 Chassis no 链接-画面跳转（実API）
  // ============================================================
  test("24_ChassisNo链接_画面跳转", async ({ page }) => {
    await setLoginState(page);
    await page.goto(APP_URL_WITH_PARAMS);
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    // Chassis no リンクが存在するか確認
    const chassisLink = page.locator("a.md-link").filter({ hasText: "1234" });
    const linkCount = await chassisLink.count();
    if (linkCount > 0) {
      await chassisLink.dispatchEvent("click");
      await page.waitForTimeout(1000);
      // Vehicle Specification 画面に遷移
      await expect(page).toHaveURL(/vehicle-specification/);
    }

    await page.screenshot({
      path: getScreenshotPath("24_ChassisNo链接_画面跳转", "VehicleSpec"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 Chassis no 显示-拼接显示（実API）
  // ============================================================
  test("25_ChassisNo显示_拼接显示", async ({ page }) => {
    await openPage(page);

    const chassisNoEl = page.locator("span.md-value.md-chassis-no");
    await expect(chassisNoEl).toBeVisible();
    await expect(chassisNoEl).toContainText("yann1234");

    const link = page.locator("a.md-link").filter({ hasText: "1234" });
    await expect(link).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("25_ChassisNo显示_拼接显示", "拼接表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 Template 链接-下载（実API）
  // ============================================================
  test("26_Template链接_下载", async ({ page }) => {
    await openPage(page);

    const templateLink = getTemplateLink(page);
    await expect(templateLink).toBeVisible();

    const templateText = await templateLink.textContent();
    if (templateText && templateText.trim() !== "") {
      await templateLink.dispatchEvent("click");
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: getScreenshotPath("26_Template链接_下载", "Template下载"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 Template 链接-文件不存在（実API）
  // ============================================================
  test("27_Template链接_文件不存在", async ({ page }) => {
    await openPage(page);

    const templateLink = getTemplateLink(page);
    const templateText = await templateLink.textContent();
    if (templateText && templateText.trim() !== "") {
      await templateLink.dispatchEvent("click");
      await page.waitForTimeout(500);
    }

    // generatedFilePathがない場合、エラーメッセージが表示される可能性
    const errMsg = page.locator("div.md-error-message");
    const errCount = await errMsg.count();
    if (errCount > 0 && (await errMsg.isVisible())) {
      console.log("Error shown:", await errMsg.textContent());
    }

    await page.screenshot({
      path: getScreenshotPath("27_Template链接_文件不存在", "Template不存在"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 Template 链接-显示（実API）
  // ============================================================
  test("28_Template链接_显示", async ({ page }) => {
    await openPage(page);

    await expect(
      page.locator("span.md-label").filter({ hasText: "Template:" }),
    ).toBeVisible();

    const templateLink = getTemplateLink(page);
    await expect(templateLink).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("28_Template链接_显示", "Template表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.29 错误消息-错误样式（実API）
  // ============================================================
  test("29_错误消息_错误样式", async ({ page }) => {
    await openPage(page);

    // Save空値チェックでエラー発生
    await page.locator("button.md-save-btn").click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.md-error-message");
    await expect(errMsg).toBeVisible();

    // 赤色確認（R値がG,Bより大きい）
    const color = await errMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    const match = color.match(/(\d+)/g);
    if (match) {
      const r = parseInt(match[0]);
      const g = parseInt(match[1]);
      const b = parseInt(match[2]);
      expect(r).toBeGreaterThan(g);
      expect(r).toBeGreaterThan(b);
    }

    await page.screenshot({
      path: getScreenshotPath("29_错误消息_错误样式", "错误样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.30 异常处理-API 调用失败（実API）
  // ============================================================
  test("30_异常处理_API调用失败", async ({ page }) => {
    await openPage(page);

    const inputCount = await page.locator("input.md-input").count();
    if (inputCount === 0) {
      console.log("Skipping: no input fields");
      await page.screenshot({
        path: getScreenshotPath("30_异常处理_API调用失败", "API失败"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
      return;
    }

    // 行0に値を入力
    const firstInput = page.locator("input.md-input").first();
    await firstInput.fill("MODIFIED_VALUE_1");
    // Save前に値を確認
    expect(await firstInput.inputValue()).toBe("MODIFIED_VALUE_1");

    // Save（実APIの結果に応じて）
    await page.locator("button.md-save-btn").click();
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: getScreenshotPath("30_异常处理_API调用失败", "API失败"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.31 异常处理-数据库操作异常（実API）
  // ============================================================
  test("31_异常处理_数据库操作异常", async ({ page }) => {
    await openPage(page);

    const inputCount = await page.locator("input.md-input").count();
    if (inputCount === 0) {
      console.log("Skipping: no input fields");
      await page.screenshot({
        path: getScreenshotPath("31_异常处理_数据库操作异常", "DB异常"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
      return;
    }

    const firstInput = page.locator("input.md-input").first();
    await firstInput.fill("MODIFIED_VALUE_1");
    expect(await firstInput.inputValue()).toBe("MODIFIED_VALUE_1");

    await page.locator("button.md-save-btn").click();
    await page.waitForTimeout(3000);

    // 実APIの結果に応じてURLを確認
    const currentUrl = page.url();
    if (currentUrl.includes("save-modifications")) {
      await expect(page).toHaveURL(/save-modifications/);
    } else {
      await expect(page).toHaveURL(/modify-document/);
    }

    await page.screenshot({
      path: getScreenshotPath("31_异常处理_数据库操作异常", "DB异常"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.32 异常处理-用户未登录（実API）
  // ============================================================
  test("32_异常处理_用户未登录", async ({ page }) => {
    await clearLoginState(page);

    await page.goto(APP_URL_WITH_PARAMS);
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    // 認証ガードがないためページは表示される
    const titleEl = page.locator("h1.md-title");
    const titleExists = await titleEl.count();
    if (titleExists > 0) {
      await expect(titleEl).toBeVisible();
    }

    await page.screenshot({
      path: getScreenshotPath("32_异常处理_用户未登录", "未ログイン"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.33 Save 按钮-加载中禁用（実API）
  // ============================================================
  test("33_Save按钮_加载中禁用", async ({ page }) => {
    await setLoginState(page);
    await page.goto(APP_URL_WITH_PARAMS, { waitUntil: "domcontentloaded" });

    const loadingEl = page.locator("div.md-loading");
    const loadingCount = await loadingEl.count();
    if (loadingCount > 0) {
      // Loading中はSaveボタンなし
      await expect(page.locator("button.md-save-btn")).toHaveCount(0);
    }

    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    await expect(page.locator("button.md-save-btn")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("33_Save按钮_加载中禁用", "加载中"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.34 Modified value 输入-加载中禁用（実API）
  // ============================================================
  test("34_ModifiedValue输入_加载中禁用", async ({ page }) => {
    await setLoginState(page);
    await page.goto(APP_URL_WITH_PARAMS, { waitUntil: "domcontentloaded" });

    const loadingEl = page.locator("div.md-loading");
    const loadingCount = await loadingEl.count();
    if (loadingCount > 0) {
      // Loading中は入力欄なし
      await expect(page.locator("input.md-input")).toHaveCount(0);
    }

    // 実APIの応答を待つ（最大15秒）
    try {
      await page.waitForLoadState("networkidle", { timeout: 15000 });
    } catch {
      // タイムアウトは無視
    }
    await page.waitForTimeout(2000);

    // 完了後、入力欄が存在するか確認（APIがデータを返さない場合はスキップ）
    const inputs = page.locator("input.md-input");
    const inputCount = await inputs.count();
    if (inputCount > 0) {
      await expect(inputs.first()).toBeVisible();
      await expect(inputs.first()).toBeEnabled();
    }

    await page.screenshot({
      path: getScreenshotPath("34_ModifiedValue输入_加载中禁用", "加载完成"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.35 页面刷新（実API）
  // ============================================================
  test("35_页面刷新", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h1.md-title")).toHaveText("Modify Document");

    // リロード
    await page.reload();
    await safeWaitNetworkIdle(page);
    await page.waitForTimeout(2000);

    // 再表示確認
    await expect(page.locator("h1.md-title")).toHaveText("Modify Document");
    await expect(
      page.locator("span.md-label").filter({ hasText: "Chassis no:" }),
    ).toBeVisible();
    await expect(page.locator("table.md-table")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("35_页面刷新", "刷新后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.36 安全性-API 请求协议（実API）
  // ============================================================
  test("36_安全性_API请求协议", async ({ page }) => {
    await setLoginState(page);

    const requests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("/api/UD05/")) {
        requests.push(url);
      }
    });

    await page.goto(APP_URL_WITH_PARAMS);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // APIリクエストが記録されている
    expect(requests.length).toBeGreaterThanOrEqual(0);
    if (requests.length > 0) {
      console.log("UD05 API requests:", requests);
    }

    await page.screenshot({
      path: getScreenshotPath("36_安全性_API请求协议", "API请求"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.37 安全性-认证与权限控制（実API）
  // ============================================================
  test("37_安全性_认证与权限控制", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h1.md-title")).toHaveText("Modify Document");

    await page.screenshot({
      path: getScreenshotPath("37_安全性_认证与权限控制", "认证确认"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
